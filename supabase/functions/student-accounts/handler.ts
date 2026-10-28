// Xử lý yêu cầu của Edge Function `student-accounts` (Phase 4, ADR 0002).
// Tách khỏi index.ts để test được bằng vitest với "kho" giả: file này không import gì ngoài `_shared`.
// QUY TẮC AN TOÀN: học sinh luôn được lấy qua `store.getOwnedStudents` (client mang JWT giáo viên, RLS lọc);
// chỉ sau đó mới dùng quyền quản trị để tạo/sửa người dùng Auth. Mật khẩu chỉ nằm trong phản hồi, không vào nhật ký/log.

import {
  cryptoRandomInt, generatePassword, parseRequest, suggestUsername, usernameToEmail
} from '../_shared/studentAccount.ts';

export interface OwnedStudent {
  id: string;
  name: string;
  className: string | null;
  authUserId: string | null;
  username: string | null;
  status: 'active' | 'locked';
}

export type AuditAction = 'create_account' | 'reset_password' | 'lock' | 'unlock' | 'revoke_account';

export interface StudentLinkFields {
  authUserId?: string | null;
  username?: string | null;
  mustChangePassword?: boolean;
  status?: 'active' | 'locked';
}

/** Mọi việc chạm Supabase nằm sau giao diện này; index.ts gắn bản thật, test gắn bản giả. */
export interface AccountStore {
  /** Kiểm tra JWT của yêu cầu, trả id người dùng hoặc null. */
  authenticate(authorizationHeader: string | null): Promise<string | null>;
  /** True nếu người dùng là giáo viên (profiles.role = 'teacher'). */
  isTeacher(userId: string): Promise<boolean>;
  /** Học sinh thuộc giáo viên này (qua RLS). Học sinh không phải của họ KHÔNG được trả về. */
  getOwnedStudents(teacherId: string, studentIds: string[]): Promise<OwnedStudent[]>;
  isUsernameTaken(username: string): Promise<boolean>;
  createAuthUser(input: { email: string; password: string; displayName: string }): Promise<{ id: string } | { error: 'email_exists' | 'failed' }>;
  updateAuthUser(authUserId: string, changes: { password?: string; banned?: boolean }): Promise<boolean>;
  deleteAuthUser(authUserId: string): Promise<boolean>;
  /** Cập nhật dòng học sinh; where luôn có teacher_id. */
  updateStudent(teacherId: string, studentId: string, fields: StudentLinkFields): Promise<boolean>;
  writeAudit(row: {
    teacherId: string; action: AuditAction; studentId: string; studentName: string; className: string | null; detail: Record<string, unknown>;
  }): Promise<void>;
}

export interface HandlerDeps {
  store: AccountStore;
  randomInt?: (max: number) => number;
}

export type CreateResult =
  | { studentId: string; ok: true; name: string; className: string | null; username: string; password: string }
  | { studentId: string; ok: false; error: string };

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

const ERR = {
  notFound: 'Không tìm thấy học sinh.',
  hasAccount: 'Học sinh đã có tài khoản.',
  noAccount: 'Học sinh chưa có tài khoản.',
  usernameTaken: 'Tên đăng nhập này đã có người dùng.',
  failed: 'Không thực hiện được, vui lòng thử lại.'
};

const MAX_USERNAME_ATTEMPTS = 8;

