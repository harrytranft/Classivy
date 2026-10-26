export interface TrainerWeather {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  updatedAt: number;
  label: string;
}

export interface TrainerLocation {
  label: string;
  latitude: number;
  longitude: number;
}

export const getWeatherMood = (weather?: TrainerWeather | null) => {
  if (!weather) return 'clear';
  if (!weather.isDay) return 'night';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weather.weatherCode)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(weather.weatherCode)) return 'snow';
  if ([45, 48].includes(weather.weatherCode)) return 'fog';
  return 'sunny';
};

export const getWeatherLabel = (code: number) => {
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Đang mưa';
  if ([95, 96, 99].includes(code)) return 'Có giông';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Có tuyết';
  if ([45, 48].includes(code)) return 'Có sương';
  if ([0, 1].includes(code)) return 'Trời quang';
  if ([2, 3].includes(code)) return 'Nhiều mây';
  return 'Thời tiết hiện tại';
};
