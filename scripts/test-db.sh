#!/usr/bin/env bash
# Test migration + RLS của Supabase trên PostgreSQL cục bộ (không chạm Supabase thật).
# Cần: psql và một PostgreSQL >= 15 đang chạy; kết nối qua biến chuẩn PGHOST/PGPORT/PGUSER/PGPASSWORD.
# Dùng: npm run test:db   (tạo lại database tạm classivy_test mỗi lần chạy)
set -euo pipefail
cd "$(dirname "$0")/.."

DB="${CLASSIVY_TEST_DB:-classivy_test}"
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
PSQL=(psql -X -q -v ON_ERROR_STOP=1)
MIGRATION=supabase/migrations/20261027120000_phase3_data_model.sql
ROLLBACK=supabase/rollback/20261027120000_phase3_data_model_down.sql
MIGRATION4=supabase/migrations/20261029100000_phase4_student_accounts.sql
ROLLBACK4=supabase/rollback/20261029100000_phase4_student_accounts_down.sql
MIGRATION5=supabase/migrations/20261030100000_phase5_student_portal.sql
ROLLBACK5=supabase/rollback/20261030100000_phase5_student_portal_down.sql
MIGRATION_ROLE=supabase/migrations/20261030110000_sync_profile_role.sql
MIGRATION6=supabase/migrations/20261031100000_phase6_social.sql
ROLLBACK6=supabase/rollback/20261031100000_phase6_social_down.sql
MIGRATION7=supabase/migrations/20261101100000_phase7_hardening.sql
DROP_LEGACY=supabase/migrations/20261101110000_drop_legacy_data.sql
DROP_LEGACY_DOWN=supabase/rollback/20261101110000_drop_legacy_data_down.sql
ROLLBACK7=supabase/rollback/20261101100000_phase7_hardening_down.sql
MIGRATION10=supabase/migrations/20261102100000_phase10_student_shop.sql
ROLLBACK10=supabase/rollback/20261102100000_phase10_student_shop_down.sql
MIGRATION12=supabase/migrations/20261103100000_phase12_student_fusion.sql
ROLLBACK12=supabase/rollback/20261103100000_phase12_student_fusion_down.sql
MIGRATION13=supabase/migrations/20261104100000_phase13_classroom_settings.sql
ROLLBACK13=supabase/rollback/20261104100000_phase13_classroom_settings_down.sql
ROLLBACK_ROLE=supabase/rollback/20261030110000_sync_profile_role_down.sql

run() { "${PSQL[@]}" -d "$DB" "$@"; }

for MODE in off on; do
echo "######## Dự án Supabase $( [ "$MODE" = on ] && echo 'CŨ (tự cấp quyền)' || echo 'MỚI (không tự cấp quyền)' )"
echo "== Tạo database $DB"
"${PSQL[@]}" -d postgres -c "drop database if exists $DB" -c "create database $DB"

echo "== Giả lập Supabase + schema hiện tại (supabase-schema.sql)"
run -v legacy_grants=$MODE -f supabase/tests/00_supabase_stub.sql
run -f supabase-schema.sql
# Như dự án Classivy gốc: còn bảng students cũ của Imperial School (khác cấu trúc), có khoá chính và 1 dòng.
run -c "create table public.students (id text primary key, name text, gender text, points integer, class_name text, custom_avatar text, pet jsonb, accessories jsonb, history jsonb, ludo_tile integer, ludo_steps integer, created_at timestamptz default now())" \
    -c "insert into public.students (id, name) values ('imperial-1', 'Học sinh cũ')"
# Hai bảng cũ khác của dự án gốc, mở cho API như Supabase cũ (để kiểm tra migration khoá chúng).
run -c "create table public.app_state (id text primary key, data jsonb)" \
    -c "create table public.users (id text primary key, email text)" \
    -c "grant all on public.app_state, public.users to anon, authenticated"
