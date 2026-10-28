import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { SocialResult, parseSocialOverview, socialErrorMessage } from '../../../domain/social';

// Bạn bè + quà của học sinh (Phase 6, ADR 0004). Mọi thao tác qua hàm DB có kiểm tra quyền;
// sau mỗi thao tác tải lại tổng quan. Không hỏi liên tục: chỉ khi mở trang, bấm "Cập nhật" hoặc sau thao tác.

export type SocialState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'loaded'; result: SocialResult };

export interface SocialActions {
  invite: (studentId: string) => Promise<boolean>;
  respond: (requestId: number, accept: boolean) => Promise<boolean>;
  remove: (studentId: string) => Promise<boolean>;
  sendGift: (recipientId: string, amount: number, stickerId: string, messageId: string | null) => Promise<boolean>;
  report: (giftId: number) => Promise<boolean>;
}

export const useStudentSocial = (refreshSignal: number) => {
  const [state, setState] = useState<SocialState>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('student_social_overview');
    if (error) { setState(prev => (prev.kind === 'loaded' ? prev : { kind: 'error' })); return; }
    try {
      setState({ kind: 'loaded', result: parseSocialOverview(data) });
    } catch {
      setState({ kind: 'error' });
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshSignal]);

  const run = useCallback(async (fn: string, args: Record<string, unknown>, success: string) => {
    setBusy(true);
    setNotice(null);
    const { error } = await supabase.rpc(fn, args);
    if (error) {
      setNotice({ tone: 'error', text: socialErrorMessage(error) });
    } else {
      setNotice({ tone: 'ok', text: success });
    }
    await load();
    setBusy(false);
    return !error;
  }, [load]);

  const actions: SocialActions = {
    invite: id => run('student_send_friend_request', { p_student_id: id }, 'Đã gửi lời mời kết bạn.'),
    respond: (requestId, accept) => run('student_respond_friend_request', { p_request_id: requestId, p_accept: accept },
      accept ? 'Hai bạn đã là bạn bè!' : 'Đã từ chối lời mời.'),
    remove: id => run('student_remove_friend', { p_student_id: id }, 'Đã cập nhật danh sách bạn bè.'),
    sendGift: (recipientId, amount, stickerId, messageId) => run('student_send_gift',
      { p_recipient_id: recipientId, p_amount: amount, p_sticker_id: stickerId, p_message_id: messageId },
      amount > 0 ? 'Đã gửi quà! Điểm sẽ được cộng khi thầy cô mở lớp.' : 'Đã gửi quà!'),
    report: giftId => run('student_report_gift', { p_gift_id: giftId }, 'Đã báo cho thầy cô. Cảm ơn em!')
  };

  return { state, busy, notice, clearNotice: () => setNotice(null), actions, reload: load };
};

export type StudentSocial = ReturnType<typeof useStudentSocial>;
