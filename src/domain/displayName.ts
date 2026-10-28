// Tên hiển thị của giáo viên. Tài khoản tạo thời Imperial School mang tên mặc định cũ trong thông tin
// đăng ký (user_metadata); coi tên đó như "chưa đặt tên" để không ghi đè lại hồ sơ mỗi lần đăng nhập.

export const DEFAULT_DISPLAY_NAME = 'Trainer';
const LEGACY_DEFAULT_NAMES = new Set(['Học sĩ triều đình']);

export const resolveDisplayName = (...candidates: unknown[]): string => {
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const name = candidate.trim();
    if (name && !LEGACY_DEFAULT_NAMES.has(name)) return name;
  }
  return DEFAULT_DISPLAY_NAME;
};
