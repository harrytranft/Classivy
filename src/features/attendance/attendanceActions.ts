import { AttendanceStatus } from '../../types';
import { getLocalDateKey } from '../../domain/dates';
import { applyAttendanceCheck } from '../../domain/attendance';
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
    const {
      students: updatedStudents,
      uiEvents,
      hatchItems,
      presentCount,
      lateCount,
      absentCount,
      skippedCount,
      releaseEvent: releaseEventToShow
    } = applyAttendanceCheck(students, {
      classStudentIds: currentClassStudents.map(classStudent => classStudent.id),
      statuses: attendanceStatuses,
      timestamp,
      lessonKeySuffix
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
