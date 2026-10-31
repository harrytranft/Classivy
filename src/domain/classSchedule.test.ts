import { describe, expect, it } from 'vitest';
import {
  formatScheduleSlot, getCurrentClassSession, getNextClassSession, normalizeClassSchedules, parseTimeToMinutes,
  renameClassInSchedules, removeClassFromSchedules, slotsOverlap, sortScheduleSlots, validateClassForm, validateScheduleSlot, weekdayOf
} from './classSchedule';

const MIN = 60_000;
// Thứ 6, 30/10/2026 (giờ địa phương).
const FRIDAY = new Date(2026, 9, 30, 0, 0, 0);
const at = (hours: number, minutes = 0, dayOffset = 0) =>
  new Date(FRIDAY.getFullYear(), FRIDAY.getMonth(), FRIDAY.getDate() + dayOffset, hours, minutes).getTime();
const spk = { id: 'spk-fri', weekday: 5, start: '19:00', end: '20:30' };

describe('giờ và thứ', () => {
  it('đọc giờ HH:MM', () => {
    expect(parseTimeToMinutes('19:30')).toBe(1170);
    expect(parseTimeToMinutes('7:30')).toBeNull();
    expect(parseTimeToMinutes('24:00')).toBeNull();
  });
  it('Chủ nhật là 7, Thứ 2 là 1', () => {
    expect(weekdayOf(FRIDAY)).toBe(5);
    expect(weekdayOf(new Date(2026, 10, 1))).toBe(7);
    expect(weekdayOf(new Date(2026, 10, 2))).toBe(1);
  });
  it('hiển thị gọn', () => expect(formatScheduleSlot(spk)).toBe('T6 19:00-20:30'));
});

describe('kiểm tra form lớp', () => {
  it('buổi học: thiếu giờ, giờ kết thúc trước giờ bắt đầu', () => {
    expect(validateScheduleSlot(spk)).toBeNull();
    expect(validateScheduleSlot({ weekday: 5, start: '', end: '20:00' })).toMatch(/giờ/);
    expect(validateScheduleSlot({ weekday: 5, start: '20:00', end: '19:00' })).toMatch(/sau giờ bắt đầu/);
    expect(validateScheduleSlot({ weekday: 0, start: '19:00', end: '20:00' })).toMatch(/ngày/);
  });
  it('trùng giờ cùng ngày bị chặn, khác ngày thì được', () => {
    const other = { id: 'b', weekday: 5, start: '20:00', end: '21:00' };
    expect(slotsOverlap(spk, other)).toBe(true);
    expect(slotsOverlap(spk, { ...other, weekday: 6 })).toBe(false);
    expect(slotsOverlap(spk, { ...other, start: '20:30' })).toBe(false);
    expect(validateClassForm('SPK', [spk, other], [])).toMatch(/trùng giờ/);
  });
  it('tên lớp: trống, trùng lớp khác, đổi tên giữ nguyên tên cũ được', () => {
    expect(validateClassForm('  ', [], [])).toMatch(/tên lớp/);
    expect(validateClassForm('6A', [], ['6A'])).toMatch(/Đã có lớp/);
    expect(validateClassForm('6A', [], ['6A'], '6A')).toBeNull();
    expect(validateClassForm('Tất cả', [], [])).toMatch(/Tất cả/);
  });
});

describe('buổi học đang diễn ra', () => {
  it('SPK Thứ 6 19:00-20:30: Pokémon xuất hiện trong 19:30-20:30', () => {
    const window = getCurrentClassSession([spk], at(19, 5), 30)!;
    expect(window.windowStart).toBe(at(19, 30));
    expect(window.windowEnd).toBe(at(20, 30));
    expect(window.key).toContain('spk-fri');
  });
  it('trước giờ, sau giờ hoặc khác thứ thì không có buổi', () => {
    expect(getCurrentClassSession([spk], at(18, 59), 30)).toBeNull();
    expect(getCurrentClassSession([spk], at(20, 30), 30)).toBeNull();
    expect(getCurrentClassSession([spk], at(19, 30, 1), 30)).toBeNull();
    expect(getCurrentClassSession(undefined, at(19, 30), 30)).toBeNull();
  });
  it('một lớp học nhiều buổi khác giờ', () => {
    const sat = { id: 'spk-sat', weekday: 6, start: '08:00', end: '09:30' };
    expect(getCurrentClassSession([spk, sat], at(8, 10, 1), 30)?.slot.id).toBe('spk-sat');
  });
  it('số phút chờ dài hơn buổi học thì khung giờ rỗng', () => {
    const window = getCurrentClassSession([spk], at(19, 5), 120)!;
    expect(window.windowStart).toBe(window.windowEnd);
  });
  it('buổi kế tiếp', () => {
    expect(getNextClassSession([spk], at(10), 30)?.classStartAt).toBe(at(19));
    expect(getNextClassSession([spk], at(21), 30)?.classStartAt).toBe(at(19, 0, 7));
    expect(getNextClassSession([], at(21), 30)).toBeNull();
  });
});

describe('chuẩn hoá và đổi tên', () => {
  it('sắp theo thứ rồi giờ', () => {
    const slots = [spk, { id: 'a', weekday: 1, start: '09:00', end: '10:00' }, { id: 'b', weekday: 1, start: '07:00', end: '08:00' }];
    expect(sortScheduleSlots(slots).map(slot => slot.id)).toEqual(['b', 'a', 'spk-fri']);
  });
  it('id trùng được đổi', () => {
    const result = normalizeClassSchedules({ X: [{ ...spk, id: 'a' }, { ...spk, id: 'a', weekday: 6 }] });
    expect(new Set(result.X.map(slot => slot.id)).size).toBe(2);
  });
  it('đổi tên và xoá lớp', () => {
    const schedules = { SPK: [spk], '6A': [] };
    expect(renameClassInSchedules(schedules, 'SPK', 'SPK2', [spk])).toEqual({ SPK2: [spk], '6A': [] });
    expect(removeClassFromSchedules(schedules, 'SPK')).toEqual({ '6A': [] });
  });
});
