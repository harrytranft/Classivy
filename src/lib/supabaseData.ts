import { supabase } from './supabaseClient';
import { BossEncounterFrequency, ClassBossState, LuckyWheelReward, Skill, Student, LudoTileSpec } from '../types';
import { PetSkill } from '../data/pokemonData';
import { ClassChange, HistoryRow, StudentRow, TeacherChanges, toRpcPayload } from '../domain/cloudModel';

export interface UserSettingsData {
  students: Student[];
  skills: Skill[];
  petSkills?: PetSkill[];
  posSoundUrl: string;
  negSoundUrl: string;
  timerSoundUrl: string;
  wheelSpinSoundUrl?: string;
  wheelFinishSoundUrl?: string;
  customLudoTiles?: Record<number, LudoTileSpec>;
  luckyWheelRewards?: LuckyWheelReward[];
  bossStatesByClass?: Record<string, ClassBossState>;
  bossEncounterFrequency?: BossEncounterFrequency;
  updatedAt?: number;
  /** 1 = dữ liệu cũ (cột students), 2 = bảng mới (Phase 3). Không có = Supabase chưa chạy migration Phase 3. */
  dataModelVersion?: 1 | 2;
}

export const sanitizeForSupabase = (val: any): any => {
  if (val === undefined) return null;
  if (val === null) return null;
  if (Array.isArray(val)) {
    return val.map(sanitizeForSupabase);
  }
  if (typeof val === 'object') {
    if (val instanceof Date) return val.toISOString();
    const clean: any = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        const v = val[key];
        if (v !== undefined) {
          clean[key] = sanitizeForSupabase(v);
        }
      }
    }
    return clean;
  }
  return val;
};

export const fetchUserSettings = async (userId: string): Promise<UserSettingsData | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    students: Array.isArray(data.students) ? data.students : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    petSkills: Array.isArray(data.pet_skills) ? data.pet_skills : undefined,
    posSoundUrl: data.pos_sound_url || '',
    negSoundUrl: data.neg_sound_url || '',
    timerSoundUrl: data.timer_sound_url || '',
    wheelSpinSoundUrl: data.wheel_spin_sound_url || '',
    wheelFinishSoundUrl: data.wheel_finish_sound_url || '',
    customLudoTiles: data.custom_ludo_tiles || {},
    luckyWheelRewards: Array.isArray(data.lucky_wheel_rewards) ? data.lucky_wheel_rewards : undefined,
    bossStatesByClass: data.boss_states_by_class || {},
    bossEncounterFrequency: data.boss_encounter_frequency || undefined,
    updatedAt: data.updated_at_ms || undefined,
    dataModelVersion: data.data_model_version === 2 ? 2 : data.data_model_version === 1 ? 1 : undefined
  };
};

export const upsertUserSettings = async (userId: string, settings: UserSettingsData): Promise<number> => {
  const updatedAt = Date.now();
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      students: sanitizeForSupabase(settings.students || []),
      skills: sanitizeForSupabase(settings.skills || []),
      pet_skills: sanitizeForSupabase(settings.petSkills || []),
      pos_sound_url: settings.posSoundUrl || '',
      neg_sound_url: settings.negSoundUrl || '',
      timer_sound_url: settings.timerSoundUrl || '',
      wheel_spin_sound_url: settings.wheelSpinSoundUrl || '',
      wheel_finish_sound_url: settings.wheelFinishSoundUrl || '',
      custom_ludo_tiles: sanitizeForSupabase(settings.customLudoTiles || {}),
      lucky_wheel_rewards: sanitizeForSupabase(settings.luckyWheelRewards || []),
      boss_states_by_class: sanitizeForSupabase(settings.bossStatesByClass || {}),
      boss_encounter_frequency: settings.bossEncounterFrequency || 'occasional',
      updated_at_ms: updatedAt,
      updated_at: new Date(updatedAt).toISOString()
    }, { onConflict: 'user_id' });

  if (error) throw error;
  return updatedAt;
};

// ---------------------------------------------------------------------------
// Phase 3: bảng classes / students / point_ledger (ADR docs/adr/0001-phase-3-data-model.md)
// ---------------------------------------------------------------------------

type SettingsOnly = Omit<UserSettingsData, 'students' | 'bossStatesByClass' | 'updatedAt' | 'dataModelVersion'>;

