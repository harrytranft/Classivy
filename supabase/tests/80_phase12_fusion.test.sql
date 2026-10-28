-- Test Phase 12C (học sinh tự Hợp nhất Pokémon). Chạy bằng scripts/test-db.sh SAU test 70 (dùng test.* của file 10 và test.raises của file 50).

\set ON_ERROR_STOP 1
set client_min_messages = notice;
reset role;

insert into auth.users (id, email) values ('f2000000-0000-4000-8000-000000000001', 'tfuse@test');
insert into auth.users (id, email, raw_app_meta_data) values
  ('f3000000-0000-4000-8000-000000000001', 'fa@s.test', '{"role":"student"}'),
  ('f3000000-0000-4000-8000-000000000002', 'fb@s.test', '{"role":"student"}'),
  ('f3000000-0000-4000-8000-000000000003', 'fc@s.test', '{"role":"student"}');

select test.login('f2000000-0000-4000-8000-000000000001');
select public.save_teacher_changes($json${
  "students": [
    { "client_id": "fa", "class_name": "FUSE", "name": "Fa", "gender": "Nam", "points": 50, "game_state": {
        "pet": { "instanceId": "pk-1", "dexId": 25, "name": "Pikachu", "skills": ["sk_a", "sk_b"], "skillUses": {"sk_a": 1, "sk_b": 2}, "accessories": [], "types": ["electric"], "level": 10, "totalXp": 450, "isShiny": true },
        "pets": [
          { "instanceId": "pk-1", "dexId": 25, "name": "Pikachu", "skills": ["sk_a", "sk_b"], "skillUses": {"sk_a": 1, "sk_b": 2}, "accessories": [], "types": ["electric"], "level": 10, "totalXp": 450, "isShiny": true },
          { "instanceId": "pk-2", "dexId": 1, "name": "Bulbasaur", "skills": ["sk_a", "sk_c"], "skillUses": {"sk_a": 0, "sk_c": 1}, "accessories": [], "types": ["grass"], "level": 4, "isShiny": true },
          { "instanceId": "pk-3", "dexId": 4, "name": "Charmander", "skills": [], "accessories": [], "types": ["fire"] }
        ],
        "supportPetInstanceId": "pk-3" } },
    { "client_id": "fb", "class_name": "FUSE", "name": "Fb", "gender": "Nam", "points": 50, "game_state": {
        "pet": { "instanceId": "pk-solo", "dexId": 7, "name": "Squirtle", "skills": [], "accessories": [], "types": ["water"] },
        "pets": [ { "instanceId": "pk-solo", "dexId": 7, "name": "Squirtle", "skills": [], "accessories": [], "types": ["water"] } ] } },
    { "client_id": "fc", "class_name": "FUSE", "name": "Fc", "gender": "Nữ", "points": 50, "game_state": {
        "egg": { "instanceId": "egg-1", "progress": 0, "status": "egg", "assignedDexId": 10, "kind": "normal", "requiredProgress": 10 },
        "pets": [
          { "instanceId": "pk-x", "dexId": 25, "name": "Pikachu", "skills": [], "accessories": [], "types": [] },
          { "instanceId": "pk-y", "dexId": 1, "name": "Bulbasaur", "skills": [], "accessories": [], "types": [] } ] } }
  ]
}$json$::jsonb);
reset role;
select set_config('role', 'service_role', false);
update public.students set auth_user_id = 'f3000000-0000-4000-8000-000000000001' where client_id = 'fa' and teacher_id = 'f2000000-0000-4000-8000-000000000001';
update public.students set auth_user_id = 'f3000000-0000-4000-8000-000000000002' where client_id = 'fb' and teacher_id = 'f2000000-0000-4000-8000-000000000001';
update public.students set auth_user_id = 'f3000000-0000-4000-8000-000000000003' where client_id = 'fc' and teacher_id = 'f2000000-0000-4000-8000-000000000001';
reset role;

-- 0. Quyền: hàm học sinh cấp cho người đã đăng nhập; hàm phụ nội bộ.
select test.eq(has_function_privilege('anon', 'public.student_fuse_pets(text[])', 'execute'), false, 'anon cannot fuse');
select test.eq(has_function_privilege('authenticated', 'public.student_fuse_pets(text[])', 'execute'), true, 'authenticated can call fuse');
select test.eq(has_function_privilege('authenticated', 'public.shop_pet_level(jsonb)', 'execute'), false, 'shop_pet_level is internal');
select test.eq(has_function_privilege('authenticated', 'public.shop_total_xp_for_level(integer)', 'execute'), false, 'shop_total_xp_for_level is internal');
select test.eq(public.shop_total_xp_for_level(1), 0, 'xp for level 1');
select test.eq(public.shop_total_xp_for_level(10), 30+35+40+45+50+55+60+65+70, 'xp for level 10 matches the app formula');
select test.eq(public.shop_pet_level('{"totalXp": 450}'::jsonb), 10, 'level from total xp');
select test.eq(public.shop_pet_level('{"level": 4}'::jsonb), 4, 'level field when no xp');
select test.eq(public.shop_pet_level('{}'::jsonb), 1, 'default level 1');
select test.eq(public.shop_pet_level('{"totalXp": 99999999}'::jsonb), 30, 'level capped at 30');

