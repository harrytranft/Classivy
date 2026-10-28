# Phase 4 - Hướng dẫn chạy migration và triển khai Edge Function (cho Harry)

Làm lần lượt từ trên xuống, **dev trước, production sau**. Chưa làm bước nào trên Supabase thật cho tới khi Harry tự chạy và xác nhận.

File liên quan:
- Migration: `supabase/migrations/20261029100000_phase4_student_accounts.sql`
- Hoàn tác: `supabase/rollback/20261029100000_phase4_student_accounts_down.sql`
- Edge Function: `supabase/functions/student-accounts/` (mã dùng chung: `supabase/functions/_shared/studentAccount.ts`)
- Thiết kế: `docs/adr/0002-phase-4-student-accounts.md`

## Điều cần biết trước

- Migration **chỉ thêm**: 2 cột cho bảng `students` (`username`, `must_change_password`), bảng nhật ký `teacher_audit_log`, một trigger và 2 hàm. Không đổi dữ liệu hiện có. Chạy lại nhiều lần không sao.
- **Trigger mới đổi hành vi xoá học sinh:** xoá một học sinh (hoặc cả lớp, hoặc cả tài khoản giáo viên) sẽ xoá luôn tài khoản đăng nhập của em đó trong Supabase Auth (D16). Trigger chỉ xoá người dùng mang vai trò học sinh, không bao giờ xoá tài khoản giáo viên.
- App mới chạy được **cả trước và sau** khi triển khai: chưa triển khai hàm thì trang "Tài khoản học sinh" báo lỗi kết nối rõ ràng, phần còn lại của app không ảnh hưởng. Nút "Tài khoản học sinh" trên trang lớp cần migration (đọc cột mới); chạy migration trước khi mở trang đó.
- Khoá `service_role` do Supabase tự cấp cho Edge Function dưới dạng biến môi trường. **Không dán khoá vào file hay chat.**
- Gói Free: Edge Function 256 MB bộ nhớ, 2 giây CPU mỗi yêu cầu, 150 giây tổng, 100 hàm/dự án (tài liệu Supabase, đọc 2026-10-28). **Hạn mức số lần gọi mỗi tháng chưa tìm thấy trong tài liệu: xem trong Dashboard > Edge Functions / Usage** trước khi dùng cho nhiều lớp. Mỗi lần tạo tài khoản cho cả lớp chỉ là 1 lần gọi (tối đa 60 em/lần).

## Bước 1 - Dự án dev (`classivy-dev`)

- [x] 1.1 SQL Editor của dự án dev: dán toàn bộ file migration, bấm **Run**. Kết quả mong đợi: "Success. No rows returned".
- [x] 1.2 Trên Mac, trong thư mục dự án (nhánh Phase 4), cài và đăng nhập Supabase CLI: `npx supabase login` (mở trình duyệt để xác nhận).
- [x] 1.3 Triển khai hàm (thay `<ref-dev>` bằng Project ID của `classivy-dev`, lấy ở Project Settings > General):
  `npx supabase functions deploy student-accounts --project-ref <ref-dev>`
  Nếu CLI báo thiếu Docker, thêm cờ `--use-api`. Xem hàm ở Dashboard > Edge Functions: phải thấy `student-accounts` và JWT verification **đang bật**.
