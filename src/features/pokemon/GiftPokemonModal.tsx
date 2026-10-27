import React from 'react';
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
  return (
    <>
      {showGiftPokemonModal && (
        <div className="classivy-game-modal fixed inset-0 z-[280] flex items-center justify-center overflow-y-auto bg-brand-forest-deep/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative my-auto w-full max-w-5xl overflow-hidden rounded-brand-lg border border-[#e6e2d4] bg-white shadow-[0_24px_60px_-18px_rgba(0,38,25,0.42)]">
            <div className="relative z-10 grid min-h-[620px] grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
              <aside className="border-b border-[#e6e2d4] bg-[#f4f8f1] p-6 lg:border-b-0 lg:border-r">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-brand-forest">Quà cho lớp học</p>
                    <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-brand-ink">Tặng Pokémon</h2>
                    <p className="mt-2 text-sm leading-relaxed text-brand-ink/70">
                      Chọn học sinh trong {filterClass === 'Tất cả' ? 'tất cả lớp' : `lớp ${filterClass}`}. Quà sẽ nở trứng ngay và không trừ Hào Quang.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeGiftPokemonModal}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-brand-md border border-[#d9d6ca] bg-white text-2xl font-black text-brand-ink/60 shadow-sm transition-colors hover:text-brand-forest"
                    aria-label="Đóng tặng Pokémon"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-5 rounded-brand-lg border border-[#e6e2d4] bg-white p-3 shadow-sm">
                  <p className="px-2 pb-2 text-sm font-bold text-brand-ink/70">Danh sách lớp hiện tại</p>
                  <div className="max-h-[390px] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                    {giftPokemonRoster.length === 0 ? (
                      <div className="rounded-brand-md border border-dashed border-[#d9d6ca] bg-[#f1efe7] p-6 text-center text-sm font-bold text-brand-ink/60">
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
                          disabled={giftAnimationPhase === 'hatching'}
                          onClick={() => setGiftStudentId(student.id)}
                          className={`flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition-all ${
                            selected
                              ? 'border-brand-emerald bg-white shadow-[0_8px_24px_-12px_rgba(1,74,45,0.35)] ring-2 ring-brand-leaf-soft'
                              : 'border-[#e6e2d4] bg-white hover:border-brand-emerald hover:bg-brand-cream'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <StudentAvatar student={student} className="h-12 w-12 shrink-0 rounded-2xl border-2 border-white shadow" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-brand-ink">{student.name}</p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-brand-ink/65">{student.className} · {student.points}đ Hào Quang</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${selected ? 'bg-brand-emerald text-white' : 'bg-brand-gold-light text-brand-forest-deep'}`}>
                            {eggLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              <section className="relative flex min-h-[620px] items-center justify-center overflow-hidden bg-brand-cream p-6 sm:p-8">
                {giftAnimationPhase === 'revealed' && Array.from({ length: 34 }).map((_, index) => (
                  <motion.span
                    key={index}
                    className="absolute h-2.5 w-2.5 rounded-full"
                    style={{
                      left: `${8 + (index * 17) % 84}%`,
                      top: `${8 + (index * 29) % 76}%`,
                      backgroundColor: ['#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#fb7185'][index % 5]
                    }}
                    initial={{ y: -80, opacity: 0, scale: 0.4, rotate: 0 }}
                    animate={{ y: [0, 120 + (index % 5) * 22], opacity: [0, 1, 0], scale: [0.6, 1, 0.7], rotate: 260 + index * 11 }}
                    transition={{ duration: 2.1 + (index % 4) * 0.2, delay: (index % 7) * 0.045, repeat: Infinity, repeatDelay: 1.25 }}
                  />
                ))}

                <div className="relative z-10 w-full max-w-xl rounded-brand-lg border border-[#e6e2d4] bg-white p-6 text-center shadow-[0_12px_36px_-20px_rgba(0,38,25,0.3)]">
                  {giftAnimationPhase === 'select' && (
                    <div className="space-y-6">
                      <div className="mx-auto grid h-24 w-24 place-items-center rounded-brand-lg bg-[#fff9df] text-6xl shadow-sm ring-1 ring-brand-gold/40">
                        🥚
                      </div>
                      <div>
                        <h3 className="text-3xl font-extrabold tracking-tight text-brand-ink">Trứng quà tặng</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-brand-ink/70">
                          {giftStudentId
                            ? `${giftPokemonRoster.find(student => student.id === giftStudentId)?.name || 'Học sinh'} sẽ nhận Pokémon ngay khi trứng nở.`
                            : 'Chọn một học sinh để bắt đầu nghi thức nở trứng.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!giftStudentId || giftPokemonRoster.length === 0}
                        onClick={handleGiftPokemon}
                        className="w-full rounded-brand-md bg-brand-forest py-4 text-sm font-bold text-brand-cream shadow-[0_8px_24px_-10px_rgba(0,38,25,0.45)] transition-colors hover:bg-brand-forest-deep active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Tặng và cho trứng nở ngay
                      </button>
                    </div>
                  )}

                  {giftAnimationPhase === 'hatching' && giftPokemonResult && (
                    <div className="space-y-6">
                      <div className="relative mx-auto h-56 w-56">
                        <motion.div
                          className="absolute inset-0 rounded-full bg-amber-300/40 blur-3xl"
                          animate={{ scale: [0.8, 1.22, 0.9], opacity: [0.35, 0.75, 0.45] }}
                          transition={{ duration: 0.9, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute inset-5 grid place-items-center rounded-full bg-gradient-to-br from-amber-100 via-white to-emerald-100 text-9xl shadow-[0_28px_70px_rgba(245,158,11,0.35)]"
                          animate={{ rotate: [-6, 7, -5, 6, 0], y: [0, -8, 5, -6, 0], scale: [1, 1.04, 0.98, 1.06, 1] }}
                          transition={{ duration: 0.55, repeat: Infinity }}
                        >
                          🥚
                        </motion.div>
                        <motion.div
                          className="absolute left-1/2 top-8 h-32 w-1 -translate-x-1/2 rounded-full bg-white/80"
                          animate={{ opacity: [0, 1, 0.2], scaleY: [0.2, 1, 0.5] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-700">Đang nở trứng</p>
                        <h3 className="mt-2 font-royal text-4xl uppercase text-slate-950">{giftPokemonResult.student.name}</h3>
                        <p className="mt-2 text-sm font-bold text-slate-600">Ánh sáng đang tràn ra từ quả trứng...</p>
                      </div>
                    </div>
                  )}

                  {giftAnimationPhase === 'revealed' && giftPokemonResult && (
                    <div className="space-y-5">
                      <motion.div
                        initial={{ y: 80, opacity: 0, scale: 0.65 }}
                        animate={{ y: [80, -18, 0], opacity: 1, scale: [0.65, 1.12, 1] }}
                        transition={{ duration: 0.9, ease: [0.2, 0.9, 0.2, 1] }}
                        className="relative mx-auto grid h-64 w-64 place-items-center"
                      >
                        <div className="absolute inset-2 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.55),rgba(52,211,153,0.18),transparent_70%)] blur-xl" />
                        <img
                          referrerPolicy="no-referrer"
                          src={getPokemonArtworkUrl(giftPokemonResult.pet)}
                          onError={event => handlePokemonArtworkError(event, giftPokemonResult.pet)}
                          className={`relative z-10 h-56 w-56 object-contain drop-shadow-2xl ${giftPokemonResult.pet.isShiny ? 'rounded-[34px] bg-amber-100/80 ring-4 ring-amber-300' : ''}`}
                          alt={getPokemonDisplayName(giftPokemonResult.pet)}
                        />
                      </motion.div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-700">Chúc mừng</p>
                        <h3 className="mt-2 font-royal text-4xl uppercase text-slate-950">{giftPokemonResult.student.name}</h3>
                        <p className="mt-2 text-2xl font-black text-fuchsia-900">
                          nhận được {giftPokemonResult.pet.isShiny ? 'Shiny ' : ''}{getPokemonDisplayName(giftPokemonResult.pet)}
                        </p>
                        <p className="mt-2 text-xs font-bold text-slate-500">
                          {giftPokemonResult.hadExistingEgg ? 'Trứng đang ấp đã nở ngay.' : 'Một trứng quà tặng đặc biệt đã nở ngay.'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={resetGiftPokemonFlow}
                          className="flex-1 rounded-2xl border border-white/70 bg-white/65 py-3 text-xs font-black uppercase tracking-wider text-slate-700 shadow-sm transition-colors hover:bg-white"
                        >
                          Tặng tiếp
                        </button>
                        <button
                          type="button"
                          onClick={closeGiftPokemonModal}
                          className="flex-1 rounded-2xl bg-slate-950 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-colors hover:bg-slate-800"
                        >
                          Hoàn tất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
