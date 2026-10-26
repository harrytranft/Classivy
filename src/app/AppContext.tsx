import React, { createContext, useContext } from 'react';
import { useAppState, type AppState } from './controller/appState';
import { createAppActions, type AppActions } from './controller/appActions';
import { useProfileRouteSync } from './useProfileRouteSync';
import { useUserModalEffects } from '../features/auth/useUserModalEffects';
import { useGiftPokemonEffects } from '../features/pokemon/useGiftPokemonEffects';
import { useLudoEffects } from '../features/ludo/useLudoEffects';
import { useBossEffects } from '../features/random/useBossEffects';
import { useWeatherEffects } from '../features/tools/useWeatherEffects';

export type AppScope = AppState & AppActions;

const AppContext = createContext<AppScope | null>(null);

// Ghép state + hành động mỗi lần render (giống App.tsx cũ), rồi chạy các effect của từng tính năng.
const useAppScope = (): AppScope => {
  const state = useAppState();
  const actions = createAppActions(state);
  const app: AppScope = { ...state, ...actions };
  useUserModalEffects(app);
  useGiftPokemonEffects(app);
  useLudoEffects(app);
  useBossEffects(app);
  useWeatherEffects(app);
  useProfileRouteSync(app);
  return app;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const app = useAppScope();
  return <AppContext.Provider value={app}>{children}</AppContext.Provider>;
};

export const useApp = (): AppScope => {
  const app = useContext(AppContext);
  if (!app) throw new Error('useApp must be used inside AppProvider');
  return app;
};
