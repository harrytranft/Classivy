import React from 'react';
import { BookOpen, Gift, Settings, Trees } from 'lucide-react';
import { Screen } from '../types/app';
import { useApp } from './AppContext';
import { StatusDock } from '../components/StatusDock';
import { cx } from '../components/ui';

const NAV_ITEMS = [
  { id: 'plaza', screen: 'plaza' as Screen, Icon: Trees, label: 'Trainer Plaza', short: 'Plaza' },
  { id: 'class', screen: 'class' as Screen, Icon: BookOpen, label: 'Lớp Học', short: 'Lớp học' },
  { id: 'giftPokemon', Icon: Gift, label: 'Tặng Pokémon', short: 'Tặng quà' },
  { id: 'settings', screen: 'settings' as Screen, Icon: Settings, label: 'Cài Đặt', short: 'Cài đặt' }
];

// Thanh điều hướng trái luôn hiện (trước đây ẩn ngoài mép, phải rê chuột mới thấy): đọc được từ cuối lớp trên màn chiếu.
export const NavDock: React.FC = () => {
  const {
    currentScreen, handleBackupToCloud, handleRestoreFromCloud, isSyncing, lastSyncedTime,
    openGiftPokemonModal, profile, setCurrentScreen, setShowUserModal, user
  } = useApp();
  return (
    <div className="group/nav fixed inset-y-0 left-0 z-50 flex w-[84px] flex-col items-center bg-brand-forest-deep py-4 text-brand-cream">
      <img src="/brand/classivy-app-icon-dark.png" alt="Classivy" className="mb-5 h-11 w-11 rounded-brand-md" />
      <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col items-center gap-1.5">
        {NAV_ITEMS.map(({ id, screen, Icon, label, short }) => {
          const active = !!screen && currentScreen === screen;
          return (
            <button
              key={id}
              type="button"
              onClick={() => screen ? setCurrentScreen(screen) : openGiftPokemonModal()}
              title={label}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex w-[68px] flex-col items-center gap-1 rounded-brand-md py-2 text-[12px] font-bold transition-colors',
                active ? 'bg-brand-cream text-brand-forest-deep' : 'text-brand-cream/80 hover:bg-white/10 hover:text-brand-cream',
                id === 'giftPokemon' && !active && 'text-brand-violet-soft hover:text-[#d79cf0]'
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
              <span>{short}</span>
            </button>
          );
        })}
        <div className="flex-1" />
        <StatusDock
          user={user}
          isSyncing={isSyncing}
          lastSyncedTime={lastSyncedTime}
          onBackup={handleBackupToCloud}
          onRestore={handleRestoreFromCloud}
        />
        <button
          type="button"
          onClick={() => setShowUserModal(true)}
          title="Tài khoản giáo viên"
          className="mt-3 grid h-12 w-12 place-items-center overflow-hidden rounded-full ring-2 ring-brand-gold/70 transition-shadow hover:ring-brand-gold"
        >
          <img
            src={profile?.photoURL || 'https://api.dicebear.com/7.x/bottts/svg'}
            className="h-full w-full bg-brand-cream object-cover"
            alt="Avatar"
            referrerPolicy="no-referrer"
          />
        </button>
      </nav>
    </div>
  );
};
