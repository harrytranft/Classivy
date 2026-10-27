-- Test RLS và hàm DB của Phase 3 (task 3.2b). Chạy bằng scripts/test-db.sh.
-- Mỗi kiểm tra sai sẽ dừng script với thông báo "FAIL: ...".

\set ON_ERROR_STOP 1
set client_min_messages = notice;

create schema if not exists test;
grant usage on schema test to anon, authenticated;

-- Đăng nhập giả: đổi vai trò và id người dùng trong JWT.
create or replace function test.login(p_user uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', false);
  perform set_config('request.jwt.claim.sub', coalesce(p_user::text, ''), false);
end $$;

create or replace function test.as_anon()
returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', false);
  perform set_config('request.jwt.claim.sub', '', false);
end $$;

create or replace function test.eq(p_actual anyelement, p_expected anyelement, p_msg text)
returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FAIL: % (expected %, got %)', p_msg, p_expected, p_actual;
  end if;
  raise notice 'ok - %', p_msg;
end $$;

-- Câu lệnh phải lỗi (và đúng mã lỗi nếu có).
create or replace function test.throws(p_sql text, p_errcode text, p_msg text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if p_errcode is not null and sqlstate <> p_errcode then
      raise exception 'FAIL: % (expected error %, got % %)', p_msg, p_errcode, sqlstate, sqlerrm;
    end if;
    raise notice 'ok - % (%)', p_msg, sqlstate;
    return;
  end;
  raise exception 'FAIL: % (expected an error, statement succeeded)', p_msg;
end $$;

-- Số dòng bị ảnh hưởng (để kiểm tra UPDATE/DELETE bị RLS lọc về 0).
create or replace function test.affected(p_sql text)
returns integer language plpgsql as $$
declare n integer;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end $$;

grant execute on all functions in schema test to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Dữ liệu: hai giáo viên A, B
-- ---------------------------------------------------------------------------
reset role;
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@test'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b@test');
-- trigger tạo hồ sơ chạy khi thêm user? (baseline gắn trigger vào auth.users)
select test.eq((select count(*)::int from public.profiles where email in ('a@test', 'b@test')), 2, 'trigger creates a profile per user');
select test.eq((select role from public.profiles where email = 'a@test'), 'teacher', 'new profile defaults to teacher');
select test.eq((select display_name from public.profiles where email = 'a@test'), 'Trainer', 'default display name is Trainer');
insert into auth.users (id, email, raw_app_meta_data) values
  ('cccccccc-0000-4000-8000-000000000003', 's@test', '{"role":"student"}');
select test.eq((select role from public.profiles where email = 's@test'), 'student', 'app_metadata role=student creates student profile');

select test.eq(
  (select count(*)::int from information_schema.columns
   where table_schema = 'public' and table_name = 'user_settings' and column_name in ('ranks_male', 'ranks_female')),
  0, 'rank columns dropped (D7)');

-- ---------------------------------------------------------------------------
-- Giáo viên A ghi dữ liệu qua save_teacher_changes
-- ---------------------------------------------------------------------------
select test.login('aaaaaaaa-0000-4000-8000-000000000001');

select test.eq(
  public.save_teacher_changes($json${
    "classes": [{ "name": "6A1", "boss_state": { "className": "6A1", "defeatedBosses": 2 } }],
    "students": [
      { "client_id": "s1", "class_name": "6A1", "name": "An", "gender": "Nam", "points": 15, "avatar": null, "game_state": { "pets": [] } },
      { "client_id": "s2", "class_name": "7B", "name": "Bình", "gender": "Nữ", "points": 3, "avatar": "", "game_state": {} }
    ],
    "history": [
      { "student_client_id": "s1", "client_event_id": "h1", "amount": 10, "reason": "Phát biểu", "occurred_at_ms": 1761400000123, "source": "app" },
      { "student_client_id": "s1", "client_event_id": "h2", "amount": 5, "reason": "Bài tập", "occurred_at_ms": 1761400001456, "source": "app" },
      { "student_client_id": "s2", "client_event_id": "h3", "amount": 3, "reason": "Đi học", "occurred_at_ms": 1761400002000, "source": "app" }
    ],
    "deleted_student_client_ids": []
  }$json$::jsonb) > 0,
  true, 'A saves a change set');

select test.eq((select count(*)::int from public.classes), 2, 'A sees 2 classes (7B created from student)');
select test.eq((select count(*)::int from public.students), 2, 'A sees 2 students');
select test.eq((select count(*)::int from public.point_ledger), 3, 'A sees 3 ledger rows');
select test.eq((select boss_state->>'defeatedBosses' from public.classes where name = '6A1'), '2', 'boss state stored on class');
select test.eq((select avatar from public.students where client_id = 's2'), null::text, 'empty avatar stored as null');
select test.eq(
  (select (extract(epoch from occurred_at) * 1000)::bigint from public.point_ledger where client_event_id = 'h1'),
  1761400000123::bigint, 'timestamp round-trips to the millisecond');

-- Gửi lại cùng gói: không nhân đôi sổ điểm.
select public.save_teacher_changes($json${
  "history": [{ "student_client_id": "s1", "client_event_id": "h1", "amount": 10, "reason": "Phát biểu", "occurred_at_ms": 1761400000123 }]
}$json$::jsonb);
select test.eq((select count(*)::int from public.point_ledger), 3, 'resending a ledger row is idempotent');

-- Cập nhật học sinh + boss_state.
select public.save_teacher_changes($json${
  "classes": [{ "name": "6A1", "boss_state": null }],
  "students": [{ "client_id": "s1", "class_name": "7B", "name": "An Nguyễn", "gender": "Nam", "points": 20, "game_state": { "pets": [1] } }]
}$json$::jsonb);
select test.eq((select name || '|' || points from public.students where client_id = 's1'), 'An Nguyễn|20', 'student updated');
select test.eq((select c.name from public.students s join public.classes c on c.id = s.class_id where s.client_id = 's1'), '7B', 'student moved class');
select test.eq((select boss_state from public.classes where name = '6A1'), null::jsonb, 'boss state cleared');

-- Lịch sử gần nhất: tối đa 50 dòng, mới nhất trước.
select public.save_teacher_changes(jsonb_build_object('history', (
  select jsonb_agg(jsonb_build_object(
    'student_client_id', 's2', 'client_event_id', 'bulk' || g, 'amount', 1, 'reason', 'x', 'occurred_at_ms', 1761500000000 + g))
  from generate_series(1, 60) g)));
select test.eq((select count(*)::int from public.student_recent_history where student_client_id = 's2'), 50, 'recent history capped at 50');
select test.eq(
  (select client_event_id from public.student_recent_history where student_client_id = 's2' order by occurred_at desc limit 1),
  'bulk60', 'recent history newest first');
select public.save_teacher_changes('{"history":[{"student_client_id":"s1","client_event_id":"opening-balance","amount":7,"reason":"Số dư","occurred_at_ms":1,"source":"opening_balance"}]}');
select test.eq((select count(*)::int from public.student_recent_history where student_client_id = 's1'), 2, 'recent history of s1 hides opening balance');
select test.eq((select sum(amount)::int from public.point_ledger l join public.students s on s.id = l.student_id where s.client_id = 's1'), 22, 'opening balance kept in ledger');

-- Lỗi rõ ràng thay vì âm thầm bỏ qua.
select test.throws($sql$select public.save_teacher_changes('{"history":[{"student_client_id":"nobody","client_event_id":"z","amount":1,"occurred_at_ms":1}]}')$sql$,
  '23503', 'history for unknown student is rejected');
select test.throws($sql$select public.save_teacher_changes('{"students":[{"client_id":"s9","class_name":"7B","name":"X","gender":"Nam","points":1.5,"game_state":{}}]}')$sql$,
  '22P02', 'fractional points rejected');
select test.throws($sql$select public.save_teacher_changes('{"students":[{"client_id":"s9","class_name":"7B","name":"X","gender":"Khác","points":1,"game_state":{}}]}')$sql$,
  '23514', 'invalid gender rejected');
select test.throws($sql$select public.save_teacher_changes('[]')$sql$, '22023', 'non-object payload rejected');

-- Sổ điểm bất biến, cột tài khoản/trạng thái và role không ghi được từ client.
select test.throws($sql$update public.point_ledger set amount = 999$sql$, '42501', 'A cannot update ledger');
select test.throws($sql$delete from public.point_ledger$sql$, '42501', 'A cannot delete ledger');
select test.throws($sql$update public.students set auth_user_id = 'aaaaaaaa-0000-4000-8000-000000000001'$sql$, '42501', 'A cannot set auth_user_id');
select test.throws($sql$update public.students set status = 'locked'$sql$, '42501', 'A cannot set status');
select test.throws($sql$update public.students set teacher_id = 'bbbbbbbb-0000-4000-8000-000000000002'$sql$, '42501', 'A cannot change teacher_id');
select test.throws($sql$update public.profiles set role = 'student'$sql$, '42501', 'A cannot change own role');
select test.throws($sql$insert into public.point_ledger (student_id, amount, client_event_id, created_by) select id, 1, 'forged', 'bbbbbbbb-0000-4000-8000-000000000002' from public.students limit 1$sql$,
  '42501', 'A cannot forge created_by');
select test.eq(test.affected($sql$update public.profiles set display_name = 'Cô A' where email = 'a@test'$sql$), 1, 'A can still edit own display name');
select test.eq(test.affected($sql$
  insert into public.profiles (user_id, email, display_name, photo_url, last_login_at, updated_at)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'a@test', 'Cô A', '', now(), now())
  on conflict (user_id) do update set email = excluded.email, display_name = excluded.display_name,
    photo_url = excluded.photo_url, last_login_at = excluded.last_login_at, updated_at = excluded.updated_at$sql$),
  1, 'profile upsert used by the app still works');