export const handleRequest = async (req: Request, deps: HandlerDeps): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Chỉ hỗ trợ POST.' });

  const { store } = deps;
  const randomInt = deps.randomInt ?? cryptoRandomInt;

  const teacherId = await store.authenticate(req.headers.get('Authorization'));
  if (!teacherId) return json(401, { ok: false, error: 'Chưa đăng nhập.' });
  if (!(await store.isTeacher(teacherId))) return json(403, { ok: false, error: 'Chỉ giáo viên được quản lý tài khoản học sinh.' });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: 'Yêu cầu không hợp lệ.' });
  }
  const parsed = parseRequest(body);
  if ('error' in parsed) return json(400, { ok: false, error: parsed.error });
  const { request } = parsed;

  const audit = (action: AuditAction, student: OwnedStudent, detail: Record<string, unknown> = {}) =>
    store.writeAudit({ teacherId, action, studentId: student.id, studentName: student.name, className: student.className, detail });

  try {
    if (request.action === 'create') {
      const owned = await store.getOwnedStudents(teacherId, request.studentIds);
      const byId = new Map(owned.map(s => [s.id.toLowerCase(), s]));
      const results: CreateResult[] = [];

      // Tuần tự: tránh dồn nhiều yêu cầu Auth cùng lúc và dễ xử lý trùng tên đăng nhập.
      for (const studentId of request.studentIds) {
        const student = byId.get(studentId);
        if (!student) { results.push({ studentId, ok: false, error: ERR.notFound }); continue; }
        if (student.authUserId) { results.push({ studentId, ok: false, error: ERR.hasAccount }); continue; }

        const override = request.usernameOverrides[studentId];
        const password = generatePassword(randomInt);
        let created: { id: string; username: string } | null = null;
        let failure = ERR.failed;

        for (let attempt = 0; attempt < (override ? 1 : MAX_USERNAME_ATTEMPTS) && !created; attempt += 1) {
          const username = override ?? suggestUsername(student.name, randomInt, Math.floor(attempt / 3));
          if (await store.isUsernameTaken(username)) { failure = ERR.usernameTaken; continue; }
          const user = await store.createAuthUser({ email: usernameToEmail(username), password, displayName: student.name });
          if ('error' in user) { failure = user.error === 'email_exists' ? ERR.usernameTaken : ERR.failed; if (user.error === 'failed') break; continue; }
          created = { id: user.id, username };
        }
        if (!created) { results.push({ studentId, ok: false, error: failure }); continue; }

        const linked = await store.updateStudent(teacherId, student.id, {
          authUserId: created.id, username: created.username, mustChangePassword: true, status: 'active'
        });
        if (!linked) {
          await store.deleteAuthUser(created.id); // không để lại tài khoản mồ côi
          results.push({ studentId, ok: false, error: ERR.failed });
          continue;
        }
        await audit('create_account', student, { username: created.username });
        results.push({ studentId, ok: true, name: student.name, className: student.className, username: created.username, password });
      }
      return json(200, { ok: true, results });
    }

    // Các hành động một học sinh.
    const [student] = await store.getOwnedStudents(teacherId, [request.studentId]);
    if (!student) return json(404, { ok: false, error: ERR.notFound });
    if (!student.authUserId || !student.username) return json(409, { ok: false, error: ERR.noAccount });
    const { authUserId, username } = student; // chụp lại trước khi cập nhật (nhật ký ghi tên đăng nhập cũ)

    if (request.action === 'reset_password') {
      const password = generatePassword(randomInt);
      if (!(await store.updateAuthUser(authUserId, { password }))) return json(500, { ok: false, error: ERR.failed });
      if (!(await store.updateStudent(teacherId, student.id, { mustChangePassword: true }))) return json(500, { ok: false, error: ERR.failed });
      await audit('reset_password', student);
      return json(200, { ok: true, studentId: student.id, name: student.name, className: student.className, username, password });
    }

    if (request.action === 'lock' || request.action === 'unlock') {
      const locking = request.action === 'lock';
      if (!(await store.updateAuthUser(authUserId, { banned: locking }))) return json(500, { ok: false, error: ERR.failed });
      if (!(await store.updateStudent(teacherId, student.id, { status: locking ? 'locked' : 'active' }))) {
        await store.updateAuthUser(authUserId, { banned: !locking }); // trả về như cũ để DB và Auth không lệch
        return json(500, { ok: false, error: ERR.failed });
      }
      await audit(locking ? 'lock' : 'unlock', student);
      return json(200, { ok: true, studentId: student.id, status: locking ? 'locked' : 'active' });
    }

    // revoke: xoá hẳn đăng nhập, giữ học sinh + điểm (D16).
    if (!(await store.deleteAuthUser(authUserId))) return json(500, { ok: false, error: ERR.failed });
    await store.updateStudent(teacherId, student.id, { authUserId: null, username: null, mustChangePassword: false, status: 'active' });
    await audit('revoke_account', student, { username });
    return json(200, { ok: true, studentId: student.id });
  } catch (error) {
    // Không đưa chi tiết lỗi (có thể chứa dữ liệu nhạy cảm) ra ngoài; chỉ ghi tên lỗi vào log máy chủ.
    console.error('student-accounts error:', error instanceof Error ? error.name : 'unknown');
    return json(500, { ok: false, error: ERR.failed });
  }
};
