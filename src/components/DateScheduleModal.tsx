import React from 'react';
import { CalendarEvent, EventCategory, AppSettings } from '../types/calendar';
import { toDateString, parseDate, getEventsForDate } from '../utils/dateUtils';
import { getTranslation, getExtraLabels, isChineseLocale, isRtlLanguage } from '../utils/i18n';
import { getLunarInfo } from '../utils/lunarCalendar';
import { getCategoryDisplayName } from '../utils/storage';
import { WeatherLocation } from '../types/weather';
import {
  X,
  Calendar,
  Plus,
  ArrowRight,
  CloudSun,
  Flame,
} from 'lucide-react';

interface DateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  events: CalendarEvent[];
  categories: EventCategory[];
  settings: AppSettings;
  location?: WeatherLocation;
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventOnDate: (dateStr: string) => void;
  onNavigateToDayView: (date: Date) => void;
  onOpenWeather?: (dateStr: string) => void;
  onToggleChecklist?: (eventId: string, itemId: string) => void;
  onStartFocus?: (eventId: string) => void;
}

export const DateScheduleModal: React.FC<DateScheduleModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  events,
  categories,
  settings,
  onSelectEvent,
  onCreateEventOnDate,
  onNavigateToDayView,
  onOpenWeather,
  onStartFocus,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);
  const isChinese = isChineseLocale(settings.language);
  const isTw = settings.language === 'zh-TW';
  const isRtl = isRtlLanguage(settings.language);

  if (!isOpen) return null;

  const targetDate = parseDate(dateStr);
  const todayStr = toDateString(new Date());
  const isToday = dateStr === todayStr;
  const isPast = dateStr < todayStr;

  const dayEvents = getEventsForDate(events, dateStr);
  const lunar = isChinese ? getLunarInfo(targetDate) : null;

  const categoryMap = new Map<string, EventCategory>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  // DST-safe & Gregorian leap-year accurate day-of-year calculation
  const y = targetDate.getFullYear();
  const dayOfYear = Math.round(
    (Date.UTC(y, targetDate.getMonth(), targetDate.getDate()) - Date.UTC(y, 0, 0)) / 86400000
  );
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const totalDaysInYear = isLeap ? 366 : 365;
  const daysLeftInYear = Math.max(0, totalDaysInYear - dayOfYear);
  const yearProgressPercent = Math.min(100, Math.max(1, Math.round((dayOfYear / totalDaysInYear) * 100)));

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 bg-black/60 backdrop-blur-md select-none overflow-y-auto animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-5 animate-modal-sheet" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: settings.accentColor }}
            >
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                {dateStr}
              </h3>
              <p className="text-xs text-neutral-500">
                {isToday
                  ? t.scheduleTodayTitle
                  : isPast
                  ? t.schedulePastTitle
                  : t.scheduleFutureTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenWeather && (
              <button
                type="button"
                onClick={() => onOpenWeather(dateStr)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                title={ui.weatherBtnTooltip}
                aria-label={ui.weatherBtnTooltip}
              >
                <CloudSun className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t.backButton}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* If Today: Show Day Count & Annual Progress Banner */}
        {isToday && (
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
              <span>{t.annualDayProgress}</span>
              <span className="font-mono">{dayOfYear} / {totalDaysInYear} {ui.daysUnit} ({yearProgressPercent}%)</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${yearProgressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-blue-700 dark:text-blue-400 font-medium text-end">
              {t.annualDaysLeft} {daysLeftInYear} {ui.daysUnit}
            </div>
          </div>
        )}

        {/* Lunar and Auspicious info on Chinese locale */}
        {isChinese && lunar && (
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800 text-xs space-y-1">
            <div className="font-bold text-neutral-800 dark:text-neutral-200">
              {isTw ? '農曆' : '农历'} {lunar.lunarMonthName}{lunar.lunarDayName} · {lunar.ganZhiYear} ({isTw ? '屬' : '属'}{lunar.zodiac})
            </div>
            <div className="text-[11px] text-neutral-500">
              {isTw ? '宜：' : '宜：'}{lunar.yi.slice(0, 5).join(' · ')}
            </div>
          </div>
        )}

        {/* Events / Tasks List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 px-1">
            <span>{isPast ? t.pastTasksArchive : t.allEvents}</span>
            <span className="font-mono">{dayEvents.length} {ui.itemsUnit}</span>
          </div>

          {dayEvents.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 text-xs text-neutral-400">
              {isPast ? t.noPastTasks : t.noFuturePlans}
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {dayEvents.map((evt) => {
                const cat = categoryMap.get(evt.categoryId);
                const color = evt.color || cat?.color || settings.accentColor;

                return (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="truncate">
                        <div className={`text-xs font-bold truncate ${evt.isCompleted ? 'line-through opacity-50' : ''}`}>
                          {evt.title}
                        </div>
                        {!evt.isAllDay && evt.startTime && (
                          <div className="text-[10px] font-mono text-neutral-400">
                            {evt.startTime} - {evt.endTime}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {cat && (
                        <span className="text-[10px] font-semibold text-neutral-400 shrink-0">
                          {getCategoryDisplayName(cat, settings.language)}
                        </span>
                      )}
                      {onStartFocus && !evt.isCompleted && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            onStartFocus(evt.id);
                          }}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title={t.pomoStart}
                        >
                          <Flame className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToDayView(targetDate);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:text-blue-500"
          >
            <span>{t.jumpToDayView}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateEventOnDate(dateStr);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-600 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createEventForDate}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
