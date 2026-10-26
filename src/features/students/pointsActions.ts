import { GameEventSource, PokemonUiEvent, applyGameEventToStudent, applyPetHpDeltaToStudent } from '../../domain/gameEvents';
import { HatchAnnouncementItem } from '../../types/app';
import { HistoryItem, PokemonReleaseEvent } from '../../types';
import { generateEdict } from '../../lib/geminiService';
import { normalizeStudentPokemonData } from '../../domain/pokemonProgression';
import { addWeeklyChestProgress, advanceEggForStudent, applyTrainerJourneyProgress } from '../../domain/progression';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Cộng/trừ điểm Hào Quang: hành động trung tâm mà Random, Battle, Vòng quay... cùng gọi.
export interface PointsActions {
  handleUpdatePoints: (ids: string[], amount: number, reason: string, source?: GameEventSource) => Promise<void>;
}

export const createPointsActions = (appState: AppState, app: AppActions): PointsActions => {
  const {
    editingStudent, getRank, negSoundUrl, posSoundUrl, randomStudent, setEdict,
    setEditingStudent, setFeedbackSource, setHatchAnnouncementItems, setHatchSuccessMessage,
    setIsMultiSelectMode, setManualPoints, setPokemonReleaseEvent, setRandomStudent,
    setSelectedStudentIds, setShowHatchModal, setShowRandomModal, setShowSkillModal,
    setStudents, showHatchAnnouncement, showPokemonReaction, students
  } = appState;

  const handleUpdatePoints = async (ids: string[], amount: number, reason: string, source: GameEventSource = 'manual') => {
    if (isNaN(amount)) return;

    // Play Sound using dynamic URLs
    const sound = new Audio(amount >= 0 ? posSoundUrl : negSoundUrl);
    sound.play().catch(() => {});

    let hatchItems: HatchAnnouncementItem[] = [];
    let evolvedMessages: string[] = [];
    let progressionEvents: PokemonUiEvent[] = [];
    let releaseEventToShow: PokemonReleaseEvent | null = null;

    const updatedStudents = students.map(s => {
      if (ids.includes(s.id)) {
        const oldRank = getRank(s.points, s.gender);
        const newPoints = s.points + amount;
        const newRank = getRank(newPoints, s.gender);
        const history: HistoryItem = { id: Date.now().toString() + Math.random(), amount, reason, timestamp: Date.now() };

        if (ids.length === 1 && oldRank.id !== newRank.id) {
          generateEdict(s.name, newRank.title, newPoints > s.points).then(setEdict);
        }

        let currentStudent = normalizeStudentPokemonData(s);
        const eggProgressAmount = source === 'solo' ? (amount > 0 ? amount : 0) : amount;
        const eggResult = advanceEggForStudent(currentStudent, eggProgressAmount);
        currentStudent = eggResult.student;
        if (eggResult.hatchedPet) {
          hatchItems.push({ studentId: s.id, studentName: s.name, pet: eggResult.hatchedPet });
        }

        if (currentStudent.pet && amount !== 0) {
          const hpUpdate = applyPetHpDeltaToStudent(currentStudent, amount, `${reason}: ${amount >= 0 ? 'hồi' : 'mất'} ${Math.abs(amount)} HP`);
          currentStudent = hpUpdate.student;
          if (hpUpdate.releaseEvent && !releaseEventToShow) {
            releaseEventToShow = hpUpdate.releaseEvent;
          }
        }

        if (source === 'solo') {
          const progressionResult = applyGameEventToStudent(
            { ...currentStudent, points: newPoints },
            {
              type: 'SOLO_RESULT',
              source,
              studentId: s.id,
              auraDelta: amount,
              timestamp: Date.now()
            }
          );
          currentStudent = progressionResult.student;
          progressionEvents = [...progressionEvents, ...progressionResult.uiEvents];
          progressionResult.uiEvents
            .filter(event => event.type === 'evolution')
            .forEach(event => evolvedMessages.push(`Pokémon của ${s.name}: ${event.message}!`));
          const trainerXpGain = (amount > 0 ? 5 : 0)
            + (progressionResult.uiEvents.some(event => event.type === 'evolution') ? 15 : 0);
          currentStudent = applyTrainerJourneyProgress(
            currentStudent,
            trainerXpGain,
            Date.now(),
            progressionEvents,
            amount > 0 ? 'Positive Solo' : undefined
          );
          if (amount > 0) {
            currentStudent = addWeeklyChestProgress(currentStudent, 3);
          }
        }

        return {
          ...currentStudent,
          points: newPoints,
          history: [history, ...currentStudent.history].slice(0, 50),
          egg: eggResult.egg
        };
      }
      return s;
    });

    setStudents(updatedStudents);
    if (releaseEventToShow) setPokemonReleaseEvent(releaseEventToShow);

    // Keep profile details in sync if points were changed while viewing them
    if (editingStudent && ids.includes(editingStudent.id)) {
      const updatedSelf = updatedStudents.find(x => x.id === editingStudent.id);
      if (updatedSelf) setEditingStudent(updatedSelf);
    }
    if (randomStudent && ids.includes(randomStudent.id)) {
      const updatedRandomStudent = updatedStudents.find(x => x.id === randomStudent.id);
      if (updatedRandomStudent) setRandomStudent(updatedRandomStudent);
    }

    if (source === 'solo' && !releaseEventToShow) {
      const toastEvents: PokemonUiEvent[] = [
        ...progressionEvents.filter(event => ['xp', 'bond', 'streak', 'passive', 'charge-ready', 'level-up', 'evolution', 'hp', 'random-drop', 'mastery'].includes(event.type))
      ];
      if (hatchItems.length > 0) {
        toastEvents.unshift({
          type: 'evolution',
          message: `Trứng của ${hatchItems.map(item => item.studentName).join(', ')} đã nở`
        });
      }
      const hasActivePetAfterUpdate = updatedStudents.some(student => ids.includes(student.id) && !!student.pet);
      if (amount !== 0 && hasActivePetAfterUpdate) {
        toastEvents.push({
          type: 'hp',
          message: amount > 0 ? `HP +${amount}` : `HP -${Math.abs(amount)}`
        });
      }
      showPokemonReaction(toastEvents, amount >= 0 ? 'Pokémon phản ứng vui vẻ' : 'Pokémon vẫn cố gắng');
      if (hatchItems.length > 0) {
        showHatchAnnouncement(
          hatchItems,
          `Tin vui! Trứng của ${hatchItems.map(item => item.studentName).join(', ')} đã nở ra Pokémon đồng hành mới.`
        );
      }
    } else if (hatchItems.length > 0) {
      showHatchAnnouncement(
        hatchItems,
        `Tin vui! Trứng của ${hatchItems.map(item => item.studentName).join(', ')} đã nở ra Pokémon đồng hành mới.`
      );
    } else if (evolvedMessages.length > 0) {
      setHatchAnnouncementItems(null);
      setHatchSuccessMessage(`✨ POKÉMON EVOLUTION ✨\n\n${evolvedMessages.join('\n')}\nHãy chúc mừng trainer và Pokémon đồng hành.`);
      setShowHatchModal(true);
    }

    setShowSkillModal(false);
    if (source !== 'solo') {
      setShowRandomModal(false);
    }
    setFeedbackSource('manual');
    setManualPoints('');
    setSelectedStudentIds(source === 'solo' ? ids : []);
    setIsMultiSelectMode(false);
    if (source === 'solo') {
      const resolvedClassName = updatedStudents.find(student => ids.includes(student.id))?.className;
      app.incrementBossCounterForClass(resolvedClassName);
      if (amount > 0 && ids.length === 1 && !releaseEventToShow) {
        const ludoStudent = updatedStudents.find(student => student.id === ids[0]);
        if (ludoStudent) {
          setShowRandomModal(false);
          app.openLudoForClass(ludoStudent.className, ludoStudent, 'solo');
        }
      }
    }
  };

  return {
    handleUpdatePoints
  };
};