run -c "insert into auth.users (id, email) values ('dddddddd-0000-4000-8000-000000000004', 'legacy@test')" \
    -c "insert into public.user_settings (user_id, students) values ('dddddddd-0000-4000-8000-000000000004', '[{\"id\":\"old\"}]')"

echo "== Migration Phase 3 (chạy 2 lần để chắc chắn chạy lại không lỗi)"
run -f "$MIGRATION"
run -f "$MIGRATION"
run -c "do \$\$ begin
  if (select students::text from public.user_settings where user_id = 'dddddddd-0000-4000-8000-000000000004') <> '[{\"id\": \"old\"}]'
     or (select data_model_version from public.user_settings where user_id = 'dddddddd-0000-4000-8000-000000000004') <> 1 then
    raise exception 'FAIL: legacy data changed by migration';
  end if; end \$\$"

run -c "do \$\$ begin
  if (select name from public.students_imperial_old where id = 'imperial-1') is distinct from 'Học sinh cũ' then
    raise exception 'FAIL: old Imperial students table not preserved'; end if;
  if not (select relrowsecurity from pg_class where oid = 'public.students_imperial_old'::regclass) then
    raise exception 'FAIL: RLS not enabled on old table'; end if;
  if has_table_privilege('authenticated', 'public.students_imperial_old', 'select') then
    raise exception 'FAIL: old table still readable by authenticated'; end if; end \$\$"
echo "== Đổi tên hồ sơ mặc định cũ (chạy 2 lần)"
run -c "insert into auth.users (id, email) values ('eeeeeeee-0000-4000-8000-000000000005', 'old@test'), ('ffffffff-0000-4000-8000-000000000006', 'named@test')" \
    -c "update public.profiles set display_name = 'Học sĩ triều đình' where email = 'old@test'" \
    -c "update public.profiles set display_name = 'Thầy Harry' where email = 'named@test'"
run -f supabase/migrations/20261028130000_rename_legacy_display_names.sql
run -f supabase/migrations/20261028130000_rename_legacy_display_names.sql
run -c "do \$\$ begin
  if (select display_name from public.profiles where email = 'old@test') <> 'Trainer' then raise exception 'FAIL: legacy name not renamed'; end if;
  if (select display_name from public.profiles where email = 'named@test') <> 'Thầy Harry' then raise exception 'FAIL: custom name changed'; end if;
  delete from auth.users where email in ('old@test', 'named@test'); end \$\$"

echo "== Khoá bảng cũ app_state/users (chạy 2 lần)"
run -f supabase/migrations/20261028120000_lock_legacy_tables.sql
run -f supabase/migrations/20261028120000_lock_legacy_tables.sql
run -c "do \$\$ declare t text; begin
  foreach t in array array['app_state', 'users'] loop
    if not (select relrowsecurity from pg_class where oid = format('public.%I', t)::regclass) then
      raise exception 'FAIL: RLS not enabled on %', t; end if;
    if has_table_privilege('anon', format('public.%I', t), 'select') or has_table_privilege('authenticated', format('public.%I', t), 'insert') then
      raise exception 'FAIL: % still reachable by API roles', t; end if;
  end loop; end \$\$"
echo "== Test RLS"
run -o /dev/null -f supabase/tests/10_phase3_rls.test.sql

echo "== Migration Phase 4 (chạy 2 lần) + test tài khoản học sinh"
run -f "$MIGRATION4"
run -f "$MIGRATION4"
run -o /dev/null -f supabase/tests/20_phase4_accounts.test.sql

echo "== Migration Phase 5 (chạy 2 lần) + test cổng học sinh"
run -f "$MIGRATION5"
run -f "$MIGRATION5"
run -o /dev/null -f supabase/tests/30_phase5_portal.test.sql

echo "== Hoàn tác Phase 5, chạy lại, hoàn tác"
run -f "$ROLLBACK5"
run -c "do \$\$ begin
  if to_regprocedure('public.get_my_student_profile()') is not null then raise exception 'FAIL: phase 5 rollback left function'; end if; end \$\$"
