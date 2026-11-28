import { CalendarEvent, Language } from '../types/calendar';

export function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export interface ISOWeekInfo {
  week: number;
  year: number;
}

/**
 * Computes ISO 8601 week number (1..53) and ISO week-year using UTC dates
 * to guarantee DST-safe, week-year consistent results (Mon=1 .. Sun=7, Week 1 contains Jan 4).
 */
export function getISOWeekInfo(date: Date): ISOWeekInfo {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utc.getUTCDay() || 7; // ISO weekday: Mon=1 .. Sun=7
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum); // Nearest Thursday determines ISO week-year
  const isoYear = utc.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: isoYear };
}

export function getWeekNumber(date: Date, _firstDayOfWeek = 0): number {
  return getISOWeekInfo(date).week;
}

export function formatISOWeekCode(info: ISOWeekInfo): string {
  return `${info.year}-W${String(info.week).padStart(2, '0')}`;
}

export function formatWeekNumber(weekNum: number, lang: Language, isoYear?: number): string {
  if (lang === 'zh-CN') return isoYear ? `${String(isoYear).slice(-2)}第${weekNum}周` : `第${weekNum}周`;
  if (lang === 'zh-TW') return isoYear ? `${String(isoYear).slice(-2)}第${weekNum}週` : `第${weekNum}週`;
  return isoYear ? `${String(isoYear).slice(-2)}-W${String(weekNum).padStart(2, '0')}` : `W${String(weekNum).padStart(2, '0')}`;
}

export function getWeekdayNames(lang: Language, firstDayOfWeek = 0): string[] {
  let names: string[];
  switch (lang) {
    case 'zh-TW':
      names = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
      break;
    case 'zh-CN':
      names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      break;
    case 'ja':
      names = ['日', '月', '火', '水', '木', '金', '土'];
      break;
    case 'ko':
      names = ['일', '월', '화', '수', '목', '금', '토'];
      break;
    case 'fr':
      names = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      break;
    case 'fa':
      names = ['یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه', 'شنبه'];
      break;
    case 'mn':
      names = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];
      break;
    case 'ru':
      names = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      break;
    case 'ug':
      names = ['يەك', 'دۈش', 'سەيش', 'چار', 'پەيش', 'جۈمە', 'شەنبە'];
      break;
    default:
      names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }

  if (firstDayOfWeek === 1) {
    return [...names.slice(1), names[0]];
  }
  return names;
}

function resolveIntlLocale(lang: Language): string {
  switch (lang) {
    case 'zh-CN':
      return 'zh-CN';
    case 'zh-TW':
      return 'zh-TW';
    case 'ja':
      return 'ja-JP';
    case 'ko':
      return 'ko-KR';
    case 'fr':
      return 'fr-FR';
    case 'fa':
      return 'fa-IR';
    case 'mn':
      return 'mn-MN';
    case 'ru':
      return 'ru-RU';
    case 'ug':
      return 'ug-CN';
    default:
      return 'en-US';
  }
}

export function formatMonthYear(d: Date, lang: Language): string {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  if (lang === 'zh-CN') return `${year}年 ${month}月`;
  if (lang === 'zh-TW') return `${year}年 ${month}月`;
  if (lang === 'ja') return `${year}年 ${month}月`;
  if (lang === 'ko') return `${year}년 ${month}월`;
  return d.toLocaleDateString(resolveIntlLocale(lang), { month: 'long', year: 'numeric' });
}

