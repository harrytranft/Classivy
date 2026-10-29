import { beforeEach, describe, expect, it, vi } from 'vitest';

// Phase 13C: cột classroom_settings chỉ được gửi khi app biết cột tồn tại; đọc báo rõ cột có hay chưa.
const calls: { upserts: Record<string, unknown>[]; row: Record<string, unknown> | null } = { upserts: [], row: null };

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: calls.row, error: null }) }) }),
      upsert: async (payload: Record<string, unknown>) => { calls.upserts.push(payload); return { error: null }; }
    })
  }
}));

import { fetchUserSettings, upsertTeacherSettings, upsertUserSettings } from './supabaseData';
import { createDefaultClassroomSettings } from '../data/classroomDefaults';

const baseSettings = { students: [], skills: [], posSoundUrl: '', negSoundUrl: '', timerSoundUrl: '' };

beforeEach(() => { calls.upserts = []; calls.row = null; });

describe('cột classroom_settings', () => {
  it('không gửi cột khi app chưa biết cột tồn tại (cả hai kiểu lưu)', async () => {
    await upsertUserSettings('u1', baseSettings);
    await upsertTeacherSettings('u1', baseSettings);
    expect(calls.upserts).toHaveLength(2);
    for (const payload of calls.upserts) expect('classroom_settings' in payload).toBe(false);
  });

  it('gửi cột khi có classroomSettings', async () => {
    const classroomSettings = createDefaultClassroomSettings();
    await upsertUserSettings('u1', { ...baseSettings, classroomSettings });
    await upsertTeacherSettings('u1', { ...baseSettings, classroomSettings });
    for (const payload of calls.upserts) expect(payload.classroom_settings).toEqual(classroomSettings);
  });

  it('đọc: hàng không có khoá cột => chưa chạy migration (undefined)', async () => {
    calls.row = { students: [], skills: [] };
    expect((await fetchUserSettings('u1'))?.classroomSettingsRaw).toBeUndefined();
  });

  it('đọc: cột có nhưng rỗng hoặc sai kiểu => {} (cột tồn tại, chưa ai lưu)', async () => {
    for (const value of [{}, null, [], 'x']) {
      calls.row = { students: [], skills: [], classroom_settings: value };
      expect((await fetchUserSettings('u1'))?.classroomSettingsRaw).toEqual({});
    }
  });

  it('đọc: cột có dữ liệu => trả nguyên để nơi dùng chuẩn hoá', async () => {
    calls.row = { students: [], skills: [], classroom_settings: { wildHunt: { enabled: false } } };
    expect((await fetchUserSettings('u1'))?.classroomSettingsRaw).toEqual({ wildHunt: { enabled: false } });
  });
});
