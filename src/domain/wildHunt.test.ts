import { describe, expect, it } from 'vitest';
import { DEFAULT_WILD_HUNT_SETTINGS } from '../data/classroomDefaults';
import { WildHuntSettings } from '../types';
import { LEGENDARY_POKEMON_DEX_IDS, SPECIAL_POKEMON_DEX_IDS } from './eggs';
import {
  HUNT_IDLE_RESET_MS, applyHuntAnswer, buildCatchWheelEntries, canSpawnWildPokemon, correctRemaining, createWildEncounter,
  getConsolationStudentIds, getDexIdPoolForRarity, huntRemainingMs, isEncounterExpired, isHuntDue, isNewHuntSession,
  pickCatchWinnerIndex, pickDexIdForRarity, pickNextCaller, rollAppearanceDelayMs, rollRarity, startHunting, touchHuntSession,
  wrongAllowedRemaining
} from './wildHunt';

const settings = (patch: Partial<WildHuntSettings> = {}): WildHuntSettings => ({ ...DEFAULT_WILD_HUNT_SETTINGS, ...patch });
const MIN = 60_000;
// Trưa một ngày cố định (giờ địa phương) để các phép so sánh "cùng ngày" không phụ thuộc múi giờ máy chạy test.
const NOON = new Date(2026, 9, 29, 12, 0, 0).getTime();

describe('hẹn giờ xuất hiện', () => {
  it('min = max: cố định đúng số phút', () => {
    expect(rollAppearanceDelayMs(settings({ delayMinMinutes: 40, delayMaxMinutes: 40 }), () => 0.7)).toBe(40 * MIN);
  });
  it('bốc trong khoảng min..max, gồm cả hai đầu', () => {
    const s = settings({ delayMinMinutes: 30, delayMaxMinutes: 50 });
    expect(rollAppearanceDelayMs(s, () => 0)).toBe(30 * MIN);
    expect(rollAppearanceDelayMs(s, () => 0.999999)).toBe(50 * MIN);
  });
});

describe('buổi học (D56)', () => {
  const s = settings({ delayMinMinutes: 40, delayMaxMinutes: 40 });
  it('lần đầu mở trang lớp: mở buổi mới, đồng hồ bắt đầu từ lúc đó', () => {
    const session = touchHuntSession(undefined, '6A', NOON, s);
    expect(session).toMatchObject({ className: '6A', startedAt: NOON, lastSeenAt: NOON, delayMs: 40 * MIN, spawned: false });
    expect(isHuntDue(session, NOON + 39 * MIN)).toBe(false);
    expect(isHuntDue(session, NOON + 40 * MIN)).toBe(true);
    expect(huntRemainingMs(session, NOON + 10 * MIN)).toBe(30 * MIN);
  });
  it('quay lại trong 2 giờ: giữ buổi và đồng hồ, chỉ cập nhật lastSeenAt', () => {
    const first = touchHuntSession(undefined, '6A', NOON, s);
    const again = touchHuntSession(first, '6A', NOON + 30 * MIN, s);
    expect(again.startedAt).toBe(NOON);
    expect(again.lastSeenAt).toBe(NOON + 30 * MIN);
  });
  it('nghỉ từ 2 giờ trở lên hoặc sang ngày khác: buổi mới, con mới', () => {
    const first = { ...touchHuntSession(undefined, '6A', NOON, s), spawned: true };
    expect(isNewHuntSession(first, NOON + HUNT_IDLE_RESET_MS - 1)).toBe(false);
    expect(isNewHuntSession(first, NOON + HUNT_IDLE_RESET_MS)).toBe(true);
    const nextDay = NOON + 24 * 60 * MIN;
    expect(touchHuntSession({ ...first, lastSeenAt: nextDay - MIN }, '6A', nextDay, s).spawned).toBe(false);
  });
  it('mỗi buổi tối đa 1 con: đã xuất hiện thì không đến hạn nữa', () => {
    const session = { ...touchHuntSession(undefined, '6A', NOON, s), spawned: true };
    expect(isHuntDue(session, NOON + 500 * MIN)).toBe(false);
    expect(huntRemainingMs(session, NOON)).toBe(0);
  });
});

