import { BOSS_PARTY_SIZE, incrementBossEncounterCounter, isBossEncounterReady, normalizeClassBossState, selectBossParty } from '../../domain/bossSystem';
import { ActiveBossRound, ClassBossState } from '../../types';
import { createInstanceId } from '../../domain/random';
import { RandomMode } from '../../types/app';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Random: chọn chế độ, gọi học sinh công bằng, mở Boss Raid.
export interface RandomActions {
  incrementBossCounterForClass: (className?: string) => void;
  openBossEncounter: (className: string, state: ClassBossState, options?: { notify?: boolean; }) => boolean;
  handleRandom: (forceMode?: RandomMode) => void;
}

export const createRandomActions = (appState: AppState, app: AppActions): RandomActions => {
  const {
    activeBossRound, activeRandomClassName, bossEncounterFrequency, bossStatesByClass,
    filterClass, presentStudents, setActiveBossRound, setBattleResultSummary, setBattleScoreA,
    setBattleScoreB, setBattleStudentA, setBattleStudentB, setBossStatesByClass, setRandomMode,
    setRandomStudent, setSelectedStudentIds, setShowRandomModal, setUncalledMap, students,
    uncalledMap
  } = appState;

  const incrementBossCounterForClass = (className?: string) => {
    if (!className) return;
    setBossStatesByClass(prev => {
      const state = normalizeClassBossState(prev[className], className, bossEncounterFrequency);
      return {
        ...prev,
        [className]: incrementBossEncounterCounter(state)
      };
    });
  };

  const openBossEncounter = (className: string, state: ClassBossState, options: { notify?: boolean } = {}): boolean => {
    const classStudents = students.filter(student => student.className === className);
    const { party, nextQueue } = selectBossParty(classStudents, state.participantQueue, state.previousPartyIds);
    if (party.length < BOSS_PARTY_SIZE) {
      if (options.notify) {
        alert(`Boss đã xuất hiện nhưng cần ít nhất ${BOSS_PARTY_SIZE} trainer đang có Pokémon còn HP để chiến đấu.`);
      }
      return false;
    }

    const round: ActiveBossRound = {
      roundId: createInstanceId('boss-round'),
      bossInstanceId: state.boss.instanceId,
      className,
      partyStudentIds: party.map(student => student.id),
      openedAt: Date.now()
    };

    setBossStatesByClass(prev => ({
      ...prev,
      [className]: {
        ...state,
        encounterReady: true,
        participantQueue: nextQueue,
        updatedAt: Date.now()
      }
    }));
    setActiveBossRound(round);
    setRandomMode('boss');
    setRandomStudent(null);
    setBattleStudentA(null);
    setBattleStudentB(null);
    setBattleResultSummary(null);
    setSelectedStudentIds(round.partyStudentIds);
    setShowRandomModal(true);
    return true;
  };

  const handleRandom = (forceMode?: RandomMode) => {
    setBattleResultSummary(null);
    const available = presentStudents;
    if (available.length === 0) return alert("Không có trainer nào hiện diện.");

    if (activeRandomClassName) {
      if (activeBossRound?.className === activeRandomClassName) {
        setRandomMode('boss');
        setSelectedStudentIds(activeBossRound.partyStudentIds);
        setShowRandomModal(true);
        return;
      }
      const bossState = normalizeClassBossState(bossStatesByClass[activeRandomClassName], activeRandomClassName, bossEncounterFrequency);
      const bossReady = isBossEncounterReady(bossState);
      if (bossReady && openBossEncounter(activeRandomClassName, { ...bossState, encounterReady: true }, { notify: forceMode === 'boss' })) return;
      if (forceMode === 'boss') {
        setActiveBossRound(null);
        setRandomMode('boss');
        setShowRandomModal(true);
        return;
      }
    } else if (forceMode === 'boss') {
      setActiveBossRound(null);
      setRandomMode('boss');
      setShowRandomModal(true);
      return;
    }
    
    // Pick mode: if forceMode provided use it, otherwise randomly pick solo or battle (50/50 if available.length >= 2)
    const mode = forceMode
      ? forceMode
      : (available.length >= 2 ? (Math.random() > 0.5 ? 'battle' : 'solo') : 'solo');
    setRandomMode(mode);

    if (mode === 'solo') {
      let currentQueue = uncalledMap[filterClass] || [];
      currentQueue = currentQueue.filter(id => available.some(s => s.id === id));

      if (currentQueue.length === 0) {
        currentQueue = available.map(s => s.id);
      }

      const randomIndex = Math.floor(Math.random() * currentQueue.length);
      const chosenId = currentQueue[randomIndex];
      const nextQueue = currentQueue.filter(id => id !== chosenId);

      setUncalledMap(prev => ({ ...prev, [filterClass]: nextQueue }));

      const chosenStudent = students.find(s => s.id === chosenId) || available[0];
      setRandomStudent(chosenStudent);
      setSelectedStudentIds([chosenStudent.id]);
    } else {
      // Battle Mode: pick 2 distinct random students
      const shuffled = [...available].sort(() => 0.5 - Math.random());
      const sA = shuffled[0];
      const sB = shuffled[1];
      setBattleStudentA(sA);
      setBattleStudentB(sB);
      setBattleScoreA(0);
      setBattleScoreB(0);
      setSelectedStudentIds([sA.id, sB.id]);
    }

    setShowRandomModal(true);
  };

  return {
    incrementBossCounterForClass, openBossEncounter, handleRandom
  };
};
