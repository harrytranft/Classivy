import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { applyChanges, emptyTables, type TablesState, type TeacherChanges } from '../../src/domain/cloudModel';

// Smoke test "giữ nguyên hành vi" cho Phase 1.
// - Dữ liệu mẫu: fixtures/sample-class.json (nạp như dữ liệu đám mây của một giáo viên giả).
// - Không gọi mạng thật: Supabase, thời tiết, âm thanh, ảnh đều bị chặn hoặc giả lập.
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
  /** Phase 3: bảng classes/students/point_ledger giả và các lần gọi save_teacher_changes. */
  tables: TablesState;
  rpcCalls: TeacherChanges[];
  dataModelVersion: 1 | 2;
}

// Payload JSON của save_teacher_changes -> TeacherChanges (ngược với toRpcPayload).
type RpcPayload = {
  classes?: { name: string; boss_state: unknown }[];
  students?: { client_id: string; class_name: string; name: string; gender: string; points: number; avatar: string | null; game_state: object }[];
  history?: { student_client_id: string; client_event_id: string; amount: number; reason: string; occurred_at_ms: number; source: string }[];
  deleted_student_client_ids?: string[];
};
const fromRpcPayload = (payload: RpcPayload): TeacherChanges => ({
  classes: (payload.classes ?? []).map(c => ({ name: c.name, bossState: c.boss_state as never })),
  students: (payload.students ?? []).map(s => ({
    clientId: s.client_id, className: s.class_name, name: s.name, gender: s.gender as never,
    points: s.points, avatar: s.avatar, gameState: s.game_state as never
  })),
  history: (payload.history ?? []).map(h => ({
    studentClientId: h.student_client_id, clientEventId: h.client_event_id, amount: h.amount,
    reason: h.reason, occurredAtMs: h.occurred_at_ms, source: h.source as never
  })),
  deletedStudentClientIds: payload.deleted_student_client_ids ?? []
});

// Trả lời các bảng Phase 3 như PostgREST (một trang, đủ cho dữ liệu mẫu).
const tableRows = (state: SmokeState, table: string): unknown[] => {
  const { tables } = state;
  if (table === 'classes') {
    return Object.entries(tables.classes).map(([name, bossState]) => ({ id: name, name, boss_state: bossState }));
  }
  if (table === 'students') {
    return Object.values(tables.students).map(row => ({
      client_id: row.clientId, class_id: row.className, name: row.name, gender: row.gender,
      points: row.points, avatar: row.avatar, game_state: row.gameState
    }));
  }
  // student_recent_history: 50 dòng mới nhất mỗi học sinh, bỏ số dư đầu kỳ, theo thứ tự ghi.
  const ranked = tables.ledger.map((entry, index) => ({ entry, id: index + 1 }))
    .filter(({ entry }) => entry.source !== 'opening_balance');
  const keep = new Set<number>();
  Object.keys(tables.students).forEach(clientId => {
    ranked.filter(({ entry }) => entry.studentClientId === clientId)
      .sort((a, b) => b.entry.occurredAtMs - a.entry.occurredAtMs || b.id - a.id)
      .slice(0, 50)
      .forEach(({ id }) => keep.add(id));
  });
  return ranked.filter(({ id }) => keep.has(id)).map(({ entry, id }) => ({
    student_client_id: entry.studentClientId, client_event_id: entry.clientEventId, amount: entry.amount,
    reason: entry.reason, occurred_at: new Date(entry.occurredAtMs).toISOString(), id
  }));
};

const IGNORED_CONSOLE_ERRORS = [/Failed to load resource/, /net::ERR/];

