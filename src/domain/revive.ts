import { HistoryItem, Student } from '../types';

/** Từ mức điểm này trở xuống, thẻ học sinh hiện nút Hồi sinh (D34). */
export const REVIVE_THRESHOLD = -20;
/** Điểm Hào Quang sau khi hồi sinh. */
export const REVIVE_POINTS = 20;

export const canReviveStudent = (student: Pick<Student, 'points'>): boolean => student.points <= REVIVE_THRESHOLD;

/**
 * Hồi sinh: điểm về REVIVE_POINTS, mất toàn bộ Pokémon (kéo theo skills vì skills gắn trên Pokémon);
 * giữ trứng (đang ấp, trong kho, mảnh trứng). Trả về học sinh cũ nếu chưa đủ điều kiện.
 */
export const reviveStudent = (student: Student, now: number = Date.now()): Student => {
  if (!canReviveStudent(student)) return student;
  const history: HistoryItem = {
    id: `${now}-revive`,
    amount: REVIVE_POINTS - student.points,
    reason: `Hồi sinh: Hào Quang về ${REVIVE_POINTS}, mất toàn bộ Pokémon và skills`,
    timestamp: now
  };
  const { pet: _pet, supportPetInstanceId: _support, ...rest } = student;
  return {
    ...rest,
    points: REVIVE_POINTS,
    pets: [],
    history: [history, ...(student.history || [])]
  };
};
