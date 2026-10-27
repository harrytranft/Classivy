import { describe, expect, it } from 'vitest';
import { CLASS_SUB_PAGES, classPath, parseClassPath, profilePath, screenFromPath, studentIdFromPath } from './screenRoutes';

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

describe('class routes', () => {
  it('builds and reads class pages and their sub pages', () => {
    expect(classPath('6A')).toBe('/class/6A');
    expect(classPath('6A', CLASS_SUB_PAGES.ludo)).toBe('/class/6A/ca-ngua');
    expect(parseClassPath('/class/6A/vong-quay')).toEqual({ className: '6A', subPage: 'vong-quay' });
    expect(parseClassPath('/class/6A')).toEqual({ className: '6A', subPage: null });
    expect(parseClassPath('/class')).toEqual({ className: null, subPage: null });
    expect(parseClassPath('/plaza')).toEqual({ className: null, subPage: null });
    expect(parseClassPath('/class/6A/khong-co')).toEqual({ className: '6A', subPage: null });
  });

  it('round-trips class names with spaces and Vietnamese letters', () => {
    for (const name of ['Lớp 7 Sun Santa', 'Smartie A/B', '8C']) {
      expect(parseClassPath(classPath(name, CLASS_SUB_PAGES.gift))).toEqual({ className: name, subPage: 'tang-pokemon' });
    }
  });

  it('treats every class page as the class screen', () => {
    expect(screenFromPath('/class/6A')).toBe('class');
    expect(screenFromPath('/class/6A/ca-ngua')).toBe('class');
  });
});
