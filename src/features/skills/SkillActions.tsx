import React, { useState } from 'react';
import { Button, Modal } from '../../components/ui';
import { useApp } from '../../app/AppContext';
import { Student } from '../../types';
import { RESCUE_MAX_POINTS, SKILL_IDS, applyRescue, applySoulLink, consumeSkillUse, getRescueLimit, hasUsableSkill, isPenalizedToday } from '../../domain/skills';

// Phase 11, nhóm D: skill dùng ngoài Random. Nút hiện dưới thẻ học sinh khi em có skill; hộp thoại mở ở cấp trang lớp.

export type SkillAction =
  | { type: 'rapid'; studentId: string }
  | { type: 'soul'; studentId: string }
  | { type: 'rescue'; studentId: string };

const sameClass = (students: Student[], student: Student) => students.filter(item => item.className === student.className && item.id !== student.id);

/** Hàng nút dưới một thẻ học sinh; không hiện gì nếu không có skill phù hợp (D36). */
export const SkillActionButtons: React.FC<{ student: Student; students: Student[]; onAction: (action: SkillAction) => void }> = ({ student, students, onAction }) => {
  const canRescue = isPenalizedToday(student, Date.now()) && sameClass(students, student).some(item => getRescueLimit(item) > 0);
  const canRapid = hasUsableSkill(student, SKILL_IDS.rapid);
  const canSoul = hasUsableSkill(student, SKILL_IDS.soulLink);
  if (!canRescue && !canRapid && !canSoul) return null;
  const chip = 'rounded-full border border-brand-gold/70 bg-brand-gold-light px-3 py-1.5 text-[13px] font-extrabold text-brand-forest-deep shadow-sm transition-transform hover:scale-105';
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" aria-label={`Skill của ${student.name}`}>
      {canRapid && <button type="button" className={chip} onClick={() => onAction({ type: 'rapid', studentId: student.id })}>⚡ Ưu tiên phát biểu</button>}
      {canSoul && <button type="button" className={chip} onClick={() => onAction({ type: 'soul', studentId: student.id })}>🔗 Đồng Tâm Hiệp Lực</button>}
      {canRescue && <button type="button" className={chip} onClick={() => onAction({ type: 'rescue', studentId: student.id })}>🤝 Cứu viện</button>}
    </div>
  );
};

export const SkillActionDialogs: React.FC<{ action: SkillAction | null; onClose: () => void }> = ({ action, onClose }) => {
  const { setStudents, students } = useApp();
  const [announced, setAnnounced] = useState<Student | null>(null);
  const [rescuerId, setRescuerId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const close = () => { setAnnounced(null); setRescuerId(null); setMessage(null); onClose(); };

  if (announced) {
    return (
      <Modal onClose={close} hideClose size="lg" zIndex="z-[270]" closeOnBackdrop={false}
        footer={<Button onClick={close}>Xong</Button>}>
        <div role="status" className="py-8 text-center">
          <p className="text-6xl" aria-hidden>⚡</p>
          <p className="mt-4 text-sm font-bold text-brand-ink/70">Cướp Quyền Tranh Đoạt</p>
          <p className="mt-2 text-5xl font-extrabold leading-tight text-brand-forest-deep sm:text-7xl">{announced.name}</p>
          <p className="mt-4 text-xl font-bold text-brand-ink">được phát biểu trước!</p>
        </div>
      </Modal>
    );
  }
  if (!action) return null;
  const student = students.find(item => item.id === action.studentId);
  if (!student) return null;
  const classmates = sameClass(students, student);

  if (action.type === 'rapid') {
    const confirm = () => {
      const next = consumeSkillUse(student, SKILL_IDS.rapid, 'Cướp Quyền Tranh Đoạt', 'được phát biểu trước');
      setStudents(prev => prev.map(item => (item.id === next.id ? next : item)));
      setAnnounced(next);
    };
    return (
      <Modal onClose={close} title="Cướp Quyền Tranh Đoạt" size="sm" zIndex="z-[270]"
        footer={<><Button variant="secondary" onClick={close}>Không</Button><Button variant="reward" onClick={confirm}>Dùng skill</Button></>}>
        <p className="text-base text-brand-ink">{student.name} muốn ưu tiên phát biểu đầu tiên? Tên em sẽ hiện lớn trên màn hình lớp và trừ 1 lượt skill.</p>
      </Modal>
    );
  }

  if (action.type === 'soul') {
    const choose = (partner: Student) => {
      const next = applySoulLink(student, partner);
      if (next) setStudents(prev => prev.map(item => (item.id === next.id ? next : item)));
      close();
    };
    return (
      <Modal onClose={close} title="Đồng Tâm Hiệp Lực" subtitle={`${student.name} được cộng ké 1 điểm khi bạn cùng làm trả lời đúng`} size="sm" zIndex="z-[270]">
        <p className="mb-3 text-sm font-bold text-brand-ink">Bạn vừa trả lời đúng là ai?</p>
        <div className="flex max-h-72 flex-wrap gap-1.5 overflow-y-auto">
          {classmates.map(item => <Button key={item.id} size="sm" variant="secondary" onClick={() => choose(item)}>{item.name}</Button>)}
          {classmates.length === 0 && <p className="text-sm text-brand-ink/70">Lớp chưa có bạn nào khác.</p>}
        </div>
      </Modal>
    );
  }

  // Cứu viện: chọn em đang có Hộ Tống, rồi số điểm.
  const rescuers = classmates.filter(item => getRescueLimit(item) > 0);
  const rescuer = rescuers.find(item => item.id === rescuerId);
  const give = (amount: number) => {
    if (!rescuer) return;
    const result = applyRescue(rescuer, student, amount);
    if (!result) { setMessage('Chưa cứu viện được. Kiểm tra lại số điểm nhé.'); return; }
    setStudents(prev => prev.map(item => (item.id === result.rescuer.id ? result.rescuer : item.id === result.rescuee.id ? result.rescuee : item)));
    close();
  };
  return (
    <Modal onClose={close} title="Hộ Tống Đồng Đội" subtitle={`Cứu viện ${student.name}: tặng tối đa ${RESCUE_MAX_POINTS} điểm của mình`} size="sm" zIndex="z-[270]">
      {message && <p role="alert" className="mb-3 text-sm font-semibold text-brand-danger">{message}</p>}
      {!rescuer ? (
        <>
          <p className="mb-3 text-sm font-bold text-brand-ink">Ai dùng Hộ Tống để cứu viện?</p>
          <div className="flex max-h-72 flex-wrap gap-1.5 overflow-y-auto">
            {rescuers.map(item => <Button key={item.id} size="sm" variant="secondary" onClick={() => setRescuerId(item.id)}>{item.name} ({item.points} điểm)</Button>)}
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm font-bold text-brand-ink">{rescuer.name} tặng bao nhiêu điểm cho {student.name}?</p>
          <div className="flex gap-2">
            {Array.from({ length: getRescueLimit(rescuer) }, (_, index) => index + 1).map(points => (
              <Button key={points} variant="reward" onClick={() => give(points)}>{points} điểm</Button>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
};
