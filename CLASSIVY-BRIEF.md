# CLASSIVY-BRIEF.md

Tóm tắt trạng thái dự án để chuyển sang chat/phiên sau. Cập nhật cuối mỗi Phase. Chi tiết tasks ở `PLAN.md`.

**Cập nhật lần cuối:** 2026-10-27 (Phase 2 đang làm: xong 2.0, 2.1, 2.2, 2.5, 2.7, 2.8; 2.3 phần lớn; bản mẫu 2.4 chờ duyệt)

## 1. Sản phẩm

Classivy (tên cũ: Imperial School / Cung Đình Học Đường) là web app lớp học gamification của Harry, giáo viên tiếng Anh cấp 2 tại hai trung tâm Sun Santa và Smartie. Giáo viên cộng/trừ điểm, điểm danh, kiểm tra bài tập, chọn ngẫu nhiên học sinh, nuôi Pokémon, đánh Boss, quay Lucky Wheel, chơi Cá Ngựa.

Mục tiêu đợt cải tổ: (1) đổi thương hiệu sang Classivy; (2) tách `App.tsx` khổng lồ thành nhiều file/màn hình; (3) giáo viên tạo, sửa, xoá, khoá tài khoản học sinh; (4) học sinh đăng nhập xem tài khoản của mình; (5) học sinh kết bạn trong lớp, tặng quà, tặng điểm.

## 2. Stack

React 19 + Vite 6 + TypeScript, react-router-dom 7, Tailwind 3.4 (build local, token `brand-*` trong `tailwind.config.js`), Supabase (Auth + Postgres), Vercel. Vitest (unit) + Playwright (smoke test).

## 3. Quyết định đã chốt

- Học sinh đăng nhập bằng **tên đăng nhập + mật khẩu do giáo viên cấp** (email ảo nội bộ, tạo qua Edge Function).
- Tặng điểm dùng **ví "điểm tặng" riêng, có hạn mức theo tuần**; không trừ điểm xếp hạng của người tặng.
- Thứ tự: **tách App.tsx trước**, rồi mới làm dữ liệu/tài khoản.
- **Bỏ chủ đề cung đình**; giữ Pokémon/Boss theo nhận diện Classivy (xanh rừng, xanh lá, vàng, tím).
- Bạn bè chỉ trong cùng lớp; không chat tự do.
- North Star thiết kế: **"Lá non trong tấm khiên"** (Harry xác nhận 2026-10-26).
- Thư mục `.claude/` (skills) được commit vào git.
- Mỗi lớp một trang `/class/<lớp>`, `/class` là trang chọn lớp; Cá Ngựa, Vòng quay, Tặng Pokémon là trang con của lớp; Random vẫn là hộp thoại (D8, 2026-10-27, đã làm trên nhánh Phase 1).
- Bỏ hệ cấp bậc cung đình và "Thánh chỉ"/Gemini; bảng Ban thưởng/Phạt dùng Trainer Level (D7, 2026-10-27) - đã làm (task 2.0).
- Phase 1: React Context + hook (không thêm thư viện state), `react-router-dom` + `vercel.json`, Playwright làm lưới an toàn, làm trên nhánh `refactor/phase-1-split` (lấy theo mặc định đề xuất khi Harry yêu cầu hoàn thành Phase 1).

## 4. Trạng thái hiện tại

- Phase 0 (nền móng và thương hiệu): hoàn thành.
- Phase 1 (tách App.tsx, router, trang riêng theo lớp): hoàn thành, Harry nghiệm thu và đã gộp vào `main` (2026-10-27).
- Hành vi giữ nguyên: smoke test so DOM và dữ liệu đồng bộ với ảnh gốc tạo từ code trước khi tách, đều khớp.
- Phase 2 (nhánh `claude/charming-wright-inxhg1`): xong 2.0 (bỏ cấp bậc + Gemini), 2.1 (`DESIGN.md` chính thức + `PRODUCT.md`), 2.2 (Tailwind 3.4 local), 2.5/2.8 ("Học sĩ" -> "Trainer", D9), 2.7 (khoá `classivy_*`), sửa lỗi ghi đè bản lưu máy. 2.3: có Button/Card/Chip/ProgressBar/ShieldScore/EmptyState. 2.4: bản mẫu (khung app, trang chọn lớp, trang lớp) **chờ Harry duyệt** rồi mới reskin các màn còn lại.
- Chưa đổi schema, chưa có migration nào mới. App đã thôi đọc/ghi cột `ranks_male`/`ranks_female` (xoá cột ở Phase 3). Supabase thật vẫn ở schema cũ (`profiles`, `user_settings`).

## 5. Bản đồ repo (hiện tại)

- `src/app/`: khung app (`App.tsx` ~20 dòng, `AppRoutes`, `AppLayout`, `AppContext`), `controller/` (gom state/hành động), `providers/` (`GameDataProvider` + `gameData/` đồng bộ Supabase/localStorage, `UiEventsProvider`).
- `src/features/<tính năng>/`: state, hành động, giao diện của class, students, attendance, homework, random, ludo, wheel, shop, pokemon, profile, settings, tools, feedback, auth.
- `src/domain/`: logic thuần có test (điểm, điểm danh, bài tập, battle, Cá Ngựa, Boss, Pokémon, tiến trình, trứng, ngày/tuần).
- `src/components/` (component dùng chung), `src/data/` (hằng số, `pokemonData`), `src/lib/` (Supabase, âm thanh), `src/types/`.
- `tests/smoke/` + `fixtures/sample-class.json`: smoke test Playwright. `docs/architecture.md`: hướng dẫn kiến trúc.
- `public/brand/` logo; `brand-source/` file gốc; `docs/archive/` tài liệu Imperial School cũ.

## 6. Rủi ro đã biết

- Dữ liệu học sinh nằm trong một cột JSON của giáo viên, chưa phải bảng riêng; đây là nút thắt cho mọi tính năng học sinh. Phần cần thay ở Phase 3 đã gom vào `src/app/providers/gameData/`.
- Thuật ngữ: giữ "Hào Quang"; "Học sĩ" -> "Trainer" (D9). Còn mở: tên kỹ năng "Ý Chỉ Đồng Hành"; kỹ năng Pokémon lưu theo giáo viên nên tài khoản cũ vẫn thấy mô tả cũ cho tới khi tự sửa trong Cài đặt.
- SQL chờ gộp vào migration Phase 3: `docs/phase-3-pending-sql.md` (xoá cột cấp bậc, đổi tên mặc định).
- Giới hạn gói miễn phí Supabase/Vercel (kể cả Edge Functions) cần xác minh lại trước Phase 3-4.

## 7. Quyết định còn mở

- Từ ngữ thay cho hệ cấp bậc cung đình (Phase 2).
- Có thêm vai trò phụ huynh hay không (chưa nằm trong phạm vi).

## 8. Bước tiếp theo

Tiếp Phase 2: Harry duyệt bản mẫu giao diện trên preview; sau đó reskin các màn còn lại (2.4) theo `DESIGN.md`, làm Modal/Toast (2.3), rà truy cập (`accessibility-review`), rồi 2.9 tổng kết. Khi đổi giao diện, cập nhật ảnh gốc smoke test có chủ đích (`npm run smoke -- --update-snapshots`) và xem lại diff.