run -f "$MIGRATION5"
run -f "$ROLLBACK5"

echo "== Đồng bộ profiles.role theo app_metadata (chạy 2 lần) + test"
# Tái hiện lỗi thật: Supabase tạo người dùng trước, gắn role học sinh sau => hồ sơ bị ghi 'teacher'.
run -c "insert into auth.users (id, email) values ('bbbbbbbb-0000-4000-8000-0000000000b1', 'stale@students.test')" \
    -c "update auth.users set raw_app_meta_data = '{\"role\":\"student\"}' where id = 'bbbbbbbb-0000-4000-8000-0000000000b1'"
run -f "$MIGRATION_ROLE"
run -f "$MIGRATION_ROLE"
run -o /dev/null -f supabase/tests/40_sync_profile_role.test.sql
run -f "$ROLLBACK_ROLE"
run -c "do \$\$ begin
  if to_regprocedure('public.sync_profile_role_from_app_metadata()') is not null then raise exception 'FAIL: role sync rollback left function'; end if; end \$\$"
run -f "$MIGRATION_ROLE"
run -f "$ROLLBACK_ROLE"

echo "== Migration Phase 6 (chạy 2 lần) + test bạn bè, quà, ví điểm tặng"
run -f "$MIGRATION5"
run -f "$MIGRATION_ROLE"
run -f "$MIGRATION6"
run -f "$MIGRATION6"
run -o /dev/null -f supabase/tests/50_phase6_social.test.sql
run -f "$ROLLBACK6"
run -c "do \$\$ begin
  if to_regclass('public.student_gifts') is not null or to_regclass('public.student_friendships') is not null then raise exception 'FAIL: phase 6 rollback left tables'; end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'classes' and column_name = 'social_enabled') then
    raise exception 'FAIL: phase 6 rollback left columns'; end if; end \$\$"
run -f "$MIGRATION6"

echo "== Migration Phase 7 hardening (chạy 2 lần) + test (Phase 3-6 chạy lại với chốt mới)"
run -f "$MIGRATION7"
run -f "$MIGRATION7"
run -o /dev/null -f supabase/tests/60_phase7_hardening.test.sql

echo "== Migration Phase 10B Cửa hàng học sinh (chạy 2 lần) + test, hoàn tác, chạy lại"
run -f "$MIGRATION10"
run -f "$MIGRATION10"
run -o /dev/null -f supabase/tests/70_phase10_shop.test.sql
run -f "$ROLLBACK10"
run -c "do \$\$ begin
  if to_regprocedure('public.student_shop_buy_egg(text)') is not null or to_regclass('public.shop_egg_pool') is not null then raise exception 'FAIL: phase 10B rollback left objects'; end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'classes' and column_name = 'student_shop_enabled') then
    raise exception 'FAIL: phase 10B rollback left column'; end if; end \$\$"
run -f "$MIGRATION10"

echo "== Migration Phase 12C Hợp nhất của học sinh (chạy 2 lần) + test, hoàn tác, chạy lại"
run -f "$MIGRATION12"
run -f "$MIGRATION12"
run -o /dev/null -f supabase/tests/80_phase12_fusion.test.sql
run -f "$ROLLBACK12"
run -c "do \$\$ begin
  if to_regprocedure('public.student_fuse_pets(text[])') is not null or to_regprocedure('public.shop_pet_level(jsonb)') is not null then raise exception 'FAIL: phase 12C rollback left functions'; end if; end \$\$"
run -f "$MIGRATION12"

echo "== Migration Phase 13C cột classroom_settings (chạy 2 lần) + test, hoàn tác, chạy lại"
run -c "do \$\$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_settings' and column_name = 'classroom_settings') then
    raise exception 'FAIL: classroom_settings exists before phase 13C'; end if; end \$\$"
