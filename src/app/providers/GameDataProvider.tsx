import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { BossEncounterFrequency, ClassBossState, LuckyWheelReward, LudoTileSpec, RankInfo, Skill, Student } from '../../types';
import { BOSS_ENCOUNTER_FREQUENCY_KEY, BOSS_STATES_KEY, DEFAULT_LUCKY_WHEEL_REWARDS, DEFAULT_LUDO_TILES, DEFAULT_RANKS_FEMALE, DEFAULT_RANKS_MALE, DEFAULT_SKILLS, LUCKY_WHEEL_REWARDS_KEY, PET_SKILLS_KEY, RANKS_KEY_FEMALE, RANKS_KEY_MALE, SKILLS_KEY, STORAGE_KEY, WHEEL_FINISH_SOUND_KEY, WHEEL_SPIN_SOUND_KEY } from '../../data/constants';
import { LIST_PET_SKILLS as DEFAULT_PET_SKILLS, PetSkill, getRandomPokemon } from '../../data/pokemonData';
import { DEFAULT_BOSS_ENCOUNTER_FREQUENCY, isBossEncounterFrequency, normalizeBossStatesByClass } from '../../domain/bossSystem';
import { fetchUserSettings, upsertUserSettings } from '../../lib/supabaseData';
import { normalizeStudentPokemonData } from '../../domain/pokemonProgression';
import { markExpeditionReadyIfDue } from '../../domain/expeditionSystem';
import { useAuth } from '../../features/auth/AuthContext';

