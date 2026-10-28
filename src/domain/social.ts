import { Student } from '../types';

// Phase 6 (ADR 0004): bạn bè, quà tặng, ví điểm tặng.
// - Danh mục sticker/lời nhắn phải khớp migration 20261031100000_phase6_social.sql (có test đối chiếu).
// - Đọc gói dữ liệu của student_social_overview() thành mô hình hiển thị (không tin JSON).
// - applyGiftAdjustments: app giáo viên cộng "hàng chờ" điểm tặng vào Hào Quang (D23).

export interface StickerDefinition { id: string; emoji: string; label: string }
export interface MessageDefinition { id: string; text: string }

export const STICKERS: StickerDefinition[] = [
  { id: 'star', emoji: '⭐', label: 'Ngôi sao' },
  { id: 'heart', emoji: '💚', label: 'Trái tim' },
  { id: 'clap', emoji: '👏', label: 'Vỗ tay' },
  { id: 'thumbs', emoji: '👍', label: 'Tuyệt' },
  { id: 'fire', emoji: '🔥', label: 'Bùng cháy' },
  { id: 'rainbow', emoji: '🌈', label: 'Cầu vồng' },
  { id: 'leaf', emoji: '🌱', label: 'Chồi non' },
  { id: 'trophy', emoji: '🏆', label: 'Cúp vàng' }
];

export const MESSAGES: MessageDefinition[] = [
  { id: 'thanks_help', text: 'Cảm ơn bạn đã giúp mình!' },
  { id: 'great_answer', text: 'Câu trả lời của bạn hay quá!' },
  { id: 'good_job', text: 'Bạn làm tốt lắm!' },
  { id: 'keep_going', text: 'Cố lên, bạn làm được mà!' },
  { id: 'team_player', text: 'Làm nhóm với bạn vui ghê!' },
  { id: 'kind_friend', text: 'Cảm ơn vì bạn luôn tốt bụng!' }
];

/** Số điểm tối đa trong một lần tặng (khớp kiểm tra trong DB). */
export const MAX_GIFT_POINTS = 2;

export const getSticker = (id: string): StickerDefinition => STICKERS.find(s => s.id === id) ?? { id, emoji: '🎁', label: 'Quà' };
export const getMessageText = (id?: string | null): string | null => (id ? MESSAGES.find(m => m.id === id)?.text ?? null : null);

// ---------------------------------------------------------------------------
// Gói dữ liệu cho học sinh
// ---------------------------------------------------------------------------

export type GiftState = 'pending' | 'applied' | 'revoked';

export interface SocialPerson { id: string; name: string }
export interface SocialFriend extends SocialPerson { petDexId?: number; givenThisWeek: number }
export interface SocialRequest extends SocialPerson { requestId: number }
export interface SocialGift {
  id: number;
  name: string;
  amount: number;
  stickerId: string;
  messageId: string | null;
  createdAt: number;
  state: GiftState;
  reported: boolean;
}

export interface SocialWallet {
  weekKey: string;
  limit: number;
  perFriendLimit: number;
  used: number;
  remaining: number;
}

export interface SocialOverview {
  wallet: SocialWallet;
  friends: SocialFriend[];
  incoming: SocialRequest[];
  outgoing: SocialRequest[];
  classmates: SocialPerson[];
  received: SocialGift[];
  sent: SocialGift[];
  /** Tổng điểm được tặng đang chờ cộng vào Hào Quang. */
  pendingPoints: number;
}

export type SocialResult = { enabled: false } | { enabled: true; overview: SocialOverview };

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const list = (v: unknown): Json[] => (Array.isArray(v) ? v.filter(isObject) : []);

const toPerson = (v: Json): SocialPerson | null => (typeof v.id === 'string' && typeof v.name === 'string' ? { id: v.id, name: v.name } : null);

const toGift = (v: Json): SocialGift | null => {
  if (typeof v.id !== 'number' || typeof v.sticker_id !== 'string') return null;
  const state = v.state === 'applied' || v.state === 'revoked' ? v.state : 'pending';
  return {
    id: v.id,
    name: str(v.name, 'Bạn cùng lớp'),
    amount: num(v.amount),
    stickerId: v.sticker_id,
    messageId: typeof v.message_id === 'string' ? v.message_id : null,
    createdAt: typeof v.created_at === 'string' ? Date.parse(v.created_at) || 0 : 0,
    state,
    reported: v.reported === true
  };
};

