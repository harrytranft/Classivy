import React from 'react';
import { ProfileFusionTab } from './ProfileFusionTab';
import { ProfileInfoTab } from './ProfileInfoTab';
import { ProfileEggView } from './ProfileEggView';
import { ProfilePetView } from './ProfilePetView';
import { ProfilePetTab } from './ProfilePetTab';
import { useApp } from '../../app/AppContext';

export const ProfileScreen: React.FC = () => {
  const {
    editingStudent, profileTab, setCurrentScreen, setProfileTab, setSelectedFusionPetDexIds
  } = useApp();
  return (
    <div className="mx-auto max-w-4xl space-y-6 rounded-brand-lg border border-[#e6e2d4] bg-white p-6 shadow-[0_6px_18px_-8px_rgba(12,37,39,0.14)] animate-in slide-in-from-right-4 duration-500 sm:p-8">
      <div className="flex items-center justify-between border-b border-[#e6e2d4] pb-4">
        <div><p className="text-sm font-semibold text-brand-forest">Hành trình của Trainer</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">Hồ sơ Trainer</h2></div>
        <button 
          onClick={() => setCurrentScreen('class')} 
          className="text-sm font-bold text-brand-forest transition-colors hover:text-brand-forest-deep"
        >
          ← Quay lại lớp
        </button>
      </div>

      {/* Profile Tab Selector */}
      <div className="flex shrink-0 overflow-x-auto border-b border-[#e6e2d4]">
        <button 
          onClick={() => setProfileTab('info')} 
          className={`min-w-max flex-1 border-b-2 px-3 py-3 text-sm font-bold transition-colors ${profileTab === 'info' ? 'border-brand-forest text-brand-forest' : 'border-transparent text-brand-ink/60 hover:text-brand-ink'}`}
        >
          📜 TIỂU SỬ & CÔNG TRẠNG
        </button>
        <button 
          onClick={() => setProfileTab('pet')} 
          className={`min-w-max flex-1 border-b-2 px-3 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${profileTab === 'pet' ? 'border-brand-gold text-brand-forest' : 'border-transparent text-brand-ink/60 hover:text-brand-ink'}`}
        >
          <span>{editingStudent.pet ? '🔥' : '🥚'}</span>
          <span>{editingStudent.pet ? 'LINH THÚ HỘ MỆNH' : 'ẤP TRỨNG POKÉMON'}</span>
        </button>
        <button 
          onClick={() => {
            setProfileTab('fusion');
            setSelectedFusionPetDexIds([]);
          }} 
          className={`min-w-max flex-1 border-b-2 px-3 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${profileTab === 'fusion' ? 'border-brand-violet text-brand-violet-deep' : 'border-transparent text-brand-ink/60 hover:text-brand-ink'}`}
        >
          <span>🔮</span>
          <span>HỢP NHẤT LINH THÚ</span>
        </button>
      </div>

      {profileTab === 'info' ? (
        <ProfileInfoTab />
      ) : profileTab === 'pet' ? (
        <ProfilePetTab />
      ) : (
        <ProfileFusionTab />
      )}
    </div>
  );
};
