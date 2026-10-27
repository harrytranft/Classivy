import React, { useState } from 'react';
import { Student } from '../../types';
import { BattleLudoTurn, LudoEventPopupData, LudoReturnHint } from '../../types/app';

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
  const [ludoBonusRolls, setLudoBonusRolls] = useState<Record<string, number>>({});
  const [battleLudoQueue, setBattleLudoQueue] = useState<BattleLudoTurn[]>([]);
  const [ludoEventPopup, setLudoEventPopup] = useState<LudoEventPopupData | null>(null);
  const [ludoReturnHint, setLudoReturnHint] = useState<LudoReturnHint>(null);

  return {
    ludoPositions, setLudoPositions, ludoSteps, setLudoSteps,
    ludoMonsterStuck, setLudoMonsterStuck,
    ludoActiveStudent, setLudoActiveStudent, ludoClassName, setLudoClassName, ludoDice,
    setLudoDice, ludoRolling, setLudoRolling, ludoLogs, setLudoLogs,
    ludoBonusRolls, setLudoBonusRolls, battleLudoQueue, setBattleLudoQueue, ludoEventPopup,
    setLudoEventPopup, ludoReturnHint, setLudoReturnHint
  };
};
