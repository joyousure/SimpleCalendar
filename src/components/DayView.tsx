import React from 'react';
import { CalendarEvent, EventCategory, AppSettings } from '../types/calendar';
import { toDateString, formatTimeDisplay, getEventsForDate } from '../utils/dateUtils';
import { getTranslation, getExtraLabels, getLocaleCode, isChineseLocale } from '../utils/i18n';
import { getLunarInfo, formatGanzhiFull } from '../utils/lunarCalendar';
import { getKnownDayWeather, getCachedWeatherData, getLocalizedWeatherText } from '../utils/weatherService';
import { WeatherLocation, HourlyWeather } from '../types/weather';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  categories: EventCategory[];
  settings: AppSettings;
  location?: WeatherLocation;
  onSelectEvent: (event: CalendarEvent) => void;
  onOpenWeather?: (dateStr: string) => void;
  onCreateEventAt: (dateStr: string, timeStr?: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  categories,
  settings,
  location,
  onSelectEvent,
  onOpenWeather,
  onCreateEventAt,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);
  const localeCode = getLocaleCode(settings.language);
  const isChinese = isChineseLocale(settings.language);

  const dateStr = toDateString(currentDate);
  const dayEvents = getEventsForDate(events, dateStr);
  const lunar = isChinese ? getLunarInfo(currentDate) : null;
  const weather =
    settings.showWeatherIcon !== false ? getKnownDayWeather(dateStr, location) : null;
  const cachedWeather = getCachedWeatherData();
  const hourlyData: HourlyWeather[] = cachedWeather?.hourly || [];

  const categoryMap = new Map<string, EventCategory>();
  categories.forEach((cat) => categoryMap.set(cat.id, cat));

  // 24 Hour Slots
  const hours = Array.from({ length: 24 }).map((_, i) => i);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto select-none p-3 sm:p-5 max-w-5xl mx-auto w-full pb-32 space-y-4">
      {/* Top Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100">
              {currentDate.toLocaleDateString(localeCode, {
                month: 'short',
                day: 'numeric',
                weekday: 'short',
              })}
            </h2>
            {isChinese && lunar && (
              <span className="text-xs px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                {lunar.lunarMonthName}{lunar.lunarDayName}
              </span>
            )}
          </div>
          {isChinese && lunar && (
            <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
              {formatGanzhiFull(lunar)} · {t.almanacYiLabel}: {lunar.yi.slice(0, 3).join(' ')}
            </p>
          )}
        </div>

        {weather && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenWeather?.(dateStr)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold hover:bg-amber-500/20 transition-all active:scale-95 shadow-sm"
              title={ui.weatherBtnTooltip}
            >
              <span className="text-base">{weather.weatherIcon === 'sun' ? '☀️' : weather.weatherIcon === 'cloud-rain' ? '🌧️' : '⛅'}</span>
              <span>{getLocalizedWeatherText(weather.weatherCode, settings.language)} · {weather.maxTemp}° / {weather.minTemp}°</span>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-normal">{ui.weatherAirGood}</span>
            </button>
          </div>
        )}
      </div>

      {/* Hourly Weather Forecast Bar */}
      {hourlyData.length > 0 && (
        <div className="p-3 rounded-2xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center gap-2 overflow-x-auto select-none">
          <span className="text-[11px] font-bold text-neutral-400 shrink-0 px-1">{ui.weatherHourlyTrend}</span>
          <div className="flex items-center gap-2 flex-1">
            {hourlyData.filter((_, i) => i % 3 === 0).map((h: HourlyWeather) => (
              <div key={h.time} className="flex flex-col items-center min-w-[52px] p-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/70 text-[10px]">
                <span className="text-neutral-500 dark:text-neutral-400 font-mono">{h.time}</span>
                <span className="text-sm my-0.5">{h.weatherIcon === 'sun' ? '☀️' : h.weatherIcon === 'cloud-rain' ? '🌧️' : '⛅'}</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">{h.temp}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dayEvents.length === 0 && (
        <div className="px-4 py-3 rounded-2xl bg-white/75 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>{ui.emptyDayNoEvents}</span>
          </div>
          <button
            type="button"
            onClick={() => onCreateEventAt(dateStr)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-500/20 transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.add}</span>
          </button>
        </div>
      )}

      {/* 24-Hour Timeline */}
      <div className="rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xl divide-y divide-neutral-200/60 dark:divide-neutral-800/60 overflow-hidden">
        {hours.map((hour) => {
          const hourStr = `${String(hour).padStart(2, '0')}:00`;
          const hourEvents = dayEvents.filter((e) => {
            if (e.isAllDay) return hour === 0;
            if (!e.startTime) return false;
            const h = parseInt(e.startTime.split(':')[0], 10);
            return h === hour;
          });

          return (
            <div
              key={hour}
              onClick={() => onCreateEventAt(dateStr, hourStr)}
              className="flex items-start min-h-[56px] p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer group"
            >
              <div className="w-16 sm:w-20 font-mono text-xs font-semibold text-neutral-400 shrink-0 pt-0.5">
                {settings.use24HourFormat ? hourStr : formatTimeDisplay(hourStr, false)}
              </div>

              <div className="flex-1 flex flex-wrap gap-2">
                {hourEvents.map((evt) => {
                  const cat = categoryMap.get(evt.categoryId);
                  const color = evt.color || cat?.color || settings.accentColor;

                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2 cursor-pointer hover:opacity-90"
                      style={{
                        backgroundColor: `${color}1A`,
                        borderInlineStart: `3px solid ${color}`,
                        color,
                      }}
                    >
                      <span>{evt.title}</span>
                      {evt.location && <span className="text-[10px] opacity-70">📍 {evt.location}</span>}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateEventAt(dateStr, hourStr);
                }}
                aria-label={`${t.addEventAt} ${hourStr}`}
                className="opacity-75 sm:opacity-0 sm:group-hover:opacity-100 w-9 h-9 -my-1 flex items-center justify-center rounded-xl text-neutral-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all shrink-0 cursor-pointer"
                title={`${t.addEventAt} ${hourStr}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
