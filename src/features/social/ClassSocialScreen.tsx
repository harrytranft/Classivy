import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flag, Gift, RefreshCw, Undo2, Users } from 'lucide-react';
import { Button, Chip, EmptyState, Modal, cx } from '../../components/ui';
import { useApp } from '../../app/AppContext';
import { classPath } from '../../app/screenRoutes';
import type { TeacherGiftRow } from '../../domain/social';
import { useClassSocial } from './useClassSocial';

// Trang "Bạn bè & quà" của lớp (Phase 6): bật/tắt, hạn mức ví điểm tặng, nhật ký quà (thu hồi), bạn bè, báo cáo.

const formatTime = (ms: number) => new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
}).format(ms);

const LIMIT_OPTIONS = [0, 1, 2, 3, 5, 8, 10, 15, 20];

type Tab = 'gifts' | 'reports' | 'friends';

const GiftLine: React.FC<{ gift: TeacherGiftRow; onRevoke: (gift: TeacherGiftRow) => void }> = ({ gift, onRevoke }) => (
  <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
    <span className="w-24 shrink-0 text-xs font-semibold text-brand-ink/70">{formatTime(gift.createdAt)}</span>
    <span aria-label={gift.sticker.label} role="img" className="text-xl">{gift.sticker.emoji}</span>
    <span className="min-w-0 flex-1 text-brand-ink">
      <strong>{gift.from}</strong> → <strong>{gift.to}</strong>
      {gift.message && <span className="text-brand-ink/70"> · “{gift.message}”</span>}
    </span>
    {gift.amount > 0 && <Chip tone={gift.revoked ? 'neutral' : 'gold'} className="tabular-nums">+{gift.amount}</Chip>}
    {gift.reportCount > 0 && <Chip tone="danger" icon={<Flag className="h-3 w-3" aria-hidden />}>Bị báo cáo</Chip>}
    {gift.revoked
      ? <Chip tone="neutral">Đã thu hồi{gift.revoked.reason ? `: ${gift.revoked.reason}` : ''}</Chip>
      : <Button size="sm" variant="ghost" icon={<Undo2 className="h-4 w-4" aria-hidden />} onClick={() => onRevoke(gift)}>Thu hồi</Button>}
  </li>
);

