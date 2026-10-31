import { setStudentArchived } from '../../domain/studentArchive';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Lưu trữ học sinh (ẩn khỏi mọi trang của lớp) và bỏ lưu trữ (trong Cài đặt). Dữ liệu của em giữ nguyên.
export interface ArchiveActions {
  archiveStudent: (studentId: string) => void;
  unarchiveStudent: (studentId: string) => void;
}

export const createArchiveActions = (appState: AppState, _app: AppActions): ArchiveActions => {
  const { editingStudent, setAllStudents, setEditingStudent, randomStudent, setRandomStudent, setSelectedStudentIds } = appState;

  const archiveStudent = (studentId: string) => {
    const now = Date.now();
    setAllStudents(prev => prev.map(student => (student.id === studentId ? setStudentArchived(student, true, now) : student)));
    setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
    if (randomStudent?.id === studentId) setRandomStudent(null);
    if (editingStudent?.id === studentId) setEditingStudent(null);
  };

  const unarchiveStudent = (studentId: string) => {
    setAllStudents(prev => prev.map(student => (student.id === studentId ? setStudentArchived(student, false) : student)));
  };

  return { archiveStudent, unarchiveStudent };
};
