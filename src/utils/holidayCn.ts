import { fetchWithTimeout } from './network';

export interface HolidayCnDay {
  name: string;
  date: string; // YYYY-MM-DD
  isOffDay: boolean; // true = 休 (Statutory holiday), false = 班 (Workday overtime)
}

const HOLIDAY_CACHE_KEY_PREFIX = 'statutory_holidays_cache_';

export function getChineseHolidayDay(dateStr: string): HolidayCnDay | null {
  const [y] = dateStr.split('-');
  const raw = localStorage.getItem(`${HOLIDAY_CACHE_KEY_PREFIX}${y}`);
  if (!raw) return null;
  try {
    const list: HolidayCnDay[] = JSON.parse(raw);
    return list.find((item) => item.date === dateStr) || null;
  } catch {
    return null;
  }
}

export async function fetchChineseHolidaysOnline(year: number): Promise<HolidayCnDay[]> {
  const mirrors = [
    `https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${year}.json`,
    `https://fastly.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${year}.json`,
    `https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/${year}.json`,
  ];

  for (const url of mirrors) {
    try {
      const res = await fetchWithTimeout(url, { cache: 'no-store' }, 6500);
      if (!res.ok) continue;
      const data = await res.json();

      if (data && Array.isArray(data.days)) {
        interface RawHolidayCnDay {
          name: string;
          date: string;
          isOffDay?: boolean;
        }
        const days: HolidayCnDay[] = (data.days as RawHolidayCnDay[]).map((d) => ({
          name: d.name,
          date: d.date,
          isOffDay: Boolean(d.isOffDay),
        }));
        localStorage.setItem(`${HOLIDAY_CACHE_KEY_PREFIX}${year}`, JSON.stringify(days));
        window.dispatchEvent(new CustomEvent('holiday-cn-updated', { detail: { year, count: days.length } }));
        return days;
      }
    } catch {}
  }

  console.warn(`Online holiday sync failed for ${year}, fallback to offline rules.`);
  return [];
}

export function autoLoadChineseHolidays(year: number): void {
  const cached = localStorage.getItem(`${HOLIDAY_CACHE_KEY_PREFIX}${year}`);
  if (!cached) {
    fetchChineseHolidaysOnline(year).catch(() => {});
  }
}
