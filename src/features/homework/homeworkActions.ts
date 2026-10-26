import { HomeworkStatus } from '../../components/HomeworkCheckModal';
import { PokemonUiEvent, applyGameEventToStudent, applyPetHpDeltaToStudent } from '../../domain/gameEvents';
import { HatchAnnouncementItem } from '../../types/app';
import { HistoryItem, PokemonReleaseEvent } from '../../types';
import { normalizeStudentPokemonData } from '../../domain/pokemonProgression';
import { addWeeklyChestProgress, advanceEggForStudent, applyTrainerJourneyProgress } from '../../domain/progression';
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
    const uiEvents: PokemonUiEvent[] = [];
    const hatchItems: HatchAnnouncementItem[] = [];
    let doneCount = 0;
    let notYetCount = 0;
    let missingCount = 0;
    let skippedCount = 0;
    let releaseEventToShow: PokemonReleaseEvent | null = null;

    const updatedStudents = students.map(student => {
      if (!presentStudents.some(present => present.id === student.id)) return student;

      const lessonKey = `${student.className}:${homeworkLessonDateKey}`;
      if (student.pokemonProgress?.lastHomeworkLessonKey === lessonKey) {
        skippedCount += 1;
        return student;
      }

      const status = homeworkStatuses[student.id] || 'done';
      const baseStudent = normalizeStudentPokemonData(student);
      const historyItem: HistoryItem = {
        id: timestamp.toString() + Math.random(),
        amount: status === 'done' ? 8 : status === 'missing' ? -10 : 0,
        reason: status === 'done'
          ? `📚 Homework Done (${homeworkLessonDateKey}) (+8 Hào Quang, Pokémon +8 HP)`
          : status === 'missing'
            ? `📚 Homework Missing (${homeworkLessonDateKey}) (-10 Hào Quang, Pokémon -10 HP)`
            : `📚 Homework Not Yet (${homeworkLessonDateKey})`,
        timestamp
      };

      if (status === 'not-yet') {
        notYetCount += 1;
        return baseStudent;
      }

      if (status === 'missing') {
        missingCount += 1;
        const result = applyGameEventToStudent(baseStudent, {
          type: 'HOMEWORK_MISSING',
          source: 'homework',
          studentId: student.id,
          lessonKey,
          timestamp
        });
        let resultStudent = {
          ...result.student,
          points: result.student.points - 10
        };
        if (resultStudent.pet) {
          const hpUpdate = applyPetHpDeltaToStudent(resultStudent, -10, 'Homework Missing: mất 10 HP');
          resultStudent = hpUpdate.student;
          if (hpUpdate.releaseEvent && !releaseEventToShow) releaseEventToShow = hpUpdate.releaseEvent;
          uiEvents.push({ type: 'hp', message: `${student.name}: Pokémon -10 HP` });
        }
        return {
          ...resultStudent,
          history: [historyItem, ...resultStudent.history].slice(0, 50)
        };
      }

      doneCount += 1;
      const rewardedStudent = {
        ...baseStudent,
        points: baseStudent.points + 8
      };
      const result = applyGameEventToStudent(baseStudent, {
        type: 'HOMEWORK_COMPLETE',
        source: 'homework',
        studentId: student.id,
        lessonKey,
        timestamp
      });
      let resultStudent = {
        ...result.student,
        points: rewardedStudent.points
      };
      const eggResult = advanceEggForStudent(resultStudent, 8);
      resultStudent = eggResult.student;
      if (eggResult.hatchedPet) {
        uiEvents.push({ type: 'evolution', message: `${student.name}: trứng đã nở` });
        hatchItems.push({ studentId: student.id, studentName: student.name, pet: eggResult.hatchedPet });
      }
      if (resultStudent.pet) {
        const hpUpdate = applyPetHpDeltaToStudent(resultStudent, 8, 'Homework Done: hồi 8 HP');
        resultStudent = hpUpdate.student;
        uiEvents.push({ type: 'hp', message: `${student.name}: Pokémon +8 HP` });
      }
      uiEvents.push(...result.uiEvents);
      resultStudent = applyTrainerJourneyProgress(resultStudent, 10, timestamp, uiEvents, 'Homework Done');
      resultStudent = addWeeklyChestProgress(resultStudent, 15);

      return {
        ...resultStudent,
        history: [historyItem, ...resultStudent.history].slice(0, 50)
      };
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
