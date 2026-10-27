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

run() { "${PSQL[@]}" -d "$DB" "$@"; }

echo "== Tạo database $DB"
"${PSQL[@]}" -d postgres -c "drop database if exists $DB" -c "create database $DB"

echo "== Giả lập Supabase + schema hiện tại (supabase-schema.sql)"
run -f supabase/tests/00_supabase_stub.sql
run -f supabase-schema.sql
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

echo "== Test RLS"
run -o /dev/null -f supabase/tests/10_phase3_rls.test.sql

echo "== Hoàn tác rồi chạy lại migration"
run -f "$ROLLBACK"
run -c "do \$\$ begin
  if to_regclass('public.students') is not null then raise exception 'FAIL: rollback left tables'; end if;
  if (select students::text from public.user_settings where user_id = 'dddddddd-0000-4000-8000-000000000004') <> '[{\"id\": \"old\"}]' then
    raise exception 'FAIL: rollback lost legacy data'; end if; end \$\$"
run -f "$MIGRATION"

"${PSQL[@]}" -d postgres -c "drop database $DB"
echo "== DB TESTS OK"
