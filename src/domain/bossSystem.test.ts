import { describe, expect, it, vi } from 'vitest';
import { Gender, Student } from '../types';
import {
  BOSS_COMBO_BONUS_DAMAGE,
  BOSS_PARTY_SIZE,
  createClassBossState,
  getBossEncounterFrequencyOption,
  incrementBossEncounterCounter,
  isBossEncounterFrequency,
  isBossEncounterReady,
  normalizeClassBossState,
  previewBossRound,
  recalibrateBossEncounterFrequency,
  resolveBossRound,
  rollNextBossEncounterGap,
  selectBossParty
} from './bossSystem';
import { createPokemonPetFromDexId } from './pokemonProgression';

const makeStudent = (id: string, overrides: Partial<Student> = {}): Student => ({
  id,
  name: `Student ${id}`,
  gender: Gender.MALE,
  className: 'Class A',
  points: 0,
  history: [],
  pet: createPokemonPetFromDexId(25, undefined, { isShiny: false }),
  ...overrides
});

const PARTY = ['s1', 's2', 's3', 's4', 's5'];
const allCorrect = () => PARTY.map(studentId => ({ studentId, correct: true }));
const allWrong = () => PARTY.map(studentId => ({ studentId, correct: false }));

describe('boss system', () => {
  it('rolls default encounter gaps from 6 to 9', () => {
    for (let index = 0; index < 200; index += 1) {
      expect(rollNextBossEncounterGap()).toBeGreaterThanOrEqual(6);
      expect(rollNextBossEncounterGap()).toBeLessThanOrEqual(9);
    }
  });

  it('rolls encounter gaps by configured frequency', () => {
    const frequent = getBossEncounterFrequencyOption('frequent');
    const occasional = getBossEncounterFrequencyOption('occasional');
    const rare = getBossEncounterFrequencyOption('rare');

    for (let index = 0; index < 200; index += 1) {
      expect(rollNextBossEncounterGap('frequent')).toBeGreaterThanOrEqual(frequent.minGap);
      expect(rollNextBossEncounterGap('frequent')).toBeLessThanOrEqual(frequent.maxGap);
      expect(rollNextBossEncounterGap('occasional')).toBeGreaterThanOrEqual(occasional.minGap);
      expect(rollNextBossEncounterGap('occasional')).toBeLessThanOrEqual(occasional.maxGap);
      expect(rollNextBossEncounterGap('rare')).toBeGreaterThanOrEqual(rare.minGap);
      expect(rollNextBossEncounterGap('rare')).toBeLessThanOrEqual(rare.maxGap);
    }
  });

  it('recalibrates existing boss state when frequency changes', () => {
    const state = { ...createClassBossState('Class A'), randomsSinceLastEncounter: 4, nextEncounterAt: 14 };
    const recalibrated = recalibrateBossEncounterFrequency(state, 'frequent', 2);

    expect(recalibrated.nextEncounterAt).toBe(5);
    expect(recalibrated.encounterReady).toBe(false);

    const ready = incrementBossEncounterCounter(recalibrated, 3);
    expect(isBossEncounterReady(ready)).toBe(true);
  });

  it('increments encounter counter and marks ready at threshold', () => {
    let state = { ...createClassBossState('Class A'), nextEncounterAt: 2 };
    state = incrementBossEncounterCounter(state);
    expect(state.randomsSinceLastEncounter).toBe(1);
    expect(isBossEncounterReady(state)).toBe(false);

    state = incrementBossEncounterCounter(state);
    expect(state.randomsSinceLastEncounter).toBe(2);
    expect(isBossEncounterReady(state)).toBe(true);
  });

  it('selects exactly five eligible students and excludes absent/no-pet students', () => {
    const students = [
      ...Array.from({ length: 6 }, (_, index) => makeStudent(`s${index + 1}`)),
      makeStudent('absent', { isAbsent: true }),
      makeStudent('no-pet', { pet: undefined, pets: [] })
    ];

    const { party } = selectBossParty(students, [], []);

    expect(party).toHaveLength(BOSS_PARTY_SIZE);
    expect(party.some(student => student.id === 'absent')).toBe(false);
    expect(party.some(student => student.id === 'no-pet')).toBe(false);
  });

  it('cycles fair queue and avoids the previous party when enough students are available', () => {
    const students = Array.from({ length: 10 }, (_, index) => makeStudent(`s${index + 1}`));
    const first = selectBossParty(students, students.map(student => student.id), []);
    const second = selectBossParty(students, first.nextQueue, first.party.map(student => student.id));

    expect(first.party).toHaveLength(5);
    expect(second.party).toHaveLength(5);
    expect(second.party.some(student => first.party.some(previous => previous.id === student.id))).toBe(false);
  });

  it('applies success damage, contribution updates, and HP clamp on defeat', () => {
    const state = {
      ...createClassBossState('Class A'),
      boss: {
        ...createClassBossState('Class A').boss,
        currentHp: 20
      }
    };
    const result = resolveBossRound(state, allCorrect(), 'round-1', 1);

    expect(result.damageDealt).toBe(25 + BOSS_COMBO_BONUS_DAMAGE);
    expect(result.comboTriggered).toBe(true);
    expect(result.bossDefeated).toBe(true);
    expect(result.topContributors).toHaveLength(5);
    expect(result.topContributors[0].damageDealt).toBe(5);
    expect(result.state.defeatedBosses).toBe(1);
    expect(result.state.randomsSinceLastEncounter).toBe(0);
  });

  it('all correct: 5 x 5 damage plus the combo bonus, no failed rounds', () => {
    const state = createClassBossState('Class A');
    const result = resolveBossRound(state, allCorrect(), 'round-1', 1);

    expect(result.damageDealt).toBe(35);
    expect(result.comboTriggered).toBe(true);
    expect(result.state.boss.currentHp).toBe(state.boss.maxHp - 35);
    expect(result.state.contributionByStudentId.s1.successfulRounds).toBe(1);
    expect(result.state.contributionByStudentId.s1.failedRounds).toBe(0);
    // Combo là sát thương chung, không cộng vào đóng góp cá nhân.
    expect(result.state.contributionByStudentId.s1.damageDealt).toBe(5);
  });

  it('4 of 5 correct: only the four deal damage, no combo, the wrong student alone takes a failed round', () => {
    const state = createClassBossState('Class A');
    const results = [
      { studentId: 's1', correct: true }, { studentId: 's2', correct: true }, { studentId: 's3', correct: false },
      { studentId: 's4', correct: true }, { studentId: 's5', correct: true }
    ];
    const result = resolveBossRound(state, results, 'round-1', 1);

    expect(result.damageDealt).toBe(20);
    expect(result.comboTriggered).toBe(false);
    expect(result.state.boss.currentHp).toBe(state.boss.maxHp - 20);
    expect(result.state.contributionByStudentId.s1.damageDealt).toBe(5);
    expect(result.state.contributionByStudentId.s3.damageDealt).toBe(0);
    expect(result.state.contributionByStudentId.s3.failedRounds).toBe(1);
    expect(result.state.contributionByStudentId.s3.successfulRounds).toBe(0);
    expect(result.state.contributionByStudentId.s3.appearances).toBe(1);
    expect(result.state.previousPartyIds).toEqual(['s1', 's2', 's3', 's4', 's5']);
  });

  it('1 of 5 correct: 5 damage and four failed rounds', () => {
    const state = createClassBossState('Class A');
    const results = ['s1', 's2', 's3', 's4', 's5'].map((studentId, index) => ({ studentId, correct: index === 0 }));
    const result = resolveBossRound(state, results, 'round-1', 1);

    expect(result.damageDealt).toBe(5);
    expect(result.comboTriggered).toBe(false);
    expect(Object.values(result.state.contributionByStudentId).filter(item => item.failedRounds === 1)).toHaveLength(4);
  });

  it('0 of 5 correct: no damage to the boss, everyone has a failed round (old failure behaviour)', () => {
    const state = createClassBossState('Class A');
    const startingHp = state.boss.currentHp;
    const result = resolveBossRound(state, allWrong(), 'round-1', 1);

    expect(result.damageDealt).toBe(0);
    expect(result.comboTriggered).toBe(false);
    expect(result.bossDefeated).toBe(false);
    expect(result.state.boss.currentHp).toBe(startingHp);
    expect(result.state.contributionByStudentId.s1.failedRounds).toBe(1);
    expect(result.state.contributionByStudentId.s1.damageDealt).toBe(0);
    expect(result.state.randomsSinceLastEncounter).toBe(0);
  });

  it('a partial round can still defeat the boss and resets contributions', () => {
    const base = createClassBossState('Class A');
    const state = { ...base, boss: { ...base.boss, currentHp: 15 } };
    const results = [
      { studentId: 's1', correct: true }, { studentId: 's2', correct: true }, { studentId: 's3', correct: true },
      { studentId: 's4', correct: false }, { studentId: 's5', correct: false }
    ];
    const result = resolveBossRound(state, results, 'round-1', 1);

    expect(result.damageDealt).toBe(15);
    expect(result.bossDefeated).toBe(true);
    expect(result.topContributors.map(item => item.studentId)).toContain('s4');
    expect(result.state.contributionByStudentId).toEqual({});
    expect(result.state.boss.currentHp).toBe(result.state.boss.maxHp);
    expect(result.state.defeatedBosses).toBe(1);
  });

  it('previewBossRound matches what the round deals', () => {
    const boss = createClassBossState('Class A').boss;
    expect(previewBossRound(boss, allCorrect())).toEqual({ correctCount: 5, wrongCount: 0, damage: 35, comboTriggered: true });
    expect(previewBossRound(boss, allWrong())).toEqual({ correctCount: 0, wrongCount: 5, damage: 0, comboTriggered: false });
    expect(previewBossRound(boss, [])).toEqual({ correctCount: 0, wrongCount: 0, damage: 0, comboTriggered: false });
  });

  it('sorts top contributors deterministically', () => {
    const state = {
      ...createClassBossState('Class A'),
      contributionByStudentId: {
        a: { studentId: 'a', damageDealt: 10, successfulRounds: 2, appearances: 3, failedRounds: 1, firstContributionAt: 2 },
        b: { studentId: 'b', damageDealt: 10, successfulRounds: 2, appearances: 2, failedRounds: 0, firstContributionAt: 3 },
        c: { studentId: 'c', damageDealt: 15, successfulRounds: 3, appearances: 4, failedRounds: 1, firstContributionAt: 4 }
      }
    };
    const result = resolveBossRound(state, ['a', 'b', 'c', 'd', 'e'].map(studentId => ({ studentId, correct: true })), 'round-2', 5);

    expect(result.topContributors.map(contribution => contribution.studentId).slice(0, 3)).toEqual(['c', 'b', 'a']);
  });

  it('does not apply the same round twice', () => {
    const state = createClassBossState('Class A');
    const first = resolveBossRound(state, allCorrect(), 'same-round', 1);
    const second = resolveBossRound(first.state, allCorrect(), 'same-round', 2);

    expect(second.damageDealt).toBe(0);
    expect(second.state.boss.currentHp).toBe(first.state.boss.currentHp);
  });
});

