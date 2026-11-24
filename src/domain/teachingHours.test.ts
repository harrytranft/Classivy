import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEACHING_HOURS, createDefaultTeachingHours, formatClockMinutes, getTeachingHoursStatus, normalizeTeachingHours, teachingHoursMessage, vietnamClock
} from './teachingHours';
import { normalizeClassroomSettings } from './classroomSettings';

// Giờ Việt Nam = UTC+7. Ngày mẫu: 2026-11-27 là Thứ 6, 28 là Thứ 7, 29 là Chủ nhật, 30 là Thứ 2.
const vn = (day: number, hh: number, mm: number) => new Date(Date.UTC(2026, 10, day, hh - 7, mm));

describe('vietnamClock', () => {
  it('tính theo giờ Việt Nam bất kể múi giờ máy', () => {
    expect(vietnamClock(vn(27, 17, 30))).toEqual({ weekday: 5, minutes: 17 * 60 + 30 });
    expect(vietnamClock(vn(29, 16, 0))).toEqual({ weekday: 7, minutes: 16 * 60 });
    expect(vietnamClock(vn(30, 0, 5))).toEqual({ weekday: 1, minutes: 5 });
  });
});

describe('getTeachingHoursStatus (khung mặc định)', () => {
  const status = (day: number, hh: number, mm: number) => getTeachingHoursStatus(DEFAULT_TEACHING_HOURS, vn(day, hh, mm));

  it('Thứ 6 17:30-20:40: khoá trong khung, mở ngoài khung', () => {
    expect(status(27, 17, 29).locked).toBe(false);
    expect(status(27, 17, 30).locked).toBe(true);
    expect(status(27, 20, 39).locked).toBe(true);
    expect(status(27, 20, 40).locked).toBe(false);
  });
  it('Thứ 7 16:30-18:10 và Chủ nhật 16:00-20:40', () => {
    expect(status(28, 16, 30).locked).toBe(true);
    expect(status(28, 18, 10).locked).toBe(false);
    expect(status(29, 15, 59).locked).toBe(false);
    expect(status(29, 20, 39).locked).toBe(true);
  });
  it('ngày khác không khoá', () => {
    expect(status(30, 18, 0).locked).toBe(false);
  });
  it('giờ thử lại = giờ tan lớp + số phút thử lại', () => {
    expect(status(27, 18, 0).retryAt).toBe('20:55');
    expect(status(28, 17, 0).retryAt).toBe('18:25');
    expect(teachingHoursMessage(status(28, 17, 0))).toBe('Lớp đang học, thử lại sau 18:25');
  });
  it('tắt chế độ thì không khoá', () => {
    expect(getTeachingHoursStatus({ ...DEFAULT_TEACHING_HOURS, enabled: false }, vn(27, 18, 0)).locked).toBe(false);
  });
  it('các khung nối nhau tính thành một buổi liền', () => {
    const settings = { enabled: true, retryMinutes: 5, slots: [
      { id: 'a', weekday: 1, start: '17:00', end: '18:00' }, { id: 'b', weekday: 1, start: '18:00', end: '19:00' }
    ] };
    expect(getTeachingHoursStatus(settings, vn(30, 17, 30)).retryAt).toBe('19:05');
  });
  it('thử lại vượt nửa đêm quay về đầu ngày', () => {
    expect(formatClockMinutes(24 * 60 + 5)).toBe('00:05');
  });
});

describe('normalizeTeachingHours', () => {
  it('thiếu hoặc sai kiểu cho mặc định', () => {
    expect(normalizeTeachingHours(undefined)).toEqual(DEFAULT_TEACHING_HOURS);
    expect(normalizeTeachingHours(null)).toEqual(DEFAULT_TEACHING_HOURS);
    expect(normalizeTeachingHours('x')).toEqual(DEFAULT_TEACHING_HOURS);
  });
  it('bỏ khung sai giờ, kẹp số phút thử lại', () => {
    const result = normalizeTeachingHours({ enabled: true, retryMinutes: 9999, slots: [
      { id: 'ok', weekday: 5, start: '17:00', end: '18:00' },
      { id: 'bad', weekday: 5, start: '19:00', end: '18:00' },
      { id: 'bad2', weekday: 9, start: '10:00', end: '11:00' }
    ] });
    expect(result.retryMinutes).toBe(120);
    expect(result.slots.map(slot => slot.id)).toEqual(['ok']);
  });
  it('danh sách rỗng là lựa chọn hợp lệ (không khoá lúc nào)', () => {
    const result = normalizeTeachingHours({ enabled: true, retryMinutes: 15, slots: [] });
    expect(result.slots).toEqual([]);
    expect(getTeachingHoursStatus(result, vn(27, 18, 0)).locked).toBe(false);
  });
  it('mặc định trả bản sao, không dùng chung tham chiếu', () => {
    const copy = createDefaultTeachingHours();
    copy.slots[0].start = '00:00';
    expect(DEFAULT_TEACHING_HOURS.slots[0].start).toBe('17:30');
  });
});

describe('normalizeClassroomSettings có teachingHours', () => {
  it('cột {} cho khung giờ mặc định; giá trị đã lưu được giữ', () => {
    expect(normalizeClassroomSettings({}).teachingHours).toEqual(DEFAULT_TEACHING_HOURS);
    const saved = { enabled: false, retryMinutes: 3, slots: [] };
    expect(normalizeClassroomSettings({ teachingHours: saved }).teachingHours).toEqual(saved);
  });
});
