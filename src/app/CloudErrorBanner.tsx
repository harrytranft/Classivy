import React from 'react';
import { CloudOff } from 'lucide-react';
import { Button } from '../components/ui';
import { useGameData } from './providers/GameDataProvider';

// Không tải/lưu được dữ liệu đám mây: báo rõ cho giáo viên kèm mã lỗi (trước đây chỉ ghi console,
// trên điện thoại thấy lớp trống, trên máy tính tưởng đã lưu). Tải hỏng thì tự đồng bộ tạm dừng để không ghi đè.
export const CloudErrorBanner: React.FC = () => {
  const { cloudLoadError, cloudSaveError, setCloudLoadError, setCloudSaveError, setCloudReloadToken, isSyncing } = useGameData();
  const message = cloudLoadError ?? cloudSaveError;
  if (!message) return null;
  const isLoad = cloudLoadError !== null;
  return (
    <div role="alert" className="fixed left-[100px] right-4 top-4 z-[60] mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-brand-lg border border-brand-danger/40 bg-[#fbeae7] p-4 text-sm text-[#7a2318] shadow-lg">
      <CloudOff className="h-5 w-5 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 break-words">
        <strong>{isLoad ? 'Chưa tải được dữ liệu từ đám mây.' : 'Chưa lưu được lên đám mây.'}</strong>{' '}
        {isLoad
          ? 'Classivy tạm dừng tự lưu để không ghi đè dữ liệu thật. '
          : 'Thay đổi vẫn còn trên máy này; Classivy sẽ thử lưu lại ở thao tác tiếp theo. '}
        <span className="opacity-80">{message}</span>
      </p>
      {isLoad ? (
        <Button size="sm" variant="secondary" disabled={isSyncing} onClick={() => { setCloudLoadError(null); setCloudReloadToken(n => n + 1); }}>
          {isSyncing ? 'Đang tải...' : 'Thử lại'}
        </Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setCloudSaveError(null)}>Đã hiểu</Button>
      )}
    </div>
  );
};
