// Lượt lắc bonus Cá Ngựa (Phase 13A): logic thuần để kiểm thử.
// "Đúng hết" (Random Solo/Battle) và phần thưởng Vòng quay cùng cộng vào bộ đếm này.

export type BonusRolls = Record<string, number>;

/** Cộng (hoặc trừ, nếu `amount` âm) lượt lắc bonus cho một em. Bộ đếm về 0 thì bỏ khoá; không bao giờ âm. */
export const grantExtraRoll = (rolls: BonusRolls, studentId: string, amount = 1): BonusRolls => {
  const next = Math.max(0, (rolls[studentId] || 0) + amount);
  const { [studentId]: _removed, ...rest } = rolls;
  return next > 0 ? { ...rest, [studentId]: next } : rest;
};

/** Dùng một lượt lắc bonus. */
export const consumeExtraRoll = (rolls: BonusRolls, studentId: string): BonusRolls => grantExtraRoll(rolls, studentId, -1);

/**
 * Hàng chờ Battle/Boss chỉ chuyển sang em kế tiếp sau lượt lắc THƯỜNG.
 * Lắc bonus xong, em đó vẫn còn lượt lắc thường (có +1 điểm "trả lời đúng") nên chưa được rời hàng chờ.
 */
export const shouldAdvanceLudoQueue = (isBonusRoll: boolean): boolean => !isBonusRoll;

export const BATTLE_SCORE_MIN = -10;

/** Điểm Battle vòng này sau khi bấm nút cộng/trừ nhanh (tối thiểu -10, như cũ). */
export const adjustBattleScore = (current: number, delta: number): number => Math.max(BATTLE_SCORE_MIN, current + delta);

/** Đọc bộ đếm từ localStorage: bỏ mục sai kiểu, số không nguyên dương, làm tròn xuống. */
export const normalizeBonusRolls = (raw: unknown): BonusRolls => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: BonusRolls = {};
  Object.entries(raw as Record<string, unknown>).forEach(([id, value]) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return;
    const count = Math.floor(value);
    if (count > 0) result[id] = Math.min(count, 99);
  });
  return result;
};
