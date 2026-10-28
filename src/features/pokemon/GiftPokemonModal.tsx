import React, { useState } from 'react';
import { getEggRequiredProgress } from '../../domain/eggs';
import { StudentAvatar } from '../../components/StudentAvatar';
import { motion } from 'motion/react';
import { getPokemonArtworkUrl, getPokemonDisplayName, handlePokemonArtworkError } from '../../domain/pokemonProgression';
import { useApp } from '../../app/AppContext';

export const GiftPokemonModal: React.FC = () => {
  const {
    closeGiftPokemonModal, filterClass, giftAnimationPhase, giftPokemonResult,
    giftPokemonRoster, giftStudentId, handleGiftPokemon, resetGiftPokemonFlow,
    setGiftStudentId, showGiftPokemonModal
  } = useApp();
  // Bấm vào Pokémon để vuốt ve: mỗi lần bấm nhảy một cái và bay ra vài trái tim.
  const [pets, setPets] = useState(0);
  const selectedStudent = giftPokemonRoster.find(student => student.id === giftStudentId);
  const phase = giftAnimationPhase;
  return (
    <>
      {showGiftPokemonModal && (
        <div className="fixed inset-0 z-[280] flex flex-col overflow-hidden bg-[#06201a] text-white animate-in fade-in duration-300">
          {/* Bầu trời đêm + đom đóm + đồi cỏ */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(110,231,183,0.28),transparent_45%),linear-gradient(180deg,#0b2f3a_0%,#06201a_70%)]" />
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="cl-firefly"
              style={{
                left: `${(i * 37) % 96 + 2}%`,
                top: `${(i * 53) % 70 + 5}%`,
                ['--fx' as string]: `${((i * 17) % 60) - 30}px`,
                ['--fy' as string]: `${((i * 29) % 50) - 25}px`,
                ['--fd' as string]: `${3 + (i % 6) * 0.7}s`,
                animationDelay: `${(i % 8) * 0.4}s`
              } as React.CSSProperties}
            />
          ))}
          <div aria-hidden className="pointer-events-none absolute -bottom-[22vh] left-1/2 h-[42vh] w-[150vw] -translate-x-1/2 rounded-[100%] bg-gradient-to-b from-emerald-600/70 to-emerald-950 shadow-[0_-20px_80px_rgba(16,185,129,0.35)]" />

          <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-200">Quà cho lớp học</p>
              <h2 className="truncate text-3xl font-extrabold tracking-tight">Tặng Pokémon</h2>
            </div>
            <button
              type="button"
              onClick={closeGiftPokemonModal}
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-black transition-colors hover:bg-white/20"
              aria-label="Đóng tặng Pokémon"
            >
              ← Quay Lại Lớp
            </button>
          </header>

          <div className="relative z-10 grid min-h-0 flex-1 gap-4 px-5 pb-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <aside className="flex min-h-0 flex-col rounded-[28px] border border-white/20 bg-black/35 p-3 backdrop-blur-md">
              <p className="px-2 pb-1 text-base font-black text-amber-200">Chọn trainer nhận quà</p>
              <p className="px-2 pb-2 text-xs font-semibold text-white/65">
                {filterClass === 'Tất cả' ? 'Tất cả lớp' : `Lớp ${filterClass}`} · quà nở trứng ngay, không trừ Hào Quang.
              </p>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                {giftPokemonRoster.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/30 p-6 text-center text-sm font-bold text-white/60">
                    Chưa có học sinh trong lớp này
                  </div>
                ) : giftPokemonRoster.map(student => {
                  const selected = giftStudentId === student.id;
                  const eggLabel = student.egg?.status === 'egg'
                    ? `${student.egg.progress || 0}/${getEggRequiredProgress(student.egg)}`
                    : 'Quà mới';
                  return (
                    <button
                      key={student.id}
                      type="button"
                      disabled={phase === 'hatching'}
                      onClick={() => setGiftStudentId(student.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-all ${
                        selected
                          ? 'border-amber-300 bg-emerald-400/25 shadow-[0_0_24px_rgba(110,231,183,0.45)]'
                          : 'border-white/15 bg-white/10 hover:border-emerald-300 hover:bg-white/15'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <StudentAvatar student={student} className="h-12 w-12 shrink-0 rounded-2xl border-2 border-white/80 shadow" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold">{student.name}</p>
                        <p className="truncate text-xs font-semibold text-white/65">{student.className} · {student.points}đ Hào Quang</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${selected ? 'bg-amber-300 text-emerald-950' : 'bg-white/15 text-white/85'}`}>{eggLabel}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[28px]">
              {phase === 'revealed' && Array.from({ length: 34 }).map((_, index) => (
                <motion.span
                  key={index}
                  className="absolute h-2.5 w-2.5 rounded-full"
                  style={{
                    left: `${8 + (index * 17) % 84}%`,
                    top: `${4 + (index * 29) % 40}%`,
                    backgroundColor: ['#34d399', '#fbbf24', '#c084fc', '#a9d584', '#fef08a'][index % 5]
                  }}
                  initial={{ y: -80, opacity: 0, scale: 0.4, rotate: 0 }}
                  animate={{ y: [0, 160 + (index % 5) * 30], opacity: [0, 1, 0], scale: [0.6, 1, 0.7], rotate: 260 + index * 11 }}
                  transition={{ duration: 2.1 + (index % 4) * 0.2, delay: (index % 7) * 0.045, repeat: Infinity, repeatDelay: 1.25 }}
                />
              ))}

              {phase === 'select' && (
                <div className="relative z-10 flex flex-col items-center gap-5 px-4 text-center">
                  <div className="relative">
                    <div aria-hidden className="absolute -inset-10 rounded-full bg-amber-300/30 blur-3xl" />
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-hidden
                      onClick={() => setPets(n => n + 1)}
                      className="cl-egg-bob relative grid h-[clamp(9rem,28vh,17rem)] w-[clamp(9rem,28vh,17rem)] place-items-center rounded-full bg-gradient-to-br from-amber-100 via-white to-emerald-100 text-[clamp(5rem,17vh,10rem)] shadow-[0_30px_80px_rgba(251,191,36,0.45)]"
                    >
                      🥚
                    </button>
                    <div aria-hidden className="cl-shadow-pulse mx-auto mt-3 h-4 w-40 rounded-[100%] bg-black/50 blur-md" />
                  </div>
                  <div>
                    <h3 className="text-4xl font-extrabold tracking-tight">Trứng quà tặng</h3>
                    <p className="mx-auto mt-2 max-w-md text-lg text-white/80">
                      {selectedStudent
                        ? `${selectedStudent.name} sẽ nhận Pokémon ngay khi trứng nở.`
                        : 'Chọn một học sinh để bắt đầu nghi thức nở trứng.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!giftStudentId || giftPokemonRoster.length === 0}
                    onClick={handleGiftPokemon}
                    className="w-full max-w-md rounded-2xl bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 py-5 text-lg font-black text-emerald-950 shadow-[0_0_40px_rgba(110,231,183,0.6)] transition-all hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Tặng và cho trứng nở ngay
                  </button>
                </div>
              )}

              {phase === 'hatching' && giftPokemonResult && (
                <div className="relative z-10 flex flex-col items-center gap-5 px-4 text-center">
                  <div className="relative grid h-[clamp(12rem,38vh,22rem)] w-[clamp(12rem,38vh,22rem)] place-items-center">
                    <div aria-hidden className="cl-rays absolute -inset-16 rounded-full opacity-70" style={{ background: 'conic-gradient(from 0deg, transparent 0 20deg, rgba(253,224,71,.55) 30deg, transparent 45deg 80deg, rgba(110,231,183,.5) 95deg, transparent 110deg 150deg, rgba(253,224,71,.55) 165deg, transparent 180deg 220deg, rgba(110,231,183,.5) 235deg, transparent 250deg 290deg, rgba(253,224,71,.55) 305deg, transparent 320deg)' }} />
                    <motion.div
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-amber-300/50 blur-3xl"
                      animate={{ scale: [0.8, 1.35, 0.9], opacity: [0.4, 0.9, 0.5] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                    />
                    <div className="cl-egg-shake relative grid h-[80%] w-[80%] place-items-center rounded-full bg-gradient-to-br from-amber-100 via-white to-emerald-100 text-[clamp(6rem,22vh,12rem)] shadow-[0_28px_70px_rgba(245,158,11,0.45)]">
                      🥚
                      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                        <motion.path d="M50 18 L44 34 L56 44 L46 58 L54 72" fill="none" stroke="#7c5a14" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, ease: 'easeIn' }} />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-amber-300">Đang nở trứng</p>
                    <h3 className="mt-2 text-5xl font-extrabold tracking-tight">{giftPokemonResult.student.name}</h3>
                    <p className="mt-2 text-lg text-white/80">Ánh sáng đang tràn ra từ quả trứng...</p>
                  </div>
                </div>
              )}

              {phase === 'revealed' && giftPokemonResult && (
                <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center">
                  <div aria-hidden key={`flash-${giftPokemonResult.pet.instanceId}`} className="cl-flash pointer-events-none fixed inset-0 z-50 bg-white" />
                  <motion.div
                    initial={{ y: 80, opacity: 0, scale: 0.6 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, ease: [0.2, 0.9, 0.2, 1] }}
                    className="relative"
                  >
                    <div aria-hidden className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.6),rgba(52,211,153,0.2),transparent_70%)] blur-xl" />
                    <button
                      type="button"
                      onClick={() => setPets(n => n + 1)}
                      aria-label={`Vuốt ve ${getPokemonDisplayName(giftPokemonResult.pet)}`}
                      className="relative block cursor-pointer"
                    >
                      <div key={pets} className={pets > 0 ? 'cl-hop' : ''}>
                        <img
                          referrerPolicy="no-referrer"
                          src={getPokemonArtworkUrl(giftPokemonResult.pet)}
                          onError={event => handlePokemonArtworkError(event, giftPokemonResult.pet)}
                          className={`cl-breathe relative z-10 h-[clamp(11rem,38vh,24rem)] w-[clamp(11rem,38vh,24rem)] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] ${giftPokemonResult.pet.isShiny ? 'rounded-[34px] bg-amber-100/30 ring-4 ring-amber-300' : ''}`}
                          alt={getPokemonDisplayName(giftPokemonResult.pet)}
                        />
                      </div>
                      {pets > 0 && ['💖', '✨', '💛'].map((heart, i) => (
                        <span key={`${pets}-${i}`} aria-hidden className="cl-heart" style={{ ['--hx' as string]: `${(i - 1) * 46}px`, animationDelay: `${i * 0.12}s` } as React.CSSProperties}>{heart}</span>
                      ))}
                    </button>
                    <div aria-hidden className="cl-shadow-pulse mx-auto mt-1 h-4 w-48 rounded-[100%] bg-black/60 blur-md" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-emerald-200">Chúc mừng</p>
                    <h3 className="mt-1 text-5xl font-extrabold tracking-tight">{giftPokemonResult.student.name}</h3>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-amber-200">
                      nhận được {giftPokemonResult.pet.isShiny ? 'Shiny ' : ''}{getPokemonDisplayName(giftPokemonResult.pet)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white/70">
                      {giftPokemonResult.hadExistingEgg ? 'Trứng đang ấp đã nở ngay.' : 'Một trứng quà tặng đặc biệt đã nở ngay.'} Bấm vào Pokémon để vuốt ve nhé!
                    </p>
                  </div>
                  <div className="flex w-full max-w-md gap-3">
                    <button type="button" onClick={() => { setPets(0); resetGiftPokemonFlow(); }} className="flex-1 rounded-2xl border border-white/30 bg-white/10 py-4 text-base font-bold transition-colors hover:bg-white/20">
                      Tặng tiếp
                    </button>
                    <button type="button" onClick={closeGiftPokemonModal} className="flex-1 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-400 py-4 text-base font-black text-emerald-950 shadow-lg transition-all hover:brightness-110">
                      Hoàn tất
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
};
