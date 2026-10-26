import { afterEach, describe, expect, it, vi } from 'vitest';
import { LIST_POKEMONS } from '../data/pokemonData';
import {
  LEGENDARY_POKEMON_DEX_IDS,
  SPECIAL_POKEMON_DEX_IDS,
  createEgg,
  getEggCost,
  getEggLabel,
  getEggRequiredProgress,
  getRandomEggDexId
} from './eggs';

const knownDexIds = new Set(LIST_POKEMONS.map(pokemon => pokemon.dexId));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('egg labels, costs and progress', () => {
  it('returns the Vietnamese label for each egg kind', () => {
    expect(getEggLabel('normal')).toBe('Trứng thường');
    expect(getEggLabel('special')).toBe('Trứng đặc biệt');
    expect(getEggLabel('legendary')).toBe('Trứng huyền thoại');
  });

  it('prices shop eggs at 10 and 20 points', () => {
    expect(getEggCost('normal')).toBe(10);
    expect(getEggCost('special')).toBe(20);
  });

  it('uses stored requiredProgress first, then falls back by kind', () => {
    expect(getEggRequiredProgress(undefined)).toBe(10);
    expect(getEggRequiredProgress(createEgg('normal'))).toBe(10);
    expect(getEggRequiredProgress(createEgg('special'))).toBe(15);
    expect(getEggRequiredProgress(createEgg('legendary'))).toBe(30);
    expect(getEggRequiredProgress({ ...createEgg('normal'), requiredProgress: 7 })).toBe(7);
    expect(getEggRequiredProgress({ ...createEgg('legendary'), requiredProgress: 0 })).toBe(30);
  });
});

describe('getRandomEggDexId', () => {
  it('always picks a legendary Pokémon for legendary eggs', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(LEGENDARY_POKEMON_DEX_IDS.has(getRandomEggDexId('legendary'))).toBe(true);
    }
  });

  it('always picks from the special pool for special eggs', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(SPECIAL_POKEMON_DEX_IDS.has(getRandomEggDexId('special'))).toBe(true);
    }
  });

  it('picks a known Pokémon for normal eggs', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(knownDexIds.has(getRandomEggDexId('normal'))).toBe(true);
    }
  });

  it('uses the normal pool when the 20% special roll misses', () => {
    // Every random value is 0: the special roll (0 >= 80) fails, then index 0 of the normal pool.
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(<T extends ArrayBufferView | null>(arr: T) => {
      if (arr instanceof Uint32Array) arr[0] = 0;
      return arr;
    });
    const firstNormal = LIST_POKEMONS.find(pokemon => !SPECIAL_POKEMON_DEX_IDS.has(pokemon.dexId));
    expect(getRandomEggDexId('normal')).toBe(firstNormal?.dexId);
  });
});

describe('createEgg', () => {
  it('creates a fresh egg with defaults', () => {
    const before = Date.now();
    const egg = createEgg();
    expect(egg).toMatchObject({ progress: 0, status: 'egg', kind: 'normal', requiredProgress: 10, source: 'shop' });
    expect(egg.instanceId).toBeTruthy();
    expect(egg.acquiredAt).toBeGreaterThanOrEqual(before);
    expect(knownDexIds.has(egg.assignedDexId)).toBe(true);
  });

  it('keeps the given kind and source and creates unique ids', () => {
    const a = createEgg('legendary', 'boss');
    const b = createEgg('legendary', 'boss');
    expect(a).toMatchObject({ kind: 'legendary', source: 'boss', requiredProgress: 30 });
    expect(LEGENDARY_POKEMON_DEX_IDS.has(a.assignedDexId)).toBe(true);
    expect(a.instanceId).not.toBe(b.instanceId);
  });
});
