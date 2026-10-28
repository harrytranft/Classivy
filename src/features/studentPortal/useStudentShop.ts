import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ShopOverview, parseShopOverview, shopErrorMessage } from '../../domain/studentShop';

// Cửa hàng học sinh: tải bảng giá (student_shop_overview) và gọi các hàm mua/đổi. Mọi luật nằm ở hàm DB.
// Tải khi mở tab Cửa hàng và sau mỗi thao tác; không hỏi liên tục (giới hạn gói miễn phí).

export type ShopState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; overview: ShopOverview };
export type ShopAction =
  | { fn: 'student_shop_buy_egg'; args: { p_kind: 'normal' | 'special' } }
  | { fn: 'student_shop_hatch_egg'; args?: undefined }
  | { fn: 'student_shop_buy_skill'; args: { p_skill_id: string } }
  | { fn: 'student_set_companion'; args: { p_instance_id: string } }
  | { fn: 'student_set_support'; args: { p_instance_id: string | null } }
  | { fn: 'student_fuse_pets'; args: { p_instance_ids: string[] } };

export const useStudentShop = (refreshSignal: number, onChanged: () => Promise<unknown>) => {
  const [state, setState] = useState<ShopState>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (): Promise<ShopState> => {
    const { data, error } = await supabase.rpc('student_shop_overview');
    if (error) return { kind: 'error' };
    try {
      return { kind: 'ready', overview: parseShopOverview(data) };
    } catch {
      return { kind: 'error' };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().then(next => { if (!cancelled) setState(prev => (next.kind === 'error' && prev.kind === 'ready' ? prev : next)); });
    return () => { cancelled = true; };
  }, [load, refreshSignal]);

  /** Chạy một thao tác. Trả { ok, message } — message là câu tiếng Việt khi lỗi. */
  const run = useCallback(async (action: ShopAction): Promise<{ ok: true } | { ok: false; message: string }> => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc(action.fn, action.args);
      if (error) {
        // Lớp vừa đóng/dữ liệu đổi: tải lại để màn hình khớp thực tế.
        load().then(next => setState(prev => (next.kind === 'error' ? prev : next)));
        return { ok: false, message: shopErrorMessage(error.message) };
      }
      await onChanged();
      const next = await load();
      setState(prev => (next.kind === 'error' ? prev : next));
      return { ok: true };
    } finally {
      setBusy(false);
    }
  }, [load, onChanged]);

  return { state, busy, run };
};
