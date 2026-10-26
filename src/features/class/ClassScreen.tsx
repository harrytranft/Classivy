import React from 'react';
import { Gender } from '../../types';
import { createEgg } from '../../domain/eggs';
import { StudentCard } from '../../components/StudentCard';
import { LiquidDock } from '../../components/LiquidDock';
import { useApp } from '../../app/AppContext';

export const ClassScreen: React.FC = () => {
  const {
    classes, currentClassStudents, filterClass, getRank, handleClaimAllRewards,
    handleDeleteStudents, handleOpenLuckyWheel, handleOpenShop, handleRandom,
    handleResetSelectedAura, handleToggleSelectAll, hoveredStudentCardId, isMultiSelectMode,
    isSyncing, lastSyncedTime, openAttendanceCheck, openHomeworkCheck, openLudoForClass,
    petSkills, searchQuery, selectedStudentIds, setActiveTab, setCurrentScreen,
    setEditingStudent, setFeedbackSource, setFilterClass, setHoveredStudentCardId,
    setIsMultiSelectMode, setSearchQuery, setSelectedStudentIds, setShowGroupModal,
    setShowSkillModal, setShowTimerModal, setStudents, toggleAttendance
  } = useApp();
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-wrap gap-4 mb-8 bg-gray-50 p-4 rounded-2xl border items-center">
        <input type="text" placeholder="Tìm kiếm trainer..." className="flex-1 p-3 rounded-xl border outline-none focus:ring-2 ring-red-800/20" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />

        <div className="relative">
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="bg-white text-red-950 border-2 border-amber-200 px-4 py-3 pr-9 rounded-xl outline-none font-black text-xs appearance-none hover:border-amber-400 transition-all cursor-pointer shadow-sm"
          >
            <option value="Tất cả">Tất cả trainer</option>
            {classes.filter(c => c !== 'Tất cả').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-amber-700">
            <span className="text-[10px]">▼</span>
          </div>
        </div>

        <button
          onClick={openAttendanceCheck}
          className="bg-sky-700 text-white px-5 py-3 rounded-xl font-black shadow-lg hover:bg-sky-800 transition-all uppercase text-xs tracking-wider"
        >
          🧭 Check đi học
        </button>

        <button
          onClick={openHomeworkCheck}
          className="bg-emerald-700 text-white px-5 py-3 rounded-xl font-black shadow-lg hover:bg-emerald-800 transition-all uppercase text-xs tracking-wider"
        >
          📚 Check Homework
        </button>

        <button onClick={() => {
          const name = prompt("Họ tên trainer:");
          if (!name) return;
          const gender = confirm("Nhấn OK cho Nam, Cancel cho Nữ") ? Gender.MALE : Gender.FEMALE;
          const cls = prompt("Lớp:", filterClass !== 'Tất cả' ? filterClass : 'Mới');
          setStudents(prev => [...prev, { 
            id: Date.now().toString(), 
            name, 
            gender, 
            className: cls || 'Pokemon Class', 
            points: 0, 
            history: [],
            egg: createEgg('normal')
          }]);
        }} className="bg-red-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-red-900 transition-all">+ Thêm Trainer</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentClassStudents.map(s => (
          <div key={s.id} className="relative group">
            <StudentCard 
              student={s} 
              getRank={getRank} 
              petSkills={petSkills}
              isSelected={selectedStudentIds.includes(s.id)}
              isDimmed={!!hoveredStudentCardId && hoveredStudentCardId !== s.id}
              onHoverChange={setHoveredStudentCardId}
              onSelect={(st) => {
                if (isMultiSelectMode) {
                  setSelectedStudentIds(prev => prev.includes(st.id) ? prev.filter(id => id !== st.id) : [...prev, st.id]);
                } else {
                  setEditingStudent(st);
                  setCurrentScreen('profile');
                }
              }} 
            />
            <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); toggleAttendance(s.id); }} className="bg-white/95 p-2 rounded-lg border shadow-sm text-[10px] font-bold">VẮNG/CÓ</button>
            </div>
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button onClick={(e) => { e.stopPropagation(); setSelectedStudentIds([s.id]); setActiveTab('positive'); setFeedbackSource('manual'); setShowSkillModal(true); }} className="bg-green-500 text-white w-10 h-10 rounded-full shadow-lg font-bold text-xl">+</button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedStudentIds([s.id]); setActiveTab('negative'); setFeedbackSource('manual'); setShowSkillModal(true); }} className="bg-red-500 text-white w-10 h-10 rounded-full shadow-lg font-bold text-xl">-</button>
            </div>
          </div>
        ))}
      </div>

      {/* CLASS BOTTOM TOOLS - LIQUID GLASS FLOATING DOCK WITH MAGNIFICATION */}
      <LiquidDock
        onRandom={handleRandom}
        onLudo={() => openLudoForClass()}
        onLuckyWheel={handleOpenLuckyWheel}
        onShop={handleOpenShop}
        onGroup={() => setShowGroupModal(true)}
        onTimer={() => setShowTimerModal(true)}
        onClaimAllRewards={handleClaimAllRewards}
        onSelectAll={handleToggleSelectAll}
        isMultiSelectMode={isMultiSelectMode}
        onToggleMultiSelect={() => { setIsMultiSelectMode(!isMultiSelectMode); setSelectedStudentIds([]); }}
        onResetAura={handleResetSelectedAura}
        selectedCount={selectedStudentIds.length}
        isSyncing={isSyncing}
        lastSyncedTime={lastSyncedTime}
        onOpenFeedback={() => { setFeedbackSource('manual'); setShowSkillModal(true); }}
        onDeleteSelected={handleDeleteStudents}
      />
    </div>
  );
};
