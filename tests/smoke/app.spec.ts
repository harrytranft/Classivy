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

// Phase 8: ghi đè điểm học sinh mẫu cho một test (ví dụ để có em điểm <= -20).
let POINT_OVERRIDES: Record<string, number> = {};

// Phase 11: gán skill cho Pokémon của học sinh mẫu trong một test (em chưa có Pokémon thì tạo Pokémon tối thiểu).
let SKILL_OVERRIDES: Record<string, string[]> = {};
const withSkills = (student: { id: string; pet?: Record<string, unknown> | null; pets?: unknown[] }) => {
  const extra = SKILL_OVERRIDES[student.id];
  if (!extra) return student;
  const pet = student.pet || { instanceId: `pet-${student.id}`, dexId: 25, name: 'Pikachu', types: ['Electric'], hp: 100, accessories: [], level: 1 };
  const nextPet = { ...pet, skills: extra, skillUses: {} };
  return { ...student, pet: nextPet, pets: [nextPet] };
};

const cloudRow = () => ({
  user_id: fakeSession().user.id,
  students: FIXTURE.students.map((student: { id: string; points: number }) => withSkills(
    POINT_OVERRIDES[student.id] !== undefined ? { ...student, points: POINT_OVERRIDES[student.id] } : student
  )),
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
  /** Phase 7: lần lưu tới bị DB từ chối như khi máy khác vừa sửa (stale_data); đếm số lần đọc user_settings. */
  staleNextSave: boolean;
  settingsReads: number;
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
  const state: SmokeState = { upserts: [], dialogs: [], errors: [], tables: emptyTables(), rpcCalls: [], dataModelVersion: 1, staleNextSave: false, settingsReads: 0 };

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
        state.settingsReads += 1;
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
    const phase3Path = url.pathname.match(/\/rest\/v1\/(classes|students|student_recent_history|rpc\/save_teacher_changes|rpc\/save_teacher_changes_v2)$/);
    if (phase3Path && !options.phase3) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: '42P01', message: 'relation does not exist' }) });
      return;
    }
    if (phase3Path) {
      const target = phase3Path[1];
      if (target === 'rpc/save_teacher_changes' || target === 'rpc/save_teacher_changes_v2') {
        if (target === 'rpc/save_teacher_changes_v2' && state.staleNextSave) {
          state.staleNextSave = false;
          await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: '40001', message: 'stale_data', details: 'x', hint: null }) });
          return;
        }
        const changes = fromRpcPayload((request.postDataJSON() as { p_changes: RpcPayload }).p_changes);
        state.tables = applyChanges(state.tables, changes);
        state.rpcCalls.push(changes);
        const body = target === 'rpc/save_teacher_changes' ? String(Date.now()) : JSON.stringify({ saved_at: Date.now(), revisions: {} });
        await route.fulfill({ status: 200, contentType: 'application/json', body });
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
  await page.locator('.cl-splash').waitFor({ state: 'detached' });
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

const navButton = (page: Page, title: string) => page.locator(`nav button[aria-label="${title}"]`);
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
  // Trang loading khi vào lớp phủ lên trên trong ~1 giây: chờ nó biến mất như người dùng thật.
  await page.locator('.cl-splash').waitFor({ state: 'detached' });
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
  await chooseClass(page, '6A');
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
  await page.waitForTimeout(700);
  if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: 'test-results/screens/28b-gift-ready.png' });
  await page.getByRole('button', { name: /Tặng và cho trứng nở ngay/ }).click();
  await page.waitForTimeout(1200);
  if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: 'test-results/screens/28c-gift-hatching.png' });
  await page.waitForTimeout(1400);
  if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: 'test-results/screens/28d-gift-revealed.png' });
  await snap(page, '41-gift-revealed', state);
  await snapCloud(page, '41-gift-revealed', state);

  // 8. Vòng quay may mắn (quay 10 giây)
  await reopen();
  await dockButton(page, DOCK.selectAll).click();
  await dockButton(page, DOCK.wheel).click();
  if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: 'test-results/screens/22b-wheel-ready.png' });
  await page.getByRole('button', { name: 'Bắt Đầu Quay' }).click();
  await page.waitForTimeout(5_000);
  if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: 'test-results/screens/22c-wheel-spinning.png' });
  await page.waitForTimeout(6_000);
  if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: 'test-results/screens/22d-wheel-result.png' });
  await snap(page, '42-wheel-result', state);
  await snapCloud(page, '42-wheel-result', state);
  // Sau khi quay xong, "Hoàn tất" chỉ đóng bảng kết quả: vẫn ở trang vòng quay, quay tiếp được.
  await page.getByRole('button', { name: 'Hoàn tất' }).click();
  await expect(page).toHaveURL(/\/class\/6A\/vong-quay$/);
  await expect(page.getByRole('button', { name: 'Bắt Đầu Quay' })).toBeVisible();

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
  await page.getByRole('button', { name: 'Đóng vòng quay' }).click();
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
  await chooseClass(page, '6A');
  // Vào lớp có thể tạo trạng thái Boss của lớp (không đổi học sinh): chờ lần lưu đó xong rồi mới đếm.
  await page.waitForTimeout(2200);
  const rpcBefore = state.rpcCalls.length;
  const upsertsBefore = state.upserts.length;
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

