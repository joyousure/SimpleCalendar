export type ViewMode = 'month' | 'week' | 'day' | 'agenda' | 'year';

export type Language =
  | 'zh-CN'
  | 'zh-TW'
  | 'en'
  | 'ja'
  | 'ko'
  | 'fr'
  | 'fa'
  | 'mn'
  | 'ru'
  | 'ug';

export type ThemeMode = 'system' | 'light' | 'dark' | 'amoled';

export type WorldClockMode = 'flip' | 'analog' | 'capsule' | 'glass' | 'hud' | 'minimal';

export type CalendarPageLayout = 'split' | 'zen' | 'scenic' | 'fullBackground';

export type BgImagePosition = 'bottom' | 'fullscreen' | 'none';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ReminderOffset = 'none' | 'at_time' | '10m' | '30m' | '1h' | '1d';

export type TaskKind = 'task' | 'note';

export interface CustomRepeatRule {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  byWeekday?: number[]; // 0=Sun..6=Sat
  repeatBy?: 'due' | 'completion';
}

export interface TaskSection {
  id: string;
  name: string;
  listId?: string;
  sortOrder: number;
  collapsed?: boolean;
}

export interface TaskFolder {
  id: string;
  name: string;
  color?: string;
  categoryIds: string[];
  collapsed?: boolean;
  sortOrder: number;
}

export interface SmartFilterRule {
  id: string;
  name: string;
  color: string;
  categoryIds?: string[];
  priorities?: Array<'high' | 'medium' | 'low' | 'none'>;
  tags?: string[];
  dateRange?: 'any' | 'today' | 'tomorrow' | 'next7' | 'overdue' | 'unscheduled';
  kind?: 'all' | 'task' | 'note';
  status?: 'active' | 'completed' | 'wontdo' | 'all';
  keyword?: string;
}

export type HabitTimeSlot = 'morning' | 'afternoon' | 'night' | 'anytime';
export type HabitGoalType = 'checkin' | 'count';

export interface HabitItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  timeSlot: HabitTimeSlot;
  goalType: HabitGoalType;
  targetValue: number;
  unit?: string;
  weekdays: number[]; // 0..6
  archived?: boolean;
  createdAt: number;
  quote?: string;
}

export interface HabitLogEntry {
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number;
  completed: boolean;
  mood?: 'great' | 'good' | 'neutral' | 'tired';
  note?: string;
  updatedAt: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  title: string;
  description?: string;
  categoryId?: string;
  priority?: 'none' | 'low' | 'medium' | 'high';
  tags?: string[];
  estimatedPomodoros?: number;
  estimatedMinutes?: number;
  checklist?: string[];
  kind?: TaskKind;
  createdAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  categoryId: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime?: string; // HH:mm
  isAllDay: boolean;
  recurrence: RecurrenceType;
  recurrenceEnd?: string; // YYYY-MM-DD
  reminder: ReminderOffset;
  color?: string;
  checklist?: ChecklistItem[];
  priority?: 'none' | 'low' | 'medium' | 'high';
  tags?: string[];
  estimatedPomodoros?: number;
  completedPomodoros?: number;
  isPinned?: boolean;
  isInTrash?: boolean;
  isCompleted?: boolean;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
  // TickTick Pro extensions
  kind?: TaskKind;
  sectionId?: string;
  folderId?: string;
  parentTaskId?: string;
  estimatedMinutes?: number;
  multipleReminders?: ReminderOffset[];
  customRepeatRule?: CustomRepeatRule;
  isWontDo?: boolean;
  wontDoAt?: number;
  trashedAt?: number;
  sortOrder?: number;
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  taskTitle?: string;
  durationMinutes: number;
  mode: 'work' | 'short_break' | 'long_break';
  completedAt: number;
}

export type AmbientSoundType = 'none' | 'rain' | 'forest' | 'waves' | 'cafe' | 'whitenoise' | 'campfire';

export interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  strictMode: boolean;
}

export interface EventCategory {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
}

export interface AppSettings {
  language: Language;
  themeMode: ThemeMode;
  accentColor: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
  use24HourFormat: boolean;
  defaultView: ViewMode;
  enableSoundAlerts: boolean;
  showHolidays: boolean;
  tvMode: boolean;
  enableChineseWorkdays: boolean;
  autoQueryOnlineHolidays: boolean;
  showLunarCalendar?: boolean;
  showWeatherIcon?: boolean;
  showWeekNumbers?: boolean;
  enableHaptics?: boolean;
  offlineMode?: boolean;
  enableHolidayMorningReminder?: boolean;
  enableSystemNotifications?: boolean;
  lastBackupAt?: number;
  worldClockMode?: WorldClockMode;
  calendarPageLayout?: CalendarPageLayout;
  bgImagePosition?: BgImagePosition;
}

export interface ActiveNotification {
  id: string;
  eventId: string;
  title: string;
  message: string;
  timeString: string;
}
