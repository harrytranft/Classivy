import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  handleRequest, type AccountStore, type AuditAction, type OwnedStudent, type StudentLinkFields
} from '../../supabase/functions/student-accounts/handler';
import { STUDENT_EMAIL_DOMAIN } from '../../supabase/functions/_shared/studentAccount';

const T1 = 'aaaaaaaa-0000-4000-8000-000000000001';
const T2 = 'bbbbbbbb-0000-4000-8000-000000000002';
const S1 = '11111111-1111-4111-8111-111111111111';
const S2 = '22222222-2222-4222-8222-222222222222';
const S3 = '33333333-3333-4333-8333-333333333333';
const OTHER = '99999999-9999-4999-8999-999999999999'; // học sinh của giáo viên T2

interface Audit { teacherId: string; action: AuditAction; studentId: string; studentName: string; className: string | null; detail: Record<string, unknown> }

// Kho giả có phân quyền như RLS: mỗi học sinh thuộc một giáo viên, giáo viên khác không thấy.
const makeStore = () => {
  const students = new Map<string, OwnedStudent & { teacherId: string; mustChangePassword: boolean }>();
  const addStudent = (id: string, teacherId: string, name: string, extra: Partial<OwnedStudent> = {}) =>
    students.set(id, { id, teacherId, name, className: '6A1', authUserId: null, username: null, status: 'active', mustChangePassword: false, ...extra });
  addStudent(S1, T1, 'Nguyễn Minh Anh');
  addStudent(S2, T1, 'Trần Bảo');
  addStudent(S3, T1, 'Lê Chi', { authUserId: 'auth-existing', username: 'lechi123' });
  addStudent(OTHER, T2, 'Học Sinh Khác', { authUserId: 'auth-other', username: 'khac999' });

  const authUsers = new Map<string, { email: string; password: string; banned: boolean; app_metadata: unknown }>();
  authUsers.set('auth-existing', { email: `lechi123@${STUDENT_EMAIL_DOMAIN}`, password: 'oldpass1', banned: false, app_metadata: { role: 'student' } });
  authUsers.set('auth-other', { email: `khac999@${STUDENT_EMAIL_DOMAIN}`, password: 'otherpw1', banned: false, app_metadata: { role: 'student' } });

  const audit: Audit[] = [];
  const calls = { createAuthUser: 0, deleteAuthUser: 0, updateAuthUser: 0, updateStudent: 0 };
  const flags = { failUpdateStudent: false, failUpdateAuth: false, throwOnLoad: false, takenUsernames: new Set<string>(), emailExistsOnce: false };
  let nextId = 1;

  const store: AccountStore = {
    authenticate: async header => (header === 'Bearer t1' ? T1 : header === 'Bearer t2' ? T2 : header === 'Bearer student' ? 'student-user' : null),
    isTeacher: async userId => userId === T1 || userId === T2,
    getOwnedStudents: async (teacherId, ids) => {
      if (flags.throwOnLoad) throw new Error('SECRET internal detail');
      return ids.map(id => students.get(id)).filter((s): s is NonNullable<typeof s> => !!s && s.teacherId === teacherId);
    },
    isUsernameTaken: async username => flags.takenUsernames.has(username) || Array.from(students.values()).some(s => s.username === username),
    createAuthUser: async ({ email, password }) => {
      calls.createAuthUser += 1;
      if (flags.emailExistsOnce) { flags.emailExistsOnce = false; return { error: 'email_exists' }; }
      const id = `auth-new-${nextId++}`;
      authUsers.set(id, { email, password, banned: false, app_metadata: { role: 'student' } });
      return { id };
    },
    updateAuthUser: async (id, changes) => {
      calls.updateAuthUser += 1;
      if (flags.failUpdateAuth) return false;
      const user = authUsers.get(id);
      if (!user) return false;
      if (changes.password !== undefined) user.password = changes.password;
      if (changes.banned !== undefined) user.banned = changes.banned;
      return true;
    },
    deleteAuthUser: async id => { calls.deleteAuthUser += 1; return authUsers.delete(id); },
    updateStudent: async (teacherId, studentId, fields: StudentLinkFields) => {
      calls.updateStudent += 1;
      const s = students.get(studentId);
      if (!s || s.teacherId !== teacherId) return false;
      if (flags.failUpdateStudent) return false;
      if (fields.authUserId !== undefined) s.authUserId = fields.authUserId;
      if (fields.username !== undefined) s.username = fields.username;
      if (fields.mustChangePassword !== undefined) s.mustChangePassword = fields.mustChangePassword;
      if (fields.status !== undefined) s.status = fields.status;
      return true;
    },
    writeAudit: async row => { audit.push(row); }
  };
  return { store, students, authUsers, audit, calls, flags };
};

