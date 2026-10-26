import React from 'react';
import { useApp } from '../../app/AppContext';

export const LevelUpModal: React.FC = () => {
  const {
    levelUpAnnouncement, setLevelUpAnnouncement
  } = useApp();
  return (
    <>
      {levelUpAnnouncement && (
        <div
          className="fixed inset-0 z-[330] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setLevelUpAnnouncement(null);
          }}
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-[36px] border-4 border-amber-300 bg-white p-8 text-center shadow-[0_30px_90px_rgba(245,158,11,0.45)] animate-in zoom-in-95 duration-200">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.35),transparent_42%)] pointer-events-none" />
            <button
              onClick={() => setLevelUpAnnouncement(null)}
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-amber-200 bg-white text-sm font-black text-amber-900 hover:bg-amber-50"
              aria-label="Tắt thông báo level up"
            >
              ×
            </button>
            <div className="relative z-10 space-y-4">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-5xl ring-8 ring-amber-200/60">⭐</div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-700">{levelUpAnnouncement.title}</p>
              <h2 className="font-royal text-4xl uppercase text-amber-950">Level Up!</h2>
              <div className="space-y-2">
                {levelUpAnnouncement.events.map((event, index) => (
                  <p key={`${event.message}-${index}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-950">
                    {event.message}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
