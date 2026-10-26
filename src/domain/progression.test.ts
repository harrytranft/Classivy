import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_LUCKY_WHEEL_REWARDS } from '../data/constants';
import { Gender, LuckyWheelReward, Student } from '../types';
import { getLocalWeekKey } from './dates';
import { isGoodLuckyWheelReward, shuffleLuckyWheelRewards } from './luckyWheel';
import {
  getFusionCandidates,
  getSupportPetForStudent,
  getSynergyLabel,
  resetStudentPokemonLevels
} from './pokemonCollection';
import { createPokemonPetFromDexId } from './pokemonProgression';
import {
  addWeeklyChestProgress,
  advanceEggForStudent,
  appendAdventureJournal,
  applyAuraRewardToStudent,
  applyTrainerJourneyProgress,
  claimWeeklyChest,
  craftEggFromFragments
} from './progression';
import { PokemonUiEvent } from './gameEvents';

// Characterization tests cho các hàm tiến trình đã tách khỏi App.tsx.

const NOW = new Date('2026-10-26T09:00:00+07:00').getTime();

const makeStudent = (overrides: Partial<Student> = {}): Student => ({
  id: 'stu-1',
  name: 'An',
  gender: Gender.MALE,
  className: '6A',
  points: 20,
  history: [],
  ...overrides
});

const pet = (dexId: number, overrides = {}) => ({ ...createPokemonPetFromDexId(dexId, undefined, { isShiny: false }), ...overrides });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('appendAdventureJournal', () => {
  it('adds the newest entry first and keeps at most 80 entries', () => {
    const old = Array.from({ length: 80 }, (_, i) => ({ id: `old-${i}`, timestamp: i, type: 'mastery' as const, text: `old ${i}` }));
    const result = appendAdventureJournal(makeStudent({ adventureJournal: old }), { type: 'boss-win', text: 'Thắng boss' }, 123);
    expect(result.adventureJournal).toHaveLength(80);
    expect(result.adventureJournal?.[0]).toMatchObject({ type: 'boss-win', text: 'Thắng boss', timestamp: 123 });
    expect(result.adventureJournal?.[79].id).toBe('old-78');
  });
});

describe('applyTrainerJourneyProgress', () => {
  it('adds trainer XP and reports it as an event', () => {
    const events: PokemonUiEvent[] = [];
    const result = applyTrainerJourneyProgress(makeStudent(), 10, NOW, events, 'Homework Done');
    expect(result.trainerProgress?.totalXp).toBe(10);
    expect(events[0]).toEqual({ type: 'streak', message: 'An: Trainer +10 XP (Homework Done)' });
  });

  it('writes a journal entry when the trainer levels up', () => {
    const events: PokemonUiEvent[] = [];
    const result = applyTrainerJourneyProgress(makeStudent(), 500, NOW, events);
    expect(result.trainerProgress?.level).toBeGreaterThan(1);
    expect(events.some(event => event.type === 'level-up')).toBe(true);
    expect(result.adventureJournal?.some(entry => entry.type === 'trainer-level')).toBe(true);
  });

  it('does nothing visible for zero XP', () => {
    const events: PokemonUiEvent[] = [];
    const result = applyTrainerJourneyProgress(makeStudent(), 0, NOW, events);
    expect(events).toEqual([]);
    expect(result.trainerProgress?.totalXp).toBe(0);
  });
});

describe('weekly chest and egg fragments', () => {
  const weekKey = () => getLocalWeekKey(new Date(NOW));

  it('starts a new week from 0, adds progress and caps at 100', () => {
    const fresh = addWeeklyChestProgress(makeStudent({ weeklyChest: { weekKey: '2020-W01', progress: 90, claimed: true } }), 15);
    expect(fresh.weeklyChest).toEqual({ weekKey: weekKey(), progress: 15, claimed: false });
    const capped = addWeeklyChestProgress(makeStudent({ weeklyChest: { weekKey: weekKey(), progress: 95, claimed: false } }), 15);
    expect(capped.weeklyChest?.progress).toBe(100);
  });

  it('ignores non-positive amounts and already claimed chests', () => {
    const student = makeStudent();
    expect(addWeeklyChestProgress(student, 0)).toBe(student);
    const claimed = addWeeklyChestProgress(makeStudent({ weeklyChest: { weekKey: weekKey(), progress: 100, claimed: true } }), 10);
    expect(claimed.weeklyChest).toEqual({ weekKey: weekKey(), progress: 100, claimed: true });
  });

  it('opens a full chest: Pokémon +25 XP and +4 bond, +5 normal and +2 special fragments', () => {
    const active = pet(25, { bond: 10 });
    const ready = makeStudent({ pet: active, pets: [active], weeklyChest: { weekKey: weekKey(), progress: 100, claimed: false }, eggFragments: { normal: 1 } });
    const result = claimWeeklyChest(ready);
    expect(result.student.weeklyChest?.claimed).toBe(true);
    expect(result.student.eggFragments).toEqual({ normal: 6, special: 2 });
    expect(result.student.pet?.bond).toBe(14);
    expect(result.student.pet?.totalXp).toBe((active.totalXp || 0) + 25);
    expect(result.message).toContain('An mở Weekly Chest');
  });

  it('refuses to open a chest that is not ready', () => {
    const student = makeStudent({ weeklyChest: { weekKey: weekKey(), progress: 60, claimed: false } });
    const result = claimWeeklyChest(student);
    expect(result.student).toBe(student);
    expect(result.message).toBe('Weekly Chest chưa sẵn sàng.');
  });

  it('crafts an egg from 10 fragments of the same kind', () => {
    const notEnough = craftEggFromFragments(makeStudent({ eggFragments: { special: 9 } }), 'special');
    expect(notEnough.message).toContain('Cần 10');
    const crafted = craftEggFromFragments(makeStudent({ eggFragments: { special: 12 } }), 'special');
    expect(crafted.student.eggFragments?.special).toBe(2);
    expect(crafted.student.eggInventory?.[0]).toMatchObject({ kind: 'special', source: 'reward', status: 'egg', requiredProgress: 15 });
  });
});

