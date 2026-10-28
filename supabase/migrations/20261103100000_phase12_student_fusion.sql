-- Phase 12C (D42): học sinh tự Hợp nhất Pokémon ở nhà. Dùng ĐÚNG luật hợp nhất của app giáo viên
-- (src/features/pokemon/pokemonActions.ts, handleFuseSelectedPokemons):
--   * chọn đúng 2 Pokémon khác nhau trong bộ sưu tập (kể cả Pokémon đồng hành); hai Pokémon cũ biến mất;
--   * Pokémon mới là một loài NGẪU NHIÊN (chọn ở phía server, học sinh không chọn được), thành Pokémon đồng hành;
--   * cấp = trung bình hai cấp (làm tròn xuống, 1..30), XP/bond/charge/mastery về 0, shiny chỉ khi cả hai đều shiny;
--   * skill được giữ khi còn hiệu lực (đã dùng dưới 2 lượt); skill trùng thì lấy số lượt đã dùng ít hơn;
--   * miễn phí (không trừ điểm, không ghi sổ điểm).
-- Luật an toàn theo Phase 10B: chỉ khi giáo viên bật Cửa hàng của lớp (cùng công tắc với Đổi Pokémon), không hợp nhất
-- khi đang ấp trứng (lúc đó không có Pokémon đồng hành), khoá dòng học sinh, tăng revision để app giáo viên không ghi đè.
-- Tên "Hợp Thể <loài>" do app hiển thị từ cờ isFusion (DB không giữ tên loài).
-- Học sinh KHÔNG có thêm quyền đọc/ghi bảng nào: chỉ gọi hàm student_fuse_pets.
-- Chạy lại được. Hoàn tác: supabase/rollback/20261103100000_phase12_student_fusion_down.sql (không hoàn tác Pokémon đã hợp nhất).

begin;

-- Cấp của một Pokémon: ưu tiên tổng XP (khớp getLevelProgressFromTotalXp, tối đa 30), không có thì dùng level, không có nữa là 1.
create or replace function public.shop_pet_level(p_pet jsonb)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  v_total numeric;
  v_level integer := 1;
  v_need integer;
begin
  if jsonb_typeof(p_pet->'totalXp') = 'number' then
    v_total := greatest(0, floor((p_pet->>'totalXp')::numeric));
    while v_level < 30 loop
      v_need := least(150, 30 + (v_level - 1) * 5);
      exit when v_total < v_need;
      v_total := v_total - v_need;
      v_level := v_level + 1;
    end loop;
    return v_level;
  end if;
  if jsonb_typeof(p_pet->'level') = 'number' then
    return least(30, greatest(1, floor((p_pet->>'level')::numeric)::integer));
  end if;
  return 1;
end;
$$;

-- Tổng XP để đạt một cấp (khớp totalXpForLevel).
create or replace function public.shop_total_xp_for_level(p_level integer)
returns integer
language sql
immutable
set search_path = public
as $$
  select coalesce(sum(least(150, 30 + (l - 1) * 5)), 0)::integer from generate_series(1, greatest(1, p_level) - 1) l;
$$;

