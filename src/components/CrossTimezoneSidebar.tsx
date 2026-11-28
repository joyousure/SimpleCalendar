import React, { useState, useEffect, useMemo } from 'react';
import { AppSettings, Language } from '../types/calendar';
import { WeatherLocation } from '../types/weather';
import { getCachedWeatherData } from '../utils/weatherService';
import { ALL_CORE_CITIES } from '../data/worldCities';
import { getLocaleCode, isRtlLanguage } from '../utils/i18n';
import {
  Globe2,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CrossTimezoneSidebarProps {
  location: WeatherLocation;
  settings: AppSettings;
  isCalendarActive: boolean;
  onOpenWorldClock: (cityName?: string) => void;
}

const CITY_TIMEZONE_MAP: Record<string, { tz: string; countryCode: string }> = {
  北京: { tz: 'Asia/Shanghai', countryCode: 'CN' },
  北京市: { tz: 'Asia/Shanghai', countryCode: 'CN' },
  beijing: { tz: 'Asia/Shanghai', countryCode: 'CN' },
  上海: { tz: 'Asia/Shanghai', countryCode: 'CN' },
  shanghai: { tz: 'Asia/Shanghai', countryCode: 'CN' },
  广州: { tz: 'Asia/Shanghai', countryCode: 'CN' },
  深圳: { tz: 'Asia/Shanghai', countryCode: 'CN' },
  贵阳: { tz: 'Asia/Shanghai', countryCode: 'CN' },
  成都: { tz: 'Asia/Shanghai', countryCode: 'CN' },
  香港: { tz: 'Asia/Hong_Kong', countryCode: 'CN' },
  'hong kong': { tz: 'Asia/Hong_Kong', countryCode: 'CN' },
  台北: { tz: 'Asia/Taipei', countryCode: 'CN' },
  taipei: { tz: 'Asia/Taipei', countryCode: 'CN' },
  洛杉矶: { tz: 'America/Los_Angeles', countryCode: 'US' },
  'los angeles': { tz: 'America/Los_Angeles', countryCode: 'US' },
  旧金山: { tz: 'America/Los_Angeles', countryCode: 'US' },
  'san francisco': { tz: 'America/Los_Angeles', countryCode: 'US' },
  西雅图: { tz: 'America/Los_Angeles', countryCode: 'US' },
  seattle: { tz: 'America/Los_Angeles', countryCode: 'US' },
  纽约: { tz: 'America/New_York', countryCode: 'US' },
  'new york': { tz: 'America/New_York', countryCode: 'US' },
  芝加哥: { tz: 'America/Chicago', countryCode: 'US' },
  chicago: { tz: 'America/Chicago', countryCode: 'US' },
  伦敦: { tz: 'Europe/London', countryCode: 'GB' },
  london: { tz: 'Europe/London', countryCode: 'GB' },
  巴黎: { tz: 'Europe/Paris', countryCode: 'FR' },
  paris: { tz: 'Europe/Paris', countryCode: 'FR' },
  柏林: { tz: 'Europe/Berlin', countryCode: 'DE' },
  berlin: { tz: 'Europe/Berlin', countryCode: 'DE' },
  莫斯科: { tz: 'Europe/Moscow', countryCode: 'RU' },
  moscow: { tz: 'Europe/Moscow', countryCode: 'RU' },
  东京: { tz: 'Asia/Tokyo', countryCode: 'JP' },
  tokyo: { tz: 'Asia/Tokyo', countryCode: 'JP' },
  首尔: { tz: 'Asia/Seoul', countryCode: 'KR' },
  seoul: { tz: 'Asia/Seoul', countryCode: 'KR' },
  新加坡: { tz: 'Asia/Singapore', countryCode: 'SG' },
  singapore: { tz: 'Asia/Singapore', countryCode: 'SG' },
  迪拜: { tz: 'Asia/Dubai', countryCode: 'AE' },
  dubai: { tz: 'Asia/Dubai', countryCode: 'AE' },
  悉尼: { tz: 'Australia/Sydney', countryCode: 'AU' },
  sydney: { tz: 'Australia/Sydney', countryCode: 'AU' },
  墨尔本: { tz: 'Australia/Melbourne', countryCode: 'AU' },
  melbourne: { tz: 'Australia/Melbourne', countryCode: 'AU' },
  多伦多: { tz: 'America/Toronto', countryCode: 'CA' },
  toronto: { tz: 'America/Toronto', countryCode: 'CA' },
  温哥华: { tz: 'America/Vancouver', countryCode: 'CA' },
  vancouver: { tz: 'America/Vancouver', countryCode: 'CA' },
  曼谷: { tz: 'Asia/Bangkok', countryCode: 'TH' },
  bangkok: { tz: 'Asia/Bangkok', countryCode: 'TH' },
  吉隆坡: { tz: 'Asia/Kuala_Lumpur', countryCode: 'MY' },
  'kuala lumpur': { tz: 'Asia/Kuala_Lumpur', countryCode: 'MY' },
  德黑兰: { tz: 'Asia/Tehran', countryCode: 'IR' },
  tehran: { tz: 'Asia/Tehran', countryCode: 'IR' },
  乌兰巴托: { tz: 'Asia/Ulaanbaatar', countryCode: 'MN' },
  ulaanbaatar: { tz: 'Asia/Ulaanbaatar', countryCode: 'MN' },
};

const TZ_TO_COUNTRY_CODE: Record<string, string> = {
  'Asia/Shanghai': 'CN',
  'Asia/Chongqing': 'CN',
  'Asia/Harbin': 'CN',
  'Asia/Urumqi': 'CN',
  'Asia/Hong_Kong': 'CN',
  'Asia/Macau': 'CN',
  'Asia/Taipei': 'CN',
  'America/Los_Angeles': 'US',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  'Europe/Moscow': 'RU',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Singapore': 'SG',
  'Asia/Dubai': 'AE',
  'Asia/Bangkok': 'TH',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Jakarta': 'ID',
  'Asia/Kolkata': 'IN',
  'Asia/Tehran': 'IR',
  'Asia/Ulaanbaatar': 'MN',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
};

function normalizeCountryCode(country?: string, timeZone?: string): string {
  if (timeZone && TZ_TO_COUNTRY_CODE[timeZone]) {
    return TZ_TO_COUNTRY_CODE[timeZone];
  }
  const c = (country || '').trim().toLowerCase();
  if (!c) return '';
  if (c.includes('中国') || c.includes('china') || c.includes('港澳台') || c.includes('taiwan') || c.includes('hong kong')) {
    return 'CN';
  }
  if (c.includes('美国') || c.includes('united states') || c === 'usa' || c === 'us') return 'US';
  if (c.includes('日本') || c.includes('japan')) return 'JP';
  if (c.includes('韩国') || c.includes('korea')) return 'KR';
  if (c.includes('英国') || c.includes('united kingdom') || c === 'uk') return 'GB';
  if (c.includes('法国') || c.includes('france')) return 'FR';
  if (c.includes('德国') || c.includes('germany')) return 'DE';
  if (c.includes('俄罗斯') || c.includes('russia')) return 'RU';
  if (c.includes('新加坡') || c.includes('singapore')) return 'SG';
  if (c.includes('澳大利亚') || c.includes('australia')) return 'AU';
  if (c.includes('加拿大') || c.includes('canada')) return 'CA';
  if (c.includes('阿联酋') || c.includes('united arab emirates') || c === 'uae') return 'AE';
  if (c.includes('伊朗') || c.includes('iran')) return 'IR';
  if (c.includes('蒙古') || c.includes('mongolia')) return 'MN';
  return c.toUpperCase();
}

function getTzParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      map[p.type] = parseInt(p.value, 10);
    }
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour === 24 ? 0 : map.hour,
    minute: map.minute,
    second: map.second,
  };
}

