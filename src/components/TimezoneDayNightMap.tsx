import React, { useState, useMemo } from 'react';
import { RotateCcw, Sun, Moon, Clock, Sunrise, Sunset, Compass } from 'lucide-react';
import { CityTimeInfo, ALL_CORE_CITIES } from '../data/worldCities';

import { Language } from '../types/calendar';

interface TimezoneDayNightMapProps {
  baseNow: Date;
  selectedCity: CityTimeInfo;
  onSelectCity: (city: CityTimeInfo) => void;
  isZh: boolean;
  localeCode: string;
  use24HourFormat: boolean;
  language?: Language;
}

function getMapCopy(lang: Language) {
  switch (lang) {
    case 'zh-CN':
      return { live: '实时', liveBadge: '实时', resetTitle: '恢复当前实时时间', scrubLabel: '拖动标尺推演全球昼夜变化', day: '白昼', night: '黑夜' };
    case 'zh-TW':
      return { live: '即時', liveBadge: '即時', resetTitle: '恢復目前即時時間', scrubLabel: '拖動標尺推演全球晝夜變化', day: '白晝', night: '黑夜' };
    case 'ja':
      return { live: 'ライブ', liveBadge: 'LIVE', resetTitle: '現在時刻に戻す', scrubLabel: 'スライダーで世界の昼夜を移動', day: '昼', night: '夜' };
    case 'ko':
      return { live: '실시간', liveBadge: 'LIVE', resetTitle: '현재 시각으로 복원', scrubLabel: '타임라인으로 전 세계 주야간 탐색', day: '낮', night: '밤' };
    case 'fr':
      return { live: 'Direct', liveBadge: 'DIRECT', resetTitle: 'Revenir à l’heure en direct', scrubLabel: 'Faire défiler le cycle jour/nuit', day: 'Jour', night: 'Nuit' };
    case 'ru':
      return { live: 'Эфир', liveBadge: 'LIVE', resetTitle: 'Вернуть текущее время', scrubLabel: 'Прокрутить шкалу дня и ночи', day: 'День', night: 'Ночь' };
    case 'fa':
      return { live: 'زنده', liveBadge: 'زنده', resetTitle: 'بازگشت به زمان زنده', scrubLabel: 'مرور نوار شبانه‌روز جهانی', day: 'روز', night: 'شب' };
    case 'mn':
      return { live: 'Шууд', liveBadge: 'ШУУД', resetTitle: 'Одоогийн цаг руу буцах', scrubLabel: 'Дэлхийн өдөр шөнийн хугацааг гүйлгэх', day: 'Өдөр', night: 'Шөнө' };
    case 'ug':
      return { live: 'نەق', liveBadge: 'نەق', resetTitle: 'نەق ۋاقىتقا قايتىش', scrubLabel: 'دۇنيا كېچە-كۈندۈز سىزىقچىسىنى سىيرىش', day: 'كۈندۈز', night: 'كېچە' };
    default:
      return { live: 'Live', liveBadge: 'LIVE', resetTitle: 'Reset to live time', scrubLabel: 'Scrub global day/night timeline', day: 'Day', night: 'Night' };
  }
}

// Pacific-centered equirectangular projection (lonStart = -24°, Atlantic split keeps all continents intact)
const LON_START = -24;

