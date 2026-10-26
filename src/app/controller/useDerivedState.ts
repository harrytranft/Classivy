import React, { useMemo } from 'react';
import { Gender, RankInfo, Student } from '../../types';
import { getLocalDateKey } from '../../domain/dates';
import { getNextEvolutionPreview } from '../../domain/pokemonProgression';
import { getBossEncounterFrequencyOption, getBossTopContributors, normalizeClassBossState } from '../../domain/bossSystem';
import { DEFAULT_LUDO_TILES, LUDO_FINISH_TILE } from '../../data/constants';
import { BaseState } from './appState';

// Giá trị suy ra từ state (lọc lớp, boss hiện tại, Cá Ngựa, vòng quay...). Tính lại mỗi lần render như trước.
export const useDerivedState = (s: BaseState) => {
  const {
    activeBossRound, bossEncounterFrequency, bossStatesByClass, customLudoTiles,
    editingStudent, filterClass, luckyWheelDisplayRewards, luckyWheelRewards, ludoClassName,
    pokemonReleaseEvent, ranksFemale, ranksMale, searchQuery, selectedStudentIds, sortType,
    students
  } = s;

  const getRank = (points: number, gender: Gender): RankInfo => {
    const list = gender === Gender.MALE ? ranksMale : ranksFemale;
    const sorted = [...list].sort((a, b) => b.minPoints - a.minPoints);
    return sorted.find(r => points >= r.minPoints) || list[0];
  };
  const classes = useMemo(() => ['Tất cả', ...Array.from(new Set(students.map(s => s.className)))], [students]);
  const currentClassStudents = useMemo(() => {
    let list = students.filter(s => filterClass === 'Tất cả' || s.className === filterClass);
    if (searchQuery) list = list.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (sortType === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortType === 'points-desc') list.sort((a, b) => b.points - a.points);
    else if (sortType === 'points-asc') list.sort((a, b) => a.points - b.points);
    return list;
  }, [students, filterClass, searchQuery, sortType]);
  const giftPokemonRoster = useMemo(
    () => students
      .filter(student => filterClass === 'Tất cả' || student.className === filterClass)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [students, filterClass]
  );
  const presentStudents = useMemo(() => currentClassStudents.filter(s => !s.isAbsent), [currentClassStudents]);
  const homeworkLessonDateKey = getLocalDateKey();
  const editingPetEvolutionPreview = useMemo(() => getNextEvolutionPreview(editingStudent?.pet), [editingStudent?.pet]);
  const classOptions = useMemo(() => classes.filter(c => c !== 'Tất cả'), [classes]);
  const activeRandomClassName = filterClass !== 'Tất cả' ? filterClass : '';
  const currentBossFrequencyOption = useMemo(
    () => getBossEncounterFrequencyOption(bossEncounterFrequency),
    [bossEncounterFrequency]
  );
  const activeClassBossState = activeRandomClassName ? bossStatesByClass[activeRandomClassName] : undefined;
  // Memoized: normalizing a class without a saved boss rolls a random boss, so do it once per change, not on every render.
  const currentBossState = useMemo(
    () => activeRandomClassName
      ? normalizeClassBossState(activeClassBossState, activeRandomClassName, bossEncounterFrequency)
      : null,
    [activeClassBossState, activeRandomClassName, bossEncounterFrequency]
  );
  const activeBossParty = activeBossRound
    ? activeBossRound.partyStudentIds
      .map(studentId => students.find(student => student.id === studentId))
      .filter(Boolean) as Student[]
    : [];
  const studentsById = useMemo(() => Object.fromEntries(students.map(student => [student.id, student])), [students]);
  const currentBossTopContributors = currentBossState
    ? getBossTopContributors(currentBossState).map(contribution => ({
      contribution,
      student: studentsById[contribution.studentId]
    }))
    : [];
  const luckyWheelBackground = useMemo(() => {
    const rewardsForWheel = luckyWheelDisplayRewards.length > 0 ? luckyWheelDisplayRewards : luckyWheelRewards;
    if (rewardsForWheel.length === 0) return '#facc15';
    const sliceSize = 100 / rewardsForWheel.length;
    return `conic-gradient(${rewardsForWheel.map((reward, idx) => `${reward.color} ${idx * sliceSize}% ${(idx + 1) * sliceSize}%`).join(', ')})`;
  }, [luckyWheelDisplayRewards, luckyWheelRewards]);
  const activeLudoClassName = ludoClassName || (filterClass !== 'Tất cả' ? filterClass : classOptions[0] || '');
  const ludoRaceStudents = useMemo(() => {
    if (!activeLudoClassName) return [];
    return students
      .filter(s => s.className === activeLudoClassName && !s.isAbsent)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, activeLudoClassName]);
  const effectiveLudoTiles = useMemo(
    () => ({ ...DEFAULT_LUDO_TILES, ...customLudoTiles }),
    [customLudoTiles]
  );
  const ludoSpecialTileCount = useMemo(
    () => Object.keys(effectiveLudoTiles).filter(tile => Number(tile) >= 0 && Number(tile) <= LUDO_FINISH_TILE).length,
    [effectiveLudoTiles]
  );
  const getSidebarData = () => {
    if (selectedStudentIds.length !== 1) return null;
    const student = students.find(s => s.id === selectedStudentIds[0]);
    if (!student) return null;

    const rank = getRank(student.points, student.gender);
    const nextThreshold = (Math.floor(student.points / 50) + 1) * 50;
    const pointsToNext = nextThreshold - student.points;
    const demoteThreshold = Math.floor(student.points / 50) * 50 - 1;
    const pointsToDemote = student.points - demoteThreshold;

    return { student, rank, pointsToNext, pointsToDemote };
  };
  const sidebarData = getSidebarData();
  const releaseStudent = pokemonReleaseEvent ? students.find(s => s.id === pokemonReleaseEvent.studentId) : undefined;
  const releaseEggCost = 10;
  const releaseEggShortfall = Math.max(0, releaseEggCost - (releaseStudent?.points || 0));

  return {
    getRank, classes, currentClassStudents, giftPokemonRoster, presentStudents,
    homeworkLessonDateKey, editingPetEvolutionPreview, classOptions, activeRandomClassName,
    currentBossFrequencyOption, currentBossState, activeBossParty, studentsById,
    currentBossTopContributors, luckyWheelBackground, activeLudoClassName, ludoRaceStudents,
    effectiveLudoTiles, ludoSpecialTileCount, getSidebarData, sidebarData, releaseStudent,
    releaseEggCost, releaseEggShortfall
  };
};
