import { Student } from '../../types';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Chia nhóm và đồng hồ bấm giờ.
export interface ToolsActions {
  handleMakeGroups: () => void;
  startTimer: (seconds: number) => void;
}

export const createToolsActions = (appState: AppState, app: AppActions): ToolsActions => {
  const {
    groupSize, presentStudents, setGeneratedGroups, setShowGroupModal, setTimerRunning,
    setTimerTime, timerRef, timerSoundUrl
  } = appState;

  const handleMakeGroups = () => {
    const shuffled = [...presentStudents].sort(() => 0.5 - Math.random());
    const result: Student[][] = [];
    for (let i = 0; i < shuffled.length; i += groupSize) {
      result.push(shuffled.slice(i, i + groupSize));
    }
    setGeneratedGroups(result);
    setShowGroupModal(true);
  };

  const startTimer = (seconds: number) => {
    setTimerTime(seconds);
    setTimerRunning(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimerTime(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerRunning(false);
          new Audio(timerSoundUrl).play().catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return {
    handleMakeGroups, startTimer
  };
};
