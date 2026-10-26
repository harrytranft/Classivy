# CLASSIVY-BRIEF.md

Tóm tắt trạng thái dự án để chuyển sang chat/phiên sau. Cập nhật cuối mỗi Phase. Chi tiết tasks ở `PLAN.md`.

**Cập nhật lần cuối:** 2026-10-26 (Phase 1, xong S2)

## 1. Sản phẩm

Classivy (tên cũ: Imperial School / Cung Đình Học Đường) là web app lớp học gamification của Harry, giáo viên tiếng Anh cấp 2 tại hai trung tâm Sun Santa và Smartie. Giáo viên cộng/trừ điểm, điểm danh, kiểm tra bài tập, chọn ngẫu nhiên học sinh, nuôi Pokémon, đánh Boss, quay Lucky Wheel, chơi Cá Ngựa.

Mục tiêu đợt cải tổ: (1) đổi thương hiệu sang Classivy; (2) tách `App.tsx` khổng lồ thành nhiều file/màn hình; (3) giáo viên tạo, sửa, xoá, khoá tài khoản học sinh; (4) học sinh đăng nhập xem tài khoản của mình; (5) học sinh kết bạn trong lớp, tặng quà, tặng điểm.

## 2. Stack

React 19 + Vite 6 + TypeScript, Tailwind (CDN, sẽ đổi ở Phase 2), Supabase (Auth + Postgres), Vercel, Gemini API (lời thông báo). Vitest cho test.

## 3. Quyết định đã chốt

- Học sinh đăng nhập bằng **tên đăng nhập + mật khẩu do giáo viên cấp** (email ảo nội bộ, tạo qua Edge Function).
- Tặng điểm dùng **ví "điểm tặng" riêng, có hạn mức theo tuần**; không trừ điểm xếp hạng của người tặng.
- Thứ tự: **tách App.tsx trước**, rồi mới làm dữ liệu/tài khoản.
- **Bỏ chủ đề cung đình**; giữ Pokémon/Boss theo nhận diện Classivy (xanh rừng, xanh lá, vàng, tím).
- Bạn bè chỉ trong cùng lớp; không chat tự do.
- North Star thiết kế: **"Lá non trong tấm khiên"** (Harry xác nhận 2026-10-26).
- Thư mục `.claude/` (skills) được commit vào git.

## 4. Trạng thái hiện tại

- Phase 0 (nền móng và thương hiệu): hoàn thành, xem `PLAN.md`.
- Phase 1: đang làm trên nhánh `refactor/phase-1-split`. Xong S2 (rút phần thuần ra `domain/`, `types/app.ts`, `features/`). S0 (lưới an toàn) và S1 (chuyển vào `src/`) chưa làm.
- Chưa đổi schema, chưa có migration nào mới.
- Supabase thật vẫn ở schema cũ (`profiles`, `user_settings`). Chưa có gì được xác nhận là đã thay đổi trên Supabase thật.

## 5. Bản đồ repo (hiện tại)

- `App.tsx` (~7.900 dòng): UI + state + nhiều logic. `AuthContext.tsx`, `supabaseClient.ts`, `supabaseData.ts`.
- Logic thuần có test: `bossSystem`, `gameEvents`, `expeditionSystem`, `pokemonProgression`, `trainerProgression`, `pokemonPassives`.
- `components/` (12 component nhỏ), `types.ts`, `constants.ts`, `pokemonData.ts`.
- `public/brand/` logo đã tối ưu; `brand-source/` file gốc.
- `docs/archive/` tài liệu Imperial School cũ (chỉ để tra cứu).

## 6. Rủi ro đã biết

- Dữ liệu học sinh nằm trong một cột JSON của giáo viên, chưa phải bảng riêng; đây là nút thắt cho mọi tính năng học sinh.
- Khoá localStorage còn tiền tố `imperial_*`; đổi tên phải có đoạn chuyển dữ liệu để không mất dữ liệu khách (Phase 2).
- Nội dung game còn từ ngữ cung đình (rank, Thánh chỉ, prompt Gemini); sẽ đổi ở Phase 2.
- Giới hạn gói miễn phí Supabase/Vercel (kể cả Edge Functions) cần xác minh lại trước Phase 3-4.

## 7. Quyết định còn mở

- Từ ngữ thay cho hệ cấp bậc cung đình (Phase 2).
- Có thêm vai trò phụ huynh hay không (chưa nằm trong phạm vi).

## 8. Bước tiếp theo

Phase 1 theo `docs/phase-1-split-plan.md`. Còn S0 (smoke test Playwright + dữ liệu mẫu) và S1 (chuyển vào `src/`) nên làm trước S3 vì S3 đụng tới đồng bộ dữ liệu. Quyết định A-C (Context, react-router, Playwright) chưa được ghi nhận là đã duyệt.