test('Phase 7: máy khác vừa sửa thì không ghi đè, báo giáo viên và tải lại', async ({ page }) => {
  const state = await setupPage(page, {
    loggedIn: true,
    emptyCloud: true,
    phase3: true,
    localStorageSeed: { classivy_school_data_v6: JSON.stringify(FIXTURE.students) }
  });
  await page.waitForTimeout(2200);
  const savedPoints = Object.fromEntries(Object.entries(state.tables.students).map(([id, row]) => [id, row.points]));
  const readsBefore = state.settingsReads;
  const callsBefore = state.rpcCalls.length;

  state.staleNextSave = true;
  await chooseClass(page, '6A');
  await page.getByRole('button', { name: /^Cộng điểm / }).first().click({ force: true });
  await page.locator('button.aspect-square').first().click();
  const banner = page.getByRole('alert').filter({ hasText: 'Dữ liệu vừa được đổi ở máy khác' });
  await expect(banner).toBeVisible({ timeout: 5000 });
  // Không có gì bị ghi, app đọc lại từ đám mây.
  expect(state.rpcCalls.length).toBe(callsBefore);
  expect(Object.fromEntries(Object.entries(state.tables.students).map(([id, row]) => [id, row.points]))).toEqual(savedPoints);
  await expect.poll(() => state.settingsReads).toBeGreaterThan(readsBefore);
  if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: 'test-results/screens/70-sync-conflict.png' });
  await banner.getByRole('button', { name: 'Đã hiểu' }).click();
  await expect(banner).toHaveCount(0);

  // Sau khi tải lại, thao tác mới lưu bình thường.
  await page.getByRole('button', { name: /^Cộng điểm / }).first().click({ force: true });
  await page.locator('button.aspect-square').first().click();
  await expect.poll(() => state.rpcCalls.length, { timeout: 5000 }).toBe(callsBefore + 1);
  expect(state.errors).toEqual([]);
});

