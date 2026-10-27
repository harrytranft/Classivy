# CLAUDE.md - Classivy

@AGENT.md

Classivy (trước đây là Imperial School) là web app lớp học gamification: giáo viên quản lý lớp, điểm, Pokémon, Boss; về sau học sinh có tài khoản riêng, kết bạn, tặng quà. Chủ dự án: Harry (giáo viên, không chuyên lập trình). Luôn trả lời bằng **tiếng Việt**, dễ hiểu cho người không chuyên.

## Bắt đầu mỗi phiên

1. Đọc `CLASSIVY-BRIEF.md` rồi mục Phase hiện tại trong `PLAN.md`. Không đọc lại toàn bộ lịch sử.
2. Chỉ đào sâu Phase hiện tại; các Phase sau giữ ở mức roadmap.
3. Không lặp lại quyết định đã chốt (xem "Quyết định đã chốt" trong `PLAN.md`) trừ khi phát hiện xung đột.

## Lệnh

- `npm install` - cài phụ thuộc
- `npm run dev` - chạy dev (cổng 3000)
- `npm test` - vitest (logic thuần trong `src/domain/`)
- `npm run smoke` - Playwright smoke test (dữ liệu mẫu, Supabase giả; lần đầu cần `npx playwright install chromium`). Cập nhật ảnh gốc khi CỐ Ý đổi giao diện: `npm run smoke -- --update-snapshots`. Lưu ảnh chụp để xem bằng mắt: `SMOKE_SCREENSHOTS=1 npm run smoke` (vào `test-results/screens/`)
- `npm run typecheck` - kiểm tra kiểu TypeScript (phải 0 lỗi)
- `npm run build` - build production

Biến môi trường: `.env.example` (chỉ khoá `anon` của Supabase). Không tạo hoặc in ra khoá thật.

## Kiến trúc hiện tại (sau Phase 1)

Chi tiết: `docs/architecture.md`. Tóm tắt:

- Mã nằm trong `src/`. `src/app/App.tsx` chỉ là khung: router -> `GameDataProvider` -> `UiEventsProvider` -> `AppProvider` -> các route.
- Mỗi tính năng có thư mục `src/features/<tính năng>/`: `use*State.ts` (state), `*Actions.ts` (hành động, gọi tính năng khác qua `app.x`), component giao diện. Giao diện đọc mọi thứ qua `useApp()`.
- Logic thuần + test ở `src/domain/` (điểm, điểm danh, bài tập, battle, Cá Ngựa, Boss, Pokémon, tiến trình...).
- Dữ liệu cloud vẫn là một snapshot JSON mỗi giáo viên (`user_settings.students`), xử lý trong `src/app/providers/gameData/`. Sẽ đổi ở Phase 3.
- Định tuyến: `/class` (chọn lớp, mặc định), `/class/<lớp>` (trang lớp) với trang con `ca-ngua`, `vong-quay`, `tang-pokemon`; `/plaza`, `/settings`, `/student/:id`. Auth: Supabase (`src/features/auth/AuthContext.tsx`). Triển khai: Vercel (`vercel.json`). Nội dung cũ: `docs/archive/`.

## Skills nên dùng

- Giao diện, DESIGN.md, critique, audit, polish: `impeccable`, `ui-ux-pro-max`, `design-system`, `brand`
- Kiến trúc và data model: `engineering:architecture`, `engineering:system-design`
- Kiểm thử và rà soát: `engineering:testing-strategy`, `engineering:code-review`, `engineering:tech-debt`
- Trước khi chạy migration/deploy: `engineering:deploy-checklist`
- Tương tác lớp học, phần thưởng, an toàn xã hội: các skill `education-agent-skills` (ví dụ `belonging-classroom-culture-designer`, `restorative-practice-protocol-designer`)
- Spec tính năng: `product-management:write-spec`

## Việc cần hỏi Harry trước khi làm

Đổi luật game, đổi schema/RLS, thêm dịch vụ trả phí, thay đổi cách đăng nhập, xoá dữ liệu, chạy bất kỳ thứ gì trên Supabase hoặc Vercel thật.

## Báo cáo cuối mỗi Phase

Theo mục 7 của `AGENT.md`, và phải nói rõ: cần chạy migration nào, Harry cần làm gì, Phase tiếp theo là gì.
