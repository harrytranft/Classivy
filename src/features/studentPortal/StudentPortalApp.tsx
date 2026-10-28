import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../../components/ui';

// Cổng học sinh, phần tối thiểu của Phase 4: bắt đổi mật khẩu lần đầu (D15), rồi màn chờ.
// Hồ sơ, điểm, Pokémon của học sinh là Phase 5. Tài khoản học sinh KHÔNG bao giờ tải dữ liệu giáo viên (App.tsx chặn trước).

export const MIN_NEW_PASSWORD_LENGTH = 8;

/** Trả thông báo lỗi tiếng Việt, hoặc null nếu mật khẩu mới hợp lệ. */
export const validateNewPassword = (password: string, confirm: string): string | null => {
  if (password.length < MIN_NEW_PASSWORD_LENGTH) return `Mật khẩu mới cần ít nhất ${MIN_NEW_PASSWORD_LENGTH} ký tự.`;
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Mật khẩu mới cần có cả chữ và số.';
  if (password !== confirm) return 'Hai lần nhập mật khẩu chưa giống nhau.';
  return null;
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-screen items-center justify-center bg-brand-cream p-4 font-brand">
    <div className="w-full max-w-md rounded-brand-lg border border-[#e6e2d4] bg-white p-8 text-center shadow-[0_24px_60px_-18px_rgba(0,38,25,0.28)]">
      <img src="/brand/classivy-app-icon-dark.png" alt="Classivy" className="mx-auto h-16 w-16 rounded-brand-lg" />
      {children}
    </div>
  </div>
);

const ChangePasswordForm: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateNewPassword(password, confirm);
    if (problem) { setError(problem); return; }
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setBusy(false);
      setError(updateError.message.toLowerCase().includes('different') ? 'Mật khẩu mới phải khác mật khẩu trên thẻ.' : 'Không đổi được mật khẩu, hãy thử lại.');
      return;
    }
    const { error: rpcError } = await supabase.rpc('complete_first_login');
    setBusy(false);
    if (rpcError) { setError('Đã đổi mật khẩu nhưng chưa lưu được trạng thái. Hãy bấm lại nút bên dưới.'); return; }
    onDone();
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 text-left">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-brand-ink">Đặt mật khẩu mới</h1>
        <p className="mt-1 text-sm text-brand-ink/70">Đây là lần đăng nhập đầu tiên. Hãy tự đặt mật khẩu của riêng em (ít nhất {MIN_NEW_PASSWORD_LENGTH} ký tự, có chữ và số).</p>
      </div>
      {error && <div role="alert" className="rounded-brand-md border border-brand-danger/30 bg-[#fff4f2] p-3 text-sm font-semibold text-brand-danger">{error}</div>}
      <label className="block text-sm font-bold text-brand-ink">
        Mật khẩu mới
        <input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}
          className="mt-1 h-11 w-full rounded-brand-md border border-[#d9d6ca] px-3 text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/25" />
      </label>
      <label className="block text-sm font-bold text-brand-ink">
        Nhập lại mật khẩu mới
        <input type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)}
          className="mt-1 h-11 w-full rounded-brand-md border border-[#d9d6ca] px-3 text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/25" />
      </label>
      <Button type="submit" className="w-full" size="lg" loading={busy}>Lưu mật khẩu mới</Button>
    </form>
  );
};

export const StudentPortalApp: React.FC = () => {
  const { profile, logout } = useAuth();
  const [state, setState] = useState<'loading' | 'must-change' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('student_first_login_pending').then(({ data, error }) => {
      if (cancelled) return;
      if (error) setState('error');
      else setState(data === true ? 'must-change' : 'ready');
    });
    return () => { cancelled = true; };
  }, []);

  if (state === 'loading') return <Shell><p className="mt-6 text-sm font-semibold text-brand-ink/60">Đang tải...</p></Shell>;

  if (state === 'must-change') return <Shell><ChangePasswordForm onDone={() => setState('ready')} /></Shell>;

  return (
    <Shell>
      <h1 className="mt-4 text-2xl font-extrabold text-brand-ink">{state === 'error' ? 'Chưa kiểm tra được tài khoản' : `Xin chào ${profile?.displayName ?? ''}!`}</h1>
      <p className="mt-2 text-sm leading-relaxed text-brand-ink/70">
        {state === 'error'
          ? 'Có lỗi kết nối. Hãy tải lại trang hoặc hỏi giáo viên của em.'
          : 'Tài khoản của em đã sẵn sàng. Hồ sơ, điểm Hào Quang và Pokémon của em sẽ xuất hiện ở đây trong bản cập nhật tới.'}
      </p>
      <Button variant="secondary" className="mt-6" onClick={() => { logout().catch(() => undefined); }}>Đăng xuất</Button>
    </Shell>
  );
};
