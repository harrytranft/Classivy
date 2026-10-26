import React from 'react';
import { StudentAvatar } from '../../components/StudentAvatar';
import { getPokemonDisplayName } from '../../domain/pokemonProgression';
import { useApp } from '../../app/AppContext';

export const ShopModal: React.FC = () => {
  const {
    currentClassStudents, handlePrepareShopPurchase, petSkills, selectedShopSkill,
    setSelectedShopSkill, setShopReview, setShowShopModal, shopSelections, showShopModal,
    toggleShopEgg, toggleShopSkill
  } = useApp();
  return (
    <>
      {showShopModal && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md animate-in fade-in duration-200"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
                setShowShopModal(false);
                setShopReview(null);
                setSelectedShopSkill(null);
              }
            }}
        >
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[34px] border-2 border-white/80 bg-white/90 shadow-[0_30px_90px_rgba(15,118,110,0.28)] backdrop-blur-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-100 bg-gradient-to-r from-teal-50 via-cyan-50 to-emerald-50 p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-teal-600">Class Shop</p>
                <h2 className="font-royal text-3xl text-teal-950">Shop Pokémon & Skill</h2>
              </div>
              <button
                onClick={() => {
                  setShowShopModal(false);
                  setShopReview(null);
                  setSelectedShopSkill(null);
                }}
                className="grid h-10 w-10 place-items-center rounded-full border border-teal-200 bg-white text-lg font-black text-teal-900 hover:bg-teal-50"
                aria-label="Đóng Shop"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4 custom-scrollbar">
              <table
                className="w-max min-w-full border-separate border-spacing-2 text-xs"
                style={{ minWidth: `${540 + Math.max(1, petSkills.length) * 150}px` }}
              >
                <thead>
                  <tr>
                    <th className="sticky left-0 top-0 z-40 w-[220px] min-w-[220px] rounded-2xl bg-teal-950 px-3 py-3 text-left font-black uppercase text-white shadow-[10px_0_22px_rgba(15,118,110,0.22)]">
                      Trainer
                    </th>
                    <th className="sticky top-0 z-20 w-[150px] min-w-[150px] rounded-2xl bg-teal-900 px-3 py-3 text-center font-black uppercase text-white">
                      Trứng thường
                    </th>
                    <th className="sticky top-0 z-20 w-[150px] min-w-[150px] rounded-2xl bg-teal-900 px-3 py-3 text-center font-black uppercase text-white">
                      Trứng đặc biệt
                    </th>
                    {petSkills.map(skill => (
                      <th key={skill.id} className="sticky top-0 z-20 w-[150px] min-w-[150px] rounded-2xl bg-teal-900 p-0 text-center font-black uppercase text-white">
                        <button
                          type="button"
                          onClick={() => setSelectedShopSkill(skill)}
                          className="h-full w-full rounded-2xl px-3 py-3 font-black uppercase text-white transition-all hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200"
                          title={`Bấm để xem chi tiết ${skill.name}`}
                        >
                          <span>{skill.icon}</span> {skill.name}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentClassStudents.map(student => {
                    const selection = shopSelections[student.id] || { skills: [] };
                    const ownedSkillIds = student.pet?.skills || [];
                    return (
                      <tr key={student.id}>
                        <td className="sticky left-0 z-30 w-[220px] min-w-[220px] rounded-2xl border border-teal-100 bg-white p-3 shadow-[10px_0_22px_rgba(15,118,110,0.16)]">
                          <div className="flex items-center gap-3">
                            <StudentAvatar student={student} className="h-10 w-10 shrink-0 rounded-xl border-2 border-white shadow-sm" />
                            <div className="min-w-0">
                              <p className="truncate font-black text-teal-950">{student.name}</p>
                              <p className="mt-0.5 truncate text-[10px] font-bold text-teal-700/70">{student.points}đ Hào Quang · {student.pet ? getPokemonDisplayName(student.pet) : 'Đang ấp trứng'}</p>
                            </div>
                          </div>
                        </td>
                        {(['normal', 'special'] as const).map(kind => (
                          <td key={kind} className="w-[150px] min-w-[150px]">
                            <label className={`flex min-h-[68px] cursor-pointer items-center justify-center rounded-2xl border p-3 font-black transition-all ${selection.egg === kind ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-100' : 'border-teal-100 bg-white text-stone-400 hover:border-teal-300'}`}>
                              <input
                                type="checkbox"
                                checked={selection.egg === kind}
                                onChange={() => toggleShopEgg(student.id, kind)}
                                className="mr-2 h-4 w-4 accent-teal-600"
                              />
                              {kind === 'special' ? '20đ' : '10đ'}
                            </label>
                          </td>
                        ))}
                        {petSkills.map(skill => {
                          const disabled = !student.pet || ownedSkillIds.includes(skill.id);
                          const checked = selection.skills.includes(skill.id);
                          return (
                            <td key={skill.id} className="w-[150px] min-w-[150px]">
                              <label
                                title={`${skill.name}: ${skill.description} · Giá ${skill.cost}đ${disabled ? student.pet ? ' · Đã sở hữu' : ' · Cần có Pokémon active' : ''}`}
                                className={`flex min-h-[68px] cursor-pointer items-center justify-center rounded-2xl border p-3 text-center font-black transition-all ${checked ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-100' : 'border-teal-100 bg-white text-stone-400 hover:border-indigo-300'} ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={disabled}
                                  onChange={() => toggleShopSkill(student.id, skill.id)}
                                  className="mr-2 h-4 w-4 accent-indigo-600"
                                />
                                {skill.cost}đ
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-teal-100 bg-white/80 p-5">
              <p className="text-xs font-bold text-teal-900/70">Trứng thường: 80% thường, 20% đặc biệt. Trứng đặc biệt: 100% đặc biệt/rare/legend.</p>
              <button
                onClick={handlePrepareShopPurchase}
                className="rounded-2xl bg-teal-700 px-8 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all hover:bg-teal-900 active:scale-95"
              >
                Mua
              </button>
            </div>
          </div>

          {selectedShopSkill && (
            <div
              className="fixed inset-0 z-[240] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm animate-in fade-in duration-150"
              onMouseDown={event => {
                if (event.target === event.currentTarget) setSelectedShopSkill(null);
              }}
            >
              <div className="w-full max-w-xl rounded-[32px] border-2 border-white/80 bg-white p-6 shadow-[0_30px_90px_rgba(49,46,129,0.35)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-500">Skill Detail</p>
                    <h3 className="mt-1 flex items-center gap-2 font-royal text-3xl text-indigo-950">
                      <span>{selectedShopSkill.icon}</span>
                      <span>{selectedShopSkill.name}</span>
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedShopSkill(null)}
                    className="grid h-10 w-10 place-items-center rounded-full border border-indigo-100 bg-indigo-50 text-lg font-black text-indigo-900 hover:bg-indigo-100"
                    aria-label="Đóng chi tiết skill"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-5 space-y-4 font-sans">
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Chức năng</p>
                    <p className="mt-1 text-sm font-bold leading-relaxed text-indigo-950">{selectedShopSkill.description}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Giá mua</p>
                      <p className="mt-1 text-2xl font-black text-amber-950">{selectedShopSkill.cost}đ Hào Quang</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Lượt dùng</p>
                      <p className="mt-1 text-sm font-black text-emerald-950">Mỗi skill bắt đầu từ 0 lượt đã dùng và tuân theo giới hạn trong hệ thống skill hiện tại.</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ví dụ</p>
                    <p className="mt-1 text-sm font-bold leading-relaxed text-slate-700">
                      Nếu trainer mua {selectedShopSkill.name}, skill sẽ được gắn vào Pokémon đang đồng hành. Khi đến lượt cần dùng, giáo viên mở hồ sơ Pokémon của trainer và kích hoạt skill đó theo mô tả ở trên.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
