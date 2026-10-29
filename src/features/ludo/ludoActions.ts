import { PokemonReleaseEvent, Student } from '../../types';
import { BattleLudoTurn, LudoReturnHint } from '../../types/app';
import { awardLudoAura, checkMonsterEscape, resolveLudoMove } from '../../domain/ludo';
import { consumeExtraRoll, grantExtraRoll, shouldAdvanceLudoQueue } from '../../domain/ludoRolls';
import { playDiceSound } from '../../lib/sounds';
import { CLASS_SUB_PAGES } from '../../app/screenRoutes';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Cá Ngựa: mở bàn cờ, lượt sau Battle/Boss, lắc xúc xắc.
export interface LudoActions {
  openLudoForClass: (className?: string, activeStudent?: Student | null, returnHint?: LudoReturnHint) => void;
  openBattleLudoTurns: (turns: BattleLudoTurn[], returnHint?: LudoReturnHint) => void;
  handleRandomFromLudo: () => void;
  closeLudoPage: () => void;
  handleLudoRollDice: (student: Student, options?: { isBonusRoll?: boolean; }) => void;
  /** Phase 13D: giáo viên chọn kết quả thử thách trong hộp thông báo (đóng hộp, cộng lượt lắc nếu làm được). */
  resolveLudoChallenge: (completed: boolean) => void;
}

export const createLudoActions = (appState: AppState, app: AppActions): LudoActions => {
  const {
    activeLudoClassName, classOptions, classroomSettings, effectiveLudoTiles, ludoEventPopup, filterClass, goToClassPage, ludoMonsterStuck, ludoPositions,
    ludoRolling, ludoSteps, setBattleLudoQueue, setLudoActiveStudent, setLudoBonusRolls,
    setLudoClassName, setLudoDice, setLudoEventPopup, setLudoLogs, setLudoMonsterStuck,
    setLudoPositions, setLudoReturnHint, setLudoRolling, setLudoSteps, setPokemonReleaseEvent,
    setStudents, students
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
    goToClassPage(nextClass, CLASS_SUB_PAGES.ludo);
  };

  /** Đóng trang Cá Ngựa, quay về trang lớp. */
  const closeLudoPage = () => {
    if (activeLudoClassName) goToClassPage(activeLudoClassName, null, { replace: true });
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
    closeLudoPage();
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
      setLudoBonusRolls(prev => consumeExtraRoll(prev, student.id));
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
        // Lắc bonus xong thì em này vẫn còn lượt lắc thường, chưa được rời hàng chờ (Phase 13A.6).
        if (!shouldAdvanceLudoQueue(isBonusRoll)) return;
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
        tiles: effectiveLudoTiles,
        challenges: classroomSettings.ludoChallenges
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

  const resolveLudoChallenge = (completed: boolean) => {
    const popup = ludoEventPopup;
    setLudoEventPopup(null);
    if (!popup || popup.type !== 'challenge' || !popup.challenge) return;
    const actorId = popup.actor.id;
    const { text, bonusRolls } = popup.challenge;
    if (!completed) {
      setLudoLogs(prev => [`⏭️ ${popup.actor.name} chưa làm được thử thách (không bị phạt): ${text}`, ...prev].slice(0, 40));
      return;
    }
    setLudoBonusRolls(prev => grantExtraRoll(prev, actorId, bonusRolls));
    setStudents(prev => prev.map(s => s.id !== actorId ? s : {
      ...s,
      history: [{
        id: Date.now().toString() + Math.random(),
        amount: 0,
        reason: `🎯 Hoàn thành thử thách Cá Ngựa (+${bonusRolls} lượt lắc): ${text}`,
        timestamp: Date.now()
      }, ...s.history].slice(0, 50)
    }));
    setLudoLogs(prev => [`✅ ${popup.actor.name} làm được thử thách "${text}" và nhận thêm ${bonusRolls} lượt lắc!`, ...prev].slice(0, 40));
  };

  return {
    openLudoForClass, openBattleLudoTurns, handleRandomFromLudo, closeLudoPage, handleLudoRollDice, resolveLudoChallenge
  };
};
