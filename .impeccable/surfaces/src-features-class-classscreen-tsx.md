---
version: 1
slug: "src-features-class-classscreen-tsx"
primary_target: "src/features/class/ClassScreen.tsx"
related_targets: ["src/features/class/ClassPickerScreen.tsx","src/components/StudentCard.tsx","src/components/ClassDock.tsx","src/app/NavDock.tsx"]
---

# Trang lớp (giáo viên)

Mode: Operate. Người dùng: giáo viên đứng lớp, laptop nối màn chiếu, phòng sáng. Việc chính: chấm điểm nhanh, điểm danh, bài tập, mở trò chơi lớp. Hướng thiết kế do Harry ghim (màu logo, North Star "Lá non trong tấm khiên"), không bốc thăm.

## Direction contract

THESIS: Lớp học là khu vườn được che chở: điểm của mỗi Trainer nằm trong tấm khiên, tiến bộ mọc thành chồi lá. Từ chối kiểu bảng điều khiển xám một màu nhấn và kiểu cung đình đỏ-vàng-kính cũ.
OWN-WORLD: Thanh điều hướng khối forest-deep liền, nền cream, thẻ trắng viền line #e6e2d4 bo 22px, vàng chỉ cho Hào Quang và phần thưởng, tím cho tặng quà; Plus Jakarta Sans, số tabular; icon lucide nét 2px.
STORY: Giáo viên nhìn là biết ai đang có bao nhiêu Hào Quang, ai vắng, Pokémon nào yếu máu; một cú bấm để thưởng/trừ hoặc mở trò chơi.
FIRST VIEWPORT: Trái: thanh điều hướng 84px (Plaza, Lớp học, Tặng quà, Cài đặt; cuối là đồng bộ và tài khoản). Trên: thanh công cụ (tìm kiếm, chọn lớp, Check đi học, Check Homework, Thêm Trainer chính). Giữa: lưới 4 cột thẻ học sinh, khiên điểm góc phải dưới mỗi thẻ. Đáy: dock công cụ icon + chữ, "Nhận quà" vàng ở cuối.
FORM: Sản phẩm thao tác chuẩn (rail + toolbar + grid + dock); dấu ấn là ShieldScore và ProgressBar sprout. seed: none (unavailable)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
