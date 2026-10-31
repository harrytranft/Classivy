import { ClassScheduleSlot } from '../types';

// Lịch học của lớp (ngày trong tuần + khung giờ) và khung giờ Pokémon hoang dã xuất hiện.
// Logic thuần, có test. Giờ tính theo giờ máy của giáo viên.

export const WEEKDAYS: { value: number; label: string; short: string }[] = [
  { value: 1, label: 'Thứ 2', short: 'T2' },
  { value: 2, label: 'Thứ 3', short: 'T3' },
  { value: 3, label: 'Thứ 4', short: 'T4' },
  { value: 4, label: 'Thứ 5', short: 'T5' },
  { value: 5, label: 'Thứ 6', short: 'T6' },
  { value: 6, label: 'Thứ 7', short: 'T7' },
  { value: 7, label: 'Chủ nhật', short: 'CN' }
];

const MAX_SLOTS_PER_CLASS = 14;
const MAX_CLASS_NAME = 40;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MINUTE_MS = 60 * 1000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** "19:30" -> 1170 phút; sai định dạng -> null. */
export const parseTimeToMinutes = (value: string): number | null => {
  const match = TIME_PATTERN.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

/** Thứ trong tuần theo quy ước của app: 1 = Thứ 2 ... 7 = Chủ nhật. */
export const weekdayOf = (date: Date): number => (date.getDay() === 0 ? 7 : date.getDay());

export const weekdayLabel = (weekday: number): string => WEEKDAYS.find(day => day.value === weekday)?.label ?? '?';

/** Lỗi của một buổi học (để hiện trong form), hoặc null nếu hợp lệ. */
export const validateScheduleSlot = (slot: Pick<ClassScheduleSlot, 'weekday' | 'start' | 'end'>): string | null => {
  if (!WEEKDAYS.some(day => day.value === slot.weekday)) return 'Chọn ngày học.';
  const start = parseTimeToMinutes(slot.start);
  const end = parseTimeToMinutes(slot.end);
  if (start === null || end === null) return 'Nhập giờ bắt đầu và giờ kết thúc.';
  if (end <= start) return 'Giờ kết thúc phải sau giờ bắt đầu.';
  return null;
};

/** Hai buổi cùng ngày có khung giờ chồng nhau. */
export const slotsOverlap = (a: ClassScheduleSlot, b: ClassScheduleSlot): boolean => {
  if (a.weekday !== b.weekday) return false;
  const [aStart, aEnd, bStart, bEnd] = [a.start, a.end, b.start, b.end].map(parseTimeToMinutes);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false;
  return aStart < bEnd && bStart < aEnd;
};

/** Lỗi đầu tiên của cả form lớp (tên + các buổi), hoặc null. */
export const validateClassForm = (
  name: string,
  slots: ClassScheduleSlot[],
  existingNames: string[],
  originalName?: string
): string | null => {
  const trimmed = name.trim();
  if (!trimmed) return 'Nhập tên lớp.';
  if (trimmed.length > MAX_CLASS_NAME) return `Tên lớp tối đa ${MAX_CLASS_NAME} ký tự.`;
  if (trimmed === 'Tất cả') return 'Tên "Tất cả" đã được dùng cho bộ lọc, hãy chọn tên khác.';
  if (trimmed !== originalName && existingNames.includes(trimmed)) return `Đã có lớp "${trimmed}".`;
  if (slots.length > MAX_SLOTS_PER_CLASS) return `Mỗi lớp tối đa ${MAX_SLOTS_PER_CLASS} buổi học.`;
  for (let i = 0; i < slots.length; i += 1) {
    const error = validateScheduleSlot(slots[i]);
    if (error) return `Buổi ${i + 1}: ${error}`;
    for (let j = 0; j < i; j += 1) {
      if (slotsOverlap(slots[i], slots[j])) return `Buổi ${j + 1} và buổi ${i + 1} trùng giờ nhau.`;
    }
  }
  return null;
};

/** Sắp xếp theo thứ rồi giờ bắt đầu. */
export const sortScheduleSlots = (slots: ClassScheduleSlot[]): ClassScheduleSlot[] =>
  [...slots].sort((a, b) => a.weekday - b.weekday || (parseTimeToMinutes(a.start) ?? 0) - (parseTimeToMinutes(b.start) ?? 0));

/** "T6 19:00-20:30" */
export const formatScheduleSlot = (slot: ClassScheduleSlot): string =>
  `${WEEKDAYS.find(day => day.value === slot.weekday)?.short ?? '?'} ${slot.start}-${slot.end}`;

/** Chuẩn hoá lịch học từ nguồn không tin cậy: bỏ buổi sai, giữ lớp không có buổi nào. */
export const normalizeClassSchedules = (value: unknown): Record<string, ClassScheduleSlot[]> => {
  if (!isRecord(value)) return {};
  const result: Record<string, ClassScheduleSlot[]> = {};
  Object.entries(value).forEach(([rawName, rawSlots]) => {
    const name = rawName.trim().slice(0, MAX_CLASS_NAME);
    if (!name || name === 'Tất cả' || !Array.isArray(rawSlots)) return;
    const seen = new Set<string>();
    const slots: ClassScheduleSlot[] = [];
    rawSlots.forEach((item, index) => {
      if (!isRecord(item) || slots.length >= MAX_SLOTS_PER_CLASS) return;
      const slot = {
        id: typeof item.id === 'string' && item.id ? item.id.slice(0, 60) : `slot-${index + 1}`,
        weekday: typeof item.weekday === 'number' ? Math.round(item.weekday) : 0,
        start: typeof item.start === 'string' ? item.start : '',
        end: typeof item.end === 'string' ? item.end : ''
      };
      if (validateScheduleSlot(slot)) return;
      while (seen.has(slot.id)) slot.id = `${slot.id}-${seen.size}`;
      seen.add(slot.id);
      slots.push(slot);
    });
    result[name] = sortScheduleSlots(slots);
  });
  return result;
};

const atMinutes = (day: Date, minutes: number): number => {
  const date = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  date.setMinutes(minutes);
  return date.getTime();
};

const localDayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

/** Buổi học cụ thể (một ngày) và khung giờ Pokémon được phép xuất hiện. */
export interface ClassSessionWindow {
  /** Khoá duy nhất của buổi: ngày + id buổi. */
  key: string;
  slot: ClassScheduleSlot;
  classStartAt: number;
  classEndAt: number;
  /** Pokémon có thể xuất hiện từ windowStart tới trước windowEnd (= giờ kết thúc). */
  windowStart: number;
  windowEnd: number;
}

export const toSessionWindow = (slot: ClassScheduleSlot, day: Date, offsetMinutes: number): ClassSessionWindow | null => {
  const start = parseTimeToMinutes(slot.start);
  const end = parseTimeToMinutes(slot.end);
  if (start === null || end === null || end <= start) return null;
  const classStartAt = atMinutes(day, start);
  const classEndAt = atMinutes(day, end);
  return {
    key: `${localDayKey(day)}|${slot.id}`,
    slot,
    classStartAt,
    classEndAt,
    windowStart: Math.min(classEndAt, classStartAt + Math.max(0, offsetMinutes) * MINUTE_MS),
    windowEnd: classEndAt
  };
};

/** Buổi học đang diễn ra lúc `now` (từ giờ bắt đầu tới trước giờ kết thúc), nếu có. */
export const getCurrentClassSession = (
  slots: ClassScheduleSlot[] | undefined,
  now: number,
  offsetMinutes: number
): ClassSessionWindow | null => {
  const today = new Date(now);
  const weekday = weekdayOf(today);
  for (const slot of slots || []) {
    if (slot.weekday !== weekday) continue;
    const window = toSessionWindow(slot, today, offsetMinutes);
    if (window && now >= window.classStartAt && now < window.classEndAt) return window;
  }
  return null;
};

/** Buổi học kế tiếp (chưa bắt đầu) trong 7 ngày tới, để báo cho giáo viên. */
export const getNextClassSession = (
  slots: ClassScheduleSlot[] | undefined,
  now: number,
  offsetMinutes: number
): ClassSessionWindow | null => {
  let best: ClassSessionWindow | null = null;
  for (let dayOffset = 0; dayOffset <= 7; dayOffset += 1) {
    const base = new Date(now);
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset);
    const weekday = weekdayOf(day);
    for (const slot of slots || []) {
      if (slot.weekday !== weekday) continue;
      const window = toSessionWindow(slot, day, offsetMinutes);
      if (window && window.classStartAt > now && (!best || window.classStartAt < best.classStartAt)) best = window;
    }
    if (best) return best;
  }
  return best;
};

/** "19:30" từ mốc thời gian. */
export const formatClock = (ms: number): string => {
  const date = new Date(ms);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// ---------- Đổi tên / xoá lớp trong lịch ----------

export const renameClassInSchedules = (
  schedules: Record<string, ClassScheduleSlot[]>,
  oldName: string,
  newName: string,
  slots: ClassScheduleSlot[]
): Record<string, ClassScheduleSlot[]> => {
  const next = { ...schedules };
  delete next[oldName];
  next[newName] = sortScheduleSlots(slots);
  return next;
};

export const removeClassFromSchedules = (
  schedules: Record<string, ClassScheduleSlot[]>,
  name: string
): Record<string, ClassScheduleSlot[]> => {
  const next = { ...schedules };
  delete next[name];
  return next;
};