test('Phase 8: hiệu ứng điểm, phím tắt, hồi sinh, nút Lớp Học và đăng xuất không cần xác nhận', async ({ page }) => {
  POINT_OVERRIDES = { 'stu-01': -25 };
  await setupPage(page, { loggedIn: true });
  POINT_OVERRIDES = {};
  await chooseClass(page, '6A');
  await expect(page).toHaveURL(/\/class\/6A$/);

  // Thanh công cụ: các nút chỉ có icon (có tên cho trình đọc màn hình) và cùng một dòng.
  const toolbarTops = await Promise.all(['Check đi học', 'Check Homework', 'Tài khoản học sinh', 'Bạn bè & quà', 'Thêm Trainer']
    .map(async name => (await page.getByRole('button', { name, exact: true }).first().boundingBox())!.y));
  expect(new Set(toolbarTops.map(y => Math.round(y))).size).toBe(1);

  // Hiệu ứng cộng điểm bay trên thẻ học sinh.
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^Cộng điểm / }).nth(1).click({ force: true });
  await page.locator('button.aspect-square').first().click();
  await expect(page.locator('.cl-points-burst')).toBeVisible();

  // Phím tắt: ? mở bảng, A mở điểm danh.
  await page.waitForTimeout(500);
  await page.keyboard.press('?');
  await expect(page.getByText('Xem danh sách phím tắt')).toBeVisible();
  await page.keyboard.press('?');
  await expect(page.getByText('Xem danh sách phím tắt')).toHaveCount(0);
  await page.keyboard.press('a');
  await expect(page.getByRole('button', { name: 'Chốt điểm danh' })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng' }).first().click();

  // Hồi sinh: nút chỉ hiện trên thẻ em có điểm <= -20, có hộp xác nhận.
  await expect(page.getByRole('button', { name: /Hồi sinh/ })).toHaveCount(1);
  await page.getByRole('button', { name: /Hồi sinh/ }).click();
  await expect(page.getByText('Mất toàn bộ Pokémon')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Hồi sinh', exact: true }).click();
  await expect(page.getByRole('button', { name: /Hồi sinh/ })).toHaveCount(0);

  // Bấm "Lớp Học" khi đang trong lớp thì về trang chọn lớp.
  await clickNav(page, 'Lớp Học');
  await expect(page).toHaveURL(/\/class$/);

  // Đăng xuất ngay, không hỏi lại.
  await page.locator('nav button[title="Tài khoản giáo viên"]').click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page.locator('nav[aria-label="Điều hướng chính"]')).toHaveCount(0);
});

// Phase 9 (9.4): ba trang toàn màn hình không tràn ngang ở 390 / 820 / 1440px; bàn cờ Cá Ngựa chiếm đủ màn hình lớp.
for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'tablet', width: 820, height: 1180 }, { name: 'desktop', width: 1440, height: 900 }]) {
  test(`Phase 9: Cá Ngựa, Vòng quay, Tặng Pokémon (${viewport.name})`, async ({ page }) => {
    const state = await setupPage(page, { loggedIn: true });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await chooseClass(page, '6A');
    const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

    await page.goto('/class/6A/ca-ngua');
    await expect(page.locator('.cl-splash')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Trả Lời Đúng & Lắc Xí Ngầu/ })).toBeVisible();
    expect(await noOverflow()).toBe(true);
    // Nhiều trainer ở ô xuất phát: chỉ hiện 2 avatar + "+N"; rê chuột vào ô thì hiện đủ.
    await expect(page.getByText('+3', { exact: true })).toBeVisible();
    await expect(page.getByRole('tooltip')).toBeHidden();
    if (viewport.name === 'desktop') {
      await page.getByText('Xuất phát').hover();
      await expect(page.getByRole('tooltip')).toBeVisible();
      if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: 'test-results/screens/70b-ludo-hover.png' });
    }
    if (viewport.name !== 'mobile') {
      const tile = await page.getByText('Xuất phát').boundingBox();
      expect(tile).not.toBeNull();
      const board = await page.locator('.grid-cols-5').first().boundingBox();
      expect(board!.height).toBeGreaterThan(viewport.height * 0.45);
    }
    if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: `test-results/screens/70-ludo-${viewport.name}.png` });

    await page.goto('/class/6A/vong-quay');
    await expect(page.locator('.cl-splash')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Bắt Đầu Quay' })).toBeVisible();
    expect(await noOverflow()).toBe(true);
    if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: `test-results/screens/71-wheel-${viewport.name}.png` });

    await page.goto('/class/6A/tang-pokemon');
    await expect(page.locator('.cl-splash')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Tặng và cho trứng nở ngay/ })).toBeVisible();
    expect(await noOverflow()).toBe(true);
    if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: `test-results/screens/72-gift-${viewport.name}.png` });
    expect(state.errors).toEqual([]);
  });
}


// Phase 11: skill tự động (nhóm A/B khi Random, nhóm C khi cộng/trừ điểm, nhóm D ngoài Random).
const PHASE11_SKILLS = () => {
  const common = ['sk_lucky', 'sk_swap', 'sk_decree', 'sk_companion', 'sk_evade'];
  const ids = ['stu-01', 'stu-02', 'stu-03', 'stu-04', 'stu-06', 'stu-07'];
  return Object.fromEntries(ids.map(id => [id, [...common, ...({
    'stu-01': ['sk_double', 'sk_guard'], 'stu-02': ['sk_survival'], 'stu-04': ['sk_rapid', 'sk_soul_link'], 'stu-07': ['sk_rescue']
  } as Record<string, string[]>)[id] ?? []]]));
};
type SavedStudent = { id: string; points: number; history: { reason: string; amount: number }[]; pet?: { skills: string[]; skillUses: Record<string, number> } };
const savedStudents = async (page: Page, state: SmokeState): Promise<Record<string, SavedStudent>> => {
  await page.waitForTimeout(2200);
  const latest = state.upserts[state.upserts.length - 1] as unknown as { students: SavedStudent[] };
  return Object.fromEntries(latest.students.map(student => [student.id, student]));
};

