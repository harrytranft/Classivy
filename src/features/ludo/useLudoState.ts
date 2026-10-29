import React, { useEffect, useState } from 'react';
import { Student } from '../../types';
import { BattleLudoTurn, LudoEventPopupData, LudoReturnHint } from '../../types/app';
import { BonusRolls, normalizeBonusRolls } from '../../domain/ludoRolls';

// Lượt lắc bonus được giữ trên máy để tải lại trang không làm mất phần thưởng của học sinh (Phase 13A, D52).
export const LUDO_BONUS_ROLLS_KEY = 'classivy_ludo_bonus_rolls';

const loadBonusRolls = (): BonusRolls => {
  try {
    const raw = window.localStorage.getItem(LUDO_BONUS_ROLLS_KEY);
    return raw ? normalizeBonusRolls(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
};

// State Cá Ngựa.
export const useLudoState = () => {
  const [ludoPositions, setLudoPositions] = useState<Record<string, number>>({});
  const [ludoSteps, setLudoSteps] = useState<Record<string, number>>({});
  const [ludoMonsterStuck, setLudoMonsterStuck] = useState<Record<string, boolean>>({});
  const [ludoActiveStudent, setLudoActiveStudent] = useState<Student | null>(null);
  const [ludoClassName, setLudoClassName] = useState<string>('');
  const [ludoDice, setLudoDice] = useState<number | null>(null);
  const [ludoRolling, setLudoRolling] = useState(false);
  const [ludoLogs, setLudoLogs] = useState<string[]>([]);
  const [ludoBonusRolls, setLudoBonusRolls] = useState<BonusRolls>(loadBonusRolls);
  const [battleLudoQueue, setBattleLudoQueue] = useState<BattleLudoTurn[]>([]);
  const [ludoEventPopup, setLudoEventPopup] = useState<LudoEventPopupData | null>(null);
  const [ludoReturnHint, setLudoReturnHint] = useState<LudoReturnHint>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(LUDO_BONUS_ROLLS_KEY, JSON.stringify(ludoBonusRolls));
    } catch {
      // Không lưu được thì vẫn chơi bình thường, chỉ mất lượt khi tải lại trang.
    }
  }, [ludoBonusRolls]);

  return {
    ludoPositions, setLudoPositions, ludoSteps, setLudoSteps,
    ludoMonsterStuck, setLudoMonsterStuck,
    ludoActiveStudent, setLudoActiveStudent, ludoClassName, setLudoClassName, ludoDice,
    setLudoDice, ludoRolling, setLudoRolling, ludoLogs, setLudoLogs,
    ludoBonusRolls, setLudoBonusRolls, battleLudoQueue, setBattleLudoQueue, ludoEventPopup,
    setLudoEventPopup, ludoReturnHint, setLudoReturnHint
  };
};
