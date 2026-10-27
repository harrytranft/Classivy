import React from 'react';
import { AuthLoginForm } from './AuthLoginForm';
import { useApp } from '../../app/AppContext';

export const LoginScreen: React.FC = () => {
  const {
    signInWithGoogle
  } = useApp();
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream p-4 font-brand sm:p-8">
      <div className="w-full max-w-lg overflow-hidden rounded-brand-lg border border-[#e6e2d4] bg-white p-8 text-center shadow-[0_24px_60px_-18px_rgba(0,38,25,0.28)] sm:p-12">
        <img src="/brand/classivy-app-icon-dark.png" alt="Classivy" className="mx-auto h-20 w-20 rounded-brand-lg shadow-[0_8px_24px_-8px_rgba(0,38,25,0.45)]" />

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-brand-ink">Chào mừng đến Classivy</h1>
          <p className="text-sm font-semibold text-brand-forest">Không gian lớp học đầy hứng khởi</p>
        </div>

        <div className="my-6 h-px w-full bg-[#e6e2d4]" />

        <p className="max-w-sm text-sm leading-relaxed text-brand-ink/70">
          Đăng nhập để quản lý trainer, đồng bộ dữ liệu lớp học,
          theo dõi Pokémon đồng hành và tổ chức các hoạt động học tập.
        </p>

        <div className="pt-2 w-full">
          <AuthLoginForm />
        </div>

        <div className="w-full border-t border-[#e6e2d4] pt-4">
          <button
            onClick={signInWithGoogle}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-brand-md border border-brand-forest/20 px-4 text-sm font-bold text-brand-forest transition-colors hover:bg-brand-cream"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.177-2.767-6.177-6.177S10.58 6.16 13.99 6.16c1.55 0 2.96.57 4.05 1.51l3.07-3.07C19.22 2.82 16.78 1.8 13.99 1.8 8.16 1.8 3.42 6.54 3.42 12.37s4.74 10.57 10.57 10.57c6.14 0 10.23-4.31 10.23-10.4 0-.7-.08-1.2-.18-1.57H12.24z" />
            </svg>
            Đăng nhập bằng Google (Dự phòng)
          </button>
        </div>

        <div className="space-y-3 pt-6">
          <p className="mx-auto max-w-xs text-xs leading-normal text-brand-ink/60">
            Lưu ý: nếu đăng nhập bị chặn trong iFrame, hãy mở ứng dụng ở một tab mới rồi thử lại.
          </p>
        </div>
      </div>
    </div>
  );
};
