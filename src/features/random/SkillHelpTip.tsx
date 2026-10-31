import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

// Cách dùng skill: rê chuột (hoặc focus) vào tên skill để hiện; bấm biểu tượng ⓘ để ghim (máy cảm ứng).
// Hộp gợi ý gắn vào <body> với vị trí cố định nên không bị khung cuộn của hộp Random cắt mất.
interface SkillHelpTipProps {
  name: string;
  icon?: string;
  description?: string;
  children: React.ReactNode;
}

const TIP_WIDTH = 320;
const GAP = 8;

export const SkillHelpTip: React.FC<SkillHelpTipProps> = ({ name, icon, description, children }) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; above: boolean } | null>(null);
  const open = (hovered || pinned) && !!description;

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const place = () => {
      const rect = anchorRef.current!.getBoundingClientRect();
      const left = Math.max(GAP, Math.min(window.innerWidth - TIP_WIDTH - GAP, rect.left));
      // Đủ chỗ phía dưới thì hiện dưới, không thì hiện trên.
      const above = rect.bottom + 160 > window.innerHeight;
      setPosition({ top: above ? rect.top - GAP : rect.bottom + GAP, left, above });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  return (
    <div
      ref={anchorRef}
      className="flex min-w-0 items-center gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => { setHovered(false); setPinned(false); }}
    >
      {children}
      {description && (
        <button
          type="button"
          onClick={() => setPinned(prev => !prev)}
          aria-label={`Cách dùng ${name}`}
          aria-expanded={open}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-indigo-500 transition-colors hover:bg-indigo-100 hover:text-indigo-700"
          data-testid="skill-help"
        >
          <Info className="h-4 w-4" aria-hidden />
        </button>
      )}
      {open && position && createPortal(
        <div
          role="tooltip"
          data-testid="skill-help-tip"
          style={{ top: position.top, left: position.left, width: TIP_WIDTH, transform: position.above ? 'translateY(-100%)' : undefined }}
          className="pointer-events-none fixed z-[500] rounded-brand-md border border-indigo-200 bg-white p-3.5 text-left shadow-[0_14px_32px_-12px_rgba(12,37,39,0.45)]"
        >
          <p className="text-sm font-extrabold text-indigo-950">{icon && <span aria-hidden className="mr-1">{icon}</span>}{name}</p>
          <p className="mt-1 text-[15px] leading-snug text-brand-ink">{description}</p>
        </div>,
        document.body
      )}
    </div>
  );
};
