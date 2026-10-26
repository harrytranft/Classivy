import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Smoke test "giữ nguyên hành vi" cho Phase 1.
// - Dữ liệu mẫu: fixtures/sample-class.json (nạp như dữ liệu đám mây của một giáo viên giả).
// - Không gọi mạng thật: Supabase, Gemini, thời tiết, âm thanh, ảnh đều bị chặn hoặc giả lập.
// - Thời gian cố định và số ngẫu nhiên có seed để kết quả lặp lại được.
// - Mỗi bước so sánh DOM (bỏ thuộc tính style vì animation) và dữ liệu đồng bộ lên "đám mây" với ảnh chụp gốc.
// Cập nhật ảnh gốc khi CỐ Ý đổi giao diện: npm run smoke -- --update-snapshots

const FIXTURE = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'fixtures/sample-class.json'), 'utf-8')
);
const FIXED_NOW = new Date('2026-10-26T09:00:00+07:00');
const SUPABASE_HOST = 'smoke-test.invalid';
const AUTH_STORAGE_KEY = 'sb-smoke-test-auth-token';

const fakeSession = () => ({
  access_token: 'smoke-access-token',
  refresh_token: 'smoke-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(FIXED_NOW.getTime() / 1000) + 3600 * 24 * 365,
  user: {
    id: '00000000-0000-4000-8000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'smoke@classivy.test',
    app_metadata: {},
    user_metadata: { display_name: 'Cô Smoke' },
    created_at: '2026-01-01T00:00:00Z'
  }
});

const cloudRow = () => ({
  user_id: fakeSession().user.id,
  students: FIXTURE.students,
  ranks_male: FIXTURE.ranksMale,
  ranks_female: FIXTURE.ranksFemale,
  skills: FIXTURE.skills,
  pet_skills: null,
  pos_sound_url: '',
  neg_sound_url: '',
  timer_sound_url: '',
  wheel_spin_sound_url: '',
  wheel_finish_sound_url: '',
  custom_ludo_tiles: {},
  lucky_wheel_rewards: null,
  boss_states_by_class: {},
  boss_encounter_frequency: 'occasional',
  updated_at_ms: FIXED_NOW.getTime() - 60_000
});

interface SmokeState {
  upserts: unknown[];
  dialogs: string[];
  errors: string[];
}

const IGNORED_CONSOLE_ERRORS = [/Failed to load resource/, /net::ERR/, /Gemini Error/];

async function setupPage(page: Page, options: { loggedIn: boolean }): Promise<SmokeState> {
  const state: SmokeState = { upserts: [], dialogs: [], errors: [] };

  await page.clock.setFixedTime(FIXED_NOW);
  await page.addInitScript(({ loggedIn, storageKey, session }) => {
    // Seeded PRNG (mulberry32) so random picks, eggs and ids are deterministic.
    let seed = 20261026;
    const next = () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    // react-router draws random location keys on every navigation; give it its own stream so
    // adding routes does not shift the app's random sequence (needs the unminified smoke build).
    let routerSeed = 7;
    const routerNext = () => { routerSeed = (routerSeed * 16807) % 2147483647; return routerSeed / 2147483647; };
    Math.random = () => ((new Error().stack || '').includes('createKey') ? routerNext() : next());
    const cryptoObj = window.crypto;
    Object.defineProperty(cryptoObj, 'getRandomValues', {
      value: <T extends ArrayBufferView | null>(arr: T): T => {
        if (arr && 'length' in arr) {
          const view = arr as unknown as Uint32Array;
          for (let i = 0; i < view.length; i += 1) view[i] = Math.floor(next() * 4294967296);
        }
        return arr;
      }
    });
    let uuidCounter = 0;
    Object.defineProperty(cryptoObj, 'randomUUID', {
      value: () => `00000000-0000-4000-8000-${String(++uuidCounter).padStart(12, '0')}`
    });
    // Audio is irrelevant for the smoke test and noisy in headless browsers.
    window.HTMLMediaElement.prototype.play = () => Promise.resolve();
    if (loggedIn) {
      window.localStorage.setItem(storageKey, JSON.stringify(session));
    }
  }, { loggedIn: options.loggedIn, storageKey: AUTH_STORAGE_KEY, session: fakeSession() });

  await page.route(url => url.hostname === SUPABASE_HOST, async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/user_settings')) {
      if (request.method() === 'GET') {
        // Behave like a real cloud: return the latest saved row so reloads keep progress.
        const latest = state.upserts[state.upserts.length - 1] as Record<string, unknown> | undefined;
        const row = latest ? { ...cloudRow(), ...latest } : cloudRow();
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([row]) });
        return;
      }
      state.upserts.push(request.postDataJSON());
      await route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
      return;
    }
    if (url.pathname.endsWith('/profiles')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ email: 'smoke@classivy.test', display_name: 'Cô Smoke', photo_url: '' })
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route(url => url.hostname !== 'localhost' && url.hostname !== SUPABASE_HOST, route => route.abort());

  page.on('dialog', async dialog => {
    state.dialogs.push(`${dialog.type()}: ${dialog.message()}`);
    if (dialog.type() === 'prompt') await dialog.dismiss();
    else await dialog.accept();
  });
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (IGNORED_CONSOLE_ERRORS.some(pattern => pattern.test(text))) return;
    state.errors.push(text);
  });
  page.on('pageerror', error => state.errors.push(`pageerror: ${error.message}`));

  await page.goto('/');
  await waitForApp(page, options.loggedIn);
  return state;
}

