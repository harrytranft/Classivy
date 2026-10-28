// Hiển thị danh sách tài khoản học sinh cho giáo viên (Phase 4, task 4.3): trạng thái, lọc, tìm kiếm.
import { toAsciiLetters } from './studentAccount';

export interface AccountRow {
  id: string;
  clientId: string;
  name: string;
  username: string | null;
  hasAccount: boolean;
  locked: boolean;
  mustChangePassword: boolean;
}

export type AccountState = 'none' | 'pending' | 'active' | 'locked';
export type AccountStateFilter = 'all' | AccountState;

export const ACCOUNT_STATE_LABEL: Record<AccountState, string> = {
  none: 'Chưa có tài khoản',
  pending: 'Chờ đổi mật khẩu',
  active: 'Đang hoạt động',
  locked: 'Đã khoá'
};

export const getAccountState = (row: AccountRow): AccountState => {
  if (!row.hasAccount) return 'none';
  if (row.locked) return 'locked';
  if (row.mustChangePassword) return 'pending';
  return 'active';
};

/** Tìm theo tên hoặc tên đăng nhập, không phân biệt hoa thường và dấu tiếng Việt. */
export const filterAccountRows = (rows: AccountRow[], query: string, state: AccountStateFilter): AccountRow[] => {
  const needle = toAsciiLetters(query);
  return rows.filter(row => {
    if (state !== 'all' && getAccountState(row) !== state) return false;
    if (!needle) return true;
    return toAsciiLetters(row.name).includes(needle) || (row.username ?? '').includes(needle);
  });
};

export const countByState = (rows: AccountRow[]): Record<AccountState, number> => {
  const counts: Record<AccountState, number> = { none: 0, pending: 0, active: 0, locked: 0 };
  for (const row of rows) counts[getAccountState(row)] += 1;
  return counts;
};

export const chunk = <T,>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

export type AuditActionName = 'create_account' | 'reset_password' | 'lock' | 'unlock' | 'revoke_account' | 'delete_student';

export const AUDIT_ACTION_LABEL: Record<AuditActionName, string> = {
  create_account: 'Tạo tài khoản',
  reset_password: 'Đặt lại mật khẩu',
  lock: 'Khoá tài khoản',
  unlock: 'Mở khoá tài khoản',
  revoke_account: 'Thu hồi tài khoản',
  delete_student: 'Xoá học sinh'
};

export const auditActionLabel = (action: string): string => AUDIT_ACTION_LABEL[action as AuditActionName] ?? action;
