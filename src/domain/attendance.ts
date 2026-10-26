import { AttendanceStatus, HistoryItem, PokemonReleaseEvent, Student } from '../types';
import { HatchAnnouncementItem } from '../types/app';
import { PokemonUiEvent, applyPetHpDeltaToStudent } from './gameEvents';
import { normalizeStudentPokemonData } from './pokemonProgression';
import { addWeeklyChestProgress, advanceEggForStudent, applyTrainerJourneyProgress } from './progression';
import { ensureActiveExpedition } from './expeditionSystem';

// Phần tính toán của "Check đi học" (trước đây nằm trong handleConfirmAttendanceCheck).
// Có mặt: +5 Hào Quang, Pokémon +5 HP, streak, Trainer +5 XP, rương tuần +10, bắt đầu expedition.
// Muộn: -5 Hào Quang, Pokémon -5 HP, vẫn tính streak. Vắng: không cộng trừ, streak về 0.
// Mỗi lớp chỉ chốt một lần mỗi ngày (lastAttendanceLessonKey).

export interface AttendanceCheckInput {
  classStudentIds: string[];
  statuses: Record<string, AttendanceStatus>;
  timestamp: number;
  lessonKeySuffix: string;
}

export interface AttendanceCheckResult {
  students: Student[];
  uiEvents: PokemonUiEvent[];
  hatchItems: HatchAnnouncementItem[];
  presentCount: number;
  lateCount: number;
  absentCount: number;
  skippedCount: number;
  releaseEvent: PokemonReleaseEvent | null;
}

export const applyAttendanceCheck = (students: Student[], input: AttendanceCheckInput): AttendanceCheckResult => {
  const { classStudentIds, statuses, timestamp, lessonKeySuffix } = input;
  const uiEvents: PokemonUiEvent[] = [];
  const hatchItems: HatchAnnouncementItem[] = [];
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let skippedCount = 0;
  let releaseEventToShow: PokemonReleaseEvent | null = null;

  const updatedStudents = students.map(student => {
    if (!classStudentIds.includes(student.id)) return student;

    const lessonKey = `${student.className}:${lessonKeySuffix}`;
    if (student.pokemonProgress?.lastAttendanceLessonKey === lessonKey) {
      skippedCount += 1;
      return student;
    }

    const status = statuses[student.id] || 'present';
    const baseStudent = normalizeStudentPokemonData(student);
    const currentProgress = baseStudent.pokemonProgress!;
    const pointDelta = status === 'present' ? 5 : status === 'late' ? -5 : 0;
    const nextAttendanceStreak = status === 'absent' ? 0 : (currentProgress.attendanceStreak || 0) + 1;
    const nextProgress = {
      ...currentProgress,
      attendanceStreak: nextAttendanceStreak,
      bestAttendanceStreak: Math.max(currentProgress.bestAttendanceStreak || 0, nextAttendanceStreak),
      lastAttendanceLessonKey: lessonKey
    };
    const label = status === 'present' ? 'Có mặt' : status === 'late' ? 'Muộn' : 'Vắng';
    const historyItem: HistoryItem = {
      id: `${timestamp}${Math.random()}`,
      amount: pointDelta,
      reason: status === 'present'
        ? `🧭 Đi học Có mặt (${lessonKeySuffix}) (+5 Hào Quang, Pokémon +5 HP)`
        : status === 'late'
          ? `🧭 Đi học Muộn (${lessonKeySuffix}) (-5 Hào Quang, Pokémon -5 HP)`
          : `🧭 Đi học Vắng (${lessonKeySuffix})`,
      timestamp
    };

    if (status === 'present') presentCount += 1;
    if (status === 'late') lateCount += 1;
    if (status === 'absent') absentCount += 1;

    let resultStudent: Student = {
      ...baseStudent,
      points: baseStudent.points + pointDelta,
      pokemonProgress: nextProgress,
      isAbsent: status === 'absent',
      attendanceStatus: status,
      history: [historyItem, ...baseStudent.history].slice(0, 50)
    };

    if (pointDelta > 0) {
      const eggResult = advanceEggForStudent(resultStudent, pointDelta);
      resultStudent = eggResult.student;
      if (eggResult.hatchedPet) {
        hatchItems.push({ studentId: student.id, studentName: student.name, pet: eggResult.hatchedPet });
      }
    }

    if (resultStudent.pet && pointDelta !== 0) {
      const hpUpdate = applyPetHpDeltaToStudent(
        resultStudent,
        pointDelta,
        `Đi học ${label}: ${pointDelta > 0 ? 'hồi' : 'mất'} ${Math.abs(pointDelta)} HP`
      );
      resultStudent = hpUpdate.student;
      if (hpUpdate.releaseEvent && !releaseEventToShow) releaseEventToShow = hpUpdate.releaseEvent;
      uiEvents.push({ type: 'hp', message: `${student.name}: Pokémon ${pointDelta > 0 ? '+' : ''}${pointDelta} HP` });
    }

    if (status !== 'absent') {
      uiEvents.push({ type: 'streak', message: `${student.name}: streak đi học ${nextAttendanceStreak}` });
    }

    if (status === 'present') {
      resultStudent = applyTrainerJourneyProgress(resultStudent, 5, timestamp, uiEvents, 'Attendance');
      resultStudent = addWeeklyChestProgress(resultStudent, 10);
    }

    if (status !== 'absent') {
      resultStudent = ensureActiveExpedition(resultStudent, timestamp);
    }

    return resultStudent;
  });

  return {
    students: updatedStudents,
    uiEvents,
    hatchItems,
    presentCount,
    lateCount,
    absentCount,
    skippedCount,
    releaseEvent: releaseEventToShow
  };
};
