import React, { useEffect, useState } from 'react';
import {
  CheckCheck, Dices, Eraser, FerrisWheel, Flag, Gift, Hand, ShoppingBag, Sparkles, Timer, Trash2, Users, type LucideIcon
} from 'lucide-react';
import { cx } from './ui';

interface DockItem {
  id: string;
  label: string;
  short: string;
  Icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
}

interface ClassDockProps {
  onRandom: () => void;
  onLudo: () => void;
  onLuckyWheel: () => void;
  onShop: () => void;
  onGroup: () => void;
  onTimer: () => void;
  onClaimAllRewards: () => void;
  onSelectAll: () => void;
  isMultiSelectMode: boolean;
  onToggleMultiSelect: () => void;
  onResetAura: () => void;
  selectedCount: number;
  isSyncing: boolean;
  lastSyncedTime: number | null;
  onOpenFeedback: () => void;
  onDeleteSelected: () => void;
}

const formatVietnamTime = (date: Date) => new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}).format(date);

const formatVietnamMinute = (date: Date) => new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}).format(date);

const getVietnamClockParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value || 0);
  return { hour: get('hour') % 24, minute: get('minute'), second: get('second') };
};

const AnalogClock: React.FC<{ now: Date }> = ({ now }) => {
  const { hour, minute, second } = getVietnamClockParts(now);
  const hand = (deg: number, length: number, width: number, className: string) => (
    <line x1="20" y1="20" x2="20" y2={20 - length} strokeWidth={width} strokeLinecap="round" className={className} transform={`rotate(${deg} 20 20)`} />
  );
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
      <circle cx="20" cy="20" r="18" className="fill-brand-cream stroke-brand-gold" strokeWidth="2" />
      {[...Array(12)].map((_, index) => (
        <line key={index} x1="20" y1="4.5" x2="20" y2={index % 3 === 0 ? 8 : 6.5} strokeWidth="1.5" className="stroke-brand-forest/60" transform={`rotate(${index * 30} 20 20)`} />
      ))}
      {hand(((hour % 12) * 30) + (minute * 0.5), 8, 2.8, 'stroke-brand-forest-deep')}
      {hand(minute * 6, 12, 2, 'stroke-brand-forest-deep')}
      {hand(second * 6, 13.5, 1, 'stroke-brand-danger')}
      <circle cx="20" cy="20" r="2" className="fill-brand-gold" />
    </svg>
  );
};

const itemClass = 'flex h-[64px] w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-brand-md text-[12px] font-bold leading-none transition-colors';

// Công cụ của trang lớp: nút có chữ để đọc được trên màn chiếu (thay cho dock kính phóng to kiểu cũ).
export const ClassDock: React.FC<ClassDockProps> = ({
  onRandom, onLudo, onLuckyWheel, onShop, onGroup, onTimer, onClaimAllRewards, onSelectAll,
  isMultiSelectMode, onToggleMultiSelect, onResetAura, selectedCount, isSyncing, lastSyncedTime,
  onOpenFeedback, onDeleteSelected
}) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Thứ tự giữ nguyên như dock cũ (smoke test bấm theo vị trí).
  const items: DockItem[] = [
    { id: 'random', label: 'Rút Thăm Ngẫu Nhiên', short: 'Random', Icon: Dices, onClick: onRandom },
    { id: 'ludo', label: 'Đua Cá Ngựa', short: 'Cá Ngựa', Icon: Flag, onClick: onLudo },
    { id: 'lucky-wheel', label: 'Vòng quay may mắn', short: 'Vòng quay', Icon: FerrisWheel, onClick: onLuckyWheel },
    { id: 'shop', label: 'Shop', short: 'Shop', Icon: ShoppingBag, onClick: onShop },
    { id: 'group', label: 'Chia Nhóm Tự Động', short: 'Chia nhóm', Icon: Users, onClick: onGroup },
    { id: 'timer', label: 'Đồng Hồ Bấm Giờ', short: 'Hẹn giờ', Icon: Timer, onClick: onTimer },
    { id: 'select-all', label: 'Chọn Tất Cả Trainer', short: 'Chọn hết', Icon: CheckCheck, onClick: onSelectAll },
    {
      id: 'multi-select',
      label: isMultiSelectMode ? 'Tắt Chế Độ Chọn' : 'Chọn Nhiều Trainer',
      short: isMultiSelectMode ? 'Đang chọn' : 'Chọn nhiều',
      Icon: Hand,
      onClick: onToggleMultiSelect,
      active: isMultiSelectMode
    },
    {
      id: 'reset-aura',
      label: selectedCount > 0 ? `Reset Hào Quang (${selectedCount})` : 'Reset Hào Quang',
      short: 'Reset điểm',
      Icon: Eraser,
      onClick: onResetAura
    }
  ];

  const syncLabel = isSyncing
    ? 'Đang đồng bộ'
    : lastSyncedTime
      ? `Sync gần nhất: ${new Date(lastSyncedTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
      : 'Chưa có lần sync';

  return (
    <div className="pointer-events-none fixed bottom-4 left-[84px] right-0 z-40 flex justify-center px-4">
      <div
        role="toolbar"
        aria-label="Công cụ lớp"
        className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-[22px] border border-[#e6e2d4] bg-white p-2 shadow-[0_2px_6px_rgba(12,37,39,0.06),0_18px_40px_-14px_rgba(0,38,25,0.35)]"
      >
        {items.map(({ id, label, short, Icon, onClick, active }) => (
          <button
            key={id}
            type="button"
            onClick={onClick}
            title={label}
            aria-pressed={id === 'multi-select' ? !!active : undefined}
            className={cx(itemClass, active ? 'bg-brand-forest text-brand-cream' : 'text-brand-forest hover:bg-brand-forest/[0.07]')}
          >
            <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
            <span>{short}</span>
          </button>
        ))}

        <div className="mx-1 h-10 w-px shrink-0 bg-[#e6e2d4]" />

        <button
          type="button"
          className={cx(itemClass, 'cursor-default text-brand-forest-deep')}
          title={`GMT+7: ${formatVietnamTime(now)} · ${syncLabel}`}
        >
          <AnalogClock now={now} />
          <span className="tabular-nums">{formatVietnamMinute(now)}</span>
        </button>

        <button
          type="button"
          onClick={onClaimAllRewards}
          className={cx(itemClass, 'bg-brand-gold text-brand-forest-deep hover:bg-[#e9ab32]')}
          title="Nhận quà cả lớp"
        >
          <Gift className="h-6 w-6" strokeWidth={2} aria-hidden />
          <span>Nhận quà</span>
        </button>

        {isMultiSelectMode && selectedCount > 0 && (
          <>
            <div className="mx-1 h-10 w-px shrink-0 bg-[#e6e2d4]" />
            <div className="flex shrink-0 items-center gap-1.5 px-1">
              <button
                type="button"
                onClick={onOpenFeedback}
                className="inline-flex h-11 items-center gap-1.5 rounded-brand-md bg-brand-forest px-4 text-sm font-bold text-brand-cream hover:bg-brand-forest-deep"
              >
                <Sparkles className="h-[18px] w-[18px]" aria-hidden />
                <span>Phản Hồi ({selectedCount})</span>
              </button>
              <button
                type="button"
                onClick={onDeleteSelected}
                aria-label="Xóa trainer đã chọn"
                className="inline-flex h-11 items-center gap-1.5 rounded-brand-md bg-brand-danger px-3 text-sm font-bold text-white hover:bg-[#a5301f]"
              >
                <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                <span className="hidden sm:inline">Xóa</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
