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
- `npm test` - vitest
- `npm run build` - build production (hiện chỉ có cảnh báo chunk lớn đã biết)

Biến môi trường: `.env.example` (chỉ khoá `anon` của Supabase). Không tạo hoặc in ra khoá thật.

## Kiến trúc hiện tại (sẽ đổi sau Phase 1)

- `App.tsx` ~7.900 dòng chứa gần như toàn bộ UI + state; đang được tách ở Phase 1.
- Logic thuần đã tách và có test: `bossSystem.ts`, `gameEvents.ts`, `expeditionSystem.ts`, `pokemonProgression.ts`, `trainerProgression.ts`, `pokemonPassives.ts`.
- Dữ liệu cloud hiện là một snapshot JSON mỗi giáo viên (`user_settings.students`). Chưa có bảng học sinh. Sẽ đổi ở Phase 3.
- Auth: Supabase Auth (`AuthContext.tsx`). Triển khai: Vercel. Nội dung cũ: `docs/archive/`.

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
