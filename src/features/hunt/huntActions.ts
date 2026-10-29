import { Student } from '../../types';
import { awardLudoAura } from '../../domain/ludo';
import { grantPokemonToStudent } from '../../domain/pokemonGrant';
import { appendAdventureJournal } from '../../domain/progression';
import { createPokemonPetFromDexId, getPokemonDisplayName } from '../../domain/pokemonProgression';
import {
  WILD_RARITY_LABELS, applyHuntAnswer, buildCatchWheelEntries, createWildEncounter, getConsolationStudentIds,
  pickNextCaller, startHunting
} from '../../domain/wildHunt';
import { CLASS_SUB_PAGES } from '../../app/screenRoutes';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Săn Pokémon hoang dã (Phase 13E): bắt đầu săn, gọi em, ghi Đúng/Sai, quay chọn người nhận, trao Pokémon.
export interface HuntActions {
  /** Mở trang săn Pokémon của lớp đang chọn. */
  openHuntPage: () => void;
  /** "Săn ngay": bắt đầu săn và gọi em đầu tiên. */
  startWildHunt: () => void;
  /** "Để sau": Pokémon bỏ đi, buổi này không xuất hiện lại. */
  dismissWildEncounter: () => void;
  /** Gọi (hoặc đổi) em trả lời, không lặp lại em đã gọi. */
  callWildCaller: () => void;
  answerWildHunt: (correct: boolean) => void;
  /** Sau vòng quay: trao Pokémon cho em trúng, điểm an ủi cho các em đúng còn lại. */
  completeWildCatch: (winnerId: string) => void;
  /** Kết thúc (bắt được hoặc bỏ chạy): xoá cuộc săn và về trang lớp. */
  finishWildHunt: () => void;
  /** Gọi thử từ Cài đặt: tạo ngay một Pokémon để thử, không tính vào "mỗi buổi tối đa 1 con". */
  callTestWildPokemon: () => void;
}

export const createHuntActions = (appState: AppState, app: AppActions): HuntActions => {
  const {
    classOptions, classroomSettings, filterClass, goToClassPage, routeClassName, setPokemonReleaseEvent, setStudents,
    setWildCatchResult, setWildEncounter, students, wildEncounter
  } = appState;

  const presentIdsOf = (className: string) => students.filter(s => s.className === className && !s.isAbsent).map(s => s.id);

  const openHuntPage = () => {
    const className = routeClassName || (filterClass !== 'Tất cả' ? filterClass : classOptions[0] || '');
    if (!className) {
      alert('Chưa có lớp nào để săn Pokémon.');
      return;
    }
    goToClassPage(className, CLASS_SUB_PAGES.hunt);
  };

  const startWildHunt = () => {
    if (!wildEncounter || wildEncounter.status !== 'announced') return;
    const hunting = startHunting(wildEncounter);
    const caller = pickNextCaller(hunting, presentIdsOf(wildEncounter.className));
    setWildEncounter(caller
      ? { ...hunting, currentStudentId: caller.studentId, calledStudentIds: caller.calledStudentIds }
      : hunting);
    goToClassPage(wildEncounter.className, CLASS_SUB_PAGES.hunt);
  };

  const dismissWildEncounter = () => setWildEncounter(null);

  const callWildCaller = () => {
    if (!wildEncounter || wildEncounter.status !== 'hunting') return;
    const caller = pickNextCaller(wildEncounter, presentIdsOf(wildEncounter.className));
    if (!caller) return;
    setWildEncounter({ ...wildEncounter, currentStudentId: caller.studentId, calledStudentIds: caller.calledStudentIds });
  };

  const answerWildHunt = (correct: boolean) => {
    if (!wildEncounter || wildEncounter.status !== 'hunting' || !wildEncounter.currentStudentId) return;
    const answered = applyHuntAnswer(wildEncounter, wildEncounter.currentStudentId, correct);
    if (answered.status !== 'hunting') {
      setWildEncounter(answered);
      return;
    }
    // Còn săn tiếp thì gọi luôn em kế tiếp cho nhanh.
    const caller = pickNextCaller(answered, presentIdsOf(answered.className));
    setWildEncounter(caller
      ? { ...answered, currentStudentId: caller.studentId, calledStudentIds: caller.calledStudentIds }
      : answered);
  };

  const completeWildCatch = (winnerId: string) => {
    if (!wildEncounter || wildEncounter.status !== 'caught' || wildEncounter.winnerId) return;
    const entries = buildCatchWheelEntries(wildEncounter);
    if (!entries.some(entry => entry.studentId === winnerId)) return;

    const settings = classroomSettings.wildHunt;
    const consolationIds = getConsolationStudentIds(entries, winnerId);
    const consolationPoints = settings.consolationPoints;
    const pet = createPokemonPetFromDexId(wildEncounter.dexId);
    const petName = getPokemonDisplayName(pet);
    const rarityLabel = WILD_RARITY_LABELS[wildEncounter.rarity];
    let releaseEvent: ReturnType<typeof awardLudoAura>['releaseEvent'] = null;

    const updated: Student[] = students.map(student => {
      if (student.id === winnerId) {
        const granted = grantPokemonToStudent(student, pet, {
          historyReason: `🌿 Bắt được ${petName} hoang dã (${rarityLabel})`,
          companion: 'ifNone',
          shinyJournalText: `${student.name} bắt được Shiny ${petName} hoang dã.`
        });
        return appendAdventureJournal(granted, {
          type: 'wild-catch',
          text: `${student.name} bắt được ${petName} hoang dã (${rarityLabel}).`,
          petInstanceId: pet.instanceId
        });
      }
      if (consolationPoints > 0 && consolationIds.includes(student.id)) {
        const result = awardLudoAura(student, consolationPoints, `🌿 Trả lời đúng khi săn ${petName} (+${consolationPoints}đ an ủi)`);
        if (result.releaseEvent && !releaseEvent) releaseEvent = result.releaseEvent;
        return result.student;
      }
      return student;
    });

    setStudents(updated);
    if (releaseEvent) setPokemonReleaseEvent(releaseEvent);
    setWildCatchResult({ winnerId, pet, consolationIds, consolationPoints });
    setWildEncounter({ ...wildEncounter, winnerId });
  };

  const finishWildHunt = () => {
    const className = wildEncounter?.className;
    setWildEncounter(null);
    setWildCatchResult(null);
    if (className) goToClassPage(className, null, { replace: true });
  };

  const callTestWildPokemon = () => {
    const className = filterClass !== 'Tất cả' ? filterClass : classOptions[0] || '';
    if (!className) {
      alert('Chưa có lớp nào. Hãy tạo lớp rồi gọi thử Pokémon hoang dã.');
      return;
    }
    setWildCatchResult(null);
    setWildEncounter(createWildEncounter(classroomSettings.wildHunt, className, Date.now(), Math.random, { isTest: true }));
    goToClassPage(className);
  };

  return { openHuntPage, startWildHunt, dismissWildEncounter, callWildCaller, answerWildHunt, completeWildCatch, finishWildHunt, callTestWildPokemon };
};
