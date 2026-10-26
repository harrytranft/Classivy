import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Gender, Student } from '../types';
import { resolveBattle } from './battle';
import { createPokemonPetFromDexId } from './pokemonProgression';

// Characterization tests cho chốt trận Battle.

const NOW = new Date('2026-10-26T09:00:00+07:00').getTime();

const fighter = (id: string, hp = 50): Student => {
  const pet = { ...createPokemonPetFromDexId(25, undefined, { isShiny: false }), hp };
  return {
    id, name: id.toUpperCase(), gender: Gender.MALE, className: '6A', points: 10, history: [],
    egg: { progress: 10, status: 'hatched', assignedDexId: 25, kind: 'normal', requiredProgress: 10 },
    pet, pets: [pet]
  };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('resolveBattle', () => {
  it('winner heals by the score gap, loser loses it; both keep their own battle points', () => {
    const a = fighter('a');
    const b = fighter('b');
    const result = resolveBattle([a, b, fighter('c')], { studentA: a, studentB: b, scoreA: 5, scoreB: 2 });

    expect(result.diff).toBe(3);
    expect(result.winner?.id).toBe('a');
    expect(result.updatedA.points).toBe(15);
    expect(result.updatedA.pet?.hp).toBe(53);
    expect(result.updatedB.points).toBe(12);
    expect(result.updatedB.pet?.hp).toBe(47);
    expect(result.updatedA.history[0]).toMatchObject({ amount: 5, reason: '🏆 Thắng Battle: +5đ (Pokemon +3 HP)' });
    expect(result.updatedB.history[0]).toMatchObject({ amount: 2, reason: '⚔️ Thua Battle: +2đ (Pokemon -3 HP)' });
    expect(result.updatedA.trainerProgress?.totalXp).toBe(10);
    expect(result.updatedA.weeklyChest?.progress).toBe(8);
    expect(result.updatedB.weeklyChest?.progress).toBe(3);
    expect(result.ludoTurns).toEqual([{ studentId: 'a', role: 'winner' }, { studentId: 'b', role: 'loser' }]);
    expect(result.resultMsg.startsWith('🏆 A CHIẾN THẮNG BATTLE!')).toBe(true);
    expect(result.students[2].points).toBe(10);
  });

  it('works the same when B wins and skips Ludo turns for zero scores', () => {
    const a = fighter('a');
    const b = fighter('b');
    const result = resolveBattle([a, b], { studentA: a, studentB: b, scoreA: 0, scoreB: 3 });
    expect(result.winner?.id).toBe('b');
    expect(result.updatedA.pet?.hp).toBe(47);
    expect(result.ludoTurns).toEqual([{ studentId: 'b', role: 'winner' }]);
  });

  it('a draw keeps HP and gives both a draw turn', () => {
    const a = fighter('a');
    const b = fighter('b');
    const result = resolveBattle([a, b], { studentA: a, studentB: b, scoreA: 2, scoreB: 2 });
    expect(result.winner).toBeNull();
    expect(result.updatedA.pet?.hp).toBe(50);
    expect(result.updatedB.pet?.hp).toBe(50);
    expect(result.ludoTurns).toEqual([{ studentId: 'a', role: 'draw' }, { studentId: 'b', role: 'draw' }]);
    expect(result.resultMsg).toContain('TRẬN BATTLE HÒA NHAU');
  });

  it('reports a release when the loser drops to 0 HP', () => {
    const a = fighter('a');
    const b = fighter('b', 2);
    const result = resolveBattle([a, b], { studentA: a, studentB: b, scoreA: 5, scoreB: 0 });
    expect(result.releaseEvent?.studentId).toBe('b');
    expect(result.updatedB.pet).toBeUndefined();
  });
});
