-- Test Phase 4 (tài khoản học sinh): quyền cột, nhật ký bất biến, trigger xoá tài khoản, hàm lần đăng nhập đầu.
-- Chạy bằng scripts/test-db.sh SAU test Phase 3 (dùng lại hàm test.* đã tạo ở file 10).

\set ON_ERROR_STOP 1
set client_min_messages = notice;
reset role;

insert into auth.users (id, email) values
  ('11111111-0000-4000-8000-000000000011', 't1@test'),
  ('22222222-0000-4000-8000-000000000022', 't2@test');
insert into auth.users (id, email, raw_app_meta_data) values
  ('33333333-0000-4000-8000-000000000033', 'u1@students.test', '{"role":"student"}'),
  ('44444444-0000-4000-8000-000000000044', 'u4@students.test', '{"role":"student"}');

-- Giáo viên T1: lớp P4, ba học sinh (có tài khoản / chưa có / sẽ bị gắn nhầm tài khoản giáo viên). T2: một học sinh.
select test.login('11111111-0000-4000-8000-000000000011');
select public.save_teacher_changes($json${
  "classes": [{ "name": "P4" }],
  "students": [
    { "client_id": "p1", "class_name": "P4", "name": "Minh Anh", "gender": "Nữ", "points": 5, "game_state": {} },
    { "client_id": "p2", "class_name": "P4", "name": "Bảo", "gender": "Nam", "points": 0, "game_state": {} },
    { "client_id": "p3", "class_name": "P4", "name": "Chi", "gender": "Nữ", "points": 0, "game_state": {} }
  ]
}$json$::jsonb);
select test.login('22222222-0000-4000-8000-000000000022');
select public.save_teacher_changes($json${
  "students": [{ "client_id": "q1", "class_name": "Q", "name": "Khác", "gender": "Nam", "points": 0, "game_state": {} }]
}$json$::jsonb);

-- Gắn tài khoản như Edge Function (service_role, bỏ qua RLS).
reset role;
select set_config('role', 'service_role', false);
update public.students set auth_user_id = '33333333-0000-4000-8000-000000000033', username = 'minhanh472', must_change_password = true
  where client_id = 'p1' and teacher_id = '11111111-0000-4000-8000-000000000011';
update public.students set auth_user_id = '22222222-0000-4000-8000-000000000022'   -- gắn nhầm tài khoản GIÁO VIÊN
  where client_id = 'p3' and teacher_id = '11111111-0000-4000-8000-000000000011';
reset role;

-- 0. service_role (Edge Function) đọc được vai trò trong profiles và ghi được students/nhật ký.
do $$
declare r text;
begin
  set local role service_role;
  select role into r from public.profiles where user_id = '11111111-0000-4000-8000-000000000011';
  reset role;
  if r is distinct from 'teacher' then raise exception 'FAIL: service_role cannot read profiles.role (got %)', r; end if;
  raise notice 'ok - service_role can read profiles.role';
end $$;

-- 1. Giáo viên đọc được tên đăng nhập của học sinh mình, không thấy của giáo viên khác.
select test.login('11111111-0000-4000-8000-000000000011');
select test.eq((select username from public.students where client_id = 'p1'), 'minhanh472', 'teacher reads own student username');
select test.eq((select count(*)::int from public.students), 3, 'T1 sees only own students');
select test.login('22222222-0000-4000-8000-000000000022');
select test.eq((select count(*)::int from public.students where username is not null), 0, 'T2 sees no usernames of T1 students');

-- 2. Client không ghi được username / must_change_password / status / auth_user_id.
select test.login('11111111-0000-4000-8000-000000000011');
select test.throws($sql$update public.students set username = 'hack123' where client_id = 'p2'$sql$, '42501', 'teacher cannot set username');
select test.throws($sql$update public.students set must_change_password = false where client_id = 'p1'$sql$, '42501', 'teacher cannot clear must_change_password');
select test.throws($sql$update public.students set status = 'locked' where client_id = 'p2'$sql$, '42501', 'teacher cannot lock directly (only Edge Function)');
select test.throws($sql$update public.students set auth_user_id = '44444444-0000-4000-8000-000000000044' where client_id = 'p2'$sql$, '42501', 'teacher cannot attach auth user');

-- 3. Định dạng và tính duy nhất của username (kiểm tra ở DB).
reset role;
select test.throws($sql$update public.students set username = 'AB' where client_id = 'p2'$sql$, '23514', 'username format enforced (too short / uppercase)');
select test.throws($sql$update public.students set username = 'co dau' where client_id = 'p2'$sql$, '23514', 'username format enforced (spaces)');
select test.throws($sql$update public.students set username = 'minhanh472' where client_id = 'p2'$sql$, '23505', 'username is unique');

-- 4. Nhật ký: chỉ service_role ghi; giáo viên chỉ đọc của mình; bất biến.
select test.login('11111111-0000-4000-8000-000000000011');
select test.throws($sql$insert into public.teacher_audit_log (teacher_id, action, student_name) values ('11111111-0000-4000-8000-000000000011', 'lock', 'x')$sql$, '42501', 'teacher cannot write audit log');
reset role;
select set_config('role', 'service_role', false);
insert into public.teacher_audit_log (teacher_id, action, student_id, student_name, class_name, detail)
select teacher_id, 'create_account', id, name, 'P4', '{"username":"minhanh472"}'::jsonb from public.students where client_id in ('p1', 'q1');
reset role;
select test.login('11111111-0000-4000-8000-000000000011');
select test.eq((select count(*)::int from public.teacher_audit_log), 1, 'T1 reads only own audit rows');
select test.throws($sql$update public.teacher_audit_log set student_name = 'sửa'$sql$, '42501', 'teacher cannot update audit log');
select test.throws($sql$delete from public.teacher_audit_log$sql$, '42501', 'teacher cannot delete audit log');
select test.login('22222222-0000-4000-8000-000000000022');
select test.eq((select count(*)::int from public.teacher_audit_log), 1, 'T2 reads only own audit rows');
reset role;
select test.throws($sql$update public.teacher_audit_log set student_name = 'sửa'$sql$, '42501', 'even admin cannot update audit log');
select test.throws($sql$delete from public.teacher_audit_log$sql$, '42501', 'even admin cannot delete audit log directly');
select test.as_anon();
select test.throws($sql$select count(*) from public.teacher_audit_log$sql$, '42501', 'anon cannot read audit log');
reset role;

