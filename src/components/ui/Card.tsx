import React from 'react';
import { cx } from './cx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

/** Bề mặt nội dung: nền trắng ấm trên nền kem, viền mảnh, bóng mềm có độ lệch. Không lồng Card trong Card. */
export const Card: React.FC<CardProps> = ({ padded = true, className, children, ...rest }) => (
  <div
    className={cx(
      'rounded-brand-lg border border-[#e6e2d4] bg-white shadow-[0_1px_2px_rgba(12,37,39,0.04),0_6px_18px_-8px_rgba(12,37,39,0.14)]',
      padded && 'p-5',
      className
    )}
    {...rest}
  >
    {children}
  </div>
);
