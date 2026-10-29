import React, { useEffect, useRef, useState } from 'react';
import { Student } from '../../types';
import { CatchWheelEntry, pickCatchWinnerIndex } from '../../domain/wildHunt';

const SPIN_MS = 4000;
const COLORS = ['#10b981', '#f59e0b', '#38bdf8', '#f472b6', '#a78bfa', '#fb7185', '#84cc16', '#fb923c'];

interface CatchWheelProps {
  entries: CatchWheelEntry[];
  students: Student[];
  onDone: (winnerId: string) => void;
}

// Vòng quay chọn người nhận Pokémon: mỗi câu đúng là một ô. Người trúng được chọn trước, vòng quay chỉ quay tới ô đó.
export const CatchWheel: React.FC<CatchWheelProps> = ({ entries, students, onDone }) => {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<number | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const count = entries.length;
  const segment = count > 0 ? 360 / count : 360;
  const nameOf = (studentId: string) => students.find(s => s.id === studentId)?.name ?? '?';
  const background = count > 0
    ? `conic-gradient(${entries.map((_, i) => `${COLORS[i % COLORS.length]} ${i * segment}deg ${(i + 1) * segment}deg`).join(', ')})`
    : '#d1d5db';

  const spin = () => {
    if (spinning || count === 0) return;
    const index = pickCatchWinnerIndex(entries);
    const winnerId = entries[index].studentId;
    setSpinning(true);
    // Đưa tâm ô trúng lên đúng mũi tên ở đỉnh vòng quay, sau vài vòng quay.
    setRotation(360 * 5 - (index + 0.5) * segment);
    timer.current = window.setTimeout(() => onDoneRef.current(winnerId), SPIN_MS + 300);
  };

  return (
    <div className="flex flex-col items-center gap-4" data-testid="catch-wheel">
      <div className="relative h-72 w-72">
        <div aria-hidden className="absolute left-1/2 top-[-6px] z-10 h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[22px] border-x-transparent border-t-red-600 drop-shadow" />
        <div
          className="relative h-full w-full rounded-full border-4 border-white shadow-2xl"
          style={{ background, transform: `rotate(${rotation}deg)`, transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.7, 0.1, 1)` : 'none' }}
        >
          {entries.map((entry, i) => (
            <span
              key={`${entry.studentId}-${i}`}
              className="absolute left-1/2 top-1/2 w-24 -ml-12 -mt-3 text-center text-[11px] font-black leading-tight text-white drop-shadow"
              style={{ transform: `rotate(${(i + 0.5) * segment}deg) translateY(-6.2rem)` }}
            >
              {nameOf(entry.studentId)}
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={spin}
        disabled={spinning || count === 0}
        data-testid="hunt-spin"
        className="rounded-2xl bg-amber-400 px-8 py-3 text-lg font-black text-emerald-950 shadow-lg transition-colors hover:bg-amber-300 disabled:opacity-50"
      >
        {spinning ? 'Đang quay...' : 'Quay chọn người nhận'}
      </button>
    </div>
  );
};
