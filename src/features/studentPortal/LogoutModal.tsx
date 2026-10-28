import React from 'react';
import { Button, Modal } from '../../components/ui';

// Bấm avatar mở hộp này; học sinh tự bấm "Đăng xuất" (D44), không tự đăng xuất ngay.
export const LogoutModal: React.FC<{ name: string; onLogout: () => void; onClose: () => void }> = ({ name, onLogout, onClose }) => (
  <Modal
    size="sm"
    title="Đăng xuất?"
    onClose={onClose}
    zIndex="z-[120]"
    footer={(
      <>
        <Button variant="ghost" size="md" onClick={onClose}>Ở lại</Button>
        <Button variant="secondary" size="md" onClick={onLogout}>Đăng xuất</Button>
      </>
    )}
  >
    <p className="text-base text-brand-ink">{name} ơi, em muốn thoát khỏi tài khoản trên máy này?</p>
  </Modal>
);
