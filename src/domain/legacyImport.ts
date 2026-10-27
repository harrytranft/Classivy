import { ClassBossState, Gender, Student } from '../types';
import {
  AVATAR_MAX_LENGTH,
  CloudSnapshot,
  HistoryRow,
  OPENING_BALANCE_EVENT_ID,
  StudentRow,
  TeacherChanges,
  diffSnapshots,
  historyItemToRow,
  rowToStudent,
  stableStringify,
  studentToRow
} from './cloudModel';

// Chuyển dữ liệu cũ (user_settings.students + boss_states_by_class) sang bảng mới (ADR mục 6):
// lập kế hoạch + chạy thử (không ghi gì), rồi đối chiếu sau khi ghi.

export interface LegacyImportSummary {
  classCount: number;
  studentCount: number;
  historyCount: number;
  totalPoints: number;
}

export interface LegacyImportPlan {
  summary: LegacyImportSummary;
  /** Lỗi chặn: phải sửa trên app trước khi chuyển. */
  problems: string[];
  /** Chỉ báo cho biết, vẫn chuyển được. */
  warnings: string[];
  /** Dữ liệu cũ sau chuẩn hoá: là thứ bảng mới phải khớp sau khi chuyển. */
  expected: CloudSnapshot;
  changes: TeacherChanges;
}

const label = (student: Partial<Student>, index: number) =>
  student.name ? `"${student.name}"` : `học sinh thứ ${index + 1}`;

export const planLegacyImport = (
  legacyStudents: Student[],
  legacyBossStates: Record<string, ClassBossState>,
  existing: CloudSnapshot
): LegacyImportPlan => {
  const problems: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  const students: Student[] = legacyStudents.map((student, index) => {
    const who = label(student, index);
    const id = student.id === undefined || student.id === null ? '' : String(student.id);
    if (!id) problems.push(`${who} không có mã học sinh.`);
    else if (seenIds.has(id)) problems.push(`${who} trùng mã với một học sinh khác (${id}).`);
    seenIds.add(id);

    const name = String(student.name ?? '').trim();
    if (!name) problems.push(`Học sinh thứ ${index + 1} chưa có tên.`);
    else if (name.length > 100) problems.push(`Tên ${who} dài quá 100 ký tự.`);

    const className = String(student.className ?? '').trim();
    if (!className) problems.push(`${who} chưa thuộc lớp nào. Vào hồ sơ học sinh để chọn lớp.`);
    else if (className.length > 100) problems.push(`Tên lớp của ${who} dài quá 100 ký tự.`);

    if (student.gender !== Gender.MALE && student.gender !== Gender.FEMALE) {
      warnings.push(`${who} chưa có giới tính hợp lệ, sẽ lưu là "${Gender.MALE}".`);
    }
    if (!Number.isInteger(Number(student.points))) {
      warnings.push(`Điểm của ${who} (${student.points}) sẽ được làm tròn.`);
    }
    if (student.customAvatar && student.customAvatar.length > AVATAR_MAX_LENGTH) {
      warnings.push(`Ảnh đại diện của ${who} quá lớn sau khi nén, sẽ bỏ ảnh này.`);
    }

    // Lịch sử: bỏ dòng trùng mã, thêm mã cho dòng thiếu.
    const seenEvents = new Set<string>();
    const history = (Array.isArray(student.history) ? student.history : []).flatMap((item, itemIndex) => {
      const eventId = item?.id ? String(item.id) : `legacy-${id}-${itemIndex}`;
      if (seenEvents.has(eventId)) return [];
      seenEvents.add(eventId);
      return [{ ...item, id: eventId }];
    });

    // Chuẩn hoá giống hệt khi lưu (làm tròn, bỏ ảnh quá lớn...) để đối chiếu so đúng thứ sẽ ghi.
    const normalized = { ...student, id, name, className, history };
    return rowToStudent(
      studentToRow(normalized),
      [...history].reverse().map(item => historyItemToRow(id, item, 'migration'))
    );
  });

  const expected: CloudSnapshot = { students, bossStatesByClass: { ...legacyBossStates } };
  const changes = diffSnapshots(existing, expected);
  const existingIds = new Set(existing.students.map(student => student.id));

  // Dòng sổ chuyển từ dữ liệu cũ mang nguồn 'migration'; thêm "số dư đầu kỳ" để tổng sổ = điểm hiện tại.
  const history: HistoryRow[] = changes.history.map(entry => ({ ...entry, source: 'migration' }));
  changes.students.forEach((row: StudentRow) => {
    if (existingIds.has(row.clientId)) return;
    const student = students.find(s => s.id === row.clientId);
    const historySum = (student?.history ?? []).reduce((sum, item) => sum + item.amount, 0);
    const opening = row.points - historySum;
    if (opening !== 0) {
      const oldest = Math.min(Date.now(), ...(student?.history ?? []).map(item => item.timestamp));
      history.push({
        studentClientId: row.clientId,
        clientEventId: OPENING_BALANCE_EVENT_ID,
        amount: opening,
        reason: 'Số dư chuyển từ dữ liệu cũ',
        occurredAtMs: oldest - 1,
        source: 'opening_balance'
      });
    }
  });

  const classNames = new Set([...students.map(s => s.className), ...Object.keys(legacyBossStates)]);
  return {
    summary: {
      classCount: classNames.size,
      studentCount: students.length,
      historyCount: students.reduce((sum, s) => sum + s.history.length, 0),
      totalPoints: students.reduce((sum, s) => sum + s.points, 0)
    },
    problems,
    warnings,
    expected,
    changes: { ...changes, history }
  };
};

/** So bảng mới (đọc lại sau khi ghi) với dữ liệu cũ đã chuẩn hoá. Trả về danh sách chỗ lệch (rỗng = khớp). */
export const verifyLegacyImport = (expected: CloudSnapshot, actual: CloudSnapshot): string[] => {
  const mismatches: string[] = [];
  if (expected.students.length !== actual.students.length) {
    mismatches.push(`Số học sinh: dữ liệu cũ ${expected.students.length}, bảng mới ${actual.students.length}.`);
  }
  const actualById = new Map(actual.students.map(student => [student.id, student]));
  expected.students.forEach(student => {
    const found = actualById.get(student.id);
    if (!found) {
      mismatches.push(`Thiếu học sinh "${student.name}".`);
      return;
    }
    if (found.points !== student.points) {
      mismatches.push(`Điểm của "${student.name}": cũ ${student.points}, mới ${found.points}.`);
    } else if (stableStringify(found) !== stableStringify(student)) {
      mismatches.push(`Dữ liệu của "${student.name}" chưa khớp (lịch sử, Pokémon hoặc tiến trình).`);
    }
  });
  const expectedBoss = stableStringify(expected.bossStatesByClass);
  if (expectedBoss !== stableStringify(actual.bossStatesByClass)) {
    mismatches.push('Trạng thái Boss của các lớp chưa khớp.');
  }
  return mismatches;
};
