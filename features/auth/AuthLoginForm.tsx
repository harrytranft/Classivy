import React, { useState } from 'react';
import { useAuth } from '../../AuthContext';

export const AuthLoginForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { loginWithEmail, signUpWithEmail } = useAuth();
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ Email và Mật khẩu.");
      return;
    }

    if (authTab === 'register' && !displayName.trim()) {
      setErrorMsg("Vui lòng nhập tên giáo viên.");
      return;
    }

    setSubmitting(true);
    try {
      if (authTab === 'login') {
        await loginWithEmail(email.trim(), password);
      } else {
        const result = await signUpWithEmail(email.trim(), password, displayName.trim());
        if (result.needsEmailConfirmation) {
          setAuthTab('login');
          setErrorMsg("Tài khoản đã được tạo. Vui lòng mở email xác nhận từ Supabase rồi quay lại đăng nhập.");
          return;
        }
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full font-sans space-y-4">
      {/* Tabs */}
      <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
        <button
          type="button"
          onClick={() => { setAuthTab('login'); setErrorMsg(null); }}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
            authTab === 'login'
              ? 'bg-red-800 text-white shadow-md'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          🔑 Đăng Nhập
        </button>
        <button
          type="button"
          onClick={() => { setAuthTab('register'); setErrorMsg(null); }}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
            authTab === 'register'
              ? 'bg-red-800 text-white shadow-md'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          📜 Tạo Tài Khoản
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
        {authTab === 'register' && (
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
              Tên giáo viên
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Ví dụ: Thầy/Cô Nguyễn"
              className="w-full border border-stone-300 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-red-800/30"
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
            Địa chỉ Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="syphu@trieudinh.vn"
            className="w-full border border-stone-300 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-red-800/30"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
            Mật khẩu
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-stone-300 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-red-800/30"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white font-extrabold py-3.5 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-xs uppercase tracking-wider border-b-4 border-red-950 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang Xử Lý...</span>
            </>
          ) : authTab === 'login' ? (
            <span>Đăng nhập</span>
          ) : (
            <span>✨ Tạo Tài Khoản Mới</span>
          )}
        </button>
      </form>
    </div>
  );
};
