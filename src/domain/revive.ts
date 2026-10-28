import { HistoryItem, PokemonPet, Student } from '../types';

/** Từ mức điểm này trở xuống, thẻ học sinh hiện nút Hồi sinh (D34). */
export const REVIVE_THRESHOLD = -20;
/** Điểm Hào Quang sau khi hồi sinh. */
export const REVIVE_POINTS = 20;

export const canReviveStudent = (student: Pick<Student, 'points'>): boolean => student.points <= REVIVE_THRESHOLD;

/** Skills (và số lượt đã dùng) giữ lại từ các Pokémon đã mất, gắn vào Pokémon kế tiếp học sinh nhận. */
export interface RetainedSkills {
  skills: string[];
  skillUses: Record<string, number>;
}

const collectRetainedSkills = (student: Student): RetainedSkills => {
  const pets: PokemonPet[] = [...(student.pets || []), ...(student.pet ? [student.pet] : [])];
  const skills: string[] = [];
  const skillUses: Record<string, number> = {};
  pets.forEach(pet => {
    (pet.skills || []).forEach(skillId => {
      const uses = pet.skillUses?.[skillId] ?? 0;
      if (!skills.includes(skillId)) {
        skills.push(skillId);
        skillUses[skillId] = uses;
      } else {
        // Trùng skill giữa nhiều Pokémon: giữ bản còn nhiều lượt nhất (ít lượt dùng nhất).
        skillUses[skillId] = Math.min(skillUses[skillId], uses);
      }
    });
  });
  const previous = student.retainedSkills;
  (previous?.skills || []).forEach(skillId => {
    if (!skills.includes(skillId)) {
      skills.push(skillId);
      skillUses[skillId] = previous?.skillUses?.[skillId] ?? 0;
    }
  });
  return { skills, skillUses };
};

/**
 * Hồi sinh: điểm về REVIVE_POINTS, mất toàn bộ Pokémon; giữ trứng (đang ấp, trong kho, mảnh trứng) và skills.
 * Trả về học sinh cũ nếu chưa đủ điều kiện.
 */
export const reviveStudent = (student: Student, now: number = Date.now()): Student => {
  if (!canReviveStudent(student)) return student;
  const retained = collectRetainedSkills(student);
  const history: HistoryItem = {
    id: `${now}-revive`,
    amount: REVIVE_POINTS - student.points,
    reason: `Hồi sinh: Hào Quang về ${REVIVE_POINTS}, mất toàn bộ Pokémon`,
    timestamp: now
  };
  const { pet: _pet, supportPetInstanceId: _support, ...rest } = student;
  return {
    ...rest,
    points: REVIVE_POINTS,
    pets: [],
    history: [history, ...(student.history || [])],
    retainedSkills: retained.skills.length > 0 ? retained : undefined
  };
};

/** Gắn skills đã giữ lại vào Pokémon đang hoạt động (nếu có) rồi xoá phần giữ lại. */
export const applyRetainedSkills = (student: Student): Student => {
  if (!student.retainedSkills || !student.pet) return student;
  const { skills, skillUses } = student.retainedSkills;
  const petSkills = [...(student.pet.skills || [])];
  const petUses = { ...(student.pet.skillUses || {}) };
  skills.forEach(skillId => {
    if (!petSkills.includes(skillId)) {
      petSkills.push(skillId);
      petUses[skillId] = skillUses[skillId] ?? 0;
    }
  });
  const { retainedSkills: _retained, ...rest } = student;
  return { ...rest, pet: { ...student.pet, skills: petSkills, skillUses: petUses } };
};