run -f "$MIGRATION13"
run -f "$MIGRATION13"
run -o /dev/null -f supabase/tests/90_phase13_classroom_settings.test.sql
run -f "$ROLLBACK13"
run -c "do \$\$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_settings' and column_name = 'classroom_settings') then
    raise exception 'FAIL: phase 13C rollback left column'; end if;
  if (select count(*) from public.user_settings where user_id = 'dddddddd-0000-4000-8000-000000000004') <> 1 then
    raise exception 'FAIL: phase 13C rollback lost settings rows'; end if; end \$\$"
run -f "$ROLLBACK13"
run -f "$MIGRATION13"

run -f "$ROLLBACK7"
run -c "do \$\$ begin
  if to_regprocedure('public.save_teacher_changes_v2(jsonb)') is not null or to_regprocedure('public.is_teacher()') is not null then raise exception 'FAIL: phase 7 rollback left functions'; end if; end \$\$"
run -f "$MIGRATION7"
run -f "$ROLLBACK13"
run -f "$ROLLBACK12"
run -f "$ROLLBACK10"
run -f "$ROLLBACK7"
run -f "$ROLLBACK6"
run -f "$ROLLBACK_ROLE"
run -f "$ROLLBACK5"

echo "== Hoàn tác Phase 4, chạy lại, rồi hoàn tác để thử hoàn tác Phase 3"
run -f "$ROLLBACK4"
run -c "do \$\$ begin
  if to_regclass('public.teacher_audit_log') is not null then raise exception 'FAIL: phase 4 rollback left audit table'; end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'students' and column_name in ('username', 'must_change_password')) then
    raise exception 'FAIL: phase 4 rollback left columns'; end if; end \$\$"
run -f "$MIGRATION4"
run -f "$ROLLBACK4"

echo "== Hoàn tác rồi chạy lại migration"
run -f "$ROLLBACK"
run -c "do \$\$ begin
  if to_regclass('public.classes') is not null then raise exception 'FAIL: rollback left tables'; end if;
  if (select name from public.students where id = 'imperial-1') is distinct from 'Học sinh cũ' then
    raise exception 'FAIL: rollback did not restore old students table'; end if;
  if (select students::text from public.user_settings where user_id = 'dddddddd-0000-4000-8000-000000000004') <> '[{\"id\": \"old\"}]' then
    raise exception 'FAIL: rollback lost legacy data'; end if; end \$\$"
run -f "$MIGRATION"

echo "== Xoá dữ liệu cũ (Phase 7): chốt an toàn khi còn giáo viên chưa nâng cấp, rồi xoá, chạy 2 lần"
if run -f "$DROP_LEGACY" 2>/dev/null; then echo "FAIL: drop_legacy_data ran while a teacher still had legacy students"; exit 1; fi
run -c "do \$\$ begin
  if (select jsonb_array_length(students) from public.user_settings where user_id = 'dddddddd-0000-4000-8000-000000000004') <> 1 then
    raise exception 'FAIL: guard did not keep legacy data'; end if; end \$\$"
run -c "update public.user_settings set data_model_version = 2 where user_id = 'dddddddd-0000-4000-8000-000000000004'"
run -f "$DROP_LEGACY"
run -f "$DROP_LEGACY"
run -c "do \$\$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_settings' and column_name in ('students', 'boss_states_by_class')) then
    raise exception 'FAIL: legacy columns still there'; end if;
  if to_regclass('public.students_imperial_old') is not null or to_regclass('public.app_state') is not null or to_regclass('public.users') is not null then
    raise exception 'FAIL: legacy tables still there'; end if;
  if (select count(*) from public.user_settings) = 0 then raise exception 'FAIL: settings rows lost'; end if; end \$\$"
run -f "$DROP_LEGACY_DOWN"
run -c "do \$\$ begin
  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'user_settings' and column_name in ('students', 'boss_states_by_class')) <> 2 then
    raise exception 'FAIL: drop_legacy rollback did not recreate columns'; end if; end \$\$"

"${PSQL[@]}" -d postgres -c "drop database $DB"
done
echo "== DB TESTS OK"
