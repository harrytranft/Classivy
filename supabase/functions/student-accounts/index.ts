// Điểm vào của Edge Function `student-accounts` (Deno, chạy trên Supabase). Logic ở handler.ts (có test).
// Triển khai: xem docs/phase-4-runbook.md. Biến SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// do Supabase tự cấp cho Edge Function; KHÔNG ghi khoá vào mã nguồn.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleRequest, type AccountStore, type OwnedStudent } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BAN_FOREVER = '876000h';

const makeStore = (req: Request): AccountStore => {
  const authorization = req.headers.get('Authorization') ?? '';
  // Client "của giáo viên": mang JWT của họ, RLS áp dụng. Dùng để biết học sinh nào thuộc về họ.
  const asCaller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  // Client quản trị: bỏ qua RLS. CHỈ dùng sau khi đã xác nhận quyền sở hữu.
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  return {
    async authenticate(header) {
      if (!header?.startsWith('Bearer ')) return null;
      const { data, error } = await asCaller.auth.getUser(header.slice('Bearer '.length));
      return error || !data.user ? null : data.user.id;
    },
    async isTeacher(userId) {
      const { data } = await admin.from('profiles').select('role').eq('user_id', userId).maybeSingle();
      return data?.role === 'teacher';
    },
    async getOwnedStudents(teacherId, studentIds) {
      const { data, error } = await asCaller
        .from('students')
        .select('id, name, class_id, auth_user_id, username, status')
        .eq('teacher_id', teacherId)
        .in('id', studentIds);
      if (error || !data) throw new Error('load_students_failed');
      const classIds = Array.from(new Set(data.map((row: any) => row.class_id)));
      const classNames = new Map<string, string>();
      if (classIds.length > 0) {
        const { data: classes, error: classError } = await asCaller.from('classes').select('id, name').in('id', classIds);
        if (classError) throw new Error('load_classes_failed');
        for (const c of classes ?? []) classNames.set(c.id, c.name);
      }
      return data.map((row: any): OwnedStudent => ({
        id: row.id,
        name: row.name,
        className: classNames.get(row.class_id) ?? null,
        authUserId: row.auth_user_id,
        username: row.username,
        status: row.status
      }));
    },
    async isUsernameTaken(username) {
      const { data, error } = await admin.from('students').select('id').eq('username', username).limit(1);
      if (error) throw new Error('username_check_failed');
      return (data?.length ?? 0) > 0;
    },
    async createAuthUser({ email, password, displayName }) {
      const { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        app_metadata: { role: 'student' },
        user_metadata: { display_name: displayName }
      });
      if (error || !data.user) {
        const code = (error as { code?: string } | null)?.code;
        return { error: code === 'email_exists' || code === 'user_already_exists' ? 'email_exists' : 'failed' };
      }
      return { id: data.user.id };
    },
    async updateAuthUser(authUserId, changes) {
      const attrs: { password?: string; ban_duration?: string } = {};
      if (changes.password !== undefined) attrs.password = changes.password;
      if (changes.banned !== undefined) attrs.ban_duration = changes.banned ? BAN_FOREVER : 'none';
      const { error } = await admin.auth.admin.updateUserById(authUserId, attrs);
      return !error;
    },
    async deleteAuthUser(authUserId) {
      const { error } = await admin.auth.admin.deleteUser(authUserId);
      return !error;
    },
    async updateStudent(teacherId, studentId, fields) {
      const update: Record<string, unknown> = {};
      if (fields.authUserId !== undefined) update.auth_user_id = fields.authUserId;
      if (fields.username !== undefined) update.username = fields.username;
      if (fields.mustChangePassword !== undefined) update.must_change_password = fields.mustChangePassword;
      if (fields.status !== undefined) update.status = fields.status;
      const { data, error } = await admin.from('students').update(update).eq('id', studentId).eq('teacher_id', teacherId).select('id');
      return !error && (data?.length ?? 0) === 1;
    },
    async writeAudit(row) {
      const { error } = await admin.from('teacher_audit_log').insert({
        teacher_id: row.teacherId, action: row.action, student_id: row.studentId,
        student_name: row.studentName, class_name: row.className, detail: row.detail
      });
      if (error) console.error('audit_write_failed');
    }
  };
};

Deno.serve((req: Request) => handleRequest(req, { store: makeStore(req) }));
