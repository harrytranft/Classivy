import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, Lock, LockOpen, RefreshCw, Search, UserMinus, UserPlus, Users } from 'lucide-react';
import { Button, Chip, EmptyState, Modal, cx, type ChipTone } from '../../components/ui';
import { useApp } from '../../app/AppContext';
import { classPath } from '../../app/screenRoutes';
import {
  ACCOUNT_STATE_LABEL, countByState, filterAccountRows, getAccountState,
  type AccountRow, type AccountState, type AccountStateFilter
} from '../../domain/accountView';
import { isValidUsername } from '../../domain/studentAccount';
import { AuditLogPanel } from './AuditLogPanel';
import { LoginCardsModal } from './LoginCardsModal';
import {
  createAccounts, resetPassword, revokeAccount, setAccountLocked, type Credential
} from './studentAccountsApi';
import { useClassAccounts } from './useClassAccounts';

const STATE_TONE: Record<AccountState, ChipTone> = { none: 'neutral', pending: 'gold', active: 'leaf', locked: 'danger' };

type PendingAction =
  | { kind: 'create-all'; rows: AccountRow[] }
  | { kind: 'create-one'; row: AccountRow }
  | { kind: 'reset' | 'lock' | 'unlock' | 'revoke'; row: AccountRow };

type Notice = { tone: 'ok' | 'error'; text: string };

const CONFIRM_COPY: Record<'reset' | 'lock' | 'unlock' | 'revoke', { title: string; body: (name: string) => string; cta: string; danger?: boolean }> = {
  reset: {
    title: 'Đặt lại mật khẩu',
    body: name => `Tạo mật khẩu mới cho ${name}. Mật khẩu cũ không dùng được nữa và em phải đặt mật khẩu mới ở lần đăng nhập tới.`,
    cta: 'Đặt lại mật khẩu'
  },
  lock: {
    title: 'Khoá tài khoản',
    body: name => `${name} sẽ không đăng nhập được cho tới khi bạn mở khoá. Điểm và dữ liệu của em vẫn giữ nguyên.`,
    cta: 'Khoá tài khoản'
  },
  unlock: {
    title: 'Mở khoá tài khoản',
    body: name => `${name} sẽ đăng nhập lại được bằng mật khẩu hiện tại.`,
    cta: 'Mở khoá'
  },
  revoke: {
    title: 'Thu hồi tài khoản',
    body: name => `Xoá hẳn tài khoản đăng nhập của ${name}. Điểm, Pokémon và lịch sử của em vẫn ở trong lớp; muốn em đăng nhập lại, bạn phải tạo tài khoản mới. Thao tác này không hoàn tác được.`,
    cta: 'Thu hồi tài khoản',
    danger: true
  }
};

