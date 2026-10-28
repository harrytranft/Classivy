import React from 'react';
import { StudentCard } from '../../components/StudentCard';
import { ClassDock } from '../../components/ClassDock';
import { Button } from '../../components/ui';
import { BookCheck, ChevronDown, ClipboardCheck, KeyRound, Minus, Plus, Search, UserCheck, UserPlus, UserX } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { CLASS_SUB_PAGES, classPath } from '../../app/screenRoutes';

export const ClassScreen: React.FC = () => {
  const {
    classes, currentClassStudents, filterClass, handleAddStudent, handleClaimAllRewards,
    handleDeleteStudents, handleOpenLuckyWheel, handleOpenShop, handleRandom,
    handleResetSelectedAura, handleToggleSelectAll, isMultiSelectMode,
    isSyncing, lastSyncedTime, openAttendanceCheck, openHomeworkCheck, openLudoForClass,
    petSkills, searchQuery, selectedStudentIds, setActiveTab, setCurrentScreen,
    setEditingStudent, setFeedbackSource, setFilterClass,
    setIsMultiSelectMode, setSearchQuery, setSelectedStudentIds, setShowGroupModal,
    setShowSkillModal, setShowTimerModal, toggleAttendance, navigateTo
  } = useApp();
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-brand-lg border border-[#e6e2d4] bg-white p-3 shadow-[0_1px_2px_rgba(12,37,39,0.04)]">
        <label className="relative flex min-w-[220px] flex-1 items-center">
          <Search className="pointer-events-none absolute left-3.5 h-5 w-5 text-brand-ink/45" aria-hidden />
          <input
            type="text"
            placeholder="Tìm kiếm trainer..."
            className="h-11 w-full rounded-brand-md border border-[#dcd8c8] bg-brand-cream pl-11 pr-3 text-[15px] text-brand-ink outline-none placeholder:text-brand-ink/65 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/25"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </label>

        <div className="relative">
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            aria-label="Chọn lớp"
            className="h-11 cursor-pointer appearance-none rounded-brand-md border border-brand-forest/25 bg-white pl-4 pr-10 text-[15px] font-bold text-brand-forest outline-none transition-colors hover:border-brand-forest/50 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/25"
          >
            <option value="Tất cả">← Danh sách lớp</option>
            {classes.filter(c => c !== 'Tất cả').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-forest" aria-hidden />
        </div>

        <Button variant="secondary" icon={<ClipboardCheck className="h-[18px] w-[18px]" aria-hidden />} onClick={openAttendanceCheck}>
          Check đi học
        </Button>
        <Button variant="secondary" icon={<BookCheck className="h-[18px] w-[18px]" aria-hidden />} onClick={openHomeworkCheck}>
          Check Homework
        </Button>
        <Button
          variant="secondary"
          icon={<KeyRound className="h-[18px] w-[18px]" aria-hidden />}
          onClick={() => navigateTo(classPath(filterClass, CLASS_SUB_PAGES.accounts))}
        >
          Tài khoản học sinh
        </Button>
        <Button icon={<UserPlus className="h-[18px] w-[18px]" aria-hidden />} onClick={handleAddStudent}>Thêm Trainer</Button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentClassStudents.map(s => (
          <div key={s.id} className="group relative">
            <StudentCard
              student={s}
              petSkills={petSkills}
              isSelected={selectedStudentIds.includes(s.id)}
              showClassName={filterClass === 'Tất cả'}
              onSelect={(st) => {
                if (isMultiSelectMode) {
                  setSelectedStudentIds(prev => prev.includes(st.id) ? prev.filter(id => id !== st.id) : [...prev, st.id]);
                } else {
                  setEditingStudent(st);
                  setCurrentScreen('profile');
                }
              }}
            />
            <div className="absolute bottom-[104px] right-4 z-10 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                type="button"
                aria-label={s.isAbsent ? `Đánh dấu ${s.name} có mặt` : `Đánh dấu ${s.name} vắng`}
                title={s.isAbsent ? 'Đánh dấu có mặt' : 'Đánh dấu vắng'}
                onClick={(e) => { e.stopPropagation(); toggleAttendance(s.id); }}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#dcd8c8] bg-white text-brand-ink/75 shadow-sm transition-colors hover:border-brand-forest/40 hover:text-brand-forest"
              >
                {s.isAbsent ? <UserCheck className="h-5 w-5" aria-hidden /> : <UserX className="h-5 w-5" aria-hidden />}
              </button>
              <button
                type="button"
                aria-label={`Cộng điểm ${s.name}`}
                title="Ban thưởng"
                onClick={(e) => { e.stopPropagation(); setSelectedStudentIds([s.id]); setActiveTab('positive'); setFeedbackSource('manual'); setShowSkillModal(true); }}
                className="grid h-10 w-10 place-items-center rounded-full bg-brand-emerald text-white shadow-[0_2px_8px_-2px_rgba(1,74,45,0.5)] transition-colors hover:bg-brand-forest"
              >
                <Plus className="h-5 w-5" strokeWidth={3} aria-hidden />
              </button>
              <button
                type="button"
                aria-label={`Trừ điểm ${s.name}`}
                title="Cần cố gắng"
                onClick={(e) => { e.stopPropagation(); setSelectedStudentIds([s.id]); setActiveTab('negative'); setFeedbackSource('manual'); setShowSkillModal(true); }}
                className="grid h-10 w-10 place-items-center rounded-full bg-brand-danger text-white shadow-[0_2px_8px_-2px_rgba(150,40,25,0.5)] transition-colors hover:bg-[#a5301f]"
              >
                <Minus className="h-5 w-5" strokeWidth={3} aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ClassDock
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
