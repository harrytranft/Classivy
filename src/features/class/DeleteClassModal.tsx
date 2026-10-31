import React, { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { Button, Modal } from '../../components/ui';

// Xác nhận xoá lớp: xoá luôn mọi học sinh của lớp (kể cả em đã lưu trữ). Phải gõ đúng tên lớp mới bấm được.
export const DeleteClassModal: React.FC<{ className: string; onClose: () => void }> = ({ className, onClose }) => {
  const { allStudents, deleteClass } = useApp();
  const [typed, setTyped] = useState('');
  const count = allStudents.filter(student => student.className === className).length;
  const confirmed = typed.trim() === className;

  return (
    <Modal
      onClose={onClose}
      title={`Xoá lớp ${className}?`}
      icon="⚠️"
      size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button
            variant="danger"
            disabled={!confirmed}
            onClick={() => { deleteClass(className); onClose(); }}
            data-testid="delete-class-confirm"
          >
            Xoá vĩnh viễn
          </Button>
        </>
      )}
    >
      <div className="space-y-4 text-sm text-brand-ink">
        <p>
          Lớp <b>{className}</b> và <b>{count} học sinh</b> trong lớp (gồm cả em đã lưu trữ) sẽ bị xoá hẳn:
          điểm, Pokémon, lịch sử và tài khoản đăng nhập của các em (nếu có). <b>Không khôi phục được.</b>
        </p>
        <label className="block space-y-1.5">
          <span className="font-bold">Gõ <span className="rounded bg-[#f1efe7] px-1.5 py-0.5 font-mono">{className}</span> để xác nhận</span>
          <input
            autoFocus
            value={typed}
            onChange={event => setTyped(event.target.value)}
            className="h-11 w-full rounded-brand-md border border-[#d9d6ca] px-3 font-semibold focus:border-brand-danger focus:outline-none focus:ring-2 focus:ring-brand-danger/25"
            data-testid="delete-class-input"
          />
        </label>
      </div>
    </Modal>
  );
};
