import { describe, expect, it } from 'vitest';
import { DEFAULT_SHORTCUTS, SHORTCUT_DEFINITIONS, findShortcutConflict, normalizeShortcutKey, resolveShortcuts, shortcutIdForKey } from './shortcuts';

describe('phím tắt', () => {
  it('mặc định theo D38 và không trùng nhau', () => {
    expect(DEFAULT_SHORTCUTS).toMatchObject({ attendance: 'a', homework: 'h', wheel: 'w', random: 'r', timer: 't', search: '/', help: '?' });
    expect(new Set(Object.values(DEFAULT_SHORTCUTS)).size).toBe(SHORTCUT_DEFINITIONS.length);
  });
  it('chuẩn hoá phím: một ký tự, chữ thường', () => {
    expect(normalizeShortcutKey('A')).toBe('a');
    expect(normalizeShortcutKey('?')).toBe('?');
    expect(normalizeShortcutKey('ab')).toBeNull();
    expect(normalizeShortcutKey(' ')).toBeNull();
    expect(normalizeShortcutKey('Enter')).toBeNull();
  });
  it('gộp phím tuỳ chỉnh, bỏ giá trị sai', () => {
    const map = resolveShortcuts({ wheel: 'Q', timer: 'xx' as string });
    expect(map.wheel).toBe('q');
    expect(map.timer).toBe('t');
  });
  it('phím trùng trong dữ liệu lưu: mục sau về mặc định', () => {
    const map = resolveShortcuts({ homework: 'a' });
    expect(map.attendance).toBe('a');
    expect(map.homework).toBe('h');
  });
  it('tìm xung đột và tra chức năng theo phím', () => {
    expect(findShortcutConflict(DEFAULT_SHORTCUTS, 'wheel', 'a')).toBe('attendance');
    expect(findShortcutConflict(DEFAULT_SHORTCUTS, 'wheel', 'w')).toBeNull();
    expect(shortcutIdForKey(DEFAULT_SHORTCUTS, 'R')).toBe('random');
    expect(shortcutIdForKey(DEFAULT_SHORTCUTS, '9')).toBeNull();
  });
});
