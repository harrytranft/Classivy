import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { TeacherGiftRow, buildTeacherGiftRows } from '../../domain/social';

// Trang "Bạn bè & quà" của một lớp (Phase 6). Giáo viên đọc thẳng bảng qua RLS (chỉ lớp của mình).

export interface ClassSocialSettings {
  classId: string;
  enabled: boolean;
  weeklyLimit: number;
  perFriendLimit: number;
  /** Công tắc Cửa hàng học sinh (Phase 10B). null = chưa chạy migration Phase 10B nên chưa có cột. */
  shopEnabled: boolean | null;
}

export interface FriendshipRow {
  id: number;
  a: string;
  b: string;
  status: 'pending' | 'accepted';
  createdAt: number;
}

export const useClassSocial = (className: string | null) => {
  const [settings, setSettings] = useState<ClassSocialSettings | null>(null);
  const [gifts, setGifts] = useState<TeacherGiftRow[]>([]);
  const [friendships, setFriendships] = useState<FriendshipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(v => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!className) { setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const { data: cls, error: classError } = await supabase.from('classes')
          .select('id, social_enabled, gift_weekly_limit, gift_per_friend_weekly_limit').eq('name', className).maybeSingle();
        if (classError) throw classError;
        if (!cls) { if (!cancelled) { setSettings(null); setGifts([]); setFriendships([]); } return; }

        const [studentsRes, giftsRes, friendsRes] = await Promise.all([
          supabase.from('students').select('id, name').eq('class_id', cls.id),
          supabase.from('student_gifts').select('id, sender_id, recipient_id, amount, sticker_id, message_id, created_at')
            .eq('class_id', cls.id).order('created_at', { ascending: false }).limit(100),
          supabase.from('student_friendships').select('id, requester_id, addressee_id, status, created_at').eq('class_id', cls.id)
        ]);
        if (studentsRes.error) throw studentsRes.error;
        if (giftsRes.error) throw giftsRes.error;
        if (friendsRes.error) throw friendsRes.error;

        const giftIds = (giftsRes.data ?? []).map((g: { id: number }) => g.id);
        const [revRes, repRes] = giftIds.length === 0
          ? [{ data: [], error: null }, { data: [], error: null }]
          : await Promise.all([
            supabase.from('student_gift_revocations').select('gift_id, reason, revoked_at').in('gift_id', giftIds),
            supabase.from('student_gift_reports').select('gift_id').in('gift_id', giftIds)
          ]);
        if (revRes.error) throw revRes.error;
        if (repRes.error) throw repRes.error;
        if (cancelled) return;

        const names: Record<string, string> = Object.fromEntries((studentsRes.data ?? []).map((s: { id: string; name: string }) => [s.id, s.name]));
        // Đọc riêng để màn hình vẫn chạy nếu Supabase chưa có migration Phase 10B.
        const shopRes = await supabase.from('classes').select('student_shop_enabled').eq('id', cls.id).maybeSingle();
        const shopEnabled = !shopRes.error && shopRes.data && typeof shopRes.data.student_shop_enabled === 'boolean' ? shopRes.data.student_shop_enabled : null;
        if (cancelled) return;
        setSettings({ classId: cls.id, enabled: cls.social_enabled, weeklyLimit: cls.gift_weekly_limit, perFriendLimit: cls.gift_per_friend_weekly_limit, shopEnabled });
        setGifts(buildTeacherGiftRows({ gifts: giftsRes.data ?? [], names, revocations: revRes.data ?? [], reports: repRes.data ?? [] }));
        setFriendships((friendsRes.data ?? []).map((f: { id: number; requester_id: string; addressee_id: string; status: 'pending' | 'accepted'; created_at: string }) => ({
          id: f.id, a: names[f.requester_id] ?? '?', b: names[f.addressee_id] ?? '?', status: f.status, createdAt: Date.parse(f.created_at) || 0
        })).sort((x, y) => x.a.localeCompare(y.a, 'vi')));
      } catch {
        if (!cancelled) setError('Chưa tải được dữ liệu bạn bè và quà. Nếu Supabase chưa chạy migration Phase 6, hãy chạy theo hướng dẫn rồi bấm "Làm mới".');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [className, version]);

  const saveSettings = async (next: Omit<ClassSocialSettings, 'classId' | 'shopEnabled'>) => {
    if (!settings) return false;
    const { error: e } = await supabase.from('classes').update({
      social_enabled: next.enabled, gift_weekly_limit: next.weeklyLimit, gift_per_friend_weekly_limit: next.perFriendLimit
    }).eq('id', settings.classId);
    if (!e) reload();
    return !e;
  };

  const setShopEnabled = async (enabled: boolean) => {
    if (!settings) return false;
    const { error: e } = await supabase.from('classes').update({ student_shop_enabled: enabled }).eq('id', settings.classId);
    if (!e) reload();
    return !e;
  };

  const revokeGift = async (giftId: number, reason: string) => {
    const { error: e } = await supabase.from('student_gift_revocations').insert({ gift_id: giftId, reason });
    if (!e) reload();
    return !e;
  };

  const removeFriendship = async (id: number) => {
    const { error: e } = await supabase.from('student_friendships').delete().eq('id', id);
    if (!e) reload();
    return !e;
  };

  return { settings, gifts, friendships, loading, error, reload, saveSettings, setShopEnabled, revokeGift, removeFriendship };
};
