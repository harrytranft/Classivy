import React from 'react';
import { BookOpen, Gift, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SCREEN_PATHS } from './screenRoutes';
import { Screen } from '../types/app';
import { useApp } from './AppContext';
import { StatusDock } from '../components/StatusDock';
import { cx } from '../components/ui';

const NAV_ITEMS = [
  { id: 'class', screen: 'class' as Screen, Icon: BookOpen, label: 'Lớp Học' },
  { id: 'giftPokemon', Icon: Gift, label: 'Tặng Pokémon' },
  { id: 'settings', screen: 'settings' as Screen, Icon: Settings, label: 'Cài Đặt' }
];

// Thanh điều hướng trái luôn hiện (trước đây ẩn ngoài mép, phải rê chuột mới thấy): đọc được từ cuối lớp trên màn chiếu.
export const NavDock: React.FC = () => {
  const {
    currentScreen, handleBackupToCloud, handleRestoreFromCloud, isSyncing, lastSyncedTime,
    openGiftPokemonModal, profile, setCurrentScreen, setShowUserModal, user
  } = useApp();
  const navigate = useNavigate();
  return (
    <div className="group/nav fixed inset-y-0 left-0 z-50 flex w-[84px] flex-col items-center rounded-r-[28px] bg-brand-shield py-4 text-brand-cream shadow-[4px_0_18px_-6px_rgba(1,72,47,0.45)]">
      <img src="/brand/classivy-app-icon-dark.png" alt="Classivy" className="mb-5 h-14 w-14 rounded-brand-md" />
      <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col items-center gap-1.5">
        {NAV_ITEMS.map(({ id, screen, Icon, label }) => {
          const active = !!screen && currentScreen === screen;
          return (
            <button
              key={id}
              type="button"
              // "Lớp Học" luôn về trang chọn lớp (kể cả khi đang trong một lớp).
              onClick={() => id === 'class' ? navigate(SCREEN_PATHS.class) : screen ? setCurrentScreen(screen) : openGiftPokemonModal()}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'group/item relative grid h-12 w-12 place-items-center rounded-brand-md transition-colors',
                active ? 'bg-brand-cream text-brand-forest-deep' : 'text-brand-cream hover:bg-white/15'
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-brand-sm bg-brand-forest-deep px-3 py-1.5 text-[13px] font-bold text-brand-cream opacity-0 shadow-lg transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100">{label}</span>
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
