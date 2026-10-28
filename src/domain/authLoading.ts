/**
 * Quyết định có hiện màn hình loading toàn trang khi Supabase phát tín hiệu đăng nhập hay không.
 * Supabase phát lại tín hiệu khi quay lại tab hoặc làm mới token; lúc đó cùng một người dùng
 * thì phải cập nhật âm thầm, không dựng lại cả giao diện (lỗi "chớp loading").
 */
export function shouldShowAuthLoading(previousUid: string | null, nextUid: string | null): boolean {
  if (nextUid === null) return false;
  return previousUid !== nextUid;
}
