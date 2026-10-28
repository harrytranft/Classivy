import { expect, test, type Page, type Route } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Smoke test Phase 4: trang quản lý tài khoản học sinh (giáo viên) và cổng học sinh (đổi mật khẩu lần đầu).
// Supabase và Edge Function đều là bản giả (không chạm mạng thật); không có ảnh gốc, chỉ kiểm tra hành vi.

const FIXTURE = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'fixtures/sample-class.json'), 'utf-8'));
const FIXED_NOW = new Date('2026-10-28T09:00:00+07:00');
const SUPABASE_HOST = 'smoke-test.invalid';
const AUTH_STORAGE_KEY = 'sb-smoke-test-auth-token';
const TEACHER_ID = '00000000-0000-4000-8000-000000000001';
const STUDENT_USER_ID = '00000000-0000-4000-8000-0000000000aa';

const session = (user: Record<string, unknown>) => ({
  access_token: 'smoke-access-token', refresh_token: 'smoke-refresh-token', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(FIXED_NOW.getTime() / 1000) + 3600 * 24 * 365,
  user: { aud: 'authenticated', role: 'authenticated', created_at: '2026-01-01T00:00:00Z', ...user }
});
const teacherSession = () => session({ id: TEACHER_ID, email: 'smoke@classivy.test', app_metadata: {}, user_metadata: { display_name: 'Cô Smoke' } });
const studentSession = () => session({ id: STUDENT_USER_ID, email: 'minhanh472@students.classivy.invalid', app_metadata: { role: 'student' }, user_metadata: { display_name: 'Minh Anh' } });

const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

interface Mock {
  functionCalls: Array<Record<string, unknown>>;
  restPaths: string[];
  rpcCalls: string[];
  passwordUpdates: number;
  errors: string[];
}

const ACCOUNT_ROWS = [
  { id: '11111111-1111-4111-8111-111111111111', client_id: 'stu-01', name: 'Nguyễn Minh Anh', username: null, status: 'active', must_change_password: false, auth_user_id: null },
  { id: '22222222-2222-4222-8222-222222222222', client_id: 'stu-02', name: 'Trần Bảo', username: 'bao123', status: 'active', must_change_password: true, auth_user_id: 'auth-2' },
  { id: '33333333-3333-4333-8333-333333333333', client_id: 'stu-03', name: 'Lê Chi', username: 'chile456', status: 'locked', must_change_password: false, auth_user_id: 'auth-3' }
];
const AUDIT_ROWS = [
  { id: 2, action: 'lock', student_name: 'Lê Chi', class_name: '6A', detail: {}, created_at: '2026-10-28T01:00:00Z' },
  { id: 1, action: 'create_account', student_name: 'Trần Bảo', class_name: '6A', detail: { username: 'bao123' }, created_at: '2026-10-27T01:00:00Z' }
];

