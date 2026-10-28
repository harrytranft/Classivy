import { Gender, HistoryItem } from '../../types';
import { createEgg } from '../../domain/eggs';
import { ALL_CLASSES } from '../../app/screenRoutes';
import { getLocalWeekKey } from '../../domain/dates';
import { ClaimAllRewardSummary } from '../../types/app';
import { claimReadyExpedition, markExpeditionReadyIfDue } from '../../domain/expeditionSystem';
import { claimWeeklyChest } from '../../domain/progression';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Hành động trên lớp: vắng/có, chọn tất cả, xoá, reset Hào Quang, nhận quà cả lớp.
export interface ClassActions {
  toggleAttendance: (id: string) => void;
  handleToggleSelectAll: () => void;
  handleDeleteStudents: () => void;
  handleResetSelectedAura: () => void;
  handleClaimAllRewards: () => void;
  handleAddStudent: () => void;
}

export const createClassActions = (appState: AppState, app: AppActions): ClassActions => {
  const {
    currentClassStudents, editingStudent, filterClass, goToClassPage, randomStudent, routeClassName, selectedStudentIds,
    setClaimAllRewardSummary, setEditingStudent, setIsMultiSelectMode, setRandomStudent,
    setSelectedStudentIds, setStudents, showPokemonReaction, students
  } = appState;

  const toggleAttendance = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s;
      const nextAbsent = !s.isAbsent;
      return {
        ...s,
        isAbsent: nextAbsent,
        attendanceStatus: nextAbsent ? 'absent' : 'present'
      };
    }));
  };

  const handleToggleSelectAll = () => {
    const activeClassStudents = currentClassStudents.filter(s => !s.isAbsent);
    if (activeClassStudents.length === 0) return;
    const activeIds = activeClassStudents.map(s => s.id);
    const isAllSelected = activeIds.length > 0 && activeIds.every(id => selectedStudentIds.includes(id));
    if (isAllSelected) {
      setSelectedStudentIds([]);
      setIsMultiSelectMode(false);
    } else {
      setSelectedStudentIds(activeIds);
      setIsMultiSelectMode(true);
    }
  };

  const handleDeleteStudents = () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    const confirmMsg = count === 1 
      ? `Bạn có chắc chắn muốn xóa trainer này? Điểm, lịch sử và tài khoản đăng nhập của em (nếu có) cũng bị xoá hẳn, không khôi phục được.`
      : `Bạn có chắc chắn muốn xóa ${count} trainer đã chọn? Điểm, lịch sử và tài khoản đăng nhập của các em (nếu có) cũng bị xoá hẳn, không khôi phục được.`;
    
    if (window.confirm(confirmMsg)) {
      setStudents(prev => prev.filter(s => !selectedStudentIds.includes(s.id)));
      setSelectedStudentIds([]);
      setIsMultiSelectMode(false);
    }
  };

  const handleResetSelectedAura = () => {
    if (selectedStudentIds.length === 0) {
      alert('Hãy chọn trainer cần reset Hào Quang trước.');
      return;
    }
    const selectedStudents = students.filter(student => selectedStudentIds.includes(student.id));
    if (selectedStudents.length === 0) {
      alert('Không tìm thấy trainer đã chọn.');
      return;
    }
    if (!window.confirm(`Reset Hào Quang của ${selectedStudents.length} trainer đã chọn về 0? Pokémon hiện có vẫn được giữ nguyên.`)) {
      return;
    }

    const timestamp = Date.now();
    const selectedSet = new Set(selectedStudentIds);
    const updatedStudents = students.map(student => {
      if (!selectedSet.has(student.id)) return student;
      const historyItem: HistoryItem = {
        id: `${timestamp}${Math.random()}`,
        amount: -student.points,
        reason: '🧹 Reset Hào Quang về 0',
        timestamp
      };
      return {
        ...student,
        points: 0,
        history: [historyItem, ...student.history].slice(0, 50)
      };
    });

    setStudents(updatedStudents);
    if (editingStudent && selectedSet.has(editingStudent.id)) {
      const updatedEditingStudent = updatedStudents.find(student => student.id === editingStudent.id);
      if (updatedEditingStudent) setEditingStudent(updatedEditingStudent);
    }
    if (randomStudent && selectedSet.has(randomStudent.id)) {
      const updatedRandomStudent = updatedStudents.find(student => student.id === randomStudent.id);
      if (updatedRandomStudent) setRandomStudent(updatedRandomStudent);
    }
    setSelectedStudentIds([]);
    setIsMultiSelectMode(false);

    showPokemonReaction(
      [{ type: 'bond', message: `${selectedStudents.length} trainer đã reset Hào Quang về 0` }],
      'Reset Hào Quang'
    );
  };

  const handleClaimAllRewards = () => {
    const rewardRoster = students.filter(student => filterClass === 'Tất cả' || student.className === filterClass);
    if (rewardRoster.length === 0) {
      alert('Chưa có học sinh nào trong lớp hiện tại để nhận quà.');
      return;
    }

    const timestamp = Date.now();
    const weekKey = getLocalWeekKey();
    const targetIds = new Set(rewardRoster.map(student => student.id));
    const summaries: ClaimAllRewardSummary[] = [];

    const updatedStudents = students.map(student => {
      if (!targetIds.has(student.id)) return student;

      let nextStudent = markExpeditionReadyIfDue(student, timestamp);
      let expeditionMessage: string | undefined;
      let chestMessage: string | undefined;

      if (nextStudent.expedition?.status === 'ready') {
        const result = claimReadyExpedition(nextStudent, timestamp);
        nextStudent = result.student;
        expeditionMessage = result.message;
      }

      const chest = nextStudent.weeklyChest?.weekKey === weekKey
        ? nextStudent.weeklyChest
        : { weekKey, progress: 0, claimed: false };
      if (chest.progress >= 100 && !chest.claimed) {
        const result = claimWeeklyChest({ ...nextStudent, weeklyChest: chest });
        nextStudent = result.student;
        chestMessage = result.message;
      }

      if (expeditionMessage || chestMessage) {
        summaries.push({
          studentId: student.id,
          studentName: student.name,
          expeditionMessage,
          chestMessage
        });
      }

      return nextStudent;
    });

    setStudents(updatedStudents);
    if (editingStudent) {
      const updatedEditingStudent = updatedStudents.find(student => student.id === editingStudent.id);
      if (updatedEditingStudent) setEditingStudent(updatedEditingStudent);
    }
    if (randomStudent) {
      const updatedRandomStudent = updatedStudents.find(student => student.id === randomStudent.id);
      if (updatedRandomStudent) setRandomStudent(updatedRandomStudent);
    }
    setClaimAllRewardSummary(summaries);
    showPokemonReaction(
      [{ type: 'random-drop', message: summaries.length > 0 ? `${summaries.length} học sinh đã nhận quà` : 'Không có quà hoặc rương sẵn sàng' }],
      'Nhận quà cả lớp'
    );
  };

  const handleAddStudent = () => {
    const name = prompt("Họ tên trainer:");
    if (!name) return;
    const gender = confirm("Nhấn OK cho Nam, Cancel cho Nữ") ? Gender.MALE : Gender.FEMALE;
    const cls = prompt("Lớp:", filterClass !== ALL_CLASSES ? filterClass : 'Mới');
    const className = cls || 'Pokemon Class';
    setStudents(prev => [...prev, {
      id: Date.now().toString(),
      name,
      gender,
      className,
      points: 0,
      history: [],
      egg: createEgg('normal')
    }]);
    // Thêm từ trang chọn lớp thì mở luôn trang của lớp vừa thêm.
    if (!routeClassName) goToClassPage(className);
  };

  return {
    toggleAttendance, handleToggleSelectAll, handleDeleteStudents, handleResetSelectedAura,
    handleClaimAllRewards, handleAddStudent
  };
};