// Dữ liệu lớp học dùng chung (học sinh, cấp bậc, kỹ năng, cài đặt) + lưu localStorage + đồng bộ Supabase + sao lưu/khôi phục.
const useGameDataValue = () => {
  const { user, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [ranksMale, setRanksMale] = useState<RankInfo[]>(DEFAULT_RANKS_MALE);
  const [ranksFemale, setRanksFemale] = useState<RankInfo[]>(DEFAULT_RANKS_FEMALE);
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

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setInitialCloudLoadComplete(false);
      setCloudLoadSuccess(false);
      setLastSyncedTime(null);
      lastSyncedSnapshotRef.current = '';
      return;
    }

    const fetchCloudData = async () => {
      setIsSyncing(true);
      try {
        const cloudData = await fetchUserSettings(user.uid);

        if (cloudData) {
          const cloudStudents = Array.isArray(cloudData.students)
            ? cloudData.students.map(normalizeStudentPokemonData)
            : [];
          if (cloudData.students && Array.isArray(cloudData.students)) setStudents(cloudStudents);
          if (cloudData.ranksMale && Array.isArray(cloudData.ranksMale)) setRanksMale(cloudData.ranksMale);
          if (cloudData.ranksFemale && Array.isArray(cloudData.ranksFemale)) setRanksFemale(cloudData.ranksFemale);
          if (cloudData.skills && Array.isArray(cloudData.skills)) setSkills(cloudData.skills);
          if (cloudData.petSkills && Array.isArray(cloudData.petSkills) && cloudData.petSkills.length > 0) {
            setPetSkills(cloudData.petSkills);
            localStorage.setItem(PET_SKILLS_KEY, JSON.stringify(cloudData.petSkills));
          }
          if (cloudData.posSoundUrl) setPosSoundUrl(cloudData.posSoundUrl);
          if (cloudData.negSoundUrl) setNegSoundUrl(cloudData.negSoundUrl);
          if (cloudData.timerSoundUrl) setTimerSoundUrl(cloudData.timerSoundUrl);
          if (cloudData.wheelSpinSoundUrl) setWheelSpinSoundUrl(cloudData.wheelSpinSoundUrl);
          if (cloudData.wheelFinishSoundUrl) setWheelFinishSoundUrl(cloudData.wheelFinishSoundUrl);
          if (cloudData.customLudoTiles && typeof cloudData.customLudoTiles === 'object') {
            setCustomLudoTiles(cloudData.customLudoTiles);
            localStorage.setItem('custom_ludo_tiles', JSON.stringify(cloudData.customLudoTiles));
          }
          if (cloudData.luckyWheelRewards && Array.isArray(cloudData.luckyWheelRewards) && cloudData.luckyWheelRewards.length > 0) {
            setLuckyWheelRewards(cloudData.luckyWheelRewards);
            setLuckyWheelDisplayRewards(cloudData.luckyWheelRewards);
            localStorage.setItem(LUCKY_WHEEL_REWARDS_KEY, JSON.stringify(cloudData.luckyWheelRewards));
          }
          const cloudBossFrequency = isBossEncounterFrequency(cloudData.bossEncounterFrequency)
            ? cloudData.bossEncounterFrequency
            : DEFAULT_BOSS_ENCOUNTER_FREQUENCY;
          setBossEncounterFrequency(cloudBossFrequency);
          localStorage.setItem(BOSS_ENCOUNTER_FREQUENCY_KEY, cloudBossFrequency);
          const cloudBossStates = normalizeBossStatesByClass(cloudData.bossStatesByClass || {}, cloudBossFrequency);
          setBossStatesByClass(cloudBossStates);
          localStorage.setItem(BOSS_STATES_KEY, JSON.stringify(cloudBossStates));
          setLastSyncedTime(cloudData.updatedAt || Date.now());

          // Save snapshot ref to prevent immediate re-sync of unchanged data
          lastSyncedSnapshotRef.current = JSON.stringify({
            students: cloudStudents,
            ranksMale: cloudData.ranksMale || [],
            ranksFemale: cloudData.ranksFemale || [],
            skills: cloudData.skills || [],
            petSkills: cloudData.petSkills || DEFAULT_PET_SKILLS,
            posSoundUrl: cloudData.posSoundUrl || '',
            negSoundUrl: cloudData.negSoundUrl || '',
            timerSoundUrl: cloudData.timerSoundUrl || '',
            wheelSpinSoundUrl: cloudData.wheelSpinSoundUrl || '',
            wheelFinishSoundUrl: cloudData.wheelFinishSoundUrl || '',
            customLudoTiles: cloudData.customLudoTiles || {},
            luckyWheelRewards: cloudData.luckyWheelRewards || DEFAULT_LUCKY_WHEEL_REWARDS,
            bossStatesByClass: cloudBossStates,
            bossEncounterFrequency: cloudBossFrequency
          });

          // Also save a fallback local copy
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudStudents));
          if (cloudData.ranksMale) localStorage.setItem(RANKS_KEY_MALE, JSON.stringify(cloudData.ranksMale));
          if (cloudData.ranksFemale) localStorage.setItem(RANKS_KEY_FEMALE, JSON.stringify(cloudData.ranksFemale));
          if (cloudData.skills) localStorage.setItem(SKILLS_KEY, JSON.stringify(cloudData.skills));
          if (cloudData.petSkills) localStorage.setItem(PET_SKILLS_KEY, JSON.stringify(cloudData.petSkills));
          if (cloudData.posSoundUrl) localStorage.setItem('imperial_sound_pos', cloudData.posSoundUrl);
          if (cloudData.negSoundUrl) localStorage.setItem('imperial_sound_neg', cloudData.negSoundUrl);
          if (cloudData.timerSoundUrl) localStorage.setItem('imperial_sound_tim', cloudData.timerSoundUrl);
          if (cloudData.wheelSpinSoundUrl) localStorage.setItem(WHEEL_SPIN_SOUND_KEY, cloudData.wheelSpinSoundUrl);
          if (cloudData.wheelFinishSoundUrl) localStorage.setItem(WHEEL_FINISH_SOUND_KEY, cloudData.wheelFinishSoundUrl);
        } else {
          // First time logging in: check if there's any local storage data to migrate
          const saved = localStorage.getItem(STORAGE_KEY);
          let localStudents: Student[] = [];
          if (saved) {
            try {
              localStudents = JSON.parse(saved).map(normalizeStudentPokemonData);
            } catch (err) {
              console.error(err);
            }
          }
          
          const savedMaleRanks = localStorage.getItem(RANKS_KEY_MALE);
          const localMaleRanks = savedMaleRanks ? JSON.parse(savedMaleRanks) : DEFAULT_RANKS_MALE;

          const savedFemaleRanks = localStorage.getItem(RANKS_KEY_FEMALE);
          const localFemaleRanks = savedFemaleRanks ? JSON.parse(savedFemaleRanks) : DEFAULT_RANKS_FEMALE;

          const savedSkills = localStorage.getItem(SKILLS_KEY);
          const localSkills = savedSkills ? JSON.parse(savedSkills) : DEFAULT_SKILLS;

          const savedPetSkills = localStorage.getItem(PET_SKILLS_KEY);
          const localPetSkills = savedPetSkills ? JSON.parse(savedPetSkills) : DEFAULT_PET_SKILLS;

          const savedLuckyWheelRewards = localStorage.getItem(LUCKY_WHEEL_REWARDS_KEY);
          const localLuckyWheelRewards = savedLuckyWheelRewards ? JSON.parse(savedLuckyWheelRewards) : DEFAULT_LUCKY_WHEEL_REWARDS;
          const savedBossFrequency = localStorage.getItem(BOSS_ENCOUNTER_FREQUENCY_KEY);
          const localBossFrequency = isBossEncounterFrequency(savedBossFrequency)
            ? savedBossFrequency
            : DEFAULT_BOSS_ENCOUNTER_FREQUENCY;
          const savedBossStates = localStorage.getItem(BOSS_STATES_KEY);
          const localBossStates = savedBossStates ? normalizeBossStatesByClass(JSON.parse(savedBossStates), localBossFrequency) : {};

          // Push local state to cloud to prevent data loss on onboarding
          const updatedAt = await upsertUserSettings(user.uid, {
            students: localStudents,
            ranksMale: localMaleRanks,
            ranksFemale: localFemaleRanks,
            skills: localSkills,
            petSkills: localPetSkills,
            posSoundUrl,
            negSoundUrl,
            timerSoundUrl,
            wheelSpinSoundUrl,
            wheelFinishSoundUrl,
            customLudoTiles,
            luckyWheelRewards: localLuckyWheelRewards,
            bossStatesByClass: localBossStates,
            bossEncounterFrequency: localBossFrequency
          });

          lastSyncedSnapshotRef.current = JSON.stringify({
            students: localStudents,
            ranksMale: localMaleRanks,
            ranksFemale: localFemaleRanks,
            skills: localSkills,
            petSkills: localPetSkills,
            posSoundUrl,
            negSoundUrl,
            timerSoundUrl,
            wheelSpinSoundUrl,
            wheelFinishSoundUrl,
            customLudoTiles,
            luckyWheelRewards: localLuckyWheelRewards,
            bossStatesByClass: localBossStates,
            bossEncounterFrequency: localBossFrequency
          });
          
          setStudents(localStudents);
          setRanksMale(localMaleRanks);
          setRanksFemale(localFemaleRanks);
          setSkills(localSkills);
          setPetSkills(localPetSkills);
          setLuckyWheelRewards(localLuckyWheelRewards);
          setLuckyWheelDisplayRewards(localLuckyWheelRewards);
          setBossEncounterFrequency(localBossFrequency);
          setBossStatesByClass(localBossStates);
          setLastSyncedTime(updatedAt);
        }
        setCloudLoadSuccess(true);
        setInitialCloudLoadComplete(true);
      } catch (err) {
        console.error("Error pulling database sync from Supabase:", err);
        setCloudLoadSuccess(false);
        setInitialCloudLoadComplete(false);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchCloudData();
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || !initialCloudLoadComplete || !cloudLoadSuccess) return;

    const currentSnapshot = JSON.stringify({
      students,
      ranksMale,
      ranksFemale,
      skills,
      petSkills,
      posSoundUrl,
      negSoundUrl,
      timerSoundUrl,
      wheelSpinSoundUrl,
      wheelFinishSoundUrl,
      customLudoTiles,
      luckyWheelRewards,
      bossStatesByClass,
      bossEncounterFrequency
    });

    // DIFFERENTIAL INCREMENTAL SYNC CHECK:
    // Only perform auto-sync if current data is DIFFERENT from the last synced snapshot!
    // If nothing changed, we skip cloud writes completely to preserve existing data and save bandwidth.
    if (currentSnapshot === lastSyncedSnapshotRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const updatedAt = await upsertUserSettings(user.uid, {
          students,
          ranksMale,
          ranksFemale,
          skills,
          petSkills,
          posSoundUrl,
          negSoundUrl,
          timerSoundUrl,
          wheelSpinSoundUrl,
          wheelFinishSoundUrl,
          customLudoTiles,
          luckyWheelRewards,
          bossStatesByClass,
          bossEncounterFrequency
        });

        lastSyncedSnapshotRef.current = currentSnapshot;
        setLastSyncedTime(updatedAt);
      } catch (err) {
        console.error("Auto-sync to cloud failed:", err);
      } finally {
        setIsSyncing(false);
      }
    }, 1500); // 1.5s debounce to group multiple rapid edits together

    return () => clearTimeout(timer);
  }, [students, ranksMale, ranksFemale, skills, petSkills, posSoundUrl, negSoundUrl, timerSoundUrl, wheelSpinSoundUrl, wheelFinishSoundUrl, customLudoTiles, luckyWheelRewards, bossStatesByClass, bossEncounterFrequency, user, initialCloudLoadComplete, cloudLoadSuccess]);

  useEffect(() => {
    localStorage.setItem('custom_ludo_tiles', JSON.stringify(customLudoTiles));
  }, [customLudoTiles]);

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

      const savedMaleRanks = localStorage.getItem(RANKS_KEY_MALE);
      if (savedMaleRanks) setRanksMale(JSON.parse(savedMaleRanks));
      else setRanksMale(DEFAULT_RANKS_MALE);

      const savedFemaleRanks = localStorage.getItem(RANKS_KEY_FEMALE);
      if (savedFemaleRanks) setRanksFemale(JSON.parse(savedFemaleRanks));
      else setRanksFemale(DEFAULT_RANKS_FEMALE);

      const savedSkills = localStorage.getItem(SKILLS_KEY);
      if (savedSkills) setSkills(JSON.parse(savedSkills));
      else setSkills(DEFAULT_SKILLS);

      const savedPetSkills = localStorage.getItem(PET_SKILLS_KEY);
      if (savedPetSkills) setPetSkills(JSON.parse(savedPetSkills));
      else setPetSkills(DEFAULT_PET_SKILLS);
      
      const sPos = localStorage.getItem('imperial_sound_pos');
      const sNeg = localStorage.getItem('imperial_sound_neg');
      const sTim = localStorage.getItem('imperial_sound_tim');
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
    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students)); 
    }
  }, [students, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem(BOSS_STATES_KEY, JSON.stringify(bossStatesByClass));
    }
  }, [bossStatesByClass, user]);

  useEffect(() => {
    localStorage.setItem(BOSS_ENCOUNTER_FREQUENCY_KEY, bossEncounterFrequency);
  }, [bossEncounterFrequency]);

  useEffect(() => { 
    if (!user) {
      localStorage.setItem(RANKS_KEY_MALE, JSON.stringify(ranksMale)); 
    }
  }, [ranksMale, user]);

  useEffect(() => { 
    if (!user) {
      localStorage.setItem(RANKS_KEY_FEMALE, JSON.stringify(ranksFemale)); 
    }
  }, [ranksFemale, user]);

  useEffect(() => { 
    if (!user) {
      localStorage.setItem(SKILLS_KEY, JSON.stringify(skills)); 
    }
  }, [skills, user]);

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

  const handleExportJSON = () => {
    const data = {
      students,
      skills,
      petSkills,
      ranksMale,
      ranksFemale,
      posSoundUrl,
      negSoundUrl,
      timerSoundUrl,
      wheelSpinSoundUrl,
      wheelFinishSoundUrl,
      customLudoTiles,
      luckyWheelRewards,
      bossStatesByClass,
      bossEncounterFrequency,
      exportedAt: Date.now()
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `classivy_backup_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        const importedStudents = data.students && Array.isArray(data.students)
          ? data.students.map(normalizeStudentPokemonData)
          : [];
        if (data.students && Array.isArray(data.students)) {
          setStudents(importedStudents);
        }
        if (data.skills && Array.isArray(data.skills)) {
          setSkills(data.skills);
        }
        if (data.petSkills && Array.isArray(data.petSkills)) {
          setPetSkills(data.petSkills);
          localStorage.setItem(PET_SKILLS_KEY, JSON.stringify(data.petSkills));
        }
        if (data.ranksMale && Array.isArray(data.ranksMale)) {
          setRanksMale(data.ranksMale);
        }
        if (data.ranksFemale && Array.isArray(data.ranksFemale)) {
          setRanksFemale(data.ranksFemale);
        }
        if (data.posSoundUrl) {
          setPosSoundUrl(data.posSoundUrl);
        }
        if (data.negSoundUrl) {
          setNegSoundUrl(data.negSoundUrl);
        }
        if (data.timerSoundUrl) {
          setTimerSoundUrl(data.timerSoundUrl);
        }
        if (data.wheelSpinSoundUrl) {
          setWheelSpinSoundUrl(data.wheelSpinSoundUrl);
        }
        if (data.wheelFinishSoundUrl) {
          setWheelFinishSoundUrl(data.wheelFinishSoundUrl);
        }
        if (data.customLudoTiles && typeof data.customLudoTiles === 'object') {
          setCustomLudoTiles(data.customLudoTiles);
          localStorage.setItem('custom_ludo_tiles', JSON.stringify(data.customLudoTiles));
        }
        if (data.luckyWheelRewards && Array.isArray(data.luckyWheelRewards)) {
          setLuckyWheelRewards(data.luckyWheelRewards);
          setLuckyWheelDisplayRewards(data.luckyWheelRewards);
          localStorage.setItem(LUCKY_WHEEL_REWARDS_KEY, JSON.stringify(data.luckyWheelRewards));
        }
        const importedBossFrequency = isBossEncounterFrequency(data.bossEncounterFrequency)
          ? data.bossEncounterFrequency
          : bossEncounterFrequency;
        const importedBossStates = data.bossStatesByClass && typeof data.bossStatesByClass === 'object'
          ? normalizeBossStatesByClass(data.bossStatesByClass, importedBossFrequency)
          : {};
        setBossEncounterFrequency(importedBossFrequency);
        localStorage.setItem(BOSS_ENCOUNTER_FREQUENCY_KEY, importedBossFrequency);
        setBossStatesByClass(importedBossStates);
        localStorage.setItem(BOSS_STATES_KEY, JSON.stringify(importedBossStates));

        // Trigger immediate sync to Supabase if user is authenticated
        if (user) {
          setIsSyncing(true);
          upsertUserSettings(user.uid, {
              students: importedStudents,
              ranksMale: data.ranksMale || [],
              ranksFemale: data.ranksFemale || [],
              skills: data.skills || [],
              petSkills: data.petSkills || petSkills,
              posSoundUrl: data.posSoundUrl || "",
              negSoundUrl: data.negSoundUrl || "",
              timerSoundUrl: data.timerSoundUrl || "",
              wheelSpinSoundUrl: data.wheelSpinSoundUrl || wheelSpinSoundUrl,
              wheelFinishSoundUrl: data.wheelFinishSoundUrl || wheelFinishSoundUrl,
              customLudoTiles: data.customLudoTiles || customLudoTiles,
              luckyWheelRewards: data.luckyWheelRewards || luckyWheelRewards,
              bossStatesByClass: importedBossStates,
              bossEncounterFrequency: importedBossFrequency
          }).then((updatedAt) => {
            setLastSyncedTime(updatedAt);
            setIsSyncing(false);
          }).catch((err) => {
            console.error("Cloud sync during import failed:", err);
            setIsSyncing(false);
          });
        }

        alert("Đã phục hồi toàn bộ dữ liệu Trainer Hub thành công!");
      } catch (err) {
        console.error("Import JSON failed", err);
        alert("Có lỗi xảy ra: Không thể giải mã tập tin JSON này! Xin vui lòng kiểm tra lại cấu trúc file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBackupToCloud = async (silent = false) => {
    if (!user) {
      if (!silent) alert("Vui lòng đăng nhập để thực hiện sao lưu lên đám mây!");
      return;
    }
    setIsSyncing(true);
    try {
      const updatedAt = await upsertUserSettings(user.uid, {
        students,
        ranksMale,
        ranksFemale,
        skills,
        petSkills,
        posSoundUrl,
        negSoundUrl,
        timerSoundUrl,
        wheelSpinSoundUrl,
        wheelFinishSoundUrl,
        customLudoTiles,
        luckyWheelRewards,
        bossStatesByClass,
        bossEncounterFrequency
      });
      setLastSyncedTime(updatedAt);
      if (!silent) {
        alert("Toàn bộ dữ liệu trainer, Pokémon và lớp học đã được sao lưu lên đám mây thành công!");
      }
    } catch (err) {
      console.error("Backup to Cloud failed:", err);
      if (!silent) {
        alert("Có lỗi xảy ra khi sao lưu lên đám mây: " + (err instanceof Error ? err.message : String(err)));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để phục hồi dữ liệu!");
      return;
    }
    if (!confirm("Người có chắc chắn muốn PHỤC HỒI dữ liệu từ đám mây? Thao tác này sẽ ghi đè toàn bộ dữ liệu hiện tại trên thiết bị!")) {
      return;
    }
    setIsSyncing(true);
    try {
      const cloudData = await fetchUserSettings(user.uid);

      if (cloudData) {
        if (cloudData.students && Array.isArray(cloudData.students)) {
          setStudents(cloudData.students);
        }
        if (cloudData.ranksMale && Array.isArray(cloudData.ranksMale)) {
          setRanksMale(cloudData.ranksMale);
        }
        if (cloudData.ranksFemale && Array.isArray(cloudData.ranksFemale)) {
          setRanksFemale(cloudData.ranksFemale);
        }
        if (cloudData.skills && Array.isArray(cloudData.skills)) {
          setSkills(cloudData.skills);
        }
        if (cloudData.petSkills && Array.isArray(cloudData.petSkills) && cloudData.petSkills.length > 0) {
          setPetSkills(cloudData.petSkills);
          localStorage.setItem(PET_SKILLS_KEY, JSON.stringify(cloudData.petSkills));
        }
        if (cloudData.posSoundUrl) {
          setPosSoundUrl(cloudData.posSoundUrl);
        }
        if (cloudData.negSoundUrl) {
          setNegSoundUrl(cloudData.negSoundUrl);
        }
        if (cloudData.timerSoundUrl) {
          setTimerSoundUrl(cloudData.timerSoundUrl);
        }
        if (cloudData.wheelSpinSoundUrl) {
          setWheelSpinSoundUrl(cloudData.wheelSpinSoundUrl);
          localStorage.setItem(WHEEL_SPIN_SOUND_KEY, cloudData.wheelSpinSoundUrl);
        }
        if (cloudData.wheelFinishSoundUrl) {
          setWheelFinishSoundUrl(cloudData.wheelFinishSoundUrl);
          localStorage.setItem(WHEEL_FINISH_SOUND_KEY, cloudData.wheelFinishSoundUrl);
        }
        if (cloudData.customLudoTiles && typeof cloudData.customLudoTiles === 'object') {
          setCustomLudoTiles(cloudData.customLudoTiles);
          localStorage.setItem('custom_ludo_tiles', JSON.stringify(cloudData.customLudoTiles));
        }
        if (cloudData.luckyWheelRewards && Array.isArray(cloudData.luckyWheelRewards) && cloudData.luckyWheelRewards.length > 0) {
          setLuckyWheelRewards(cloudData.luckyWheelRewards);
          setLuckyWheelDisplayRewards(cloudData.luckyWheelRewards);
          localStorage.setItem(LUCKY_WHEEL_REWARDS_KEY, JSON.stringify(cloudData.luckyWheelRewards));
        }
        const cloudBossFrequency = isBossEncounterFrequency(cloudData.bossEncounterFrequency)
          ? cloudData.bossEncounterFrequency
          : DEFAULT_BOSS_ENCOUNTER_FREQUENCY;
        const cloudBossStates = normalizeBossStatesByClass(cloudData.bossStatesByClass || {}, cloudBossFrequency);
        setBossEncounterFrequency(cloudBossFrequency);
        localStorage.setItem(BOSS_ENCOUNTER_FREQUENCY_KEY, cloudBossFrequency);
        setBossStatesByClass(cloudBossStates);
        localStorage.setItem(BOSS_STATES_KEY, JSON.stringify(cloudBossStates));
        setLastSyncedTime(cloudData.updatedAt || Date.now());
        alert("Đã khôi phục dữ liệu từ đám mây thành công!");
      } else {
        alert("Không tìm thấy bản sao lưu nào của người dùng này trên Đám mây!");
      }
    } catch (err) {
      console.error("Restore from Cloud failed:", err);
      alert("Có lỗi xảy ra khi phục hồi từ đám mây: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    students, setStudents, ranksMale, setRanksMale, ranksFemale, setRanksFemale, skills,
    setSkills, petSkills, setPetSkills, bossEncounterFrequency, setBossEncounterFrequency,
    bossStatesByClass, setBossStatesByClass, luckyWheelRewards, setLuckyWheelRewards,
    luckyWheelDisplayRewards, setLuckyWheelDisplayRewards, customLudoTiles, setCustomLudoTiles,
    posSoundUrl, setPosSoundUrl, negSoundUrl, setNegSoundUrl, timerSoundUrl, setTimerSoundUrl,
    wheelSpinSoundUrl, setWheelSpinSoundUrl, wheelFinishSoundUrl, setWheelFinishSoundUrl,
    isSyncing, setIsSyncing, lastSyncedTime, setLastSyncedTime, initialCloudLoadComplete,
    setInitialCloudLoadComplete, cloudLoadSuccess, setCloudLoadSuccess, lastSyncedSnapshotRef,
    handleExportJSON, handleImportJSON, handleBackupToCloud, handleRestoreFromCloud
  };
};

export type GameDataValue = ReturnType<typeof useGameDataValue>;

const GameDataContext = createContext<GameDataValue | null>(null);

export const GameDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useGameDataValue();
  return <GameDataContext.Provider value={value}>{children}</GameDataContext.Provider>;
};

export const useGameData = (): GameDataValue => {
  const value = useContext(GameDataContext);
  if (!value) throw new Error('useGameData must be used inside GameDataProvider');
  return value;
};
