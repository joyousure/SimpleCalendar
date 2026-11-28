export interface WeatherLocation {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  isCustom?: boolean;
}

export interface DayWeatherSummary {
  date: string; // YYYY-MM-DD
  weatherCode: number;
  weatherText: string;
  weatherIcon: string;
  maxTemp: number;
  minTemp: number;
  precipitationProbability: number;
  uvIndex?: number;
  sunrise?: string;
  sunset?: string;
  precipitationSum?: number;
  windSpeedMax?: number;
}

export interface HourlyWeather {
  time: string; // HH:mm
  isoTime?: string; // YYYY-MM-DDTHH:mm
  temp: number;
  feelsLike?: number;
  weatherCode: number;
  weatherIcon: string;
  precipitationProbability: number;
  precipitationMm?: number;
  humidity?: number;
  windSpeed?: number;
  uvIndex?: number;
  isDay?: boolean;
}

export interface DetailedWeatherData {
  location: WeatherLocation;
  timezone?: string;
  utcOffsetSeconds?: number;
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    visibility: number;
    uvIndex: number;
    weatherCode: number;
    weatherText: string;
    weatherIcon: string;
    sunrise: string;
    sunset: string;
    isDay?: boolean;
    dewPoint?: number;
    aqi?: number;
    pm25?: number;
    pm10?: number;
  };
  daily: DayWeatherSummary[];
  hourly: HourlyWeather[];
  updatedAt: number;
  fetchedAtUtc?: number;
  utcIso?: string;
}