interface SetupOptions {
  loggedIn: boolean;
  /** Cloud has no row yet (first login): the app pushes local data up. */
  emptyCloud?: boolean;
  /** localStorage values written before the app starts (e.g. old `imperial_*` keys). */
  localStorageSeed?: Record<string, string>;
  /**
   * Supabase đã chạy migration Phase 3 (có bảng mới, giáo viên chưa nâng cấp: data_model_version = 1).
   * Không đặt = Supabase chưa chạy migration: bảng mới trả 404, app dùng cách lưu cũ.
   */
  phase3?: boolean;
  /** Phase 6: hàng chờ điểm tặng (teacher_pending_gift_adjustments). Dòng đã có trong sổ điểm giả thì không trả nữa. */
  pendingGifts?: { student_client_id: string; client_event_id: string; amount: number; reason: string; occurred_at: string }[];
}

async function setupPage(page: Page, options: SetupOptions): Promise<SmokeState> {
  const state: SmokeState = { upserts: [], dialogs: [], errors: [], tables: emptyTables(), rpcCalls: [], dataModelVersion: 1 };

  await page.clock.setFixedTime(FIXED_NOW);
  await page.addInitScript(({ loggedIn, storageKey, session, seedValues }) => {
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
    if (!sessionStorage.getItem('smoke-seeded')) {
      Object.entries(seedValues).forEach(([key, value]) => window.localStorage.setItem(key, value));
      sessionStorage.setItem('smoke-seeded', '1');
    }
  }, { loggedIn: options.loggedIn, storageKey: AUTH_STORAGE_KEY, session: fakeSession(), seedValues: options.localStorageSeed || {} });

  await page.route(url => url.hostname === SUPABASE_HOST, async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/user_settings')) {
      if (request.method() === 'GET') {
        // Behave like a real cloud: return the latest saved row so reloads keep progress.
        const latest = state.upserts[state.upserts.length - 1] as Record<string, unknown> | undefined;
        const row: Record<string, unknown> = latest ? { ...cloudRow(), ...latest } : cloudRow();
        if (options.phase3) row.data_model_version = state.dataModelVersion;
        else delete row.data_model_version;
        const rows = options.emptyCloud && !latest ? [] : [row];
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) });
        return;
      }
      const body = request.postDataJSON() as Record<string, unknown>;
      if (body.data_model_version === 2) state.dataModelVersion = 2;
      if (request.method() === 'PATCH') {
        await route.fulfill({ status: 204, body: '' });
        return;
      }
      state.upserts.push(body);
      await route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
      return;
    }
    const phase3Path = url.pathname.match(/\/rest\/v1\/(classes|students|student_recent_history|rpc\/save_teacher_changes)$/);
    if (phase3Path && !options.phase3) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: '42P01', message: 'relation does not exist' }) });
      return;
    }
    if (phase3Path) {
      const target = phase3Path[1];
      if (target === 'rpc/save_teacher_changes') {
        const changes = fromRpcPayload((request.postDataJSON() as { p_changes: RpcPayload }).p_changes);
        state.tables = applyChanges(state.tables, changes);
        state.rpcCalls.push(changes);
        await route.fulfill({ status: 200, contentType: 'application/json', body: String(Date.now()) });
        return;
      }
      const offset = Number(url.searchParams.get('offset') || 0);
      const rows = offset > 0 ? [] : tableRows(state, target);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) });
      return;
    }
    if (url.pathname.endsWith('/rpc/teacher_pending_gift_adjustments') && options.pendingGifts) {
      const done = new Set(state.tables.ledger.map(entry => `${entry.studentClientId}/${entry.clientEventId}`));
      const rows = options.pendingGifts.filter(g => !done.has(`${g.student_client_id}/${g.client_event_id}`));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) });
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
  await waitForApp(page, options.loggedIn, !options.emptyCloud);
  return state;
}

