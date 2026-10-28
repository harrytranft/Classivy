import { useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { applyGiftAdjustments, parseGiftAdjustments } from '../../../domain/social';
import { GameDataState } from './useGameDataState';
import type { AuthUser } from '../../../features/auth/AuthContext';

// Phase 6 (D23): gom "hàng chờ" điểm học sinh tặng nhau vào Hào Quang.
// Chỉ chạy với dữ liệu bảng (Phase 3) sau khi tải xong. Đọc khi mở app, khi quay lại tab, và mỗi 3 phút khi tab đang mở
// (một truy vấn nhẹ, không đáng kể với gói miễn phí). Việc ghi do vòng lưu sẵn có làm: mỗi dòng thành sổ điểm 'gift-<id>'.

export const GIFT_POLL_INTERVAL_MS = 3 * 60 * 1000;

export const useGiftCollector = (data: GameDataState, user: AuthUser | null) => {
  const { setStudents, initialCloudLoadComplete, cloudLoadSuccess, cloudDataModelRef } = data;
  const appliedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || user.role === 'student' || !initialCloudLoadComplete || !cloudLoadSuccess) return;
    let stopped = false;
    let running = false;

    const collect = async () => {
      if (stopped || running || cloudDataModelRef.current !== 'tables' || document.visibilityState === 'hidden') return;
      running = true;
      try {
        const { data: rows, error } = await supabase.rpc('teacher_pending_gift_adjustments');
        // Supabase chưa chạy migration Phase 6: thôi hỏi trong phiên này.
        if (error) { if (error.code === 'PGRST202' || error.code === '42883') stopped = true; return; }
        const adjustments = parseGiftAdjustments(rows);
        if (adjustments.length === 0 || stopped) return;
        // Hàm cập nhật phải thuần (React có thể gọi 2 lần): chụp danh sách bỏ qua trước, ghi nhận sau.
        const skip = new Set(appliedRef.current);
        setStudents(prev => applyGiftAdjustments(prev, adjustments, skip).students);
        adjustments.forEach(adj => appliedRef.current.add(adj.clientEventId));
      } catch {
        // Lỗi mạng: lần sau thử lại.
      } finally {
        running = false;
      }
    };

    collect();
    const timer = window.setInterval(collect, GIFT_POLL_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') collect(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, initialCloudLoadComplete, cloudLoadSuccess, setStudents, cloudDataModelRef]);
};
