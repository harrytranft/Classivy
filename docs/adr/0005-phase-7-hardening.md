# ADR 0005 - Phase 7: hardening và ra mắt

- **Trạng thái:** Đã triển khai trong mã (chưa chạy trên Supabase thật). Harry chốt 4 điểm ở mục 2 (2026-10-28).
- **Ngày:** 2026-10-28
- **Phạm vi:** PLAN task 7.1-7.4. Chi tiết rà soát: `docs/security-review-phase7.md`

## 1. Bối cảnh

Trước khi phát tài khoản cho nhiều lớp: rà bảo mật, dọn dữ liệu cũ, xử lý rủi ro mất dữ liệu khi mở app ở hai máy, đo tải theo quy mô thật, viết hướng dẫn và kế hoạch triển khai.

## 2. Quyết định Harry đã chốt (2026-10-28)

| # | Nội dung |
|---|---|
| D28 | Thêm chốt "chỉ giáo viên" (`profiles.role = 'teacher'`) vào mọi policy dữ liệu giáo viên (lớp, học sinh, sổ điểm, cài đặt, nhật ký, bảng xã hội) |
| D29 | Xoá dữ liệu cũ sau khi sao lưu: cột `user_settings.students`, `boss_states_by_class`; bảng `students_imperial_old`, `app_state`, `users` |
| D30 | Ảnh đại diện **giữ trong DB**, ảnh mới nén về ~100 KB (thay cho việc chuyển Storage hẹn ở D21) |
| D31 | Hai máy cùng sửa: app gửi số phiên bản, DB từ chối gói lỗi thời; app **không ghi đè**, báo "Dữ liệu vừa được đổi ở máy khác" và tải lại |

## 3. Thiết kế

### 3.1 Migration `20261101100000_phase7_hardening.sql`

- `is_teacher()` (security definer, stable) + viết lại policy với `and (select public.is_teacher())` (dạng `select` để Postgres chỉ tính một lần mỗi truy vấn). Hàm học sinh (security definer) không bị ảnh hưởng.
- `students.revision` (client không ghi được) + trigger tăng khi `class_id, name, gender, points, avatar, game_state` đổi. Đổi tài khoản (Edge Function, đổi mật khẩu lần đầu) **không** tăng, nên không làm app giáo viên bị từ chối oan.
- `save_teacher_changes_v2(p_changes)`: như hàm cũ, mỗi học sinh có thể kèm `base_revision`. Nếu bất kỳ em nào có phiên bản khác (hoặc đã bị xoá ở máy khác) thì dừng cả gói với lỗi `stale_data` (mã `40001`), không ghi gì. Thành công trả `{ saved_at, revisions }`. Hàm cũ giữ nguyên cho bản app cũ.
- Thu quyền thừa: ẩn danh trên `profiles`/`user_settings`; gọi trực tiếp hàm trigger.

### 3.2 App

- `fetchTeacherTables` đọc kèm `revision` (DB chưa có cột thì đọc như cũ). Snapshot giữ `revisions`; `diffSnapshots` gắn `baseRevision` cho học sinh đã có; lưu qua `saveTeacherChangesChecked` (v2, tự lùi về hàm cũ khi DB chưa có v2).
- Bị từ chối: dừng lưu, tải lại toàn bộ từ đám mây, hiện banner "Dữ liệu vừa được đổi ở máy khác" (`SyncConflictBanner`). Thao tác chưa lưu trên máy này (của lần lưu bị từ chối) cần làm lại; banner nói rõ.
- Ảnh tải lên mới nén về ≤ 140.000 ký tự base64 (~100 KB).

### 3.3 Migration `20261101110000_drop_legacy_data.sql`

Tách riêng, chạy **sau** khi sao lưu. Có chốt: dừng nếu còn giáo viên chưa nâng cấp (`data_model_version <> 2`) mà cột cũ còn học sinh. App đọc `user_settings` bằng `select *` nên không cần đổi mã; mọi giáo viên dùng bảng mới.

### 3.4 Kiểm thử tải (7.2)

`npm run test:load`: 350 học sinh có tài khoản, 70.000 dòng sổ điểm, ~5.000 quà. Kết quả cục bộ (2026-10-28): mọi truy vấn chính < 35 ms, DB ~30 MB (gói miễn phí 500 MB). Ngưỡng trong script: test đỏ nếu chậm hơn nhiều lần.

## 4. Phương án đã cân nhắc

- **Gửi phần chênh lệch điểm** (hai máy cộng dồn đúng): triệt để nhưng đổi cách lưu của mọi tính năng game → không làm.
- **Khoá theo phiên (một máy một lúc):** đơn giản với người dùng nhưng dễ kẹt khi quên đóng tab → không làm.
- **Chuyển ảnh sang Storage:** thêm dịch vụ, quyền, bước chuyển; dung lượng hiện tại không cần → không làm (D30).

## 5. Rủi ro còn lại

- Khi bị từ chối, thao tác vừa làm trên máy đó mất (phải làm lại). Chấp nhận vì hiếm (hai máy cùng sửa một em trong vài giây) và có thông báo.
- Hàm cũ `save_teacher_changes` vẫn ghi đè được: chỉ bản app cũ (trước Phase 7) dùng; sau khi Vercel đưa bản mới lên, mọi máy dùng v2. Có thể bỏ hàm cũ sau.
- Chưa chạy trên Supabase thật; đo tải là trên máy cục bộ, Supabase gói miễn phí chậm hơn (máy nhỏ, mạng) nhưng còn dư địa lớn.
