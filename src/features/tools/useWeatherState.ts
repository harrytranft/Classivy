import React, { useState } from 'react';
import { TrainerLocation, TrainerWeather } from '../../domain/weather';

// State thời tiết của Trainer Plaza.
export const useWeatherState = () => {
  const [weatherLocationInput, setWeatherLocationInput] = useState(() => localStorage.getItem('trainer_weather_location_input') || 'Hanoi');
  const [trainerLocation, setTrainerLocation] = useState<TrainerLocation | null>(() => {
    const saved = localStorage.getItem('trainer_weather_location');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [trainerWeather, setTrainerWeather] = useState<TrainerWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  return {
    weatherLocationInput, setWeatherLocationInput, trainerLocation, setTrainerLocation,
    trainerWeather, setTrainerWeather, weatherLoading, setWeatherLoading, weatherError,
    setWeatherError
  };
};
