import React from 'react';
import { normalizeStudentPokemonData } from '../../../domain/pokemonProgression';
import { BOSS_ENCOUNTER_FREQUENCY_KEY, BOSS_STATES_KEY, LUCKY_WHEEL_REWARDS_KEY, PET_SKILLS_KEY, WHEEL_FINISH_SOUND_KEY, WHEEL_SPIN_SOUND_KEY } from '../../../data/constants';
import { DEFAULT_BOSS_ENCOUNTER_FREQUENCY, isBossEncounterFrequency, normalizeBossStatesByClass } from '../../../domain/bossSystem';
import { fetchUserSettings, upsertUserSettings } from '../../../lib/supabaseData';
import { pickBackupFields } from '../../../domain/backup';
import { GameDataState } from './useGameDataState';
import type { AuthUser } from '../../../features/auth/AuthContext';

// Xuất/nhập file JSON và sao lưu/khôi phục thủ công trên đám mây.
export const createBackupActions = (data: GameDataState, user: AuthUser | null) => {
  const {
    students, setStudents, skills,
    setSkills, petSkills, setPetSkills, bossEncounterFrequency, setBossEncounterFrequency,
    bossStatesByClass, setBossStatesByClass, luckyWheelRewards, setLuckyWheelRewards,
    setLuckyWheelDisplayRewards, customLudoTiles, setCustomLudoTiles, posSoundUrl,
    setPosSoundUrl, negSoundUrl, setNegSoundUrl, timerSoundUrl, setTimerSoundUrl,
    wheelSpinSoundUrl, setWheelSpinSoundUrl, wheelFinishSoundUrl, setWheelFinishSoundUrl,
    setIsSyncing, setLastSyncedTime
  } = data;

  const handleExportJSON = () => {
    const data = {
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
        const data = pickBackupFields(JSON.parse(text));

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
    handleExportJSON, handleImportJSON, handleBackupToCloud, handleRestoreFromCloud
  };
};
