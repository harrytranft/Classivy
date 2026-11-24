import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { TeachingHoursStatus, createDefaultTeachingHours, getTeachingHoursStatus, normalizeTeachingHours } from '../../domain/teachingHours';
import { TeachingHoursSettings } from '../../types';

// Chế độ giờ dạy phía học sinh: đọc lịch của giáo viên MỘT lần khi mở app (và khi bấm "Cập nhật") qua hàm DB student_teaching_hours,
// rồi chỉ so với đồng hồ trên máy (30 giây một lần, không gọi mạng). Hàm DB chưa có (chưa chạy migration) hoặc lỗi mạng:
// dùng khung giờ mặc định để vẫn bảo vệ giờ dạy.

const TICK_MS = 30_000;

export const useTeachingHours = (refreshSignal: number): TeachingHoursStatus => {
  const [settings, setSettings] = useState<TeachingHoursSettings>(createDefaultTeachingHours);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('student_teaching_hours').then(({ data, error }) => {
      if (cancelled) return;
      // Có lỗi: giữ giá trị đang có (lần đầu là mặc định). Giáo viên chưa lưu gì (null): mặc định.
      if (!error) setSettings(normalizeTeachingHours(data));
    }, () => undefined);
    return () => { cancelled = true; };
  }, [refreshSignal]);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setInterval(tick, TICK_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  return getTeachingHoursStatus(settings, now);
};
