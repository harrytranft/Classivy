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
          <div className="relative my-auto w-full max-w-5xl overflow-hidden rounded-[42px] border border-white/70 bg-white/18 shadow-[0_35px_120px_rgba(15,23,42,0.48)] backdrop-blur-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(52,211,153,0.45),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(217,70,239,0.35),transparent_25%),radial-gradient(circle_at_55%_100%,rgba(251,191,36,0.42),transparent_36%)] pointer-events-none" />
            <div className="relative z-10 grid min-h-[620px] grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
              <aside className="border-b border-white/30 bg-white/55 p-6 backdrop-blur-2xl lg:border-b-0 lg:border-r">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-700">Gift Pokémon</p>
                    <h2 className="mt-2 font-royal text-3xl uppercase text-slate-950">Tặng Pokémon</h2>
                    <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600">
                      Chọn học sinh trong {filterClass === 'Tất cả' ? 'tất cả lớp' : `lớp ${filterClass}`}. Quà sẽ nở trứng ngay và không trừ Hào Quang.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeGiftPokemonModal}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/70 bg-white/60 text-2xl font-black text-slate-500 shadow-sm transition-colors hover:text-red-800"
                    aria-label="Đóng tặng Pokémon"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-5 rounded-[28px] border border-white/70 bg-white/60 p-3 shadow-inner">
                  <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">Danh sách lớp hiện tại</p>
                  <div className="max-h-[390px] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                    {giftPokemonRoster.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-xs font-black text-slate-400">
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
                              ? 'border-emerald-300 bg-emerald-50 shadow-[0_16px_40px_rgba(16,185,129,0.18)] ring-2 ring-emerald-200'
                              : 'border-white/70 bg-white/65 hover:border-amber-200 hover:bg-amber-50/80'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <StudentAvatar student={student} className="h-12 w-12 shrink-0 rounded-2xl border-2 border-white shadow" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-950">{student.name}</p>
                            <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500">{student.className} · {student.points}đ Hào Quang</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[10px] font-black ${selected ? 'bg-emerald-600 text-white' : 'bg-white text-amber-700'}`}>
                            {eggLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              <section className="relative flex min-h-[620px] items-center justify-center overflow-hidden p-6 sm:p-8">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.25),rgba(255,255,255,0.05))]" />
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

                <div className="relative z-10 w-full max-w-xl rounded-[38px] border border-white/70 bg-white/58 p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_28px_80px_rgba(15,23,42,0.22)] backdrop-blur-2xl">
                  {giftAnimationPhase === 'select' && (
                    <div className="space-y-6">
                      <div className="mx-auto grid h-24 w-24 place-items-center rounded-[30px] border border-white/70 bg-gradient-to-br from-amber-100 via-white to-emerald-100 text-6xl shadow-xl">
                        🥚
                      </div>
                      <div>
                        <h3 className="font-royal text-4xl uppercase text-slate-950">Trứng quà tặng</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm font-bold leading-relaxed text-slate-600">
                          {giftStudentId
                            ? `${giftPokemonRoster.find(student => student.id === giftStudentId)?.name || 'Học sinh'} sẽ nhận Pokémon ngay khi trứng nở.`
                            : 'Chọn một học sinh để bắt đầu nghi thức nở trứng.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!giftStudentId || giftPokemonRoster.length === 0}
                        onClick={handleGiftPokemon}
                        className="w-full rounded-[26px] bg-gradient-to-r from-emerald-500 via-amber-500 to-fuchsia-500 py-4 text-sm font-black uppercase tracking-wider text-white shadow-[0_20px_48px_rgba(217,70,239,0.28)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
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
