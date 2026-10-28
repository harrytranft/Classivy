import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GameDataProvider } from './providers/GameDataProvider';
import { UiEventsProvider } from './providers/UiEventsProvider';
import { AppProvider } from './AppContext';
import { AppRoutes } from './AppRoutes';
import { useAuth } from '../features/auth/AuthContext';
import { StudentPortalApp } from '../features/studentPortal/StudentPortalApp';
import { AuthSplashGate } from './SplashScreen';

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
  const { user, loading } = useAuth();
  const isStudent = user?.role === 'student';
  // Học sinh: giữ trang loading cho tới khi hồ sơ tải xong (cùng một trang loading như giáo viên, không nháy hai lần).
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => { if (!isStudent) setPortalReady(false); }, [isStudent, user?.uid]);
  const handlePortalReady = useCallback((ready: boolean) => setPortalReady(ready), []);
  return (
    <AuthSplashGate loading={loading || (isStudent && !portalReady)}>
      {isStudent ? <StudentPortalApp onReadyChange={handlePortalReady} /> : <TeacherApp />}
    </AuthSplashGate>
  );
};

export default App;
