import { describe, expect, it } from 'vitest';
import { resolveDisplayName } from './displayName';

describe('resolveDisplayName', () => {
  it('uses the first real name', () => {
    expect(resolveDisplayName('Cô Lan', 'Lan Nguyễn')).toBe('Cô Lan');
    expect(resolveDisplayName(undefined, '  Lan Nguyễn ')).toBe('Lan Nguyễn');
  });

  it('treats the old Imperial School default name as unset', () => {
    expect(resolveDisplayName('Học sĩ triều đình')).toBe('Trainer');
    expect(resolveDisplayName('Học sĩ triều đình', 'Thầy Harry')).toBe('Thầy Harry');
  });

  it('falls back to Trainer', () => {
    expect(resolveDisplayName(undefined, null, '', 42)).toBe('Trainer');
  });
});
