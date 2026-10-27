---
name: Classivy
description: Lớp học gamification cho giáo viên và học sinh cấp 2 - lá non lớn lên trong tấm khiên an toàn.
status: official (chốt 2026-10-27, task 2.1; reskin đang làm theo từng màn)
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
  surface: "#ffffff"
  line: "#e6e2d4"
  tint-leaf: "#f4f8f1"
  tint-muted: "#f1efe7"
  track: "#ebe8dc"
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
  nav-rail:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.cream}"
    width: "84px"
  nav-item-active:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.forest-deep}"
    rounded: "{rounded.md}"
  shield-score:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.gold-light}"
    size: "56px x 64px"
---

# Design System: Classivy

> Trạng thái: **chính thức** (task 2.1, 2026-10-27; gộp bản nháp từ logo với những gì đã dựng thật). Token nằm trong `tailwind.config.js` dưới tiền tố `brand-` (ví dụ `bg-brand-forest`, `rounded-brand-lg`); thành phần ở `src/components/ui/`. Màn đã reskin: khung app (thanh điều hướng trái), trang chọn lớp, trang lớp (thanh công cụ, thẻ học sinh, dock công cụ), bảng chờ đăng nhập. Các màn còn lại vẫn mang giao diện đỏ-vàng cũ cho tới khi reskin (task 2.4).

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
- **Trung tính:** nền trang `cream` #fefdf9, chữ `ink` #0c2527. Thẻ và thanh công cụ dùng `surface` trắng với viền `line` #e6e2d4 để nổi trên nền kem. `tint-leaf` #f4f8f1 cho ô Pokémon/tiến bộ trong thẻ, `tint-muted` #f1efe7 cho chip trung tính, `track` #ebe8dc cho rãnh thanh tiến độ. Chữ phụ dùng `ink` ở độ đậm 65-70% (không dùng xám rời).
- **Trạng thái:** `danger` #c0392b (trừ điểm, HP thấp, xoá), `success` = `emerald`, `warning` = `gold` (chữ cảnh báo trên nền sáng dùng #8f5500 để đủ tương phản).

