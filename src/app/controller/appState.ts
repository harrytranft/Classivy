import { useAuth } from '../../features/auth/AuthContext';
import { useGameData } from '../providers/GameDataProvider';
import { useUiEvents } from '../providers/UiEventsProvider';
import { useClassState } from '../../features/class/useClassState';
import { useFeedbackState } from '../../features/feedback/useFeedbackState';
import { useProfileState } from '../../features/profile/useProfileState';
import { useRandomState } from '../../features/random/useRandomState';
import { useAttendanceState } from '../../features/attendance/useAttendanceState';
import { useHomeworkState } from '../../features/homework/useHomeworkState';
import { useShopState } from '../../features/shop/useShopState';
import { useLuckyWheelState } from '../../features/wheel/useLuckyWheelState';
import { useLudoState } from '../../features/ludo/useLudoState';
import { useHuntState } from '../../features/hunt/useHuntState';
import { useSettingsState } from '../../features/settings/useSettingsState';
import { useToolsState } from '../../features/tools/useToolsState';
import { useGiftPokemonState } from '../../features/pokemon/useGiftPokemonState';
import { useUserModalState } from '../../features/auth/useUserModalState';
import { useDerivedState } from './useDerivedState';
import { useScreenRoute } from '../useScreenRoute';
import { useClassRoute } from '../useClassRoute';

// Toàn bộ state của ứng dụng giáo viên, gom từ các provider và state của từng tính năng.
// Hành động (actions) đọc state qua object này; giao diện đọc qua useApp().
export const useBaseState = () => {
  const profileState = useProfileState();
  const classRoute = useClassRoute();
  const screenRoute = useScreenRoute(profileState.editingStudent, profileState.setEditingStudent, classRoute.filterClass);
  const { user, profile, loginWithEmail, signUpWithEmail, signInWithGoogle, logout, updateUserProfile, loading: authLoading } = useAuth();
  return {
    user, profile, loginWithEmail, signUpWithEmail, signInWithGoogle, logout, updateUserProfile, authLoading,
    ...useGameData(),
    ...useUiEvents(),
    ...useClassState(),
    ...useFeedbackState(),
    ...profileState,
    ...screenRoute,
    ...classRoute,
    ...useRandomState(),
    ...useAttendanceState(),
    ...useHomeworkState(),
    ...useShopState(),
    ...useLuckyWheelState(),
    ...useLudoState(),
    ...useHuntState(),
    ...useSettingsState(),
    ...useToolsState(),
    ...useGiftPokemonState(),
    ...useUserModalState(),
  };
};

export type BaseState = ReturnType<typeof useBaseState>;

export const useAppState = () => {
  const base = useBaseState();
  return { ...base, ...useDerivedState(base) };
};

export type AppState = ReturnType<typeof useAppState>;
