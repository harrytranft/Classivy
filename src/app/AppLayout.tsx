import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { StatusDock } from '../components/StatusDock';
import { PokemonReactionLayer } from '../features/pokemon/PokemonReactionLayer';
import { AttendanceModal } from '../features/attendance/AttendanceModal';
import { HomeworkModal } from '../features/homework/HomeworkModal';
import { ShopReviewModal } from '../features/shop/ShopReviewModal';
import { LevelUpModal } from '../features/pokemon/LevelUpModal';
import { NavDock } from './NavDock';
import { TimerModal } from '../features/tools/TimerModal';
import { GroupModal } from '../features/tools/GroupModal';
import { LoginScreen } from '../features/auth/LoginScreen';
import { ClaimAllRewardsModal } from '../features/class/ClaimAllRewardsModal';
import { LudoEventPopup } from '../features/ludo/LudoEventPopup';
import { HatchModal } from '../features/pokemon/HatchModal';
import { PokemonReleaseModal } from '../features/pokemon/PokemonReleaseModal';
import { SkillPointsModal } from '../features/feedback/SkillPointsModal';
import { UserModal } from '../features/auth/UserModal';
import { ShopModal } from '../features/shop/ShopModal';
import { RandomModal } from '../features/random/RandomModal';
import { useApp } from './AppContext';

export const AppLayout: React.FC = () => {
  const {
    authLoading, handleBackupToCloud, handleRestoreFromCloud,
    isSyncing, lastSyncedTime, user
  } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#5d4037] flex flex-col items-center justify-center text-white font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37] mb-4"></div>
        <p className="font-royal uppercase tracking-widest text-xs text-[#D4AF37]">Đang kết nối Trainer Hub...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen />
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,#fffbf2_0%,#f5ebe0_100%)] pb-32">
      <PokemonReactionLayer />

      <LevelUpModal />

      {/* LEFT NAV DOCK */}
      <NavDock />

      <StatusDock
        user={user}
        isSyncing={isSyncing}
        lastSyncedTime={lastSyncedTime}
        onBackup={handleBackupToCloud}
        onRestore={handleRestoreFromCloud}
      />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-6">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>

      {/* MODAL: SKILL POINT BOARD */}
      <SkillPointsModal />

      {/* MODAL: RANDOM */}
      <RandomModal />

      {/* MODAL: GROUP MAKER */}
      <GroupModal />

      {/* MODAL: TIMER */}
      <TimerModal />

      {/* MODAL: LUDO EVENT ACTION POPUP */}
      <LudoEventPopup />

      {/* MODAL: CHÚC MỪNG POKEMON NỞ */}
      <HatchModal />

      <ClaimAllRewardsModal />

      <AttendanceModal />

      <ShopModal />

      <ShopReviewModal />

      <HomeworkModal />

      {/* MODAL: POKEMON RELEASED WHEN HP REACHES 0 */}
      <PokemonReleaseModal />

      {/* MODAL: USER PROFILE / AUTH / LOGOUT */}
      <UserModal />
    </div>
  );
};