async function setup(page: Page, who: 'teacher' | 'student'): Promise<Mock> {
  const mock: Mock = { functionCalls: [], restPaths: [], rpcCalls: [], passwordUpdates: 0, errors: [] };
  let firstLoginPending = true;
  await page.clock.setFixedTime(FIXED_NOW);
  await page.addInitScript(({ key, value }) => { window.localStorage.setItem(key, JSON.stringify(value)); },
    { key: AUTH_STORAGE_KEY, value: who === 'teacher' ? teacherSession() : studentSession() });

  await page.route(url => url.hostname === SUPABASE_HOST, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const p = url.pathname;
    if (p.startsWith('/rest/v1/')) mock.restPaths.push(p.replace('/rest/v1/', ''));

    if (p === '/functions/v1/student-accounts') {
      const body = request.postDataJSON() as Record<string, unknown>;
      mock.functionCalls.push(body);
      if (body.action === 'create') {
        const ids = body.studentIds as string[];
        await json(route, { ok: true, results: ids.map(id => ({ studentId: id, ok: true, name: 'Nguyễn Minh Anh', className: '6A', username: 'minhanh472', password: 'k7m2xq9p' })) });
        return;
      }
      await json(route, { ok: true });
      return;
    }
    if (p === '/auth/v1/user' && request.method() === 'PUT') {
      mock.passwordUpdates += 1;
      await json(route, { id: STUDENT_USER_ID, email: 'minhanh472@students.classivy.invalid', app_metadata: { role: 'student' }, user_metadata: { display_name: 'Minh Anh' } });
      return;
    }
    if (p === '/rest/v1/rpc/student_first_login_pending') { mock.rpcCalls.push('pending'); await json(route, firstLoginPending); return; }
    if (p === '/rest/v1/rpc/complete_first_login') { mock.rpcCalls.push('complete'); firstLoginPending = false; await route.fulfill({ status: 204, body: '' }); return; }

    if (p.endsWith('/user_settings')) {
      if (request.method() === 'GET') {
        await json(route, [{
          user_id: TEACHER_ID, students: FIXTURE.students, ranks_male: [], ranks_female: [], skills: FIXTURE.skills, pet_skills: null,
          pos_sound_url: '', neg_sound_url: '', timer_sound_url: '', wheel_spin_sound_url: '', wheel_finish_sound_url: '',
          custom_ludo_tiles: {}, lucky_wheel_rewards: null, boss_states_by_class: {}, boss_encounter_frequency: 'occasional',
          updated_at_ms: FIXED_NOW.getTime() - 60_000
        }]);
      } else await route.fulfill({ status: request.method() === 'PATCH' ? 204 : 201, contentType: 'application/json', body: request.method() === 'PATCH' ? '' : '[]' });
      return;
    }
    if (p.endsWith('/classes')) { await json(route, [{ id: 'class-6a' }]); return; }
    if (p.endsWith('/students')) { await json(route, ACCOUNT_ROWS); return; }
    if (p.endsWith('/teacher_audit_log')) { await json(route, AUDIT_ROWS); return; }
    if (p.endsWith('/profiles')) { await json(route, { email: 'smoke@classivy.test', display_name: who === 'teacher' ? 'Cô Smoke' : 'Minh Anh', photo_url: '' }); return; }
    // Bảng Phase 3 chưa tồn tại ở bản giả này: app dùng cách lưu cũ.
    if (/\/rest\/v1\/(student_recent_history|rpc\/save_teacher_changes)$/.test(p)) { await json(route, { code: '42P01', message: 'relation does not exist' }, 404); return; }
    await json(route, []);
  });
  await page.route(url => url.hostname !== 'localhost' && url.hostname !== SUPABASE_HOST, route => route.abort());
  page.on('dialog', dialog => dialog.accept());
  page.on('pageerror', error => mock.errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Failed to load resource|net::ERR/.test(text)) return;
    mock.errors.push(text);
  });
  return mock;
}

