# Phase 6 - Hướng dẫn chạy migration bạn bè & quà tặng (cho Harry)

Làm lần lượt từ trên xuống, **dev trước, production sau**. Chưa làm bước nào trên Supabase thật cho tới khi Harry tự chạy và xác nhận.

File liên quan:
- Migration: `supabase/migrations/20261031100000_phase6_social.sql`
- Hoàn tác: `supabase/rollback/20261031100000_phase6_social_down.sql`
- Thiết kế: `docs/adr/0004-phase-6-social.md`

## Điều cần biết trước

- Cần các migration Phase 3, 4, 5 và `20261030110000_sync_profile_role.sql` đã chạy. Không cần triển khai lại Edge Function.
- Migration **chỉ thêm**: 3 cột cho `classes` (mặc định **tắt**), 4 bảng mới (bạn bè, quà, thu hồi, báo cáo) và các hàm. Không đổi dữ liệu hiện có. Chạy lại nhiều lần không sao.
- Sau khi chạy, **không lớp nào bật sẵn**: học sinh chỉ thấy "Bạn bè và quà tặng sẽ mở khi thầy cô bật cho lớp em".
- Thứ tự an toàn: **migration trước, giao diện sau**. Nếu giao diện lên trước, trang "Bạn bè & quà" báo chưa tải được và học sinh thấy "Chưa tải được bạn bè và quà"; phần còn lại của app không ảnh hưởng.
- Điểm tặng chỉ vào Hào Quang khi **app giáo viên đang mở** (tự kiểm tra khi mở app, khi quay lại tab và mỗi 3 phút). Trước đó học sinh thấy "Đang chờ cộng".

## Bước 1 - Dự án dev (`classivy-dev`)

- [ ] 1.1 SQL Editor của dự án dev: dán toàn bộ file migration, bấm **Run**. Mong đợi: "Success. No rows returned".
- [ ] 1.2 Chạy app ở máy với dự án dev (nhánh Phase 6). Chuẩn bị một lớp có **ít nhất 3 học sinh có tài khoản** (A, B, C).
- [ ] 1.3 Giáo viên: trang lớp > **Bạn bè & quà** > bật công tắc > **Lưu cài đặt**.
- [ ] 1.4 Học sinh A (cửa sổ ẩn danh, khổ điện thoại): "Kết bạn với bạn cùng lớp" > Kết bạn với B. Học sinh B (cửa sổ khác): thấy lời mời > **Đồng ý**.
- [ ] 1.5 A tặng B: sticker + lời nhắn + **+2**. Thử tặng B thêm +1: phải báo "Tuần này em đã tặng bạn ấy đủ điểm rồi". B bấm **Cập nhật**: thấy quà "Đang chờ cộng".
- [ ] 1.6 Giáo viên mở trang lớp (hoặc đợi tối đa 3 phút, hoặc chuyển tab rồi quay lại): Hào Quang của B tăng 2, lịch sử có "🎁 Quà từ A: +2 Hào Quang". B bấm **Cập nhật**: quà chuyển "Đã cộng". **Tải lại trang giáo viên vài lần: điểm của B không tăng thêm.**
- [ ] 1.7 Giáo viên: **Bạn bè & quà** > Nhật ký quà > **Thu hồi** quà đó. Đợi app gom (như 1.6): Hào Quang của B giảm 2, lịch sử có dòng "↩️ Thu hồi...". B thấy "Thầy cô đã thu hồi".
- [ ] 1.8 B bấm **Báo thầy cô** trên một món quà: giáo viên thấy ở tab **Báo cáo**.
- [ ] 1.9 Khoá tài khoản C ở trang Tài khoản học sinh: A không còn thấy C trong danh sách. Mở khoá lại.
- [ ] 1.10 Giáo viên **tắt** tính năng: A bấm Cập nhật, chỉ còn dòng "sẽ mở khi thầy cô bật".
- [ ] 1.11 (Tuỳ chọn) Thử trên máy tính và máy tính bảng: khu Bạn bè & quà nằm cột phải.
- [ ] 1.12 Báo mình kết quả, đặc biệt 1.6 (không cộng trùng) và 1.7 (thu hồi).

## Bước 2 - Production (chỉ sau khi bước 1 ổn)

- [ ] 2.1 Sao lưu: Cài đặt > "Export JSON Backup" trong app thật.
- [ ] 2.2 SQL Editor của dự án production: chạy migration như 1.1.
- [ ] 2.3 Merge nhánh Phase 6 để Vercel đưa giao diện mới lên.
- [ ] 2.4 Bật thử cho **một lớp** trước (pilot), theo dõi nhật ký quà vài ngày rồi mới bật thêm lớp.

## Nếu có sự cố

- **Điểm tặng không vào Hào Quang:** app giáo viên phải đang mở, lớp dùng dữ liệu bảng (đã nâng cấp ở Phase 3). Tải lại trang giáo viên.
- **Muốn dừng ngay:** tắt công tắc của lớp (học sinh không tặng/kết bạn được nữa; quà đã gửi vẫn giữ).
- **Gỡ hẳn Phase 6:** chạy file hoàn tác. **Xoá toàn bộ bạn bè, quà, thu hồi, báo cáo**; điểm tặng đã cộng vào Hào Quang vẫn còn.
