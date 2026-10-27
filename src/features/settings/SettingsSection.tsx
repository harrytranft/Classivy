import React from 'react';

export interface SettingsSectionProps {
  id: string;
  title: string;
  icon: string;
  subtitle?: string;
  className?: string;
  collapsedSections: Record<string, boolean>;
  onToggle: (section: string) => void;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  id,
  title,
  icon,
  subtitle,
  className = 'bg-white p-6 sm:p-8 rounded-brand-lg border border-[#e6e2d4] shadow-[0_1px_2px_rgba(12,37,39,0.04),0_6px_18px_-8px_rgba(12,37,39,0.14)] space-y-6',
  collapsedSections,
  onToggle,
  children
}) => {
  const isCollapsed = !!collapsedSections[id];
  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-4 border-b border-[#e6e2d4] pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl shrink-0">{icon}</span>
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold tracking-tight text-brand-ink">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-brand-ink/70">{subtitle}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggle(id)}
          className={`shrink-0 h-8 w-14 rounded-full border p-1 transition-colors ${isCollapsed ? 'border-[#d9d6ca] bg-[#f1efe7]':'border-brand-forest bg-brand-forest'}`}
          aria-label={isCollapsed ? `Hiện ${title}` : `Ẩn ${title}`}
          title={isCollapsed ? `Hiện ${title}` : `Ẩn ${title}`}
        >
          <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${isCollapsed ? 'translate-x-0' : 'translate-x-8'}`} />
        </button>
      </div>
      {!isCollapsed && children}
    </section>
  );
};
