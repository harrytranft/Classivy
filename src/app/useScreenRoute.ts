import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Student } from '../types';
import { Screen } from '../types/app';
import { ALL_CLASSES, SCREEN_PATHS, classPath, profilePath, screenFromPath } from './screenRoutes';

type EditingStudentSetter = (student: Student | null) => void;

// Thay state `currentScreen` cũ bằng URL, giữ nguyên cách gọi currentScreen / setCurrentScreen.
// Hồ sơ cần id học sinh: các handler luôn gọi setEditingStudent(hs) rồi setCurrentScreen('profile')
// trong cùng một lần bấm, nên ta nhớ id vừa đặt để dựng đường dẫn /student/:id.
export const useScreenRoute = (
  editingStudent: Student | null,
  setEditingStudentState: EditingStudentSetter,
  filterClass: string
) => {
  const location = useLocation();
  const navigate = useNavigate();
  const latestEditingIdRef = useRef<string | null>(editingStudent?.id ?? null);
  latestEditingIdRef.current = editingStudent?.id ?? latestEditingIdRef.current;

  const setEditingStudent: EditingStudentSetter = student => {
    latestEditingIdRef.current = student?.id ?? null;
    setEditingStudentState(student);
  };

  const currentScreen = screenFromPath(location.pathname);

  const setCurrentScreen = (screen: Screen) => {
    // "Lớp học" quay về trang của lớp đang chọn; nếu chưa chọn lớp (ví dụ vừa tải lại trang hồ sơ)
    // thì về lớp của học sinh đang mở, không có nữa thì về trang chọn lớp.
    const classScreenPath = filterClass !== ALL_CLASSES
      ? classPath(filterClass)
      : editingStudent ? classPath(editingStudent.className) : SCREEN_PATHS.class;
    const path = screen === 'profile'
      ? (latestEditingIdRef.current ? profilePath(latestEditingIdRef.current) : classScreenPath)
      : screen === 'class'
        ? classScreenPath
        : SCREEN_PATHS[screen];
    if (path !== location.pathname) navigate(path);
  };

  return { currentScreen, setCurrentScreen, setEditingStudent };
};
