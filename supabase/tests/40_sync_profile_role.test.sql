-- Test đồng bộ profiles.role theo app_metadata.role (migration 20261030110000_sync_profile_role.sql).
-- Chạy bằng scripts/test-db.sh (dùng lại hàm test.* đã tạo ở file 10). Trước migration, script đã tạo
-- 'stale@students.test': người dùng học sinh mang hồ sơ 'teacher' như lỗi thật trên Supabase.

\set ON_ERROR_STOP 1
set client_min_messages = notice;
reset role;

-- 1. Tài khoản học sinh cũ bị ghi sai được sửa khi chạy migration.
select test.eq((select p.role from public.profiles p join auth.users u on u.id = p.user_id where u.email = 'stale@students.test'),
  'student', 'existing student with wrong role is fixed by the migration');

-- 2. Đúng cách Supabase tạo học sinh: INSERT chưa có role, rồi UPDATE app_metadata.
insert into auth.users (id, email, raw_app_meta_data) values
  ('aaaaaaaa-0000-4000-8000-0000000000a1', 'new@students.test', '{"provider":"email","providers":["email"]}');
select test.eq((select role from public.profiles where user_id = 'aaaaaaaa-0000-4000-8000-0000000000a1'), 'teacher', 'right after insert the role is still teacher');
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"student"}'
  where id = 'aaaaaaaa-0000-4000-8000-0000000000a1';
select test.eq((select role from public.profiles where user_id = 'aaaaaaaa-0000-4000-8000-0000000000a1'), 'student', 'setting app_metadata.role = student makes the profile a student');

-- 3. Tài khoản tạo trong Authentication (không có role) là giáo viên, kể cả khi app_metadata đổi thứ khác.
insert into auth.users (id, email, raw_app_meta_data) values
  ('aaaaaaaa-0000-4000-8000-0000000000a2', 'teacher-dash@test', '{"provider":"email"}');
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"providers":["email"]}'
  where id = 'aaaaaaaa-0000-4000-8000-0000000000a2';
select test.eq((select role from public.profiles where user_id = 'aaaaaaaa-0000-4000-8000-0000000000a2'), 'teacher', 'dashboard-created account stays teacher');

-- 4. Người dùng không tự đổi được vai trò: không ghi được profiles.role, không chạm được auth.users.
select test.login('aaaaaaaa-0000-4000-8000-0000000000a1');
select test.throws($sql$update public.profiles set role = 'teacher' where user_id = 'aaaaaaaa-0000-4000-8000-0000000000a1'$sql$, '42501', 'student cannot change own profile role');
select test.throws($sql$update auth.users set raw_app_meta_data = '{}' where id = 'aaaaaaaa-0000-4000-8000-0000000000a1'$sql$, '42501', 'student cannot change own app_metadata');
reset role;

-- Dọn.
delete from auth.users where id in ('aaaaaaaa-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-0000000000a2');

\echo 'ALL PROFILE ROLE SYNC TESTS PASSED'
