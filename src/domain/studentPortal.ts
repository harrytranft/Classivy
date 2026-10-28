import { EarnedBadge, PokemonPet, StudentEgg, TrainerProgress } from '../types';
import { getEggLabel, getEggRequiredProgress } from './eggs';
import { clamp, getPokemonDisplayName } from './pokemonProgression';
import {
  TrainerTitleDefinition,
  getBadgeDefinition,
  getDefaultTrainerProgress,
  getTrainerLevelPercent,
  getTrainerLevelProgressFromTotalXp,
  getTrainerTitleDefinition,
  trainerXpNeededForNextLevel
} from './trainerProgression';

// Cổng học sinh (Phase 5, ADR 0003): đọc gói dữ liệu của hàm DB get_my_student_profile()
// thành mô hình hiển thị. Không tin dữ liệu JSON: mọi trường đều kiểm tra kiểu, thiếu thì dùng mặc định.
// Hạng hiển thị là Trainer Level, không có vị trí trong lớp (Harry chốt 2026-10-28).

export interface PortalTrainer {
  level: number;
  xp: number;
  xpNeeded: number;
  percent: number;
  title: TrainerTitleDefinition;
}

export interface PortalEgg {
  label: string;
  progress: number;
  required: number;
  percent: number;
}

export interface PortalBadge {
  id: string;
  icon: string;
  name: string;
  description: string;
  earnedAt: number;
}

export interface PortalHistoryItem {
  amount: number;
  reason: string;
  occurredAt: number;
}

export interface StudentPortalProfile {
  name: string;
  className: string;
  points: number;
  avatar?: string;
  trainer: PortalTrainer;
  companion?: PokemonPet;
  /** Pokémon khác trong bộ sưu tập (không gồm Pokémon đồng hành). */
  collection: PokemonPet[];
  supportPetInstanceId?: string;
  egg?: PortalEgg;
  badges: PortalBadge[];
  history: PortalHistoryItem[];
}

export type StudentPortalResult =
  | { status: 'active'; profile: StudentPortalProfile }
  | { status: 'locked' | 'not_linked' | 'not_student' };

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);
const asNumber = (value: unknown, fallback = 0): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
const asString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);

const toPet = (value: unknown): PokemonPet | undefined => {
  if (!isObject(value) || typeof value.dexId !== 'number' || typeof value.name !== 'string') return undefined;
  return {
    ...(value as unknown as PokemonPet),
    types: Array.isArray(value.types) ? value.types.filter((t): t is string => typeof t === 'string') : [],
    accessories: Array.isArray(value.accessories) ? (value.accessories as string[]) : [],
    skills: Array.isArray(value.skills) ? (value.skills as string[]) : []
  };
};

const samePet = (a: PokemonPet, b: PokemonPet): boolean =>
  a.instanceId && b.instanceId ? a.instanceId === b.instanceId : a.dexId === b.dexId && getPokemonDisplayName(a) === getPokemonDisplayName(b);

export const toPortalTrainer = (value: unknown): PortalTrainer => {
  const raw = isObject(value) ? value : {};
  const base: TrainerProgress = typeof raw.totalXp === 'number' && Number.isFinite(raw.totalXp)
    ? getTrainerLevelProgressFromTotalXp(raw.totalXp)
    : { ...getDefaultTrainerProgress(), level: Math.max(1, Math.floor(asNumber(raw.level, 1))), xp: Math.max(0, asNumber(raw.xp)) };
  const title = getTrainerTitleDefinition(typeof raw.titleId === 'string' ? (raw.titleId as TrainerProgress['titleId']) : undefined);
  return {
    level: base.level,
    xp: base.xp,
    xpNeeded: trainerXpNeededForNextLevel(base.level),
    percent: getTrainerLevelPercent(base),
    title
  };
};

export const toPortalEgg = (value: unknown): PortalEgg | undefined => {
  if (!isObject(value) || value.status !== 'egg') return undefined;
  const egg = value as unknown as StudentEgg;
  const required = getEggRequiredProgress(egg);
  const progress = clamp(asNumber(egg.progress), 0, required);
  return { label: getEggLabel(egg.kind || 'normal'), progress, required, percent: clamp((progress / required) * 100, 0, 100) };
};

const toBadges = (value: unknown): PortalBadge[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is EarnedBadge => isObject(item) && typeof item.badgeId === 'string')
    .map(item => {
      const definition = getBadgeDefinition(item.badgeId);
      return definition
        ? { id: definition.id, icon: definition.icon, name: definition.name, description: definition.description, earnedAt: asNumber(item.earnedAt) }
        : undefined;
    })
    .filter((badge): badge is PortalBadge => Boolean(badge));
};

const toHistory = (value: unknown): PortalHistoryItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isObject)
    .map(item => ({
      amount: asNumber(item.amount),
      reason: asString(item.reason),
      occurredAt: typeof item.occurred_at === 'string' ? Date.parse(item.occurred_at) || 0 : 0
    }))
    .sort((a, b) => b.occurredAt - a.occurredAt);
};

/** Đọc kết quả get_my_student_profile(). Ném lỗi nếu gói dữ liệu không đúng dạng (để màn hình hiện lỗi chung). */
export const parseStudentPortalPayload = (raw: unknown): StudentPortalResult => {
  if (!isObject(raw)) throw new Error('Invalid student portal payload');
  const status = raw.status;
  if (status === 'locked' || status === 'not_linked' || status === 'not_student') return { status };
  if (status !== 'active') throw new Error(`Unknown student portal status: ${String(status)}`);

  const game = isObject(raw.game) ? raw.game : {};
  const companion = toPet(game.pet);
  const pets = Array.isArray(game.pets) ? game.pets.map(toPet).filter((pet): pet is PokemonPet => Boolean(pet)) : [];
  const collection = companion ? pets.filter(pet => !samePet(pet, companion)) : pets;
  const avatar = asString(raw.avatar);

  return {
    status: 'active',
    profile: {
      name: asString(raw.name, 'Trainer'),
      className: asString(raw.class_name),
      points: asNumber(raw.points),
      avatar: avatar || undefined,
      trainer: toPortalTrainer(game.trainerProgress),
      companion,
      collection,
      supportPetInstanceId: asString(game.supportPetInstanceId) || undefined,
      egg: toPortalEgg(game.egg),
      badges: toBadges(game.earnedBadges),
      history: toHistory(raw.history)
    }
  };
};
