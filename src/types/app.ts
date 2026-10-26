import { EggKind, PokemonPet, Student, StudentEgg, LuckyWheelReward } from './index';
import { PetSkill } from '../data/pokemonData';
import { PokemonUiEvent } from '../domain/gameEvents';

export type Screen = 'plaza' | 'class' | 'profile' | 'settings';
export type RandomMode = 'solo' | 'battle' | 'boss';

export interface LuckyWheelResult {
  student: Student;
  reward: LuckyWheelReward;
  pokemon?: PokemonPet;
  skill?: PetSkill;
  hpDelta?: number;
  message: string;
}

export interface LevelUpAnnouncement {
  title: string;
  events: PokemonUiEvent[];
}

export interface BattleLudoTurn {
  studentId: string;
  role: 'winner' | 'loser' | 'draw' | 'boss';
}

export type LudoReturnHint = 'solo' | 'battle' | 'boss' | null;

export interface ClaimAllRewardSummary {
  studentId: string;
  studentName: string;
  expeditionMessage?: string;
  chestMessage?: string;
}

export interface HatchAnnouncementItem {
  studentId: string;
  studentName: string;
  pet: PokemonPet;
}

export interface GiftPokemonResult {
  student: Student;
  pet: PokemonPet;
  egg: StudentEgg;
  hadExistingEgg: boolean;
}

export interface ShopReviewItem {
  studentId: string;
  studentName: string;
  pointBalance: number;
  egg?: Exclude<EggKind, 'legendary'>;
  skillIds: string[];
  itemLabels: string[];
  totalCost: number;
  canAfford: boolean;
}
