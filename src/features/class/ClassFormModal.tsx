import React, { useState } from 'react';
import { CalendarPlus, Trash2 } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Button, Modal } from '../../components/ui';
import { ClassScheduleSlot } from '../../types';
import { WEEKDAYS } from '../../domain/classSchedule';

// Hộp thoại Thêm lớp / Sửa lớp: tên lớp và các buổi học trong tuần (thêm, sửa, xoá buổi).
const inputClass = 'h-11 rounded-brand-md border border-[#d9d6ca] bg-white px-3 text-sm font-semibold text-brand-ink focus:border-brand-emerald focus:outline-none focus:ring-2 focus:ring-brand-emerald/30';

/** Id buổi học mới, không trùng các buổi đang có. */
const newSlotId = (taken: ClassScheduleSlot[]) => {
  const base = `slot-${Date.now().toString(36)}`;
  let index = taken.length + 1;
  while (taken.some(slot => slot.id === `${base}-${index}`)) index += 1;
  return `${base}-${index}`;
};

interface ClassFormModalProps {
  /** Tên lớp đang sửa; không có = thêm lớp mới. */
  originalName?: string;
  onClose: () => void;
}

export const ClassFormModal: React.FC<ClassFormModalProps> = ({ originalName, onClose }) => {
  const { classroomSettings, saveClass } = useApp();
  const isEdit = originalName !== undefined;
  const [name, setName] = useState(originalName ?? '');
  const [slots, setSlots] = useState<ClassScheduleSlot[]>(() =>
    (originalName !== undefined ? classroomSettings.classSchedules[originalName] || [] : []).map(slot => ({ ...slot }))
  );
  const [error, setError] = useState<string | null>(null);
  const offset = classroomSettings.wildHunt.startOffsetMinutes;

  const updateSlot = (id: string, patch: Partial<ClassScheduleSlot>) =>
    setSlots(prev => prev.map(slot => (slot.id === id ? { ...slot, ...patch } : slot)));

  const addSlot = () => setSlots(prev => {
    // Buổi mới lấy giờ của buổi cuối cùng cho nhanh (lớp thường học cùng giờ nhiều ngày).
    const last = prev[prev.length - 1];
    return [...prev, { id: newSlotId(prev), weekday: last ? Math.min(7, last.weekday + 1) : 1, start: last?.start ?? '', end: last?.end ?? '' }];
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = saveClass({ originalName, name, slots });
    if (result) setError(result);
    else onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title={isEdit ? `Sửa lớp ${originalName}` : 'Thêm lớp'}
      subtitle={`Pokémon hoang dã xuất hiện ngẫu nhiên từ ${offset} phút sau giờ bắt đầu tới hết buổi học.`}
      icon="🏫"
      size="lg"
      closeOnBackdrop={false}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button type="submit" form="class-form" data-testid="class-form-save">{isEdit ? 'Lưu thay đổi' : 'Thêm lớp'}</Button>
        </>
      )}
    >
      <form id="class-form" onSubmit={submit} className="space-y-5" data-testid="class-form">
        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-brand-ink">Tên lớp</span>
          <input
            autoFocus
            value={name}
            onChange={event => { setName(event.target.value); setError(null); }}
            maxLength={40}
            placeholder="Ví dụ: SPK, 6A"
            className={`${inputClass} w-full`}
            data-testid="class-form-name"
          />
          {isEdit && name.trim() && name.trim() !== originalName && (
            <span className="block text-xs text-brand-ink/70">Đổi tên lớp sẽ chuyển tất cả học sinh của lớp sang tên mới.</span>
          )}
        </label>

        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-bold text-brand-ink">Lịch học</legend>
          {slots.length === 0 && (
            <p className="rounded-brand-md border border-dashed border-[#d9d6ca] p-3 text-sm text-brand-ink/70">
              Chưa có buổi học nào. Thêm ít nhất một buổi để Pokémon hoang dã có thể xuất hiện.
            </p>
          )}
          {slots.map((slot, index) => (
            <div key={slot.id} className="flex flex-wrap items-center gap-2 rounded-brand-md border border-[#e6e2d4] bg-[#fbfaf5] p-2.5" data-testid="class-form-slot">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-forest/10 text-xs font-extrabold text-brand-forest" aria-hidden>{index + 1}</span>
              <select
                value={slot.weekday}
                onChange={event => { updateSlot(slot.id, { weekday: Number(event.target.value) }); setError(null); }}
                aria-label={`Ngày học buổi ${index + 1}`}
                className={`${inputClass} w-36`}
              >
                {WEEKDAYS.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}
              </select>
              <input
                type="time"
                value={slot.start}
                onChange={event => { updateSlot(slot.id, { start: event.target.value }); setError(null); }}
                aria-label={`Giờ bắt đầu buổi ${index + 1}`}
                className={`${inputClass} w-[9.5rem]`}
              />
              <span className="text-sm text-brand-ink/60">đến</span>
              <input
                type="time"
                value={slot.end}
                onChange={event => { updateSlot(slot.id, { end: event.target.value }); setError(null); }}
                aria-label={`Giờ kết thúc buổi ${index + 1}`}
                className={`${inputClass} w-[9.5rem]`}
              />
              <button
                type="button"
                onClick={() => { setSlots(prev => prev.filter(item => item.id !== slot.id)); setError(null); }}
                aria-label={`Xoá buổi ${index + 1}`}
                title="Xoá buổi này"
                className="ml-auto grid h-10 w-10 place-items-center rounded-full text-brand-ink/60 transition-colors hover:bg-brand-danger/10 hover:text-brand-danger"
              >
                <Trash2 className="h-[18px] w-[18px]" aria-hidden />
              </button>
            </div>
          ))}
          <Button variant="secondary" size="sm" icon={<CalendarPlus className="h-4 w-4" aria-hidden />} onClick={addSlot} data-testid="class-form-add-slot">
            Thêm buổi học
          </Button>
        </fieldset>

        {error && <p role="alert" className="rounded-brand-md border border-brand-danger/30 bg-brand-danger/5 p-3 text-sm font-bold text-brand-danger" data-testid="class-form-error">{error}</p>}
      </form>
    </Modal>
  );
};
