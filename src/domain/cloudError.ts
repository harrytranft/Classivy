/**
 * Đổi lỗi khi đọc/ghi Supabase thành câu tiếng Việt cho giáo viên, kèm mã lỗi gốc để báo lại khi cần sửa.
 * Trước đây lỗi chỉ ghi vào console nên trên điện thoại/máy tính giáo viên không thấy gì (lớp trống, nút quay mãi).
 */

export const CLOUD_TIMEOUT_MESSAGE = 'cloud_timeout';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object';

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export function describeCloudError(error: unknown): string {
  const record = isRecord(error) ? error : {};
  const message = error instanceof Error ? error.message : text(record.message) || text(error);
  const code = text(record.code);
  const lower = message.toLowerCase();

  let friendly: string;
  if (message === CLOUD_TIMEOUT_MESSAGE || (error instanceof Error && error.name === 'AbortError')) {
    friendly = 'Máy chủ dữ liệu không phản hồi (quá thời gian chờ).';
  } else if (lower.includes('failed to fetch') || lower.includes('load failed') || lower.includes('networkerror')) {
    friendly = 'Không kết nối được tới máy chủ dữ liệu (mạng yếu hoặc Supabase đang gặp sự cố).';
  } else if (code === '57014' || lower.includes('statement timeout')) {
    friendly = 'Truy vấn dữ liệu chạy quá lâu nên bị Supabase dừng.';
  } else if (code === '42501' || lower.includes('permission denied')) {
    friendly = 'Tài khoản không có quyền đọc/ghi dữ liệu này.';
  } else if (code === 'PGRST301' || code === 'PGRST303' || lower.includes('jwt')) {
    friendly = 'Phiên đăng nhập đã hết hạn. Hãy đăng xuất rồi đăng nhập lại.';
  } else if (lower.includes('read-only') || code === '25006') {
    friendly = 'Cơ sở dữ liệu đang ở chế độ chỉ đọc (có thể đã vượt dung lượng gói miễn phí).';
  } else {
    friendly = 'Có lỗi khi làm việc với dữ liệu đám mây.';
  }

  const detail = [code && `mã ${code}`, message && message !== CLOUD_TIMEOUT_MESSAGE ? message : '']
    .filter(Boolean)
    .join(': ');
  return detail ? `${friendly} (${detail})` : friendly;
}

/** Quá số lần "máy khác vừa sửa" trong khoảng này thì coi là vòng lặp: dừng tự tải lại/tự lưu, chờ giáo viên. */
export const CONFLICT_LOOP_WINDOW_MS = 2 * 60 * 1000;
export const CONFLICT_LOOP_LIMIT = 3;

/** Ghi nhận một lần bị từ chối vì dữ liệu cũ; trả về mốc thời gian còn trong cửa sổ và có phải vòng lặp không. */
export function recordSyncConflict(previous: number[], now: number): { times: number[]; isLoop: boolean } {
  const times = [...previous.filter(time => now - time < CONFLICT_LOOP_WINDOW_MS), now];
  return { times, isLoop: times.length >= CONFLICT_LOOP_LIMIT };
}

/** Tên học sinh bị xung đột (từ mã lỗi của DB) để giáo viên biết em nào đang bị sửa ở nơi khác. */
export function conflictStudentNames(clientIds: string[], students: { id: string; name: string }[]): string[] {
  const nameById = new Map(students.map(student => [student.id, student.name]));
  return [...new Set(clientIds)].map(id => nameById.get(id) ?? `(học sinh đã xoá ${id.slice(0, 8)})`);
}