test('Phase 11: skill khi cộng/trừ điểm và nút ngoài Random (nhóm C, D)', async ({ page }) => {
  SKILL_OVERRIDES = PHASE11_SKILLS();
  const state = await setupPage(page, { loggedIn: true });
  SKILL_OVERRIDES = {};
  await chooseClass(page, '6A');
  const openPoints = (name: string) => page.getByRole('button', { name: `Cộng điểm ${name}` }).dispatchEvent('click');
  const openPenalty = (name: string) => page.getByRole('button', { name: `Trừ điểm ${name}` }).dispatchEvent('click');
  const firstTile = () => page.locator('button.aspect-square').first();

  // C1. Nhân Đôi: hỏi mỗi lần cộng điểm; "Không" giữ nguyên điểm và lượt.
  await openPoints('An');
  await firstTile().click();
  const prompt = page.getByRole('dialog', { name: 'Skill: Pháp Bảo Nhân Đôi' });
  await expect(prompt).toContainText('+2 thành +4');
  await prompt.getByRole('button', { name: 'Không' }).click();
  await expect(prompt).toHaveCount(0);
  let saved = await savedStudents(page, state);
  expect(saved['stu-01'].points).toBe(17);
  expect(saved['stu-01'].pet?.skillUses.sk_double).toBeUndefined();

  // C2. "Dùng skill": điểm nhân đôi, trừ 1 lượt, ghi lịch sử.
  await openPoints('An');
  await firstTile().click();
  await page.getByRole('dialog', { name: 'Skill: Pháp Bảo Nhân Đôi' }).getByRole('button', { name: 'Dùng skill' }).click();
  saved = await savedStudents(page, state);
  expect(saved['stu-01'].points).toBe(21);
  expect(saved['stu-01'].pet?.skillUses.sk_double).toBe(1);
  expect(saved['stu-01'].history.some(item => item.reason.includes('[Skill] Pháp Bảo Nhân Đôi'))).toBe(true);

  // C3. Lá Chắn Hộ Vệ: lần trừ điểm đầu trong ngày giảm 50% (-2 thành -1).
  await openPenalty('An');
  await firstTile().click();
  const guard = page.getByRole('dialog', { name: 'Skill: Lá Chắn Hộ Vệ' });
  await expect(guard).toContainText('-2 thành -1');
  await guard.getByRole('button', { name: 'Dùng skill' }).click();
  saved = await savedStudents(page, state);
  expect(saved['stu-01'].points).toBe(20);

  // C4. Kim Bài Miễn Tử: bỏ qua lần trừ điểm (điểm giữ nguyên, vẫn ghi lượt skill).
  await openPenalty('Bình');
  await firstTile().click();
  await page.getByRole('dialog', { name: 'Skill: Kim Bài Miễn Tử' }).getByRole('button', { name: 'Dùng skill' }).click();
  saved = await savedStudents(page, state);
  expect(saved['stu-02'].points).toBe(30);
  expect(saved['stu-02'].pet?.skillUses.sk_survival).toBe(1);

  // C5. Em không có skill phù hợp: không hỏi gì cả (D36).
  await openPoints('Dũng');
  await firstTile().click();
  await expect(page.getByRole('dialog', { name: /^Skill:/ })).toHaveCount(0);

  // D1. Cứu viện: nút chỉ hiện trên thẻ em bị phạt hôm nay; Khoa (có Hộ Tống) tặng 2 điểm cho An.
  await page.getByRole('button', { name: '🤝 Cứu viện' }).first().dispatchEvent('click');
  const rescue = page.getByRole('dialog', { name: 'Hộ Tống Đồng Đội' });
  await rescue.getByRole('button', { name: /Khoa/ }).click();
  await rescue.getByRole('button', { name: '2 điểm' }).click();
  saved = await savedStudents(page, state);
  expect(saved['stu-01'].points).toBe(22);
  expect(saved['stu-07'].points).toBe(103);

  // D2. Cướp Quyền Tranh Đoạt: hiện tên em lên màn hình lớp; Đồng Tâm Hiệp Lực: cộng ké 1 điểm.
  const dungSkills = page.getByLabel('Skill của Dũng');
  await dungSkills.getByRole('button', { name: /Ưu tiên phát biểu/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Dùng skill' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'được phát biểu trước' })).toContainText('Dũng');
  if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: 'test-results/screens/80-rapid.png' });
  await page.getByRole('button', { name: 'Xong' }).click();
  await dungSkills.getByRole('button', { name: /Đồng Tâm Hiệp Lực/ }).click();
  await page.getByRole('dialog', { name: 'Đồng Tâm Hiệp Lực' }).getByRole('button', { name: /^An/ }).click();
  saved = await savedStudents(page, state);
  expect(saved['stu-04'].points).toBe(63);
  expect(saved['stu-04'].pet?.skillUses.sk_rapid).toBe(1);
  expect(saved['stu-04'].pet?.skillUses.sk_soul_link).toBe(1);
  expect(state.errors).toEqual([]);
});