function getUtcOffsetMinutes(date: Date, timeZone: string): number {
  const p = getTzParts(date, timeZone);
  const asUtcMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const actualUtcMs = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
  return Math.round((asUtcMs - actualUtcMs) / 60000);
}

function getDayDiffLabel(
  remoteYmd: { year: number; month: number; day: number },
  localYmd: { year: number; month: number; day: number },
  lang: Language
): { text: string; isOffsetDay: boolean } {
  const rDay = Date.UTC(remoteYmd.year, remoteYmd.month - 1, remoteYmd.day);
  const lDay = Date.UTC(localYmd.year, localYmd.month - 1, localYmd.day);
  const diffDays = Math.round((rDay - lDay) / 86400000);

  if (diffDays === 0) {
    const todayMap: Record<Language, string> = {
      'zh-CN': '今日',
      'zh-TW': '今日',
      en: 'Today',
      ja: '今日',
      ko: '오늘',
      fr: "Aujourd'hui",
      fa: 'امروز',
      mn: 'Өнөөдөр',
      ru: 'Сегодня',
      ug: 'بۈگۈن',
    };
    return { text: todayMap[lang] || 'Today', isOffsetDay: false };
  }
  if (diffDays > 0) {
    const tmrwMap: Record<Language, string> = {
      'zh-CN': '明日',
      'zh-TW': '明日',
      en: '+1d',
      ja: '明日',
      ko: '내일',
      fr: 'Demain',
      fa: 'فردا',
      mn: 'Маргааш',
      ru: 'Завтра',
      ug: 'ئەتە',
    };
    return { text: tmrwMap[lang] || '+1d', isOffsetDay: true };
  }
  const yestMap: Record<Language, string> = {
    'zh-CN': '昨日',
    'zh-TW': '昨日',
    en: '-1d',
    ja: '昨日',
    ko: '어제',
    fr: 'Hier',
    fa: 'دیروز',
    mn: 'Өчигдөр',
    ru: 'Вчера',
    ug: 'تۈنۈگۈن',
  };
  return { text: yestMap[lang] || '-1d', isOffsetDay: true };
}