describe('advanceEggForStudent', () => {
  it('gives a normal egg to a trainer without one when progress is positive', () => {
    const result = advanceEggForStudent(makeStudent(), 3);
    expect(result.egg).toMatchObject({ kind: 'normal', status: 'egg', progress: 3, requiredProgress: 10 });
    expect(result.hatchedPet).toBeNull();
  });

  it('does nothing without an egg when progress is not positive', () => {
    const result = advanceEggForStudent(makeStudent(), -2);
    expect(result.egg).toBeUndefined();
    expect(result.student.egg).toBeUndefined();
  });

  it('hatches the assigned Pokémon, keeps older Pokémon and counts the hatch', () => {
    const older = pet(4);
    const egg = { instanceId: 'egg-1', progress: 12, status: 'egg' as const, assignedDexId: 7, kind: 'special' as const, requiredProgress: 15 };
    const result = advanceEggForStudent(makeStudent({ egg, pets: [older] }), 10);
    expect(result.egg).toMatchObject({ status: 'hatched', progress: 15 });
    expect(result.hatchedPet?.dexId).toBe(7);
    expect(result.student.pet).toBe(result.hatchedPet);
    expect(result.student.pets?.map(p => p.dexId)).toEqual([7, 4]);
    expect(result.student.pokemonProgress?.hatchedEggs).toBe(1);
    expect(result.student.adventureJournal?.[0].type).toBe('pokemon-hatched');
  });
});

describe('applyAuraRewardToStudent', () => {
  it('adds points, history, egg progress and HP in one step', () => {
    const active = pet(25, { hp: 40 });
    const egg = { instanceId: 'egg-1', progress: 0, status: 'egg' as const, assignedDexId: 1, kind: 'normal' as const, requiredProgress: 10 };
    const result = applyAuraRewardToStudent(makeStudent({ pet: active, pets: [active], egg }), 5, 'Boss', NOW);
    expect(result.points).toBe(25);
    expect(result.history[0]).toMatchObject({ amount: 5, reason: 'Boss', timestamp: NOW });
    expect(result.egg?.progress).toBe(5);
    expect(result.pet?.hp).toBe(45);
  });
});

describe('pokemon collection helpers', () => {
  it('resets every Pokémon to level 1 but keeps HP and skills, without duplicates', () => {
    const active = pet(25, { level: 12, xp: 30, totalXp: 900, hp: 70, skills: ['sk1'], masteryStars: 2 });
    const other = pet(4, { level: 8 });
    const result = resetStudentPokemonLevels(makeStudent({ pet: active, pets: [active, other] }));
    expect(result.pet).toMatchObject({ level: 1, xp: 0, totalXp: 0, hp: 70, skills: ['sk1'], masteryStars: 0 });
    expect(result.pets?.map(p => [p.dexId, p.level])).toEqual([[25, 1], [4, 1]]);
  });

  it('finds the support Pokémon and the matching synergy', () => {
    const pikachu = pet(25);
    const eevee = pet(133);
    const student = makeStudent({ pet: pikachu, pets: [pikachu, eevee], supportPetInstanceId: eevee.instanceId });
    expect(getSupportPetForStudent(student)).toBe(eevee);
    expect(getSynergyLabel(student)).toBe('⚡🌟 Best Friends');
    expect(getSynergyLabel(makeStudent({ pet: pikachu, pets: [pikachu] }))).toBeNull();
  });

  it('lists fusion candidates with the active Pokémon first when it is not in the collection yet', () => {
    const active = pet(25);
    const stored = pet(1);
    expect(getFusionCandidates(makeStudent({ pet: active, pets: [stored] }))).toEqual([active, stored]);
    expect(getFusionCandidates(makeStudent({ pet: stored, pets: [stored] }))).toEqual([stored]);
  });
});

describe('lucky wheel helpers', () => {
  it('treats positive points/HP and Pokémon, skill, extra rolls as good rewards', () => {
    const reward = (type: LuckyWheelReward['type'], amount?: number): LuckyWheelReward => ({ id: type, label: type, icon: '', type, amount, color: '#000' });
    expect(isGoodLuckyWheelReward(reward('points', 3))).toBe(true);
    expect(isGoodLuckyWheelReward(reward('points', -3))).toBe(false);
    expect(isGoodLuckyWheelReward(reward('hp', -10))).toBe(false);
    expect(isGoodLuckyWheelReward(reward('pokemon'))).toBe(true);
    expect(isGoodLuckyWheelReward(reward('ludo_rolls', 1))).toBe(true);
  });

  it('shuffles without losing or duplicating rewards', () => {
    const shuffled = shuffleLuckyWheelRewards(DEFAULT_LUCKY_WHEEL_REWARDS);
    expect(shuffled).toHaveLength(DEFAULT_LUCKY_WHEEL_REWARDS.length);
    expect(new Set(shuffled.map(r => r.id))).toEqual(new Set(DEFAULT_LUCKY_WHEEL_REWARDS.map(r => r.id)));
  });
});
