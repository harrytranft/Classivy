-- Phase 7 (D29): xoá dữ liệu cũ đã thay thế. CHẠY SAU KHI SAO LƯU (docs/phase-7-runbook.md).
-- - user_settings.students, user_settings.boss_states_by_class: bản JSON lớp học trước Phase 3 (app không còn đọc khi
--   data_model_version = 2; đã giữ làm bản dự phòng từ 2026-10-28).
-- - Bảng students_imperial_old, app_state, users: dữ liệu Imperial School, đã khoá từ Phase 3.
-- Chốt an toàn: dừng (không xoá gì) nếu còn giáo viên chưa chuyển sang bảng mới mà cột cũ vẫn có học sinh.
-- KHÔNG hoàn tác được dữ liệu (file rollback chỉ tạo lại cột/bảng rỗng).

begin;

do $$
declare
  v_pending integer;
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_settings' and column_name = 'students') then
    select count(*) into v_pending from public.user_settings
    where coalesce(data_model_version, 1) <> 2
      and jsonb_typeof(students) = 'array' and jsonb_array_length(students) > 0;
    if v_pending > 0 then
      raise exception 'Còn % tài khoản giáo viên chưa nâng cấp dữ liệu (data_model_version <> 2). Đăng nhập app bằng các tài khoản đó để nâng cấp trước, rồi chạy lại.', v_pending;
    end if;
  end if;
end $$;

alter table public.user_settings drop column if exists students;
alter table public.user_settings drop column if exists boss_states_by_class;

drop table if exists public.students_imperial_old;
drop table if exists public.app_state;
drop table if exists public.users;

commit;