test('Phase 11: skill sau Random (Vòng Quay Tự Tin tự chạy, hộp Dùng/Không, Né Trực Diện)', async ({ page }) => {
  SKILL_OVERRIDES = PHASE11_SKILLS();
  const state = await setupPage(page, { loggedIn: true });
  SKILL_OVERRIDES = {};
  await chooseClass(page, '6A');
  await dockButton(page, DOCK.random).click();
  await page.getByRole('button', { name: /Chế độ Solo/ }).click();
  const panel = page.getByTestId('random-skills');
  await expect(panel).toBeVisible();
  const titleOf = async () => (await panel.locator('p').first().textContent()) || '';
  const firstTitle = await titleOf();
  // Nhóm A: tự +2 điểm và trừ 1 lượt, không cần bấm.
  await expect(panel).toContainText('Vòng Quay Tự Tin');
  await expect(panel).toContainText('(1/2)');

  // Nhóm B: Đổi Đề, Trợ Thủ Tra Cứu (đồng hồ 30 giây), Đồng Đội Hỗ Trợ (chọn bạn).
  await panel.getByRole('button', { name: 'Dùng Đổi Đề Thần Tốc', exact: true }).click();
  await expect(panel.getByRole('listitem').filter({ hasText: 'đổi sang câu hỏi dễ hơn' })).toBeVisible();
  await panel.getByRole('button', { name: 'Dùng Trợ Thủ Tra Cứu', exact: true }).click();
  await expect(panel.getByRole('timer')).toContainText('0:30');
  await panel.getByRole('button', { name: 'Dùng Đồng Đội Hỗ Trợ', exact: true }).click();
  await page.getByRole('dialog', { name: 'Chọn bạn hỗ trợ' }).getByRole('button').first().click();
  await expect(panel.getByText('được mời cùng thảo luận')).toBeVisible();
  if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: 'test-results/screens/81-random-skills.png' });

  // "Không" chỉ ẩn hộp hỏi, không trừ lượt.
  await expect(panel.getByRole('button', { name: 'Không dùng Skill Né Trực Diện', exact: true })).toBeVisible();

  // Né Trực Diện: gọi lại, loại em này; em mới cũng được Vòng Quay Tự Tin.
  await panel.getByRole('button', { name: 'Dùng Skill Né Trực Diện', exact: true }).click();
  await expect.poll(titleOf).not.toBe(firstTitle);
  await expect(page.getByTestId('random-skills')).toContainText('(1/2)');

  const saved = await savedStudents(page, state);
  const used = Object.values(saved).filter(item => item.pet?.skillUses && Object.keys(item.pet.skillUses).length > 0);
  expect(used.length).toBeGreaterThanOrEqual(2);
  expect(Object.values(saved).some(item => item.history.some(h => h.reason.includes('Né Trực Diện')))).toBe(true);
  expect(state.errors).toEqual([]);
});
