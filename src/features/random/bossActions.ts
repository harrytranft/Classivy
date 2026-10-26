import { normalizeClassBossState, resolveBossFailure, resolveBossSuccess } from '../../domain/bossSystem';
import { PokemonReleaseEvent } from '../../types';
import { PokemonUiEvent, applyPetHpDeltaToStudent } from '../../domain/gameEvents';
import { normalizeStudentPokemonData } from '../../domain/pokemonProgression';
import { createEgg } from '../../domain/eggs';
import { BattleLudoTurn } from '../../types/app';
import { addWeeklyChestProgress, appendAdventureJournal, applyAuraRewardToStudent, applyTrainerJourneyProgress } from '../../domain/progression';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Chốt lượt Boss Raid.
export interface BossActions {
  handleResolveBossRound: (result: "success" | "failure") => void;
}

export const createBossActions = (appState: AppState, app: AppActions): BossActions => {
  const {
    activeBossRound, bossEncounterFrequency, bossRoundResolving, bossStatesByClass,
    negSoundUrl, posSoundUrl, queuePokemonReleaseEvents, setActiveBossRound,
    setBattleLudoQueue, setBossDefeatedAnnouncement, setBossRoundResolving,
    setBossRoundVisualResult, setBossStatesByClass, setSelectedStudentIds, setShowRandomModal,
    setStudents, showPokemonReaction, students
  } = appState;

  const handleResolveBossRound = (result: 'success' | 'failure') => {
    if (!activeBossRound || bossRoundResolving) return;
    const className = activeBossRound.className;
    const state = normalizeClassBossState(bossStatesByClass[className], className, bossEncounterFrequency);
    if (state.boss.instanceId !== activeBossRound.bossInstanceId) {
      alert('Boss round này đã cũ. Hãy Random lại để mở encounter mới.');
      setActiveBossRound(null);
      return;
    }

    setBossRoundResolving(true);
    setBossRoundVisualResult(result);
    window.setTimeout(() => setBossRoundVisualResult(null), 900);
    const timestamp = Date.now();
    const partyIds = activeBossRound.partyStudentIds;
    const resolution = result === 'success'
      ? resolveBossSuccess(state, partyIds, activeBossRound.roundId, timestamp, bossEncounterFrequency)
      : resolveBossFailure(state, partyIds, activeBossRound.roundId, timestamp, bossEncounterFrequency);
    const topRewardIds = resolution.bossDefeated ? new Set(resolution.topContributors.map(contribution => contribution.studentId)) : new Set<string>();
    const releaseEvents: PokemonReleaseEvent[] = [];
    const journeyEvents: PokemonUiEvent[] = [];

    const updatedStudents = students.map(student => {
      let nextStudent = normalizeStudentPokemonData(student);

      if (result === 'success' && partyIds.includes(student.id)) {
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

      if (result === 'failure' && partyIds.includes(student.id)) {
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
    if (result === 'success') {
      const bossLudoTurns: BattleLudoTurn[] = partyIds.map(studentId => ({ studentId, role: 'boss' }));
      const firstBossStudent = updatedStudents.find(student => student.id === bossLudoTurns[0]?.studentId) || null;
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

    const eventMessage = result === 'success'
      ? `Perfect Team Attack: ${state.boss.name} -${resolution.damageDealt} HP`
      : `${state.boss.name} phản công: Pokémon -${state.boss.failDamage} HP`;
    showPokemonReaction([{ type: result === 'success' ? 'hp' : 'random-drop', message: eventMessage }, ...journeyEvents.slice(0, 3)], result === 'success' ? 'Boss Raid thành công' : 'Boss Raid thất bại');
    new Audio(result === 'success' ? posSoundUrl : negSoundUrl).play().catch(() => {});
  };

  return {
    handleResolveBossRound
  };
};
