import { AdventureJournalEntry, EggKind, HistoryItem, PokemonPet, Student } from '../types';
import { PokemonUiEvent, applyPetHpDeltaToStudent } from './gameEvents';
import { addTrainerXp, applyBadgeRewards, getBadgeDefinition, normalizeTrainerProgress } from './trainerProgression';
import { getLocalWeekKey } from './dates';
import { addPokemonXp, createPokemonPetFromDexId, getPokemonDisplayName, normalizeStudentPokemonData, updatePetInCollection } from './pokemonProgression';
import { createEgg, getEggLabel, getEggRequiredProgress } from './eggs';
import { isSamePokemon } from './pokemonCollection';

// Tiến trình của trainer: nhật ký phiêu lưu, XP/huy hiệu, rương tuần, mảnh trứng, ấp trứng, thưởng Hào Quang. Hàm thuần, có test.

export const appendAdventureJournal = (
  student: Student,
  entry: Omit<AdventureJournalEntry, 'id' | 'timestamp'>,
  timestamp = Date.now()
): Student => ({
  ...student,
  adventureJournal: [
    {
      id: `${timestamp}${Math.random()}`,
      timestamp,
      ...entry
    },
    ...(student.adventureJournal || [])
  ].slice(0, 80)
});

export const applyTrainerJourneyProgress = (
  student: Student,
  xpGain: number,
  timestamp: number,
  uiEvents: PokemonUiEvent[],
  reason?: string
): Student => {
  let nextStudent: Student = {
    ...student,
    trainerProgress: normalizeTrainerProgress(student),
    earnedBadges: student.earnedBadges || []
  };

  if (xpGain > 0) {
    const xpResult = addTrainerXp(nextStudent, xpGain);
    nextStudent = xpResult.student;
    uiEvents.push({
      type: 'streak',
      message: `${student.name}: Trainer +${xpGain} XP${reason ? ` (${reason})` : ''}`
    });
    if (xpResult.levelUps > 0) {
      uiEvents.push({
        type: 'level-up',
        message: `${student.name}: Trainer Lv.${nextStudent.trainerProgress?.level}`
      });
      nextStudent = appendAdventureJournal(nextStudent, {
        type: 'trainer-level',
        text: `${student.name} reached Trainer Lv.${nextStudent.trainerProgress?.level}.`
      }, timestamp);
    }
  }

  const badgeResult = applyBadgeRewards(nextStudent, timestamp);
  nextStudent = badgeResult.student;
  badgeResult.newBadges.forEach(badge => {
    const definition = getBadgeDefinition(badge.badgeId);
    uiEvents.push({
      type: 'mastery',
      message: `${student.name}: ${definition?.icon || '🏅'} ${definition?.name || 'Badge'}`
    });
    nextStudent = appendAdventureJournal(nextStudent, {
      type: 'badge-earned',
      text: `${student.name} earned ${definition?.name || 'a Gym Badge'}.`
    }, badge.earnedAt);
  });
  if (badgeResult.trainerLevelUps > 0) {
    uiEvents.push({
      type: 'level-up',
      message: `${student.name}: Trainer Lv.${nextStudent.trainerProgress?.level}`
    });
  }

  return {
    ...nextStudent,
    trainerProgress: normalizeTrainerProgress(nextStudent)
  };
};

export const addWeeklyChestProgress = (student: Student, amount: number): Student => {
  if (amount <= 0) return student;
  const weekKey = getLocalWeekKey();
  const current = student.weeklyChest?.weekKey === weekKey
    ? student.weeklyChest
    : { weekKey, progress: 0, claimed: false };
  if (current.claimed) return { ...student, weeklyChest: current };
  return {
    ...student,
    weeklyChest: {
      ...current,
      progress: Math.min(100, current.progress + amount)
    }
  };
};

