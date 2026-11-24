-- Chế độ giờ dạy: học sinh đọc lịch giờ dạy của giáo viên mình để khoá các nút ghi (Cửa hàng, Hợp nhất, Đổi đồng hành, Tặng quà)
-- trong giờ dạy, tránh đụng độ `stale_data` với máy giáo viên đang chấm điểm.
--   * Lịch nằm trong user_settings.classroom_settings -> 'teachingHours' (cột của Phase 13C; migration này thêm cột nếu chưa có).
--   * Học sinh KHÔNG có quyền đọc bảng user_settings; hàm security definer này chỉ trả đúng mục teachingHours
--     của giáo viên của học sinh đang gọi (không lộ cài đặt khác).
--   * Không đổi dữ liệu, không đổi RLS. Việc khoá nút ở giao diện học sinh; hàm DB của Shop/Hợp nhất/Tặng quà giữ nguyên.
-- Chạy lại được. Hoàn tác: supabase/rollback/20261105100000_teaching_hours_down.sql

begin;

alter table public.user_settings
  add column if not exists classroom_settings jsonb not null default '{}'::jsonb;

-- null = giáo viên chưa lưu cài đặt giờ dạy (app học sinh dùng khung giờ mặc định).
create or replace function public.student_teaching_hours()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me public.students;
begin
  v_me := public.social_current_student();
  return (select us.classroom_settings -> 'teachingHours' from public.user_settings us where us.user_id = v_me.teacher_id);
end;
$$;

revoke all on function public.student_teaching_hours() from public, anon;
grant execute on function public.student_teaching_hours() to authenticated;

commit;
