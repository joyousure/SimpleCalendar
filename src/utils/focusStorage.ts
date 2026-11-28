import { AmbientSoundType, PomodoroSession } from '../types/calendar';
import { toDateString } from './dateUtils';

export type FocusTimerStyle = 'countdown' | 'stopwatch';

export interface FocusPreferences {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  dailyGoalMinutes: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  strictMode: boolean;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  soundAlerts: boolean;
  timerStyle: FocusTimerStyle;
}

export interface ExtendedFocusSession extends PomodoroSession {
  kind?: 'pomodoro' | 'stopwatch';
}

export interface FocusDailyPoint {
  dateStr: string;
  shortLabel: string;
  minutes: number;
  sessions: number;
  isToday: boolean;
}

export interface FocusAnalytics {
  todayMinutes: number;
  todaySessions: number;
  dailyGoalMinutes: number;
  goalPercent: number;
  streakDays: number;
  totalMinutesAllTime: number;
  totalSessionsAllTime: number;
  weekSeries: FocusDailyPoint[];
}

const SESSIONS_STORAGE_KEY = 'calendar_focus_sessions_v1';
const PREFS_STORAGE_KEY = 'calendar_focus_prefs_v1';
export const FOCUS_UPDATED_EVENT = 'calendar-focus-updated';

export const DEFAULT_FOCUS_PREFS: FocusPreferences = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  dailyGoalMinutes: 100,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  strictMode: false,
  ambientSound: 'none',
  ambientVolume: 0.5,
  soundAlerts: true,
  timerStyle: 'countdown',
};

function notifyFocusUpdated() {
  try {
    window.dispatchEvent(new CustomEvent(FOCUS_UPDATED_EVENT));
  } catch {}
}

export function loadFocusPrefs(): FocusPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_FOCUS_PREFS;
    const parsed = JSON.parse(raw) as Partial<FocusPreferences>;
    return {
      workDuration: Math.min(120, Math.max(5, Number(parsed.workDuration) || 25)),
      shortBreakDuration: Math.min(30, Math.max(1, Number(parsed.shortBreakDuration) || 5)),
      longBreakDuration: Math.min(60, Math.max(5, Number(parsed.longBreakDuration) || 15)),
      longBreakInterval: Math.min(8, Math.max(2, Number(parsed.longBreakInterval) || 4)),
      dailyGoalMinutes: Math.min(480, Math.max(15, Number(parsed.dailyGoalMinutes) || 100)),
      autoStartBreaks: Boolean(parsed.autoStartBreaks),
      autoStartPomodoros: Boolean(parsed.autoStartPomodoros),
      strictMode: Boolean(parsed.strictMode),
      ambientSound: parsed.ambientSound || 'none',
      ambientVolume:
        typeof parsed.ambientVolume === 'number'
          ? Math.min(1, Math.max(0.05, parsed.ambientVolume))
          : 0.5,
      soundAlerts: parsed.soundAlerts !== false,
      timerStyle: 'countdown',
    };
  } catch {
    return DEFAULT_FOCUS_PREFS;
  }
}

export function saveFocusPrefs(prefs: FocusPreferences): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    notifyFocusUpdated();
  } catch {}
}

export function loadFocusSessions(): ExtendedFocusSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && typeof s.durationMinutes === 'number' && typeof s.completedAt === 'number')
      .sort((a, b) => b.completedAt - a.completedAt);
  } catch {
    return [];
  }
}

export function saveFocusSessions(sessions: ExtendedFocusSession[]): void {
  try {
    const trimmed = sessions.slice(0, 300);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(trimmed));
    notifyFocusUpdated();
  } catch {}
}

export function recordFocusSession(
  input: Omit<ExtendedFocusSession, 'id' | 'completedAt'> & { completedAt?: number }
): ExtendedFocusSession[] {
  const current = loadFocusSessions();
  const nextItem: ExtendedFocusSession = {
    id: `focus_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    taskId: input.taskId,
    taskTitle: input.taskTitle,
    durationMinutes: Math.max(1, Math.round(input.durationMinutes)),
    mode: input.mode,
    kind: input.kind || 'pomodoro',
    completedAt: input.completedAt || Date.now(),
  };
  const updated = [nextItem, ...current].slice(0, 300);
  saveFocusSessions(updated);
  return updated;
}

export function deleteFocusSession(id: string): ExtendedFocusSession[] {
  const updated = loadFocusSessions().filter((s) => s.id !== id);
  saveFocusSessions(updated);
  return updated;
}

export function clearFocusSessions(): ExtendedFocusSession[] {
  saveFocusSessions([]);
  return [];
}

export function computeFocusAnalytics(
  sessions: ExtendedFocusSession[],
  dailyGoalMinutes: number,
  localeCode: string = 'en-US'
): FocusAnalytics {
  const now = new Date();
  const todayStr = toDateString(now);

  const workSessions = sessions.filter((s) => s.mode === 'work');
  const minutesByDate = new Map<string, { minutes: number; sessions: number }>();

  let totalMinutesAllTime = 0;
  for (const s of workSessions) {
    const dStr = toDateString(new Date(s.completedAt));
    const entry = minutesByDate.get(dStr) || { minutes: 0, sessions: 0 };
    entry.minutes += s.durationMinutes;
    entry.sessions += 1;
    minutesByDate.set(dStr, entry);
    totalMinutesAllTime += s.durationMinutes;
  }

  const todayBucket = minutesByDate.get(todayStr) || { minutes: 0, sessions: 0 };
  const safeGoal = Math.max(15, dailyGoalMinutes || 100);
  const goalPercent = Math.min(100, Math.round((todayBucket.minutes / safeGoal) * 100));

  // Consecutive streak: starts today if any focus today, otherwise from yesterday if focused yesterday
  let streakDays = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!minutesByDate.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (minutesByDate.has(toDateString(cursor))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weekSeries: FocusDailyPoint[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const dStr = toDateString(d);
    const bucket = minutesByDate.get(dStr) || { minutes: 0, sessions: 0 };
    let shortLabel = `${d.getMonth() + 1}/${d.getDate()}`;
    try {
      shortLabel = new Intl.DateTimeFormat(localeCode, { weekday: 'short' }).format(d);
    } catch {}
    weekSeries.push({
      dateStr: dStr,
      shortLabel,
      minutes: bucket.minutes,
      sessions: bucket.sessions,
      isToday: offset === 0,
    });
  }

  return {
    todayMinutes: todayBucket.minutes,
    todaySessions: todayBucket.sessions,
    dailyGoalMinutes: safeGoal,
    goalPercent,
    streakDays,
    totalMinutesAllTime,
    totalSessionsAllTime: workSessions.length,
    weekSeries,
  };
}
