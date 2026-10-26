import React from 'react';
import { Screen } from '../types/app';
import { useApp } from './AppContext';

export const NavDock: React.FC = () => {
  const {
    currentScreen, openGiftPokemonModal, profile, setCurrentScreen, setShowUserModal
  } = useApp();
  return (
    <div className="fixed left-0 top-1/2 z-50 h-40 w-5 -translate-y-1/2 group/nav">
      <nav
        className="absolute left-0 top-1/2 flex -translate-y-1/2 -translate-x-[calc(100%-18px)] flex-col items-center gap-3 rounded-r-[28px] border-2 border-white/90 bg-red-950/80 px-3 py-4 shadow-[0_25px_60px_-10px_rgba(120,20,20,0.3)] backdrop-blur-2xl transition-transform duration-300 ease-out group-hover/nav:translate-x-0 focus-within:translate-x-0"
        style={{
          boxShadow: '0 20px 50px -10px rgba(120,20,20,0.28), 0 0 35px rgba(212,175,55,0.22), inset 0 2px 3px 0 rgba(255,255,255,0.35)'
        }}
      >
        {[
          { id: 'plaza', screen: 'plaza' as Screen, icon: '🏞️', label: 'Trainer Plaza' },
          { id: 'class', screen: 'class' as Screen, icon: '📚', label: 'Lớp Học' },
          { id: 'giftPokemon', icon: '🎁', label: 'Tặng Pokémon' },
          { id: 'settings', screen: 'settings' as Screen, icon: '⚙️', label: 'Cài Đặt' }
        ].map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => item.screen ? setCurrentScreen(item.screen) : openGiftPokemonModal()}
            title={item.label}
            className={`grid h-14 w-14 place-items-center rounded-2xl border text-2xl shadow-lg transition-all active:scale-95 ${
              item.screen && currentScreen === item.screen
                ? 'border-amber-200 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-red-950 ring-4 ring-amber-200/35'
                : item.id === 'giftPokemon'
                  ? 'border-white/50 bg-gradient-to-br from-emerald-300 via-amber-300 to-fuchsia-400 text-white hover:scale-110 hover:shadow-[0_0_28px_rgba(251,191,36,0.45)]'
                : 'border-white/30 bg-white/12 text-amber-100 hover:scale-110 hover:bg-white/20'
            }`}
          >
            {item.icon}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowUserModal(true)}
          title="Tài khoản giáo viên"
          className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-300 to-amber-600 shadow-lg transition-all hover:scale-110 active:scale-95"
        >
          <img
            src={profile?.photoURL || 'https://api.dicebear.com/7.x/bottts/svg'}
            className="h-10 w-10 rounded-xl border border-white/80 object-cover"
            alt="Avatar"
            referrerPolicy="no-referrer"
          />
        </button>
      </nav>
    </div>
  );
};
