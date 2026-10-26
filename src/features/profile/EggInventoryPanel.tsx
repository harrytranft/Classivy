import React from 'react';
import { getEggLabel, getEggRequiredProgress } from '../../domain/eggs';
import { Student } from '../../types';
import { useApp } from '../../app/AppContext';

export const EggInventoryPanel = ({ student }: { student: Student }) => {
  const {
    handleStartInventoryEgg
  } = useApp();
  const inventory = student.eggInventory || [];
  if (inventory.length === 0) return null;
  const counts = inventory.reduce<Record<string, number>>((acc, egg) => {
    const label = getEggLabel(egg.kind || 'normal');
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const canStartEgg = !student.egg || student.egg.status === 'hatched';

  return (
    <div className="rounded-[32px] border border-amber-200 bg-amber-50/60 p-5 text-left shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-royal text-xl text-amber-950">🥚 Egg Inventory</h4>
          <p className="mt-1 text-xs font-bold text-amber-900/70">
            {Object.entries(counts).map(([label, count]) => `${label} x${count}`).join(' · ')}
          </p>
        </div>
        {!canStartEgg && (
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-amber-700">
            Đang có trứng trong incubator
          </span>
        )}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {inventory.map(egg => (
          <div key={egg.instanceId || `${egg.kind}-${egg.assignedDexId}-${egg.acquiredAt}`} className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-white p-3">
            <div>
              <p className="text-xs font-black text-amber-950">{getEggLabel(egg.kind || 'normal')}</p>
              <p className="text-[10px] font-bold text-stone-400">Cần {getEggRequiredProgress(egg)} Hào Quang để nở</p>
            </div>
            <button
              disabled={!canStartEgg || !egg.instanceId}
              onClick={() => egg.instanceId && handleStartInventoryEgg(student.id, egg.instanceId)}
              className="rounded-xl bg-amber-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-sm hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-500"
            >
              Bắt đầu ấp
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
