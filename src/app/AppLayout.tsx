import React, { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
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
import { DataUpgradeModal } from '../features/dataUpgrade/DataUpgradeModal';
import { SyncConflictBanner } from './SyncConflictBanner';
import { useApp } from './AppContext';
import { useGlobalShortcuts } from './useGlobalShortcuts';
import { ShortcutHelpModal } from '../features/settings/ShortcutHelpModal';

export const AppLayout: React.FC = () => {
  const { authLoading, user } = useApp();
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  useGlobalShortcuts(() => setShowShortcutHelp(open => !open));

  // Trang loading toàn trang do AuthSplashGate (App.tsx) vẽ phủ lên trên.
  if (authLoading) return null;

  if (!user) {
    return (
      <LoginScreen />
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream pb-36 pl-[84px]">
      <PokemonReactionLayer />

      <LevelUpModal />

      {/* LEFT NAV DOCK */}
      <NavDock />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-6">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>

      {/* Phase 7: lần lưu bị từ chối vì máy khác vừa sửa */}
      <SyncConflictBanner />

      {/* MODAL: NÂNG CẤP CÁCH LƯU DỮ LIỆU (Phase 3) */}
      <DataUpgradeModal />

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

      {/* Bảng phím tắt (phím ?) */}
      {showShortcutHelp && <ShortcutHelpModal onClose={() => setShowShortcutHelp(false)} />}
    </div>
  );
};
