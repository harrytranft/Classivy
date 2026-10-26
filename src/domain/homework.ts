import { HistoryItem, HomeworkStatus, PokemonReleaseEvent, Student } from '../types';
import { HatchAnnouncementItem } from '../types/app';
import { PokemonUiEvent, applyGameEventToStudent, applyPetHpDeltaToStudent } from './gameEvents';
import { normalizeStudentPokemonData } from './pokemonProgression';
import { addWeeklyChestProgress, advanceEggForStudent, applyTrainerJourneyProgress } from './progression';

// Phần tính toán của "Check Homework" (trước đây nằm trong handleConfirmHomeworkCheck).
// Done: +8 Hào Quang, ấp trứng +8, Pokémon +8 HP, Trainer +10 XP, rương tuần +15.
// Missing: -10 Hào Quang, Pokémon -10 HP. Not yet: không đổi điểm.
// Mỗi lớp chỉ chốt một lần mỗi ngày (lastHomeworkLessonKey); học sinh vắng không được chấm.

export interface HomeworkCheckInput {
  presentStudentIds: string[];
  statuses: Record<string, HomeworkStatus>;
  timestamp: number;
  lessonDateKey: string;
}

export interface HomeworkCheckResult {
  students: Student[];
  uiEvents: PokemonUiEvent[];
  hatchItems: HatchAnnouncementItem[];
  doneCount: number;
  notYetCount: number;
  missingCount: number;
  skippedCount: number;
  releaseEvent: PokemonReleaseEvent | null;
}

export const applyHomeworkCheck = (students: Student[], input: HomeworkCheckInput): HomeworkCheckResult => {
  const { presentStudentIds, statuses, timestamp, lessonDateKey } = input;
  const uiEvents: PokemonUiEvent[] = [];
  const hatchItems: HatchAnnouncementItem[] = [];
  let doneCount = 0;
  let notYetCount = 0;
  let missingCount = 0;
  let skippedCount = 0;
  let releaseEventToShow: PokemonReleaseEvent | null = null;

  const updatedStudents = students.map(student => {
    if (!presentStudentIds.includes(student.id)) return student;

    const lessonKey = `${student.className}:${lessonDateKey}`;
    if (student.pokemonProgress?.lastHomeworkLessonKey === lessonKey) {
      skippedCount += 1;
      return student;
    }

    const status = statuses[student.id] || 'done';
    const baseStudent = normalizeStudentPokemonData(student);
    const historyItem: HistoryItem = {
      id: timestamp.toString() + Math.random(),
      amount: status === 'done' ? 8 : status === 'missing' ? -10 : 0,
      reason: status === 'done'
        ? `📚 Homework Done (${lessonDateKey}) (+8 Hào Quang, Pokémon +8 HP)`
        : status === 'missing'
          ? `📚 Homework Missing (${lessonDateKey}) (-10 Hào Quang, Pokémon -10 HP)`
          : `📚 Homework Not Yet (${lessonDateKey})`,
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

  return {
    students: updatedStudents,
    uiEvents,
    hatchItems,
    doneCount,
    notYetCount,
    missingCount,
    skippedCount,
    releaseEvent: releaseEventToShow
  };
};
