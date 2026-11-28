import { Language } from '../types/calendar';
import { WeatherLocation } from '../types/weather';
import { getChineseHolidayDay, fetchChineseHolidaysOnline } from './holidayCn';
import { getLunarInfo } from './lunarCalendar';
import { fetchWithTimeout } from './network';

export type HolidayRegionCode = 'CN' | 'TW' | 'US' | 'JP' | 'KR' | 'FR' | 'GB' | 'RU' | 'IR' | 'MN';

export interface ParsedHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  localName: string;
  region: HolidayRegionCode;
  isStatutory: boolean;
  isOffDay: boolean; // true = holiday/rest day, false = adjusted workday (e.g. CN 班)
  source: 'online' | 'rule';
}

const REGIONAL_HOLIDAY_CACHE_PREFIX = 'regional_holidays_parsed_v1_';

/**
 * Resolves the active holiday region from device geolocation first, falling back to system language.
 */
export function resolveHolidayRegion(
  location?: WeatherLocation | null,
  language: Language = 'zh-CN'
): HolidayRegionCode {
  const countryRaw = `${location?.country || ''} ${location?.name || ''}`.toLowerCase();

  if (countryRaw) {
    if (/taiwan|台北|臺北|高雄|台中|臺中|新北/.test(countryRaw)) return 'TW';
    if (/china|中国|北京|上海|广州|深圳|成都|杭州|南京|武汉|西安|重庆|苏州|天津|hong kong|macau/.test(countryRaw)) {
      return 'CN';
    }
    if (/united states|usa|america|new york|san francisco|los angeles|chicago|seattle|美国/.test(countryRaw)) {
      return 'US';
    }
    if (/japan|tokyo|osaka|kyoto|日本|东京|大阪/.test(countryRaw)) return 'JP';
    if (/korea|seoul|busan|韩国|首尔/.test(countryRaw)) return 'KR';
    if (/france|paris|lyon|法国|巴黎/.test(countryRaw)) return 'FR';
    if (/united kingdom|uk|britain|england|london|manchester|英国|伦敦/.test(countryRaw)) return 'GB';
    if (/russia|moscow|saint petersburg|俄罗斯|莫斯科/.test(countryRaw)) return 'RU';
    if (/iran|tehran|伊朗/.test(countryRaw)) return 'IR';
    if (/mongolia|ulaanbaatar|蒙古/.test(countryRaw)) return 'MN';
  }

  switch (language) {
    case 'zh-CN':
    case 'ug':
      return 'CN';
    case 'zh-TW':
      return 'TW';
    case 'ja':
      return 'JP';
    case 'ko':
      return 'KR';
    case 'fr':
      return 'FR';
    case 'ru':
      return 'RU';
    case 'fa':
      return 'IR';
    case 'mn':
      return 'MN';
    case 'en':
    default:
      return 'US';
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function nthWeekdayOfMonth(year: number, monthIndex0: number, weekday0: number, nth: number): string {
  const first = new Date(year, monthIndex0, 1);
  const offset = (weekday0 - first.getDay() + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return `${year}-${pad2(monthIndex0 + 1)}-${pad2(day)}`;
}

function lastWeekdayOfMonth(year: number, monthIndex0: number, weekday0: number): string {
  const last = new Date(year, monthIndex0 + 1, 0);
  const offset = (last.getDay() - weekday0 + 7) % 7;
  const day = last.getDate() - offset;
  return `${year}-${pad2(monthIndex0 + 1)}-${pad2(day)}`;
}

/**
 * Parses Nager.Date or NateScarlet holiday JSON payloads into unified ParsedHoliday records.
 */
export function parseHolidayFeed(
  payload: unknown,
  region: HolidayRegionCode
): ParsedHoliday[] {
  if (!payload) return [];

  // NateScarlet holiday-cn format: { days: [{ name, date, isOffDay }] }
  if (typeof payload === 'object' && !Array.isArray(payload) && Array.isArray((payload as { days?: unknown[] }).days)) {
    return ((payload as { days: { name?: string; date?: string; isOffDay?: boolean }[] }).days)
      .filter((d) => typeof d.date === 'string' && typeof d.name === 'string')
      .map((d) => ({
        date: d.date!,
        name: d.name!,
        localName: d.name!,
        region: 'CN',
        isStatutory: true,
        isOffDay: Boolean(d.isOffDay),
        source: 'online',
      }));
  }

  // Nager.Date format: [{ date, localName, name, global, types }]
  if (Array.isArray(payload)) {
    return payload
      .filter((item) => item && typeof item.date === 'string' && (item.localName || item.name))
      .map((item) => ({
        date: item.date,
        name: String(item.name || item.localName),
        localName: String(item.localName || item.name),
        region,
        isStatutory: true,
        isOffDay: true,
        source: 'online',
      }));
  }

  return [];
}

function getBuiltinRegionalHolidays(
  year: number,
  region: HolidayRegionCode,
  language: Language
): ParsedHoliday[] {
  const isZh = language === 'zh-CN' || language === 'zh-TW';
  const items: ParsedHoliday[] = [];

  const push = (date: string, localName: string, enName: string, isStatutory = true, isOffDay = true) => {
    items.push({
      date,
      name: isZh ? localName : enName,
      localName: isZh ? localName : localName || enName,
      region,
      isStatutory,
      isOffDay,
      source: 'rule',
    });
  };

  if (region === 'CN' || region === 'TW') {
    push(`${year}-01-01`, '元旦', "New Year's Day", true, true);
    if (region === 'CN') {
      push(`${year}-05-01`, '劳动节', 'Labor Day', true, true);
      push(`${year}-10-01`, '国庆节', 'National Day', true, true);
      push(`${year}-10-02`, '国庆节假期', 'National Day Holiday', true, true);
      push(`${year}-10-03`, '国庆节假期', 'National Day Holiday', true, true);
    } else {
      push(`${year}-02-28`, '和平纪念日', 'Peace Memorial Day', true, true);
      push(`${year}-04-04`, '兒童節', "Children's Day", true, true);
      push(`${year}-10-10`, '雙十節', 'National Day', true, true);
    }

    // Lunar statutory festivals via lunar calendar lookup across the target year
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const lunar = getLunarInfo(d);
      const ds = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      if (lunar.lunarFestival === '春节') push(ds, '春节', 'Spring Festival', true, true);
      else if (lunar.lunarFestival === '除夕') push(ds, '除夕', 'Lunar New Year Eve', true, true);
      else if (lunar.lunarFestival === '清明节' || lunar.solarTerm === '清明') push(ds, '清明节', 'Qingming Festival', true, true);
      else if (lunar.lunarFestival === '端午节') push(ds, '端午节', 'Dragon Boat Festival', true, true);
      else if (lunar.lunarFestival === '中秋节') push(ds, '中秋节', 'Mid-Autumn Festival', true, true);
    }
    return items;
  }

  if (region === 'US') {
    push(`${year}-01-01`, '元旦', "New Year's Day");
    push(nthWeekdayOfMonth(year, 0, 1, 3), '马丁·路德·金纪念日', 'Martin Luther King Jr. Day');
    push(nthWeekdayOfMonth(year, 1, 1, 3), '总统日', "Presidents' Day");
    push(lastWeekdayOfMonth(year, 4, 1), '阵亡将士纪念日', 'Memorial Day');
    push(`${year}-06-19`, '六月节', 'Juneteenth');
    push(`${year}-07-04`, '美国独立日', 'Independence Day');
    push(nthWeekdayOfMonth(year, 8, 1, 1), '美国劳动节', 'Labor Day');
    push(nthWeekdayOfMonth(year, 9, 1, 2), '哥伦布日', 'Columbus Day');
    push(`${year}-11-11`, '退伍军人节', 'Veterans Day');
    push(nthWeekdayOfMonth(year, 10, 4, 4), '感恩节', 'Thanksgiving Day');
    push(`${year}-12-25`, '圣诞节', 'Christmas Day');
    return items;
  }

  if (region === 'JP') {
    push(`${year}-01-01`, '元日', "New Year's Day");
    push(nthWeekdayOfMonth(year, 0, 1, 2), '成人の日', 'Coming of Age Day');
    push(`${year}-02-11`, '建国記念の日', 'National Foundation Day');
    push(`${year}-02-23`, '天皇誕生日', "Emperor's Birthday");
    push(`${year}-04-29`, '昭和の日', 'Showa Day');
    push(`${year}-05-03`, '憲法記念日', 'Constitution Memorial Day');
    push(`${year}-05-04`, 'みどりの日', 'Greenery Day');
    push(`${year}-05-05`, 'こどもの日', "Children's Day");
    push(nthWeekdayOfMonth(year, 6, 1, 3), '海の日', 'Marine Day');
    push(`${year}-08-11`, '山の日', 'Mountain Day');
    push(nthWeekdayOfMonth(year, 8, 1, 3), '敬老の日', 'Respect for the Aged Day');
    push(nthWeekdayOfMonth(year, 9, 1, 2), 'スポーツの日', 'Sports Day');
    push(`${year}-11-03`, '文化の日', 'Culture Day');
    push(`${year}-11-23`, '勤労感謝の日', 'Labor Thanksgiving Day');
    return items;
  }

  if (region === 'KR') {
    push(`${year}-01-01`, '신정', "New Year's Day");
    push(`${year}-03-01`, '삼일절', 'Independence Movement Day');
    push(`${year}-05-05`, '어린이날', "Children's Day");
    push(`${year}-06-06`, '현충일', 'Memorial Day');
    push(`${year}-08-15`, '광복절', 'Liberation Day');
    push(`${year}-10-03`, '개천절', 'National Foundation Day');
    push(`${year}-10-09`, '한글날', 'Hangul Day');
    push(`${year}-12-25`, '크리스마스', 'Christmas Day');
    return items;
  }

  if (region === 'FR') {
    push(`${year}-01-01`, "Jour de l'an", "New Year's Day");
    push(`${year}-05-01`, 'Fête du Travail', 'Labor Day');
    push(`${year}-05-08`, 'Victoire 1945', 'Victory in Europe Day');
    push(`${year}-07-14`, 'Fête nationale', 'Bastille Day');
    push(`${year}-08-15`, 'Assomption', 'Assumption Day');
    push(`${year}-11-01`, 'Toussaint', "All Saints' Day");
    push(`${year}-11-11`, 'Armistice 1918', 'Armistice Day');
    push(`${year}-12-25`, 'Noël', 'Christmas Day');
    return items;
  }

  if (region === 'GB') {
    push(`${year}-01-01`, '元旦', "New Year's Day");
    push(nthWeekdayOfMonth(year, 4, 1, 1), '五月初银行假日', 'Early May Bank Holiday');
    push(lastWeekdayOfMonth(year, 4, 1), '春季银行假日', 'Spring Bank Holiday');
    push(lastWeekdayOfMonth(year, 7, 1), '夏季银行假日', 'Summer Bank Holiday');
    push(`${year}-12-25`, '圣诞节', 'Christmas Day');
    push(`${year}-12-26`, '节礼日', 'Boxing Day');
    return items;
  }

  if (region === 'RU') {
    push(`${year}-01-01`, 'Новый год', "New Year's Day");
    push(`${year}-01-07`, 'Рождество Христово', 'Orthodox Christmas');
    push(`${year}-02-23`, 'День защитника Отечества', 'Defender of the Fatherland Day');
    push(`${year}-03-08`, 'Международный женский день', "International Women's Day");
    push(`${year}-05-01`, 'Праздник Весны и Труда', 'Spring and Labor Day');
    push(`${year}-05-09`, 'День Победы', 'Victory Day');
    push(`${year}-06-12`, 'День России', 'Russia Day');
    push(`${year}-11-04`, 'День народного единства', 'Unity Day');
    return items;
  }

  // Fallback general international holidays
  push(`${year}-01-01`, '元旦', "New Year's Day");
  push(`${year}-05-01`, '劳动节', 'Labor Day');
  push(`${year}-12-25`, '圣诞节', 'Christmas Day');
  return items;
}

export function getCachedRegionalHolidays(year: number, region: HolidayRegionCode): ParsedHoliday[] {
  try {
    const raw = localStorage.getItem(`${REGIONAL_HOLIDAY_CACHE_PREFIX}${region}_${year}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getParsedHolidaysForYear(
  year: number,
  language: Language,
  location?: WeatherLocation | null
): Map<string, ParsedHoliday> {
  const region = resolveHolidayRegion(location, language);
  const map = new Map<string, ParsedHoliday>();

  // 1. Seed with offline regional rules
  getBuiltinRegionalHolidays(year, region, language).forEach((h) => {
    map.set(h.date, h);
  });

  // 2. Overlay cached online feed for that region
  getCachedRegionalHolidays(year, region).forEach((h) => {
    map.set(h.date, h);
  });

  return map;
}

export function getHolidayForDate(
  dateStr: string,
  language: Language,
  location?: WeatherLocation | null,
  enableChineseWorkdays: boolean = true
): ParsedHoliday | null {
  const region = resolveHolidayRegion(location, language);

  // CN statutory feed takes priority when CN is active
  if (region === 'CN' && enableChineseWorkdays) {
    const cnDay = getChineseHolidayDay(dateStr);
    if (cnDay) {
      return {
        date: cnDay.date,
        name: cnDay.name,
        localName: cnDay.name,
        region: 'CN',
        isStatutory: true,
        isOffDay: cnDay.isOffDay,
        source: 'online',
      };
    }
  }

  const year = Number(dateStr.slice(0, 4)) || new Date().getFullYear();
  const map = getParsedHolidaysForYear(year, language, location);
  return map.get(dateStr) || null;
}

export async function syncRegionalHolidaysOnline(
  year: number,
  language: Language,
  location?: WeatherLocation | null,
  offlineMode: boolean = false
): Promise<ParsedHoliday[]> {
  if (offlineMode) return [];
  const region = resolveHolidayRegion(location, language);

  if (region === 'CN') {
    const cnDays = await fetchChineseHolidaysOnline(year);
    const mapped: ParsedHoliday[] = cnDays.map((d) => ({
      date: d.date,
      name: d.name,
      localName: d.name,
      region: 'CN',
      isStatutory: true,
      isOffDay: d.isOffDay,
      source: 'online',
    }));
    if (mapped.length > 0) {
      try {
        localStorage.setItem(`${REGIONAL_HOLIDAY_CACHE_PREFIX}CN_${year}`, JSON.stringify(mapped));
      } catch {}
    }
    return mapped;
  }

  // Supported ISO country codes on Nager.Date public holiday API
  const countryCodeMap: Partial<Record<HolidayRegionCode, string>> = {
    TW: 'TW',
    US: 'US',
    JP: 'JP',
    KR: 'KR',
    FR: 'FR',
    GB: 'GB',
    RU: 'RU',
  };
  const countryCode = countryCodeMap[region];
  if (!countryCode) return [];

  try {
    const res = await fetchWithTimeout(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`,
      { cache: 'no-store' },
      6500
    );
    if (!res.ok) return [];
    const data = await res.json();
    const parsed = parseHolidayFeed(data, region);
    if (parsed.length > 0) {
      try {
        localStorage.setItem(`${REGIONAL_HOLIDAY_CACHE_PREFIX}${region}_${year}`, JSON.stringify(parsed));
        window.dispatchEvent(new CustomEvent('holiday-cn-updated', { detail: { year, region, count: parsed.length } }));
      } catch {}
    }
    return parsed;
  } catch {
    return [];
  }
}
