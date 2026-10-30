import { CloudSnapshot, stableStringify } from './cloudModel';
import { HistoryItem, Student } from '../types';
import { RECENT_HISTORY_LIMIT } from './cloudModel';

// Tự gộp khi lần lưu bị từ chối vì học sinh vừa được sửa ở nơi khác (ví dụ em mua đồ trong Shop ở nhà
// trong lúc giáo viên đang dạy). Gộp ba chiều: base = bản app đã lưu/đọc lần trước, local = bản hiện tại
// trên máy giáo viên, server = bản mới nhất trên Supabase.
//   * Điểm: cộng phần chênh của giáo viên lên điểm mới (em mua -5, cô +3 => cả hai đều được tính).
//   * Phần còn lại: chỗ nào giáo viên không đổi thì lấy bản mới; chỗ nào chỉ giáo viên đổi thì giữ của giáo viên;
//     cả hai cùng đổi thì gộp sâu theo từng khoá / từng phần tử có mã (Pokémon theo instanceId...);
//     đụng đúng cùng một giá trị thì bản của giáo viên thắng.
//   * Lịch sử điểm: hợp hai danh sách theo mã sự kiện.
// Hàm thuần, có test.

const same = (a: unknown, b: unknown) => stableStringify(a) === stableStringify(b);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const itemKey = (value: unknown): string | null => {
  if (!isPlainObject(value)) return null;
  const key = value.instanceId ?? value.id ?? value.badgeId;
  return typeof key === 'string' || typeof key === 'number' ? String(key) : null;
};

const isKeyedArray = (value: unknown): value is unknown[] =>
  Array.isArray(value) && value.every(item => itemKey(item) !== null);

const mergeKeyedArrays = (base: unknown[], local: unknown[], server: unknown[]): unknown[] => {
  const byKey = (list: unknown[]) => new Map(list.map(item => [itemKey(item) as string, item]));
  const baseMap = byKey(base);
  const localMap = byKey(local);
  const serverMap = byKey(server);
  const result: unknown[] = [];
  const seen = new Set<string>();
  // Thứ tự: theo bản mới trên server, rồi các phần tử giáo viên mới thêm.
  for (const key of [...serverMap.keys(), ...localMap.keys()]) {
    if (seen.has(key)) continue;
    seen.add(key);
    const b = baseMap.get(key);
    const l = localMap.get(key);
    const s = serverMap.get(key);
    if (l === undefined && s === undefined) continue;
    if (l === undefined) {
      // Giáo viên đã xoá phần tử này (có trong base); server không sửa nó thì xoá theo giáo viên.
      if (b !== undefined && same(b, s)) continue;
      result.push(s);
      continue;
    }
    if (s === undefined) {
      // Server đã xoá (ví dụ em hợp nhất 2 Pokémon); giáo viên không sửa thì theo server.
      if (b !== undefined && same(b, l)) continue;
      result.push(l);
      continue;
    }
    result.push(b === undefined ? l : mergeValue(b, l, s));
  }
  return result;
};

/** Gộp ba chiều một giá trị bất kỳ. */
export const mergeValue = (base: unknown, local: unknown, server: unknown): unknown => {
  if (same(local, base)) return server;
  if (same(server, base) || same(server, local)) return local;
  if (isPlainObject(base) && isPlainObject(local) && isPlainObject(server)) {
    const merged: Record<string, unknown> = {};
    const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(server)]);
    keys.forEach(key => {
      const value = mergeValue(base[key], local[key], server[key]);
      if (value !== undefined) merged[key] = value;
    });
    return merged;
  }
  if (isKeyedArray(base) && isKeyedArray(local) && isKeyedArray(server)) {
    return mergeKeyedArrays(base, local, server);
  }
  return local;
};

const mergeHistory = (local: HistoryItem[] = [], server: HistoryItem[] = []): HistoryItem[] => {
  const byId = new Map<string, HistoryItem>();
  [...local, ...server].forEach(item => { if (!byId.has(String(item.id))) byId.set(String(item.id), item); });
  return [...byId.values()]
    .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0))
    .slice(0, RECENT_HISTORY_LIMIT);
};

/**
 * Gộp một học sinh. server = undefined nghĩa là em đã bị xoá ở nơi khác => trả về null (bỏ khỏi máy này).
 * base = undefined (không có bản gốc) => giữ bản của giáo viên.
 */
export const mergeStudent = (base: Student | undefined, local: Student, server: Student | undefined): Student | null => {
  if (!server) return null;
  if (!base) return local;
  const { points: basePoints, history: _bh, ...baseRest } = base;
  const { points: localPoints, history: localHistory, ...localRest } = local;
  const { points: serverPoints, history: serverHistory, ...serverRest } = server;
  const rest = mergeValue(baseRest, localRest, serverRest) as Omit<Student, 'points' | 'history'>;
  const delta = (Number(localPoints) || 0) - (Number(basePoints) || 0);
  return {
    ...rest,
    id: local.id,
    points: (Number(serverPoints) || 0) + delta,
    history: mergeHistory(localHistory, serverHistory)
  };
};

/**
 * Áp kết quả gộp cho các em bị xung đột.
 * - students: danh sách hiện tại trên máy giáo viên (đã gồm cả thao tác làm trong lúc chờ).
 * - base: mốc của lần lưu bị từ chối.
 * - fresh: bản mới đọc từ Supabase, chỉ gồm các em bị xung đột (thiếu em nào = em đó đã bị xoá).
 * Trả về danh sách học sinh mới và mốc mới (các em xung đột lấy theo bản mới + số phiên bản mới),
 * để lần lưu kế tiếp chỉ gửi phần giáo viên đã đổi.
 */
export const mergeConflicts = (
  students: Student[],
  base: CloudSnapshot,
  fresh: CloudSnapshot,
  conflictIds: string[]
): { students: Student[]; snapshot: CloudSnapshot } => {
  const ids = new Set(conflictIds);
  const baseById = new Map(base.students.map(student => [student.id, student]));
  const freshById = new Map(fresh.students.map(student => [student.id, student]));

  const nextStudents: Student[] = [];
  students.forEach(student => {
    if (!ids.has(student.id)) { nextStudents.push(student); return; }
    const merged = mergeStudent(baseById.get(student.id), student, freshById.get(student.id));
    if (merged) nextStudents.push(merged);
  });

  const revisions = { ...(base.revisions ?? {}) };
  const snapshotStudents: Student[] = [];
  base.students.forEach(student => {
    if (!ids.has(student.id)) { snapshotStudents.push(student); return; }
    const server = freshById.get(student.id);
    if (server) snapshotStudents.push(server);
  });
  ids.forEach(id => {
    const server = freshById.get(id);
    if (server && !baseById.has(id)) snapshotStudents.push(server);
    if (server && typeof fresh.revisions?.[id] === 'number') revisions[id] = fresh.revisions[id];
    else delete revisions[id];
  });

  return { students: nextStudents, snapshot: { ...base, students: snapshotStudents, revisions } };
};
