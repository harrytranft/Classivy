import React from 'react';
import { AuthLoginForm } from './AuthLoginForm';

export const LoginScreen: React.FC = () => (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream p-4 font-brand sm:p-8">
      <div className="w-full max-w-lg overflow-hidden rounded-brand-lg border border-[#e6e2d4] bg-white p-8 text-center shadow-[0_24px_60px_-18px_rgba(0,38,25,0.28)] sm:p-12">
        <img src="/brand/classivy-app-icon-dark.png" alt="Classivy" className="mx-auto h-20 w-20 rounded-brand-lg shadow-[0_8px_24px_-8px_rgba(0,38,25,0.45)]" />

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-brand-ink">Chào mừng đến Classivy</h1>
          <p className="text-sm font-semibold text-brand-forest">Không gian lớp học đầy hứng khởi</p>
        </div>

        <div className="my-6 h-px w-full bg-[#e6e2d4]" />

        <p className="mx-auto max-w-sm text-sm leading-relaxed text-brand-ink/70">
          Đăng nhập để quản lý trainer, đồng bộ dữ liệu lớp học,
          theo dõi Pokémon đồng hành và tổ chức các hoạt động học tập.
        </p>

        <div className="pt-2 w-full">
          <AuthLoginForm />
        </div>

      </div>
    </div>
);
