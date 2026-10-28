import React from 'react';
import { BOSS_PARTY_SIZE } from '../../domain/bossSystem';
import { BossBattlePanel } from '../../components/BossBattlePanel';
import { StudentAvatar } from '../../components/StudentAvatar';
import { PokemonMiniStatus } from '../../components/PokemonMiniStatus';
import { useApp } from '../../app/AppContext';
import { RandomSkillsPanel } from './RandomSkillsPanel';

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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-forest-deep/60 p-4 backdrop-blur-md overflow-y-auto"
        >
          <div className="bg-white p-6 sm:p-8 rounded-brand-lg w-full max-w-5xl text-center shadow-2xl animate-in zoom-in duration-300 relative border border-[#e6e2d4] my-auto">
            <button 
              onClick={() => setShowRandomModal(false)} 
              className="absolute top-5 right-5 text-3xl text-brand-ink/45 hover:text-brand-forest transition-colors z-20"
            >
              &times;
            </button>

            {/* MODE SWITCHER TABS */}
            <div className="flex items-center justify-center gap-2 mb-6 bg-[#f4f8f1] p-1.5 rounded-full border border-brand-emerald/20 w-fit mx-auto">
              <button 
                onClick={() => handleRandom('solo')} 
                className={`px-5 py-2 rounded-full font-bold text-sm transition-colors ${randomMode === 'solo' ? 'bg-brand-forest text-brand-cream shadow-md' : 'text-brand-ink/70 hover:bg-white'}`}
              >
                👤 Chế độ Solo
              </button>
              <button 
                onClick={() => handleRandom('battle')} 
                className={`px-5 py-2 rounded-full font-bold text-sm transition-colors ${randomMode === 'battle' ? 'bg-brand-forest text-brand-cream shadow-md' : 'text-brand-ink/70 hover:bg-white'}`}
              >
                ⚔️ Chế độ Battle
              </button>
              <button
                onClick={() => handleRandom('boss')}
                className={`px-5 py-2 rounded-full font-bold text-sm transition-colors ${randomMode === 'boss' ? 'bg-brand-forest text-brand-cream shadow-md' : 'text-brand-ink/70 hover:bg-white'}`}
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
                  <div className="mx-auto max-w-2xl rounded-brand-lg border border-brand-emerald/20 bg-[#f4f8f1] p-8 text-center">
                    <div className="text-6xl">👹</div>
                    <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-ink">Boss đang ẩn nấp</h2>
                    <p className="mt-3 text-sm font-semibold text-brand-ink/70">
                      Boss vẫn đang ở đâu đó. Tiếp tục Random Solo/Battle để tìm Boss.
                    </p>
                    <p className="mt-4 rounded-brand-md bg-white px-4 py-3 text-xs font-bold text-brand-forest">
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
                        <p className="mt-1 text-xs font-black text-stone-500">
                          HP {currentBossState.boss.currentHp}/{currentBossState.boss.maxHp}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => handleRandom()}
                      className="mt-5 w-full rounded-brand-md bg-brand-forest py-3 text-xs font-bold text-brand-cream shadow-lg hover:bg-brand-forest-deep"
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
                <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-brand-ink">Chọn ngẫu nhiên</h2>

                <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="relative">
                    <StudentAvatar student={randomStudent} className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-brand-forest shadow-xl" />
                    <div className="absolute top-0 right-0 bg-brand-forest text-brand-cream w-9 h-9 rounded-full flex items-center justify-center font-bold border-2 border-white shadow text-sm">
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
                  <h3 className="text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">{randomStudent.name}</h3>
                  <p className="mt-1 text-xs font-bold text-brand-ink/60">{randomStudent.className}</p>
                </div>

                <RandomSkillsPanel key={randomStudent.id} student={students.find(item => item.id === randomStudent.id) || randomStudent} />

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => { setFeedbackSource('solo'); setShowSkillModal(true); }} 
                    className="flex-1 rounded-brand-md bg-brand-forest py-3.5 text-sm font-bold text-brand-cream shadow-lg hover:bg-brand-forest-deep"
                  >
                    Ban Thưởng / Phạt
                  </button>
                  <button 
                    onClick={() => handleRandom()} 
                    className="flex flex-1 items-center justify-center gap-2 rounded-brand-md bg-brand-gold py-3.5 text-sm font-bold text-brand-forest-deep shadow-lg hover:bg-brand-gold-dark"
                  >
                    <span>🎲</span> Random Tiếp
                  </button>
                </div>
                <button 
                  onClick={() => setShowRandomModal(false)} 
                  className="mt-3 py-1 text-xs font-bold text-brand-ink/55 hover:text-brand-forest"
                >
                  Đóng lại
                </button>
              </>
            )}

            {/* BATTLE MODE */}
            {randomMode === 'battle' && battleStudentA && battleStudentB && (
              <>
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-brand-ink">⚡ Trận quyết đấu</h2>
                <p className="mb-6 text-xs leading-relaxed text-brand-ink/65">Nhập hoặc bấm cộng điểm cho mỗi trainer. Người thắng được cộng HP theo điểm chênh lệch, người thua bị trừ tương ứng.</p>

                {battleResultSummary ? (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border-4 border-amber-400 space-y-6 shadow-xl animate-in zoom-in-95 duration-200 text-left">
                    <div className="text-center space-y-2">
                      <span className="text-4xl">🏆</span>
                      <h3 className="text-2xl font-black text-amber-950">
                        {battleResultSummary.winner ? `Chiến Thắng: ${battleResultSummary.winner.name}` : 'Trận Đấu Hòa!'}
                      </h3>
                      <p className="text-sm font-bold text-amber-900 whitespace-pre-line bg-white/90 p-4 rounded-2xl border border-amber-200 shadow-xs">
                        {battleResultSummary.resultMsg}
                      </p>
                    </div>

                    {/* Ordered Cá Ngựa turns after Battle */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-amber-300 space-y-3">
                      <p className="text-xs font-black text-amber-950 text-center">
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
                                  <span className="text-xs font-black text-amber-700">
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
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all border-2 border-amber-400"
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
                        className="flex-1 rounded-brand-md bg-brand-forest py-3 text-xs font-bold text-brand-cream shadow hover:bg-brand-forest-deep"
                      >
                        ⚔️ Quyết Đấu Trận Mới
                      </button>
                      <button 
                        onClick={() => setShowRandomModal(false)} 
                        className="rounded-brand-md bg-[#e9e7de] px-5 py-3 text-xs font-bold text-brand-ink hover:bg-[#dedbd0]"
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
                        <span className="bg-amber-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full mb-2">
                          Trainer A
                        </span>
                        <StudentAvatar student={battleStudentA} className="w-20 h-20 rounded-full border-4 border-amber-400 shadow-md mb-2" />
                        <h4 className="text-base font-extrabold text-brand-ink">{battleStudentA.name}</h4>
                        <p className="mb-2 text-xs font-bold text-brand-ink/65">Hào quang: {battleStudentA.points}đ</p>

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
                          <p className="text-xs font-black text-amber-800 mb-1">Điểm Battle Vòng Này:</p>
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
                        <span className="bg-purple-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full mb-2">
                          Trainer B
                        </span>
                        <StudentAvatar student={battleStudentB} className="w-20 h-20 rounded-full border-4 border-purple-400 shadow-md mb-2" />
                        <h4 className="text-base font-extrabold text-brand-ink">{battleStudentB.name}</h4>
                        <p className="mb-2 text-xs font-bold text-brand-ink/65">Hào quang: {battleStudentB.points}đ</p>

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
                          <p className="text-xs font-black text-purple-800 mb-1">Điểm Battle Vòng Này:</p>
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
                        className="flex flex-1 items-center justify-center gap-2 rounded-brand-md bg-brand-forest py-3.5 text-sm font-bold text-brand-cream shadow-xl hover:bg-brand-forest-deep"
                      >
                        <span>⚔️</span> Chốt Trận & Trao Thưởng
                      </button>
                      <button 
                        onClick={() => handleRandom()} 
                        className="flex flex-1 items-center justify-center gap-2 rounded-brand-md bg-brand-gold py-3.5 text-sm font-bold text-brand-forest-deep shadow-lg hover:bg-brand-gold-dark"
                      >
                        <span>🎲</span> Random Tiếp
                      </button>
                    </div>
                  </>
                )}
                <button 
                  onClick={() => setShowRandomModal(false)} 
                  className="mt-3 py-1 text-xs font-bold text-brand-ink/55 hover:text-brand-forest"
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
