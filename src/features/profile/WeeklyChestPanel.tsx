import React from 'react';
import { getLocalWeekKey } from '../../domain/dates';
import { getEggLabel } from '../../domain/eggs';
import { Student } from '../../types';
import { claimWeeklyChest, craftEggFromFragments } from '../../domain/progression';
import { useApp } from '../../app/AppContext';

export const WeeklyChestPanel = ({ student }: { student: Student }) => {
  const {
    setEditingStudent, setStudents, showPokemonReaction
  } = useApp();
  const weekKey = getLocalWeekKey();
  const chest = student.weeklyChest?.weekKey === weekKey
    ? student.weeklyChest
    : { weekKey, progress: 0, claimed: false };
  const fragments = student.eggFragments || {};

  return (
    <div className="rounded-[32px] border border-sky-200 bg-sky-50/70 p-5 text-left shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-xl text-sky-950 font-extrabold">🎁 Rương tuần</h4>
          <p className="mt-1 text-xs font-bold text-sky-900/70">
            Tuần {chest.weekKey} · {chest.claimed ? 'Đã nhận' : chest.progress >= 100 ? 'Sẵn sàng mở' : `${chest.progress}/100`}
          </p>
        </div>
        <button
          disabled={chest.progress < 100 || chest.claimed}
          onClick={() => {
            const result = claimWeeklyChest({ ...student, weeklyChest: chest });
            setEditingStudent(result.student);
            setStudents(prev => prev.map(current => current.id === student.id ? result.student : current));
            showPokemonReaction([{ type: 'random-drop', message: result.message }], 'Weekly Chest');
          }}
          className="rounded-2xl bg-sky-700 px-4 py-2 text-xs font-black text-white shadow-md hover:bg-sky-800 disabled:bg-stone-200 disabled:text-stone-500"
        >
          Mở rương
        </button>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-sky-600" style={{ width: `${Math.min(100, chest.progress)}%` }} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(['normal', 'special'] as const).map(kind => (
          <div key={kind} className="flex items-center justify-between rounded-2xl bg-white p-3 text-xs font-black text-sky-950">
            <span>{getEggLabel(kind)} Fragment: {fragments[kind] || 0}/10</span>
            <button
              disabled={(fragments[kind] || 0) < 10}
              onClick={() => {
                const result = craftEggFromFragments(student, kind);
                setEditingStudent(result.student);
                setStudents(prev => prev.map(current => current.id === student.id ? result.student : current));
                showPokemonReaction([{ type: 'random-drop', message: result.message }], 'Craft Egg');
              }}
              className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-black text-white disabled:bg-stone-200 disabled:text-stone-500"
            >
              Craft
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
