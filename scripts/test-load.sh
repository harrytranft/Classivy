#!/usr/bin/env bash
# Kiểm thử tải nhẹ (Phase 7): dựng DB tạm với dữ liệu cỡ lớp thật, đo thời gian các truy vấn chính và dung lượng.
# Cần PostgreSQL cục bộ như npm run test:db. KHÔNG chạm Supabase thật.
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${CLASSIVY_LOAD_DB:-classivy_load}"
export PGOPTIONS="-c client_min_messages=warning"
PSQL=(psql -X -q -v ON_ERROR_STOP=1)
"${PSQL[@]}" -d postgres -c "drop database if exists $DB" -c "create database $DB"
run() { "${PSQL[@]}" -d "$DB" "$@" >/dev/null; }
run -v legacy_grants=off -f supabase/tests/00_supabase_stub.sql
run -f supabase-schema.sql
for f in supabase/migrations/*.sql; do
  case "$f" in *drop_legacy_data*) continue ;; esac   # cần dữ liệu đã nâng cấp; không ảnh hưởng hiệu năng
  run -f "$f"
done
PGOPTIONS="-c client_min_messages=notice" psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/load/seed_and_measure.sql 2>&1 | sed -e 's/^psql:[^ ]* NOTICE:  /  /'
"${PSQL[@]}" -d postgres -c "drop database $DB"
echo "== LOAD TEST OK"
