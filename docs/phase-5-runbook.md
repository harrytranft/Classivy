# Phase 5 - Hướng dẫn chạy migration cổng học sinh (cho Harry)

Làm lần lượt từ trên xuống, **dev trước, production sau**. Chưa làm bước nào trên Supabase thật cho tới khi Harry tự chạy và xác nhận.

File liên quan:
- Migration: `supabase/migrations/20261030100000_phase5_student_portal.sql`, rồi `supabase/migrations/20261030110000_sync_profile_role.sql` (sửa vai trò học sinh bị ghi thành `teacher`)
- Hoàn tác: `supabase/rollback/20261030100000_phase5_student_portal_down.sql`, `supabase/rollback/20261030110000_sync_profile_role_down.sql`
- Thiết kế: `docs/adr/0003-phase-5-student-portal.md`

## Điều cần biết trước

- Cần migration Phase 4 (`20261029100000_phase4_student_accounts.sql`) đã chạy trên dự án đó. Phase 5 **không** cần triển khai lại Edge Function.
- Migration **chỉ thêm một hàm đọc** (`get_my_student_profile`). Không đổi bảng, không đổi dữ liệu, không mở thêm quyền đọc bảng cho học sinh. Chạy lại nhiều lần không sao.
- Thứ tự an toàn: **chạy migration trước, rồi mới đưa giao diện mới lên**. Nếu giao diện lên trước, học sinh đăng nhập sẽ thấy "Chưa tải được hồ sơ" (không hỏng gì, chỉ chưa xem được).

## Bước 1 - Dự án dev (`classivy-dev`)

- [ ] 1.1 SQL Editor của dự án dev: dán toàn bộ file `20261030100000_phase5_student_portal.sql`, bấm **Run**. Mong đợi: "Success. No rows returned". Làm tiếp y như vậy với `20261030110000_sync_profile_role.sql`.
- [ ] 1.1b Kiểm tra vai trò (Table Editor > `profiles`, hoặc chạy câu dưới): tài khoản học sinh đã tạo phải là `student`, tài khoản tạo trong Authentication là `teacher`:
  `select p.email, p.role, u.raw_app_meta_data->>'role' as app_role from public.profiles p join auth.users u on u.id = p.user_id order by p.role;`
  Hai cột `role` và `app_role` phải khớp (`app_role` trống = giáo viên).
- [ ] 1.2 Chạy app ở máy với dự án dev (nhánh Phase 5, `.env.local` của dev). Bằng tài khoản giáo viên thử: chọn một học sinh có Pokémon, vài lần cộng/trừ điểm; vào **Tài khoản học sinh** tạo (hoặc đặt lại mật khẩu) cho em đó.
- [ ] 1.3 Cửa sổ ẩn danh, **khổ điện thoại** (hoặc mở trên điện thoại thật cùng mạng): đăng nhập bằng tên đăng nhập. Sau màn đổi mật khẩu phải thấy hồ sơ: tên, lớp, Hào Quang, Trainer Level, Pokémon, huy hiệu, lịch sử điểm (mới nhất trước). So với trang giáo viên: **điểm và Pokémon phải khớp**.
- [ ] 1.4 Giáo viên cộng điểm cho em đó, đợi vài giây cho app lưu; ở cửa sổ học sinh bấm **Cập nhật**: điểm mới và dòng lịch sử mới xuất hiện.
- [ ] 1.5 Giáo viên **khoá** em đó; ở cửa sổ học sinh (vẫn đang mở) bấm **Cập nhật**: phải chuyển sang "Tài khoản đang tạm khoá", không còn thấy dữ liệu. Mở khoá lại.
- [ ] 1.6 **Ghi lại:** đăng nhập tài khoản đang bị khoá bằng **mật khẩu sai** và bằng **mật khẩu đúng**: thông báo có giống nhau không? (để biết người đoán mò có biết được tên đăng nhập tồn tại hay không).
- [ ] 1.7 (Tuỳ chọn) SQL Editor: `select public.get_my_student_profile();` khi chạy bằng quyền quản trị sẽ báo lỗi "not authenticated" là đúng (hàm chỉ trả dữ liệu cho học sinh đang đăng nhập).
- [ ] 1.8 Báo mình kết quả (đặc biệt mục 1.6).

## Bước 2 - Production (chỉ sau khi bước 1 ổn)

- [ ] 2.1 Sao lưu: Cài đặt > "Export JSON Backup" trong app thật.
- [ ] 2.2 SQL Editor của dự án production: chạy 2 migration như 1.1, rồi kiểm tra như 1.1b.
- [ ] 2.3 Merge nhánh Phase 5 để Vercel đưa giao diện mới lên (hoặc thử preview Vercel của nhánh trước).
- [ ] 2.4 Thử với một học sinh thử (đăng nhập, xem hồ sơ, khoá/mở khoá) rồi mới phát tài khoản cho lớp thật.

## Nếu có sự cố

- **Học sinh thấy "Chưa tải được hồ sơ":** migration chưa chạy trên dự án đó, hoặc mạng lỗi. Chạy lại 1.1 / 2.2.
- **Học sinh thấy "Chưa tìm thấy hồ sơ":** tài khoản không còn gắn với học sinh nào (vd đã thu hồi). Tạo lại tài khoản ở trang Tài khoản học sinh.
- **Cần gỡ Phase 5:** chạy file hoàn tác trong SQL Editor. Không mất dữ liệu; cổng học sinh sẽ báo "Chưa tải được hồ sơ" cho tới khi chạy lại migration.
