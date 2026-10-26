import { describe, expect, it } from 'vitest';
import { getLocalDateKey, getLocalWeekKey } from './dates';

describe('getLocalDateKey', () => {
  it('formats local date as YYYY-MM-DD with zero padding', () => {
    expect(getLocalDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(getLocalDateKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });
});

describe('getLocalWeekKey', () => {
  it('starts at week 01 on January 1st', () => {
    expect(getLocalWeekKey(new Date(2026, 0, 1, 12))).toBe('2026-W01');
  });

  it('rolls to the next week on Sunday (week starts on Sunday)', () => {
    // 2026-01-01 is a Thursday, so Sat 3 Jan is still W01 and Sun 4 Jan is W02.
    expect(getLocalWeekKey(new Date(2026, 0, 3, 12))).toBe('2026-W01');
    expect(getLocalWeekKey(new Date(2026, 0, 4, 12))).toBe('2026-W02');
  });

  it('keeps the same key for every day inside one week', () => {
    const keys = [11, 12, 13, 14, 15, 16, 17].map(day => getLocalWeekKey(new Date(2026, 9, day, 9)));
    expect(new Set(keys).size).toBe(1);
    expect(getLocalWeekKey(new Date(2026, 9, 18, 9))).not.toBe(keys[0]);
  });
});