describe('điều kiện xuất hiện', () => {
  const base = { settings: settings(), presentCount: 10, busy: false, hasActiveEncounter: false };
  it('đủ điều kiện', () => expect(canSpawnWildPokemon(base)).toBe(true));
  it('tắt tính năng, đang bận, đã có con, hoặc ít em có mặt thì không xuất hiện', () => {
    expect(canSpawnWildPokemon({ ...base, settings: settings({ enabled: false }) })).toBe(false);
    expect(canSpawnWildPokemon({ ...base, busy: true })).toBe(false);
    expect(canSpawnWildPokemon({ ...base, hasActiveEncounter: true })).toBe(false);
    expect(canSpawnWildPokemon({ ...base, presentCount: 3 })).toBe(false);
    expect(canSpawnWildPokemon({ ...base, presentCount: 4 })).toBe(true);
  });
});

describe('độ hiếm và loài', () => {
  it('bốc độ hiếm theo trọng số và rng cố định', () => {
    const s = settings({ rarityWeights: { common: 70, rare: 25, legendary: 5 } });
    expect(rollRarity(s, () => 0)).toBe('common');
    expect(rollRarity(s, () => 0.69)).toBe('common');
    expect(rollRarity(s, () => 0.71)).toBe('rare');
    expect(rollRarity(s, () => 0.94)).toBe('rare');
    expect(rollRarity(s, () => 0.96)).toBe('legendary');
    expect(rollRarity(s, () => 1)).toBe('legendary');
  });
  it('trọng số 0 không bao giờ trúng', () => {
    const s = settings({ rarityWeights: { common: 0, rare: 0, legendary: 10 } });
    for (const r of [0, 0.3, 0.99]) expect(rollRarity(s, () => r)).toBe('legendary');
  });
  it('tỷ lệ gần đúng với nhiều lần bốc', () => {
    let seed = 42;
    const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const counts = { common: 0, rare: 0, legendary: 0 };
    for (let i = 0; i < 5000; i += 1) counts[rollRarity(settings(), rng)] += 1;
    expect(counts.common / 5000).toBeGreaterThan(0.66);
    expect(counts.common / 5000).toBeLessThan(0.74);
    expect(counts.legendary).toBeGreaterThan(100);
  });
  it('kho loài theo độ hiếm đúng nhóm', () => {
    getDexIdPoolForRarity('common').forEach(id => expect(SPECIAL_POKEMON_DEX_IDS.has(id)).toBe(false));
    getDexIdPoolForRarity('rare').forEach(id => { expect(SPECIAL_POKEMON_DEX_IDS.has(id)).toBe(true); expect(LEGENDARY_POKEMON_DEX_IDS.has(id)).toBe(false); });
    getDexIdPoolForRarity('legendary').forEach(id => expect(LEGENDARY_POKEMON_DEX_IDS.has(id)).toBe(true));
    expect(getDexIdPoolForRarity('rare').length).toBeGreaterThan(0);
    expect(LEGENDARY_POKEMON_DEX_IDS.has(pickDexIdForRarity('legendary', () => 0.5))).toBe(true);
  });
});

describe('cuộc săn', () => {
  const make = (patch: Partial<WildHuntSettings> = {}) => startHunting(createWildEncounter(settings(patch), '6A', NOON, () => 0, { id: 'e1' }));

  it('tạo con mới theo cài đặt', () => {
    const e = createWildEncounter(settings({ lingerMinutes: 5 }), '6A', NOON, () => 0, { id: 'e1' });
    expect(e).toMatchObject({ id: 'e1', className: '6A', rarity: 'common', correctNeeded: 3, maxWrong: 3, status: 'announced', correctCount: 0, wrongCount: 0 });
    expect(e.expiresAt).toBe(NOON + 5 * MIN);
    expect(isEncounterExpired(e, NOON + 5 * MIN - 1)).toBe(false);
    expect(isEncounterExpired(e, NOON + 5 * MIN)).toBe(true);
    expect(isEncounterExpired(startHunting(e), NOON + 99 * MIN)).toBe(false);
  });
  it('số câu đúng cần theo độ hiếm', () => {
    const s = settings({ rarityWeights: { common: 0, rare: 0, legendary: 1 }, correctNeeded: { common: 3, rare: 4, legendary: 7 } });
    expect(createWildEncounter(s, '6A', NOON, () => 0).correctNeeded).toBe(7);
  });
  it('đủ số câu đúng thì bắt được', () => {
    let e = make();
    e = applyHuntAnswer(e, 'a', true);
    e = applyHuntAnswer(e, 'b', false);
    expect(e.status).toBe('hunting');
    expect(correctRemaining(e)).toBe(2);
    expect(wrongAllowedRemaining(e)).toBe(2);
    e = applyHuntAnswer(e, 'c', true);
    e = applyHuntAnswer(e, 'a', true);
    expect(e.status).toBe('caught');
    expect(e.correctCount).toBe(3);
  });
  it('sai vượt số lần cho phép thì bỏ chạy (lần sai thứ 4 khi tối đa 3)', () => {
    let e = make();
    for (let i = 0; i < 3; i += 1) e = applyHuntAnswer(e, 'a', false);
    expect(e.status).toBe('hunting');
    expect(wrongAllowedRemaining(e)).toBe(0);
    e = applyHuntAnswer(e, 'b', false);
    expect(e.status).toBe('escaped');
  });
  it('không ghi nhận khi chưa săn hoặc đã kết thúc', () => {
    const waiting = createWildEncounter(settings(), '6A', NOON, () => 0);
    expect(applyHuntAnswer(waiting, 'a', true)).toBe(waiting);
    let caught = make({ correctNeeded: { common: 1, rare: 1, legendary: 1 } });
    caught = applyHuntAnswer(caught, 'a', true);
    expect(caught.status).toBe('caught');
    expect(applyHuntAnswer(caught, 'b', true)).toBe(caught);
  });
  it('ghi lại ai trả lời gì và xoá em đang được gọi', () => {
    let e = { ...make(), currentStudentId: 'a' };
    e = applyHuntAnswer(e, 'a', true);
    expect(e.answers).toEqual([{ studentId: 'a', correct: true }]);
    expect(e.currentStudentId).toBeNull();
  });
});