function getSidebarCopy(lang: Language) {
  if (lang === 'zh-TW') {
    return {
      timeSuffix: '時間',
      autoDetectTag: '跨時區換算',
      localSystem: '本機時間',
      faster: (h: string) => `比本機快 ${h}`,
      slower: (h: string) => `比本機慢 ${h}`,
      sameOffset: '與本機同區時差 0',
      hourUnit: '小時',
      converterLabel: '快速時區換算',
      nowBtn: '現在',
      worldClockBtn: '世界時鐘',
    };
  }
  if (lang === 'zh-CN') {
    return {
      timeSuffix: '时间',
      autoDetectTag: '跨时区换算',
      localSystem: '本机时间',
      faster: (h: string) => `比本机快 ${h}`,
      slower: (h: string) => `比本机慢 ${h}`,
      sameOffset: '跨国家同偏移',
      hourUnit: '小时',
      converterLabel: '快速时区换算',
      nowBtn: '现在',
      worldClockBtn: '世界时钟',
    };
  }
  if (lang === 'ja') {
    return {
      timeSuffix: '時間',
      autoDetectTag: '時差自動換算',
      localSystem: '端末時刻',
      faster: (h: string) => `端末より +${h}`,
      slower: (h: string) => `端末より -${h}`,
      sameOffset: '時差なし',
      hourUnit: '時間',
      converterLabel: '時刻換算スライダー',
      nowBtn: '現在',
      worldClockBtn: '世界時計',
    };
  }
  if (lang === 'ko') {
    return {
      timeSuffix: ' 시간',
      autoDetectTag: '자동 시차 변환',
      localSystem: '내 기기 시간',
      faster: (h: string) => `기기보다 +${h}`,
      slower: (h: string) => `기기보다 -${h}`,
      sameOffset: '시차 없음',
      hourUnit: '시간',
      converterLabel: '빠른 시간 변환',
      nowBtn: '현재',
      worldClockBtn: '세계 시계',
    };
  }
  if (lang === 'fr') {
    return {
      timeSuffix: ' · Heure',
      autoDetectTag: 'Fuseau horaire',
      localSystem: 'Appareil',
      faster: (h: string) => `+${h}`,
      slower: (h: string) => `-${h}`,
      sameOffset: 'Même décalage',
      hourUnit: 'h',
      converterLabel: 'Convertisseur rapide',
      nowBtn: 'Maintenant',
      worldClockBtn: 'Horloge',
    };
  }
  if (lang === 'ru') {
    return {
      timeSuffix: ' · Время',
      autoDetectTag: 'Часовой пояс',
      localSystem: 'Устройство',
      faster: (h: string) => `+${h} впереди`,
      slower: (h: string) => `-${h} позади`,
      sameOffset: 'Без сдвига',
      hourUnit: 'ч',
      converterLabel: 'Конвертер времени',
      nowBtn: 'Сейчас',
      worldClockBtn: 'Мировое время',
    };
  }
  if (lang === 'fa') {
    return {
      timeSuffix: ' · زمان',
      autoDetectTag: 'تبدیل منطقه زمانی',
      localSystem: 'دستگاه',
      faster: (h: string) => `${h} جلوتر`,
      slower: (h: string) => `${h} عقب‌تر`,
      sameOffset: 'هم‌زمان',
      hourUnit: 'ساعت',
      converterLabel: 'تبدیل سریع ساعت',
      nowBtn: 'اکنون',
      worldClockBtn: 'ساعت جهانی',
    };
  }
  if (lang === 'mn') {
    return {
      timeSuffix: ' · Цаг',
      autoDetectTag: 'Цагийн бүс',
      localSystem: 'Төхөөрөмж',
      faster: (h: string) => `${h} түрүүнд`,
      slower: (h: string) => `${h} хоцорч`,
      sameOffset: 'Ижил цаг',
      hourUnit: 'цаг',
      converterLabel: 'Цаг хөрвүүлэгч',
      nowBtn: 'Одоо',
      worldClockBtn: 'Дэлхийн цаг',
    };
  }
  if (lang === 'ug') {
    return {
      timeSuffix: ' · ۋاقىت',
      autoDetectTag: 'ۋاقىت رايونى',
      localSystem: 'ئۈسكۈنە',
      faster: (h: string) => `${h} ئالدىدا`,
      slower: (h: string) => `${h} كەينىدە`,
      sameOffset: 'ئوخشاش ۋاقىت',
      hourUnit: 'سائەت',
      converterLabel: 'تېز ۋاقىت ئالماشتۇرۇش',
      nowBtn: 'ھازىر',
      worldClockBtn: 'دۇنيا سائىتى',
    };
  }
  return {
    timeSuffix: ' Time',
    autoDetectTag: 'Cross-Timezone',
    localSystem: 'Device',
    faster: (h: string) => `${h} ahead`,
    slower: (h: string) => `${h} behind`,
    sameOffset: 'Same offset',
    hourUnit: 'h',
    converterLabel: 'Quick Convert',
    nowBtn: 'Now',
    worldClockBtn: 'World Clock',
  };
}

