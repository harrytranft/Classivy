import React from 'react';
import { cx } from './cx';

export interface ShieldScoreProps {
  points: number;
  label?: string;
  size?: 'md' | 'lg';
  className?: string;
}

/**
 * Điểm Hào Quang đặt trong tấm khiên viền vàng: dấu ấn "Lá non trong tấm khiên".
 * Điểm âm đổi sang khiên viền đỏ, không dùng vàng (vàng chỉ dành cho phần thưởng).
 */
export const ShieldScore: React.FC<ShieldScoreProps> = ({ points, label = 'Hào Quang', size = 'md', className }) => {
  const negative = points < 0;
  const box = size === 'lg' ? 'h-[76px] w-[66px]' : 'h-[64px] w-[56px]';
  return (
    <div className={cx('flex shrink-0 flex-col items-center', className)}>
      <div className={cx('relative grid place-items-center', box)}>
        <svg viewBox="0 0 56 64" className="absolute inset-0 h-full w-full" aria-hidden>
          <path
            d="M28 2 52 10v20c0 15.5-10.2 26.4-24 32C14.2 56.4 4 45.5 4 30V10L28 2Z"
            className={negative ? 'fill-[#fbeae7] stroke-brand-danger' : 'fill-brand-forest stroke-brand-gold'}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {!negative && <path d="M28 8 46 14v15c0 11.6-7.4 20-18 24.6" fill="none" className="stroke-brand-gold-light/30" strokeWidth="1.5" />}
        </svg>
        <span
          className={cx(
            'relative -mt-1 font-extrabold leading-none tabular-nums tracking-tight',
            size === 'lg' ? 'text-2xl' : 'text-xl',
            Math.abs(points) >= 1000 && 'text-base',
            negative ? 'text-[#9b2a1d]' : 'text-brand-gold-light'
          )}
        >
          {points}
        </span>
      </div>
      <span className="mt-1 text-[12px] font-bold leading-none text-brand-ink/70">{label}</span>
    </div>
  );
};
