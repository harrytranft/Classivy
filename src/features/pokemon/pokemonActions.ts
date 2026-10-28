import React from 'react';
import { createEgg, getEggCost, getEggLabel, getEggRequiredProgress } from '../../domain/eggs';
import { EggKind, HistoryItem, PokemonPet, Student } from '../../types';
import { createPokemonPetFromDexId, getPokemonDisplayName, normalizePokemonPet, totalXpForLevel, updatePetInCollection } from '../../domain/pokemonProgression';
import { getRandomPokemon } from '../../data/pokemonData';
import { advanceEggForStudent } from '../../domain/progression';
import { getFusionCandidates, isSamePokemon } from '../../domain/pokemonCollection';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';
import { compressImageDataUrl } from '../../lib/imageCompression';

// Hành động với Pokémon và hồ sơ trainer: trứng, skill, đổi tên, đồng hành, hợp nhất, ảnh riêng.
export interface PokemonActions {
  handleSpendAuraToHatchEgg: (studentId: string) => void;
  handleSelectReplacementPokemon: (pet: PokemonPet) => void;
  handleOpenEggAfterRelease: () => void;
  handleBuySkill: (studentId: string, skillId: string, cost: number, skillName: string) => void;
  handleRenamePet: (studentId: string, newName: string) => void;
  handleBuyNewEgg: (studentId: string, kind?: Exclude<EggKind, "legendary">, options?: { skipConfirm?: boolean; silent?: boolean; }) => boolean;
  handleStartInventoryEgg: (studentId: string, eggInstanceId: string) => void;
  handleSelectActivePet: (studentId: string, chosenPet: PokemonPet) => void;
  handleSelectSupportPet: (studentId: string, supportPet?: PokemonPet) => void;
  handleUsePetSkill: (studentId: string, skillId: string, skillName: string) => void;
  handleFuseSelectedPokemons: (studentId: string) => void;
  handleStudentCustomAvatarUpload: (studentId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveStudentCustomAvatar: (studentId: string) => void;
}

export const createPokemonActions = (appState: AppState, app: AppActions): PokemonActions => {
  const {
    editingStudent, pokemonReleaseEvent, posSoundUrl, randomStudent, selectedFusionPetDexIds,
    setCurrentScreen, setEditingStudent, setProfileTab, setRandomStudent,
    setSelectedFusionPetDexIds, setStudents, showHatchAnnouncement,
    showNextPokemonReleaseEvent, students
  } = appState;

  const handleSpendAuraToHatchEgg = (studentId: string) => {
    const target = students.find(student => student.id === studentId);
    if (!target?.egg || target.egg.status !== 'egg') {
      alert('Trainer này chưa có trứng đang ấp.');
      return;
    }

    const requiredProgress = getEggRequiredProgress(target.egg);
    const currentProgress = Math.max(0, target.egg.progress || 0);
    const remainingProgress = Math.max(0, requiredProgress - currentProgress);
    if (remainingProgress <= 0) {
      alert('Trứng đã đủ điểm ấp. Hãy bấm nở trứng ngay.');
      return;
    }
    if (target.points < remainingProgress) {
      alert(`Không đủ Hào Quang. Cần ${remainingProgress}đ để ấp nhanh, hiện có ${target.points}đ.`);
      return;
    }
    if (!window.confirm(`Đổi ${remainingProgress}đ Hào Quang để ấp nhanh ${getEggLabel(target.egg.kind || 'normal')}?`)) return;

    const timestamp = Date.now();
    const eggResult = advanceEggForStudent(target, remainingProgress);
    let nextStudent: Student = {
      ...eggResult.student,
      points: target.points - remainingProgress,
      history: [{
        id: `${timestamp}${Math.random()}`,
        amount: -remainingProgress,
        reason: `🥚 Đổi ${remainingProgress}đ Hào Quang để ấp nhanh ${getEggLabel(target.egg.kind || 'normal')}`,
        timestamp
      }, ...eggResult.student.history].slice(0, 50)
    };

    if (eggResult.hatchedPet) {
      showHatchAnnouncement(
        [{ studentId: target.id, studentName: target.name, pet: eggResult.hatchedPet }],
        `Tin vui! ${target.name} đã đổi ${remainingProgress}đ Hào Quang để trứng nở ra ${getPokemonDisplayName(eggResult.hatchedPet)}.`
      );
    }

    setStudents(prev => prev.map(student => student.id === studentId ? nextStudent : student));
    if (editingStudent?.id === studentId) setEditingStudent(nextStudent);
    if (randomStudent?.id === studentId) setRandomStudent(nextStudent);
    new Audio(posSoundUrl).play().catch(() => {});
  };

  const handleSelectReplacementPokemon = (pet: PokemonPet) => {
    if (!pokemonReleaseEvent) return;
    setStudents(prev => prev.map(s => {
      if (s.id !== pokemonReleaseEvent.studentId) return s;
      const nextPet = normalizePokemonPet(pet);
      const nextStudent = { ...s, pet: nextPet, pets: updatePetInCollection(s, nextPet) };
      if (editingStudent?.id === s.id) setEditingStudent(nextStudent);
      return nextStudent;
    }));
    showNextPokemonReleaseEvent();
  };

  const handleOpenEggAfterRelease = () => {
    if (!pokemonReleaseEvent) return;
    const student = students.find(s => s.id === pokemonReleaseEvent.studentId);
    if (student) {
      setEditingStudent(student);
      setProfileTab('pet');
      setCurrentScreen('profile');
    }
    showNextPokemonReleaseEvent();
  };

  const handleBuySkill = (studentId: string, skillId: string, cost: number, skillName: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    if (student.points < cost) {
      alert(`Không đủ Hào quang! Trainer cần thêm ${cost - student.points} điểm để học skill ${skillName}.`);
      return;
    }

    if (!window.confirm(`Bạn có đồng ý tiêu hao ${cost} điểm Hào quang để rèn luyện tuyệt kỹ ${skillName} cho Pet?`)) return;

    const newPoints = student.points - cost;
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      amount: -cost,
      reason: `Học pháp bảo: ${skillName}`,
      timestamp: Date.now()
    };

    const updatedStudents = students.map(s => {
      if (s.id === studentId && s.pet) {
        const currentUses = s.pet.skillUses ? { ...s.pet.skillUses } : {};
        currentUses[skillId] = 0; // Reset usages to 0 on purchase!
        const updatedPet = {
          ...s.pet,
          skills: [...(s.pet.skills || []), skillId],
          skillUses: currentUses
        };
        const updatedS = {
          ...s,
          points: newPoints,
          pet: updatedPet,
          pets: updatePetInCollection(s, updatedPet),
          history: [historyItem, ...s.history].slice(0, 50)
        };
        // Update editingStudent too!
        setEditingStudent(updatedS);
        return updatedS;
      }
      return s;
    });

    setStudents(updatedStudents);
    new Audio(posSoundUrl).play().catch(() => {});
    alert(`Pokémon đã học skill ${skillName}! Khấu trừ ${cost} điểm.`);
  };

