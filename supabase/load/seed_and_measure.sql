-- Kiểm thử tải nhẹ (Phase 7, task 7.2) trên PostgreSQL cục bộ. KHÔNG chạy trên Supabase thật.
-- Quy mô giả định (lớn hơn thực tế của Harry để có dư địa): 1 giáo viên, 10 lớp x 35 học sinh = 350 em có tài khoản,
-- game_state ~4 KB/em, 200 dòng sổ điểm/em (70.000 dòng), 5.000 quà, mỗi em ~6 bạn.
\set ON_ERROR_STOP 1
set client_min_messages = notice;

insert into auth.users (id, email) values ('e0000000-0000-4000-8000-000000000001', 'load-teacher@test');
insert into public.classes (teacher_id, name, social_enabled)
select 'e0000000-0000-4000-8000-000000000001', 'L' || c, true from generate_series(1, 10) c;

insert into auth.users (id, email, raw_app_meta_data)
select ('e1000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid, 's' || i || '@load.test', '{"role":"student"}'
from generate_series(1, 350) i;

insert into public.students (teacher_id, class_id, client_id, name, gender, points, game_state, auth_user_id)
select 'e0000000-0000-4000-8000-000000000001',
       (select id from public.classes where name = 'L' || (1 + (i - 1) / 35)),
       'stu-' || i, 'Học sinh ' || i, case when i % 2 = 0 then 'Nam' else 'Nữ' end, i % 200,
       jsonb_build_object('pet', jsonb_build_object('dexId', 1 + i % 150, 'name', 'Pet', 'types', '["grass"]'::jsonb, 'accessories', '[]'::jsonb, 'skills', '[]'::jsonb),
                          'trainerProgress', jsonb_build_object('level', 1 + i % 20, 'xp', 5, 'totalXp', 500),
                          'adventureJournal', (select jsonb_agg(jsonb_build_object('id', j, 'text', repeat('x', 60))) from generate_series(1, 50) j)),
       ('e1000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid
from generate_series(1, 350) i;

insert into public.point_ledger (teacher_id, student_id, amount, reason, client_event_id, occurred_at, created_by)
select s.teacher_id, s.id, (g % 5) - 1, 'Điểm thưởng ' || g, 'ev-' || g, now() - (g || ' minutes')::interval, s.teacher_id
from public.students s cross join generate_series(1, 200) g
where s.teacher_id = 'e0000000-0000-4000-8000-000000000001';

insert into public.student_friendships (teacher_id, class_id, requester_id, addressee_id, status)
select a.teacher_id, a.class_id, a.id, b.id, 'accepted'
from public.students a join public.students b on b.class_id = a.class_id and b.client_id > a.client_id
where a.teacher_id = 'e0000000-0000-4000-8000-000000000001'
  and (substring(b.client_id from 5)::int - substring(a.client_id from 5)::int) between 1 and 3;

insert into public.student_gifts (teacher_id, class_id, sender_id, recipient_id, amount, sticker_id, week_key, created_at)
select f.teacher_id, f.class_id, f.requester_id, f.addressee_id, g % 3, 'star', public.social_week_key(), now() - (g || ' hours')::interval
from public.student_friendships f cross join generate_series(1, 6) g;
analyze;

create or replace function pg_temp.measure(p_label text, p_sql text, p_role text, p_uid uuid, p_limit_ms numeric)
returns void language plpgsql as $$
declare t0 timestamptz; ms numeric; i int;
begin
  perform set_config('role', p_role, true);
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
  execute p_sql; -- làm nóng
  t0 := clock_timestamp();
  for i in 1..5 loop execute p_sql; end loop;
  ms := round(extract(epoch from clock_timestamp() - t0) * 1000 / 5, 1);
  perform set_config('role', 'postgres', true);
  raise notice '%: % ms', rpad(p_label, 48), ms;
  if ms > p_limit_ms then raise exception 'FAIL: % took % ms (limit % ms)', p_label, ms, p_limit_ms; end if;
end $$;

-- Kiểm tra truy vấn đo thật sự trả dữ liệu (không đo nhầm truy vấn rỗng do sai quyền).
do $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', 'e0000000-0000-4000-8000-000000000001', true);
  if (select count(*) from public.students) <> 350 then raise exception 'FAIL: teacher should see 350 students'; end if;
  if (select count(*) from public.student_recent_history) <> 350 * 50 then raise exception 'FAIL: history view should return 50 rows per student'; end if;
  perform set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000010', true);
  if public.get_my_student_profile()->>'status' <> 'active' then raise exception 'FAIL: student profile not active'; end if;
  if jsonb_array_length(public.student_social_overview()->'friends') = 0 then raise exception 'FAIL: student should have friends'; end if;
  perform set_config('role', 'postgres', true);
end $$;

begin;
select null from pg_temp.measure('Giáo viên tải danh sách học sinh (350 em)', 'select count(*) from (select client_id, game_state from public.students) x', 'authenticated', 'e0000000-0000-4000-8000-000000000001', 300);
select null from pg_temp.measure('Giáo viên tải 50 dòng lịch sử/em (view)', 'select count(*) from public.student_recent_history', 'authenticated', 'e0000000-0000-4000-8000-000000000001', 1500);
select null from pg_temp.measure('Giáo viên kiểm hàng chờ điểm tặng', 'select count(*) from public.teacher_pending_gift_adjustments()', 'authenticated', 'e0000000-0000-4000-8000-000000000001', 300);
select null from pg_temp.measure('Giáo viên lưu 1 em (v2, có kiểm phiên bản)', $q$select public.save_teacher_changes_v2(jsonb_build_object('students', jsonb_build_array(jsonb_build_object('client_id','stu-7','class_name','L1','name','Học sinh 7','gender','Nữ','points',(random()*100)::int,'game_state','{}'::jsonb)), 'history', jsonb_build_array(jsonb_build_object('student_client_id','stu-7','client_event_id','load-'||clock_timestamp(),'amount',1,'reason','x','occurred_at_ms',1700000000000))))$q$, 'authenticated', 'e0000000-0000-4000-8000-000000000001', 200);
select null from pg_temp.measure('Học sinh mở hồ sơ', 'select public.get_my_student_profile()', 'authenticated', 'e1000000-0000-4000-8000-000000000010', 100);
select null from pg_temp.measure('Học sinh mở bạn bè & quà', 'select public.student_social_overview()', 'authenticated', 'e1000000-0000-4000-8000-000000000010', 150);
commit;

select rpad(relname, 30) as bang, pg_size_pretty(pg_total_relation_size(c.oid)) as dung_luong
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' order by pg_total_relation_size(c.oid) desc limit 6;
select pg_size_pretty(pg_database_size(current_database())) as tong_dung_luong_db;
