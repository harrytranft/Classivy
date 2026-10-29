import React, { useEffect } from 'react';
import { useApp } from '../../app/AppContext';

const UNDO_WINDOW_MS = 8000;

// Phase 13A.4: sau mỗi lần cộng/trừ nhanh hiện "Hoàn tác" trong 8 giây, ở mọi màn hình (kể cả khi đã sang Cá Ngựa).
// Chỉ hoàn tác được khi em đó chưa có thay đổi nào khác sau lần cộng/trừ (so dòng lịch sử mới nhất).
export const QuickUndoChip: React.FC = () => {
  const { lastQuickPoints, setLastQuickPoints, students, undoQuickPoints } = useApp();
  const current = lastQuickPoints ? students.find(student => student.id === lastQuickPoints.studentId) : undefined;
  const topHistoryId = current?.history[0]?.id;
  const beforeHistoryId = lastQuickPoints?.snapshot.history[0]?.id;
  const afterHistoryId = lastQuickPoints?.afterHistoryId;

  // Ghi lại mốc lịch sử ngay sau lần cộng/trừ (sau khi giáo viên trả lời hộp skill, nếu có).
  useEffect(() => {
    if (!lastQuickPoints || afterHistoryId || !current) return;
    if (topHistoryId !== beforeHistoryId) setLastQuickPoints({ ...lastQuickPoints, afterHistoryId: topHistoryId });
  }, [lastQuickPoints, afterHistoryId, current, topHistoryId, beforeHistoryId, setLastQuickPoints]);

  useEffect(() => {
    if (!afterHistoryId) return;
    const timer = window.setTimeout(() => setLastQuickPoints(null), UNDO_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, [afterHistoryId, setLastQuickPoints]);

  if (!lastQuickPoints || !afterHistoryId || topHistoryId !== afterHistoryId) return null;
  const sign = lastQuickPoints.amount > 0 ? '+' : '';
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-[300] flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-brand-forest-deep px-5 py-3 text-sm font-bold text-brand-cream shadow-2xl">
        <span>{lastQuickPoints.studentName}: {sign}{lastQuickPoints.amount} điểm</span>
        <button
          type="button"
          data-testid="quick-undo"
          onClick={undoQuickPoints}
          className="min-h-[36px] rounded-full bg-brand-gold px-4 py-1.5 font-extrabold text-brand-forest-deep hover:bg-brand-gold-dark"
        >
          Hoàn tác
        </button>
      </div>
    </div>
  );
};