export function formatFullDate(d: Date, lang: Language): string {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = getWeekdayNames(lang, 0);
  const weekday = weekdays[d.getDay()];

  if (lang === 'zh-CN') return `${year}年${month}月${day}日 ${weekday}`;
  if (lang === 'zh-TW') return `${year}年${month}月${day}日 ${weekday}`;
  if (lang === 'ja') return `${year}年${month}月${day}日 (${weekday})`;
  if (lang === 'ko') return `${year}년 ${month}월 ${day}일 (${weekday})`;
  return d.toLocaleDateString(resolveIntlLocale(lang), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTimeDisplay(timeStr?: string, use24h = false): string {
  if (!timeStr) return '';
  if (use24h) return timeStr;
  const [hStr, mStr = '00'] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  if (!Number.isFinite(h)) return timeStr;
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${suffix}`;
}

export function generateMonthGrid(
  year: number,
  month: number,
  firstDayOfWeek = 0
): { date: Date; dateString: string; isCurrentMonth: boolean }[] {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  let leadDays = (startDay - firstDayOfWeek + 7) % 7;

  const cells: { date: Date; dateString: string; isCurrentMonth: boolean }[] = [];

  for (let i = leadDays; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    cells.push({
      date: d,
      dateString: toDateString(d),
      isCurrentMonth: false,
    });
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    cells.push({
      date: d,
      dateString: toDateString(d),
      isCurrentMonth: true,
    });
  }

  const totalCells = cells.length > 35 ? 42 : 35;
  const remaining = totalCells - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    cells.push({
      date: d,
      dateString: toDateString(d),
      isCurrentMonth: false,
    });
  }

  return cells;
}

export function getEventsForDate(events: CalendarEvent[], dateStr: string): CalendarEvent[] {
  const targetParsed = parseDate(dateStr);
  const targetUtcDay = Math.floor(
    Date.UTC(targetParsed.getFullYear(), targetParsed.getMonth(), targetParsed.getDate()) / 86400000
  );

  return events.filter((e) => {
    if (e.isInTrash || e.isWontDo || !e.startDate) return false;
    if (e.kind === 'note' && !e.startTime) return false;

    const rule = e.customRepeatRule;
    const hasCustom = Boolean(rule && rule.interval >= 1);
    const activeRecurrence = hasCustom ? rule!.freq : e.recurrence;

    if (activeRecurrence !== 'none' && e.recurrenceEnd && dateStr > e.recurrenceEnd) {
      return false;
    }

    if (activeRecurrence !== 'none' && dateStr < e.startDate) {
      return false;
    }

    const startParsed = parseDate(e.startDate);
    const startUtcDay = Math.floor(
      Date.UTC(startParsed.getFullYear(), startParsed.getMonth(), startParsed.getDate()) / 86400000
    );
    const daysDiff = targetUtcDay - startUtcDay;
    const interval = Math.max(1, rule?.interval || 1);

    if (activeRecurrence === 'daily') {
      return daysDiff >= 0 && daysDiff % interval === 0;
    }
    if (activeRecurrence === 'weekly') {
      if (daysDiff < 0) return false;
      const targetDay = targetParsed.getDay();
      const weekdays =
        rule?.byWeekday && rule.byWeekday.length > 0 ? rule.byWeekday : [startParsed.getDay()];
      if (!weekdays.includes(targetDay)) return false;
      // Compute Monday/Sunday-aligned week offset from startDate's week
      const startWeekAnchor = startUtcDay - startParsed.getDay();
      const targetWeekAnchor = targetUtcDay - targetDay;
      const weeksDiff = Math.round((targetWeekAnchor - startWeekAnchor) / 7);
      return weeksDiff >= 0 && weeksDiff % interval === 0;
    }
    if (activeRecurrence === 'monthly') {
      if (daysDiff < 0) return false;
      const monthsDiff =
        (targetParsed.getFullYear() - startParsed.getFullYear()) * 12 +
        (targetParsed.getMonth() - startParsed.getMonth());
      return (
        monthsDiff >= 0 &&
        monthsDiff % interval === 0 &&
        targetParsed.getDate() === startParsed.getDate()
      );
    }
    if (activeRecurrence === 'yearly') {
      if (daysDiff < 0) return false;
      const yearsDiff = targetParsed.getFullYear() - startParsed.getFullYear();
      return (
        yearsDiff >= 0 &&
        yearsDiff % interval === 0 &&
        dateStr.slice(5) === e.startDate.slice(5)
      );
    }
    return dateStr >= e.startDate && dateStr <= (e.endDate || e.startDate);
  });
}

export function sortEventsForDay(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return a.title.localeCompare(b.title);
  });
}

export function getHolidaysForYear(year: number, lang: Language): Map<string, string> {
  const map = new Map<string, string>();
  const isZh = lang === 'zh-CN' || lang === 'zh-TW';

  map.set(`${year}-01-01`, isZh ? '元旦' : "New Year's Day");
  map.set(`${year}-02-14`, isZh ? '情人节' : "Valentine's Day");
  map.set(`${year}-03-08`, isZh ? '国际妇女节' : "Women's Day");
  map.set(`${year}-05-01`, isZh ? '劳动节' : 'Labor Day');
  map.set(`${year}-06-01`, isZh ? '国际儿童节' : "Children's Day");
  map.set(`${year}-10-01`, isZh ? '国庆节' : 'National Day');
  map.set(`${year}-12-25`, isZh ? '圣诞节' : 'Christmas Day');

  return map;
}
