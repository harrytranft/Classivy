import { HistoryItem, PokemonPet, Student } from '../types';
import { updatePetInCollection } from './pokemonProgression';

// Skill Pokémon tự động (Phase 11, D35-D37). Logic thuần: điều kiện, lượt dùng, hết lượt, kết quả điểm.
// Mọi skill tối đa 2 lượt, dùng xong ghi lịch sử, hết lượt tự mất (như luật cũ của handleUsePetSkill).

export const MAX_SKILL_USES = 2;

export const SKILL_IDS = {
  lucky: 'sk_lucky',
  evade: 'sk_evade',
  swap: 'sk_swap',
  clairvoyance: 'sk_clairvoyance',
  companion: 'sk_companion',
  decree: 'sk_decree',
  double: 'sk_double',
  guard: 'sk_guard',
  survival: 'sk_survival',
  rescue: 'sk_rescue',
  rapid: 'sk_rapid',
  soulLink: 'sk_soul_link'
} as const;

/** Nhóm B: hộp hỏi sau Random. Giá trị là hiệu ứng giáo viên thấy. */
export type RandomSkillEffect = 'reroll' | 'easier-question' | 'hint' | 'timer' | 'pick-helper';
export const RANDOM_SKILLS: Record<string, { effect: RandomSkillEffect; label: string }> = {
  [SKILL_IDS.evade]: { effect: 'reroll', label: 'Né Trực Diện: gọi bạn khác trả lời thay' },
  [SKILL_IDS.swap]: { effect: 'easier-question', label: 'Đổi Đề Thần Tốc: đổi sang câu hỏi dễ hơn' },
  [SKILL_IDS.clairvoyance]: { effect: 'hint', label: 'Mắt Thần Trí Tuệ: cho em một gợi ý' },
  [SKILL_IDS.companion]: { effect: 'timer', label: 'Trợ Thủ Tra Cứu: 30 giây tra cứu' },
  [SKILL_IDS.decree]: { effect: 'pick-helper', label: 'Đồng Đội Hỗ Trợ: mời một bạn cùng thảo luận' }
};
export const LOOKUP_SECONDS = 30;
export const LUCKY_BONUS = 2;
export const RESCUE_MAX_POINTS = 3;

/** Số lượt còn lại (0 nếu không có skill). */
export const getSkillUsesLeft = (pet: PokemonPet | undefined, skillId: string): number => {
  if (!pet || !(pet.skills || []).includes(skillId)) return 0;
  return Math.max(0, MAX_SKILL_USES - (pet.skillUses?.[skillId] || 0));
};

export const hasUsableSkill = (student: Pick<Student, 'pet'>, skillId: string): boolean => getSkillUsesLeft(student.pet, skillId) > 0;

/** Các skill nhóm B mà em đang có và còn lượt. */
export const getRandomSkillsFor = (student: Pick<Student, 'pet'>): string[] =>
  (student.pet?.skills || []).filter(id => RANDOM_SKILLS[id] && hasUsableSkill(student, id));

