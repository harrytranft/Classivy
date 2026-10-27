import { ClassActions, createClassActions } from '../../features/class/classActions';
import { PointsActions, createPointsActions } from '../../features/students/pointsActions';
import { AttendanceActions, createAttendanceActions } from '../../features/attendance/attendanceActions';
import { HomeworkActions, createHomeworkActions } from '../../features/homework/homeworkActions';
import { ShopActions, createShopActions } from '../../features/shop/shopActions';
import { PokemonActions, createPokemonActions } from '../../features/pokemon/pokemonActions';
import { GiftPokemonActions, createGiftPokemonActions } from '../../features/pokemon/giftPokemonActions';
import { RandomActions, createRandomActions } from '../../features/random/randomActions';
import { BattleActions, createBattleActions } from '../../features/random/battleActions';
import { BossActions, createBossActions } from '../../features/random/bossActions';
import { LudoActions, createLudoActions } from '../../features/ludo/ludoActions';
import { LuckyWheelActions, createLuckyWheelActions } from '../../features/wheel/luckyWheelActions';
import { SettingsActions, createSettingsActions } from '../../features/settings/settingsActions';
import { ToolsActions, createToolsActions } from '../../features/tools/toolsActions';
import type { AppState } from './appState';

// Mọi hành động nghiệp vụ của ứng dụng giáo viên. Mỗi nhóm nằm trong thư mục tính năng của nó.
// Các nhóm gọi nhau qua tham số `app` (ví dụ Cá Ngựa gọi app.handleRandom), được nối ở đây sau khi tạo xong.
export type AppActions = ClassActions
  & PointsActions
  & AttendanceActions
  & HomeworkActions
  & ShopActions
  & PokemonActions
  & GiftPokemonActions
  & RandomActions
  & BattleActions
  & BossActions
  & LudoActions
  & LuckyWheelActions
  & SettingsActions
  & ToolsActions;

export const createAppActions = (state: AppState): AppActions => {
  const actions = {} as AppActions;
  Object.assign(
    actions,
    createClassActions(state, actions),
    createPointsActions(state, actions),
    createAttendanceActions(state, actions),
    createHomeworkActions(state, actions),
    createShopActions(state, actions),
    createPokemonActions(state, actions),
    createGiftPokemonActions(state, actions),
    createRandomActions(state, actions),
    createBattleActions(state, actions),
    createBossActions(state, actions),
    createLudoActions(state, actions),
    createLuckyWheelActions(state, actions),
    createSettingsActions(state, actions),
    createToolsActions(state, actions)
  );
  return actions;
};