-- 1. Lớp đang đóng (mặc định): không hợp nhất được.
select test.login('f3000000-0000-4000-8000-000000000001');
select test.raises($sql$select public.student_fuse_pets(array['pk-1','pk-2'])$sql$, 'shop_closed', 'cannot fuse while shop closed');
select test.login('f2000000-0000-4000-8000-000000000001');
select test.eq(test.affected($sql$update public.classes set student_shop_enabled = true where name = 'FUSE'$sql$), 1, 'teacher opens class');

-- 2. Đầu vào sai.
select test.login('f3000000-0000-4000-8000-000000000001');
select test.raises($sql$select public.student_fuse_pets(null)$sql$, 'invalid_item', 'null ids');
select test.raises($sql$select public.student_fuse_pets(array['pk-1'])$sql$, 'invalid_item', 'one id');
select test.raises($sql$select public.student_fuse_pets(array['pk-1','pk-2','pk-3'])$sql$, 'invalid_item', 'three ids');
select test.raises($sql$select public.student_fuse_pets(array['pk-1','pk-1'])$sql$, 'invalid_item', 'same pet twice');
select test.raises($sql$select public.student_fuse_pets(array['pk-1','khong-co'])$sql$, 'invalid_item', 'unknown pet');
select test.raises($sql$select public.student_fuse_pets(array['pk-1', null])$sql$, 'invalid_item', 'null element');
select test.login('f3000000-0000-4000-8000-000000000002');
select test.raises($sql$select public.student_fuse_pets(array['pk-solo','pk-1'])$sql$, 'invalid_item', 'cannot use another student pet / only one pet');
select test.login('f3000000-0000-4000-8000-000000000003');
select test.raises($sql$select public.student_fuse_pets(array['pk-x','pk-y'])$sql$, 'egg_in_progress', 'cannot fuse while incubating');
reset role;
select test.eq((select revision from public.students where client_id = 'fa'), 0, 'failed attempts do not bump revision');

-- 3. Hợp nhất thành công (Pikachu cấp 10 shiny + Bulbasaur cấp 4 shiny; Charmander là hỗ trợ và ở lại).
select test.login('f3000000-0000-4000-8000-000000000001');
select test.eq((public.student_fuse_pets(array['pk-1','pk-2'])->>'level')::int, 7, 'level is floor of average (10+4)/2');
reset role;
select test.eq((select jsonb_array_length(game_state->'pets') from public.students where client_id = 'fa'), 2, 'two parents replaced by one: fused + Charmander');
select test.eq((select count(*)::int from public.students s, jsonb_array_elements(s.game_state->'pets') e where s.client_id = 'fa' and e->>'instanceId' in ('pk-1','pk-2')), 0, 'parents gone');
select test.eq((select game_state->'pets'->1->>'instanceId' from public.students where client_id = 'fa'), 'pk-3', 'untouched pet kept');
select test.eq((select game_state->'pet'->>'instanceId' = game_state->'pets'->0->>'instanceId' from public.students where client_id = 'fa'), true, 'fused pet is the companion and first in collection');
select test.eq((select game_state->'pet'->>'instanceId' like 'pk-%' and game_state->'pet'->>'instanceId' not in ('pk-1','pk-2','pk-3') from public.students where client_id = 'fa'), true, 'new instance id');
select test.eq((select (game_state->'pet'->>'isFusion')::boolean from public.students where client_id = 'fa'), true, 'isFusion flag');
select test.eq((select (game_state->'pet'->>'level')::int from public.students where client_id = 'fa'), 7, 'fused level 7');
select test.eq((select (game_state->'pet'->>'totalXp')::int from public.students where client_id = 'fa'), 30+35+40+45+50+55, 'totalXp matches level 7');
select test.eq((select game_state->'pet'->>'xp' from public.students where client_id = 'fa'), '0', 'xp reset');
select test.eq((select (game_state->'pet'->>'isShiny')::boolean from public.students where client_id = 'fa'), true, 'both shiny => shiny');
select test.eq((select exists (select 1 from public.shop_egg_pool p where p.dex_id = (s.game_state->'pet'->>'dexId')::int) from public.students s where s.client_id = 'fa'), true, 'random species comes from the pool');
-- Skill: sk_a (uses 1 và 0 => giữ 0), sk_b (đã dùng 2 lượt => bỏ), sk_c (1 lượt => giữ).
select test.eq((select game_state->'pet'->'skills' from public.students where client_id = 'fa'), '["sk_a","sk_c"]'::jsonb, 'valid skills kept, spent skill dropped');
select test.eq((select game_state->'pet'->'skillUses' from public.students where client_id = 'fa'), '{"sk_a":0,"sk_c":1}'::jsonb, 'duplicate skill keeps the lower use count');
select test.eq((select game_state->>'supportPetInstanceId' from public.students where client_id = 'fa'), 'pk-3', 'support pet not involved stays');
select test.eq((select points from public.students where client_id = 'fa'), 50, 'fusion is free');
select test.eq((select count(*)::int from public.point_ledger l join public.students s on s.id = l.student_id where s.client_id = 'fa'), 0, 'no ledger row for a free action');
select test.eq((select revision from public.students where client_id = 'fa'), 1, 'revision bumped (teacher app will see it)');