-- ---------------------------------------------------------------------------
-- Giáo viên B không thấy/không sửa được dữ liệu của A
-- ---------------------------------------------------------------------------
select test.login('bbbbbbbb-0000-4000-8000-000000000002');

select test.eq((select count(*)::int from public.classes), 0, 'B sees no classes of A');
select test.eq((select count(*)::int from public.students), 0, 'B sees no students of A');
select test.eq((select count(*)::int from public.point_ledger), 0, 'B sees no ledger of A');
select test.eq((select count(*)::int from public.student_recent_history), 0, 'B sees no history of A');
select test.eq((select count(*)::int from public.profiles), 1, 'B sees only own profile');
select test.eq(test.affected($sql$update public.students set points = 0$sql$), 0, 'B cannot update A students');
select test.eq(test.affected($sql$update public.classes set name = 'hacked'$sql$), 0, 'B cannot update A classes');
select test.eq(test.affected($sql$delete from public.students$sql$), 0, 'B cannot delete A students');

-- B biết id lớp của A (giả sử lộ) cũng không gắn học sinh vào được.
reset role;
select set_config('test.a_class', (select id::text from public.classes where name = '6A1'), false);
select set_config('test.a_student', (select id::text from public.students where client_id = 's1'), false);
select test.login('bbbbbbbb-0000-4000-8000-000000000002');
select test.throws(format($sql$insert into public.students (teacher_id, class_id, client_id, name, gender) values ('bbbbbbbb-0000-4000-8000-000000000002', %L, 'x', 'X', 'Nam')$sql$, current_setting('test.a_class')),
  '23503', 'B cannot attach a student to A class');
