import React from 'react';
import { StudentAvatar } from '../../components/StudentAvatar';
import { getPokemonArtworkUrl, getPokemonDisplayName, handlePokemonArtworkError } from '../../domain/pokemonProgression';
import { useApp } from '../../app/AppContext';

export const SkillPointsModal: React.FC = () => {
  const {
    activeTab, feedbackSource, handleUpdatePoints, manualPoints, selectedStudentIds,
    setActiveTab, setCurrentScreen, setFeedbackSource, setManualPoints, setShowSkillModal,
    showSkillModal, sidebarData, skills
  } = useApp();
  return (
    <>
            {showSkillModal && (
              <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md">
                <div className="bg-white w-full max-w-5xl rounded-3xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300 shadow-2xl">

                  {/* Sidebar Profile details from screenshot request */}
                  <div className="bg-gray-50 border-r w-full md:w-80 shrink-0 p-8 flex flex-col items-center">
                    {sidebarData ? (
                      <>
                        <div className="flex items-center justify-center gap-4 mb-6">
                          <div className="relative">
                            <StudentAvatar student={sidebarData.student} className="w-28 h-28 rounded-full border-4 border-white shadow-xl" />
                            <div className="absolute top-0 right-0 bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-md text-xs">
                              {sidebarData.student.points}
                            </div>
                          </div>

                          {sidebarData.student.pet && (
                            <div className="flex flex-col items-center bg-amber-50 p-2 rounded-2xl border border-amber-200 shadow-sm relative">
                              <div className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white shadow">
                                ❤️ {sidebarData.student.pet.hp ?? 100}/100
                              </div>
                              <img 
                                referrerPolicy="no-referrer"
                                src={getPokemonArtworkUrl(sidebarData.student.pet)}
      	                          onError={event => handlePokemonArtworkError(event, sidebarData.student.pet)}
                                className="w-20 h-20 object-contain drop-shadow"
                                alt={getPokemonDisplayName(sidebarData.student.pet)}
                              />
                              <span className="text-[9px] font-black text-amber-900 truncate max-w-[80px]">{getPokemonDisplayName(sidebarData.student.pet)}</span>
                              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${(sidebarData.student.pet.hp ?? 100) > 50 ? 'bg-emerald-500' : (sidebarData.student.pet.hp ?? 100) > 20 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(100, Math.max(0, sidebarData.student.pet.hp ?? 100))}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <h3 className="text-2xl font-bold text-gray-800 mb-1 text-center">{sidebarData.student.name}</h3>
                        <p className="text-xs font-black uppercase text-gray-400 mb-4">{sidebarData.student.className}</p>

                        <div className="w-full space-y-3 pt-6 border-t border-gray-200 text-center" data-testid="trainer-level-panel">
                          <p className="text-[10px] font-black uppercase text-gray-400">Trainer Level</p>
                          <p className="text-3xl font-black text-red-800">Lv.{sidebarData.trainerProgress.level}</p>
                          <p className="inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800 border border-amber-100">
                            {sidebarData.trainerTitle.icon} {sidebarData.trainerTitle.name}
                          </p>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-red-800 h-full rounded-full transition-all duration-500"
                              style={{ width: `${sidebarData.trainerLevelPct}%` }}
                            />
                          </div>
                          <p className="text-[10px] font-bold uppercase text-gray-400">
                            Trainer XP {sidebarData.trainerProgress.xp}/{sidebarData.trainerXpNeeded}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-20 opacity-20 italic">Chọn 1 trainer để xem chi tiết...</div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                      <div className="flex-1 flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800 shrink-0">
                          Feedback for {selectedStudentIds.length === 1 ? sidebarData?.student.name : `${selectedStudentIds.length} students`}
                        </h2>
                        <div className="flex items-center gap-2 bg-white border p-1 pl-3 rounded-full flex-1 max-w-[280px]">
                          <input 
                            type="number" 
                            placeholder="Gõ điểm..." 
                            className="bg-transparent text-sm font-bold flex-1 outline-none" 
                            value={manualPoints} 
                            onChange={e => setManualPoints(e.target.value)}
                          />
                          <button 
                            onClick={() => handleUpdatePoints(selectedStudentIds, parseInt(manualPoints), "Điều chỉnh thủ công", feedbackSource)}
                            className="bg-purple-600 text-white text-[10px] px-4 py-2 rounded-full font-bold hover:bg-purple-700 transition-all uppercase"
                          >
                            Lưu điểm
                          </button>
                        </div>
                      </div>
                      <button onClick={() => { setFeedbackSource('manual'); setShowSkillModal(false); }} className="ml-4 text-4xl text-gray-300 hover:text-red-800 transition-colors">&times;</button>
                    </div>

                    <div className="flex border-b px-6 bg-white shrink-0 overflow-x-auto">
                      <button onClick={() => setActiveTab('positive')} className={`px-8 py-5 font-bold transition-all whitespace-nowrap ${activeTab === 'positive' ? 'text-purple-600 border-b-4 border-purple-600' : 'opacity-40 hover:opacity-100'}`}>Positive</button>
                      <button onClick={() => setActiveTab('negative')} className={`px-8 py-5 font-bold transition-all whitespace-nowrap ${activeTab === 'negative' ? 'text-purple-600 border-b-4 border-purple-600' : 'opacity-40 hover:opacity-100'}`}>Needs work</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pb-20">
                        {skills.filter(s => s.type === (activeTab === 'positive' ? 'positive' : 'negative')).map(sk => (
                          <button 
                            key={sk.id} 
                            onClick={() => handleUpdatePoints(selectedStudentIds, sk.points, sk.name, feedbackSource)} 
                            className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group relative aspect-square"
                          >
                            <div className="text-5xl group-hover:scale-125 transition-transform duration-300">{sk.icon}</div>
                            <span className="text-xs font-bold text-center text-gray-600 uppercase tracking-tight leading-tight px-2">{sk.name}</span>
                            <span className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${sk.points > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {sk.points > 0 ? '+' : ''}{sk.points}
                            </span>
                          </button>
                        ))}
                        <button onClick={() => setCurrentScreen('settings')} className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 border-dashed border-gray-200 opacity-40 hover:opacity-100 transition-all aspect-square">
                           <div className="w-12 h-12 rounded-full border-2 border-purple-600 flex items-center justify-center text-3xl text-purple-600">+</div>
                           <span className="text-[10px] font-bold uppercase text-purple-600">Add skills</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
    </>
  );
};
