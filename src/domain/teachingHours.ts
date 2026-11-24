import { ClassScheduleSlot, TeachingHoursSettings } from '../types';
import { parseTimeToMinutes, validateScheduleSlot } from './classSchedule';

// "Chế độ giờ dạy": trong các khung giờ giáo viên đặt, học sinh vẫn đăng nhập và xem Hào Quang,
// nhưng các nút GHI (Cửa hàng, Hợp nhất, Đổi đồng hành/hỗ trợ, Tặng quà) bị khoá để không đụng độ
// với máy giáo viên đang chấm điểm. Logic thuần, có test. Giờ luôn tính theo giờ Việt Nam (UTC+7, không đổi giờ mùa hè),
// không theo đồng hồ máy học sinh.

const MAX_SLOTS = 28;
const MAX_RETRY_MINUTES = 120;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MINUTES = 24 * 60;

export const DEFAULT_TEACHING_HOURS: TeachingHoursSettings = {
  enabled: true,
  retryMinutes: 15,
  slots: [
    { id: 'teach-fri', weekday: 5, start: '17:30', end: '20:40' },
    { id: 'teach-sat', weekday: 6, start: '16:30', end: '18:10' },
    { id: 'teach-sun', weekday: 7, start: '16:00', end: '20:40' }
  ]
};

export const createDefaultTeachingHours = (): TeachingHoursSettings => ({
  ...DEFAULT_TEACHING_HOURS,
  slots: DEFAULT_TEACHING_HOURS.slots.map(slot => ({ ...slot }))
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** Giá trị thiếu/sai kiểu (chưa ai lưu, cột chưa có) cho ra mặc định; buổi sai giờ bị bỏ. Danh sách rỗng là lựa chọn hợp lệ (không khoá lúc nào). */
export const normalizeTeachingHours = (value: unknown): TeachingHoursSettings => {
  if (!isRecord(value)) return createDefaultTeachingHours();
  const retry = typeof value.retryMinutes === 'number' && Number.isFinite(value.retryMinutes)
    ? Math.min(MAX_RETRY_MINUTES, Math.max(0, Math.round(value.retryMinutes)))
    : DEFAULT_TEACHING_HOURS.retryMinutes;
  let slots: ClassScheduleSlot[];
  if (Array.isArray(value.slots)) {
    const seen = new Set<string>();
    slots = [];
    value.slots.forEach((item, index) => {
      if (!isRecord(item) || slots.length >= MAX_SLOTS) return;
      const slot: ClassScheduleSlot = {
        id: typeof item.id === 'string' && item.id ? item.id.slice(0, 60) : `teach-${index + 1}`,
        weekday: typeof item.weekday === 'number' ? Math.round(item.weekday) : 0,
        start: typeof item.start === 'string' ? item.start : '',
        end: typeof item.end === 'string' ? item.end : ''
      };
      if (validateScheduleSlot(slot)) return;
      while (seen.has(slot.id)) slot.id = `${slot.id}-${seen.size}`;
      seen.add(slot.id);
      slots.push(slot);
    });
  } else {
    slots = createDefaultTeachingHours().slots;
  }
  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : DEFAULT_TEACHING_HOURS.enabled,
    retryMinutes: retry,
    slots
  };
};

/** Thứ (1 = Thứ 2 ... 7 = Chủ nhật) và số phút trong ngày theo giờ Việt Nam. */
export const vietnamClock = (now: Date): { weekday: number; minutes: number } => {
  const vn = new Date(now.getTime() + VN_OFFSET_MS);
  const day = vn.getUTCDay();
  return { weekday: day === 0 ? 7 : day, minutes: vn.getUTCHours() * 60 + vn.getUTCMinutes() };
};

export const formatClockMinutes = (minutes: number): string => {
  const wrapped = ((Math.round(minutes) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
};

export interface TeachingHoursStatus {
  locked: boolean;
  /** "HH:MM" giờ học sinh được thử lại (giờ tan lớp + thời gian thử lại). Chỉ có khi locked. */
  retryAt?: string;
}

const OPEN: TeachingHoursStatus = { locked: false };

export const getTeachingHoursStatus = (settings: TeachingHoursSettings, now: Date): TeachingHoursStatus => {
  if (!settings.enabled) return OPEN;
  const { weekday, minutes } = vietnamClock(now);
  const today = settings.slots
    .filter(slot => slot.weekday === weekday)
    .map(slot => ({ start: parseTimeToMinutes(slot.start), end: parseTimeToMinutes(slot.end) }))
    .filter((slot): slot is { start: number; end: number } => slot.start !== null && slot.end !== null);
  const current = today.find(slot => minutes >= slot.start && minutes < slot.end);
  if (!current) return OPEN;
  // Các khung nối nhau (khung sau bắt đầu trước khi khung trước tan) coi như một buổi liền.
  let end = current.end;
  for (let extended = true; extended;) {
    extended = false;
    for (const slot of today) {
      if (slot.start <= end && slot.end > end) { end = slot.end; extended = true; }
    }
  }
  return { locked: true, retryAt: formatClockMinutes(end + settings.retryMinutes) };
};

/** Câu hiện cho học sinh khi đang trong giờ dạy. */
export const teachingHoursMessage = (status: TeachingHoursStatus): string =>
  `Lớp đang học, thử lại sau ${status.retryAt ?? ''}`.trim();
