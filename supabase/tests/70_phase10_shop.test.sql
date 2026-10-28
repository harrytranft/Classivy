-- Test Phase 10B (Cửa hàng học sinh). Chạy bằng scripts/test-db.sh SAU các test trước (dùng lại test.* ở file 10 và test.raises ở file 50).

\set ON_ERROR_STOP 1
set client_min_messages = notice;
reset role;

insert into auth.users (id, email) values
  ('e0000000-0000-4000-8000-000000000001', 'tshop@test'),
  ('e0000000-0000-4000-8000-000000000002', 'tshop2@test');
insert into auth.users (id, email, raw_app_meta_data) values
  ('e1000000-0000-4000-8000-000000000001', 'an@s.test', '{"role":"student"}'),
  ('e1000000-0000-4000-8000-000000000002', 'binh@s.test', '{"role":"student"}'),
  ('e1000000-0000-4000-8000-000000000003', 'chi@s.test', '{"role":"student"}'),
  ('e1000000-0000-4000-8000-000000000004', 'dung@s.test', '{"role":"student"}');

select test.login('e0000000-0000-4000-8000-000000000001');
select public.save_teacher_changes($json${
  "students": [
    { "client_id": "an", "class_name": "9A", "name": "An", "gender": "Nam", "points": 100, "game_state": { "pet": { "instanceId": "pk-an", "dexId": 25, "name": "Pikachu", "skills": [], "accessories": [], "types": ["electric"] } } },
    { "client_id": "binh", "class_name": "9A", "name": "Bình", "gender": "Nam", "points": 5, "game_state": {} },
    { "client_id": "chi", "class_name": "9A", "name": "Chi", "gender": "Nữ", "points": 100, "game_state": {} },
    { "client_id": "ngoai", "class_name": "9A", "name": "Chưa có tài khoản", "gender": "Nữ", "points": 100, "game_state": {} }
  ]
}$json$::jsonb);
select test.login('e0000000-0000-4000-8000-000000000002');
select public.save_teacher_changes('{"students":[{"client_id":"dung","class_name":"9A","name":"Dũng","gender":"Nam","points":100,"game_state":{}}]}');
reset role;
select set_config('role', 'service_role', false);
update public.students set auth_user_id = 'e1000000-0000-4000-8000-000000000001' where client_id = 'an' and teacher_id = 'e0000000-0000-4000-8000-000000000001';
update public.students set auth_user_id = 'e1000000-0000-4000-8000-000000000002' where client_id = 'binh' and teacher_id = 'e0000000-0000-4000-8000-000000000001';
update public.students set auth_user_id = 'e1000000-0000-4000-8000-000000000003' where client_id = 'chi' and teacher_id = 'e0000000-0000-4000-8000-000000000001';
update public.students set auth_user_id = 'e1000000-0000-4000-8000-000000000004' where client_id = 'dung' and teacher_id = 'e0000000-0000-4000-8000-000000000002';
reset role;

-- 0. Dữ liệu tham chiếu: bảng đủ, chỉ API không đọc/ghi trực tiếp được.
select test.eq((select count(*)::int from public.shop_egg_pool), 1025, 'egg pool has 1025 dex ids');
select test.eq((select count(*)::int from public.shop_egg_pool where is_special), 98, 'egg pool has 98 special');
select test.eq((select count(*)::int from public.shop_default_skills), 22, '22 default skills');
select test.eq(has_table_privilege('authenticated', 'public.shop_egg_pool', 'select'), false, 'authenticated cannot read egg pool');
select test.eq(has_table_privilege('authenticated', 'public.shop_default_skills', 'select'), false, 'authenticated cannot read default skills table');
select test.eq(has_function_privilege('anon', 'public.student_shop_buy_egg(text)', 'execute'), false, 'anon cannot buy');
select test.eq(has_function_privilege('authenticated', 'public.shop_commit(public.students,integer,jsonb,text)', 'execute'), false, 'shop_commit is internal');
select test.eq(has_function_privilege('authenticated', 'public.shop_current_student(boolean)', 'execute'), false, 'shop_current_student is internal');

