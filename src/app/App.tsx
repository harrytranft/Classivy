import React from 'react';
import { GameDataProvider } from './providers/GameDataProvider';
import { UiEventsProvider } from './providers/UiEventsProvider';
import { AppProvider } from './AppContext';
import { AppLayout } from './AppLayout';

// Khung ứng dụng giáo viên: dữ liệu -> sự kiện giao diện -> state/hành động -> giao diện.
const App: React.FC = () => (
  <GameDataProvider>
    <UiEventsProvider>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </UiEventsProvider>
  </GameDataProvider>
);

export default App;