**Vai trò theo vùng (chiến lược "đủ bảng màu, khung đậm"):** thanh điều hướng trái là một khối xanh lấy đúng nền biểu tượng app (`bg-brand-shield`: sáng #0a9a69 quanh logo, đậm dần #04774f -> #015638 -> #043624), bo tròn hai góc phải 28px; nội dung trên nền `cream`; vàng chỉ xuất hiện ở điểm Hào Quang (tấm khiên), nút "Nhận quà" và danh hiệu; tím chỉ ở "Tặng quà"/xã hội.

**Tương phản đã đo (2026-10-27):** chữ phụ ink 65% trên trắng 5,1:1; trên `tint-leaf` 4,9:1; nhãn điều hướng cream 80% trên `forest-deep` 10,6:1; "Tặng quà" `violet-soft` trên `forest-deep` 4,7:1; số điểm `gold-light` trên `forest` 9,1:1; chữ trên nút `danger` 5,4:1; chữ `forest-deep` trên nút vàng 9,4:1. Không dùng `ink` 50-60% cho chữ (dưới 4,5:1).

Quy tắc: chữ trên nền `forest`/`forest-deep` dùng `cream`; chữ trên nền `gold` dùng `forest-deep`. Mọi cặp chữ/nền phải đạt tương phản WCAG AA (kiểm tra bằng skill `accessibility-review` ở Phase 2).

## Typography

Một họ chữ cho toàn app: **Plus Jakarta Sans** (chính), **Be Vietnam Pro** (dự phòng), đều có bộ dấu tiếng Việt; tải từ Google Fonts trong `index.html`. Trong `tailwind.config.js`, `fontFamily.sans` (và tên gọi khác `font-brand`) trỏ tới bộ này, nên `<body>` và mọi class `font-sans` dùng cùng một phông; không thêm `font-[...]`, serif hay phông khác. Playfair Display (`font-royal`) đã bỏ hẳn (2026-10-27).

- Tiêu đề trang 30px/800, tên học sinh trên thẻ 20px/800, chữ thường 15px, nút 14px/700.
- Số (điểm, HP, XP, giờ) dùng `tabular-nums` để không nhảy khi thay đổi.
- Cỡ tối thiểu: màn giáo viên (laptop/màn chiếu) 12px cho nhãn gọn (chip, nhãn điều hướng, chữ phụ trên thẻ); cổng học sinh trên điện thoại (Phase 5) chữ nền 16px, nhãn 13px.
- Không viết hoa toàn bộ và giãn chữ cho nhãn (thói quen của bản cũ); dùng độ đậm và cỡ chữ để phân cấp. Tiêu đề khối dùng `font-extrabold`.
- Cỡ chữ nhỏ nhất trong code: `text-xs` (12px); riêng nhãn trong ô bàn cờ Cá Ngựa và huy hiệu nhỏ dùng 10px.

## Layout

- Hai bố cục tách bạch: **Giáo viên** (nhiều thông tin, thao tác nhanh) và **Học sinh** (một cột, ưu tiên điện thoại, nút lớn dễ bấm, tối thiểu 44px).
- Khung giáo viên: thanh điều hướng trái cố định rộng 84px, luôn hiện (icon + chữ trắng; mục đang mở nền kem; "Tặng quà" cũng trắng như các mục khác, Harry duyệt 2026-10-27), cuối thanh là sao lưu / khôi phục / trạng thái đồng bộ và ảnh tài khoản. Không giấu điều hướng ngoài mép màn hình.
- Trang lớp: thanh công cụ trên cùng (tìm kiếm, chọn lớp, Check đi học, Check Homework, Thêm Trainer), lưới thẻ học sinh 1-4 cột, dock công cụ cố định ở đáy: mỗi nút là ô icon 52px + chữ ngắn; **phóng to kiểu dock macOS** (ô gần con trỏ to dần tới 84px theo khoảng cách, tầm ảnh hưởng 140px, lò xo `motion`; rời chuột thì co về). Người dùng bật "giảm chuyển động" thì không phóng to.
- Lưới 4/8px; khoảng cách giữa các nhóm nội dung dùng `lg` (24px).
- Phản hồi đầy đủ ở ba điểm: điện thoại, máy tính bảng, máy chiếu lớp học.

## Elevation & Depth

Phẳng theo lớp màu là chính: nền `cream`, bề mặt `surface` trắng có viền `line`. Bóng luôn có độ lệch xuống và mờ mềm, ví dụ thẻ `0 1px 2px rgba(12,37,39,.04), 0 6px 18px -8px rgba(12,37,39,.14)`; khi rê chuột thẻ nhích lên 2px và bóng ngả xanh. Dock đáy có bóng sâu hơn để tách khỏi lưới thẻ. **Đã bỏ "liquid glass"** (kính mờ, viền trắng phát sáng, lớp bóng loáng) của bản cũ: tốn hiệu năng trên máy yếu, giảm tương phản trên màn chiếu.

## Shapes

Bo góc 8 / 14 / 22px (`rounded-brand-sm/md/lg`) và dạng viên thuốc cho chip. Thẻ và thanh công cụ 22px, nút và ô nhập 14px, ô nhỏ trong thẻ 8-14px.

Hình khiên và chiếc lá là hai hình biểu tượng chính và cũng là **dấu ấn riêng** của giao diện:
- **Tấm khiên Hào Quang** (`ShieldScore`): điểm của mỗi học sinh nằm trong tấm khiên `forest` viền `gold`, số `gold-light`. Điểm âm đổi sang khiên nền đỏ nhạt viền `danger`.
- **Chồi lá** (`ProgressBar sprout`): thanh Trainer XP có chiếc lá non ở đầu, lớn dần theo tiến độ.
Ngôi sao bốn cánh dùng làm tia lấp lánh khi thưởng (chưa làm).

## Components

Thành phần trong `src/components/ui/` (nhập qua `src/components/ui/index.ts`):

- **Button**: `primary` (forest), `reward` (vàng, chỉ cho phần thưởng), `secondary` (trắng viền forest), `ghost`, `danger`; cỡ `sm` 36px / `md` 44px / `lg` 48px; có `icon`, `loading` (vòng xoay + `aria-busy`), `disabled` (mờ 50%). Nhấn: nhích xuống 1px.
- **Chip**: tông `neutral`, `forest`, `leaf`, `gold`, `violet`, `danger`, `sky`; cấp, danh hiệu, chuỗi, tên lớp.
- **ProgressBar**: tông `leaf`, `gold`, `warning`, `danger`, `muted`; `sprout` cho XP; luôn có `label` cho trình đọc màn hình (`role="progressbar"`).
- **ShieldScore**: điểm Hào Quang trong tấm khiên.
- **Card**: bề mặt trắng viền `line`, bo 22px. Không lồng Card trong Card.
- **EmptyState**: icon, tiêu đề, lời giải thích, hành động.
- **Modal**: nền phủ `forest-deep` 60%, thẻ trắng bo 22px, tiêu đề + icon + nút X (`aria-label`), phím Esc để đóng, bấm nền để đóng (tắt được), giữ thứ tự chồng lớp qua `zIndex`; cỡ `sm/md/lg/xl/full`; vùng `footer` cho nút hành động.
- **Thông báo Pokémon** (`PokemonReactionToast`): thẻ nổi trên cùng, không phủ chặn màn hình; bấm ra chỗ khác hoặc Esc thì tắt, và cú bấm đó vẫn tác dụng lên nút bên dưới.
- Chưa làm: Sheet cho điện thoại, Avatar chuẩn (dùng `StudentAvatar`).

Biểu tượng điều khiển (điều hướng, thanh công cụ, dock, nút trên thẻ) dùng bộ `lucide-react`, nét 2px, cỡ 18-24px. Emoji chỉ dùng cho **nội dung game** (kỹ năng, phần thưởng, Pokémon, danh hiệu) vì giáo viên tự đặt.

Trạng thái bắt buộc: hover, focus bàn phím (viền `emerald` 3px, lệch 2px, đặt chung trong `src/index.css`), disabled, loading, trống, lỗi. Nút chỉ hiện khi rê chuột (vắng/có, cộng/trừ trên thẻ) cũng phải hiện khi focus bằng bàn phím. Bôi chọn chữ nền `gold-light`, thanh cuộn màu `forest`.

Biểu tượng ứng dụng: `public/brand/classivy-app-icon-dark.png` (nền xanh) và `classivy-app-icon-light.png` (nền sáng). Logo ngang: `classivy-logo-horizontal.png`. Chỉ dùng logo gốc, không vẽ lại, không kéo méo, chừa lề tối thiểu bằng chiều rộng ngôi sao nhỏ.

## Do's and Don'ts

**Nên:**

- Giữ vàng cho phần thưởng, tím cho xã hội, xanh cho thương hiệu và tiến bộ.
- Mọi thông báo, lời nhắn học sinh thấy dùng giọng tích cực, ngắn gọn, dễ hiểu với lứa 11-15 tuổi.
- Có trạng thái trống và trạng thái lỗi thân thiện cho mọi danh sách.

**Không nên:**

- Không dùng họa tiết, thuật ngữ cung đình của bản cũ (Vua, Hoàng hậu, Nô tài, Thánh chỉ...).
- Không dùng nút gradient nhiều màu, lớp bóng loáng, kính mờ trang trí, chữ gradient.
- Không làm mờ các thẻ khác khi rê chuột vào một thẻ (bản cũ có, gây lỗi "kẹt mờ"; đã bỏ).
- Không dùng emoji thay icon cho nút điều khiển của app.
- Không hiển thị bảng xếp hạng tạo cảm giác bêu xấu; điểm âm và xếp hạng cuối lớp không công khai cho học sinh khác.
- Không dùng chỉ màu để truyền đạt trạng thái; luôn kèm biểu tượng hoặc chữ.
- Không gắn nhãn hay biểu tượng gây hiểu nhầm là sản phẩm của bên thứ ba.
