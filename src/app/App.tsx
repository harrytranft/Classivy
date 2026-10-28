import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GameDataProvider } from './providers/GameDataProvider';
import { UiEventsProvider } from './providers/UiEventsProvider';
import { AppProvider } from './AppContext';
import { AppRoutes } from './AppRoutes';
import { useAuth } from '../features/auth/AuthContext';
import { StudentPortalApp } from '../features/studentPortal/StudentPortalApp';

// Khung ứng dụng giáo viên: router -> dữ liệu -> sự kiện giao diện -> state/hành động -> các màn hình.
const TeacherApp: React.FC = () => (
  <BrowserRouter>
    <GameDataProvider>
      <UiEventsProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </UiEventsProvider>
    </GameDataProvider>
  </BrowserRouter>
);

// Tài khoản học sinh (Phase 4) vào cổng học sinh và KHÔNG bao giờ mount GameDataProvider (không tải/ghi dữ liệu giáo viên).
const App: React.FC = () => {
  const { user } = useAuth();
  return user?.role === 'student' ? <StudentPortalApp /> : <TeacherApp />;
};

export default App;
