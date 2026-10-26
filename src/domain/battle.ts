import { PokemonReleaseEvent, Student } from '../types';
import { BattleLudoTurn, HatchAnnouncementItem } from '../types/app';
import { PokemonUiEvent, applyGameEventToStudent, applyPetHpDeltaToStudent } from './gameEvents';
import { normalizeStudentPokemonData } from './pokemonProgression';
import { addWeeklyChestProgress, advanceEggForStudent, applyTrainerJourneyProgress } from './progression';

// Phần tính toán khi chốt trận Battle (trước đây nằm trong handleResolveBattle).
// Cả hai được cộng điểm Battle của mình; người thắng hồi HP bằng điểm chênh lệch, người thua mất đúng số đó.
// Hoà: không đổi HP. Sau trận, ai có điểm > 0 được một lượt Cá Ngựa (người thắng đi trước).

export interface BattleInput {
  studentA: Student;
  studentB: Student;
  scoreA: number;
  scoreB: number;
}

export interface BattleResult {
  students: Student[];
  updatedA: Student;
  updatedB: Student;
  winner: Student | null;
  diff: number;
  resultMsg: string;
  uiEvents: PokemonUiEvent[];
  hatchItems: HatchAnnouncementItem[];
  releaseEvent: PokemonReleaseEvent | null;
  ludoTurns: BattleLudoTurn[];
}

