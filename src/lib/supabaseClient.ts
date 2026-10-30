import { createClient } from '@supabase/supabase-js';
import { CLOUD_TIMEOUT_MESSAGE } from '../domain/cloudError';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Supabase requests will fail until they are configured.');
}

// Không để một yêu cầu treo mãi (mạng điện thoại chập chờn, Supabase quá tải): app sẽ quay "đang đồng bộ" vô hạn
// và khoá nút Sao lưu/Khôi phục. Hết giờ thì yêu cầu bị huỷ và báo lỗi cho giáo viên.
const REQUEST_TIMEOUT_MS = 30_000;
const FUNCTION_TIMEOUT_MS = 90_000; // Edge Function tạo tài khoản hàng loạt có thể lâu hơn.

const fetchWithTimeout: typeof fetch = (input, init: RequestInit = {}) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const timeoutMs = url.includes('/functions/v1/') ? FUNCTION_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const outer = init.signal;
  if (outer?.aborted) controller.abort(outer.reason);
  else outer?.addEventListener('abort', () => controller.abort(outer.reason), { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  return fetch(input, { ...init, signal: controller.signal })
    .catch(error => { throw timedOut ? new Error(CLOUD_TIMEOUT_MESSAGE) : error; })
    .finally(() => clearTimeout(timer));
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'missing-anon-key',
  {
    global: { fetch: fetchWithTimeout },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
