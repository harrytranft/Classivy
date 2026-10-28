import React from 'react';
import { createEgg, getEggRequiredProgress } from '../../domain/eggs';
import { createPokemonPetFromDexId, getPokemonArtworkUrl, getPokemonDisplayName, handlePokemonArtworkError, normalizeStudentPokemonData, updatePetInCollection } from '../../domain/pokemonProgression';
import { HistoryItem, Student } from '../../types';
import { PokemonUiEvent } from '../../domain/gameEvents';
import { appendAdventureJournal, applyTrainerJourneyProgress } from '../../domain/progression';
import { ProfileFusionSection } from './ProfileFusionSection';
import { useApp } from '../../app/AppContext';

export const ProfileEggView: React.FC = () => {
  const {
    editingStudent, handleBuyNewEgg, handleSelectActivePet, handleSpendAuraToHatchEgg,
    setEditingStudent, setStudents, showHatchAnnouncement
  } = useApp();
  return (
                      <div className="space-y-10">
                        <div className="text-center py-6 space-y-6 bg-gradient-to-b from-amber-50/30 to-transparent p-8 rounded-[40px] border border-amber-100/50">
                          <div className="relative inline-block">
                            <div className={`absolute inset-0 bg-amber-400/20 rounded-full blur-2xl transition-all duration-1000 ${editingStudent.egg && editingStudent.egg.progress >= Math.ceil(getEggRequiredProgress(editingStudent.egg) * 0.7) ? 'animate-ping scale-75' : ''}`} />

                            <div className={`text-9xl select-none inline-block transform transition-transform ${editingStudent.egg && editingStudent.egg.progress >= Math.ceil(getEggRequiredProgress(editingStudent.egg) * 0.7) ? 'animate-bounce cursor-pointer' : 'hover:scale-105 duration-300'}`}>
                              {editingStudent.egg && editingStudent.egg.progress >= getEggRequiredProgress(editingStudent.egg) ? '🐣' : editingStudent.egg && editingStudent.egg.progress >= Math.ceil(getEggRequiredProgress(editingStudent.egg) * 0.7) ? '🥚💥' : editingStudent.egg && editingStudent.egg.progress >= Math.ceil(getEggRequiredProgress(editingStudent.egg) * 0.4) ? '🥚⚡' : '🥚'}
                            </div>
                          </div>

                          <div className="max-w-md mx-auto bg-white border border-amber-200/60 p-6 rounded-3xl shadow-sm space-y-4">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-black text-amber-950">Tiến Trình Ấp Quả Trứng</span>
                              <span className="font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-full text-xs">{(editingStudent.egg ? editingStudent.egg.progress : 0)}/{getEggRequiredProgress(editingStudent.egg)}đ</span>
                            </div>
                            <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden shadow-inner border animate-pulse">
                              <div 
                                className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, Math.max(0, ((editingStudent.egg ? editingStudent.egg.progress : 0) / getEggRequiredProgress(editingStudent.egg)) * 100))}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-400 italic leading-relaxed">
                              {editingStudent.egg && editingStudent.egg.progress >= getEggRequiredProgress(editingStudent.egg)
                                ? 'Chúc mừng! Có sinh mệnh sắp vươn mình ra khỏi lớp vỏ mỏng manh!'
                                : editingStudent.egg && editingStudent.egg.progress >= Math.ceil(getEggRequiredProgress(editingStudent.egg) * 0.7)
                                  ? 'Lớp vỏ trứng nứt sâu rộn ràng! Chỉ 1 vài nét khích lệ hào quang từ giáo sĩ là nở trứng ngay!'
                                  : editingStudent.egg && editingStudent.egg.progress >= Math.ceil(getEggRequiredProgress(editingStudent.egg) * 0.4)
                                    ? 'Vỏ trứng bắt đầu xuất hiện rạn xước lấp lánh sinh lực.'
                                    : 'Trứng nguyên sơ đang chờ đợi được nạp năng lượng bằng các phản hồi tích cực.'}
                            </p>

                            <div className="pt-2 flex flex-col gap-3">
                              <button 
                                onClick={() => {
                                  const currentEgg = editingStudent.egg || createEgg('normal');
                                  const requiredProgress = getEggRequiredProgress(currentEgg);
                                  const nextProg = currentEgg.progress + 1;
                                  const isHatching = nextProg >= requiredProgress;

                                  let updatedEgg = { ...currentEgg, requiredProgress, progress: Math.min(requiredProgress, nextProg) };
                                  let updatedPet = editingStudent.pet;
                                  let nextPokemonProgress = { ...normalizeStudentPokemonData(editingStudent).pokemonProgress! };

                                  let historyItem: HistoryItem = { id: Date.now().toString(), amount: 1, reason: "Ủng hộ Hào Quang ấp trứng", timestamp: Date.now() };

                                  if (isHatching && updatedEgg.status === 'egg') {
                                    updatedEgg.status = 'hatched';
                                    updatedPet = createPokemonPetFromDexId(currentEgg.assignedDexId);
                                    nextPokemonProgress = {
                                      ...nextPokemonProgress,
                                      hatchedEggs: (nextPokemonProgress.hatchedEggs || 0) + 1
                                    };
                                    showHatchAnnouncement(
                                      [{ studentId: editingStudent.id, studentName: editingStudent.name, pet: updatedPet }],
                                      `Tuyệt vời! Trứng của ${editingStudent.name} đã nở ra ${getPokemonDisplayName(updatedPet)}.`
                                    );
                                  }

                                  let currentMerged: Student = {
                                    ...editingStudent,
                                    points: editingStudent.points + 1,
                                    egg: updatedEgg,
                                    pet: updatedPet,
                                    pokemonProgress: nextPokemonProgress,
                                    pets: updatedPet ? updatePetInCollection(editingStudent, updatedPet) : editingStudent.pets,
                                    history: [historyItem, ...editingStudent.history].slice(0, 50)
                                  };
                                  const journeyEvents: PokemonUiEvent[] = [];
                                  currentMerged = applyTrainerJourneyProgress(currentMerged, 0, Date.now(), journeyEvents);
                                  if (isHatching && updatedPet) {
                                    currentMerged = appendAdventureJournal(currentMerged, {
                                      type: 'pokemon-hatched',
                                      text: `${getPokemonDisplayName(updatedPet)} hatched for ${editingStudent.name}.`,
                                      petInstanceId: updatedPet.instanceId
                                    });
                                  }
                                  if (isHatching && updatedPet?.isShiny) {
                                    currentMerged = appendAdventureJournal(currentMerged, {
                                      type: 'shiny-acquired',
                                      text: `${editingStudent.name} discovered Shiny ${getPokemonDisplayName(updatedPet)}.`,
                                      petInstanceId: updatedPet.instanceId
                                    });
                                  }
                                  setEditingStudent(currentMerged);
                                  setStudents(prev => prev.map(s => s.id === editingStudent.id ? currentMerged : s));
                                }}
                                className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-2xl shadow-md hover:bg-amber-600 active:scale-95 transition-all text-xs"
                              >
                                🧪 Ủng Hộ +1đ Hào Quang Ấp Trứng
                              </button>

                              {editingStudent.egg?.status === 'egg' && (() => {
                                const requiredProgress = getEggRequiredProgress(editingStudent.egg);
                                const remainingProgress = Math.max(0, requiredProgress - (editingStudent.egg.progress || 0));
                                return (
                                  <button
                                    disabled={remainingProgress <= 0 || editingStudent.points < remainingProgress}
                                    onClick={() => handleSpendAuraToHatchEgg(editingStudent.id)}
                                    className="w-full rounded-2xl bg-emerald-700 py-3.5 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-800 active:scale-95 disabled:bg-stone-200 disabled:text-stone-500"
                                  >
                                    🎁 Đổi {remainingProgress}đ Hào Quang để ấp nhanh
                                  </button>
                                );
                              })()}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                  onClick={() => handleBuyNewEgg(editingStudent.id, 'normal')}
                                  className="w-full rounded-brand-md bg-brand-forest py-3.5 text-xs font-bold text-brand-cream shadow-md transition-all hover:bg-brand-forest-deep active:scale-95"
                                >
                                  🥚 Trứng thường (10đ)
                                </button>
                                <button
                                  onClick={() => handleBuyNewEgg(editingStudent.id, 'special')}
                                  className="w-full bg-purple-700 hover:bg-purple-900 text-white font-bold py-3.5 rounded-2xl shadow-md active:scale-95 transition-all text-xs"
                                >
                                  ✨ Trứng đặc biệt (20đ)
                                </button>
                              </div>

                              {editingStudent.egg && editingStudent.egg.progress >= getEggRequiredProgress(editingStudent.egg) && (
                                 <button 
                                   onClick={() => {
                                     const currentEgg = editingStudent.egg!;
                                     const requiredProgress = getEggRequiredProgress(currentEgg);
                                     const updatedEgg = { ...currentEgg, status: 'hatched' as const, requiredProgress, progress: requiredProgress };
                                     const updatedPet = createPokemonPetFromDexId(currentEgg.assignedDexId);
                                     const nextPokemonProgress = {
                                       ...normalizeStudentPokemonData(editingStudent).pokemonProgress!,
                                       hatchedEggs: (editingStudent.pokemonProgress?.hatchedEggs || 0) + 1
                                     };

                                     let currentMerged: Student = {
                                       ...editingStudent,
                                       egg: updatedEgg,
                                       pet: updatedPet,
                                       pokemonProgress: nextPokemonProgress,
                                       pets: updatePetInCollection(editingStudent, updatedPet)
                                     };
                                     const journeyEvents: PokemonUiEvent[] = [];
                                     currentMerged = applyTrainerJourneyProgress(currentMerged, 0, Date.now(), journeyEvents);
                                     currentMerged = appendAdventureJournal(currentMerged, {
                                       type: 'pokemon-hatched',
                                       text: `${getPokemonDisplayName(updatedPet)} hatched for ${editingStudent.name}.`,
                                       petInstanceId: updatedPet.instanceId
                                     });
                                     if (updatedPet.isShiny) {
                                       currentMerged = appendAdventureJournal(currentMerged, {
                                         type: 'shiny-acquired',
                                         text: `${editingStudent.name} discovered Shiny ${getPokemonDisplayName(updatedPet)}.`,
                                         petInstanceId: updatedPet.instanceId
                                       });
                                     }

                                     setEditingStudent(currentMerged);
                                     setStudents(prev => prev.map(s => s.id === editingStudent.id ? currentMerged : s));
                                     showHatchAnnouncement(
                                       [{ studentId: editingStudent.id, studentName: editingStudent.name, pet: updatedPet }],
                                       `Tin vui! ${getPokemonDisplayName(updatedPet)} đã nở từ trứng và sẵn sàng đồng hành cùng ${editingStudent.name}.`
                                     );
                                   }}
                                   className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-green-700 animate-bounce transition-all text-xs"
                                 >
                                   🐣 TIẾN HÀNH GÕ VỎ - NỞ TRỨNG NGAY! 🐣
                                 </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* OWNED PORTFOLIO SELECTION IN EGG SCREEN (WHEN WAITING FOR HATCH) */}
                        {editingStudent.pets && editingStudent.pets.length > 0 && (
                          <div className="bg-amber-50/30 p-6 rounded-[32px] border border-amber-200/30 space-y-4">
                            <div className="text-left">
                              <h4 className="text-lg text-amber-900 flex items-center gap-2 font-extrabold">
                                <span>🦁</span>
                                <span>Danh Sách Pokémon Sở Hữu ({editingStudent.pets.length})</span>
                              </h4>
                              <p className="text-xs text-amber-950/60 mt-0.5">Chọn Pokémon đã nở trước đó để tiếp tục đồng hành.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                              {editingStudent.pets.map(p => (
                                <div key={p.instanceId || `${p.dexId}-${p.name}`} className="p-3 bg-white border border-gray-100 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
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
                                  <button 
                                    onClick={() => handleSelectActivePet(editingStudent.id, p)}
                                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all shrink-0"
                                  >
                                    Chọn Đồng Hành ⚔️
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Phase 12D: Hợp nhất nằm ngay dưới danh sách Pokémon sở hữu */}
                        <ProfileFusionSection />
                      </div>
  );
};
