import { describe, expect, it } from 'vitest';
import { TrainerWeather, getWeatherLabel, getWeatherMood } from './weather';

const weather = (weatherCode: number, isDay = true): TrainerWeather => ({
  temperature: 30, weatherCode, isDay, updatedAt: 0, label: ''
});

describe('getWeatherMood', () => {
  it('is clear when there is no data and night when it is dark', () => {
    expect(getWeatherMood(null)).toBe('clear');
    expect(getWeatherMood(undefined)).toBe('clear');
    expect(getWeatherMood(weather(61, false))).toBe('night');
  });

  it('maps WMO codes to rain, snow, fog or sunny', () => {
    expect(getWeatherMood(weather(61))).toBe('rain');
    expect(getWeatherMood(weather(95))).toBe('rain');
    expect(getWeatherMood(weather(71))).toBe('snow');
    expect(getWeatherMood(weather(45))).toBe('fog');
    expect(getWeatherMood(weather(0))).toBe('sunny');
    expect(getWeatherMood(weather(3))).toBe('sunny');
  });
});

describe('getWeatherLabel', () => {
  it('returns a Vietnamese label for each code group', () => {
    expect(getWeatherLabel(80)).toBe('Đang mưa');
    expect(getWeatherLabel(96)).toBe('Có giông');
    expect(getWeatherLabel(86)).toBe('Có tuyết');
    expect(getWeatherLabel(48)).toBe('Có sương');
    expect(getWeatherLabel(1)).toBe('Trời quang');
    expect(getWeatherLabel(2)).toBe('Nhiều mây');
    expect(getWeatherLabel(999)).toBe('Thời tiết hiện tại');
  });
});
