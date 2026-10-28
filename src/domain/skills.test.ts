import { describe, expect, it } from 'vitest';
import { Student } from '../types';
import {
  applyRescue, applySoulLink, consumeSkillUse, getPointsSkillPrompts, getRandomSkillsFor, getRescueLimit,
  getSkillUsesLeft, hasDeductionToday, resolvePointsWithSkills
} from './skills';

const NOW = new Date(2026, 9, 28, 10, 0, 0).getTime();
const make = (id: string, skills: string[], extra: Partial<Student> = {}): Student => ({
  id, name: id, gender: 'Nam', className: '6A', points: 10, history: [],
  pet: { instanceId: `pet-${id}`, dexId: 25, name: 'Pikachu', types: [], accessories: [], skills, skillUses: {} },
  pets: [{ instanceId: `pet-${id}`, dexId: 25, name: 'Pikachu', types: [], accessories: [], skills, skillUses: {} }],
  ...extra
} as unknown as Student);

describe('skills: lượt dùng', () => {
  it('có 2 lượt, dùng hết thì mất khỏi Pokémon và ghi lịch sử', () => {
    let s = make('a', ['sk_guard']);
    expect(getSkillUsesLeft(s.pet, 'sk_guard')).toBe(2);
    s = consumeSkillUse(s, 'sk_guard', 'Lá Chắn', 'x', NOW);
    expect(getSkillUsesLeft(s.pet, 'sk_guard')).toBe(1);
    expect(s.history[0].reason).toContain('1/2');
    s = consumeSkillUse(s, 'sk_guard', 'Lá Chắn', 'x', NOW);
    expect(s.pet?.skills).not.toContain('sk_guard');
    expect(s.pet?.skillUses?.sk_guard).toBeUndefined();
    expect(s.history[0].reason).toContain('hết lượt');
    expect(s.pets?.[0].skills).toEqual([]);
  });
  it('không có skill thì không đổi gì', () => {
    const s = make('a', []);
    expect(consumeSkillUse(s, 'sk_guard', 'x', 'y', NOW)).toBe(s);
    expect(getSkillUsesLeft(undefined, 'sk_guard')).toBe(0);
  });
  it('liệt kê skill nhóm B còn lượt', () => {
    const s = make('a', ['sk_evade', 'sk_guard', 'sk_swap'], { pet: { ...make('a', []).pet!, skills: ['sk_evade', 'sk_guard', 'sk_swap'], skillUses: { sk_swap: 1 } } });
    expect(getRandomSkillsFor(s)).toEqual(['sk_evade', 'sk_swap']);
  });
});

describe('skills: cộng/trừ điểm (D36)', () => {
  const a = make('a', ['sk_double']);
  const b = make('b', ['sk_guard', 'sk_survival']);
  const c = make('c', []);
  it('chỉ hỏi em có skill phù hợp', () => {
    expect(getPointsSkillPrompts([a, b, c], ['a', 'b', 'c'], 3, NOW).map(p => [p.studentId, p.kind])).toEqual([['a', 'double']]);
    expect(getPointsSkillPrompts([a, b, c], ['a', 'b', 'c'], -2, NOW).map(p => [p.studentId, p.kind])).toEqual([['b', 'survival'], ['b', 'guard']]);
    expect(getPointsSkillPrompts([a, b, c], ['c'], 5, NOW)).toEqual([]);
    expect(getPointsSkillPrompts([a], ['a'], 0, NOW)).toEqual([]);
  });
  it('Lá Chắn chỉ cho lần trừ đầu trong ngày', () => {
    const penalized = make('b', ['sk_guard'], { history: [{ id: 'h', amount: -1, reason: 'x', timestamp: NOW - 3600_000 }] });
    expect(hasDeductionToday(penalized, NOW)).toBe(true);
    expect(getPointsSkillPrompts([penalized], ['b'], -2, NOW)).toEqual([]);
    const yesterday = make('b', ['sk_guard'], { history: [{ id: 'h', amount: -1, reason: 'x', timestamp: NOW - 26 * 3600_000 }] });
    expect(getPointsSkillPrompts([yesterday], ['b'], -2, NOW)).toHaveLength(1);
  });
  it('tính điểm sau khi dùng skill', () => {
    expect(resolvePointsWithSkills(3, ['double'])).toEqual({ amount: 6, used: ['double'] });
    expect(resolvePointsWithSkills(3, [])).toEqual({ amount: 3, used: [] });
    expect(resolvePointsWithSkills(-4, ['guard'])).toEqual({ amount: -2, used: ['guard'] });
    expect(resolvePointsWithSkills(-3, ['guard'])).toEqual({ amount: -1, used: ['guard'] });
    expect(resolvePointsWithSkills(-4, ['survival', 'guard'])).toEqual({ amount: 0, used: ['survival'] });
    expect(resolvePointsWithSkills(-4, [])).toEqual({ amount: -4, used: [] });
    expect(resolvePointsWithSkills(2, ['guard'])).toEqual({ amount: 2, used: [] });
  });
});

describe('skills: dùng ngoài Random (nhóm D)', () => {
  it('Hộ Tống: tối đa 3 điểm, không quá số điểm đang có, trừ lượt', () => {
    const rescuer = make('r', ['sk_rescue'], { points: 2 });
    const rescuee = make('v', [], { points: -5 });
    expect(getRescueLimit(rescuer)).toBe(2);
    expect(applyRescue(rescuer, rescuee, 3, NOW)).toBeNull();
    const done = applyRescue(rescuer, rescuee, 2, NOW)!;
    expect(done.rescuer.points).toBe(0);
    expect(done.rescuee.points).toBe(-3);
    expect(getSkillUsesLeft(done.rescuer.pet, 'sk_rescue')).toBe(1);
    expect(done.rescuer.history[0].amount).toBe(-2);
    expect(done.rescuee.history[0].amount).toBe(2);
    expect(applyRescue(make('r', ['sk_rescue'], { points: 10 }), make('r', []), 1, NOW)).toBeNull();
    expect(applyRescue(make('x', [], { points: 10 }), rescuee, 1, NOW)).toBeNull();
    expect(getRescueLimit(make('r', ['sk_rescue'], { points: 10 }))).toBe(3);
  });
  it('Đồng Tâm Hiệp Lực: cộng ké 1 điểm cho em có skill', () => {
    const owner = make('o', ['sk_soul_link'], { points: 4 });
    const done = applySoulLink(owner, make('p', []), NOW)!;
    expect(done.points).toBe(5);
    expect(getSkillUsesLeft(done.pet, 'sk_soul_link')).toBe(1);
    expect(applySoulLink(make('x', []), owner, NOW)).toBeNull();
    expect(applySoulLink(owner, owner, NOW)).toBeNull();
  });
});
