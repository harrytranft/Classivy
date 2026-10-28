# ADR 0003 - Phase 5: cổng học sinh (chỉ xem)

- **Trạng thái:** Đã triển khai trong mã (chưa chạy trên Supabase thật). Harry chốt 4 điểm ở mục 2 (2026-10-28).
- **Ngày:** 2026-10-28
- **Phạm vi:** PLAN task 5.1-5.4. Nền: ADR 0001 (bảng `students`, `point_ledger`, `classes`), ADR 0002 (tài khoản học sinh, `profiles.role`, `students.status`)

## 1. Bối cảnh (nói dễ hiểu)

Phase 4 cho học sinh đăng nhập và đổi mật khẩu, rồi dừng ở màn "sắp ra mắt". Phase 5 cho em xem **hồ sơ của chính mình** trên điện thoại: Hào Quang, Trainer Level, Pokémon, huy hiệu, lịch sử điểm. Không em nào được thấy dữ liệu của bạn khác.

## 2. Quyết định Harry đã chốt (2026-10-28)

| # | Nội dung |
|---|---|
| D18 | Học sinh đọc dữ liệu qua **một hàm DB chọn lọc** `get_my_student_profile()`, **không mở quyền đọc bảng** cho học sinh |
| D19 | "Hạng" trên hồ sơ = **Trainer Level + danh hiệu + huy hiệu**; không hiển thị vị trí trong lớp |
| D20 | Phase 5 học sinh **chỉ xem**; mọi thay đổi vẫn do giáo viên. Tương tác để Phase 6 |
| D21 | Ảnh đại diện **giữ trong DB** (đã nén ≤ ~200 KB); dời chuyển sang Supabase Storage tới Phase 7 (sửa Q5 của ADR 0001) |

## 3. Thiết kế

### 3.1 Hàm `public.get_my_student_profile()` (migration `20261030100000_phase5_student_portal.sql`)

`security definer`, `stable`, chỉ vai trò `authenticated` được gọi (ẩn danh bị chặn). Mỗi lần gọi:

1. Không có người dùng → lỗi `42501`.
2. Người gọi không có `profiles.role = 'student'` → `{"status":"not_student"}` (chặn cả trường hợp tài khoản giáo viên bị gắn nhầm vào dòng học sinh).
3. Không có dòng `students` nào gắn `auth_user_id` này → `{"status":"not_linked"}`.
4. `students.status <> 'active'` → `{"status":"locked"}` và **không gì khác**. Vì kiểm tra mỗi lần gọi nên tài khoản vừa bị khoá không xem được dữ liệu nữa, kể cả khi phiên đăng nhập cũ còn sống (lo ngại ở ADR 0002 mục 5).
5. Còn lại trả: tên, giới tính, tên lớp, điểm, ảnh đại diện, phần game **theo danh sách cho phép** (`pet`, `pets`, `egg` đã bỏ `assignedDexId` để không lộ Pokémon sắp nở, `trainerProgress`, `earnedBadges`, `supportPetInstanceId`), 30 dòng sổ điểm gần nhất (bỏ số dư đầu kỳ).

Không trả: id nội bộ, `teacher_id`, tên đăng nhập, `auth_user_id`, nhật ký phiêu lưu, Cá Ngựa, dữ liệu học sinh khác. Học sinh **vẫn không đọc thẳng** được `students`, `point_ledger`, `classes`, `student_recent_history` (0 dòng, có test).

Chi phí: một lần gọi = vài truy vấn theo chỉ mục có sẵn (`students.auth_user_id` duy nhất, `point_ledger (student_id, occurred_at desc)`); app chỉ gọi khi mở trang và khi em bấm "Cập nhật", không hỏi liên tục.

### 3.2 Giao diện học sinh

- `src/domain/studentPortal.ts`: đọc gói JSON thành mô hình hiển thị, không tin dữ liệu (thiếu/sai kiểu thì dùng mặc định), có test.
- `src/features/studentPortal/`: `useStudentProfile` (tải, cập nhật; lỗi mạng khi cập nhật thì giữ dữ liệu đang xem), `StudentProfileScreen` + `StudentProfileSections` (một cột, điện thoại trước, chữ nền 16px, nhãn 13px, nút ≥ 44px).
- Màn thông báo cho `locked` / `not_linked` / `not_student` / lỗi: ngắn, thân thiện, không lộ chi tiết tài khoản, luôn có nút Đăng xuất.
- Đăng nhập (5.1): dùng chung màn đăng nhập (ô nhận tên đăng nhập từ Phase 4). Tài khoản bị khoá khi đăng nhập: Supabase từ chối, app báo "Tài khoản này hiện không đăng nhập được. Hãy hỏi giáo viên của bạn." (có từ Phase 4).

## 4. Phương án đã cân nhắc

- **Mở RLS cho học sinh đọc dòng của mình:** linh hoạt hơn nhưng lộ cả dòng (`teacher_id`, toàn bộ `game_state` gồm Pokémon sắp nở), muốn chặn tài khoản khoá phải sửa nhiều policy, và không tính được gì liên quan bạn cùng lớp mà không lộ dữ liệu → loại (D18).
- **Hiện vị trí trong lớp (toàn bộ hoặc chỉ top 10):** dễ gây so bì, trái DESIGN.md "không bêu xấu" → loại (D19).
- **Cho học sinh chọn Pokémon đồng hành:** thêm đường ghi dữ liệu từ học sinh, dễ xung đột với lần lưu của giáo viên (giáo viên ghi đè cả `game_state`) → để sau (D20).

## 5. Rủi ro và việc chưa kiểm chứng

- Chưa chạy trên Supabase thật. Test SQL chạy trên PostgreSQL 16 với `auth` giả (cả kiểu dự án cũ và mới).
- Lý do trong lịch sử điểm là chữ giáo viên/game ghi; nếu giáo viên gõ tên bạn khác vào lý do thì em sẽ thấy tên đó. Chấp nhận được (cùng lớp), nhắc trong hướng dẫn giáo viên ở Phase 7.
- Thông báo khi đăng nhập tài khoản bị khoá phụ thuộc thứ tự kiểm tra của Supabase Auth (mật khẩu trước hay khoá trước); cần thử trên dev xem có lộ "tên đăng nhập tồn tại" với người đoán mật khẩu sai không.
- Ảnh Pokémon tải từ CDN công khai như app giáo viên; mạng trường chặn thì hiện hình thay thế.
