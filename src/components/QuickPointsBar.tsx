import React from 'react';

// Phase 13A: hàng nút cộng/trừ nhanh 1-5 và nút "Đúng hết", dùng ở Random Solo và Battle.

const AMOUNTS = [1, 2, 3, 4, 5];

interface QuickPointsBarProps {
  onPick: (amount: number) => void;
  disabled?: boolean;
  /** Tiền tố cho data-testid để phân biệt nhiều thanh trên một màn hình (ví dụ Battle có hai bên). */
  testIdPrefix?: string;
  /** Tên em, đọc cho trình đọc màn hình. */
  studentName?: string;
}

export const QuickPointsBar: React.FC<QuickPointsBarProps> = ({ onPick, disabled = false, testIdPrefix = 'quick', studentName }) => {
  const who = studentName ? ` cho ${studentName}` : '';
  const base = 'min-h-[44px] flex-1 rounded-xl text-base font-extrabold text-white shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50';
  return (
    <div className="space-y-2" role="group" aria-label={`Cộng hoặc trừ điểm nhanh${who}`}>
      <div className="flex gap-1.5">
        {AMOUNTS.map(amount => (
          <button
            key={`plus-${amount}`}
            type="button"
            disabled={disabled}
            data-testid={`${testIdPrefix}-plus-${amount}`}
            aria-label={`Cộng ${amount} điểm${who}`}
            onClick={() => onPick(amount)}
            className={`${base} bg-emerald-600 hover:bg-emerald-700`}
          >
            +{amount}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        {AMOUNTS.map(amount => (
          <button
            key={`minus-${amount}`}
            type="button"
            disabled={disabled}
            data-testid={`${testIdPrefix}-minus-${amount}`}
            aria-label={`Trừ ${amount} điểm${who}`}
            onClick={() => onPick(-amount)}
            className={`${base} bg-red-600 hover:bg-red-700`}
          >
            -{amount}
          </button>
        ))}
      </div>
    </div>
  );
};

interface PerfectAnswerButtonProps {
  active: boolean;
  onToggle: () => void;
  /** Số lượt lắc bonus em đang có (hiện để giáo viên thấy ngay). */
  bonusRolls?: number;
  testId?: string;
  studentName?: string;
}

export const PerfectAnswerButton: React.FC<PerfectAnswerButtonProps> = ({ active, onToggle, bonusRolls = 0, testId = 'perfect-answer', studentName }) => (
  <button
    type="button"
    data-testid={testId}
    aria-pressed={active}
    aria-label={`${active ? 'Huỷ Đúng hết' : 'Đúng hết'}${studentName ? ` cho ${studentName}` : ''}`}
    onClick={onToggle}
    className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-extrabold transition-colors ${active
      ? 'border-brand-gold-dark bg-brand-gold text-brand-forest-deep shadow-md'
      : 'border-brand-gold bg-white text-brand-forest-deep hover:bg-brand-gold-light'}`}
  >
    <span aria-hidden>⭐</span>
    <span>
      {active ? 'Đã ghi nhận Đúng hết (+1 lượt xúc xắc), bấm để huỷ' : 'Đúng hết (+1 lượt xúc xắc)'}
      {bonusRolls > 0 ? ` · đang có ${bonusRolls} lượt bonus` : ''}
    </span>
  </button>
);