// Số ngẫu nhiên giả nhưng KHÁC nhau giữa các lần gọi (để thấy việc thử lại tên đăng nhập).
const counterRandom = () => { let n = 0; return (max: number) => (n++ * 7 + 3) % max; };

const call = (store: AccountStore, body: unknown, token: string | null = 'Bearer t1', method = 'POST') =>
  handleRequest(
    new Request('https://example.test/student-accounts', {
      method,
      headers: token ? { Authorization: token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
      body: method === 'POST' ? JSON.stringify(body) : undefined
    }),
    { store, randomInt: counterRandom() }
  );

describe('student-accounts: xác thực và đầu vào', () => {
  let env: ReturnType<typeof makeStore>;
  beforeEach(() => { env = makeStore(); });

  it('answers CORS preflight and rejects other methods', async () => {
    expect((await call(env.store, null, null, 'OPTIONS')).status).toBe(200);
    expect((await call(env.store, null, 'Bearer t1', 'GET')).status).toBe(405);
  });

  it('rejects missing or invalid tokens (401) and non-teachers (403) before touching anything', async () => {
    expect((await call(env.store, { action: 'create', studentIds: [S1] }, null)).status).toBe(401);
    expect((await call(env.store, { action: 'create', studentIds: [S1] }, 'Bearer nope')).status).toBe(401);
    expect((await call(env.store, { action: 'create', studentIds: [S1] }, 'Bearer student')).status).toBe(403);
    expect(env.calls.createAuthUser).toBe(0);
  });

  it('rejects malformed bodies (400)', async () => {
    expect((await call(env.store, { action: 'create', studentIds: [] })).status).toBe(400);
    expect((await call(env.store, { action: 'explode' })).status).toBe(400);
    const badJson = await handleRequest(new Request('https://example.test', { method: 'POST', headers: { Authorization: 'Bearer t1' }, body: '{oops' }), { store: env.store });
    expect(badJson.status).toBe(400);
  });
});

describe('student-accounts: create', () => {
  let env: ReturnType<typeof makeStore>;
  beforeEach(() => { env = makeStore(); });

  it('creates accounts with a username, a one-time password and a forced password change', async () => {
    const res = await call(env.store, { action: 'create', studentIds: [S1, S2] });
    expect(res.status).toBe(200);
    const { results } = await res.json();
    expect(results).toHaveLength(2);
    for (const r of results) {
      expect(r.ok).toBe(true);
      expect(r.username).toMatch(/^[a-z0-9]{3,24}$/);
      expect(r.password).toMatch(/^[a-hj-km-np-z2-9]{8}$/);
    }
    expect(results[0].username.startsWith('minhanh')).toBe(true);
    const s1 = env.students.get(S1)!;
    expect(s1.authUserId).toBeTruthy();
    expect(s1.username).toBe(results[0].username);
    expect(s1.mustChangePassword).toBe(true);
    // Auth: email ảo, mật khẩu là mật khẩu trả về, vai trò học sinh.
    const auth = env.authUsers.get(s1.authUserId!)!;
    expect(auth.email).toBe(`${results[0].username}@${STUDENT_EMAIL_DOMAIN}`);
    expect(auth.password).toBe(results[0].password);
    expect(auth.app_metadata).toEqual({ role: 'student' });
  });

  it('never writes passwords into the audit log', async () => {
    const res = await call(env.store, { action: 'create', studentIds: [S1, S2] });
    const { results } = await res.json();
    expect(env.audit).toHaveLength(2);
    expect(env.audit.map(a => a.action)).toEqual(['create_account', 'create_account']);
    const dump = JSON.stringify(env.audit);
    for (const r of results) expect(dump).not.toContain(r.password);
    expect(env.audit[0]).toMatchObject({ teacherId: T1, studentName: 'Nguyễn Minh Anh', className: '6A1' });
  });

  it("does not let a teacher create accounts for another teacher's student", async () => {
    const res = await call(env.store, { action: 'create', studentIds: [OTHER] });
    const { results } = await res.json();
    expect(results[0]).toMatchObject({ ok: false, error: 'Không tìm thấy học sinh.' });
    expect(env.calls.createAuthUser).toBe(0);
    expect(env.students.get(OTHER)!.authUserId).toBe('auth-other');
  });

  it('reports per-student failures without stopping the batch', async () => {
    const res = await call(env.store, { action: 'create', studentIds: [S3, OTHER, S1] });
    const { results } = await res.json();
    expect(results.map((r: { ok: boolean }) => r.ok)).toEqual([false, false, true]);
    expect(results[0].error).toBe('Học sinh đã có tài khoản.');
  });

  it('retries with a different username when the suggestion is taken', async () => {
    env.flags.emailExistsOnce = true;
    env.flags.takenUsernames.add('minhanh');
    const res = await call(env.store, { action: 'create', studentIds: [S1] });
    const { results } = await res.json();
    expect(results[0].ok).toBe(true);
    expect(env.calls.createAuthUser).toBe(2);
  });

  it('honors a teacher-chosen username and refuses it when taken (no retry)', async () => {
    const ok = await (await call(env.store, { action: 'create', studentIds: [S1], usernames: { [S1]: 'Anh2026' } })).json();
    expect(ok.results[0]).toMatchObject({ ok: true, username: 'anh2026' });
    const taken = await (await call(env.store, { action: 'create', studentIds: [S2], usernames: { [S2]: 'anh2026' } })).json();
    expect(taken.results[0]).toMatchObject({ ok: false, error: 'Tên đăng nhập này đã có người dùng.' });
  });

  it('removes the auth user if linking the student row fails (no orphan accounts)', async () => {
    env.flags.failUpdateStudent = true;
    const res = await call(env.store, { action: 'create', studentIds: [S1] });
    const { results } = await res.json();
    expect(results[0].ok).toBe(false);
    expect(env.calls.deleteAuthUser).toBe(1);
    expect(Array.from(env.authUsers.keys()).some(k => k.startsWith('auth-new-'))).toBe(false);
    expect(env.audit).toHaveLength(0);
  });
});

describe('student-accounts: reset, lock, unlock, revoke', () => {
  let env: ReturnType<typeof makeStore>;
  beforeEach(() => { env = makeStore(); });

  it('resets the password, forces a change and logs without the password', async () => {
    const res = await call(env.store, { action: 'reset_password', studentId: S3 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, username: 'lechi123' });
    expect(env.authUsers.get('auth-existing')!.password).toBe(body.password);
    expect(body.password).not.toBe('oldpass1');
    expect(env.students.get(S3)!.mustChangePassword).toBe(true);
    expect(env.audit[0]).toMatchObject({ action: 'reset_password', studentName: 'Lê Chi' });
    expect(JSON.stringify(env.audit)).not.toContain(body.password);
  });

  it('locks and unlocks, keeping Auth and the student row in sync', async () => {
    expect((await call(env.store, { action: 'lock', studentId: S3 })).status).toBe(200);
    expect(env.authUsers.get('auth-existing')!.banned).toBe(true);
    expect(env.students.get(S3)!.status).toBe('locked');
    expect((await call(env.store, { action: 'unlock', studentId: S3 })).status).toBe(200);
    expect(env.authUsers.get('auth-existing')!.banned).toBe(false);
    expect(env.students.get(S3)!.status).toBe('active');
    expect(env.audit.map(a => a.action)).toEqual(['lock', 'unlock']);
  });

  it('rolls the ban back if the database update fails', async () => {
    env.flags.failUpdateStudent = true;
    const res = await call(env.store, { action: 'lock', studentId: S3 });
    expect(res.status).toBe(500);
    expect(env.authUsers.get('auth-existing')!.banned).toBe(false);
    expect(env.audit).toHaveLength(0);
  });

  it('revokes the login but keeps the student', async () => {
    expect((await call(env.store, { action: 'revoke', studentId: S3 })).status).toBe(200);
    expect(env.authUsers.has('auth-existing')).toBe(false);
    const s = env.students.get(S3)!;
    expect(s).toMatchObject({ authUserId: null, username: null, mustChangePassword: false, status: 'active', name: 'Lê Chi' });
    expect(env.audit[0]).toMatchObject({ action: 'revoke_account', detail: { username: 'lechi123' } });
  });

  it('answers 409 when the student has no account', async () => {
    for (const action of ['reset_password', 'lock', 'unlock', 'revoke']) {
      expect((await call(env.store, { action, studentId: S1 })).status).toBe(409);
    }
    expect(env.calls.updateAuthUser + env.calls.deleteAuthUser).toBe(0);
  });

  it("answers 404 and touches nothing for another teacher's student", async () => {
    for (const action of ['reset_password', 'lock', 'unlock', 'revoke']) {
      expect((await call(env.store, { action, studentId: OTHER })).status).toBe(404);
    }
    expect(env.calls.updateAuthUser + env.calls.deleteAuthUser + env.calls.updateStudent).toBe(0);
    expect(env.authUsers.get('auth-other')!.password).toBe('otherpw1');
    // Giáo viên T2 (chủ thật) thì làm được.
    expect((await call(env.store, { action: 'lock', studentId: OTHER }, 'Bearer t2')).status).toBe(200);
  });

  it('hides internal error details from the response and logs only the error name', async () => {
    env.flags.throwOnLoad = true;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await call(env.store, { action: 'lock', studentId: S3 });
    const text = await res.text();
    expect(res.status).toBe(500);
    expect(text).not.toContain('SECRET');
    expect(JSON.stringify(spy.mock.calls)).not.toContain('SECRET');
    spy.mockRestore();
  });
});
