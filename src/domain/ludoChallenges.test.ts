import { describe, expect, it } from 'vitest';
import { DEFAULT_LUDO_TILES, LUDO_FINISH_TILE } from '../data/constants';
import { LudoChallenge, LudoTileSpec } from '../types';
import { getChallengeBonusRolls, pickLudoChallenge, scatterChallengeTiles } from './ludoChallenges';
import { resolveLudoMove } from './ludo';
import { Student } from '../types';

const challenge = (id: string, enabled = true): LudoChallenge => ({ id, text: `Thử thách ${id}`, icon: '🎯', enabled });

describe('pickLudoChallenge', () => {
  it('chỉ bốc trong các thử thách đang bật', () => {
    const list = [challenge('a', false), challenge('b'), challenge('c', false), challenge('d')];
    expect(pickLudoChallenge(list, () => 0)?.id).toBe('b');
    expect(pickLudoChallenge(list, () => 0.99)?.id).toBe('d');
  });
  it('không có thử thách nào bật thì null', () => {
    expect(pickLudoChallenge([], () => 0)).toBeNull();
    expect(pickLudoChallenge([challenge('a', false)], () => 0)).toBeNull();
  });
  it('rng = 1 không vượt chỉ số', () => {
    expect(pickLudoChallenge([challenge('a'), challenge('b')], () => 1)?.id).toBe('b');
  });
});

describe('getChallengeBonusRolls', () => {
  it('mặc định 1, kẹp 1..5', () => {
    expect(getChallengeBonusRolls({})).toBe(1);
    expect(getChallengeBonusRolls({ value: 0 })).toBe(1);
    expect(getChallengeBonusRolls({ value: -3 })).toBe(1);
    expect(getChallengeBonusRolls({ value: 2 })).toBe(2);
    expect(getChallengeBonusRolls({ value: 99 })).toBe(5);
  });
});

describe('scatterChallengeTiles', () => {
  const rngFrom = (values: number[]) => { let i = 0; return () => values[i++ % values.length]; };
  it('rải đúng số ô vào ô trống, không đè ô mặc định/tuỳ chỉnh, không dùng ô 0 và ô đích', () => {
    const custom: Record<number, LudoTileSpec> = { 7: { tileIndex: 7, title: 'x', desc: '', icon: 'x', type: 'treasure', value: 2 } };
    const result = scatterChallengeTiles(DEFAULT_LUDO_TILES, custom, 6, Math.random);
    expect(result.placed).toHaveLength(6);
    expect(result.missing).toBe(0);
    for (const index of result.placed) {
      expect(index).toBeGreaterThan(0);
      expect(index).toBeLessThan(LUDO_FINISH_TILE);
      expect(DEFAULT_LUDO_TILES[index]).toBeUndefined();
      expect(index).not.toBe(7);
      expect(result.tiles[index].type).toBe('challenge');
    }
    expect(result.tiles[7].type).toBe('treasure');
  });
  it('mỗi lần bấm gỡ ô thử thách cũ rồi rải lại; ô khác giữ nguyên', () => {
    const first = scatterChallengeTiles(DEFAULT_LUDO_TILES, {}, 4, rngFrom([0.1, 0.5, 0.9]));
    const second = scatterChallengeTiles(DEFAULT_LUDO_TILES, first.tiles, 3, rngFrom([0.3, 0.7]));
    expect(Object.values(second.tiles).filter(tile => tile.type === 'challenge')).toHaveLength(3);
  });
  it('đếm 0 gỡ hết ô thử thách', () => {
    const first = scatterChallengeTiles(DEFAULT_LUDO_TILES, {}, 4);
    expect(Object.keys(scatterChallengeTiles(DEFAULT_LUDO_TILES, first.tiles, 0).tiles)).toHaveLength(0);
  });
  it('báo thiếu chỗ khi quá nhiều ô', () => {
    const everything: Record<number, LudoTileSpec> = {};
    for (let i = 1; i < LUDO_FINISH_TILE; i += 1) everything[i] = { tileIndex: i, title: 't', desc: '', icon: 't', type: 'treasure', value: 1 };
    const result = scatterChallengeTiles({}, everything, 3);
    expect(result.placed).toHaveLength(0);
    expect(result.missing).toBe(3);
  });
  it('giới hạn tối đa 20 ô', () => {
    expect(scatterChallengeTiles({}, {}, 100).placed).toHaveLength(20);
  });
  it('kết quả xác định theo rng cố định', () => {
    const a = scatterChallengeTiles(DEFAULT_LUDO_TILES, {}, 5, rngFrom([0.2, 0.4, 0.6, 0.8]));
    const b = scatterChallengeTiles(DEFAULT_LUDO_TILES, {}, 5, rngFrom([0.2, 0.4, 0.6, 0.8]));
    expect(a.placed).toEqual(b.placed);
  });
});

describe('resolveLudoMove với ô thử thách', () => {
  const mk = (id: string, name: string): Student => ({ id, name, className: '6A', gender: 'Nam', points: 10, history: [], isAbsent: false } as unknown as Student);
  const tile: LudoTileSpec = { tileIndex: 5, title: '🎯 Ô Thử Thách', desc: 'x', icon: '🎯', type: 'challenge', value: 2 };
  const base = () => {
    const an = mk('an', 'An');
    return { student: an, roll: 5, steps: { an: 0 }, positions: { an: 0 }, monsterStuck: {}, students: [an], rosterSource: [an], tiles: { 5: tile } };
  };
  it('dừng ở ô thử thách: bốc thử thách, mở hộp challenge, KHÔNG di chuyển thêm', () => {
    const result = resolveLudoMove({ ...base(), challenges: [challenge('a'), challenge('b', false)], rng: () => 0 });
    expect(result.positions.an).toBe(5);
    expect(result.steps.an).toBe(5);
    expect(result.popupEvent?.type).toBe('challenge');
    expect(result.popupEvent?.challenge).toEqual({ text: 'Thử thách a', bonusRolls: 2 });
    expect(result.popupEvent?.icon).toBe('🎯');
    expect(result.students[0].points).toBe(10);
  });
  it('không có thử thách nào bật thì ô không có tác dụng và báo rõ', () => {
    const result = resolveLudoMove({ ...base(), challenges: [challenge('a', false)] });
    expect(result.popupEvent?.type).toBe('special');
    expect(result.popupEvent?.challenge).toBeUndefined();
    expect(result.popupEvent?.message).toContain('chưa có thử thách');
    expect(result.positions.an).toBe(5);
  });
  it('vẫn có hộp thử thách khi đáp xuống ô có người khác (cú đá chỉ ghi nhật ký)', () => {
    const an = mk('an', 'An');
    const binh = mk('binh', 'Bình');
    const result = resolveLudoMove({ student: an, roll: 5, steps: { an: 0, binh: 5 }, positions: { an: 0, binh: 5 }, monsterStuck: {}, students: [an, binh], rosterSource: [an, binh], tiles: { 5: tile }, challenges: [challenge('a')], rng: () => 0 });
    expect(result.positions.binh).toBe(0);
    expect(result.popupEvent?.type).toBe('challenge');
    expect(result.logs.some(log => log.includes('ĐÁ'))).toBe(true);
  });
});
