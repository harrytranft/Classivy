import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Gender, Student } from '../types';
import { applyAttendanceCheck } from './attendance';
import { applyHomeworkCheck } from './homework';
import { createPokemonPetFromDexId } from './pokemonProgression';

// Characterization tests cho điểm danh và kiểm tra bài tập (luật hiện hành, không đổi trong Phase 1).

const NOW = new Date('2026-10-26T09:00:00+07:00').getTime();
const DAY = '2026-10-26';

const makeStudent = (id: string, overrides: Partial<Student> = {}): Student => {
  const pet = { ...createPokemonPetFromDexId(25, undefined, { isShiny: false }), hp: 50 };
  return {
    id,
    name: `HS ${id}`,
    gender: Gender.FEMALE,
    className: '6A',
    points: 20,
    history: [],
    egg: { progress: 10, status: 'hatched', assignedDexId: 25, kind: 'normal', requiredProgress: 10 },
    pet,
    pets: [pet],
    ...overrides
  };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('applyAttendanceCheck', () => {
  const check = (students: Student[], statuses = {}) => applyAttendanceCheck(students, {
    classStudentIds: students.filter(s => s.className === '6A').map(s => s.id),
    statuses,
    timestamp: NOW,
    lessonKeySuffix: DAY
  });

  it('applies present / late / absent rules and counts them', () => {
    const result = check([makeStudent('a'), makeStudent('b'), makeStudent('c')], { b: 'late', c: 'absent' });
    const [a, b, c] = result.students;

    expect([result.presentCount, result.lateCount, result.absentCount, result.skippedCount]).toEqual([1, 1, 1, 0]);
    expect(a).toMatchObject({ points: 25, isAbsent: false, attendanceStatus: 'present' });
    expect(a.pet?.hp).toBe(55);
    expect(a.pokemonProgress).toMatchObject({ attendanceStreak: 1, lastAttendanceLessonKey: `6A:${DAY}` });
    expect(a.trainerProgress?.totalXp).toBe(5);
    expect(a.weeklyChest?.progress).toBe(10);
    expect(a.expedition?.status).toBe('active');
    expect(a.history[0].reason).toBe(`🧭 Đi học Có mặt (${DAY}) (+5 Hào Quang, Pokémon +5 HP)`);

    expect(b).toMatchObject({ points: 15, isAbsent: false, attendanceStatus: 'late' });
    expect(b.pet?.hp).toBe(45);
    expect(b.pokemonProgress?.attendanceStreak).toBe(1);

    expect(c).toMatchObject({ points: 20, isAbsent: true, attendanceStatus: 'absent' });
    expect(c.pet?.hp).toBe(50);
    expect(c.pokemonProgress?.attendanceStreak).toBe(0);
    expect(c.expedition).toBeUndefined();
  });

  it('skips a class that was already checked today and ignores other classes', () => {
    const done = makeStudent('a', { pokemonProgress: { answerStreak: 0, bestAnswerStreak: 0, battleWinStreak: 0, bestBattleWinStreak: 0, homeworkStreak: 0, bestHomeworkStreak: 0, lastAttendanceLessonKey: `6A:${DAY}` } });
    const otherClass = makeStudent('z', { className: '7B' });
    const result = check([done, otherClass]);
    expect(result.skippedCount).toBe(1);
    expect(result.students[0]).toBe(done);
    expect(result.students[1]).toBe(otherClass);
  });

  it('hatches an egg that reaches its goal with the +5', () => {
    const egg = { instanceId: 'egg-a', progress: 6, status: 'egg' as const, assignedDexId: 1, kind: 'normal' as const, requiredProgress: 10 };
    const result = check([makeStudent('a', { pet: undefined, pets: [], egg })]);
    expect(result.hatchItems.map(item => item.studentId)).toEqual(['a']);
    expect(result.students[0].pet?.dexId).toBe(1);
  });
});

describe('applyHomeworkCheck', () => {
  const check = (students: Student[], statuses = {}) => applyHomeworkCheck(students, {
    presentStudentIds: students.filter(s => !s.isAbsent).map(s => s.id),
    statuses,
    timestamp: NOW,
    lessonDateKey: DAY
  });

  it('applies done / not yet / missing rules and counts them', () => {
    const result = check([makeStudent('a'), makeStudent('b'), makeStudent('c')], { b: 'not-yet', c: 'missing' });
    const [a, b, c] = result.students;

    expect([result.doneCount, result.notYetCount, result.missingCount, result.skippedCount]).toEqual([1, 1, 1, 0]);
    expect(a.points).toBe(28);
    expect(a.pet?.hp).toBe(58);
    expect(a.trainerProgress?.totalXp).toBe(10);
    expect(a.weeklyChest?.progress).toBe(15);
    expect(a.history[0]).toMatchObject({ amount: 8, reason: `📚 Homework Done (${DAY}) (+8 Hào Quang, Pokémon +8 HP)` });

    expect(b.points).toBe(20);
    expect(b.history).toEqual([]);

    expect(c.points).toBe(10);
    expect(c.pet?.hp).toBe(40);
    expect(c.history[0].amount).toBe(-10);
  });

  it('does not grade absent trainers and skips a class already checked today', () => {
    const absent = makeStudent('a', { isAbsent: true });
    const checked = makeStudent('b', { pokemonProgress: { answerStreak: 0, bestAnswerStreak: 0, battleWinStreak: 0, bestBattleWinStreak: 0, homeworkStreak: 0, bestHomeworkStreak: 0, lastHomeworkLessonKey: `6A:${DAY}` } });
    const result = check([absent, checked]);
    expect(result.students[0]).toBe(absent);
    expect(result.students[1]).toBe(checked);
    expect(result.skippedCount).toBe(1);
  });

  it('releases a Pokémon whose HP drops to 0 on missing homework', () => {
    const weak = makeStudent('a');
    weak.pet = { ...weak.pet!, hp: 5 };
    weak.pets = [weak.pet];
    const result = check([weak], { a: 'missing' });
    expect(result.releaseEvent?.studentId).toBe('a');
    expect(result.students[0].pet).toBeUndefined();
  });
});
