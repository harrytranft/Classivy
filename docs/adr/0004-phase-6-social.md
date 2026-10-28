# ADR 0004 - Phase 6: bạn bè, quà tặng, ví điểm tặng

- **Trạng thái:** Đã triển khai trong mã (chưa chạy trên Supabase thật). Harry chốt 4 điểm ở mục 2 (2026-10-28).
- **Ngày:** 2026-10-28
- **Phạm vi:** PLAN task 6.1-6.6. Nền: D2 (ví điểm tặng riêng, hạn mức tuần), D5 (bạn bè chỉ trong lớp, không chat tự do), D18 (học sinh chỉ dùng hàm DB chọn lọc), D22 (responsive)

## 1. Bối cảnh (nói dễ hiểu)

Học sinh kết bạn với bạn cùng lớp, tặng nhau sticker, lời khen định sẵn và một ít điểm Hào Quang từ "ví điểm tặng" riêng. Giáo viên bật/tắt theo lớp, đặt hạn mức, xem mọi món quà và thu hồi được.

**Vấn đề kỹ thuật chính:** app giáo viên giữ điểm học sinh trong bộ nhớ rồi lưu đè lên DB. Nếu điểm tặng ghi thẳng vào `students.points` trong lúc app giáo viên đang mở, lần lưu tiếp theo sẽ ghi đè mất.

## 2. Quyết định Harry đã chốt (2026-10-28)

| # | Nội dung |
|---|---|
| D23 | Điểm tặng **cộng vào Hào Quang của người nhận qua "hàng chờ"**: nằm an toàn trong DB, app giáo viên tự gom vào Hào Quang (khi mở app, khi quay lại tab, mỗi 3 phút) kèm dòng lịch sử. Không bao giờ bị ghi đè hay cộng trùng |
| D24 | Ví điểm tặng mặc định **5 điểm/tuần**, tối đa **2 điểm/tuần cho cùng một bạn**, 0-2 điểm mỗi lần; giáo viên chỉnh theo lớp (0-50) |
| D25 | Quà = **sticker + lời nhắn định sẵn** (không vật phẩm game, không chữ tự do) |
| D26 | Kết bạn bằng **lời mời + chấp nhận**; tính năng **mặc định TẮT**, giáo viên bật theo lớp; chỉ tặng cho bạn bè; tặng tự động, giáo viên xem nhật ký và thu hồi |

## 3. Thiết kế (migration `20261031100000_phase6_social.sql`)

### 3.1 Dữ liệu

- `classes`: thêm `social_enabled` (mặc định `false`), `gift_weekly_limit` (5), `gift_per_friend_weekly_limit` (2). Giáo viên sửa bằng quyền sẵn có (RLS: lớp của mình).
- `student_friendships`: một dòng mỗi cặp (`pending` / `accepted`); từ chối, huỷ, thôi làm bạn = xoá dòng.
- `student_gifts`: **sổ cái chỉ thêm** (trigger chặn sửa/xoá, kể cả quyền quản trị; chỉ xoá dây chuyền khi xoá học sinh/lớp/giáo viên theo D12). Có `week_key` (tuần theo giờ Việt Nam, bắt đầu thứ Hai).
- `student_gift_revocations`: thu hồi, cũng chỉ thêm (một quà thu hồi một lần). `student_gift_reports`: học sinh báo quà.
- Danh mục sticker/lời nhắn nằm ở hai hàm SQL và `src/domain/social.ts`; unit test đối chiếu hai nơi.

### 3.2 Quyền

- Học sinh **không** đọc/ghi thẳng bảng nào (có test). Chỉ gọi hàm `security definer`: `student_social_overview`, `student_send_friend_request`, `student_respond_friend_request`, `student_remove_friend`, `student_send_gift`, `student_report_gift`. Mỗi hàm kiểm tra: người gọi là học sinh **đang hoạt động** (bị khoá thì không dùng được), lớp đã bật, người kia **cùng lớp, có tài khoản, đang hoạt động**.
- Học sinh chỉ thấy về bạn khác: **tên** và Pokémon đồng hành (của bạn bè). Không thấy điểm, ảnh, số bạn bè hay quà của người khác.
- Giáo viên đọc bạn bè/quà/thu hồi/báo cáo của mình qua RLS, thu hồi bằng cách thêm dòng `student_gift_revocations`, gỡ quan hệ bạn bè được.

### 3.3 Ví và chống lạm dụng (`student_send_gift`)