export const StudentAccountsScreen: React.FC = () => {
  const { routeClassName } = useApp();
  const className = routeClassName ?? null;
  const { rows, audit, loading, error, reload } = useClassAccounts(className);

  const [tab, setTab] = useState<'students' | 'audit'>('students');
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<AccountStateFilter>('all');
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [credentials, setCredentials] = useState<Credential[] | null>(null);

  const counts = useMemo(() => countByState(rows), [rows]);
  const visibleRows = useMemo(() => filterAccountRows(rows, query, stateFilter), [rows, query, stateFilter]);
  const withoutAccount = useMemo(() => rows.filter(r => !r.hasAccount), [rows]);

  const usernameError = pending?.kind === 'create-one' && usernameInput.trim() !== '' && !isValidUsername(usernameInput.trim().toLowerCase())
    ? 'Chỉ dùng chữ thường không dấu và số, dài 3-24 ký tự.' : null;

  const closeConfirm = () => { if (!busy) { setPending(null); setUsernameInput(''); } };

  const run = async () => {
    if (!pending || busy || usernameError) return;
    setBusy(true);
    setNotice(null);
    try {
      if (pending.kind === 'create-all' || pending.kind === 'create-one') {
        const targets = pending.kind === 'create-all' ? pending.rows : [pending.row];
        const custom = pending.kind === 'create-one' && usernameInput.trim() ? { [pending.row.id]: usernameInput.trim().toLowerCase() } : {};
        const outcome = await createAccounts(targets.map(r => r.id), custom);
        if (outcome.created.length > 0) setCredentials(outcome.created);
        setNotice(outcome.failed.length === 0
          ? { tone: 'ok', text: `Đã tạo ${outcome.created.length} tài khoản.` }
          : { tone: 'error', text: `Tạo được ${outcome.created.length}, lỗi ${outcome.failed.length}: ${outcome.failed[0].error}` });
      } else if (pending.kind === 'reset') {
        setCredentials([await resetPassword(pending.row.id)]);
        setNotice({ tone: 'ok', text: `Đã đặt lại mật khẩu cho ${pending.row.name}.` });
      } else if (pending.kind === 'lock' || pending.kind === 'unlock') {
        await setAccountLocked(pending.row.id, pending.kind === 'lock');
        setNotice({ tone: 'ok', text: pending.kind === 'lock' ? `Đã khoá tài khoản của ${pending.row.name}.` : `Đã mở khoá tài khoản của ${pending.row.name}.` });
      } else {
        await revokeAccount(pending.row.id);
        setNotice({ tone: 'ok', text: `Đã thu hồi tài khoản của ${pending.row.name}.` });
      }
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Không thực hiện được, vui lòng thử lại.' });
    } finally {
      setBusy(false);
      setPending(null);
      setUsernameInput('');
      reload();
    }
  };

  const confirmContent = () => {
    if (!pending) return null;
    if (pending.kind === 'create-all') {
      return { title: 'Tạo tài khoản cho cả lớp', cta: `Tạo ${pending.rows.length} tài khoản`, danger: false, body: (
        <p>Tạo tài khoản cho {pending.rows.length} học sinh chưa có. Mỗi em nhận một tên đăng nhập và mật khẩu ngẫu nhiên, hiện một lần ở thẻ đăng nhập để bạn in. Em phải đổi mật khẩu ở lần đăng nhập đầu.</p>
      ) };
    }
    if (pending.kind === 'create-one') {
      return { title: `Tạo tài khoản cho ${pending.row.name}`, cta: 'Tạo tài khoản', danger: false, body: (
        <div className="space-y-3">
          <p>Tên đăng nhập sẽ tự tạo (tên + số ngẫu nhiên). Bạn có thể tự đặt nếu muốn.</p>
          <label className="block text-sm font-bold text-brand-ink">
            Tên đăng nhập (không bắt buộc)
            <input
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              placeholder="vd: minhanh472"
              autoComplete="off"
              className="mt-1 h-11 w-full rounded-brand-md border border-[#d9d6ca] px-3 font-mono text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/25"
            />
          </label>
          {usernameError && <p className="text-sm font-semibold text-brand-danger">{usernameError}</p>}
        </div>
      ) };
    }
    const copy = CONFIRM_COPY[pending.kind];
    return { title: copy.title, cta: copy.cta, danger: copy.danger, body: <p>{copy.body(pending.row.name)}</p> };
  };

  const confirm = confirmContent();

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          to={className ? classPath(className) : '/class'}
          className="inline-flex h-10 items-center gap-2 rounded-brand-md border border-brand-forest/20 bg-white px-3 text-sm font-bold text-brand-forest hover:bg-brand-cream"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Về lớp
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-ink">Tài khoản học sinh · {className}</h1>
          <p className="text-sm text-brand-ink/70">
            Học sinh đăng nhập bằng tên đăng nhập và mật khẩu do bạn cấp. Muốn xoá hẳn một em (kèm tài khoản và sổ điểm), hãy xoá học sinh ở trang lớp.
          </p>
        </div>
        <Button variant="secondary" icon={<RefreshCw className="h-[18px] w-[18px]" aria-hidden />} onClick={reload} disabled={loading}>Làm mới</Button>
        <Button
          icon={<Users className="h-[18px] w-[18px]" aria-hidden />}
          disabled={withoutAccount.length === 0 || loading}
          onClick={() => setPending({ kind: 'create-all', rows: withoutAccount })}
        >
          Tạo cho cả lớp ({withoutAccount.length})
        </Button>
      </div>

      {notice && (
        <div role="status" className={cx(
          'mb-4 rounded-brand-md border p-3 text-sm font-semibold',
          notice.tone === 'ok' ? 'border-[#cbe9cf] bg-[#e9f6ea] text-[#1d6a40]' : 'border-brand-danger/30 bg-[#fff4f2] text-brand-danger'
        )}>{notice.text}</div>
      )}
      {error && <div role="alert" className="mb-4 rounded-brand-md border border-brand-danger/30 bg-[#fff4f2] p-3 text-sm font-semibold text-brand-danger">{error}</div>}

      <div className="mb-4 flex gap-2" role="tablist">
        {([['students', 'Học sinh'], ['audit', 'Nhật ký thao tác']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cx(
              'rounded-full border px-4 py-1.5 text-sm font-bold transition-colors',
              tab === id ? 'border-brand-forest bg-brand-forest text-brand-cream' : 'border-[#dcd8c8] bg-white text-brand-forest hover:bg-brand-cream'
            )}
          >{label}</button>
        ))}
      </div>

      {tab === 'audit' ? <AuditLogPanel entries={audit} /> : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-brand-lg border border-[#e6e2d4] bg-white p-3">
            <label className="relative flex min-w-[220px] flex-1 items-center">
              <Search className="pointer-events-none absolute left-3.5 h-5 w-5 text-brand-ink/45" aria-hidden />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc tên đăng nhập..."
                aria-label="Tìm học sinh"
                className="h-11 w-full rounded-brand-md border border-[#dcd8c8] bg-brand-cream pl-11 pr-3 text-[15px] text-brand-ink outline-none placeholder:text-brand-ink/65 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/25"
              />
            </label>
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value as AccountStateFilter)}
              aria-label="Lọc theo trạng thái"
              className="h-11 rounded-brand-md border border-brand-forest/25 bg-white px-3 text-[15px] font-bold text-brand-forest outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/25"
            >
              <option value="all">Tất cả ({rows.length})</option>
              {(Object.keys(ACCOUNT_STATE_LABEL) as AccountState[]).map(s => (
                <option key={s} value={s}>{ACCOUNT_STATE_LABEL[s]} ({counts[s]})</option>
              ))}
            </select>
          </div>

          {loading && rows.length === 0 ? (
            <p className="p-8 text-center text-sm font-semibold text-brand-ink/60">Đang tải...</p>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="Chưa thấy học sinh nào của lớp này trên đám mây"
              description="Nếu bạn vừa thêm học sinh, đợi vài giây cho app lưu rồi bấm Làm mới."
            />
          ) : visibleRows.length === 0 ? (
            <EmptyState title="Không có học sinh khớp bộ lọc" description="Thử xoá từ khoá hoặc chọn trạng thái khác." />
          ) : (
            <ul className="divide-y divide-[#efece2] overflow-hidden rounded-brand-lg border border-[#e6e2d4] bg-white">
              {visibleRows.map(row => {
                const state = getAccountState(row);
                return (
                  <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                    <div className="min-w-[160px] flex-1">
                      <p className="font-extrabold text-brand-ink">{row.name}</p>
                      <p className="font-mono text-sm text-brand-ink/70">{row.username ?? '—'}</p>
                    </div>
                    <Chip tone={STATE_TONE[state]}>{ACCOUNT_STATE_LABEL[state]}</Chip>
                    <div className="flex flex-wrap gap-2">
                      {state === 'none' ? (
                        <Button size="sm" icon={<UserPlus className="h-4 w-4" aria-hidden />} onClick={() => setPending({ kind: 'create-one', row })}>Tạo tài khoản</Button>
                      ) : (
                        <>
                          <Button size="sm" variant="secondary" icon={<KeyRound className="h-4 w-4" aria-hidden />} onClick={() => setPending({ kind: 'reset', row })}>Đặt lại mật khẩu</Button>
                          {state === 'locked' ? (
                            <Button size="sm" variant="secondary" icon={<LockOpen className="h-4 w-4" aria-hidden />} onClick={() => setPending({ kind: 'unlock', row })}>Mở khoá</Button>
                          ) : (
                            <Button size="sm" variant="secondary" icon={<Lock className="h-4 w-4" aria-hidden />} onClick={() => setPending({ kind: 'lock', row })}>Khoá</Button>
                          )}
                          <Button size="sm" variant="ghost" icon={<UserMinus className="h-4 w-4" aria-hidden />} onClick={() => setPending({ kind: 'revoke', row })}>Thu hồi</Button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {pending && confirm && (
        <Modal
          size="sm"
          zIndex="z-[290]"
          title={confirm.title}
          onClose={closeConfirm}
          footer={(
            <>
              <Button variant="secondary" onClick={closeConfirm} disabled={busy}>Huỷ</Button>
              <Button variant={confirm.danger ? 'danger' : 'primary'} onClick={run} loading={busy} disabled={Boolean(usernameError)}>{confirm.cta}</Button>
            </>
          )}
        >
          <div className="text-sm leading-relaxed text-brand-ink/80">{confirm.body}</div>
        </Modal>
      )}

      {credentials && <LoginCardsModal credentials={credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
};
