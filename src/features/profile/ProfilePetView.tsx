import React from 'react';
import { getNextMasteryTarget, getPokemonArtworkUrl, getPokemonDisplayName, handlePokemonArtworkError, xpNeededForNextLevel } from '../../domain/pokemonProgression';
import { PokemonPassiveBadge } from '../../components/PokemonPassiveBadge';
import { getPassiveDefinition, getPassiveIcon } from '../../domain/pokemonPassives';
import { getSynergyLabel, isSamePokemon } from '../../domain/pokemonCollection';
import { EggInventoryPanel } from './EggInventoryPanel';
import { ExpeditionPanel } from './ExpeditionPanel';
import { WeeklyChestPanel } from './WeeklyChestPanel';
import { useApp } from '../../app/AppContext';

export const ProfilePetView: React.FC = () => {
  const {
    editingPetEvolutionPreview, editingStudent, handleBuyNewEgg, handleBuySkill,
    handleRenamePet, handleSelectActivePet, handleSelectSupportPet, handleUsePetSkill,
    petSkills
  } = useApp();
  return (
                      <div className="space-y-8 animate-in fade-in duration-300">
                        {<EggInventoryPanel student={editingStudent} />}
                        {<ExpeditionPanel student={editingStudent} />}
                        {<WeeklyChestPanel student={editingStudent} />}

                        <div className="bg-amber-50/50 rounded-3xl border border-amber-200/50 p-6 flex flex-col md:flex-row gap-6 items-center">
                          <div className="shrink-0 w-44 h-44 bg-white rounded-2xl border-4 border-amber-300 p-4 flex items-center justify-center relative shadow-lg overflow-hidden group">
                            <div className="absolute inset-0 bg-radial-gradient from-amber-200/50 via-transparent to-transparent opacity-60 group-hover:scale-125 transition-transform" />
                            <img 
                              referrerPolicy="no-referrer"
                              src={getPokemonArtworkUrl(editingStudent.pet)}
    	                          onError={event => handlePokemonArtworkError(event, editingStudent.pet)}
                              className={`w-full h-full object-contain relative z-10 drop-shadow-xl animate-in duration-500 hover:rotate-6 transition-transform ${editingStudent.pet.isShiny ? 'rounded-2xl bg-amber-100/70 ring-4 ring-amber-300' : ''}`}
                              alt={getPokemonDisplayName(editingStudent.pet)}
                            />

                            {/* Type Badges on bottom corner */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                              {editingStudent.pet.types.map(t => (
                                <span key={t} className="bg-amber-500 text-white font-black text-[10px] px-1.5 py-0.5 rounded tracking-tighter shadow-sm border border-white">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex-1 w-full space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
                              <div>
                                <span className="bg-amber-100 text-amber-900 font-black text-xs px-2.5 py-0.5 rounded-full block w-max">Pokémon Đồng Hành</span>
                                <h3 className="text-2xl font-black text-amber-950 mt-1">{getPokemonDisplayName(editingStudent.pet)}</h3>
                                <p className="text-xs font-bold text-amber-900/60">
                                  {editingStudent.pet.speciesName || editingStudent.pet.name} · Lv.{editingStudent.pet.level || 1}
                                </p>
                                {editingStudent.pet.isShiny && (
                                  <span className="mt-1 inline-flex w-max items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">
                                    ✨ Shiny
                                  </span>
                                )}
                              </div>

                              <div className="text-right sm:text-right">
                                <p className="text-xs font-bold text-gray-400">Tài chính của bạn</p>
                                <p className="text-xl font-black text-red-800">{editingStudent.points}đ Hào Quang</p>
                              </div>
                            </div>

                            {/* Nicknaming support */}
                            <div>
                              <label className="text-xs font-bold text-gray-400 block mb-1">Đặt Biệt Danh Thú Cưng</label>
                              <input 
                                className="w-full border p-2.5 rounded-xl bg-white focus:ring-2 ring-amber-500/30 outline-none text-sm font-bold text-amber-950 border-amber-200" 
                                value={editingStudent.pet.nickname || ''} 
                                onChange={e => handleRenamePet(editingStudent.id, e.target.value)}
                                placeholder="Biệt danh mới cho pet..."
                              />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                              <div className="bg-white border border-amber-100 rounded-2xl p-3">
                                <p className="text-xs font-black text-gray-400">Level</p>
                                <p className="text-sm font-black text-amber-950">Lv.{editingStudent.pet.level || 1}</p>
                              </div>
                              <div className="bg-white border border-amber-100 rounded-2xl p-3">
                                <p className="text-xs font-black text-gray-400">HP</p>
                                <p className="text-sm font-black text-emerald-700">{editingStudent.pet.hp ?? 100}/100</p>
                              </div>
                              <div className="bg-white border border-amber-100 rounded-2xl p-3">
                                <p className="text-xs font-black text-gray-400">{(editingStudent.pet.level || 1) >= 30 ? 'Mastery XP' : 'XP'}</p>
                                <p className="text-sm font-black text-amber-950">
                                  {(editingStudent.pet.level || 1) >= 30
                                    ? `${editingStudent.pet.masteryXp || 0}/${getNextMasteryTarget(editingStudent.pet.masteryStars || 0) || 'MAX'}`
                                    : `${editingStudent.pet.xp || 0}/${xpNeededForNextLevel(editingStudent.pet.level || 1)}`}
                                </p>
                              </div>
                              <div className="bg-white border border-amber-100 rounded-2xl p-3">
                                <p className="text-xs font-black text-gray-400">Bond</p>
                                <p className="text-sm font-black text-pink-700">{editingStudent.pet.bond || 0}/100</p>
                              </div>
                              <div className="bg-white border border-amber-100 rounded-2xl p-3">
                                <p className="text-xs font-black text-gray-400">Charge</p>
                                <p className="text-sm font-black text-indigo-700">{editingStudent.pet.charge || 0}/5</p>
                              </div>
                              <div className="bg-white border border-amber-100 rounded-2xl p-3 min-w-0">
                                <p className="text-xs font-black text-gray-400">Passive</p>
                                <div className="mt-1 min-w-0">
                                  <PokemonPassiveBadge passiveId={editingStudent.pet.passiveId} compact className="max-w-full" />
                                  {!editingStudent.pet.passiveId && <span className="text-xs font-black text-gray-400">Chưa có</span>}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-amber-200 bg-white p-3">
                              <p className="text-xs font-black text-gray-400">Evolution Preview</p>
                              <p className="text-sm font-black text-amber-950">
                                {editingPetEvolutionPreview.isFinal
                                  ? 'Final Evolution Reached'
                                  : `Next Evolution: Lv. ${editingPetEvolutionPreview.nextLevel} · ${editingPetEvolutionPreview.nextSpeciesName}`}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-amber-50 p-4 shadow-sm">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-xs font-black text-indigo-500">Passive & Quà tự động</p>
                                  {(() => {
                                    const passive = getPassiveDefinition(editingStudent.pet.passiveId);
                                    return passive ? (
                                      <div className="mt-2">
                                        <p className="text-sm font-black text-indigo-950">
                                          {getPassiveIcon(passive.id)} {passive.name}
                                        </p>
                                        <p className="mt-1 text-xs font-bold leading-relaxed text-indigo-900/70">{passive.description}</p>
                                      </div>
                                    ) : (
                                      <p className="mt-2 text-xs font-bold text-gray-400">Pokémon này chưa có passive.</p>
                                    );
                                  })()}
                                </div>
                                <div className="rounded-2xl border border-white bg-white/80 p-3 text-xs font-black text-amber-950 shadow-inner sm:w-72">
                                  <p>Lv.5 / Lv.12 / Lv.20 / Lv.30: kiểm tra tiến hóa theo loài.</p>
                                  <p className="mt-1">Mỗi lần lên level: Bond +1 và thông báo Level Up ở giữa màn hình.</p>
                                  <p className="mt-1">Charge 5/5: câu trả lời Solo tích cực kế tiếp được tăng XP.</p>
                                  <p className="mt-1">Sau Lv.30: XP chuyển thành Mastery XP để nhận sao Mastery.</p>
                                </div>
                              </div>
                            </div>

                            {(editingStudent.pet.level || 1) >= 30 && (
                              <div className="rounded-2xl border border-amber-200 bg-white p-3">
                                <p className="text-xs font-black text-gray-400">Mastery</p>
                                <p className="text-xl font-black text-amber-700">
                                  {(editingStudent.pet.masteryStars || 0) > 0 ? '⭐'.repeat(editingStudent.pet.masteryStars || 0) : 'Chưa có sao'}
                                </p>
                                <p className="mt-1 text-xs font-bold text-amber-900/60">
                                  XP sau Lv.30 sẽ chuyển thành Mastery XP cho danh hiệu đồng hành lâu dài.
                                </p>
                              </div>
                            )}

                            <div className="flex flex-wrap justify-end gap-3 pt-1">
                              <button 
                                onClick={() => handleBuyNewEgg(editingStudent.id, 'normal')}
                                className="flex items-center gap-2 rounded-brand-md bg-brand-forest p-3 px-5 text-xs font-bold text-brand-cream shadow-md transition-all hover:bg-brand-forest-deep active:translate-y-px"
                              >
                                <span>🥚🌟</span>
                                <span>Trứng thường (10đ)</span>
                              </button>
                              <button 
                                onClick={() => handleBuyNewEgg(editingStudent.id, 'special')}
                                className="bg-purple-700 hover:bg-purple-900 text-white font-bold text-xs p-3 px-5 rounded-2xl flex items-center gap-2 shadow-md transition-all active:translate-y-px"
                              >
                                <span>✨🥚</span>
                                <span>Trứng đặc biệt (20đ)</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* OWNED PETS SELECTION INTERFACE (ACTIVE COMPANION SWAP) */}
                        {editingStudent.pets && editingStudent.pets.length > 0 && (
                          <div className="bg-amber-50/10 p-6 rounded-3xl border border-amber-200/20 space-y-4">
                            <div className="text-left border-b pb-2">
                              <h4 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-brand-ink">
                                <span>🦁</span>
                                <span>Pokémon Đã Sở Hữu ({editingStudent.pets.length})</span>
                              </h4>
                              <p className="text-xs text-amber-950/60 mt-0.5">Lựa chọn một Pokémon trong bộ sưu tập để đồng hành cùng trainer.</p>
                              {getSynergyLabel(editingStudent) && (
                                <p className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                                  {getSynergyLabel(editingStudent)}
                                </p>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[190px] overflow-y-auto pr-2 custom-scrollbar">
                              {editingStudent.pets.map(p => {
                                const isActive = isSamePokemon(editingStudent.pet, p);
                                const isSupport = editingStudent.supportPetInstanceId === p.instanceId;
                                return (
                                  <div key={p.instanceId || `${p.dexId}-${p.name}`} className={`p-3 bg-white border rounded-2xl flex items-center justify-between gap-3 shadow-xs transition-all ${isActive ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-100'}`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                      <img 
                                        src={getPokemonArtworkUrl(p)}
    	                                    onError={event => handlePokemonArtworkError(event, p)}
                                        className="w-10 h-10 object-contain shrink-0" 
                                      />
                                      <div className="min-w-0">
                                        <h5 className="font-extrabold text-xs text-gray-800 truncate">{p.isShiny ? '✨ ' : ''}{getPokemonDisplayName(p)}</h5>
                                        <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-black tracking-tight">{p.types.join('/')}</span>
                                        <p className="mt-1 text-xs font-black text-gray-400">Lv.{p.level || 1} · HP {p.hp ?? 100} · Bond {p.bond || 0}</p>
                                      </div>
                                    </div>
                                    {isActive ? (
                                      <span className="text-xs bg-amber-500 text-white font-extrabold px-2.5 py-1.5 rounded-full tracking-tighter shrink-0">ĐANG ĐỒNG HÀNH</span>
                                    ) : (
                                      <div className="flex shrink-0 flex-col gap-1.5">
                                        <button 
                                          onClick={() => handleSelectActivePet(editingStudent.id, p)}
                                          className="bg-gray-100 hover:bg-amber-100 text-amber-950 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-200 shadow-xs transition-all"
                                        >
                                          Active ⚔️
                                        </button>
                                        <button
                                          disabled={!p.instanceId}
                                          onClick={() => handleSelectSupportPet(editingStudent.id, isSupport ? undefined : p)}
                                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border shadow-xs transition-all ${isSupport ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'}`}
                                        >
                                          {isSupport ? 'Support ✓' : 'Support'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                          </div>
                        )}
                        {/* SECTION: YOUR NEW DIRECT PET ACTIVE SKILLS (LIMIT 2 USES) */}
                        {editingStudent.pet.skills && editingStudent.pet.skills.length > 0 && (
                          <div className="space-y-4 pt-4">
                            <h4 className="flex items-center gap-2 border-b border-[#e6e2d4] pb-2 text-xl font-extrabold tracking-tight text-brand-ink">
                              <span>⚡</span>
                              <span>Bảo Bối Tuyệt Chiêu Hữu Dụng</span>
                            </h4>
                            <p className="text-xs text-indigo-950/70">Kích hoạt trực tiếp quyền năng thần bí để lật ngược thế cờ kiểm tra! Mật tịch bốc hơi ngay sau 2 lần sử dụng.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {editingStudent.pet.skills.map(skId => {
                                const sk = petSkills.find(x => x.id === skId);
                                if (!sk) return null;
                                const currentUses = editingStudent.pet?.skillUses?.[skId] || 0;
                                const remainingUses = Math.max(0, 2 - currentUses);
                                return (
                                  <div key={skId} className="bg-indigo-50/40 p-4 border border-indigo-200 rounded-3xl flex items-center justify-between gap-4 shadow-sm hover:bg-indigo-50/80 transition-all text-left">
                                    <div className="w-10 h-10 shrink-0 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl border border-indigo-200">
                                      {sk.icon}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${remainingUses <= 1 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                                        Trạng thái: Chỉ còn {remainingUses}/2 lượt dùng
                                      </span>
                                      <h5 className="font-extrabold text-sm text-gray-800 mt-1">{sk.name}</h5>
                                      <p className="text-xs text-gray-400 mt-0.5 italic leading-tight">{sk.description}</p>
                                    </div>
                                    <button
                                      onClick={() => handleUsePetSkill(editingStudent.id, skId, sk.name)}
                                      className="shrink-0 rounded-brand-md bg-brand-forest px-3.5 py-2.5 text-xs font-bold text-brand-cream shadow transition-all hover:bg-brand-forest-deep active:translate-y-px"
                                    >
                                      Kích Hoạt
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* SECTION: PET SKILLS DOJO */}
                        <div className="space-y-4 pt-4">
                          <h4 className="flex items-center gap-2 border-b border-[#e6e2d4] pb-2 text-xl font-extrabold tracking-tight text-brand-ink">
                            <span>🎓</span>
                            <span>Pokémon Skill Lab</span>
                          </h4>
                          <p className="text-xs text-purple-800/70">Huấn luyện skill cho Pokémon để hỗ trợ trainer trong các hoạt động học tập.</p>

                          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                            {petSkills.map(sk => {
                              const isLearned = editingStudent.pet?.skills.includes(sk.id);
                              return (
                                <div key={sk.id} className="bg-white p-4 border border-gray-100 rounded-3xl flex items-center justify-between gap-4 shadow-sm hover:border-purple-200 hover:bg-purple-50/10 transition-all">
                                  <div className="w-10 h-10 shrink-0 bg-purple-50 rounded-2xl flex items-center justify-center text-2xl border border-purple-100">
                                    {sk.icon}
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">Trainer skill</span>
                                    <h5 className="font-extrabold text-sm text-gray-800 mt-1">{sk.name}</h5>
                                    <p className="text-xs text-gray-400 mt-0.5 italic leading-relaxed">{sk.description}</p>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    {isLearned ? (
                                      <span className="bg-purple-100 text-purple-800 font-extrabold border border-purple-200 text-xs px-4 py-2 rounded-2xl tracking-tighter">
                                        ☘️ Đã Giác Ngộ
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleBuySkill(editingStudent.id, sk.id, sk.cost, sk.name)}
                                        className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs px-4 py-2 rounded-2xl tracking-tight shadow active:translate-y-px transition-all"
                                      >
                                        Rèn ({sk.cost}đ)
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
  );
};
