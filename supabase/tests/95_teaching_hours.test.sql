-- Test chế độ giờ dạy (hàm student_teaching_hours). Chạy bằng scripts/test-db.sh SAU test 90 (dùng test.* của file 10 và test.raises của file 50).

\set ON_ERROR_STOP 1
set client_min_messages = notice;
reset role;

insert into auth.users (id, email) values
  ('f4000000-0000-4000-8000-000000000001', 'th-t1@test'),
  ('f4000000-0000-4000-8000-000000000002', 'th-t2@test');
insert into auth.users (id, email, raw_app_meta_data) values
  ('f4100000-0000-4000-8000-000000000001', 'th-s1@s.test', '{"role":"student"}'),
  ('f4100000-0000-4000-8000-000000000002', 'th-s2@s.test', '{"role":"student"}');

-- 0. Quyền hàm.
select test.eq(has_function_privilege('anon', 'public.student_teaching_hours()', 'execute'), false, 'anon cannot call');
select test.eq(has_function_privilege('authenticated', 'public.student_teaching_hours()', 'execute'), true, 'authenticated can call');

-- Giáo viên 1 có lịch giờ dạy + cài đặt khác; giáo viên 2 chưa lưu gì.
select test.login('f4000000-0000-4000-8000-000000000001');
insert into public.user_settings (user_id, classroom_settings) values
  ('f4000000-0000-4000-8000-000000000001', '{"teachingHours":{"enabled":true,"retryMinutes":10,"slots":[{"id":"a","weekday":5,"start":"17:30","end":"20:40"}]},"wildHunt":{"enabled":false}}');
select public.save_teacher_changes($json${
  "students": [ { "client_id": "th1", "class_name": "TH", "name": "Th1", "gender": "Nam", "points": 1, "game_state": {} } ]
}$json$::jsonb);
select test.login('f4000000-0000-4000-8000-000000000002');
insert into public.user_settings (user_id) values ('f4000000-0000-4000-8000-000000000002');
select public.save_teacher_changes($json${
  "students": [ { "client_id": "th2", "class_name": "TH", "name": "Th2", "gender": "Nam", "points": 1, "game_state": {} } ]
}$json$::jsonb);
reset role;
select set_config('role', 'service_role', false);
update public.students set auth_user_id = 'f4100000-0000-4000-8000-000000000001' where client_id = 'th1' and teacher_id = 'f4000000-0000-4000-8000-000000000001';
update public.students set auth_user_id = 'f4100000-0000-4000-8000-000000000002' where client_id = 'th2' and teacher_id = 'f4000000-0000-4000-8000-000000000002';
reset role;

-- 1. Học sinh đọc đúng lịch của giáo viên mình, và chỉ mục teachingHours (không lộ wildHunt...).
select test.login('f4100000-0000-4000-8000-000000000001');
select test.eq((select public.student_teaching_hours() ->> 'retryMinutes'), '10', 'student reads own teacher hours');
select test.eq((select public.student_teaching_hours() #>> '{slots,0,start}'), '17:30', 'slot returned');
select test.eq((select public.student_teaching_hours() ? 'wildHunt'), false, 'other settings not leaked');

-- 2. Giáo viên chưa lưu: null (app dùng mặc định).
select test.login('f4100000-0000-4000-8000-000000000002');
select test.eq((select public.student_teaching_hours() is null), true, 'null when teacher saved nothing');

-- 3. Giáo viên và khách không gọi được (không phải học sinh).
select test.login('f4000000-0000-4000-8000-000000000001');
select test.raises($sql$select public.student_teaching_hours()$sql$, 'not_active_student', 'teacher cannot call');
select test.as_anon();
select test.throws($sql$select public.student_teaching_hours()$sql$, '42501', 'anon cannot call');
reset role;
