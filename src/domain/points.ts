import { Gender, HistoryItem, PokemonReleaseEvent, RankInfo, Student } from '../types';
import { HatchAnnouncementItem } from '../types/app';
import { GameEventSource, PokemonUiEvent, applyGameEventToStudent, applyPetHpDeltaToStudent } from './gameEvents';
import { normalizeStudentPokemonData } from './pokemonProgression';
import { addWeeklyChestProgress, advanceEggForStudent, applyTrainerJourneyProgress } from './progression';

// Phần tính toán của "cộng/trừ điểm Hào Quang" (trước đây nằm trong handleUpdatePoints).
// Hàm thuần: nhận danh sách học sinh, trả danh sách mới và các sự kiện để giao diện hiển thị.

export interface PointsUpdateInput {
  ids: string[];
  amount: number;
  reason: string;
  source: GameEventSource;
  getRank: (points: number, gender: Gender) => RankInfo;
}

/** Đổi cấp bậc khi chỉ chấm điểm cho 1 học sinh: giao diện gọi Gemini để viết "thánh chỉ". */
export interface RankChange {
  studentName: string;
  newTitle: string;
  promoted: boolean;
}

export interface PointsUpdateResult {
  students: Student[];
  hatchItems: HatchAnnouncementItem[];
  evolvedMessages: string[];
  progressionEvents: PokemonUiEvent[];
  releaseEvent: PokemonReleaseEvent | null;
  rankChanges: RankChange[];
}

export const applyPointsToStudents = (students: Student[], input: PointsUpdateInput): PointsUpdateResult => {
  const { ids, amount, reason, source, getRank } = input;
  let hatchItems: HatchAnnouncementItem[] = [];
  let evolvedMessages: string[] = [];
  let progressionEvents: PokemonUiEvent[] = [];
  let releaseEventToShow: PokemonReleaseEvent | null = null;
  const rankChanges: RankChange[] = [];

  const updatedStudents = students.map(s => {
    if (ids.includes(s.id)) {
      const oldRank = getRank(s.points, s.gender);
      const newPoints = s.points + amount;
      const newRank = getRank(newPoints, s.gender);
      const history: HistoryItem = { id: Date.now().toString() + Math.random(), amount, reason, timestamp: Date.now() };

      if (ids.length === 1 && oldRank.id !== newRank.id) {
        rankChanges.push({ studentName: s.name, newTitle: newRank.title, promoted: newPoints > s.points });
      }

      let currentStudent = normalizeStudentPokemonData(s);
      const eggProgressAmount = source === 'solo' ? (amount > 0 ? amount : 0) : amount;
      const eggResult = advanceEggForStudent(currentStudent, eggProgressAmount);
      currentStudent = eggResult.student;
      if (eggResult.hatchedPet) {
        hatchItems.push({ studentId: s.id, studentName: s.name, pet: eggResult.hatchedPet });
      }

      if (currentStudent.pet && amount !== 0) {
        const hpUpdate = applyPetHpDeltaToStudent(currentStudent, amount, `${reason}: ${amount >= 0 ? 'hồi' : 'mất'} ${Math.abs(amount)} HP`);
        currentStudent = hpUpdate.student;
        if (hpUpdate.releaseEvent && !releaseEventToShow) {
          releaseEventToShow = hpUpdate.releaseEvent;
        }
      }

      if (source === 'solo') {
        const progressionResult = applyGameEventToStudent(
          { ...currentStudent, points: newPoints },
          {
            type: 'SOLO_RESULT',
            source,
            studentId: s.id,
            auraDelta: amount,
            timestamp: Date.now()
          }
        );
        currentStudent = progressionResult.student;
        progressionEvents = [...progressionEvents, ...progressionResult.uiEvents];
        progressionResult.uiEvents
          .filter(event => event.type === 'evolution')
          .forEach(event => evolvedMessages.push(`Pokémon của ${s.name}: ${event.message}!`));
        const trainerXpGain = (amount > 0 ? 5 : 0)
          + (progressionResult.uiEvents.some(event => event.type === 'evolution') ? 15 : 0);
        currentStudent = applyTrainerJourneyProgress(
          currentStudent,
          trainerXpGain,
          Date.now(),
          progressionEvents,
          amount > 0 ? 'Positive Solo' : undefined
        );
        if (amount > 0) {
          currentStudent = addWeeklyChestProgress(currentStudent, 3);
        }
      }

      return {
        ...currentStudent,
        points: newPoints,
        history: [history, ...currentStudent.history].slice(0, 50),
        egg: eggResult.egg
      };
    }
    return s;
  });

  return {
    students: updatedStudents,
    hatchItems,
    evolvedMessages,
    progressionEvents,
    releaseEvent: releaseEventToShow,
    rankChanges
  };
};
