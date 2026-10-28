-- Test Phase 5 (cổng học sinh): get_my_student_profile chỉ trả dữ liệu chọn lọc của chính học sinh gọi,
-- tài khoản khoá không thấy gì, học sinh vẫn không đọc thẳng được bảng nào.
-- Chạy bằng scripts/test-db.sh SAU test Phase 4 (dùng lại hàm test.* đã tạo ở file 10).

\set ON_ERROR_STOP 1
set client_min_messages = notice;
reset role;

insert into auth.users (id, email) values
  ('55555555-0000-4000-8000-000000000055', 't5@test'),
  ('66666666-0000-4000-8000-000000000066', 't6@test');
insert into auth.users (id, email, raw_app_meta_data) values
  ('77777777-0000-4000-8000-000000000077', 's7@students.test', '{"role":"student"}'),
  ('88888888-0000-4000-8000-000000000088', 's8@students.test', '{"role":"student"}'),
  ('99999999-0000-4000-8000-000000000099', 's9@students.test', '{"role":"student"}');

-- T5: lớp 6A, hai học sinh (Lan có tài khoản, Hùng chưa). T6: lớp 7B, Vy có tài khoản.
select test.login('55555555-0000-4000-8000-000000000055');
select public.save_teacher_changes($json${
  "students": [
    { "client_id": "a1", "class_name": "6A", "name": "Lan", "gender": "Nữ", "points": 42, "avatar": "data:image/png;base64,AAAA",
      "game_state": {
        "pet": { "dexId": 25, "name": "Pikachu", "types": ["electric"], "accessories": [], "skills": [], "level": 3 },
        "pets": [{ "dexId": 25, "name": "Pikachu", "types": ["electric"], "accessories": [], "skills": [] }],
        "egg": { "progress": 3, "status": "egg", "assignedDexId": 150, "kind": "special" },
        "trainerProgress": { "level": 4, "xp": 10, "totalXp": 310, "titleId": "rookie" },
        "earnedBadges": [{ "badgeId": "blaze", "earnedAt": 1700000000000 }],
        "adventureJournal": [{ "id": "j1", "text": "bí mật" }],
        "ludoTile": 7
      } },
    { "client_id": "a2", "class_name": "6A", "name": "Hùng", "gender": "Nam", "points": 99, "game_state": {} }
  ],
  "history": [
    { "student_client_id": "a1", "client_event_id": "ob", "amount": 30, "reason": "Số dư đầu kỳ", "occurred_at_ms": 1600000000000, "source": "opening_balance" },
    { "student_client_id": "a1", "client_event_id": "e1", "amount": 5, "reason": "Trả lời hay", "occurred_at_ms": 1700000000000 },
    { "student_client_id": "a1", "client_event_id": "e2", "amount": -1, "reason": "Quên vở", "occurred_at_ms": 1700000100000 },
    { "student_client_id": "a2", "client_event_id": "x1", "amount": 99, "reason": "Của Hùng", "occurred_at_ms": 1700000200000 }
  ]
}$json$::jsonb);
select test.login('66666666-0000-4000-8000-000000000066');
select public.save_teacher_changes($json${
  "students": [{ "client_id": "b1", "class_name": "7B", "name": "Vy", "gender": "Nữ", "points": 7, "game_state": {} }]
}$json$::jsonb);

-- 35 dòng cho Lan để kiểm tra giới hạn 30.
select test.login('55555555-0000-4000-8000-000000000055');
select public.save_teacher_changes(jsonb_build_object('history', (
  select jsonb_agg(jsonb_build_object('student_client_id', 'a1', 'client_event_id', 'bulk' || g, 'amount', 1,
                                      'reason', 'Lần ' || g, 'occurred_at_ms', 1690000000000 + g))
  from generate_series(1, 35) g)));

-- Gắn tài khoản như Edge Function. s7 = Lan, s8 = Vy, s9 = học sinh chưa gắn dòng nào.
-- Gắn nhầm tài khoản giáo viên T6 vào Hùng để kiểm tra chốt vai trò.
reset role;
select set_config('role', 'service_role', false);
update public.students set auth_user_id = '77777777-0000-4000-8000-000000000077', username = 'lan123'
  where client_id = 'a1' and teacher_id = '55555555-0000-4000-8000-000000000055';
update public.students set auth_user_id = '88888888-0000-4000-8000-000000000088', username = 'vy456'
  where client_id = 'b1' and teacher_id = '66666666-0000-4000-8000-000000000066';
update public.students set auth_user_id = '66666666-0000-4000-8000-000000000066'
  where client_id = 'a2' and teacher_id = '55555555-0000-4000-8000-000000000055';
reset role;

