import { defineConfig } from '@playwright/test';

// Smoke test chạy ở máy giáo viên/CI, không chạm Supabase thật:
// biến môi trường bên dưới ghi đè .env và mọi request tới Supabase bị chặn trong test.
// SMOKE_PORT: chạy song song nhiều bản (ví dụ nhiều thư mục làm việc) mà không tranh cổng.
const PORT = Number(process.env.SMOKE_PORT) || 5179;

export default defineConfig({
  testDir: './tests/smoke',
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/__snapshots__/{arg}{ext}',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1400, height: 900 },
    timezoneId: 'Asia/Ho_Chi_Minh',
    locale: 'vi-VN'
  },
  webServer: {
    // Production build (no StrictMode double-invocation) but unminified, so the test can tell
    // library randomness (react-router keys) apart from app randomness by function name.
    command: `npx vite build --outDir dist-smoke --emptyOutDir --minify false && npx vite preview --outDir dist-smoke --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: 'https://smoke-test.invalid',
      VITE_SUPABASE_ANON_KEY: 'smoke-anon-key'
    }
  }
});