async function waitForApp(page: Page, loggedIn: boolean) {
  if (loggedIn) {
    await page.locator('main select option[value="6A"]').waitFor({ state: 'attached' });
    await page.locator('button[title^="Trạng thái sync"]').waitFor({ state: 'attached' });
  }
  await page.waitForTimeout(800);
}

const normalizeHtml = (html: string) => html
  .replace(/ style="[^"]*"/g, '')
  // Dimming of other cards while one is hovered depends on pointer timing, not on app logic.
  .replace(/ opacity-35 brightness-75 saturate-50 scale-\[0\.98\]/g, '')
  .replace(/ +"/g, '"')
  .replace(/>\s+</g, '><')
  .replace(/\s{2,}/g, ' ')
  .replace(/></g, '>\n<');

async function waitForSyncIdle(page: Page) {
  // The status dock only exists when logged in; when it does, wait until no cloud sync is pending.
  if (await page.locator('.group\\/status').count() === 0) return;
  await page.locator('button[title^="Trạng thái sync"]').waitFor({ state: 'attached' });
  await page.waitForTimeout(1700);
  await page.locator('button[title^="Trạng thái sync"]').waitFor({ state: 'attached' });
}

async function snap(page: Page, name: string, state: SmokeState) {
  // Park the mouse away from student cards so hover effects do not leak into snapshots.
  await page.mouse.move(700, 2);
  await page.waitForTimeout(700);
  await waitForSyncIdle(page);
  const html = await page.locator('#root').evaluate(node => node.innerHTML);
  expect(normalizeHtml(html), `DOM ${name}`).toMatchSnapshot(`${name}.html`);
  expect(state.errors, `console errors at ${name}`).toEqual([]);
}

async function snapCloud(page: Page, name: string, state: SmokeState) {
  // Auto-sync is debounced 1.5s; wait for it to flush.
  await page.waitForTimeout(2200);
  const latest = state.upserts[state.upserts.length - 1] ?? null;
  const payload = { upsertCount: state.upserts.length, latest, dialogs: state.dialogs };
  // Random UUIDs depend on effect timing (React StrictMode); their values are not behaviour.
  const json = JSON.stringify(payload, null, 2).replace(/00000000-0000-4000-8000-\d{12}/g, '<uuid>');
  expect(json, `cloud ${name}`).toMatchSnapshot(`${name}.cloud.json`);
}

const navButton = (page: Page, title: string) => page.locator(`nav button[title="${title}"]`);
const dockButton = (page: Page, index: number) => page.locator('.liquid-glass-dock button').nth(index);
const DOCK = { random: 0, ludo: 1, wheel: 2, shop: 3, group: 4, timer: 5, selectAll: 6, multiSelect: 7, resetAura: 8 };

async function chooseClass(page: Page, className: string) {
  await page.locator('main select').first().selectOption(className);
}

test('màn đăng nhập', async ({ page }) => {
  const state = await setupPage(page, { loggedIn: false });
  await snap(page, '01-login', state);
  await page.getByRole('button', { name: /Tạo Tài Khoản/ }).first().click();
  await snap(page, '02-register', state);
});

test('các màn hình chính', async ({ page }) => {
  const state = await setupPage(page, { loggedIn: true });
  await snap(page, '10-class', state);
  await chooseClass(page, '6A');
  await snap(page, '11-class-6A', state);

  await navButton(page, 'Trainer Plaza').click({ force: true });
  await snap(page, '12-plaza', state);

  await navButton(page, 'Cài Đặt').click({ force: true });
  const expanders = page.locator('main button[aria-label^="Hiện "]');
  while (await expanders.count() > 0) {
    await expanders.first().click();
  }
  await snap(page, '13-settings-expanded', state);

  await navButton(page, 'Lớp Học').click({ force: true });
  await page.getByText('An 6A', { exact: true }).first().click();
  await snap(page, '14-profile-info', state);
  await page.getByRole('button', { name: /ẤP TRỨNG POKÉMON|LINH THÚ HỘ MỆNH/ }).click();
  await snap(page, '15-profile-pet', state);
  await page.getByRole('button', { name: /HỢP NHẤT LINH THÚ/ }).click();
  await snap(page, '16-profile-fusion', state);
  await page.getByRole('button', { name: /Quay lại lớp/ }).click();
  await snap(page, '17-back-to-class', state);
  await snapCloud(page, '18-screens', state);
});

test('các hộp thoại chính', async ({ page }) => {
  const state = await setupPage(page, { loggedIn: true });
  await chooseClass(page, '6A');

  const reopen = async () => {
    await page.goto('/');
    await waitForApp(page, true);
    await chooseClass(page, '6A');
  };

  await dockButton(page, DOCK.random).click();
  await snap(page, '20-random', state);
  await reopen();
  await dockButton(page, DOCK.ludo).click();
  await snap(page, '21-ludo', state);
  await reopen();
  await dockButton(page, DOCK.selectAll).click();
  await dockButton(page, DOCK.wheel).click();
  await snap(page, '22-lucky-wheel', state);
  await reopen();
  await dockButton(page, DOCK.shop).click();
  await snap(page, '23-shop', state);
  await reopen();
  await dockButton(page, DOCK.group).click();
  await snap(page, '24-group', state);
  await reopen();
  await dockButton(page, DOCK.timer).click();
  await snap(page, '25-timer', state);
  await reopen();
  await page.getByRole('button', { name: /Check đi học/ }).click();
  await snap(page, '26-attendance', state);
  await reopen();
  await page.getByRole('button', { name: /Check Homework/ }).click();
  await snap(page, '27-homework', state);
  await reopen();
  await navButton(page, 'Tặng Pokémon').click({ force: true });
  await snap(page, '28-gift-pokemon', state);
  await reopen();
  await page.locator('nav button').last().click({ force: true });
  await snap(page, '29-user-modal', state);
});

test('luồng thao tác: điểm, điểm danh, bài tập, random, Cá Ngựa, battle, shop, tặng Pokémon, vòng quay', async ({ page }) => {
  const state = await setupPage(page, { loggedIn: true });
  const reopen = async () => {
    await page.goto('/');
    await waitForApp(page, true);
    await chooseClass(page, '6A');
  };
  await chooseClass(page, '6A');

  // 1. Cộng điểm bằng bảng kỹ năng
  await page.getByRole('button', { name: '+', exact: true }).first().click({ force: true });
  await snap(page, '30-skill-modal', state);
  await page.locator('button.aspect-square').first().click();
  await snap(page, '31-after-skill-points', state);
  await snapCloud(page, '31-after-skill-points', state);

  // 2. Điểm danh
  await reopen();
  await page.getByRole('button', { name: /Check đi học/ }).click();
  await page.getByRole('button', { name: 'Confirm Attendance' }).click();
  await snap(page, '32-after-attendance', state);
  await snapCloud(page, '32-after-attendance', state);

  // 3. Bài tập
  await reopen();
  await page.getByRole('button', { name: /Check Homework/ }).click();
  await page.getByRole('button', { name: 'Confirm Homework' }).click();
  await snap(page, '33-after-homework', state);
  await snapCloud(page, '33-after-homework', state);

  // 4. Random solo -> thưởng -> Cá Ngựa -> lắc xúc xắc
  await reopen();
  await dockButton(page, DOCK.random).click();
  await page.getByRole('button', { name: /Chế độ Solo/ }).click();
  await snap(page, '34-random-solo', state);
  await page.getByRole('button', { name: /Ban Thưởng \/ Phạt/ }).first().click();
  await page.locator('button.aspect-square').first().click();
  await snap(page, '35-solo-reward-opens-ludo', state);
  await page.getByRole('button', { name: /Trả Lời Đúng & Lắc Xí Ngầu/ }).click();
  await page.waitForTimeout(1500);
  await snap(page, '36-after-ludo-roll', state);
  await snapCloud(page, '36-after-ludo-roll', state);

  // 5. Battle
  await reopen();
  await dockButton(page, DOCK.random).click();
  await page.getByRole('button', { name: /Chế độ Battle/ }).click();
  await page.getByRole('button', { name: '+3', exact: true }).first().click();
  await page.getByRole('button', { name: '+1', exact: true }).nth(1).click();
  await snap(page, '37-battle-scored', state);
  await page.getByRole('button', { name: /Chốt Trận & Trao Thưởng/ }).click();
  await snap(page, '38-battle-resolved', state);
  await snapCloud(page, '38-battle-resolved', state);

  // 6. Shop: mua trứng thường cho học sinh đầu tiên
  await reopen();
  await dockButton(page, DOCK.shop).click();
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByRole('button', { name: 'Mua', exact: true }).click();
  await snap(page, '39-shop-review', state);
  await page.getByRole('button', { name: /Xác nhận/ }).last().click();
  await snap(page, '40-shop-bought', state);
  await snapCloud(page, '40-shop-bought', state);

  // 7. Tặng Pokémon
  await reopen();
  await navButton(page, 'Tặng Pokémon').click({ force: true });
  await page.getByRole('button', { name: /Tặng và cho trứng nở ngay/ }).click();
  await page.waitForTimeout(2600);
  await snap(page, '41-gift-revealed', state);
  await snapCloud(page, '41-gift-revealed', state);

  // 8. Vòng quay may mắn (quay 10 giây)
  await reopen();
  await dockButton(page, DOCK.selectAll).click();
  await dockButton(page, DOCK.wheel).click();
  await page.getByRole('button', { name: 'Bắt Đầu Quay' }).click();
  await page.waitForTimeout(10_800);
  await snap(page, '42-wheel-result', state);
  await snapCloud(page, '42-wheel-result', state);

  // 9. Cài đặt: đổi tần suất Boss
  await reopen();
  await navButton(page, 'Cài Đặt').click({ force: true });
  await page.getByRole('button', { name: /Thường xuyên/ }).click();
  await snap(page, '43-boss-frequency', state);
  await snapCloud(page, '43-boss-frequency', state);
});

test('định tuyến URL: tải lại ở từng đường dẫn, Back/Forward, đường dẫn lạ', async ({ page }) => {
  const state = await setupPage(page, { loggedIn: true });
  await expect(page).toHaveURL(/\/class$/);

  await navButton(page, 'Trainer Plaza').click({ force: true });
  await expect(page).toHaveURL(/\/plaza$/);
  await navButton(page, 'Cài Đặt').click({ force: true });
  await expect(page).toHaveURL(/\/settings$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/plaza$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/settings$/);

  await navButton(page, 'Lớp Học').click({ force: true });
  await page.getByText('An 6A', { exact: true }).first().click();
  await expect(page).toHaveURL(/\/student\/stu-01$/);
  await expect(page.getByText('Hồ Sơ Trainer')).toBeVisible();

  // Reload directly on the profile URL loads the same student.
  await page.reload();
  await expect(page.getByText('Hồ Sơ Trainer')).toBeVisible();
  await expect(page.locator('main input:not([type])').first()).toHaveValue('An 6A');

  await page.goBack();
  await expect(page).toHaveURL(/\/class$/);
  await page.goForward();
  await expect(page.getByText('Hồ Sơ Trainer')).toBeVisible();

  // Unknown student or path falls back to the class screen.
  await page.goto('/student/khong-ton-tai');
  await waitForApp(page, true);
  await expect(page).toHaveURL(/\/class$/);
  await page.goto('/duong-dan-la');
  await expect(page).toHaveURL(/\/class$/);
  await page.goto('/plaza');
  await expect(navButton(page, 'Trainer Plaza')).toBeAttached();
  await expect(page).toHaveURL(/\/plaza$/);
  expect(state.errors).toEqual([]);
});
