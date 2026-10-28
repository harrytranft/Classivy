import { useEffect } from 'react';
import { chooseModelForNewTeacher, loadCloudData, runLegacyUpgrade, saveCloudData } from './cloudStore';
import { EMPTY_SNAPSHOT } from '../../../domain/cloudModel';
import { normalizeStudentPokemonData } from '../../../domain/pokemonProgression';
import { BOSS_ENCOUNTER_FREQUENCY_KEY, BOSS_STATES_KEY, DEFAULT_LUCKY_WHEEL_REWARDS, DEFAULT_SKILLS, LUCKY_WHEEL_REWARDS_KEY, PET_SKILLS_KEY, SKILLS_KEY, STORAGE_KEY, NEG_SOUND_KEY, POS_SOUND_KEY, TIMER_SOUND_KEY, WHEEL_FINISH_SOUND_KEY, WHEEL_SPIN_SOUND_KEY } from '../../../data/constants';
import { DEFAULT_BOSS_ENCOUNTER_FREQUENCY, isBossEncounterFrequency, normalizeBossStatesByClass } from '../../../domain/bossSystem';
import { LIST_PET_SKILLS as DEFAULT_PET_SKILLS } from '../../../data/pokemonData';
import { Student } from '../../../types';
import { GameDataState } from './useGameDataState';
import type { AuthUser } from '../../../features/auth/AuthContext';

// Tải dữ liệu từ Supabase khi đăng nhập và tự đồng bộ ngược lên (debounce 1,5 giây, chỉ khi dữ liệu đổi).
// Nơi lưu (cục JSON cũ hay bảng Phase 3) do cloudStore quyết định; phần còn lại giữ như trước.
export const useCloudSync = (data: GameDataState, user: AuthUser | null, authLoading: boolean) => {
  const {
    students, setStudents, skills,
    setSkills, petSkills, setPetSkills, bossEncounterFrequency, setBossEncounterFrequency,
    bossStatesByClass, setBossStatesByClass, luckyWheelRewards, setLuckyWheelRewards,
    setLuckyWheelDisplayRewards, customLudoTiles, setCustomLudoTiles, posSoundUrl,
    setPosSoundUrl, negSoundUrl, setNegSoundUrl, timerSoundUrl, setTimerSoundUrl,
    wheelSpinSoundUrl, setWheelSpinSoundUrl, wheelFinishSoundUrl, setWheelFinishSoundUrl,
    setIsSyncing, setLastSyncedTime, initialCloudLoadComplete, setInitialCloudLoadComplete,
    cloudLoadSuccess, setCloudLoadSuccess, lastSyncedSnapshotRef,
    cloudDataModelRef, lastCloudSnapshotRef, setLegacyUpgradeAvailable
  } = data;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setInitialCloudLoadComplete(false);
      setCloudLoadSuccess(false);
      setLastSyncedTime(null);
      lastSyncedSnapshotRef.current = '';
      cloudDataModelRef.current = 'legacy';
      lastCloudSnapshotRef.current = EMPTY_SNAPSHOT;
      setLegacyUpgradeAvailable(false);
      return;
    }

    const fetchCloudData = async () => {
      setIsSyncing(true);
      try {
        const loaded = await loadCloudData(user.uid);
        const cloudData = loaded?.data;

        if (loaded && cloudData) {
          const cloudStudents = Array.isArray(cloudData.students)
            ? cloudData.students.map(normalizeStudentPokemonData)
            : [];
          if (cloudData.students && Array.isArray(cloudData.students)) setStudents(cloudStudents);
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

          cloudDataModelRef.current = loaded.dataModel;
          lastCloudSnapshotRef.current = loaded.snapshot ?? EMPTY_SNAPSHOT;
          if (loaded.canUpgrade) {
            if (cloudStudents.length === 0 && Object.keys(cloudBossStates).length === 0) {
              // Chưa có học sinh nào: chuyển sang bảng mới luôn, không cần hỏi.
              const upgraded = await runLegacyUpgrade(user.uid, { students: [], bossStatesByClass: {} });
              if (upgraded.ok) {
                cloudDataModelRef.current = 'tables';
                lastCloudSnapshotRef.current = upgraded.snapshot;
              }
            } else {
              setLegacyUpgradeAvailable(true);
            }
          }

          // Save snapshot ref to prevent immediate re-sync of unchanged data
          lastSyncedSnapshotRef.current = JSON.stringify({
            students: cloudStudents,
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
          if (cloudData.skills) localStorage.setItem(SKILLS_KEY, JSON.stringify(cloudData.skills));
          if (cloudData.petSkills) localStorage.setItem(PET_SKILLS_KEY, JSON.stringify(cloudData.petSkills));
          if (cloudData.posSoundUrl) localStorage.setItem(POS_SOUND_KEY, cloudData.posSoundUrl);
          if (cloudData.negSoundUrl) localStorage.setItem(NEG_SOUND_KEY, cloudData.negSoundUrl);
          if (cloudData.timerSoundUrl) localStorage.setItem(TIMER_SOUND_KEY, cloudData.timerSoundUrl);
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
          const dataModel = await chooseModelForNewTeacher();
          const pushed = await saveCloudData(user.uid, {
            students: localStudents,
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
          }, dataModel, EMPTY_SNAPSHOT);
          const updatedAt = pushed.updatedAt;
          cloudDataModelRef.current = dataModel;
          lastCloudSnapshotRef.current = pushed.snapshot;

          lastSyncedSnapshotRef.current = JSON.stringify({
            students: localStudents,
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
        const saved = await saveCloudData(user.uid, {
          students,
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
        }, cloudDataModelRef.current, lastCloudSnapshotRef.current);

        lastSyncedSnapshotRef.current = currentSnapshot;
        lastCloudSnapshotRef.current = saved.snapshot;
        setLastSyncedTime(saved.updatedAt);
      } catch (err) {
        console.error("Auto-sync to cloud failed:", err);
      } finally {
        setIsSyncing(false);
      }
    }, 1500); // 1.5s debounce to group multiple rapid edits together

    return () => clearTimeout(timer);
  }, [students, skills, petSkills, posSoundUrl, negSoundUrl, timerSoundUrl, wheelSpinSoundUrl, wheelFinishSoundUrl, customLudoTiles, luckyWheelRewards, bossStatesByClass, bossEncounterFrequency, user, initialCloudLoadComplete, cloudLoadSuccess]);
};
