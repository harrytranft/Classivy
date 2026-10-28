import { DEFAULT_LUCKY_WHEEL_REWARDS, DEFAULT_WHEEL_SPIN_SOUND_URL } from '../../data/constants';
import { playWheelFanfare } from './wheelSounds';
import { HistoryItem, LuckyWheelReward, PokemonPet, PokemonReleaseEvent, Student } from '../../types';
import { getRandomIndex } from '../../domain/random';
import { LuckyWheelResult } from '../../types/app';
import { getRandomPokemon } from '../../data/pokemonData';
import { createPokemonPetFromDexId, getPokemonDisplayName } from '../../domain/pokemonProgression';
import { applyPetHpDeltaToStudent } from '../../domain/gameEvents';
import { isGoodLuckyWheelReward, shuffleLuckyWheelRewards } from '../../domain/luckyWheel';
import { isSamePokemon, updateActivePetInCollection } from '../../domain/pokemonCollection';
import { appendAdventureJournal } from '../../domain/progression';
import { CLASS_SUB_PAGES } from '../../app/screenRoutes';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Vòng quay may mắn: mở, quay, âm thanh, trao thưởng.
export interface LuckyWheelActions {
  getWeightedLudoFinishRewards: () => { goodRewards: any; badRewards: any; displayRewards: LuckyWheelReward[]; };
  chooseLuckyWheelReward: (validRewards: LuckyWheelReward[]) => LuckyWheelReward;
  openLuckyWheelForLudoFinish: (student: Student) => void;
  getLuckyWheelValidRewards: (student: Student) => any;
  prepareLuckyWheelResult: (student: Student, reward: LuckyWheelReward) => LuckyWheelResult;
  applyLuckyWheelReward: (result: LuckyWheelResult) => Promise<void>;
  handleOpenLuckyWheel: () => void;
  stopLuckyWheelSpinSound: () => void;
  playLuckyWheelSpinSound: () => void;
  startLuckyWheelSpin: () => void;
  toggleLuckyWheelCandidate: (studentId: string) => void;
  closeLuckyWheel: () => void;
}

