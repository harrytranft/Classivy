# Rà soát bảo mật Phase 7 (task 7.1)

- **Ngày:** 2026-10-28. **Người làm:** Claude (đọc mã + kiểm thử trên PostgreSQL cục bộ mô phỏng Supabase). Chưa kiểm tra trên Supabase thật.
- **Phạm vi:** RLS và quyền của mọi bảng/hàm trong `public`, Edge Function `student-accounts`, mã client (khoá, dữ liệu học sinh), giới hạn tốc độ.

## Kết quả

| # | Phát hiện | Mức | Xử lý |
|---|---|---|---|
| S1 | Tài khoản **học sinh** gọi thẳng được `save_teacher_changes` / ghi `classes`, `students`, `user_settings`, `point_ledger` dưới tên mình (policy chỉ kiểm `teacher_id = auth.uid()`, không kiểm vai trò). Không đọc/sửa được dữ liệu của ai, nhưng tạo được dữ liệu rác chiếm dung lượng | Trung bình | **Đã sửa** (D28): `is_teacher()` + chốt vai trò trong mọi policy dữ liệu giáo viên. Test: `60_phase7_hardening.test.sql` mục B |
| S2 | Dự án Supabase **cũ** (production) còn quyền bảng của vai trò ẩn danh trên `profiles`, `user_settings` (Supabase cũ tự cấp). RLS vẫn chặn dữ liệu | Thấp | **Đã sửa**: thu quyền. Test tổng quát: "anon has no table privileges" (chạy trên cả kiểu dự án cũ) |
| S3 | Các hàm trigger (`handle_new_user_profile`, `*_block_changes`, `set_updated_at`) gọi được qua API (Postgres sẽ báo lỗi vì không phải ngữ cảnh trigger) | Thấp | **Đã sửa**: thu quyền gọi. Test tổng quát chặn mọi hàm trigger trong tương lai |
| S4 | Hai máy giáo viên cùng sửa một học sinh: lần lưu sau ghi đè lần trước (mất dữ liệu, không phải lỗ hổng truy cập) | Trung bình (toàn vẹn dữ liệu) | **Đã sửa** (D31): `students.revision` + `save_teacher_changes_v2` từ chối gói lỗi thời; app báo và tải lại |
| S5 | Edge Function trả CORS `*` | Thông tin | Chấp nhận: hàm đòi JWT giáo viên trong header (không dùng cookie), CORS không mở thêm quyền |
| S6 | Edge Function không có giới hạn tốc độ riêng | Thấp | Chấp nhận: chỉ giáo viên gọi được, tối đa 60 em/lần; Supabase Auth đã giới hạn đăng nhập. Xem lại nếu có nhiều giáo viên |
| S7 | Lý do trong lịch sử điểm là chữ giáo viên gõ; học sinh thấy nguyên văn trên hồ sơ | Thông tin | Ghi trong hướng dẫn giáo viên: không ghi tên bạn khác hay thông tin nhạy cảm vào lý do |

## Đã kiểm và đạt (có test tự động, chạy mãi về sau)

- Mọi bảng trong `public` bật RLS; mọi hàm `security definer` khoá `search_path`; vai trò ẩn danh không có quyền bảng nào và không gọi được hàm `security definer` nào; không hàm trigger nào gọi được qua API (`60_phase7_hardening.test.sql` mục A).
- Học sinh không đọc thẳng được bảng nào; chỉ dùng hàm chọn lọc (Phase 5, 6). Tài khoản khoá không xem/dùng được gì.
- Sổ điểm, nhật ký thao tác, sổ quà, thu hồi: bất biến kể cả quyền quản trị (chỉ xoá dây chuyền khi xoá học sinh/giáo viên).
- Không có khoá `service_role` hay mật khẩu trong mã client/git (`grep`); chỉ `.env.example` được commit. Edge Function không ghi mật khẩu vào log/DB.
- Đăng ký công khai của Supabase đã tắt (Harry, D27).

## Việc Harry nên làm định kỳ

- Supabase Dashboard > **Advisors** (Security, Performance): xem cảnh báo sau mỗi lần chạy migration.
- Authentication > Users: rà tài khoản lạ (đăng ký đã tắt, nên mọi tài khoản mới phải do Harry hoặc Edge Function tạo).
