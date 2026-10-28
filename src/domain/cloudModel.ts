import { ClassBossState, Gender, HistoryItem, Student } from '../types';

// Mô hình dữ liệu Phase 3 (ADR docs/adr/0001-phase-3-data-model.md):
// Student trong app <-> dòng bảng classes / students / point_ledger, và "gói thay đổi" gửi cho
// hàm DB save_teacher_changes. Logic thuần, không gọi mạng.

export const RECENT_HISTORY_LIMIT = 50;
/** Giới hạn ảnh base64 trong cột students.avatar (DB chặn ở 300.000 byte). */
export const AVATAR_MAX_LENGTH = 280_000;
export const OPENING_BALANCE_EVENT_ID = 'opening-balance';

export type LedgerSource = 'app' | 'migration' | 'opening_balance';

export interface ClassChange {
  name: string;
  bossState: ClassBossState | null;
}

/** Phần còn lại của Student (Pokémon, trứng, tiến trình, Cá Ngựa...) lưu trong students.game_state. */
export type StudentGameState = Omit<Student, 'id' | 'name' | 'gender' | 'className' | 'points' | 'history' | 'customAvatar'>;

export interface StudentRow {
  clientId: string;
  className: string;
  name: string;
  gender: Gender;
  points: number;
  avatar: string | null;
  gameState: StudentGameState;
}

export interface HistoryRow {
  studentClientId: string;
  clientEventId: string;
  amount: number;
  reason: string;
  occurredAtMs: number;
  source: LedgerSource;
}

export interface TeacherChanges {
  classes: ClassChange[];
  students: StudentRow[];
  history: HistoryRow[];
  deletedStudentClientIds: string[];
}

/** Phần dữ liệu lưu ở bảng mới (cài đặt giáo viên vẫn ở user_settings). */
export interface CloudSnapshot {
  students: Student[];
  bossStatesByClass: Record<string, ClassBossState>;
}

export const EMPTY_SNAPSHOT: CloudSnapshot = { students: [], bossStatesByClass: {} };

