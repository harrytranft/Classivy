import { Student } from '../types';

// Lưu trữ học sinh: học sinh đã lưu trữ ẩn khỏi mọi trang của lớp nhưng vẫn nằm trong dữ liệu (đồng bộ cloud như cũ).
// Các tính năng chỉ thấy danh sách "đang học"; khi chúng ghi lại danh sách, các em đã lưu trữ được giữ nguyên.

export const isActiveStudent = (student: Student): boolean => !student.isArchived;

/**
 * Ghép danh sách "đang học" mới với các em đã lưu trữ trong danh sách đầy đủ trước đó.
 * Em lưu trữ giữ vị trí cũ tương đối (đặt sau các em đang học); em có mặt trong danh sách mới thì lấy bản mới.
 */
export const mergeActiveStudents = (previousAll: Student[], nextActive: Student[]): Student[] => {
  const nextIds = new Set(nextActive.map(student => student.id));
  const archived = previousAll.filter(student => student.isArchived && !nextIds.has(student.id));
  return archived.length === 0 ? nextActive : [...nextActive, ...archived];
};

export const setStudentArchived = (student: Student, archived: boolean, now: number = Date.now()): Student => {
  if (archived) return { ...student, isArchived: true, archivedAt: now, isAbsent: student.isAbsent };
  const { isArchived: _isArchived, archivedAt: _archivedAt, ...rest } = student;
  return rest;
};