export const claimWeeklyChest = (student: Student): { student: Student; message: string } => {
  const current = student.weeklyChest;
  if (!current || current.progress < 100 || current.claimed) {
    return { student, message: 'Weekly Chest chưa sẵn sàng.' };
  }

  let nextStudent = normalizeStudentPokemonData(student);
  if (nextStudent.pet) {
    const xpResult = addPokemonXp(nextStudent.pet, 25);
    const nextPet = {
      ...xpResult.pet,
      bond: Math.min(100, (xpResult.pet.bond || 0) + 4)
    };
    nextStudent = {
      ...nextStudent,
      pet: nextPet,
      pets: updatePetInCollection(nextStudent, nextPet)
    };
  }

  nextStudent = {
    ...nextStudent,
    weeklyChest: {
      ...current,
      claimed: true
    },
    eggFragments: {
      ...(nextStudent.eggFragments || {}),
      normal: (nextStudent.eggFragments?.normal || 0) + 5,
      special: (nextStudent.eggFragments?.special || 0) + 2
    }
  };

  return {
    student: nextStudent,
    message: `${student.name} mở Weekly Chest: Pokémon +25 XP, +4 Bond, +5 Normal Fragment, +2 Special Fragment`
  };
};

export const craftEggFromFragments = (student: Student, kind: Exclude<EggKind, 'legendary'>): { student: Student; message: string } => {
  const current = student.eggFragments?.[kind] || 0;
  if (current < 10) return { student, message: `Cần 10 ${getEggLabel(kind)} fragments để craft.` };
  const nextStudent: Student = {
    ...student,
    eggFragments: {
      ...(student.eggFragments || {}),
      [kind]: current - 10
    },
    eggInventory: [createEgg(kind, 'reward'), ...(student.eggInventory || [])]
  };
  return {
    student: nextStudent,
    message: `${student.name} craft thành công ${getEggLabel(kind)} từ fragments.`
  };
};

export const advanceEggForStudent = (student: Student, amount: number) => {
  let currentEgg = student.egg ? { ...student.egg } : amount > 0 ? createEgg('normal') : undefined;
  let currentStudent = student;
  let hatchedPet: PokemonPet | null = null;

  if (amount > 0 && currentEgg?.status === 'egg') {
    const requiredProgress = getEggRequiredProgress(currentEgg);
    const nextProgress = currentEgg.progress + amount;
    currentEgg = {
      ...currentEgg,
      requiredProgress,
      progress: Math.max(0, Math.min(requiredProgress, nextProgress))
    };

    if (currentEgg.progress >= requiredProgress) {
      currentEgg.status = 'hatched';
      hatchedPet = createPokemonPetFromDexId(currentEgg.assignedDexId);
      currentStudent = {
        ...currentStudent,
        pet: hatchedPet,
        pets: [hatchedPet, ...(currentStudent.pets || []).filter(p => !isSamePokemon(p, hatchedPet))],
        pokemonProgress: {
          ...currentStudent.pokemonProgress!,
          hatchedEggs: (currentStudent.pokemonProgress?.hatchedEggs || 0) + 1
        }
      };
      currentStudent = appendAdventureJournal(currentStudent, {
        type: 'pokemon-hatched',
        text: `${getPokemonDisplayName(hatchedPet)} hatched for ${student.name}.`,
        petInstanceId: hatchedPet.instanceId
      });
      if (hatchedPet.isShiny) {
        currentStudent = appendAdventureJournal(currentStudent, {
          type: 'shiny-acquired',
          text: `${student.name} discovered Shiny ${getPokemonDisplayName(hatchedPet)}.`,
          petInstanceId: hatchedPet.instanceId
        });
      }
    }
  }

  return {
    student: {
      ...currentStudent,
      egg: currentEgg
    },
    egg: currentEgg,
    hatchedPet
  };
};

export const applyAuraRewardToStudent = (student: Student, amount: number, reason: string, timestamp: number): Student => {
  const historyItem: HistoryItem = {
    id: `${timestamp}${Math.random()}`,
    amount,
    reason,
    timestamp
  };
  let currentStudent: Student = {
    ...normalizeStudentPokemonData(student),
    points: student.points + amount
  };
  const eggResult = advanceEggForStudent(currentStudent, amount);
  currentStudent = eggResult.student;
  if (currentStudent.pet && amount !== 0) {
    const hpUpdate = applyPetHpDeltaToStudent(
      currentStudent,
      amount,
      `${reason}: ${amount > 0 ? 'hồi' : 'mất'} ${Math.abs(amount)} HP`
    );
    currentStudent = hpUpdate.student;
  }
  return {
    ...currentStudent,
    history: [historyItem, ...currentStudent.history].slice(0, 50)
  };
};
