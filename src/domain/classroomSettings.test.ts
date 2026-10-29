import { describe, expect, it } from 'vitest';
import { DEFAULT_LUDO_CHALLENGES, DEFAULT_WILD_HUNT_SETTINGS } from '../data/classroomDefaults';
import { normalizeClassroomSettings, normalizeLudoChallenges, normalizeWildHuntSettings } from './classroomSettings';

describe('normalizeClassroomSettings', () => {
  it('cột mới rỗng ({}) hoặc dữ liệu sai kiểu cho ra mặc định', () => {
    for (const input of [{}, null, undefined, 'x', 42, [], true]) {
      const result = normalizeClassroomSettings(input);
      expect(result.wildHunt).toEqual(DEFAULT_WILD_HUNT_SETTINGS);
      expect(result.ludoChallenges).toEqual(DEFAULT_LUDO_CHALLENGES);
    }
  });

  it('không dùng chung tham chiếu với mặc định (sửa kết quả không làm hỏng mặc định)', () => {
    const result = normalizeClassroomSettings({});
    result.wildHunt.rarityWeights.common = 1;
    result.ludoChallenges[0].text = 'đã sửa';
    expect(normalizeClassroomSettings({}).wildHunt.rarityWeights.common).toBe(70);
    expect(DEFAULT_LUDO_CHALLENGES[0].text).not.toBe('đã sửa');
  });

  it('giữ nguyên giá trị hợp lệ do giáo viên đặt', () => {
    const custom = {
      enabled: false, delayMinMinutes: 30, delayMaxMinutes: 50, lingerMinutes: 8,
      rarityWeights: { common: 50, rare: 40, legendary: 10 },
      correctNeeded: { common: 2, rare: 3, legendary: 6 },
      maxWrong: 2, minPresentStudents: 6, consolationPoints: 0
    };
    expect(normalizeWildHuntSettings(custom)).toEqual(custom);
  });

  it('kẹp số ngoài khoảng, làm tròn, bỏ NaN/chuỗi', () => {
    const result = normalizeWildHuntSettings({
      delayMinMinutes: -5, delayMaxMinutes: 9999, lingerMinutes: 0, maxWrong: 99.6,
      minPresentStudents: 'abc', consolationPoints: Number.NaN,
      correctNeeded: { common: 0, rare: 100, legendary: 2.4 }
    });
    expect(result.delayMinMinutes).toBe(1);
    expect(result.delayMaxMinutes).toBe(240);
    expect(result.lingerMinutes).toBe(1);
    expect(result.maxWrong).toBe(10);
    expect(result.minPresentStudents).toBe(DEFAULT_WILD_HUNT_SETTINGS.minPresentStudents);
    expect(result.consolationPoints).toBe(DEFAULT_WILD_HUNT_SETTINGS.consolationPoints);
    expect(result.correctNeeded).toEqual({ common: 1, rare: 10, legendary: 2 });
  });

  it('thời gian tối thiểu lớn hơn tối đa thì đổi chỗ', () => {
    const result = normalizeWildHuntSettings({ delayMinMinutes: 60, delayMaxMinutes: 20 });
    expect([result.delayMinMinutes, result.delayMaxMinutes]).toEqual([20, 60]);
  });

  it('ba trọng số độ hiếm đều 0 thì quay về mặc định', () => {
    const result = normalizeWildHuntSettings({ rarityWeights: { common: 0, rare: 0, legendary: 0 } });
    expect(result.rarityWeights).toEqual(DEFAULT_WILD_HUNT_SETTINGS.rarityWeights);
  });

  it('điểm an ủi 0 được giữ (tắt tính năng)', () => {
    expect(normalizeWildHuntSettings({ consolationPoints: 0 }).consolationPoints).toBe(0);
  });
});

describe('normalizeLudoChallenges', () => {
  it('không phải mảng thì dùng bộ mặc định; mảng rỗng được giữ (đã xoá hết)', () => {
    expect(normalizeLudoChallenges(undefined)).toEqual(DEFAULT_LUDO_CHALLENGES);
    expect(normalizeLudoChallenges({})).toEqual(DEFAULT_LUDO_CHALLENGES);
    expect(normalizeLudoChallenges([])).toEqual([]);
  });

  it('bỏ mục sai/trống, cắt chữ quá dài, điền biểu tượng và bật mặc định', () => {
    const result = normalizeLudoChallenges([
      { id: 'a', text: '  Nói 3 từ  ', icon: '', enabled: false },
      { id: 'b', text: '   ' },
      'bad',
      null,
      { id: 'c', text: 'x'.repeat(500) }
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'a', text: 'Nói 3 từ', icon: '🎯', enabled: false });
    expect(result[1].text).toHaveLength(200);
    expect(result[1].enabled).toBe(true);
  });

  it('id trùng được làm duy nhất, thiếu id được tự đặt', () => {
    const result = normalizeLudoChallenges([{ id: 'same', text: 'A' }, { id: 'same', text: 'B' }, { text: 'C' }]);
    expect(new Set(result.map(item => item.id)).size).toBe(3);
  });

  it('giới hạn tối đa 50 thử thách', () => {
    const many = Array.from({ length: 80 }, (_, index) => ({ id: `t${index}`, text: `Thử thách ${index}` }));
    expect(normalizeLudoChallenges(many)).toHaveLength(50);
  });
});
