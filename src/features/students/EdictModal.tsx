import React from 'react';
import { useApp } from '../../app/AppContext';

export const EdictModal: React.FC = () => {
  const {
    edict, setEdict
  } = useApp();
  return (
    <>
      {edict && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-6 animate-in fade-in duration-500">
          <div className="bg-[#fdf3e7] text-[#5d4037] p-12 max-w-xl w-full border-[12px] border-[#5d4037] relative shadow-[0_0_100px_rgba(255,215,0,0.4)]">
            <div className="absolute top-4 right-4 cursor-pointer text-4xl opacity-50 hover:opacity-100" onClick={() => setEdict(null)}>&times;</div>
            <div className="text-center mb-10">
               <h2 className="text-5xl font-royal font-bold border-b-8 border-[#5d4037] pb-6 inline-block uppercase tracking-[0.3em]">Thánh Chỉ</h2>
            </div>
            <div className="bg-white/50 p-8 rounded-lg mb-10 border border-[#5d4037]/20">
              <p className="text-3xl font-royal italic leading-relaxed text-center">"{edict}"</p>
            </div>
            <div className="flex justify-center">
              <button onClick={() => setEdict(null)} className="bg-[#5d4037] text-white px-16 py-5 rounded-full font-bold uppercase tracking-[0.2em] hover:scale-110 transition-transform shadow-2xl">Khấu Đầu Tuân Chỉ</button>
            </div>
            <div className="mt-12 text-center text-[10px] opacity-40 uppercase font-black tracking-widest">Trainer Hub Announcement</div>
          </div>
        </div>
      )}
    </>
  );
};