const sameLocalDay = (a: number, b: number): boolean => {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

/** Hôm nay em đã bị trừ điểm lần nào chưa (theo lịch sử còn lưu)? */
export const hasDeductionToday = (student: Pick<Student, 'history'>, now: number): boolean =>
  (student.history || []).some(item => item.amount < 0 && sameLocalDay(item.timestamp, now));

/** Em có đang "bị phạt" (có lần trừ điểm hôm nay) để hiện nút Cứu viện không. */
export const isPenalizedToday = hasDeductionToday;

/**
 * Dùng một lượt skill: tăng lượt, hết lượt (lần thứ 2) thì xoá khỏi Pokémon, ghi một dòng lịch sử (amount 0).
 * Trả về học sinh cũ nếu em không có skill hoặc đã hết lượt.
 */
export const consumeSkillUse = (student: Student, skillId: string, skillName: string, detail: string, now: number = Date.now()): Student => {
  const pet = student.pet;
  if (!pet || getSkillUsesLeft(pet, skillId) <= 0) return student;
  const uses = { ...(pet.skillUses || {}) };
  const nextUses = (uses[skillId] || 0) + 1;
  let skills = [...(pet.skills || [])];
  if (nextUses >= MAX_SKILL_USES) {
    skills = skills.filter(id => id !== skillId);
    delete uses[skillId];
  } else {
    uses[skillId] = nextUses;
  }
  const updatedPet: PokemonPet = { ...pet, skills, skillUses: uses };
  const history: HistoryItem = {
    id: `${now}-skill-${skillId}-${Math.random()}`,
    amount: 0,
    reason: `[Skill] ${skillName}: ${detail} (${Math.min(nextUses, MAX_SKILL_USES)}/${MAX_SKILL_USES}${nextUses >= MAX_SKILL_USES ? ', hết lượt' : ''})`,
    timestamp: now
  };
  return {
    ...student,
    pet: updatedPet,
    pets: updatePetInCollection(student, updatedPet),
    history: [history, ...(student.history || [])].slice(0, 50)
  };
};

// ---- Nhóm C: khi cộng/trừ điểm ----

export type PointsSkillKind = 'double' | 'guard' | 'survival';
export interface PointsSkillPrompt {
  studentId: string;
  studentName: string;
  skillId: string;
  kind: PointsSkillKind;
}

/**
 * Với mỗi học sinh được cộng/trừ điểm, liệt kê skill cần hỏi giáo viên (D36: chỉ hỏi khi em thực sự có skill phù hợp).
 * Cộng điểm dương: Nhân Đôi. Trừ điểm: Kim Bài Miễn Tử, rồi Lá Chắn (chỉ lần trừ đầu trong ngày).
 */
export const getPointsSkillPrompts = (students: Student[], ids: string[], amount: number, now: number = Date.now()): PointsSkillPrompt[] => {
  if (!Number.isFinite(amount) || amount === 0) return [];
  const prompts: PointsSkillPrompt[] = [];
  for (const student of students) {
    if (!ids.includes(student.id)) continue;
    const base = { studentId: student.id, studentName: student.name };
    if (amount > 0) {
      if (hasUsableSkill(student, SKILL_IDS.double)) prompts.push({ ...base, skillId: SKILL_IDS.double, kind: 'double' });
    } else {
      if (hasUsableSkill(student, SKILL_IDS.survival)) prompts.push({ ...base, skillId: SKILL_IDS.survival, kind: 'survival' });
      if (hasUsableSkill(student, SKILL_IDS.guard) && !hasDeductionToday(student, now)) prompts.push({ ...base, skillId: SKILL_IDS.guard, kind: 'guard' });
    }
  }
  return prompts;
};

/** Điểm cuối cùng của một em sau khi giáo viên chọn "Dùng" các skill (kèm skill thực sự được dùng). */
export const resolvePointsWithSkills = (amount: number, accepted: PointsSkillKind[]): { amount: number; used: PointsSkillKind[] } => {
  if (amount > 0) {
    return accepted.includes('double') ? { amount: amount * 2, used: ['double'] } : { amount, used: [] };
  }
  if (amount < 0) {
    if (accepted.includes('survival')) return { amount: 0, used: ['survival'] };
    // Giảm 50% điểm phạt, làm tròn xuống (bé hưởng lợi): -3 thành -1.
    if (accepted.includes('guard')) return { amount: -Math.floor(Math.abs(amount) / 2), used: ['guard'] };
  }
  return { amount, used: [] };
};

export const POINTS_SKILL_SKILL_ID: Record<PointsSkillKind, string> = {
  double: SKILL_IDS.double,
  guard: SKILL_IDS.guard,
  survival: SKILL_IDS.survival
};

export const describePointsSkill = (prompt: PointsSkillPrompt, amount: number): { title: string; question: string; detail: string } => {
  const result = resolvePointsWithSkills(amount, [prompt.kind]);
  if (prompt.kind === 'double') {
    return { title: 'Pháp Bảo Nhân Đôi', question: `${prompt.studentName} có Pháp Bảo Nhân Đôi. Dùng để nhân đôi điểm cộng (+${amount} thành +${result.amount})?`, detail: `nhân đôi điểm cộng (+${amount} thành +${result.amount})` };
  }
  if (prompt.kind === 'guard') {
    return { title: 'Lá Chắn Hộ Vệ', question: `Đây là lần bị trừ điểm đầu tiên hôm nay của ${prompt.studentName}, em có Lá Chắn Hộ Vệ. Dùng để giảm 50% (${amount} thành ${result.amount})?`, detail: `giảm 50% điểm phạt (${amount} thành ${result.amount})` };
  }
  return { title: 'Kim Bài Miễn Tử', question: `${prompt.studentName} có Kim Bài Miễn Tử. Dùng để bỏ qua lần trừ điểm này (${amount} thành 0)?`, detail: `bỏ qua lần trừ điểm (${amount} thành 0)` };
};

// ---- Nhóm D: dùng ngoài Random ----

/** Em (có Hộ Tống) cứu viện bạn: tối đa 3 điểm và không quá số điểm em đang có. Trả null nếu không hợp lệ. */
export const getRescueLimit = (rescuer: Student): number =>
  hasUsableSkill(rescuer, SKILL_IDS.rescue) ? Math.max(0, Math.min(RESCUE_MAX_POINTS, rescuer.points)) : 0;

export interface RescueResult { rescuer: Student; rescuee: Student }

export const applyRescue = (rescuer: Student, rescuee: Student, amount: number, now: number = Date.now()): RescueResult | null => {
  const points = Math.floor(amount);
  if (rescuer.id === rescuee.id || points < 1 || points > getRescueLimit(rescuer)) return null;
  const consumed = consumeSkillUse(rescuer, SKILL_IDS.rescue, 'Hộ Tống Đồng Đội', `tặng ${points} điểm để cứu viện ${rescuee.name}`, now);
  if (consumed === rescuer) return null;
  const giveHistory: HistoryItem = { id: `${now}-rescue-out-${Math.random()}`, amount: -points, reason: `Cứu viện ${rescuee.name} bằng Hộ Tống Đồng Đội`, timestamp: now };
  const getHistory: HistoryItem = { id: `${now}-rescue-in-${Math.random()}`, amount: points, reason: `Được ${rescuer.name} cứu viện (Hộ Tống Đồng Đội)`, timestamp: now };
  return {
    rescuer: { ...consumed, points: rescuer.points - points, history: [giveHistory, ...consumed.history].slice(0, 50) },
    rescuee: { ...rescuee, points: rescuee.points + points, history: [getHistory, ...(rescuee.history || [])].slice(0, 50) }
  };
};

/** Đồng Tâm Hiệp Lực: giáo viên chọn bạn cùng làm, em có skill được cộng ké 1 điểm. */
export const applySoulLink = (owner: Student, partner: Student, now: number = Date.now()): Student | null => {
  if (owner.id === partner.id) return null;
  const consumed = consumeSkillUse(owner, SKILL_IDS.soulLink, 'Đồng Tâm Hiệp Lực', `cộng ké 1 điểm nhờ ${partner.name}`, now);
  if (consumed === owner) return null;
  const history: HistoryItem = { id: `${now}-soul-${Math.random()}`, amount: 1, reason: `Đồng Tâm Hiệp Lực cùng ${partner.name}`, timestamp: now };
  return { ...consumed, points: owner.points + 1, history: [history, ...consumed.history].slice(0, 50) };
};
