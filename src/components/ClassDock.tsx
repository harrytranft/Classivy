import React, { useEffect, useRef, useState } from 'react';
import { MotionValue, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
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
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
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

// Phóng to kiểu dock macOS: ô gần con trỏ to dần theo khoảng cách, rời đi thì co về cỡ cũ (có lò xo cho mượt).
const BASE_SIZE = 52;
const MAX_SIZE = 84;
const REACH = 140;

interface DockTileProps {
  mouseX: MotionValue<number>;
  label: string;
  short: string;
  onClick?: () => void;
  active?: boolean;
  pressed?: boolean;
  tone?: 'default' | 'reward' | 'static';
  children: (iconSize: MotionValue<number>) => React.ReactNode;
}

const DockTile: React.FC<DockTileProps> = ({ mouseX, label, short, onClick, active, pressed, tone = 'default', children }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const distance = useTransform(mouseX, value => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || !Number.isFinite(value)) return REACH + 1;
    return value - (rect.left + rect.width / 2);
  });
  const target = useTransform(distance, [-REACH, 0, REACH], [BASE_SIZE, reduceMotion ? BASE_SIZE : MAX_SIZE, BASE_SIZE], { clamp: true });
  const size = useSpring(target, { mass: 0.1, stiffness: 170, damping: 14 });
  const iconSize = useTransform(size, value => Math.round(value * 0.48));

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={pressed}
      className={cx('group/tile flex shrink-0 flex-col items-center justify-end gap-1 px-0.5 text-[12px] font-bold leading-none', tone === 'static' ? 'cursor-default' : 'cursor-pointer')}
    >
      <motion.span
        style={{ width: size, height: size }}
        className={cx(
          'grid place-items-center rounded-[16px] transition-colors',
          active
            ? 'bg-brand-forest text-brand-cream shadow-[0_4px_12px_-4px_rgba(1,74,45,0.6)]'
            : tone === 'reward'
              ? 'bg-brand-gold text-brand-forest-deep shadow-[0_4px_12px_-4px_rgba(160,110,10,0.55)] group-hover/tile:bg-[#e9ab32]'
              : 'bg-[#f2f6ef] text-brand-forest group-hover/tile:bg-[#e4eee0]'
        )}
      >
        {children(iconSize)}
      </motion.span>
      <span className={cx('whitespace-nowrap', active ? 'text-brand-forest-deep' : 'text-brand-forest')}>{short}</span>
    </button>
  );
};

// Công cụ của trang lớp: nút có chữ để đọc được trên màn chiếu (thay cho dock kính phóng to kiểu cũ).
export const ClassDock: React.FC<ClassDockProps> = ({
  onRandom, onLudo, onLuckyWheel, onShop, onGroup, onTimer, onClaimAllRewards, onSelectAll,
  isMultiSelectMode, onToggleMultiSelect, onResetAura, selectedCount, isSyncing, lastSyncedTime,
  onOpenFeedback, onDeleteSelected
}) => {
  const [now, setNow] = useState(() => new Date());
  const mouseX = useMotionValue(Infinity);

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
        onMouseMove={event => mouseX.set(event.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="pointer-events-auto flex max-w-full items-end gap-1.5 rounded-[24px] border border-[#e6e2d4] bg-white px-3 pb-2 pt-2.5 shadow-[0_2px_6px_rgba(12,37,39,0.06),0_18px_40px_-14px_rgba(0,38,25,0.35)]"
      >
        {items.map(({ id, label, short, Icon, onClick, active }) => (
          <DockTile key={id} mouseX={mouseX} label={label} short={short} onClick={onClick} active={active} pressed={id === 'multi-select' ? !!active : undefined}>
            {iconSize => <motion.span style={{ width: iconSize, height: iconSize }} className="grid place-items-center"><Icon className="h-full w-full" strokeWidth={2} aria-hidden /></motion.span>}
          </DockTile>
        ))}

        <div className="mx-1 mb-6 h-10 w-px shrink-0 self-end bg-[#e6e2d4]" />

        <DockTile mouseX={mouseX} label={`GMT+7: ${formatVietnamTime(now)} · ${syncLabel}`} short={formatVietnamMinute(now)} tone="static">
          {iconSize => <motion.span style={{ width: iconSize, height: iconSize }} className="grid place-items-center"><AnalogClock now={now} /></motion.span>}
        </DockTile>

        <DockTile mouseX={mouseX} label="Nhận quà cả lớp" short="Nhận quà" onClick={onClaimAllRewards} tone="reward">
          {iconSize => <motion.span style={{ width: iconSize, height: iconSize }} className="grid place-items-center"><Gift className="h-full w-full" strokeWidth={2} aria-hidden /></motion.span>}
        </DockTile>

        {isMultiSelectMode && selectedCount > 0 && (
          <>
            <div className="mx-1 mb-6 h-10 w-px shrink-0 bg-[#e6e2d4]" />
            <div className="mb-5 flex shrink-0 items-center gap-1.5 px-1">
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
