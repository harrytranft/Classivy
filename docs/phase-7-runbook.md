# Phase 7 - Hướng dẫn chạy migration hardening và dọn dữ liệu cũ (cho Harry)

Làm lần lượt, **dev trước, production sau**. Chưa làm bước nào trên Supabase thật cho tới khi Harry tự chạy và xác nhận.

File liên quan:
- Migration 1 (bảo mật + chống ghi đè hai máy): `supabase/migrations/20261101100000_phase7_hardening.sql` (hoàn tác: `supabase/rollback/20261101100000_phase7_hardening_down.sql`)
- Migration 2 (xoá dữ liệu cũ, **không hoàn tác được dữ liệu**): `supabase/migrations/20261101110000_drop_legacy_data.sql`
- Thiết kế: `docs/adr/0005-phase-7-hardening.md`. Rà soát: `docs/security-review-phase7.md`

## Điều cần biết trước

- Thứ tự an toàn: **migration 1 → đưa app mới lên (gộp nhánh) → migration 2**. App mới chạy được cả trước lẫn sau migration 1 (tự dùng cách lưu cũ nếu DB chưa có hàm mới).
- Sau migration 1, tài khoản học sinh không gọi được API dữ liệu giáo viên nữa. Giáo viên không thấy khác biệt.
- Migration 2 tự dừng (không xoá gì) nếu còn tài khoản giáo viên chưa nâng cấp dữ liệu sang bảng mới.

## Bước 1 - Dự án dev (`classivy-dev`)

- [ ] 1.1 SQL Editor: chạy migration 1. Mong đợi "Success. No rows returned".
- [ ] 1.2 Chạy app nhánh Phase 7 với dự án dev, đăng nhập giáo viên: cộng/trừ điểm, điểm danh, mở lại trang. Mọi thứ lưu bình thường.
- [ ] 1.3 **Thử hai máy:** mở app giáo viên ở 2 cửa sổ (hoặc 2 máy). Cửa sổ A cộng điểm một em; trong vòng vài giây cửa sổ B cũng cộng điểm **cùng em đó** (B chưa tải lại). Mong đợi: một cửa sổ hiện banner vàng "Dữ liệu vừa được đổi ở máy khác" và tự tải lại; điểm cuối cùng là của lần lưu đầu tiên, **không có điểm "ma"**. Bấm "Đã hiểu", làm lại thao tác: lưu được.
- [ ] 1.4 Đăng nhập một tài khoản học sinh: hồ sơ, bạn bè, quà vẫn chạy như trước.
- [ ] 1.5 Trang Tài khoản học sinh: khoá/mở khoá một em, rồi quay lại trang lớp cộng điểm em đó: **không** bị banner (đổi tài khoản không tính là sửa dữ liệu lớp).
- [ ] 1.6 Tải ảnh đại diện mới cho một em: ảnh vẫn rõ, nhẹ hơn trước.
- [ ] 1.7 Cài đặt > "Export JSON Backup" trên dev, rồi chạy migration 2. Mong đợi "Success". Tải lại app: mọi thứ như cũ.
- [ ] 1.8 Supabase Dashboard > **Advisors > Security**: chụp/ghi lại cảnh báo còn lại (nếu có) gửi mình.
- [ ] 1.9 Báo mình kết quả 1.3, 1.5, 1.8.

## Bước 2 - Production

- [ ] 2.1 Cài đặt > "Export JSON Backup" trong app thật. **Giữ file này cẩn thận** (là bản lưu duy nhất của dữ liệu cũ sau bước 2.4).
- [ ] 2.2 Chạy migration 1 trên production.
- [ ] 2.3 Gộp nhánh Phase 7 vào `main` (Vercel đưa app mới lên). Mở app, thử nhanh như 1.2.
- [ ] 2.4 Chạy migration 2 trên production. Nếu báo "Còn N tài khoản giáo viên chưa nâng cấp": đăng nhập app bằng các tài khoản đó để nâng cấp, rồi chạy lại.
- [ ] 2.5 Advisors > Security như 1.8.

## Nếu có sự cố

- **Banner "đổi ở máy khác" hiện liên tục khi chỉ dùng một máy:** báo mình ngay; tạm thời chạy file hoàn tác của migration 1 (app tự quay về cách lưu cũ).
- **Giáo viên không thấy lớp/học sinh sau migration 1:** kiểm tra tài khoản đó trong `profiles` có `role = 'teacher'` (xem câu lệnh ở `docs/phase-5-runbook.md` bước 1.1b).
- **Migration 2 đã chạy và cần dữ liệu cũ:** khôi phục từ file sao lưu JSON (Cài đặt > Khôi phục). Không có cách nào khác.
