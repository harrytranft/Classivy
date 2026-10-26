import React from 'react';
import { useApp } from '../../app/AppContext';

export const TimerModal: React.FC = () => {
  const {
    customMinutes, setCustomMinutes, setShowTimerModal, setTimerRunning, showTimerModal,
    startTimer, timerRef, timerRunning, timerTime
  } = useApp();
  return (
    <>
      {showTimerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
           <div className="bg-white w-full max-w-sm rounded-[36px] shadow-2xl overflow-hidden animate-in zoom-in relative border-4 border-purple-600">
              <button onClick={() => setShowTimerModal(false)} className="absolute top-4 right-4 text-white hover:text-amber-300 text-3xl font-bold z-10 transition-colors">&times;</button>
              <div className="bg-purple-600 p-8 text-center text-white relative">
                 <div className="text-5xl mb-2">⌛</div>
                 <h2 className="text-2xl font-black uppercase tracking-wider">Đồng Hồ Đếm Giờ</h2>
              </div>
              <div className="p-8 space-y-6">
                 <div className="text-6xl font-black text-center text-purple-950 tabular-nums bg-purple-50 p-4 rounded-3xl border border-purple-100 shadow-inner">
                   {Math.floor(timerTime / 60)}:{String(timerTime % 60).padStart(2, '0')}
                 </div>

                 <div className="flex gap-2 items-center bg-gray-50 border p-2 rounded-2xl">
                    <input 
                      type="number" 
                      placeholder="Nhập số phút..." 
                      className="flex-1 bg-transparent p-2 text-sm font-bold outline-none" 
                      value={customMinutes}
                      onChange={e => setCustomMinutes(e.target.value)}
                    />
                    <button 
                      onClick={() => {
                        const mins = parseInt(customMinutes);
                        if (!isNaN(mins)) startTimer(mins * 60);
                        setCustomMinutes('');
                      }}
                      className="bg-purple-600 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase"
                    >Cài Giờ</button>
                 </div>

                 <div className="grid grid-cols-3 gap-2">
                   {[15, 30, 60, 180, 300, 600].map(s => (
                     <button key={s} onClick={() => startTimer(s)} className="p-3 border-2 border-gray-100 rounded-2xl text-sm font-black text-gray-600 hover:border-purple-300 hover:text-purple-700 transition-all">
                       {s < 60 ? `${s}s` : `${s/60}p`}
                     </button>
                   ))}
                 </div>
                 <button onClick={() => { if(timerRunning) { setTimerRunning(false); clearInterval(timerRef.current!); } else { startTimer(timerTime); } }} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl uppercase tracking-wider transition-all">
                   {timerRunning ? 'Tạm Dừng ⏸️' : 'Bắt Đầu 🔴'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};
