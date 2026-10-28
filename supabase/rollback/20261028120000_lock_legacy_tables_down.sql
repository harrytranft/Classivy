-- Hoàn tác 20261028120000_lock_legacy_tables.sql: mở lại hai bảng cũ như trước (không có RLS, quyền API đầy đủ).
-- Chỉ chạy khi thật cần: trạng thái này cho phép ai có khoá anon đọc/ghi hai bảng.

begin;

do $$
declare
  t text;
begin
  foreach t in array array['app_state', 'users'] loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I disable row level security', t);
      execute format('grant all on public.%I to anon, authenticated', t);
    end if;
  end loop;
end $$;

commit;
