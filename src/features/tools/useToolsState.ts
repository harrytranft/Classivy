import React, { useRef, useState } from 'react';
import { Student } from '../../types';

// State chia nhóm và đồng hồ bấm giờ.
export const useToolsState = () => {
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupSize, setGroupSize] = useState(2);
  const [generatedGroups, setGeneratedGroups] = useState<Student[][]>([]);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerTime, setTimerTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const timerRef = useRef<number | null>(null);

  return {
    showGroupModal, setShowGroupModal, groupSize, setGroupSize, generatedGroups,
    setGeneratedGroups, showTimerModal, setShowTimerModal, timerTime, setTimerTime,
    timerRunning, setTimerRunning, customMinutes, setCustomMinutes, timerRef
  };
};
