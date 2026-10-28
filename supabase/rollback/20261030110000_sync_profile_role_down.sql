-- Hoàn tác 20261030110000_sync_profile_role.sql: gỡ trigger đồng bộ vai trò.
-- Không đổi lại profiles.role của các tài khoản đã sửa (giữ 'student' cho học sinh là đúng).

begin;

drop trigger if exists on_auth_user_app_metadata_updated on auth.users;
drop function if exists public.sync_profile_role_from_app_metadata();

commit;