describe('isBossEncounterFrequency', () => {
  it('accepts only the three known frequencies', () => {
    expect(isBossEncounterFrequency('frequent')).toBe(true);
    expect(isBossEncounterFrequency('occasional')).toBe(true);
    expect(isBossEncounterFrequency('rare')).toBe(true);
    expect(isBossEncounterFrequency('never')).toBe(false);
    expect(isBossEncounterFrequency(null)).toBe(false);
    expect(isBossEncounterFrequency(undefined)).toBe(false);
  });
});

describe('normalizeClassBossState', () => {
  it('keeps the saved boss and does not mint a new id for it', () => {
    const state = createClassBossState('6A', 1000, 'occasional');
    const uuid = vi.spyOn(globalThis.crypto, 'randomUUID');
    const normalized = normalizeClassBossState(state, '6A', 'occasional');
    expect(uuid).not.toHaveBeenCalled();
    expect(normalized).toEqual(state);
    expect(Object.keys(normalized.boss)).toEqual(Object.keys(state.boss));
    uuid.mockRestore();
  });

  it('creates a boss id when the saved boss has none', () => {
    const state = createClassBossState('6A', 1000, 'occasional');
    const { instanceId: _removed, ...bossWithoutId } = state.boss;
    const normalized = normalizeClassBossState({ ...state, boss: bossWithoutId as typeof state.boss }, '6A', 'occasional');
    expect(normalized.boss.instanceId).toBeTruthy();
    expect(normalized.boss.name).toBe(state.boss.name);
  });
});
