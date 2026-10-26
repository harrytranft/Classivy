import { GameEventSource, PokemonUiEvent } from '../../domain/gameEvents';
import { applyPointsToStudents } from '../../domain/points';
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

    const {
      students: updatedStudents,
      hatchItems,
      evolvedMessages,
      progressionEvents,
      releaseEvent: releaseEventToShow,
      rankChanges
    } = applyPointsToStudents(students, { ids, amount, reason, source, getRank });
    rankChanges.forEach(change => {
      // Gemini SDK is loaded on demand so it is not part of the first page load.
      import('../../lib/geminiService')
        .then(({ generateEdict }) => generateEdict(change.studentName, change.newTitle, change.promoted))
        .then(setEdict);
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
