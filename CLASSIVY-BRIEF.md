# CLASSIVY-BRIEF.md

Tóm tắt trạng thái dự án để chuyển sang chat/phiên sau. Cập nhật cuối mỗi Phase. Chi tiết tasks ở `PLAN.md`.

**Cập nhật lần cuối:** 2026-10-26 (Phase 1: code xong S0-S15, chờ nghiệm thu S16)

## 1. Sản phẩm

Classivy (tên cũ: Imperial School / Cung Đình Học Đường) là web app lớp học gamification của Harry, giáo viên tiếng Anh cấp 2 tại hai trung tâm Sun Santa và Smartie. Giáo viên cộng/trừ điểm, điểm danh, kiểm tra bài tập, chọn ngẫu nhiên học sinh, nuôi Pokémon, đánh Boss, quay Lucky Wheel, chơi Cá Ngựa.

Mục tiêu đợt cải tổ: (1) đổi thương hiệu sang Classivy; (2) tách `App.tsx` khổng lồ thành nhiều file/màn hình; (3) giáo viên tạo, sửa, xoá, khoá tài khoản học sinh; (4) học sinh đăng nhập xem tài khoản của mình; (5) học sinh kết bạn trong lớp, tặng quà, tặng điểm.

## 2. Stack

React 19 + Vite 6 + TypeScript, react-router-dom 7, Tailwind (CDN, sẽ đổi ở Phase 2), Supabase (Auth + Postgres), Vercel, Gemini API (lời thông báo). Vitest (unit) + Playwright (smoke test).

## 3. Quyết định đã chốt

- Học sinh đăng nhập bằng **tên đăng nhập + mật khẩu do giáo viên cấp** (email ảo nội bộ, tạo qua Edge Function).
- Tặng điểm dùng **ví "điểm tặng" riêng, có hạn mức theo tuần**; không trừ điểm xếp hạng của người tặng.
- Thứ tự: **tách App.tsx trước**, rồi mới làm dữ liệu/tài khoản.
- **Bỏ chủ đề cung đình**; giữ Pokémon/Boss theo nhận diện Classivy (xanh rừng, xanh lá, vàng, tím).
- Bạn bè chỉ trong cùng lớp; không chat tự do.
- North Star thiết kế: **"Lá non trong tấm khiên"** (Harry xác nhận 2026-10-26).
- Thư mục `.claude/` (skills) được commit vào git.
- Bỏ hệ cấp bậc cung đình và "Thánh chỉ"/Gemini; bảng Ban thưởng/Phạt dùng Trainer Level (D7, 2026-10-27) - làm ở task 2.0 đầu Phase 2.
- Phase 1: React Context + hook (không thêm thư viện state), `react-router-dom` + `vercel.json`, Playwright làm lưới an toàn, làm trên nhánh `refactor/phase-1-split` (lấy theo mặc định đề xuất khi Harry yêu cầu hoàn thành Phase 1).

## 4. Trạng thái hiện tại

- Phase 0 (nền móng và thương hiệu): hoàn thành.
- Phase 1 (tách App.tsx): code xong S0-S15 trên nhánh `refactor/phase-1-split` (đã push). Còn S16: Harry chạy checklist hồi quy trên bản preview rồi gộp vào `main`.
- Hành vi giữ nguyên: smoke test so DOM và dữ liệu đồng bộ với ảnh gốc tạo từ code trước khi tách, đều khớp.
- Chưa đổi schema, chưa có migration nào mới. Supabase thật vẫn ở schema cũ (`profiles`, `user_settings`).

## 5. Bản đồ repo (hiện tại)

- `src/app/`: khung app (`App.tsx` ~20 dòng, `AppRoutes`, `AppLayout`, `AppContext`), `controller/` (gom state/hành động), `providers/` (`GameDataProvider` + `gameData/` đồng bộ Supabase/localStorage, `UiEventsProvider`).
- `src/features/<tính năng>/`: state, hành động, giao diện của class, students, attendance, homework, random, ludo, wheel, shop, pokemon, profile, plaza, settings, tools, feedback, auth.
- `src/domain/`: logic thuần có test (điểm, điểm danh, bài tập, battle, Cá Ngựa, Boss, Pokémon, tiến trình, trứng, ngày/tuần, thời tiết).
- `src/components/` (component dùng chung), `src/data/` (hằng số, `pokemonData`), `src/lib/` (Supabase, Gemini, âm thanh), `src/types/`.
- `tests/smoke/` + `fixtures/sample-class.json`: smoke test Playwright. `docs/architecture.md`: hướng dẫn kiến trúc.
- `public/brand/` logo; `brand-source/` file gốc; `docs/archive/` tài liệu Imperial School cũ.

## 6. Rủi ro đã biết

- Dữ liệu học sinh nằm trong một cột JSON của giáo viên, chưa phải bảng riêng; đây là nút thắt cho mọi tính năng học sinh. Phần cần thay ở Phase 3 đã gom vào `src/app/providers/gameData/`.
- Lỗi cấp bậc rỗng làm trắng trang: sẽ hết khi bỏ hệ cấp bậc (task 2.0). Lỗi Cá Ngựa lắc 6 đã sửa.
- Khoá localStorage còn tiền tố `imperial_*`; đổi tên phải có đoạn chuyển dữ liệu để không mất dữ liệu khách (Phase 2).
- Nội dung game còn từ ngữ cung đình (rank, Thánh chỉ, prompt Gemini); sẽ đổi ở Phase 2.
- Giới hạn gói miễn phí Supabase/Vercel (kể cả Edge Functions) cần xác minh lại trước Phase 3-4.

## 7. Quyết định còn mở

- Từ ngữ thay cho hệ cấp bậc cung đình (Phase 2).
- Có thêm vai trò phụ huynh hay không (chưa nằm trong phạm vi).

## 8. Bước tiếp theo

1. Harry: chạy checklist hồi quy (`docs/phase-1-split-plan.md` mục 7) trên bản preview Vercel của nhánh `refactor/phase-1-split` (dùng dữ liệu mẫu hoặc bản sao lưu, không dùng tài khoản thật nếu chưa xuất JSON). Đạt thì gộp vào `main`.
2. Phase 2: bắt đầu bằng task 2.0 bỏ hệ cấp bậc + Gemini (D7); sau đó hệ thiết kế Classivy, reskin, thuật ngữ trung tính, đổi khoá localStorage (kèm chuyển dữ liệu). Khi đổi giao diện, cập nhật ảnh gốc smoke test (`npm run smoke -- --update-snapshots`).
