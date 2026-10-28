import { Screen } from '../types/app';

// Ánh xạ giữa "màn hình" cũ (currentScreen) và đường dẫn URL.
// '/' chuyển về '/class' (trang chọn lớp). Mỗi lớp có trang riêng /class/<lớp>,
// kèm các trang con theo lớp: Cá Ngựa, Vòng quay may mắn, Tặng Pokémon, Tài khoản học sinh (Phase 4).
export const SCREEN_PATHS: Record<Exclude<Screen, 'profile'>, string> = {
  class: '/class',
  settings: '/settings'
};

export const PROFILE_PATH_PREFIX = '/student/';

export const profilePath = (studentId: string) => `${PROFILE_PATH_PREFIX}${encodeURIComponent(studentId)}`;

export const screenFromPath = (pathname: string): Screen => {
  if (pathname.startsWith(PROFILE_PATH_PREFIX)) return 'profile';
  if (pathname.startsWith(SCREEN_PATHS.settings)) return 'settings';
  return 'class';
};

export const studentIdFromPath = (pathname: string): string | null => {
  if (!pathname.startsWith(PROFILE_PATH_PREFIX)) return null;
  const raw = pathname.slice(PROFILE_PATH_PREFIX.length).split('/')[0];
  return raw ? decodeURIComponent(raw) : null;
};

/** Giá trị "chưa chọn lớp" (giữ đúng chữ của bộ lọc cũ vì nhiều chỗ so sánh với nó). */
export const ALL_CLASSES = 'Tất cả';

export const CLASS_SUB_PAGES = {
  ludo: 'ca-ngua',
  wheel: 'vong-quay',
  gift: 'tang-pokemon',
  accounts: 'tai-khoan',
  social: 'ban-be'
} as const;

export type ClassSubPage = typeof CLASS_SUB_PAGES[keyof typeof CLASS_SUB_PAGES];

const SUB_PAGE_VALUES = Object.values(CLASS_SUB_PAGES) as string[];

export const classPath = (className: string, subPage?: ClassSubPage | null) =>
  `${SCREEN_PATHS.class}/${encodeURIComponent(className)}${subPage ? `/${subPage}` : ''}`;

/** Đọc lớp và trang con từ đường dẫn: /class/6A/ca-ngua -> { className: '6A', subPage: 'ca-ngua' }. */
export const parseClassPath = (pathname: string): { className: string | null; subPage: ClassSubPage | null } => {
  const prefix = `${SCREEN_PATHS.class}/`;
  if (!pathname.startsWith(prefix)) return { className: null, subPage: null };
  const [rawClass, rawSub] = pathname.slice(prefix.length).split('/');
  if (!rawClass) return { className: null, subPage: null };
  let className: string;
  try {
    className = decodeURIComponent(rawClass);
  } catch {
    className = rawClass;
  }
  const subPage = rawSub && SUB_PAGE_VALUES.includes(rawSub) ? rawSub as ClassSubPage : null;
  return { className, subPage };
};
