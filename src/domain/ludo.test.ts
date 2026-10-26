import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Gender, LudoTileSpec, Student } from '../types';
import { LudoMoveInput, awardLudoAura, checkMonsterEscape, resolveLudoMove } from './ludo';

// Characterization tests cho bàn cờ Cá Ngựa (0-49).

const NOW = new Date('2026-10-26T09:00:00+07:00').getTime();

const racer = (id: string, overrides: Partial<Student> = {}): Student => ({
  id, name: id.toUpperCase(), gender: Gender.MALE, className: '6A', points: 10, history: [], ...overrides
});

const move = (overrides: Partial<LudoMoveInput> & { roll: number }) => {
  const students = overrides.students ?? [racer('a'), racer('b')];
  return resolveLudoMove({
    student: students[0],
    steps: {},
    positions: {},
    monsterStuck: {},
    students,
    rosterSource: students,
    tiles: {},
    ...overrides
  });
};

const tile = (tileIndex: number, type: LudoTileSpec['type'], value?: number): Record<number, LudoTileSpec> => ({
  [tileIndex]: { tileIndex, title: `Ô ${tileIndex}`, desc: 'mô tả', icon: '⭐', type, value }
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('resolveLudoMove', () => {
  it('moves forward by the roll and writes the position onto the student', () => {
    const result = move({ roll: 3 });
    expect(result.positions.a).toBe(3);
    expect(result.steps.a).toBe(3);
    expect(result.students[0]).toMatchObject({ ludoTile: 3, ludoSteps: 3, ludoMonsterStuck: false });
    expect(result.logs).toEqual(['🎲 A tung được 3 điểm, tiến đến ô số 3!']);
    expect(result.popupEvent).toBeNull();
    expect(result.reachedFinish).toBe(false);
  });

  it('kicks a racer standing on the landing tile back to start', () => {
    const students = [racer('a'), racer('b', { ludoTile: 5, ludoSteps: 5 })];
    const result = move({ roll: 5, students, positions: { b: 5 }, steps: { b: 5 } });
    expect(result.positions.b).toBe(0);
    expect(result.students[1]).toMatchObject({ ludoTile: 0, ludoSteps: 0, ludoMonsterStuck: false });
    expect(result.popupEvent).toMatchObject({ type: 'kick', tileIndex: 5 });
  });

  it('crossing the finish gives +20, resets to tile 0 and asks for the Lucky Wheel', () => {
    const result = move({ roll: 4, steps: { a: 47 }, positions: { a: 47 } });
    expect(result.reachedFinish).toBe(true);
    expect(result.positions.a).toBe(0);
    expect(result.steps.a).toBe(0);
    expect(result.students[0].points).toBe(30);
    expect(result.popupEvent?.type).toBe('finish');
    expect(result.logs[0]).toContain('Mở Vòng quay may mắn');
  });

  it('applies special tiles: portal, curse, treasure, monster and restart', () => {
    expect(move({ roll: 3, tiles: tile(3, 'portal', 5) }).positions.a).toBe(8);
    expect(move({ roll: 3, tiles: tile(3, 'curse', -5) }).positions.a).toBe(0);
    const treasure = move({ roll: 3, tiles: tile(3, 'treasure', 4) });
    expect(treasure.students[0].points).toBe(14);
    expect(treasure.popupEvent?.type).toBe('special');
    const monster = move({ roll: 3, tiles: tile(3, 'monster') });
    expect(monster.monsterStuck.a).toBe(true);
    expect(monster.students[0].ludoMonsterStuck).toBe(true);
    const restart = move({ roll: 3, steps: { a: 10 }, tiles: tile(13, 'restart') });
    expect(restart.positions.a).toBe(0);
  });

  it('a portal that pushes past the finish counts as finishing', () => {
    const result = move({ roll: 2, steps: { a: 45 }, tiles: tile(47, 'portal', 5) });
    expect(result.reachedFinish).toBe(true);
    expect(result.positions.a).toBe(0);
  });

  it('uses the stuck map it is given (the roll handler clears it first after a 6)', () => {
    expect(move({ roll: 6, monsterStuck: { a: true } }).monsterStuck.a).toBe(true);
    const escaped = checkMonsterEscape({ a: true }, 'a', 6);
    const result = move({ roll: 6, monsterStuck: escaped.monsterStuck });
    expect(result.monsterStuck.a).toBe(false);
    expect(result.students[0].ludoMonsterStuck).toBe(false);
    expect(result.positions.a).toBe(6);
  });
});

describe('checkMonsterEscape', () => {
  it('keeps a stuck racer in place unless the roll is 6', () => {
    for (const roll of [1, 2, 3, 4, 5]) {
      expect(checkMonsterEscape({ a: true }, 'a', roll)).toMatchObject({ wasStuck: true, stillStuck: true, monsterStuck: { a: true } });
    }
  });

  it('frees the racer on a 6 without touching others', () => {
    expect(checkMonsterEscape({ a: true, b: true }, 'a', 6)).toEqual({ wasStuck: true, stillStuck: false, monsterStuck: { a: false, b: true } });
  });

  it('does nothing for a racer who is not stuck', () => {
    const map = { b: true };
    expect(checkMonsterEscape(map, 'a', 3)).toEqual({ wasStuck: false, stillStuck: false, monsterStuck: map });
  });
});

describe('awardLudoAura', () => {
  it('adds points and history and changes Pokémon HP by the same amount', () => {
    const result = awardLudoAura(racer('a'), 1, '🎲 Trả lời đúng');
    expect(result.student.points).toBe(11);
    expect(result.student.history[0]).toMatchObject({ amount: 1, reason: '🎲 Trả lời đúng', timestamp: NOW });
    expect(result.releaseEvent).toBeNull();
  });
});
