import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { normalizeLoginInput } from '../../domain/studentAccount';

export const AuthLoginForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ tên đăng nhập (hoặc email) và mật khẩu.");
      return;
    }

    setSubmitting(true);
    try {
      // Có "@" là email giáo viên; không có là tên đăng nhập học sinh (đổi sang email nội bộ).
      await loginWithEmail(normalizeLoginInput(email), password);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-brand-md border border-brand-danger/30 bg-[#fff4f2] p-3 text-sm font-semibold text-brand-danger animate-in fade-in">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="mb-1 block text-sm font-bold text-brand-ink">
            Email hoặc tên đăng nhập
          </label>
          <input
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-brand-md border border-[#d9d6ca] p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-emerald/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-brand-ink">
            Mật khẩu
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-brand-md border border-[#d9d6ca] p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-emerald/30"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-brand-md bg-brand-forest py-3.5 text-sm font-extrabold text-brand-cream shadow-[0_2px_8px_-2px_rgba(0,38,25,0.45)] transition-colors hover:bg-brand-forest-deep disabled:opacity-50"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang Xử Lý...</span>
            </>
          ) : <span>Đăng nhập</span>}
        </button>
      </form>
    </div>
  );
};
