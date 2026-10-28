import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Gender, Student } from '../types';
import {
  MESSAGES, STICKERS, applyGiftAdjustments, buildTeacherGiftRows, parseGiftAdjustments, parseSocialOverview, remainingForFriend, socialErrorMessage
} from './social';

const migration = fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations/20261031100000_phase6_social.sql'), 'utf-8');
const sqlArray = (fn: string) => {
  const match = migration.match(new RegExp(`function public\\.${fn}\\(\\)[\\s\\S]*?array\\[([^\\]]*)\\]`));
  return (match?.[1] ?? '').split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean);
};

const student = (id: string, points = 10): Student => ({ id, name: id, gender: Gender.MALE, className: '8A', points, history: [] });

const overviewPayload = {
  enabled: true,
  me: 'me',
  wallet: { week_key: '2026-W44', limit: 5, per_friend_limit: 2, used: 3 },
  friends: [{ id: 'f1', name: 'Minh', pet_dex_id: 25, given_this_week: 1 }, { id: 'f2', name: 'Phúc', pet_dex_id: null, given_this_week: 2 }],
  incoming: [{ request_id: 7, id: 's3', name: 'Nga' }, { request_id: 'x', id: 's4', name: 'Hỏng' }],
  outgoing: [],
  classmates: [{ id: 's5', name: 'An' }],
  received: [
    { id: 1, name: 'Minh', amount: 2, sticker_id: 'star', message_id: 'thanks_help', created_at: '2026-10-28T02:00:00Z', state: 'pending', reported: false },
    { id: 2, name: 'Phúc', amount: 1, sticker_id: 'heart', message_id: null, created_at: '2026-10-27T02:00:00Z', state: 'applied', reported: true },
    { id: 3, name: 'Phúc', amount: 2, sticker_id: 'heart', message_id: null, created_at: '2026-10-26T02:00:00Z', state: 'revoked' }
  ],
  sent: []
};

describe('danh mục khớp với DB', () => {
  it('sticker và lời nhắn giống hệt migration', () => {
    expect(STICKERS.map(s => s.id)).toEqual(sqlArray('social_sticker_ids'));
    expect(MESSAGES.map(m => m.id)).toEqual(sqlArray('social_message_ids'));
  });
});

describe('parseSocialOverview', () => {
  it('tính ví, hàng chờ, bỏ dòng hỏng', () => {
    const result = parseSocialOverview(overviewPayload);
    if (!result.enabled) throw new Error('expected enabled');
    const { overview } = result;
    expect(overview.wallet).toMatchObject({ limit: 5, used: 3, remaining: 2, perFriendLimit: 2 });
    expect(overview.friends.map(f => f.name)).toEqual(['Minh', 'Phúc']);
    expect(overview.friends[1].petDexId).toBeUndefined();
    expect(overview.incoming).toEqual([{ id: 's3', name: 'Nga', requestId: 7 }]);
    expect(overview.pendingPoints).toBe(2);
    expect(overview.received[1].reported).toBe(true);
    expect(overview.received[2].state).toBe('revoked');
  });

  it('lớp tắt tính năng', () => {
    expect(parseSocialOverview({ enabled: false })).toEqual({ enabled: false });
  });

  it('ném lỗi khi dữ liệu sai dạng', () => {
    expect(() => parseSocialOverview(null)).toThrow();
    expect(() => parseSocialOverview({ enabled: 'yes' })).toThrow();
  });

  it('điểm còn tặng được cho từng bạn', () => {
    const result = parseSocialOverview(overviewPayload);
    if (!result.enabled) throw new Error('expected enabled');
    const { wallet, friends } = result.overview;
    expect(remainingForFriend(wallet, friends[0])).toBe(1);
    expect(remainingForFriend(wallet, friends[1])).toBe(0);
    expect(remainingForFriend({ ...wallet, remaining: 0 }, friends[0])).toBe(0);
  });
});

describe('socialErrorMessage', () => {
  it('đổi mã lỗi thành câu tiếng Việt, mã lạ thành câu chung', () => {
    expect(socialErrorMessage({ message: 'weekly_limit' })).toContain('Ví điểm tặng tuần này đã hết');
    expect(socialErrorMessage({ message: 'permission denied for table students' })).toBe('Chưa làm được, em thử lại sau nhé.');
    expect(socialErrorMessage(null)).toBe('Chưa làm được, em thử lại sau nhé.');
  });
});

