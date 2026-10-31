import React, { useEffect, useState } from 'react';
import { ArrowRight, CalendarClock, Pencil, School, Trash2, UserPlus, Users } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Button, EmptyState } from '../../components/ui';
import { resetClassSplash } from '../../app/SplashScreen';
import { formatScheduleSlot } from '../../domain/classSchedule';
import { ClassFormModal } from './ClassFormModal';
import { DeleteClassModal } from './DeleteClassModal';

type ClassDialog = { kind: 'create' } | { kind: 'edit'; name: string } | { kind: 'delete'; name: string } | null;

const cardActionClass = 'grid h-9 w-9 place-items-center rounded-full border border-[#e6e2d4] bg-white text-brand-ink/70 shadow-sm transition-colors';

// Trang /class: chọn lớp để vào trang riêng của lớp đó.
export const ClassPickerScreen: React.FC = () => {
  const { classOptions, classroomSettings, students, setFilterClass, handleAddStudent } = useApp();
  const [dialog, setDialog] = useState<ClassDialog>(null);
  // Về trang chọn lớp thì lần vào lớp kế tiếp hiện lại trang loading.
  useEffect(() => { resetClassSplash(); }, []);

  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-brand-forest-deep">Chọn lớp</h2>
          <p className="mt-1 text-[15px] text-brand-ink/70">Mỗi lớp có trang riêng với Random, Cá Ngựa, Vòng quay và Tặng Pokémon.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Users className="h-[18px] w-[18px]" aria-hidden />} onClick={() => setDialog({ kind: 'create' })} data-testid="add-class">Thêm Lớp</Button>
          <Button icon={<UserPlus className="h-[18px] w-[18px]" aria-hidden />} onClick={handleAddStudent}>Thêm Trainer</Button>
        </div>
      </div>

      {classOptions.length === 0 ? (
        <EmptyState
          icon={<School className="h-10 w-10" aria-hidden />}
          title="Chưa có lớp nào."
          description={'Bấm "Thêm Lớp", "Thêm Trainer" hoặc nhập danh sách lớp ở mục Cài đặt.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {classOptions.map(className => {
            const roster = students.filter(student => student.className === className);
            const presentCount = roster.filter(student => !student.isAbsent).length;
            const schedule = classroomSettings.classSchedules[className] || [];
            return (
              <div key={className} className="group relative" data-testid={`class-card-${className}`}>
                <button
                  type="button"
                  aria-label={`Vào lớp ${className}`}
                  onClick={() => setFilterClass(className)}
                  className="flex h-full w-full items-center gap-5 rounded-brand-lg border border-[#e6e2d4] bg-white p-5 text-left shadow-[0_1px_2px_rgba(12,37,39,0.04),0_6px_18px_-8px_rgba(12,37,39,0.14)] transition-[box-shadow,border-color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:border-brand-emerald/60 group-hover:shadow-[0_14px_28px_-10px_rgba(1,74,45,0.28)]"
                >
                  <span className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden break-all rounded-brand-md bg-brand-forest px-1 text-center font-extrabold leading-tight text-brand-cream ${className.length > 3 ? 'text-base' : 'text-2xl'}`}>{className}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xl font-extrabold text-brand-ink">Lớp {className}</span>
                    <span className="mt-1 block text-sm text-brand-ink/70 tabular-nums">
                      {roster.length} trainer · {presentCount} có mặt
                    </span>
                    <span className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-brand-ink/60" data-testid={`class-schedule-${className}`}>
                      <CalendarClock className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                      {schedule.length > 0 ? schedule.map(formatScheduleSlot).join(' · ') : 'Chưa có lịch học'}
                    </span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-brand-forest/50 transition-transform group-hover:translate-x-1 group-hover:text-brand-forest" aria-hidden />
                </button>
                {/* Hiện khi rê chuột/focus; máy cảm ứng (không có hover) luôn hiện. */}
                <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: 'edit', name: className })}
                    aria-label={`Sửa lớp ${className}`}
                    title="Sửa lớp"
                    className={`${cardActionClass} hover:border-brand-emerald/60 hover:text-brand-forest`}
                    data-testid={`edit-class-${className}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: 'delete', name: className })}
                    aria-label={`Xoá lớp ${className}`}
                    title="Xoá lớp"
                    className={`${cardActionClass} hover:border-brand-danger/50 hover:text-brand-danger`}
                    data-testid={`delete-class-${className}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dialog?.kind === 'create' && <ClassFormModal onClose={() => setDialog(null)} />}
      {dialog?.kind === 'edit' && <ClassFormModal originalName={dialog.name} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'delete' && <DeleteClassModal className={dialog.name} onClose={() => setDialog(null)} />}
    </div>
  );
};
