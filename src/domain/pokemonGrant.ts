import { PokemonPet, Student } from '../types';
import { getPokemonDisplayName } from './pokemonProgression';
import { isSamePokemon } from './pokemonCollection';
import { appendAdventureJournal } from './progression';

// Trao một Pokémon cho học sinh (dùng chung cho Vòng quay may mắn và Săn Pokémon hoang dã). Hàm thuần, có test.
export interface GrantPokemonOptions {
  /** Dòng lịch sử (0 điểm) ghi cho học sinh. */
  historyReason: string;
  /** 'always': Pokémon mới thành đồng hành (như Vòng quay may mắn); 'ifNone': chỉ khi chưa có đồng hành. */
  companion: 'always' | 'ifNone';
  /** Nội dung nhật ký phiêu lưu khi là Pokémon Shiny. */
  shinyJournalText?: string;
  timestamp?: number;
}

export const grantPokemonToStudent = (student: Student, pokemon: PokemonPet, options: GrantPokemonOptions): Student => {
  const timestamp = options.timestamp ?? Date.now();
  const currentPets = student.pets ? [...student.pets] : [];
  if (student.pet && !currentPets.some(pet => isSamePokemon(pet, student.pet))) {
    currentPets.push(student.pet);
  }
  const makeCompanion = options.companion === 'always' || !student.pet;
  let updated: Student = {
    ...student,
    pet: makeCompanion ? pokemon : student.pet,
    pets: makeCompanion ? [pokemon, ...currentPets] : [...currentPets, pokemon],
    history: [{
      id: timestamp.toString() + Math.random(),
      amount: 0,
      reason: options.historyReason,
      timestamp
    }, ...student.history].slice(0, 50)
  };
  if (pokemon.isShiny) {
    updated = appendAdventureJournal(updated, {
      type: 'shiny-acquired',
      text: options.shinyJournalText ?? `${student.name} received Shiny ${getPokemonDisplayName(pokemon)}.`,
      petInstanceId: pokemon.instanceId
    });
  }
  return updated;
};
