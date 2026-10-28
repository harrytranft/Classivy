import React from 'react';
import { Modal } from '../../components/ui';
import { SHORTCUT_DEFINITIONS } from '../../domain/shortcuts';
import { ShortcutKey } from './ShortcutsSettings';
import { useShortcutMap } from './shortcutsStore';

/** Bảng nhắc phím tắt, mở bằng phím ?. */
export const ShortcutHelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const map = useShortcutMap();
  return (
    <Modal onClose={onClose} title="Phím tắt" subtitle="Đổi phím trong Cài đặt" icon="⌨️" size="md" zIndex="z-[210]">
      <ul className="grid gap-2">
        {SHORTCUT_DEFINITIONS.map(def => (
          <li key={def.id} className="flex items-center justify-between rounded-brand-md bg-[#f4f8f1] px-4 py-2.5">
            <span className="text-[15px] font-bold text-brand-ink">{def.label}</span>
            <ShortcutKey value={map[def.id]} />
          </li>
        ))}
      </ul>
    </Modal>
  );
};
