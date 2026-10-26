import React, { useState } from 'react';
import { ActiveBossRound, BossContribution, BossInstance, Student } from '../../types';
import { BattleLudoTurn, RandomMode } from '../../types/app';

// State Random: solo, battle, boss.
export const useRandomState = () => {
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [randomStudent, setRandomStudent] = useState<Student | null>(null);
  const [randomMode, setRandomMode] = useState<RandomMode>('solo');
  const [battleStudentA, setBattleStudentA] = useState<Student | null>(null);
  const [battleStudentB, setBattleStudentB] = useState<Student | null>(null);
  const [battleScoreA, setBattleScoreA] = useState<number>(0);
  const [battleScoreB, setBattleScoreB] = useState<number>(0);
  const [battleResultSummary, setBattleResultSummary] = useState<{
    studentA: Student;
    studentB: Student;
    winner: Student | null;
    scoreA: number;
    scoreB: number;
    diff: number;
    resultMsg: string;
    ludoTurns: BattleLudoTurn[];
  } | null>(null);
  const [uncalledMap, setUncalledMap] = useState<Record<string, string[]>>({});
  const [activeBossRound, setActiveBossRound] = useState<ActiveBossRound | null>(null);
  const [bossRoundResolving, setBossRoundResolving] = useState(false);
  const [bossRoundVisualResult, setBossRoundVisualResult] = useState<'success' | 'failure' | null>(null);
  const [bossDefeatedAnnouncement, setBossDefeatedAnnouncement] = useState<{
    boss: BossInstance;
    topContributors: BossContribution[];
  } | null>(null);

  return {
    showRandomModal, setShowRandomModal, randomStudent, setRandomStudent, randomMode,
    setRandomMode, battleStudentA, setBattleStudentA, battleStudentB, setBattleStudentB,
    battleScoreA, setBattleScoreA, battleScoreB, setBattleScoreB, battleResultSummary,
    setBattleResultSummary, uncalledMap, setUncalledMap, activeBossRound, setActiveBossRound,
    bossRoundResolving, setBossRoundResolving, bossRoundVisualResult, setBossRoundVisualResult,
    bossDefeatedAnnouncement, setBossDefeatedAnnouncement
  };
};