const notNull = <T,>(value: T | null): value is T => value !== null;

/** Đọc kết quả student_social_overview(). Ném lỗi khi dữ liệu sai dạng (màn hình hiện lỗi chung). */
export const parseSocialOverview = (raw: unknown): SocialResult => {
  if (!isObject(raw)) throw new Error('Invalid social overview');
  if (raw.enabled === false) return { enabled: false };
  if (raw.enabled !== true) throw new Error('Invalid social overview');
  const wallet = isObject(raw.wallet) ? raw.wallet : {};
  const limit = Math.max(0, num(wallet.limit));
  const used = Math.max(0, num(wallet.used));
  const received = list(raw.received).map(toGift).filter(notNull);
  return {
    enabled: true,
    overview: {
      wallet: { weekKey: str(wallet.week_key), limit, perFriendLimit: Math.max(0, num(wallet.per_friend_limit)), used, remaining: Math.max(0, limit - used) },
      friends: list(raw.friends).map(v => {
        const person = toPerson(v);
        return person ? { ...person, petDexId: typeof v.pet_dex_id === 'number' ? v.pet_dex_id : undefined, givenThisWeek: num(v.given_this_week) } : null;
      }).filter(notNull),
      incoming: list(raw.incoming).map(v => { const p = toPerson(v); return p && typeof v.request_id === 'number' ? { ...p, requestId: v.request_id } : null; }).filter(notNull),
      outgoing: list(raw.outgoing).map(v => { const p = toPerson(v); return p && typeof v.request_id === 'number' ? { ...p, requestId: v.request_id } : null; }).filter(notNull),
      classmates: list(raw.classmates).map(toPerson).filter(notNull),
      received,
      sent: list(raw.sent).map(toGift).filter(notNull),
      pendingPoints: received.filter(g => g.state === 'pending').reduce((sum, g) => sum + g.amount, 0)
    }
  };
};

/** Điểm còn tặng được cho một bạn tuần này (theo cả hạn mức tổng và hạn mức mỗi bạn). */
export const remainingForFriend = (wallet: SocialWallet, friend: SocialFriend): number =>
  Math.max(0, Math.min(wallet.remaining, wallet.perFriendLimit - friend.givenThisWeek, MAX_GIFT_POINTS));

const ERROR_MESSAGES: Record<string, string> = {
  social_disabled: 'Thầy cô đang tắt tính năng bạn bè của lớp.',
  not_classmate: 'Chỉ kết bạn được với bạn cùng lớp.',
  not_friend: 'Em chỉ tặng quà được cho bạn bè.',
  too_many_requests: 'Em đang có nhiều lời mời chờ trả lời. Hãy đợi các bạn trả lời nhé.',
  request_not_found: 'Lời mời này không còn nữa.',
  invalid_amount: `Mỗi lần tặng từ 0 đến ${MAX_GIFT_POINTS} điểm thôi.`,
  invalid_gift: 'Món quà này không hợp lệ.',
  weekly_limit: 'Ví điểm tặng tuần này đã hết. Tuần sau ví sẽ đầy lại!',
  friend_limit: 'Tuần này em đã tặng bạn ấy đủ điểm rồi. Thử tặng sticker nhé!',
  daily_limit: 'Hôm nay em đã tặng 10 món quà rồi. Mai tặng tiếp nhé!',
  gift_not_found: 'Không tìm thấy món quà này.',
  not_active_student: 'Tài khoản đang tạm khoá. Hãy hỏi thầy cô của em nhé.'
};

/** Đổi lỗi từ hàm DB (thông báo là mã nghiệp vụ) thành câu tiếng Việt cho học sinh. */
export const socialErrorMessage = (error: { message?: string } | null | undefined): string =>
  (error?.message && ERROR_MESSAGES[error.message]) || 'Chưa làm được, em thử lại sau nhé.';

// ---------------------------------------------------------------------------
// App giáo viên: cộng hàng chờ điểm tặng vào Hào Quang
// ---------------------------------------------------------------------------

export interface GiftAdjustment {
  studentClientId: string;
  clientEventId: string;
  amount: number;
  reason: string;
  occurredAt: number;
}