create or replace function public.student_fuse_pets(p_instance_ids text[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me public.students := public.shop_current_student(true);
  v_state jsonb := coalesce(v_me.game_state, '{}'::jsonb);
  v_pet jsonb := v_state->'pet';
  v_all jsonb;
  v_a jsonb;
  v_b jsonb;
  v_rest jsonb;
  v_skills jsonb;
  v_uses jsonb;
  v_level integer;
  v_dex integer;
  v_shiny boolean;
  v_new jsonb;
begin
  if v_state->'egg'->>'status' = 'egg' then
    raise exception 'egg_in_progress';
  end if;
  if p_instance_ids is null or cardinality(p_instance_ids) <> 2
     or p_instance_ids[1] is null or p_instance_ids[2] is null or p_instance_ids[1] = p_instance_ids[2] then
    raise exception 'invalid_item';
  end if;

  -- Bộ sưu tập gồm cả Pokémon đồng hành (thêm vào nếu chưa có trong danh sách), như getFusionCandidates.
  v_all := case when jsonb_typeof(v_pet) = 'object' then public.shop_upsert_pet(v_state->'pets', v_pet)
                else coalesce(v_state->'pets', '[]'::jsonb) end;
  select e into v_a from jsonb_array_elements(v_all) e where e->>'instanceId' = p_instance_ids[1] limit 1;
  select e into v_b from jsonb_array_elements(v_all) e where e->>'instanceId' = p_instance_ids[2] limit 1;
  if v_a is null or v_b is null then
    raise exception 'invalid_item';
  end if;

  select coalesce(jsonb_agg(e order by o), '[]'::jsonb) into v_rest
  from jsonb_array_elements(v_all) with ordinality t(e, o)
  where e->>'instanceId' is distinct from p_instance_ids[1] and e->>'instanceId' is distinct from p_instance_ids[2];

  -- Skill còn hiệu lực (đã dùng < 2 lượt); trùng thì giữ số lượt đã dùng ít hơn; thứ tự theo lần xuất hiện đầu.
  select coalesce(jsonb_agg(x.skill_id order by x.first_pos), '[]'::jsonb),
         coalesce(jsonb_object_agg(x.skill_id, x.min_uses), '{}'::jsonb)
    into v_skills, v_uses
  from (
    select s.skill_id, min(coalesce((t.p->'skillUses'->>s.skill_id)::integer, 0)) as min_uses, min(t.pn * 1000 + s.so) as first_pos
    from (values (1, v_a), (2, v_b)) as t(pn, p)
    cross join lateral jsonb_array_elements_text(coalesce(t.p->'skills', '[]'::jsonb)) with ordinality as s(skill_id, so)
    where coalesce((t.p->'skillUses'->>s.skill_id)::integer, 0) < 2
    group by s.skill_id
  ) x;

  v_level := least(30, greatest(1, floor((public.shop_pet_level(v_a) + public.shop_pet_level(v_b)) / 2.0)::integer));
  v_shiny := coalesce((v_a->>'isShiny')::boolean, false) and coalesce((v_b->>'isShiny')::boolean, false);
  select e.dex_id into v_dex from public.shop_egg_pool e order by random() limit 1;

  v_new := jsonb_build_object(
    'instanceId', 'pk-' || gen_random_uuid()::text,
    'dexId', v_dex, 'baseDexId', v_dex,
    'name', '', 'isFusion', true,
    'types', '[]'::jsonb, 'hp', 100,
    'accessories', '[]'::jsonb,
    'skills', v_skills, 'skillUses', v_uses,
    'level', v_level, 'xp', 0, 'totalXp', public.shop_total_xp_for_level(v_level),
    'bond', 0, 'charge', 0, 'masteryXp', 0, 'masteryStars', 0,
    'isShiny', v_shiny);

  v_state := jsonb_set(v_state, '{pet}', v_new);
  v_state := jsonb_set(v_state, '{pets}', jsonb_build_array(v_new) || v_rest);
  if v_state->>'supportPetInstanceId' in (p_instance_ids[1], p_instance_ids[2]) then
    v_state := v_state - 'supportPetInstanceId';
  end if;

  return public.shop_commit(v_me, 0, v_state, '')
    || jsonb_build_object('fusedInstanceId', v_new->>'instanceId', 'fusedDexId', v_dex, 'level', v_level, 'skillsKept', jsonb_array_length(v_skills));
end;
$$;

revoke all on function public.shop_pet_level(jsonb) from public, anon, authenticated;
revoke all on function public.shop_total_xp_for_level(integer) from public, anon, authenticated;
revoke all on function public.student_fuse_pets(text[]) from public, anon;
grant execute on function public.student_fuse_pets(text[]) to authenticated;

commit;
