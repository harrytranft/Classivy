import React, { useState } from 'react';
import { Student } from '../../types';
import { BattleLudoTurn, LudoEventPopupData, LudoReturnHint } from '../../types/app';

// State Cá Ngựa.
export const useLudoState = () => {
  const [showLudoModal, setShowLudoModal] = useState(false);
  const [ludoPositions, setLudoPositions] = useState<Record<string, number>>({});
  const [ludoSteps, setLudoSteps] = useState<Record<string, number>>({});
  const [ludoMonsterStuck, setLudoMonsterStuck] = useState<Record<string, boolean>>({});
  const [ludoVisitedSpecialTiles, setLudoVisitedSpecialTiles] = useState<Record<number, boolean>>({});
  const [ludoActiveStudent, setLudoActiveStudent] = useState<Student | null>(null);
  const [ludoClassName, setLudoClassName] = useState<string>('');
  const [ludoDice, setLudoDice] = useState<number | null>(null);
  const [ludoRolling, setLudoRolling] = useState(false);
  const [ludoPopup, setLudoPopup] = useState<{ title: string; desc: string; icon: string } | null>(null);
  const [ludoLogs, setLudoLogs] = useState<string[]>([]);
  const [ludoBonusRolls, setLudoBonusRolls] = useState<Record<string, number>>({});
  const [battleLudoQueue, setBattleLudoQueue] = useState<BattleLudoTurn[]>([]);
  const [ludoEventPopup, setLudoEventPopup] = useState<LudoEventPopupData | null>(null);
  const [ludoReturnHint, setLudoReturnHint] = useState<LudoReturnHint>(null);

  return {
    showLudoModal, setShowLudoModal, ludoPositions, setLudoPositions, ludoSteps, setLudoSteps,
    ludoMonsterStuck, setLudoMonsterStuck, ludoVisitedSpecialTiles, setLudoVisitedSpecialTiles,
    ludoActiveStudent, setLudoActiveStudent, ludoClassName, setLudoClassName, ludoDice,
    setLudoDice, ludoRolling, setLudoRolling, ludoPopup, setLudoPopup, ludoLogs, setLudoLogs,
    ludoBonusRolls, setLudoBonusRolls, battleLudoQueue, setBattleLudoQueue, ludoEventPopup,
    setLudoEventPopup, ludoReturnHint, setLudoReturnHint
  };
};
