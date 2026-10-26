import React, { useEffect } from 'react';
import { AppScope } from '../../app/AppContext';

export const useWeatherEffects = (app: AppScope) => {
  const {
    fetchWeatherForLocation, refreshWeatherByAddress, trainerLocation, weatherLocationInput
  } = app;

  useEffect(() => {
    if (trainerLocation) {
      fetchWeatherForLocation(trainerLocation);
    } else if (weatherLocationInput.trim()) {
      refreshWeatherByAddress();
    }
  }, []);
};
