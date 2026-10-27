import React from 'react';
import { cx } from './cx';

export type ChipTone = 'neutral' | 'forest' | 'leaf' | 'gold' | 'violet' | 'danger' | 'sky';

const TONES: Record<ChipTone, string> = {
  neutral: 'bg-[#f1efe7] text-brand-ink/80 border-[#e3e0d3]',
  forest: 'bg-brand-forest text-brand-cream border-brand-forest',
  leaf: 'bg-[#e9f6ea] text-[#1d6a40] border-[#cbe9cf]',
  gold: 'bg-brand-gold-light text-[#6b4a00] border-[#f4dc8a]',
  violet: 'bg-[#f3e9fa] text-brand-violet-deep border-[#e4d0f2]',
  danger: 'bg-[#fbeae7] text-[#9b2a1d] border-[#f2cdc6]',
  sky: 'bg-[#e8f3f8] text-[#155e7a] border-[#cde4ee]'
};

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  icon?: React.ReactNode;
}

/** Nhãn nhỏ dạng viên thuốc: cấp, danh hiệu, chuỗi, trạng thái. */
export const Chip: React.FC<ChipProps> = ({ tone = 'neutral', icon, className, children, ...rest }) => (
  <span
    className={cx(
      'inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2 py-0.5 text-[12px] font-bold leading-4',
      TONES[tone], className
    )}
    {...rest}
  >
    {icon}
    {children}
  </span>
);
