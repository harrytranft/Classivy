import React from 'react';
import { getPokemonArtworkUrl, getPokemonDisplayName, handlePokemonArtworkError } from '../../domain/pokemonProgression';
import { getFusionCandidates } from '../../domain/pokemonCollection';
import { useApp } from '../../app/AppContext';

export const ProfileFusionTab: React.FC = () => {
  const {
    editingStudent, handleFuseSelectedPokemons, petSkills, selectedFusionPetDexIds,
    setSelectedFusionPetDexIds
  } = useApp();
  return (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="bg-purple-50/70 border-2 border-purple-200 rounded-[32px] p-6 space-y-4">
                      <div className="flex items-center justify-between gap-4 border-b border-purple-200 pb-4">
                        <div>
                          <h3 className="text-2xl text-purple-900 font-extrabold">🔮 Hợp nhất Pokémon</h3>
                          <p className="text-xs text-purple-950/70 mt-1">Chọn đúng 2 Pokémon để hợp nhất thành 1 Pokémon mới. Hai Pokémon cũ sẽ biến mất, còn các skills đã mua và vẫn còn hiệu lực sẽ được giữ lại.</p>
                        </div>
                        <span className="shrink-0 bg-white text-purple-900 border border-purple-200 px-3 py-1.5 rounded-full text-xs font-black">
                          Đã chọn {selectedFusionPetDexIds.length}/2
                        </span>
                      </div>

                      {getFusionCandidates(editingStudent).length < 2 ? (
                        <div className="bg-white border border-purple-100 rounded-3xl p-8 text-center space-y-3">
                          <div className="text-5xl">🥚</div>
                          <p className="text-sm font-black text-purple-900">Cần tối thiểu 2 Pokémon để hợp nhất.</p>
                          <p className="text-xs text-purple-700/70">Hãy ấp thêm trứng hoặc chọn lại Pokémon sở hữu trước khi dung hợp.</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {getFusionCandidates(editingStudent).map((p, index) => {
                              const isSelected = selectedFusionPetDexIds.includes(index);
                              const skillNames = (p.skills || [])
                                .map(skillId => petSkills.find(skill => skill.id === skillId)?.name || skillId)
                                .slice(0, 3);
                              return (
                                <button
                                  type="button"
                                  key={`${p.dexId}-${p.name}-${index}`}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedFusionPetDexIds(prev => prev.filter(x => x !== index));
                                      return;
                                    }
                                    if (selectedFusionPetDexIds.length >= 2) {
                                      alert("Chỉ được chọn tối đa 2 Pokémon để hợp nhất!");
                                      return;
                                    }
                                    setSelectedFusionPetDexIds(prev => [...prev, index]);
                                  }}
                                  className={`text-left bg-white p-4 rounded-3xl border-2 transition-all flex items-center gap-4 ${isSelected ? 'border-purple-700 ring-4 ring-purple-100 shadow-lg' : 'border-purple-100 hover:border-purple-300'}`}
                                >
                                  <img
                                    src={getPokemonArtworkUrl(p)}
    	                                onError={event => handlePokemonArtworkError(event, p)}
                                    className="w-16 h-16 object-contain shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-black text-sm text-purple-950 truncate">{p.isShiny ? '✨ ' : ''}{getPokemonDisplayName(p)}</h4>
                                      {isSelected && <span className="text-xs bg-purple-700 text-white px-2 py-0.5 rounded-full font-black">CHỌN</span>}
                                    </div>
                                    <p className="text-xs font-black text-purple-600 mt-1">{p.types.join(' / ')}</p>
                                    <p className="text-xs text-stone-500 mt-2 line-clamp-2">
                                      {skillNames.length > 0 ? `Skills: ${skillNames.join(', ')}` : 'Chưa có skill đã mua'}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <button
                            disabled={selectedFusionPetDexIds.length !== 2}
                            onClick={() => handleFuseSelectedPokemons(editingStudent.id)}
                            className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-40 disabled:hover:bg-purple-700 text-white py-4 rounded-2xl font-black text-xs shadow-lg transition-all"
                          >
                            🔮 Hợp Nhất 2 Pokémon Đã Chọn
                          </button>
                        </>
                      )}
                    </div>
                  </div>
  );
};