- Khoá dòng học sinh người gửi (`for update`) trước khi kiểm tra, nên hai lần bấm cùng lúc được xếp hàng, không vượt hạn mức (atomic).
- 0-2 điểm/lần; tổng tuần ≤ hạn mức lớp; mỗi bạn ≤ hạn mức mỗi bạn (chặn "đổi điểm qua lại" giữa hai tài khoản: mỗi chiều tối đa 2 điểm/tuần); tối đa 10 món quà/ngày; tối đa 10 lời mời đang chờ.
- Tặng điểm **không trừ** Hào Quang người tặng (D2). Quà bị thu hồi **không trả lại** ví (để không lách hạn mức).
- Lỗi trả về dạng mã (`weekly_limit`, `friend_limit`...), app đổi thành câu tiếng Việt.

### 3.4 Hàng chờ điểm (D23)

- `teacher_pending_gift_adjustments()` (security invoker, RLS giáo viên) trả các dòng app cần thêm: `+n` cho quà có điểm chưa cộng (`gift-<id>`), `-n` cho quà đã cộng rồi bị thu hồi (`gift-revoke-<id>`). Quà thu hồi trước khi cộng thì không bao giờ được cộng.
- "Đã cộng" = sổ điểm có dòng `client_event_id` tương ứng (sổ điểm có ràng buộc duy nhất `student_id + client_event_id`). App (`useGiftCollector`) chỉ đổi `points` và thêm dòng lịch sử, rồi vòng lưu sẵn có ghi lên DB; bỏ qua dòng đã có trong lịch sử hoặc đã cộng trong phiên. **Không kích hoạt hiệu ứng game** (trứng, XP, rương tuần) để không đổi luật game.
- Học sinh thấy trạng thái quà: "Đang chờ cộng" / "Đã cộng" / "Thầy cô đã thu hồi".

### 3.5 Giao diện

- Học sinh (cổng, cột phải trên máy tính bảng/desktop theo D22): Ví điểm tặng, Bạn bè (lời mời, tặng quà, thôi làm bạn, kết bạn với bạn cùng lớp), Quà (nhận được / đã tặng, "Báo thầy cô"). Lớp chưa bật: một dòng nhẹ nhàng.
- Giáo viên: trang `/class/<lớp>/ban-be` ("Bạn bè & quà" trên thanh công cụ lớp): công tắc bật/tắt, hai hạn mức, nhật ký 100 quà gần nhất (thu hồi kèm lý do riêng), tab Báo cáo, tab Bạn bè (gỡ).

### 3.6 Tương tác lành mạnh (6.5)

Không có bảng xếp hạng quà/bạn bè; quà nhận được chỉ người nhận xem; danh sách bạn cùng lớp xếp theo tên, không kèm thông tin gì khác; lời nhắn chỉ là câu khen định sẵn; có nút báo cáo; giáo viên tắt được ngay.

## 4. Phương án đã cân nhắc

- **Ghi thẳng `students.points`:** bị app giáo viên ghi đè → loại.
- **Sửa app giáo viên chỉ gửi phần chênh lệch điểm:** đúng nhất về lâu dài nhưng đổi cách lưu của mọi tính năng game, rủi ro cao → để Phase 7 nếu cần.
- **Bộ đếm riêng không vào Hào Quang:** an toàn nhất nhưng Harry chọn cộng vào Hào Quang (D23).
- **Bảng "đã cộng" riêng:** dễ lệch với sổ điểm nếu app tắt giữa chừng → dùng chính sổ điểm làm dấu "đã cộng".

## 5. Rủi ro và việc chưa kiểm chứng

- Chưa chạy trên Supabase thật. Test SQL trên PostgreSQL 16 (cả kiểu dự án cũ và mới), chưa thử hai lần tặng **đồng thời** thật (khoá dòng chỉ được kiểm tra bằng đọc mã).
- Điểm tặng chỉ vào Hào Quang khi một máy giáo viên đang mở app (dữ liệu bảng). Nếu mở app ở hai máy cùng lúc, cả hai cùng cộng một quà vào bản trong bộ nhớ của mình; sổ điểm chỉ nhận một dòng và cả hai máy ghi cùng một số điểm nên không bị cộng đôi. Rủi ro còn lại là vấn đề có sẵn từ Phase 3: hai máy cùng sửa một học sinh thì lần lưu sau ghi đè lần trước. Đánh giá lại ở Phase 7.
- Tên học sinh hiện cho bạn cùng lớp (cần để kết bạn). Nếu Harry muốn chỉ hiện tên gọi (không họ), cần thêm cột tên hiển thị.