/** Lưu cài đặt giáo viên khi đã dùng bảng mới: không ghi cột students/boss cũ (giữ làm bản hoàn tác). */
export const upsertTeacherSettings = async (userId: string, settings: SettingsOnly): Promise<number> => {
  const updatedAt = Date.now();
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      skills: sanitizeForSupabase(settings.skills || []),
      pet_skills: sanitizeForSupabase(settings.petSkills || []),
      pos_sound_url: settings.posSoundUrl || '',
      neg_sound_url: settings.negSoundUrl || '',
      timer_sound_url: settings.timerSoundUrl || '',
      wheel_spin_sound_url: settings.wheelSpinSoundUrl || '',
      wheel_finish_sound_url: settings.wheelFinishSoundUrl || '',
      custom_ludo_tiles: sanitizeForSupabase(settings.customLudoTiles || {}),
      lucky_wheel_rewards: sanitizeForSupabase(settings.luckyWheelRewards || []),
      boss_encounter_frequency: settings.bossEncounterFrequency || 'occasional',
      data_model_version: 2,
      updated_at_ms: updatedAt,
      updated_at: new Date(updatedAt).toISOString()
    }, { onConflict: 'user_id' });

  if (error) throw error;
  return updatedAt;
};

export const setDataModelVersion = async (userId: string, version: 1 | 2): Promise<void> => {
  const { error } = await supabase
    .from('user_settings')
    .update({ data_model_version: version })
    .eq('user_id', userId);
  if (error) throw error;
};

/** Bảng Phase 3 đã có trên Supabase chưa (migration đã chạy chưa). */
export const areTeacherTablesAvailable = async (): Promise<boolean> => {
  const { error } = await supabase.from('classes').select('id', { head: true, count: 'exact' }).limit(1);
  return !error;
};

// Supabase trả tối đa 1.000 dòng mỗi lần: đọc từng trang.
const PAGE_SIZE = 1000;
const fetchAllPages = async <T>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> => {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await query(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = data ?? [];
    all.push(...page);
    if (page.length < PAGE_SIZE) return all;
  }
};

export interface TeacherTables {
  classes: ClassChange[];
  students: StudentRow[];
  /** Theo thứ tự ghi (cũ trước). */
  history: HistoryRow[];
}

export const fetchTeacherTables = async (): Promise<TeacherTables> => {
  const classRows = await fetchAllPages<{ id: string; name: string; boss_state: ClassBossState | null }>((from, to) =>
    supabase.from('classes').select('id, name, boss_state').order('name').range(from, to));
  const classNameById = new Map(classRows.map(row => [row.id, row.name]));

  const studentRows = await fetchAllPages<{
    client_id: string; class_id: string; name: string; gender: string; points: number;
    avatar: string | null; game_state: Record<string, unknown> | null;
  }>((from, to) =>
    supabase.from('students')
      .select('client_id, class_id, name, gender, points, avatar, game_state')
      .order('created_at').order('id')
      .range(from, to));

  const historyRows = await fetchAllPages<{
    student_client_id: string; client_event_id: string; amount: number; reason: string; occurred_at: string;
  }>((from, to) =>
    supabase.from('student_recent_history')
      .select('student_client_id, client_event_id, amount, reason, occurred_at, id')
      .order('id')
      .range(from, to));

  return {
    classes: classRows.map(row => ({ name: row.name, bossState: row.boss_state })),
    students: studentRows.map(row => ({
      clientId: row.client_id,
      className: classNameById.get(row.class_id) ?? '',
      name: row.name,
      gender: row.gender as StudentRow['gender'],
      points: row.points,
      avatar: row.avatar,
      gameState: (row.game_state ?? {}) as StudentRow['gameState']
    })),
    history: historyRows.map(row => ({
      studentClientId: row.student_client_id,
      clientEventId: row.client_event_id,
      amount: row.amount,
      reason: row.reason,
      occurredAtMs: Date.parse(row.occurred_at),
      source: 'app'
    }))
  };
};

/** Ghi một gói thay đổi trong một transaction (hàm DB save_teacher_changes). */
export const saveTeacherChanges = async (changes: TeacherChanges): Promise<number> => {
  const { data, error } = await supabase.rpc('save_teacher_changes', { p_changes: sanitizeForSupabase(toRpcPayload(changes)) });
  if (error) throw error;
  return Number(data) || Date.now();
};
