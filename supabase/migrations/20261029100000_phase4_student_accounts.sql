-- Phase 4: giáo viên quản lý tài khoản học sinh (ADR 0002). Chạy lại được nhiều lần.
-- Gồm: students.username / must_change_password, nhật ký thao tác teacher_audit_log,
-- trigger xoá tài khoản đăng nhập khi xoá học sinh, hai hàm cho lần đăng nhập đầu của học sinh.
-- Hoàn tác: supabase/rollback/20261029100000_phase4_student_accounts_down.sql

begin;

-- ---------------------------------------------------------------------------
-- 1. students: tên đăng nhập và cờ "phải đổi mật khẩu". Client KHÔNG ghi được hai cột này
--    (quyền INSERT/UPDATE theo cột ở Phase 3 không có chúng); chỉ Edge Function (service_role).
-- ---------------------------------------------------------------------------

alter table public.students add column if not exists username text;
alter table public.students add column if not exists must_change_password boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'students_username_format') then
    alter table public.students
      add constraint students_username_format check (username is null or username ~ '^[a-z0-9]{3,24}$');
  end if;
end $$;

create unique index if not exists students_username_key on public.students (username) where username is not null;

-- Edge Function dùng vai trò service_role: cấp quyền rõ ràng (dự án Supabase mới không tự cấp).
grant select, update on public.students to service_role;
-- Hàm kiểm tra người gọi là giáo viên (profiles.role). Thiếu quyền này hàm sẽ báo nhầm "chỉ giáo viên được quản lý".
grant select on public.profiles to service_role;

-- ---------------------------------------------------------------------------
-- 2. Nhật ký thao tác của giáo viên. Chỉ thêm; không ghi mật khẩu.
--    student_id không có khoá ngoại: dòng nhật ký còn lại sau khi xoá học sinh (D16/D17).
-- ---------------------------------------------------------------------------

create table if not exists public.teacher_audit_log (
  id bigint generated always as identity primary key,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in (
    'create_account', 'reset_password', 'lock', 'unlock', 'revoke_account', 'delete_student'
  )),
  student_id uuid,
  student_name text not null check (char_length(student_name) <= 200),
  class_name text,
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists teacher_audit_log_teacher_time_idx
  on public.teacher_audit_log (teacher_id, created_at desc, id desc);

create or replace function public.teacher_audit_log_block_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Cho phép xoá khi đến từ khoá ngoại (xoá tài khoản giáo viên).
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'teacher_audit_log is append-only (% not allowed)', tg_op
    using errcode = '42501';
end;
$$;

drop trigger if exists teacher_audit_log_no_update on public.teacher_audit_log;
create trigger teacher_audit_log_no_update
before update on public.teacher_audit_log
for each row execute function public.teacher_audit_log_block_changes();

drop trigger if exists teacher_audit_log_no_delete on public.teacher_audit_log;
create trigger teacher_audit_log_no_delete
before delete on public.teacher_audit_log
for each row execute function public.teacher_audit_log_block_changes();

alter table public.teacher_audit_log enable row level security;

revoke all on public.teacher_audit_log from anon, authenticated;
grant select on public.teacher_audit_log to authenticated;
grant select, insert on public.teacher_audit_log to service_role;

drop policy if exists "Audit log: teacher reads own" on public.teacher_audit_log;
create policy "Audit log: teacher reads own"
on public.teacher_audit_log for select to authenticated
using (teacher_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. Xoá học sinh (D12/D16): xoá luôn tài khoản đăng nhập, và ghi nhật ký.
--    Trigger nên đúng với MỌI đường xoá (xoá một em, xoá cả lớp, xoá tài khoản giáo viên).
-- ---------------------------------------------------------------------------

create or replace function public.students_after_delete()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- Chỉ xoá người dùng Auth mang vai trò học sinh; không bao giờ xoá tài khoản giáo viên.
  if old.auth_user_id is not null then
    delete from auth.users
    where id = old.auth_user_id
      and raw_app_meta_data ->> 'role' = 'student';
  end if;

  -- Ghi nhật ký khi chính giáo viên xoá. Không ghi khi xoá dây chuyền do xoá tài khoản giáo viên
  -- (lúc đó dòng giáo viên đã bị xoá nên khoá ngoại của nhật ký sẽ lỗi).
  if auth.uid() is not null and auth.uid() = old.teacher_id
     and exists (select 1 from auth.users u where u.id = old.teacher_id) then
    insert into public.teacher_audit_log (teacher_id, action, student_id, student_name, class_name, detail)
    values (
      old.teacher_id,
      'delete_student',
      old.id,
      old.name,
      (select c.name from public.classes c where c.id = old.class_id),
      jsonb_build_object('had_account', old.auth_user_id is not null)
    );
  end if;

  return old;
end;
$$;

revoke all on function public.students_after_delete() from public, anon, authenticated;

drop trigger if exists students_after_delete_trigger on public.students;
create trigger students_after_delete_trigger
after delete on public.students
for each row execute function public.students_after_delete();

-- ---------------------------------------------------------------------------
-- 4. Lần đăng nhập đầu của học sinh (D15). Mỗi hàm chỉ đụng dòng của chính người gọi.
--    Lưu ý: đây là cơ chế nhắc/ép đổi mật khẩu trong giao diện, không phải ranh giới bảo mật
--    (Supabase Auth không cho DB biết mật khẩu đã đổi chưa).
-- ---------------------------------------------------------------------------

create or replace function public.student_first_login_pending()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select s.must_change_password from public.students s where s.auth_user_id = (select auth.uid()) limit 1),
    false
  );
$$;

create or replace function public.complete_first_login()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  update public.students
  set must_change_password = false
  where auth_user_id = (select auth.uid()) and status = 'active';
end;
$$;

revoke all on function public.student_first_login_pending() from public, anon;
revoke all on function public.complete_first_login() from public, anon;
grant execute on function public.student_first_login_pending() to authenticated;
grant execute on function public.complete_first_login() to authenticated;

commit;
