import { AttendanceStatus, HistoryItem, PokemonReleaseEvent, Student } from '../../types';
import { getLocalDateKey } from '../../domain/dates';
import { PokemonUiEvent, applyPetHpDeltaToStudent } from '../../domain/gameEvents';
import { HatchAnnouncementItem } from '../../types/app';
import { normalizeStudentPokemonData } from '../../domain/pokemonProgression';
import { ensureActiveExpedition } from '../../domain/expeditionSystem';
import { addWeeklyChestProgress, advanceEggForStudent, applyTrainerJourneyProgress } from '../../domain/progression';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Điểm danh.
export interface AttendanceActions {
  openAttendanceCheck: () => void;
  setAttendanceStatus: (studentId: string, status: AttendanceStatus) => void;
  handleConfirmAttendanceCheck: () => void;
}

export const createAttendanceActions = (appState: AppState, app: AppActions): AttendanceActions => {
  const {
    attendanceStatuses, currentClassStudents, editingStudent, randomStudent,
    setAttendanceStatuses, setEditingStudent, setPokemonReleaseEvent, setRandomStudent,
    setShowAttendanceModal, setStudents, showHatchAnnouncement, showPokemonReaction, students
  } = appState;

  const openAttendanceCheck = () => {
    if (currentClassStudents.length === 0) {
      alert("Không có trainer trong lớp hiện tại để check đi học.");
      return;
    }
    const defaultStatuses: Record<string, AttendanceStatus> = {};
    currentClassStudents.forEach(student => {
      defaultStatuses[student.id] = student.attendanceStatus || (student.isAbsent ? 'absent' : 'present');
    });
    setAttendanceStatuses(defaultStatuses);
    setShowAttendanceModal(true);
  };

  const setAttendanceStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleConfirmAttendanceCheck = () => {
    const timestamp = Date.now();
    const lessonKeySuffix = getLocalDateKey();
    const uiEvents: PokemonUiEvent[] = [];
    const hatchItems: HatchAnnouncementItem[] = [];
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let skippedCount = 0;
    let releaseEventToShow: PokemonReleaseEvent | null = null;

    const updatedStudents = students.map(student => {
      if (!currentClassStudents.some(classStudent => classStudent.id === student.id)) return student;

      const lessonKey = `${student.className}:${lessonKeySuffix}`;
      if (student.pokemonProgress?.lastAttendanceLessonKey === lessonKey) {
        skippedCount += 1;
        return student;
      }

      const status = attendanceStatuses[student.id] || 'present';
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

    setStudents(updatedStudents);
    if (releaseEventToShow) setPokemonReleaseEvent(releaseEventToShow);
    if (editingStudent) {
      const updatedEditingStudent = updatedStudents.find(student => student.id === editingStudent.id);
      if (updatedEditingStudent) setEditingStudent(updatedEditingStudent);
    }
    if (randomStudent) {
      const updatedRandomStudent = updatedStudents.find(student => student.id === randomStudent.id);
      if (updatedRandomStudent) setRandomStudent(updatedRandomStudent);
    }
    setShowAttendanceModal(false);
    setAttendanceStatuses({});

    if (hatchItems.length > 0 && !releaseEventToShow) {
      showHatchAnnouncement(
        hatchItems,
        `Tin vui! Trứng của ${hatchItems.map(item => item.studentName).join(', ')} đã nở sau điểm chuyên cần.`
      );
    }

    showPokemonReaction(
      [
        { type: 'bond', message: `${presentCount} Có mặt · ${lateCount} Muộn · ${absentCount} Vắng${skippedCount ? ` · ${skippedCount} đã chốt` : ''}` },
        ...uiEvents.slice(0, 3)
      ],
      'Check đi học đã chốt'
    );
  };

  return {
    openAttendanceCheck, setAttendanceStatus, handleConfirmAttendanceCheck
  };
};
