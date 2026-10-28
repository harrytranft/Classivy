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

"${PSQL[@]}" -d postgres -c "drop database $DB"
done
echo "== DB TESTS OK"
