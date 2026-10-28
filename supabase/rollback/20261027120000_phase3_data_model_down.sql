-- Hoàn tác migration 20261027120000_phase3_data_model.sql.
-- CẢNH BÁO: xoá các bảng classes, students, point_ledger và toàn bộ dữ liệu trong đó.
-- Dữ liệu cũ trong user_settings.students vẫn còn (migration không đụng tới), app quay về đọc cột này.
-- Lịch sử điểm ghi sau khi chuyển sang bảng mới sẽ mất: sao lưu (xuất JSON trong Cài đặt) trước khi chạy.

begin;

drop function if exists public.save_teacher_changes(jsonb);
drop view if exists public.student_recent_history;
drop table if exists public.point_ledger;
drop function if exists public.point_ledger_block_changes();
drop table if exists public.students;
drop table if exists public.classes;
drop function if exists public.set_updated_at();

-- Trả lại tên cũ cho bảng students của Imperial School nếu migration đã đổi tên nó.
do $$
declare
  idx record;
begin
  if to_regclass('public.students_imperial_old') is not null and to_regclass('public.students') is null then
    for idx in
      select i.relname from pg_index x join pg_class i on i.oid = x.indexrelid
      where x.indrelid = 'public.students_imperial_old'::regclass and i.relname like 'imperial_old_%'
    loop
      execute format('alter index public.%I rename to %I', idx.relname, substr(idx.relname, length('imperial_old_') + 1));
    end loop;
    alter table public.students_imperial_old rename to students;
  end if;
end $$;

alter table public.user_settings drop constraint if exists user_settings_data_model_version_check;
alter table public.user_settings drop column if exists data_model_version;

-- Quyền ghi hồ sơ trở lại như trước (RLS vẫn giới hạn theo chủ sở hữu).
grant insert, update on public.profiles to authenticated;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles drop column if exists role;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name, photo_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', 'Trainer'),
    coalesce(new.raw_user_meta_data->>'photo_url', new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg')
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    display_name = excluded.display_name,
    photo_url = excluded.photo_url,
    updated_at = now();

  return new;
end;
$$;

-- Cột cấp bậc (D7) và tên mặc định cũ: app hiện tại không dùng nữa nên KHÔNG khôi phục.
-- Nếu thật cần, bỏ chú thích (dữ liệu cũ trong cột không lấy lại được nếu không có bản sao lưu):
-- alter table public.user_settings add column ranks_male jsonb not null default '[]'::jsonb;
-- alter table public.user_settings add column ranks_female jsonb not null default '[]'::jsonb;
-- alter table public.profiles alter column display_name set default 'Học sĩ triều đình';

commit;
