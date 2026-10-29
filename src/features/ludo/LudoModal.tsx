import React from 'react';
import { LUDO_FINISH_TILE } from '../../data/constants';
import { motion } from 'motion/react';
import { StudentAvatar } from '../../components/StudentAvatar';
import { useApp } from '../../app/AppContext';

export const LudoModal: React.FC = () => {
  const {
    activeLudoClassName, battleLudoQueue, classOptions, effectiveLudoTiles, handleLudoRollDice,
    handleRandomFromLudo, ludoActiveStudent, ludoBonusRolls, ludoDice, ludoLogs,
    ludoMonsterStuck, ludoPositions, ludoRaceStudents, ludoReturnHint, ludoRolling,
    ludoSpecialTileCount, setBattleLudoQueue, setLudoActiveStudent, setLudoClassName,
    setLudoDice, setLudoReturnHint, closeLudoPage, showLudoModal, students
  } = useApp();
  const lastLogs = ludoLogs.slice(0, 6);
  const rollBonus = ludoActiveStudent ? (ludoBonusRolls[ludoActiveStudent.id] || 0) : 0;
  return (
    <>
      {showLudoModal && (
        <div className="fixed inset-0 z-[120] flex flex-col overflow-hidden bg-brand-forest-deep animate-in fade-in duration-300">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b-4 border-amber-400/80 bg-black/45 px-4 py-2 text-amber-100 shadow-2xl">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-200/60 bg-amber-300 text-2xl shadow-[0_0_28px_rgba(251,191,36,0.55)]">🐴</span>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-extrabold text-amber-300">Đường Đua Cá Ngựa (50 Ô)</h2>
                <p className="truncate text-sm text-amber-100/85">Lớp {activeLudoClassName || 'Chưa chọn'} · {ludoRaceStudents.length} trainer · ô đặc biệt {ludoSpecialTileCount}/50</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <select
                aria-label="Chọn lớp đua"
                value={activeLudoClassName}
                onChange={e => {
                  setLudoClassName(e.target.value);
                  setLudoActiveStudent(null);
                  setBattleLudoQueue([]);
                  setLudoReturnHint(null);
                  setLudoDice(null);
                }}
                className="rounded-xl border border-amber-300 bg-amber-100 px-3 py-2 text-sm font-black text-amber-950 outline-none"
              >
                {classOptions.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <button
                disabled={ludoRolling || battleLudoQueue.length > 0}
                onClick={handleRandomFromLudo}
                className="rounded-xl border border-emerald-300/70 bg-emerald-500/25 px-4 py-2 text-sm font-black text-white shadow-lg transition-all hover:bg-emerald-500/35 disabled:cursor-not-allowed disabled:opacity-45"
                title={battleLudoQueue.length > 0 ? 'Hoàn tất queue Cá Ngựa trước khi Random tiếp.' : 'Quay lại Random tiếp'}
              >
                🎲 Random Tiếp
              </button>
              <button onClick={() => { setBattleLudoQueue([]); setLudoReturnHint(null); closeLudoPage(); }} className="rounded-xl border border-amber-300/70 bg-amber-400/20 px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:bg-amber-400/30">
                ← Quay Lại Lớp
              </button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_23rem]">
            {/* Bàn cờ chiếm gần hết màn hình */}
            <div className="flex min-h-0 flex-col rounded-[28px] border-4 border-amber-300/90 bg-gradient-to-br from-amber-100 via-orange-50 to-red-100 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <div className="grid min-h-0 flex-1 grid-cols-5 gap-1.5 overflow-y-auto sm:grid-cols-10 sm:grid-rows-5 sm:overflow-hidden">
                {Array.from({ length: 50 }).map((_, tileIdx) => {
                  const spec = effectiveLudoTiles[tileIdx];
                  const studentsOnTile = ludoRaceStudents.filter(s => (ludoPositions[s.id] || 0) === tileIdx);
                  const hasActiveStudent = studentsOnTile.some(st => st.id === ludoActiveStudent?.id);
                  return (
                    <div
                      key={tileIdx}
                      title={spec ? `${spec.title}: ${spec.desc}` : undefined}
                      className={`group/tile relative flex min-h-[84px] flex-col items-center justify-between rounded-xl border-2 p-1 shadow-sm transition-all sm:min-h-0 ${
                        tileIdx === 0 ? 'border-green-500 bg-gradient-to-b from-green-100 to-emerald-50' :
                        tileIdx === LUDO_FINISH_TILE ? 'border-yellow-500 bg-gradient-to-b from-yellow-200 via-amber-100 to-orange-100 shadow-[0_0_24px_rgba(250,204,21,0.45)]' :
                        spec?.type === 'monster' ? 'border-red-500 bg-gradient-to-b from-red-100 to-rose-50' :
                        spec?.type === 'curse' ? 'border-purple-500 bg-gradient-to-b from-purple-100 to-fuchsia-50' :
                        spec?.type === 'portal' ? 'border-blue-500 bg-gradient-to-b from-blue-100 to-sky-50' :
                        spec?.type === 'challenge' ? 'border-emerald-500 bg-gradient-to-b from-emerald-100 to-teal-50' :
                        spec?.type === 'treasure' ? 'border-amber-500 bg-gradient-to-b from-amber-100 to-yellow-50' : 'border-stone-200 bg-gradient-to-b from-stone-50 to-amber-50/30'
                      } ${hasActiveStudent ? 'z-10 scale-[1.04] ring-4 ring-cyan-300/80' : ''}`}
                    >
                      <div className="flex w-full items-center justify-between px-0.5">
                        <span className="text-sm font-black leading-none text-amber-950 lg:text-base">{tileIdx}</span>
                      </div>
                      {spec && <span className="text-3xl leading-none drop-shadow lg:text-4xl">{spec.icon}</span>}
                      {tileIdx === 0 && <span className="rounded bg-green-700 px-1.5 text-[11px] font-black text-white">Xuất phát</span>}
                      {tileIdx === LUDO_FINISH_TILE && <span className="rounded bg-yellow-600 px-1.5 text-[11px] font-black text-white">ĐÍCH</span>}
                      {(() => {
                        const shown = studentsOnTile.slice(0, 2);
                        const extra = studentsOnTile.slice(2);
                        const size = shown.length > 1
                          ? 'h-7 w-7 sm:h-[clamp(1.75rem,4.4vh,2.75rem)] sm:w-[clamp(1.75rem,4.4vh,2.75rem)]'
                          : 'h-10 w-10 sm:h-[clamp(2.25rem,6.2vh,4rem)] sm:w-[clamp(2.25rem,6.2vh,4rem)]';
                        return (
                          <div className="z-10 flex flex-wrap items-center justify-center gap-0.5">
                            {shown.map(st => (
                              <motion.div
                                key={st.id}
                                layout
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className="relative"
                              >
                                <StudentAvatar student={st} className={`${size} rounded-full border-2 border-amber-900 shadow-md ring-2 ring-amber-300`} />
                                {shown.length === 1 && (
                                  <div className="absolute -bottom-1 left-1/2 max-w-[64px] -translate-x-1/2 truncate rounded-full border border-white bg-amber-900 px-1.5 text-xs font-black text-amber-100 shadow">
                                    {st.name.split(' ').pop()}
                                  </div>
                                )}
                              </motion.div>
                            ))}
                            {extra.length > 0 && (
                              <>
                                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-amber-900 px-1 text-xs font-black text-amber-100">+{extra.length}</span>
                                <div role="tooltip" className={`pointer-events-none absolute ${tileIdx % 10 < 2 ? 'left-0' : tileIdx % 10 > 7 ? 'right-0' : 'left-1/2 -translate-x-1/2'} ${tileIdx >= 30 ? 'bottom-full' : 'top-full'} z-30 hidden w-max max-w-[220px] flex-wrap justify-center gap-1 rounded-2xl border-2 border-amber-400 bg-white p-2 shadow-2xl group-hover/tile:flex`}>
                                  {extra.map(st => (
                                    <div key={st.id} className="flex flex-col items-center">
                                      <StudentAvatar student={st} className="h-10 w-10 rounded-full border-2 border-amber-900" />
                                      <span className="max-w-[56px] truncate text-[11px] font-black text-amber-950">{st.name.split(' ').pop()}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bảng điều khiển bên phải */}
            <div className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-[28px] border-4 border-amber-300/90 bg-white/95 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <h3 className="border-b border-amber-200 pb-2 text-lg font-extrabold text-amber-950">Lượt Đua Tiếp Theo</h3>

              {battleLudoQueue.length > 0 ? (
                <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-3 shadow-inner">
                  <p className="mb-2 text-sm font-black text-amber-900">
                    Queue {ludoReturnHint === 'boss' ? 'Boss' : ludoReturnHint === 'solo' ? 'Solo' : 'Battle'} tự động
                  </p>
                  <div className="space-y-1.5">
                    {battleLudoQueue.map((turn, index) => {
                      const queuedStudent = ludoRaceStudents.find(s => s.id === turn.studentId) || students.find(s => s.id === turn.studentId);
                      if (!queuedStudent) return null;
                      return (
                        <div key={`${turn.studentId}-${index}`} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-black ${index === 0 ? 'bg-amber-600 text-white' : 'border border-amber-200 bg-white text-amber-950'}`}>
                          <span>{index + 1}. {queuedStudent.name}</span>
                          <span>{turn.role === 'winner' ? 'Thắng' : turn.role === 'loser' ? 'Thua' : turn.role === 'boss' ? 'Boss' : 'Hòa'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <label className="block text-sm font-black text-amber-900" htmlFor="ludo-active-student">Chọn Trainer Trả Lời Đúng:</label>
                  <select
                    id="ludo-active-student"
                    value={ludoActiveStudent?.id || ''}
                    onChange={e => setLudoActiveStudent(ludoRaceStudents.find(s => s.id === e.target.value) || null)}
                    className="w-full rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-3 text-base font-bold outline-none"
                  >
                    <option value="">-- Chọn trainer lắc xí ngầu --</option>
                    {ludoRaceStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.className}) - Ô {ludoPositions[s.id] || 0}</option>
                    ))}
                  </select>
                </>
              )}

              {ludoActiveStudent && (
                <div className="flex items-center gap-3 rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-100 via-white to-orange-100 p-3 shadow-lg">
                  <StudentAvatar student={ludoActiveStudent} className="h-16 w-16 shrink-0 rounded-2xl border-2 border-amber-600 shadow-md" />
                  <div className="min-w-0 space-y-1">
                    <h4 className="text-base font-extrabold text-amber-950">{ludoActiveStudent.name}</h4>
                    <p className="text-sm font-bold text-amber-800">Đang ở ô: {ludoPositions[ludoActiveStudent.id] || 0} / {LUDO_FINISH_TILE}</p>
                    {rollBonus > 0 && (
                      <span className="inline-block rounded border border-blue-200 bg-blue-100 px-1.5 py-0.5 text-xs font-black text-blue-700">🎁 Còn {rollBonus} lượt lắc bonus</span>
                    )}
                    {ludoMonsterStuck[ludoActiveStudent.id] && (
                      <span className="inline-block rounded border border-red-200 bg-red-100 px-1.5 py-0.5 text-xs font-black text-red-600">👹 Đang bị Quái vật kẹt! Cần lắc xí ngầu 6</span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3 border-t border-amber-200 pt-3 text-center">
                <div className={`mx-auto flex h-32 w-32 items-center justify-center rounded-[36px] border-4 border-amber-800 text-7xl font-black shadow-[inset_0_8px_18px_rgba(120,53,15,0.18),0_18px_40px_rgba(180,83,9,0.28)] transition-transform ${ludoRolling ? 'animate-spin bg-amber-200' : 'bg-gradient-to-br from-white via-amber-100 to-orange-200 text-amber-950'}`}>
                  {ludoRolling ? '🎲' : ludoDice !== null ? ludoDice : '🎲'}
                </div>
                <button
                  disabled={!ludoActiveStudent || ludoRolling}
                  onClick={() => {
                    if (!ludoActiveStudent) return;
                    handleLudoRollDice(ludoActiveStudent, { isBonusRoll: rollBonus > 0 });
                  }}
                  className="w-full rounded-2xl bg-gradient-to-r from-red-700 via-amber-600 to-orange-600 py-5 text-base font-black text-white shadow-xl transition-all hover:scale-[1.02] hover:shadow-[0_18px_45px_rgba(180,83,9,0.35)] disabled:scale-100 disabled:opacity-40"
                >
                  {ludoRolling
                    ? 'Đang Đổ Xí Ngầu...'
                    : rollBonus > 0
                      ? `🎁 Lắc Bonus (còn ${rollBonus} lượt)`
                      : '🎲 Trả Lời Đúng & Lắc Xí Ngầu (+1đ)'}
                </button>
              </div>

              <div className="min-h-0 space-y-1.5 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
                <p className="flex items-center gap-1.5 border-b border-amber-200 pb-1 text-sm font-black text-amber-950"><span>📜</span> Nhật ký đua cá ngựa</p>
                {lastLogs.map((log, i) => (
                  <div key={i} className="rounded-xl border border-amber-200 bg-white/90 p-2 text-sm font-bold leading-snug text-amber-950">{log}</div>
                ))}
                {lastLogs.length === 0 && <p className="text-sm italic text-amber-800/60">Chưa có lượt lắc xí ngầu nào...</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
