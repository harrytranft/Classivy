-- "Hoàn tác" 20261101110000_drop_legacy_data.sql: chỉ tạo lại hai cột cũ của user_settings (RỖNG) để app bản cũ
-- (trước Phase 7) không lỗi khi đọc/ghi. Dữ liệu đã xoá KHÔNG lấy lại được: khôi phục từ file sao lưu JSON
-- (Cài đặt > Khôi phục) nếu cần. Ba bảng Imperial School không được tạo lại.

begin;

alter table public.user_settings add column if not exists students jsonb not null default '[]'::jsonb;
alter table public.user_settings add column if not exists boss_states_by_class jsonb not null default '{}'::jsonb;

commit;