async function waitForApp(page: Page, loggedIn: boolean, expectSampleClass = true) {
  if (loggedIn) {
    // Data is loaded once either the class picker or a class page shows class 6A.
    if (expectSampleClass) {
      await page.locator('main select option[value="6A"], main button[aria-label="Vào lớp 6A"]').first().waitFor({ state: 'attached' });
    }
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
  // SMOKE_SCREENSHOTS=1 npm run smoke: lưu thêm ảnh chụp để xem giao diện bằng mắt (không so sánh, không commit).
  if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: `test-results/screens/${name}.png`, fullPage: true });
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
// The side nav hides off-screen and slides in on hover (real CSS since Tailwind is built locally): hover it like a user.
async function clickNav(page: Page, title: string) {
  await page.locator('.group\\/nav').hover();
  await page.waitForTimeout(350);
  await navButton(page, title).click();
}
const dockButton = (page: Page, index: number) => page.locator('[role="toolbar"][aria-label="Công cụ lớp"] button').nth(index);
const DOCK = { random: 0, ludo: 1, wheel: 2, shop: 3, group: 4, timer: 5, selectAll: 6, multiSelect: 7, resetAura: 8 };

async function chooseClass(page: Page, className: string) {
  await page.locator('main select, main button[aria-label^="Vào lớp"]').first().waitFor();
  const pickerCard = page.getByRole('button', { name: `Vào lớp ${className}`, exact: true });
  if (await pickerCard.count() > 0) await pickerCard.click();
  else await page.locator('main select').first().selectOption(className);
  await page.locator(`main select option[value="${className}"]`).waitFor({ state: 'attached' });
}

test('màn đăng nhập', async ({ page }) => {
  const state = await setupPage(page, { loggedIn: false });
  await snap(page, '01-login', state);
});

test('các màn hình chính', async ({ page }) => {
  const state = await setupPage(page, { loggedIn: true });
  await snap(page, '10-class', state);
  await chooseClass(page, '6A');
  await snap(page, '11-class-6A', state);

  await clickNav(page, 'Cài Đặt');
  await page.getByRole('heading', { name: 'Cài đặt lớp học' }).waitFor();
  const expanders = page.locator('main button[aria-label^="Hiện "]');
  while (await expanders.count() > 0) {
    await expanders.first().click();
  }
  await snap(page, '13-settings-expanded', state);

  await clickNav(page, 'Lớp Học');
  await page.getByText('An 6A', { exact: true }).first().click();
  await page.getByText('Hồ Sơ Trainer').waitFor();
  await snap(page, '14-profile-info', state);
  await page.getByRole('button', { name: /Ấp trứng Pokémon|Linh thú hộ mệnh/ }).click();
  await snap(page, '15-profile-pet', state);
  await page.getByRole('button', { name: /Hợp nhất linh thú/ }).click();
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
  await clickNav(page, 'Tặng Pokémon');
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
  await page.getByRole('button', { name: /^Cộng điểm / }).first().click({ force: true });
  await snap(page, '30-skill-modal', state);
  await page.locator('button.aspect-square').first().click();
  await snap(page, '31-after-skill-points', state);
  await snapCloud(page, '31-after-skill-points', state);

  // 2. Điểm danh
  await reopen();
  await page.getByRole('button', { name: /Check đi học/ }).click();
  await page.getByRole('button', { name: 'Chốt điểm danh' }).click();
  await snap(page, '32-after-attendance', state);
  await snapCloud(page, '32-after-attendance', state);

  // 3. Bài tập
  await reopen();
  await page.getByRole('button', { name: /Check Homework/ }).click();
  await page.getByRole('button', { name: 'Chốt bài tập' }).click();
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
  // The Pokémon toast no longer blocks the screen: a normal click closes it and presses the button.
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
  await clickNav(page, 'Tặng Pokémon');
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
  await clickNav(page, 'Cài Đặt');
  await page.getByRole('button', { name: /Thường xuyên/ }).click();
  await snap(page, '43-boss-frequency', state);
  await snapCloud(page, '43-boss-frequency', state);
});