function projectPacific(lat: number, lng: number): [number, number] {
  let lon = lng;
  while (lon < LON_START) lon += 360;
  while (lon >= LON_START + 360) lon -= 360;
  const x = ((lon - LON_START) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return [x, y];
}

function buildPolygonPath(coords: [number, number][]): string {
  return (
    coords
      .map(([lat, lng], i) => {
        const [x, y] = projectPacific(lat, lng);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ') + ' Z'
  );
}

// High-detail geographic continent & island outlines (lat, lng)
const LANDMASS_POLYGONS: { coords: [number, number][]; kind: 'land' | 'ice' }[] = [
  // Eurasia
  {
    kind: 'land',
    coords: [
      [36, -9], [43, -9], [44, -2], [48, -5], [51, 2], [54, 9], [57, 8], [61, 5],
      [68, 14], [71, 28], [69, 44], [68, 60], [73, 72], [77, 104], [73, 128], [70, 162],
      [66, 179], [60, 165], [55, 161], [52, 141], [43, 134], [39, 128], [35, 129],
      [37, 126], [39, 122], [35, 120], [31, 122], [24, 118], [21, 110], [16, 108],
      [11, 109], [13, 101], [4, 103], [2, 104], [8, 98], [16, 97], [22, 91], [16, 81],
      [8, 78], [15, 74], [23, 69], [25, 62], [26, 56], [24, 52], [29, 48], [23, 59],
      [13, 45], [12, 43], [20, 40], [28, 34], [31, 32], [37, 27], [41, 29], [41, 23],
      [37, 22], [40, 19], [44, 14], [40, 18], [38, 15], [41, 13], [44, 9], [43, 4],
      [39, 0], [36, -5],
    ],
  },
  // Great Britain
  {
    kind: 'land',
    coords: [
      [50.1, -5.5], [52.0, -5.2], [54.6, -3.5], [58.5, -5.0], [58.6, -3.0],
      [56.2, -2.5], [53.6, 0.0], [52.5, 1.7], [51.1, 1.3], [50.7, -1.8],
    ],
  },
  // Ireland
  {
    kind: 'land',
    coords: [
      [51.5, -10.2], [54.2, -9.8], [55.2, -6.5], [53.3, -6.1], [52.1, -6.6],
    ],
  },
  // Japan Archipelago
  {
    kind: 'land',
    coords: [
      [31.2, 130.5], [33.8, 130.8], [35.4, 133.5], [37.5, 137.0], [41.0, 140.4],
      [44.5, 141.6], [43.5, 145.5], [41.8, 143.2], [38.2, 141.5], [35.5, 140.8],
      [34.2, 136.8], [32.8, 132.9],
    ],
  },
  // Taiwan
  {
    kind: 'land',
    coords: [[22.0, 120.7], [24.2, 120.4], [25.2, 121.8], [23.2, 121.5]],
  },
  // Philippines
  {
    kind: 'land',
    coords: [[18.4, 121.2], [14.5, 122.3], [8.5, 126.2], [6.5, 122.2], [14.2, 120.2]],
  },
  // Borneo
  {
    kind: 'land',
    coords: [[6.8, 116.8], [2.2, 118.6], [-3.5, 115.2], [-2.5, 110.2], [3.5, 112.5]],
  },
  // Sumatra & Java
  {
    kind: 'land',
    coords: [[5.4, 95.3], [1.5, 102.5], [-6.2, 105.8], [-8.4, 114.2], [-7.5, 106.2], [-0.5, 99.4]],
  },
  // New Guinea
  {
    kind: 'land',
    coords: [[-1.2, 131.5], [-2.5, 140.8], [-9.5, 149.2], [-8.8, 141.5], [-4.5, 135.2]],
  },
  // Africa
  {
    kind: 'land',
    coords: [
      [35.8, -5.8], [37.0, 10.2], [32.8, 13.2], [31.2, 32.3], [22.0, 36.8],
      [12.5, 43.3], [11.8, 51.2], [2.0, 45.3], [-6.5, 39.2], [-15.2, 40.6],
      [-26.0, 32.8], [-34.0, 25.6], [-34.4, 18.4], [-22.8, 14.4], [-12.5, 13.4],
      [-1.5, 9.2], [4.2, 9.2], [5.4, -2.0], [4.5, -7.8], [11.5, -16.2],
      [15.0, -17.4], [21.5, -17.0], [31.5, -9.8],
    ],
  },
  // Madagascar
  {
    kind: 'land',
    coords: [[-12.0, 49.2], [-16.2, 50.0], [-25.2, 47.0], [-24.5, 43.8], [-16.0, 45.0]],
  },
  // Australia
  {
    kind: 'land',
    coords: [
      [-12.2, 131.0], [-12.2, 136.8], [-15.4, 136.5], [-11.0, 142.4], [-19.5, 147.6],
      [-26.5, 153.2], [-34.0, 151.3], [-38.2, 148.5], [-38.4, 141.2], [-35.0, 137.0],
      [-32.2, 132.5], [-34.0, 122.0], [-34.4, 115.1], [-27.5, 114.0], [-21.5, 115.5],
      [-16.2, 123.5], [-14.2, 129.4],
    ],
  },
  // New Zealand
  {
    kind: 'land',
    coords: [[-34.5, 173.0], [-38.0, 178.4], [-42.2, 174.0], [-46.4, 168.4], [-44.0, 167.5], [-39.0, 174.0]],
  },
  // North America
  {
    kind: 'land',
    coords: [
      [69.0, -165.0], [71.3, -156.5], [70.2, -135.0], [71.5, -110.0], [69.0, -85.0],
      [63.0, -78.0], [58.5, -64.0], [52.0, -55.8], [46.8, -53.0], [44.8, -66.5],
      [42.0, -70.0], [40.5, -74.0], [35.2, -75.6], [29.8, -81.2], [25.2, -80.3],
      [29.5, -83.4], [29.8, -89.5], [26.2, -97.2], [21.0, -97.3], [21.4, -87.0],
      [15.8, -83.8], [9.5, -83.0], [8.2, -77.6], [14.5, -92.2], [19.2, -104.5],
      [24.5, -107.6], [31.5, -113.8], [23.2, -109.8], [32.5, -117.1], [37.8, -122.5],
      [48.4, -124.7], [56.2, -134.5], [60.2, -148.0], [55.4, -161.5], [61.0, -165.5],
      [65.6, -168.0],
    ],
  },
  // Cuba / Caribbean
  {
    kind: 'land',
    coords: [[22.4, -84.2], [23.0, -80.2], [20.2, -74.2], [19.8, -77.6]],
  },
  // South America
  {
    kind: 'land',
    coords: [
      [11.0, -75.0], [10.4, -62.2], [5.8, -52.4], [0.0, -49.5], [-5.5, -35.0],
      [-13.0, -38.5], [-23.0, -42.2], [-32.5, -52.2], [-40.5, -62.5], [-52.2, -68.4],
      [-55.2, -67.2], [-51.0, -74.8], [-41.5, -74.0], [-30.0, -71.4], [-18.4, -70.6],
      [-12.0, -77.2], [-4.8, -81.3], [2.0, -79.8], [8.5, -77.4],
    ],
  },
  // Greenland (kept inside lng <= -24.5 so intact on top-right)
  {
    kind: 'ice',
    coords: [
      [82.5, -36.0], [81.0, -25.0], [72.5, -24.8], [65.8, -36.5], [60.0, -44.0],
      [66.2, -53.2], [75.0, -58.5], [78.5, -70.5], [82.0, -54.0],
    ],
  },
  // Antarctica Polar Shelf
  {
    kind: 'ice',
    coords: [
      [-67.0, -23.9], [-69.5, 10.0], [-68.0, 55.0], [-66.5, 95.0], [-67.0, 140.0],
      [-72.0, 172.0], [-74.0, -145.0], [-72.5, -100.0], [-64.0, -61.0],
      [-74.5, -45.0], [-70.0, -24.1], [-89.9, -24.1], [-89.9, -23.9],
    ],
  },
];

// Nighttime urban light clusters (lat, lng, radius/glow)
const NIGHT_CITY_LIGHTS: [number, number, number][] = [
  [51.5, -0.1, 2.2], [48.8, 2.3, 2.1], [52.5, 13.4, 2.0], [50.8, 4.3, 1.8],
  [45.4, 9.2, 1.9], [41.9, 12.5, 1.7], [40.4, -3.7, 1.9], [55.7, 37.6, 2.3],
  [59.9, 30.3, 1.7], [41.0, 29.0, 1.9], [30.0, 31.2, 2.2], [25.2, 55.3, 2.1],
  [24.7, 46.7, 1.8], [35.7, 51.4, 1.9], [28.6, 77.2, 2.3], [19.1, 72.9, 2.2],
  [12.9, 77.6, 1.8], [22.6, 88.4, 1.9], [31.5, 74.3, 1.8], [39.9, 116.4, 2.5],
  [39.1, 117.2, 1.9], [31.2, 121.5, 2.5], [32.1, 118.8, 1.8], [30.6, 104.1, 2.0],
  [23.1, 113.3, 2.4], [22.3, 114.2, 2.2], [25.0, 121.5, 2.0], [37.5, 127.0, 2.3],
  [35.7, 139.7, 2.6], [34.7, 135.5, 2.1], [13.7, 100.5, 2.0], [1.3, 103.8, 2.1],
  [-6.2, 106.8, 2.0], [14.6, 121.0, 1.8], [-33.9, 151.2, 2.1], [-37.8, 144.9, 1.9],
  [-26.2, 28.0, 1.8], [6.5, 3.4, 1.8], [40.7, -74.0, 2.6], [42.3, -71.0, 1.9],
  [41.9, -87.6, 2.2], [43.6, -79.4, 2.0], [38.9, -77.0, 1.9], [33.7, -84.4, 1.8],
  [25.7, -80.2, 1.9], [29.7, -95.3, 2.0], [32.8, -96.8, 1.9], [34.0, -118.2, 2.5],
  [37.8, -122.4, 2.1], [47.6, -122.3, 1.7], [19.4, -99.1, 2.2], [-23.5, -46.6, 2.3],
  [-22.9, -43.2, 1.9], [-34.6, -58.4, 2.1], [-12.0, -77.0, 1.6], [4.7, -74.1, 1.7],
];

// Featured 5 top clock strip cities matching the reference screenshot layout
const TOP_FIVE_CITIES: {
  id: string;
  zhLabel: string;
  enLabel: string;
  timeZone: string;
  lat: number;
  lng: number;
  utcOffset: number;
}[] = [
  { id: 'beijing', zhLabel: '北京', enLabel: 'Beijing', timeZone: 'Asia/Shanghai', lat: 39.9, lng: 116.4, utcOffset: 8 },
  { id: 'newyork', zhLabel: 'New York', enLabel: 'New York', timeZone: 'America/New_York', lat: 40.71, lng: -74.0, utcOffset: -5 },
  { id: 'london', zhLabel: 'London', enLabel: 'London', timeZone: 'Europe/London', lat: 51.5, lng: -0.12, utcOffset: 0 },
  { id: 'tokyo', zhLabel: 'Tokyo', enLabel: 'Tokyo', timeZone: 'Asia/Tokyo', lat: 35.68, lng: 139.69, utcOffset: 9 },
  { id: 'sydney', zhLabel: 'Sydney', enLabel: 'Sydney', timeZone: 'Australia/Sydney', lat: -33.86, lng: 151.2, utcOffset: 11 },
];

// Additional map pin for Taipei so Taiwan is also marked on map
const MAP_PIN_CITIES: (CityTimeInfo & { priorityLabel?: boolean })[] = [
  ...ALL_CORE_CITIES,
  {
    id: 'taipei',
    flag: '🇹🇼',
    nameZh: '中国台北',
    nameEn: 'Taipei, China',
    shortNameZh: 'Taipei',
    shortNameEn: 'Taipei',
    countryZh: '中国',
    countryEn: 'China',
    timeZone: 'Asia/Taipei',
    utcOffset: 8,
    lat: 25.03,
    lng: 121.56,
    isPopular: true,
  },
];

function getSolarGeometry(date: Date) {
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const dayOfYear = Math.max(
    1,
    Math.min(366, Math.floor((date.getTime() - startOfYear.getTime()) / 86400000))
  );
  // Solar declination in degrees
  const decDeg = 23.44 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
  const decRad = (decDeg * Math.PI) / 180;

  // Subsolar longitude in [-180, 180]
  const utcHours =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  let subsolarLng = (12 - utcHours) * 15;
  while (subsolarLng > 180) subsolarLng -= 360;
  while (subsolarLng < -180) subsolarLng += 360;

  return { decDeg, decRad, subsolarLng, dayOfYear };
}

function isPointInDaylight(lat: number, lng: number, decRad: number, subsolarLng: number): boolean {
  const latRad = (lat * Math.PI) / 180;
  const dLngRad = ((lng - subsolarLng) * Math.PI) / 180;
  const sinAlt =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(dLngRad);
  return sinAlt >= -0.015; // Include civil twilight rim
}

function buildNightMaskPath(decRad: number, subsolarLng: number): string {
  const tanDec = Math.tan(decRad);
  const safeTanDec = Math.abs(tanDec) < 0.008 ? (tanDec >= 0 ? 0.008 : -0.008) : tanDec;

  const points: string[] = [];
  const steps = 180;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 1000;
    const lng = LON_START + (i / steps) * 360;
    const dLngRad = ((lng - subsolarLng) * Math.PI) / 180;
    const latTermRad = Math.atan(-Math.cos(dLngRad) / safeTanDec);
    const latTermDeg = (latTermRad * 180) / Math.PI;
    const y = ((90 - latTermDeg) / 180) * 500;
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }

  // Close on the dark hemisphere pole:
  // If decRad > 0 (Northern summer), South Pole is in darkness (close at y = 520)
  // If decRad < 0 (Northern winter), North Pole is in darkness (close at y = -20)
  const darkEdgeY = decRad >= 0 ? 520 : -20;
  points.push(`L1015,${darkEdgeY} L-15,${darkEdgeY} Z`);
  return points.join(' ');
}

export const TimezoneDayNightMap: React.FC<TimezoneDayNightMapProps> = ({
  baseNow,
  selectedCity,
  onSelectCity,
  isZh,
  localeCode,
  use24HourFormat,
  language,
}) => {
  const effectiveLang: Language = language || (isZh ? 'zh-CN' : 'en');
  const mapCopy = useMemo(() => getMapCopy(effectiveLang), [effectiveLang]);
  // Interactive offset scrubber in minutes (-720 to +720)
  const [scrubMinutes, setScrubMinutes] = useState(0);

  const effectiveDate = useMemo(
    () => new Date(baseNow.getTime() + scrubMinutes * 60000),
    [baseNow, scrubMinutes]
  );

  const solar = useMemo(() => getSolarGeometry(effectiveDate), [effectiveDate]);

  const nightPath = useMemo(
    () => buildNightMaskPath(solar.decRad, solar.subsolarLng),
    [solar.decRad, solar.subsolarLng]
  );

  const continentPaths = useMemo(
    () => LANDMASS_POLYGONS.map((p) => ({ d: buildPolygonPath(p.coords), kind: p.kind })),
    []
  );

  const headerDateStr = useMemo(() => {
    if (isZh) {
      const parts = new Intl.DateTimeFormat('zh-CN', {
        timeZone: selectedCity.timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'long',
      }).formatToParts(effectiveDate);
      const map: Record<string, string> = {};
      parts.forEach((p) => (map[p.type] = p.value));
      return `${map.year || ''}年${map.month || ''}月${map.day || ''}日 ${map.weekday || ''}`;
    }
    return effectiveDate.toLocaleDateString(localeCode, {
      timeZone: selectedCity.timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'long',
    });
  }, [effectiveDate, selectedCity.timeZone, isZh, localeCode]);

  const formatCardParts = (timeZone: string) => {
    const timeStr = effectiveDate.toLocaleTimeString(
      localeCode === 'fa-IR' || localeCode === 'ug-CN' ? 'en-GB' : localeCode,
      {
        timeZone,
        hour12: !use24HourFormat,
        hour: 'numeric',
        minute: '2-digit',
      }
    );
    const weekday = effectiveDate.toLocaleDateString(isZh ? 'zh-CN' : localeCode, {
      timeZone,
      weekday: isZh ? 'long' : 'short',
    });
    return { timeStr, weekday };
  };

  // Selected city solar telemetry
  const selectedIsDay = isPointInDaylight(
    selectedCity.lat,
    selectedCity.lng,
    solar.decRad,
    solar.subsolarLng
  );
  const selectedClock = formatCardParts(selectedCity.timeZone);
  const latRad = (selectedCity.lat * Math.PI) / 180;
  const cosH = Math.max(-1, Math.min(1, -Math.tan(latRad) * Math.tan(solar.decRad) || 0));
  const daylightHours = (2 * Math.acos(cosH) * 180) / Math.PI / 15;
  const sunriseDec = Math.max(0, Math.min(24, 12 - daylightHours / 2));
  const sunsetDec = Math.max(0, Math.min(24, 12 + daylightHours / 2));
  const sunriseStr = `${String(Math.floor(sunriseDec)).padStart(2, '0')}:${String(Math.floor((sunriseDec % 1) * 60)).padStart(2, '0')}`;
  const sunsetStr = `${String(Math.floor(sunsetDec)).padStart(2, '0')}:${String(Math.floor((sunsetDec % 1) * 60)).padStart(2, '0')}`;

  // Slider indicator position percentage (0..100%)
  const markerPct = ((scrubMinutes + 720) / 1440) * 100;

  return (
    <div className="rounded-3xl overflow-hidden bg-[#060926] border border-indigo-400/20 shadow-[0_20px_60px_rgba(0,0,0,0.75)] flex flex-col">
      {/* 1. Reference-Matched Midnight Top Banner + 5 Day/Night Flip-Clock Cards */}
      <div className="bg-gradient-to-b from-[#070B2B] to-[#0B1038] px-2.5 sm:px-5 pt-3 pb-2.5 border-b border-white/10">
        {/* Top Centered Date Banner */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="w-16 hidden sm:block" />
          <div className="text-center flex-1 text-xs sm:text-sm font-bold tracking-wide text-slate-100 tabular-nums">
            {headerDateStr}
          </div>
          <div className="flex items-center justify-end w-16 shrink-0">
            {scrubMinutes !== 0 ? (
              <button
                type="button"
                onClick={() => setScrubMinutes(0)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-[10px] font-bold text-rose-200 cursor-pointer transition-colors"
                title={mapCopy.resetTitle}
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>{mapCopy.live}</span>
              </button>
            ) : (
              <span className="text-[10px] font-mono text-emerald-400/90 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {mapCopy.liveBadge}
              </span>
            )}
          </div>
        </div>

        {/* 5 City Day/Night Flip Cards */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
          {TOP_FIVE_CITIES.map((item) => {
            const { timeStr, weekday } = formatCardParts(item.timeZone);
            const isDay = isPointInDaylight(item.lat, item.lng, solar.decRad, solar.subsolarLng);
            const matchedCity =
              ALL_CORE_CITIES.find((c) => c.id === item.id) || selectedCity;
            const isSelected = selectedCity.id === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectCity(matchedCity)}
                className={`rounded-xl sm:rounded-2xl px-1 sm:px-2.5 py-1.5 sm:py-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-[0.97] ${
                  isDay
                    ? 'bg-gradient-to-b from-[#F5F7FA] to-[#DCE2EC] text-[#0F172A] shadow-md border border-white/80'
                    : 'bg-gradient-to-b from-[#2A4C7A] to-[#152B49] text-white shadow-inner border border-sky-300/25'
                } ${isSelected ? 'ring-2 ring-rose-500 ring-offset-1 ring-offset-[#080C2E]' : ''}`}
              >
                <span
                  className={`text-[9px] sm:text-[11px] font-semibold leading-tight truncate max-w-full ${
                    isDay ? 'text-slate-600' : 'text-sky-200/85'
                  }`}
                >
                  {weekday}
                </span>
                <span className="text-[13px] sm:text-2xl font-black font-mono tabular-nums tracking-tight leading-none my-0.5 sm:my-1">
                  {timeStr}
                </span>
                <span
                  className={`text-[9.5px] sm:text-xs font-bold leading-tight truncate max-w-full ${
                    isDay ? 'text-slate-800' : 'text-sky-100'
                  }`}
                >
                  {isZh ? item.zhLabel : item.enLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Reference-Matched 24h Millimeter Ruler Scrubber */}
      <div className="relative bg-gradient-to-b from-[#E7ECF3] to-[#CDD5E2] dark:from-[#D8E0EC] dark:to-[#B8C4D6] h-7 sm:h-8 border-y border-slate-500/40 flex items-center select-none px-1">
        {/* Tick Marks Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-75"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, #334155 0px, #334155 1px, transparent 1px, transparent 8px), repeating-linear-gradient(to right, #0f172a 0px, #0f172a 1.5px, transparent 1.5px, transparent 32px)',
            backgroundSize: '100% 45%, 100% 75%',
            backgroundPosition: 'bottom left',
            backgroundRepeat: 'no-repeat',
          }}
        />
        {/* Crimson Active Time Indicator */}
        <div
          className="absolute top-0 bottom-0 w-[2.5px] bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.9)] pointer-events-none transition-[left] duration-75"
          style={{ left: `calc(${markerPct}% - 1px)` }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white -translate-x-[4px] -translate-y-0.5 shadow" />
        </div>

        <input
          type="range"
          min={-720}
          max={720}
          step={15}
          value={scrubMinutes}
          onChange={(e) => setScrubMinutes(Number(e.target.value))}
          aria-label={mapCopy.scrubLabel}
          className="relative z-10 w-full h-full opacity-0 cursor-ew-resize"
        />

        <span className="pointer-events-none absolute left-2 top-0.5 text-[9px] font-mono font-bold text-slate-700">
          -12h
        </span>
        <span className="pointer-events-none absolute right-2 top-0.5 text-[9px] font-mono font-bold text-slate-700">
          +12h
        </span>
        {scrubMinutes !== 0 && (
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0.5 px-1.5 rounded bg-rose-600 text-white text-[9px] font-mono font-bold">
            {scrubMinutes > 0 ? '+' : ''}
            {(scrubMinutes / 60).toFixed(1).replace(/\.0$/, '')}h
          </span>
        )}
      </div>

      {/* 3. Pacific-Centered Day/Night World Map with Solar Terminator & City Lights */}
      <div className="relative w-full aspect-[2/1] bg-[#040B24] overflow-hidden">
        <svg viewBox="0 0 1000 500" className="w-full h-full block">
          <defs>
            {/* Lit Ocean Gradient */}
            <linearGradient id="dayOceanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#266CA3" />
              <stop offset="45%" stopColor="#165387" />
              <stop offset="100%" stopColor="#0E3B66" />
            </linearGradient>

            {/* Lit Continent Terrain Gradient */}
            <linearGradient id="dayLandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#657D4D" />
              <stop offset="45%" stopColor="#4F7942" />
              <stop offset="72%" stopColor="#8A7E50" />
              <stop offset="100%" stopColor="#5D7E4E" />
            </linearGradient>

            {/* Night Ocean Gradient */}
            <linearGradient id="nightOceanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#060B24" />
              <stop offset="100%" stopColor="#030718" />
            </linearGradient>

            {/* Soft Feathered Solar Terminator Filter */}
            <filter id="terminatorFeather" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="11" />
            </filter>

            <radialGradient id="cityLightGlow">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
              <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>

            <mask id="solarNightMask">
              <rect x="-20" y="-20" width="1040" height="540" fill="#000000" />
              <path d={nightPath} fill="#ffffff" filter="url(#terminatorFeather)" />
            </mask>
          </defs>

          {/* DAYLIGHT EARTH LAYER */}
          <g>
            <rect width="1000" height="500" fill="url(#dayOceanGrad)" />
            {/* Subtle Latitude / Longitude Graticule */}
            {[-60, -30, 0, 30, 60].map((lat) => {
              const y = ((90 - lat) / 180) * 500;
              return (
                <line
                  key={`lat_${lat}`}
                  x1={0}
                  y1={y}
                  x2={1000}
                  y2={y}
                  stroke={lat === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'}
                  strokeDasharray={lat === 0 ? undefined : '3,3'}
                />
              );
            })}
            {Array.from({ length: 12 }).map((_, idx) => {
              const x = (idx / 12) * 1000;
              return (
                <line
                  key={`lon_${idx}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={500}
                  stroke="rgba(255,255,255,0.05)"
                />
              );
            })}

            {/* Day Continents & Polar Ice */}
            {continentPaths.map((poly, idx) => (
              <path
                key={`day_land_${idx}`}
                d={poly.d}
                fill={poly.kind === 'ice' ? '#E2EAF4' : 'url(#dayLandGrad)'}
                stroke={poly.kind === 'ice' ? 'rgba(255,255,255,0.5)' : 'rgba(195,220,175,0.28)'}
                strokeWidth="0.8"
              />
            ))}
          </g>

          {/* NIGHTTIME BLACK MARBLE OVERLAY (Masked by Feathered Solar Terminator) */}
          <g mask="url(#solarNightMask)">
            <rect width="1000" height="500" fill="url(#nightOceanGrad)" />
            {continentPaths.map((poly, idx) => (
              <path
                key={`night_land_${idx}`}
                d={poly.d}
                fill={poly.kind === 'ice' ? '#1A2442' : '#0E152E'}
                stroke="rgba(100,130,210,0.2)"
                strokeWidth="0.7"
              />
            ))}
            {/* Warm Golden Night City Lights */}
            {NIGHT_CITY_LIGHTS.map(([lat, lng, radius], idx) => {
              const [cx, cy] = projectPacific(lat, lng);
              return (
                <g key={`light_${idx}`}>
                  <circle cx={cx} cy={cy} r={radius * 3.8} fill="url(#cityLightGlow)" opacity="0.65" />
                  <circle cx={cx} cy={cy} r={radius * 0.65} fill="#FEF3C7" opacity="0.95" />
                </g>
              );
            })}
          </g>

          {/* CLICKABLE RED TARGET CITY MARKERS */}
          {MAP_PIN_CITIES.map((city) => {
            const [cx, cy] = projectPacific(city.lat, city.lng);
            const isSelected = selectedCity.id === city.id;
            const isTopFive = TOP_FIVE_CITIES.some((t) => t.id === city.id) || city.id === 'taipei';
            const labelText = isZh
              ? city.id === 'beijing'
                ? '北京'
                : city.id === 'taipei'
                ? 'Taipei'
                : city.shortNameEn
              : city.shortNameEn;

            // Smart label offsets so Beijing/Taipei/Tokyo never collide
            const dx =
              city.id === 'beijing'
                ? -10
                : city.id === 'taipei'
                ? -8
                : city.id === 'hongkong'
                ? -8
                : city.id === 'sanfrancisco'
                ? -8
                : 0;
            const dy =
              city.id === 'taipei'
                ? 15
                : city.id === 'tokyo'
                ? 15
                : city.id === 'beijing'
                ? -11
                : 15;

            return (
              <g
                key={city.id}
                onClick={() => onSelectCity(city)}
                className="cursor-pointer group"
              >
                {/* Invisible generous hit target */}
                <circle cx={cx} cy={cy} r={14} fill="transparent" />

                {/* Selected Pulse Ring */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={13}
                    fill="rgba(239,68,68,0.22)"
                    stroke="#F87171"
                    strokeWidth="1.2"
                  />
                )}

                {/* Concentric Red Target Ring (Matches Screenshot ◎) */}
                {(isTopFive || isSelected) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 7.5 : 5.8}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1.1"
                    opacity={isSelected ? '1' : '0.85'}
                  />
                )}

                {/* Pin Core */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 3.5 : isTopFive ? 2.8 : 2.1}
                  fill="#EF4444"
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? '1.1' : '0.6'}
                />

                {/* City Name Label */}
                {(isTopFive || isSelected) && (
                  <text
                    x={cx + dx}
                    y={cy + dy}
                    textAnchor="middle"
                    fill={isSelected ? '#FCA5A5' : '#EF4444'}
                    stroke="#04081A"
                    strokeWidth="2.8"
                    paintOrder="stroke"
                    fontSize={isSelected ? '13' : '11.5'}
                    fontWeight="800"
                    fontFamily="sans-serif"
                  >
                    {labelText}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 4. Selected City Telemetry Footer Strip */}
      <div className="bg-[#080E2F] px-3.5 sm:px-5 py-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base shrink-0">{selectedCity.flag}</span>
          <span className="font-bold text-white truncate">
            {isZh ? selectedCity.nameZh : selectedCity.nameEn}
          </span>
          <span className="text-[11px] font-mono text-sky-300 font-semibold">
            UTC{selectedCity.utcOffset >= 0 ? '+' : ''}
            {selectedCity.utcOffset}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              selectedIsDay
                ? 'bg-amber-400/20 text-amber-200 border border-amber-400/35'
                : 'bg-indigo-400/20 text-indigo-200 border border-indigo-400/35'
            }`}
          >
            {selectedIsDay ? <Sun className="w-2.5 h-2.5" /> : <Moon className="w-2.5 h-2.5" />}
            <span>{selectedIsDay ? mapCopy.day : mapCopy.night}</span>
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-mono tabular-nums text-slate-300">
          <span className="inline-flex items-center gap-1 text-white font-bold">
            <Clock className="w-3 h-3 text-sky-400" />
            {selectedClock.weekday} {selectedClock.timeStr}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-amber-300">
            <Sunrise className="w-3 h-3" />
            {sunriseStr}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-orange-300">
            <Sunset className="w-3 h-3" />
            {sunsetStr}
          </span>
          <span className="inline-flex items-center gap-1 text-indigo-300">
            <Compass className="w-3 h-3" />
            {Math.floor(daylightHours)}h{Math.round((daylightHours % 1) * 60)}m
          </span>
        </div>
      </div>
    </div>
  );
};
