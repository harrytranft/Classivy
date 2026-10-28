import { PortalEgg } from './studentPortal';

// Cửa hàng học sinh (Phase 10B): phần logic thuần (đọc kết quả hàm DB, thông báo lỗi, giá).
// Giá và luật nằm ở hàm DB student_shop_*; ở đây chỉ để hiển thị và kiểm tra nhanh trước khi gọi.

export interface ShopSkill {
  id: string;
  name: string;
  icon: string;
  cost: number;
  description: string;
}

export interface ShopOverview {
  enabled: boolean;
  points: number;
  eggPrices: { normal: number; special: number };
  skills: ShopSkill[];
}

export type ShopEggKind = 'normal' | 'special';

export const SHOP_EGG_OFFERS: { kind: ShopEggKind; label: string; emoji: string; hint: string; required: number }[] = [
  { kind: 'normal', label: 'Trứng thường', emoji: '🥚', hint: 'Phần lớn ra Pokémon thường, thỉnh thoảng may mắn ra Pokémon đặc biệt.', required: 10 },
  { kind: 'special', label: 'Trứng đặc biệt', emoji: '🌟', hint: 'Chắc chắn ra Pokémon đặc biệt, nhưng ấp lâu hơn.', required: 15 }
];

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const num = (value: unknown, fallback = 0) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

/** Đọc kết quả student_shop_overview(). Ném lỗi nếu sai dạng. */
export const parseShopOverview = (raw: unknown): ShopOverview => {
  if (!isObject(raw) || typeof raw.enabled !== 'boolean') throw new Error('Invalid shop overview');
  const prices = isObject(raw.eggPrices) ? raw.eggPrices : {};
  const skills = Array.isArray(raw.skills)
    ? raw.skills
      .filter(isObject)
      .filter(item => typeof item.id === 'string' && typeof item.name === 'string')
      .map(item => ({
        id: item.id as string,
        name: item.name as string,
        icon: typeof item.icon === 'string' && item.icon ? item.icon : '✨',
        cost: Math.max(0, num(item.cost)),
        description: typeof item.description === 'string' ? item.description : ''
      }))
    : [];
  return {
    enabled: raw.enabled,
    points: num(raw.points),
    eggPrices: { normal: num(prices.normal, 10), special: num(prices.special, 20) },
    skills
  };
};

/** Số Hào Quang cần để nở nhanh quả trứng đang ấp (phần tiến độ còn thiếu). */
export const getQuickHatchCost = (egg?: PortalEgg): number => (egg ? Math.max(0, egg.required - egg.progress) : 0);

const ERROR_MESSAGES: Record<string, string> = {
  shop_closed: 'Cửa hàng của lớp đang đóng. Thầy cô sẽ mở khi tới giờ nhé!',
  not_enough_points: 'Em chưa đủ Hào Quang cho món này.',
  egg_in_progress: 'Em đang ấp một quả trứng rồi. Chờ trứng nở (hoặc nở nhanh) đã nhé.',
  no_companion: 'Em cần có Pokémon đồng hành mới mua skill được.',
  already_owned: 'Pokémon đồng hành đã có skill này rồi.',
  invalid_item: 'Món này không còn nữa. Bấm "Cập nhật" rồi thử lại nhé.',
  no_egg: 'Em chưa có trứng nào đang ấp.',
  not_active_student: 'Tài khoản của em đang không hoạt động. Hãy báo thầy cô nhé.'
};

/** Đổi mã lỗi của hàm DB thành câu tiếng Việt thân thiện. */
export const shopErrorMessage = (code?: string | null): string =>
  (code && ERROR_MESSAGES[code]) || 'Chưa thực hiện được. Kiểm tra mạng rồi thử lại nhé.';
