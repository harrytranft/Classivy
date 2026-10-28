// Phím tắt cho giáo viên (D38): phím đơn, đổi được trong Cài đặt. Logic thuần để kiểm thử.

export type ShortcutId =
  | 'attendance' | 'homework' | 'random' | 'wheel' | 'timer' | 'ludo' | 'gift' | 'group' | 'shop' | 'addTrainer'
  | 'search' | 'classes' | 'settings' | 'help';

export interface ShortcutDefinition {
  id: ShortcutId;
  label: string;
  /** 'class' chỉ chạy khi đang ở trang của một lớp; 'global' chạy ở mọi trang. */
  scope: 'class' | 'global';
  defaultKey: string;
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  { id: 'attendance', label: 'Check đi học', scope: 'class', defaultKey: 'a' },
  { id: 'homework', label: 'Check Homework', scope: 'class', defaultKey: 'h' },
  { id: 'random', label: 'Random học sinh', scope: 'class', defaultKey: 'r' },
  { id: 'wheel', label: 'Vòng quay may mắn', scope: 'class', defaultKey: 'w' },
  { id: 'timer', label: 'Hẹn giờ', scope: 'class', defaultKey: 't' },
  { id: 'ludo', label: 'Cá Ngựa', scope: 'class', defaultKey: 'l' },
  { id: 'gift', label: 'Tặng Pokémon', scope: 'class', defaultKey: 'p' },
  { id: 'group', label: 'Chia nhóm', scope: 'class', defaultKey: 'g' },
  { id: 'shop', label: 'Shop', scope: 'class', defaultKey: 's' },
  { id: 'addTrainer', label: 'Thêm Trainer', scope: 'class', defaultKey: 'n' },
  { id: 'search', label: 'Tìm kiếm Trainer', scope: 'class', defaultKey: '/' },
  { id: 'classes', label: 'Danh sách lớp', scope: 'global', defaultKey: 'c' },
  { id: 'settings', label: 'Cài đặt', scope: 'global', defaultKey: ',' },
  { id: 'help', label: 'Xem danh sách phím tắt', scope: 'global', defaultKey: '?' }
];

export type ShortcutMap = Record<ShortcutId, string>;
export type ShortcutOverrides = Partial<Record<ShortcutId, string>>;

export const DEFAULT_SHORTCUTS: ShortcutMap = SHORTCUT_DEFINITIONS.reduce((map, def) => {
  map[def.id] = def.defaultKey;
  return map;
}, {} as ShortcutMap);

/** Phím hợp lệ: đúng một ký tự in được, không phải khoảng trắng. Chữ cái được chuẩn hoá về chữ thường. */
export const normalizeShortcutKey = (key: string): string | null => {
  if (typeof key !== 'string' || key.length !== 1 || key.trim() === '') return null;
  return key.toLowerCase();
};

/** Gộp phím tuỳ chỉnh với mặc định; bỏ qua giá trị sai hoặc trùng với phím đã có trước đó (giữ mặc định). */
export const resolveShortcuts = (overrides: ShortcutOverrides | null | undefined): ShortcutMap => {
  const map: ShortcutMap = { ...DEFAULT_SHORTCUTS };
  if (!overrides) return map;
  const used = new Set<string>();
  const ids = SHORTCUT_DEFINITIONS.map(def => def.id);
  ids.forEach(id => {
    const custom = overrides[id] !== undefined ? normalizeShortcutKey(overrides[id] as string) : null;
    if (custom) {
      map[id] = custom;
    }
  });
  // Nếu dữ liệu lưu bị trùng phím, các mục sau quay về mặc định để luôn có một phím một chức năng.
  ids.forEach(id => {
    if (used.has(map[id])) map[id] = DEFAULT_SHORTCUTS[id];
    used.add(map[id]);
  });
  return map;
};

/** Chức năng khác đang dùng phím này (nếu có). */
export const findShortcutConflict = (map: ShortcutMap, id: ShortcutId, key: string): ShortcutId | null => {
  const normalized = normalizeShortcutKey(key);
  if (!normalized) return null;
  const found = (Object.keys(map) as ShortcutId[]).find(other => other !== id && map[other] === normalized);
  return found ?? null;
};

export const shortcutIdForKey = (map: ShortcutMap, key: string): ShortcutId | null => {
  const normalized = normalizeShortcutKey(key);
  if (!normalized) return null;
  return (Object.keys(map) as ShortcutId[]).find(id => map[id] === normalized) ?? null;
};

export const formatShortcutKey = (key: string): string => (key.length === 1 && /[a-z]/.test(key) ? key.toUpperCase() : key);
