import React from 'react';
import { CalendarEvent, EventCategory, AppSettings } from '../types/calendar';
import {
  toDateString,
  getEventsForDate,
  sortEventsForDay,
  getWeekdayNames,
  getISOWeekInfo,
  formatISOWeekCode,
  formatWeekNumber,
} from '../utils/dateUtils';
import { getTranslation, isChineseLocale } from '../utils/i18n';
import { getLunarInfo } from '../utils/lunarCalendar';
import { getKnownDayWeather } from '../utils/weatherService';
import { WeatherLocation } from '../types/weather';
import { Plus } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  categories: EventCategory[];
  settings: AppSettings;
  location?: WeatherLocation;
  onSelectEvent: (event: CalendarEvent) => void;
  onDateClick: (dateStr: string) => void;
  onCreateEventAt: (dateStr: string, timeStr?: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  categories,
  settings,
  location,
  onSelectEvent,
  onDateClick,
  onCreateEventAt,
}) => {
  const t = getTranslation(settings.language);
  const isChinese = isChineseLocale(settings.language);

  // Generate 7 days of the week containing currentDate
  const currDay = currentDate.getDay();
  const diff = (currDay - settings.firstDayOfWeek + 7) % 7;
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - diff);

  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push(d);
  }

  const todayStr = toDateString(new Date());
  const weekdayNames = getWeekdayNames(settings.language, settings.firstDayOfWeek);

  const categoryMap = new Map<string, EventCategory>();
  categories.forEach((cat) => categoryMap.set(cat.id, cat));

  const firstDayIso = getISOWeekInfo(weekDays[0]);
  const lastDayIso = getISOWeekInfo(weekDays[6]);
  const spansMultipleIsoWeeks =
    firstDayIso.year !== lastDayIso.year || firstDayIso.week !== lastDayIso.week;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto select-none p-3 sm:p-5 max-w-7xl mx-auto w-full pb-32 space-y-3">
      {settings.showWeekNumbers !== false && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 text-xs">
          <div className="flex items-center gap-2 font-mono tabular-nums text-neutral-700 dark:text-neutral-200 font-bold">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-sans font-semibold">
              ISO 8601
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span>
              {spansMultipleIsoWeeks
                ? `${formatISOWeekCode(firstDayIso)} / ${formatISOWeekCode(lastDayIso)}`
                : formatISOWeekCode(firstDayIso)}
            </span>
          </div>
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 tabular-nums">
            {spansMultipleIsoWeeks
              ? `${formatWeekNumber(firstDayIso.week, settings.language)} – ${formatWeekNumber(lastDayIso.week, settings.language)}`
              : formatWeekNumber(firstDayIso.week, settings.language)}
          </div>
        </div>
      )}

      {/* 7 Columns for the week */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5 flex-1 min-h-[480px]">
        {weekDays.map((dayDate, idx) => {
          const dateStr = toDateString(dayDate);
          const isToday = dateStr === todayStr;
          const dayEvents = sortEventsForDay(getEventsForDate(events, dateStr));
          const lunar = isChinese ? getLunarInfo(dayDate) : null;
          const weather =
            settings.showWeatherIcon !== false ? getKnownDayWeather(dateStr, location) : null;

          return (
            <div
              key={dateStr}
              onClick={() => onDateClick(dateStr)}
              className={`flex flex-col rounded-3xl p-3 border min-w-0 transition-all cursor-pointer ${
                isToday
                  ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 shadow-md ring-1 ring-blue-400'
                  : 'bg-white/80 dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-200/60 dark:border-neutral-800/60 pb-2">
                <div>
                  <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                    {weekdayNames[idx]}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-lg font-extrabold ${
                        isToday ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {dayDate.getDate()}
                    </span>
                    {isChinese && lunar && (
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {lunar.lunarDayName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {settings.showWeekNumbers !== false && (spansMultipleIsoWeeks ? dayDate.getDay() === 1 || idx === 0 : idx === 0) && (
                    <span
                      className="text-[9px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200/70 dark:border-neutral-700/70"
                      title={`${formatISOWeekCode(getISOWeekInfo(dayDate))} (ISO 8601)`}
                    >
                      W{String(getISOWeekInfo(dayDate).week).padStart(2, '0')}
                    </span>
                  )}
                  {weather && (
                    <span className="text-sm">
                      {weather.weatherIcon === 'sun'
                        ? '☀️'
                        : weather.weatherIcon === 'cloud-rain'
                        ? '🌧️'
                        : '⛅'}
                    </span>
                  )}
                </div>
              </div>

              {/* Day Events Stack */}
              <div className="flex-1 py-2 space-y-1.5 overflow-y-auto">
                {dayEvents.map((evt) => {
                  const cat = categoryMap.get(evt.categoryId);
                  const color = evt.color || cat?.color || settings.accentColor;

                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className={`p-2 rounded-xl text-xs font-semibold border-s-3 transition-opacity hover:opacity-85 ${
                        evt.isCompleted ? 'line-through opacity-50' : ''
                      }`}
                      style={{
                        backgroundColor: `${color}1A`,
                        borderInlineStartColor: color,
                        color,
                      }}
                    >
                      {!evt.isAllDay && evt.startTime && (
                        <div className="text-[9px] font-mono opacity-75">{evt.startTime}</div>
                      )}
                      <div className="truncate">{evt.title}</div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Add at bottom */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateEventAt(dateStr);
                }}
                className="mt-auto pt-1 flex items-center justify-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-blue-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.add}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