export const resolveBattle = (students: Student[], input: BattleInput): BattleResult => {
  const { studentA, studentB, scoreA, scoreB } = input;
  const diff = Math.abs(scoreA - scoreB);

  let updatedStudents = [...students];
  let resultMsg = "";
  let winner: Student | null = null;
  let releaseEventToShow: PokemonReleaseEvent | null = null;
  let battleProgressMessages: string[] = [];
  let battleUiEvents: PokemonUiEvent[] = [];
  let battleHatchedNames: string[] = [];
  let battleHatchItems: HatchAnnouncementItem[] = [];

  const applyBattleOutcome = (
    student: Student,
    pointGain: number,
    outcome: 'win' | 'loss' | 'draw',
    hpDelta: number | null,
    historyReason: string,
    hpReason?: string
  ): Student => {
    const newPts = student.points + pointGain;
    let baseStudent = normalizeStudentPokemonData(student);

    if (hpDelta !== null) {
      const hpUpdate = applyPetHpDeltaToStudent(baseStudent, hpDelta, hpReason || historyReason);
      baseStudent = hpUpdate.student;
      if (hpUpdate.releaseEvent && !releaseEventToShow) releaseEventToShow = hpUpdate.releaseEvent;
    }

    const progressionResult = applyGameEventToStudent(
      { ...baseStudent, points: newPts },
      {
        type: 'BATTLE_RESULT',
        source: 'battle',
        studentId: student.id,
        battleOutcome: outcome,
        battleScore: pointGain,
        timestamp: Date.now()
      }
    );
    battleUiEvents = [...battleUiEvents, ...progressionResult.uiEvents];

    battleProgressMessages = [
      ...battleProgressMessages,
      ...progressionResult.uiEvents
        .filter(event => ['streak', 'passive', 'charge-ready', 'level-up', 'evolution', 'random-drop', 'mastery'].includes(event.type))
        .map(event => `${student.name}: ${event.message}`)
    ];

    let eventStudent = progressionResult.student;
    if (pointGain > 0) {
      const eggResult = advanceEggForStudent(eventStudent, pointGain);
      eventStudent = eggResult.student;
      if (eggResult.hatchedPet) {
        battleHatchedNames.push(student.name);
        battleHatchItems.push({ studentId: student.id, studentName: student.name, pet: eggResult.hatchedPet });
        battleUiEvents.push({ type: 'evolution', message: `${student.name}: trứng đã nở` });
      }
    }

    const trainerXpGain = (outcome === 'win' ? 10 : 0)
      + (progressionResult.uiEvents.some(event => event.type === 'evolution') ? 15 : 0);
    const journeyStudent = applyTrainerJourneyProgress(
      eventStudent,
      trainerXpGain,
      Date.now(),
      battleUiEvents,
      outcome === 'win' ? 'Battle Win' : undefined
    );
    const chestStudent = addWeeklyChestProgress(journeyStudent, 3 + (outcome === 'win' ? 5 : 0));

    return {
      ...chestStudent,
      points: newPts,
      history: [
        { id: Date.now().toString() + Math.random(), amount: pointGain, reason: historyReason, timestamp: Date.now() },
        ...chestStudent.history
      ].slice(0, 50)
    };
  };

  if (scoreA > scoreB) {
    winner = studentA;
    // A wins: A gets +scoreA points, Pokemon gets +diff HP. B gets +scoreB points, Pokemon loses diff HP (-diff HP).
    updatedStudents = updatedStudents.map(s => {
      if (s.id === studentA.id) {
        return applyBattleOutcome(s, scoreA, 'win', diff, `🏆 Thắng Battle: +${scoreA}đ (Pokemon +${diff} HP)`, `Battle thắng: hồi ${diff} HP`);
      }
      if (s.id === studentB.id) {
        return applyBattleOutcome(s, scoreB, 'loss', -diff, `⚔️ Thua Battle: +${scoreB}đ (Pokemon -${diff} HP)`, `Battle thua: mất ${diff} HP`);
      }
      return s;
    });

    resultMsg = `🏆 ${studentA.name} CHIẾN THẮNG BATTLE!\n\n• ${studentA.name}: +${scoreA} điểm Hào quang (Pokemon hồi +${diff} HP)\n• ${studentB.name}: +${scoreB} điểm Hào quang (Pokemon tổn hại -${diff} HP).`;
  } else if (scoreB > scoreA) {
    winner = studentB;
    // B wins: B gets +scoreB points, Pokemon gets +diff HP. A gets +scoreA points, Pokemon loses diff HP (-diff HP).
    updatedStudents = updatedStudents.map(s => {
      if (s.id === studentB.id) {
        return applyBattleOutcome(s, scoreB, 'win', diff, `🏆 Thắng Battle: +${scoreB}đ (Pokemon +${diff} HP)`, `Battle thắng: hồi ${diff} HP`);
      }
      if (s.id === studentA.id) {
        return applyBattleOutcome(s, scoreA, 'loss', -diff, `⚔️ Thua Battle: +${scoreA}đ (Pokemon -${diff} HP)`, `Battle thua: mất ${diff} HP`);
      }
      return s;
    });

    resultMsg = `🏆 ${studentB.name} CHIẾN THẮNG BATTLE!\n\n• ${studentB.name}: +${scoreB} điểm Hào quang (Pokemon hồi +${diff} HP)\n• ${studentA.name}: +${scoreA} điểm Hào quang (Pokemon tổn hại -${diff} HP).`;
  } else {
    // Tie
    updatedStudents = updatedStudents.map(s => {
      if (s.id === studentA.id) {
        return applyBattleOutcome(s, scoreA, 'draw', null, `⚔️ Hòa Battle: +${scoreA}đ`);
      }
      if (s.id === studentB.id) {
        return applyBattleOutcome(s, scoreB, 'draw', null, `⚔️ Hòa Battle: +${scoreB}đ`);
      }
      return s;
    });

    resultMsg = `🤝 TRẬN BATTLE HÒA NHAU!\n\nCả 2 trainer đều được cộng điểm và bảo toàn HP cho Pokemon.`;
  }

  if (battleProgressMessages.length > 0) {
    resultMsg += `\n\nTiến triển Pokémon:\n${battleProgressMessages.slice(0, 5).map(message => `• ${message}`).join('\n')}`;
  }
  if (battleHatchedNames.length > 0) {
    resultMsg += `\n\nTrứng đã nở: ${battleHatchedNames.join(', ')}.`;
  }

  const updatedA = updatedStudents.find(s => s.id === studentA.id) || studentA;
  const updatedB = updatedStudents.find(s => s.id === studentB.id) || studentB;
  let ludoTurns: BattleLudoTurn[] = [];
  if (scoreA > scoreB) {
    ludoTurns = [
      ...(scoreA > 0 ? [{ studentId: updatedA.id, role: 'winner' as const }] : []),
      ...(scoreB > 0 ? [{ studentId: updatedB.id, role: 'loser' as const }] : [])
    ];
  } else if (scoreB > scoreA) {
    ludoTurns = [
      ...(scoreB > 0 ? [{ studentId: updatedB.id, role: 'winner' as const }] : []),
      ...(scoreA > 0 ? [{ studentId: updatedA.id, role: 'loser' as const }] : [])
    ];
  } else {
    ludoTurns = [
      ...(scoreA > 0 ? [{ studentId: updatedA.id, role: 'draw' as const }] : []),
      ...(scoreB > 0 ? [{ studentId: updatedB.id, role: 'draw' as const }] : [])
    ];
  }

  return {
    students: updatedStudents,
    updatedA,
    updatedB,
    winner,
    diff,
    resultMsg,
    uiEvents: battleUiEvents,
    hatchItems: battleHatchItems,
    releaseEvent: releaseEventToShow,
    ludoTurns
  };
};
