import React from 'react';
import { SettingsSection } from './SettingsSection';
import { useApp } from '../../app/AppContext';
import { WILD_RARITIES, WILD_RARITY_LABELS } from '../../domain/wildHunt';
import { WildHuntSettings } from '../../types';

// Phase 13E: cài đặt Săn Pokémon hoang dã.
const inputClass = 'w-24 border-2 border-lime-200 p-2 rounded-xl font-bold text-xs bg-white';

const clamp = (raw: string, min: number, max: number, fallback: number) => {
  const value = parseInt(raw, 10);
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
};

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="flex flex-wrap items-center gap-3 rounded-2xl border border-lime-200 bg-white p-3 text-xs font-bold text-lime-950">
    <span className="min-w-[14rem] flex-1">{label}{hint && <span className="block font-medium text-lime-900/70">{hint}</span>}</span>
    {children}
  </label>
);

export const WildHuntSettingsSection: React.FC = () => {
  const {
    classOptions, classroomSettings, setClassroomSettings, classroomCloudSynced, callTestWildPokemon, settingsCollapsed, toggleSettingsSection
  } = useApp();
  const wild = classroomSettings.wildHunt;
  const unscheduled = classOptions.filter(name => (classroomSettings.classSchedules[name] || []).length === 0);
  const update = (patch: Partial<WildHuntSettings>) =>
    setClassroomSettings(prev => ({ ...prev, wildHunt: { ...prev.wildHunt, ...patch } }));

  return (
    <SettingsSection
      id="wildHunt"
      icon="🌿"
      title="Săn Pokémon hoang dã"
      subtitle="Mỗi buổi học có thể có một Pokémon hoang dã tự xuất hiện; cả lớp trả lời đúng để bắt."
      className="bg-lime-50 p-6 sm:p-10 rounded-[40px] border-4 border-lime-300 text-left space-y-6 my-8"
      collapsedSections={settingsCollapsed}
      onToggle={toggleSettingsSection}
    >
      {!classroomCloudSynced && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900" data-testid="wild-not-synced">
          Cài đặt này hiện chỉ lưu trên máy này. Chưa đồng bộ giữa các máy cho tới khi chạy migration Phase 13C trên Supabase.
        </p>
      )}

      {unscheduled.length > 0 && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900" data-testid="wild-unscheduled">
          Lớp chưa có lịch học nên Pokémon hoang dã chưa xuất hiện: {unscheduled.join(', ')}. Vào trang Class, di chuột vào thẻ lớp, bấm Sửa để thêm ngày và giờ học.
        </p>
      )}

      <div className="space-y-2">
        <Field label="Bật Săn Pokémon hoang dã" hint="Tắt thì Pokémon không tự xuất hiện nữa (nút Gọi thử vẫn dùng được).">
          <input type="checkbox" checked={wild.enabled} onChange={e => update({ enabled: e.target.checked })} data-testid="wild-enabled" className="h-5 w-5 accent-lime-600" />
        </Field>
        <Field label="Xuất hiện sau giờ bắt đầu lớp (phút)" hint="Pokémon xuất hiện ngẫu nhiên từ giờ bắt đầu + số phút này tới giờ kết thúc buổi học. Ví dụ lớp 19:00-20:30, để 30 phút thì Pokémon xuất hiện trong khoảng 19:30-20:30. Ngày, giờ học đặt ở trang Class (nút Thêm Lớp hoặc Sửa lớp).">
          <input type="number" min={0} max={240} value={wild.startOffsetMinutes} aria-label="Xuất hiện sau giờ bắt đầu lớp (phút)" data-testid="wild-start-offset"
            onChange={e => update({ startOffsetMinutes: clamp(e.target.value, 0, 240, wild.startOffsetMinutes) })} className={inputClass} />
        </Field>
        <Field label="Ở lại tối đa (phút)" hint="Nếu chưa ai bấm Săn ngay, Pokémon tự bỏ đi sau từng này phút.">
          <input type="number" min={1} max={60} value={wild.lingerMinutes} onChange={e => update({ lingerMinutes: clamp(e.target.value, 1, 60, wild.lingerMinutes) })} aria-label="Ở lại tối đa (phút)" className={inputClass} />
        </Field>
        <Field label="Số em có mặt tối thiểu" hint="Lớp có ít em hơn số này thì Pokémon không xuất hiện.">
          <input type="number" min={1} max={60} value={wild.minPresentStudents} onChange={e => update({ minPresentStudents: clamp(e.target.value, 1, 60, wild.minPresentStudents) })} aria-label="Số em có mặt tối thiểu" className={inputClass} />
        </Field>
        <Field label="Số lần sai tối đa" hint="Sai nhiều hơn số này thì Pokémon bỏ chạy.">
          <input type="number" min={1} max={10} value={wild.maxWrong} onChange={e => update({ maxWrong: clamp(e.target.value, 1, 10, wild.maxWrong) })} aria-label="Số lần sai tối đa" className={inputClass} />
        </Field>
        <Field label="Điểm an ủi" hint="Cộng cho các em trả lời đúng nhưng không trúng Pokémon (0 = không cộng).">
          <input type="number" min={0} max={10} value={wild.consolationPoints} onChange={e => update({ consolationPoints: clamp(e.target.value, 0, 10, wild.consolationPoints) })} aria-label="Điểm an ủi" className={inputClass} />
        </Field>
      </div>

      <div className="bg-white p-4 rounded-3xl border-2 border-lime-200 space-y-3">
        <h4 className="font-black text-lime-950 text-sm">Theo độ hiếm</h4>
        <div className="grid gap-2 sm:grid-cols-3">
          {WILD_RARITIES.map(rarity => (
            <div key={rarity} className="rounded-2xl border border-lime-200 p-3 space-y-2" data-testid={`wild-rarity-${rarity}`}>
              <p className="text-sm font-black text-lime-950">{WILD_RARITY_LABELS[rarity]}</p>
              <label className="flex items-center justify-between gap-2 text-xs font-bold text-lime-950">Tỉ lệ xuất hiện
                <input type="number" min={0} max={100} value={wild.rarityWeights[rarity]} aria-label={`Tỉ lệ ${WILD_RARITY_LABELS[rarity]}`}
                  onChange={e => update({ rarityWeights: { ...wild.rarityWeights, [rarity]: clamp(e.target.value, 0, 100, wild.rarityWeights[rarity]) } })} className={inputClass} />
              </label>
              <label className="flex items-center justify-between gap-2 text-xs font-bold text-lime-950">Câu đúng cần
                <input type="number" min={1} max={10} value={wild.correctNeeded[rarity]} aria-label={`Câu đúng cần cho ${WILD_RARITY_LABELS[rarity]}`}
                  onChange={e => update({ correctNeeded: { ...wild.correctNeeded, [rarity]: clamp(e.target.value, 1, 10, wild.correctNeeded[rarity]) } })} className={inputClass} />
              </label>
            </div>
          ))}
        </div>
        <p className="text-xs text-lime-900/80">Tỉ lệ là trọng số, không cần cộng đủ 100. Nếu cả ba bằng 0, hệ thống dùng lại tỉ lệ mặc định.</p>
      </div>

      <div className="bg-white p-4 rounded-3xl border-2 border-lime-200 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold text-lime-950">Muốn xem thử ngay? Gọi một Pokémon hoang dã vào lớp đang chọn (không tính vào giới hạn mỗi buổi 1 con).</p>
        <button type="button" onClick={callTestWildPokemon} data-testid="wild-call-test" className="bg-lime-600 hover:bg-lime-700 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow">🌿 Gọi thử một Pokémon hoang dã</button>
      </div>
    </SettingsSection>
  );
};
