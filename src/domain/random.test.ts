import { describe, expect, it } from 'vitest';
import { createInstanceId, getRandomIndex } from './random';

describe('getRandomIndex', () => {
  it('returns 0 for empty or negative lengths', () => {
    expect(getRandomIndex(0)).toBe(0);
    expect(getRandomIndex(-3)).toBe(0);
  });

  it('stays within [0, length)', () => {
    for (let i = 0; i < 200; i += 1) {
      const value = getRandomIndex(7);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });
});

describe('createInstanceId', () => {
  it('creates unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createInstanceId('egg')));
    expect(ids.size).toBe(50);
  });
});
