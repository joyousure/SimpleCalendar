import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AppSettings } from '../types/calendar';
import { getTranslation, getExtraLabels, getLocaleCode, isChineseLocale, isRtlLanguage } from '../utils/i18n';
import {
  CityTimeInfo,
  ALL_CORE_CITIES,
  countryCodeToFlag,
  matchWorldCity,
} from '../data/worldCities';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';
import { fetchWithTimeout } from '../utils/network';
import { getSavedLocation } from '../utils/weatherService';
import { WeatherLocation } from '../types/weather';
import { useSearchHistory } from '../utils/searchHistory';
import { SearchHistoryBar } from './SearchHistoryBar';

export type { CityTimeInfo };
export { ALL_CORE_CITIES };
import {
  Search,
  RefreshCw,
  MapPin,
  X,
} from 'lucide-react';

interface WorldClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  initialCity?: string;
}

const getCityName = (c: CityTimeInfo, lang: AppSettings['language']): string => {
  if (lang === 'zh-TW') return c.nameTw || c.nameZh;
  if (lang === 'zh-CN') return c.nameZh;
  return c.nameEn || c.nameZh;
};

const getCityShortName = (c: CityTimeInfo, lang: AppSettings['language']): string => {
  if (lang === 'zh-TW') return c.shortNameTw || c.shortNameZh || c.nameTw || c.nameZh;
  if (lang === 'zh-CN') return c.shortNameZh || c.nameZh;
  return c.shortNameEn || c.nameEn || c.shortNameZh;
};

const getCityCountry = (c: CityTimeInfo, lang: AppSettings['language']): string => {
  if (lang === 'zh-TW') return c.countryTw || c.countryZh;
  if (lang === 'zh-CN') return c.countryZh;
  return c.countryEn || c.countryZh;
};

const getLiveUtcOffsetHours = (tz: string, date: Date, fallbackOffset = 0): number => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(date);
    const tzName = parts.find((p) => p.type === 'timeZoneName')?.value || '';
    if (tzName === 'GMT' || tzName === 'UTC') return 0;
    const match = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return fallbackOffset;
    const sign = match[1] === '-' ? -1 : 1;
    const hrs = parseInt(match[2], 10);
    const mins = match[3] ? parseInt(match[3], 10) : 0;
    return Number((sign * (hrs + mins / 60)).toFixed(2));
  } catch {
    return fallbackOffset;
  }
};

const formatUtcLabel = (offset: number): string => {
  const sign = offset >= 0 ? '+' : '';
  return `UTC${sign}${Number.isInteger(offset) ? offset : offset.toFixed(1)}`;
};

