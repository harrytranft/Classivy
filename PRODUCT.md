# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Giáo viên (người dùng chính hiện nay):** Harry, giáo viên tiếng Anh cấp 2 tại hai trung tâm Sun Santa và Smartie, và có thể giáo viên khác. Dùng app trên laptop, chiếu lên màn hình lớp trong giờ dạy: cộng/trừ điểm, điểm danh, kiểm tra bài tập, gọi ngẫu nhiên học sinh, chạy các trò chơi lớp. Thao tác phải nhanh, ít bước, vì đang đứng lớp.
- **Học sinh 11-15 tuổi:** hiện chỉ nhìn màn chiếu, chưa tự đăng nhập. Từ Phase 5 có cổng học sinh riêng, ưu tiên điện thoại.
- Vai trò phụ huynh: chưa nằm trong phạm vi (quyết định còn mở).

## Product Purpose

Giúp giáo viên giữ lớp học vui, có động lực và an toàn bằng gamification: điểm "Hào Quang", Pokémon đồng hành, Boss lớp, Cá Ngựa, Vòng quay. Thành công là học sinh muốn tham gia, được ghi nhận tiến bộ, và giáo viên điều khiển lớp dễ dàng hơn trong giờ dạy.

## Positioning

Do một giáo viên đang đứng lớp làm ra và dùng hằng ngày, gắn với nhịp một tiết học thật (điểm danh, bài tập, gọi học sinh, phần thưởng). Về sau học sinh có tài khoản riêng do giáo viên cấp, kết bạn trong lớp và tặng quà trong khuôn khổ giáo viên kiểm soát.

## Operating Context

- Trong giờ dạy: màn chiếu lớp học, laptop của giáo viên, cả lớp cùng nhìn một màn hình.
- Ngoài giờ: giáo viên chỉnh cài đặt, kỹ năng, phần thưởng, sao lưu dữ liệu.
- Dữ liệu trên Supabase, triển khai trên Vercel, đều ở gói miễn phí.

## Capabilities and Constraints

- Tính năng hiện có: lớp và học sinh, điểm Hào Quang (Ban thưởng/Phạt), điểm danh, bài tập, Random (solo, battle, Boss raid), Pokémon (trứng, tiến hoá, hợp nhất, kỹ năng), Shop, Tặng Pokémon, Cá Ngựa, Vòng quay, chia nhóm, hẹn giờ, Plaza, hồ sơ học sinh, Trainer Level và huy hiệu.
- Thuật ngữ đã chốt: "Hào Quang" là tên điểm (giữ nguyên); học sinh gọi là "Trainer" (D9). Hệ cấp bậc cung đình và "Thánh chỉ" đã bỏ (D7).
- Đang làm (roadmap): tài khoản học sinh do giáo viên tạo (đăng nhập bằng tên + mật khẩu), cổng học sinh, bạn bè trong cùng lớp, quà tặng, ví "điểm tặng" có hạn mức tuần.
- Ràng buộc: không chat tự do; không hiển thị thông tin cá nhân học sinh này cho học sinh khác; giáo viên luôn xem được log và tắt được tính năng xã hội; gói miễn phí Supabase/Vercel.

## Brand Commitments

- Tên: **Classivy** (trước đây Imperial School / Cung Đình Học Đường). Logo gốc ở `brand-source/`, bản dùng ở `public/brand/`; chỉ dùng logo gốc, không vẽ lại.
- Bỏ chủ đề cung đình (D4); giữ Pokémon và Boss.
- North Star thiết kế đã được Harry xác nhận: **"Lá non trong tấm khiên"** (D6).
- Văn bản giao diện bằng tiếng Việt, giọng thân thiện, hợp học sinh 11-15 tuổi.

## Evidence on Hand

- Dữ liệu mẫu cho kiểm thử: `fixtures/sample-class.json` (2 lớp, 12 học sinh giả).
- Chưa có lời chứng thực, số liệu sử dụng hay khách hàng công khai; không được bịa.

## Product Principles

1. Giáo viên đang đứng lớp: mọi thao tác thường dùng phải làm được trong vài giây, nhìn rõ từ cuối lớp.
2. Ghi nhận tiến bộ, không bêu xấu: không xếp hạng cuối lớp công khai, phần thưởng có ý nghĩa.
3. An toàn cho trẻ vị thành niên đi trước tính năng xã hội.
4. Không làm mất dữ liệu của giáo viên khi app thay đổi.

## Accessibility & Inclusion

Học sinh 11-15 tuổi nhìn màn chiếu từ xa: chữ và số điểm phải đọc được từ cuối lớp, màu không phải tín hiệu duy nhất, tương phản đạt WCAG AA. Cổng học sinh (Phase 5) dùng điện thoại: vùng bấm tối thiểu 44px.
