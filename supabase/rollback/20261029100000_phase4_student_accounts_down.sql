-- Hoàn tác 20261029100000_phase4_student_accounts.sql.
-- Lưu ý: xoá cột students.username / must_change_password và nhật ký thao tác. Các tài khoản đăng nhập
-- của học sinh trong Supabase Auth KHÔNG bị xoá (xoá thủ công trong Authentication > Users nếu cần).

begin;

drop trigger if exists students_after_delete_trigger on public.students;
drop function if exists public.students_after_delete();
drop function if exists public.student_first_login_pending();
drop function if exists public.complete_first_login();

drop table if exists public.teacher_audit_log;
drop function if exists public.teacher_audit_log_block_changes();

drop index if exists public.students_username_key;
alter table public.students drop constraint if exists students_username_format;
alter table public.students drop column if exists username;
alter table public.students drop column if exists must_change_password;

commit;
