import { EggKind, StudentEgg } from '../types';
import { LIST_POKEMONS } from '../data/pokemonData';
import { createInstanceId, getRandomIndex } from './random';

export const SPECIAL_POKEMON_DEX_IDS = new Set([
  144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
  480, 481, 482, 483, 484, 485, 486, 487, 488, 491, 492, 493, 494, 638, 639, 640, 641, 642, 643, 644, 645,
  646, 647, 648, 649, 716, 717, 718, 719, 720, 721, 772, 773, 785, 786, 787, 788, 789, 790, 791, 792,
  800, 801, 802, 807, 808, 809, 888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 905, 1001, 1002,
  1003, 1004, 1007, 1008, 1009, 1010, 1014, 1015, 1016, 1017, 1020, 1021, 1022, 1023, 1024, 1025
]);

export const LEGENDARY_POKEMON_DEX_IDS = new Set([
  144, 145, 146, 150, 151, 249, 250, 251, 382, 383, 384, 385, 386, 483, 484, 487, 491, 493, 643, 644, 646,
  716, 717, 718, 719, 720, 721, 888, 889, 890, 898, 1007, 1008, 1024, 1025
]);

export const getEggRequiredProgress = (egg?: StudentEgg): number => egg?.requiredProgress || (egg?.kind === 'legendary' ? 30 : egg?.kind === 'special' ? 15 : 10);
export const getEggLabel = (kind: EggKind) => kind === 'legendary' ? 'Trứng huyền thoại' : kind === 'special' ? 'Trứng đặc biệt' : 'Trứng thường';
export const getEggCost = (kind: Exclude<EggKind, 'legendary'>) => kind === 'special' ? 20 : 10;

export const getRandomEggDexId = (kind: EggKind = 'normal') => {
  if (kind === 'legendary') {
    const legendaryPool = LIST_POKEMONS.filter(pokemon => LEGENDARY_POKEMON_DEX_IDS.has(pokemon.dexId));
    const pool = legendaryPool.length > 0 ? legendaryPool : LIST_POKEMONS.filter(pokemon => SPECIAL_POKEMON_DEX_IDS.has(pokemon.dexId));
    return pool[getRandomIndex(pool.length)]?.dexId || 150;
  }
  const specialPool = LIST_POKEMONS.filter(pokemon => SPECIAL_POKEMON_DEX_IDS.has(pokemon.dexId));
  const normalPool = LIST_POKEMONS.filter(pokemon => !SPECIAL_POKEMON_DEX_IDS.has(pokemon.dexId));
  const useSpecialPool = kind === 'special' || getRandomIndex(100) >= 80;
  const pool = useSpecialPool && specialPool.length > 0 ? specialPool : normalPool.length > 0 ? normalPool : LIST_POKEMONS;
  return pool[getRandomIndex(pool.length)]?.dexId || 25;
};

export const createEgg = (kind: EggKind = 'normal', source: StudentEgg['source'] = 'shop'): StudentEgg => ({
  instanceId: createInstanceId('egg'),
  progress: 0,
  status: 'egg',
  assignedDexId: getRandomEggDexId(kind),
  kind,
  requiredProgress: kind === 'legendary' ? 30 : kind === 'special' ? 15 : 10,
  acquiredAt: Date.now(),
  source
});
