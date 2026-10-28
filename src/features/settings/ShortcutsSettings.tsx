import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui';
import { SHORTCUT_DEFINITIONS, ShortcutId, findShortcutConflict, formatShortcutKey, normalizeShortcutKey } from '../../domain/shortcuts';
import { resetShortcutKeys, setShortcutKey, useShortcutMap } from './shortcutsStore';

export const ShortcutKey: React.FC<{ value: string }> = ({ value }) => (
  <kbd className="inline-grid h-9 min-w-9 place-items-center rounded-brand-sm border border-[#d9d6ca] bg-white px-2 text-[15px] font-extrabold text-brand-forest-deep shadow-[0_2px_0_#d9d6ca]">{formatShortcutKey(value)}</kbd>
);

/** Bảng phím tắt trong Cài đặt: bấm "Đổi" rồi nhấn phím mới. */
export const ShortcutsSettings: React.FC = () => {
  const map = useShortcutMap();
  const [capturing, setCapturing] = useState<ShortcutId | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!capturing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') { setCapturing(null); setMessage(''); return; }
      const key = normalizeShortcutKey(event.key);
      if (!key) { setMessage('Chỉ nhận một phím chữ, số hoặc dấu.'); return; }
      const conflict = findShortcutConflict(map, capturing, key);
      if (conflict) {
        const other = SHORTCUT_DEFINITIONS.find(def => def.id === conflict)!;
        setMessage(`Phím ${formatShortcutKey(key)} đang dùng cho "${other.label}". Hãy đổi phím đó trước.`);
        return;
      }
      setShortcutKey(capturing, key);
      setCapturing(null);
      setMessage('');
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [capturing, map]);

  return (
    <div className="space-y-4 text-left">
      <p className="text-sm text-brand-ink/70">Nhấn phím tắt khi đang ở trang của một lớp. Phím tắt không chạy khi bạn đang gõ chữ hoặc đang mở một hộp thoại. Nhấn <ShortcutKey value="?" /> bất cứ lúc nào để xem danh sách.</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {SHORTCUT_DEFINITIONS.map(def => (
          <li key={def.id} className="flex items-center justify-between gap-3 rounded-brand-md border border-[#e6e2d4] bg-white px-4 py-3">
            <span className="min-w-0 text-[15px] font-bold text-brand-ink">{def.label}{def.scope === 'class' && <span className="ml-2 text-xs font-semibold text-brand-ink/50">trong lớp</span>}</span>
            <span className="flex shrink-0 items-center gap-2">
              {capturing === def.id ? <span className="rounded-brand-sm bg-brand-gold-light px-3 py-1.5 text-sm font-bold text-brand-forest-deep">Nhấn phím mới…</span> : <ShortcutKey value={map[def.id]} />}
              <Button size="sm" variant="secondary" onClick={() => { setMessage(''); setCapturing(capturing === def.id ? null : def.id); }}>{capturing === def.id ? 'Huỷ' : 'Đổi'}</Button>
            </span>
          </li>
        ))}
      </ul>
      {message && <p role="alert" className="text-sm font-bold text-brand-danger">{message}</p>}
      <Button variant="secondary" size="sm" onClick={() => { resetShortcutKeys(); setCapturing(null); setMessage(''); }}>Khôi phục mặc định</Button>
      <p className="text-xs text-brand-ink/55">Phím tắt được lưu trên máy này.</p>
    </div>
  );
};
