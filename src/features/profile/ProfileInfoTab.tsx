import React from 'react';
import { getBadgeDefinition, getTrainerLevelPercent, getTrainerTitleDefinition, normalizeTrainerProgress, trainerXpNeededForNextLevel } from '../../domain/trainerProgression';
import { StudentAvatar } from '../../components/StudentAvatar';
import { useApp } from '../../app/AppContext';

export const ProfileInfoTab: React.FC = () => {
  const {
    editingStudent, handleRemoveStudentCustomAvatar, handleStudentCustomAvatarUpload,
    setCurrentScreen, setEditingStudent, setFeedbackSource, setSelectedStudentIds,
    setShowSkillModal, setStudents
  } = useApp();
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {(() => {
        const trainerProgress = normalizeTrainerProgress(editingStudent);
        const trainerTitle = getTrainerTitleDefinition(trainerProgress.titleId);
        const trainerXpPct = getTrainerLevelPercent(trainerProgress);
        const earnedBadgeViews = (editingStudent.earnedBadges || [])
          .map(badge => ({ badge, definition: getBadgeDefinition(badge.badgeId) }))
          .filter(item => item.definition);
        return (
          <div className="rounded-brand-lg border border-brand-emerald/20 bg-[#f4f8f1] p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-brand-forest">Hành trình Trainer</p>
                <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-brand-ink">
                  Lv.{trainerProgress.level} · {trainerTitle.icon} {trainerTitle.name}
                </h3>
                <p className="mt-1 text-xs font-bold text-stone-500">{trainerTitle.description}</p>
              </div>
              <div className="min-w-[180px] rounded-2xl bg-white p-3">
                <div className="mb-1 flex justify-between text-xs font-bold text-brand-forest">
                  <span>Trainer XP</span>
                  <span>{trainerProgress.xp}/{trainerXpNeededForNextLevel(trainerProgress.level)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-brand-emerald" style={{ width: `${trainerXpPct}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-3">
                <p className="mb-2 text-xs font-black text-stone-400">Unlocked Titles</p>
                <div className="flex flex-wrap gap-2">
                  {(trainerProgress.unlockedTitleIds || ['rookie']).map(titleId => {
                    const title = getTrainerTitleDefinition(titleId);
                    return (
                      <button
                        key={title.id}
                        onClick={() => {
                          const updatedStudent = {
                            ...editingStudent,
                            trainerProgress: {
                              ...trainerProgress,
                              titleId: title.id
                            }
                          };
                          setEditingStudent(updatedStudent);
                          setStudents(prev => prev.map(student => student.id === editingStudent.id ? updatedStudent : student));
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-black ${trainerProgress.titleId === title.id ? 'border-brand-forest bg-brand-forest text-brand-cream' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
                      >
                        {title.icon} {title.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <p className="mb-2 text-xs font-black text-stone-400">Gym Badges</p>
                {earnedBadgeViews.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {earnedBadgeViews.map(({ badge, definition }) => (
                      <span key={badge.badgeId} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-900" title={definition!.description}>
                        {definition!.icon} {definition!.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-stone-400">Chưa có huy hiệu.</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {editingStudent.adventureJournal && editingStudent.adventureJournal.length > 0 && (
        <div className="rounded-[32px] border border-stone-200 bg-stone-50 p-5">
          <h3 className="text-xl text-stone-900 font-extrabold">📖 Adventure Journal</h3>
          <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            {editingStudent.adventureJournal.slice(0, 12).map(entry => (
              <div key={entry.id} className="rounded-2xl bg-white p-3 text-sm shadow-sm">
                <p className="font-bold text-stone-800">{entry.text}</p>
                <p className="mt-1 text-xs font-bold text-stone-400">{new Date(entry.timestamp).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
        <div className="relative shrink-0 flex flex-col items-center gap-2">
          <StudentAvatar student={editingStudent} className="w-32 h-32 rounded-full border-4 border-[#D4AF37] shadow-lg" />
          <div className="flex flex-col items-center gap-1.5 w-full">
            <label className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer shadow-sm transition-all text-center w-full">
              📷 Đổi Ảnh Riêng
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleStudentCustomAvatarUpload(editingStudent.id, e)} 
                className="hidden" 
              />
            </label>
            {editingStudent.customAvatar && (
              <button 
                onClick={() => handleRemoveStudentCustomAvatar(editingStudent.id)}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Xoá ảnh riêng (Dùng Avatar cấp bậc)
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 w-full space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1">Họ Tên</label>
            <input className="w-full border border-[#d9d6ca] p-3 rounded-brand-md bg-white focus:ring-2 ring-brand-emerald/20 outline-none text-sm font-bold" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1">Lớp / Team</label>
            <input className="w-full border border-[#d9d6ca] p-3 rounded-brand-md bg-white focus:ring-2 ring-brand-emerald/20 outline-none text-sm font-bold" value={editingStudent.className} onChange={e => setEditingStudent({...editingStudent, className: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1">Điểm Hiện Tại</label>
            <input type="number" className="w-full border border-[#d9d6ca] p-3 rounded-brand-md bg-white font-black text-2xl text-brand-forest outline-none" value={editingStudent.points} onChange={e => setEditingStudent({...editingStudent, points: parseInt(e.target.value) || 0})} />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
        <button onClick={() => { 
          setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s)); 
          alert("Đã lưu ý chỉ!");
          setCurrentScreen('class');
        }} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-700 hover:scale-[1.01] transition-all">Lưu Thông Tin</button>
        <button onClick={() => { 
          setSelectedStudentIds([editingStudent.id]); 
          setFeedbackSource('manual');
          setShowSkillModal(true); 
        }} className="flex-1 bg-brand-forest text-brand-cream py-4 rounded-brand-md font-bold shadow-lg hover:bg-brand-forest-deep hover:scale-[1.01] transition-all">Ban Thưởng / Phạt</button>
        <button onClick={() => {
          if (window.confirm("Xóa trainer này?")) {
            setStudents(prev => prev.filter(s => s.id !== editingStudent.id));
            setCurrentScreen('class');
          }
        }} className="bg-gray-100 text-red-800 px-6 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all">Xóa</button>
      </div>

      <div className="pt-8 border-t">
        <h3 className="text-xl mb-6 text-gray-800 font-extrabold">Biên Niên Sử</h3>
        <div className="space-y-3 h-80 overflow-y-auto pr-2 custom-scrollbar">
          {editingStudent.history.map(h => (
            <div key={h.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center group hover:border-red-800/20">
              <div>
                <p className="font-bold text-gray-800 text-sm">{h.reason}</p>
                <p className="text-xs opacity-40">{new Date(h.timestamp).toLocaleString()}</p>
              </div>
              <span className={`text-xl font-black ${h.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{h.amount > 0 ? '+' : ''}{h.amount}</span>
            </div>
          ))}
          {editingStudent.history.length === 0 && <p className="text-center py-20 opacity-20 italic">Chưa có ghi chép nào...</p>}
        </div>
      </div>
    </div>
  );
};
