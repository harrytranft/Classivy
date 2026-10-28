import React from 'react';
import { StudentAvatar } from '../../components/StudentAvatar';
import { getPokemonArtworkUrl, getPokemonDisplayName, handlePokemonArtworkError } from '../../domain/pokemonProgression';
import { useApp } from '../../app/AppContext';

export const LuckyWheelModal: React.FC = () => {
  const {
    isLuckyWheelSpinning, luckyWheelBackground, luckyWheelCandidateIds,
    luckyWheelDisplayRewards, luckyWheelMode, luckyWheelPendingResult, luckyWheelRef,
    luckyWheelResult, luckyWheelRewards, luckyWheelRotation, openLudoForClass,
    closeLuckyWheel, showLuckyWheelModal, startLuckyWheelSpin, setLuckyWheelResult, setLuckyWheelPendingResult,
    students, filterClass, toggleLuckyWheelCandidate
  } = useApp();
  // Trainer có mặt của lớp đang mở, để tick chọn người được quay.
  const wheelRoster = students
    .filter(student => student.className === filterClass && !student.isAbsent)
    .sort((a, b) => a.name.localeCompare(b.name));
  const rewards = luckyWheelDisplayRewards.length > 0 ? luckyWheelDisplayRewards : luckyWheelRewards;
  const bulbCount = 24;
  const selectedCount = luckyWheelCandidateIds.filter(id => wheelRoster.some(s => s.id === id)).length;
  const result = !isLuckyWheelSpinning ? luckyWheelResult : null;
  const resultPositive = result ? ((result.reward.type === 'points' || result.reward.type === 'hp') ? (result.reward.amount || 0) >= 0 : true) : true;
  return (
    <>
      {showLuckyWheelModal && (
        <div
          className={`fixed inset-0 z-[220] flex flex-col overflow-hidden bg-[#12031a] text-white ${isLuckyWheelSpinning ? 'cl-wheel-live' : ''}`}
          style={{ ['--wheel' as string]: 'min(76vh, 64vw)' }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(217,70,239,0.35),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.22),transparent_35%),radial-gradient(circle_at_50%_110%,rgba(250,204,21,0.3),transparent_40%)]" />

          <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/15 text-3xl">🎡</span>
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-extrabold text-amber-200">Vòng Quay May Mắn</h2>
                <p className="truncate text-sm font-bold text-fuchsia-100">
                  {isLuckyWheelSpinning
                    ? 'Đang quay trong 10 giây...'
                    : luckyWheelMode === 'ludo-finish'
                      ? 'Cán đích Cá Ngựa: 60% quà tốt, 40% quà thử thách.'
                      : 'Chọn trainer được quay rồi bấm Bắt Đầu Quay.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { if (!isLuckyWheelSpinning) closeLuckyWheel(); }}
              disabled={isLuckyWheelSpinning}
              aria-label="Đóng vòng quay"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-white/20 disabled:opacity-30"
            >
              ← Quay Lại Lớp
            </button>
          </header>

          <div className="relative z-10 grid min-h-0 flex-1 gap-4 px-5 pb-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="flex min-h-0 items-center justify-center">
              <div className="relative" style={{ width: 'var(--wheel)', height: 'var(--wheel)' }}>
                <div className="cl-wheel-pointer absolute -top-3 left-1/2 z-30 h-0 w-0 -translate-x-1/2 border-l-[20px] border-r-[20px] border-t-[44px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]" style={{ transformOrigin: '50% 10%' }} />
                {/* viền đèn */}
                <div className="absolute inset-0 rounded-full border-[14px] border-amber-400 shadow-[0_0_60px_rgba(250,204,21,0.8),0_0_120px_rgba(217,70,239,0.5)]">
                  {Array.from({ length: bulbCount }).map((_, i) => {
                    const angle = (360 / bulbCount) * i;
                    return (
                      <span
                        key={i}
                        aria-hidden
                        className="cl-wheel-bulb absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-yellow-200 shadow-[0_0_10px_3px_rgba(253,224,71,0.9)]"
                        style={{ transform: `translate(-50%,-50%) rotate(${angle}deg) translateY(calc(var(--wheel) / -2 + 7px))`, animationDelay: `${(i % 2) * 0.35}s` }}
                      />
                    );
                  })}
                </div>
                <div
                  ref={luckyWheelRef}
                  className="absolute inset-[14px] overflow-hidden rounded-full"
                  style={{ background: luckyWheelBackground, transform: `rotate(${luckyWheelRotation}deg)` }}
                >
                  {rewards.map((reward, idx, arr) => {
                    const angle = idx * (360 / arr.length) + (180 / arr.length);
                    const label = reward.type === 'points' || reward.type === 'hp'
                      ? `${reward.icon}${reward.amount && reward.amount > 0 ? '+' : ''}${reward.amount}`
                      : reward.type === 'ludo_rolls'
                        ? `${reward.icon}x${Math.min(5, Math.max(1, reward.amount || 1))}`
                        : reward.icon;
                    return (
                      <span
                        key={reward.id}
                        className={`absolute left-1/2 top-1/2 select-none whitespace-nowrap font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${arr.length > 14 ? 'text-[clamp(0.85rem,2.3vh,1.35rem)]' : 'text-[clamp(1.1rem,3.2vh,2rem)]'}`}
                        style={{ transform: arr.length > 14
                          ? `translate(-50%, -50%) rotate(${angle - 90}deg) translateX(calc(var(--wheel) * 0.3))`
                          : `translate(-50%, -50%) rotate(${angle}deg) translateY(calc(var(--wheel) * -0.36)) rotate(${-angle}deg)` }}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
                <div className="absolute left-1/2 top-1/2 z-20 flex h-[24%] w-[24%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[8px] border-amber-300 bg-white text-[clamp(2rem,7vh,4.5rem)] shadow-2xl">
                  {isLuckyWheelSpinning ? '🎲' : (luckyWheelResult?.reward.icon || luckyWheelPendingResult?.reward.icon || '🎡')}
                </div>
              </div>
            </div>

            <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-[28px] border border-white/20 bg-black/35 p-4 backdrop-blur-md">
              <div>
                <p className="text-base font-black text-amber-200">Danh sách được quay</p>
                {luckyWheelMode === 'ludo-finish' ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {luckyWheelCandidateIds.map(id => {
                      const candidate = students.find(s => s.id === id);
                      if (!candidate) return null;
                      return <span key={id} className="rounded-full border border-fuchsia-300/60 bg-fuchsia-500/25 px-3 py-1.5 text-sm font-black">{candidate.name}</span>;
                    })}
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-sm font-bold text-fuchsia-100/80">Bấm vào tên để chọn hoặc bỏ chọn ({selectedCount}/{wheelRoster.length}).</p>
                    <div className="mt-2 flex max-h-[34vh] flex-wrap gap-2 overflow-y-auto pr-1 custom-scrollbar">
                      {wheelRoster.map(candidate => {
                        const checked = luckyWheelCandidateIds.includes(candidate.id);
                        return (
                          <button
                            key={candidate.id}
                            type="button"
                            aria-pressed={checked}
                            disabled={isLuckyWheelSpinning}
                            onClick={() => toggleLuckyWheelCandidate(candidate.id)}
                            className={`rounded-full border px-3 py-1.5 text-sm font-black transition-all disabled:opacity-60 ${checked ? 'border-amber-300 bg-fuchsia-600 text-white shadow-[0_0_14px_rgba(217,70,239,0.7)]' : 'border-white/25 bg-white/10 text-white/80 hover:border-fuchsia-300'}`}
                          >
                            {checked ? '✓ ' : ''}{candidate.name}
                          </button>
                        );
                      })}
                      {wheelRoster.length === 0 && <span className="text-sm font-bold text-white/60">Lớp này chưa có trainer đang có mặt.</span>}
                    </div>
                  </>
                )}
              </div>

              <div className="mt-auto space-y-3">
                <div className="grid grid-cols-2 gap-1.5 text-xs font-black">
                  <span className="rounded-xl bg-emerald-400/20 px-2 py-1.5 text-center text-emerald-100">+ Điểm tối đa 10</span>
                  <span className="rounded-xl bg-red-400/20 px-2 py-1.5 text-center text-red-100">- Điểm tối đa 10</span>
                  <span className="rounded-xl bg-amber-400/20 px-2 py-1.5 text-center text-amber-100">Tặng Pokemon</span>
                  <span className="rounded-xl bg-purple-400/25 px-2 py-1.5 text-center text-purple-100">Tặng Skill</span>
                  <span className="rounded-xl bg-teal-400/20 px-2 py-1.5 text-center text-teal-100">Cộng HP</span>
                  <span className="rounded-xl bg-blue-400/20 px-2 py-1.5 text-center text-blue-100">Lượt Cá Ngựa</span>
                </div>
                {!isLuckyWheelSpinning ? (
                  <button
                    onClick={startLuckyWheelSpin}
                    className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-fuchsia-600 to-cyan-500 py-5 text-xl font-black text-white shadow-[0_0_34px_rgba(217,70,239,0.7)] transition-all hover:brightness-110"
                  >
                    Bắt Đầu Quay
                  </button>
                ) : (
                  <div className="w-full animate-pulse rounded-2xl border border-white/30 bg-white/10 py-5 text-center text-xl font-black">Đang quay... hồi hộp chưa!</div>
                )}
              </div>
            </aside>
          </div>

          {/* Màn hình trúng thưởng */}
          {result && (
            <div role="dialog" aria-label="Kết quả vòng quay" className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              {resultPositive && Array.from({ length: 44 }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="cl-confetti"
                  style={{
                    left: `${(i * 23) % 100}%`,
                    background: ['#facc15', '#e879f9', '#22d3ee', '#4ade80', '#fb7185'][i % 5],
                    ['--cx' as string]: `${((i * 37) % 120) - 60}px`,
                    ['--cr' as string]: `${360 + ((i * 53) % 540)}deg`,
                    ['--cd' as string]: `${3 + (i % 5) * 0.5}s`,
                    ['--cdelay' as string]: `${(i % 11) * 0.12}s`
                  } as React.CSSProperties}
                />
              ))}
              <div className="cl-result-card relative max-h-full w-full max-w-xl overflow-y-auto rounded-[36px] border-4 border-amber-300 bg-gradient-to-b from-fuchsia-950 via-purple-950 to-[#12031a] p-6 text-center">
                <p className="text-sm font-black uppercase tracking-widest text-amber-300">{resultPositive ? 'Chúc mừng!' : 'Thử thách!'}</p>
                <StudentAvatar student={result.student} className="mx-auto mt-3 h-28 w-28 rounded-full border-4 border-amber-300 shadow-xl" />
                <p className="mt-2 text-sm font-black text-fuchsia-200">Trainer trúng thưởng</p>
                <h3 className="text-4xl font-black text-white">{result.student.name}</h3>
                <p className="text-sm font-bold text-white/60">{result.student.className}</p>

                <div className="mt-4 rounded-3xl border border-amber-300/50 bg-white/10 p-5">
                  <div className="text-6xl">{result.reward.icon}</div>
                  <p className="mt-1 text-3xl font-black text-amber-200">{result.reward.label}</p>
                  <p className="mt-2 text-lg font-black text-white/90">{result.message}</p>

                  {result.pokemon && (
                    <img
                      referrerPolicy="no-referrer"
                      src={getPokemonArtworkUrl(result.pokemon)}
                      onError={event => handlePokemonArtworkError(event, result.pokemon)}
                      className={`mx-auto mt-3 h-36 w-36 object-contain drop-shadow-[0_0_24px_rgba(250,204,21,0.8)] ${result.pokemon.isShiny ? 'rounded-3xl bg-amber-100/20 ring-4 ring-amber-300' : ''}`}
                      alt={getPokemonDisplayName(result.pokemon)}
                    />
                  )}
                  {result.pokemon?.isShiny && (
                    <span className="mt-2 inline-flex rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-sm font-black text-amber-800">✨ Shiny</span>
                  )}
                  {result.skill && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-purple-300/60 bg-purple-500/25 px-4 py-2 text-base font-black text-white">
                      <span className="text-3xl">{result.skill.icon}</span>
                      <span>{result.skill.name}</span>
                    </div>
                  )}
                  {result.reward.type === 'ludo_rolls' && (
                    <button
                      onClick={() => { closeLuckyWheel(); openLudoForClass(result.student.className, result.student); }}
                      className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow hover:bg-blue-700"
                    >
                      Mở Đường Đua Cá Ngựa
                    </button>
                  )}
                </div>

                <button onClick={() => { setLuckyWheelResult(null); setLuckyWheelPendingResult(null); }} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-amber-500 py-4 text-lg font-black text-white shadow-lg transition-all hover:brightness-110">
                  Hoàn tất
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
