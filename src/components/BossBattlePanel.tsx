import React, { useState } from 'react';
import { BossContribution, BossInstance, Student } from '../types';
import { BOSS_COMBO_BONUS_DAMAGE, BossMemberResult, previewBossRound } from '../domain/bossSystem';
import { getPokemonDisplayName } from '../domain/pokemonProgression';
import { BossHpBar } from './BossHpBar';
import { PokemonMiniStatus } from './PokemonMiniStatus';
import { StudentAvatar } from './StudentAvatar';

interface BossContributorView {
  contribution: BossContribution;
  student?: Student;
}

interface BossBattlePanelProps {
  boss: BossInstance;
  party: Student[];
  topContributors: BossContributorView[];
  randomsSinceLastEncounter: number;
  nextEncounterAt?: number;
  frequencyLabel?: string;
  /** Chốt vòng với kết quả từng em (Phase 13B). Component tự giữ phần chấm; đổi `key` khi sang vòng mới. */
  onResolve: (results: BossMemberResult[]) => void;
  resolving?: boolean;
  visualResult?: 'success' | 'mixed' | 'failure' | null;
}

export const BossBattlePanel: React.FC<BossBattlePanelProps> = ({
  boss,
  party,
  topContributors,
  randomsSinceLastEncounter,
  nextEncounterAt,
  frequencyLabel,
  onResolve,
  resolving = false,
  visualResult = null
}) => {
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const markedCount = party.filter(student => marks[student.id] !== undefined).length;
  const allMarked = party.length > 0 && markedCount === party.length;
  const preview = previewBossRound(
    boss,
    party.filter(student => marks[student.id] !== undefined).map(student => ({ studentId: student.id, correct: marks[student.id] }))
  );
  const setMark = (studentId: string, correct: boolean) => setMarks(prev => ({ ...prev, [studentId]: correct }));

  return (
    <div className={`space-y-5 text-left transition-all duration-300 ${visualResult === 'success' ? 'scale-[1.01] drop-shadow-[0_0_24px_rgba(16,185,129,0.45)]' : visualResult === 'failure' ? 'animate-pulse drop-shadow-[0_0_24px_rgba(220,38,38,0.55)]' : visualResult === 'mixed' ? 'drop-shadow-[0_0_24px_rgba(245,158,11,0.45)]' : ''}`}>
      <BossHpBar boss={boss} />
      {visualResult && (
        <div className={`rounded-3xl border p-3 text-center text-xs font-black ${visualResult === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : visualResult === 'mixed' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-red-200 bg-red-50 text-red-800'}`}>
          {visualResult === 'success' ? 'Combo hoàn hảo! Cả nhóm cùng đánh trúng Boss' : visualResult === 'mixed' ? 'Boss bị đánh trúng, em trả lời sai bị phản công' : `Boss phản công! Pokémon -${boss.failDamage} HP`}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Mỗi em đúng', `-${boss.damagePerSuccessfulStudent} HP Boss`],
          ['Combo (cả nhóm đúng)', `+${BOSS_COMBO_BONUS_DAMAGE} sát thương`],
          ['Thưởng em đúng', '+5 Hào Quang'],
          ['Em sai', `Pokémon -${boss.failDamage} HP`]
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-4 text-center shadow-sm">
            <p className="text-xs font-black text-amber-600">{label}</p>
            <p className="mt-1 text-lg font-black text-red-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] border border-red-100 bg-gradient-to-r from-red-50 via-white to-amber-50 p-4 text-center shadow-sm">
        <p className="text-xs font-black text-red-900">Chấm từng em: đúng hay sai</p>
        <p className="mt-1 text-xs font-bold leading-relaxed text-red-800">
          Em đúng đánh trúng Boss và nhận thưởng. Em sai chỉ Pokémon của em đó bị phản công, các bạn còn lại không bị ảnh hưởng. Cả nhóm đúng hết thì có thêm Combo.
        </p>
        <p className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-red-700 shadow-sm">
          Lượt Random thường: {randomsSinceLastEncounter}{nextEncounterAt ? `/${nextEncounterAt}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {party.map((student, index) => {
          const mark = marks[student.id];
          return (
          <div key={student.id} data-testid={`boss-member-${student.id}`} className={`relative overflow-hidden rounded-[26px] border-2 bg-white p-3 text-center shadow-sm transition-all duration-300 ${mark === true ? 'border-emerald-400 bg-emerald-50' : mark === false ? 'border-red-300 bg-red-50' : 'border-amber-200'}`}>
            <div className="absolute left-2 top-2 rounded-full bg-stone-950 px-2 py-1 text-xs font-black text-white">#{index + 1}</div>
            <StudentAvatar student={student} className="mx-auto h-16 w-16 rounded-[22px] border-2 border-amber-400 object-cover shadow-md" />
            <p className="mt-2 truncate text-xs font-black text-stone-900">{student.name}</p>
            <p className="text-xs font-bold text-stone-400">{student.points} Hào Quang</p>
            <PokemonMiniStatus
              pet={student.pet}
              progress={student.pokemonProgress}
              tone="amber"
              showImage={false}
              className="mt-2"
            />
            {student.pet && (
              <p className="mt-1 truncate text-xs font-black text-amber-800">
                {getPokemonDisplayName(student.pet)}
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={resolving}
                aria-pressed={mark === true}
                aria-label={`${student.name} trả lời đúng`}
                onClick={() => setMark(student.id, true)}
                className={`min-h-[44px] rounded-2xl border-2 text-sm font-black transition-colors disabled:opacity-50 ${mark === true ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50'}`}
              >
                ✅ Đúng
              </button>
              <button
                type="button"
                disabled={resolving}
                aria-pressed={mark === false}
                aria-label={`${student.name} trả lời sai`}
                onClick={() => setMark(student.id, false)}
                className={`min-h-[44px] rounded-2xl border-2 text-sm font-black transition-colors disabled:opacity-50 ${mark === false ? 'border-red-600 bg-red-600 text-white' : 'border-red-300 bg-white text-red-700 hover:bg-red-50'}`}
              >
                ❌ Sai
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {topContributors.length > 0 && (
        <div className="rounded-[28px] border border-amber-200 bg-stone-950 p-4 text-white shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black text-amber-200">Top Contributors</p>
            <p className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-red-100">Damage Board</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {topContributors.slice(0, 5).map((item, index) => (
              <div key={item.contribution.studentId} className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center text-xs font-black">
                <p className="text-xs text-amber-200">Rank {index + 1}</p>
                <p className="mt-1 truncate text-white">{item.student?.name || 'Trainer'}</p>
                <p className="mt-1 text-amber-300">{item.contribution.damageDealt} DMG</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[26px] border border-amber-200 bg-white p-4 text-center shadow-sm" aria-live="polite">
        <p className="text-xs font-black text-stone-500">Đã chấm {markedCount}/{party.length} em</p>
        <p className="mt-1 text-sm font-black text-red-950" data-testid="boss-preview">
          {markedCount === 0
            ? 'Chấm từng em để xem sát thương dự kiến'
            : `Dự kiến: Boss -${preview.damage} HP${preview.comboTriggered ? ' (có Combo)' : ''}${preview.wrongCount > 0 ? `, ${preview.wrongCount} Pokémon bị phản công -${boss.failDamage} HP` : ''}`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={resolving}
          onClick={() => setMarks(Object.fromEntries(party.map(student => [student.id, true])))}
          className="min-h-[52px] rounded-[26px] border-2 border-emerald-500 bg-white py-4 text-sm font-black text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 disabled:opacity-50"
        >
          ✅ Cả nhóm đúng
        </button>
        <button
          type="button"
          disabled={resolving || !allMarked}
          onClick={() => onResolve(party.map(student => ({ studentId: student.id, correct: marks[student.id] === true })))}
          className="min-h-[52px] rounded-[26px] bg-gradient-to-r from-red-800 to-stone-900 py-4 text-sm font-black text-white shadow-lg shadow-red-950/25 transition-all hover:scale-[1.01] hover:from-red-900 hover:to-stone-950 disabled:opacity-50"
        >
          ⚔️ Chốt vòng
        </button>
      </div>
    </div>
  );
};
