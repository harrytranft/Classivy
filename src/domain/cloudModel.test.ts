import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ClassBossState, Gender, Student } from '../types';
import {
  AVATAR_MAX_LENGTH,
  CloudSnapshot,
  EMPTY_SNAPSHOT,
  applyChanges,
  chunkChanges,
  diffSnapshots,
  emptyTables,
  isEmptyChanges,
  rowToStudent,
  stableStringify,
  studentToRow,
  tablesToSnapshot,
  toRpcPayload
} from './cloudModel';

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

const boss = (className: string, defeatedBosses = 0) => ({ className, defeatedBosses } as unknown as ClassBossState);

// Lưu một snapshot vào "bảng" giả rồi đọc lại.
const roundTrip = (snapshot: CloudSnapshot) =>
  tablesToSnapshot(applyChanges(emptyTables(), diffSnapshots(EMPTY_SNAPSHOT, snapshot)));

describe('stableStringify', () => {
  it('ignores key order and undefined values', () => {
    expect(stableStringify({ b: 1, a: { d: undefined, c: [1, 2] } })).toBe(stableStringify({ a: { c: [1, 2] }, b: 1 }));
    expect(stableStringify({ a: 1 })).not.toBe(stableStringify({ a: 2 }));
  });
});

describe('studentToRow / rowToStudent', () => {
  it('splits a student into columns and game_state, and back', () => {
    const student = makeStudent({
      customAvatar: 'data:image/png;base64,AAA',
      ludoTile: 4,
      pokemonProgress: { answerStreak: 1, bestAnswerStreak: 2, battleWinStreak: 0, bestBattleWinStreak: 0, homeworkStreak: 0, bestHomeworkStreak: 0 },
      history: [{ id: 'h1', amount: 5, reason: 'Phát biểu', timestamp: 1000 }]
    });
    const row = studentToRow(student);
    expect(row).toMatchObject({ clientId: 'stu-1', className: '6A', name: 'An', points: 20, avatar: 'data:image/png;base64,AAA' });
    expect(row.gameState).toEqual({ ludoTile: 4, pokemonProgress: student.pokemonProgress });
    expect(row.gameState).not.toHaveProperty('history');

    const back = rowToStudent(row, [{ studentClientId: 'stu-1', clientEventId: 'h1', amount: 5, reason: 'Phát biểu', occurredAtMs: 1000, source: 'app' }]);
    expect(stableStringify(back)).toBe(stableStringify(student));
  });

  it('rounds fractional points and drops avatars that are too large', () => {
    const row = studentToRow(makeStudent({ points: 2.6, customAvatar: 'x'.repeat(AVATAR_MAX_LENGTH + 1) }));
    expect(row.points).toBe(3);
    expect(row.avatar).toBeNull();
  });

  it('keeps the newest 50 history items, newest first, and hides the opening balance', () => {
    const history = Array.from({ length: 60 }, (_, i) => ({
      studentClientId: 'stu-1', clientEventId: `e${i}`, amount: 1, reason: '', occurredAtMs: 1000 + i, source: 'app' as const
    }));
    history.push({ studentClientId: 'stu-1', clientEventId: 'opening-balance', amount: 9, reason: '', occurredAtMs: 99999, source: 'opening_balance' as never });
    const student = rowToStudent(studentToRow(makeStudent()), history);
    expect(student.history).toHaveLength(50);
    expect(student.history[0].id).toBe('e59');
    expect(student.history[49].id).toBe('e10');
  });
});

describe('diffSnapshots', () => {
  const base: CloudSnapshot = {
    students: [
      makeStudent({ id: 'a', history: [{ id: 'h1', amount: 1, reason: 'x', timestamp: 1 }] }),
      makeStudent({ id: 'b', name: 'Bình' })
    ],
    bossStatesByClass: { '6A': boss('6A') }
  };

  it('is empty when nothing changed (even if key order differs)', () => {
    const reordered: CloudSnapshot = {
      students: base.students.map(s => JSON.parse(JSON.stringify({ history: s.history, ...s }))),
      bossStatesByClass: { '6A': boss('6A') }
    };
    expect(isEmptyChanges(diffSnapshots(base, reordered))).toBe(true);
  });

  it('sends only the changed student and the new history item', () => {
    const next: CloudSnapshot = {
      ...base,
      students: [
        { ...base.students[0], points: 25, history: [{ id: 'h2', amount: 5, reason: 'y', timestamp: 2 }, ...base.students[0].history] },
        base.students[1]
      ]
    };
    const changes = diffSnapshots(base, next);
    expect(changes.students.map(s => s.clientId)).toEqual(['a']);
    expect(changes.history.map(h => h.clientEventId)).toEqual(['h2']);
    expect(changes.classes).toEqual([]);
    expect(changes.deletedStudentClientIds).toEqual([]);
  });

  it('does not treat history items falling off the 50-item list as deletions', () => {
    const next: CloudSnapshot = { ...base, students: [{ ...base.students[0], history: [] }, base.students[1]] };
    const changes = diffSnapshots(base, next);
    expect(changes.history).toEqual([]);
    expect(changes.deletedStudentClientIds).toEqual([]);
  });

  it('sends deletions, new students with all their history (oldest first) and boss changes', () => {
    const newcomer = makeStudent({
      id: 'c', className: '7B',
      history: [{ id: 'n2', amount: 2, reason: '', timestamp: 20 }, { id: 'n1', amount: 1, reason: '', timestamp: 10 }]
    });
    const next: CloudSnapshot = {
      students: [base.students[0], newcomer],
      bossStatesByClass: { '7B': boss('7B', 1) }
    };
    const changes = diffSnapshots(base, next);
    expect(changes.deletedStudentClientIds).toEqual(['b']);
    expect(changes.students.map(s => s.clientId)).toEqual(['c']);
    expect(changes.history.map(h => h.clientEventId)).toEqual(['n1', 'n2']);
    expect(changes.classes).toEqual([{ name: '6A', bossState: null }, { name: '7B', bossState: boss('7B', 1) }]);
  });
});

