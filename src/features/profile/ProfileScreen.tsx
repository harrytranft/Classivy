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
    <div className="bg-white p-6 sm:p-10 rounded-3xl border shadow-2xl max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl sm:text-3xl font-royal text-red-800">Hồ Sơ Trainer</h2>
        <button 
          onClick={() => setCurrentScreen('class')} 
          className="text-sm font-black uppercase text-gray-400 hover:text-red-800 transition-colors"
        >
          ← Quay lại lớp
        </button>
      </div>

      {/* Profile Tab Selector */}
      <div className="flex border-b border-gray-100 shrink-0">
        <button 
          onClick={() => setProfileTab('info')} 
          className={`flex-1 py-3 text-xs sm:text-sm font-black border-b-4 transition-all tracking-wider ${profileTab === 'info' ? 'text-red-800 border-red-800' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
          📜 TIỂU SỬ & CÔNG TRẠNG
        </button>
        <button 
          onClick={() => setProfileTab('pet')} 
          className={`flex-1 py-3 text-xs sm:text-sm font-black border-b-4 transition-all tracking-wider flex items-center justify-center gap-2 ${profileTab === 'pet' ? 'text-amber-600 border-amber-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
          <span>{editingStudent.pet ? '🔥' : '🥚'}</span>
          <span>{editingStudent.pet ? 'LINH THÚ HỘ MỆNH' : 'ẤP TRỨNG POKÉMON'}</span>
        </button>
        <button 
          onClick={() => {
            setProfileTab('fusion');
            setSelectedFusionPetDexIds([]);
          }} 
          className={`flex-1 py-3 text-xs sm:text-sm font-black border-b-4 transition-all tracking-wider flex items-center justify-center gap-2 ${profileTab === 'fusion' ? 'text-purple-700 border-purple-700' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
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
