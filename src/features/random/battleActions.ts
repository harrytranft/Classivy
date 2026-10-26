import { resolveBattle } from '../../domain/battle';
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
    const {
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
    } = resolveBattle(students, { studentA: battleStudentA, studentB: battleStudentB, scoreA, scoreB });

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
