// Logic thuần cho tài khoản học sinh (Phase 4, ADR 0002). KHÔNG import gì để cả Edge Function (Deno) lẫn
// vitest/trình duyệt đều dùng được. Test: src/domain/studentAccount.test.ts.

/** Tên miền của email ảo nội bộ. `.invalid` là TLD dành riêng, không bao giờ gửi thư được. Đổi ở đây nếu Supabase từ chối. */
export const STUDENT_EMAIL_DOMAIN = 'students.classivy.invalid';

/** Số học sinh tối đa mỗi lần gọi Edge Function (giữ dưới giới hạn CPU/thời gian của gói Free). */
export const MAX_BATCH = 60;

export const USERNAME_PATTERN = /^[a-z0-9]{3,24}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUsername = (value: unknown): value is string =>
  typeof value === 'string' && USERNAME_PATTERN.test(value);

export const usernameToEmail = (username: string): string => `${username.trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;

export const isStudentEmail = (email: string): boolean => email.trim().toLowerCase().endsWith(`@${STUDENT_EMAIL_DOMAIN}`);

/** Ô đăng nhập: có "@" là email giáo viên (giữ nguyên); không có "@" là tên đăng nhập học sinh. */
export const normalizeLoginInput = (input: string): string => {
  const value = input.trim();
  return value.includes('@') ? value : usernameToEmail(value);
};

/** Bỏ dấu tiếng Việt, đổi đ -> d, chỉ giữ a-z0-9. */
export const toAsciiLetters = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/**
 * Gợi ý tên đăng nhập: hai chữ cuối của tên (không dấu) + số ngẫu nhiên. "Nguyễn Minh Anh" -> "minhanh472".
 * `randomInt(max)` trả số nguyên trong [0, max). `extraDigits` thêm chữ số khi bị trùng nhiều lần.
 */
export const suggestUsername = (name: string, randomInt: (max: number) => number, extraDigits = 0): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  let base = toAsciiLetters(words.slice(-2).join(''));
  if (base.length < 2) base = 'hs';
  const digitCount = 3 + Math.max(0, extraDigits);
  base = base.slice(0, 24 - digitCount);
  let digits = '';
  for (let i = 0; i < digitCount; i += 1) digits += String(randomInt(10));
  return `${base}${digits}`;
};

// Bỏ ký tự dễ nhầm (0/o, 1/l/i) để in thẻ dễ đọc. 31 ký tự, 8 vị trí.
const PASSWORD_LETTERS = 'abcdefghjkmnpqrstuvwxyz';
const PASSWORD_DIGITS = '23456789';
const PASSWORD_ALPHABET = PASSWORD_LETTERS + PASSWORD_DIGITS;
export const PASSWORD_LENGTH = 8;

/** Mật khẩu ngẫu nhiên 8 ký tự, luôn có ít nhất một chữ và một số (ở hai vị trí khác nhau). */
export const generatePassword = (randomInt: (max: number) => number): string => {
  const chars: string[] = [];
  for (let i = 0; i < PASSWORD_LENGTH; i += 1) chars.push(PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]);
  const letterPos = randomInt(PASSWORD_LENGTH);
  let digitPos = randomInt(PASSWORD_LENGTH - 1);
  if (digitPos >= letterPos) digitPos += 1;
  chars[letterPos] = PASSWORD_LETTERS[randomInt(PASSWORD_LETTERS.length)];
  chars[digitPos] = PASSWORD_DIGITS[randomInt(PASSWORD_DIGITS.length)];
  return chars.join('');
};

/** Số nguyên ngẫu nhiên an toàn mật mã trong [0, max) (loại bỏ lệch bằng rejection sampling). */
export const cryptoRandomInt = (max: number): number => {
  if (!Number.isInteger(max) || max <= 0 || max > 256) throw new Error('max must be an integer in 1..256');
  const limit = Math.floor(256 / max) * max;
  const buf = new Uint8Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
};

export type StudentAccountRequest =
  | { action: 'create'; studentIds: string[]; usernameOverrides: Record<string, string> }
  | { action: 'reset_password' | 'lock' | 'unlock' | 'revoke'; studentId: string };

export type ParseResult = { ok: true; request: StudentAccountRequest } | { ok: false; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_PATTERN.test(v);

/** Kiểm tra thân yêu cầu từ trình duyệt (không tin dữ liệu gửi lên). */
export const parseRequest = (body: unknown): ParseResult => {
  if (!isRecord(body)) return { ok: false, error: 'Yêu cầu không hợp lệ.' };
  const { action } = body;

  if (action === 'create') {
    const ids = body.studentIds;
    if (!Array.isArray(ids) || ids.length === 0) return { ok: false, error: 'Chưa chọn học sinh nào.' };
    if (ids.length > MAX_BATCH) return { ok: false, error: `Mỗi lần tạo tối đa ${MAX_BATCH} học sinh.` };
    if (!ids.every(isUuid)) return { ok: false, error: 'Danh sách học sinh không hợp lệ.' };
    const studentIds = Array.from(new Set(ids.map(id => id.toLowerCase())));
    const overridesRaw = body.usernames ?? {};
    if (!isRecord(overridesRaw)) return { ok: false, error: 'Tên đăng nhập không hợp lệ.' };
    const usernameOverrides: Record<string, string> = {};
    for (const [id, value] of Object.entries(overridesRaw)) {
      const key = id.toLowerCase();
      if (!studentIds.includes(key)) return { ok: false, error: 'Tên đăng nhập gắn với học sinh không được chọn.' };
      const username = typeof value === 'string' ? value.trim().toLowerCase() : value;
      if (!isValidUsername(username)) return { ok: false, error: 'Tên đăng nhập chỉ gồm chữ thường không dấu và số, dài 3-24 ký tự.' };
      usernameOverrides[key] = username;
    }
    return { ok: true, request: { action, studentIds, usernameOverrides } };
  }

  if (action === 'reset_password' || action === 'lock' || action === 'unlock' || action === 'revoke') {
    if (!isUuid(body.studentId)) return { ok: false, error: 'Học sinh không hợp lệ.' };
    return { ok: true, request: { action, studentId: body.studentId.toLowerCase() } };
  }

  return { ok: false, error: 'Hành động không được hỗ trợ.' };
};
