<div align="center">
  <img src="public/brand/classivy-logo-horizontal.png" alt="Classivy" width="420" />
</div>

# Classivy

Web app lớp học gamification cho giáo viên và học sinh (trước đây là Imperial School).

## Chạy local

Yêu cầu: Node.js 20+.

1. `npm install`
2. Tạo `.env.local` theo `.env.example`:
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
   - `GEMINI_API_KEY=...` (tuỳ chọn, cho lời thông báo AI)
3. `npm run dev` (cổng 3000)

Kiểm thử và build:

- `npm test` - unit test (Vitest)
- `npm run smoke` - smoke test giao diện (Playwright, dữ liệu mẫu, không chạm Supabase thật). Lần đầu: `npx playwright install chromium`
- `npm run build` - build production

## Cấu trúc mã

Mã nguồn nằm trong `src/` (khung app ở `src/app`, từng tính năng ở `src/features`, logic thuần có test ở `src/domain`). Xem `docs/architecture.md`.

## Cơ sở dữ liệu

Schema hiện tại: `supabase-schema.sql` (chạy một lần trong Supabase Dashboard > SQL Editor). Từ Phase 3 sẽ chuyển sang các file migration trong `supabase/migrations/`.

## Tài liệu dự án

- `CLASSIVY-BRIEF.md` - tóm tắt trạng thái
- `PLAN.md` - các Phase và tasks
- `DESIGN.md` - hệ thiết kế
- `docs/architecture.md` - kiến trúc mã nguồn
- `AGENT.md`, `CLAUDE.md` - quy tắc cho AI agent
- `docs/archive/` - tài liệu lịch sử Imperial School
