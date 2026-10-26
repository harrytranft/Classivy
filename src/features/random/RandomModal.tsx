import React from 'react';
import { BOSS_PARTY_SIZE } from '../../domain/bossSystem';
import { BossBattlePanel } from '../../components/BossBattlePanel';
import { StudentAvatar } from '../../components/StudentAvatar';
import { PokemonMiniStatus } from '../../components/PokemonMiniStatus';
import { useApp } from '../../app/AppContext';

export const RandomModal: React.FC = () => {
  const {
    activeBossParty, activeBossRound, battleResultSummary, battleScoreA, battleScoreB,
    battleStudentA, battleStudentB, bossRoundResolving, bossRoundVisualResult,
    currentBossFrequencyOption, currentBossState, currentBossTopContributors, handleRandom,
    handleResolveBattle, handleResolveBossRound, handleUsePetSkill, openBattleLudoTurns,
    petSkills, randomMode, randomStudent, setBattleScoreA, setBattleScoreB, setFeedbackSource,
    setRandomStudent, setShowRandomModal, setShowSkillModal, showRandomModal, students
  } = useApp();
  return (
    <>
      {showRandomModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowRandomModal(false); }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
        >
          <div className="bg-white p-6 sm:p-8 rounded-[40px] w-full max-w-5xl text-center shadow-2xl animate-in zoom-in duration-300 relative border-4 border-red-800 my-auto">
            <button 
              onClick={() => setShowRandomModal(false)} 
              className="absolute top-5 right-5 text-3xl text-gray-400 hover:text-red-800 transition-colors z-20"
            >
              &times;
            </button>

            {/* MODE SWITCHER TABS */}
            <div className="flex items-center justify-center gap-2 mb-6 bg-red-50 p-1.5 rounded-full border border-red-200 w-fit mx-auto">
              <button 
                onClick={() => handleRandom('solo')} 
                className={`px-5 py-2 rounded-full font-bold text-xs transition-all uppercase tracking-wider ${randomMode === 'solo' ? 'bg-red-800 text-white shadow-md' : 'text-red-900 hover:bg-red-100'}`}
              >
                👤 Chế độ Solo
              </button>
              <button 
                onClick={() => handleRandom('battle')} 
                className={`px-5 py-2 rounded-full font-bold text-xs transition-all uppercase tracking-wider ${randomMode === 'battle' ? 'bg-red-800 text-white shadow-md' : 'text-red-900 hover:bg-red-100'}`}
              >
                ⚔️ Chế độ Battle
              </button>
              <button
                onClick={() => handleRandom('boss')}
                className={`px-5 py-2 rounded-full font-bold text-xs transition-all uppercase tracking-wider ${randomMode === 'boss' ? 'bg-red-800 text-white shadow-md' : 'text-red-900 hover:bg-red-100'}`}
              >
                👹 Boss
              </button>
            </div>

            {/* BOSS MODE */}
            {randomMode === 'boss' && (
              <>
                {activeBossRound && currentBossState && activeBossParty.length === BOSS_PARTY_SIZE ? (
                  <BossBattlePanel
                    boss={currentBossState.boss}
                    party={activeBossParty}
                    topContributors={currentBossTopContributors}
                    randomsSinceLastEncounter={currentBossState.randomsSinceLastEncounter}
                    nextEncounterAt={currentBossState.nextEncounterAt}
                    frequencyLabel={currentBossFrequencyOption.label}
                    resolving={bossRoundResolving}
                    visualResult={bossRoundVisualResult}
                    onSuccess={() => handleResolveBossRound('success')}
                    onFailure={() => handleResolveBossRound('failure')}
                  />
                ) : (
                  <div className="mx-auto max-w-2xl rounded-[32px] border-2 border-red-100 bg-red-50 p-8 text-center">
                    <div className="text-6xl">👹</div>
                    <h2 className="mt-4 text-3xl font-royal text-red-900">Boss đang ẩn nấp</h2>
                    <p className="mt-3 text-sm font-bold text-red-800">
                      Boss vẫn đang ở đâu đó. Tiếp tục Random Solo/Battle để tìm Boss.
                    </p>
                    <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-red-700">
                      {currentBossState
                        ? `Boss Frequency: ${currentBossFrequencyOption.label} · ${currentBossState.randomsSinceLastEncounter}/${currentBossState.nextEncounterAt} Random`
                        : 'Chọn một lớp cụ thể để kích hoạt Boss Raid per-class.'}
                    </p>
                    {currentBossState && (
                      <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-4 text-left">
                        <p className="text-xs font-black text-amber-950">
                          Boss hiện tại: {currentBossState.boss.icon} {currentBossState.boss.name}
                        </p>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${Math.max(0, Math.min(100, (currentBossState.boss.currentHp / currentBossState.boss.maxHp) * 100))}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] font-black text-stone-500">
                          HP {currentBossState.boss.currentHp}/{currentBossState.boss.maxHp}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => handleRandom()}
                      className="mt-5 w-full rounded-2xl bg-amber-500 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-amber-600"
                    >
                      🎲 Random Tiếp
                    </button>
                  </div>
                )}
              </>
            )}

            {/* SOLO MODE */}
            {randomMode === 'solo' && randomStudent && (
              <>
                <h2 className="text-2xl font-royal text-red-800 mb-6 uppercase tracking-wider">Kén Chọn Ngẫu Nhiên (Solo)</h2>

                <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="relative">
                    <StudentAvatar student={randomStudent} className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-red-800 shadow-xl" />
                    <div className="absolute top-0 right-0 bg-red-800 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold border-2 border-white shadow text-sm">
                      {randomStudent.points}
                    </div>
                  </div>

                  <PokemonMiniStatus
                    pet={randomStudent.pet}
                    progress={randomStudent.pokemonProgress}
                    tone="amber"
                    className="w-64 max-w-[58vw]"
                  />
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{randomStudent.name}</h3>
                  <p className="opacity-50 font-black uppercase tracking-widest text-xs mt-1">{randomStudent.className}</p>
                </div>

                {/* SKILLS BOUGHT FOR POKEMON DISPLAY & USE DIRECTLY */}
                {randomStudent.pet?.skills && randomStudent.pet.skills.length > 0 && (
                  <div className="mb-6 p-4 bg-indigo-50/60 rounded-3xl border border-indigo-100 text-left">
                    <p className="text-[10px] font-black uppercase text-indigo-900 tracking-wider mb-2">⚡ Tuyệt Chiêu Pokémon Có Thể Kích Hoạt (Tối Đa 2 Lần):</p>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                      {randomStudent.pet.skills.map(skId => {
                        const sk = petSkills.find(x => x.id === skId);
                        if (!sk) return null;
                        const currentUses = randomStudent.pet?.skillUses?.[skId] || 0;
                        const remainingUses = Math.max(0, 2 - currentUses);
                        return (
                          <div key={skId} className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-indigo-200 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xl">{sk.icon}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">{sk.name}</p>
                                <span className="text-[9px] text-indigo-600 font-semibold">Còn {remainingUses}/2 lượt</span>
                              </div>
                            </div>
                            <button
                              disabled={remainingUses <= 0}
                              onClick={() => {
                                handleUsePetSkill(randomStudent.id, skId, sk.name);
                                const updated = students.find(s => s.id === randomStudent.id);
                                if (updated) setRandomStudent(updated);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-black text-[9px] px-3 py-1.5 rounded-xl uppercase tracking-wider shrink-0"
                            >
                              Sử Dụng
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => { setFeedbackSource('solo'); setShowSkillModal(true); }} 
                    className="flex-1 bg-red-800 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg hover:bg-red-900 uppercase tracking-wider"
                  >
                    Ban Thưởng / Phạt
                  </button>
                  <button 
                    onClick={() => handleRandom()} 
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <span>🎲</span> Random Tiếp
                  </button>
                </div>
                <button 
                  onClick={() => setShowRandomModal(false)} 
                  className="mt-3 text-gray-400 font-bold py-1 uppercase text-xs hover:text-gray-600"
                >
                  Đóng lại
                </button>
              </>
            )}

            {/* BATTLE MODE */}
            {randomMode === 'battle' && battleStudentA && battleStudentB && (
              <>
                <h2 className="text-2xl font-royal text-red-800 mb-2 uppercase tracking-wider">⚡ Trận Quyết Đấu (Battle) ⚡</h2>
                <p className="text-xs text-gray-500 mb-6 italic">Nhập điểm hoặc bấm nút cộng điểm cho mỗi trainer. Người thắng được cộng HP theo điểm chênh lệch, người thua bị trừ HP chênh lệch!</p>

                {battleResultSummary ? (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border-4 border-amber-400 space-y-6 shadow-xl animate-in zoom-in-95 duration-200 text-left">
                    <div className="text-center space-y-2">
                      <span className="text-4xl">🏆</span>
                      <h3 className="text-2xl font-black text-amber-950 uppercase tracking-wide">
                        {battleResultSummary.winner ? `Chiến Thắng: ${battleResultSummary.winner.name}` : 'Trận Đấu Hòa!'}
                      </h3>
                      <p className="text-sm font-bold text-amber-900 whitespace-pre-line bg-white/90 p-4 rounded-2xl border border-amber-200 shadow-xs">
                        {battleResultSummary.resultMsg}
                      </p>
                    </div>

                    {/* Ordered Cá Ngựa turns after Battle */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-amber-300 space-y-3">
                      <p className="text-xs font-black uppercase text-amber-950 tracking-wider text-center">
                        🎲 Thứ Tự Lắc Cá Ngựa Sau Battle:
                      </p>
                      {battleResultSummary.ludoTurns.length > 0 ? (
                        <>
                          <div className="space-y-2">
                            {battleResultSummary.ludoTurns.map((turn, index) => {
                              const turnStudent = [battleResultSummary.studentA, battleResultSummary.studentB].find(s => s.id === turn.studentId);
                              if (!turnStudent) return null;
                              return (
                                <div key={`${turn.studentId}-${index}`} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                                  <span className="text-xs font-black text-amber-950">{index + 1}. {turnStudent.name}</span>
                                  <span className="text-[10px] font-black uppercase text-amber-700">
                                    {turn.role === 'winner' ? 'Thắng - lắc trước' : turn.role === 'loser' ? 'Thua - lắc sau' : 'Hòa'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => {
                              setShowRandomModal(false);
                              openBattleLudoTurns(battleResultSummary.ludoTurns);
                            }}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all border-2 border-amber-400"
                          >
                            <span>🎲</span> Mở Cá Ngựa Theo Thứ Tự
                          </button>
                        </>
                      ) : (
                        <p className="rounded-xl bg-rose-50 p-3 text-center text-xs font-black text-rose-700">
                          Không có lượt Cá Ngựa hợp lệ vì điểm Battle không lớn hơn 0.
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleRandom('battle')} 
                        className="flex-1 bg-red-800 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-red-900 shadow"
                      >
                        ⚔️ Quyết Đấu Trận Mới
                      </button>
                      <button 
                        onClick={() => setShowRandomModal(false)} 
                        className="px-5 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs uppercase hover:bg-gray-300"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {/* STUDENT A CARD */}
                      <div className="bg-amber-50/80 p-4 rounded-3xl border-2 border-amber-300 flex flex-col items-center">
                        <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                          Trainer A
                        </span>
                        <StudentAvatar student={battleStudentA} className="w-20 h-20 rounded-full border-4 border-amber-400 shadow-md mb-2" />
                        <h4 className="font-extrabold text-gray-800 text-base">{battleStudentA.name}</h4>
                        <p className="text-[10px] text-gray-500 font-bold mb-2">Hào quang: {battleStudentA.points}đ</p>

                        <PokemonMiniStatus
                          pet={battleStudentA.pet}
                          progress={battleStudentA.pokemonProgress}
                          tone="amber"
                          showImage
                          streakLabel="Battle"
                          streakValue={battleStudentA.pokemonProgress?.battleWinStreak || 0}
                          className="mb-3 w-full"
                        />

                        <div className="w-full">
                          <p className="text-[10px] font-black uppercase text-amber-800 mb-1">Điểm Battle Vòng Này:</p>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            {[-1, +1, +2, +3, +5].map(pts => (
                              <button
                                key={pts}
                                onClick={() => setBattleScoreA(prev => Math.max(-10, prev + pts))}
                                className={`px-2 py-1 rounded-lg text-xs font-black ${pts > 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
                              >
                                {pts > 0 ? `+${pts}` : pts}
                              </button>
                            ))}
                          </div>
                          <input 
                            type="number"
                            value={battleScoreA}
                            onChange={e => setBattleScoreA(parseInt(e.target.value) || 0)}
                            className="w-20 mx-auto text-center font-black text-lg border-2 border-amber-400 rounded-xl py-1 bg-white"
                          />
                        </div>
                      </div>

                      {/* STUDENT B CARD */}
                      <div className="bg-purple-50/80 p-4 rounded-3xl border-2 border-purple-300 flex flex-col items-center">
                        <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                          Trainer B
                        </span>
                        <StudentAvatar student={battleStudentB} className="w-20 h-20 rounded-full border-4 border-purple-400 shadow-md mb-2" />
                        <h4 className="font-extrabold text-gray-800 text-base">{battleStudentB.name}</h4>
                        <p className="text-[10px] text-gray-500 font-bold mb-2">Hào quang: {battleStudentB.points}đ</p>

                        <PokemonMiniStatus
                          pet={battleStudentB.pet}
                          progress={battleStudentB.pokemonProgress}
                          tone="purple"
                          showImage
                          streakLabel="Battle"
                          streakValue={battleStudentB.pokemonProgress?.battleWinStreak || 0}
                          className="mb-3 w-full"
                        />

                        <div className="w-full">
                          <p className="text-[10px] font-black uppercase text-purple-800 mb-1">Điểm Battle Vòng Này:</p>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            {[-1, +1, +2, +3, +5].map(pts => (
                              <button
                                key={pts}
                                onClick={() => setBattleScoreB(prev => Math.max(-10, prev + pts))}
                                className={`px-2 py-1 rounded-lg text-xs font-black ${pts > 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
                              >
                                {pts > 0 ? `+${pts}` : pts}
                              </button>
                            ))}
                          </div>
                          <input 
                            type="number"
                            value={battleScoreB}
                            onChange={e => setBattleScoreB(parseInt(e.target.value) || 0)}
                            className="w-20 mx-auto text-center font-black text-lg border-2 border-purple-400 rounded-xl py-1 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={handleResolveBattle} 
                        className="flex-1 bg-red-800 text-white py-3.5 rounded-2xl font-black text-sm shadow-xl hover:bg-red-900 uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <span>⚔️</span> Chốt Trận & Trao Thưởng
                      </button>
                      <button 
                        onClick={() => handleRandom()} 
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <span>🎲</span> Random Tiếp
                      </button>
                    </div>
                  </>
                )}
                <button 
                  onClick={() => setShowRandomModal(false)} 
                  className="mt-3 text-gray-400 font-bold py-1 uppercase text-xs hover:text-gray-600"
                >
                  Đóng lại
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
