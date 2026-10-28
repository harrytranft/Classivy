import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { AccountRow } from '../../domain/accountView';

export interface AuditEntry {
  id: number;
  action: string;
  studentName: string;
  className: string | null;
  detail: Record<string, unknown>;
  createdAt: string;
}

/**
 * Danh sách học sinh của một lớp kèm trạng thái tài khoản, đọc thẳng từ DB (RLS: chỉ thấy học sinh của mình).
 * Học sinh vừa thêm trong app có thể chưa lên đám mây (app lưu sau ~1,5 giây): bấm "Làm mới" để cập nhật.
 */
export const useClassAccounts = (className: string | null) => {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setVersion(v => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!className) { setRows([]); setAudit([]); setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const { data: classRow, error: classError } = await supabase.from('classes').select('id').eq('name', className).maybeSingle();
        if (classError) throw classError;
        if (!classRow) { if (!cancelled) { setRows([]); setAudit([]); } return; }

        const [studentsRes, auditRes] = await Promise.all([
          supabase
            .from('students')
            .select('id, client_id, name, username, status, must_change_password, auth_user_id')
            .eq('class_id', classRow.id)
            .order('name'),
          supabase
            .from('teacher_audit_log')
            .select('id, action, student_name, class_name, detail, created_at')
            .eq('class_name', className)
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(100)
        ]);
        if (studentsRes.error) throw studentsRes.error;
        if (auditRes.error) throw auditRes.error;
        if (cancelled) return;

        setRows((studentsRes.data ?? []).map((s: any): AccountRow => ({
          id: s.id,
          clientId: s.client_id,
          name: s.name,
          username: s.username,
          hasAccount: s.auth_user_id !== null,
          locked: s.status === 'locked',
          mustChangePassword: Boolean(s.must_change_password)
        })));
        setAudit((auditRes.data ?? []).map((a: any): AuditEntry => ({
          id: a.id, action: a.action, studentName: a.student_name, className: a.class_name,
          detail: a.detail ?? {}, createdAt: a.created_at
        })));
      } catch (err) {
        console.error('Failed to load student accounts:', err);
        if (!cancelled) setError('Không tải được danh sách tài khoản. Kiểm tra kết nối rồi bấm "Làm mới".');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [className, version]);

  return { rows, audit, loading, error, reload };
};