select test.throws(format($sql$insert into public.students (teacher_id, class_id, client_id, name, gender) values ('aaaaaaaa-0000-4000-8000-000000000001', %L, 'x', 'X', 'Nam')$sql$, current_setting('test.a_class')),
  '42501', 'B cannot insert a student as A');
select test.throws(format($sql$insert into public.point_ledger (teacher_id, student_id, amount, client_event_id) values ('bbbbbbbb-0000-4000-8000-000000000002', %L, 100, 'steal')$sql$, current_setting('test.a_student')),
  '23503', 'B cannot add ledger rows to A student');
select test.throws(format($sql$insert into public.point_ledger (teacher_id, student_id, amount, client_event_id) values ('aaaaaaaa-0000-4000-8000-000000000001', %L, 100, 'steal')$sql$, current_setting('test.a_student')),
  '42501', 'B cannot add ledger rows as A');
select test.throws($sql$select public.save_teacher_changes('{"history":[{"student_client_id":"s1","client_event_id":"steal","amount":100,"occurred_at_ms":1}]}')$sql$,
  '23503', 'B cannot reach A student through the RPC');

-- Cùng client_id với học sinh của A: tạo học sinh riêng của B, không đụng A.
select public.save_teacher_changes('{"students":[{"client_id":"s1","class_name":"6A1","name":"Học sinh của B","gender":"Nữ","points":1,"game_state":{}}],"deleted_student_client_ids":["s2"]}');
select test.eq((select count(*)::int from public.students), 1, 'B has own student with same client_id');
reset role;
select test.eq((select name from public.students where teacher_id = 'aaaaaaaa-0000-4000-8000-000000000001' and client_id = 's1'), 'An Nguyễn', 'A student untouched by B');
select test.eq((select count(*)::int from public.students where teacher_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 2, 'B delete did not reach A');

-- ---------------------------------------------------------------------------
-- Ẩn danh (anon) và người đăng nhập không có id
-- ---------------------------------------------------------------------------
select test.as_anon();
select test.throws($sql$select count(*) from public.students$sql$, '42501', 'anon cannot read students');
select test.throws($sql$select count(*) from public.point_ledger$sql$, '42501', 'anon cannot read ledger');
select test.throws($sql$select public.save_teacher_changes('{}')$sql$, '42501', 'anon cannot call save_teacher_changes');
select test.login(null);
select test.throws($sql$select public.save_teacher_changes('{}')$sql$, '42501', 'no user id -> not authenticated');

-- ---------------------------------------------------------------------------
-- Xoá hẳn học sinh (Q3) và sổ điểm bất biến với cả quyền quản trị
-- ---------------------------------------------------------------------------
select test.login('aaaaaaaa-0000-4000-8000-000000000001');
select public.save_teacher_changes('{"deleted_student_client_ids":["s2"]}');
select test.eq((select count(*)::int from public.students), 1, 'A deleted s2');
reset role;
select test.eq((select count(*)::int from public.point_ledger l join public.students s on s.id = l.student_id where s.client_id = 's2'), 0, 'ledger of deleted student removed with it');
select test.eq((select count(*)::int from public.point_ledger where teacher_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 3, 'other ledger rows kept');
select test.throws($sql$update public.point_ledger set amount = 1$sql$, '42501', 'even admin cannot update ledger');
select test.throws($sql$delete from public.point_ledger$sql$, '42501', 'even admin cannot delete ledger rows directly');

-- Xoá tài khoản giáo viên: mọi dữ liệu của giáo viên đó đi theo.
delete from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select test.eq((select count(*)::int from public.students where teacher_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, 'teacher deletion cascades students');
select test.eq((select count(*)::int from public.point_ledger where teacher_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, 'teacher deletion cascades ledger');
select test.eq((select count(*)::int from public.classes where teacher_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, 'teacher deletion cascades classes');

\echo 'ALL PHASE 3 DB TESTS PASSED'
