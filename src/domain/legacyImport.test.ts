import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ClassBossState, Gender, Student } from '../types';
import { EMPTY_SNAPSHOT, applyChanges, chunkChanges, emptyTables, tablesToSnapshot } from './cloudModel';
import { planLegacyImport, verifyLegacyImport } from './legacyImport';

const fixtureStudents: Student[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'fixtures/sample-class.json'), 'utf-8')
).students;

const makeStudent = (overrides: Partial<Student> = {}): Student => ({
  id: 'stu-1',
  name: 'An',
  gender: Gender.MALE,
  className: '6A',
  points: 20,
  history: [],
  ...overrides
});

const boss = { '6A': { className: '6A', defeatedBosses: 3 } as unknown as ClassBossState, 'Lớp trống': { className: 'Lớp trống' } as unknown as ClassBossState };

describe('planLegacyImport (dry-run)', () => {
  it('summarises the sample class without writing anything', () => {
    const plan = planLegacyImport(fixtureStudents, boss, EMPTY_SNAPSHOT);
    expect(plan.problems).toEqual([]);
    expect(plan.summary.studentCount).toBe(fixtureStudents.length);
    expect(plan.summary.totalPoints).toBe(fixtureStudents.reduce((sum, s) => sum + s.points, 0));
    expect(plan.summary.historyCount).toBe(fixtureStudents.reduce((sum, s) => sum + s.history.length, 0));
    expect(plan.summary.classCount).toBe(new Set([...fixtureStudents.map(s => s.className), 'Lớp trống']).size);
  });

  it('imports, reads back and verifies with no mismatch; ledger total equals points', () => {
    const plan = planLegacyImport(fixtureStudents, boss, EMPTY_SNAPSHOT);
    const tables = chunkChanges(plan.changes, 4).reduce(applyChanges, emptyTables());
    expect(verifyLegacyImport(plan.expected, tablesToSnapshot(tables))).toEqual([]);
    fixtureStudents.forEach(student => {
      const total = tables.ledger.filter(e => e.studentClientId === student.id).reduce((sum, e) => sum + e.amount, 0);
      expect(total).toBe(student.points);
    });
    expect(tables.ledger.every(e => e.source === 'migration' || e.source === 'opening_balance')).toBe(true);
  });

  it('keeps the visible history identical to the old data', () => {
    const plan = planLegacyImport(fixtureStudents, {}, EMPTY_SNAPSHOT);
    const loaded = tablesToSnapshot(applyChanges(emptyTables(), plan.changes));
    loaded.students.forEach(student => {
      const original = fixtureStudents.find(s => s.id === student.id)!;
      expect(student.history).toEqual([...original.history].sort((a, b) => b.timestamp - a.timestamp));
    });
  });

  it('can be re-run after a partial import and removes students no longer in the old data', () => {
    const first = planLegacyImport(fixtureStudents, {}, EMPTY_SNAPSHOT);
    const [classesChunk, firstStudents] = chunkChanges(first.changes, 3);
    const partial = [classesChunk, firstStudents].reduce(applyChanges, emptyTables());
    const stray = applyChanges(partial, { classes: [], students: [{ clientId: 'stray', className: '6A', name: 'X', gender: Gender.MALE, points: 0, avatar: null, gameState: {} }], history: [], deletedStudentClientIds: [] });

    const retry = planLegacyImport(fixtureStudents, {}, tablesToSnapshot(stray));
    expect(retry.changes.deletedStudentClientIds).toEqual(['stray']);
    const done = applyChanges(stray, retry.changes);
    expect(verifyLegacyImport(retry.expected, tablesToSnapshot(done))).toEqual([]);
  });

  it('blocks on missing class, missing name and duplicate ids', () => {
    const plan = planLegacyImport([
      makeStudent({ id: 'a', className: '' }),
      makeStudent({ id: 'b', name: ' ' }),
      makeStudent({ id: 'c' }),
      makeStudent({ id: 'c', name: 'Bình' })
    ], {}, EMPTY_SNAPSHOT);
    expect(plan.problems).toHaveLength(3);
    expect(plan.problems.join('\n')).toMatch(/chưa thuộc lớp/);
    expect(plan.problems.join('\n')).toMatch(/chưa có tên/);
    expect(plan.problems.join('\n')).toMatch(/trùng mã/);
  });

  it('warns but continues on fractional points, odd gender, duplicate or missing history ids', () => {
    const plan = planLegacyImport([
      makeStudent({
        points: 10.4,
        gender: 'Khác' as Gender,
        history: [
          { id: 'dup', amount: 1, reason: 'a', timestamp: 3 },
          { id: 'dup', amount: 1, reason: 'a', timestamp: 3 },
          { id: '', amount: 2, reason: 'b', timestamp: 2 }
        ]
      })
    ], {}, EMPTY_SNAPSHOT);
    expect(plan.problems).toEqual([]);
    expect(plan.warnings).toHaveLength(2);
    expect(plan.expected.students[0].points).toBe(10);
    expect(plan.expected.students[0].gender).toBe(Gender.MALE);
    expect(plan.expected.students[0].history.map(h => h.id)).toEqual(['dup', 'legacy-stu-1-2']);
  });

  it('reports mismatches when the stored data differs', () => {
    const plan = planLegacyImport(fixtureStudents.slice(0, 2), {}, EMPTY_SNAPSHOT);
    const loaded = tablesToSnapshot(applyChanges(emptyTables(), plan.changes));
    loaded.students[0] = { ...loaded.students[0], points: loaded.students[0].points + 1 };
    loaded.students.pop();
    const mismatches = verifyLegacyImport(plan.expected, loaded);
    expect(mismatches.some(m => m.startsWith('Số học sinh'))).toBe(true);
    expect(mismatches.some(m => m.startsWith('Điểm của'))).toBe(true);
    expect(mismatches.some(m => m.startsWith('Thiếu học sinh'))).toBe(true);
  });
});
