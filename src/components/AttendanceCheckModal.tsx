import React from 'react';
import { AttendanceStatus, Student } from '../types';
import { StudentAvatar } from './StudentAvatar';
import { Button, Chip, Modal } from './ui';

interface AttendanceCheckModalProps {
  students: Student[];
  statuses: Record<string, AttendanceStatus>;
  lessonDateKey: string;
  onSetStatus: (studentId: string, status: AttendanceStatus) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const statusStyles: Record<AttendanceStatus, string> = {
  present: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  late: 'border-amber-300 bg-amber-50 text-amber-700',
  absent: 'border-rose-300 bg-rose-50 text-rose-700'
};

const statusLabels: Record<AttendanceStatus, string> = {
  present: 'Có mặt',
  late: 'Muộn',
  absent: 'Vắng'
};

export const AttendanceCheckModal: React.FC<AttendanceCheckModalProps> = ({
  students,
  statuses,
  lessonDateKey,
  onSetStatus,
  onConfirm,
  onClose
}) => {
  const lessonKeyFor = (student: Student) => `${student.className}:${lessonDateKey}`;
  const checkedCount = students.filter(student => student.pokemonProgress?.lastAttendanceLessonKey === lessonKeyFor(student)).length;
  const actionableCount = students.length - checkedCount;
  const presentCount = students.filter(student => student.pokemonProgress?.lastAttendanceLessonKey !== lessonKeyFor(student) && (statuses[student.id] || 'present') === 'present').length;
  const lateCount = students.filter(student => student.pokemonProgress?.lastAttendanceLessonKey !== lessonKeyFor(student) && statuses[student.id] === 'late').length;
  const absentCount = students.filter(student => student.pokemonProgress?.lastAttendanceLessonKey !== lessonKeyFor(student) && statuses[student.id] === 'absent').length;

  return (
    <Modal onClose={onClose} title="Điểm danh" subtitle={`Ngày ${lessonDateKey} · ${students.length} Trainer trong lớp`} icon="✓" size="xl" zIndex="z-[175]" footer={<><div className="mr-auto text-sm font-semibold text-brand-ink/70"><span className="font-bold text-brand-emerald">{presentCount}</span> có mặt · <span className="font-bold text-[#8f5500]">{lateCount}</span> muộn · <span className="font-bold text-brand-danger">{absentCount}</span> vắng · {checkedCount} đã chốt</div><Button disabled={actionableCount <= 0} onClick={onConfirm}>Chốt điểm danh</Button></>}>
        <div className="custom-scrollbar">
          {students.length === 0 ? (
            <p className="py-16 text-center text-sm font-bold text-gray-400">Không có trainer trong lớp hiện tại.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {students.map(student => {
                const lessonKey = lessonKeyFor(student);
                const alreadyChecked = student.pokemonProgress?.lastAttendanceLessonKey === lessonKey;
                const status = statuses[student.id] || student.attendanceStatus || (student.isAbsent ? 'absent' : 'present');

                return (
                  <div
                    key={student.id}
                    className={`flex min-w-0 flex-col items-stretch gap-3 rounded-brand-md border p-3 text-left transition-colors ${
                      alreadyChecked ? 'border-[#d9d6ca] bg-[#f1efe7] opacity-70' : statusStyles[status]
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <StudentAvatar student={student} className="h-12 w-12 shrink-0 rounded-2xl border border-white shadow-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-gray-900">{student.name}</p>
                        <p className="truncate text-xs font-bold text-gray-500">{student.className}</p>
                      </div>
                    </div>
                    {alreadyChecked ? (
                      <Chip tone="neutral">Đã chốt</Chip>
                    ) : (
                      <div className="grid grid-cols-3 gap-1">
                        {(['present', 'late', 'absent'] as AttendanceStatus[]).map(value => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => onSetStatus(student.id, value)}
                            className={`whitespace-nowrap rounded-full border px-0.5 py-1.5 text-[11px] font-bold transition-colors ${
                              status === value ? statusStyles[value] : 'border-[#d9d6ca] bg-white text-brand-ink/60 hover:text-brand-ink'
                            }`}
                          >
                            {statusLabels[value]}
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
