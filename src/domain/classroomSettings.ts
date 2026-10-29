import { CLASSROOM_SETTINGS_KEY, DEFAULT_WILD_HUNT_SETTINGS, createDefaultClassroomSettings } from '../data/classroomDefaults';
import { ClassroomSettings, LudoChallenge, WildHuntSettings, WildRarity } from '../types';

// Chuẩn hoá cài đặt lớp học từ nguồn không tin cậy (cloud, localStorage, file sao lưu):
// thiếu/sai thì dùng mặc định, số thì bị kẹp trong khoảng hợp lý. Hàm thuần, có test.

const RARITIES: WildRarity[] = ['common', 'rare', 'legendary'];
const MAX_CHALLENGES = 50;
const MAX_CHALLENGE_TEXT = 200;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
};

const normalizeRarityMap = (value: unknown, min: number, max: number, fallback: Record<WildRarity, number>): Record<WildRarity, number> => {
  const source = isRecord(value) ? value : {};
  return {
    common: clampInt(source.common, min, max, fallback.common),
    rare: clampInt(source.rare, min, max, fallback.rare),
    legendary: clampInt(source.legendary, min, max, fallback.legendary)
  };
};

export const normalizeWildHuntSettings = (value: unknown): WildHuntSettings => {
  const defaults = DEFAULT_WILD_HUNT_SETTINGS;
  const source = isRecord(value) ? value : {};
  const delayMin = clampInt(source.delayMinMinutes, 1, 240, defaults.delayMinMinutes);
  const delayMax = clampInt(source.delayMaxMinutes, 1, 240, defaults.delayMaxMinutes);
  const rarityWeights = normalizeRarityMap(source.rarityWeights, 0, 100, defaults.rarityWeights);
  // Cả ba trọng số bằng 0 thì không bốc được độ hiếm nào: quay về mặc định.
  const weightsValid = RARITIES.some(rarity => rarityWeights[rarity] > 0);
  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : defaults.enabled,
    delayMinMinutes: Math.min(delayMin, delayMax),
    delayMaxMinutes: Math.max(delayMin, delayMax),
    lingerMinutes: clampInt(source.lingerMinutes, 1, 60, defaults.lingerMinutes),
    rarityWeights: weightsValid ? rarityWeights : { ...defaults.rarityWeights },
    correctNeeded: normalizeRarityMap(source.correctNeeded, 1, 10, defaults.correctNeeded),
    maxWrong: clampInt(source.maxWrong, 1, 10, defaults.maxWrong),
    minPresentStudents: clampInt(source.minPresentStudents, 1, 60, defaults.minPresentStudents),
    consolationPoints: clampInt(source.consolationPoints, 0, 10, defaults.consolationPoints)
  };
};

export const normalizeLudoChallenges = (value: unknown): LudoChallenge[] => {
  if (!Array.isArray(value)) return createDefaultClassroomSettings().ludoChallenges;
  const seen = new Set<string>();
  const result: LudoChallenge[] = [];
  value.forEach((item, index) => {
    if (!isRecord(item) || result.length >= MAX_CHALLENGES) return;
    const text = typeof item.text === 'string' ? item.text.trim().slice(0, MAX_CHALLENGE_TEXT) : '';
    if (!text) return;
    let id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `challenge-${index + 1}`;
    while (seen.has(id)) id = `${id}-${seen.size}`;
    seen.add(id);
    result.push({
      id,
      text,
      icon: typeof item.icon === 'string' && item.icon.trim() ? item.icon.trim().slice(0, 8) : '🎯',
      enabled: typeof item.enabled === 'boolean' ? item.enabled : true
    });
  });
  // Mảng rỗng là lựa chọn hợp lệ của giáo viên (xoá hết thử thách); chỉ dữ liệu không phải mảng mới quay về mặc định.
  return result;
};

/** Giá trị rỗng/sai kiểu ({} từ cột mới, null, chuỗi...) cho ra bản mặc định. */
export const normalizeClassroomSettings = (value: unknown): ClassroomSettings => {
  const source = isRecord(value) ? value : {};
  return {
    wildHunt: normalizeWildHuntSettings(source.wildHunt),
    ludoChallenges: normalizeLudoChallenges(source.ludoChallenges)
  };
};

export const loadLocalClassroomSettings = (): ClassroomSettings => {
  try {
    const saved = localStorage.getItem(CLASSROOM_SETTINGS_KEY);
    if (saved) return normalizeClassroomSettings(JSON.parse(saved));
  } catch (err) {
    console.error('Error loading classroom settings:', err);
  }
  return createDefaultClassroomSettings();
};