describe('gọi học sinh', () => {
  const base = startHunting(createWildEncounter(settings(), '6A', NOON, () => 0, { id: 'e1' }));
  it('không gọi lại em đã được gọi; hết người thì xoay vòng', () => {
    const present = ['a', 'b', 'c'];
    let e = base;
    const seen: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const next = pickNextCaller(e, present, () => 0)!;
      seen.push(next.studentId);
      e = { ...e, calledStudentIds: next.calledStudentIds, currentStudentId: next.studentId };
    }
    expect(new Set(seen).size).toBe(3);
    const round2 = pickNextCaller(e, present, () => 0)!;
    expect(round2.calledStudentIds).toHaveLength(1);
    expect(round2.studentId).not.toBe('c'); // không gọi lại ngay em vừa được gọi
  });
  it('bỏ qua em đã vắng mặt, không có ai thì null, chỉ một em vẫn gọi được', () => {
    const e = { ...base, calledStudentIds: ['a', 'zz'] };
    expect(pickNextCaller(e, ['a', 'b'], () => 0)?.studentId).toBe('b');
    expect(pickNextCaller(base, [], () => 0)).toBeNull();
    expect(pickNextCaller({ ...base, calledStudentIds: ['a'], currentStudentId: 'a' }, ['a'], () => 0)?.studentId).toBe('a');
  });
});

describe('vòng quay chọn người nhận', () => {
  const caught = (() => {
    let e = startHunting(createWildEncounter(settings({ correctNeeded: { common: 3, rare: 3, legendary: 3 } }), '6A', NOON, () => 0));
    e = applyHuntAnswer(e, 'a', true);
    e = applyHuntAnswer(e, 'b', false);
    e = applyHuntAnswer(e, 'a', true);
    e = applyHuntAnswer(e, 'c', true);
    return e;
  })();
  it('mỗi câu đúng là một ô (em đúng nhiều câu có nhiều ô), không có ô cho câu sai', () => {
    expect(buildCatchWheelEntries(caught).map(entry => entry.studentId)).toEqual(['a', 'a', 'c']);
  });
  it('chọn người trúng theo rng, không vượt chỉ số', () => {
    const entries = buildCatchWheelEntries(caught);
    expect(pickCatchWinnerIndex(entries, () => 0)).toBe(0);
    expect(pickCatchWinnerIndex(entries, () => 0.99)).toBe(2);
    expect(pickCatchWinnerIndex(entries, () => 1)).toBe(2);
    expect(pickCatchWinnerIndex([], () => 0.5)).toBe(-1);
  });
  it('điểm an ủi cho các em đúng còn lại, mỗi em một lần, không gồm người trúng', () => {
    const entries = buildCatchWheelEntries(caught);
    expect(getConsolationStudentIds(entries, 'a')).toEqual(['c']);
    expect(getConsolationStudentIds(entries, 'c')).toEqual(['a']);
  });
});
