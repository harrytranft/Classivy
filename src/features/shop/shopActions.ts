import { EggKind, HistoryItem } from '../../types';
import { ShopReviewItem } from '../../types/app';
import { PetSkill } from '../../data/pokemonData';
import { createEgg, getEggCost, getEggLabel } from '../../domain/eggs';
import { normalizeStudentPokemonData, updatePetInCollection } from '../../domain/pokemonProgression';
import { isSamePokemon } from '../../domain/pokemonCollection';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Shop: chọn món, xem lại đơn, chốt đơn.
export interface ShopActions {
  handleOpenShop: () => void;
  toggleShopEgg: (studentId: string, kind: Exclude<EggKind, "legendary">) => void;
  toggleShopSkill: (studentId: string, skillId: string) => void;
  buildShopReview: () => ShopReviewItem[];
  handlePrepareShopPurchase: () => void;
  handleConfirmShopPurchase: () => void;
}

export const createShopActions = (appState: AppState, app: AppActions): ShopActions => {
  const {
    currentClassStudents, editingStudent, petSkills, posSoundUrl, setEditingStudent,
    setShopReview, setShopSelections, setShowShopModal, setStudents, shopReview,
    shopSelections, showPokemonReaction, students
  } = appState;

  const handleOpenShop = () => {
    if (currentClassStudents.length === 0) {
      alert('Chưa có trainer trong lớp hiện tại để mở Shop.');
      return;
    }
    setShopSelections({});
    setShopReview(null);
    setShowShopModal(true);
  };

  const toggleShopEgg = (studentId: string, kind: Exclude<EggKind, 'legendary'>) => {
    setShopSelections(prev => {
      const current = prev[studentId] || { skills: [] };
      return {
        ...prev,
        [studentId]: {
          ...current,
          egg: current.egg === kind ? undefined : kind
        }
      };
    });
  };

  const toggleShopSkill = (studentId: string, skillId: string) => {
    setShopSelections(prev => {
      const current = prev[studentId] || { skills: [] };
      const hasSkill = current.skills.includes(skillId);
      return {
        ...prev,
        [studentId]: {
          ...current,
          skills: hasSkill ? current.skills.filter(id => id !== skillId) : [...current.skills, skillId]
        }
      };
    });
  };

  const buildShopReview = (): ShopReviewItem[] => currentClassStudents
    .map(student => {
      const selection = shopSelections[student.id] || { skills: [] };
      const ownedSkillIds = student.pet?.skills || [];
      const skillIds = selection.skills.filter(skillId => student.pet && !ownedSkillIds.includes(skillId));
      const selectedSkills = skillIds
        .map(skillId => petSkills.find(skill => skill.id === skillId))
        .filter(Boolean) as PetSkill[];
      const skillCost = selectedSkills.reduce((sum, skill) => sum + skill.cost, 0);
      const eggCost = selection.egg ? getEggCost(selection.egg) : 0;
      const totalCost = skillCost + eggCost;
      const itemLabels = [
        ...selectedSkills.map(skill => `${skill.icon} ${skill.name}`),
        ...(selection.egg ? [`🥚 ${getEggLabel(selection.egg)}`] : [])
      ];

      return {
        studentId: student.id,
        studentName: student.name,
        pointBalance: student.points,
        egg: selection.egg,
        skillIds,
        itemLabels,
        totalCost,
        canAfford: totalCost > 0 && student.points >= totalCost
      };
    })
    .filter(item => item.totalCost > 0);

  const handlePrepareShopPurchase = () => {
    const reviewItems = buildShopReview();
    if (reviewItems.length === 0) {
      alert('Chưa tick món nào trong Shop.');
      return;
    }
    setShopReview(reviewItems);
  };

  const handleConfirmShopPurchase = () => {
    if (!shopReview) return;
    const purchasableItems = shopReview.filter(item => item.canAfford);
    if (purchasableItems.length === 0) {
      alert('Chưa có trainer nào đủ Hào Quang để mua các món đã chọn.');
      return;
    }
    const purchaseMap = new Map(purchasableItems.map(item => [item.studentId, item]));
    const timestamp = Date.now();

    const updatedStudents = students.map(student => {
      const item = purchaseMap.get(student.id);
      if (!item) return student;

      let updatedStudent = normalizeStudentPokemonData(student);
      let updatedPet = updatedStudent.pet;
      const historyItems: HistoryItem[] = [];

      if (updatedPet && item.skillIds.length > 0) {
        const currentUses = updatedPet.skillUses ? { ...updatedPet.skillUses } : {};
        item.skillIds.forEach(skillId => {
          currentUses[skillId] = 0;
        });
        updatedPet = {
          ...updatedPet,
          skills: [...(updatedPet.skills || []), ...item.skillIds],
          skillUses: currentUses
        };
        updatedStudent = {
          ...updatedStudent,
          pet: updatedPet,
          pets: updatePetInCollection(updatedStudent, updatedPet)
        };
      }

      if (item.egg) {
        const currentActivePet = updatedStudent.pet;
        let ownedPets = updatedStudent.pets ? [...updatedStudent.pets] : [];
        if (currentActivePet && !ownedPets.some(p => isSamePokemon(p, currentActivePet))) {
          ownedPets.push(currentActivePet);
        }
        updatedStudent = {
          ...updatedStudent,
          egg: createEgg(item.egg),
          pet: undefined,
          pets: ownedPets
        };
      }

      historyItems.push({
        id: `${timestamp}${Math.random()}`,
        amount: -item.totalCost,
        reason: `🛒 Shop: ${item.itemLabels.join(', ')} (-${item.totalCost}đ)`,
        timestamp
      });

      return {
        ...updatedStudent,
        points: updatedStudent.points - item.totalCost,
        history: [...historyItems, ...updatedStudent.history].slice(0, 50)
      };
    });

    setStudents(updatedStudents);
    if (editingStudent) {
      const updatedEditingStudent = updatedStudents.find(student => student.id === editingStudent.id);
      if (updatedEditingStudent) setEditingStudent(updatedEditingStudent);
    }
    setShowShopModal(false);
    setShopReview(null);
    setShopSelections({});
    new Audio(posSoundUrl).play().catch(() => {});
    showPokemonReaction(
      [{ type: 'bond', message: `${purchasableItems.length} trainer đã mua đồ trong Shop` }],
      'Shop đã chốt đơn'
    );
  };

  return {
    handleOpenShop, toggleShopEgg, toggleShopSkill, buildShopReview, handlePrepareShopPurchase,
    handleConfirmShopPurchase
  };
};