-- 1. Mặc định ĐÓNG: xem được, mua không được.
select test.login('e1000000-0000-4000-8000-000000000001');
select test.eq(public.student_shop_overview()->>'enabled', 'false', 'shop is off by default');
select test.eq(public.student_shop_overview()->'skills', '[]'::jsonb, 'no catalog while closed');
select test.raises($sql$select public.student_shop_buy_egg('normal')$sql$, 'shop_closed', 'cannot buy egg while closed');
select test.raises($sql$select public.student_shop_buy_skill('sk_emperor')$sql$, 'shop_closed', 'cannot buy skill while closed');
select test.raises($sql$select public.student_shop_hatch_egg()$sql$, 'shop_closed', 'cannot hatch while closed');
select test.raises($sql$select public.student_set_companion('pk-an')$sql$, 'shop_closed', 'cannot swap while closed');
select test.eq(test.affected($sql$update public.classes set student_shop_enabled = true$sql$), 0, 'student cannot open shop');

-- 2. Giáo viên bật cho lớp mình; giáo viên khác không đụng được.
select test.login('e0000000-0000-4000-8000-000000000002');
select test.eq(test.affected($sql$update public.classes set student_shop_enabled = true where teacher_id = 'e0000000-0000-4000-8000-000000000001'$sql$), 0, 'other teacher cannot open shop');
select test.login('e0000000-0000-4000-8000-000000000001');
select test.eq(test.affected($sql$update public.classes set student_shop_enabled = true where name = '9A'$sql$), 1, 'teacher opens own class');

-- 3. Mua trứng: trừ điểm, ghi sổ, cất bạn đồng hành, tăng revision.
select test.login('e1000000-0000-4000-8000-000000000001');
select test.eq(public.student_shop_overview()->>'enabled', 'true', 'shop open');
select test.eq(jsonb_array_length(public.student_shop_overview()->'skills'), 22, 'default catalog of 22 skills');
select test.raises($sql$select public.student_shop_buy_egg('legendary')$sql$, 'invalid_item', 'legendary egg not for sale');
select test.eq((public.student_shop_buy_egg('normal')->>'points')::int, 90, 'normal egg costs 10');
reset role;
select test.eq((select game_state->'egg'->>'status' from public.students where client_id = 'an'), 'egg', 'egg incubating');
select test.eq((select game_state->'egg'->>'kind' from public.students where client_id = 'an'), 'normal', 'normal kind');
select test.eq((select game_state->'egg'->>'requiredProgress' from public.students where client_id = 'an'), '10', 'normal needs 10');
select test.eq((select game_state->'pet' is null from public.students where client_id = 'an'), true, 'companion put away during incubation');
select test.eq((select game_state->'pets'->0->>'instanceId' from public.students where client_id = 'an'), 'pk-an', 'companion kept in collection');
select test.eq((select count(*)::int from public.point_ledger l join public.students s on s.id = l.student_id where s.client_id = 'an' and l.source = 'student_shop' and l.amount = -10), 1, 'ledger row for egg');
select test.eq((select revision from public.students where client_id = 'an'), 1, 'revision bumped (teacher app will see it)');
select test.login('e1000000-0000-4000-8000-000000000001');
select test.raises($sql$select public.student_shop_buy_egg('special')$sql$, 'egg_in_progress', 'cannot buy a second egg');
select test.raises($sql$select public.student_set_companion('pk-an')$sql$, 'egg_in_progress', 'cannot swap while egg incubating');
select test.raises($sql$select public.student_shop_buy_skill('sk_emperor')$sql$, 'no_companion', 'skill needs a companion');

-- 4. Nở nhanh: chi phí = phần còn thiếu, trứng thành thú đồng hành mới.
select test.eq((public.student_shop_hatch_egg()->>'points')::int, 80, 'quick hatch costs 10 remaining (90 -> 80)');
reset role;
select test.eq((select game_state->'egg'->>'status' from public.students where client_id = 'an'), 'hatched', 'egg hatched');
select test.eq((select game_state->'pet'->>'instanceId' is not null from public.students where client_id = 'an'), true, 'new companion set');
select test.eq((select jsonb_array_length(game_state->'pets') from public.students where client_id = 'an'), 2, 'collection has old + new');
select test.eq((select game_state->'pokemonProgress'->>'hatchedEggs' from public.students where client_id = 'an'), '1', 'hatchedEggs counted');
select test.eq((select game_state->'adventureJournal'->0->>'type' in ('pokemon-hatched','shiny-acquired') from public.students where client_id = 'an'), true, 'journal entry added');
select test.eq((select count(*)::int from public.point_ledger l join public.students s on s.id = l.student_id where s.client_id = 'an' and l.source = 'student_shop'), 2, 'two ledger rows');
select test.login('e1000000-0000-4000-8000-000000000001');
select test.raises($sql$select public.student_shop_hatch_egg()$sql$, 'no_egg', 'nothing to hatch twice');

