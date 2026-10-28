import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { StudentPortalResult, parseStudentPortalPayload } from '../../domain/studentPortal';

// Tải hồ sơ của chính học sinh qua hàm DB get_my_student_profile() (ADR 0003).
// Chỉ tải khi mở trang và khi em bấm "Cập nhật": không hỏi liên tục (giới hạn gói miễn phí).

export type StudentProfileState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'loaded'; result: StudentPortalResult; loadedAt: number };

export const useStudentProfile = () => {
  const [state, setState] = useState<StudentProfileState>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (): Promise<StudentProfileState> => {
    const { data, error } = await supabase.rpc('get_my_student_profile');
    if (error) return { kind: 'error' };
    try {
      return { kind: 'loaded', result: parseStudentPortalPayload(data), loadedAt: Date.now() };
    } catch {
      return { kind: 'error' };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().then(next => { if (!cancelled) setState(next); });
    return () => { cancelled = true; };
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const next = await load();
    setRefreshing(false);
    // Lỗi mạng khi cập nhật: giữ dữ liệu đang xem thay vì xoá trắng màn hình.
    setState(prev => (next.kind === 'error' && prev.kind === 'loaded' ? prev : next));
    return next.kind !== 'error';
  }, [load]);

  return { state, refresh, refreshing };
};