- [x] 1.4 Chạy app ở máy với dự án dev (`.env.local` của dự án dev, như Phase 3), đăng nhập tài khoản giáo viên thử có vài học sinh (đã nâng cấp dữ liệu, `data_model_version = 2`).
- [x] 1.5 Vào một lớp > nút **Tài khoản học sinh**. Thử lần lượt:
  - Đợi vài giây cho app lưu học sinh lên đám mây, bấm **Làm mới**: học sinh hiện ra, trạng thái "Chưa có tài khoản".
  - **Tạo tài khoản** cho một em: hiện thẻ đăng nhập (tên đăng nhập + mật khẩu 8 ký tự). Chép lại mật khẩu. Bấm **In thẻ** thử xem bản in.
  - Mở cửa sổ ẩn danh, vào app, đăng nhập bằng **tên đăng nhập** (không có @) + mật khẩu trên thẻ: phải thấy màn "Đặt mật khẩu mới". Đặt mật khẩu mới, thấy "Xin chào ...". Đăng xuất, đăng nhập lại bằng mật khẩu mới: vào thẳng.
  - Trong Supabase > Authentication > Users: thấy người dùng có email dạng `tên@students.classivy.invalid`. **Ghi lại: Supabase có chấp nhận email dạng này không** (nếu từ chối, báo mình đổi tên miền ở `STUDENT_EMAIL_DOMAIN`).
  - **Khoá** em đó, rồi thử đăng nhập ở cửa sổ ẩn danh khác: phải bị từ chối với thông báo "không đăng nhập được". **Ghi lại:** nếu em đó đang đăng nhập sẵn ở một cửa sổ khác, cửa sổ đó còn dùng được bao lâu sau khi khoá (tài liệu Supabase chưa nói rõ).
  - **Mở khoá**, **Đặt lại mật khẩu** (thẻ mới, mật khẩu cũ hết dùng, em phải đổi lại), **Thu hồi tài khoản** (người dùng biến mất khỏi Authentication > Users, học sinh và điểm vẫn còn trong lớp).
  - Tạo lại tài khoản cho một em khác, rồi **xoá học sinh đó ở trang lớp**: kiểm tra Authentication > Users **không còn** người dùng của em đó (đây là trigger mới; **ghi lại nếu còn sót**).
  - Tab **Nhật ký thao tác** ghi đủ các việc trên, **không có mật khẩu**.
  - Tạo cho **cả lớp** (nút "Tạo cho cả lớp").
- [x] 1.6 (Tuỳ chọn) Thử hoàn tác: chạy file rollback trong SQL Editor, tải lại app: trang tài khoản báo lỗi tải, phần còn lại bình thường. Chạy lại migration.
- [x] 1.7 Báo mình kết quả (đặc biệt 3 mục "Ghi lại") để mình cập nhật PLAN/BRIEF.

## Bước 2 - Production (chỉ sau khi bước 1 ổn)

- [x] 2.1 Sao lưu: Cài đặt > "Export JSON Backup" trong app thật.
- [x] 2.2 SQL Editor của dự án production: chạy migration như 1.1.
- [x] 2.3 `npx supabase functions deploy student-accounts --project-ref <ref-production>`.
- [ ] 2.4 Merge nhánh Phase 4 để Vercel đưa giao diện mới lên (hoặc thử preview Vercel của nhánh trước).
- [ ] 2.5 Thử nhanh một học sinh thử (tạo, đăng nhập, thu hồi) rồi mới dùng với lớp thật.
- [ ] 2.6 **Khuyến nghị bảo mật (cần Harry quyết):** Authentication > Sign In / Providers > tắt **"Allow new users to sign up"**. UI đăng ký đã bỏ (D11) nhưng API đăng ký công khai vẫn mở: ai biết địa chỉ dự án và khoá anon đều có thể tự tạo tài khoản kiểu giáo viên. Tắt đăng ký không ảnh hưởng việc giáo viên tạo tài khoản học sinh (Edge Function dùng quyền quản trị). Giáo viên mới sau này phải do bạn tạo trong Authentication > Users.

## Nếu có sự cố

- **Trang tài khoản báo "Không kết nối được chức năng...":** hàm chưa triển khai hoặc sai `--project-ref`. Làm lại bước 1.3 / 2.3.
- **Một học sinh báo "Không thực hiện được, vui lòng thử lại":** xem Dashboard > Edge Functions > `student-accounts` > Logs (log chỉ ghi tên lỗi, không có mật khẩu).
- **Cần gỡ hẳn Phase 4:** chạy file rollback trong SQL Editor, rồi `npx supabase functions delete student-accounts --project-ref <ref>`. Các tài khoản học sinh đã tạo trong Authentication > Users **không** tự xoá: xoá tay nếu cần.
