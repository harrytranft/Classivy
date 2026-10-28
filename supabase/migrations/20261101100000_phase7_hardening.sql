-- Phase 7 (ADR 0005): hardening.
-- 1. Chốt "chỉ giáo viên" (D28): mọi quyền đọc/ghi dữ liệu giáo viên qua RLS đòi thêm profiles.role = 'teacher'.
--    Trước đây tài khoản học sinh gọi thẳng được save_teacher_changes để tự tạo lớp/học sinh dưới tên mình.
-- 2. Số phiên bản cho mỗi học sinh (D31): students.revision tăng mỗi khi dữ liệu lớp học của em đổi.
--    save_teacher_changes_v2 nhận base_revision và TỪ CHỐI cả gói nếu máy khác đã sửa em đó trước,
--    thay vì âm thầm ghi đè (lỗi 'stale_data'). Hàm cũ save_teacher_changes giữ nguyên cho app cũ.
-- 3. Thu quyền gọi trực tiếp các hàm trigger (không ảnh hưởng việc trigger chạy) và quyền bảng thừa của ẩn danh.
-- Chạy lại được. Hoàn tác: supabase/rollback/20261101100000_phase7_hardening_down.sql

begin;

-- ---------------------------------------------------------------------------
-- 1. is_teacher() + policy có chốt vai trò
-- ---------------------------------------------------------------------------

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'teacher');
$$;

revoke all on function public.is_teacher() from public, anon;
grant execute on function public.is_teacher() to authenticated;

-- classes
drop policy if exists "Classes: teacher reads own" on public.classes;
create policy "Classes: teacher reads own" on public.classes for select to authenticated
using (teacher_id = (select auth.uid()) and (select public.is_teacher()));
drop policy if exists "Classes: teacher inserts own" on public.classes;
create policy "Classes: teacher inserts own" on public.classes for insert to authenticated
with check (teacher_id = (select auth.uid()) and (select public.is_teacher()));
drop policy if exists "Classes: teacher updates own" on public.classes;
create policy "Classes: teacher updates own" on public.classes for update to authenticated
using (teacher_id = (select auth.uid()) and (select public.is_teacher()))
with check (teacher_id = (select auth.uid()) and (select public.is_teacher()));

-- students
drop policy if exists "Students: teacher reads own" on public.students;
create policy "Students: teacher reads own" on public.students for select to authenticated
using (teacher_id = (select auth.uid()) and (select public.is_teacher()));
drop policy if exists "Students: teacher inserts own" on public.students;
create policy "Students: teacher inserts own" on public.students for insert to authenticated
with check (teacher_id = (select auth.uid()) and (select public.is_teacher()));
drop policy if exists "Students: teacher updates own" on public.students;
create policy "Students: teacher updates own" on public.students for update to authenticated
using (teacher_id = (select auth.uid()) and (select public.is_teacher()))
with check (teacher_id = (select auth.uid()) and (select public.is_teacher()));
drop policy if exists "Students: teacher deletes own" on public.students;
create policy "Students: teacher deletes own" on public.students for delete to authenticated
using (teacher_id = (select auth.uid()) and (select public.is_teacher()));

-- point_ledger
drop policy if exists "Ledger: teacher reads own" on public.point_ledger;
create policy "Ledger: teacher reads own" on public.point_ledger for select to authenticated
using (teacher_id = (select auth.uid()) and (select public.is_teacher()));
drop policy if exists "Ledger: teacher inserts own" on public.point_ledger;
create policy "Ledger: teacher inserts own" on public.point_ledger for insert to authenticated
with check (teacher_id = (select auth.uid()) and created_by = (select auth.uid()) and (select public.is_teacher()));

-- user_settings (cài đặt giáo viên)
drop policy if exists "Settings are readable by owner" on public.user_settings;
create policy "Settings are readable by owner" on public.user_settings for select
using (auth.uid() = user_id and (select public.is_teacher()));
drop policy if exists "Settings are insertable by owner" on public.user_settings;
create policy "Settings are insertable by owner" on public.user_settings for insert
with check (auth.uid() = user_id and (select public.is_teacher()));
drop policy if exists "Settings are updatable by owner" on public.user_settings;
create policy "Settings are updatable by owner" on public.user_settings for update
using (auth.uid() = user_id and (select public.is_teacher()))
with check (auth.uid() = user_id and (select public.is_teacher()));

-- teacher_audit_log
drop policy if exists "Audit log: teacher reads own" on public.teacher_audit_log;
create policy "Audit log: teacher reads own" on public.teacher_audit_log for select to authenticated
using (teacher_id = (select auth.uid()) and (select public.is_teacher()));

