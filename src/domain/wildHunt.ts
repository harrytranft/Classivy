import { LIST_POKEMONS } from '../data/pokemonData';
import { LEGENDARY_POKEMON_DEX_IDS, SPECIAL_POKEMON_DEX_IDS } from './eggs';
import { WildHuntSettings, WildRarity } from '../types';
import { ClassSessionWindow } from './classSchedule';

// Phase 13E: Săn Pokémon hoang dã. Toàn bộ logic thuần (không đụng React, không lưu cloud), có test.
// Trạng thái cuộc săn chỉ nằm trong bộ nhớ; kết quả (Pokémon, điểm, lịch sử) đi vào dữ liệu học sinh như mọi thao tác khác.

export const WILD_RARITIES: WildRarity[] = ['common', 'rare', 'legendary'];
export const WILD_RARITY_LABELS: Record<WildRarity, string> = { common: 'Thường', rare: 'Hiếm', legendary: 'Huyền thoại' };
const MINUTE_MS = 60 * 1000;

export type Rng = () => number;

// ---------- Buổi học và hẹn giờ (theo lịch học của lớp) ----------
// Mỗi buổi học trong lịch: Pokémon xuất hiện ngẫu nhiên từ (giờ bắt đầu + startOffsetMinutes) tới giờ kết thúc,
// khi giáo viên đang mở trang của lớp. Mỗi buổi tối đa 1 con.

export interface WildHuntSession {
  className: string;
  /** Khoá buổi học (ngày + id buổi trong lịch). Sang buổi khác là mở phiên mới. */
  sessionKey: string;
  windowStart: number;
  windowEnd: number;
  /** Lúc Pokémon xuất hiện (đã bốc ngẫu nhiên trong khung giờ). */
  spawnAt: number;
  /** Buổi này đã có con rồi (mỗi buổi tối đa 1 con). */
  spawned: boolean;
}

/** Bốc lúc xuất hiện trong [max(now, windowStart), windowEnd). Khung đã qua thì trả về windowEnd (không bao giờ tới hạn). */
export const rollSpawnAt = (window: Pick<ClassSessionWindow, 'windowStart' | 'windowEnd'>, now: number, rng: Rng = Math.random): number => {
  const from = Math.max(now, window.windowStart);
  if (from >= window.windowEnd) return window.windowEnd;
  const span = window.windowEnd - from;
  return from + Math.min(span - 1, Math.floor(Math.max(0, rng()) * span));
};

/**
 * Gọi mỗi lần kiểm tra khi giáo viên đang ở trang lớp. `window` là buổi học đang diễn ra (null nếu không có):
 * buổi mới thì mở phiên mới với giờ xuất hiện ngẫu nhiên; cùng buổi thì giữ nguyên; ngoài giờ học thì giữ phiên cũ.
 */
export const touchHuntSession = (
  previous: WildHuntSession | undefined,
  className: string,
  window: ClassSessionWindow | null,
  now: number,
  rng: Rng = Math.random
): WildHuntSession | undefined => {
  if (!window) return previous;
  if (previous && previous.sessionKey === window.key) return previous;
  return {
    className,
    sessionKey: window.key,
    windowStart: window.windowStart,
    windowEnd: window.windowEnd,
    spawnAt: rollSpawnAt(window, now, rng),
    spawned: false
  };
};

export const isHuntDue = (session: WildHuntSession, now: number): boolean =>
  !session.spawned && now >= session.spawnAt && now < session.windowEnd;

export const huntRemainingMs = (session: WildHuntSession, now: number): number =>
  session.spawned ? 0 : Math.max(0, session.spawnAt - now);

export interface SpawnContext {
  settings: WildHuntSettings;
  presentCount: number;
  /** Đang mở Random/Cá Ngựa/Vòng quay hoặc đã có một Pokémon đang chờ: không chen ngang. */
  busy: boolean;
  hasActiveEncounter: boolean;
}

export const canSpawnWildPokemon = (context: SpawnContext): boolean =>
  context.settings.enabled && !context.busy && !context.hasActiveEncounter && context.presentCount >= context.settings.minPresentStudents;

// ---------- Độ hiếm và loài ----------

/** Bốc độ hiếm theo trọng số (trọng số 0 không bao giờ trúng). */
export const rollRarity = (settings: WildHuntSettings, rng: Rng = Math.random): WildRarity => {
  const weights = WILD_RARITIES.map(rarity => Math.max(0, settings.rarityWeights[rarity]));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return 'common';
  let roll = Math.min(0.999999999, Math.max(0, rng())) * total;
  for (let i = 0; i < WILD_RARITIES.length; i += 1) {
    if (roll < weights[i]) return WILD_RARITIES[i];
    roll -= weights[i];
  }
  return 'common';
};

/** Kho loài theo độ hiếm: thường = không đặc biệt; hiếm = đặc biệt nhưng không huyền thoại; huyền thoại = huyền thoại. */
export const getDexIdPoolForRarity = (rarity: WildRarity): number[] => {
  const all = LIST_POKEMONS.map(pokemon => pokemon.dexId);
  const pool = rarity === 'legendary'
    ? all.filter(id => LEGENDARY_POKEMON_DEX_IDS.has(id))
    : rarity === 'rare'
      ? all.filter(id => SPECIAL_POKEMON_DEX_IDS.has(id) && !LEGENDARY_POKEMON_DEX_IDS.has(id))
      : all.filter(id => !SPECIAL_POKEMON_DEX_IDS.has(id));
  return pool.length > 0 ? pool : all;
};

