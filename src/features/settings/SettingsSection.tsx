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
  className = 'bg-white p-10 rounded-[40px] border shadow-sm space-y-8',
  collapsedSections,
  onToggle,
  children
}) => {
  const isCollapsed = !!collapsedSections[id];
  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl shrink-0">{icon}</span>
          <div className="min-w-0">
            <h3 className="text-2xl font-royal text-red-800">{title}</h3>
            {subtitle && <p className="text-xs text-stone-500 font-bold mt-1">{subtitle}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggle(id)}
          className={`shrink-0 w-16 h-8 rounded-full border-2 p-1 transition-all ${isCollapsed ? 'bg-stone-200 border-stone-300' : 'bg-red-800 border-red-900'}`}
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
