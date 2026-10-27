import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { PokemonUiEvent } from '../domain/gameEvents';

interface PokemonReactionToastProps {
  events: PokemonUiEvent[];
  title?: string;
  onClose?: () => void;
}

const labelForType = (type: PokemonUiEvent['type']): string => {
  switch (type) {
    case 'xp':
      return 'XP';
    case 'bond':
      return 'Bond';
    case 'streak':
      return 'Streak';
    case 'passive':
      return 'Passive';
    case 'charge-ready':
      return 'Power';
    case 'level-up':
      return 'Level Up';
    case 'evolution':
      return 'Evolution';
    case 'hp':
      return 'HP';
    case 'random-drop':
      return 'Drop';
    case 'mastery':
      return 'Mastery';
    default:
      return 'Event';
  }
};

const TONE_FOR_TYPE: Partial<Record<PokemonUiEvent['type'], string>> = {
  'random-drop': 'bg-brand-violet text-white',
  'level-up': 'bg-brand-gold text-brand-forest-deep',
  evolution: 'bg-brand-gold text-brand-forest-deep',
  hp: 'bg-brand-emerald text-white'
};

// Thông báo tiến triển Pokémon. Không phủ chặn màn hình nữa: bấm ra chỗ khác vẫn tắt thông báo như cũ,
// nhưng cú bấm đó đồng thời tác dụng lên nút bên dưới (trước đây phải bấm hai lần).
export const PokemonReactionToast: React.FC<PokemonReactionToastProps> = ({ events, title = 'Tiến triển Pokémon', onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const visible = events.length > 0;

  useEffect(() => {
    if (!visible || !onClose) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [visible, onClose]);

  if (!visible) return null;
  const visibleEvents = [...events].sort((a, b) => Number(b.type === 'random-drop') - Number(a.type === 'random-drop')).slice(0, 4);

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-6 z-[320] w-[min(92vw,460px)] -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-200"
    >
      <div className="relative rounded-brand-lg border border-brand-gold/60 bg-white p-4 pr-12 shadow-[0_18px_44px_-14px_rgba(0,38,25,0.45)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full text-brand-ink/60 transition-colors hover:bg-brand-forest/[0.07] hover:text-brand-forest"
          aria-label="Tắt thông báo Pokémon"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <p className="mb-2.5 text-[13px] font-extrabold text-brand-forest">{title}</p>
        <div className="space-y-1.5">
          {visibleEvents.map((event, index) => (
            <div key={`${event.type}-${index}-${event.message}`} className="flex items-center gap-2.5 rounded-brand-md bg-[#f4f8f1] px-3 py-2">
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${TONE_FOR_TYPE[event.type] || 'bg-brand-forest text-brand-cream'}`}>
                {labelForType(event.type)}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-brand-ink">{event.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
