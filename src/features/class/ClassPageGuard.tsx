import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { SCREEN_PATHS } from '../../app/screenRoutes';

// Chặn trang lớp (và trang con của lớp) khi tên lớp trên đường dẫn không có học sinh nào.
export const ClassPageGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { routeClassName, students, initialCloudLoadComplete } = useApp();
  if (students.some(student => student.className === routeClassName)) return <>{children}</>;
  // Dữ liệu chưa tải xong thì chờ, tránh báo nhầm "không tìm thấy".
  if (!initialCloudLoadComplete && students.length === 0) return null;
  return (
    <div className="rounded-3xl border-2 border-dashed border-gray-200 p-10 text-center space-y-4">
      <p className="text-4xl">🔍</p>
      <p className="font-black text-gray-700">Không tìm thấy lớp "{routeClassName}".</p>
      <Link to={SCREEN_PATHS.class} className="inline-block rounded-brand-md bg-brand-forest px-6 py-3 font-bold text-brand-cream shadow-lg hover:bg-brand-forest-deep">
        Về danh sách lớp
      </Link>
    </div>
  );
};