export const parseGiftAdjustments = (raw: unknown): GiftAdjustment[] =>
  (Array.isArray(raw) ? raw.filter(isObject) : [])
    .filter(v => typeof v.student_client_id === 'string' && typeof v.client_event_id === 'string' && typeof v.amount === 'number')
    .map(v => ({
      studentClientId: v.student_client_id as string,
      clientEventId: v.client_event_id as string,
      amount: v.amount as number,
      reason: str(v.reason, '🎁 Quà từ bạn cùng lớp'),
      occurredAt: typeof v.occurred_at === 'string' ? Date.parse(v.occurred_at) || Date.now() : Date.now()
    }));

/**
 * Cộng điểm tặng (và trừ khi bị thu hồi) vào Hào Quang. Chỉ đổi `points` và thêm dòng lịch sử có id
 * = client_event_id, nên lần lưu sau ghi đúng một dòng sổ điểm 'gift-<id>'. Không kích hoạt hiệu ứng game
 * (trứng, XP, rương tuần) để không đổi luật game. Bỏ qua dòng đã có trong lịch sử hoặc trong `alreadyApplied`.
 */
export const applyGiftAdjustments = (
  students: Student[],
  adjustments: GiftAdjustment[],
  alreadyApplied: ReadonlySet<string> = new Set()
): { students: Student[]; applied: GiftAdjustment[] } => {
  const applied: GiftAdjustment[] = [];
  const byStudent = new Map<string, GiftAdjustment[]>();
  adjustments.forEach(adj => {
    if (alreadyApplied.has(adj.clientEventId)) return;
    byStudent.set(adj.studentClientId, [...(byStudent.get(adj.studentClientId) ?? []), adj]);
  });
  if (byStudent.size === 0) return { students, applied };

  const next = students.map(student => {
    const pending = byStudent.get(student.id);
    if (!pending) return student;
    const known = new Set(student.history.map(item => String(item.id)));
    const fresh = pending.filter(adj => !known.has(adj.clientEventId) && (known.add(adj.clientEventId), true));
    if (fresh.length === 0) return student;
    applied.push(...fresh);
    const items = [...fresh].sort((a, b) => b.occurredAt - a.occurredAt)
      .map(adj => ({ id: adj.clientEventId, amount: adj.amount, reason: adj.reason, timestamp: adj.occurredAt }));
    return {
      ...student,
      points: student.points + fresh.reduce((sum, adj) => sum + adj.amount, 0),
      history: [...items, ...student.history]
    };
  });
  return { students: applied.length > 0 ? next : students, applied };
};

// ---------------------------------------------------------------------------
// Màn hình giáo viên: ghép quà + tên + thu hồi + báo cáo thành dòng hiển thị
// ---------------------------------------------------------------------------

export interface TeacherGiftInput {
  gifts: Array<{ id: number; sender_id: string; recipient_id: string; amount: number; sticker_id: string; message_id: string | null; created_at: string }>;
  names: Record<string, string>;
  revocations: Array<{ gift_id: number; reason: string; revoked_at: string }>;
  reports: Array<{ gift_id: number }>;
}

export interface TeacherGiftRow {
  id: number;
  from: string;
  to: string;
  amount: number;
  sticker: StickerDefinition;
  message: string | null;
  createdAt: number;
  revoked: { reason: string; at: number } | null;
  reportCount: number;
}

export const buildTeacherGiftRows = ({ gifts, names, revocations, reports }: TeacherGiftInput): TeacherGiftRow[] => {
  const revokedById = new Map(revocations.map(r => [r.gift_id, r]));
  const reportCount = new Map<number, number>();
  reports.forEach(r => reportCount.set(r.gift_id, (reportCount.get(r.gift_id) ?? 0) + 1));
  return gifts
    .map(g => {
      const revoked = revokedById.get(g.id);
      return {
        id: g.id,
        from: names[g.sender_id] ?? 'Học sinh đã rời lớp',
        to: names[g.recipient_id] ?? 'Học sinh đã rời lớp',
        amount: g.amount,
        sticker: getSticker(g.sticker_id),
        message: getMessageText(g.message_id),
        createdAt: Date.parse(g.created_at) || 0,
        revoked: revoked ? { reason: revoked.reason, at: Date.parse(revoked.revoked_at) || 0 } : null,
        reportCount: reportCount.get(g.id) ?? 0
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
};
