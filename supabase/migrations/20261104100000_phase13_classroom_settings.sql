-- Phase 13C (D55): một cột JSON mới lưu cài đặt dùng trên lớp (Săn Pokémon hoang dã, danh sách thử thách Cá Ngựa...),
-- để các cài đặt lớp học sau này không cần thêm cột/migration nữa.
--   * Chỉ THÊM cột; không đổi dữ liệu có sẵn, không đổi RLS, không xoá gì.
--   * Hàng cũ nhận '{}' (app hiểu '{}' = dùng mặc định).
--   * Quyền: user_settings đã được cấp quyền theo BẢNG (select/insert/update cho authenticated) và RLS theo chủ sở hữu,
--     nên cột mới tự được bảo vệ như các cột cài đặt khác. Học sinh không có quyền đọc/ghi bảng này.
-- Chạy lại được. Hoàn tác: supabase/rollback/20261104100000_phase13_classroom_settings_down.sql (xoá cột và cài đặt đã lưu trong cột đó).

begin;

alter table public.user_settings
  add column if not exists classroom_settings jsonb not null default '{}'::jsonb;

commit;
