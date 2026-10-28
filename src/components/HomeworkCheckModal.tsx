import React from 'react';
import { HomeworkStatus, Student } from '../types';
import { StudentAvatar } from './StudentAvatar';
import { Button, Chip, Modal } from './ui';

export type { HomeworkStatus };

interface HomeworkCheckModalProps {
  students: Student[];
  statuses: Record<string, HomeworkStatus>;
  lessonDateKey: string;
  onToggle: (studentId: string) => void;
  onSetStatus: (studentId: string, status: HomeworkStatus) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const HomeworkCheckModal: React.FC<HomeworkCheckModalProps> = ({
  students,
  statuses,
  lessonDateKey,
  onToggle,
  onSetStatus,
  onConfirm,
  onClose
}) => {
  const checkedCount = students.filter(student => student.pokemonProgress?.lastHomeworkLessonKey === `${student.className}:${lessonDateKey}`).length;
  const actionableCount = students.length - checkedCount;
  const doneCount = students.filter(student => {
    const lessonKey = `${student.className}:${lessonDateKey}`;
    return student.pokemonProgress?.lastHomeworkLessonKey !== lessonKey && (statuses[student.id] || 'done') === 'done';
  }).length;
  const notYetCount = students.filter(student => {
    const lessonKey = `${student.className}:${lessonDateKey}`;
    return student.pokemonProgress?.lastHomeworkLessonKey !== lessonKey && statuses[student.id] === 'not-yet';
  }).length;
  const missingCount = students.filter(student => {
    const lessonKey = `${student.className}:${lessonDateKey}`;
    return student.pokemonProgress?.lastHomeworkLessonKey !== lessonKey && statuses[student.id] === 'missing';
  }).length;

  return (
    <Modal onClose={onClose} title="Kiểm tra bài tập" subtitle={`Ngày ${lessonDateKey} · ${students.length} Trainer đang có mặt`} icon="✎" size="xl" zIndex="z-[180]" footer={<><div className="mr-auto text-sm font-semibold text-brand-ink/70"><span className="font-bold text-brand-emerald">{doneCount}</span> hoàn thành · <span className="font-bold text-[#8f5500]">{notYetCount}</span> chưa xong · <span className="font-bold text-brand-danger">{missingCount}</span> chưa làm · {actionableCount} chưa chốt</div><Button disabled={actionableCount <= 0} onClick={onConfirm}>Chốt bài tập</Button></>}>
        <div className="custom-scrollbar">
          {students.length === 0 ? (
            <p className="py-16 text-center text-sm font-bold text-gray-400">Không có trainer đang hiện diện để check BTVN.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {students.map(student => {
                const lessonKey = `${student.className}:${lessonDateKey}`;
                const alreadyChecked = student.pokemonProgress?.lastHomeworkLessonKey === lessonKey;
                const status = alreadyChecked ? 'locked' : (statuses[student.id] || 'done');

                return (
                  <div
                    key={student.id}
                    onClick={() => {
                      if (!alreadyChecked) onToggle(student.id);
                    }}
                    className={`flex min-w-0 cursor-pointer flex-col items-stretch gap-3 rounded-brand-md border p-3 text-left transition-colors ${
                      status === 'locked'
                        ? 'border-gray-200 bg-gray-50 opacity-70'
                        : status === 'missing'
                          ? 'border-rose-300 bg-rose-50 hover:border-rose-500'
                          : status === 'not-yet'
                            ? 'border-amber-300 bg-amber-50 hover:border-amber-500'
                            : 'border-emerald-200 bg-emerald-50 hover:border-emerald-500'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <StudentAvatar student={student} className="h-12 w-12 shrink-0 rounded-2xl border border-white shadow-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-gray-900">{student.name}</p>
                        <p className="truncate text-xs font-bold text-gray-500">{student.className}</p>
                      </div>
                    </div>
                    {status === 'locked' ? (
                      <Chip tone="neutral">Đã chốt</Chip>
                    ) : (
                      <div className="grid grid-cols-3 gap-1">
                        {([
                          ['done', 'Hoàn thành', 'bg-brand-emerald text-white border-brand-emerald'],
                          ['not-yet', 'Chưa xong', 'bg-brand-gold text-brand-forest-deep border-brand-gold'],
                          ['missing', 'Chưa làm', 'bg-brand-danger text-white border-brand-danger']
                        ] as const).map(([value, label, activeClass]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={event => {
                              event.stopPropagation();
                              onSetStatus(student.id, value);
                            }}
                            className={`whitespace-nowrap rounded-full border px-0.5 py-1.5 text-[11px] font-bold transition-colors ${
                              status === value ? activeClass : 'border-[#d9d6ca] bg-white text-brand-ink/60 hover:text-brand-ink'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </Modal>
  );
};
