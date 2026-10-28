import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../components/ui';
import { useGameData } from './providers/GameDataProvider';

// Phase 7 (D31): lần lưu bị từ chối vì máy khác vừa sửa cùng học sinh. App đã tải lại bản mới nhất;
// thao tác vừa làm trên máy này (nếu có) cần làm lại.
export const SyncConflictBanner: React.FC = () => {
  const { syncConflict, setSyncConflict } = useGameData();
  if (!syncConflict) return null;
  return (
    <div role="alert" className="fixed left-[100px] right-4 top-4 z-[60] mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-brand-lg border border-[#f4dc8a] bg-brand-gold-light p-4 text-sm text-[#5c3f00] shadow-lg">
      <RefreshCw className="h-5 w-5 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1">
        <strong>Dữ liệu vừa được đổi ở máy khác.</strong> Classivy đã tải lại bản mới nhất để không ghi đè lên nhau.
        Thao tác bạn vừa làm trên máy này có thể chưa được lưu: hãy kiểm tra và làm lại nếu cần.
      </p>
      <Button size="sm" variant="secondary" onClick={() => setSyncConflict(false)}>Đã hiểu</Button>
    </div>
  );
};