  const handleRenamePet = (studentId: string, newName: string) => {
    if (!newName.trim()) return;
    const updatedStudents = students.map(s => {
      if (s.id === studentId && s.pet) {
        const trimmedName = newName.trim();
        const updatedPet = {
          ...s.pet,
          nickname: trimmedName,
          name: trimmedName
        };
        const updatedS = { ...s, pet: updatedPet, pets: updatePetInCollection(s, updatedPet) };
        setEditingStudent(updatedS);
        return updatedS;
      }
      return s;
    });
    setStudents(updatedStudents);
  };

  const handleBuyNewEgg = (
    studentId: string,
    kind: Exclude<EggKind, 'legendary'> = 'normal',
    options: { skipConfirm?: boolean; silent?: boolean } = {}
  ) => {
    const s = students.find(x => x.id === studentId);
    if (!s) return false;
    const cost = getEggCost(kind);
    const eggLabel = getEggLabel(kind);
    const requiredProgress = kind === 'special' ? 15 : 10;
    if (s.points < cost) {
      alert(`Không đủ Hào quang! Trainer cần tối thiểu ${cost} điểm để mua ${eggLabel}.`);
      return false;
    }
    if (!options.skipConfirm && !window.confirm(`Bạn có đồng ý mua ${eggLabel} bằng cách tiêu hao ${cost}đ Hào Quang? Trứng này cần +${requiredProgress} Hào Quang để nở.`)) return false;
    
    // Save current companion in collection
    const currentActivePet = s.pet;
    let ownedPets = s.pets ? [...s.pets] : [];
    if (currentActivePet) {
      const exists = ownedPets.some(p => isSamePokemon(p, currentActivePet));
      if (!exists) {
        ownedPets.push(currentActivePet);
      }
    }

    const nextPoints = s.points - cost;
    const historyItem: HistoryItem = {
      id: Date.now().toString() + Math.random(),
      amount: -cost,
      reason: `Thỉnh ${eggLabel} Pokémon mới (-${cost}đ)`,
      timestamp: Date.now()
    };

    const updatedS: Student = {
      ...s,
      points: nextPoints,
      egg: createEgg(kind, 'shop'),
      pet: undefined, // Clear active pet so they see incubating layout
      pets: ownedPets,
      history: [historyItem, ...s.history].slice(0, 50)
    };

    setStudents(prev => prev.map(x => x.id === studentId ? updatedS : x));
    if (editingStudent?.id === studentId) setEditingStudent(updatedS);
    new Audio(posSoundUrl).play().catch(() => {});
    if (!options.silent) {
      alert(`Mua ${eggLabel} thành công! Hãy tích cực cộng điểm để sinh linh sớm thức tỉnh khỏi vỏ trứng.`);
    }
    return true;
  };

