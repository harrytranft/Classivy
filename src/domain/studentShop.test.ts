import { describe, expect, it } from 'vitest';
import { getQuickHatchCost, parseShopOverview, shopErrorMessage } from './studentShop';

describe('studentShop', () => {
  it('parses overview and fills defaults', () => {
    const parsed = parseShopOverview({ enabled: true, points: 42, skills: [{ id: 'a', name: 'A', cost: 5 }, { bad: true }] });
    expect(parsed.enabled).toBe(true);
    expect(parsed.points).toBe(42);
    expect(parsed.eggPrices).toEqual({ normal: 10, special: 20 });
    expect(parsed.skills).toEqual([{ id: 'a', name: 'A', icon: '✨', cost: 5, description: '' }]);
  });
  it('rejects malformed overview', () => {
    expect(() => parseShopOverview(null)).toThrow();
    expect(() => parseShopOverview({ points: 1 })).toThrow();
  });
  it('quick hatch costs the missing progress', () => {
    expect(getQuickHatchCost(undefined)).toBe(0);
    expect(getQuickHatchCost({ label: 'x', progress: 4, required: 10, percent: 40 })).toBe(6);
    expect(getQuickHatchCost({ label: 'x', progress: 10, required: 10, percent: 100 })).toBe(0);
  });
  it('maps error codes to Vietnamese messages', () => {
    expect(shopErrorMessage('shop_closed')).toContain('đóng');
    expect(shopErrorMessage('not_enough_points')).toContain('Hào Quang');
    expect(shopErrorMessage('???')).toContain('thử lại');
    expect(shopErrorMessage(undefined)).toContain('thử lại');
  });
});
