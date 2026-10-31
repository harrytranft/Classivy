import { ClassScheduleSlot } from '../../types';
import { removeClassFromSchedules, renameClassInSchedules, validateClassForm } from '../../domain/classSchedule';
import { SCREEN_PATHS } from '../../app/screenRoutes';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Thêm / sửa / xoá lớp ở trang Class. Lịch học lưu trong cài đặt lớp học (classroomSettings.classSchedules).
export interface ClassFormInput {
  /** Tên lớp trước khi sửa (không có = thêm lớp mới). */
  originalName?: string;
  name: string;
  slots: ClassScheduleSlot[];
}

export interface ClassManagementActions {
  /** Lưu lớp (thêm mới hoặc sửa). Trả về lỗi để hiện trong form, hoặc null nếu đã lưu. */
  saveClass: (input: ClassFormInput) => string | null;
  /** Xoá lớp cùng toàn bộ học sinh trong lớp (kể cả em đã lưu trữ). Không khôi phục được. */
  deleteClass: (className: string) => void;
}

export const createClassManagementActions = (appState: AppState, _app: AppActions): ClassManagementActions => {
  const {
    classOptions, huntSessionsRef, navigateTo, routeClassName, goToClassPage, setAllStudents, setBossStatesByClass,
    setClassroomSettings, setSelectedStudentIds, setIsMultiSelectMode
  } = appState;

  const saveClass = ({ originalName, name, slots }: ClassFormInput): string | null => {
    const error = validateClassForm(name, slots, classOptions, originalName);
    if (error) return error;
    const nextName = name.trim();
    const oldName = originalName ?? nextName;
    setClassroomSettings(prev => ({
      ...prev,
      classSchedules: renameClassInSchedules(prev.classSchedules, oldName, nextName, slots)
    }));

    if (originalName && originalName !== nextName) {
      setAllStudents(prev => prev.map(student => (student.className === originalName ? { ...student, className: nextName } : student)));
      setBossStatesByClass(prev => {
        if (!prev[originalName]) return prev;
        const { [originalName]: bossState, ...rest } = prev;
        return { ...rest, [nextName]: { ...bossState, className: nextName } };
      });
      delete huntSessionsRef.current[originalName];
      if (routeClassName === originalName) goToClassPage(nextName, null, { replace: true });
    }
    return null;
  };

  const deleteClass = (className: string) => {
    setAllStudents(prev => prev.filter(student => student.className !== className));
    setClassroomSettings(prev => ({ ...prev, classSchedules: removeClassFromSchedules(prev.classSchedules, className) }));
    setBossStatesByClass(prev => {
      if (!prev[className]) return prev;
      const { [className]: _removed, ...rest } = prev;
      return rest;
    });
    delete huntSessionsRef.current[className];
    setSelectedStudentIds([]);
    setIsMultiSelectMode(false);
    if (routeClassName === className) navigateTo(SCREEN_PATHS.class, { replace: true });
  };

  return { saveClass, deleteClass };
};
