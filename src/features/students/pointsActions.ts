import { GameEventSource, PokemonUiEvent } from '../../domain/gameEvents';
import { PointsOverride, applyPointsToStudents } from '../../domain/points';
import { PointsSkillKind, describePointsSkill, getPointsSkillPrompts, resolvePointsWithSkills } from '../../domain/skills';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Cộng/trừ điểm Hào Quang: hành động trung tâm mà Random, Battle, Vòng quay... cùng gọi.
export interface PointsActions {
  handleUpdatePoints: (ids: string[], amount: number, reason: string, source?: GameEventSource, options?: PointsUpdateOptions) => Promise<void>;
  /** Như handleUpdatePoints nhưng hỏi giáo viên "Dùng skill?" nếu em có Nhân Đôi / Lá Chắn / Kim Bài (Phase 11, D36). */
  requestPointsUpdate: (ids: string[], amount: number, reason: string, source?: GameEventSource) => Promise<void>;
  answerPointsSkill: (use: boolean) => Promise<void>;
  cancelPointsRequest: () => void;
}

export interface PointsUpdateOptions {
  overrides?: Record<string, PointsOverride>;
  /** Giữ hộp Random đang mở (skill tự chạy sau Random, không phải kết quả Ban thưởng/Phạt). */
  keepRandomOpen?: boolean;
}

export const createPointsActions = (appState: AppState, app: AppActions): PointsActions => {
  const {
    editingStudent, negSoundUrl, posSoundUrl, randomStudent,
    setEditingStudent, setFeedbackSource, setHatchAnnouncementItems, setHatchSuccessMessage,
    setIsMultiSelectMode, setManualPoints, setPokemonReleaseEvent, setRandomStudent,
    setSelectedStudentIds, setShowHatchModal, setShowRandomModal, setShowSkillModal,
    setStudents, showHatchAnnouncement, showPokemonReaction, students, pendingPoints, setPendingPoints
  } = appState;

  const handleUpdatePoints = async (ids: string[], amount: number, reason: string, source: GameEventSource = 'manual', options: PointsUpdateOptions = {}) => {
    if (isNaN(amount)) return;
    // Một em được chọn: số điểm thực tế có thể khác (Nhân Đôi, Lá Chắn, Kim Bài); dùng nó cho âm thanh/thông báo.
    const shownAmount = ids.length === 1 && options.overrides?.[ids[0]] ? options.overrides[ids[0]].amount : amount;

    // Play Sound using dynamic URLs
    const sound = new Audio(shownAmount >= 0 ? posSoundUrl : negSoundUrl);
    sound.play().catch(() => {});

    const {
      students: updatedStudents,
      hatchItems,
      evolvedMessages,
      progressionEvents,
      releaseEvent: releaseEventToShow
    } = applyPointsToStudents(students, { ids, amount, reason, source, overrides: options.overrides });

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
      if (shownAmount !== 0 && hasActivePetAfterUpdate) {
        toastEvents.push({
          type: 'hp',
          message: shownAmount > 0 ? `HP +${shownAmount}` : `HP -${Math.abs(shownAmount)}`
        });
      }
      showPokemonReaction(toastEvents, shownAmount >= 0 ? 'Pokémon phản ứng vui vẻ' : 'Pokémon vẫn cố gắng');
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
    if (source !== 'solo' && !options.keepRandomOpen) {
      setShowRandomModal(false);
    }
    setFeedbackSource('manual');
    setManualPoints('');
    setSelectedStudentIds(source === 'solo' ? ids : []);
    setIsMultiSelectMode(false);
    if (source === 'solo') {
      const resolvedClassName = updatedStudents.find(student => ids.includes(student.id))?.className;
      app.incrementBossCounterForClass(resolvedClassName);
      if (shownAmount > 0 && ids.length === 1 && !releaseEventToShow) {
        const ludoStudent = updatedStudents.find(student => student.id === ids[0]);
        if (ludoStudent) {
          setShowRandomModal(false);
          app.openLudoForClass(ludoStudent.className, ludoStudent, 'solo');
        }
      }
    }
  };

  const requestPointsUpdate = async (ids: string[], amount: number, reason: string, source: GameEventSource = 'manual') => {
    if (isNaN(amount)) return;
    const prompts = source === 'manual' || source === 'solo' ? getPointsSkillPrompts(students, ids, amount) : [];
    if (prompts.length === 0) return handleUpdatePoints(ids, amount, reason, source);
    setPendingPoints({ ids, amount, reason, source, prompts, index: 0, accepted: {} });
  };

  const finishPointsRequest = async (request: NonNullable<typeof pendingPoints>) => {
    const overrides: Record<string, PointsOverride> = {};
    for (const [studentId, kinds] of Object.entries(request.accepted)) {
      const resolved = resolvePointsWithSkills(request.amount, kinds);
      const used = request.prompts.find(prompt => prompt.studentId === studentId && prompt.kind === resolved.used[0]);
      if (!used) continue;
      const info = describePointsSkill(used, request.amount);
      overrides[studentId] = {
        amount: resolved.amount,
        reason: resolved.amount !== 0 ? `${request.reason} (${info.title})` : request.reason,
        skillUse: { skillId: used.skillId, skillName: info.title, detail: info.detail }
      };
    }
    setPendingPoints(null);
    // Mọi em được bỏ qua (Kim Bài): handleUpdatePoints vẫn chạy để ghi lượt skill và đóng các hộp.
    await handleUpdatePoints(request.ids, request.amount, request.reason, request.source, { overrides });
  };

  const answerPointsSkill = async (use: boolean) => {
    const request = pendingPoints;
    if (!request) return;
    const prompt = request.prompts[request.index];
    const accepted = { ...request.accepted };
    if (use) accepted[prompt.studentId] = [...(accepted[prompt.studentId] || []), prompt.kind];
    // Em đã dùng Kim Bài thì không cần hỏi Lá Chắn nữa.
    let index = request.index + 1;
    while (index < request.prompts.length) {
      const next = request.prompts[index];
      if (next.kind === 'guard' && accepted[next.studentId]?.includes('survival')) { index += 1; continue; }
      break;
    }
    const next = { ...request, accepted, index };
    if (index >= request.prompts.length) await finishPointsRequest(next);
    else setPendingPoints(next);
  };

  const cancelPointsRequest = () => setPendingPoints(null);

  return {
    handleUpdatePoints, requestPointsUpdate, answerPointsSkill, cancelPointsRequest
  };
};
