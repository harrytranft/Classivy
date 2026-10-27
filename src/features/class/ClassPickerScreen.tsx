import React from 'react';
import { ArrowRight, School, UserPlus } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Button, EmptyState } from '../../components/ui';

// Trang /class: chọn lớp để vào trang riêng của lớp đó.
export const ClassPickerScreen: React.FC = () => {
  const { classOptions, students, setFilterClass, handleAddStudent } = useApp();

  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-brand-forest-deep">Chọn lớp</h2>
          <p className="mt-1 text-[15px] text-brand-ink/70">Mỗi lớp có trang riêng với Random, Cá Ngựa, Vòng quay và Tặng Pokémon.</p>
        </div>
        <Button icon={<UserPlus className="h-[18px] w-[18px]" aria-hidden />} onClick={handleAddStudent}>Thêm Trainer</Button>
      </div>

      {classOptions.length === 0 ? (
        <EmptyState
          icon={<School className="h-10 w-10" aria-hidden />}
          title="Chưa có lớp nào."
          description={'Bấm "Thêm Trainer" hoặc nhập danh sách lớp ở mục Cài đặt.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {classOptions.map(className => {
            const roster = students.filter(student => student.className === className);
            const presentCount = roster.filter(student => !student.isAbsent).length;
            return (
              <button
                key={className}
                type="button"
                aria-label={`Vào lớp ${className}`}
                onClick={() => setFilterClass(className)}
                className="group flex items-center gap-5 rounded-brand-lg border border-[#e6e2d4] bg-white p-5 text-left shadow-[0_1px_2px_rgba(12,37,39,0.04),0_6px_18px_-8px_rgba(12,37,39,0.14)] transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-emerald/60 hover:shadow-[0_14px_28px_-10px_rgba(1,74,45,0.28)]"
              >
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-brand-md bg-brand-forest text-2xl font-extrabold text-brand-cream">{className}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-extrabold text-brand-ink">Lớp {className}</span>
                  <span className="mt-1 block text-sm text-brand-ink/70 tabular-nums">
                    {roster.length} trainer · {presentCount} có mặt
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-brand-forest/50 transition-transform group-hover:translate-x-1 group-hover:text-brand-forest" aria-hidden />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