-- 1. Học sinh đang hoạt động nhận đúng dữ liệu của mình.
select test.login('77777777-0000-4000-8000-000000000077');
select test.eq(public.get_my_student_profile()->>'status', 'active', 'active student gets status active');
select test.eq(public.get_my_student_profile()->>'name', 'Lan', 'student gets own name');
select test.eq(public.get_my_student_profile()->>'class_name', '6A', 'student gets own class name');
select test.eq((public.get_my_student_profile()->>'points')::int, 42, 'student gets own points');
select test.eq(public.get_my_student_profile()->>'avatar', 'data:image/png;base64,AAAA', 'student gets own avatar');
select test.eq(public.get_my_student_profile()#>>'{game,pet,name}', 'Pikachu', 'student gets own companion');
select test.eq((public.get_my_student_profile()#>>'{game,trainerProgress,level}')::int, 4, 'student gets trainer level');
select test.eq(public.get_my_student_profile()#>>'{game,earnedBadges,0,badgeId}', 'blaze', 'student gets badges');

-- 2. Không lộ thông tin nội bộ hay phần game ngoài danh sách cho phép.
select test.eq((select array_agg(k order by k) from jsonb_object_keys(public.get_my_student_profile()) k),
  array['avatar', 'class_name', 'game', 'gender', 'history', 'name', 'points', 'status'], 'only whitelisted top-level keys');
select test.eq((select array_agg(k order by k) from jsonb_object_keys(public.get_my_student_profile()->'game') k),
  array['earnedBadges', 'egg', 'pet', 'pets', 'trainerProgress'], 'only whitelisted game keys (no journal, no ludo)');
select test.eq((public.get_my_student_profile()#>>'{game,egg,progress}')::int, 3, 'student sees egg progress');
select test.eq(public.get_my_student_profile()#>'{game,egg}' ? 'assignedDexId', false, 'egg never reveals the pre-rolled Pokémon');
select test.eq(position('55555555' in public.get_my_student_profile()::text), 0, 'teacher id never appears');
select test.eq(position('lan123' in public.get_my_student_profile()::text), 0, 'username never appears');

-- 3. Lịch sử: chỉ của mình, mới nhất trước, tối đa 30, bỏ số dư đầu kỳ.
select test.eq(jsonb_array_length(public.get_my_student_profile()->'history'), 30, 'history capped at 30 rows');
select test.eq(public.get_my_student_profile()#>>'{history,0,reason}', 'Quên vở', 'newest history row first');
select test.eq((public.get_my_student_profile()#>>'{history,0,amount}')::int, -1, 'history keeps negative amounts for the owner');
select test.eq(position('Số dư đầu kỳ' in public.get_my_student_profile()::text), 0, 'opening balance hidden');
select test.eq(position('Của Hùng' in public.get_my_student_profile()::text), 0, 'classmate history never appears');

-- 4. Học sinh vẫn KHÔNG đọc thẳng được bảng nào (không mở policy cho học sinh).
select test.eq((select count(*)::int from public.students), 0, 'student still reads no students rows');
select test.eq((select count(*)::int from public.point_ledger), 0, 'student still reads no ledger rows');
select test.eq((select count(*)::int from public.classes), 0, 'student still reads no classes rows');
select test.eq((select count(*)::int from public.student_recent_history), 0, 'student still reads no history view rows');

-- 5. Học sinh lớp khác chỉ thấy của mình.
select test.login('88888888-0000-4000-8000-000000000088');
select test.eq(public.get_my_student_profile()->>'name', 'Vy', 'other student sees only own profile');
select test.eq(jsonb_array_length(public.get_my_student_profile()->'history'), 0, 'empty history is an empty array');
select test.eq(public.get_my_student_profile()->'game', '{}'::jsonb, 'empty game state is an empty object');

-- 6. Tài khoản bị khoá: chỉ trả trạng thái, không còn dữ liệu (kể cả phiên cũ còn sống).
reset role;
select set_config('role', 'service_role', false);
update public.students set status = 'locked' where auth_user_id = '77777777-0000-4000-8000-000000000077';
reset role;
select test.login('77777777-0000-4000-8000-000000000077');
select test.eq(public.get_my_student_profile(), '{"status":"locked"}'::jsonb, 'locked student gets only the status');
reset role;
select set_config('role', 'service_role', false);
update public.students set status = 'active' where auth_user_id = '77777777-0000-4000-8000-000000000077';
reset role;

-- 7. Tài khoản học sinh chưa gắn (vd đã bị thu hồi rồi tạo lại sai) và tài khoản giáo viên.
select test.login('99999999-0000-4000-8000-000000000099');
select test.eq(public.get_my_student_profile(), '{"status":"not_linked"}'::jsonb, 'unlinked student account gets not_linked');
select test.login('66666666-0000-4000-8000-000000000066');
select test.eq(public.get_my_student_profile(), '{"status":"not_student"}'::jsonb, 'teacher (even if wrongly linked) gets not_student');

-- 8. Chưa đăng nhập: không gọi được.
select test.as_anon();
select test.throws($sql$select public.get_my_student_profile()$sql$, '42501', 'anon cannot call get_my_student_profile');
select test.login(null);
select test.throws($sql$select public.get_my_student_profile()$sql$, '42501', 'authenticated without uid is rejected');
reset role;

\echo 'ALL PHASE 5 DB TESTS PASSED'
