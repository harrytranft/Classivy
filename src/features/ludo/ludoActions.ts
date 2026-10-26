import { HistoryItem, LudoTileSpec, PokemonReleaseEvent, Student } from '../../types';
import { BattleLudoTurn, LudoReturnHint } from '../../types/app';
import { applyPetHpDeltaToStudent } from '../../domain/gameEvents';
import { LUDO_FINISH_TILE } from '../../data/constants';
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
      const historyItem: HistoryItem = {
        id: Date.now().toString() + Math.random(),
        amount,
        reason,
        timestamp: Date.now()
      };
      const pointUpdatedStudent: Student = {
        ...target,
        points: target.points + amount,
        history: [historyItem, ...target.history].slice(0, 50)
      };
      const hpUpdate = applyPetHpDeltaToStudent(
        pointUpdatedStudent,
        amount,
        `${reason}: ${amount >= 0 ? 'hồi' : 'mất'} ${Math.abs(amount)} HP`
      );
      if (hpUpdate.releaseEvent && !releaseEventToShow) releaseEventToShow = hpUpdate.releaseEvent;
      return hpUpdate.student;
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

      const isStuck = !!ludoMonsterStuck[student.id];
      if (isStuck) {
        if (roll !== 6) {
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
          setLudoMonsterStuck(prev => ({ ...prev, [student.id]: false }));
          updatedStudents = updatedStudents.map(s => s.id === student.id ? { ...s, ludoMonsterStuck: false } : s);
          setLudoLogs(prev => [`⚔️ ${student.name} tung được 6 điểm! Đã tiêu diệt Quái vật và được tiếp tục tiến bước!`, ...prev.slice(0, 30)]);
        }
      }

      const oldSteps = ludoSteps[student.id] || 0;
      let newSteps = oldSteps + roll;
      let newPos = Math.min(newSteps, LUDO_FINISH_TILE);
      const nextPositions = { ...ludoPositions };
      const nextSteps = { ...ludoSteps };
      const nextMonsterStuck = { ...ludoMonsterStuck };
      const raceRoster = students.filter(s => s.className === student.className && !s.isAbsent);
      const logs: string[] = [
        newSteps >= LUDO_FINISH_TILE
          ? `🎲 ${student.name} tung được ${roll} điểm và lao thẳng về đích!`
          : `🎲 ${student.name} tung được ${roll} điểm, tiến đến ô số ${newPos}!`
      ];
      let popupEvent: any = null;
      let reachedFinishReward = false;

      const updateKickedStudent = (target: Student) => {
        nextPositions[target.id] = 0;
        nextSteps[target.id] = 0;
        nextMonsterStuck[target.id] = false;
        updatedStudents = updatedStudents.map(s => {
          if (s.id === target.id) {
            return { ...s, ludoTile: 0, ludoSteps: 0, ludoMonsterStuck: false };
          }
          return s;
        });
      };

      const kickOccupantAt = (tileIndex: number, context: string) => {
        if (tileIndex === 0) return false;
        const target = raceRoster.find(other => other.id !== student.id && (nextPositions[other.id] || 0) === tileIndex);
        if (!target) return false;
        updateKickedStudent(target);
        logs.unshift(`💥 ${student.name} ${context} ô ${tileIndex} và ĐÁ ${target.name} về lại vạch xuất phát!`);
        popupEvent = {
          title: '💥 CÚ ĐÁ VỀ CHUỒNG! 💥',
          message: `${student.name} vừa chiếm ô ${tileIndex}. ${target.name} bị đá về Vạch Xuất Phát (ô 0)!`,
          actor: student,
          target,
          icon: '💥',
          type: 'kick',
          tileIndex
        };
        return true;
      };

      const sendToFinish = (reason: string) => {
        if (reachedFinishReward) return;
        reachedFinishReward = true;
        newSteps = 0;
        newPos = 0;
        updatedStudents = updatedStudents.map(s => {
          if (s.id === student.id) {
            return applyLudoAuraReward(s, 20, '🎉 Hoàn thành 1 vòng bàn cờ Cá Ngựa (+20đ)');
          }
          return s;
        });
        logs.unshift(`🏁 ${student.name} ${reason} và quay lại ô 0 để bắt đầu vòng mới. Thưởng +20 điểm Hào Quang!`);
        if (!popupEvent) {
          popupEvent = {
            title: '🏁 CÁN ĐÍCH!',
            message: `${student.name} đã về đích, nhận +20 điểm Hào Quang và quay lại ô 0 để chơi vòng mới.`,
            actor: student,
            icon: '🏁',
            type: 'finish'
          };
        }
      };

      const applyMovementTile = (tileSpec: LudoTileSpec) => {
        if (tileSpec.type === 'monster') {
          nextMonsterStuck[student.id] = true;
          logs.unshift(`👹 ${student.name} sa vào ${tileSpec.title}! Lượt sau cần lắc được 6 mới đi tiếp.`);
          if (!popupEvent) {
            popupEvent = {
              title: tileSpec.title,
              message: `${student.name} sa vào ô ${tileSpec.tileIndex}: ${tileSpec.desc}`,
              actor: student,
              icon: tileSpec.icon,
              type: 'monster'
            };
          }
          return;
        }

        if (tileSpec.type === 'curse' || tileSpec.type === 'portal') {
          const val = tileSpec.value || (tileSpec.type === 'curse' ? -5 : 3);
          const shiftedSteps = Math.max(0, newSteps + val);
          newSteps = shiftedSteps;
          if (shiftedSteps >= LUDO_FINISH_TILE) {
            logs.unshift(`${tileSpec.icon} ${student.name} kích hoạt ${tileSpec.title}! ${tileSpec.desc}`);
            sendToFinish('được hiệu ứng đẩy tới/vượt đích');
            return;
          }
          newPos = shiftedSteps;
          logs.unshift(`${tileSpec.icon} ${student.name} kích hoạt ${tileSpec.title}! ${tileSpec.desc}`);
          if (!popupEvent) {
            popupEvent = {
              title: tileSpec.title,
              message: `${student.name} kích hoạt ô ${tileSpec.tileIndex}: ${tileSpec.desc} Vị trí mới: ô ${newPos}.`,
              actor: student,
              icon: tileSpec.icon,
              type: tileSpec.type
            };
          }
          kickOccupantAt(newPos, 'bị hiệu ứng đưa tới');
          return;
        }

        if (tileSpec.type === 'restart') {
          newSteps = 0;
          newPos = 0;
          nextMonsterStuck[student.id] = false;
          logs.unshift(`🔁 ${student.name} kích hoạt ${tileSpec.title}! Quay về vạch xuất phát.`);
          if (!popupEvent) {
            popupEvent = {
              title: tileSpec.title,
              message: `${student.name} kích hoạt ô ${tileSpec.tileIndex}: ${tileSpec.desc}`,
              actor: student,
              icon: tileSpec.icon,
              type: 'curse'
            };
          }
          return;
        }

        if (tileSpec.type === 'treasure') {
          const val = tileSpec.value || 5;
          updatedStudents = updatedStudents.map(s => {
            if (s.id === student.id) {
              return applyLudoAuraReward(s, val, `💎 Nhặt được ${tileSpec.title} (${val >= 0 ? '+' : ''}${val}đ)`);
            }
            return s;
          });
          logs.unshift(`💎 ${student.name} kích hoạt ${tileSpec.title}! ${tileSpec.desc}`);
          if (!popupEvent) {
            popupEvent = {
              title: tileSpec.title,
              message: `${student.name} kích hoạt ô ${tileSpec.tileIndex}: ${tileSpec.desc}`,
              actor: student,
              icon: tileSpec.icon,
              type: 'special'
            };
          }
        }
      };

      if (newSteps >= LUDO_FINISH_TILE) {
        sendToFinish('đã chạm hoặc vượt vạch đích');
      } else {
        kickOccupantAt(newPos, 'đáp xuống');
        const tileSpec = effectiveLudoTiles[newPos];
        if (tileSpec) applyMovementTile(tileSpec);
      }

      if (reachedFinishReward) {
        logs.unshift(`🎡 Mở Vòng quay may mắn cho ${student.name} với tỉ lệ 60% quà tốt / 40% quà thử thách.`);
      }

      nextSteps[student.id] = newSteps;
      nextPositions[student.id] = newPos;
      setLudoSteps(nextSteps);
      setLudoPositions(nextPositions);
      setLudoMonsterStuck(nextMonsterStuck);

      // Apply student ludo status update
      updatedStudents = updatedStudents.map(s => {
        if (s.id === student.id) {
          return {
            ...s,
            ludoTile: newPos,
            ludoSteps: newSteps,
            ludoMonsterStuck: !!nextMonsterStuck[student.id]
          };
        }
        return s;
      });

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
