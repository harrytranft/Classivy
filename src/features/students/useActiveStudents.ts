import React, { useCallback, useMemo } from 'react';
import { Student } from '../../types';
import { isActiveStudent, mergeActiveStudents } from '../../domain/studentArchive';

type StudentsSetter = React.Dispatch<React.SetStateAction<Student[]>>;

// Tách danh sách học sinh đầy đủ (gồm em đã lưu trữ) thành:
// - students / setStudents: chỉ các em đang học; ghi lại thì em đã lưu trữ được giữ nguyên.
// - allStudents / setAllStudents / archivedStudents: dùng cho lưu trữ, bỏ lưu trữ, đổi tên và xoá lớp.
export const useActiveStudents = (allStudents: Student[], setAllStudents: StudentsSetter) => {
  const students = useMemo(() => {
    const active = allStudents.filter(isActiveStudent);
    return active.length === allStudents.length ? allStudents : active;
  }, [allStudents]);
  const archivedStudents = useMemo(() => allStudents.filter(student => !isActiveStudent(student)), [allStudents]);

  const setStudents: StudentsSetter = useCallback(action => {
    setAllStudents(prevAll => {
      const filtered = prevAll.filter(isActiveStudent);
      const prevActive = filtered.length === prevAll.length ? prevAll : filtered;
      const nextActive = typeof action === 'function' ? action(prevActive) : action;
      // Không đổi gì thì giữ nguyên tham chiếu (tránh render và lưu thừa).
      if (nextActive === prevActive) return prevAll;
      return mergeActiveStudents(prevAll, nextActive);
    });
  }, [setAllStudents]);

  return { students, setStudents, allStudents, setAllStudents, archivedStudents };
};
