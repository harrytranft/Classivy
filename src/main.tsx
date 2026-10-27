
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { AuthProvider } from './features/auth/AuthContext';
import { LEGACY_STORAGE_KEYS, STORAGE_MIGRATION_MARKER_KEY } from './data/constants';
import { migrateLegacyStorageKeys } from './domain/storageMigration';

// Phải chạy trước khi render: state ban đầu của app đọc localStorage ngay ở lần render đầu.
try {
  migrateLegacyStorageKeys(window.localStorage, LEGACY_STORAGE_KEYS, STORAGE_MIGRATION_MARKER_KEY);
} catch {
  // Trình duyệt chặn localStorage: bỏ qua, app chạy như máy mới.
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

