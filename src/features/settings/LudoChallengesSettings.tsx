import React, { useState } from 'react';
import { SettingsSection } from './SettingsSection';
import { useApp } from '../../app/AppContext';
import { DEFAULT_LUDO_TILES } from '../../data/constants';
import { DEFAULT_LUDO_CHALLENGES } from '../../data/classroomDefaults';
import { LudoChallenge } from '../../types';
import { MAX_SCATTER_CHALLENGE_TILES, scatterChallengeTiles } from '../../domain/ludoChallenges';

// Phase 13D: danh sách thử thách và nút rải ô thử thách cho Cá Ngựa.
const MAX_CHALLENGES = 50;
const inputClass = 'w-full border-2 border-emerald-200 p-2.5 rounded-xl font-bold text-xs bg-white';

export const LudoChallengesSettings: React.FC = () => {
  const {
    classroomSettings, setClassroomSettings, classroomCloudSynced, customLudoTiles, setCustomLudoTiles,
    settingsCollapsed, toggleSettingsSection
  } = useApp();
  const [newText, setNewText] = useState('');
  const [newIcon, setNewIcon] = useState('🎯');
  const [scatterCount, setScatterCount] = useState(5);
  const [scatterMessage, setScatterMessage] = useState('');

  const challenges = classroomSettings.ludoChallenges;
  const challengeTileCount = Object.values(customLudoTiles).filter(tile => tile.type === 'challenge').length;
  const enabledCount = challenges.filter(challenge => challenge.enabled).length;

  const setChallenges = (updater: (list: LudoChallenge[]) => LudoChallenge[]) =>
    setClassroomSettings(prev => ({ ...prev, ludoChallenges: updater(prev.ludoChallenges) }));

  const updateChallenge = (id: string, patch: Partial<LudoChallenge>) =>
    setChallenges(list => list.map(item => item.id === id ? { ...item, ...patch } : item));

  const addChallenge = () => {
    const text = newText.trim();
    if (!text) return;
    if (challenges.length >= MAX_CHALLENGES) {
      alert(`Tối đa ${MAX_CHALLENGES} thử thách.`);
      return;
    }
    setChallenges(list => [...list, { id: `challenge-${Date.now()}`, text: text.slice(0, 200), icon: newIcon.trim() || '🎯', enabled: true }]);
    setNewText('');
  };

  const handleScatter = () => {
    const result = scatterChallengeTiles(DEFAULT_LUDO_TILES, customLudoTiles, scatterCount);
    setCustomLudoTiles(result.tiles);
    setScatterMessage(
      result.placed.length === 0
        ? 'Đã gỡ hết ô thử thách.'
        : `Đã rải ${result.placed.length} ô thử thách vào các ô: ${result.placed.join(', ')}.${result.missing > 0 ? ` (Thiếu chỗ cho ${result.missing} ô.)` : ''} Bấm lại để xáo vị trí khác.`
    );
  };

  return (
    <SettingsSection
      id="ludoChallenges"
      icon="🎯"
      title="Thử thách Cá Ngựa"
      subtitle="Học sinh dừng ở ô thử thách sẽ bốc một thử thách; làm được thì nhận thêm lượt lắc."
      className="bg-emerald-50 p-6 sm:p-10 rounded-[40px] border-4 border-emerald-300 text-left space-y-6 my-8"
      collapsedSections={settingsCollapsed}
      onToggle={toggleSettingsSection}
    >
      {!classroomCloudSynced && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900" data-testid="classroom-not-synced">
          Cài đặt này hiện chỉ lưu trên máy này. Chưa đồng bộ giữa các máy cho tới khi chạy migration Phase 13C trên Supabase.
        </p>
      )}

      <div className="bg-white p-5 rounded-3xl border-2 border-emerald-200 space-y-3">
        <h4 className="font-black text-emerald-950 text-sm">Rải ô thử thách lên bàn cờ</h4>
        <p className="text-xs text-emerald-900/80">Rải ngẫu nhiên vào các ô còn trống (không đè ô đặc biệt đang có). Bấm lại sẽ gỡ các ô thử thách cũ và xáo vị trí mới. Đang có {challengeTileCount} ô thử thách. Muốn đặt đúng một ô cụ thể, dùng mục "Customize Cá Ngựa" phía trên và chọn loại "Ô Thử Thách".</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-emerald-950" htmlFor="scatter-count">Số ô:</label>
          <input id="scatter-count" type="number" min={0} max={MAX_SCATTER_CHALLENGE_TILES} value={scatterCount} onChange={e => setScatterCount(Math.max(0, Math.min(MAX_SCATTER_CHALLENGE_TILES, parseInt(e.target.value) || 0)))} className="w-24 border-2 border-emerald-200 p-2 rounded-xl font-bold text-xs bg-white" />
          <button onClick={handleScatter} data-testid="scatter-challenge-tiles" className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow">🎲 Rải ngẫu nhiên {scatterCount} ô thử thách</button>
        </div>
        {scatterMessage && <p className="text-xs font-bold text-emerald-800" data-testid="scatter-message">{scatterMessage}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-black text-emerald-950 text-sm">Danh sách thử thách ({enabledCount}/{challenges.length} đang bật)</h4>
          <button
            onClick={() => { if (confirm('Khôi phục bộ thử thách mặc định? Danh sách hiện tại sẽ bị thay thế.')) setChallenges(() => DEFAULT_LUDO_CHALLENGES.map(item => ({ ...item }))); }}
            className="bg-emerald-200 hover:bg-emerald-300 text-emerald-950 px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >Khôi phục bộ mặc định 🔄</button>
        </div>
        {enabledCount === 0 && <p className="text-xs font-bold text-red-700">Chưa có thử thách nào đang bật: ô thử thách sẽ không có tác dụng.</p>}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
          {challenges.map(challenge => (
            <div key={challenge.id} className="bg-white p-3 rounded-2xl border border-emerald-200 flex items-center gap-2" data-testid="challenge-row">
              <input type="checkbox" checked={challenge.enabled} onChange={e => updateChallenge(challenge.id, { enabled: e.target.checked })} aria-label={`Bật thử thách ${challenge.text}`} className="h-5 w-5 shrink-0 accent-emerald-600" />
              <input type="text" value={challenge.icon} maxLength={8} onChange={e => updateChallenge(challenge.id, { icon: e.target.value })} aria-label="Biểu tượng" className="w-14 shrink-0 border-2 border-emerald-200 p-2 rounded-xl text-center text-base bg-white" />
              <input type="text" value={challenge.text} maxLength={200} onChange={e => updateChallenge(challenge.id, { text: e.target.value })} aria-label="Nội dung thử thách" className={`${inputClass} ${challenge.enabled ? '' : 'opacity-60'}`} />
              <button onClick={() => setChallenges(list => list.filter(item => item.id !== challenge.id))} aria-label={`Xoá thử thách ${challenge.text}`} className="text-red-600 hover:bg-red-100 p-2 rounded font-bold text-xs shrink-0">🗑️</button>
            </div>
          ))}
          {challenges.length === 0 && <p className="text-xs italic text-emerald-900/70">Danh sách trống. Thêm thử thách bên dưới.</p>}
        </div>
        <div className="bg-white p-4 rounded-3xl border-2 border-emerald-200 flex flex-wrap items-center gap-2">
          <input type="text" value={newIcon} maxLength={8} onChange={e => setNewIcon(e.target.value)} aria-label="Biểu tượng thử thách mới" className="w-14 border-2 border-emerald-200 p-2.5 rounded-xl text-center text-base bg-white" />
          <input type="text" value={newText} maxLength={200} onChange={e => setNewText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addChallenge(); }} placeholder="Nội dung thử thách mới, ví dụ: Nói 3 từ về màu sắc" className={`${inputClass} flex-1 min-w-[12rem]`} />
          <button onClick={addChallenge} disabled={!newText.trim()} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow">+ Thêm thử thách</button>
        </div>
      </div>
    </SettingsSection>
  );
};
