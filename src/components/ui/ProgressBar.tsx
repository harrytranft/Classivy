import React from 'react';
import { cx } from './cx';

export type ProgressTone = 'leaf' | 'gold' | 'warning' | 'danger' | 'muted';

const FILL: Record<ProgressTone, string> = {
  leaf: 'bg-brand-emerald',
  gold: 'bg-brand-gold',
  warning: 'bg-[#e39a1b]',
  danger: 'bg-brand-danger',
  muted: 'bg-[#b9b6a8]'
};

export interface ProgressBarProps {
  /** 0-100 */
  value: number;
  tone?: ProgressTone;
  /** Chồi lá ở đầu thanh: dấu hiệu "lớn lên" của Classivy, dùng cho thanh XP. */
  sprout?: boolean;
  label: string;
  className?: string;
  size?: 'sm' | 'md';
}

/** Thanh tiến độ (XP, HP, trứng). `label` là tên đọc cho trình đọc màn hình. */
export const ProgressBar: React.FC<ProgressBarProps> = ({ value, tone = 'leaf', sprout, label, className, size = 'sm' }) => {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cx('relative w-full rounded-full bg-[#ebe8dc]', size === 'sm' ? 'h-1.5' : 'h-2.5', className)}
    >
      <div className={cx('h-full rounded-full transition-[width] duration-700 ease-out', FILL[tone])} style={{ width: `${pct}%` }} />
      {sprout && pct > 0 && (
        <svg
          viewBox="0 0 12 12"
          aria-hidden
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-[85%] text-brand-leaf transition-[left] duration-700 ease-out"
          style={{ left: `${pct}%` }}
        >
          <path d="M6 11V6.5C6 3.5 8 1.5 11 1c-.3 3.2-2.2 5.3-5 5.5" fill="currentColor" />
          <path d="M6 8C6 5.8 4.6 4.2 1.5 4c.2 2.4 1.8 3.9 4.5 4" fill="currentColor" opacity=".75" />
        </svg>
      )}
    </div>
  );
};
