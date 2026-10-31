import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppScope } from './AppContext';
import { SCREEN_PATHS, classPath, studentIdFromPath } from './screenRoutes';

// Khi mở thẳng /student/:id (tải lại trang, nút Back/Forward), nạp đúng học sinh vào hồ sơ.
// Nếu dữ liệu đã tải xong mà không có học sinh đó thì quay về /class (em đã lưu trữ: về trang lớp của em).
export const useProfileRouteSync = (app: AppScope) => {
  const { students, allStudents, editingStudent, setEditingStudent, initialCloudLoadComplete } = app;
  const location = useLocation();
  const navigate = useNavigate();
  const routeStudentId = studentIdFromPath(location.pathname);

  useEffect(() => {
    if (!routeStudentId || editingStudent?.id === routeStudentId) return;
    const target = students.find(student => student.id === routeStudentId);
    if (target) {
      setEditingStudent(target);
    } else if (initialCloudLoadComplete || students.length > 0) {
      const archived = allStudents.find(student => student.id === routeStudentId);
      navigate(archived ? classPath(archived.className) : SCREEN_PATHS.class, { replace: true });
    }
  }, [routeStudentId, students, editingStudent?.id, initialCloudLoadComplete]);
};
