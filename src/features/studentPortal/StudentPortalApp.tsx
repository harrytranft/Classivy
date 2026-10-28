import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../../components/ui';
import { StudentProfileScreen } from './StudentProfileScreen';
import { useStudentProfile } from './useStudentProfile';

// Cổng học sinh: bắt đổi mật khẩu lần đầu (D15, Phase 4), rồi hồ sơ chỉ xem của chính em (Phase 5, ADR 0003).
// Tài khoản học sinh KHÔNG bao giờ tải dữ liệu giáo viên (App.tsx chặn trước); hồ sơ chỉ đến từ get_my_student_profile().

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
      <img src="/brand/classivy-logo-horizontal.png" alt="Classivy" className="mx-auto h-auto w-full max-w-[240px]" />
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

// Màn thông báo khi không có hồ sơ để xem. Không nói thêm chi tiết nào về tài khoản (5.3).
const NOTICE: Record<'locked' | 'not_linked' | 'not_student' | 'error', { title: string; body: string }> = {
  locked: { title: 'Tài khoản đang tạm khoá', body: 'Em chưa xem được hồ sơ lúc này. Hãy hỏi thầy cô của em nhé.' },
  not_linked: { title: 'Chưa tìm thấy hồ sơ', body: 'Tài khoản này chưa được gắn với học sinh nào. Hãy hỏi thầy cô của em nhé.' },
  not_student: { title: 'Đây không phải tài khoản học sinh', body: 'Hãy đăng xuất và đăng nhập bằng tài khoản thầy cô cấp cho em.' },
  error: { title: 'Chưa tải được hồ sơ', body: 'Có lỗi kết nối. Hãy thử lại, hoặc hỏi thầy cô nếu vẫn lỗi.' }
};

const StudentHome: React.FC<{ onLogout: () => void; onLoaded: () => void }> = ({ onLogout, onLoaded }) => {
  const { state, refresh, refreshing } = useStudentProfile();
  const loaded = state.kind !== 'loading';
  useEffect(() => { if (loaded) onLoaded(); }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trang loading toàn trang do AuthSplashGate (app/App.tsx) vẽ, giống tài khoản giáo viên; ở đây chỉ chờ.
  if (!loaded) return null;

  if (state.kind === 'loaded' && state.result.status === 'active') {
    return <StudentProfileScreen profile={state.result.profile} refreshing={refreshing} onRefresh={refresh} onLogout={onLogout} />;
  }

  const notice = NOTICE[state.kind === 'error' ? 'error' : state.result.status as keyof typeof NOTICE];
  return (
    <Shell>
      <h1 className="mt-4 text-2xl font-extrabold text-brand-ink">{notice.title}</h1>
      <p className="mt-2 text-base leading-relaxed text-brand-ink/70">{notice.body}</p>
      <div className="mt-6 flex flex-col gap-2">
        {state.kind === 'error' && <Button size="lg" loading={refreshing} onClick={() => { refresh().catch(() => undefined); }}>Thử lại</Button>}
        <Button variant="secondary" size="lg" onClick={onLogout}>Đăng xuất</Button>
      </div>
    </Shell>
  );
};

/** `onReadyChange`: báo cho khung ứng dụng cổng học sinh đã tải xong (true) hay đang tải (false) để hiện/gỡ trang loading. */
export const StudentPortalApp: React.FC<{ onReadyChange?: (ready: boolean) => void }> = ({ onReadyChange }) => {
  const { logout } = useAuth();
  const [state, setState] = useState<'loading' | 'must-change' | 'ready' | 'error'>('loading');
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('student_first_login_pending').then(({ data, error }) => {
      if (cancelled) return;
      if (error) setState('error');
      else setState(data === true ? 'must-change' : 'ready');
    });
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => { logout().catch(() => undefined); };
  // Đổi mật khẩu lần đầu và màn lỗi sẵn sàng ngay; màn hồ sơ sẵn sàng khi StudentHome tải xong hồ sơ.
  const ready = state === 'must-change' || state === 'error' || (state === 'ready' && profileLoaded);
  useEffect(() => { onReadyChange?.(ready); }, [ready, onReadyChange]);

  if (state === 'loading') return null;

  if (state === 'must-change') return <Shell><ChangePasswordForm onDone={() => setState('ready')} /></Shell>;

  if (state === 'error') {
    return (
      <Shell>
        <h1 className="mt-4 text-2xl font-extrabold text-brand-ink">{NOTICE.error.title}</h1>
        <p className="mt-2 text-base leading-relaxed text-brand-ink/70">{NOTICE.error.body}</p>
        <Button variant="secondary" size="lg" className="mt-6" onClick={handleLogout}>Đăng xuất</Button>
      </Shell>
    );
  }

  return <StudentHome onLogout={handleLogout} onLoaded={() => setProfileLoaded(true)} />;
};
