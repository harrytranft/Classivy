import { grantExtraRoll } from '../../domain/ludoRolls';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Phase 13A: cộng/trừ điểm nhanh, "Đúng hết" (+1 lượt lắc Cá Ngựa) và Hoàn tác ở Random Solo/Battle.
export interface QuickActions {
  /** Cộng/trừ nhanh cho một em ở Random Solo; đi qua đúng đường Ban thưởng/Phạt (hộp hỏi skill, đếm Boss, mở Cá Ngựa sau khi cộng). */
  handleQuickPoints: (studentId: string, amount: number) => void;
  /** Bấm lần 1 ghi nhận "Đúng hết" (+1 lượt lắc bonus), bấm lần 2 huỷ. */
  togglePerfectAnswer: (studentId: string) => void;
  /** Khôi phục em về trước lần cộng/trừ nhanh gần nhất (chỉ khi chưa có thay đổi nào khác). */
  undoQuickPoints: () => void;
}

export const createQuickActions = (appState: AppState, app: AppActions): QuickActions => {
  const {
    editingStudent, lastQuickPoints, perfectMarks, posSoundUrl, randomStudent, setEditingStudent,
    setLastQuickPoints, setLudoBonusRolls, setPerfectMarks, setRandomStudent, setStudents, students
  } = appState;

  const handleQuickPoints = (studentId: string, amount: number) => {
    const before = students.find(student => student.id === studentId);
    if (!before || !Number.isFinite(amount) || amount === 0) return;
    setLastQuickPoints({ studentId, studentName: before.name, amount, snapshot: before });
    void app.requestPointsUpdate(
      [studentId],
      amount,
      amount > 0 ? `Cộng nhanh: +${amount} điểm` : `Trừ nhanh: ${amount} điểm`,
      'solo'
    );
  };

  const togglePerfectAnswer = (studentId: string) => {
    const marked = !!perfectMarks[studentId];
    setPerfectMarks(prev => ({ ...prev, [studentId]: !marked }));
    setLudoBonusRolls(prev => grantExtraRoll(prev, studentId, marked ? -1 : 1));
    const reason = marked ? '↩️ Huỷ "Đúng hết": trừ 1 lượt lắc Cá Ngựa' : '⭐ Đúng hết: +1 lượt lắc Cá Ngựa';
    setStudents(prev => prev.map(student => (student.id !== studentId ? student : {
      ...student,
      history: [{ id: Date.now().toString() + Math.random(), amount: 0, reason, timestamp: Date.now() }, ...student.history].slice(0, 50)
    })));
    if (!marked) new Audio(posSoundUrl).play().catch(() => {});
  };

  const undoQuickPoints = () => {
    if (!lastQuickPoints) return;
    const snapshot = lastQuickPoints.snapshot;
    setStudents(prev => prev.map(student => (student.id === snapshot.id ? snapshot : student)));
    if (randomStudent?.id === snapshot.id) setRandomStudent(snapshot);
    if (editingStudent?.id === snapshot.id) setEditingStudent(snapshot);
    setLastQuickPoints(null);
  };

  return { handleQuickPoints, togglePerfectAnswer, undoQuickPoints };
};
