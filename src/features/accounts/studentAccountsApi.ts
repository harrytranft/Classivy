// Gọi Edge Function `student-accounts` (Phase 4). Mật khẩu chỉ có trong phản hồi và chỉ giữ trong bộ nhớ để in thẻ.
import { supabase } from '../../lib/supabaseClient';
import { chunk } from '../../domain/accountView';
import { MAX_BATCH } from '../../domain/studentAccount';

export interface Credential {
  studentId: string;
  name: string;
  className: string | null;
  username: string;
  password: string;
}

export interface CreateOutcome {
  created: Credential[];
  failed: { studentId: string; error: string }[];
}

const FALLBACK_ERROR = 'Không thực hiện được, vui lòng thử lại.';

export const describeFunctionError = async (error: unknown): Promise<string> => {
  const context = (error as { context?: unknown } | null)?.context;
  if (typeof Response !== 'undefined' && context instanceof Response) {
    try {
      const body = await context.clone().json();
      if (body && typeof body.error === 'string') return body.error;
    } catch {
      // thân phản hồi không phải JSON: dùng thông báo chung bên dưới
    }
  }
  const name = (error as { name?: string } | null)?.name;
  if (name === 'FunctionsFetchError' || name === 'FunctionsRelayError') {
    return 'Không kết nối được chức năng quản lý tài khoản. Kiểm tra mạng, hoặc hàm "student-accounts" chưa được triển khai trên Supabase.';
  }
  return FALLBACK_ERROR;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const callFunction = async (body: Record<string, unknown>): Promise<any> => {
  const { data, error } = await supabase.functions.invoke('student-accounts', { body });
  if (error) throw new Error(await describeFunctionError(error));
  if (!data?.ok) throw new Error(typeof data?.error === 'string' ? data.error : FALLBACK_ERROR);
  return data;
};

/** Tạo tài khoản; danh sách dài được chia lô (tối đa MAX_BATCH em mỗi lần gọi). */
export const createAccounts = async (studentIds: string[], usernames: Record<string, string> = {}): Promise<CreateOutcome> => {
  const outcome: CreateOutcome = { created: [], failed: [] };
  for (const batch of chunk(studentIds, MAX_BATCH)) {
    const batchNames = Object.fromEntries(Object.entries(usernames).filter(([id]) => batch.includes(id)));
    const data = await callFunction({ action: 'create', studentIds: batch, usernames: batchNames });
    for (const result of data.results as Array<Record<string, unknown>>) {
      if (result.ok) {
        outcome.created.push({
          studentId: String(result.studentId), name: String(result.name), className: (result.className as string | null) ?? null,
          username: String(result.username), password: String(result.password)
        });
      } else {
        outcome.failed.push({ studentId: String(result.studentId), error: String(result.error ?? FALLBACK_ERROR) });
      }
    }
  }
  return outcome;
};

export const resetPassword = async (studentId: string): Promise<Credential> => {
  const data = await callFunction({ action: 'reset_password', studentId });
  return { studentId, name: data.name, className: data.className ?? null, username: data.username, password: data.password };
};

export const setAccountLocked = async (studentId: string, locked: boolean): Promise<void> => {
  await callFunction({ action: locked ? 'lock' : 'unlock', studentId });
};

export const revokeAccount = async (studentId: string): Promise<void> => {
  await callFunction({ action: 'revoke', studentId });
};
