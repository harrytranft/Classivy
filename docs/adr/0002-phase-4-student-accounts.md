# ADR 0002 - Phase 4: giáo viên quản lý tài khoản học sinh

- **Trạng thái:** Đã triển khai trong mã (chưa chạy trên Supabase thật). Harry đã chốt 4 điểm chính (2026-10-28, mục 2); các điểm còn lại là mặc định chờ Harry xác nhận khi nghiệm thu: ô đăng nhập nhận cả email lẫn tên đăng nhập (chỉnh D11), khuyến nghị tắt đăng ký công khai (runbook 2.6)
- **Ngày:** 2026-10-28
- **Phạm vi:** PLAN task 4.1-4.5. Nền: ADR 0001 (bảng `students` đã có `auth_user_id`, `status`; `profiles.role`)

## 1. Bối cảnh (nói dễ hiểu)

Phase 3 đã có "dòng học sinh" trong DB nhưng chưa em nào có tài khoản đăng nhập. Phase 4 cho giáo viên: tạo tài khoản (một em hoặc cả lớp), khoá/mở khoá, đặt lại mật khẩu, thu hồi tài khoản, in thẻ đăng nhập, và xem nhật ký thao tác.

Việc tạo/xoá người dùng Supabase Auth cần khoá `service_role` (quyền tối cao). Khoá này **không bao giờ** được đưa vào trình duyệt, nên mọi thao tác này chạy trong **Edge Function** (mã chạy trên máy chủ Supabase).

## 2. Quyết định Harry đã chốt (2026-10-28)

| # | Nội dung |
|---|---|
| D14 | Tên đăng nhập = **tên + số ngẫu nhiên** (vd `minhanh472`); giáo viên có thể sửa tay lúc tạo. Hệ thống đổi thành email ảo nội bộ, học sinh không thấy |
| D15 | Mật khẩu ban đầu **ngẫu nhiên** (6-8 ký tự dễ đọc), in trên thẻ; học sinh **bắt buộc đổi ở lần đăng nhập đầu** |
| D16 | Tách hai việc: **"Thu hồi tài khoản"** (xoá hẳn đăng nhập, giữ học sinh + điểm trong lớp) và **"Xoá học sinh"** (xoá hẳn em đó + sổ điểm + tài khoản, đúng D12). **Khoá/mở khoá** là tạm thời. Không có xoá mềm (task 4.1 cũ ghi "xoá mềm" được sửa lại) |
| D17 | Thêm bảng **nhật ký thao tác** (chỉ thêm, không sửa/xoá, không ghi mật khẩu) |

## 3. Thiết kế

### 3.1 Edge Function `student-accounts` (một hàm, nhiều hành động)

Gọi từ app bằng `supabase.functions.invoke('student-accounts', { body: { action, ... } })`, kèm JWT của giáo viên.

| action | Việc làm | Trả về |
|---|---|---|
| `create` | Nhận danh sách `studentIds` (tối đa 60). Với mỗi em chưa có tài khoản: sinh tên đăng nhập + mật khẩu, tạo người dùng Auth (`email_confirm: true`, `app_metadata.role = 'student'`), gắn `students.auth_user_id`, `username`, `must_change_password = true` | Danh sách `{studentId, username, password}` **chỉ trả một lần**, kèm các em lỗi và lý do |
| `reset_password` | Sinh mật khẩu mới, đặt `must_change_password = true` | `{username, password}` |
| `lock` / `unlock` | `ban_duration` (khoá) / `none` (mở) + `students.status` | trạng thái |
| `revoke` | Xoá người dùng Auth, xoá `username`, `auth_user_id` về null | trạng thái |

Quy tắc bảo mật của hàm:

1. Xác thực người gọi bằng JWT; từ chối nếu không phải giáo viên (`profiles.role = 'teacher'`).
2. Lấy học sinh bằng **client mang JWT của giáo viên** (RLS tự lọc: chỉ thấy học sinh của mình). Chỉ sau khi qua bước này mới dùng `service_role` để tạo/sửa người dùng Auth. Một giáo viên không thể tác động học sinh của giáo viên khác dù gửi đúng id.
3. Không ghi mật khẩu vào nhật ký, log hay DB (chỉ Auth giữ bản băm). Mật khẩu chỉ nằm trong phản hồi một lần.
4. Giới hạn 60 em mỗi lần gọi; tạo tuần tự có kiểm soát để không chạm giới hạn CPU 2 giây/yêu cầu và thời gian 150 giây (gói Free; nguồn: tài liệu Supabase, xem mục 6).
5. Mỗi thao tác ghi một dòng nhật ký (qua `service_role`).

### 3.2 Thay đổi DB (migration `20261029100000_phase4_student_accounts.sql`)

