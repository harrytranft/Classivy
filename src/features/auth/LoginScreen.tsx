import React from 'react';
import { AuthLoginForm } from './AuthLoginForm';

export const LoginScreen: React.FC = () => (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream p-4 font-brand sm:p-8">
      <div className="w-full max-w-lg overflow-hidden rounded-brand-lg border border-[#e6e2d4] bg-white p-8 text-center shadow-[0_24px_60px_-18px_rgba(0,38,25,0.28)] sm:p-12">
        <h1 className="sr-only">Đăng nhập Classivy</h1>
        <img src="/brand/classivy-logo-horizontal.png" alt="Classivy" className="mx-auto mb-8 h-auto w-full max-w-[300px]" />

        <div className="w-full">
          <AuthLoginForm />
        </div>

      </div>
    </div>
);
