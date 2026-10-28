import { describe, expect, it } from 'vitest';
import { parseStudentPortalPayload, toPortalEgg, toPortalTrainer } from './studentPortal';
import { trainerXpNeededForNextLevel } from './trainerProgression';

const pikachu = { instanceId: 'p1', dexId: 25, name: 'Pikachu', types: ['electric'], accessories: [], skills: [] };
const bulbasaur = { instanceId: 'p2', dexId: 1, name: 'Bulbasaur', types: ['grass'], accessories: [], skills: [] };

const activePayload = {
  status: 'active',
  name: 'Lan',
  gender: 'Nữ',
  class_name: '6A',
  points: 42,
  avatar: 'data:image/png;base64,AAAA',
  game: {
    pet: pikachu,
    pets: [pikachu, bulbasaur],
    egg: { status: 'egg', progress: 4, kind: 'special' },
    trainerProgress: { level: 2, xp: 5, totalXp: 85, titleId: 'battle-specialist' },
    earnedBadges: [{ badgeId: 'blaze', earnedAt: 1700000000000 }, { badgeId: 'khong-ton-tai', earnedAt: 1 }],
    supportPetInstanceId: 'p2'
  },
  history: [
    { amount: 5, reason: 'Trả lời hay', occurred_at: '2026-10-01T08:00:00Z' },
    { amount: -1, reason: 'Quên vở', occurred_at: '2026-10-02T08:00:00Z' }
  ]
};

describe('parseStudentPortalPayload', () => {
  it('đọc hồ sơ học sinh đang hoạt động', () => {
    const result = parseStudentPortalPayload(activePayload);
    expect(result.status).toBe('active');
    if (result.status !== 'active') return;
    const { profile } = result;
    expect(profile.name).toBe('Lan');
    expect(profile.className).toBe('6A');
    expect(profile.points).toBe(42);
    expect(profile.avatar).toBe('data:image/png;base64,AAAA');
    expect(profile.companion?.name).toBe('Pikachu');
    expect(profile.collection.map(p => p.name)).toEqual(['Bulbasaur']);
    expect(profile.supportPetInstanceId).toBe('p2');
    expect(profile.trainer.title.name).toBe('Battle Specialist');
    expect(profile.egg).toMatchObject({ label: 'Trứng đặc biệt', progress: 4, required: 15 });
  });

  it('bỏ huy hiệu không có trong danh sách, giữ huy hiệu biết', () => {
    const result = parseStudentPortalPayload(activePayload);
    if (result.status !== 'active') throw new Error('expected active');
    expect(result.profile.badges.map(b => b.id)).toEqual(['blaze']);
    expect(result.profile.badges[0].icon).toBe('🔥');
  });

  it('lịch sử mới nhất trước, giữ điểm trừ', () => {
    const result = parseStudentPortalPayload(activePayload);
    if (result.status !== 'active') throw new Error('expected active');
    expect(result.profile.history.map(h => h.amount)).toEqual([-1, 5]);
    expect(result.profile.history[0].occurredAt).toBe(Date.parse('2026-10-02T08:00:00Z'));
  });

  it('trả trạng thái khoá / chưa gắn / không phải học sinh mà không có dữ liệu', () => {
    expect(parseStudentPortalPayload({ status: 'locked' })).toEqual({ status: 'locked' });
    expect(parseStudentPortalPayload({ status: 'not_linked' })).toEqual({ status: 'not_linked' });
    expect(parseStudentPortalPayload({ status: 'not_student' })).toEqual({ status: 'not_student' });
  });

  it('ném lỗi với dữ liệu sai dạng hoặc trạng thái lạ', () => {
    expect(() => parseStudentPortalPayload(null)).toThrow();
    expect(() => parseStudentPortalPayload([])).toThrow();
    expect(() => parseStudentPortalPayload({ status: 'hacked' })).toThrow();
  });

  it('chịu được hồ sơ trống (học sinh mới, chưa có Pokémon)', () => {
    const result = parseStudentPortalPayload({ status: 'active', name: 'Vy', class_name: '7B', points: 0, avatar: null, game: {}, history: [] });
    if (result.status !== 'active') throw new Error('expected active');
    expect(result.profile.companion).toBeUndefined();
    expect(result.profile.collection).toEqual([]);
    expect(result.profile.egg).toBeUndefined();
    expect(result.profile.avatar).toBeUndefined();
    expect(result.profile.badges).toEqual([]);
    expect(result.profile.trainer.level).toBe(1);
    expect(result.profile.trainer.title.id).toBe('rookie');
  });

  it('bỏ Pokémon hỏng trong bộ sưu tập', () => {
    const result = parseStudentPortalPayload({ ...activePayload, game: { pets: [bulbasaur, { name: 'thiếu dexId' }, 'rác'] } });
    if (result.status !== 'active') throw new Error('expected active');
    expect(result.profile.collection.map(p => p.name)).toEqual(['Bulbasaur']);
  });
});

describe('toPortalTrainer', () => {
  it('tính cấp từ tổng XP như app giáo viên', () => {
    const needed = trainerXpNeededForNextLevel(1);
    const trainer = toPortalTrainer({ totalXp: needed + 7 });
    expect(trainer.level).toBe(2);
    expect(trainer.xp).toBe(7);
    expect(trainer.xpNeeded).toBe(trainerXpNeededForNextLevel(2));
    expect(trainer.percent).toBeGreaterThan(0);
  });

  it('dùng level/xp khi chưa có tổng XP', () => {
    expect(toPortalTrainer({ level: 3, xp: 10 })).toMatchObject({ level: 3, xp: 10 });
  });
});

describe('toPortalEgg', () => {
  it('chỉ hiện trứng đang ấp', () => {
    expect(toPortalEgg({ status: 'hatched', progress: 10 })).toBeUndefined();
    expect(toPortalEgg({ status: 'egg', progress: 50 })).toMatchObject({ progress: 10, required: 10, percent: 100 });
  });
});
