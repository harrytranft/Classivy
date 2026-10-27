import { useRef, useState } from 'react';
import { BossEncounterFrequency, ClassBossState, LuckyWheelReward, LudoTileSpec, Skill, Student } from '../../../types';
import { BOSS_ENCOUNTER_FREQUENCY_KEY, DEFAULT_LUCKY_WHEEL_REWARDS, DEFAULT_LUDO_TILES, DEFAULT_SKILLS, LUCKY_WHEEL_REWARDS_KEY, PET_SKILLS_KEY } from '../../../data/constants';
import { LIST_PET_SKILLS as DEFAULT_PET_SKILLS, PetSkill } from '../../../data/pokemonData';
import { DEFAULT_BOSS_ENCOUNTER_FREQUENCY, isBossEncounterFrequency } from '../../../domain/bossSystem';

// State dữ liệu lớp học dùng chung. Khởi tạo giống hệt App.tsx cũ (một số giá trị đọc từ localStorage).
export const useGameDataState = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS);

  const [petSkills, setPetSkills] = useState<PetSkill[]>(() => {
    const saved = localStorage.getItem(PET_SKILLS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {
        console.error("Error loading custom Pokemon skills:", err);
      }
    }
    return DEFAULT_PET_SKILLS;
  });

  const [bossEncounterFrequency, setBossEncounterFrequency] = useState<BossEncounterFrequency>(() => {
    const saved = localStorage.getItem(BOSS_ENCOUNTER_FREQUENCY_KEY);
    return isBossEncounterFrequency(saved) ? saved : DEFAULT_BOSS_ENCOUNTER_FREQUENCY;
  });

  const [bossStatesByClass, setBossStatesByClass] = useState<Record<string, ClassBossState>>({});

  const [luckyWheelRewards, setLuckyWheelRewards] = useState<LuckyWheelReward[]>(() => {
    const saved = localStorage.getItem(LUCKY_WHEEL_REWARDS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (err) {
        console.error("Error loading custom lucky wheel rewards:", err);
      }
    }
    return DEFAULT_LUCKY_WHEEL_REWARDS;
  });

  const [luckyWheelDisplayRewards, setLuckyWheelDisplayRewards] = useState<LuckyWheelReward[]>(DEFAULT_LUCKY_WHEEL_REWARDS);

  const [customLudoTiles, setCustomLudoTiles] = useState<Record<number, LudoTileSpec>>(() => {
    const saved = localStorage.getItem('custom_ludo_tiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Error loading custom Ludo tiles:", err);
      }
    }
    return DEFAULT_LUDO_TILES;
  });

  const [posSoundUrl, setPosSoundUrl] = useState('https://actions.google.com/sounds/v1/foley/ting.ogg');
  const [negSoundUrl, setNegSoundUrl] = useState('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
  const [timerSoundUrl, setTimerSoundUrl] = useState('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');
  const [wheelSpinSoundUrl, setWheelSpinSoundUrl] = useState('https://actions.google.com/sounds/v1/transportation/airport_departure_chime.ogg');
  const [wheelFinishSoundUrl, setWheelFinishSoundUrl] = useState('https://actions.google.com/sounds/v1/cartoon/concussive_hit_guitar_boing.ogg');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<number | null>(null);
  const [initialCloudLoadComplete, setInitialCloudLoadComplete] = useState(false);
  const [cloudLoadSuccess, setCloudLoadSuccess] = useState(false);
  const lastSyncedSnapshotRef = useRef<string>('');

  return {
    students, setStudents, skills,
    setSkills, petSkills, setPetSkills, bossEncounterFrequency, setBossEncounterFrequency,
    bossStatesByClass, setBossStatesByClass, luckyWheelRewards, setLuckyWheelRewards,
    luckyWheelDisplayRewards, setLuckyWheelDisplayRewards, customLudoTiles, setCustomLudoTiles,
    posSoundUrl, setPosSoundUrl, negSoundUrl, setNegSoundUrl, timerSoundUrl, setTimerSoundUrl,
    wheelSpinSoundUrl, setWheelSpinSoundUrl, wheelFinishSoundUrl, setWheelFinishSoundUrl,
    isSyncing, setIsSyncing, lastSyncedTime, setLastSyncedTime, initialCloudLoadComplete,
    setInitialCloudLoadComplete, cloudLoadSuccess, setCloudLoadSuccess, lastSyncedSnapshotRef
  };
};

export type GameDataState = ReturnType<typeof useGameDataState>;