export const WorldClockModal: React.FC<WorldClockModalProps> = ({
  isOpen,
  onClose,
  settings,
  initialCity,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);
  const localeCode = getLocaleCode(settings.language);
  const isZh = isChineseLocale(settings.language);
  const isRtl = isRtlLanguage(settings.language);

  const clockOffsetRef = useRef<number>(0);
  const userSelectedManualCityRef = useRef<boolean>(false);
  const [now, setNow] = useState<Date>(() => new Date());

  const weatherLocToCityInfo = useCallback((loc: WeatherLocation): CityTimeInfo => {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
    const tz = loc.timezone || localTz;
    const matched = ALL_CORE_CITIES.find((c) => c.timeZone === tz && matchWorldCity(c, loc.name));
    const displayName = [loc.admin1 && loc.admin1 !== loc.name ? loc.admin1 : '', loc.name]
      .filter(Boolean)
      .join(' ') || loc.name;
    return {
      id: matched?.id || 'device-live',
      flag: matched?.flag || '📍',
      nameZh: displayName || ui.currentLocationDefault,
      nameTw: displayName || ui.currentLocationDefault,
      nameEn: loc.name || displayName || ui.currentLocationDefault,
      shortNameZh: loc.name || ui.currentLocationDefault,
      shortNameTw: loc.name || ui.currentLocationDefault,
      shortNameEn: loc.name || ui.currentLocationDefault,
      countryZh: loc.country || '',
      countryEn: loc.country || '',
      timeZone: tz,
      utcOffset: getLiveUtcOffsetHours(tz, new Date(), -new Date().getTimezoneOffset() / 60),
      lat: typeof loc.latitude === 'number' ? loc.latitude : 39.9,
      lng: typeof loc.longitude === 'number' ? loc.longitude : 116.4,
      isPopular: true,
    };
  }, [ui.currentLocationDefault]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date(Date.now() + clockOffsetRef.current));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [deviceLocationCity, setDeviceLocationCity] = useState<CityTimeInfo>(() => {
    const weatherSaved = getSavedLocation();
    if (weatherSaved?.name) {
      const tz = weatherSaved.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
      return {
        id: 'device-live',
        flag: '📍',
        nameZh: weatherSaved.name,
        nameTw: weatherSaved.name,
        nameEn: weatherSaved.name,
        shortNameZh: weatherSaved.name,
        shortNameTw: weatherSaved.name,
        shortNameEn: weatherSaved.name,
        countryZh: weatherSaved.country || '',
        countryEn: weatherSaved.country || '',
        timeZone: tz,
        utcOffset: getLiveUtcOffsetHours(tz, new Date(), -new Date().getTimezoneOffset() / 60),
        lat: weatherSaved.latitude,
        lng: weatherSaved.longitude,
        isPopular: true,
      };
    }
    try {
      const saved = localStorage.getItem('user_device_detected_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.timeZone) return parsed;
      }
    } catch {}
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
    const offsetHours = -new Date().getTimezoneOffset() / 60;
    return {
      id: 'device-local',
      flag: '📍',
      nameZh: ui.currentLocationDefault,
      nameEn: ui.currentLocationDefault,
      shortNameZh: ui.currentLocationDefault,
      shortNameEn: ui.currentLocationDefault,
      countryZh: '',
      countryEn: '',
      timeZone: localTz,
      utcOffset: offsetHours,
      lat: 39.9,
      lng: 116.4,
      isPopular: true,
    };
  });

  const [selectedCity, setSelectedCity] = useState<CityTimeInfo>(deviceLocationCity);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSyncingTime, setIsSyncingTime] = useState(false);
  const [isHandshaking, setIsHandshaking] = useState(false);
  const handshakeTimerRef = useRef<number | null>(null);
  const [syncPrecisionSec, setSyncPrecisionSec] = useState<number>(() => {
    const driftMs = Math.abs(Date.now() - (performance.timeOrigin + performance.now()));
    return Math.min(0.499, Math.max(0.008, (driftMs + 12) / 1000));
  });
  const [randomCoreCities, setRandomCoreCities] = useState<CityTimeInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const worldClockSearchHistory = useSearchHistory('world_clock');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [remoteSearchCities, setRemoteSearchCities] = useState<CityTimeInfo[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDeviceLocationCity((prev) => {
      if (prev.id !== 'device-local') return prev;
      const updated = {
        ...prev,
        nameZh: ui.currentLocationDefault,
        nameEn: ui.currentLocationDefault,
        shortNameZh: ui.currentLocationDefault,
        shortNameEn: ui.currentLocationDefault,
      };
      setSelectedCity((sel) => (sel.id === 'device-local' ? updated : sel));
      return updated;
    });
  }, [ui.currentLocationDefault]);

  useEffect(() => {
    if (!showSearchDropdown) return;
    const handleOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showSearchDropdown]);

  useEffect(() => {
    return () => {
      if (handshakeTimerRef.current) {
        window.clearTimeout(handshakeTimerRef.current);
      }
    };
  }, []);

  const calibrateLocalTimeSync = useCallback(async () => {
    setIsSyncingTime(true);
    setIsHandshaking(true);
    if (handshakeTimerRef.current) {
      window.clearTimeout(handshakeTimerRef.current);
    }
    const startWall = performance.now();
    const t0 = performance.now();
    let calibrated = false;
    try {
      // 1. Prefer live online UTC reference when online (essential for local APK WebView where HEAD / reflects device clock)
      if (!settings.offlineMode) {
        try {
          const apiT0 = performance.now();
          const timeRes = await fetchWithTimeout('https://timeapi.io/api/Time/current/zone?timeZone=UTC', { cache: 'no-store' }, 3800);
          if (timeRes.ok) {
            const payload = await timeRes.json();
            const rttMs = Math.max(2, performance.now() - apiT0);
            const rawDt = typeof payload?.dateTime === 'string' ? payload.dateTime : '';
            const utcStr = rawDt.endsWith('Z') ? rawDt : `${rawDt}Z`;
            const serverMs = Date.parse(utcStr);
            if (!Number.isNaN(serverMs)) {
              const estimatedServerMs = serverMs + rttMs / 2;
              const diff = estimatedServerMs - Date.now();
              clockOffsetRef.current = Math.abs(diff) > 1500 ? Math.round(diff) : 0;
              setNow(new Date(Date.now() + clockOffsetRef.current));
              setSyncPrecisionSec(Math.min(0.499, Math.max(0.003, rttMs / 2000)));
              calibrated = true;
            }
          }
        } catch {}
      }

      // 2. Fallback to same-origin HTTP Date header
      if (!calibrated) {
        const res = await fetchWithTimeout(
          window.location.pathname || '/',
          { method: 'HEAD', cache: 'no-store' },
          2500
        );
        const rttMs = Math.max(2, performance.now() - t0);
        const dateHeader = res.headers.get('date');
        let nextOffset = clockOffsetRef.current;

        if (dateHeader) {
          const parsedServerMs = Date.parse(dateHeader);
          if (!Number.isNaN(parsedServerMs)) {
            const estimatedServerMs = parsedServerMs + rttMs / 2;
            const diff = estimatedServerMs - Date.now();
            nextOffset = Math.abs(diff) > 2000 ? Math.round(diff) : 0;
          }
        }

        clockOffsetRef.current = nextOffset;
        setNow(new Date(Date.now() + nextOffset));

        const precision = Math.min(0.499, Math.max(0.002, rttMs / 2000));
        setSyncPrecisionSec(precision);
      }
    } catch {
      const rttMs = Math.max(4, performance.now() - t0);
      const driftMs = Math.abs(Date.now() - (performance.timeOrigin + performance.now()));
      setSyncPrecisionSec(Math.min(0.499, Math.max(0.008, (driftMs + rttMs) / 2000)));
      setNow(new Date(Date.now() + clockOffsetRef.current));
    } finally {
      setIsSyncingTime(false);
      const elapsed = performance.now() - startWall;
      const remaining = Math.max(0, 750 - elapsed);
      handshakeTimerRef.current = window.setTimeout(() => {
        setIsHandshaking(false);
      }, remaining);
    }
  }, [settings.offlineMode]);

  const detectLiveDeviceLocation = useCallback((forceSelectDevice: boolean = false) => {
    if (forceSelectDevice) {
      userSelectedManualCityRef.current = false;
    }
    const t0 = performance.now();
    setNow(new Date(Date.now() + clockOffsetRef.current));
    setIsDetectingLocation(true);
    void calibrateLocalTimeSync();

    // Immediately adopt latest cached weather/device location so clock never lags stale city
    const latestSaved = getSavedLocation();
    if (latestSaved?.name && (forceSelectDevice || !userSelectedManualCityRef.current)) {
      const quickCity = weatherLocToCityInfo(latestSaved);
      setDeviceLocationCity(quickCity);
      setSelectedCity(quickCity);
    }

    const updateMeasuredPrecision = () => {
      const rttHalf = (performance.now() - t0) / 2;
      const driftMs = Math.abs(Date.now() - (performance.timeOrigin + performance.now()));
      const sec = Math.min(0.499, Math.max(0.008, (driftMs + Math.min(180, rttHalf * 0.25)) / 1000));
      setSyncPrecisionSec((prev) => (prev > 0 ? Math.min(prev, sec) : sec));
    };

    const applyLocation = (info: CityTimeInfo) => {
      setDeviceLocationCity(info);
      if (forceSelectDevice || !userSelectedManualCityRef.current) {
        setSelectedCity(info);
      }
      setNow(new Date(Date.now() + clockOffsetRef.current));
      updateMeasuredPrecision();
      setIsDetectingLocation(false);
      try {
        localStorage.setItem('user_device_detected_location', JSON.stringify(info));
      } catch {}
      try {
        window.dispatchEvent(
          new CustomEvent('location-updated', {
            detail: {
              name: isZh ? info.shortNameZh || info.nameZh : info.shortNameEn || info.nameEn,
              country: isZh ? info.countryZh : info.countryEn,
              latitude: info.lat,
              longitude: info.lng,
              timezone: info.timeZone,
              isCustom: true,
              source: 'world-clock',
            },
          })
        );
      } catch {}
    };

    const resolveCoordTimezone = async (
      lat: number,
      lng: number,
      fallbackTz: string,
      fallbackOffset: number
    ): Promise<{ timeZone: string; utcOffset: number }> => {
      try {
        const tzRes = await fetchWithTimeout(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m&timezone=auto`,
          undefined,
          4500
        );
        if (tzRes.ok) {
          const tzData = await tzRes.json();
          const tz = tzData?.timezone || fallbackTz;
          const off =
            typeof tzData?.utc_offset_seconds === 'number'
              ? Math.round(tzData.utc_offset_seconds / 36) / 100
              : getLiveUtcOffsetHours(tz, new Date(), fallbackOffset);
          return { timeZone: tz, utcOffset: off };
        }
      } catch {}
      return {
        timeZone: fallbackTz,
        utcOffset: getLiveUtcOffsetHours(fallbackTz, new Date(), fallbackOffset),
      };
    };

    const fallbackToIp = async (latFallback?: number, lngFallback?: number) => {
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
      const offsetHours = -new Date().getTimezoneOffset() / 60;
      if (!settings.offlineMode) {
        // Primary IP lookup: ipwho.is
        try {
          const res = await fetchWithTimeout('https://ipwho.is/', { cache: 'no-store' }, 4500);
          if (res.ok) {
            const data = await res.json();
            if (data && data.success !== false) {
              const locZh = `${data.region || ''} ${data.city || ''}`.trim() || ui.currentLocationDefault;
              const locEn = `${data.city || ui.currentLocationDefault}${data.region ? `, ${data.region}` : ''}`;
              const ipTz = data.timezone?.id || localTz;
              const ipOffset =
                typeof data.timezone?.offset === 'number'
                  ? Math.round(data.timezone.offset / 36) / 100
                  : getLiveUtcOffsetHours(ipTz, new Date(), offsetHours);
              const ipCity: CityTimeInfo = {
                id: 'device-ip',
                flag: '📍',
                nameZh: locZh,
                nameEn: locEn,
                shortNameZh: data.city || locZh,
                shortNameEn: data.city || locEn,
                countryZh: data.country || '',
                countryEn: data.country_code || '',
                timeZone: ipTz,
                utcOffset: ipOffset,
                lat: data.latitude || latFallback || 39.9,
                lng: data.longitude || lngFallback || 116.4,
                isPopular: true,
              };
              applyLocation(ipCity);
              return;
            }
          }
        } catch {}

        // Secondary IP fallback: ipapi.co
        try {
          const res = await fetchWithTimeout('https://ipapi.co/json/', { cache: 'no-store' }, 4500);
          if (res.ok) {
            const data = await res.json();
            if (data && data.city && !data.error) {
              const ipTz = data.timezone || localTz;
              const ipCity: CityTimeInfo = {
                id: 'device-ip',
                flag: '📍',
                nameZh: `${data.region || ''} ${data.city || ''}`.trim() || ui.currentLocationDefault,
                nameEn: `${data.city || ui.currentLocationDefault}${data.region ? `, ${data.region}` : ''}`,
                shortNameZh: data.city || ui.currentLocationDefault,
                shortNameEn: data.city || ui.currentLocationDefault,
                countryZh: data.country_name || '',
                countryEn: data.country_code || '',
                timeZone: ipTz,
                utcOffset: getLiveUtcOffsetHours(ipTz, new Date(), offsetHours),
                lat: data.latitude || latFallback || 39.9,
                lng: data.longitude || lngFallback || 116.4,
                isPopular: true,
              };
              applyLocation(ipCity);
              return;
            }
          }
        } catch {}
      }

      if (latFallback !== undefined && lngFallback !== undefined) {
        const resolved = settings.offlineMode
          ? { timeZone: localTz, utcOffset: offsetHours }
          : await resolveCoordTimezone(latFallback, lngFallback, localTz, offsetHours);
        const coordLabel = `${Math.abs(latFallback).toFixed(2)}°${latFallback >= 0 ? 'N' : 'S'}, ${Math.abs(lngFallback).toFixed(2)}°${lngFallback >= 0 ? 'E' : 'W'}`;
        const coordCity: CityTimeInfo = {
          id: 'device-coords',
          flag: '📍',
          nameZh: `${ui.currentLocationDefault} (${coordLabel})`,
          nameEn: `${ui.currentLocationDefault} (${coordLabel})`,
          shortNameZh: ui.currentLocationDefault,
          shortNameEn: ui.currentLocationDefault,
          countryZh: '',
          countryEn: '',
          timeZone: resolved.timeZone,
          utcOffset: resolved.utcOffset,
          lat: latFallback,
          lng: lngFallback,
          isPopular: true,
        };
        applyLocation(coordCity);
        return;
      }

      updateMeasuredPrecision();
      setIsDetectingLocation(false);
    };

    if (!navigator.geolocation) {
      fallbackToIp();
      return;
    }

    const geoLang = settings.language === 'zh-TW' ? 'zh-hant' : isZh ? 'zh' : settings.language;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
        const offsetHours = -new Date().getTimezoneOffset() / 60;

        const resolved = settings.offlineMode
          ? { timeZone: localTz, utcOffset: offsetHours }
          : await resolveCoordTimezone(latitude, longitude, localTz, offsetHours);

        if (!settings.offlineMode) {
          try {
            const bdcRes = await fetchWithTimeout(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${geoLang}`,
              undefined,
              4500
            );
            if (bdcRes.ok) {
              const bdc = await bdcRes.json();
              const province = bdc.principalSubdivision || '';
              const city = bdc.city || bdc.locality || '';
              const adminLines = bdc.localityInfo?.administrative || [];
              const district = adminLines[3]?.name || '';
              const road = adminLines[4]?.name || bdc.localityInfo?.informative?.[0]?.name || '';
              const fullZh = [province, city, district, road].filter(Boolean).join('');
              const fullEn = [road || district, city || province].filter(Boolean).join(', ');
              if (fullZh || fullEn) {
                const customCity: CityTimeInfo = {
                  id: 'device-gps',
                  flag: '📍',
                  nameZh: fullZh || fullEn,
                  nameEn: fullEn || fullZh,
                  shortNameZh: city || district || ui.currentLocationDefault,
                  shortNameEn: city || district || ui.currentLocationDefault,
                  countryZh: bdc.countryName || '',
                  countryEn: bdc.countryCode || '',
                  timeZone: resolved.timeZone,
                  utcOffset: resolved.utcOffset,
                  lat: latitude,
                  lng: longitude,
                  isPopular: true,
                };
                applyLocation(customCity);
                return;
              }
            }
          } catch {}

          try {
            const res = await fetchWithTimeout(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
              { headers: { 'Accept-Language': localeCode } },
              4500
            );
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const state = addr.province || addr.state || '';
              const city = addr.city || addr.town || addr.county || '';
              const district = addr.suburb || addr.district || '';
              const road = addr.road || addr.street || addr.pedestrian || addr.amenity || '';
              const locZh = `${state}${city}${district}${road}` || data.display_name?.split(',')?.[0];
              const locEn = [road, district, city].filter(Boolean).join(', ') || data.display_name?.split(',')?.[0];
              if (locZh || locEn) {
                const customCity: CityTimeInfo = {
                  id: 'device-gps',
                  flag: '📍',
                  nameZh: locZh || locEn,
                  nameEn: locEn || locZh,
                  shortNameZh: city || district || ui.currentLocationDefault,
                  shortNameEn: city || district || ui.currentLocationDefault,
                  countryZh: addr.country || '',
                  countryEn: addr.country || '',
                  timeZone: resolved.timeZone,
                  utcOffset: resolved.utcOffset,
                  lat: latitude,
                  lng: longitude,
                  isPopular: true,
                };
                applyLocation(customCity);
                return;
              }
            }
          } catch {}
        }

        fallbackToIp(latitude, longitude);
      },
      () => {
        fallbackToIp();
      },
      { timeout: 6500, enableHighAccuracy: true }
    );
  }, [calibrateLocalTimeSync, isZh, localeCode, settings.language, settings.offlineMode, ui.currentLocationDefault, weatherLocToCityInfo]);

  useEffect(() => {
    if (isOpen) {
      const shuffled = [...ALL_CORE_CITIES].sort(() => Math.random() - 0.5);
      setRandomCoreCities(shuffled.slice(0, 8));
      userSelectedManualCityRef.current = Boolean(initialCity);
      detectLiveDeviceLocation(!initialCity);
    }
  }, [isOpen, initialCity, detectLiveDeviceLocation]);

  // Listen to global location-updated (from Weather/App) & app-live-sync events for instant sync
  useEffect(() => {
    const onExternalLocation = (e: Event) => {
      const detail = (e as CustomEvent<WeatherLocation & { source?: string }>).detail;
      if (!detail || detail.source === 'world-clock') return;
      const converted = weatherLocToCityInfo(detail);
      setDeviceLocationCity(converted);
      try {
        localStorage.setItem('user_device_detected_location', JSON.stringify(converted));
      } catch {}
      if (!userSelectedManualCityRef.current) {
        setSelectedCity(converted);
      }
    };

    const onGlobalLiveSync = () => {
      const saved = getSavedLocation();
      if (saved?.name) {
        const converted = weatherLocToCityInfo(saved);
        setDeviceLocationCity(converted);
        if (!userSelectedManualCityRef.current) {
          setSelectedCity(converted);
        }
      }
      if (isOpen) {
        void calibrateLocalTimeSync();
      }
    };

    window.addEventListener('location-updated', onExternalLocation);
    window.addEventListener('app-live-sync', onGlobalLiveSync);
    return () => {
      window.removeEventListener('location-updated', onExternalLocation);
      window.removeEventListener('app-live-sync', onGlobalLiveSync);
    };
  }, [isOpen, weatherLocToCityInfo, calibrateLocalTimeSync]);

  useEffect(() => {
    if (initialCity && isOpen) {
      const found = ALL_CORE_CITIES.find((c) => matchWorldCity(c, initialCity));
      if (found) {
        userSelectedManualCityRef.current = true;
        setSelectedCity(found);
      }
    }
  }, [initialCity, isOpen]);

  useSystemBackLayer(
    isOpen && showSearchDropdown,
    () => {
      setShowSearchDropdown(false);
      (document.activeElement as HTMLElement | null)?.blur?.();
    },
    BACK_PRIORITY.NESTED_MODAL,
    'world-clock-search-dropdown'
  );

  const localMatchedCities = useMemo(() => {
    if (!searchQuery.trim()) return ALL_CORE_CITIES;
    return ALL_CORE_CITIES.filter((c) => matchWorldCity(c, searchQuery));
  }, [searchQuery]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!isOpen || q.length < 2 || settings.offlineMode) {
      setRemoteSearchCities([]);
      setIsSearchingRemote(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearchingRemote(true);
      try {
        const apiLang =
          settings.language === 'zh-CN' || settings.language === 'zh-TW'
            ? 'zh'
            : ['en', 'ja', 'ko', 'fr', 'ru'].includes(settings.language)
            ? settings.language
            : 'en';
        const res = await fetchWithTimeout(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=${apiLang}`,
          { signal: controller.signal },
          4500
        );
        if (!res.ok) {
          if (!cancelled) setRemoteSearchCities([]);
          return;
        }
        const data = await res.json();
        interface GeoSearchRow {
          id?: number | string;
          name: string;
          country?: string;
          country_code?: string;
          admin1?: string;
          timezone?: string;
          latitude?: number;
          longitude?: number;
        }
        const rows: GeoSearchRow[] = Array.isArray(data?.results) ? (data.results as GeoSearchRow[]) : [];
        const mapped: CityTimeInfo[] = rows
          .filter((r): r is GeoSearchRow & { timezone: string } => typeof r?.timezone === 'string' && r.timezone.includes('/'))
          .map((r) => {
            const flag = countryCodeToFlag(r.country_code);
            const countryLabel = r.country || '';
            const adminLabel = r.admin1 && r.admin1 !== r.name ? `${r.admin1}, ` : '';
            const fullName = countryLabel ? `${r.name} · ${adminLabel}${countryLabel}` : r.name;
            return {
              id: `geo-${r.id || `${r.latitude}-${r.longitude}`}`,
              flag,
              nameZh: fullName,
              nameTw: fullName,
              nameEn: fullName,
              shortNameZh: r.name,
              shortNameTw: r.name,
              shortNameEn: r.name,
              countryZh: countryLabel,
              countryTw: countryLabel,
              countryEn: countryLabel,
              timeZone: r.timezone,
              utcOffset: getLiveUtcOffsetHours(r.timezone, new Date(), 0),
              lat: Number(r.latitude) || 0,
              lng: Number(r.longitude) || 0,
              isPopular: false,
            };
          });
        if (!cancelled) {
          setRemoteSearchCities(mapped);
        }
      } catch {
        if (!cancelled) setRemoteSearchCities([]);
      } finally {
        if (!cancelled) setIsSearchingRemote(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, isOpen, settings.offlineMode, settings.language]);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return ALL_CORE_CITIES;
    const seen = new Set<string>();
    const combined: CityTimeInfo[] = [];
    for (const c of [...localMatchedCities, ...remoteSearchCities]) {
      const key = `${c.timeZone}::${(c.shortNameEn || c.shortNameZh).toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      combined.push(c);
    }
    return combined;
  }, [searchQuery, localMatchedCities, remoteSearchCities]);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const diffX = e.changedTouches[0].clientX - touchStartX.current;
      if (diffX > 100) {
        onClose();
      }
    }
    touchStartX.current = null;
  };

  const formatTimeInZone = (tz: string, includeSeconds: boolean) => {
    const raw = now.toLocaleTimeString('en-GB', {
      timeZone: tz,
      hourCycle: settings.use24HourFormat ? 'h23' : 'h12',
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {}),
    });
    return raw.replace(/\s*(am|pm)$/i, '').trim();
  };

  const mainTimeCore = formatTimeInZone(selectedCity.timeZone, true);
  const [hourStr = '00', minStr = '00', secStr = '00'] = mainTimeCore.split(':');

  const cityDateStr = now.toLocaleDateString(localeCode, {
    timeZone: selectedCity.timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Compute exact day-of-year based on selected city's active calendar date
  const cityCalStr = now.toLocaleDateString('en-CA', {
    timeZone: selectedCity.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [calYearRaw, calMonthRaw, calDayRaw] = cityCalStr.split('-').map(Number);
  const activeYear = Number.isFinite(calYearRaw) ? calYearRaw : now.getFullYear();
  const activeMonth = Number.isFinite(calMonthRaw) ? calMonthRaw : now.getMonth() + 1;
  const activeDay = Number.isFinite(calDayRaw) ? calDayRaw : now.getDate();

  const dayOfYear = Math.max(
    1,
    Math.min(
      366,
      Math.round((Date.UTC(activeYear, activeMonth - 1, activeDay) - Date.UTC(activeYear, 0, 0)) / 86400000)
    )
  );
  const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const totalDaysInYear = isLeap(activeYear) ? 366 : 365;
  const daysLeftInYear = Math.max(0, totalDaysInYear - dayOfYear);
  const yearProgressPct = Math.min(100, Math.max(1, Math.round((dayOfYear / totalDaysInYear) * 100)));

  const selectedCityName = getCityName(selectedCity, settings.language);
  const selectedLiveOffset = getLiveUtcOffsetHours(selectedCity.timeZone, now, selectedCity.utcOffset);

  const syncPrecisionLabel = isHandshaking
    ? ui.wcHandshaking
    : ui.wcSyncPrecision.replace('{sec}', syncPrecisionSec.toFixed(3));

  const displayedGridCities = searchQuery.trim() ? filteredCities.slice(0, 8) : randomCoreCities;
  const isSyncBusy = isDetectingLocation || isSyncingTime || isHandshaking;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-[#F5F6F8] dark:bg-neutral-950 [.amoled-mode_&]:bg-black text-neutral-900 dark:text-white select-none overflow-hidden animate-modal-sheet font-sans transition-colors"
    >
      {/* Subtle Theme-Adaptive Ambient Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[480px] h-[260px] rounded-full bg-sky-400/14 dark:bg-blue-600/10 [.amoled-mode_&]:bg-blue-500/[0.06] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[340px] h-[220px] rounded-full bg-orange-300/14 dark:bg-indigo-500/8 [.amoled-mode_&]:bg-indigo-500/[0.05] blur-[110px]" />
      </div>

      {/* Top Row: Search Bar + Circular Close Button */}
      <div className="px-3.5 sm:px-6 pt-3 pb-2.5 shrink-0 z-40 max-w-5xl mx-auto w-full flex items-center gap-2.5">
        <div ref={searchBoxRef} className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/92 dark:bg-white/[0.06] [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/85 dark:border-white/12 [.amoled-mode_&]:border-white/[0.1] shadow-xs dark:shadow-none focus-within:border-blue-500/75 dark:focus-within:border-blue-400/75 transition-all">
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredCities.length > 0) {
                  const chosen = filteredCities[0];
                  const q = searchQuery.trim();
                  worldClockSearchHistory.recordQuery(q.length >= 2 ? q : getCityName(chosen, settings.language));
                  userSelectedManualCityRef.current = true;
                  setSelectedCity(chosen);
                  setShowSearchDropdown(false);
                  setSearchQuery('');
                }
              }}
              onBlur={() => {
                const q = searchQuery.trim();
                if (q.length >= 2) worldClockSearchHistory.recordQuery(q);
              }}
              placeholder={ui.wcSearchPlaceholder}
              className="flex-1 bg-transparent text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-medium min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-800 dark:hover:text-white cursor-pointer shrink-0"
                aria-label="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 max-h-64 overflow-y-auto rounded-2xl bg-white/98 dark:bg-neutral-900/98 [.amoled-mode_&]:bg-neutral-950/98 border border-neutral-200/90 dark:border-white/15 shadow-2xl p-1.5 divide-y divide-neutral-100 dark:divide-white/8 backdrop-blur-2xl">
              {filteredCities.length > 0 ? (
                filteredCities.map((c) => {
                  const cOffset = getLiveUtcOffsetHours(c.timeZone, now, c.utcOffset);
                  const displayName = getCityName(c, settings.language);
                  const subName = isZh
                    ? (c.nameEn !== displayName ? c.nameEn : getCityCountry(c, settings.language))
                    : getCityCountry(c, settings.language) || c.timeZone;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const q = searchQuery.trim();
                        worldClockSearchHistory.recordQuery(q.length >= 2 ? q : displayName);
                        userSelectedManualCityRef.current = true;
                        setSelectedCity(c);
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-start flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{c.flag}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {displayName}
                          </div>
                          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                            {subName}
                          </div>
                        </div>
                      </div>
                      <div className="text-end font-mono tabular-nums shrink-0 ms-2">
                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {formatTimeInZone(c.timeZone, false)}
                        </div>
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                          {formatUtcLabel(cOffset)}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : isSearchingRemote ? (
                <div className="p-4 text-center text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span>{ui.wcCalibrating}</span>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
                  {ui.wcNoCityFound}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/90 dark:bg-white/10 [.amoled-mode_&]:bg-neutral-900 border border-neutral-200/80 dark:border-white/10 hover:bg-neutral-200/80 dark:hover:bg-white/20 active:scale-95 flex items-center justify-center text-neutral-700 dark:text-neutral-200 shadow-xs dark:shadow-none transition-all cursor-pointer shrink-0"
          title={`${t.backButton} (Esc)`}
          aria-label={t.backButton}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {(!showSearchDropdown || !searchQuery.trim()) && worldClockSearchHistory.history.length > 0 && (
        <div className="px-3.5 sm:px-6 pb-2 shrink-0 z-30 max-w-5xl mx-auto w-full">
          <SearchHistoryBar
            history={worldClockSearchHistory.history}
            language={settings.language}
            onSelectQuery={(q) => {
              setSearchQuery(q);
              setShowSearchDropdown(true);
              worldClockSearchHistory.recordQuery(q);
            }}
            onRemoveQuery={worldClockSearchHistory.removeQuery}
            onClearHistory={worldClockSearchHistory.clearHistory}
            compact
          />
        </div>
      )}

      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain relative px-3.5 sm:px-6 pb-6 max-w-5xl mx-auto w-full z-10 space-y-3.5 sm:space-y-4">
        {/* Hero Precision Clock Card */}
        <div className="rounded-[24px] bg-white/92 dark:bg-white/[0.04] [.amoled-mode_&]:bg-neutral-950/95 backdrop-blur-2xl border border-neutral-200/85 dark:border-white/12 [.amoled-mode_&]:border-white/[0.09] overflow-hidden shadow-[0_14px_38px_rgba(15,23,42,0.06)] dark:shadow-2xl relative z-10">
          <div className="px-4 sm:px-8 pt-5 sm:pt-6 pb-4.5 sm:pb-5 flex flex-col items-center">
            {/* Full Date Header */}
            <div className="text-center text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-300 tracking-wide mb-3">
              {cityDateStr}
            </div>

            {/* Paired Digital Clock & Matched-Width Slim Year Progress Bar */}
            <div className="w-fit max-w-full mx-auto flex flex-col items-stretch gap-2.5 sm:gap-3">
              {/* Digital Clock (Responsive fluid sizing so narrow screens never overflow) */}
              <div
                dir="ltr"
                className="flex items-baseline justify-center gap-0.5 sm:gap-2 text-center font-mono tabular-nums text-neutral-950 dark:text-white leading-none dark:drop-shadow-[0_8px_24px_rgba(0,0,0,0.65)] max-w-full overflow-hidden"
              >
                <span className="text-[clamp(1.7rem,8.4vw,4.1rem)] font-extrabold tracking-tight">
                  {hourStr}
                </span>
                <span className="text-[clamp(1.35rem,6.6vw,3.3rem)] font-bold text-neutral-400/90 dark:text-neutral-400 px-0.5">
                  :
                </span>
                <span className="text-[clamp(1.7rem,8.4vw,4.1rem)] font-extrabold tracking-tight">
                  {minStr}
                </span>
                <span className="text-[clamp(1.35rem,6.6vw,3.3rem)] font-bold text-neutral-400/90 dark:text-neutral-400 px-0.5">
                  :
                </span>
                <span className="text-[clamp(1.7rem,8.4vw,4.1rem)] font-extrabold tracking-tight">
                  {secStr}
                </span>
              </div>

              {/* Slim Harmonized Year Progress Bar (Width locked to Digital Clock width) */}
              <div
                role="progressbar"
                aria-label={`${dayOfYear} / ${totalDaysInYear} (${yearProgressPct}%)`}
                aria-valuenow={yearProgressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="relative w-full h-[26px] sm:h-[28px] rounded-full bg-neutral-100/90 dark:bg-white/[0.06] [.amoled-mode_&]:bg-white/[0.05] border border-neutral-200/90 dark:border-white/12 [.amoled-mode_&]:border-white/14 shadow-inner flex items-center justify-between p-[2px] overflow-hidden"
              >
                {/* Trackable Fill Zone (leaves clean breathing room for % + rotating wheel) */}
                <div className="relative flex-1 min-w-0 h-full">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#ED7B5C]/90 via-[#E56545]/92 to-[#D85233]/95 dark:from-[#EC7859]/85 dark:via-[#E26040]/88 dark:to-[#D44E30]/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] flex items-center justify-between px-2.5 transition-all duration-500"
                    style={{ width: `${Math.max(26, yearProgressPct)}%` }}
                  >
                    <span className="text-[10.5px] sm:text-[11px] font-extrabold font-mono tabular-nums text-amber-100 drop-shadow-[0_1px_1px_rgba(120,30,10,0.28)] leading-none">
                      {dayOfYear}
                    </span>
                    {yearProgressPct >= 34 && (
                      <span className="text-[10px] sm:text-[10.5px] font-bold font-mono tabular-nums text-white/95 drop-shadow-[0_1px_1px_rgba(120,30,10,0.25)] leading-none">
                        {daysLeftInYear}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Zone: Year Percentage + Rotating 4-Petal Wheel */}
                <div className="flex items-center gap-1.5 ps-1.5 pe-[1px] shrink-0">
                  <span className="text-[10px] sm:text-[10.5px] font-bold font-mono tabular-nums text-neutral-600 dark:text-neutral-300 leading-none">
                    {yearProgressPct}%
                  </span>
                  <div className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] rounded-full bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-black border-[1.75px] border-[#E46243]/85 dark:border-[#EE6E4C]/80 flex items-center justify-center shadow-2xs shrink-0">
                    <svg
                      viewBox="-16 -16 32 32"
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E46243] dark:text-[#EE6E4C]"
                      aria-hidden="true"
                    >
                      <g className="animate-wheel-spin" style={{ transformOrigin: '0px 0px' }}>
                        <circle cx="0" cy="0" r="2" fill="currentColor" />
                        {[45, 135, 225, 315].map((deg) => (
                          <path
                            key={deg}
                            transform={`rotate(${deg})`}
                            d="M 0 -4 C 1.5 -6.6, 3.6 -9.3, 3.6 -11.2 A 3.6 3.6 0 1 1 -3.6 -11.2 C -3.6 -9.3, -1.5 -6.6, 0 -4 Z"
                            fill="currentColor"
                          />
                        ))}
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Location + Time Sync Calibration Strip */}
          <div className="bg-neutral-100/80 dark:bg-slate-800/55 [.amoled-mode_&]:bg-white/[0.03] border-t border-neutral-200/75 dark:border-white/10 px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => detectLiveDeviceLocation(true)}
              disabled={isSyncBusy}
              className="flex items-center gap-2 min-w-0 flex-1 text-start group cursor-pointer disabled:opacity-75"
              title={ui.wcCalibrateBtn}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/25 dark:border-blue-400/30 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors truncate">
                {selectedCityName}
              </span>
            </button>

            <button
              type="button"
              onClick={() => detectLiveDeviceLocation(true)}
              disabled={isSyncBusy}
              className="flex items-center gap-2 text-[11px] sm:text-xs font-mono tabular-nums text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-80"
              title={ui.wcLiveSync}
            >
              <span className="relative w-5 h-5 flex items-center justify-center shrink-0">
                {isHandshaking && (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border border-sky-500/75 dark:border-sky-400/75 animate-handshake-ripple"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border border-blue-500/55 dark:border-blue-400/55 animate-handshake-ripple-delay"
                    />
                  </>
                )}
                <RefreshCw
                  className={`relative z-10 w-3.5 h-3.5 ${isSyncBusy ? 'animate-spin text-sky-600 dark:text-sky-400' : 'text-neutral-500 dark:text-neutral-300'}`}
                />
              </span>
              <span className={isHandshaking ? 'text-sky-600 dark:text-sky-300 font-semibold transition-colors' : ''}>
                {syncPrecisionLabel}
              </span>
            </button>
          </div>
        </div>

        {/* Lower Section: Global Core Cities Grid */}
        <div className="rounded-[24px] bg-white/92 dark:bg-white/[0.04] [.amoled-mode_&]:bg-neutral-950/95 backdrop-blur-2xl border border-neutral-200/85 dark:border-white/10 [.amoled-mode_&]:border-white/[0.08] shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:shadow-none p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200 px-0.5 gap-2">
            <span className="truncate">
              {ui.wcGridTitle} · <span className="text-neutral-500 dark:text-neutral-400 font-normal">{ui.wcGridHint}</span>
            </span>
            {!searchQuery.trim() && (
              <button
                type="button"
                onClick={() => {
                  const shuffled = [...ALL_CORE_CITIES].sort(() => Math.random() - 0.5);
                  setRandomCoreCities(shuffled.slice(0, 8));
                }}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{ui.wcNextBatch}</span>
              </button>
            )}
          </div>

          {displayedGridCities.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {displayedGridCities.map((c) => {
                const isCur = selectedCity.id === c.id;
                const cTime = formatTimeInZone(c.timeZone, false);
                const cLiveOffset = getLiveUtcOffsetHours(c.timeZone, now, c.utcOffset);
                const diffHours = Number((cLiveOffset - selectedLiveOffset).toFixed(1));

                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      userSelectedManualCityRef.current = true;
                      setSelectedCity(c);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    className={`text-start px-3 py-3 rounded-2xl cursor-pointer transition-all border ${
                      isCur
                        ? 'bg-blue-50/95 dark:bg-blue-600/20 border-blue-500/65 dark:border-blue-400/75 ring-1 ring-blue-500/25 dark:ring-blue-400/35 shadow-sm'
                        : 'bg-neutral-50/90 dark:bg-black/30 [.amoled-mode_&]:bg-white/[0.03] hover:bg-neutral-100 dark:hover:bg-white/[0.07] border-neutral-200/80 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-200 gap-1">
                      <span className="truncate">
                        {c.flag} {getCityShortName(c, settings.language)}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono tabular-nums shrink-0">
                        {diffHours === 0 ? ui.wcSameTime : diffHours > 0 ? `+${diffHours}h` : `${diffHours}h`}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-950 dark:text-white tabular-nums leading-none">
                        {cTime}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono tabular-nums">
                        {formatUtcLabel(cLiveOffset)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : isSearchingRemote ? (
            <div className="py-6 text-center text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
              <span>{ui.wcCalibrating}</span>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
              {ui.wcNoCityFound}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