export const pickDexIdForRarity = (rarity: WildRarity, rng: Rng = Math.random): number => {
  const pool = getDexIdPoolForRarity(rarity);
  return pool[Math.min(pool.length - 1, Math.max(0, Math.floor(rng() * pool.length)))];
};

// ---------- Cuộc săn ----------

export type WildEncounterStatus = 'announced' | 'hunting' | 'caught' | 'escaped' | 'missed';

export interface WildHuntAnswer {
  studentId: string;
  correct: boolean;
}

export interface WildEncounter {
  id: string;
  className: string;
  rarity: WildRarity;
  dexId: number;
  correctNeeded: number;
  maxWrong: number;
  appearedAt: number;
  /** Hết giờ ở lại (chỉ áp dụng khi chưa bấm "Săn ngay"). */
  expiresAt: number;
  status: WildEncounterStatus;
  correctCount: number;
  wrongCount: number;
  answers: WildHuntAnswer[];
  calledStudentIds: string[];
  currentStudentId: string | null;
  /** Em trúng Pokémon (có sau khi quay). */
  winnerId?: string;
  /** Gọi thử từ Cài đặt (không tính vào "mỗi buổi tối đa 1 con"). */
  isTest?: boolean;
}

export const createWildEncounter = (
  settings: WildHuntSettings,
  className: string,
  now: number,
  rng: Rng = Math.random,
  options: { isTest?: boolean; id?: string } = {}
): WildEncounter => {
  const rarity = rollRarity(settings, rng);
  return {
    id: options.id ?? `wild-${now}-${Math.floor(rng() * 1e6)}`,
    className,
    rarity,
    dexId: pickDexIdForRarity(rarity, rng),
    correctNeeded: settings.correctNeeded[rarity],
    maxWrong: settings.maxWrong,
    appearedAt: now,
    expiresAt: now + settings.lingerMinutes * MINUTE_MS,
    status: 'announced',
    correctCount: 0,
    wrongCount: 0,
    answers: [],
    calledStudentIds: [],
    currentStudentId: null,
    ...(options.isTest ? { isTest: true } : {})
  };
};

export const isEncounterExpired = (encounter: WildEncounter, now: number): boolean =>
  encounter.status === 'announced' && now >= encounter.expiresAt;

export const startHunting = (encounter: WildEncounter): WildEncounter =>
  encounter.status === 'announced' ? { ...encounter, status: 'hunting' } : encounter;

/** Số câu đúng còn cần. */
export const correctRemaining = (encounter: WildEncounter): number => Math.max(0, encounter.correctNeeded - encounter.correctCount);

/** Số lần sai còn được phép (sai thêm quá số này thì Pokémon bỏ chạy). */
export const wrongAllowedRemaining = (encounter: WildEncounter): number => Math.max(0, encounter.maxWrong - encounter.wrongCount);

/**
 * Chọn em tiếp theo để gọi trong số các em có mặt: không gọi lại em đã được gọi trong lần săn này,
 * hết người thì xoay vòng (bắt đầu vòng mới, không gọi lại em vừa được gọi nếu còn người khác).
 */
export const pickNextCaller = (
  encounter: WildEncounter,
  presentStudentIds: string[],
  rng: Rng = Math.random
): { studentId: string; calledStudentIds: string[] } | null => {
  if (presentStudentIds.length === 0) return null;
  let called = encounter.calledStudentIds.filter(id => presentStudentIds.includes(id));
  let pool = presentStudentIds.filter(id => !called.includes(id));
  if (pool.length === 0) {
    const justCalled = encounter.currentStudentId;
    called = [];
    pool = presentStudentIds.filter(id => id !== justCalled);
    if (pool.length === 0) pool = [...presentStudentIds];
  }
  const studentId = pool[Math.min(pool.length - 1, Math.max(0, Math.floor(rng() * pool.length)))];
  return { studentId, calledStudentIds: [...called, studentId] };
};

/** Ghi kết quả trả lời của em đang được gọi. Chỉ có tác dụng khi đang săn. */
export const applyHuntAnswer = (encounter: WildEncounter, studentId: string, correct: boolean): WildEncounter => {
  if (encounter.status !== 'hunting') return encounter;
  const next: WildEncounter = {
    ...encounter,
    answers: [...encounter.answers, { studentId, correct }],
    currentStudentId: null,
    correctCount: encounter.correctCount + (correct ? 1 : 0),
    wrongCount: encounter.wrongCount + (correct ? 0 : 1)
  };
  if (next.correctCount >= next.correctNeeded) return { ...next, status: 'caught' };
  if (next.wrongCount > next.maxWrong) return { ...next, status: 'escaped' };
  return next;
};

// ---------- Vòng quay chọn người nhận ----------

export interface CatchWheelEntry {
  studentId: string;
}

/** Mỗi câu đúng là một ô: em đúng nhiều câu có nhiều ô. */
export const buildCatchWheelEntries = (encounter: WildEncounter): CatchWheelEntry[] =>
  encounter.answers.filter(answer => answer.correct).map(answer => ({ studentId: answer.studentId }));

export const pickCatchWinnerIndex = (entries: CatchWheelEntry[], rng: Rng = Math.random): number =>
  entries.length === 0 ? -1 : Math.min(entries.length - 1, Math.max(0, Math.floor(rng() * entries.length)));

/** Các em đúng nhưng không trúng Pokémon (mỗi em một lần, nhận điểm an ủi). */
export const getConsolationStudentIds = (entries: CatchWheelEntry[], winnerId: string): string[] =>
  Array.from(new Set(entries.map(entry => entry.studentId))).filter(id => id !== winnerId);