describe('applyGiftAdjustments', () => {
  const adjustments = parseGiftAdjustments([
    { student_client_id: 'minh', client_event_id: 'gift-1', amount: 2, reason: '🎁 Quà từ Lan: +2 Hào Quang', occurred_at: '2026-10-28T02:00:00Z' },
    { student_client_id: 'minh', client_event_id: 'gift-2', amount: 1, reason: '🎁 Quà từ Phúc: +1 Hào Quang', occurred_at: '2026-10-28T03:00:00Z' },
    { student_client_id: 'phuc', client_event_id: 'gift-revoke-3', amount: -2, reason: '↩️ Thu hồi', occurred_at: '2026-10-28T04:00:00Z' },
    { student_client_id: 'khong-co', client_event_id: 'gift-9', amount: 2, reason: 'x', occurred_at: '2026-10-28T04:00:00Z' },
    { bad: true }
  ]);

  it('cộng/trừ điểm và thêm lịch sử có id = client_event_id, mới nhất trước', () => {
    const { students, applied } = applyGiftAdjustments([student('minh'), student('phuc'), student('lan')], adjustments);
    expect(students[0].points).toBe(13);
    expect(students[0].history.map(h => h.id)).toEqual(['gift-2', 'gift-1']);
    expect(students[1].points).toBe(8);
    expect(students[2]).toEqual(student('lan'));
    expect(applied.map(a => a.clientEventId)).toEqual(['gift-1', 'gift-2', 'gift-revoke-3']);
  });

  it('không bao giờ cộng trùng: bỏ qua dòng đã có trong lịch sử hoặc đã cộng trong phiên', () => {
    const first = applyGiftAdjustments([student('minh'), student('phuc')], adjustments);
    const again = applyGiftAdjustments(first.students, adjustments);
    expect(again.applied).toEqual([]);
    expect(again.students).toBe(first.students);
    const skipped = applyGiftAdjustments([student('minh')], adjustments, new Set(['gift-1']));
    expect(skipped.students[0].points).toBe(11);
  });

  it('dòng trùng trong cùng một lần đọc chỉ cộng một lần', () => {
    const dup = [...adjustments.slice(0, 1), ...adjustments.slice(0, 1)];
    expect(applyGiftAdjustments([student('minh')], dup).students[0].points).toBe(12);
  });

  it('không chạm dữ liệu game', () => {
    const s = { ...student('minh'), pet: { dexId: 25, name: 'Pikachu', types: [], accessories: [], skills: [], level: 3 } };
    const { students } = applyGiftAdjustments([s], adjustments);
    expect(students[0].pet).toBe(s.pet);
  });
});

describe('buildTeacherGiftRows', () => {
  it('ghép tên, thu hồi, số báo cáo; mới nhất trước', () => {
    const rows = buildTeacherGiftRows({
      gifts: [
        { id: 1, sender_id: 'a', recipient_id: 'b', amount: 2, sticker_id: 'star', message_id: 'good_job', created_at: '2026-10-27T01:00:00Z' },
        { id: 2, sender_id: 'b', recipient_id: 'gone', amount: 0, sticker_id: 'heart', message_id: null, created_at: '2026-10-28T01:00:00Z' }
      ],
      names: { a: 'Lan', b: 'Minh' },
      revocations: [{ gift_id: 1, reason: 'đổi qua lại', revoked_at: '2026-10-28T02:00:00Z' }],
      reports: [{ gift_id: 1 }, { gift_id: 1 }]
    });
    expect(rows.map(r => r.id)).toEqual([2, 1]);
    expect(rows[0].to).toBe('Học sinh đã rời lớp');
    expect(rows[1]).toMatchObject({ from: 'Lan', to: 'Minh', message: 'Bạn làm tốt lắm!', reportCount: 2 });
    expect(rows[1].revoked?.reason).toBe('đổi qua lại');
    expect(rows[1].sticker.emoji).toBe('⭐');
  });
});
