import React from 'react';
import { useApp } from '../../app/AppContext';

// Trang /class: chọn lớp để vào trang riêng của lớp đó.
export const ClassPickerScreen: React.FC = () => {
  const { classOptions, students, setFilterClass, handleAddStudent } = useApp();

  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border">
        <div>
          <h2 className="text-2xl sm:text-3xl font-royal text-red-800">Chọn lớp</h2>
          <p className="text-xs font-bold text-gray-500 mt-1">Mỗi lớp có trang riêng với Random, Cá Ngựa, Vòng quay và Tặng Pokémon.</p>
        </div>
        <button onClick={handleAddStudent} className="bg-red-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-red-900 transition-all">+ Thêm Trainer</button>
      </div>

      {classOptions.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 p-10 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="font-black text-gray-700">Chưa có lớp nào.</p>
          <p className="text-sm font-bold text-gray-500 mt-1">Bấm "+ Thêm Trainer" hoặc nhập danh sách lớp ở mục Cài đặt.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classOptions.map(className => {
            const roster = students.filter(student => student.className === className);
            const presentCount = roster.filter(student => !student.isAbsent).length;
            return (
              <button
                key={className}
                type="button"
                aria-label={`Vào lớp ${className}`}
                onClick={() => setFilterClass(className)}
                className="group text-left rounded-[28px] border-2 border-amber-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-amber-400 hover:shadow-xl"
              >
                <span className="block text-3xl font-black text-red-900">{className}</span>
                <span className="mt-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  {roster.length} trainer · {presentCount} có mặt
                </span>
                <span className="mt-4 inline-block text-xs font-black text-amber-700 group-hover:text-red-800">Vào lớp →</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