export const CrossTimezoneSidebar: React.FC<CrossTimezoneSidebarProps> = ({
  location,
  settings,
  isCalendarActive,
  onOpenWorldClock,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [resolvedTz, setResolvedTz] = useState<string | null>(location.timezone || null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAutoDismissed, setIsAutoDismissed] = useState(false);

  const copy = useMemo(() => getSidebarCopy(settings.language), [settings.language]);
  const localeCode = getLocaleCode(settings.language);
  const isRtl = isRtlLanguage(settings.language);

  // Live 1-second tick when calendar is active
  useEffect(() => {
    if (!isCalendarActive) return;
    setNow(new Date());
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCalendarActive]);

  // Resolve timezone for active weather/calendar location automatically
  useEffect(() => {
    let active = true;

    const resolveFromSources = (): string | null => {
      if (location.timezone) return location.timezone;

      const cached = getCachedWeatherData();
      if (
        cached?.timezone &&
        cached.location &&
        Math.abs(cached.location.latitude - location.latitude) < 0.5 &&
        Math.abs(cached.location.longitude - location.longitude) < 0.5
      ) {
        return cached.timezone;
      }

      const key = location.name.trim().toLowerCase();
      if (CITY_TIMEZONE_MAP[key]) {
        return CITY_TIMEZONE_MAP[key].tz;
      }

      const coreMatch = ALL_CORE_CITIES.find(
        (c) =>
          c.shortNameZh.toLowerCase() === key ||
          c.shortNameEn.toLowerCase() === key ||
          (Math.abs(c.lat - location.latitude) < 0.45 && Math.abs(c.lng - location.longitude) < 0.45)
      );
      if (coreMatch) return coreMatch.timeZone;

      return null;
    };

    const immediate = resolveFromSources();
    setResolvedTz(immediate);
    setIsCollapsed(false);
    setIsAutoDismissed(false);

    if (!immediate && !settings.offlineMode && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m&timezone=auto`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (active && typeof data?.timezone === 'string') {
            setResolvedTz(data.timezone);
          }
        })
        .catch(() => {});
    }

    const onWeatherUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (
        detail?.timezone &&
        detail?.location &&
        Math.abs(detail.location.latitude - location.latitude) < 0.5 &&
        Math.abs(detail.location.longitude - location.longitude) < 0.5
      ) {
        setResolvedTz(detail.timezone);
      }
    };

    window.addEventListener('weather-updated', onWeatherUpdated);
    return () => {
      active = false;
      window.removeEventListener('weather-updated', onWeatherUpdated);
    };
  }, [location.name, location.country, location.latitude, location.longitude, location.timezone, settings.offlineMode]);

  const systemTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  // Validate target timezone safely
  const validTargetTz = useMemo(() => {
    if (!resolvedTz) return null;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: resolvedTz }).format(now);
      return resolvedTz;
    } catch {
      return null;
    }
  }, [resolvedTz, now]);

  const mismatchInfo = useMemo(() => {
    if (!validTargetTz) return null;
    const sysOffsetMins = getUtcOffsetMinutes(now, systemTimeZone);
    const locOffsetMins = getUtcOffsetMinutes(now, validTargetTz);
    const diffMins = locOffsetMins - sysOffsetMins;

    const sysCountry = normalizeCountryCode(undefined, systemTimeZone);
    const locCountry = normalizeCountryCode(location.country, validTargetTz);

    const tzDiffers = Math.abs(diffMins) >= 15;
    const countryDiffers =
      Boolean(sysCountry) && Boolean(locCountry) && sysCountry !== locCountry && validTargetTz !== systemTimeZone;

    if (!tzDiffers && !countryDiffers) {
      return null;
    }

    return {
      sysOffsetMins,
      locOffsetMins,
      diffMins,
      tzDiffers,
      countryDiffers,
    };
  }, [validTargetTz, now, systemTimeZone, location.country]);

  const hasTimezoneMismatch = isCalendarActive && Boolean(validTargetTz && mismatchInfo);

  // Auto-dismiss cross-timezone floating bar after 1 minute (60,000 ms)
  useEffect(() => {
    if (!hasTimezoneMismatch) return;
    setIsAutoDismissed(false);
    const timer = window.setTimeout(() => {
      setIsAutoDismissed(true);
    }, 60000);
    return () => window.clearTimeout(timer);
  }, [hasTimezoneMismatch, location.name, validTargetTz]);

  if (!hasTimezoneMismatch || !validTargetTz || !mismatchInfo || isAutoDismissed) {
    return null;
  }

  const refDate = now;

  const remoteParts = getTzParts(refDate, validTargetTz);
  const localParts = getTzParts(refDate, systemTimeZone);
  const isRemoteDaytime = remoteParts.hour >= 6 && remoteParts.hour < 18;
  const dayOffset = getDayDiffLabel(remoteParts, localParts, settings.language);

  const timeFormatter = new Intl.DateTimeFormat(localeCode === 'fa-IR' ? 'en-US' : localeCode, {
    timeZone: validTargetTz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !settings.use24HourFormat,
  });

  const compactTimeFormatter = new Intl.DateTimeFormat(localeCode === 'fa-IR' ? 'en-US' : localeCode, {
    timeZone: validTargetTz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: !settings.use24HourFormat,
  });

  const dateFormatter = new Intl.DateTimeFormat(localeCode, {
    timeZone: validTargetTz,
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  const tzAbbrParts = new Intl.DateTimeFormat('en-US', {
    timeZone: validTargetTz,
    timeZoneName: 'short',
  }).formatToParts(refDate);
  const tzAbbr = tzAbbrParts.find((p) => p.type === 'timeZoneName')?.value || validTargetTz;

  const absHours = Math.abs(mismatchInfo.diffMins) / 60;
  const diffHoursLabel = Number.isInteger(absHours)
    ? `${absHours} ${copy.hourUnit}`
    : `${absHours.toFixed(1)} ${copy.hourUnit}`;
  const offsetSummary =
    mismatchInfo.diffMins > 0
      ? copy.faster(diffHoursLabel)
      : mismatchInfo.diffMins < 0
      ? copy.slower(diffHoursLabel)
      : copy.sameOffset;

  const cleanCityName = location.name.replace(/市$/, '');
  const titleWithSuffix = cleanCityName;

  if (isCollapsed) {
    return (
      <div
        className={`fixed ${
          isRtl ? 'right-2 sm:right-3' : 'left-2 sm:left-3'
        } top-[max(56px,calc(env(safe-area-inset-top)+52px))] sm:top-[max(70px,calc(env(safe-area-inset-top)+62px))] z-30 animate-fade-in`}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          title={titleWithSuffix}
          className="group flex items-center gap-1.5 ps-2 pe-1.5 py-1.5 rounded-xl bg-white/90 dark:bg-neutral-900/90 [.amoled-mode_&]:bg-neutral-950/92 backdrop-blur-2xl border border-white/80 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.13)] hover:border-blue-400/60 transition-all active:scale-95 cursor-pointer"
        >
          <span className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${isRemoteDaytime ? 'bg-amber-500/15 text-amber-500' : 'bg-indigo-500/15 text-indigo-400'}`}>
            {isRemoteDaytime ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          </span>
          <div className="text-start leading-none">
            <div className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300 max-w-[74px] truncate">
              {cleanCityName}
            </div>
            <div className="text-[11px] font-extrabold font-mono tabular-nums text-neutral-950 dark:text-white mt-0.5">
              {compactTimeFormatter.format(now)}
            </div>
          </div>
          {isRtl ? (
            <ChevronLeft className="w-3 h-3 text-neutral-400 group-hover:text-blue-500 transition-colors" />
          ) : (
            <ChevronRight className="w-3 h-3 text-neutral-400 group-hover:text-blue-500 transition-colors" />
          )}
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label={titleWithSuffix}
      className={`fixed ${
        isRtl ? 'right-2 sm:right-3' : 'left-2 sm:left-3'
      } top-[max(56px,calc(env(safe-area-inset-top)+52px))] sm:top-[max(70px,calc(env(safe-area-inset-top)+62px))] z-30 w-[184px] sm:w-[202px] rounded-2xl bg-white/90 dark:bg-neutral-900/90 [.amoled-mode_&]:bg-neutral-950/94 backdrop-blur-2xl border border-white/85 dark:border-white/12 shadow-[0_12px_30px_rgba(0,0,0,0.14)] p-2 sm:p-2.5 space-y-1.5 select-none animate-fade-in`}
    >
      {/* Top Bar: Location Title + World Clock Shortcut + Collapse */}
      <div className="flex items-center justify-between gap-1">
        <div className="min-w-0 flex items-center gap-1.5">
          <span
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              isRemoteDaytime
                ? 'bg-amber-500/12 text-amber-500 border border-amber-500/20'
                : 'bg-indigo-500/12 text-indigo-400 border border-indigo-500/20'
            }`}
          >
            {isRemoteDaytime ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          </span>
          <div className="min-w-0 leading-tight">
            <h3 className="text-[12px] font-extrabold text-neutral-950 dark:text-white tracking-tight truncate">
              {titleWithSuffix}
            </h3>
            <div className="text-[9.5px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
              {location.country ? `${location.country} · ` : ''}
              {tzAbbr}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenWorldClock(location.name)}
            title={copy.worldClockBtn}
            aria-label={copy.worldClockBtn}
            className="w-6 h-6 rounded-md bg-neutral-100/90 dark:bg-white/[0.08] hover:bg-blue-500/15 text-neutral-500 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Globe2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse timezone sidebar"
            className="w-6 h-6 rounded-md bg-neutral-100/90 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/15 text-neutral-500 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            {isRtl ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Live Remote Clock Hero */}
      <div className="rounded-xl bg-neutral-100/80 dark:bg-white/[0.05] border border-neutral-200/70 dark:border-white/8 px-2 py-1.5 space-y-0.5">
        <div className="flex items-baseline justify-between gap-1.5">
          <span className="text-base sm:text-lg font-extrabold font-mono tabular-nums tracking-tight text-neutral-950 dark:text-white leading-none">
            {timeFormatter.format(refDate)}
          </span>
          <span
            className={`px-1.5 py-[1px] rounded text-[9.5px] font-bold shrink-0 leading-tight ${
              dayOffset.isOffsetDay
                ? 'bg-blue-500/12 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                : 'bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            {dayOffset.text}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[9.5px] text-neutral-500 dark:text-neutral-400">
          <span className="truncate font-medium">{dateFormatter.format(refDate)}</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0">
            {offsetSummary}
          </span>
        </div>
      </div>
    </aside>
  );
};
