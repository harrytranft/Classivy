import {
  areTeacherTablesAvailable,
  fetchTeacherTables,
  fetchUserSettings,
  saveTeacherChanges,
  saveTeacherChangesChecked,
  setDataModelVersion,
  upsertTeacherSettings,
  upsertUserSettings,
  UserSettingsData
} from '../../../lib/supabaseData';
import {
  CloudSnapshot,
  buildSnapshot,
  chunkChanges,
  diffSnapshots,
  isEmptyChanges
} from '../../../domain/cloudModel';
import { LegacyImportPlan, planLegacyImport, verifyLegacyImport } from '../../../domain/legacyImport';
import { ClassBossState, Student } from '../../../types';

// Chọn nơi lưu dữ liệu lớp học trên Supabase:
// - 'legacy': một cục JSON trong user_settings.students (như trước Phase 3);
// - 'tables': bảng classes / students / point_ledger (sau khi giáo viên nâng cấp).
// Supabase chưa chạy migration Phase 3 => luôn 'legacy', app chạy y như cũ.

export type CloudDataModel = 'legacy' | 'tables';

export interface CloudLoadResult {
  data: UserSettingsData;
  dataModel: CloudDataModel;
  /** Bảng mới (khi dataModel = 'tables'): mốc để tính phần thay đổi ở lần lưu sau. */
  snapshot: CloudSnapshot | null;
  /** Đã chạy migration nhưng giáo viên chưa chuyển dữ liệu cũ sang bảng mới. */
  canUpgrade: boolean;
}

const loadTablesSnapshot = async (): Promise<CloudSnapshot> => {
  const tables = await fetchTeacherTables();
  return buildSnapshot(tables.classes, tables.students, tables.history);
};

/** null = giáo viên chưa có dữ liệu trên đám mây (lần đăng nhập đầu). */
export const loadCloudData = async (userId: string): Promise<CloudLoadResult | null> => {
  const settings = await fetchUserSettings(userId);
  if (!settings) return null;
  if (settings.dataModelVersion === 2) {
    const snapshot = await loadTablesSnapshot();
    return {
      data: { ...settings, students: snapshot.students, bossStatesByClass: snapshot.bossStatesByClass },
      dataModel: 'tables',
      snapshot,
      canUpgrade: false
    };
  }
  return { data: settings, dataModel: 'legacy', snapshot: null, canUpgrade: settings.dataModelVersion === 1 };
};

/** Giáo viên mới: dùng bảng mới ngay nếu Supabase đã chạy migration Phase 3. */
export const chooseModelForNewTeacher = async (): Promise<CloudDataModel> =>
  (await areTeacherTablesAvailable()) ? 'tables' : 'legacy';

const sendChanges = async (previous: CloudSnapshot, next: CloudSnapshot): Promise<Record<string, number>> => {
  const changes = diffSnapshots(previous, next);
  if (isEmptyChanges(changes)) return {};
  // Gói thường (vài học sinh) đi trong một transaction; gói rất lớn (nhập file) chia nhỏ.
  // Mỗi gói mang số phiên bản; máy khác đã sửa trước thì DB từ chối (StaleDataError) thay vì ghi đè.
  const batches = changes.students.length <= 20 ? [changes] : chunkChanges(changes);
  const revisions: Record<string, number> = {};
  for (const batch of batches) Object.assign(revisions, (await saveTeacherChangesChecked(batch)).revisions);
  return revisions;
};

// Lưu lần lượt: hai lần lưu không chồng nhau (lần cũ ghi đè lần mới).
let saveQueue: Promise<unknown> = Promise.resolve();

/**
 * Lưu toàn bộ dữ liệu hiện tại. Với bảng mới chỉ gửi phần khác so với `previous` (lần lưu thành công trước).
 * Trả về thời điểm lưu và mốc mới.
 */
export const saveCloudData = async (
  userId: string,
  data: UserSettingsData,
  dataModel: CloudDataModel,
  previous: CloudSnapshot
): Promise<{ updatedAt: number; snapshot: CloudSnapshot }> => {
  const run = saveQueue.then(() => saveNow(userId, data, dataModel, previous));
  saveQueue = run.catch(() => undefined);
  return run;
};

const saveNow = async (
  userId: string,
  data: UserSettingsData,
  dataModel: CloudDataModel,
  previous: CloudSnapshot
): Promise<{ updatedAt: number; snapshot: CloudSnapshot }> => {
  const base: CloudSnapshot = { students: data.students, bossStatesByClass: data.bossStatesByClass || {} };
  if (dataModel === 'legacy') {
    return { updatedAt: await upsertUserSettings(userId, data), snapshot: base };
  }
  const { students: _students, bossStatesByClass: _boss, updatedAt: _u, dataModelVersion: _v, ...settings } = data;
  // Học sinh trước, cài đặt sau: với giáo viên mới, dòng user_settings (data_model_version = 2) chỉ được tạo
  // khi học sinh đã lên bảng; lỗi giữa chừng thì lần sau app thử lại từ đầu thay vì đọc ra lớp trống.
  const revisions = await sendChanges(previous, base);
  const ids = new Set(base.students.map(student => student.id));
  const kept = Object.fromEntries(Object.entries(previous.revisions ?? {}).filter(([id]) => ids.has(id)));
  const snapshot: CloudSnapshot = { ...base, revisions: { ...kept, ...revisions } };
  const updatedAt = await upsertTeacherSettings(userId, settings);
  return { updatedAt, snapshot };
};

// ---------------------------------------------------------------------------
// Nâng cấp dữ liệu cũ (ADR mục 6): chạy thử -> ghi -> đọc lại đối chiếu -> bật bảng mới.
// ---------------------------------------------------------------------------

export interface LegacyData {
  students: Student[];
  bossStatesByClass: Record<string, ClassBossState>;
}

/** Chạy thử: đọc bảng (có thể đã chuyển dở lần trước) và lập kế hoạch, không ghi gì. */
export const previewLegacyUpgrade = async (legacy: LegacyData): Promise<LegacyImportPlan> =>
  planLegacyImport(legacy.students, legacy.bossStatesByClass, await loadTablesSnapshot());

export type UpgradeResult =
  | { ok: true; snapshot: CloudSnapshot }
  | { ok: false; problems: string[] };

export const runLegacyUpgrade = async (userId: string, legacy: LegacyData): Promise<UpgradeResult> => {
  const plan = await previewLegacyUpgrade(legacy);
  if (plan.problems.length > 0) return { ok: false, problems: plan.problems };

  for (const chunk of chunkChanges(plan.changes)) await saveTeacherChanges(chunk);

  const snapshot = await loadTablesSnapshot();
  const mismatches = verifyLegacyImport(plan.expected, snapshot);
  if (mismatches.length > 0) return { ok: false, problems: mismatches };

  await setDataModelVersion(userId, 2);
  return { ok: true, snapshot };
};