describe('applyChanges / tablesToSnapshot (same rules as save_teacher_changes)', () => {
  it('round-trips the sample class exactly', () => {
    const snapshot: CloudSnapshot = { students: fixtureStudents, bossStatesByClass: { '6A': boss('6A', 2) } };
    const loaded = roundTrip(snapshot);
    expect(loaded.students.map(s => stableStringify(s))).toEqual(fixtureStudents.map(s => stableStringify(s)));
    expect(loaded.bossStatesByClass).toEqual(snapshot.bossStatesByClass);
  });

  it('is idempotent and removes ledger rows of deleted students', () => {
    const snapshot: CloudSnapshot = { students: fixtureStudents.slice(0, 2), bossStatesByClass: {} };
    const changes = diffSnapshots(EMPTY_SNAPSHOT, snapshot);
    const once = applyChanges(emptyTables(), changes);
    const twice = applyChanges(once, changes);
    expect(twice.ledger).toHaveLength(once.ledger.length);
    const afterDelete = applyChanges(twice, { classes: [], students: [], history: [], deletedStudentClientIds: [fixtureStudents[0].id] });
    expect(afterDelete.ledger.some(e => e.studentClientId === fixtureStudents[0].id)).toBe(false);
    expect(Object.keys(afterDelete.students)).toEqual([fixtureStudents[1].id]);
  });

  it('rejects history for an unknown student', () => {
    expect(() => applyChanges(emptyTables(), {
      classes: [], students: [], deletedStudentClientIds: [],
      history: [{ studentClientId: 'ghost', clientEventId: 'x', amount: 1, reason: '', occurredAtMs: 1, source: 'app' }]
    })).toThrow(/unknown student/);
  });

  it('keeps history in time order when the student moves through several saves', () => {
    let tables = emptyTables();
    let previous = EMPTY_SNAPSHOT;
    let student = makeStudent();
    for (let i = 1; i <= 3; i++) {
      student = { ...student, points: student.points + i, history: [{ id: `h${i}`, amount: i, reason: '', timestamp: i * 1000 }, ...student.history] };
      const next = { students: [student], bossStatesByClass: {} };
      tables = applyChanges(tables, diffSnapshots(previous, next));
      previous = next;
    }
    expect(tablesToSnapshot(tables).students[0].history.map(h => h.id)).toEqual(['h3', 'h2', 'h1']);
  });
});

describe('toRpcPayload / chunkChanges', () => {
  it('uses the column names of save_teacher_changes', () => {
    const payload = toRpcPayload(diffSnapshots(EMPTY_SNAPSHOT, { students: [fixtureStudents[0]], bossStatesByClass: {} }));
    expect(Object.keys(payload)).toEqual(['classes', 'students', 'history', 'deleted_student_client_ids']);
    expect(Object.keys(payload.students[0])).toEqual(['client_id', 'class_name', 'name', 'gender', 'points', 'avatar', 'game_state']);
    expect(Object.keys(payload.history[0])).toEqual(['student_client_id', 'client_event_id', 'amount', 'reason', 'occurred_at_ms', 'source']);
  });

  it('splits a big change set so that applying every chunk equals applying it at once', () => {
    const snapshot: CloudSnapshot = { students: fixtureStudents, bossStatesByClass: { '6A': boss('6A', 1) } };
    const changes = diffSnapshots(EMPTY_SNAPSHOT, snapshot);
    const chunks = chunkChanges(changes, 5);
    expect(chunks.length).toBeGreaterThan(2);
    chunks.forEach(chunk => expect(chunk.students.length).toBeLessThanOrEqual(5));
    const stepwise = chunks.reduce(applyChanges, emptyTables());
    expect(stableStringify(tablesToSnapshot(stepwise))).toBe(stableStringify(tablesToSnapshot(applyChanges(emptyTables(), changes))));
  });
});
