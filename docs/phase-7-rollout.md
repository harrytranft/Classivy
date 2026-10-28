# Kế hoạch triển khai Classivy từng lớp (task 7.4) và theo dõi gói miễn phí (7.2)

## Giai đoạn

| Giai đoạn | Lớp | Bật | Thời gian | Điều kiện sang giai đoạn sau |
|---|---|---|---|---|
| 0. Chuẩn bị | - | Chạy `docs/phase-7-runbook.md` (dev rồi production), sao lưu | 1 buổi | Runbook xong, Advisors không còn cảnh báo bảo mật |
| 1. Pilot | **1 lớp** (lớp anh dạy đều nhất) | Tài khoản học sinh + hồ sơ. Bạn bè & quà **tắt** | 1 tuần | ≥ 80% em đăng nhập và đổi mật khẩu được; không lỗi mất điểm |
| 2. Pilot xã hội | Cùng lớp đó | Bật Bạn bè & quà | 1-2 tuần | Không có báo cáo quà xấu chưa xử lý; không thấy đổi điểm qua lại bất thường trong nhật ký quà |
| 3. Mở rộng | Thêm 2-3 lớp mỗi tuần | Tài khoản trước, xã hội sau 1 tuần | 3-4 tuần | Như trên, theo từng lớp |
| 4. Toàn bộ | Mọi lớp ở Sun Santa và Smartie | Theo lớp | - | - |

## Mỗi lớp mới

1. Trang lớp > Tài khoản học sinh > **Tạo cho cả lớp** > **In thẻ** (mật khẩu chỉ hiện một lần).
2. Dành 10 phút trên lớp: phát thẻ, cho học sinh đăng nhập và đổi mật khẩu (hướng dẫn: `docs/huong-dan/hoc-sinh.md`).
3. Gửi thư phụ huynh (`docs/huong-dan/thu-gui-phu-huynh.md`) nếu trung tâm yêu cầu.
4. Một tuần sau mới bật Bạn bè & quà; nói trước luật "tặng để khen, không để đổi điểm".

## Theo dõi hằng tuần (5 phút)

- Supabase Dashboard > **Reports / Usage**: dung lượng DB (gói Free 500 MB), băng thông, số người dùng hoạt động. Ước tính từ `npm run test:load`: 350 học sinh với 200 dòng điểm mỗi em ≈ 30 MB, nên còn rất xa giới hạn.
- **Edge Functions > student-accounts > Invocations**: chỉ tăng khi tạo/khoá/đặt lại tài khoản.
- **Advisors > Security / Performance** sau mỗi lần chạy migration.
- Trang **Bạn bè & quà** của từng lớp: tab Báo cáo.
- Lưu ý gói Free: dự án **không hoạt động 7 ngày sẽ bị tạm dừng** (kỳ nghỉ dài: đăng nhập app ít nhất mỗi tuần một lần, hoặc bấm Restore trong Dashboard khi quay lại).

## Dừng khẩn cấp

- Tắt Bạn bè & quà của lớp (công tắc ở trang Bạn bè & quà).
- Khoá tài khoản học sinh có vấn đề (trang Tài khoản học sinh).
- Lỗi app sau khi cập nhật: Vercel > Deployments > chọn bản trước > **Promote to Production**.
