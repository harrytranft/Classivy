import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { Card, ProgressBar } from '../../../components/ui';
import { SocialOverview } from '../../../domain/social';
import { SendGiftModal } from './SendGiftModal';
import { SocialFriendsCard } from './SocialFriendsCard';
import { SocialGiftsCard } from './SocialGiftsCard';
import { useStudentSocial } from './useStudentSocial';

// Khu bạn bè + quà trên cổng học sinh (Phase 6). Lớp chưa bật thì chỉ hiện một dòng nhẹ nhàng.

const WalletCard: React.FC<{ overview: SocialOverview }> = ({ overview }) => {
  const { wallet, pendingPoints } = overview;
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-brand-ink"><Wallet size={20} className="text-brand-violet" aria-hidden /> Ví điểm tặng</h2>
        <p className="text-2xl font-extrabold tabular-nums text-brand-violet-deep">{wallet.remaining}<span className="text-base text-brand-ink/70">/{wallet.limit}</span></p>
      </div>
      <ProgressBar value={wallet.limit > 0 ? (wallet.remaining / wallet.limit) * 100 : 0} tone="gold" label="Điểm tặng còn lại tuần này" className="mt-3" />
      <p className="mt-2 text-[13px] text-brand-ink/70">
        Ví đầy lại mỗi thứ Hai. Mỗi bạn nhận tối đa {wallet.perFriendLimit} điểm từ em mỗi tuần. Tặng điểm không làm giảm Hào Quang của em.
      </p>
      {pendingPoints > 0 && (
        <p className="mt-2 rounded-brand-md bg-brand-gold-light/60 p-2 text-[13px] font-semibold text-[#6b4a00]">
          Em có +{pendingPoints} Hào Quang được tặng đang chờ cộng (khi thầy cô mở lớp).
        </p>
      )}
    </Card>
  );
};

export const StudentSocialPanel: React.FC<{ refreshSignal: number }> = ({ refreshSignal }) => {
  const { state, busy, notice, clearNotice, actions } = useStudentSocial(refreshSignal);
  const [giftFriendId, setGiftFriendId] = useState<string | null>(null);

  if (state.kind === 'loading') return null;
  if (state.kind === 'error') {
    return <Card><p className="text-base text-brand-ink/70">Chưa tải được bạn bè và quà. Bấm "Cập nhật" để thử lại.</p></Card>;
  }
  if (!state.result.enabled) {
    return <Card><p className="text-base text-brand-ink/70">Bạn bè và quà tặng sẽ mở khi thầy cô bật cho lớp em.</p></Card>;
  }

  const { overview } = state.result;
  const giftFriend = overview.friends.find(f => f.id === giftFriendId);

  return (
    <>
      {notice && (
        <div role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`rounded-brand-md border p-3 text-[13px] font-semibold ${notice.tone === 'error' ? 'border-brand-danger/30 bg-[#fff4f2] text-brand-danger' : 'border-brand-emerald/30 bg-[#e9f6ea] text-[#1d6a40]'}`}>
          {notice.text}
        </div>
      )}
      <WalletCard overview={overview} />
      <SocialFriendsCard overview={overview} busy={busy} actions={actions} onGift={id => { clearNotice(); setGiftFriendId(id); }} />
      <SocialGiftsCard received={overview.received} sent={overview.sent} busy={busy} onReport={actions.report} />
      {giftFriend && (
        <SendGiftModal friend={giftFriend} wallet={overview.wallet} busy={busy} error={notice?.tone === 'error' ? notice.text : null}
          onSend={(amount, stickerId, messageId) => actions.sendGift(giftFriend.id, amount, stickerId, messageId)}
          onClose={() => setGiftFriendId(null)} />
      )}
    </>
  );
};
