import { createPokemonPetFromDexId, getPokemonDisplayName, normalizeStudentPokemonData, updatePetInCollection } from '../../domain/pokemonProgression';
import { createEgg, getEggLabel, getEggRequiredProgress } from '../../domain/eggs';
import { Student } from '../../types';
import { advanceEggForStudent, appendAdventureJournal } from '../../domain/progression';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Tặng Pokémon (trứng nở ngay, có hiệu ứng hẹn giờ).
export interface GiftPokemonActions {
  clearGiftPokemonTimers: () => void;
  resetGiftPokemonFlow: () => void;
  closeGiftPokemonModal: () => void;
  openGiftPokemonModal: () => void;
  handleGiftPokemon: () => void;
}

export const createGiftPokemonActions = (appState: AppState, app: AppActions): GiftPokemonActions => {
  const {
    editingStudent, giftAnimationPhase, giftPokemonRoster, giftPokemonTimersRef, giftStudentId,
    posSoundUrl, randomStudent, setEditingStudent, setGiftAnimationPhase, setGiftPokemonResult,
    setGiftStudentId, setRandomStudent, setShowGiftPokemonModal, setStudents,
    showPokemonReaction, students
  } = appState;

  const clearGiftPokemonTimers = () => {
    giftPokemonTimersRef.current.forEach(timerId => window.clearTimeout(timerId));
    giftPokemonTimersRef.current = [];
  };

  const resetGiftPokemonFlow = () => {
    clearGiftPokemonTimers();
    setGiftPokemonResult(null);
    setGiftAnimationPhase('select');
  };

  const closeGiftPokemonModal = () => {
    resetGiftPokemonFlow();
    setShowGiftPokemonModal(false);
  };

  const openGiftPokemonModal = () => {
    if (giftPokemonRoster.length === 0) {
      alert('Chưa có học sinh nào trong lớp hiện tại để tặng Pokémon.');
      return;
    }
    resetGiftPokemonFlow();
    setGiftStudentId(prev => giftPokemonRoster.some(student => student.id === prev) ? prev : giftPokemonRoster[0].id);
    setShowGiftPokemonModal(true);
  };

  const handleGiftPokemon = () => {
    const target = students.find(student => student.id === giftStudentId);
    if (!target || giftAnimationPhase === 'hatching') return;

    const normalizedTarget = normalizeStudentPokemonData(target);
    const hadExistingEgg = !!normalizedTarget.egg && normalizedTarget.egg.status === 'egg';
    const giftEgg = hadExistingEgg
      ? { ...normalizedTarget.egg! }
      : createEgg('special', 'reward');
    const giftReadyStudent: Student = {
      ...normalizedTarget,
      egg: {
        ...giftEgg,
        status: 'egg',
        requiredProgress: getEggRequiredProgress(giftEgg)
      }
    };
    const requiredProgress = getEggRequiredProgress(giftReadyStudent.egg);
    const eggResult = advanceEggForStudent(giftReadyStudent, requiredProgress);
    const hatchedPet = eggResult.hatchedPet || createPokemonPetFromDexId(giftReadyStudent.egg!.assignedDexId);
    const timestamp = Date.now();
    let nextStudent: Student = {
      ...eggResult.student,
      pet: hatchedPet,
      pets: updatePetInCollection(eggResult.student, hatchedPet),
      history: [{
        id: `${timestamp}${Math.random()}`,
        amount: 0,
        reason: `🎁 Tặng Pokémon: ${getPokemonDisplayName(hatchedPet)} nở từ ${getEggLabel(giftReadyStudent.egg!.kind || 'special')} (không trừ Hào Quang)`,
        timestamp
      }, ...eggResult.student.history].slice(0, 50)
    };

    nextStudent = appendAdventureJournal(nextStudent, {
      type: 'pokemon-hatched',
      text: `${getPokemonDisplayName(hatchedPet)} hatched as a gift for ${target.name}.`,
      petInstanceId: hatchedPet.instanceId
    }, timestamp);
    if (hatchedPet.isShiny) {
      nextStudent = appendAdventureJournal(nextStudent, {
        type: 'shiny-acquired',
        text: `${target.name} received Shiny ${getPokemonDisplayName(hatchedPet)} from Gift Pokemon.`,
        petInstanceId: hatchedPet.instanceId
      }, timestamp);
    }

    setGiftAnimationPhase('hatching');
    setGiftPokemonResult({
      student: nextStudent,
      pet: hatchedPet,
      egg: giftReadyStudent.egg!,
      hadExistingEgg
    });

    clearGiftPokemonTimers();
    giftPokemonTimersRef.current = [
      window.setTimeout(() => {
        setStudents(prev => prev.map(student => student.id === target.id ? nextStudent : student));
        if (editingStudent?.id === target.id) setEditingStudent(nextStudent);
        if (randomStudent?.id === target.id) setRandomStudent(nextStudent);
        setGiftPokemonResult({
          student: nextStudent,
          pet: hatchedPet,
          egg: giftReadyStudent.egg!,
          hadExistingEgg
        });
        setGiftAnimationPhase('revealed');
        showPokemonReaction([{ type: 'evolution', message: `${nextStudent.name}: ${getPokemonDisplayName(hatchedPet)} đã nở` }], 'Tặng Pokémon');
        new Audio(posSoundUrl).play().catch(() => {});
      }, 2200)
    ];
  };

  return {
    clearGiftPokemonTimers, resetGiftPokemonFlow, closeGiftPokemonModal, openGiftPokemonModal,
    handleGiftPokemon
  };
};
