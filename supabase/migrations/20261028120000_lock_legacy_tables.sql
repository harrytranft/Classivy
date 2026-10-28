-- Khoá hai bảng cũ thời Imperial School còn trong dự án Classivy gốc: app_state, users (trống, app không dùng).
-- Harry duyệt 2026-10-28 (Đề xuất phát sinh trong PLAN.md). KHÔNG xoá: bật RLS không kèm policy và thu quyền API,
-- nên không ai đọc/ghi qua app hay khoá anon được nữa. Dự án không có hai bảng này (vd classivy-dev): bỏ qua.
-- Chạy lại được. Hoàn tác: supabase/rollback/20261028120000_lock_legacy_tables_down.sql

begin;

do $$
declare
  t text;
begin
  foreach t in array array['app_state', 'users'] loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on public.%I from anon, authenticated', t);
      raise notice 'Đã khoá bảng public.%', t;
    end if;
  end loop;
end $$;

commit;
