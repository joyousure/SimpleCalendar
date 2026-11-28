import { WeatherLocation, DetailedWeatherData, DayWeatherSummary } from '../types/weather';
import { Language } from '../types/calendar';
import { normalizeSearchText, ALL_CORE_CITIES } from '../data/worldCities';
import { fetchWithTimeout } from './network';

export const DEFAULT_LOCATION: WeatherLocation = {
  name: '北京',
  country: '中国',
  admin1: '北京市',
  latitude: 39.9042,
  longitude: 116.4074,
};

export function getLocalizedDefaultLocation(lang: Language): WeatherLocation {
  switch (lang) {
    case 'zh-CN':
      return { name: '北京', country: '中国', admin1: '北京市', latitude: 39.9042, longitude: 116.4074, timezone: 'Asia/Shanghai' };
    case 'zh-TW':
      return { name: '台北', country: '台灣', admin1: '台北市', latitude: 25.033, longitude: 121.5654, timezone: 'Asia/Taipei' };
    case 'ja':
      return { name: '東京', country: '日本', admin1: '東京都', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' };
    case 'ko':
      return { name: '서울', country: '대한민국', admin1: '서울특별시', latitude: 37.5665, longitude: 126.978, timezone: 'Asia/Seoul' };
    case 'fr':
      return { name: 'Paris', country: 'France', admin1: 'Île-de-France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' };
    case 'fa':
      return { name: 'تهران', country: 'ایران', admin1: 'تهران', latitude: 35.6892, longitude: 51.389, timezone: 'Asia/Tehran' };
    case 'mn':
      return { name: 'Улаанбаатар', country: 'Монгол', admin1: 'Улаанбаатар', latitude: 47.8864, longitude: 106.9057, timezone: 'Asia/Ulaanbaatar' };
    case 'ru':
      return { name: 'Москва', country: 'Россия', admin1: 'Москва', latitude: 55.7558, longitude: 37.6173, timezone: 'Europe/Moscow' };
    case 'ug':
      return { name: 'ئۈرۈمچى', country: 'جۇڭگو', admin1: 'شىنجاڭ', latitude: 43.8256, longitude: 87.6168, timezone: 'Asia/Urumqi' };
    case 'en':
    default:
      return { name: 'New York', country: 'United States', admin1: 'New York', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' };
  }
}

export function getLocalizedCurrentLocationLabel(lang?: Language): string {
  switch (lang) {
    case 'zh-CN': return '当前位置';
    case 'zh-TW': return '目前位置';
    case 'ja': return '現在地';
    case 'ko': return '현재 위치';
    case 'fr': return 'Position actuelle';
    case 'fa': return 'موقعیت فعلی';
    case 'mn': return 'Одоогийн байршил';
    case 'ru': return 'Текущее место';
    case 'ug': return 'ھازىرقى ئورۇن';
    default: return 'Current Location';
  }
}

export const POPULAR_CITIES: WeatherLocation[] = [
  { name: '北京', country: '中国', admin1: '北京市', latitude: 39.9042, longitude: 116.4074 },
  { name: '贵阳', country: '中国', admin1: '贵州省', latitude: 26.58, longitude: 106.71 },
  { name: '上海', country: '中国', admin1: '上海市', latitude: 31.2304, longitude: 121.4737 },
  { name: '广州', country: '中国', admin1: '广东省', latitude: 23.1291, longitude: 113.2644 },
  { name: '深圳', country: '中国', admin1: '广东省', latitude: 22.5431, longitude: 114.0579 },
  { name: '香港', country: '港澳台地区', admin1: '香港特别行政区', latitude: 22.3193, longitude: 114.1694 },
  { name: '台北', country: '港澳台地区', admin1: '台湾省', latitude: 25.033, longitude: 121.5654 },
  { name: '纽约', country: '美国', admin1: 'New York', latitude: 40.7128, longitude: -74.006 },
  { name: '伦敦', country: '英国', admin1: 'Greater London', latitude: 51.5074, longitude: -0.1278 },
  { name: '巴黎', country: '法国', admin1: 'Île-de-France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { name: '东京', country: '日本', admin1: 'Tokyo', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { name: '洛杉矶', country: '美国', admin1: 'California', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
  { name: '首尔', country: '韩国', admin1: 'Seoul', latitude: 37.5665, longitude: 126.978, timezone: 'Asia/Seoul' },
];

const WEATHER_STORAGE_KEY = 'weather_data_cache_v2';
const WEATHER_HISTORY_STORAGE_KEY = 'weather_daily_history_v1';
const LOCATION_STORAGE_KEY = 'weather_saved_location_v2';

function getLocationBucketKey(location?: WeatherLocation | null): string {
  const lat = typeof location?.latitude === 'number' ? location.latitude : DEFAULT_LOCATION.latitude;
  const lng = typeof location?.longitude === 'number' ? location.longitude : DEFAULT_LOCATION.longitude;
  return `${lat.toFixed(1)}_${lng.toFixed(1)}`;
}

function getLocalTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function loadRecordedWeatherHistory(location?: WeatherLocation | null): Record<string, DayWeatherSummary> {
  try {
    const raw = localStorage.getItem(WEATHER_HISTORY_STORAGE_KEY);
    if (!raw) return {};
    const store = JSON.parse(raw) as Record<string, Record<string, DayWeatherSummary>>;
    const bucketKey = getLocationBucketKey(location);
    return store[bucketKey] || {};
  } catch {
    return {};
  }
}

function saveRecordedWeatherHistory(
  location: WeatherLocation,
  dailySummaries: DayWeatherSummary[],
  todayStr: string
): void {
  try {
    const raw = localStorage.getItem(WEATHER_HISTORY_STORAGE_KEY);
    const store: Record<string, Record<string, DayWeatherSummary>> = raw ? JSON.parse(raw) : {};
    const bucketKey = getLocationBucketKey(location);
    const existing = store[bucketKey] || {};
    dailySummaries.forEach((day) => {
      if (day.date <= todayStr) {
        existing[day.date] = day;
      }
    });
    // Retain up to 400 most recent recorded dates per location bucket
    const keys = Object.keys(existing).sort();
    if (keys.length > 400) {
      keys.slice(0, keys.length - 400).forEach((k) => {
        delete existing[k];
      });
    }
    store[bucketKey] = existing;
    localStorage.setItem(WEATHER_HISTORY_STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export function getSavedLocation(): WeatherLocation | null {
  const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSavedLocation(loc: WeatherLocation): void {
  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
}

async function detectIpLocationFallback(lang?: Language): Promise<WeatherLocation> {
  // 1. ipwho.is
  try {
    const res = await fetchWithTimeout('https://ipwho.is/', { cache: 'no-store' }, 5000);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const loc: WeatherLocation = {
          name: data.city || data.region || getLocalizedCurrentLocationLabel(lang),
          country: data.country || '',
          admin1: data.region || '',
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone?.id || undefined,
          isCustom: true,
        };
        saveSavedLocation(loc);
        return loc;
      }
    }
  } catch {}

  // 2. ipapi.co
  try {
    const res = await fetchWithTimeout('https://ipapi.co/json/', { cache: 'no-store' }, 5000);
    if (res.ok) {
      const data = await res.json();
      if (!data?.error && typeof data?.latitude === 'number' && typeof data?.longitude === 'number') {
        const loc: WeatherLocation = {
          name: data.city || data.region || getLocalizedCurrentLocationLabel(lang),
          country: data.country_name || data.country || '',
          admin1: data.region || '',
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone || undefined,
          isCustom: true,
        };
        saveSavedLocation(loc);
        return loc;
      }
    }
  } catch {}

  // 3. geojs.io
  try {
    const res = await fetchWithTimeout('https://get.geojs.io/v1/ip/geo.json', { cache: 'no-store' }, 5000);
    if (res.ok) {
      const data = await res.json();
      const lat = parseFloat(String(data?.latitude ?? ''));
      const lng = parseFloat(String(data?.longitude ?? ''));
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const loc: WeatherLocation = {
          name: data.city || data.region || getLocalizedCurrentLocationLabel(lang),
          country: data.country || '',
          admin1: data.region || '',
          latitude: lat,
          longitude: lng,
          timezone: data.timezone || undefined,
          isCustom: true,
        };
        saveSavedLocation(loc);
        return loc;
      }
    }
  } catch {}

  return getSavedLocation() || (lang ? getLocalizedDefaultLocation(lang) : DEFAULT_LOCATION);
}

export async function detectCurrentLocation(lang?: Language): Promise<WeatherLocation> {
  const geoLang = lang === 'zh-CN' || lang === 'zh-TW' ? 'zh' : (lang || 'en');
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let resolvedTz: string | undefined;
          let cityName = '';
          let countryName = '';
          let adminName = '';

          try {
            const [revRes, tzRes, bdcRes] = await Promise.allSettled([
              fetchWithTimeout(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lng}&count=1&language=${encodeURIComponent(geoLang)}`, {}, 5500),
              fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m&timezone=auto`, {}, 5500),
              fetchWithTimeout(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${encodeURIComponent(geoLang)}`, {}, 5500),
            ]);

            if (tzRes.status === 'fulfilled' && tzRes.value.ok) {
              const tzJson = await tzRes.value.json();
              if (tzJson?.timezone) {
                resolvedTz = tzJson.timezone;
              }
            }

            if (revRes.status === 'fulfilled' && revRes.value.ok) {
              const data = await revRes.value.json();
              const r = data?.results?.[0];
              if (r) {
                cityName = r.name || '';
                countryName = r.country || '';
                adminName = r.admin1 || '';
                resolvedTz = resolvedTz || r.timezone;
              }
            }

            if (!cityName && bdcRes.status === 'fulfilled' && bdcRes.value.ok) {
              const bdc = await bdcRes.value.json();
              cityName = bdc.city || bdc.locality || bdc.principalSubdivision || '';
              adminName = adminName || bdc.principalSubdivision || '';
              countryName = countryName || bdc.countryName || '';
            }
          } catch {
            // fallback gracefully with raw coordinates
          }

          const loc: WeatherLocation = {
            name: cityName || adminName || getLocalizedCurrentLocationLabel(lang),
            country: countryName,
            admin1: adminName,
            latitude: lat,
            longitude: lng,
            timezone: resolvedTz || Intl.DateTimeFormat().resolvedOptions().timeZone,
            isCustom: true,
          };
          saveSavedLocation(loc);
          resolve(loc);
        },
        async () => {
          const ipLoc = await detectIpLocationFallback(lang);
          resolve(ipLoc);
        },
        { timeout: 6000, enableHighAccuracy: true, maximumAge: 60000 }
      );
    } else {
      detectIpLocationFallback(lang).then(resolve);
    }
  });
}

export function getLocalizedWeatherText(code: number, lang: Language): string {
  type WeatherKey = 'clear' | 'partlyCloudy' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'showers' | 'storm';
  let key: WeatherKey = 'partlyCloudy';
  if (code === 0) key = 'clear';
  else if (code === 1 || code === 2) key = 'partlyCloudy';
  else if (code === 3) key = 'cloudy';
  else if (code >= 45 && code <= 48) key = 'fog';
  else if (code >= 51 && code <= 67) key = 'rain';
  else if (code >= 71 && code <= 77) key = 'snow';
  else if (code >= 80 && code <= 82) key = 'showers';
  else if (code >= 95 && code <= 99) key = 'storm';

  const dict: Record<Language, Record<WeatherKey, string>> = {
    'zh-CN': { clear: '晴朗', partlyCloudy: '多云', cloudy: '阴天', fog: '大雾', rain: '降雨', snow: '降雪', showers: '阵雨', storm: '雷暴' },
    'zh-TW': { clear: '晴朗', partlyCloudy: '多雲', cloudy: '陰天', fog: '大霧', rain: '降雨', snow: '降雪', showers: '陣雨', storm: '雷暴' },
    en: { clear: 'Clear', partlyCloudy: 'Partly Cloudy', cloudy: 'Overcast', fog: 'Foggy', rain: 'Rain', snow: 'Snow', showers: 'Showers', storm: 'Thunderstorm' },
    ja: { clear: '晴れ', partlyCloudy: 'くもり時々晴れ', cloudy: 'くもり', fog: '霧', rain: '雨', snow: '雪', showers: 'にわか雨', storm: '雷雨' },
    ko: { clear: '맑음', partlyCloudy: '구름 조금', cloudy: '흐림', fog: '안개', rain: '비', snow: '눈', showers: '소나기', storm: '뇌우' },
    fr: { clear: 'Ensoleillé', partlyCloudy: 'Éclaircies', cloudy: 'Couvert', fog: 'Brouillard', rain: 'Pluie', snow: 'Neige', showers: 'Averses', storm: 'Orage' },
    fa: { clear: 'صاف', partlyCloudy: 'نیمه‌ابری', cloudy: 'ابری', fog: 'مه‌آلود', rain: 'بارانی', snow: 'برفی', showers: 'رگبار', storm: 'طوفان رعدوبرق' },
    mn: { clear: 'Цэлмэг', partlyCloudy: 'Үүлшинэ', cloudy: 'Бүрхэг', fog: 'Манантай', rain: 'Бороотой', snow: 'Цастай', showers: 'Түр зуурын бороо', storm: 'Аянга цахилгаантай' },
    ru: { clear: 'Ясно', partlyCloudy: 'Переменная облачность', cloudy: 'Пасмурно', fog: 'Туман', rain: 'Дождь', snow: 'Снег', showers: 'Ливень', storm: 'Гроза' },
    ug: { clear: 'ئوچۇق', partlyCloudy: 'بۇلۇتلۇق', cloudy: 'تۇتۇق', fog: 'تۇمان', rain: 'يامغۇر', snow: 'قار', showers: 'ئۆتكۈنچى يامغۇر', storm: 'گۈلدۈرمامىلىق يامغۇر' },
  };
  return (dict[lang] || dict.en)[key];
}

export function mapWeatherCodeToInfo(code: number, lang: Language = 'zh-CN'): { text: string; icon: string } {
  const text = getLocalizedWeatherText(code, lang);
  if (code === 0) return { text, icon: 'sun' };
  if (code === 1 || code === 2) return { text, icon: 'cloud-sun' };
  if (code === 3) return { text, icon: 'cloud' };
  if (code >= 45 && code <= 48) return { text, icon: 'cloud-fog' };
  if (code >= 51 && code <= 67) return { text, icon: 'cloud-rain' };
  if (code >= 71 && code <= 77) return { text, icon: 'cloud-snow' };
  if (code >= 80 && code <= 82) return { text, icon: 'cloud-rain' };
  if (code >= 95 && code <= 99) return { text, icon: 'cloud-lightning' };
  return { text, icon: 'cloud-sun' };
}

export async function fetchWeatherData(
  location: WeatherLocation,
  _lang: Language,
  forceRefresh: boolean = false
): Promise<DetailedWeatherData | null> {
  try {
    const lat = location.latitude;
    const lng = location.longitude;
    const nowUtc = Date.now();
    const cb = forceRefresh ? `&_utc=${nowUtc}` : '';
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,apparent_temperature,weather_code,precipitation_probability,precipitation,relative_humidity_2m,wind_speed_10m,uv_index,visibility,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max&timezone=auto&past_days=31&forecast_days=16${cb}`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5,pm10&timezone=auto${cb}`;

    const fetchOpts: RequestInit = forceRefresh ? { cache: 'no-store' } : {};
    const [forecastRes, aqiRes] = await Promise.allSettled([
      fetchWithTimeout(forecastUrl, fetchOpts, 9000),
      fetchWithTimeout(aqiUrl, fetchOpts, 7000),
    ]);
    if (forecastRes.status !== 'fulfilled' || !forecastRes.value.ok) {
      throw new Error('Weather fetch failed');
    }
    const data = await forecastRes.value.json();

    let aqiVal: number | undefined;
    let pm25Val: number | undefined;
    let pm10Val: number | undefined;
    if (aqiRes.status === 'fulfilled' && aqiRes.value.ok) {
      try {
        const aqiJson = await aqiRes.value.json();
        if (typeof aqiJson?.current?.us_aqi === 'number') aqiVal = Math.round(aqiJson.current.us_aqi);
        if (typeof aqiJson?.current?.pm2_5 === 'number') pm25Val = Math.round(aqiJson.current.pm2_5 * 10) / 10;
        if (typeof aqiJson?.current?.pm10 === 'number') pm10Val = Math.round(aqiJson.current.pm10 * 10) / 10;
      } catch {}
    }

    const currentCode = data.current.weather_code || 0;
    const currentInfo = mapWeatherCodeToInfo(currentCode);
    const isDay = data.current?.is_day !== 0;

    const dailySummaries: DayWeatherSummary[] = [];
    if (data.daily && Array.isArray(data.daily.time)) {
      for (let i = 0; i < data.daily.time.length; i++) {
        const dCode = data.daily.weather_code[i] || 0;
        const dInfo = mapWeatherCodeToInfo(dCode);
        dailySummaries.push({
          date: data.daily.time[i],
          weatherCode: dCode,
          weatherText: dInfo.text,
          weatherIcon: dInfo.icon,
          maxTemp: Math.round(data.daily.temperature_2m_max[i]),
          minTemp: Math.round(data.daily.temperature_2m_min[i]),
          precipitationProbability: data.daily.precipitation_probability_max[i] || 0,
          uvIndex: data.daily.uv_index_max ? Math.round(data.daily.uv_index_max[i]) : undefined,
          sunrise: data.daily?.sunrise?.[i]?.split('T')[1]?.slice(0, 5),
          sunset: data.daily?.sunset?.[i]?.split('T')[1]?.slice(0, 5),
          precipitationSum:
            typeof data.daily?.precipitation_sum?.[i] === 'number'
              ? Math.round(data.daily.precipitation_sum[i] * 10) / 10
              : undefined,
          windSpeedMax:
            typeof data.daily?.wind_speed_10m_max?.[i] === 'number'
              ? Math.round(data.daily.wind_speed_10m_max[i])
              : undefined,
        });
      }
    }

    const currentIsoPrefix = typeof data.current?.time === 'string' ? data.current.time.slice(0, 13) : '';
    const hourlyTimes: string[] = Array.isArray(data.hourly?.time) ? data.hourly.time : [];
    let currentHourIdx = currentIsoPrefix
      ? hourlyTimes.findIndex((t) => t.startsWith(currentIsoPrefix))
      : -1;
    if (currentHourIdx < 0) currentHourIdx = 0;

    const hourlyForecast = [];
    const endHourIdx = Math.min(hourlyTimes.length, currentHourIdx + 24);
    for (let i = currentHourIdx; i < endHourIdx; i++) {
      const hCode = data.hourly?.weather_code?.[i] ?? currentCode;
      const hInfo = mapWeatherCodeToInfo(hCode);
      hourlyForecast.push({
        time: hourlyTimes[i]?.slice(11, 16) || '00:00',
        isoTime: hourlyTimes[i],
        temp: Math.round(data.hourly?.temperature_2m?.[i] ?? data.current.temperature_2m),
        feelsLike:
          typeof data.hourly?.apparent_temperature?.[i] === 'number'
            ? Math.round(data.hourly.apparent_temperature[i])
            : undefined,
        weatherCode: hCode,
        weatherIcon: hInfo.icon,
        precipitationProbability: Math.round(data.hourly?.precipitation_probability?.[i] ?? 0),
        precipitationMm:
          typeof data.hourly?.precipitation?.[i] === 'number'
            ? Math.round(data.hourly.precipitation[i] * 10) / 10
            : 0,
        humidity:
          typeof data.hourly?.relative_humidity_2m?.[i] === 'number'
            ? Math.round(data.hourly.relative_humidity_2m[i])
            : undefined,
        windSpeed:
          typeof data.hourly?.wind_speed_10m?.[i] === 'number'
            ? Math.round(data.hourly.wind_speed_10m[i])
            : undefined,
        uvIndex:
          typeof data.hourly?.uv_index?.[i] === 'number'
            ? Math.round(data.hourly.uv_index[i])
            : undefined,
        isDay: data.hourly?.is_day?.[i] !== 0,
      });
    }

    const now = new Date();
    const fallbackToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const locationTodayStr = typeof data.current?.time === 'string' ? data.current.time.slice(0, 10) : fallbackToday;
    const todayIdx = Math.max(
      0,
      dailySummaries.findIndex((d) => d.date === locationTodayStr)
    );

    const tempVal = Number(data.current.temperature_2m ?? 0);
    const humidityVal = Math.max(1, Number(data.current.relative_humidity_2m ?? 50));
    const alpha = (17.27 * tempVal) / (237.7 + tempVal) + Math.log(humidityVal / 100);
    const dewPoint = Math.round((237.7 * alpha) / (17.27 - alpha));
    const visMeters = data.hourly?.visibility?.[currentHourIdx] ?? 16000;
    const visibilityKm = Math.round((visMeters / 1000) * 10) / 10;

    const result: DetailedWeatherData = {
      location,
      timezone: data.timezone,
      utcOffsetSeconds: data.utc_offset_seconds,
      current: {
        temp: Math.round(tempVal),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: Math.round(humidityVal),
        windSpeed: Math.round(data.current.wind_speed_10m),
        windDirection: data.current.wind_direction_10m,
        pressure: Math.round(data.current.surface_pressure),
        visibility: visibilityKm,
        uvIndex: dailySummaries[todayIdx]?.uvIndex ?? hourlyForecast[0]?.uvIndex ?? 3,
        weatherCode: currentCode,
        weatherText: currentInfo.text,
        weatherIcon: currentInfo.icon,
        sunrise: data.daily?.sunrise?.[todayIdx]?.split('T')[1]?.slice(0, 5) || '06:00',
        sunset: data.daily?.sunset?.[todayIdx]?.split('T')[1]?.slice(0, 5) || '18:30',
        isDay,
        dewPoint,
        aqi: aqiVal,
        pm25: pm25Val,
        pm10: pm10Val,
      },
      daily: dailySummaries,
      hourly: hourlyForecast,
      updatedAt: nowUtc,
      fetchedAtUtc: nowUtc,
      utcIso: new Date(nowUtc).toISOString(),
    };

    localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(result));
    saveRecordedWeatherHistory(location, dailySummaries, locationTodayStr);
    window.dispatchEvent(new CustomEvent('weather-updated', { detail: result }));
    return result;
  } catch {
    const cached = localStorage.getItem(WEATHER_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return null;
  }
}

export function isWeatherUtcStale(
  data: DetailedWeatherData | null,
  maxAgeMs: number = 15 * 60 * 1000
): boolean {
  if (!data) return true;
  const ts = data.fetchedAtUtc ?? data.updatedAt;
  if (!ts || !Number.isFinite(ts)) return true;
  const nowUtc = Date.now();
  const cachedUtcDay = new Date(ts).toISOString().slice(0, 10);
  const currentUtcDay = new Date(nowUtc).toISOString().slice(0, 10);
  if (cachedUtcDay !== currentUtcDay) return true;
  return nowUtc - ts > maxAgeMs;
}

export function getCachedWeatherData(): DetailedWeatherData | null {
  const cached = localStorage.getItem(WEATHER_STORAGE_KEY);
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

/**
 * Returns weather ONLY if it falls within the synced Open-Meteo forecast horizon
 * (up to 16 days ahead) OR is a known recorded observation for today / past dates.
 * Returns null for unrecorded past dates and future dates outside the forecast window.
 */
export function getKnownDayWeather(
  dateStr: string,
  location?: WeatherLocation | null
): DayWeatherSummary | null {
  const cachedData = getCachedWeatherData();
  const activeLocation = location || cachedData?.location || getSavedLocation() || DEFAULT_LOCATION;
  const todayStr = getLocalTodayStr();

  const matchesCachedLocation =
    !cachedData?.location ||
    getLocationBucketKey(cachedData.location) === getLocationBucketKey(activeLocation);

  if (matchesCachedLocation && cachedData?.daily) {
    const exact = cachedData.daily.find((d) => d.date === dateStr);
    if (exact) {
      return exact;
    }
  }

  // Future dates strictly beyond the synced forecast period must not show guessed icons
  if (dateStr > todayStr) {
    return null;
  }

  // Past dates (or today if daily lacked an entry): check persisted recorded observations
  const history = loadRecordedWeatherHistory(activeLocation);
  return history[dateStr] || null;
}

export function getDayWeather(dateStr: string): DayWeatherSummary {
  const known = getKnownDayWeather(dateStr);
  if (known) return known;

  const cachedData = getCachedWeatherData();
  // Deterministic seasonal/baseline fallback solely for multi-day trend extrapolation
  const parts = dateStr.split('-').map(Number);
  const y = parts[0] || 2026;
  const m = parts[1] || 11;
  const d = parts[2] || 1;
  const hash = Math.abs((y * 372 + m * 31 + d * 17) % 100);
  const weatherCode = hash < 48 ? 0 : hash < 78 ? 2 : hash < 90 ? 3 : hash < 96 ? 61 : 1;
  const info = mapWeatherCodeToInfo(weatherCode);
  const baseTemp = cachedData?.current?.temp ?? (m >= 5 && m <= 9 ? 26 : m >= 11 || m <= 2 ? 9 : 18);
  const delta = (hash % 7) - 3;
  const maxTemp = Math.round(baseTemp + 4 + delta);
  const minTemp = Math.round(baseTemp - 5 + delta);

  return {
    date: dateStr,
    weatherCode,
    weatherText: info.text,
    weatherIcon: info.icon,
    maxTemp,
    minTemp,
    precipitationProbability: weatherCode >= 61 ? 65 : 15,
    uvIndex: weatherCode === 0 ? 5 : 2,
  };
}

export interface WeatherTrendAnalysis {
  direction: 'up' | 'down' | 'flat';
  horizonDays: number;
  text: string;
  deltaTemp: number;
  advisory: { label: string; isAlert: boolean } | null;
}

function addDaysToDateStr(dateStr: string, offset: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, (d || 1) + offset);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function analyzeFutureWeatherTrend(
  anchorDateStr: string,
  langOrIsChinese: Language | boolean
): WeatherTrendAnalysis {
  const lang: Language =
    typeof langOrIsChinese === 'boolean'
      ? langOrIsChinese
        ? 'zh-CN'
        : 'en'
      : langOrIsChinese;

  const cached = getCachedWeatherData();
  const daily = cached?.daily || [];
  const lookup = new Map<string, DayWeatherSummary>();
  daily.forEach((d) => lookup.set(d.date, d));

  // Build exact 8-day forward series: day 0 = anchorDate, days 1..7 = strictly future days
  const series: DayWeatherSummary[] = [];
  for (let i = 0; i <= 7; i++) {
    const dStr = addDaysToDateStr(anchorDateStr, i);
    series.push(lookup.get(dStr) || getDayWeather(dStr));
  }

  const composite = series.map((s) => s.maxTemp * 0.65 + s.minTemp * 0.35);
  const baseVal = composite[0];
  const baseMax = series[0].maxTemp;

  let upRun = 0;
  let downRun = 0;
  for (let i = 1; i <= 6; i++) {
    const step = composite[i] - composite[i - 1];
    if (step >= -0.35 && composite[i] > baseVal + 0.4) {
      upRun = i;
    } else {
      break;
    }
  }
  for (let i = 1; i <= 6; i++) {
    const step = composite[i] - composite[i - 1];
    if (step <= 0.35 && composite[i] < baseVal - 0.4) {
      downRun = i;
    } else {
      break;
    }
  }

  const calcRegression = (n: number) => {
    const pts = composite.slice(0, n + 1);
    const meanX = n / 2;
    const meanY = pts.reduce((a, b) => a + b, 0) / pts.length;
    let num = 0;
    let den = 0;
    pts.forEach((y, x) => {
      num += (x - meanX) * (y - meanY);
      den += (x - meanX) * (x - meanX);
    });
    const slope = den > 0 ? num / den : 0;
    const endDelta = pts[pts.length - 1] - pts[0];
    return { slope, endDelta };
  };

  const reg4 = calcRegression(4);
  const reg6 = calcRegression(6);

  const isFreezingDay = (d: DayWeatherSummary) =>
    (d.weatherCode >= 56 && d.weatherCode <= 57) ||
    (d.weatherCode >= 66 && d.weatherCode <= 67) ||
    (d.minTemp <= 0 && (d.weatherCode >= 51 || (d.precipitationProbability ?? 0) >= 50));
  const isSnowDay = (d: DayWeatherSummary) => (d.weatherCode >= 71 && d.weatherCode <= 77) || d.weatherCode === 85 || d.weatherCode === 86;
  const isStormDay = (d: DayWeatherSummary) => d.weatherCode >= 95;
  const isRainDay = (d: DayWeatherSummary) =>
    (d.weatherCode >= 51 && d.weatherCode <= 65) ||
    (d.weatherCode >= 80 && d.weatherCode <= 82) ||
    (d.precipitationProbability ?? 0) >= 60;
  const isFogDay = (d: DayWeatherSummary) => d.weatherCode >= 45 && d.weatherCode <= 48;

  const severeAtOrAfterDay = (minDay: number, maxDay: number) => {
    for (let i = minDay; i <= maxDay; i++) {
      const d = series[i];
      if (!d) continue;
      if (isStormDay(d)) return { day: i, kind: 'storm' as const };
      if (isFreezingDay(d)) return { day: i, kind: 'freezing' as const };
      if (isSnowDay(d)) return { day: i, kind: 'snow' as const };
      if (isRainDay(d)) return { day: i, kind: 'rain' as const };
      if (isFogDay(d)) return { day: i, kind: 'fog' as const };
    }
    return null;
  };

  const first3 = composite.slice(1, 4);
  const next4 = composite.slice(4, 8);
  const first3Peak = Math.max(...first3);
  const first3Trough = Math.min(...first3);
  const next4Peak = Math.max(...next4);
  const next4Trough = Math.min(...next4);
  const spread3 = Math.max(...composite.slice(0, 4)) - Math.min(...composite.slice(0, 4));
  const spread7 = Math.max(...composite) - Math.min(...composite);

  let firstTempShiftDay = -1;
  let firstTempShiftVal = 0;
  for (let i = 1; i <= 7; i++) {
    const diff = series[i].maxTemp - baseMax;
    if (Math.abs(diff) >= 3) {
      firstTempShiftDay = i;
      firstTempShiftVal = diff;
      break;
    }
  }

  const near3Weather = severeAtOrAfterDay(1, 3);
  const mid7Weather = severeAtOrAfterDay(4, 7);

  type SevereKind = 'storm' | 'freezing' | 'snow' | 'rain' | 'fog';
  type AdvisoryKey = 'storm' | 'freeze' | 'snow' | 'multiRain' | 'rain' | 'drop' | 'heat' | 'uv' | 'mild';

  const tKind = (kind: SevereKind): string => {
    const map: Record<Language, Record<SevereKind, string>> = {
      'zh-CN': { storm: '有雷暴过程', freezing: '有雨雪凝冻', snow: '将有降雪', rain: '将有降雨', fog: '多雾天气' },
      'zh-TW': { storm: '將有雷暴', freezing: '將有雨雪結冰', snow: '將有降雪', rain: '將有降雨', fog: '濃霧天氣' },
      en: { storm: 'Storms expected', freezing: 'Freezing precip', snow: 'Snow expected', rain: 'Rain expected', fog: 'Foggy conditions' },
      ja: { storm: '雷雨の見込み', freezing: '凍結・みぞれ注意', snow: '降雪の見込み', rain: '降雨の見込み', fog: '濃霧の見込み' },
      ko: { storm: '뇌우 예상', freezing: '결빙·진눈깨비', snow: '강설 예상', rain: '강우 예상', fog: '짙은 안개' },
      fr: { storm: 'Orages prévus', freezing: 'Pluie verglaçante', snow: 'Neige prévue', rain: 'Pluie prévue', fog: 'Brouillard' },
      fa: { storm: 'رعدوبرق پیش‌بینی می‌شود', freezing: 'یخبندان و بارش سرد', snow: 'بارش برف', rain: 'بارش باران', fog: 'هوای مه‌آلود' },
      mn: { storm: 'Аянга цахилгаантай', freezing: 'Хөлдүү хур тунадас', snow: 'Цас орно', rain: 'Бороо орно', fog: 'Манантай' },
      ru: { storm: 'Ожидаются грозы', freezing: 'Гололёд и осадки', snow: 'Ожидается снег', rain: 'Ожидается дождь', fog: 'Туманная погода' },
      ug: { storm: 'گۈلدۈرمامىلىق يامغۇر', freezing: 'مۇز تۇتۇش', snow: 'قار ياغىدۇ', rain: 'يامغۇر ياغىدۇ', fog: 'تۇمانلىق ھاۋارايى' },
    };
    return (map[lang] || map.en)[kind];
  };

  const fmtHorizonWeather = (days: number, kind: SevereKind): string => {
    const k = tKind(kind);
    switch (lang) {
      case 'zh-CN': return `预计未来${days}天${k}`;
      case 'zh-TW': return `預計未來 ${days} 天${k}`;
      case 'ja': return `今後${days}日間：${k}`;
      case 'ko': return `향후 ${days}일: ${k}`;
      case 'fr': return `${k} (${days} j)`;
      case 'fa': return `${k} در ${days} روز آینده`;
      case 'mn': return `Ирэх ${days} хоногт: ${k}`;
      case 'ru': return `${k} в ближ. ${days} дн.`;
      case 'ug': return `كەلگۈسى ${days} كۈندە ${k}`;
      default: return `${k} within ${days}d`;
    }
  };

  const fmtWarmCool = (days: number, mode: 'up' | 'down' | 'upTrend' | 'downTrend' | 'upGradual' | 'downGradual', delta?: number): string => {
    const dStr = typeof delta === 'number' && Math.abs(delta) >= 2 ? ` (${delta > 0 ? '+' : '-'}${Math.abs(delta)}°)` : '';
    switch (lang) {
      case 'zh-CN':
        if (mode === 'up' || mode === 'upTrend') return `预计未来${days}天气温上升${dStr}`;
        if (mode === 'down' || mode === 'downTrend') return `预计未来${days}天气温下降${dStr}`;
        return mode === 'upGradual' ? `预计未来${days}天逐步升温` : `预计未来${days}天逐步降温`;
      case 'zh-TW':
        if (mode === 'up' || mode === 'upTrend') return `預計未來 ${days} 天氣溫回升${dStr}`;
        if (mode === 'down' || mode === 'downTrend') return `預計未來 ${days} 天氣溫下降${dStr}`;
        return mode === 'upGradual' ? `預計未來 ${days} 天逐步升溫` : `預計未來 ${days} 天逐步降溫`;
      case 'ja':
        if (mode === 'up' || mode === 'upTrend') return `今後${days}日間は昇温傾向${dStr}`;
        if (mode === 'down' || mode === 'downTrend') return `今後${days}日間は気温低下${dStr}`;
        return mode === 'upGradual' ? `今後${days}日間は徐々に暖かく` : `今後${days}日間は徐々に涼しく`;
      case 'ko':
        if (mode === 'up' || mode === 'upTrend') return `향후 ${days}일 기온 상승${dStr}`;
        if (mode === 'down' || mode === 'downTrend') return `향후 ${days}일 기온 하강${dStr}`;
        return mode === 'upGradual' ? `향후 ${days}일 점진적 상승` : `향후 ${days}일 점진적 하강`;
      case 'fr':
        if (mode === 'up' || mode === 'upTrend') return `Hausse sur ${days} j${dStr}`;
        if (mode === 'down' || mode === 'downTrend') return `Baisse sur ${days} j${dStr}`;
        return mode === 'upGradual' ? `Réchauffement progressif (${days} j)` : `Refroidissement progressif (${days} j)`;
      case 'fa':
        if (mode === 'up' || mode === 'upTrend') return `افزایش دما در ${days} روز آینده${dStr}`;
        if (mode === 'down' || mode === 'downTrend') return `کاهش دما در ${days} روز آینده${dStr}`;
        return mode === 'upGradual' ? `گرمایش تدریجی (${days} روز)` : `سرمایش تدریجی (${days} روز)`;
      case 'mn':
        if (mode === 'up' || mode === 'upTrend') return `Ирэх ${days} хоногт дулаарна${dStr}`;
        if (mode === 'down' || mode === 'downTrend') return `Ирэх ${days} хоногт сэрүүснэ${dStr}`;
        return mode === 'upGradual' ? `Аажмаар дулаарна (${days} х)` : `Аажмаар сэрүүснэ (${days} х)`;
      case 'ru':
        if (mode === 'up' || mode === 'upTrend') return `Потепление за ${days} дн.${dStr}`;
        if (mode === 'down' || mode === 'downTrend') return `Похолодание за ${days} дн.${dStr}`;
        return mode === 'upGradual' ? `Постепенное потепление (${days} дн.)` : `Постепенное похолодание (${days} дн.)`;
      case 'ug':
        if (mode === 'up' || mode === 'upTrend') return `${days} كۈندە ئىللىيدۇ${dStr}`;
        if (mode === 'down' || mode === 'downTrend') return `${days} كۈندە سوۋۇيدۇ${dStr}`;
        return mode === 'upGradual' ? `تەدرىجىي ئىللىيدۇ (${days} كۈن)` : `تەدرىجىي سوۋۇيدۇ (${days} كۈن)`;
      default:
        if (mode === 'up' || mode === 'upTrend') return `Warming over ${days}d${dStr}`;
        if (mode === 'down' || mode === 'downTrend') return `Cooling over ${days}d${dStr}`;
        return mode === 'upGradual' ? `Gradual warming (${days}d)` : `Gradual cooling (${days}d)`;
    }
  };

  const fmtSummary = (kind: 'upThenDown' | 'downThenUp' | 'fluctuating' | 'mildSwing' | 'steady', days = 3): string => {
    const map: Record<Language, Record<'upThenDown' | 'downThenUp' | 'fluctuating' | 'mildSwing' | 'steady', string>> = {
      'zh-CN': { upThenDown: '预计未来7天气温先升后降', downThenUp: '预计未来7天气温先降后升', fluctuating: '预计未来7天气温波动较大', mildSwing: '预计未来4天气温略有波动', steady: `预计未来${days}天气温平稳` },
      'zh-TW': { upThenDown: '預計未來 7 天氣溫先升後降', downThenUp: '預計未來 7 天氣溫先降後升', fluctuating: '預計未來 7 天氣溫波動較大', mildSwing: '預計未來 4 天氣溫略有波動', steady: `預計未來 ${days} 天氣溫平穩` },
      en: { upThenDown: 'Warming then cooling (7d)', downThenUp: 'Cooling then warming (7d)', fluctuating: 'Fluctuating over next 7d', mildSwing: 'Mild swings next 4 days', steady: `Steady temps next ${days} days` },
      ja: { upThenDown: '7日間：上昇のち下降', downThenUp: '7日間：下降のち上昇', fluctuating: '7日間：気温変動大きめ', mildSwing: '4日間：緩やかな変動', steady: `今後${days}日間：気温安定` },
      ko: { upThenDown: '7일: 상승 후 하강', downThenUp: '7일: 하강 후 상승', fluctuating: '7일: 일교차·변동 큼', mildSwing: '4일: 소폭 변동', steady: `향후 ${days}일: 기온 안정` },
      fr: { upThenDown: 'Hausse puis baisse (7 j)', downThenUp: 'Baisse puis hausse (7 j)', fluctuating: 'Températures variables (7 j)', mildSwing: 'Légères variations (4 j)', steady: `Températures stables (${days} j)` },
      fa: { upThenDown: 'افزایش سپس کاهش (۷ روز)', downThenUp: 'کاهش سپس افزایش (۷ روز)', fluctuating: 'نوسان دمایی در ۷ روز آینده', mildSwing: 'نوسان ملایم در ۴ روز', steady: `دمای پایدار در ${days} روز آینده` },
      mn: { upThenDown: 'Дулаарсны дараа сэрүүснэ (7 х)', downThenUp: 'Сэрүүсний дараа дулаарна (7 х)', fluctuating: 'Температур хэлбэлзэнэ (7 х)', mildSwing: 'Бага зэрэг хэлбэлзэнэ (4 х)', steady: `Ирэх ${days} хоногт тогтвортой` },
      ru: { upThenDown: 'Потепление затем спад (7 дн.)', downThenUp: 'Спад затем потепление (7 дн.)', fluctuating: 'Перепады температуры (7 дн.)', mildSwing: 'Небольшие колебания (4 дн.)', steady: `Стабильная погода (${days} дн.)` },
      ug: { upThenDown: 'ئاۋۋال ئۆرلەپ كېيىن تۆۋەنلەيدۇ (7 كۈن)', downThenUp: 'ئاۋۋال چۈشۈپ كېيىن ئۆرلەيدۇ (7 كۈن)', fluctuating: 'تېمپېراتۇرا داۋالغۇيدۇ (7 كۈن)', mildSwing: 'ئازراق داۋالغۇش (4 كۈن)', steady: `كەلگۈسى ${days} كۈندە مۇقىم` },
    };
    return (map[lang] || map.en)[kind];
  };

  const tAdvisory = (key: AdvisoryKey): string => {
    const map: Record<Language, Record<AdvisoryKey, string>> = {
      'zh-CN': { storm: '雷暴提醒', freeze: '凝冻提醒', snow: '降雪提醒', multiRain: '连续阴雨', rain: '降雨提醒', drop: '大幅降温', heat: '高温提醒', uv: '强紫外线', mild: '天气舒适' },
      'zh-TW': { storm: '雷暴提醒', freeze: '結冰提醒', snow: '降雪提醒', multiRain: '連續陰雨', rain: '降雨提醒', drop: '大幅降溫', heat: '高溫提醒', uv: '強紫外線', mild: '天氣舒適' },
      en: { storm: 'Storm Alert', freeze: 'Freeze Alert', snow: 'Snow Alert', multiRain: 'Multi-day Rain', rain: 'Rain Alert', drop: 'Sharp Drop', heat: 'Heat Alert', uv: 'High UV', mild: 'Mild Weather' },
      ja: { storm: '雷雨注意', freeze: '凍結注意', snow: '降雪注意', multiRain: '長雨注意', rain: '降雨注意', drop: '急激な冷え込み', heat: '猛暑注意', uv: '紫外線強', mild: '快適' },
      ko: { storm: '뇌우 주의', freeze: '결빙 주의', snow: '강설 주의', multiRain: '연속 비', rain: '강우 알림', drop: '기온 급강하', heat: '폭염 주의', uv: '자외선 높음', mild: '쾌적함' },
      fr: { storm: 'Alerte orage', freeze: 'Alerte gel', snow: 'Alerte neige', multiRain: 'Pluies continues', rain: 'Pluie prévue', drop: 'Chute thermique', heat: 'Forte chaleur', uv: 'UV élevé', mild: 'Temps doux' },
      fa: { storm: 'هشدار طوفان', freeze: 'هشدار یخبندان', snow: 'هشدار برف', multiRain: 'بارش پیوسته', rain: 'هشدار باران', drop: 'افت شدید دما', heat: 'هشدار گرما', uv: 'فرابنفش بالا', mild: 'هوای مطبوع' },
      mn: { storm: 'Аянга анхаар', freeze: 'Халтиргаа анхаар', snow: 'Цас анхаар', multiRain: 'Үргэлжилсэн бороо', rain: 'Бороо анхаар', drop: 'Огцом хүйтэрнэ', heat: 'Халуун анхаар', uv: 'Хэт ягаан туяа', mild: 'Тогтуун дулаан' },
      ru: { storm: 'Гроза', freeze: 'Гололёд', snow: 'Снегопад', multiRain: 'Затяжной дождь', rain: 'Дождь', drop: 'Резкий холод', heat: 'Жара', uv: 'Высокий УФ', mild: 'Комфортно' },
      ug: { storm: 'گۈلدۈرماما', freeze: 'مۇز تۇتۇش', snow: 'قار ياغىدۇ', multiRain: 'ئۇدا يامغۇر', rain: 'يامغۇر', drop: 'تۇيۇقسىز سوۋۇش', heat: 'يۇقىرى تېمپېراتۇرا', uv: 'كۈچلۈك ئۇلترا بىنەپشە', mild: 'قۇلايلىق ھاۋا' },
    };
    return (map[lang] || map.en)[key];
  };

  let direction: 'up' | 'down' | 'flat' = 'flat';
  let horizonDays = 3;
  let deltaTemp = Math.round(series[3].maxTemp - baseMax);
  let text = fmtSummary('steady', 3);

  if (near3Weather && !mid7Weather) {
    horizonDays = 3;
    deltaTemp = Math.round(series[near3Weather.day].maxTemp - baseMax);
    direction = deltaTemp >= 2 ? 'up' : deltaTemp <= -2 ? 'down' : 'flat';
    text = fmtHorizonWeather(3, near3Weather.kind);
  } else if (upRun >= 2 && upRun <= 3 && composite[upRun] - baseVal >= 2.0 && spread7 - spread3 < 2.5) {
    horizonDays = 3;
    deltaTemp = Math.round(series[3].maxTemp - baseMax);
    direction = 'up';
    text = fmtWarmCool(3, 'up', deltaTemp);
  } else if (downRun >= 2 && downRun <= 3 && baseVal - composite[downRun] >= 2.0 && spread7 - spread3 < 2.5) {
    horizonDays = 3;
    deltaTemp = Math.round(series[3].maxTemp - baseMax);
    direction = 'down';
    text = fmtWarmCool(3, 'down', deltaTemp);
  } else if (firstTempShiftDay > 0 && firstTempShiftDay <= 3 && !mid7Weather && spread7 - spread3 < 3.0) {
    horizonDays = 3;
    deltaTemp = Math.round(firstTempShiftVal);
    direction = deltaTemp > 0 ? 'up' : 'down';
    text = fmtWarmCool(3, deltaTemp > 0 ? 'up' : 'down', deltaTemp);
  } else if (mid7Weather) {
    horizonDays = Math.min(7, Math.max(4, mid7Weather.day <= 4 ? 4 : 7));
    if (mid7Weather.day >= 5) horizonDays = 7;
    deltaTemp = Math.round(series[horizonDays].maxTemp - baseMax);
    direction = deltaTemp >= 2 ? 'up' : deltaTemp <= -2 ? 'down' : 'flat';
    text = fmtHorizonWeather(horizonDays, mid7Weather.kind);
  } else if (first3Peak - baseVal >= 2.5 && first3Peak - next4Trough >= 3.0) {
    direction = 'down';
    horizonDays = 7;
    deltaTemp = Math.round(next4Trough - first3Peak);
    text = fmtSummary('upThenDown', 7);
  } else if (baseVal - first3Trough >= 2.5 && next4Peak - first3Trough >= 3.0) {
    direction = 'up';
    horizonDays = 7;
    deltaTemp = Math.round(next4Peak - first3Trough);
    text = fmtSummary('downThenUp', 7);
  } else if (upRun >= 4 && composite[upRun] - baseVal >= 2.0) {
    horizonDays = Math.min(7, upRun >= 5 ? 7 : upRun);
    deltaTemp = Math.round(series[horizonDays].maxTemp - baseMax);
    direction = 'up';
    text = fmtWarmCool(horizonDays, 'upTrend', deltaTemp);
  } else if (downRun >= 4 && baseVal - composite[downRun] >= 2.0) {
    horizonDays = Math.min(7, downRun >= 5 ? 7 : downRun);
    deltaTemp = Math.round(series[horizonDays].maxTemp - baseMax);
    direction = 'down';
    text = fmtWarmCool(horizonDays, 'downTrend', deltaTemp);
  } else if (reg6.slope >= 0.35 && reg6.endDelta >= 2.0) {
    direction = 'up';
    horizonDays = 7;
    deltaTemp = Math.round(series[7].maxTemp - baseMax);
    text = fmtWarmCool(7, 'upGradual');
  } else if (reg6.slope <= -0.35 && reg6.endDelta <= -2.0) {
    direction = 'down';
    horizonDays = 7;
    deltaTemp = Math.round(series[7].maxTemp - baseMax);
    text = fmtWarmCool(7, 'downGradual');
  } else if (reg4.slope >= 0.45 && reg4.endDelta >= 1.8) {
    direction = 'up';
    horizonDays = 4;
    deltaTemp = Math.round(series[4].maxTemp - baseMax);
    text = fmtWarmCool(4, 'up', deltaTemp);
  } else if (reg4.slope <= -0.45 && reg4.endDelta <= -1.8) {
    direction = 'down';
    horizonDays = 4;
    deltaTemp = Math.round(series[4].maxTemp - baseMax);
    text = fmtWarmCool(4, 'down', deltaTemp);
  } else if (spread7 >= 4.5) {
    horizonDays = 7;
    direction = series[7].maxTemp - baseMax >= 2 ? 'up' : series[7].maxTemp - baseMax <= -2 ? 'down' : 'flat';
    deltaTemp = Math.round(series[7].maxTemp - baseMax);
    text = fmtSummary('fluctuating', 7);
  } else {
    const spread4 = Math.max(...composite.slice(1, 5)) - Math.min(...composite.slice(1, 5));
    horizonDays = spread3 < 2.2 ? 3 : 4;
    direction = 'flat';
    text = spread4 >= 3.8 ? fmtSummary('mildSwing', 4) : fmtSummary('steady', horizonDays);
  }

  const next3Days = series.slice(1, 4);
  const next7Days = series.slice(1, 8);
  const tomorrow = series[1];
  const minNext3 = Math.min(...next3Days.map((d) => d.maxTemp));
  const maxNext3Drop = baseMax - minNext3;
  const rainyDays = next3Days.filter(
    (d) => d.weatherCode >= 51 || (d.precipitationProbability ?? 0) >= 60
  );

  let advisory: { label: string; isAlert: boolean } | null = null;
  if (next7Days.some((d) => isStormDay(d))) {
    advisory = { label: tAdvisory('storm'), isAlert: true };
  } else if (next7Days.some((d) => isFreezingDay(d))) {
    advisory = { label: tAdvisory('freeze'), isAlert: true };
  } else if (next7Days.some((d) => isSnowDay(d))) {
    advisory = { label: tAdvisory('snow'), isAlert: true };
  } else if (rainyDays.length >= 2) {
    advisory = { label: tAdvisory('multiRain'), isAlert: true };
  } else if (tomorrow.weatherCode >= 51 || (tomorrow.precipitationProbability ?? 0) >= 60) {
    advisory = { label: tAdvisory('rain'), isAlert: true };
  } else if (maxNext3Drop >= 6) {
    advisory = { label: tAdvisory('drop'), isAlert: true };
  } else if (next3Days.some((d) => d.maxTemp >= 35)) {
    advisory = { label: tAdvisory('heat'), isAlert: true };
  } else if ((tomorrow.uvIndex ?? 0) >= 7) {
    advisory = { label: tAdvisory('uv'), isAlert: false };
  } else {
    advisory = { label: tAdvisory('mild'), isAlert: false };
  }

  return {
    direction,
    horizonDays,
    text,
    deltaTemp,
    advisory,
  };
}

export async function searchCities(query: string, language?: Language): Promise<WeatherLocation[]> {
  if (!query.trim()) return POPULAR_CITIES.slice(0, 10);
  const qNorm = normalizeSearchText(query);
  const qCompact = qNorm.replace(/[\s,.-]+/g, '');

  const localMatches = POPULAR_CITIES.filter((c) => {
    const fields = [c.name, c.country, c.admin1 || '', c.timezone || ''];
    if (fields.some((f) => normalizeSearchText(f).includes(qNorm))) return true;
    const matchedCore = ALL_CORE_CITIES.find(
      (core) =>
        normalizeSearchText(core.shortNameZh) === normalizeSearchText(c.name) ||
        (Math.abs(core.lat - c.latitude) < 0.6 && Math.abs(core.lng - c.longitude) < 0.6)
    );
    if (!matchedCore) return false;
    const coreFields = [
      matchedCore.nameZh,
      matchedCore.nameTw || '',
      matchedCore.nameEn,
      matchedCore.shortNameEn,
      matchedCore.countryEn,
      ...(matchedCore.aliases || []),
    ];
    return coreFields.some((f) => {
      const nf = normalizeSearchText(f);
      return nf.includes(qNorm) || (qCompact.length >= 2 && nf.replace(/[\s,.-]+/g, '').includes(qCompact));
    });
  });

  // Also check expanded worldCities offline database for fast local hits
  const coreExtras: WeatherLocation[] = ALL_CORE_CITIES.filter((core) => {
    const coreFields = [
      core.nameZh,
      core.nameTw || '',
      core.nameEn,
      core.shortNameZh,
      core.shortNameTw || '',
      core.shortNameEn,
      core.countryZh,
      core.countryEn,
      ...(core.aliases || []),
    ];
    return coreFields.some((f) => {
      const nf = normalizeSearchText(f);
      return nf.includes(qNorm) || (qCompact.length >= 2 && nf.replace(/[\s,.-]+/g, '').includes(qCompact));
    });
  }).map((core) => ({
    name:
      language === 'zh-TW'
        ? core.shortNameTw || core.shortNameZh
        : language === 'zh-CN'
        ? core.shortNameZh
        : core.shortNameEn,
    country:
      language === 'zh-TW'
        ? core.countryTw || core.countryZh
        : language === 'zh-CN'
        ? core.countryZh
        : core.countryEn,
    admin1: '',
    latitude: core.lat,
    longitude: core.lng,
    timezone: core.timeZone,
    isCustom: true,
  }));

  const dedupe = (list: WeatherLocation[]) => {
    const out: WeatherLocation[] = [];
    for (const item of list) {
      const dup = out.some(
        (existing) =>
          (Math.abs(existing.latitude - item.latitude) < 0.25 &&
            Math.abs(existing.longitude - item.longitude) < 0.25) ||
          (normalizeSearchText(existing.name) === normalizeSearchText(item.name) &&
            normalizeSearchText(existing.country) === normalizeSearchText(item.country))
      );
      if (!dup) out.push(item);
    }
    return out;
  };

  const mergedLocal = dedupe([...localMatches, ...coreExtras]);

  try {
    const apiLang =
      language === 'zh-CN' || language === 'zh-TW'
        ? 'zh'
        : language && ['en', 'ja', 'ko', 'fr', 'ru'].includes(language)
        ? language
        : 'en';
    const res = await fetchWithTimeout(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=${apiLang}`,
      {},
      5500
    );
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.results)) {
        interface OpenMeteoGeoResult {
          name: string;
          country?: string;
          admin1?: string;
          latitude: number;
          longitude: number;
          timezone?: string;
        }
        const netMatches: WeatherLocation[] = (data.results as OpenMeteoGeoResult[]).map((r) => ({
          name: r.name,
          country: r.country || '',
          admin1: r.admin1 || '',
          latitude: r.latitude,
          longitude: r.longitude,
          timezone: r.timezone || undefined,
          isCustom: true,
        }));
        return dedupe([...mergedLocal, ...netMatches]).slice(0, 10);
      }
    }
  } catch {}

  return mergedLocal.slice(0, 10);
}

export function getWeatherBackgroundClasses(
  code: number,
  isDay = true,
  isAppDark = false
): {
  bgGradient: string;
  cardBg: string;
} {
  if (!isDay || isAppDark) {
    if (code >= 95) {
      return {
        bgGradient: 'from-[#100D1E] via-[#1B1636] to-[#0A0D18]',
        cardBg: 'bg-neutral-950/45 border-white/12',
      };
    }
    if (code >= 51 && code <= 82) {
      return {
        bgGradient: 'from-[#0E1829] via-[#162742] to-[#0B111E]',
        cardBg: 'bg-neutral-950/45 border-white/12',
      };
    }
    if (code === 3 || (code >= 45 && code <= 48)) {
      return {
        bgGradient: 'from-[#18202C] via-[#232F3F] to-[#11161F]',
        cardBg: 'bg-neutral-950/45 border-white/12',
      };
    }
    return {
      bgGradient: isDay && isAppDark
        ? 'from-[#102547] via-[#183868] to-[#0B162C]'
        : 'from-[#0D172B] via-[#17284B] to-[#0E1422]',
      cardBg: 'bg-neutral-950/45 border-white/12',
    };
  }
  if (code === 0) {
    return {
      bgGradient: 'from-[#2F75D6] via-[#418AE8] to-[#245EB3]',
      cardBg: 'bg-white/16 border-white/24',
    };
  }
  if (code === 1 || code === 2) {
    return {
      bgGradient: 'from-[#356FB8] via-[#4C84C9] to-[#2B538C]',
      cardBg: 'bg-white/16 border-white/24',
    };
  }
  if (code === 3 || (code >= 45 && code <= 48)) {
    return {
      bgGradient: 'from-[#4B5D73] via-[#5A6E85] to-[#3B4B5E]',
      cardBg: 'bg-white/15 border-white/22',
    };
  }
  if (code >= 71 && code <= 77) {
    return {
      bgGradient: 'from-[#4F6E8E] via-[#6689AB] to-[#3C5570]',
      cardBg: 'bg-white/16 border-white/24',
    };
  }
  if (code >= 95) {
    return {
      bgGradient: 'from-[#282B4A] via-[#3B3966] to-[#1F243D]',
      cardBg: 'bg-white/12 border-white/20',
    };
  }
  if (code >= 51 && code <= 82) {
    return {
      bgGradient: 'from-[#2C476B] via-[#3A5A85] to-[#233854]',
      cardBg: 'bg-white/14 border-white/22',
    };
  }
  return {
    bgGradient: 'from-[#356FB8] via-[#4C84C9] to-[#2B538C]',
    cardBg: 'bg-white/16 border-white/24',
  };
}
