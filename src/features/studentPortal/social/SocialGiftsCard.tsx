import React, { useState } from 'react';
import { Flag, Gift } from 'lucide-react';
import { Button, Card, Chip, EmptyState } from '../../../components/ui';
import { GiftState, SocialGift, getMessageText, getSticker } from '../../../domain/social';

// Quà nhận được (riêng em xem) và quà đã tặng. Có nút "Báo thầy cô" cho quà làm em không vui.

const STATE_LABEL: Record<GiftState, { text: string; tone: 'neutral' | 'leaf' | 'danger' }> = {
  pending: { text: 'Đang chờ cộng', tone: 'neutral' },
  applied: { text: 'Đã cộng', tone: 'leaf' },
  revoked: { text: 'Thầy cô đã thu hồi', tone: 'danger' }
};

const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });

const GiftRow: React.FC<{ gift: SocialGift; direction: 'from' | 'to'; busy: boolean; onReport?: (id: number) => void }> = ({ gift, direction, busy, onReport }) => {
  const sticker = getSticker(gift.stickerId);
  const message = getMessageText(gift.messageId);
  const state = STATE_LABEL[gift.state];
  return (
    <li className="flex gap-3 py-3">
      <span aria-label={sticker.label} role="img" className="grid h-12 w-12 shrink-0 place-items-center rounded-brand-md bg-[#f3e9fa] text-2xl">{sticker.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="text-base text-brand-ink">
          <span className="font-bold">{direction === 'from' ? `Từ ${gift.name}` : `Tặng ${gift.name}`}</span>
          {gift.createdAt > 0 && <span className="text-[13px] text-brand-ink/70"> · {dateFormat.format(gift.createdAt)}</span>}
        </p>
        {message && <p className="text-[15px] text-brand-ink/80">“{message}”</p>}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {gift.amount > 0 && <Chip tone={gift.state === 'revoked' ? 'neutral' : 'gold'} className="tabular-nums">+{gift.amount} Hào Quang</Chip>}
          {gift.amount > 0 && <Chip tone={state.tone}>{state.text}</Chip>}
          {onReport && (gift.reported
            ? <span className="text-[13px] font-semibold text-brand-ink/70">Đã báo thầy cô</span>
            : <Button size="sm" variant="ghost" icon={<Flag size={14} />} disabled={busy}
                onClick={() => { if (window.confirm('Báo món quà này cho thầy cô?')) onReport(gift.id); }}>Báo thầy cô</Button>)}
        </div>
      </div>
    </li>
  );
};

export const SocialGiftsCard: React.FC<{ received: SocialGift[]; sent: SocialGift[]; busy: boolean; onReport: (id: number) => void }> = ({ received, sent, busy, onReport }) => {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const items = tab === 'received' ? received : sent;
  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-brand-ink"><Gift size={20} className="text-brand-violet" aria-hidden /> Quà</h2>
        <div role="tablist" aria-label="Loại quà" className="flex rounded-full bg-[#f1efe7] p-1">
          {(['received', 'sent'] as const).map(key => (
            <button key={key} role="tab" type="button" aria-selected={tab === key} onClick={() => setTab(key)}
              className={`min-h-9 rounded-full px-3 text-[13px] font-bold ${tab === key ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-ink/70'}`}>
              {key === 'received' ? 'Nhận được' : 'Đã tặng'}
            </button>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <EmptyState className="py-8" title={tab === 'received' ? 'Chưa có quà nào' : 'Em chưa tặng quà nào'}
          description={tab === 'received' ? 'Quà bạn bè tặng em sẽ hiện ở đây.' : 'Bấm "Tặng quà" cạnh tên một bạn để gửi sticker và lời khen nhé.'} />
      ) : (
        <ul role="tabpanel" className="divide-y divide-[#ebe8dc]">
          {items.map(gift => (
            <GiftRow key={gift.id} gift={gift} direction={tab === 'received' ? 'from' : 'to'} busy={busy} onReport={tab === 'received' ? onReport : undefined} />
          ))}
        </ul>
      )}
    </Card>
  );
};
