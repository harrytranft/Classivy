import { ClassroomSettings, LudoChallenge, WildHuntSettings } from '../types';

export const CLASSROOM_SETTINGS_KEY = 'classivy_classroom_settings';

export const DEFAULT_WILD_HUNT_SETTINGS: WildHuntSettings = {
  enabled: true,
  startOffsetMinutes: 30,
  lingerMinutes: 5,
  rarityWeights: { common: 70, rare: 25, legendary: 5 },
  correctNeeded: { common: 3, rare: 4, legendary: 5 },
  maxWrong: 3,
  minPresentStudents: 4,
  consolationPoints: 2
};

export const DEFAULT_LUDO_CHALLENGES: LudoChallenge[] = [
  { id: 'challenge-default-1', text: 'Nói 3 từ tiếng Anh về chủ đề bài hôm nay', icon: '💬', enabled: true },
  { id: 'challenge-default-2', text: 'Đặt một câu với từ vừa học', icon: '✍️', enabled: true },
  { id: 'challenge-default-3', text: 'Đọc to một câu mẫu trong bài', icon: '📣', enabled: true },
  { id: 'challenge-default-4', text: 'Nói từ trái nghĩa của một từ cô đưa ra', icon: '🔁', enabled: true },
  { id: 'challenge-default-5', text: 'Giới thiệu bản thân bằng 2 câu tiếng Anh', icon: '🙋', enabled: true },
  { id: 'challenge-default-6', text: 'Đánh vần một từ cô đưa ra', icon: '🔤', enabled: true },
  { id: 'challenge-default-7', text: 'Mô tả một đồ vật trong lớp bằng 2 câu', icon: '🪑', enabled: true },
  { id: 'challenge-default-8', text: 'Hỏi một bạn một câu hỏi bằng tiếng Anh', icon: '❓', enabled: true },
  { id: 'challenge-default-9', text: 'Kể tên 4 con vật hoặc 4 màu sắc bằng tiếng Anh', icon: '🐾', enabled: true },
  { id: 'challenge-default-10', text: 'Diễn tả một từ bằng hành động cho cả lớp đoán', icon: '🎭', enabled: true }
];

export const createDefaultClassroomSettings = (): ClassroomSettings => ({
  wildHunt: { ...DEFAULT_WILD_HUNT_SETTINGS, rarityWeights: { ...DEFAULT_WILD_HUNT_SETTINGS.rarityWeights }, correctNeeded: { ...DEFAULT_WILD_HUNT_SETTINGS.correctNeeded } },
  ludoChallenges: DEFAULT_LUDO_CHALLENGES.map(challenge => ({ ...challenge })),
  classSchedules: {}
});
