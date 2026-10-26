import React, { useRef, useState } from 'react';
import { LuckyWheelResult } from '../../types/app';

// State Vòng quay may mắn.
export const useLuckyWheelState = () => {
  const [showLuckyWheelModal, setShowLuckyWheelModal] = useState(false);
  const [isLuckyWheelSpinning, setIsLuckyWheelSpinning] = useState(false);
  const [luckyWheelRotation, setLuckyWheelRotation] = useState(0);
  const [luckyWheelResult, setLuckyWheelResult] = useState<LuckyWheelResult | null>(null);
  const [luckyWheelPendingResult, setLuckyWheelPendingResult] = useState<LuckyWheelResult | null>(null);
  const [luckyWheelCandidateIds, setLuckyWheelCandidateIds] = useState<string[]>([]);
  const [luckyWheelMode, setLuckyWheelMode] = useState<'normal' | 'ludo-finish'>('normal');
  const luckyWheelRef = useRef<HTMLDivElement | null>(null);
  const luckyWheelSpinAudioRef = useRef<HTMLAudioElement | null>(null);
  const luckyWheelSpinSynthRef = useRef<{ context: AudioContext; intervalId: number } | null>(null);

  return {
    showLuckyWheelModal, setShowLuckyWheelModal, isLuckyWheelSpinning, setIsLuckyWheelSpinning,
    luckyWheelRotation, setLuckyWheelRotation, luckyWheelResult, setLuckyWheelResult,
    luckyWheelPendingResult, setLuckyWheelPendingResult, luckyWheelCandidateIds,
    setLuckyWheelCandidateIds, luckyWheelMode, setLuckyWheelMode, luckyWheelRef,
    luckyWheelSpinAudioRef, luckyWheelSpinSynthRef
  };
};