test('định tuyến URL: trang chọn lớp, trang từng lớp, trang con, Back/Forward, đường dẫn lạ', async ({ page }) => {
  const state = await setupPage(page, { loggedIn: true });
  await expect(page).toHaveURL(/\/class$/);
  await expect(page.getByRole('button', { name: 'Vào lớp 7B', exact: true })).toBeVisible();

  await clickNav(page, 'Cài Đặt');
  await expect(page).toHaveURL(/\/settings$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/class$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/settings$/);
  // Plaza đã bỏ: đường dẫn cũ về trang chọn lớp.
  await page.goto('/plaza');
  await expect(page).toHaveURL(/\/class$/);

  // No class chosen yet: "Lớp học" opens the class picker; choosing a class opens its own page.
  await clickNav(page, 'Lớp Học');
  await expect(page).toHaveURL(/\/class$/);
  await chooseClass(page, '6A');
  await expect(page).toHaveURL(/\/class\/6A$/);
  await expect(page.getByText('Bình 6A', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Lan 7B', { exact: true })).toHaveCount(0);
  await page.locator('main select').first().selectOption('7B');
  await expect(page).toHaveURL(/\/class\/7B$/);
  await page.locator('main select').first().selectOption('Tất cả');
  await expect(page).toHaveURL(/\/class$/);
  await chooseClass(page, '6A');

  await page.getByText('An 6A', { exact: true }).first().click();
  await expect(page).toHaveURL(/\/student\/stu-01$/);
  await expect(page.getByText('Hồ Sơ Trainer')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Hồ Sơ Trainer')).toBeVisible();
  await expect(page.locator('main input:not([type])').first()).toHaveValue('An 6A');
  await page.getByRole('button', { name: /Quay lại lớp/ }).click();
  await expect(page).toHaveURL(/\/class\/6A$/);

  // Ludo, Lucky Wheel and Gift Pokémon are pages of the class.
  await dockButton(page, DOCK.ludo).click();
  await expect(page).toHaveURL(/\/class\/6A\/ca-ngua$/);
  await page.reload();
  await expect(page.getByRole('button', { name: /Quay Lại Lớp/ })).toBeVisible();
  await page.getByRole('button', { name: /Quay Lại Lớp/ }).click();
  await expect(page).toHaveURL(/\/class\/6A$/);

  await page.goto('/class/6A/vong-quay');
  await expect(page.getByRole('button', { name: 'Bình 6A', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Hà 6A/ })).toHaveCount(1);
  await expect(page.getByText('HS Giang 6A')).toHaveCount(0);
  await page.getByRole('button', { name: 'Bình 6A', exact: true }).click();
  await expect(page.getByRole('button', { name: '✓ Bình 6A', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('button:has-text("×")').first().click();
  await expect(page).toHaveURL(/\/class\/6A$/);

  await clickNav(page, 'Cài Đặt');
  await expect(page).toHaveURL(/\/settings$/);
  await clickNav(page, 'Tặng Pokémon');
  await expect(page).toHaveURL(/\/class\/6A\/tang-pokemon$/);
  await page.getByRole('button', { name: 'Đóng tặng Pokémon' }).click();
  await expect(page).toHaveURL(/\/settings$/);

  // Unknown class / student / path.
  await page.goto('/class/khong-co-lop');
  await expect(page.getByText('Không tìm thấy lớp "khong-co-lop".')).toBeVisible();
  await page.goto('/student/khong-ton-tai');
  await expect(page).toHaveURL(/\/class$/);
  await page.goto('/duong-dan-la');
  await expect(page).toHaveURL(/\/class$/);
  expect(state.errors).toEqual([]);
});

test('chuyển khoá localStorage cũ imperial_* sang classivy_* (task 2.7)', async ({ page }) => {
  // Máy đã dùng bản Imperial School, đám mây chưa có bản nào: lần đăng nhập đầu đẩy cài đặt trên máy lên.
  const oldWheelRewards = [{ id: 'old-reward', label: 'Thưởng cũ', icon: '🎈', type: 'points', amount: 7, color: '#22c55e' }];
  const state = await setupPage(page, {
    loggedIn: true,
    emptyCloud: true,
    localStorageSeed: {
      imperial_school_data_v6: JSON.stringify(FIXTURE.students),
      imperial_skills_v6: JSON.stringify(FIXTURE.skills),
      imperial_boss_encounter_frequency_v1: 'rare',
      imperial_lucky_wheel_rewards_v1: JSON.stringify(oldWheelRewards),
      imperial_ranks_male_v6: JSON.stringify(FIXTURE.ranksMale)
    }
  });
  await page.waitForTimeout(2200);

  expect(state.upserts.length).toBeGreaterThan(0);
  const firstUpsert = state.upserts[0] as Record<string, unknown>;
  expect(firstUpsert.boss_encounter_frequency).toBe('rare');
  expect(firstUpsert.lucky_wheel_rewards).toEqual(oldWheelRewards);
  // Học sinh lưu trên máy không bị ghi đè bằng [] trước khi đăng nhập xong (lỗi cũ, sửa 2026-10-27).
  expect((firstUpsert.students as { id: string }[]).map(s => s.id)).toEqual(FIXTURE.students.map((s: { id: string }) => s.id));
  expect(firstUpsert.skills).toEqual(FIXTURE.skills);
  expect(firstUpsert).not.toHaveProperty('ranks_male');

  const stored = await page.evaluate(() => ({
    newFrequency: window.localStorage.getItem('classivy_boss_encounter_frequency_v1'),
    oldFrequency: window.localStorage.getItem('imperial_boss_encounter_frequency_v1'),
    oldRewards: window.localStorage.getItem('imperial_lucky_wheel_rewards_v1'),
    marker: window.localStorage.getItem('classivy_storage_migrated_v1')
  }));
  expect(stored.newFrequency).toBe('rare');
  // Khoá cũ giữ nguyên để hoàn tác.
  expect(stored.oldFrequency).toBe('rare');
  expect(stored.oldRewards).toBe(JSON.stringify(oldWheelRewards));
  expect(stored.marker).not.toBeNull();
  expect(state.errors).toEqual([]);
});

test('Phase 3: nâng cấp dữ liệu cũ sang bảng mới, rồi chỉ gửi phần thay đổi', async ({ page }) => {
  const state = await setupPage(page, { loggedIn: true, phase3: true });
  const upgrade = page.getByTestId('data-upgrade');

  // Chạy thử: hiện số lớp/học sinh/lịch sử/tổng điểm, chưa ghi gì.
  await expect(upgrade.locator('dd').nth(1)).toHaveText(String(FIXTURE.students.length));
  const totalPoints = FIXTURE.students.reduce((sum: number, s: { points: number }) => sum + s.points, 0);
  await expect(upgrade.locator('dd').nth(3)).toHaveText(totalPoints.toLocaleString('vi-VN'));
  expect(state.rpcCalls).toHaveLength(0);
  if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: 'test-results/screens/40-data-upgrade.png' });

  // Nâng cấp: tải sao lưu, ghi, đối chiếu, bật bảng mới.
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải bản sao lưu và nâng cấp' }).click();
  expect((await download).suggestedFilename()).toMatch(/^classivy_backup_.*\.json$/);
  await expect(upgrade).toContainText('Xong!');
  expect(state.dataModelVersion).toBe(2);
  expect(Object.keys(state.tables.students).sort()).toEqual(FIXTURE.students.map((s: { id: string }) => s.id).sort());
  FIXTURE.students.forEach((student: { id: string; points: number }) => {
    const ledgerTotal = state.tables.ledger
      .filter(entry => entry.studentClientId === student.id)
      .reduce((sum, entry) => sum + entry.amount, 0);
    expect(ledgerTotal, `ledger total of ${student.id}`).toBe(student.points);
  });
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(upgrade).toHaveCount(0);
  await page.waitForTimeout(2200);

  // Cộng điểm một học sinh: chỉ gửi đúng em đó và một dòng sổ điểm; không ghi lại cột students cũ.
  const rpcBefore = state.rpcCalls.length;
  const upsertsBefore = state.upserts.length;
  await chooseClass(page, '6A');
  await page.getByRole('button', { name: /^Cộng điểm / }).first().click({ force: true });
  await page.locator('button.aspect-square').first().click();
  await page.waitForTimeout(2200);
  const calls = state.rpcCalls.slice(rpcBefore);
  expect(calls).toHaveLength(1);
  expect(calls[0].students).toHaveLength(1);
  expect(calls[0].history).toHaveLength(1);
  expect(calls[0].deletedStudentClientIds).toEqual([]);
  const changed = calls[0].students[0];
  expect(changed.points).toBe(state.tables.students[changed.clientId].points);
  state.upserts.slice(upsertsBefore).forEach(upsert => {
    expect(upsert).not.toHaveProperty('students');
    expect(upsert).not.toHaveProperty('boss_states_by_class');
  });

  // Mở lại app: đọc từ bảng mới, không hỏi nâng cấp nữa, dữ liệu đọc về khớp nên không gửi gì thêm.
  const rpcAfterEdit = state.rpcCalls.length;
  await page.goto('/');
  await waitForApp(page, true);
  await page.waitForTimeout(2200);
  await expect(page.getByTestId('data-upgrade')).toHaveCount(0);
  expect(state.rpcCalls.length).toBe(rpcAfterEdit);
  await chooseClass(page, '6A');
  await expect(page.locator('main')).toContainText(changed.name);
  expect(state.errors).toEqual([]);
});

test('Phase 3: giáo viên mới dùng bảng mới ngay khi Supabase đã chạy migration', async ({ page }) => {
  const state = await setupPage(page, {
    loggedIn: true,
    emptyCloud: true,
    phase3: true,
    localStorageSeed: { classivy_school_data_v6: JSON.stringify(FIXTURE.students) }
  });
  await page.waitForTimeout(2200);
  expect(state.upserts.length).toBeGreaterThan(0);
  const firstUpsert = state.upserts[0] as Record<string, unknown>;
  expect(firstUpsert.data_model_version).toBe(2);
  expect(firstUpsert).not.toHaveProperty('students');
  expect(Object.keys(state.tables.students)).toHaveLength(FIXTURE.students.length);
  await expect(page.getByTestId('data-upgrade')).toHaveCount(0);
  expect(state.errors).toEqual([]);
});

test('Phase 6: điểm tặng trong hàng chờ được cộng vào Hào Quang đúng một lần', async ({ page }) => {
  const target = FIXTURE.students[0] as { id: string; name: string; points: number; className: string };
  const state = await setupPage(page, {
    loggedIn: true,
    emptyCloud: true,
    phase3: true,
    localStorageSeed: { classivy_school_data_v6: JSON.stringify(FIXTURE.students) },
    pendingGifts: [{ student_client_id: target.id, client_event_id: 'gift-41', amount: 2, reason: '🎁 Quà từ Bạn Smoke: +2 Hào Quang', occurred_at: '2026-10-28T01:00:00Z' }]
  });
  await page.waitForTimeout(2200);
  const giftRows = () => state.tables.ledger.filter(entry => entry.clientEventId === 'gift-41');
  expect(giftRows()).toHaveLength(1);
  expect(giftRows()[0]).toMatchObject({ studentClientId: target.id, amount: 2 });
  expect(state.tables.students[target.id].points).toBe(target.points + 2);

  // Mở lại app (hàng chờ không còn dòng này): không cộng lần nữa.
  await page.goto('/');
  await waitForApp(page, true);
  await page.waitForTimeout(2200);
  expect(giftRows()).toHaveLength(1);
  expect(state.tables.students[target.id].points).toBe(target.points + 2);
  expect(state.errors).toEqual([]);
});
