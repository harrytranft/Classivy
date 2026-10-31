import { describe, expect, it } from 'vitest';
import { Gender, Student } from '../types';
import { isActiveStudent, mergeActiveStudents, setStudentArchived } from './studentArchive';

const student = (id: string, patch: Partial<Student> = {}): Student => ({
  id, name: id, gender: Gender.MALE, className: '6A', points: 0, history: [], ...patch
});

describe('lưu trữ học sinh', () => {
  it('lưu trữ rồi bỏ lưu trữ: ẩn rồi hiện lại, không để lại cờ', () => {
    const archived = setStudentArchived(student('a'), true, 1000);
    expect(archived).toMatchObject({ isArchived: true, archivedAt: 1000 });
    expect(isActiveStudent(archived)).toBe(false);
    const restored = setStudentArchived(archived, false);
    expect(isActiveStudent(restored)).toBe(true);
    expect('isArchived' in restored).toBe(false);
    expect('archivedAt' in restored).toBe(false);
  });

  it('tính năng ghi lại danh sách đang học thì em đã lưu trữ không bị mất', () => {
    const all = [student('a'), student('b', { isArchived: true }), student('c')];
    const nextActive = [student('a', { points: 5 }), student('c')];
    const merged = mergeActiveStudents(all, nextActive);
    expect(merged.map(item => item.id)).toEqual(['a', 'c', 'b']);
    expect(merged[0].points).toBe(5);
  });

  it('không có em lưu trữ thì trả về đúng danh sách mới', () => {
    const nextActive = [student('a')];
    expect(mergeActiveStudents([student('a')], nextActive)).toBe(nextActive);
  });

  it('xoá học sinh đang học vẫn xoá được (em đó không còn trong danh sách mới)', () => {
    const all = [student('a'), student('b', { isArchived: true })];
    expect(mergeActiveStudents(all, []).map(item => item.id)).toEqual(['b']);
  });
});
