import React, { useRef, useState } from 'react';
import { GiftPokemonResult } from '../../types/app';

// State Tặng Pokémon.
export const useGiftPokemonState = () => {
  const [giftStudentId, setGiftStudentId] = useState<string>('');
  const [giftPokemonResult, setGiftPokemonResult] = useState<GiftPokemonResult | null>(null);
  const [giftAnimationPhase, setGiftAnimationPhase] = useState<'select' | 'hatching' | 'revealed'>('select');
  const giftPokemonTimersRef = useRef<number[]>([]);

  return {
    giftStudentId, setGiftStudentId,
    giftPokemonResult, setGiftPokemonResult, giftAnimationPhase, setGiftAnimationPhase,
    giftPokemonTimersRef
  };
};
