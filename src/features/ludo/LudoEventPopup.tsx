import React from 'react';
import { StudentAvatar } from '../../components/StudentAvatar';
import { motion } from 'motion/react';
import { useApp } from '../../app/AppContext';

export const LudoEventPopup: React.FC = () => {
  const {
    ludoEventPopup, ludoPositions, setLudoEventPopup, resolveLudoChallenge
  } = useApp();
  return (
    <>
      {ludoEventPopup && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-8 rounded-[40px] max-w-md w-full border-4 border-amber-500 shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="text-6xl animate-bounce">{ludoEventPopup.icon || '🌟'}</div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-amber-950">
                {ludoEventPopup.title}
              </h3>
              <p className="text-sm font-bold text-amber-900 bg-white/90 p-4 rounded-2xl border border-amber-300 shadow-xs leading-relaxed">
                {ludoEventPopup.message}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 bg-white/70 p-3 rounded-2xl border border-amber-200 shadow-xs">
              <StudentAvatar student={ludoEventPopup.actor} className="w-12 h-12 rounded-full border-2 border-amber-600" />
              <div className="text-left">
                <p className="text-xs font-black text-amber-950">{ludoEventPopup.actor.name}</p>
                <p className="text-xs text-amber-800 font-bold">Vị trí hiện tại: Ô {ludoPositions[ludoEventPopup.actor.id] || 0}</p>
              </div>
            </div>

            {ludoEventPopup.type === 'kick' && ludoEventPopup.target && (
              <div className="relative mx-auto h-28 overflow-hidden rounded-3xl border-2 border-red-300 bg-gradient-to-r from-red-50 via-amber-50 to-emerald-50 p-3 shadow-inner">
                <div className="absolute left-4 top-3 rounded-full bg-red-700 px-2 py-1 text-[10px] font-black text-white">
                  Ô {ludoEventPopup.tileIndex}
                </div>
                <div className="absolute bottom-3 left-4 rounded-full bg-emerald-700 px-2 py-1 text-[10px] font-black text-white">
                  Ô 0
                </div>
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-6">
                  <StudentAvatar student={ludoEventPopup.actor} className="h-14 w-14 rounded-2xl border-2 border-amber-500 shadow-lg" />
                  <span className="text-3xl font-black text-red-700">➜</span>
                  <motion.div
                    initial={{ x: 0, y: 0, rotate: 0, scale: 1 }}
                    animate={{ x: -110, y: 18, rotate: -18, scale: 0.78 }}
                    transition={{ type: 'spring', stiffness: 170, damping: 12 }}
                    className="relative"
                  >
                    <StudentAvatar student={ludoEventPopup.target} className="h-14 w-14 rounded-2xl border-2 border-red-500 shadow-xl" />
                    <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 text-xs font-black text-white shadow">Bị đá!</span>
                  </motion.div>
                </div>
              </div>
            )}

            {ludoEventPopup.type === 'challenge' && ludoEventPopup.challenge ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="ludo-challenge-actions">
                <button
                  onClick={() => resolveLudoChallenge(true)}
                  data-testid="ludo-challenge-done"
                  className="min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl text-sm shadow-lg transition-all border-2 border-emerald-400"
                >
                  ✅ Làm được (+{ludoEventPopup.challenge.bonusRolls} lượt lắc)
                </button>
                <button
                  onClick={() => resolveLudoChallenge(false)}
                  data-testid="ludo-challenge-skip"
                  className="min-h-[52px] bg-stone-200 hover:bg-stone-300 text-stone-800 font-black py-3.5 rounded-2xl text-sm shadow transition-all border-2 border-stone-300"
                >
                  Chưa làm được
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLudoEventPopup(null)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3.5 rounded-2xl text-sm shadow-lg transition-all border-2 border-amber-400"
              >
                Đã Hiểu & Tiếp Tục 🎲
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