- `students.username text` duy nhất (không phân biệt hoa thường), kiểm tra định dạng `^[a-z0-9]{3,24}$`; `students.must_change_password boolean default false`. **Client không ghi được** hai cột này (không cấp quyền cột; sẵn đã như vậy cho `auth_user_id`, `status`).
- Bảng `teacher_audit_log` (nhật ký): `teacher_id`, `action`, `student_id` (không khoá ngoại để còn lại sau khi xoá học sinh), `student_name`, `class_name`, `detail jsonb`, `created_at`. Giáo viên chỉ **đọc** nhật ký của mình; chỉ `service_role` ghi; trigger chặn sửa/xoá.
- Trigger `after delete on students`: nếu học sinh có `auth_user_id` và người dùng đó mang `role = 'student'` thì xoá luôn người dùng Auth. Mục đích: **xoá học sinh (kể cả qua `save_teacher_changes`) không bao giờ để lại tài khoản mồ côi vẫn đăng nhập được**. Không bao giờ xoá người dùng không mang vai trò học sinh.
- Hai hàm cho học sinh (security definer, chỉ đọc/ghi dòng của chính mình): `student_first_login_pending()` và `complete_first_login()`. Cờ này là cơ chế giao diện nhắc/ép đổi mật khẩu, **không phải ranh giới bảo mật**: DB không biết mật khẩu đã đổi chưa nên học sinh có thể gọi `complete_first_login()` mà không đổi. Chấp nhận được vì rủi ro chỉ là học sinh giữ mật khẩu in trên thẻ.

### 3.3 Giao diện (giáo viên)

Trang con mới của lớp `/class/<lớp>/tai-khoan` (cùng kiểu D8): bảng học sinh của lớp với cột tên đăng nhập, trạng thái (chưa có / hoạt động / bị khoá / chờ đổi mật khẩu), tìm kiếm, lọc theo trạng thái; nút tạo (một em/cả lớp), đặt lại mật khẩu, khoá/mở, thu hồi; hộp xác nhận cho thao tác phá huỷ; hộp "Thẻ đăng nhập" (in được, hiện một lần) và tab nhật ký. Sửa thông tin học sinh dùng luồng sẵn có.

### 3.4 Phía học sinh (chỉ phần tối thiểu để D15 chạy được)

- Ô đăng nhập chấp nhận tên đăng nhập (không có `@`) và đổi thành email ảo; ô email giáo viên giữ nguyên.
- Tài khoản `role = 'student'` **không bao giờ** tải dữ liệu giáo viên: khung app hiển thị màn hình học sinh riêng. Phase 4 chỉ có màn "đặt mật khẩu mới" (bắt buộc) và màn chờ "Cổng học sinh sắp ra mắt"; hồ sơ thật là Phase 5.
- Tài khoản bị khoá: Supabase từ chối đăng nhập; thông báo chung chung ("không đăng nhập được, hãy hỏi giáo viên"), không lộ thông tin (chi tiết hoá ở 5.3).

## 4. Phương án đã cân nhắc

- **Tạo tài khoản từ trình duyệt bằng `signUp`:** cần bật đăng ký công khai, ai cũng tạo được tài khoản, không gắn được vai trò an toàn → loại.
- **Một Edge Function cho mỗi hành động:** tách nhỏ hơn nhưng lặp mã xác thực/phân quyền 5 lần, tăng rủi ro sót → chọn một hàm có hành động.
- **Xoá tài khoản mồ côi bằng Edge Function gọi từ app trước khi xoá học sinh:** dễ quên một đường xoá (ví dụ xoá cả lớp, xoá tài khoản giáo viên) → chọn trigger DB, đúng mọi đường.
- **Xoá mềm tài khoản:** xung đột D12 và để lại người dùng Auth ẩn → loại (D16).

## 5. Rủi ro và việc chưa kiểm chứng được

- Chưa chạy Edge Function trên Supabase thật (cần `supabase functions deploy` và biến môi trường do Harry thực hiện); chỉ kiểm thử logic thuần và SQL cục bộ. Hàm sẽ có test với client Supabase giả cho phần phân quyền.
- Email ảo dùng tên miền `students.classivy.invalid` (TLD `.invalid` dành riêng, không bao giờ gửi được thư). **Cần thử trên `classivy-dev`** xem bộ kiểm tra email của Supabase có chấp nhận không; nếu không thì đổi tên miền ở một hằng số duy nhất.
- Hành vi chính xác của `ban_duration` với phiên đang mở chưa được tài liệu nói rõ: sau khi khoá, phiên cũ có thể còn sống tới khi hết hạn token (tối đa ~1 giờ). Cần thử trên dev; nếu cần chặn ngay, thêm kiểm tra `status` ở RLS cho Phase 5.
- Trigger xoá `auth.users` từ trong `public` dựa vào việc chủ hàm có quyền trên schema `auth` (cách làm phổ biến trên Supabase); cần thử trên dev. Test cục bộ chỉ mô phỏng.

## 6. Nguồn

- Giới hạn Edge Function (256 MB bộ nhớ, 2 giây CPU/yêu cầu, 150 giây tổng, 100 hàm/dự án trên gói Free): https://supabase.com/docs/guides/functions/limits (đọc 2026-10-28; trang không nêu hạn mức số lần gọi, cần xem lại trên Dashboard).
- `auth.admin.updateUserById` với `ban_duration` và `app_metadata`: https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid
