import { describe, expect, it } from 'vitest';
import { PokemonPet, Student } from '../types';
import { grantPokemonToStudent } from './pokemonGrant';

const pet = (instanceId: string, extra: Partial<PokemonPet> = {}): PokemonPet => ({ instanceId, dexId: 25, name: 'Pikachu', types: ['Electric'], accessories: [], ...extra } as unknown as PokemonPet);
const student = (extra: Partial<Student> = {}): Student => ({ id: 's1', name: 'An', className: '6A', gender: 'Nam', points: 0, history: [], ...extra } as unknown as Student);

describe('grantPokemonToStudent', () => {
  it('companion always (Vòng quay may mắn): Pokémon mới thành đồng hành, đứng đầu bộ sưu tập, Pokémon cũ vẫn giữ', () => {
    const old = pet('old');
    const fresh = pet('new', { dexId: 1, name: 'Bulbasaur' });
    const result = grantPokemonToStudent(student({ pet: old, pets: [old] }), fresh, { historyReason: 'x', companion: 'always' });
    expect(result.pet?.instanceId).toBe('new');
    expect(result.pets?.map(p => p.instanceId)).toEqual(['new', 'old']);
    expect(result.history[0]).toMatchObject({ amount: 0, reason: 'x' });
  });
  it('đồng hành đang đứng ngoài bộ sưu tập thì được thêm vào, không mất', () => {
    const old = pet('old');
    const result = grantPokemonToStudent(student({ pet: old, pets: [] }), pet('new'), { historyReason: 'x', companion: 'always' });
    expect(result.pets?.map(p => p.instanceId)).toEqual(['new', 'old']);
  });
  it('ifNone: đã có đồng hành thì giữ đồng hành, Pokémon mới vào cuối bộ sưu tập', () => {
    const old = pet('old');
    const result = grantPokemonToStudent(student({ pet: old, pets: [old] }), pet('new'), { historyReason: 'x', companion: 'ifNone' });
    expect(result.pet?.instanceId).toBe('old');
    expect(result.pets?.map(p => p.instanceId)).toEqual(['old', 'new']);
  });
  it('ifNone: chưa có đồng hành thì Pokémon mới thành đồng hành', () => {
    const result = grantPokemonToStudent(student(), pet('new'), { historyReason: 'x', companion: 'ifNone' });
    expect(result.pet?.instanceId).toBe('new');
    expect(result.pets?.map(p => p.instanceId)).toEqual(['new']);
  });
  it('Shiny ghi nhật ký phiêu lưu; thường thì không', () => {
    const shiny = grantPokemonToStudent(student(), pet('new', { isShiny: true }), { historyReason: 'x', companion: 'always', shinyJournalText: 'Shiny!' });
    expect(shiny.adventureJournal?.[0]).toMatchObject({ type: 'shiny-acquired', text: 'Shiny!', petInstanceId: 'new' });
    expect(grantPokemonToStudent(student(), pet('n2'), { historyReason: 'x', companion: 'always' }).adventureJournal).toBeUndefined();
  });
  it('không đổi học sinh gốc và giữ tối đa 50 dòng lịch sử', () => {
    const base = student({ history: Array.from({ length: 50 }, (_, i) => ({ id: String(i), amount: 1, reason: 'r', timestamp: i })) });
    const result = grantPokemonToStudent(base, pet('new'), { historyReason: 'x', companion: 'always' });
    expect(result.history).toHaveLength(50);
    expect(base.history[0].reason).toBe('r');
  });
});
