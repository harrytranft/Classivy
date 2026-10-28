import React, { lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { CLASS_SUB_PAGES, SCREEN_PATHS } from './screenRoutes';
import { useApp } from './AppContext';
import { ClassScreen } from '../features/class/ClassScreen';
import { ClassPickerScreen } from '../features/class/ClassPickerScreen';
import { ClassPageGuard } from '../features/class/ClassPageGuard';

// Màn Lớp học (mở mặc định) tải ngay; các màn khác tải khi mở lần đầu.
const ProfileScreen = lazy(() => import('../features/profile/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const LudoModal = lazy(() => import('../features/ludo/LudoModal').then(m => ({ default: m.LudoModal })));
const LuckyWheelModal = lazy(() => import('../features/wheel/LuckyWheelModal').then(m => ({ default: m.LuckyWheelModal })));
const GiftPokemonModal = lazy(() => import('../features/pokemon/GiftPokemonModal').then(m => ({ default: m.GiftPokemonModal })));
const StudentAccountsScreen = lazy(() => import('../features/accounts/StudentAccountsScreen').then(m => ({ default: m.StudentAccountsScreen })));
const SettingsScreen = lazy(() => import('../features/settings/SettingsScreen').then(m => ({ default: m.SettingsScreen })));

// '/' và đường dẫn lạ về trang chọn lớp. Giữ nguyên ?query và #hash khi chuyển hướng: Supabase đọc mã đăng nhập (Google, xác nhận email) từ URL.
const RedirectToClass: React.FC = () => {
  const location = useLocation();
  return <Navigate to={{ pathname: SCREEN_PATHS.class, search: location.search, hash: location.hash }} replace />;
};

// Hồ sơ chỉ hiện khi đã có học sinh đang mở (giống điều kiện cũ currentScreen === 'profile' && editingStudent).
const ProfileRoute: React.FC = () => {
  const { editingStudent } = useApp();
  return editingStudent ? <ProfileScreen /> : null;
};

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<RedirectToClass />} />
      <Route path="class" element={<ClassPickerScreen />} />
      <Route path="class/:className" element={<ClassPageGuard><ClassScreen /></ClassPageGuard>} />
      <Route path={`class/:className/${CLASS_SUB_PAGES.ludo}`} element={<ClassPageGuard><LudoModal /></ClassPageGuard>} />
      <Route path={`class/:className/${CLASS_SUB_PAGES.wheel}`} element={<ClassPageGuard><LuckyWheelModal /></ClassPageGuard>} />
      <Route path={`class/:className/${CLASS_SUB_PAGES.gift}`} element={<ClassPageGuard><GiftPokemonModal /></ClassPageGuard>} />
      <Route path={`class/:className/${CLASS_SUB_PAGES.accounts}`} element={<ClassPageGuard><StudentAccountsScreen /></ClassPageGuard>} />
      <Route path="student/:studentId" element={<ProfileRoute />} />
      <Route path="settings" element={<SettingsScreen />} />
      <Route path="*" element={<RedirectToClass />} />
    </Route>
  </Routes>
);
