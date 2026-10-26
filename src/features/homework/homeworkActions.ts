import { HomeworkStatus } from '../../types';
import { PokemonUiEvent } from '../../domain/gameEvents';
import { applyHomeworkCheck } from '../../domain/homework';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Kiểm tra bài tập.
export interface HomeworkActions {
  openHomeworkCheck: () => void;
  toggleHomeworkStatus: (studentId: string) => void;
  setHomeworkStatus: (studentId: string, status: HomeworkStatus) => void;
  handleConfirmHomeworkCheck: () => void;
}

export const createHomeworkActions = (appState: AppState, app: AppActions): HomeworkActions => {
  const {
    editingStudent, homeworkLessonDateKey, homeworkStatuses, presentStudents,
    setEditingStudent, setHomeworkStatuses, setPokemonReleaseEvent, setShowHomeworkModal,
    setStudents, showHatchAnnouncement, showPokemonReaction, students
  } = appState;

  const openHomeworkCheck = () => {
    if (presentStudents.length === 0) {
      alert("Không có trainer đang hiện diện để check BTVN.");
      return;
    }
    const defaultStatuses: Record<string, HomeworkStatus> = {};
    presentStudents.forEach(student => {
      defaultStatuses[student.id] = 'done';
    });
    setHomeworkStatuses(defaultStatuses);
    setShowHomeworkModal(true);
  };

  const toggleHomeworkStatus = (studentId: string) => {
    setHomeworkStatuses(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'done' ? 'not-yet' : prev[studentId] === 'not-yet' ? 'missing' : 'done'
    }));
  };

  const setHomeworkStatus = (studentId: string, status: HomeworkStatus) => {
    setHomeworkStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleConfirmHomeworkCheck = () => {
    const timestamp = Date.now();
    const {
      students: updatedStudents,
      uiEvents,
      hatchItems,
      doneCount,
      notYetCount,
      missingCount,
      skippedCount,
      releaseEvent: releaseEventToShow
    } = applyHomeworkCheck(students, {
      presentStudentIds: presentStudents.map(present => present.id),
      statuses: homeworkStatuses,
      timestamp,
      lessonDateKey: homeworkLessonDateKey
    });

    setStudents(updatedStudents);
    if (releaseEventToShow) setPokemonReleaseEvent(releaseEventToShow);
    if (editingStudent) {
      const updatedEditingStudent = updatedStudents.find(student => student.id === editingStudent.id);
      if (updatedEditingStudent) setEditingStudent(updatedEditingStudent);
    }
    setShowHomeworkModal(false);
    setHomeworkStatuses({});

    const summaryEvents: PokemonUiEvent[] = [
      { type: 'bond', message: `${doneCount} Done · ${notYetCount} Not Yet · ${missingCount} Missing${skippedCount ? ` · ${skippedCount} đã chốt` : ''}` },
      ...uiEvents.filter(event => ['xp', 'bond', 'hp', 'streak', 'passive', 'level-up', 'evolution', 'mastery'].includes(event.type)).slice(0, 3)
    ];
    showPokemonReaction(summaryEvents, 'Homework Check đã chốt');
    if (hatchItems.length > 0 && !releaseEventToShow) {
      showHatchAnnouncement(
        hatchItems,
        `Tin vui! Trứng của ${hatchItems.map(item => item.studentName).join(', ')} đã nở sau Homework.`
      );
    }
  };

  return {
    openHomeworkCheck, toggleHomeworkStatus, setHomeworkStatus, handleConfirmHomeworkCheck
  };
};
