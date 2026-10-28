-- Giả lập phần tối thiểu của Supabase để chạy migration và test RLS trên PostgreSQL thường.
-- KHÔNG chạy file này trên Supabase thật.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

create table if not exists auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  raw_app_meta_data jsonb not null default '{}'::jsonb
);

-- Như Supabase: id người dùng lấy từ JWT của request.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;

grant usage on schema public to anon, authenticated, service_role;
-- Dự án Supabase cũ tự cấp mọi quyền trên bảng/hàm mới trong public cho các vai trò API (RLS là lớp chặn).
-- Dự án mới tạo (vd classivy-dev, 2026-10) KHÔNG tự cấp: SQL phải tự GRANT. scripts/test-db.sh chạy cả hai kiểu
-- (biến psql legacy_grants = on/off) để chắc chắn schema + migration chạy được ở cả dự án cũ lẫn mới.
\if :legacy_grants
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
\else
alter default privileges in schema public revoke execute on functions from public;
\endif
