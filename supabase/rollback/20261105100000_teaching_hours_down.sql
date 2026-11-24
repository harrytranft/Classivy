-- Hoàn tác chế độ giờ dạy: bỏ hàm đọc lịch. Giữ nguyên cột classroom_settings (thuộc Phase 13C).
-- App học sinh gặp lỗi "hàm không tồn tại" thì tự dùng khung giờ mặc định.
begin;
drop function if exists public.student_teaching_hours();
commit;