  const handleStartInventoryEgg = (studentId: string, eggInstanceId: string) => {
    const updatedStudents = students.map(student => {
      if (student.id !== studentId || student.egg?.status === 'egg') return student;
      const inventory = student.eggInventory || [];
      const chosenEgg = inventory.find(egg => egg.instanceId === eggInstanceId);
      if (!chosenEgg) return student;
      const updatedStudent = {
        ...student,
        egg: { ...chosenEgg, status: 'egg' as const },
        eggInventory: inventory.filter(egg => egg.instanceId !== eggInstanceId)
      };
      if (editingStudent?.id === student.id) setEditingStudent(updatedStudent);
      return updatedStudent;
    });
    setStudents(updatedStudents);
  };

  const handleSelectActivePet = (studentId: string, chosenPet: PokemonPet) => {
    const s = students.find(x => x.id === studentId);
    if (!s) return;

    let ownedPets = s.pets ? [...s.pets] : [];
    
    // Backup active pet if any
    if (s.pet) {
      const exists = ownedPets.some(p => isSamePokemon(p, s.pet));
      if (!exists) {
        ownedPets.push(s.pet);
      }
    }

    // Load selected pet as active
    const nextPet = normalizePokemonPet(chosenPet);

    const updatedS: Student = {
      ...s,
      pet: nextPet,
      pets: updatePetInCollection({ ...s, pets: ownedPets }, nextPet)
    };

    setStudents(prev => prev.map(x => x.id === studentId ? updatedS : x));
    setEditingStudent(updatedS);
    alert(`Pokémon ${getPokemonDisplayName(nextPet)} đã trở lại đồng hành cùng trainer!`);
  };

  const handleSelectSupportPet = (studentId: string, supportPet?: PokemonPet) => {
    const updatedStudents = students.map(student => {
      if (student.id !== studentId) return student;
      const updatedStudent = {
        ...student,
        supportPetInstanceId: supportPet?.instanceId
      };
      if (editingStudent?.id === studentId) setEditingStudent(updatedStudent);
      return updatedStudent;
    });
    setStudents(updatedStudents);
  };

  const handleUsePetSkill = (studentId: string, skillId: string, skillName: string) => {
    const s = students.find(x => x.id === studentId);
    if (!s || !s.pet) return;

    const skillUses = s.pet.skillUses ? { ...s.pet.skillUses } : {};
    const currentUses = skillUses[skillId] || 0;

    if (currentUses >= 2) {
      alert("Tuyệt chiêu này đã cạn kiệt linh năng!");
      return;
    }

    if (!window.confirm(`Bạn có đồng ý kích hoạt skill [${skillName}] của Pokémon?`)) return;

    const nextUses = currentUses + 1;
    let skillsList = [...s.pet.skills];
    let alertMsg = "";

    if (nextUses >= 2) {
      // Exploded! Remove
      skillsList = skillsList.filter(id => id !== skillId);
      delete skillUses[skillId];
      alertMsg = `Kích hoạt thành công [${skillName}] (Lần 2/2)!\n\nChiêu pháp đã cạn pháp khí nên đã bốc hơi rã tiên! Hãy mua lại bí truyền nếu muốn dùng tiếp.`;
    } else {
      skillUses[skillId] = nextUses;
      alertMsg = `Kích hoạt thành công [${skillName}] (Lần 1/2)! Còn lại 1 lượt vận công pháp báu.`;
    }

    const historyItem: HistoryItem = {
      id: Date.now().toString() + Math.random(),
      amount: 0,
      reason: `[Pokémon] Kích hoạt skill: ${skillName} (${nextUses}/2)`,
      timestamp: Date.now()
    };

    const updatedPet = {
      ...s.pet,
      skills: skillsList,
      skillUses: skillUses
    };

    const updatedS: Student = {
      ...s,
      pet: updatedPet,
      pets: updatePetInCollection(s, updatedPet),
      history: [historyItem, ...s.history].slice(0, 50)
    };

    setStudents(prev => prev.map(x => x.id === studentId ? updatedS : x));
    setEditingStudent(updatedS);
    new Audio(posSoundUrl).play().catch(() => {});
    alert(alertMsg);
  };

