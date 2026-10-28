import { describe, expect, it } from 'vitest';
import {
  MAX_BATCH, PASSWORD_LENGTH, STUDENT_EMAIL_DOMAIN, cryptoRandomInt, generatePassword, isStudentEmail, isValidUsername,
  normalizeLoginInput, parseRequest, suggestUsername, toAsciiLetters, usernameToEmail
} from '../../supabase/functions/_shared/studentAccount';

// Bộ số ngẫu nhiên giả, lặp vòng, để test lặp lại được.
const seq = (...values: number[]) => {
  let i = 0;
  return (max: number) => values[i++ % values.length] % max;
};

const ID1 = '11111111-1111-4111-8111-111111111111';
const ID2 = '22222222-2222-4222-8222-222222222222';

describe('toAsciiLetters', () => {
  it('strips Vietnamese diacritics and non-alphanumerics', () => {
    expect(toAsciiLetters('Nguyễn Đăng Khoa')).toBe('nguyendangkhoa');
    expect(toAsciiLetters('Trần Thị Mỹ-Linh 2')).toBe('tranthimylinh2');
  });
});

describe('suggestUsername', () => {
  it('uses the last two words plus three random digits', () => {
    expect(suggestUsername('Nguyễn Minh Anh', seq(4, 7, 2))).toBe('minhanh472');
  });

  it('handles a single word, odd spacing and unusable names', () => {
    expect(suggestUsername('  Bảo  ', seq(1, 2, 3))).toBe('bao123');
    expect(suggestUsername('😀', seq(0, 0, 1))).toBe('hs001');
    expect(suggestUsername('', seq(0, 0, 1))).toBe('hs001');
  });

  it('always yields a valid username, even for very long names', () => {
    const name = 'Nguyễn Hoàng Phương Thuỵ Khánh Vân Anh Tuyết Hồng Ngọc Diễm Quỳnh';
    for (const extra of [0, 1, 3]) {
      const username = suggestUsername(name, seq(9, 8, 7, 6, 5), extra);
      expect(isValidUsername(username)).toBe(true);
      expect(username.length).toBeLessThanOrEqual(24);
    }
  });

  it('adds extra digits to dodge collisions', () => {
    expect(suggestUsername('Minh Anh', seq(1, 2, 3, 4, 5), 2)).toBe('minhanh12345');
  });
});

describe('generatePassword', () => {
  it('is 8 readable characters with at least one letter and one digit', () => {
    for (let n = 0; n < 500; n += 1) {
      const password = generatePassword(cryptoRandomInt);
      expect(password).toHaveLength(PASSWORD_LENGTH);
      expect(password).toMatch(/^[a-hj-km-np-z2-9]+$/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[2-9]/);
    }
  });

  it('keeps the letter and digit even for adversarial random sources', () => {
    for (const source of [seq(0), seq(30), seq(22, 0), seq(5, 5, 5, 0)]) {
      const password = generatePassword(source);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[2-9]/);
    }
  });

  it('produces different passwords', () => {
    const seen = new Set(Array.from({ length: 200 }, () => generatePassword(cryptoRandomInt)));
    expect(seen.size).toBe(200);
  });
});

describe('cryptoRandomInt', () => {
  it('stays in range and covers every value', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i += 1) {
      const v = cryptoRandomInt(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
      seen.add(v);
    }
    expect(seen.size).toBe(10);
  });

  it('rejects out-of-range max', () => {
    expect(() => cryptoRandomInt(0)).toThrow();
    expect(() => cryptoRandomInt(257)).toThrow();
  });
});

describe('login input', () => {
  it('turns a username into the internal email and leaves real emails alone', () => {
    expect(normalizeLoginInput(' MinhAnh472 ')).toBe(`minhanh472@${STUDENT_EMAIL_DOMAIN}`);
    expect(normalizeLoginInput('thay.harry@gmail.com')).toBe('thay.harry@gmail.com');
  });

  it('recognizes internal student emails', () => {
    expect(isStudentEmail(usernameToEmail('abc123'))).toBe(true);
    expect(isStudentEmail('abc123@gmail.com')).toBe(false);
  });
});

describe('isValidUsername', () => {
  it('accepts lowercase letters and digits, 3-24 chars', () => {
    expect(isValidUsername('minhanh472')).toBe(true);
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('a'.repeat(25))).toBe(false);
    expect(isValidUsername('Minhanh')).toBe(false);
    expect(isValidUsername('minh anh')).toBe(false);
    expect(isValidUsername('minh_anh')).toBe(false);
    expect(isValidUsername(42)).toBe(false);
  });
});

describe('parseRequest', () => {
  it('parses create with deduplicated ids and username overrides', () => {
    const result = parseRequest({ action: 'create', studentIds: [ID1, ID1.toUpperCase(), ID2], usernames: { [ID2]: ' Binh123 ' } });
    expect(result).toEqual({ ok: true, request: { action: 'create', studentIds: [ID1, ID2], usernameOverrides: { [ID2]: 'binh123' } } });
  });

  it('rejects bad create requests', () => {
    expect(parseRequest({ action: 'create', studentIds: [] }).ok).toBe(false);
    expect(parseRequest({ action: 'create', studentIds: ['x'] }).ok).toBe(false);
    expect(parseRequest({ action: 'create', studentIds: Array.from({ length: MAX_BATCH + 1 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`) }).ok).toBe(false);
    expect(parseRequest({ action: 'create', studentIds: [ID1], usernames: { [ID2]: 'abc123' } }).ok).toBe(false);
    expect(parseRequest({ action: 'create', studentIds: [ID1], usernames: { [ID1]: 'Bad Name' } }).ok).toBe(false);
  });

  it('parses single-student actions', () => {
    for (const action of ['reset_password', 'lock', 'unlock', 'revoke'] as const) {
      expect(parseRequest({ action, studentId: ID1 })).toEqual({ ok: true, request: { action, studentId: ID1 } });
      expect(parseRequest({ action, studentId: 'nope' }).ok).toBe(false);
    }
  });

  it('rejects unknown actions and non-objects', () => {
    expect(parseRequest({ action: 'delete_everything' }).ok).toBe(false);
    expect(parseRequest(null).ok).toBe(false);
    expect(parseRequest([]).ok).toBe(false);
    expect(parseRequest('create').ok).toBe(false);
  });
});
