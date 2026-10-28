import { describe, expect, it } from 'vitest';
import { Student, PokemonPet } from '../types';
import { REVIVE_POINTS, applyRetainedSkills, canReviveStudent, reviveStudent } from './revive';
import { normalizeStudentPokemonData } from './pokemonProgression';

const pet = (instanceId: string, skills: string[], skillUses: Record<string, number> = {}): PokemonPet => ({
  instanceId, dexId: 25, name: 'Pikachu', types: ['Electric'], accessories: [], skills, skillUses, hp: 80
});

const baseStudent = (over: Partial<Student> = {}): Student => ({
  id: 's1', name: 'An', gender: 'male', className: 'SPK', points: -25, history: [], ...over
} as Student);

describe('hồi sinh', () => {
  it('chỉ hồi sinh được khi điểm <= -20', () => {
    expect(canReviveStudent({ points: -20 })).toBe(true);
    expect(canReviveStudent({ points: -19 })).toBe(false);
    const s = baseStudent({ points: -5 });
    expect(reviveStudent(s)).toBe(s);
  });

  it('đưa điểm về 20, mất Pokémon, giữ trứng, ghi lịch sử', () => {
    const p = pet('a', ['sk_guard']);
    const s = baseStudent({
      pet: p, pets: [p], supportPetInstanceId: 'a',
      egg: { progress: 4, requiredProgress: 10 } as Student['egg'],
      eggInventory: [{ progress: 0, requiredProgress: 10 } as NonNullable<Student['egg']>]
    });
    const r = reviveStudent(s, 1000);
    expect(r.points).toBe(REVIVE_POINTS);
    expect(r.pet).toBeUndefined();
    expect(r.pets).toEqual([]);
    expect(r.supportPetInstanceId).toBeUndefined();
    expect(r.egg).toEqual(s.egg);
    expect(r.eggInventory).toEqual(s.eggInventory);
    expect(r.history[0].amount).toBe(45);
  });

  it('giữ skills và số lượt đã dùng, gắn vào Pokémon kế tiếp', () => {
    const p1 = pet('a', ['sk_guard', 'sk_lucky'], { sk_guard: 1, sk_lucky: 0 });
    const p2 = pet('b', ['sk_guard'], { sk_guard: 0 });
    const r = reviveStudent(baseStudent({ pet: p1, pets: [p1, p2] }));
    expect(r.retainedSkills).toEqual({ skills: ['sk_guard', 'sk_lucky'], skillUses: { sk_guard: 0, sk_lucky: 0 } });
    const newPet = pet('c', []);
    const next = normalizeStudentPokemonData({ ...r, pet: newPet, pets: [newPet] });
    expect(next.retainedSkills).toBeUndefined();
    expect(next.pet?.skills).toEqual(['sk_guard', 'sk_lucky']);
    expect(applyRetainedSkills(r)).toBe(r);
  });
});
