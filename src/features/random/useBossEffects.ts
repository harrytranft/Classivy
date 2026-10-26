import React, { useEffect } from 'react';
import { createClassBossState } from '../../domain/bossSystem';
import { AppScope } from '../../app/AppContext';

export const useBossEffects = (app: AppScope) => {
  const {
    activeRandomClassName, bossEncounterFrequency, setBossStatesByClass
  } = app;

  useEffect(() => {
    if (!activeRandomClassName) return;
    setBossStatesByClass(prev => {
      if (prev[activeRandomClassName]) return prev;
      return {
        ...prev,
        [activeRandomClassName]: createClassBossState(activeRandomClassName, Date.now(), bossEncounterFrequency)
      };
    });
  }, [activeRandomClassName, bossEncounterFrequency]);
};
