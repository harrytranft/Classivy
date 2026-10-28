-- Test Phase 6 (bạn bè, quà, ví điểm tặng). Chạy bằng scripts/test-db.sh SAU các test trước
-- (dùng lại hàm test.* ở file 10).

\set ON_ERROR_STOP 1
set client_min_messages = notice;
reset role;

-- Câu lệnh phải lỗi với đúng thông báo (mã lỗi nghiệp vụ của hàm, vd 'weekly_limit').
create or replace function test.raises(p_sql text, p_message text, p_msg text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlerrm <> p_message then
      raise exception 'FAIL: % (expected "%", got % "%")', p_msg, p_message, sqlstate, sqlerrm;
    end if;
    raise notice 'ok - % (%)', p_msg, sqlerrm;
    return;
  end;
  raise exception 'FAIL: % (expected "%", statement succeeded)', p_msg, p_message;
end $$;
grant execute on function test.raises(text, text, text) to anon, authenticated;

-- T: lớp 8A (Lan, Minh, Phúc có tài khoản; Nga chưa có), lớp 8B (Duy có tài khoản). T2: Ken có tài khoản.
insert into auth.users (id, email) values
  ('c0000000-0000-4000-8000-000000000001', 'tsocial@test'),
  ('c0000000-0000-4000-8000-000000000002', 'tsocial2@test');
insert into auth.users (id, email, raw_app_meta_data) values
  ('c1000000-0000-4000-8000-000000000001', 'lan@s.test', '{"role":"student"}'),
  ('c1000000-0000-4000-8000-000000000002', 'minh@s.test', '{"role":"student"}'),
  ('c1000000-0000-4000-8000-000000000003', 'phuc@s.test', '{"role":"student"}'),
  ('c1000000-0000-4000-8000-000000000004', 'duy@s.test', '{"role":"student"}'),
  ('c1000000-0000-4000-8000-000000000005', 'ken@s.test', '{"role":"student"}');

select test.login('c0000000-0000-4000-8000-000000000001');
select public.save_teacher_changes($json${
  "students": [
    { "client_id": "lan", "class_name": "8A", "name": "Lan", "gender": "Nữ", "points": 10, "game_state": { "pet": { "dexId": 25, "name": "Pikachu" } } },
    { "client_id": "minh", "class_name": "8A", "name": "Minh", "gender": "Nam", "points": 10, "game_state": {} },
    { "client_id": "phuc", "class_name": "8A", "name": "Phúc", "gender": "Nam", "points": 10, "game_state": {} },
    { "client_id": "nga", "class_name": "8A", "name": "Nga", "gender": "Nữ", "points": 10, "game_state": {} },
    { "client_id": "duy", "class_name": "8B", "name": "Duy", "gender": "Nam", "points": 10, "game_state": {} }
  ]
}$json$::jsonb);
select test.login('c0000000-0000-4000-8000-000000000002');
select public.save_teacher_changes('{"students":[{"client_id":"ken","class_name":"8A","name":"Ken","gender":"Nam","points":0,"game_state":{}}]}');
reset role;
select set_config('role', 'service_role', false);
update public.students set auth_user_id = 'c1000000-0000-4000-8000-000000000001' where client_id = 'lan' and teacher_id = 'c0000000-0000-4000-8000-000000000001';
update public.students set auth_user_id = 'c1000000-0000-4000-8000-000000000002' where client_id = 'minh' and teacher_id = 'c0000000-0000-4000-8000-000000000001';
update public.students set auth_user_id = 'c1000000-0000-4000-8000-000000000003' where client_id = 'phuc' and teacher_id = 'c0000000-0000-4000-8000-000000000001';
update public.students set auth_user_id = 'c1000000-0000-4000-8000-000000000004' where client_id = 'duy' and teacher_id = 'c0000000-0000-4000-8000-000000000001';
update public.students set auth_user_id = 'c1000000-0000-4000-8000-000000000005' where client_id = 'ken' and teacher_id = 'c0000000-0000-4000-8000-000000000002';
reset role;

-- Id học sinh để dùng trong câu lệnh (bảng tạm, ai cũng đọc được trong test).
create temp table ids as
select client_id, id from public.students where teacher_id in ('c0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002');
grant select on ids to authenticated;
create or replace function test.sid(p text) returns uuid language sql stable as $$ select id from ids where client_id = p $$;
grant execute on function test.sid(text) to authenticated;

-- 1. Mặc định TẮT.
select test.login('c1000000-0000-4000-8000-000000000001');
select test.eq(public.student_social_overview(), '{"enabled": false}'::jsonb, 'social is off by default');
select test.raises(format('select public.student_send_friend_request(%L)', test.sid('minh')), 'social_disabled', 'cannot invite while off');
-- Học sinh không bật được (không thấy lớp nào qua RLS).
select test.eq(test.affected($sql$update public.classes set social_enabled = true$sql$), 0, 'student cannot enable social');

-- 2. Giáo viên bật cho lớp 8A; giáo viên khác không đụng được.
select test.login('c0000000-0000-4000-8000-000000000002');
select test.eq(test.affected($sql$update public.classes set social_enabled = true where name = '8A' and teacher_id = 'c0000000-0000-4000-8000-000000000001'$sql$), 0, 'other teacher cannot enable');
select test.login('c0000000-0000-4000-8000-000000000001');
select test.eq(test.affected($sql$update public.classes set social_enabled = true where name = '8A'$sql$), 1, 'teacher enables own class');
select test.throws($sql$update public.classes set gift_weekly_limit = 999 where name = '8A'$sql$, '23514', 'weekly limit is bounded');

-- 3. Danh sách bạn cùng lớp: chỉ cùng lớp, có tài khoản, không có mình.
select test.login('c1000000-0000-4000-8000-000000000001');
select test.eq(public.student_social_overview()->>'enabled', 'true', 'overview enabled');
select test.eq((select array_agg(x->>'name' order by x->>'name') from jsonb_array_elements(public.student_social_overview()->'classmates') x),
  array['Minh', 'Phúc'], 'classmates: same class, with account, not self');
select test.eq((public.student_social_overview()#>>'{wallet,limit}')::int, 5, 'default weekly limit is 5');
select test.raises(format('select public.student_send_friend_request(%L)', test.sid('duy')), 'not_classmate', 'cannot invite other class');
select test.raises(format('select public.student_send_friend_request(%L)', test.sid('ken')), 'not_classmate', 'cannot invite other teacher student');
select test.raises(format('select public.student_send_friend_request(%L)', test.sid('nga')), 'not_classmate', 'cannot invite student without account');
select test.raises(format('select public.student_send_friend_request(%L)', test.sid('lan')), 'not_classmate', 'cannot invite self');

-- 4. Lời mời + chấp nhận; mời chéo thì tự chấp nhận.
select test.eq(public.student_send_friend_request(test.sid('minh')), 'pending', 'Lan invites Minh');
select test.eq(public.student_send_friend_request(test.sid('minh')), 'pending', 'inviting twice is harmless');
select test.raises(format('select public.student_send_gift(%L, 1, %L)', test.sid('minh'), 'star'), 'not_friend', 'cannot gift before acceptance');
select test.login('c1000000-0000-4000-8000-000000000002');
select test.eq(public.student_social_overview()#>>'{incoming,0,name}', 'Lan', 'Minh sees the invite');
select test.raises($sql$select public.student_respond_friend_request(-1, true)$sql$, 'request_not_found', 'cannot answer unknown request');
select test.eq(public.student_respond_friend_request((public.student_social_overview()#>>'{incoming,0,request_id}')::bigint, true), 'accepted', 'Minh accepts');
select test.eq(public.student_social_overview()#>>'{friends,0,name}', 'Lan', 'Minh now has Lan as friend');
select test.eq((public.student_social_overview()#>>'{friends,0,pet_dex_id}')::int, 25, 'friend shows companion Pokémon only');
select test.eq(position('points' in (public.student_social_overview()->'friends')::text), 0, 'friends never show points');
select test.login('c1000000-0000-4000-8000-000000000003');
select test.eq(public.student_send_friend_request(test.sid('lan')), 'pending', 'Phúc invites Lan');
select test.login('c1000000-0000-4000-8000-000000000001');
select test.eq(public.student_send_friend_request(test.sid('phuc')), 'accepted', 'mutual invite becomes friendship');

-- 5. Quà + ví: mỗi lần 0-2 điểm, 2 điểm/tuần cho cùng một bạn, 5 điểm/tuần tổng.
select test.eq((public.student_send_gift(test.sid('minh'), 2, 'star', 'thanks_help')->>'gift_id') is not null, true, 'Lan gives Minh 2 points');
select test.raises(format('select public.student_send_gift(%L, 1, %L)', test.sid('minh'), 'heart'), 'friend_limit', 'per-friend weekly limit');
select test.eq((public.student_send_gift(test.sid('minh'), 0, 'heart')->>'gift_id') is not null, true, 'sticker without points still allowed');
select test.raises(format('select public.student_send_gift(%L, 3, %L)', test.sid('phuc'), 'star'), 'invalid_amount', 'max 2 points per gift');
select test.raises(format('select public.student_send_gift(%L, -1, %L)', test.sid('phuc'), 'star'), 'invalid_amount', 'no negative gifts');
select test.raises(format('select public.student_send_gift(%L, 1, %L)', test.sid('phuc'), 'bomb'), 'invalid_gift', 'unknown sticker rejected');
select test.raises(format('select public.student_send_gift(%L, 1, %L, %L)', test.sid('phuc'), 'star', 'you are bad'), 'invalid_gift', 'free text message rejected');
select test.eq((public.student_social_overview()#>>'{wallet,used}')::int, 2, 'wallet used = 2');
select test.eq((select (x->>'given_this_week')::int from jsonb_array_elements(public.student_social_overview()->'friends') x where x->>'name' = 'Minh'), 2, 'per-friend usage shown');
reset role;
select test.login('c0000000-0000-4000-8000-000000000001');
update public.classes set gift_per_friend_weekly_limit = 10 where name = '8A';
select test.login('c1000000-0000-4000-8000-000000000001');
select public.student_send_gift(test.sid('phuc'), 2, 'clap');
select test.raises(format('select public.student_send_gift(%L, 2, %L)', test.sid('phuc'), 'clap'), 'weekly_limit', 'weekly limit 5 (2+2+2 > 5)');
select public.student_send_gift(test.sid('phuc'), 1, 'clap');
select test.eq((public.student_social_overview()#>>'{wallet,used}')::int, 5, 'wallet fully used');

-- 6. Không có cách đi vòng: học sinh không đọc/ghi thẳng bảng.
select test.eq((select count(*)::int from public.student_gifts), 0, 'student reads no gifts rows');
select test.eq((select count(*)::int from public.student_friendships), 0, 'student reads no friendship rows');
select test.throws(format($sql$insert into public.student_gifts (teacher_id, class_id, sender_id, recipient_id, amount, sticker_id, week_key)
  values ('c0000000-0000-4000-8000-000000000001', gen_random_uuid(), %L, %L, 2, 'star', 'x')$sql$, test.sid('lan'), test.sid('minh')), '42501', 'student cannot insert gifts directly');
select test.throws($sql$select public.social_current_student()$sql$, '42501', 'helper functions are not callable');

-- 7. Giới hạn 10 món mỗi ngày (kể cả sticker không điểm). Đã gửi 4 món.
select public.student_send_gift(test.sid('minh'), 0, 'leaf') from generate_series(1, 6);
select test.raises(format('select public.student_send_gift(%L, 0, %L)', test.sid('minh'), 'leaf'), 'daily_limit', 'daily limit of 10 gifts');

-- 8. Hàng chờ điểm của giáo viên: chỉ quà có điểm, chưa cộng.
select test.login('c0000000-0000-4000-8000-000000000002');
select test.eq((select count(*)::int from public.teacher_pending_gift_adjustments()), 0, 'other teacher sees no pending gifts');
select test.eq((select count(*)::int from public.student_gifts), 0, 'other teacher reads no gifts');
select test.login('c0000000-0000-4000-8000-000000000001');
select test.eq((select count(*)::int from public.teacher_pending_gift_adjustments()), 3, 'three point gifts pending');
select test.eq((select sum(amount)::int from public.teacher_pending_gift_adjustments() where student_client_id = 'minh'), 2, 'Minh pending +2');
select test.eq((select reason from public.teacher_pending_gift_adjustments() where student_client_id = 'minh'), '🎁 Quà từ Lan: +2 Hào Quang', 'reason names the sender for the teacher');

-- App giáo viên cộng vào Hào Quang bằng dòng sổ điểm 'gift-<id>' -> hết chờ, không cộng trùng.
select public.save_teacher_changes(jsonb_build_object(
  'students', (select jsonb_agg(jsonb_build_object('client_id', s.client_id, 'class_name', '8A', 'name', s.name, 'gender', s.gender,
                 'points', s.points + coalesce((select sum(p.amount) from public.teacher_pending_gift_adjustments() p where p.student_client_id = s.client_id), 0),
                 'game_state', s.game_state))
               from public.students s where s.client_id in ('minh', 'phuc')),
  'history', (select jsonb_agg(jsonb_build_object('student_client_id', p.student_client_id, 'client_event_id', p.client_event_id,
                 'amount', p.amount, 'reason', p.reason, 'occurred_at_ms', 1700000000000))
              from public.teacher_pending_gift_adjustments() p)));
select test.eq((select count(*)::int from public.teacher_pending_gift_adjustments()), 0, 'nothing pending after the app applied gifts');
select test.eq((select points from public.students where client_id = 'phuc'), 13, 'Phúc got +3 Hào Quang');
select test.login('c1000000-0000-4000-8000-000000000002');
select test.eq((select x->>'state' from jsonb_array_elements(public.student_social_overview()->'received') x where (x->>'amount')::int = 2), 'applied', 'recipient sees the gift as applied');
select test.eq((select x->>'message_id' from jsonb_array_elements(public.student_social_overview()->'received') x where (x->>'amount')::int = 2), 'thanks_help', 'recipient sees the preset message');

-- 9. Báo cáo: chỉ người nhận báo được.
select public.student_report_gift((select (x->>'id')::bigint from jsonb_array_elements(public.student_social_overview()->'received') x where (x->>'amount')::int = 2));
select public.student_report_gift((select (x->>'id')::bigint from jsonb_array_elements(public.student_social_overview()->'received') x where (x->>'amount')::int = 2));
select test.eq((select (x->>'reported')::boolean from jsonb_array_elements(public.student_social_overview()->'received') x where (x->>'amount')::int = 2), true, 'recipient sees own report');
select test.login('c1000000-0000-4000-8000-000000000001');
select test.raises(format('select public.student_report_gift(%s)', (select (x->>'id') from jsonb_array_elements(public.student_social_overview()->'sent') x limit 1)), 'gift_not_found', 'sender cannot report own gift');
select test.login('c0000000-0000-4000-8000-000000000001');
select test.eq((select count(*)::int from public.student_gift_reports), 1, 'teacher sees one report (no duplicates)');

-- 10. Thu hồi: quà đã cộng -> hàng chờ trả dòng trừ; quà chưa cộng -> không bao giờ cộng.
insert into public.student_gift_revocations (gift_id, teacher_id, reason)
select g.id, 'c0000000-0000-4000-8000-000000000001', 'thử thu hồi' from public.student_gifts g
join public.students r on r.id = g.recipient_id where r.client_id = 'minh' and g.amount = 2;
select test.eq((select client_event_id like 'gift-revoke-%' and amount = -2 from public.teacher_pending_gift_adjustments()), true, 'revoking an applied gift queues -2');
select test.throws($sql$insert into public.student_gift_revocations (gift_id, teacher_id) select gift_id, 'c0000000-0000-4000-8000-000000000001' from public.student_gift_revocations limit 1$sql$, '23505', 'cannot revoke twice');
reset role;
create temp table gid as select min(id) as id from public.student_gifts;
grant select on gid to authenticated;
select test.login('c0000000-0000-4000-8000-000000000002');
select test.throws(format($sql$insert into public.student_gift_revocations (gift_id, teacher_id) values (%s, 'c0000000-0000-4000-8000-000000000002')$sql$,
  (select id from gid)), null, 'other teacher cannot revoke');
select test.throws(format($sql$insert into public.student_gift_revocations (gift_id, teacher_id) values (%s, 'c0000000-0000-4000-8000-000000000001')$sql$,
  (select id from gid)), '42501', 'other teacher cannot revoke in the owner''s name');
reset role;
select test.throws($sql$update public.student_gifts set amount = 0$sql$, '42501', 'gifts are immutable even for admins');
select test.throws($sql$delete from public.student_gift_revocations$sql$, '42501', 'revocations are immutable even for admins');
-- Thu hồi một quà chưa cộng: không bao giờ được cộng. (Lan đã chạm giới hạn ngày nên dùng Phúc gửi.)
select test.login('c1000000-0000-4000-8000-000000000003');
select public.student_send_gift(test.sid('lan'), 1, 'rainbow');
select test.login('c0000000-0000-4000-8000-000000000001');
insert into public.student_gift_revocations (gift_id, teacher_id)
select g.id, 'c0000000-0000-4000-8000-000000000001' from public.student_gifts g join public.students r on r.id = g.recipient_id
where r.client_id = 'lan' and g.sticker_id = 'rainbow';
select test.eq((select count(*)::int from public.teacher_pending_gift_adjustments() where student_client_id = 'lan'), 0, 'revoked unapplied gift is never applied');
select test.login('c1000000-0000-4000-8000-000000000001');
select test.eq((select x->>'state' from jsonb_array_elements(public.student_social_overview()->'received') x where x->>'sticker_id' = 'rainbow'), 'revoked', 'recipient sees revoked state');

-- 11. Tài khoản khoá: không dùng được gì.
reset role;
select set_config('role', 'service_role', false);
update public.students set status = 'locked' where client_id = 'phuc' and teacher_id = 'c0000000-0000-4000-8000-000000000001';
reset role;
select test.login('c1000000-0000-4000-8000-000000000003');
select test.throws($sql$select public.student_social_overview()$sql$, '42501', 'locked student cannot open social');
select test.login('c1000000-0000-4000-8000-000000000001');
select test.eq((select count(*)::int from jsonb_array_elements(public.student_social_overview()->'friends') x where x->>'name' = 'Phúc'), 0, 'locked friend hidden');
select test.raises(format('select public.student_send_gift(%L, 0, %L)', test.sid('phuc'), 'star'), 'not_friend', 'cannot gift a locked friend');
reset role;
select set_config('role', 'service_role', false);
update public.students set status = 'active' where client_id = 'phuc' and teacher_id = 'c0000000-0000-4000-8000-000000000001';
reset role;

-- 12. Thôi làm bạn; giáo viên xoá quan hệ; tắt tính năng.
select test.login('c1000000-0000-4000-8000-000000000003');
select public.student_remove_friend(test.sid('lan'));
select test.raises(format('select public.student_send_gift(%L, 0, %L)', test.sid('lan'), 'star'), 'not_friend', 'no gifts after unfriending');
select test.login('c0000000-0000-4000-8000-000000000001');
select test.eq(test.affected($sql$delete from public.student_friendships$sql$), 1, 'teacher can remove friendships in own classes');
update public.classes set social_enabled = false where name = '8A';
select test.login('c1000000-0000-4000-8000-000000000001');
select test.eq(public.student_social_overview(), '{"enabled": false}'::jsonb, 'teacher can switch social off');

-- 13. Ẩn danh bị chặn; giáo viên (không phải học sinh) không dùng được hàm học sinh.
select test.as_anon();
select test.throws($sql$select public.student_social_overview()$sql$, '42501', 'anon blocked');
select test.throws($sql$select public.teacher_pending_gift_adjustments()$sql$, '42501', 'anon blocked from pending gifts');
select test.login('c0000000-0000-4000-8000-000000000001');
select test.throws($sql$select public.student_social_overview()$sql$, '42501', 'teacher is not a student');

-- 14. Xoá học sinh kéo theo quà/bạn bè (D12), không vướng chặn sửa/xoá.
select public.save_teacher_changes('{"deleted_student_client_ids":["minh"]}');
select test.eq((select count(*)::int from public.student_gifts g join ids on ids.id = g.recipient_id where ids.client_id = 'minh'), 0, 'deleting a student deletes their gifts');
reset role;

\echo 'ALL PHASE 6 DB TESTS PASSED'
