import React, { useEffect, useState } from 'react';
import { SettingsSection } from './SettingsSection';
import { useApp } from '../../app/AppContext';
import { WEEKDAYS, validateScheduleSlot } from '../../domain/classSchedule';
import { getTeachingHoursStatus } from '../../domain/teachingHours';
import { ClassScheduleSlot, TeachingHoursSettings } from '../../types';

// Chế độ giờ dạy: khung giờ học sinh chỉ xem được, các nút ghi bị khoá (xem src/domain/teachingHours.ts).
const inputClass = 'border-2 border-emerald-200 p-2 rounded-xl font-bold text-xs bg-white';

export const TeachingHoursSettingsSection: React.FC = () => {
  const { classroomSettings, setClassroomSettings, classroomCloudSynced, settingsCollapsed, toggleSettingsSection } = useApp();
  const hours = classroomSettings.teachingHours;
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const status = getTeachingHoursStatus(hours, now);

  const update = (patch: Partial<TeachingHoursSettings>) =>
    setClassroomSettings(prev => ({ ...prev, teachingHours: { ...prev.teachingHours, ...patch } }));
  const updateSlot = (id: string, patch: Partial<ClassScheduleSlot>) =>
    update({ slots: hours.slots.map(slot => (slot.id === id ? { ...slot, ...patch } : slot)) });
  const addSlot = () => update({
    slots: [...hours.slots, { id: `teach-${Date.now().toString(36)}`, weekday: 6, start: '16:00', end: '18:00' }]
  });

  return (
    <SettingsSection
      id="teachingHours"
      icon="🕒"
      title="Chế độ giờ dạy"
      subtitle="Trong khung giờ này học sinh vẫn đăng nhập và xem Hào Quang, nhưng Cửa hàng, Hợp nhất, Đổi đồng hành và Tặng quà bị khoá."
      className="bg-emerald-50 p-6 sm:p-10 rounded-[40px] border-4 border-emerald-300 text-left space-y-6 my-8"
      collapsedSections={settingsCollapsed}
      onToggle={toggleSettingsSection}
    >
      {!classroomCloudSynced && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900" data-testid="teaching-not-synced">
          Cài đặt này hiện chỉ lưu trên máy này. Học sinh dùng khung giờ mặc định cho tới khi chạy migration Phase 13C và migration giờ dạy trên Supabase.
        </p>
      )}

      <p className={`rounded-2xl border p-3 text-xs font-bold ${status.locked ? 'border-emerald-400 bg-emerald-100 text-emerald-950' : 'border-emerald-200 bg-white text-emerald-950'}`} data-testid="teaching-status">
        {!hours.enabled
          ? 'Chế độ giờ dạy đang tắt: học sinh dùng các nút bất cứ lúc nào.'
          : status.locked
            ? `Bây giờ đang trong giờ dạy. Học sinh được thao tác lại sau ${status.retryAt}.`
            : 'Bây giờ ngoài giờ dạy: học sinh dùng các nút bình thường.'}
        <span className="block font-medium text-emerald-900/70">Giờ tính theo giờ Việt Nam, không phụ thuộc đồng hồ máy học sinh.</span>
      </p>

      <label className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-3 text-xs font-bold text-emerald-950">
        <span className="min-w-[14rem] flex-1">Bật chế độ giờ dạy</span>
        <input type="checkbox" checked={hours.enabled} onChange={e => update({ enabled: e.target.checked })} data-testid="teaching-enabled" className="h-5 w-5 accent-emerald-600" />
      </label>

      <label className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-3 text-xs font-bold text-emerald-950">
        <span className="min-w-[14rem] flex-1">Thời gian thử lại sau khi tan lớp (phút)
          <span className="block font-medium text-emerald-900/70">Học sinh thấy "Lớp đang học, thử lại sau" = giờ tan lớp + số phút này.</span>
        </span>
        <input type="number" min={0} max={120} value={hours.retryMinutes} aria-label="Thời gian thử lại sau khi tan lớp (phút)" data-testid="teaching-retry"
          onChange={e => {
            const value = parseInt(e.target.value, 10);
            update({ retryMinutes: Number.isFinite(value) ? Math.max(0, Math.min(120, value)) : hours.retryMinutes });
          }} className={`${inputClass} w-24`} />
      </label>

      <div className="space-y-2 rounded-3xl border-2 border-emerald-200 bg-white p-4">
        <h4 className="text-sm font-black text-emerald-950">Khung giờ dạy</h4>
        {hours.slots.length === 0 && <p className="text-xs text-emerald-900/80">Chưa có khung giờ nào, học sinh không bị khoá lúc nào.</p>}
        <ul className="space-y-2" data-testid="teaching-slots">
          {hours.slots.map(slot => {
            const error = validateScheduleSlot(slot);
            return (
              <li key={slot.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-100 p-2">
                <select value={slot.weekday} aria-label="Ngày" onChange={e => updateSlot(slot.id, { weekday: Number(e.target.value) })} className={inputClass}>
                  {WEEKDAYS.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}
                </select>
                <input type="time" value={slot.start} aria-label="Từ giờ" onChange={e => updateSlot(slot.id, { start: e.target.value })} className={inputClass} />
                <span className="text-xs font-bold text-emerald-900">đến</span>
                <input type="time" value={slot.end} aria-label="Đến giờ" onChange={e => updateSlot(slot.id, { end: e.target.value })} className={inputClass} />
                <button type="button" aria-label="Xoá khung giờ" onClick={() => update({ slots: hours.slots.filter(item => item.id !== slot.id) })}
                  className="ml-auto rounded-xl px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100">🗑️</button>
                {error && <p role="alert" className="w-full text-xs font-bold text-red-700">{error} Khung giờ sai sẽ bị bỏ qua.</p>}
              </li>
            );
          })}
        </ul>
        <button type="button" onClick={addSlot} data-testid="teaching-add-slot"
          className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black text-white shadow hover:bg-emerald-800">+ Thêm khung giờ</button>
      </div>
    </SettingsSection>
  );
};