export const createLuckyWheelActions = (appState: AppState, app: AppActions): LuckyWheelActions => {
  const {
    editingStudent, filterClass, goToClassPage, isLuckyWheelSpinning, routeClassName, luckyWheelCandidateIds, luckyWheelDisplayRewards,
    luckyWheelMode, luckyWheelRef, luckyWheelRewards, luckyWheelRotation,
    luckyWheelSpinAudioRef, luckyWheelSpinSynthRef, negSoundUrl, petSkills, posSoundUrl,
    selectedStudentIds, setEditingStudent, setIsLuckyWheelSpinning, setIsMultiSelectMode,
    setLuckyWheelCandidateIds, setLuckyWheelDisplayRewards, setLuckyWheelMode,
    setLuckyWheelPendingResult, setLuckyWheelResult, setLuckyWheelRotation,
    setLudoActiveStudent, setLudoBonusRolls, setLudoClassName, setPokemonReleaseEvent,
    setSelectedStudentIds, setStudents, students, wheelFinishSoundUrl,
    wheelSpinSoundUrl
  } = appState;

  const getWeightedLudoFinishRewards = () => {
    const sourceRewards = luckyWheelRewards.length > 0 ? luckyWheelRewards : DEFAULT_LUCKY_WHEEL_REWARDS;
    const goodRewards = sourceRewards.filter(isGoodLuckyWheelReward);
    const badRewards = sourceRewards.filter(reward => !isGoodLuckyWheelReward(reward) && (reward.type === 'points' || reward.type === 'hp'));
    return {
      goodRewards,
      badRewards,
      displayRewards: shuffleLuckyWheelRewards([...goodRewards, ...badRewards])
    };
  };

  const chooseLuckyWheelReward = (validRewards: LuckyWheelReward[]) => {
    if (luckyWheelMode !== 'ludo-finish') return validRewards[getRandomIndex(validRewards.length)];

    const goodRewards = validRewards.filter(isGoodLuckyWheelReward);
    const badRewards = validRewards.filter(reward => !isGoodLuckyWheelReward(reward) && (reward.type === 'points' || reward.type === 'hp'));
    const preferGood = getRandomIndex(100) < 60;
    const preferredPool = preferGood ? goodRewards : badRewards;
    const fallbackPool = preferGood ? badRewards : goodRewards;
    const pool = preferredPool.length > 0 ? preferredPool : fallbackPool.length > 0 ? fallbackPool : validRewards;
    return pool[getRandomIndex(pool.length)];
  };

  const openLuckyWheelForLudoFinish = (student: Student) => {
    if (isLuckyWheelSpinning) return;
    const { displayRewards } = getWeightedLudoFinishRewards();
    setLuckyWheelMode('ludo-finish');
    setLuckyWheelCandidateIds([student.id]);
    setLuckyWheelDisplayRewards(displayRewards);
    setLuckyWheelPendingResult(null);
    setLuckyWheelResult(null);
    goToClassPage(student.className, CLASS_SUB_PAGES.wheel);
  };

  const getLuckyWheelValidRewards = (student: Student) => {
    const ownedSkillIds = student.pet?.skills || [];
    return luckyWheelRewards.filter(reward => {
      if (reward.type === 'hp') return !!student.pet;
      if (reward.type === 'skill') {
        return !!student.pet && petSkills.some(sk => !ownedSkillIds.includes(sk.id));
      }
      if (reward.type === 'ludo_rolls') return (reward.amount || 0) > 0;
      return true;
    });
  };

  const prepareLuckyWheelResult = (student: Student, reward: LuckyWheelReward): LuckyWheelResult => {
    if (reward.type === 'pokemon') {
      const randomPokemon = getRandomPokemon();
      const giftedPet = createPokemonPetFromDexId(randomPokemon.dexId);
      return {
        student,
        reward,
        pokemon: giftedPet,
        message: `${student.name} nhận được ${giftedPet.isShiny ? 'Shiny ' : ''}Pokémon ${getPokemonDisplayName(giftedPet)}!`
      };
    }

    if (reward.type === 'skill' && student.pet) {
      const ownedSkillIds = student.pet.skills || [];
      const availableSkills = petSkills.filter(sk => !ownedSkillIds.includes(sk.id));
      const giftedSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
      return {
        student,
        reward,
        skill: giftedSkill,
        message: `${student.name} nhận thêm tuyệt chiêu ${giftedSkill.name} cho ${getPokemonDisplayName(student.pet)}!`
      };
    }

    if (reward.type === 'hp') {
      const hpDelta = reward.amount || 0;
      return {
        student,
        reward,
        hpDelta,
        message: hpDelta >= 0
          ? `Pokémon của ${student.name} hồi ${hpDelta} HP!`
          : `Pokémon của ${student.name} bị trừ ${Math.abs(hpDelta)} HP!`
      };
    }

    if (reward.type === 'ludo_rolls') {
      const rolls = Math.min(5, Math.max(1, reward.amount || 1));
      return {
        student,
        reward: { ...reward, amount: rolls },
        message: `${student.name} được thêm ${rolls} lượt lắc xúc xắc Cá Ngựa!`
      };
    }

    const pointAmount = reward.amount || 0;
    return {
      student,
      reward,
      message: `${student.name} ${pointAmount >= 0 ? 'được cộng' : 'bị trừ'} ${Math.abs(pointAmount)} điểm Hào quang!`
    };
  };

  const applyLuckyWheelReward = async (result: LuckyWheelResult) => {
    const reward = result.reward;

    if (reward.type === 'points') {
      await app.handleUpdatePoints([result.student.id], reward.amount || 0, `🎡 Vòng quay may mắn: ${reward.label}`, 'lucky-wheel');
      setLuckyWheelResult(result);
      setIsLuckyWheelSpinning(false);
      return;
    }

    const isPositiveReward = reward.type !== 'hp' || (result.hpDelta || 0) >= 0;
    let releaseEventToShow: PokemonReleaseEvent | null = null;

    setStudents(prev => {
      let updatedTarget: Student | null = null;

      const nextStudents = prev.map(s => {
        if (s.id !== result.student.id) return s;

        const historyItem: HistoryItem = {
          id: Date.now().toString() + Math.random(),
          amount: 0,
          reason: `🎡 Vòng quay may mắn: ${result.message}`,
          timestamp: Date.now()
        };

        if (reward.type === 'pokemon' && result.pokemon) {
          const currentPets = s.pets ? [...s.pets] : [];
          if (s.pet && !currentPets.some(p => isSamePokemon(p, s.pet))) {
            currentPets.push(s.pet);
          }
          let updatedS: Student = {
            ...s,
            pet: result.pokemon,
            pets: [result.pokemon, ...currentPets],
            history: [historyItem, ...s.history].slice(0, 50)
          };
          if (result.pokemon.isShiny) {
            updatedS = appendAdventureJournal(updatedS, {
              type: 'shiny-acquired',
              text: `${s.name} received Shiny ${getPokemonDisplayName(result.pokemon)} from Lucky Wheel.`,
              petInstanceId: result.pokemon.instanceId
            });
          }
          updatedTarget = updatedS;
          return updatedS;
        }

        if (reward.type === 'skill' && result.skill && s.pet) {
          const currentUses = s.pet.skillUses ? { ...s.pet.skillUses } : {};
          currentUses[result.skill.id] = 0;
          const updatedPet: PokemonPet = {
            ...s.pet,
            skills: [...(s.pet.skills || []), result.skill.id],
            skillUses: currentUses
          };
          const updatedS: Student = {
            ...s,
            pet: updatedPet,
            pets: updateActivePetInCollection(s, updatedPet),
            history: [historyItem, ...s.history].slice(0, 50)
          };
          updatedTarget = updatedS;
          return updatedS;
        }

        if (reward.type === 'hp' && s.pet) {
          const hpUpdate = applyPetHpDeltaToStudent(s, result.hpDelta || 0, `Vòng quay may mắn: ${reward.label}`);
          const updatedS: Student = {
            ...hpUpdate.student,
            history: [historyItem, ...hpUpdate.student.history].slice(0, 50)
          };
          if (hpUpdate.releaseEvent && !releaseEventToShow) releaseEventToShow = hpUpdate.releaseEvent;
          updatedTarget = updatedS;
          return updatedS;
        }

        if (reward.type === 'ludo_rolls') {
          const rolls = Math.min(5, Math.max(1, reward.amount || 1));
          setLudoBonusRolls(prevRolls => ({
            ...prevRolls,
            [s.id]: (prevRolls[s.id] || 0) + rolls
          }));
          setLudoClassName(s.className);
          setLudoActiveStudent(s);
          const updatedS: Student = {
            ...s,
            history: [historyItem, ...s.history].slice(0, 50)
          };
          updatedTarget = updatedS;
          return updatedS;
        }

        return s;
      });

      if (updatedTarget && editingStudent?.id === updatedTarget.id) {
        setEditingStudent(updatedTarget);
      }

      return nextStudents;
    });

    new Audio(isPositiveReward ? posSoundUrl : negSoundUrl).play().catch(() => {});
    if (releaseEventToShow) setPokemonReleaseEvent(releaseEventToShow);
    setSelectedStudentIds([]);
    setIsMultiSelectMode(false);
    setLuckyWheelResult(result);
    setIsLuckyWheelSpinning(false);
  };

  const handleOpenLuckyWheel = () => {
    if (isLuckyWheelSpinning) return;

    // Mặc định tick tất cả học sinh có đi học của lớp hiện tại; có thể tick bớt/thêm ngay trên trang vòng quay.
    const candidates = students.filter(s => !s.isAbsent && s.className === filterClass);
    setLuckyWheelCandidateIds(candidates.map(s => s.id));
    const shuffledRewards = shuffleLuckyWheelRewards(luckyWheelRewards.length > 0 ? luckyWheelRewards : DEFAULT_LUCKY_WHEEL_REWARDS);
    setLuckyWheelMode('normal');
    setLuckyWheelDisplayRewards(shuffledRewards);
    setLuckyWheelPendingResult(null);
    setLuckyWheelResult(null);
    goToClassPage(filterClass, CLASS_SUB_PAGES.wheel);
  };

  const toggleLuckyWheelCandidate = (studentId: string) => {
    if (isLuckyWheelSpinning || luckyWheelMode === 'ludo-finish') return;
    setLuckyWheelCandidateIds(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };

  /** Đóng trang vòng quay: lượt cán đích Cá Ngựa quay lại bàn cờ, còn lại về trang lớp. */
  const closeLuckyWheel = () => {
    if (isLuckyWheelSpinning) return;
    const className = routeClassName || filterClass;
    setLuckyWheelMode('normal');
    goToClassPage(className, luckyWheelMode === 'ludo-finish' ? CLASS_SUB_PAGES.ludo : null, { replace: true });
  };

  const stopLuckyWheelSpinSound = () => {
    if (luckyWheelSpinAudioRef.current) {
      luckyWheelSpinAudioRef.current.pause();
      luckyWheelSpinAudioRef.current.currentTime = 0;
      luckyWheelSpinAudioRef.current = null;
    }
    if (luckyWheelSpinSynthRef.current) {
      window.clearInterval(luckyWheelSpinSynthRef.current.intervalId);
      luckyWheelSpinSynthRef.current.context.close().catch(() => {});
      luckyWheelSpinSynthRef.current = null;
    }
  };

  const playLuckyWheelSpinSound = () => {
    stopLuckyWheelSpinSound();

    const spinSoundUrl = wheelSpinSoundUrl.trim() || DEFAULT_WHEEL_SPIN_SOUND_URL;
    const spinAudio = new Audio(spinSoundUrl);
    spinAudio.loop = true;
    spinAudio.volume = 0.55;
    luckyWheelSpinAudioRef.current = spinAudio;
    spinAudio.play().catch(() => {});

    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;

    const context = new AudioContextCtor();
    const playTick = () => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = 360 + Math.random() * 520;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.085);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.09);
    };
    playTick();
    const intervalId = window.setInterval(playTick, 115);
    luckyWheelSpinSynthRef.current = { context, intervalId };
  };

  const startLuckyWheelSpin = () => {
    if (isLuckyWheelSpinning) return;

    const candidates = students.filter(s => luckyWheelCandidateIds.includes(s.id) && !s.isAbsent
      && (luckyWheelMode === 'ludo-finish' || s.className === filterClass));
    if (candidates.length === 0) {
      alert("Không còn trainer hợp lệ trong lượt quay này.");
      return;
    }

    const chosenStudent = candidates[getRandomIndex(candidates.length)];
    const validRewards = getLuckyWheelValidRewards(chosenStudent);
    if (validRewards.length === 0) {
      alert("Không có phần thưởng/hình phạt hợp lệ cho trainer này. Vui lòng kiểm tra Customize Vòng quay may mắn.");
      return;
    }

    const displayRewards = luckyWheelDisplayRewards.length > 0 ? luckyWheelDisplayRewards : shuffleLuckyWheelRewards(luckyWheelRewards);
    const chosenReward = chooseLuckyWheelReward(validRewards);
    const preparedResult = prepareLuckyWheelResult(chosenStudent, chosenReward);
    const rewardIndex = Math.max(0, displayRewards.findIndex(reward => reward.id === chosenReward.id));
    const segmentSize = 360 / Math.max(1, displayRewards.length);
    const targetCenter = rewardIndex * segmentSize + segmentSize / 2;
    const startRotation = luckyWheelRotation % 360;
    const finalRotation = luckyWheelRotation + 360 * 12 + (360 - targetCenter);

    setLuckyWheelPendingResult(preparedResult);
    setLuckyWheelResult(null);
    setIsLuckyWheelSpinning(true);
    setLuckyWheelRotation(startRotation);

    playLuckyWheelSpinSound();

    window.requestAnimationFrame(() => {
      if (luckyWheelRef.current) {
        luckyWheelRef.current.getAnimations().forEach(animation => animation.cancel());
        luckyWheelRef.current.animate([
          { transform: `rotate(${startRotation}deg)`, offset: 0 },
          { transform: `rotate(${startRotation + 180}deg)`, offset: 0.15 },
          { transform: `rotate(${startRotation + 360 * 8}deg)`, offset: 0.7 },
          { transform: `rotate(${finalRotation}deg)`, offset: 1 }
        ], {
          duration: 10000,
          easing: 'linear',
          fill: 'forwards'
        });
      }
    });

    window.setTimeout(() => {
      stopLuckyWheelSpinSound();
      if (wheelFinishSoundUrl.trim()) {
        new Audio(wheelFinishSoundUrl).play().catch(() => {});
      } else {
        playWheelFanfare(chosenReward.type !== 'hp' || (chosenReward.amount || 0) >= 0);
      }
      setLuckyWheelRotation(finalRotation);
      applyLuckyWheelReward(preparedResult);
    }, 10000);
  };

  return {
    getWeightedLudoFinishRewards, chooseLuckyWheelReward, openLuckyWheelForLudoFinish,
    getLuckyWheelValidRewards, prepareLuckyWheelResult, applyLuckyWheelReward,
    handleOpenLuckyWheel, stopLuckyWheelSpinSound, playLuckyWheelSpinSound,
    startLuckyWheelSpin, toggleLuckyWheelCandidate, closeLuckyWheel
  };
};
