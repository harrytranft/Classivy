---
name: Classivy
description: Lớp học gamification cho giáo viên và học sinh cấp 2 - lá non lớn lên trong tấm khiên an toàn.
status: draft-seed (North Star đã được Harry xác nhận 2026-10-26)
colors:
  forest-deep: "#002619"
  forest: "#014a2d"
  wordmark-green: "#044f38"
  emerald: "#298353"
  leaf: "#53c777"
  leaf-soft: "#a9d584"
  gold: "#f3bc4c"
  gold-deep: "#dbbe58"
  gold-light: "#fef1a5"
  violet: "#984fc2"
  violet-deep: "#7036a3"
  violet-soft: "#bb66dd"
  cream: "#fefdf9"
  ink: "#0c2527"
  danger: "#c0392b"
  warning: "#f3bc4c"
  success: "#298353"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.1
  headline:
    fontFamily: "Plus Jakarta Sans, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Plus Jakarta Sans, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "14px"
  lg: "22px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.cream}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.forest-deep}"
  button-reward:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.forest-deep}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.forest}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  card:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  chip-social:
    backgroundColor: "{colors.violet-soft}"
    textColor: "{colors.forest-deep}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: Classivy

> Trạng thái: **bản nháp (seed) dựng từ bộ logo**. Chưa có code theo hệ thiết kế này. Sẽ chạy lại chế độ "scan" và chốt chính thức ở Phase 2. Các mục đánh dấu *(đề xuất)* cần Harry xác nhận.

## Overview

**Creative North Star: "Lá non trong tấm khiên"**

Classivy là nơi giáo viên giữ lớp học an toàn (khiên) và học sinh lớn lên từng ngày (lá, ngôi sao). Giao diện phải gợi cảm giác được bảo vệ, được ghi nhận và có tiến bộ, không phải cảm giác thi đua gay gắt.

Hai nhóm người dùng với hai tâm thế khác nhau. Giáo viên dùng trong giờ dạy, trên máy chiếu hoặc máy tính, cần thao tác nhanh, ít chữ, ít bước. Học sinh cấp 2 dùng trên điện thoại, thích màu sắc, phần thưởng và sự vui nhộn, nhưng không được dẫn đến so bì hay bắt nạt.

**Key Characteristics:**

- Nền sáng kem ấm, xanh rừng đậm làm điểm nhấn thương hiệu, vàng chỉ dành cho phần thưởng và thành tích.
- Tím dùng cho yếu tố xã hội (bạn bè, quà tặng), không dùng cho trạng thái hệ thống.
- Bo góc mềm, bóng nhẹ, hình lá và khiên làm họa tiết chính. Không dùng họa tiết cung đình/hoàng gia của phiên bản cũ.
- Mặc định sáng; chế độ tối là việc sau này, chưa cam kết.

## Colors

Bảng màu lấy trực tiếp từ logo (đã đo trên 4 file gốc trong `brand-source/`).

- **Xanh rừng (`forest` #014a2d, `forest-deep` #002619):** màu thương hiệu, nền khiên, nút chính, chữ tiêu đề lớn. `wordmark-green` #044f38 là màu chữ "Classivy".
- **Xanh lá (`emerald` #298353, `leaf` #53c777, `leaf-soft` #a9d584):** tiến bộ, thành công, thanh XP/HP đầy.
- **Vàng (`gold` #f3bc4c, `gold-deep` #dbbe58, `gold-light` #fef1a5):** điểm, phần thưởng, viền khiên. Dùng tiết kiệm để giữ ý nghĩa "phần thưởng".
- **Tím (`violet` #984fc2, `violet-deep` #7036a3, `violet-soft` #bb66dd):** tương tác xã hội, quà tặng, bạn bè.
- **Trung tính:** nền `cream` #fefdf9, chữ `ink` #0c2527. Không dùng đen thuần hay trắng thuần cho nền chính.
- **Trạng thái:** `danger` #c0392b (đề xuất, chưa có trong logo), `success` = `emerald`, `warning` = `gold`.

Quy tắc: chữ trên nền `forest`/`forest-deep` dùng `cream`; chữ trên nền `gold` dùng `forest-deep`. Mọi cặp chữ/nền phải đạt tương phản WCAG AA (kiểm tra bằng skill `accessibility-review` ở Phase 2).

## Typography

Giữ hai họ chữ đang dùng trong app (Plus Jakarta Sans, Be Vietnam Pro) vì hỗ trợ tiếng Việt tốt. Bỏ Playfair Display (chữ "hoàng gia" của bản cũ) khi reskin. Cỡ chữ nền tối thiểu 16px trên điện thoại; nhãn nhỏ không dưới 13px.

## Layout

- Hai bố cục tách bạch: **Giáo viên** (nhiều thông tin, thao tác nhanh, dock điều hướng) và **Học sinh** (một cột, ưu tiên điện thoại, nút lớn dễ bấm, tối thiểu 44px).
- Lưới 4/8px; khoảng cách giữa các nhóm nội dung dùng `lg` (24px).
- Phản hồi đầy đủ ở ba điểm: điện thoại, máy tính bảng, máy chiếu lớp học.

## Elevation & Depth

Phẳng theo lớp màu là chính (cream trên cream-đậm hơn), bóng mềm chỉ dùng cho thẻ nổi và hộp thoại. Hiệu ứng "liquid glass" đang có ở dock được cân nhắc giữ lại ở Phase 2 nếu đạt tương phản và hiệu năng trên máy yếu.

## Shapes

Bo góc 8 / 14 / 22px và dạng viên thuốc cho chip. Hình khiên và chiếc lá là hai hình biểu tượng chính; ngôi sao bốn cánh dùng làm tia lấp lánh khi thưởng.

## Components

Các thành phần chuẩn sẽ nằm trong `src/components/ui/` sau Phase 2: Button (primary, reward, secondary, ghost), Card, Chip, Avatar, Modal/Sheet, Toast, ProgressBar (HP/XP), Badge, EmptyState. Mỗi thành phần phải có đủ các trạng thái: mặc định, hover, focus, disabled, loading, lỗi.

Biểu tượng ứng dụng: `public/brand/classivy-app-icon-dark.png` (nền xanh) và `classivy-app-icon-light.png` (nền sáng). Logo ngang: `classivy-logo-horizontal.png`. Chỉ dùng logo gốc, không vẽ lại, không kéo méo, chừa lề tối thiểu bằng chiều rộng ngôi sao nhỏ.

## Do's and Don'ts

**Nên:**

- Giữ vàng cho phần thưởng, tím cho xã hội, xanh cho thương hiệu và tiến bộ.
- Mọi thông báo, lời nhắn học sinh thấy dùng giọng tích cực, ngắn gọn, dễ hiểu với lứa 11-15 tuổi.
- Có trạng thái trống và trạng thái lỗi thân thiện cho mọi danh sách.

**Không nên:**

- Không dùng họa tiết, thuật ngữ cung đình của bản cũ (Vua, Hoàng hậu, Nô tài, Thánh chỉ...).
- Không hiển thị bảng xếp hạng tạo cảm giác bêu xấu; điểm âm và xếp hạng cuối lớp không công khai cho học sinh khác.
- Không dùng chỉ màu để truyền đạt trạng thái; luôn kèm biểu tượng hoặc chữ.
- Không gắn nhãn hay biểu tượng gây hiểu nhầm là sản phẩm của bên thứ ba.
