import { Screen } from '../types/app';

// Ánh xạ giữa "màn hình" cũ (currentScreen) và đường dẫn URL.
// '/' chuyển về '/class' để giữ màn mở mặc định như trước.
export const SCREEN_PATHS: Record<Exclude<Screen, 'profile'>, string> = {
  plaza: '/plaza',
  class: '/class',
  settings: '/settings'
};

export const PROFILE_PATH_PREFIX = '/student/';

export const profilePath = (studentId: string) => `${PROFILE_PATH_PREFIX}${encodeURIComponent(studentId)}`;

export const screenFromPath = (pathname: string): Screen => {
  if (pathname.startsWith(PROFILE_PATH_PREFIX)) return 'profile';
  if (pathname.startsWith(SCREEN_PATHS.plaza)) return 'plaza';
  if (pathname.startsWith(SCREEN_PATHS.settings)) return 'settings';
  return 'class';
};

export const studentIdFromPath = (pathname: string): string | null => {
  if (!pathname.startsWith(PROFILE_PATH_PREFIX)) return null;
  const raw = pathname.slice(PROFILE_PATH_PREFIX.length).split('/')[0];
  return raw ? decodeURIComponent(raw) : null;
};
