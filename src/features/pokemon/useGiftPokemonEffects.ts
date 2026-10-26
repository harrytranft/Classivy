import React, { useEffect } from 'react';
import { AppScope } from '../../app/AppContext';

export const useGiftPokemonEffects = (app: AppScope) => {
  const {
    giftPokemonTimersRef
  } = app;

  useEffect(() => {
    return () => {
      giftPokemonTimersRef.current.forEach(timerId => window.clearTimeout(timerId));
    };
  }, []);
};