// JSON có khoá sắp xếp, bỏ undefined: so sánh hai giá trị không phụ thuộc thứ tự khoá.
export const stableStringify = (value: unknown): string => {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(item => (item === undefined ? 'null' : stableStringify(item))).join(',')}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).filter(key => record[key] !== undefined).sort();
  return `{${keys.map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
};

const toInteger = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

const toGender = (value: unknown): Gender => (value === Gender.FEMALE ? Gender.FEMALE : Gender.MALE);

export const studentToRow = (student: Student): StudentRow => {
  const { id, name, gender, className, points, history: _history, customAvatar, ...gameState } = student;
  const avatar = customAvatar && customAvatar.length <= AVATAR_MAX_LENGTH ? customAvatar : null;
  return {
    clientId: id,
    className,
    name,
    gender: toGender(gender),
    points: toInteger(points),
    avatar,
    // JSON hoá rồi đọc lại: bỏ undefined giống như khi gửi lên Supabase.
    gameState: JSON.parse(JSON.stringify(gameState))
  };
};

export const historyItemToRow = (studentClientId: string, item: HistoryItem, source: LedgerSource = 'app'): HistoryRow => ({
  studentClientId,
  clientEventId: String(item.id),
  amount: toInteger(item.amount),
  reason: String(item.reason ?? '').slice(0, 500),
  occurredAtMs: toInteger(item.timestamp),
  source
});

/** Dựng lại Student từ dòng bảng + lịch sử (dòng sổ điểm của em đó, thứ tự bất kỳ). */
export const rowToStudent = (row: StudentRow, history: HistoryRow[]): Student => {
  const items = history
    .filter(entry => entry.source !== 'opening_balance')
    .map((entry, index) => ({ entry, index }))
    // Mới nhất trước; cùng thời điểm thì dòng ghi sau đứng trước (như mảng history của app).
    .sort((a, b) => b.entry.occurredAtMs - a.entry.occurredAtMs || b.index - a.index)
    .slice(0, RECENT_HISTORY_LIMIT)
    .map(({ entry }) => ({
      id: entry.clientEventId,
      amount: entry.amount,
      reason: entry.reason,
      timestamp: entry.occurredAtMs
    }));
  const student: Student = {
    ...(row.gameState as StudentGameState),
    id: row.clientId,
    name: row.name,
    gender: row.gender,
    className: row.className,
    points: row.points,
    history: items
  };
  if (row.avatar) student.customAvatar = row.avatar;
  return student;
};

/** Dựng snapshot từ dữ liệu đọc ở bảng (history theo thứ tự ghi, cũ trước). */
export const buildSnapshot = (
  classes: ClassChange[],
  rows: StudentRow[],
  history: HistoryRow[]
): CloudSnapshot => {
  const byStudent = new Map<string, HistoryRow[]>();
  history.forEach(entry => {
    const list = byStudent.get(entry.studentClientId) ?? [];
    list.push(entry);
    byStudent.set(entry.studentClientId, list);
  });
  const bossStatesByClass: Record<string, ClassBossState> = {};
  classes.forEach(cls => {
    if (cls.bossState) bossStatesByClass[cls.name] = cls.bossState;
  });
  return {
    students: rows.map(row => rowToStudent(row, byStudent.get(row.clientId) ?? [])),
    bossStatesByClass
  };
};

/** Những gì cần gửi để bảng đi từ `previous` (lần lưu trước) tới `next` (state hiện tại). */
export const diffSnapshots = (previous: CloudSnapshot, next: CloudSnapshot): TeacherChanges => {
  const prevById = new Map(previous.students.map(student => [student.id, student]));
  const nextIds = new Set(next.students.map(student => student.id));

  const students: StudentRow[] = [];
  const history: HistoryRow[] = [];
  next.students.forEach(student => {
    const before = prevById.get(student.id);
    const row = studentToRow(student);
    if (!before || stableStringify(studentToRow(before)) !== stableStringify(row)) students.push(row);
    const knownEventIds = new Set((before?.history ?? []).map(item => String(item.id)));
    // history của app: mới nhất trước -> gửi cũ trước để thứ tự ghi trong sổ đúng thời gian.
    [...(student.history ?? [])].reverse().forEach(item => {
      if (!knownEventIds.has(String(item.id))) history.push(historyItemToRow(student.id, item));
    });
  });

  const classes: ClassChange[] = [];
  const classNames = new Set([...Object.keys(previous.bossStatesByClass), ...Object.keys(next.bossStatesByClass)]);
  classNames.forEach(name => {
    const before = previous.bossStatesByClass[name];
    const after = next.bossStatesByClass[name];
    if (stableStringify(before ?? null) !== stableStringify(after ?? null)) {
      classes.push({ name, bossState: after ?? null });
    }
  });

  const deletedStudentClientIds = previous.students
    .filter(student => !nextIds.has(student.id))
    .map(student => student.id);

  return { classes, students, history, deletedStudentClientIds };
};

export const isEmptyChanges = (changes: TeacherChanges): boolean =>
  changes.classes.length === 0 &&
  changes.students.length === 0 &&
  changes.history.length === 0 &&
  changes.deletedStudentClientIds.length === 0;

/** Payload JSON đúng tên trường của hàm DB save_teacher_changes. */
export const toRpcPayload = (changes: TeacherChanges) => ({
  classes: changes.classes.map(cls => ({ name: cls.name, boss_state: cls.bossState })),
  students: changes.students.map(row => ({
    client_id: row.clientId,
    class_name: row.className,
    name: row.name,
    gender: row.gender,
    points: row.points,
    avatar: row.avatar,
    game_state: row.gameState
  })),
  history: changes.history.map(entry => ({
    student_client_id: entry.studentClientId,
    client_event_id: entry.clientEventId,
    amount: entry.amount,
    reason: entry.reason,
    occurred_at_ms: entry.occurredAtMs,
    source: entry.source
  })),
  deleted_student_client_ids: changes.deletedStudentClientIds
});

/** Chia gói lớn (lúc chuyển dữ liệu) thành nhiều gói nhỏ; mỗi gói chứa học sinh kèm lịch sử của các em. */
export const chunkChanges = (changes: TeacherChanges, studentsPerChunk = 20): TeacherChanges[] => {
  const chunks: TeacherChanges[] = [];
  for (let i = 0; i < changes.students.length; i += studentsPerChunk) {
    const rows = changes.students.slice(i, i + studentsPerChunk);
    const ids = new Set(rows.map(row => row.clientId));
    chunks.push({
      classes: [],
      students: rows,
      history: changes.history.filter(entry => ids.has(entry.studentClientId)),
      deletedStudentClientIds: []
    });
  }
  const chunkedIds = new Set(changes.students.map(row => row.clientId));
  const rest: TeacherChanges = {
    classes: changes.classes,
    students: [],
    history: changes.history.filter(entry => !chunkedIds.has(entry.studentClientId)),
    deletedStudentClientIds: changes.deletedStudentClientIds
  };
  // Lớp (trạng thái Boss) đi trước, xoá và lịch sử của học sinh đã có đi sau cùng.
  return [{ ...rest, history: [], deletedStudentClientIds: [] }, ...chunks, { ...rest, classes: [] }]
    .filter(chunk => !isEmptyChanges(chunk));
};

// ---------------------------------------------------------------------------
// Mô phỏng hàm DB trong bộ nhớ (dùng cho test và smoke test, cùng luật với SQL).
// ---------------------------------------------------------------------------

export interface TablesState {
  classes: Record<string, ClassBossState | null>;
  students: Record<string, StudentRow>;
  ledger: HistoryRow[];
}

export const emptyTables = (): TablesState => ({ classes: {}, students: {}, ledger: [] });

export const applyChanges = (state: TablesState, changes: TeacherChanges): TablesState => {
  const next: TablesState = {
    classes: { ...state.classes },
    students: { ...state.students },
    ledger: [...state.ledger]
  };
  changes.classes.forEach(cls => { next.classes[cls.name] = cls.bossState; });
  changes.students.forEach(row => {
    if (!(row.className in next.classes)) next.classes[row.className] = null;
    next.students[row.clientId] = row;
  });
  changes.history.forEach(entry => {
    if (!next.students[entry.studentClientId]) {
      throw new Error(`history references unknown student ${entry.studentClientId}`);
    }
    const duplicate = next.ledger.some(existing =>
      existing.studentClientId === entry.studentClientId && existing.clientEventId === entry.clientEventId);
    if (!duplicate) next.ledger.push(entry);
  });
  changes.deletedStudentClientIds.forEach(id => {
    delete next.students[id];
    next.ledger = next.ledger.filter(entry => entry.studentClientId !== id);
  });
  return next;
};

export const tablesToSnapshot = (state: TablesState): CloudSnapshot =>
  buildSnapshot(
    Object.entries(state.classes).map(([name, bossState]) => ({ name, bossState })),
    Object.values(state.students),
    state.ledger
  );