export const ClassSocialScreen: React.FC = () => {
  const { routeClassName } = useApp();
  const className = routeClassName ?? null;
  const { settings, gifts, friendships, loading, error, reload, saveSettings, revokeGift, removeFriendship } = useClassSocial(className);

  const [draft, setDraft] = useState({ enabled: false, weeklyLimit: 5, perFriendLimit: 2 });
  const [tab, setTab] = useState<Tab>('gifts');
  const [revoking, setRevoking] = useState<TeacherGiftRow | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings) setDraft({ enabled: settings.enabled, weeklyLimit: settings.weeklyLimit, perFriendLimit: settings.perFriendLimit });
  }, [settings]);

  const dirty = !!settings && (draft.enabled !== settings.enabled || draft.weeklyLimit !== settings.weeklyLimit || draft.perFriendLimit !== settings.perFriendLimit);
  const reported = gifts.filter(g => g.reportCount > 0);

  const act = async (fn: () => Promise<boolean>, ok: string) => {
    setBusy(true);
    setNotice(null);
    const success = await fn();
    setBusy(false);
    setNotice(success ? { tone: 'ok', text: ok } : { tone: 'error', text: 'Chưa lưu được, hãy thử lại.' });
    return success;
  };

  const confirmRevoke = async () => {
    if (!revoking) return;
    if (await act(() => revokeGift(revoking.id, reason.trim()), 'Đã thu hồi quà. Nếu điểm đã được cộng, app sẽ tự trừ lại.')) {
      setRevoking(null);
      setReason('');
    }
  };

  const tabs: Array<[Tab, string, number]> = [['gifts', 'Nhật ký quà', gifts.length], ['reports', 'Báo cáo', reported.length], ['friends', 'Bạn bè', friendships.length]];
  const list = tab === 'reports' ? reported : gifts;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link to={className ? classPath(className) : '/class'}
          className="inline-flex h-10 items-center gap-2 rounded-brand-md border border-brand-forest/20 bg-white px-3 text-sm font-bold text-brand-forest hover:bg-brand-cream">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Về lớp
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-ink">Bạn bè & quà · {className}</h1>
          <p className="text-sm text-brand-ink/70">Học sinh kết bạn trong lớp, tặng sticker, lời khen định sẵn và điểm từ ví riêng. Không có chat tự do.</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw className="h-[18px] w-[18px]" aria-hidden />} onClick={reload} disabled={loading}>Làm mới</Button>
      </div>

      {notice && (
        <div role="status" className={cx('mb-4 rounded-brand-md border p-3 text-sm font-semibold',
          notice.tone === 'ok' ? 'border-[#cbe9cf] bg-[#e9f6ea] text-[#1d6a40]' : 'border-brand-danger/30 bg-[#fff4f2] text-brand-danger')}>{notice.text}</div>
      )}
      {error && <div role="alert" className="mb-4 rounded-brand-md border border-brand-danger/30 bg-[#fff4f2] p-3 text-sm font-semibold text-brand-danger">{error}</div>}

      {settings && (
        <section aria-label="Cài đặt lớp" className="mb-6 rounded-brand-lg border border-[#e6e2d4] bg-white p-5">
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" role="switch" aria-checked={draft.enabled} onClick={() => setDraft(d => ({ ...d, enabled: !d.enabled }))}
              className="inline-flex items-center gap-3 rounded-brand-md px-1 py-1 text-left">
              <span className={cx('relative h-7 w-12 rounded-full transition-colors', draft.enabled ? 'bg-brand-emerald' : 'bg-[#cfccbf]')}>
                <span className={cx('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left]', draft.enabled ? 'left-6' : 'left-1')} />
              </span>
              <span>
                <span className="block font-extrabold text-brand-ink">{draft.enabled ? 'Đang bật cho lớp' : 'Đang tắt'}</span>
                <span className="block text-xs text-brand-ink/70">Tắt: học sinh không kết bạn, không tặng quà mới được. Quà đã gửi vẫn giữ.</span>
              </span>
            </button>
            <label className="text-sm font-bold text-brand-ink">
              Ví điểm tặng / tuần
              <select value={draft.weeklyLimit} onChange={e => setDraft(d => ({ ...d, weeklyLimit: Number(e.target.value) }))}
                className="ml-2 h-10 rounded-brand-md border border-[#d9d6ca] bg-white px-2">
                {LIMIT_OPTIONS.map(v => <option key={v} value={v}>{v} điểm</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-brand-ink">
              Tối đa cho một bạn / tuần
              <select value={draft.perFriendLimit} onChange={e => setDraft(d => ({ ...d, perFriendLimit: Number(e.target.value) }))}
                className="ml-2 h-10 rounded-brand-md border border-[#d9d6ca] bg-white px-2">
                {LIMIT_OPTIONS.map(v => <option key={v} value={v}>{v} điểm</option>)}
              </select>
            </label>
            <Button disabled={!dirty} loading={busy} onClick={() => act(() => saveSettings(draft), 'Đã lưu cài đặt của lớp.')}>Lưu cài đặt</Button>
          </div>
          <p className="mt-3 text-xs text-brand-ink/70">
            Điểm tặng không trừ Hào Quang của người tặng. Điểm được cộng vào Hào Quang của người nhận khi app của bạn đang mở (tự kiểm tra vài phút một lần). Mỗi em tặng tối đa 10 món/ngày, 2 điểm/lần.
          </p>
        </section>
      )}

      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {tabs.map(([id, label, count]) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
            className={cx('h-10 rounded-full px-4 text-sm font-bold', tab === id ? 'bg-brand-forest text-brand-cream' : 'border border-[#e6e2d4] bg-white text-brand-ink')}>
            {label} ({count})
          </button>
        ))}
      </div>

      {tab !== 'friends' && (list.length === 0
        ? <EmptyState icon={<Gift className="h-8 w-8" />} title={tab === 'reports' ? 'Chưa có báo cáo nào' : 'Chưa có quà nào'}
            description={tab === 'reports' ? 'Khi học sinh bấm "Báo thầy cô" trên một món quà, quà đó hiện ở đây.' : 'Quà học sinh tặng nhau (100 món gần nhất) hiện ở đây.'} />
        : <ul className="divide-y divide-[#efece2] overflow-hidden rounded-brand-lg border border-[#e6e2d4] bg-white">
            {list.map(gift => <GiftLine key={gift.id} gift={gift} onRevoke={setRevoking} />)}
          </ul>)}

      {tab === 'friends' && (friendships.length === 0
        ? <EmptyState icon={<Users className="h-8 w-8" />} title="Chưa có bạn bè nào" description="Khi học sinh kết bạn với nhau, danh sách hiện ở đây." />
        : <ul className="divide-y divide-[#efece2] overflow-hidden rounded-brand-lg border border-[#e6e2d4] bg-white">
            {friendships.map(f => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1 text-brand-ink"><strong>{f.a}</strong> và <strong>{f.b}</strong></span>
                <Chip tone={f.status === 'accepted' ? 'violet' : 'neutral'}>{f.status === 'accepted' ? 'Bạn bè' : 'Đang chờ'}</Chip>
                <Button size="sm" variant="ghost" disabled={busy}
                  onClick={() => { if (window.confirm(`Gỡ quan hệ bạn bè giữa ${f.a} và ${f.b}?`)) act(() => removeFriendship(f.id), 'Đã gỡ.'); }}>Gỡ</Button>
              </li>
            ))}
          </ul>)}

      {revoking && (
        <Modal onClose={() => { if (!busy) setRevoking(null); }} title="Thu hồi quà" icon={<Undo2 className="h-5 w-5" />} size="sm"
          footer={<div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRevoking(null)} disabled={busy}>Huỷ</Button>
            <Button variant="danger" loading={busy} onClick={confirmRevoke}>Thu hồi</Button>
          </div>}>
          <p className="text-sm text-brand-ink">
            Quà của <strong>{revoking.from}</strong> tặng <strong>{revoking.to}</strong>{revoking.amount > 0 ? ` (+${revoking.amount} Hào Quang)` : ''}.
            {revoking.amount > 0 && ' Nếu điểm đã được cộng, app sẽ tự trừ lại và ghi vào lịch sử.'} Thu hồi không hoàn tác được; ví của người tặng không được trả lại.
          </p>
          <label className="mt-4 block text-sm font-bold text-brand-ink">
            Lý do (chỉ bạn thấy, không bắt buộc)
            <input value={reason} maxLength={200} onChange={e => setReason(e.target.value)}
              className="mt-1 h-11 w-full rounded-brand-md border border-[#d9d6ca] px-3 text-sm" />
          </label>
        </Modal>
      )}
    </div>
  );
};
