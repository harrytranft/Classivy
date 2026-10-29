import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../app/AppContext';
import { StudentAvatar } from '../../components/StudentAvatar';
import {
  WILD_RARITY_LABELS, buildCatchWheelEntries, correctRemaining, huntRemainingMs, wrongAllowedRemaining
} from '../../domain/wildHunt';
import {
  createPokemonPetFromDexId, getPokemonArtworkUrl, getPokemonDisplayName, handlePokemonArtworkError
} from '../../domain/pokemonProgression';
import { CatchWheel } from './CatchWheel';

const formatRemaining = (ms: number) => {
  const minutes = Math.ceil(ms / 60000);
  return minutes <= 1 ? 'chưa tới 1 phút' : `khoảng ${minutes} phút`;
};

// Trang /class/<lớp>/san-pokemon: săn Pokémon hoang dã trên lớp.
export const HuntPage: React.FC = () => {
  const {
    answerWildHunt, callWildCaller, classroomSettings, completeWildCatch, filterClass, finishWildHunt,
    goToClassPage, huntSessionsRef, startWildHunt, students, wildCatchResult, wildEncounter
  } = useApp();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const encounter = wildEncounter && wildEncounter.className === filterClass ? wildEncounter : null;
  const revealed = !!encounter && (encounter.status === 'caught' || !!wildCatchResult);
  const pet = useMemo(
    () => (encounter ? createPokemonPetFromDexId(encounter.dexId, undefined, { isShiny: false }) : undefined),
    [encounter?.dexId]
  );
  const settings = classroomSettings.wildHunt;
  const session = huntSessionsRef.current[filterClass];
  const studentName = (id: string | null | undefined) => students.find(s => s.id === id)?.name ?? '?';
  const currentStudent = encounter?.currentStudentId ? students.find(s => s.id === encounter.currentStudentId) : undefined;
  const back = () => goToClassPage(filterClass, null);

  const speciesName = pet ? getPokemonDisplayName(wildCatchResult?.pet ?? pet) : '';

  return (
    <div className="fixed inset-0 z-[280] flex flex-col overflow-y-auto bg-[#06201a] text-white" data-testid="hunt-page">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(110,231,183,0.25),transparent_50%),linear-gradient(180deg,#0b2f3a_0%,#06201a_70%)]" />
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-5 py-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-emerald-200">{filterClass === 'Tất cả' ? 'Tất cả lớp' : `Lớp ${filterClass}`}</p>
          <h2 className="truncate text-3xl font-extrabold tracking-tight">Săn Pokémon hoang dã</h2>
        </div>
        <button type="button" onClick={back} data-testid="hunt-back" className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-black transition-colors hover:bg-white/20">← Quay Lại Lớp</button>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-5 px-5 pb-10 pt-4 text-center">
        {!encounter && (
          <div className="mt-10 rounded-[28px] border border-white/20 bg-black/35 p-8 backdrop-blur-md" data-testid="hunt-idle">
            <p className="text-6xl" aria-hidden>🌿</p>
            <p className="mt-3 text-xl font-black">Chưa có Pokémon hoang dã nào</p>
            {!settings.enabled ? (
              <p className="mt-2 text-sm font-semibold text-white/75">Tính năng đang tắt. Bật lại trong Cài đặt → Săn Pokémon hoang dã.</p>
            ) : session?.spawned ? (
              <p className="mt-2 text-sm font-semibold text-white/75">Buổi học này Pokémon hoang dã đã xuất hiện rồi. Buổi sau sẽ có con mới.</p>
            ) : session ? (
              <p className="mt-2 text-sm font-semibold text-white/75" data-testid="hunt-countdown">Pokémon hoang dã sẽ xuất hiện sau {formatRemaining(huntRemainingMs(session, now))} nữa.</p>
            ) : (
              <p className="mt-2 text-sm font-semibold text-white/75">Giữ trang lớp mở, Pokémon hoang dã sẽ tự xuất hiện.</p>
            )}
          </div>
        )}

        {encounter && pet && (
          <>
            <img
              src={getPokemonArtworkUrl(wildCatchResult?.pet ?? pet)}
              onError={event => handlePokemonArtworkError(event, wildCatchResult?.pet ?? pet)}
              alt={revealed ? speciesName : 'Pokémon hoang dã chưa rõ'}
              className={`h-52 w-52 object-contain drop-shadow-2xl ${revealed ? '' : 'brightness-0'}`}
              data-testid="hunt-pokemon"
            />
            <p className="text-sm font-black text-emerald-200">
              Độ hiếm: {WILD_RARITY_LABELS[encounter.rarity]}{revealed ? ` · ${speciesName}` : ''}
            </p>
          </>
        )}

        {encounter?.status === 'announced' && (
          <div className="flex flex-col items-center gap-3" data-testid="hunt-announced">
            <p className="text-lg font-black">Một Pokémon hoang dã đang chờ!</p>
            <button type="button" onClick={startWildHunt} data-testid="hunt-start" className="rounded-2xl bg-emerald-500 px-8 py-3 text-lg font-black text-white shadow-lg hover:bg-emerald-400">Săn ngay</button>
          </div>
        )}

        {encounter?.status === 'hunting' && (
          <div className="flex w-full flex-col items-center gap-4" data-testid="hunt-hunting">
            <p className="text-lg font-black" data-testid="hunt-progress">
              Cần thêm {correctRemaining(encounter)} câu đúng ({encounter.correctCount}/{encounter.correctNeeded}) · còn được sai {wrongAllowedRemaining(encounter)} lần
            </p>
            {currentStudent ? (
              <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-[28px] border border-white/20 bg-black/35 p-6 backdrop-blur-md">
                <StudentAvatar student={currentStudent} className="h-20 w-20 rounded-3xl" />
                <p className="text-sm font-bold text-emerald-200">Đến lượt</p>
                <p className="text-3xl font-black" data-testid="hunt-current-name">{currentStudent.name}</p>
                <div className="mt-1 flex gap-3">
                  <button type="button" onClick={() => answerWildHunt(true)} data-testid="hunt-correct" className="rounded-2xl bg-emerald-500 px-8 py-3 text-lg font-black text-white shadow-lg hover:bg-emerald-400">Đúng ✓</button>
                  <button type="button" onClick={() => answerWildHunt(false)} data-testid="hunt-wrong" className="rounded-2xl bg-rose-500 px-8 py-3 text-lg font-black text-white shadow-lg hover:bg-rose-400">Sai ✗</button>
                </div>
                <button type="button" onClick={callWildCaller} data-testid="hunt-call" className="text-xs font-bold text-white/70 underline hover:text-white">Gọi em khác</button>
              </div>
            ) : (
              <button type="button" onClick={callWildCaller} data-testid="hunt-call" className="rounded-2xl bg-amber-400 px-8 py-3 text-lg font-black text-emerald-950 shadow-lg hover:bg-amber-300">Gọi một em</button>
            )}
          </div>
        )}

        {encounter?.status === 'caught' && !wildCatchResult && (
          <div className="flex flex-col items-center gap-3" data-testid="hunt-caught">
            <p className="text-2xl font-black text-amber-300">Bắt được rồi! 🎉</p>
            <p className="text-sm font-semibold text-white/80">Quay để chọn em nhận Pokémon (mỗi câu đúng là một ô).</p>
            <CatchWheel entries={buildCatchWheelEntries(encounter)} students={students} onDone={completeWildCatch} />
          </div>
        )}

        {encounter?.status === 'caught' && wildCatchResult && (
          <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-[28px] border border-amber-300/50 bg-black/35 p-6 backdrop-blur-md" data-testid="hunt-result">
            <p className="text-2xl font-black text-amber-300">{studentName(wildCatchResult.winnerId)} nhận được {speciesName}{wildCatchResult.pet.isShiny ? ' ✨ Shiny' : ''}!</p>
            {wildCatchResult.consolationIds.length > 0 && wildCatchResult.consolationPoints > 0 && (
              <p className="text-sm font-semibold text-white/85" data-testid="hunt-consolation">
                Cộng {wildCatchResult.consolationPoints} điểm an ủi cho: {wildCatchResult.consolationIds.map(studentName).join(', ')}
              </p>
            )}
            <button type="button" onClick={finishWildHunt} data-testid="hunt-done" className="mt-2 rounded-2xl bg-emerald-500 px-8 py-3 text-lg font-black text-white shadow-lg hover:bg-emerald-400">Xong</button>
          </div>
        )}

        {encounter?.status === 'escaped' && (
          <div className="flex flex-col items-center gap-3" data-testid="hunt-escaped">
            <p className="text-2xl font-black text-rose-300">Pokémon đã bỏ chạy mất rồi... 💨</p>
            <p className="text-sm font-semibold text-white/80">Lần sau cố gắng hơn nhé!</p>
            <button type="button" onClick={finishWildHunt} data-testid="hunt-done" className="rounded-2xl bg-emerald-500 px-8 py-3 text-lg font-black text-white shadow-lg hover:bg-emerald-400">Xong</button>
          </div>
        )}
      </main>
    </div>
  );
};
