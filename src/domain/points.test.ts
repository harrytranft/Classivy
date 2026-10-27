import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Gender, Student } from '../types';
import { applyPointsToStudents, PointsUpdateInput } from './points';
import { createPokemonPetFromDexId } from './pokemonProgression';

// Characterization tests: ghi lại hành vi cộng/trừ điểm như trước khi tách khỏi App.tsx.

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

const withPet = (overrides: Partial<Student> = {}, hp = 50): Student => {
  const pet = { ...createPokemonPetFromDexId(25, undefined, { isShiny: false }), hp };
  return makeStudent({
    egg: { progress: 10, status: 'hatched', assignedDexId: 25, kind: 'normal', requiredProgress: 10 },
    pet,
    pets: [pet],
    ...overrides
  });
};

const run = (students: Student[], input: Partial<PointsUpdateInput>) =>
  applyPointsToStudents(students, { ids: ['stu-1'], amount: 5, reason: 'Phát biểu', source: 'manual', ...input });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('applyPointsToStudents', () => {
  it('adds points, writes history and heals the active Pokémon', () => {
    const other = makeStudent({ id: 'stu-2', name: 'Bình' });
    const result = run([withPet(), other], {});
    const updated = result.students[0];

    expect(updated.points).toBe(25);
    expect(updated.history[0]).toMatchObject({ amount: 5, reason: 'Phát biểu', timestamp: NOW });
    expect(updated.pet?.hp).toBe(55);
    expect(result.students[1]).toBe(other);
    expect(result.releaseEvent).toBeNull();
  });

  it('moves the egg forward by the same amount and hatches it when full', () => {
    const egg = { instanceId: 'egg-1', progress: 7, status: 'egg' as const, assignedDexId: 1, kind: 'normal' as const, requiredProgress: 10 };
    const result = run([makeStudent({ egg })], { amount: 5 });
    const updated = result.students[0];

    expect(updated.egg?.status).toBe('hatched');
    expect(updated.egg?.progress).toBe(10);
    expect(updated.pet?.dexId).toBe(1);
    expect(updated.pokemonProgress?.hatchedEggs).toBe(1);
    expect(result.hatchItems).toEqual([{ studentId: 'stu-1', studentName: 'An', pet: updated.pet }]);
    expect(updated.adventureJournal?.[0].type).toBe('pokemon-hatched');
  });

  it('never moves the egg backwards when points are taken away', () => {
    const egg = { instanceId: 'egg-1', progress: 4, status: 'egg' as const, assignedDexId: 1, kind: 'normal' as const, requiredProgress: 10 };
    const result = run([makeStudent({ egg })], { amount: -3, source: 'solo' });
    expect(result.students[0].egg?.progress).toBe(4);
    expect(result.students[0].points).toBe(17);

    const manual = run([makeStudent({ egg })], { amount: -3, source: 'manual' });
    expect(manual.students[0].egg?.progress).toBe(4);
    expect(manual.students[0].points).toBe(17);
  });

  it('releases the Pokémon when HP reaches 0', () => {
    const result = run([withPet({}, 3)], { amount: -5 });
    expect(result.releaseEvent?.studentId).toBe('stu-1');
    expect(result.students[0].pet).toBeUndefined();
    expect(result.students[0].points).toBe(15);
  });

  it('gives trainer XP and weekly chest progress for a positive solo answer only', () => {
    const solo = run([withPet()], { amount: 4, source: 'solo' });
    const soloStudent = solo.students[0];
    expect(soloStudent.trainerProgress?.totalXp).toBe(5);
    expect(soloStudent.weeklyChest?.progress).toBe(3);
    expect(solo.progressionEvents.some(event => event.message.includes('Trainer +5 XP'))).toBe(true);

    const manual = run([withPet()], { amount: 4, source: 'manual' });
    expect(manual.students[0].trainerProgress?.totalXp ?? 0).toBe(0);
    expect(manual.students[0].weeklyChest).toBeUndefined();
    expect(manual.progressionEvents).toEqual([]);
  });

  it('leaves students that were not selected untouched', () => {
    const a = withPet();
    const b = makeStudent({ id: 'stu-2' });
    const result = run([a, b], { ids: ['stu-2'], amount: 2 });
    expect(result.students[0]).toBe(a);
    expect(result.students[1].points).toBe(22);
  });
});
