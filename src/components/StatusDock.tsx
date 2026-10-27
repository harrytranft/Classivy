import React from 'react';
import { CloudUpload, History, LoaderCircle, CircleCheck } from 'lucide-react';
import { cx } from './ui';

interface StatusDockProps {
  user: any;
  isSyncing: boolean;
  lastSyncedTime: number | null;
  onBackup: () => void;
  onRestore: () => void;
}

const formatSyncTime = (timestamp: number | null) => {
  if (!timestamp) return 'Chưa có lần sync';
  return new Date(timestamp).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Sao lưu / khôi phục / trạng thái đồng bộ: nằm cuối thanh điều hướng trái.
export const StatusDock: React.FC<StatusDockProps> = ({
  user,
  isSyncing,
  lastSyncedTime,
  onBackup,
  onRestore
}) => {
  const syncLabel = isSyncing ? 'Đang đồng bộ dữ liệu' : formatSyncTime(lastSyncedTime);
  const items = [
    { id: 'backup', label: 'Sao lưu đám mây', Icon: CloudUpload, onClick: onBackup, disabled: !user || isSyncing },
    { id: 'restore', label: 'Khôi phục dữ liệu', Icon: History, onClick: onRestore, disabled: !user || isSyncing },
    {
      id: 'sync',
      label: isSyncing ? 'Đang sync' : 'Trạng thái sync',
      Icon: isSyncing ? LoaderCircle : CircleCheck,
      onClick: () => alert(syncLabel),
      disabled: false
    }
  ];

  return (
    <div className="group/status flex flex-col items-center gap-1 border-t border-white/10 pt-3">
      {items.map(({ id, label, Icon, onClick, disabled }) => (
        <button
          key={id}
          type="button"
          onClick={onClick}
          disabled={disabled}
          title={`${label}: ${id === 'sync' ? syncLabel : user ? syncLabel : 'Cần đăng nhập để dùng đám mây'}`}
          aria-label={label}
          className={cx(
            'relative grid h-10 w-10 place-items-center rounded-brand-md text-brand-cream/75 transition-colors',
            disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-white/10 hover:text-brand-cream',
            id === 'sync' && !isSyncing && 'text-brand-leaf'
          )}
        >
          <Icon className={cx('h-5 w-5', id === 'sync' && isSyncing && 'animate-spin text-brand-gold')} aria-hidden />
        </button>
      ))}
    </div>
  );
};
