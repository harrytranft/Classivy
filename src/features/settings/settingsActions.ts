import React from 'react';
import { BossEncounterFrequency, LuckyWheelReward, LuckyWheelRewardType, LudoTileSpec, Skill } from '../../types';
import { PetSkill } from '../../data/pokemonData';
import { BOSS_ENCOUNTER_FREQUENCY_KEY } from '../../data/constants';
import { normalizeClassBossState, recalibrateBossEncounterFrequency } from '../../domain/bossSystem';
import { resetStudentPokemonLevels } from '../../domain/pokemonCollection';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Cài đặt: skill, skill Pokémon, Vòng quay, ô Cá Ngựa, Boss, avatar cấp bậc, reset level Pokémon.
export interface SettingsActions {
  handleResetPokemonLevels: () => void;
  handleSaveCustomTile: () => void;
  editCustomTile: (tile: LudoTileSpec) => void;
  deleteCustomTile: (index: number) => void;
  resetTileForm: () => void;
  updateSkill: (id: string, field: keyof Skill, value: any) => void;
  updatePetSkill: (id: string, field: keyof PetSkill, value: any) => void;
  addPetSkill: () => void;
  updateLuckyWheelReward: (id: string, field: keyof LuckyWheelReward, value: any) => void;
  addLuckyWheelReward: (type?: LuckyWheelRewardType) => void;
  toggleSettingsSection: (section: string) => void;
  handleBossEncounterFrequencyChange: (frequency: BossEncounterFrequency) => void;
}

export const createSettingsActions = (appState: AppState, app: AppActions): SettingsActions => {
  const {
    editingStudent, editingTileIndex, randomStudent, setBossEncounterFrequency,
    setBossStatesByClass, setCustomLudoTiles, setEditingStudent, setEditingTileIndex,
    setLuckyWheelRewards, setPetSkills, setRandomStudent,
    setSettingsCollapsed, setSkills, setStudents, setTileFormDesc, setTileFormIcon,
    setTileFormIndex, setTileFormTitle, setTileFormType, setTileFormValue, showPokemonReaction,
    students, tileFormDesc, tileFormIcon, tileFormIndex, tileFormTitle, tileFormType,
    tileFormValue
  } = appState;

  const handleResetPokemonLevels = () => {
    const affectedCount = students.filter(student => student.pet || (student.pets && student.pets.length > 0)).length;
    if (affectedCount === 0) {
      alert('Chưa có trainer nào có Pokémon để reset level.');
      return;
    }
    if (!window.confirm(`Reset level toàn bộ Pokémon của ${affectedCount} trainer về Level 1? Hào Quang, HP, kỹ năng và phụ kiện vẫn được giữ nguyên.`)) {
      return;
    }

    const updatedStudents = students.map(resetStudentPokemonLevels);
    setStudents(updatedStudents);

    if (editingStudent) {
      const updatedEditingStudent = updatedStudents.find(student => student.id === editingStudent.id);
      if (updatedEditingStudent) setEditingStudent(updatedEditingStudent);
    }
    if (randomStudent) {
      const updatedRandomStudent = updatedStudents.find(student => student.id === randomStudent.id);
      if (updatedRandomStudent) setRandomStudent(updatedRandomStudent);
    }

    showPokemonReaction(
      [{ type: 'level-up', message: `${affectedCount} trainer: Pokémon đã về Level 1` }],
      'Reset Level Pokémon'
    );
  };

  const handleSaveCustomTile = () => {
    if (tileFormIndex < 0 || tileFormIndex > 49) {
      alert("Số ô phải từ 0 đến 49.");
      return;
    }
    const newSpec: LudoTileSpec = {
      tileIndex: tileFormIndex,
      title: tileFormTitle || `Ô Đặc Biệt ${tileFormIndex}`,
      desc: tileFormDesc || 'Ô đặc biệt trên bàn cờ Cá Ngựa.',
      icon: tileFormIcon || '🌟',
      type: tileFormType,
      value: tileFormValue
    };
    setCustomLudoTiles(prev => ({ ...prev, [tileFormIndex]: newSpec }));
    resetTileForm();
    alert(`Đã lưu thiết lập ô đặc biệt số ${tileFormIndex}!`);
  };

  const editCustomTile = (tile: LudoTileSpec) => {
    setTileFormIndex(tile.tileIndex);
    setTileFormTitle(tile.title);
    setTileFormDesc(tile.desc);
    setTileFormIcon(tile.icon);
    setTileFormType(tile.type);
    setTileFormValue(tile.value || 3);
    setEditingTileIndex(tile.tileIndex);
  };

  const deleteCustomTile = (index: number) => {
    if (confirm(`Xóa ô đặc biệt số ${index}?`)) {
      setCustomLudoTiles(prev => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
      if (editingTileIndex === index) resetTileForm();
    }
  };

  const resetTileForm = () => {
    setTileFormIndex(0);
    setTileFormTitle('');
    setTileFormDesc('');
    setTileFormIcon('🚀');
    setTileFormType('portal');
    setTileFormValue(3);
    setEditingTileIndex(null);
  };

  const updateSkill = (id: string, field: keyof Skill, value: any) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const updatePetSkill = (id: string, field: keyof PetSkill, value: any) => {
    setPetSkills(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addPetSkill = () => {
    const newSkill: PetSkill = {
      id: `sk_custom_${Date.now()}`,
      name: 'Tuyệt chiêu mới',
      icon: '✨',
      cost: 20,
      description: 'Mô tả quyền năng Pokémon mới.'
    };
    setPetSkills(prev => [...prev, newSkill]);
  };

  const updateLuckyWheelReward = (id: string, field: keyof LuckyWheelReward, value: any) => {
    setLuckyWheelRewards(prev => prev.map(reward => reward.id === id ? { ...reward, [field]: value } : reward));
  };

  const addLuckyWheelReward = (type: LuckyWheelRewardType = 'points') => {
    const amountByType = type === 'pokemon' || type === 'skill' ? undefined : type === 'ludo_rolls' ? 1 : 1;
    const nextReward: LuckyWheelReward = {
      id: `wheel_custom_${Date.now()}`,
      label: type === 'ludo_rolls' ? 'Lắc Cá Ngựa 1 lần' : 'Phần thưởng mới',
      icon: type === 'ludo_rolls' ? '🎲' : '✨',
      type,
      amount: amountByType,
      color: '#d946ef'
    };
    setLuckyWheelRewards(prev => [...prev, nextReward]);
  };

  const toggleSettingsSection = (section: string) => {
    setSettingsCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleBossEncounterFrequencyChange = (frequency: BossEncounterFrequency) => {
    setBossEncounterFrequency(frequency);
    localStorage.setItem(BOSS_ENCOUNTER_FREQUENCY_KEY, frequency);
    setBossStatesByClass(prev => {
      const timestamp = Date.now();
      return Object.fromEntries(
        Object.entries(prev).map(([className, state]) => [
          className,
          recalibrateBossEncounterFrequency(
            normalizeClassBossState(state, className, frequency),
            frequency,
            timestamp
          )
        ])
      );
    });
  };

  return {
    handleResetPokemonLevels, handleSaveCustomTile, editCustomTile, deleteCustomTile,
    resetTileForm, updateSkill, updatePetSkill, addPetSkill,
    updateLuckyWheelReward, addLuckyWheelReward, toggleSettingsSection,
    handleBossEncounterFrequencyChange
  };
};
