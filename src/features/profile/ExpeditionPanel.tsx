import React from 'react';
import { claimReadyExpedition, markExpeditionReadyIfDue } from '../../domain/expeditionSystem';
import { Student } from '../../types';
import { useApp } from '../../app/AppContext';

export const ExpeditionPanel = ({ student }: { student: Student }) => {
  const {
    setEditingStudent, setStudents, showPokemonReaction
  } = useApp();
  const expedition = student.expedition;
  const now = Date.now();
  const readyStudent = markExpeditionReadyIfDue(student, now);
  const readyExpedition = readyStudent.expedition;
  const isReady = readyExpedition?.status === 'ready';
  const remainingMs = readyExpedition && readyExpedition.status === 'active'
    ? Math.max(0, readyExpedition.resolvesAt - now)
    : 0;
  const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));

  return (
    <div className="rounded-[32px] border border-emerald-200 bg-emerald-50/70 p-5 text-left shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-xl text-emerald-950 font-extrabold">🧭 Pokémon Expedition</h4>
          <p className="mt-1 text-xs font-bold text-emerald-900/70">
            {!student.pet
              ? 'Cần active Pokémon để đi expedition.'
              : !readyExpedition
                ? 'Chưa có expedition. Chốt điểm danh buổi mới để tự bắt đầu.'
                : isReady
                  ? 'Pokémon đã trở về và có quà sẵn sàng.'
                  : `Đang khám phá. Còn khoảng ${remainingHours} giờ.`}
          </p>
        </div>
        {isReady && (
          <button
            onClick={() => {
              const result = claimReadyExpedition(readyStudent);
              setEditingStudent(result.student);
              setStudents(prev => prev.map(current => current.id === student.id ? result.student : current));
              if (result.message) showPokemonReaction([{ type: 'xp', message: result.message }], 'Expedition hoàn tất');
            }}
            className="rounded-2xl bg-emerald-700 px-4 py-2 text-xs font-black text-white shadow-md hover:bg-emerald-800"
          >
            Nhận quà
          </button>
        )}
      </div>
      {readyExpedition?.reward && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-black text-emerald-900">
          <span className="rounded-2xl bg-white p-2">XP +{readyExpedition.reward.xp}</span>
          <span className="rounded-2xl bg-white p-2">Bond +{readyExpedition.reward.bond}</span>
          <span className="rounded-2xl bg-white p-2">{readyExpedition.reward.rare ? 'Rare Loot' : 'Loot'}</span>
        </div>
      )}
    </div>
  );
};
