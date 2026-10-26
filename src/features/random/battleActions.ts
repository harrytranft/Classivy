import { PokemonReleaseEvent, Student } from '../../types';
import { PokemonUiEvent, applyGameEventToStudent, applyPetHpDeltaToStudent } from '../../domain/gameEvents';
import { BattleLudoTurn, HatchAnnouncementItem } from '../../types/app';
import { normalizeStudentPokemonData } from '../../domain/pokemonProgression';
import { addWeeklyChestProgress, advanceEggForStudent, applyTrainerJourneyProgress } from '../../domain/progression';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Chốt trận Battle.
export interface BattleActions {
  handleResolveBattle: () => void;
}

export const createBattleActions = (appState: AppState, app: AppActions): BattleActions => {
  const {
    battleScoreA, battleScoreB, battleStudentA, battleStudentB, posSoundUrl,
    setBattleResultSummary, setBattleStudentA, setBattleStudentB, setPokemonReleaseEvent,
    setStudents, showHatchAnnouncement, showPokemonReaction, students
  } = appState;

  const handleResolveBattle = () => {
    if (!battleStudentA || !battleStudentB) return;

    const scoreA = battleScoreA;
    const scoreB = battleScoreB;
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
      winner = battleStudentA;
      // A wins: A gets +scoreA points, Pokemon gets +diff HP. B gets +scoreB points, Pokemon loses diff HP (-diff HP).
      updatedStudents = updatedStudents.map(s => {
        if (s.id === battleStudentA.id) {
          return applyBattleOutcome(s, scoreA, 'win', diff, `🏆 Thắng Battle: +${scoreA}đ (Pokemon +${diff} HP)`, `Battle thắng: hồi ${diff} HP`);
        }
        if (s.id === battleStudentB.id) {
          return applyBattleOutcome(s, scoreB, 'loss', -diff, `⚔️ Thua Battle: +${scoreB}đ (Pokemon -${diff} HP)`, `Battle thua: mất ${diff} HP`);
        }
        return s;
      });

      resultMsg = `🏆 ${battleStudentA.name} CHIẾN THẮNG BATTLE!\n\n• ${battleStudentA.name}: +${scoreA} điểm Hào quang (Pokemon hồi +${diff} HP)\n• ${battleStudentB.name}: +${scoreB} điểm Hào quang (Pokemon tổn hại -${diff} HP).`;
    } else if (scoreB > scoreA) {
      winner = battleStudentB;
      // B wins: B gets +scoreB points, Pokemon gets +diff HP. A gets +scoreA points, Pokemon loses diff HP (-diff HP).
      updatedStudents = updatedStudents.map(s => {
        if (s.id === battleStudentB.id) {
          return applyBattleOutcome(s, scoreB, 'win', diff, `🏆 Thắng Battle: +${scoreB}đ (Pokemon +${diff} HP)`, `Battle thắng: hồi ${diff} HP`);
        }
        if (s.id === battleStudentA.id) {
          return applyBattleOutcome(s, scoreA, 'loss', -diff, `⚔️ Thua Battle: +${scoreA}đ (Pokemon -${diff} HP)`, `Battle thua: mất ${diff} HP`);
        }
        return s;
      });

      resultMsg = `🏆 ${battleStudentB.name} CHIẾN THẮNG BATTLE!\n\n• ${battleStudentB.name}: +${scoreB} điểm Hào quang (Pokemon hồi +${diff} HP)\n• ${battleStudentA.name}: +${scoreA} điểm Hào quang (Pokemon tổn hại -${diff} HP).`;
    } else {
      // Tie
      updatedStudents = updatedStudents.map(s => {
        if (s.id === battleStudentA.id) {
          return applyBattleOutcome(s, scoreA, 'draw', null, `⚔️ Hòa Battle: +${scoreA}đ`);
        }
        if (s.id === battleStudentB.id) {
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

    setStudents(updatedStudents);
    if (releaseEventToShow) setPokemonReleaseEvent(releaseEventToShow);
    if (!releaseEventToShow && battleUiEvents.length > 0) {
      showPokemonReaction(battleUiEvents, 'Kết quả Battle Pokémon');
    }
    if (!releaseEventToShow && battleHatchItems.length > 0) {
      showHatchAnnouncement(
        battleHatchItems,
        `Tin vui! Trứng của ${battleHatchItems.map(item => item.studentName).join(', ')} đã nở sau Battle.`
      );
    }
    new Audio(posSoundUrl).play().catch(() => {});

    const updatedA = updatedStudents.find(s => s.id === battleStudentA.id) || battleStudentA;
    const updatedB = updatedStudents.find(s => s.id === battleStudentB.id) || battleStudentB;
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
    setBattleStudentA(updatedA);
    setBattleStudentB(updatedB);

    setBattleResultSummary({
      studentA: updatedA,
      studentB: updatedB,
      winner: winner ? (updatedStudents.find(s => s.id === winner!.id) || winner) : null,
      scoreA,
      scoreB,
      diff,
      resultMsg,
      ludoTurns
    });
    app.incrementBossCounterForClass(updatedA.className);
  };

  return {
    handleResolveBattle
  };
};
