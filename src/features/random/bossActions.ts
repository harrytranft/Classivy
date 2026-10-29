import { BossMemberResult, normalizeClassBossState, resolveBossRound } from '../../domain/bossSystem';
import { PokemonReleaseEvent } from '../../types';
import { PokemonUiEvent, applyPetHpDeltaToStudent } from '../../domain/gameEvents';
import { normalizeStudentPokemonData } from '../../domain/pokemonProgression';
import { createEgg } from '../../domain/eggs';
import { BattleLudoTurn } from '../../types/app';
import { addWeeklyChestProgress, appendAdventureJournal, applyAuraRewardToStudent, applyTrainerJourneyProgress } from '../../domain/progression';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Chốt lượt Boss Raid theo từng em (Phase 13B, D54): em đúng gây sát thương và nhận thưởng, em sai chỉ Pokémon của em đó bị phản công.
export interface BossActions {
  handleResolveBossRound: (results: BossMemberResult[]) => void;
}

export const createBossActions = (appState: AppState, app: AppActions): BossActions => {
  const {
    activeBossRound, bossEncounterFrequency, bossRoundResolving, bossStatesByClass,
    negSoundUrl, posSoundUrl, queuePokemonReleaseEvents, setActiveBossRound,
    setBattleLudoQueue, setBossDefeatedAnnouncement, setBossRoundResolving,
    setBossRoundVisualResult, setBossStatesByClass, setSelectedStudentIds, setShowRandomModal,
    setStudents, showPokemonReaction, students
  } = appState;

  const handleResolveBossRound = (results: BossMemberResult[]) => {
    if (!activeBossRound || bossRoundResolving) return;
    // Phải chấm đủ cả nhóm, đúng những em đang trong vòng này.
    const partyIds = activeBossRound.partyStudentIds;
    const resultById = new Map(results.map(item => [item.studentId, item.correct]));
    if (results.length !== partyIds.length || !partyIds.every(id => resultById.has(id))) return;
    const className = activeBossRound.className;
    const state = normalizeClassBossState(bossStatesByClass[className], className, bossEncounterFrequency);
    if (state.boss.instanceId !== activeBossRound.bossInstanceId) {
      alert('Boss round này đã cũ. Hãy Random lại để mở encounter mới.');
      setActiveBossRound(null);
      return;
    }

    const orderedResults: BossMemberResult[] = partyIds.map(studentId => ({ studentId, correct: !!resultById.get(studentId) }));
    const correctIds = new Set(orderedResults.filter(item => item.correct).map(item => item.studentId));
    const anyCorrect = correctIds.size > 0;
    const anyWrong = correctIds.size < partyIds.length;
    const visualResult = !anyWrong ? 'success' : anyCorrect ? 'mixed' : 'failure';

    setBossRoundResolving(true);
    setBossRoundVisualResult(visualResult);
    window.setTimeout(() => setBossRoundVisualResult(null), 900);
    const timestamp = Date.now();
    const resolution = resolveBossRound(state, orderedResults, activeBossRound.roundId, timestamp, bossEncounterFrequency);
    const topRewardIds = resolution.bossDefeated ? new Set(resolution.topContributors.map(contribution => contribution.studentId)) : new Set<string>();
    const releaseEvents: PokemonReleaseEvent[] = [];
    const journeyEvents: PokemonUiEvent[] = [];

    const updatedStudents = students.map(student => {
      let nextStudent = normalizeStudentPokemonData(student);

      if (correctIds.has(student.id)) {
        nextStudent = applyAuraRewardToStudent(
          nextStudent,
          5,
          `👹 Boss Raid thành công: +5 Hào Quang`,
          timestamp
        );
        nextStudent = {
          ...nextStudent,
          pokemonProgress: {
            ...nextStudent.pokemonProgress!,
            bossSuccessfulRounds: (nextStudent.pokemonProgress?.bossSuccessfulRounds || 0) + 1
          }
        };
        nextStudent = applyTrainerJourneyProgress(nextStudent, 10, timestamp, journeyEvents, 'Boss Success');
        nextStudent = addWeeklyChestProgress(nextStudent, 5);
        nextStudent = appendAdventureJournal(nextStudent, {
          type: 'boss-win',
          text: `${nextStudent.name} helped land a successful hit on ${state.boss.name}.`,
          metadata: { damage: state.boss.damagePerSuccessfulStudent }
        }, timestamp);
      }

      if (partyIds.includes(student.id) && !correctIds.has(student.id)) {
        const hpUpdate = applyPetHpDeltaToStudent(
          nextStudent,
          -state.boss.failDamage,
          `👹 Boss phản công: Pokémon -${state.boss.failDamage} HP`
        );
        nextStudent = hpUpdate.student;
        if (hpUpdate.releaseEvent) releaseEvents.push(hpUpdate.releaseEvent);
        nextStudent = {
          ...nextStudent,
          history: [{
            id: `${timestamp}${Math.random()}`,
            amount: 0,
            reason: `👹 Boss phản công: Pokémon -${state.boss.failDamage} HP`,
            timestamp
          }, ...nextStudent.history].slice(0, 50)
        };
      }

      if (topRewardIds.has(student.id)) {
        nextStudent = {
          ...nextStudent,
          pokemonProgress: {
            ...nextStudent.pokemonProgress!,
            bossTop5Finishes: (nextStudent.pokemonProgress?.bossTop5Finishes || 0) + 1
          }
        };
        nextStudent = applyAuraRewardToStudent(
          nextStudent,
          5,
          `🏆 Top 5 Boss Contributor: +5 Hào Quang + Legendary Egg`,
          timestamp
        );
        nextStudent = {
          ...nextStudent,
          eggInventory: [createEgg('legendary', 'boss'), ...(nextStudent.eggInventory || [])]
        };
        nextStudent = applyTrainerJourneyProgress(nextStudent, 25, timestamp, journeyEvents, 'Boss Top 5');
        nextStudent = appendAdventureJournal(nextStudent, {
          type: 'boss-top5',
          text: `${nextStudent.name} finished Top 5 against ${state.boss.name} and received a Legendary Egg.`
        }, timestamp);
      }

      return nextStudent;
    });

    setStudents(updatedStudents);
    setBossStatesByClass(prev => ({
      ...prev,
      [className]: resolution.state
    }));
    setActiveBossRound(null);
    setSelectedStudentIds([]);
    setBossRoundResolving(false);
    // Chỉ các em trả lời đúng được lắc Cá Ngựa (như luật cũ: thành công mới có lượt).
    const bossLudoTurns: BattleLudoTurn[] = partyIds.filter(id => correctIds.has(id)).map(studentId => ({ studentId, role: 'boss' }));
    if (bossLudoTurns.length > 0) {
      const firstBossStudent = updatedStudents.find(student => student.id === bossLudoTurns[0].studentId) || null;
      if (firstBossStudent) {
        setShowRandomModal(false);
        setBattleLudoQueue(bossLudoTurns);
        app.openLudoForClass(className, firstBossStudent, 'boss');
      }
    }

    if (releaseEvents.length > 0) queuePokemonReleaseEvents(releaseEvents);
    if (resolution.bossDefeated) {
      setBossDefeatedAnnouncement({
        boss: {
          ...state.boss,
          currentHp: 0,
          defeatedAt: timestamp
        },
        topContributors: resolution.topContributors
      });
    }

    const wrongCount = partyIds.length - correctIds.size;
    const eventMessage = resolution.comboTriggered
      ? `Combo hoàn hảo! ${state.boss.name} -${resolution.damageDealt} HP`
      : anyCorrect
        ? `${state.boss.name} -${resolution.damageDealt} HP, ${wrongCount} Pokémon bị phản công -${state.boss.failDamage} HP`
        : `${state.boss.name} phản công: Pokémon -${state.boss.failDamage} HP`;
    const reactionTitle = resolution.comboTriggered ? 'Boss Raid: Combo hoàn hảo' : anyCorrect ? 'Boss Raid: đánh trúng một phần' : 'Boss Raid thất bại';
    showPokemonReaction([{ type: anyCorrect ? 'hp' : 'random-drop', message: eventMessage }, ...journeyEvents.slice(0, 3)], reactionTitle);
    new Audio(anyCorrect ? posSoundUrl : negSoundUrl).play().catch(() => {});
  };

  return {
    handleResolveBossRound
  };
};
