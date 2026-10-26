import { TrainerLocation, TrainerWeather, getWeatherLabel } from '../../domain/weather';
import { AppState } from '../../app/controller/appState';
import { AppActions } from '../../app/controller/appActions';

// Thời tiết thật cho Trainer Plaza (Open-Meteo).
export interface WeatherActions {
  fetchWeatherForLocation: (location: TrainerLocation) => Promise<void>;
  refreshWeatherByAddress: () => Promise<void>;
  refreshWeatherByBrowserLocation: () => void;
}

export const createWeatherActions = (appState: AppState, app: AppActions): WeatherActions => {
  const {
    setTrainerLocation, setTrainerWeather, setWeatherError, setWeatherLoading,
    setWeatherLocationInput, weatherLocationInput
  } = appState;

  const fetchWeatherForLocation = async (location: TrainerLocation) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code,is_day&timezone=auto`);
      if (!weatherResponse.ok) throw new Error('Không tải được dữ liệu thời tiết.');
      const weatherJson = await weatherResponse.json();
      const current = weatherJson.current;
      const weather: TrainerWeather = {
        temperature: Math.round(current?.temperature_2m ?? 0),
        weatherCode: Number(current?.weather_code ?? 0),
        isDay: Number(current?.is_day ?? 1) === 1,
        updatedAt: Date.now(),
        label: getWeatherLabel(Number(current?.weather_code ?? 0))
      };
      setTrainerWeather(weather);
      setTrainerLocation(location);
      localStorage.setItem('trainer_weather_location', JSON.stringify(location));
      localStorage.setItem('trainer_weather_location_input', location.label);
      setWeatherLocationInput(location.label);
    } catch (err: any) {
      setWeatherError(err?.message || 'Không tải được dữ liệu thời tiết.');
    } finally {
      setWeatherLoading(false);
    }
  };

  const refreshWeatherByAddress = async () => {
    const query = weatherLocationInput.trim();
    if (!query) {
      setWeatherError('Hãy nhập địa chỉ hoặc thành phố.');
      return;
    }
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=vi&format=json`);
      if (!geoResponse.ok) throw new Error('Không tìm thấy vị trí.');
      const geoJson = await geoResponse.json();
      const result = geoJson.results?.[0];
      if (!result) throw new Error('Không tìm thấy vị trí phù hợp.');
      await fetchWeatherForLocation({
        label: [result.name, result.admin1, result.country].filter(Boolean).join(', '),
        latitude: result.latitude,
        longitude: result.longitude
      });
    } catch (err: any) {
      setWeatherError(err?.message || 'Không tìm thấy vị trí phù hợp.');
      setWeatherLoading(false);
    }
  };

  const refreshWeatherByBrowserLocation = () => {
    if (!navigator.geolocation) {
      setWeatherError('Trình duyệt chưa hỗ trợ tự xác định vị trí.');
      return;
    }
    setWeatherLoading(true);
    setWeatherError(null);
    navigator.geolocation.getCurrentPosition(
      position => {
        fetchWeatherForLocation({
          label: 'Vị trí hiện tại',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => {
        setWeatherError('Không lấy được vị trí tự động. Bạn có thể nhập địa chỉ thủ công.');
        setWeatherLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  return {
    fetchWeatherForLocation, refreshWeatherByAddress, refreshWeatherByBrowserLocation
  };
};
