import { describe, expect, it } from 'vitest';
import { profilePath, screenFromPath, studentIdFromPath } from './screenRoutes';

describe('screen routes', () => {
  it('maps paths to the old screen names', () => {
    expect(screenFromPath('/plaza')).toBe('plaza');
    expect(screenFromPath('/class')).toBe('class');
    expect(screenFromPath('/settings')).toBe('settings');
    expect(screenFromPath('/student/abc')).toBe('profile');
    expect(screenFromPath('/')).toBe('class');
    expect(screenFromPath('/something-else')).toBe('class');
  });

  it('round-trips student ids, including ones with special characters', () => {
    for (const id of ['stu-01', '1793000000000', 'a b/c?d']) {
      expect(studentIdFromPath(profilePath(id))).toBe(id);
    }
    expect(studentIdFromPath('/class')).toBeNull();
    expect(studentIdFromPath('/student/')).toBeNull();
  });
});
