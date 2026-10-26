import { HistoryItem, LudoTileSpec, PokemonReleaseEvent, Student } from '../types';
import { LudoEventPopupData } from '../types/app';
import { applyPetHpDeltaToStudent } from './gameEvents';
import { LUDO_FINISH_TILE } from '../data/constants';

// Logic thuần của Cá Ngựa (trước đây nằm trong handleLudoRollDice).
// Bàn cờ 0-49: về đích (+20 Hào Quang) thì quay lại ô 0 và mở Vòng quay may mắn;
// đáp xuống ô có người khác thì đá người đó về ô 0; ô đặc biệt: portal/curse (tiến/lùi), treasure (+điểm),
// monster (kẹt tới khi lắc 6), restart (về ô 0).

/** Cộng/trừ Hào Quang trong Cá Ngựa, kèm hồi/mất HP Pokémon bằng đúng số đó. */
export const awardLudoAura = (target: Student, amount: number, reason: string): { student: Student; releaseEvent: PokemonReleaseEvent | null } => {
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
  return { student: hpUpdate.student, releaseEvent: hpUpdate.releaseEvent };
};

export interface LudoMoveInput {
  student: Student;
  roll: number;
  steps: Record<string, number>;
  positions: Record<string, number>;
  monsterStuck: Record<string, boolean>;
  /** Danh sách học sinh đang được cập nhật trong lượt này (đã cộng +1 nếu trả lời đúng). */
  students: Student[];
  /** Danh sách học sinh lúc bấm lắc, dùng để biết ai đang ở trên đường đua. */
  rosterSource: Student[];
  tiles: Record<number, LudoTileSpec>;
}

export interface LudoMoveResult {
  students: Student[];
  steps: Record<string, number>;
  positions: Record<string, number>;
  monsterStuck: Record<string, boolean>;
  logs: string[];
  popupEvent: LudoEventPopupData | null;
  reachedFinish: boolean;
  releaseEvent: PokemonReleaseEvent | null;
}

export const resolveLudoMove = (input: LudoMoveInput): LudoMoveResult => {
  const { student, roll, steps, positions, monsterStuck, rosterSource, tiles } = input;
  let updatedStudents = input.students;
  let releaseEventToShow: PokemonReleaseEvent | null = null;
  const applyLudoAuraReward = (target: Student, amount: number, reason: string): Student => {
    const result = awardLudoAura(target, amount, reason);
    if (result.releaseEvent && !releaseEventToShow) releaseEventToShow = result.releaseEvent;
    return result.student;
  };

  const oldSteps = steps[student.id] || 0;
  let newSteps = oldSteps + roll;
  let newPos = Math.min(newSteps, LUDO_FINISH_TILE);
  const nextPositions = { ...positions };
  const nextSteps = { ...steps };
  const nextMonsterStuck = { ...monsterStuck };
  const raceRoster = rosterSource.filter(s => s.className === student.className && !s.isAbsent);
  const logs: string[] = [
    newSteps >= LUDO_FINISH_TILE
      ? `🎲 ${student.name} tung được ${roll} điểm và lao thẳng về đích!`
      : `🎲 ${student.name} tung được ${roll} điểm, tiến đến ô số ${newPos}!`
  ];
  let popupEvent: LudoEventPopupData | null = null;
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
    const tileSpec = tiles[newPos];
    if (tileSpec) applyMovementTile(tileSpec);
  }

  if (reachedFinishReward) {
    logs.unshift(`🎡 Mở Vòng quay may mắn cho ${student.name} với tỉ lệ 60% quà tốt / 40% quà thử thách.`);
  }

  nextSteps[student.id] = newSteps;
  nextPositions[student.id] = newPos;
  // Ghi vị trí mới vào dữ liệu học sinh
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

  return {
    students: updatedStudents,
    steps: nextSteps,
    positions: nextPositions,
    monsterStuck: nextMonsterStuck,
    logs,
    popupEvent,
    reachedFinish: reachedFinishReward,
    releaseEvent: releaseEventToShow
  };
};