  const handleFuseSelectedPokemons = (studentId: string) => {
    const s = students.find(x => x.id === studentId);
    const fusionCandidates = s ? getFusionCandidates(s) : [];
    if (!s || fusionCandidates.length < 2) {
      alert("Cần tối thiểu 2 Pokémon để thực hiện hợp nhất!");
      return;
    }

    if (selectedFusionPetDexIds.length < 2) {
      alert("Vui lòng chọn 2 Pokémon muốn hợp nhất!");
      return;
    }

    const petsToFuse = selectedFusionPetDexIds
      .map(index => fusionCandidates[index])
      .filter(Boolean);

    if (petsToFuse.length !== 2) {
      alert("Vui lòng chọn đúng 2 Pokémon hợp lệ để hợp nhất!");
      return;
    }

    const selectedSet = new Set(selectedFusionPetDexIds);
    const remainingPets = fusionCandidates.filter((_, index) => !selectedSet.has(index));

    const combinedSkillUses: Record<string, number> = {};
    petsToFuse.forEach(pet => {
      (pet.skills || []).forEach(skillId => {
        const uses = pet.skillUses?.[skillId] || 0;
        if (uses >= 2) return;
        if (combinedSkillUses[skillId] === undefined || uses < combinedSkillUses[skillId]) {
          combinedSkillUses[skillId] = uses;
        }
      });
    });
    const combinedSkills = Object.keys(combinedSkillUses);
    const randomNewPokemon = getRandomPokemon();
    const fusedLevel = Math.min(30, Math.max(1, Math.floor(petsToFuse.reduce((sum, pet) => sum + (pet.level || 1), 0) / petsToFuse.length)));
    const fusedIsShiny = petsToFuse.every(pet => pet.isShiny);

    const fusedPet: PokemonPet = {
      ...createPokemonPetFromDexId(randomNewPokemon.dexId, `Hợp Thể ${randomNewPokemon.name}`, { isShiny: fusedIsShiny }),
      types: Array.from(new Set(petsToFuse.flatMap(p => p.types))),
      level: fusedLevel,
      xp: 0,
      totalXp: totalXpForLevel(fusedLevel),
      bond: 0,
      charge: 0,
      masteryXp: 0,
      masteryStars: 0,
      skills: combinedSkills,
      skillUses: combinedSkillUses
    };

    const updatedPets = [fusedPet, ...remainingPets];

    const updatedS: Student = {
      ...s,
      pet: fusedPet,
      pets: updatedPets
    };

    setStudents(prev => prev.map(x => x.id === studentId ? updatedS : x));
    setEditingStudent(updatedS);
    setSelectedFusionPetDexIds([]);
    setProfileTab('pet');
    new Audio(posSoundUrl).play().catch(() => {});
    alert(`🔮 HỢP NHẤT THÀNH CÔNG!\n\nĐã dung hợp các Pokémon để tạo Pokémon mới [${getPokemonDisplayName(fusedPet)}] với ${combinedSkills.length} skill đã giữ lại!`);
  };

  const handleStudentCustomAvatarUpload = (studentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      // Ảnh quá lớn được nén lại để vừa giới hạn lưu trên đám mây (Phase 3, Q5).
      const base64 = await compressImageDataUrl(event.target?.result as string).catch(() => event.target?.result as string);
      const updated = students.map(s => {
        if (s.id === studentId) {
          const updatedS = { ...s, customAvatar: base64 };
          if (editingStudent?.id === studentId) setEditingStudent(updatedS);
          return updatedS;
        }
        return s;
      });
      setStudents(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveStudentCustomAvatar = (studentId: string) => {
    const updated = students.map(s => {
      if (s.id === studentId) {
        const updatedS = { ...s, customAvatar: undefined };
        if (editingStudent?.id === studentId) setEditingStudent(updatedS);
        return updatedS;
      }
      return s;
    });
    setStudents(updated);
  };

  return {
    handleSpendAuraToHatchEgg, handleSelectReplacementPokemon, handleOpenEggAfterRelease,
    handleBuySkill, handleRenamePet, handleBuyNewEgg, handleStartInventoryEgg,
    handleSelectActivePet, handleSelectSupportPet, handleUsePetSkill,
    handleFuseSelectedPokemons, handleStudentCustomAvatarUpload,
    handleRemoveStudentCustomAvatar
  };
};
