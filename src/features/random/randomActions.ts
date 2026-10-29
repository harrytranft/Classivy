import { BOSS_PARTY_SIZE, incrementBossEncounterCounter, isBossEncounterReady, normalizeClassBossState, selectBossParty } from '../../domain/bossSystem';
import { ActiveBossRound, ClassBossState } from '../../types';
import { createInstanceId } from '../../domain/random';
import { applyPointsToStudents } from '../../domain/points';
import { LUCKY_BONUS, SKILL_IDS, hasUsableSkill } from '../../domain/skills';
import { RandomMode } from '../../types/app';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Random: chọn chế độ, gọi học sinh công bằng, mở Boss Raid.
export interface HandleRandomOptions {
  /** Né Trực Diện: gọi lại, loại em này ra. */
  excludeStudentId?: string;
}

export interface RandomActions {
  incrementBossCounterForClass: (className?: string) => void;
  openBossEncounter: (className: string, state: ClassBossState, options?: { notify?: boolean; }) => boolean;
  handleRandom: (forceMode?: RandomMode, options?: HandleRandomOptions) => void;
}

export const createRandomActions = (appState: AppState, app: AppActions): RandomActions => {
  const {
    activeBossRound, activeRandomClassName, bossEncounterFrequency, bossStatesByClass,
    filterClass, presentStudents, setActiveBossRound, setBattleResultSummary, setBattleScoreA,
    setBattleScoreB, setBattleStudentA, setBattleStudentB, setBossStatesByClass, setRandomMode,
    setPerfectMarks, setRandomStudent, setSelectedStudentIds, setShowRandomModal, setStudents, setUncalledMap, students,
    showHatchAnnouncement, showPokemonReaction, posSoundUrl, uncalledMap
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

  // Vòng Quay Tự Tin: em được gọi trúng thì tự +2 điểm, trừ 1 lượt, ghi lịch sử (Phase 11, nhóm A).
  const applyLuckySkill = (student: typeof students[number]) => {
    if (!hasUsableSkill(student, SKILL_IDS.lucky)) return student;
    const reason = 'Skill Vòng Quay Tự Tin: được gọi trúng +2 điểm';
    const result = applyPointsToStudents(students, {
      ids: [student.id], amount: LUCKY_BONUS, reason, source: 'skill',
      overrides: { [student.id]: { amount: LUCKY_BONUS, reason, skillUse: { skillId: SKILL_IDS.lucky, skillName: 'Vòng Quay Tự Tin', detail: `được gọi trúng, +${LUCKY_BONUS} điểm` } } }
    });
    const updated = result.students.find(item => item.id === student.id) || student;
    // Chỉ thay em này (không ghi đè cả danh sách) để không mất thay đổi vừa xảy ra ở em khác, ví dụ lượt Né Trực Diện.
    setStudents(prev => prev.map(item => (item.id === student.id ? updated : item)));
    new Audio(posSoundUrl).play().catch(() => {});
    showPokemonReaction([{ type: 'xp', message: `Vòng Quay Tự Tin +${LUCKY_BONUS} điểm` }], `🎡 ${student.name} được gọi trúng`);
    if (result.hatchItems.length > 0) {
      showHatchAnnouncement(result.hatchItems, `Tin vui! Trứng của ${result.hatchItems.map(item => item.studentName).join(', ')} đã nở ra Pokémon đồng hành mới.`);
    }
    return updated;
  };

  const handleRandom = (forceMode?: RandomMode, options: HandleRandomOptions = {}) => {
    setBattleResultSummary(null);
    setPerfectMarks({});
    const available = options.excludeStudentId ? presentStudents.filter(s => s.id !== options.excludeStudentId) : presentStudents;
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

      const pickedStudent = students.find(s => s.id === chosenId) || available[0];
      const chosenStudent = applyLuckySkill(pickedStudent) || pickedStudent;
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
