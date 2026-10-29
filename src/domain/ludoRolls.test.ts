import { describe, expect, it } from 'vitest';
import {
  adjustBattleScore, consumeExtraRoll, grantExtraRoll, normalizeBonusRolls, shouldAdvanceLudoQueue
} from './ludoRolls';

describe('lượt lắc bonus Cá Ngựa', () => {
  it('cộng lượt cho một em và giữ nguyên em khác', () => {
    expect(grantExtraRoll({ b: 2 }, 'a')).toEqual({ a: 1, b: 2 });
    expect(grantExtraRoll({ a: 1 }, 'a', 2)).toEqual({ a: 3 });
  });

  it('huỷ lượt (cộng -1) bỏ khoá khi về 0 và không xuống âm', () => {
    expect(grantExtraRoll({ a: 1 }, 'a', -1)).toEqual({});
    expect(grantExtraRoll({}, 'a', -1)).toEqual({});
    expect(consumeExtraRoll({ a: 2, b: 1 }, 'a')).toEqual({ a: 1, b: 1 });
    expect(consumeExtraRoll({ a: 1 }, 'a')).toEqual({});
  });

  it('không sửa đối tượng đầu vào', () => {
    const rolls = { a: 1 };
    grantExtraRoll(rolls, 'a');
    expect(rolls).toEqual({ a: 1 });
  });

  it('chỉ chuyển người trong hàng chờ sau lượt lắc thường, không chuyển sau lắc bonus', () => {
    expect(shouldAdvanceLudoQueue(false)).toBe(true);
    expect(shouldAdvanceLudoQueue(true)).toBe(false);
  });

  it('điểm Battle cộng/trừ nhanh có sàn -10', () => {
    expect(adjustBattleScore(0, 3)).toBe(3);
    expect(adjustBattleScore(3, -5)).toBe(-2);
    expect(adjustBattleScore(-8, -5)).toBe(-10);
  });

  it('đọc dữ liệu lưu trên máy: bỏ mục hỏng', () => {
    expect(normalizeBonusRolls({ a: 2, b: 0, c: -1, d: 'x', e: 1.9, f: null })).toEqual({ a: 2, e: 1 });
    expect(normalizeBonusRolls(null)).toEqual({});
    expect(normalizeBonusRolls([1, 2])).toEqual({});
    expect(normalizeBonusRolls('abc')).toEqual({});
  });
});
