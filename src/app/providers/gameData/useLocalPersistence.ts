import { useEffect } from 'react';
import { BOSS_ENCOUNTER_FREQUENCY_KEY, BOSS_STATES_KEY, DEFAULT_LUCKY_WHEEL_REWARDS, DEFAULT_SKILLS, LUCKY_WHEEL_REWARDS_KEY, PET_SKILLS_KEY, SKILLS_KEY, STORAGE_KEY, NEG_SOUND_KEY, POS_SOUND_KEY, TIMER_SOUND_KEY, WHEEL_FINISH_SOUND_KEY, WHEEL_SPIN_SOUND_KEY } from '../../../data/constants';
import { CLASSROOM_SETTINGS_KEY } from '../../../data/classroomDefaults';
import { Student } from '../../../types';
import { LIST_PET_SKILLS as DEFAULT_PET_SKILLS, getRandomPokemon } from '../../../data/pokemonData';
import { normalizeStudentPokemonData } from '../../../domain/pokemonProgression';
import { DEFAULT_BOSS_ENCOUNTER_FREQUENCY, isBossEncounterFrequency, normalizeBossStatesByClass } from '../../../domain/bossSystem';
import { markExpeditionReadyIfDue } from '../../../domain/expeditionSystem';
import { GameDataState } from './useGameDataState';
import type { AuthUser } from '../../../features/auth/AuthContext';

// Lưu/đọc localStorage (chế độ chưa đăng nhập và các cài đặt luôn lưu máy) + đánh dấu expedition đến hạn.
export const useLocalPersistence = (data: GameDataState, user: AuthUser | null, authLoading: boolean) => {
  const {
    students, setStudents, skills,
    setSkills, petSkills, setPetSkills, bossEncounterFrequency, setBossEncounterFrequency,
    bossStatesByClass, setBossStatesByClass, luckyWheelRewards, setLuckyWheelRewards,
    setLuckyWheelDisplayRewards, customLudoTiles, setPosSoundUrl, setNegSoundUrl,
    setTimerSoundUrl, setWheelSpinSoundUrl, setWheelFinishSoundUrl, classroomSettings
  } = data;

  useEffect(() => {
    localStorage.setItem('custom_ludo_tiles', JSON.stringify(customLudoTiles));
  }, [customLudoTiles]);

  useEffect(() => {
    localStorage.setItem(CLASSROOM_SETTINGS_KEY, JSON.stringify(classroomSettings));
  }, [classroomSettings]);

  useEffect(() => {
    localStorage.setItem(PET_SKILLS_KEY, JSON.stringify(petSkills));
  }, [petSkills]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed: Student[] = JSON.parse(saved);
          const migrated = parsed.map(s => {
            if (!s.egg && !s.pet) {
              const randomPokemon = getRandomPokemon();
              return {
                ...s,
                egg: {
                  progress: 0,
                  status: 'egg' as const,
                  assignedDexId: randomPokemon.dexId,
                  kind: 'normal' as const,
                  requiredProgress: 10
                }
              };
            }
            return s;
          }).map(normalizeStudentPokemonData);
          setStudents(migrated);
        } catch (err) {
          console.error("Failed to parse saved students", err);
        }
      } else {
        setStudents([]);
      }



      const savedSkills = localStorage.getItem(SKILLS_KEY);
      if (savedSkills) setSkills(JSON.parse(savedSkills));
      else setSkills(DEFAULT_SKILLS);

      const savedPetSkills = localStorage.getItem(PET_SKILLS_KEY);
      if (savedPetSkills) setPetSkills(JSON.parse(savedPetSkills));
      else setPetSkills(DEFAULT_PET_SKILLS);
      
      const sPos = localStorage.getItem(POS_SOUND_KEY);
      const sNeg = localStorage.getItem(NEG_SOUND_KEY);
      const sTim = localStorage.getItem(TIMER_SOUND_KEY);
      const sWheelSpin = localStorage.getItem(WHEEL_SPIN_SOUND_KEY);
      const sWheelFinish = localStorage.getItem(WHEEL_FINISH_SOUND_KEY);
      if (sPos) setPosSoundUrl(sPos);
      if (sNeg) setNegSoundUrl(sNeg);
      if (sTim) setTimerSoundUrl(sTim);
      if (sWheelSpin) setWheelSpinSoundUrl(sWheelSpin);
      if (sWheelFinish) setWheelFinishSoundUrl(sWheelFinish);

      const savedLuckyWheelRewards = localStorage.getItem(LUCKY_WHEEL_REWARDS_KEY);
      if (savedLuckyWheelRewards) {
        const parsedRewards = JSON.parse(savedLuckyWheelRewards);
        if (Array.isArray(parsedRewards) && parsedRewards.length > 0) {
          setLuckyWheelRewards(parsedRewards);
          setLuckyWheelDisplayRewards(parsedRewards);
        }
      } else {
        setLuckyWheelRewards(DEFAULT_LUCKY_WHEEL_REWARDS);
        setLuckyWheelDisplayRewards(DEFAULT_LUCKY_WHEEL_REWARDS);
      }

      const savedBossFrequency = localStorage.getItem(BOSS_ENCOUNTER_FREQUENCY_KEY);
      const localBossFrequency = isBossEncounterFrequency(savedBossFrequency)
        ? savedBossFrequency
        : DEFAULT_BOSS_ENCOUNTER_FREQUENCY;
      setBossEncounterFrequency(localBossFrequency);
      const savedBossStates = localStorage.getItem(BOSS_STATES_KEY);
      if (savedBossStates) {
        try {
          setBossStatesByClass(normalizeBossStatesByClass(JSON.parse(savedBossStates), localBossFrequency));
        } catch (err) {
          console.error("Failed to parse saved boss states", err);
          setBossStatesByClass({});
        }
      } else {
        setBossStatesByClass({});
      }
    }
  }, [authLoading, user]);

  useEffect(() => {
    // Chờ biết trạng thái đăng nhập: lúc đang tải, state còn là giá trị rỗng ban đầu và sẽ đè mất bản lưu trên máy.
    if (!authLoading && !user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    }
  }, [students, user, authLoading]);

  useEffect(() => {
    // Chờ biết trạng thái đăng nhập: lúc đang tải, state còn là giá trị rỗng ban đầu và sẽ đè mất bản lưu trên máy.
    if (!authLoading && !user) {
      localStorage.setItem(BOSS_STATES_KEY, JSON.stringify(bossStatesByClass));
    }
  }, [bossStatesByClass, user, authLoading]);

  useEffect(() => {
    localStorage.setItem(BOSS_ENCOUNTER_FREQUENCY_KEY, bossEncounterFrequency);
  }, [bossEncounterFrequency]);

  useEffect(() => {
    // Chờ biết trạng thái đăng nhập: lúc đang tải, state còn là giá trị rỗng ban đầu và sẽ đè mất bản lưu trên máy.
    if (!authLoading && !user) {
      localStorage.setItem(SKILLS_KEY, JSON.stringify(skills));
    }
  }, [skills, user, authLoading]);

  useEffect(() => {
    localStorage.setItem(LUCKY_WHEEL_REWARDS_KEY, JSON.stringify(luckyWheelRewards));
  }, [luckyWheelRewards]);

  useEffect(() => {
    const timestamp = Date.now();
    let changed = false;
    const updatedStudents = students.map(student => {
      const nextStudent = markExpeditionReadyIfDue(student, timestamp);
      if (nextStudent !== student) changed = true;
      return nextStudent;
    });
    if (changed) setStudents(updatedStudents);
  }, [students]);
};
