-- Test Phase 13C (cột user_settings.classroom_settings). Chạy bằng scripts/test-db.sh SAU test 80 (dùng test.* của file 10).

\set ON_ERROR_STOP 1
set client_min_messages = notice;
reset role;

-- 0. Hình dạng cột: jsonb, không null, mặc định '{}'.
select test.eq((select data_type from information_schema.columns where table_schema = 'public' and table_name = 'user_settings' and column_name = 'classroom_settings'), 'jsonb', 'column is jsonb');
select test.eq((select is_nullable from information_schema.columns where table_schema = 'public' and table_name = 'user_settings' and column_name = 'classroom_settings'), 'NO', 'column is not null');
select test.eq((select column_default from information_schema.columns where table_schema = 'public' and table_name = 'user_settings' and column_name = 'classroom_settings'), '''{}''::jsonb', 'column default is empty object');

-- 1. Hàng có từ trước migration nhận '{}' (hàng giáo viên cũ tạo ở đầu test-db.sh).
select test.eq((select classroom_settings from public.user_settings where user_id = 'dddddddd-0000-4000-8000-000000000004'), '{}'::jsonb, 'old row gets empty object');

insert into auth.users (id, email) values
  ('f9000000-0000-4000-8000-000000000001', 'cs-t1@test'),
  ('f9000000-0000-4000-8000-000000000002', 'cs-t2@test');
insert into auth.users (id, email, raw_app_meta_data) values
  ('f9100000-0000-4000-8000-000000000001', 'cs-s1@s.test', '{"role":"student"}');

-- 2. Giáo viên ghi/đọc cột của chính mình.
select test.login('f9000000-0000-4000-8000-000000000001');
insert into public.user_settings (user_id, classroom_settings) values ('f9000000-0000-4000-8000-000000000001', '{"wildHunt":{"enabled":false},"ludoChallenges":[]}');
select test.eq((select classroom_settings #>> '{wildHunt,enabled}' from public.user_settings where user_id = 'f9000000-0000-4000-8000-000000000001'), 'false', 'teacher reads own classroom settings');
select test.eq(test.affected($sql$update public.user_settings set classroom_settings = '{"wildHunt":{"enabled":true}}' where user_id = 'f9000000-0000-4000-8000-000000000001'$sql$), 1, 'teacher updates own classroom settings');
select test.eq((select classroom_settings #>> '{wildHunt,enabled}' from public.user_settings where user_id = 'f9000000-0000-4000-8000-000000000001'), 'true', 'update stored');

-- Dòng tạo không nêu cột nhận '{}'.
select test.login('f9000000-0000-4000-8000-000000000002');
insert into public.user_settings (user_id) values ('f9000000-0000-4000-8000-000000000002');
select test.eq((select classroom_settings from public.user_settings where user_id = 'f9000000-0000-4000-8000-000000000002'), '{}'::jsonb, 'new row defaults to empty object');

-- 3. Giáo viên khác không thấy và không sửa được cài đặt người khác.
select test.eq((select count(*)::int from public.user_settings where user_id = 'f9000000-0000-4000-8000-000000000001'), 0, 'other teacher cannot read');
select test.eq(test.affected($sql$update public.user_settings set classroom_settings = '{"hacked":true}' where user_id = 'f9000000-0000-4000-8000-000000000001'$sql$), 0, 'other teacher cannot update');

-- 4. Học sinh và khách không đọc/ghi được.
select test.login('f9100000-0000-4000-8000-000000000001');
select test.eq((select count(*)::int from public.user_settings), 0, 'student sees no teacher settings');
select test.eq(test.affected($sql$update public.user_settings set classroom_settings = '{"hacked":true}'$sql$), 0, 'student cannot update');
select test.as_anon();
select test.throws($sql$select classroom_settings from public.user_settings$sql$, '42501', 'anon cannot read');

reset role;
select test.eq((select classroom_settings #>> '{wildHunt,enabled}' from public.user_settings where user_id = 'f9000000-0000-4000-8000-000000000001'), 'true', 'owner data untouched by others');
