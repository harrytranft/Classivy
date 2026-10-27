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
  return (
    <>
      {showLudoModal && (
        <div className="fixed inset-0 z-[120] flex flex-col overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(250,204,21,0.28),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(239,68,68,0.24),transparent_34%),linear-gradient(135deg,#1e1207,#451a03_48%,#111827)] backdrop-blur-md animate-in fade-in duration-300">
          <div className="border-b-4 border-amber-400/80 bg-black/45 p-4 px-6 text-amber-100 shadow-2xl backdrop-blur-xl shrink-0 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-200/60 bg-amber-300 text-3xl shadow-[0_0_28px_rgba(251,191,36,0.55)]">🐴</span>
              <div>
                <h2 className="text-xl font-royal uppercase tracking-widest text-amber-300">Đường Đua Cá Ngựa (50 Ô)</h2>
                <p className="text-[10px] text-amber-100/85">Lớp {activeLudoClassName || 'Chưa chọn'} - 1 ô chỉ có 1 trainer đứng, trừ ô 0.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={ludoRolling || battleLudoQueue.length > 0}
                onClick={handleRandomFromLudo}
                className="rounded-xl border border-emerald-300/70 bg-emerald-500/25 px-5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all hover:bg-emerald-500/35 disabled:cursor-not-allowed disabled:opacity-45"
                title={battleLudoQueue.length > 0 ? 'Hoàn tất queue Cá Ngựa trước khi Random tiếp.' : 'Quay lại Random tiếp'}
              >
                🎲 Random Tiếp
              </button>
              <button onClick={() => { setBattleLudoQueue([]); setLudoReturnHint(null); closeLudoPage(); }} className="rounded-xl border border-amber-300/70 bg-amber-400/20 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-amber-400/30">
                ← Quay Lại Lớp
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6">
            {/* Left side: Interactive Board */}
            <div className="flex-1 rounded-[34px] border-4 border-amber-300/90 bg-white/88 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl space-y-5">
              <div className="flex flex-col gap-3 border-b border-amber-200 pb-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h3 className="font-extrabold text-amber-950 text-base">Battle Race Board - Ô 0 đến {LUDO_FINISH_TILE}</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Càng gần đích càng nhiều bẫy lùi, restart và quái vật giữ cổng.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={activeLudoClassName}
                    onChange={e => {
                      setLudoClassName(e.target.value);
                      setLudoActiveStudent(null);
                      setBattleLudoQueue([]);
                      setLudoReturnHint(null);
                      setLudoDice(null);
                    }}
                    className="bg-amber-100 text-amber-950 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-black outline-none"
                  >
                    {classOptions.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Tổng trainer: {ludoRaceStudents.length}</span>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800">
                    Ô đặc biệt: {ludoSpecialTileCount}/50 ({Math.round((ludoSpecialTileCount / 50) * 100)}%)
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">Đích xong về ô 0</span>
                </div>
              </div>

              {/* Grid of 50 tiles */}
              <div className="grid grid-cols-5 gap-2 rounded-[30px] border-2 border-amber-200 bg-gradient-to-br from-amber-100 via-orange-50 to-red-100 p-3 shadow-inner sm:grid-cols-10">
                {Array.from({ length: 50 }).map((_, tileIdx) => {
                  const spec = effectiveLudoTiles[tileIdx];
                  const studentsOnTile = ludoRaceStudents.filter(s => (ludoPositions[s.id] || 0) === tileIdx);
                  const hasActiveStudent = studentsOnTile.some(st => st.id === ludoActiveStudent?.id);

                  return (
                    <div 
                      key={tileIdx} 
                      className={`relative flex min-h-[78px] flex-col items-center justify-between rounded-2xl border-2 p-1.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[88px] ${
                        tileIdx === 0 ? 'bg-gradient-to-b from-green-100 to-emerald-50 border-green-500' :
                        tileIdx === LUDO_FINISH_TILE ? 'bg-gradient-to-b from-yellow-200 via-amber-100 to-orange-100 border-yellow-500 shadow-[0_0_24px_rgba(250,204,21,0.45)]' :
                        spec?.type === 'monster' ? 'bg-gradient-to-b from-red-100 to-rose-50 border-red-500' :
                        spec?.type === 'curse' ? 'bg-gradient-to-b from-purple-100 to-fuchsia-50 border-purple-500' :
                        spec?.type === 'portal' ? 'bg-gradient-to-b from-blue-100 to-sky-50 border-blue-500' :
                        spec?.type === 'treasure' ? 'bg-gradient-to-b from-amber-100 to-yellow-50 border-amber-500' : 'bg-gradient-to-b from-stone-50 to-amber-50/30 border-stone-200 hover:border-amber-400'
                      } ${hasActiveStudent ? 'ring-4 ring-cyan-300/70 scale-[1.03]' : ''}`}
                    >
                      <div className="flex justify-between items-center w-full px-1">
                        <span className="text-[10px] font-black text-amber-950">{tileIdx}</span>
                        {spec && <span className="text-sm drop-shadow-xs">{spec.icon}</span>}
                        {tileIdx === 0 && <span className="text-[7px] font-black bg-green-700 text-white px-1 py-0.2 rounded uppercase tracking-wider">XUẤT PHÁT</span>}
                        {tileIdx === LUDO_FINISH_TILE && <span className="rounded bg-yellow-600 px-1 text-[7px] font-black uppercase tracking-wider text-white">ĐÍCH</span>}
                      </div>

                      <div className="flex flex-wrap justify-center gap-1 my-1 z-10">
                        {studentsOnTile.map(st => (
                          <motion.div 
                            key={st.id} 
                            layout 
                            initial={{ scale: 0.6, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="relative group"
                          >
                            <StudentAvatar student={st} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-amber-900 shadow-md ring-2 ring-amber-300 transform group-hover:scale-125 transition-transform duration-200" />
                            <div className="absolute -bottom-1 -right-1 bg-amber-900 text-amber-100 text-[8px] font-black px-1 rounded-full border border-white shadow-xs max-w-[36px] truncate">
                              {st.name.split(' ').pop()}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Logs area - High contrast & readable */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border-2 border-amber-300 shadow-md space-y-2">
                <p className="text-amber-950 font-black text-xs uppercase tracking-wider border-b border-amber-200 pb-1 flex items-center gap-1.5">
                  <span>📜</span> Nhật ký đua cá ngựa:
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {ludoLogs.map((log, i) => (
                    <div key={i} className="text-xs font-bold text-amber-950 bg-white/90 p-2.5 rounded-xl border border-amber-200 shadow-2xs leading-snug">
                      {log}
                    </div>
                  ))}
                  {ludoLogs.length === 0 && <p className="text-amber-800/60 italic text-xs">Chưa có lượt lắc xí ngầu nào...</p>}
                </div>
              </div>
            </div>

            {/* Right side: Dice Roller Control */}
            <div className="flex w-full shrink-0 flex-col justify-between space-y-6 rounded-[34px] border-4 border-amber-300/90 bg-white/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:w-[21rem] xl:w-[22rem]">
              <div>
                <h3 className="mb-4 border-b border-amber-200 pb-3 text-lg font-extrabold text-amber-950">Lượt Đua Tiếp Theo</h3>

                <div className="space-y-3">
                  {battleLudoQueue.length > 0 ? (
                    <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-3 shadow-inner">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-amber-900">
                        Queue {ludoReturnHint === 'boss' ? 'Boss' : ludoReturnHint === 'solo' ? 'Solo' : 'Battle'} tự động
                      </p>
                      <div className="space-y-1.5">
                        {battleLudoQueue.map((turn, index) => {
                          const queuedStudent = ludoRaceStudents.find(s => s.id === turn.studentId) || students.find(s => s.id === turn.studentId);
                          if (!queuedStudent) return null;
                          return (
                            <div key={`${turn.studentId}-${index}`} className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-black ${index === 0 ? 'bg-amber-600 text-white' : 'bg-white text-amber-950 border border-amber-200'}`}>
                              <span>{index + 1}. {queuedStudent.name}</span>
                              <span className="text-[9px] uppercase">{turn.role === 'winner' ? 'Thắng' : turn.role === 'loser' ? 'Thua' : turn.role === 'boss' ? 'Boss' : 'Hòa'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <label className="text-[10px] font-black uppercase text-amber-900 block">Chọn Trainer Trả Lời Đúng:</label>
                      <select
                        value={ludoActiveStudent?.id || ''}
                        onChange={e => {
                          const st = ludoRaceStudents.find(s => s.id === e.target.value) || null;
                          setLudoActiveStudent(st);
                        }}
                        className="w-full border-2 border-amber-300 p-3 rounded-2xl text-sm font-bold outline-none bg-amber-50/50"
                      >
                        <option value="">-- Chọn trainer lắc xí ngầu --</option>
                        {ludoRaceStudents.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.className}) - Ô {ludoPositions[s.id] || 0}</option>
                        ))}
                      </select>
                    </>
                  )}

                  {ludoActiveStudent && (
                    <div className="flex items-center gap-3 rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-100 via-white to-orange-100 p-4 shadow-lg">
                      <StudentAvatar student={ludoActiveStudent} className="h-14 w-14 rounded-2xl border-2 border-amber-600 shadow-md" />
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-amber-950 text-sm">{ludoActiveStudent.name}</h4>
                        <p className="text-[10px] font-bold text-amber-800">Đang ở ô: {ludoPositions[ludoActiveStudent.id] || 0} / {LUDO_FINISH_TILE}</p>
                        {(ludoBonusRolls[ludoActiveStudent.id] || 0) > 0 && (
                          <span className="text-[9px] font-black text-blue-700 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded">🎁 Còn {ludoBonusRolls[ludoActiveStudent.id]} lượt lắc bonus</span>
                        )}
                        {ludoMonsterStuck[ludoActiveStudent.id] && (
                          <span className="text-[9px] font-black text-red-600 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded">👹 Đang bị Quái vật kẹt! Cần lắc xí ngầu 6</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dice Box */}
              <div className="space-y-4 border-t border-amber-200 py-4 text-center">
                <div className={`mx-auto flex h-28 w-28 items-center justify-center rounded-[32px] border-4 border-amber-800 text-6xl font-black shadow-[inset_0_8px_18px_rgba(120,53,15,0.18),0_18px_40px_rgba(180,83,9,0.28)] transition-transform ${ludoRolling ? 'animate-spin bg-amber-200' : 'bg-gradient-to-br from-white via-amber-100 to-orange-200 text-amber-950'}`}>
                  {ludoRolling ? '🎲' : ludoDice !== null ? ludoDice : '🎲'}
                </div>

                <button 
                  disabled={!ludoActiveStudent || ludoRolling}
                  onClick={() => {
                    if (!ludoActiveStudent) return;
                    handleLudoRollDice(ludoActiveStudent, { isBonusRoll: (ludoBonusRolls[ludoActiveStudent.id] || 0) > 0 });
                  }}
                  className="w-full rounded-2xl bg-gradient-to-r from-red-700 via-amber-600 to-orange-600 py-4 text-sm font-black uppercase tracking-wider text-white shadow-xl transition-all hover:scale-[1.02] hover:shadow-[0_18px_45px_rgba(180,83,9,0.35)] disabled:scale-100 disabled:opacity-40"
                >
                  {ludoRolling
                    ? 'Đang Đổ Xí Ngầu...'
                    : ludoActiveStudent && (ludoBonusRolls[ludoActiveStudent.id] || 0) > 0
                      ? `🎁 Lắc Bonus (còn ${ludoBonusRolls[ludoActiveStudent.id]} lượt)`
                      : '🎲 Trả Lời Đúng & Lắc Xí Ngầu (+1đ)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
