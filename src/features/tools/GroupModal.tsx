import React from 'react';
import { StudentAvatar } from '../../components/StudentAvatar';
import { useApp } from '../../app/AppContext';

export const GroupModal: React.FC = () => {
  const {
    generatedGroups, groupSize, handleMakeGroups, setGroupSize, setShowGroupModal,
    showGroupModal
  } = useApp();
  return (
    <>
      {showGroupModal && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
           <div className="bg-red-800 text-white p-6 flex justify-between items-center shadow-lg shrink-0">
             <div className="flex items-center gap-3">
               <span className="text-3xl">👥</span>
               <h2 className="text-2xl font-royal uppercase tracking-wider">Chia Nhóm Tự Động</h2>
             </div>
             <button onClick={() => setShowGroupModal(false)} className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl font-bold text-sm uppercase transition-all">← Quay Lại</button>
           </div>

           <div className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-7xl mx-auto w-full space-y-8">
             <div className="bg-red-50 p-6 rounded-3xl border border-red-200 text-center space-y-4">
               <h3 className="text-xl font-bold text-red-900">Chọn Số Lượng Trainer Tối Đa Trong 1 Nhóm:</h3>
               <div className="flex flex-wrap justify-center gap-3">
                  {[2, 3, 4, 5, 6, 7, 8].map(n => (
                    <button 
                      key={n} 
                      onClick={() => setGroupSize(n)} 
                      className={`w-14 h-14 rounded-2xl border-2 text-xl font-black transition-all ${groupSize === n ? 'border-red-800 text-white bg-red-800 shadow-md scale-110' : 'border-gray-200 text-gray-700 bg-white hover:border-red-400'}`}
                    >
                      {n}
                    </button>
                  ))}
               </div>
               <button onClick={handleMakeGroups} className="bg-red-800 text-white p-4 px-10 rounded-2xl font-extrabold text-lg shadow-xl hover:bg-red-900 uppercase tracking-wider transition-all">Tạo Nhóm Ngay 🎲</button>
             </div>

             {generatedGroups.length > 0 && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generatedGroups.map((g, idx) => (
                    <div key={idx} className="p-6 rounded-3xl border-2 border-red-200 bg-gradient-to-b from-red-50/50 to-white shadow-md">
                       <p className="font-black text-red-800 text-lg mb-4 border-b-2 border-red-200 pb-2 flex justify-between items-center">
                         <span>NHÓM {idx+1}</span>
                         <span className="text-xs bg-red-800 text-white px-3 py-1 rounded-full font-sans">{g.length} Trainer</span>
                       </p>
                       <div className="space-y-2.5">
                         {g.map(s => (
                           <div key={s.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-xs">
                             <StudentAvatar student={s} className="w-10 h-10 rounded-full border border-red-200" />
                             <span className="text-xl md:text-2xl font-bold text-gray-800">{s.name}</span>
                           </div>
                         ))}
                       </div>
                    </div>
                  ))}
               </div>
             )}
           </div>
        </div>
      )}
    </>
  );
};
