import path from 'path';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      build: {
        rollupOptions: {
          output: {
            // Thư viện ít thay đổi tách riêng để trình duyệt cache lâu và chunk chính nhỏ hơn.
            manualChunks: {
              react: ['react', 'react-dom', 'react-dom/client', 'react-router-dom'],
              supabase: ['@supabase/supabase-js'],
              motion: ['motion']
            }
          }
        }
      },
      test: {
        exclude: [...configDefaults.exclude, 'tests/smoke/**']
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
