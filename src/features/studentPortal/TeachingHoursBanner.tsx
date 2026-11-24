import React from 'react';
import { TeachingHoursStatus, teachingHoursMessage } from '../../domain/teachingHours';

/** Hiện khi đang trong giờ dạy. Học sinh vẫn xem được Hào Quang; các nút ghi bị khoá. */
export const TeachingHoursBanner: React.FC<{ status: TeachingHoursStatus; className?: string }> = ({ status, className }) => {
  if (!status.locked) return null;
  return (
    <div role="status" data-testid="teaching-hours-banner"
      className={`rounded-brand-md border border-brand-gold/60 bg-brand-gold-light/60 p-3 text-sm font-semibold text-brand-ink ${className ?? ''}`}>
      <span aria-hidden>🕒 </span>{teachingHoursMessage(status)}
      <span className="block text-[13px] font-medium text-brand-ink/70">Em vẫn xem được Hào Quang. Cửa hàng, Hợp nhất, Đổi đồng hành và Tặng quà sẽ mở lại sau giờ học.</span>
    </div>
  );
};