test('giáo viên: quản lý tài khoản học sinh của một lớp', async ({ page }) => {
  const mock = await setup(page, 'teacher');
  await page.goto('/class/6A/tai-khoan');
  await expect(page.getByRole('heading', { name: 'Tài khoản học sinh · 6A' })).toBeVisible();

  // Danh sách, trạng thái và bộ đếm.
  const rows = page.locator('main li');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Chưa có tài khoản');
  await expect(rows.nth(1)).toContainText('Chờ đổi mật khẩu');
  await expect(rows.nth(2)).toContainText('Đã khoá');
  await expect(page.getByRole('button', { name: 'Tạo cho cả lớp (1)' })).toBeEnabled();

  // Tìm kiếm không phân biệt dấu; lọc theo trạng thái.
  await page.getByLabel('Tìm học sinh').fill('tran bao');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('bao123');
  await page.getByLabel('Tìm học sinh').fill('');
  await page.getByLabel('Lọc theo trạng thái').selectOption('locked');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Lê Chi');
  await page.getByLabel('Lọc theo trạng thái').selectOption('all');

  // Thao tác phá huỷ luôn hỏi xác nhận; Huỷ thì không gọi hàm.
  await rows.nth(1).getByRole('button', { name: 'Thu hồi' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Xoá hẳn tài khoản đăng nhập của Trần Bảo');
  await expect(dialog).toContainText('không hoàn tác được');
  await dialog.getByRole('button', { name: 'Huỷ' }).click();
  await expect(dialog).toHaveCount(0);
  expect(mock.functionCalls).toHaveLength(0);

  // Tạo cho cả lớp: xác nhận, gọi hàm đúng id, hiện thẻ đăng nhập (mật khẩu chỉ ở đây).
  await page.getByRole('button', { name: 'Tạo cho cả lớp (1)' }).click();
  await expect(page.getByRole('dialog')).toContainText('Tạo tài khoản cho 1 học sinh');
  await page.getByRole('dialog').getByRole('button', { name: 'Tạo 1 tài khoản' }).click();
  const cards = page.getByRole('dialog').filter({ hasText: 'Thẻ đăng nhập' });
  await expect(cards).toContainText('minhanh472');
  await expect(cards).toContainText('k7m2xq9p');
  expect(mock.functionCalls).toEqual([{ action: 'create', studentIds: [ACCOUNT_ROWS[0].id], usernames: {} }]);
  // Bản in nằm ngoài #root (portal), và ẩn trên màn hình.
  await expect(page.locator('#login-cards-print')).toBeHidden();
  expect(await page.locator('#login-cards-print').textContent()).toContain('k7m2xq9p');
  await cards.getByRole('button', { name: 'Đóng' }).first().click();
  await expect(page.getByText('k7m2xq9p')).toHaveCount(0);

  // Khoá: một thao tác một lần gọi.
  await rows.nth(1).getByRole('button', { name: 'Khoá', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Khoá tài khoản' }).click();
  await expect(page.getByRole('status')).toContainText('Đã khoá tài khoản của Trần Bảo');
  expect(mock.functionCalls.at(-1)).toEqual({ action: 'lock', studentId: ACCOUNT_ROWS[1].id });

  // Nhật ký thao tác.
  await page.getByRole('tab', { name: 'Nhật ký thao tác' }).click();
  await expect(page.locator('main li')).toHaveCount(2);
  await expect(page.locator('main')).toContainText('Tạo tài khoản');
  await expect(page.locator('main')).toContainText('tên đăng nhập bao123');

  // Không có mật khẩu ở bất kỳ nơi nào ngoài thẻ đã đóng; không lỗi console.
  expect(mock.errors).toEqual([]);
});

test('giáo viên: lỗi từ hàm quản lý được báo rõ, không treo', async ({ page }) => {
  const mock = await setup(page, 'teacher');
  await page.route(url => url.pathname === '/functions/v1/student-accounts', route =>
    route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Không tìm thấy học sinh.' }) }));
  await page.goto('/class/6A/tai-khoan');
  await page.locator('main li').nth(1).getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
  await expect(page.getByRole('status')).toContainText('Không tìm thấy học sinh.');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(mock.errors.filter(e => !/404/.test(e))).toEqual([]);
});

test('học sinh: đổi mật khẩu lần đầu, không bao giờ tải dữ liệu giáo viên', async ({ page }) => {
  const mock = await setup(page, 'student');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Đặt mật khẩu mới' })).toBeVisible();

  // Mật khẩu yếu bị chặn trước khi gọi Supabase.
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('abc');
  await page.getByLabel('Nhập lại mật khẩu mới').fill('abc');
  await page.getByRole('button', { name: 'Lưu mật khẩu mới' }).click();
  await expect(page.getByRole('alert')).toContainText('ít nhất 8 ký tự');
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('abcdefgh');
  await page.getByLabel('Nhập lại mật khẩu mới').fill('abcdefgh');
  await page.getByRole('button', { name: 'Lưu mật khẩu mới' }).click();
  await expect(page.getByRole('alert')).toContainText('cả chữ và số');
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('hoctot2026');
  await page.getByLabel('Nhập lại mật khẩu mới').fill('khac12345');
  await page.getByRole('button', { name: 'Lưu mật khẩu mới' }).click();
  await expect(page.getByRole('alert')).toContainText('chưa giống nhau');
  expect(mock.passwordUpdates).toBe(0);

  // Hợp lệ: đổi mật khẩu rồi đánh dấu hoàn tất lần đầu.
  await page.getByLabel('Nhập lại mật khẩu mới').fill('hoctot2026');
  await page.getByRole('button', { name: 'Lưu mật khẩu mới' }).click();
  await expect(page.getByRole('heading', { name: /Xin chào/ })).toBeVisible();
  expect(mock.passwordUpdates).toBe(1);
  expect(mock.rpcCalls).toEqual(['pending', 'complete']);

  // Tải lại: không bị hỏi đổi mật khẩu nữa.
  await page.reload();
  await expect(page.getByRole('heading', { name: /Xin chào/ })).toBeVisible();

  // Tài khoản học sinh không chạm dữ liệu giáo viên.
  const teacherTables = mock.restPaths.filter(p => /^(user_settings|classes|students|point_ledger|student_recent_history|teacher_audit_log)$/.test(p) || p.startsWith('rpc/save_teacher_changes'));
  expect(teacherTables).toEqual([]);
  expect(mock.errors).toEqual([]);
});
