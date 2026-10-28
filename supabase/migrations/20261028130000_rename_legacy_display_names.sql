-- Đổi tên hiển thị mặc định cũ "Học sĩ triều đình" (thời Imperial School) thành "Trainer".
-- Harry duyệt 2026-10-28. Sửa dữ liệu thật trong public.profiles: chỉ các hồ sơ còn đúng tên mặc định cũ,
-- tên giáo viên tự đặt giữ nguyên. Chạy lại không sao (lần sau không còn dòng nào khớp).
-- App (từ bản này) cũng coi tên cũ trong thông tin đăng ký là "chưa đặt tên", nên đăng nhập lại không ghi tên cũ trở lại.
-- Hoàn tác: không cần (chỉ đổi một tên mặc định); nếu muốn, đổi tay trong Table Editor.

update public.profiles
set display_name = 'Trainer', updated_at = now()
where display_name = 'Học sĩ triều đình';
