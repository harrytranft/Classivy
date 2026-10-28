import { describe, expect, it } from 'vitest';
import { shouldShowAuthLoading } from './authLoading';

describe('shouldShowAuthLoading', () => {
  it('hiện loading khi vừa đăng nhập', () => {
    expect(shouldShowAuthLoading(null, 'u1')).toBe(true);
  });
  it('hiện loading khi đổi sang người dùng khác', () => {
    expect(shouldShowAuthLoading('u1', 'u2')).toBe(true);
  });
  it('không hiện loading khi cùng người dùng (quay lại tab, làm mới token)', () => {
    expect(shouldShowAuthLoading('u1', 'u1')).toBe(false);
  });
  it('không hiện loading khi đăng xuất', () => {
    expect(shouldShowAuthLoading('u1', null)).toBe(false);
  });
});
