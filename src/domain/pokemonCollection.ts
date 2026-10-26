import { PokemonPet, Student } from '../types';
import { isSamePokemonPet, normalizePokemonPet, updatePetInCollection } from './pokemonProgression';

// Bộ sưu tập Pokémon của trainer: so sánh, reset level, Pokémon hỗ trợ, hợp nhất. Hàm thuần.

export const isSamePokemon = (a?: PokemonPet, b?: PokemonPet) => {
  return isSamePokemonPet(a, b);
};

export const resetPokemonLevelToOne = (pet: PokemonPet): PokemonPet => {
  return normalizePokemonPet({
    ...pet,
    level: 1,
    xp: 0,
    totalXp: 0,
    masteryXp: 0,
    masteryStars: 0
  });
};

export const resetStudentPokemonLevels = (student: Student): Student => {
  const currentPets = student.pets && student.pets.length > 0 ? student.pets : (student.pet ? [student.pet] : []);
  const resetPets = currentPets.map(resetPokemonLevelToOne);
  const activePet = student.pet ? resetPokemonLevelToOne(student.pet) : undefined;
  const mergedPets = activePet
    ? [activePet, ...resetPets.filter(pet => !isSamePokemon(pet, activePet))]
    : resetPets;
  const uniquePets = mergedPets.filter((pet, index, pets) => pets.findIndex(candidate => isSamePokemon(candidate, pet)) === index);

  return {
    ...student,
    pet: activePet,
    pets: uniquePets
  };
};

export const getSupportPetForStudent = (student: Student): PokemonPet | undefined => {
  return (student.pets || []).find(pet => pet.instanceId === student.supportPetInstanceId);
};

export const getSynergyLabel = (student: Student): string | null => {
  const activeBase = student.pet?.baseDexId || student.pet?.dexId;
  const support = getSupportPetForStudent(student);
  const supportBase = support?.baseDexId || support?.dexId;
  const pair = new Set([activeBase, supportBase]);
  if (pair.has(4) && pair.has(7)) return '🔥💧 Kanto Partners';
  if (pair.has(25) && pair.has(133)) return '⚡🌟 Best Friends';
  if (pair.has(1) && pair.has(4)) return '🌱🔥 Starter Spark';
  return null;
};

export const updateActivePetInCollection = (student: Student, nextPet: PokemonPet) => {
  return updatePetInCollection(student, nextPet);
};

export const getFusionCandidates = (student: Student): PokemonPet[] => {
  const candidates = [...(student.pets || [])];
  if (student.pet && !candidates.some(p => isSamePokemon(p, student.pet))) {
    candidates.unshift(student.pet);
  }
  return candidates;
};
