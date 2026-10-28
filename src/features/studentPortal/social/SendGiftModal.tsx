import React, { useState } from 'react';
import { Gift } from 'lucide-react';
import { Button, Modal } from '../../../components/ui';
import { MESSAGES, STICKERS, SocialFriend, SocialWallet, remainingForFriend } from '../../../domain/social';

// Chọn sticker (bắt buộc), lời nhắn định sẵn (tuỳ chọn) và 0-2 điểm. Không có ô gõ chữ tự do (D5).

interface SendGiftModalProps {
  friend: SocialFriend;
  wallet: SocialWallet;
  busy: boolean;
  error?: string | null;
  onSend: (amount: number, stickerId: string, messageId: string | null) => Promise<boolean>;
  onClose: () => void;
}

const choiceClass = (selected: boolean) =>
  `rounded-brand-md border-2 transition-colors ${selected ? 'border-brand-violet bg-[#f3e9fa]' : 'border-[#e6e2d4] bg-white hover:border-brand-violet/50'}`;

export const SendGiftModal: React.FC<SendGiftModalProps> = ({ friend, wallet, busy, error, onSend, onClose }) => {
  const [stickerId, setStickerId] = useState(STICKERS[0].id);
  const [messageId, setMessageId] = useState<string | null>(null);
  const maxPoints = remainingForFriend(wallet, friend);
  const [amount, setAmount] = useState(Math.min(1, maxPoints));

  const send = async () => {
    if (await onSend(amount, stickerId, messageId)) onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title={`Tặng quà cho ${friend.name}`}
      icon={<Gift size={20} />}
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="lg" onClick={onClose}>Để sau</Button>
          <Button size="lg" icon={<Gift size={18} />} loading={busy} onClick={send}>Gửi quà</Button>
        </div>
      }
    >
      {error && <div role="alert" className="mb-4 rounded-brand-md border border-brand-danger/30 bg-[#fff4f2] p-3 text-[13px] font-semibold text-brand-danger">{error}</div>}
      <fieldset>
        <legend className="mb-2 text-[13px] font-bold text-brand-ink">Chọn sticker</legend>
        <div className="grid grid-cols-4 gap-2">
          {STICKERS.map(sticker => (
            <button key={sticker.id} type="button" aria-pressed={stickerId === sticker.id} aria-label={sticker.label}
              onClick={() => setStickerId(sticker.id)} className={`${choiceClass(stickerId === sticker.id)} flex h-14 items-center justify-center text-3xl`}>
              <span aria-hidden>{sticker.emoji}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="mb-2 text-[13px] font-bold text-brand-ink">Lời nhắn (không bắt buộc)</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[{ id: null, text: 'Không kèm lời nhắn' }, ...MESSAGES].map(message => (
            <button key={message.id ?? 'none'} type="button" aria-pressed={messageId === message.id}
              onClick={() => setMessageId(message.id)} className={`${choiceClass(messageId === message.id)} min-h-11 px-3 py-2 text-left text-[15px] text-brand-ink`}>
              {message.text}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="mb-2 text-[13px] font-bold text-brand-ink">Tặng kèm Hào Quang</legend>
        <div className="flex gap-2">
          {[0, 1, 2].map(value => (
            <button key={value} type="button" aria-pressed={amount === value} disabled={value > maxPoints}
              onClick={() => setAmount(value)}
              className={`${choiceClass(amount === value)} h-11 flex-1 font-extrabold tabular-nums text-brand-ink disabled:cursor-not-allowed disabled:opacity-40`}>
              {value === 0 ? 'Không' : `+${value}`}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[13px] text-brand-ink/70">
          {maxPoints > 0
            ? `Ví còn ${wallet.remaining}/${wallet.limit} điểm tuần này. Tặng điểm không làm giảm Hào Quang của em.`
            : 'Tuần này em không tặng thêm điểm cho bạn ấy được nữa, nhưng vẫn gửi sticker được nhé!'}
        </p>
      </fieldset>
    </Modal>
  );
};
