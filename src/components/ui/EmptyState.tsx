import React from 'react';
import { cx } from './cx';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** Trạng thái trống: nói rõ vì sao trống và việc nên làm tiếp. */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className }) => (
  <div className={cx('flex flex-col items-center rounded-brand-lg border-2 border-dashed border-[#dcd8c8] px-6 py-12 text-center', className)}>
    {icon && <div className="mb-3 text-brand-emerald" aria-hidden>{icon}</div>}
    <p className="text-lg font-bold text-brand-ink">{title}</p>
    {description && <p className="mt-1 max-w-md text-sm text-brand-ink/70">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
