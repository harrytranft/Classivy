import React from 'react';
import { StudentAvatar } from '../../components/StudentAvatar';
import { getPokemonArtworkUrl, getPokemonDisplayName, handlePokemonArtworkError } from '../../domain/pokemonProgression';
import { useApp } from '../../app/AppContext';

export const LuckyWheelModal: React.FC = () => {
  const {
    isLuckyWheelSpinning, luckyWheelBackground, luckyWheelCandidateIds,
    luckyWheelDisplayRewards, luckyWheelMode, luckyWheelPendingResult, luckyWheelRef,
    luckyWheelResult, luckyWheelRewards, luckyWheelRotation, openLudoForClass,
    setLuckyWheelMode, setShowLuckyWheelModal, showLuckyWheelModal, startLuckyWheelSpin,
    students
  } = useApp();
  return (
    <>
            {showLuckyWheelModal && (
              <div
                onClick={(e) => {
                  if (e.target === e.currentTarget && !isLuckyWheelSpinning) {
                    setLuckyWheelMode('normal');
                    setShowLuckyWheelModal(false);
                  }
                }}
                className="fixed inset-0 z-[220] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md overflow-y-auto"
              >
                <div className="bg-[#17051f] w-full max-w-5xl rounded-[40px] shadow-[0_0_80px_rgba(217,70,239,0.55)] overflow-hidden animate-in zoom-in duration-300 relative border-4 border-fuchsia-500 my-auto">
                  <button
                    onClick={() => {
                      if (!isLuckyWheelSpinning) {
                        setLuckyWheelMode('normal');
                        setShowLuckyWheelModal(false);
                      }
                    }}
                    disabled={isLuckyWheelSpinning}
                    className="absolute top-5 right-5 text-3xl text-white/70 hover:text-white disabled:opacity-30 transition-colors z-20"
                  >
                    &times;
                  </button>

                  <div className="bg-gradient-to-r from-red-950 via-fuchsia-900 to-purple-950 text-white p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_30%,rgba(250,204,21,0.45),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.35),transparent_24%),radial-gradient(circle_at_50%_90%,rgba(217,70,239,0.45),transparent_30%)]" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-14 h-14 rounded-3xl bg-white/15 border border-white/30 flex items-center justify-center text-4xl shadow-inner">
                        🎡
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-royal uppercase tracking-wider text-amber-200">Vòng Quay May Mắn</h2>
                        <p className="text-xs sm:text-sm text-fuchsia-100 font-bold mt-1">
                          {isLuckyWheelSpinning
                            ? 'Đang quay trong 10 giây...'
                            : luckyWheelMode === 'ludo-finish'
                              ? 'Cán đích Cá Ngựa: 60% quà tốt, 40% quà thử thách.'
                              : 'Bấm quay để bắt đầu chọn trainer và phần thưởng ngẫu nhiên.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 p-6 sm:p-8 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.22),transparent_34%),linear-gradient(135deg,#3b0764,#701a75_45%,#111827)]">
                    <div className="flex flex-col items-center justify-center gap-6">
                      <div className="relative w-[min(82vw,380px)] aspect-square">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 w-0 h-0 border-l-[16px] border-r-[16px] border-t-[34px] border-l-transparent border-r-transparent border-t-red-800 drop-shadow-lg" />
                        <div
                          ref={luckyWheelRef}
                          className="absolute inset-0 rounded-full border-[10px] border-amber-300 shadow-[0_0_45px_rgba(250,204,21,0.85),0_0_90px_rgba(217,70,239,0.5)] overflow-hidden"
                          style={{
                            background: luckyWheelBackground,
                            transform: `rotate(${luckyWheelRotation}deg)`
                          }}
                        >
                          {(luckyWheelDisplayRewards.length > 0 ? luckyWheelDisplayRewards : luckyWheelRewards).map((reward, idx, arr) => {
                            const angle = idx * (360 / arr.length) + (180 / arr.length);
                            const label = reward.type === 'points' || reward.type === 'hp'
                              ? `${reward.icon}${reward.amount && reward.amount > 0 ? '+' : ''}${reward.amount}`
                              : reward.type === 'ludo_rolls'
                                ? `${reward.icon}x${Math.min(5, Math.max(1, reward.amount || 1))}`
                              : reward.icon;
                            return (
                              <span
                                key={reward.id}
                                className="absolute left-1/2 top-1/2 text-sm sm:text-base font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none"
                                style={{
                                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(calc(-1 * min(34vw, 150px))) rotate(${-angle}deg)`
                                }}
                              >
                                {label}
                              </span>
                            );
                          })}
                        </div>
                        <div className="absolute inset-[35%] rounded-full bg-white border-8 border-amber-300 shadow-xl flex items-center justify-center text-5xl z-20">
                          {isLuckyWheelSpinning ? '🎲' : (luckyWheelResult?.reward.icon || luckyWheelPendingResult?.reward.icon || '🎡')}
                        </div>
                        <div className="absolute -inset-6 rounded-full border border-amber-300/30 shadow-[0_0_60px_rgba(250,204,21,0.55)] pointer-events-none" />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-xl text-xs font-black uppercase tracking-wide">
                        <div className="bg-emerald-100 text-emerald-800 rounded-2xl px-3 py-2 text-center">+ Điểm tối đa 10</div>
                        <div className="bg-red-100 text-red-800 rounded-2xl px-3 py-2 text-center">- Điểm tối đa 10</div>
                        <div className="bg-amber-100 text-amber-900 rounded-2xl px-3 py-2 text-center">Tặng Pokemon</div>
                        <div className="bg-purple-100 text-purple-900 rounded-2xl px-3 py-2 text-center">Tặng Skill</div>
                        <div className="bg-teal-100 text-teal-900 rounded-2xl px-3 py-2 text-center">Cộng HP</div>
                        <div className="bg-blue-100 text-blue-900 rounded-2xl px-3 py-2 text-center">Lượt Cá Ngựa</div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="bg-white/95 rounded-3xl border border-fuchsia-100 p-5 shadow-[0_0_24px_rgba(255,255,255,0.22)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-fuchsia-900 mb-3">Danh sách được quay</p>
                        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                          {luckyWheelCandidateIds.map(id => {
                            const candidate = students.find(s => s.id === id);
                            if (!candidate) return null;
                            return (
                              <span key={id} className="bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-950 px-3 py-1.5 rounded-full text-xs font-black">
                                {candidate.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-white rounded-[32px] border-2 border-amber-200 p-6 min-h-[360px] flex flex-col items-center justify-center text-center shadow-[0_0_36px_rgba(250,204,21,0.35)]">
                        {!isLuckyWheelSpinning && !luckyWheelResult && (
                          <div className="w-full space-y-5 animate-in zoom-in-95 duration-300">
                            <div className="text-6xl drop-shadow">🎡</div>
                            <h3 className="text-3xl font-royal text-fuchsia-900 uppercase">Sẵn sàng quay</h3>
                            <p className="text-sm font-bold text-gray-500">
                              {luckyWheelMode === 'ludo-finish'
                                ? 'Lượt cán đích ưu tiên 60% phần quà tốt và 40% phần quà không tốt.'
                                : 'Kết quả sẽ được random sau khi bấm nút bên dưới.'}
                            </p>
                            <button
                              onClick={startLuckyWheelSpin}
                              className="w-full bg-gradient-to-r from-amber-500 via-fuchsia-600 to-cyan-500 hover:brightness-110 text-white py-4 rounded-2xl font-black uppercase tracking-wider shadow-[0_0_28px_rgba(217,70,239,0.6)] transition-all"
                            >
                              Bắt Đầu Quay
                            </button>
                          </div>
                        )}

                        {isLuckyWheelSpinning && (
                          <div className="space-y-4 animate-pulse">
                            <div className="text-6xl">🎡</div>
                            <h3 className="text-2xl font-royal text-fuchsia-900 uppercase">Đang quay...</h3>
                            <p className="text-sm font-bold text-gray-500">Bánh xe đang tăng tốc rồi chậm lại trong 3 giây cuối.</p>
                          </div>
                        )}

                        {!isLuckyWheelSpinning && luckyWheelResult && (
                          <div className="w-full space-y-5 animate-in zoom-in-95 duration-300">
                            <div className="flex flex-col items-center gap-3">
                              <StudentAvatar student={luckyWheelResult.student} className="w-24 h-24 rounded-full border-4 border-fuchsia-700 shadow-xl" />
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-fuchsia-700">Trainer trúng thưởng</p>
                                <h3 className="text-3xl font-black text-gray-900">{luckyWheelResult.student.name}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase">{luckyWheelResult.student.className}</p>
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-amber-50 to-fuchsia-50 rounded-3xl border border-amber-200 p-5">
                              <div className="text-5xl mb-2">{luckyWheelResult.reward.icon}</div>
                              <p className="text-2xl font-black text-fuchsia-950">{luckyWheelResult.reward.label}</p>
                              <p className="mt-2 text-base font-black text-gray-700">{luckyWheelResult.message}</p>

                              {luckyWheelResult.pokemon && (
                                <img
                                  referrerPolicy="no-referrer"
                                  src={getPokemonArtworkUrl(luckyWheelResult.pokemon)}
      	                            onError={event => handlePokemonArtworkError(event, luckyWheelResult.pokemon)}
                                  className={`w-28 h-28 object-contain mx-auto mt-3 drop-shadow ${luckyWheelResult.pokemon.isShiny ? 'rounded-3xl bg-amber-100 ring-4 ring-amber-300' : ''}`}
                                  alt={getPokemonDisplayName(luckyWheelResult.pokemon)}
                                />
                              )}
                              {luckyWheelResult.pokemon?.isShiny && (
                                <span className="mt-2 inline-flex rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800">
                                  ✨ Shiny
                                </span>
                              )}

                              {luckyWheelResult.skill && (
                                <div className="mt-3 inline-flex items-center gap-2 bg-white border border-purple-200 rounded-2xl px-4 py-2 text-purple-950 font-black text-sm">
                                  <span className="text-2xl">{luckyWheelResult.skill.icon}</span>
                                  <span>{luckyWheelResult.skill.name}</span>
                                </div>
                              )}

                              {luckyWheelResult.reward.type === 'ludo_rolls' && (
                                <button
                                  onClick={() => {
                                    setLuckyWheelMode('normal');
                                    setShowLuckyWheelModal(false);
                                    openLudoForClass(luckyWheelResult.student.className, luckyWheelResult.student);
                                  }}
                                  className="mt-4 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow"
                                >
                                  Mở Đường Đua Cá Ngựa
                                </button>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setLuckyWheelMode('normal');
                                setShowLuckyWheelModal(false);
                              }}
                              className="w-full bg-fuchsia-800 hover:bg-fuchsia-900 text-white py-3.5 rounded-2xl font-black uppercase tracking-wider shadow-lg transition-all"
                            >
                              Hoàn tất
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
    </>
  );
};
