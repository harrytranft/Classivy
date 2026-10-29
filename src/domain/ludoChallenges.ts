import { LUDO_FINISH_TILE } from '../data/constants';
import { LudoChallenge, LudoTileSpec } from '../types';

// Phase 13D: ô thử thách của Cá Ngựa. Hàm thuần, có test.

export const CHALLENGE_TILE_DEFAULT_BONUS = 1;
export const CHALLENGE_TILE_MAX_BONUS = 5;
export const MAX_SCATTER_CHALLENGE_TILES = 20;

/** Số lượt lắc thưởng của ô thử thách (value của ô; thiếu/sai thì 1, tối đa 5). */
export const getChallengeBonusRolls = (tile: Pick<LudoTileSpec, 'value'>): number => {
  const value = Math.round(Number(tile.value));
  if (!Number.isFinite(value) || value < 1) return CHALLENGE_TILE_DEFAULT_BONUS;
  return Math.min(CHALLENGE_TILE_MAX_BONUS, value);
};

/** Bốc ngẫu nhiên một thử thách đang bật; không có thử thách nào bật thì null. */
export const pickLudoChallenge = (challenges: LudoChallenge[], rng: () => number = Math.random): LudoChallenge | null => {
  const enabled = challenges.filter(challenge => challenge.enabled && challenge.text.trim());
  if (enabled.length === 0) return null;
  const index = Math.min(enabled.length - 1, Math.max(0, Math.floor(rng() * enabled.length)));
  return enabled[index];
};

export interface ScatterChallengeResult {
  /** Bộ ô tuỳ chỉnh mới: ô thử thách cũ đã bị gỡ, ô thử thách mới đã thêm. */
  tiles: Record<number, LudoTileSpec>;
  placed: number[];
  /** Số ô muốn rải nhưng không đủ chỗ trống. */
  missing: number;
}

/**
 * Rải `count` ô thử thách vào các ô còn trống (không phải ô 0, ô đích, ô đặc biệt mặc định hay tuỳ chỉnh).
 * Ô thử thách tuỳ chỉnh đã rải trước đó bị gỡ trước (mỗi lần bấm là xáo lại). Chỉ trả bộ ô tuỳ chỉnh mới.
 */
export const scatterChallengeTiles = (
  defaultTiles: Record<number, LudoTileSpec>,
  customTiles: Record<number, LudoTileSpec>,
  count: number,
  rng: () => number = Math.random,
  bonusRolls = CHALLENGE_TILE_DEFAULT_BONUS
): ScatterChallengeResult => {
  const wanted = Math.max(0, Math.min(MAX_SCATTER_CHALLENGE_TILES, Math.floor(count) || 0));
  const kept: Record<number, LudoTileSpec> = {};
  Object.values(customTiles).forEach(tile => {
    if (tile.type !== 'challenge') kept[tile.tileIndex] = tile;
  });
  const occupied = (index: number) => !!defaultTiles[index] || !!kept[index];
  const free: number[] = [];
  for (let index = 1; index < LUDO_FINISH_TILE; index += 1) {
    if (!occupied(index)) free.push(index);
  }
  // Xáo Fisher-Yates rồi lấy `wanted` ô đầu.
  for (let i = free.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.max(0, Math.floor(rng() * (i + 1))));
    [free[i], free[j]] = [free[j], free[i]];
  }
  const placed = free.slice(0, wanted).sort((a, b) => a - b);
  const tiles = { ...kept };
  placed.forEach(index => {
    tiles[index] = {
      tileIndex: index,
      title: '🎯 Ô Thử Thách',
      desc: 'Làm được thử thách để nhận thêm lượt lắc!',
      icon: '🎯',
      type: 'challenge',
      value: bonusRolls
    };
  });
  return { tiles, placed, missing: wanted - placed.length };
};
