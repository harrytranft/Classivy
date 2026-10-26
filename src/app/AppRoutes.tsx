import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { SCREEN_PATHS } from './screenRoutes';
import { useApp } from './AppContext';
import { PlazaScreen } from '../features/plaza/PlazaScreen';
import { ClassScreen } from '../features/class/ClassScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';

// Giữ nguyên ?query và #hash khi chuyển hướng: Supabase đọc mã đăng nhập (Google, xác nhận email) từ URL.
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
      <Route path="plaza" element={<PlazaScreen />} />
      <Route path="class" element={<ClassScreen />} />
      <Route path="student/:studentId" element={<ProfileRoute />} />
      <Route path="settings" element={<SettingsScreen />} />
      <Route path="*" element={<RedirectToClass />} />
    </Route>
  </Routes>
);
