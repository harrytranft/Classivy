-- Sửa: tài khoản học sinh tạo qua Edge Function bị ghi profiles.role = 'teacher'.
-- Nguyên nhân: Supabase Auth (admin createUser) INSERT người dùng trước, rồi mới UPDATE app_metadata.role = 'student'.
-- Trigger tạo hồ sơ (handle_new_user_profile) chỉ chạy lúc INSERT nên luôn thấy "chưa có role" => 'teacher'.
--
-- Quy tắc (Harry, 2026-10-28): tài khoản tạo trong Supabase > Authentication => giáo viên;
-- tài khoản do giáo viên tạo trong app (app_metadata.role = 'student', chỉ khoá service_role đặt được) => học sinh.
-- profiles.role luôn đi theo app_metadata.role. Người dùng không tự sửa được app_metadata nên không tự nâng quyền được.
-- Chạy lại được. Hoàn tác: supabase/rollback/20261030110000_sync_profile_role_down.sql

begin;

create or replace function public.sync_profile_role_from_app_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set role = case when new.raw_app_meta_data->>'role' = 'student' then 'student' else 'teacher' end,
      updated_at = now()
  where user_id = new.id
    and role is distinct from (case when new.raw_app_meta_data->>'role' = 'student' then 'student' else 'teacher' end);
  return new;
end;
$$;

revoke all on function public.sync_profile_role_from_app_metadata() from public, anon, authenticated;

drop trigger if exists on_auth_user_app_metadata_updated on auth.users;
create trigger on_auth_user_app_metadata_updated
after update of raw_app_meta_data on auth.users
for each row execute function public.sync_profile_role_from_app_metadata();

-- Sửa các tài khoản học sinh đã tạo trước bản sửa này.
update public.profiles p
set role = 'student', updated_at = now()
from auth.users u
where u.id = p.user_id
  and u.raw_app_meta_data->>'role' = 'student'
  and p.role <> 'student';

commit;