-- 5. Lần đăng nhập đầu của học sinh.
select test.login('33333333-0000-4000-8000-000000000033');
select test.eq(public.student_first_login_pending(), true, 'new student must change password');
select public.complete_first_login();
select test.eq(public.student_first_login_pending(), false, 'flag cleared after first login');
select test.login('11111111-0000-4000-8000-000000000011');
select test.eq(public.student_first_login_pending(), false, 'teacher is never pending');
select test.as_anon();
select test.throws($sql$select public.student_first_login_pending()$sql$, '42501', 'anon cannot call student_first_login_pending');
select test.throws($sql$select public.complete_first_login()$sql$, '42501', 'anon cannot call complete_first_login');
reset role;
-- Tài khoản bị khoá không tự gỡ cờ được.
update public.students set must_change_password = true, status = 'locked' where client_id = 'p1' and teacher_id = '11111111-0000-4000-8000-000000000011';
select test.login('33333333-0000-4000-8000-000000000033');
select public.complete_first_login();
reset role;
select test.eq((select must_change_password from public.students where client_id = 'p1' and teacher_id = '11111111-0000-4000-8000-000000000011'), true, 'locked student cannot clear the flag');
update public.students set status = 'active' where client_id = 'p1' and teacher_id = '11111111-0000-4000-8000-000000000011';

-- Học sinh không đọc được bảng students/sổ điểm ở Phase 4 (chưa có chính sách cho học sinh; Phase 5).
select test.login('33333333-0000-4000-8000-000000000033');
select test.eq((select count(*)::int from public.students), 0, 'student sees no students yet (Phase 5 adds own-row policy)');
select test.eq((select count(*)::int from public.teacher_audit_log), 0, 'student sees no audit rows');
reset role;

-- 6. Xoá học sinh xoá luôn tài khoản đăng nhập + ghi nhật ký; không bao giờ xoá tài khoản giáo viên.
select test.eq((select count(*)::int from auth.users where id = '33333333-0000-4000-8000-000000000033'), 1, 'student login exists before delete');
select test.eq((select count(*)::int from public.profiles where user_id = '33333333-0000-4000-8000-000000000033'), 1, 'student profile exists before delete');
select test.login('11111111-0000-4000-8000-000000000011');
select public.save_teacher_changes('{"deleted_student_client_ids":["p1"]}');
reset role;
select test.eq((select count(*)::int from auth.users where id = '33333333-0000-4000-8000-000000000033'), 0, 'deleting a student deletes the login');
select test.eq((select count(*)::int from public.profiles where user_id = '33333333-0000-4000-8000-000000000033'), 0, 'student profile removed with the login');
select test.eq((select count(*)::int from public.teacher_audit_log where action = 'delete_student' and student_name = 'Minh Anh' and teacher_id = '11111111-0000-4000-8000-000000000011'), 1, 'delete_student is logged');
select test.eq((select (detail->>'had_account')::boolean from public.teacher_audit_log where action = 'delete_student'), true, 'audit says the student had an account');
select test.login('11111111-0000-4000-8000-000000000011');
select public.save_teacher_changes('{"deleted_student_client_ids":["p3"]}');
reset role;
select test.eq((select count(*)::int from auth.users where id = '22222222-0000-4000-8000-000000000022'), 1, 'a teacher login is never deleted by the trigger');
-- Dòng nhật ký của học sinh đã xoá vẫn còn.
select test.eq((select count(*)::int from public.teacher_audit_log where student_name = 'Minh Anh'), 2, 'audit rows survive student deletion (create + delete)');

-- 7. Xoá dây chuyền khi xoá tài khoản giáo viên: tài khoản học sinh đi theo, nhật ký đi theo, không lỗi.
select test.login('11111111-0000-4000-8000-000000000011');
select public.save_teacher_changes($json${"students":[{"client_id":"p4","class_name":"P4","name":"Dũng","gender":"Nam","points":0,"game_state":{}}]}$json$::jsonb);
reset role;
select set_config('role', 'service_role', false);
update public.students set auth_user_id = '44444444-0000-4000-8000-000000000044', username = 'dung101'
  where client_id = 'p4' and teacher_id = '11111111-0000-4000-8000-000000000011';
reset role;
delete from auth.users where id = '11111111-0000-4000-8000-000000000011';
select test.eq((select count(*)::int from auth.users where id = '44444444-0000-4000-8000-000000000044'), 0, 'deleting a teacher deletes the student logins');
select test.eq((select count(*)::int from public.teacher_audit_log where teacher_id = '11111111-0000-4000-8000-000000000011'), 0, 'deleting a teacher removes their audit rows');
select test.eq((select count(*)::int from public.students where teacher_id = '22222222-0000-4000-8000-000000000022'), 1, 'other teacher data untouched');

\echo 'ALL PHASE 4 DB TESTS PASSED'
