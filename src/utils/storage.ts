import { CalendarEvent, EventCategory, AppSettings, Language } from '../types/calendar';
import { detectSystemLanguage } from './i18n';

const STORAGE_KEYS = {
  EVENTS: 'smart_calendar_events_v2',
  CATEGORIES: 'smart_calendar_categories_v2',
  SETTINGS: 'smart_calendar_settings_v2',
  LAST_BACKUP_AT: 'smart_calendar_last_backup_at',
  FIRST_SEEN_AT: 'smart_calendar_first_seen_at',
};

export function readStorageJson<T>(key: string, validator?: (val: unknown) => val is T): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (validator && !validator(parsed)) return null;
    return parsed as T;
  } catch {
    return null;
  }
}

export function writeStorageJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const DEFAULT_ACCENT_COLOR = '#F57C00';

export const ACCENT_PALETTES = [
  { name: 'Warm Orange', color: '#F57C00', bgClass: 'bg-orange-500' },
  { name: 'Emerald Green', color: '#059669', bgClass: 'bg-emerald-600' },
  { name: 'Ocean Blue', color: '#2563EB', bgClass: 'bg-blue-600' },
  { name: 'Royal Purple', color: '#7C3AED', bgClass: 'bg-purple-600' },
  { name: 'Rose Red', color: '#E11D48', bgClass: 'bg-rose-600' },
  { name: 'Teal Mint', color: '#0D9488', bgClass: 'bg-teal-600' },
  { name: 'Amber Gold', color: '#D97706', bgClass: 'bg-amber-600' },
  { name: 'Slate Gray', color: '#475569', bgClass: 'bg-slate-600' },
];

export const DEFAULT_CATEGORIES: EventCategory[] = [
  { id: 'cat-personal', name: 'Personal', color: '#2563EB', isDefault: true },
  { id: 'cat-work', name: 'Work', color: '#F57C00', isDefault: true },
  { id: 'cat-family', name: 'Family', color: '#059669', isDefault: true },
  { id: 'cat-health', name: 'Health & Fitness', color: '#E11D48', isDefault: true },
  { id: 'cat-reminder', name: 'Reminders', color: '#7C3AED', isDefault: true },
  { id: 'cat-birthday', name: 'Birthdays', color: '#DB2777', isDefault: true },
];

export function getCategoryDisplayName(cat: EventCategory, lang: Language): string {
  if (!cat.isDefault) return cat.name;
  if (lang === 'zh-CN') {
    switch (cat.id) {
      case 'cat-personal': return '个人与生活';
      case 'cat-work': return '工作与办公';
      case 'cat-family': return '家庭与亲友';
      case 'cat-health': return '运动与健康';
      case 'cat-reminder': return '待办提醒';
      case 'cat-birthday': return '生日纪念';
    }
  }
  if (lang === 'zh-TW') {
    switch (cat.id) {
      case 'cat-personal': return '個人與生活';
      case 'cat-work': return '工作與辦公';
      case 'cat-family': return '家庭與親友';
      case 'cat-health': return '運動與健康';
      case 'cat-reminder': return '待辦提醒';
      case 'cat-birthday': return '生日紀念';
    }
  }
  return cat.name;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: detectSystemLanguage(),
  themeMode: 'system',
  accentColor: DEFAULT_ACCENT_COLOR,
  firstDayOfWeek: 0, // Sunday
  use24HourFormat: false,
  defaultView: 'month',
  enableSoundAlerts: true,
  showHolidays: true,
  tvMode: false,
  enableChineseWorkdays: true,
  autoQueryOnlineHolidays: true,
  showWeekNumbers: true,
  enableHaptics: true,
  offlineMode: false,
  enableHolidayMorningReminder: true,
  enableSystemNotifications: true,
  worldClockMode: 'flip',
  calendarPageLayout: 'split',
  bgImagePosition: 'bottom',
};

export function loadEventsFromStorage(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load events:', e);
    return [];
  }
}

export function saveEventsToStorage(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save events:', e);
  }
}

export function loadCategoriesFromStorage(): EventCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch (e) {
    console.error('Failed to load categories:', e);
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategoriesToStorage(categories: EventCategory[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories:', e);
  }
}

export function loadSettingsFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const systemLang = detectSystemLanguage();
    if (!raw) return { ...DEFAULT_SETTINGS, language: systemLang };
    const parsed = JSON.parse(raw);
    // User requested app language dynamically matches system locale
    return { ...DEFAULT_SETTINGS, ...parsed, language: parsed.language || systemLang };
  } catch (e) {
    console.error('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function getFirstSeenTimestamp(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIRST_SEEN_AT);
    if (raw) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    const now = Date.now();
    localStorage.setItem(STORAGE_KEYS.FIRST_SEEN_AT, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

export function getLastBackupTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_AT);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function recordBackupTimestamp(ts: number = Date.now()): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_AT, String(ts));
  } catch {}
}

export function exportDatabaseBackup(): string {
  const nowTs = Date.now();
  recordBackupTimestamp(nowTs);
  const backup = {
    app: 'Calendar & Tasks',
    version: '2.0.0',
    exportedAt: new Date(nowTs).toISOString(),
    events: loadEventsFromStorage(),
    categories: loadCategoriesFromStorage(),
    settings: loadSettingsFromStorage(),
  };
  return JSON.stringify(backup, null, 2);
}

export function importDatabaseBackup(jsonString: string): { success: boolean; eventCount: number; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.events)) {
      return { success: false, eventCount: 0, error: 'Invalid backup format. Missing events array.' };
    }
    saveEventsToStorage(data.events);
    if (Array.isArray(data.categories) && data.categories.length > 0) {
      saveCategoriesToStorage(data.categories);
    }
    return { success: true, eventCount: data.events.length };
  } catch (e: unknown) {
    return {
      success: false,
      eventCount: 0,
      error: e instanceof Error ? e.message : 'Parse error',
    };
  }
}
