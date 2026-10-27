// Đọc file sao lưu JSON (xuất từ Cài đặt). Chỉ giữ các phần app còn dùng:
// file cũ có thêm phần khác (ví dụ ranksMale/ranksFemale của hệ cấp bậc đã bỏ) vẫn nhập được, phần đó bị bỏ qua.

export const BACKUP_FIELDS = [
  'students',
  'skills',
  'petSkills',
  'posSoundUrl',
  'negSoundUrl',
  'timerSoundUrl',
  'wheelSpinSoundUrl',
  'wheelFinishSoundUrl',
  'customLudoTiles',
  'luckyWheelRewards',
  'bossStatesByClass',
  'bossEncounterFrequency'
] as const;

export type BackupField = typeof BACKUP_FIELDS[number];

/** Giữ nguyên giá trị của các trường đã biết; các khoá khác bị bỏ. Kiểm tra kiểu chi tiết vẫn do nơi nhập làm như cũ. */
export const pickBackupFields = (raw: unknown): Partial<Record<BackupField, any>> => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Backup file must contain a JSON object');
  }
  const source = raw as Record<string, unknown>;
  const picked: Partial<Record<BackupField, any>> = {};
  BACKUP_FIELDS.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(source, field)) picked[field] = source[field];
  });
  return picked;
};
