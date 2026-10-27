import React from 'react';
import { cx } from './cx';

export type ButtonVariant = 'primary' | 'reward' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-forest text-brand-cream hover:bg-brand-forest-deep shadow-[0_2px_8px_-2px_rgba(0,38,25,0.45)]',
  reward: 'bg-brand-gold text-brand-forest-deep hover:bg-[#e9ab32] shadow-[0_2px_8px_-2px_rgba(160,110,10,0.5)]',
  secondary: 'bg-white text-brand-forest border border-brand-forest/20 hover:border-brand-forest/45 hover:bg-brand-cream',
  ghost: 'bg-transparent text-brand-forest hover:bg-brand-forest/[0.07]',
  danger: 'bg-brand-danger text-white hover:bg-[#a5301f] shadow-[0_2px_8px_-2px_rgba(150,40,25,0.45)]'
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[13px] gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2'
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

/** Nút chuẩn Classivy. `reward` (vàng) chỉ dùng cho phần thưởng/điểm. */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', icon, loading, className, children, disabled, type = 'button', ...rest
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={cx(
      'inline-flex shrink-0 items-center justify-center rounded-brand-md font-bold transition-[background-color,border-color,box-shadow,transform] duration-150 active:translate-y-px',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0',
      VARIANTS[variant], SIZES[size], className
    )}
    {...rest}
  >
    {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : icon}
    {children}
  </button>
);
