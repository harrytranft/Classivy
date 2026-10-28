-- Test Phase 7 (hardening). Chạy bằng scripts/test-db.sh SAU các test trước (dùng lại hàm test.* ở file 10, 50).

\set ON_ERROR_STOP 1
set client_min_messages = notice;
reset role;

-- ---------------------------------------------------------------------------
-- A. Chốt chặn tổng quát: luôn đúng cho mọi bảng/hàm hiện có và sau này.
-- ---------------------------------------------------------------------------
select test.eq((select string_agg(relname, ',') from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity), null, 'every public table has RLS enabled');
select test.eq((select string_agg(p.proname, ',') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%')),
  null, 'every security definer function pins search_path');
select test.eq((select string_agg(distinct table_name, ',') from information_schema.role_table_grants
  where grantee = 'anon' and table_schema = 'public'), null, 'anon has no table privileges');
select test.eq((select string_agg(p.proname, ',' order by p.proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prorettype = 'trigger'::regtype
    and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))),
  null, 'no trigger function is callable by API roles');
select test.eq((select string_agg(p.proname, ',' order by p.proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef and has_function_privilege('anon', p.oid, 'execute')),
  null, 'anon cannot execute any security definer function');

-- ---------------------------------------------------------------------------
-- B. Tài khoản học sinh không dùng được API dữ liệu giáo viên.
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values ('d7000000-0000-4000-8000-000000000001', 't7@test');
insert into auth.users (id, email, raw_app_meta_data) values ('d7100000-0000-4000-8000-000000000001', 's7@s.test', '{"role":"student"}');

select test.login('d7100000-0000-4000-8000-000000000001');
select test.throws($sql$select public.save_teacher_changes('{"students":[{"client_id":"x","class_name":"HACK","name":"Spam","gender":"Nam","points":999,"game_state":{}}]}')$sql$,
  '42501', 'student cannot create classes/students through save_teacher_changes');
select test.throws($sql$select public.save_teacher_changes_v2('{"students":[{"client_id":"x","class_name":"HACK","name":"Spam","gender":"Nam","points":999,"game_state":{}}]}')$sql$,
  '42501', 'student cannot use save_teacher_changes_v2');
select test.throws($sql$insert into public.user_settings (user_id) values ('d7100000-0000-4000-8000-000000000001')$sql$, '42501', 'student cannot create teacher settings');
select test.throws($sql$insert into public.classes (teacher_id, name) values ('d7100000-0000-4000-8000-000000000001', 'X')$sql$, '42501', 'student cannot insert classes');
select test.eq(public.is_teacher(), false, 'student is not a teacher');
-- Học sinh vẫn đọc được hồ sơ đăng nhập của chính mình (app cần tên hiển thị).
select test.eq((select count(*)::int from public.profiles), 1, 'student still reads own profile row');
reset role;
select test.eq((select count(*)::int from public.classes where teacher_id = 'd7100000-0000-4000-8000-000000000001'), 0, 'no rows were created by the student');

-- ---------------------------------------------------------------------------
-- C. Giáo viên: v2 lưu được, trả số phiên bản; máy khác sửa trước thì bị từ chối, không ghi gì.
-- ---------------------------------------------------------------------------
select test.login('d7000000-0000-4000-8000-000000000001');
select test.eq(public.is_teacher(), true, 'teacher is a teacher');
select test.eq(public.save_teacher_changes_v2($json${"students":[
  {"client_id":"h1","class_name":"7A","name":"Hà","gender":"Nữ","points":5,"game_state":{}},
  {"client_id":"h2","class_name":"7A","name":"Huy","gender":"Nam","points":5,"game_state":{}}]}$json$::jsonb)->'revisions',
  '{"h1": 0, "h2": 0}'::jsonb, 'new students start at revision 0');

-- Máy A và máy B cùng đang có h1 ở phiên bản 0. Máy B lưu trước.
select test.eq((public.save_teacher_changes_v2($json${"students":[
  {"client_id":"h1","class_name":"7A","name":"Hà","gender":"Nữ","points":7,"game_state":{},"base_revision":0}],
  "history":[{"student_client_id":"h1","client_event_id":"b-1","amount":2,"reason":"Máy B","occurred_at_ms":1700000000000}]}$json$::jsonb)#>>'{revisions,h1}')::int,
  1, 'device B saves and bumps revision to 1');
-- Máy A lưu sau với phiên bản cũ: bị từ chối, nêu đúng học sinh.
select test.throws($sql$select public.save_teacher_changes_v2('{"students":[{"client_id":"h1","class_name":"7A","name":"Hà","gender":"Nữ","points":6,"game_state":{},"base_revision":0}],"history":[{"student_client_id":"h1","client_event_id":"a-1","amount":1,"reason":"Máy A","occurred_at_ms":1700000000001}]}')$sql$,
  '40001', 'device A is rejected instead of overwriting');
select test.eq((select points from public.students where client_id = 'h1'), 7, 'points from device B are kept');
select test.eq((select count(*)::int from public.point_ledger where client_event_id = 'a-1'), 0, 'nothing from the rejected batch was written');
-- Một em lỗi thời làm hỏng cả gói (kể cả em khác trong gói).
select test.throws($sql$select public.save_teacher_changes_v2('{"students":[{"client_id":"h2","class_name":"7A","name":"Huy","gender":"Nam","points":9,"game_state":{},"base_revision":0},{"client_id":"h1","class_name":"7A","name":"Hà","gender":"Nữ","points":1,"game_state":{},"base_revision":0}]}')$sql$,
  '40001', 'one stale student rejects the whole batch');
select test.eq((select points from public.students where client_id = 'h2'), 5, 'other students in a rejected batch are untouched');
-- Học sinh đã bị máy khác xoá: lưu với base_revision bị từ chối (không âm thầm tạo lại).
select public.save_teacher_changes_v2('{"deleted_student_client_ids":["h2"]}');
select test.throws($sql$select public.save_teacher_changes_v2('{"students":[{"client_id":"h2","class_name":"7A","name":"Huy","gender":"Nam","points":9,"game_state":{},"base_revision":0}]}')$sql$,
  '40001', 'saving a student deleted elsewhere is rejected');
-- Cập nhật đúng phiên bản thì được.
select test.eq((public.save_teacher_changes_v2('{"students":[{"client_id":"h1","class_name":"7A","name":"Hà","gender":"Nữ","points":8,"game_state":{},"base_revision":1}]}')#>>'{revisions,h1}')::int,
  2, 'saving with the current revision works');
-- Ghi lại y nguyên giá trị thì không tăng phiên bản.
select test.eq((public.save_teacher_changes_v2('{"students":[{"client_id":"h1","class_name":"7A","name":"Hà","gender":"Nữ","points":8,"game_state":{},"base_revision":2}]}')#>>'{revisions,h1}')::int,
  2, 'identical save keeps the revision');
reset role;

-- Đổi tài khoản (Edge Function / đổi mật khẩu lần đầu) không làm app giáo viên bị từ chối.
select set_config('role', 'service_role', false);
update public.students set username = 'ha777', must_change_password = true, status = 'locked' where client_id = 'h1';
reset role;
select test.eq((select revision from public.students where client_id = 'h1'), 2, 'account changes do not bump revision');
-- Giáo viên không tự đặt được số phiên bản.
select test.login('d7000000-0000-4000-8000-000000000001');
select test.throws($sql$update public.students set revision = 99 where client_id = 'h1'$sql$, '42501', 'teacher cannot write revision');
select test.throws($sql$select public.handle_new_user_profile()$sql$, '42501', 'trigger functions are not callable');
reset role;

\echo 'ALL PHASE 7 HARDENING DB TESTS PASSED'