-- 5. Mua kỹ năng.
select test.eq((public.student_shop_buy_skill('sk_time_warp')->>'points')::int, 60, 'skill costs its price (20)');
select test.raises($sql$select public.student_shop_buy_skill('sk_time_warp')$sql$, 'already_owned', 'cannot buy twice');
select test.raises($sql$select public.student_shop_buy_skill('khong_co')$sql$, 'invalid_item', 'unknown skill');
reset role;
select test.eq((select game_state->'pet'->'skills' from public.students where client_id = 'an'), '["sk_time_warp"]'::jsonb, 'skill on companion');
select test.eq((select game_state->'pets'->0->'skills' from public.students where client_id = 'an'), '["sk_time_warp"]'::jsonb, 'skill synced in collection');

-- 6. Đổi bạn đồng hành / hỗ trợ.
select test.login('e1000000-0000-4000-8000-000000000001');
select test.raises($sql$select public.student_set_companion('khong-co')$sql$, 'invalid_item', 'unknown pet');
select test.raises($sql$select public.student_set_support('khong-co')$sql$, 'invalid_item', 'unknown support');
select public.student_set_support('pk-an');
reset role;
select test.eq((select game_state->>'supportPetInstanceId' from public.students where client_id = 'an'), 'pk-an', 'support set');
select test.login('e1000000-0000-4000-8000-000000000001');
select public.student_set_companion('pk-an');
reset role;
select test.eq((select game_state->'pet'->>'instanceId' from public.students where client_id = 'an'), 'pk-an', 'swapped back to Pikachu');
select test.eq((select game_state->>'supportPetInstanceId' is null from public.students where client_id = 'an'), true, 'support cleared when chosen as companion');
select test.eq((select game_state->'pets' @> '[{"skills":["sk_time_warp"]}]' from public.students where client_id = 'an'), true, 'previous companion kept its skills');
select test.eq((select points from public.students where client_id = 'an'), 60, 'swapping is free');

-- 7. Không đủ điểm.
select test.login('e1000000-0000-4000-8000-000000000002');
select test.raises($sql$select public.student_shop_buy_egg('normal')$sql$, 'not_enough_points', 'Bình has 5 points');
reset role;
select test.eq((select points from public.students where client_id = 'binh'), 5, 'points unchanged on failure');
select test.eq((select count(*)::int from public.point_ledger l join public.students s on s.id = l.student_id where s.client_id = 'binh'), 0, 'no ledger on failure');

-- 8. Kỹ năng riêng của giáo viên thay bộ mặc định; lớp của giáo viên khác không bị ảnh hưởng (đang đóng).
select test.login('e0000000-0000-4000-8000-000000000001');
select test.eq(test.affected($sql$insert into public.user_settings (user_id, pet_skills) values ('e0000000-0000-4000-8000-000000000001', '[{"id":"sk_custom","name":"Riêng","icon":"⭐","cost":7,"description":"x"}]'::jsonb) on conflict (user_id) do update set pet_skills = excluded.pet_skills$sql$), 1, 'teacher sets custom skills');
select test.login('e1000000-0000-4000-8000-000000000003');
select test.eq(jsonb_array_length(public.student_shop_overview()->'skills'), 1, 'custom catalog replaces default');
select test.eq((public.student_shop_buy_egg('special')->>'points')::int, 80, 'special egg costs 20');
select test.login('e1000000-0000-4000-8000-000000000004');
select test.eq(public.student_shop_overview()->>'enabled', 'false', 'other teacher class stays closed');
select test.raises($sql$select public.student_shop_buy_egg('normal')$sql$, 'shop_closed', 'other teacher class cannot buy');

-- 9. Người không phải học sinh hoạt động không dùng được.
select test.login('e0000000-0000-4000-8000-000000000001');
select test.throws($sql$select public.student_shop_overview()$sql$, '42501', 'teacher cannot use student shop');
select test.throws($sql$select public.student_shop_buy_egg('normal')$sql$, '42501', 'teacher cannot buy');
reset role;
select set_config('role', 'anon', false);
select test.throws($sql$select public.student_shop_overview()$sql$, '42501', 'anon cannot call overview');
reset role;
-- Học sinh bị khoá không mua được.
update public.students set status = 'locked' where client_id = 'chi';
select test.login('e1000000-0000-4000-8000-000000000003');
select test.raises($sql$select public.student_shop_buy_skill('sk_custom')$sql$, 'not_active_student', 'locked student cannot buy');
reset role;
