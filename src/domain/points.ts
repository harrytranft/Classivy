import { HistoryItem, PokemonReleaseEvent, Student } from '../types';
import { HatchAnnouncementItem } from '../types/app';
import { GameEventSource, PokemonUiEvent, applyGameEventToStudent, applyPetHpDeltaToStudent } from './gameEvents';
import { normalizeStudentPokemonData } from './pokemonProgression';
import { consumeSkillUse } from './skills';
import { addWeeklyChestProgress, advanceEggForStudent, applyTrainerJourneyProgress } from './progression';

// Phần tính toán của "cộng/trừ điểm Hào Quang" (trước đây nằm trong handleUpdatePoints).
// Hàm thuần: nhận danh sách học sinh, trả danh sách mới và các sự kiện để giao diện hiển thị.

export interface PointsUpdateInput {
  ids: string[];
  amount: number;
  reason: string;
  source: GameEventSource;
  /** Phase 11: kết quả sau khi giáo viên chọn dùng skill (Nhân Đôi, Lá Chắn, Kim Bài) cho từng em. */
  overrides?: Record<string, PointsOverride>;
}

export interface PointsOverride {
  /** Điểm thực tế của em này (thay cho số chung). 0 = bỏ qua lần cộng/trừ. */
  amount: number;
  /** Lý do ghi lịch sử (mặc định dùng lý do chung). */
  reason?: string;
  /** Skill được dùng (trừ lượt, ghi lịch sử riêng). */
  skillUse?: { skillId: string; skillName: string; detail: string };
}

export interface PointsUpdateResult {
  students: Student[];
  hatchItems: HatchAnnouncementItem[];
  evolvedMessages: string[];
  progressionEvents: PokemonUiEvent[];
  releaseEvent: PokemonReleaseEvent | null;
}

export const applyPointsToStudents = (students: Student[], input: PointsUpdateInput): PointsUpdateResult => {
  const { ids, amount: baseAmount, reason: baseReason, source, overrides } = input;
  let hatchItems: HatchAnnouncementItem[] = [];
  let evolvedMessages: string[] = [];
  let progressionEvents: PokemonUiEvent[] = [];
  let releaseEventToShow: PokemonReleaseEvent | null = null;

  const updatedStudents = students.map(s => {
    if (ids.includes(s.id)) {
      const override = overrides?.[s.id];
      const amount = override ? override.amount : baseAmount;
      const reason = override?.reason ?? baseReason;
      if (override?.skillUse) {
        const { skillId, skillName, detail } = override.skillUse;
        s = consumeSkillUse(s, skillId, skillName, detail);
      }
      // Bỏ qua hoàn toàn (Kim Bài Miễn Tử): không đổi điểm, HP, trứng; chỉ ghi lượt dùng skill.
      if (amount === 0 && override) return s;
      const newPoints = s.points + amount;
      const history: HistoryItem = { id: Date.now().toString() + Math.random(), amount, reason, timestamp: Date.now() };

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
    releaseEvent: releaseEventToShow
  };
};