-- Phase 6 (bảng xã hội: giáo viên đọc/gỡ/thu hồi)
drop policy if exists "Friendships: teacher reads own" on public.student_friendships;
create policy "Friendships: teacher reads own" on public.student_friendships for select to authenticated
using (teacher_id = (select auth.uid()) and (select public.is_teacher()));
drop policy if exists "Friendships: teacher deletes own" on public.student_friendships;
create policy "Friendships: teacher deletes own" on public.student_friendships for delete to authenticated
using (teacher_id = (select auth.uid()) and (select public.is_teacher()));
drop policy if exists "Gifts: teacher reads own" on public.student_gifts;
create policy "Gifts: teacher reads own" on public.student_gifts for select to authenticated
using (teacher_id = (select auth.uid()) and (select public.is_teacher()));
drop policy if exists "Gift revocations: teacher reads own" on public.student_gift_revocations;
create policy "Gift revocations: teacher reads own" on public.student_gift_revocations for select to authenticated
using (teacher_id = (select auth.uid()) and (select public.is_teacher()));
drop policy if exists "Gift revocations: teacher inserts own" on public.student_gift_revocations;
create policy "Gift revocations: teacher inserts own" on public.student_gift_revocations for insert to authenticated
with check (teacher_id = (select auth.uid()) and (select public.is_teacher()));
drop policy if exists "Gift reports: teacher reads own" on public.student_gift_reports;
create policy "Gift reports: teacher reads own" on public.student_gift_reports for select to authenticated
using (teacher_id = (select auth.uid()) and (select public.is_teacher()));

-- ---------------------------------------------------------------------------
-- 2. students.revision + save_teacher_changes_v2
-- ---------------------------------------------------------------------------

alter table public.students add column if not exists revision integer not null default 0;

-- Chỉ tăng khi dữ liệu lớp học đổi; đổi tài khoản (Edge Function, đổi mật khẩu lần đầu) không tính.
create or replace function public.students_bump_revision()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.class_id, new.name, new.gender, new.points, new.avatar, new.game_state)
     is distinct from (old.class_id, old.name, old.gender, old.points, old.avatar, old.game_state) then
    new.revision = old.revision + 1;
  else
    new.revision = old.revision;
  end if;
  return new;
end;
$$;

drop trigger if exists students_bump_revision on public.students;
create trigger students_bump_revision
before update on public.students
for each row execute function public.students_bump_revision();

-- p_changes như save_teacher_changes, mỗi học sinh có thêm "base_revision" (số phiên bản app đang có;
-- bỏ trống = học sinh mới tạo trên máy này). Trả về { saved_at, revisions: { client_id: revision } }.
create or replace function public.save_teacher_changes_v2(p_changes jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_teacher uuid := auth.uid();
  v_stale text[];
  v_saved_at bigint;
begin
  if v_teacher is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if jsonb_typeof(p_changes) is distinct from 'object' then
    raise exception 'p_changes must be an object' using errcode = '22023';
  end if;

  -- Máy khác đã sửa (hoặc đã xoá) học sinh này kể từ lần app đọc/lưu: dừng, không ghi gì.
  select array_agg(s->>'client_id' order by s->>'client_id') into v_stale
  from jsonb_array_elements(coalesce(p_changes->'students', '[]'::jsonb)) s
  left join public.students st on st.teacher_id = v_teacher and st.client_id = s->>'client_id'
  where s ? 'base_revision' and jsonb_typeof(s->'base_revision') = 'number'
    and (st.id is null or st.revision <> (s->>'base_revision')::integer);
  if v_stale is not null then
    raise exception 'stale_data' using errcode = '40001', detail = array_to_string(v_stale, ',');
  end if;

  v_saved_at := public.save_teacher_changes(p_changes);

  return jsonb_build_object(
    'saved_at', v_saved_at,
    'revisions', coalesce((
      select jsonb_object_agg(st.client_id, st.revision)
      from public.students st
      where st.teacher_id = v_teacher
        and st.client_id in (select s->>'client_id' from jsonb_array_elements(coalesce(p_changes->'students', '[]'::jsonb)) s)
    ), '{}'::jsonb)
  );
end;
$$;

revoke all on function public.save_teacher_changes_v2(jsonb) from public, anon;
grant execute on function public.save_teacher_changes_v2(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Hàm trigger: không ai cần gọi trực tiếp qua API.
-- ---------------------------------------------------------------------------

-- Dự án Supabase cũ tự cấp quyền bảng cho vai trò ẩn danh (RLS vẫn chặn dữ liệu, nhưng không cần quyền này).
revoke all on public.profiles, public.user_settings from anon;

revoke all on function public.handle_new_user_profile() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.point_ledger_block_changes() from public, anon, authenticated;
revoke all on function public.teacher_audit_log_block_changes() from public, anon, authenticated;
revoke all on function public.social_ledger_block_changes() from public, anon, authenticated;
revoke all on function public.students_bump_revision() from public, anon, authenticated;

commit;
