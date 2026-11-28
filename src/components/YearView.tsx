import React from 'react';
import { CalendarEvent, AppSettings } from '../types/calendar';
import { generateMonthGrid, toDateString } from '../utils/dateUtils';
import { getExtraLabels, getLocaleCode } from '../utils/i18n';

interface YearViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  settings: AppSettings;
  onNavigateToMonth: (year: number, month: number) => void;
  onNavigateToDay: (date: Date) => void;
}

export const YearView: React.FC<YearViewProps> = ({
  currentDate,
  events,
  settings,
  onNavigateToMonth,
  onNavigateToDay,
}) => {
  const ui = getExtraLabels(settings.language);
  const localeCode = getLocaleCode(settings.language);
  const year = currentDate.getFullYear();
  const months = Array.from({ length: 12 }).map((_, i) => i);
  const todayStr = toDateString(new Date());

  const eventDates = new Set(
    events
      .filter((e) => !e.isInTrash && !e.isCompleted && !e.isWontDo && Boolean(e.startDate))
      .map((e) => e.startDate)
  );

  return (
    <div className="flex-1 overflow-y-auto select-none p-4 sm:p-6 max-w-7xl mx-auto w-full pb-32">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((m) => {
          const grid = generateMonthGrid(year, m, settings.firstDayOfWeek);
          const monthName = new Date(year, m, 1).toLocaleDateString(localeCode, { month: 'long' });

          const seasonInfo =
            m >= 2 && m <= 4
              ? { name: ui.seasonSpring, icon: '🌸', temp: '15°C' }
              : m >= 5 && m <= 7
              ? { name: ui.seasonSummer, icon: '☀️', temp: '28°C' }
              : m >= 8 && m <= 10
              ? { name: ui.seasonAutumn, icon: '🍁', temp: '18°C' }
              : { name: ui.seasonWinter, icon: '❄️', temp: '4°C' };

          return (
            <div
              key={m}
              onClick={() => onNavigateToMonth(year, m)}
              className="p-3.5 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xl cursor-pointer hover:border-blue-400/50 transition-all group"
            >
              <div className="flex items-center justify-between text-sm font-black text-neutral-900 dark:text-neutral-100 mb-2">
                <span>{monthName}</span>
                <span className="text-[10px] font-normal text-neutral-500 dark:text-neutral-400 flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                  <span>{seasonInfo.icon}</span>
                  <span>{seasonInfo.temp}</span>
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                {grid.map((cell) => {
                  const isCur = cell.isCurrentMonth;
                  const isToday = cell.dateString === todayStr;
                  const hasEvt = eventDates.has(cell.dateString);

                  return (
                    <div
                      key={cell.dateString}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToDay(cell.date);
                      }}
                      className={`h-6 flex flex-col items-center justify-center rounded-lg ${
                        isToday
                          ? 'bg-blue-600 text-white font-bold'
                          : isCur
                          ? 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          : 'text-neutral-300 dark:text-neutral-700'
                      }`}
                    >
                      <span>{cell.date.getDate()}</span>
                      {hasEvt && isCur && !isToday && (
                        <div className="w-1 h-1 rounded-full bg-blue-500 -mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
