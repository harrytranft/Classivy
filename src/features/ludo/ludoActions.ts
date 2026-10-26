import { PokemonReleaseEvent, Student } from '../../types';
import { BattleLudoTurn, LudoReturnHint } from '../../types/app';
import { awardLudoAura, checkMonsterEscape, resolveLudoMove } from '../../domain/ludo';
import { playDiceSound } from '../../lib/sounds';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Cá Ngựa: mở bàn cờ, lượt sau Battle/Boss, lắc xúc xắc.
export interface LudoActions {
  openLudoForClass: (className?: string, activeStudent?: Student | null, returnHint?: LudoReturnHint) => void;
  openBattleLudoTurns: (turns: BattleLudoTurn[], returnHint?: LudoReturnHint) => void;
  handleRandomFromLudo: () => void;
  handleLudoRollDice: (student: Student, options?: { isBonusRoll?: boolean; }) => void;
}

export const createLudoActions = (appState: AppState, app: AppActions): LudoActions => {
  const {
    classOptions, effectiveLudoTiles, filterClass, ludoMonsterStuck, ludoPositions,
    ludoRolling, ludoSteps, setBattleLudoQueue, setLudoActiveStudent, setLudoBonusRolls,
    setLudoClassName, setLudoDice, setLudoEventPopup, setLudoLogs, setLudoMonsterStuck,
    setLudoPositions, setLudoReturnHint, setLudoRolling, setLudoSteps, setPokemonReleaseEvent,
    setShowLudoModal, setStudents, students
  } = appState;

  const openLudoForClass = (className?: string, activeStudent?: Student | null, returnHint: LudoReturnHint = null) => {
    const nextClass = className || (filterClass !== 'Tất cả' ? filterClass : classOptions[0] || '');
    if (!nextClass) {
      alert("Chưa có lớp nào để mở đường đua Cá Ngựa.");
      return;
    }
    setLudoClassName(nextClass);
    setLudoActiveStudent(activeStudent && activeStudent.className === nextClass ? activeStudent : null);
    setLudoDice(null);
    setLudoReturnHint(returnHint);
    setShowLudoModal(true);
  };

  const openBattleLudoTurns = (turns: BattleLudoTurn[], returnHint: LudoReturnHint = 'battle') => {
    const validTurns = turns
      .map(turn => {
        const student = students.find(s => s.id === turn.studentId);
        return student && !student.isAbsent ? { turn, student } : null;
      })
      .filter(Boolean) as { turn: BattleLudoTurn; student: Student }[];

    if (validTurns.length === 0) {
      alert("Không có trainer hợp lệ để lắc Cá Ngựa sau Battle.");
      return;
    }

    setBattleLudoQueue(validTurns.map(item => item.turn));
    openLudoForClass(validTurns[0].student.className, validTurns[0].student, returnHint);
  };

  const handleRandomFromLudo = () => {
    setBattleLudoQueue([]);
    setLudoReturnHint(null);
    setShowLudoModal(false);
    window.setTimeout(() => app.handleRandom(), 0);
  };

  const handleLudoRollDice = (student: Student, options?: { isBonusRoll?: boolean }) => {
    if (ludoRolling) return;
    const isBonusRoll = !!options?.isBonusRoll;
    let releaseEventToShow: PokemonReleaseEvent | null = null;
    const applyLudoAuraReward = (target: Student, amount: number, reason: string): Student => {
      const result = awardLudoAura(target, amount, reason);
      if (result.releaseEvent && !releaseEventToShow) releaseEventToShow = result.releaseEvent;
      return result.student;
    };

    setLudoRolling(true);
    setLudoDice(null);
    playDiceSound();

    if (isBonusRoll) {
      setLudoBonusRolls(prev => ({
        ...prev,
        [student.id]: Math.max(0, (prev[student.id] || 0) - 1)
      }));
    }

    // 1. Award +1 point for answering correctly, except bonus rolls from Lucky Wheel.
    let updatedStudents = students.map(s => {
      if (s.id !== student.id) return s;
      if (isBonusRoll) {
        return {
          ...s,
          history: [{ id: Date.now().toString() + Math.random(), amount: 0, reason: '🎁 Lượt lắc Cá Ngựa bonus từ Vòng quay may mắn', timestamp: Date.now() }, ...s.history]
        };
      }
      return applyLudoAuraReward(s, 1, '🎲 Trả lời đúng câu hỏi Cá Ngựa (+1đ)');
    });

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setLudoDice(roll);
      setLudoRolling(false);

      const advanceBattleQueue = (nextStudents: Student[]) => {
        setBattleLudoQueue(prev => {
          if (prev.length === 0) return prev;
          const nextQueue = prev.filter(turn => turn.studentId !== student.id);
          const nextTurn = nextQueue[0];
          const nextStudent = nextTurn ? nextStudents.find(s => s.id === nextTurn.studentId) || null : null;
          setLudoActiveStudent(nextStudent);
          return nextQueue;
        });
      };

      const monsterCheck = checkMonsterEscape(ludoMonsterStuck, student.id, roll);
      if (monsterCheck.wasStuck) {
        if (monsterCheck.stillStuck) {
          setLudoLogs(prev => [`👹 ${student.name} tung được ${roll} điểm - Chưa đủ 6 để diệt Quái vật! Vẫn bị kẹt ở ô hiện tại.`, ...prev.slice(0, 30)]);
          setLudoEventPopup({
            title: '👹 CHƯA THOÁT KHỎI QUÁI VẬT',
            message: `${student.name} tung được ${roll} điểm - Cần lắc đúng 6 điểm để tiêu diệt Quái vật! Vẫn bị kẹt ở ô hiện tại.`,
            actor: student,
            icon: '👹',
            type: 'monster'
          });
          setStudents(updatedStudents);
          if (releaseEventToShow) setPokemonReleaseEvent(releaseEventToShow);
          advanceBattleQueue(updatedStudents);
          return;
        } else {
          updatedStudents = updatedStudents.map(s => s.id === student.id ? { ...s, ludoMonsterStuck: false } : s);
          setLudoLogs(prev => [`⚔️ ${student.name} tung được 6 điểm! Đã tiêu diệt Quái vật và được tiếp tục tiến bước!`, ...prev.slice(0, 30)]);
        }
      }

      const move = resolveLudoMove({
        student,
        roll,
        steps: ludoSteps,
        positions: ludoPositions,
        monsterStuck: monsterCheck.monsterStuck,
        students: updatedStudents,
        rosterSource: students,
        tiles: effectiveLudoTiles
      });
      if (move.releaseEvent && !releaseEventToShow) releaseEventToShow = move.releaseEvent;
      const { logs, popupEvent, reachedFinish: reachedFinishReward } = move;
      updatedStudents = move.students;
      setLudoSteps(move.steps);
      setLudoPositions(move.positions);
      setLudoMonsterStuck(move.monsterStuck);

      setStudents(updatedStudents);
      if (releaseEventToShow) setPokemonReleaseEvent(releaseEventToShow);
      setLudoLogs(prev => [...logs, ...prev].slice(0, 40));
      advanceBattleQueue(updatedStudents);

      if (popupEvent) {
        setLudoEventPopup(popupEvent);
      }
      if (reachedFinishReward) {
        const latestStudent = updatedStudents.find(s => s.id === student.id) || student;
        window.setTimeout(() => app.openLuckyWheelForLudoFinish(latestStudent), 900);
      }
    }, 600);
  };

  return {
    openLudoForClass, openBattleLudoTurns, handleRandomFromLudo, handleLudoRollDice
  };
};
