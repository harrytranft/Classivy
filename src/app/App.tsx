import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GameDataProvider } from './providers/GameDataProvider';
import { UiEventsProvider } from './providers/UiEventsProvider';
import { AppProvider } from './AppContext';
import { AppRoutes } from './AppRoutes';

// Khung ứng dụng giáo viên: router -> dữ liệu -> sự kiện giao diện -> state/hành động -> các màn hình.
const App: React.FC = () => (
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

export default App;
