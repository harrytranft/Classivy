import React from 'react';
import { AuthLoginForm } from './AuthLoginForm';
import { useApp } from '../../app/AppContext';

export const LoginScreen: React.FC = () => {
  const {
    signInWithGoogle
  } = useApp();
  return (
    <div className="min-h-screen bg-[#FDF3E7] flex items-center justify-center p-4 sm:p-8 font-sans bg-[radial-gradient(#e0d0b0_1px,transparent_1px)] [background-size:16px_16px]">
      {/* Decorative Golden Corner Frames */}
      <div className="fixed top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-red-800 opacity-60 rounded-tl-xl pointer-events-none" />
      <div className="fixed top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-red-800 opacity-60 rounded-tr-xl pointer-events-none" />
      <div className="fixed bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-red-800 opacity-60 rounded-bl-xl pointer-events-none" />
      <div className="fixed bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-red-800 opacity-60 rounded-br-xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-[40px] border-8 border-red-800 shadow-2xl p-8 sm:p-12 text-center relative overflow-hidden flex flex-col items-center space-y-6">
        {/* Trainer Hub Icon */}
        <div className="w-24 h-24 bg-red-800 rounded-full flex items-center justify-center text-5xl shadow-lg border-4 border-amber-400 select-none animate-bounce duration-1000">
          ◉
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-royal text-red-800 font-extrabold uppercase tracking-tight">Pokemon Trainer Hub</h1>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">Classroom Adventure System</p>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent my-6" />

        <p className="text-sm font-sans text-stone-600 leading-relaxed max-w-sm">
          Đăng nhập để quản lý trainer, đồng bộ dữ liệu lớp học,
          theo dõi Pokémon đồng hành và tổ chức các hoạt động học tập.
        </p>

        <div className="pt-2 w-full">
          <AuthLoginForm />
        </div>

        <div className="pt-2 w-full border-t border-stone-200">
          <button
            onClick={signInWithGoogle}
            className="w-full text-stone-500 hover:text-stone-800 text-xs font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-stone-200 hover:bg-stone-50"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.177-2.767-6.177-6.177S10.58 6.16 13.99 6.16c1.55 0 2.96.57 4.05 1.51l3.07-3.07C19.22 2.82 16.78 1.8 13.99 1.8 8.16 1.8 3.42 6.54 3.42 12.37s4.74 10.57 10.57 10.57c6.14 0 10.23-4.31 10.23-10.4 0-.7-.08-1.2-.18-1.57H12.24z" />
            </svg>
            Đăng nhập bằng Google (Dự phòng)
          </button>
        </div>

        <div className="pt-6 space-y-3">
          <p className="text-[10px] text-stone-400 font-mono italic max-w-xs leading-normal">
            💡 Lưu ý: Nếu nút đăng nhập bị chặn hoặc không phản hồi do cơ chế bảo mật sandbox iFrame, vui lòng bấm nút <strong>"Open in new tab"</strong> ở góc phải phía trên của thanh công cụ AI Studio.
          </p>
        </div>
      </div>
    </div>
  );
};