-- 4. Hợp nhất tiếp: dùng Pokémon mới + Charmander (là hỗ trợ) => hỗ trợ bị bỏ, chỉ còn 1 Pokémon.
select game_state->'pet'->>'instanceId' as fid from public.students where client_id = 'fa' \gset
select test.login('f3000000-0000-4000-8000-000000000001');
select public.student_fuse_pets(array[:'fid', 'pk-3']);
reset role;
select test.eq((select jsonb_array_length(game_state->'pets') from public.students where client_id = 'fa'), 1, 'only the newest pet is left');
select test.eq((select game_state->>'supportPetInstanceId' is null from public.students where client_id = 'fa'), true, 'support cleared when it was fused away');
select test.eq((select (game_state->'pet'->>'level')::int from public.students where client_id = 'fa'), 4, 'level floor((7+1)/2)');
select test.eq((select (game_state->'pet'->>'isShiny')::boolean from public.students where client_id = 'fa'), false, 'not both shiny => not shiny');
select test.login('f3000000-0000-4000-8000-000000000001');
select test.raises($sql$select public.student_fuse_pets(array['pk-3','pk-1'])$sql$, 'invalid_item', 'already fused pets cannot be fused again');

-- 5. Hợp nhất khi Pokémon đồng hành KHÔNG nằm trong 2 con được chọn: đồng hành mới thay thế, đồng hành cũ về bộ sưu tập.
reset role;
select set_config('role', 'service_role', false);
update public.students set game_state = jsonb_build_object(
  'pet', jsonb_build_object('instanceId', 'c-1', 'dexId', 25, 'name', 'Pikachu', 'skills', '[]'::jsonb, 'accessories', '[]'::jsonb, 'types', '[]'::jsonb),
  'pets', jsonb_build_array(
    jsonb_build_object('instanceId', 'c-1', 'dexId', 25, 'name', 'Pikachu', 'skills', '[]'::jsonb, 'accessories', '[]'::jsonb, 'types', '[]'::jsonb),
    jsonb_build_object('instanceId', 'c-2', 'dexId', 1, 'name', 'Bulbasaur', 'skills', '[]'::jsonb, 'accessories', '[]'::jsonb, 'types', '[]'::jsonb),
    jsonb_build_object('instanceId', 'c-3', 'dexId', 4, 'name', 'Charmander', 'skills', '[]'::jsonb, 'accessories', '[]'::jsonb, 'types', '[]'::jsonb)))
where client_id = 'fa' and teacher_id = 'f2000000-0000-4000-8000-000000000001';
reset role;
select test.login('f3000000-0000-4000-8000-000000000001');
select public.student_fuse_pets(array['c-2','c-3']);
reset role;
select test.eq((select jsonb_array_length(game_state->'pets') from public.students where client_id = 'fa'), 2, 'fused + former companion');
select test.eq((select game_state->'pets'->1->>'instanceId' from public.students where client_id = 'fa'), 'c-1', 'former companion kept in collection');
select test.eq((select game_state->'pet'->>'instanceId' <> 'c-1' from public.students where client_id = 'fa'), true, 'fused pet is the new companion');
select test.eq((select (game_state->'pet'->>'level')::int from public.students where client_id = 'fa'), 1, 'levels default to 1');

-- 6. Người không phải học sinh hoạt động không dùng được.
select test.login('f2000000-0000-4000-8000-000000000001');
select test.throws($sql$select public.student_fuse_pets(array['pk-1','pk-2'])$sql$, '42501', 'teacher cannot use student fusion');
reset role;
select set_config('role', 'anon', false);
select test.throws($sql$select public.student_fuse_pets(array['pk-1','pk-2'])$sql$, '42501', 'anon cannot fuse');
reset role;
