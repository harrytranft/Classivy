-- Phase 5 (ADR 0003): cổng học sinh, chỉ xem.
-- Học sinh KHÔNG được mở quyền đọc bảng students / point_ledger / classes. Thay vào đó gọi một hàm
-- trả về gói dữ liệu chọn lọc của CHÍNH MÌNH: không có id nội bộ, teacher_id, tài khoản, hay học sinh khác.
-- Hàm kiểm tra students.status mỗi lần gọi => tài khoản vừa bị khoá không xem được dữ liệu nữa,
-- kể cả khi phiên đăng nhập cũ còn sống (xem ADR 0002 mục 5).
-- Chạy lại được (create or replace). Hoàn tác: supabase/rollback/20261030100000_phase5_student_portal_down.sql

begin;

create or replace function public.get_my_student_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_student public.students%rowtype;
  v_class_name text;
  v_history jsonb;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Chỉ tài khoản mang vai trò học sinh (chặn trường hợp một tài khoản giáo viên bị gắn nhầm vào dòng học sinh).
  if not exists (select 1 from public.profiles p where p.user_id = v_uid and p.role = 'student') then
    return jsonb_build_object('status', 'not_student');
  end if;

  select * into v_student from public.students s where s.auth_user_id = v_uid;
  if not found then
    return jsonb_build_object('status', 'not_linked');
  end if;

  -- Bị khoá: không trả thêm bất kỳ thông tin nào.
  if v_student.status <> 'active' then
    return jsonb_build_object('status', 'locked');
  end if;

  select c.name into v_class_name from public.classes c where c.id = v_student.class_id;

  -- 30 dòng sổ điểm gần nhất, bỏ số dư chuyển từ dữ liệu cũ (giống lịch sử trên app giáo viên).
  select coalesce(jsonb_agg(jsonb_build_object('amount', h.amount, 'reason', h.reason, 'occurred_at', h.occurred_at)
                            order by h.occurred_at desc, h.id desc), '[]'::jsonb)
  into v_history
  from (
    select l.id, l.amount, l.reason, l.occurred_at
    from public.point_ledger l
    where l.student_id = v_student.id and l.source <> 'opening_balance'
    order by l.occurred_at desc, l.id desc
    limit 30
  ) h;

  return jsonb_build_object(
    'status', 'active',
    'name', v_student.name,
    'gender', v_student.gender,
    'class_name', v_class_name,
    'points', v_student.points,
    'avatar', v_student.avatar,
    -- Chỉ các phần game học sinh cần xem (danh sách cho phép), không trả cả game_state.
    'game', jsonb_strip_nulls(jsonb_build_object(
      'pet', v_student.game_state->'pet',
      'pets', v_student.game_state->'pets',
      -- Bỏ Pokémon đã định sẵn trong trứng để không lộ trước khi nở.
      'egg', (v_student.game_state->'egg') - 'assignedDexId',
      'trainerProgress', v_student.game_state->'trainerProgress',
      'earnedBadges', v_student.game_state->'earnedBadges',
      'supportPetInstanceId', v_student.game_state->'supportPetInstanceId'
    )),
    'history', v_history
  );
end;
$$;

revoke all on function public.get_my_student_profile() from public, anon;
grant execute on function public.get_my_student_profile() to authenticated;

commit;
