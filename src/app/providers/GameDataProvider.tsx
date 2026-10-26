import React, { createContext, useContext } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { useGameDataState } from './gameData/useGameDataState';
import { useCloudSync } from './gameData/useCloudSync';
import { useLocalPersistence } from './gameData/useLocalPersistence';
import { createBackupActions } from './gameData/backupActions';

// Dữ liệu lớp học dùng chung (học sinh, cấp bậc, kỹ năng, cài đặt) + lưu localStorage + đồng bộ Supabase + sao lưu/khôi phục.
// Phase 3 sẽ thay phần đồng bộ (một snapshot JSON mỗi giáo viên) bằng bảng dữ liệu riêng.
const useGameDataValue = () => {
  const { user, loading: authLoading } = useAuth();
  const data = useGameDataState();
  useCloudSync(data, user, authLoading);
  useLocalPersistence(data, user, authLoading);
  return { ...data, ...createBackupActions(data, user) };
};

export type GameDataValue = ReturnType<typeof useGameDataValue>;

const GameDataContext = createContext<GameDataValue | null>(null);

export const GameDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useGameDataValue();
  return <GameDataContext.Provider value={value}>{children}</GameDataContext.Provider>;
};

export const useGameData = (): GameDataValue => {
  const value = useContext(GameDataContext);
  if (!value) throw new Error('useGameData must be used inside GameDataProvider');
  return value;
};
