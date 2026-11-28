import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, EventCategory, AppSettings } from '../types/calendar';
import { CountdownItem } from '../types/countdown';
import {
  generateMonthGrid,
  getEventsForDate,
  sortEventsForDay,
  formatTimeDisplay,
  getHolidaysForYear,
  getWeekdayNames,
  getISOWeekInfo,
  formatISOWeekCode,
  formatWeekNumber,
  toDateString,
  parseDate,
} from '../utils/dateUtils';
import { getTranslation, getExtraLabels, getLocaleCode, isChineseLocale } from '../utils/i18n';
import { getHolidayForDate, getParsedHolidaysForYear } from '../utils/holidayParser';
import { getLunarInfo, getUpcomingSolarTerms } from '../utils/lunarCalendar';
import { getKnownDayWeather, getCachedWeatherData, analyzeFutureWeatherTrend, getLocalizedWeatherText } from '../utils/weatherService';
import { WeatherLocation } from '../types/weather';
import { getDailyQuote, getBilingualQuote, DAILY_QUOTES } from '../utils/quotes';
import { ZodiacEmblem } from './ZodiacEmblem';
import { triggerHaptic } from '../utils/haptics';
import {
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  AlertTriangle,
  Flame,
  ArrowRight,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  categories: EventCategory[];
  countdowns?: CountdownItem[];
  settings: AppSettings;
  location?: WeatherLocation;
  onSelectEvent: (event: CalendarEvent) => void;
  onToggleEventComplete?: (event: CalendarEvent) => void;
  onSelectDate?: (date: Date) => void;
  onDateClick: (dateStr: string) => void;
  onCreateEventOnDate: (dateStr: string) => void;
  onShowMoreEvents?: (dateStr: string) => void;
  onOpenWorldClock?: (city?: string) => void;
  onOpenWeather?: (dateStr?: string) => void;
  onOpenAgenda?: () => void;
  onOpenCountdowns?: () => void;
  onStartFocusForTask?: (taskId: string) => void;
  onUpdateSettings?: (settings: AppSettings) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  countdowns = [],
  settings,
  location,
  onSelectEvent,
  onToggleEventComplete,
  onSelectDate,
  onDateClick,
  onCreateEventOnDate,
  onOpenWeather,
  onOpenAgenda,
  onOpenCountdowns,
  onStartFocusForTask,
  onPrev,
  onNext,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);
  const localeCode = getLocaleCode(settings.language);
  const isChinese = isChineseLocale(settings.language);
  const hapticsEnabled = settings.enableHaptics !== false;
  const accentColor = settings.accentColor || '#689F38';

  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);
  const pointerStartX = React.useRef<number | null>(null);
  const pointerStartY = React.useRef<number | null>(null);
  const didSwipeGridRef = React.useRef<boolean>(false);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const prevMonthKeyRef = React.useRef<string>(`${currentDate.getFullYear()}-${currentDate.getMonth()}`);

  // Default collapsed week strip, swipe/drag down to expand full Month Grid
  const [isMonthExpanded, setIsMonthExpanded] = useState(false);
  const [quoteOffset, setQuoteOffset] = useState(0);
  const [isQuoteRefreshing, setIsQuoteRefreshing] = useState(false);
  const [showAllYiJi, setShowAllYiJi] = useState(false);
  const [weatherRevision, setWeatherRevision] = useState(0);
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(new Set());
  const [tappedDateStr, setTappedDateStr] = useState<string | null>(null);
  const [swipeDragX, setSwipeDragX] = useState(0);
  const [monthTransitionDir, setMonthTransitionDir] = useState<'next' | 'prev' | null>(null);
  const [scrollParallaxY, setScrollParallaxY] = useState(0);

  useEffect(() => {
    const handleWeatherUpdate = () => setWeatherRevision((prev) => prev + 1);
    window.addEventListener('weather-updated', handleWeatherUpdate);
    window.addEventListener('holiday-cn-updated', handleWeatherUpdate);
    window.addEventListener('app-live-sync', handleWeatherUpdate);
    return () => {
      window.removeEventListener('weather-updated', handleWeatherUpdate);
      window.removeEventListener('holiday-cn-updated', handleWeatherUpdate);
      window.removeEventListener('app-live-sync', handleWeatherUpdate);
    };
  }, []);

  const [todayStr, setTodayStr] = useState<string>(() => toDateString(new Date()));

  useEffect(() => {
    const refreshToday = () => {
      const next = toDateString(new Date());
      setTodayStr((prev) => (prev === next ? prev : next));
    };
    const timer = window.setInterval(refreshToday, 60000);
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshToday();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const selectedDateStr = toDateString(currentDate);
  const todayDate = useMemo(() => parseDate(todayStr), [todayStr]);

  const monthGrid = useMemo(
    () => generateMonthGrid(year, month, settings.firstDayOfWeek),
    [year, month, settings.firstDayOfWeek]
  );

  // Compute the 7 days of the week containing `currentDate`
  const weekDays = useMemo(() => {
    const dayOfWeek = currentDate.getDay();
    const diff = (dayOfWeek - settings.firstDayOfWeek + 7) % 7;
    const startOfWeek = new Date(year, month, currentDate.getDate() - diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        date: d,
        dateString: toDateString(d),
        isCurrentMonth: d.getMonth() === month,
      };
    });
  }, [currentDate, year, month, settings.firstDayOfWeek]);

  const displayCells = isMonthExpanded ? monthGrid : weekDays;

  const weekdayNames = getWeekdayNames(settings.language, settings.firstDayOfWeek);
  const compactWeekdayNames = useMemo(
    () =>
      weekdayNames.map((name) =>
        isChinese ? name.replace(/^周|^週/, '') : name
      ),
    [weekdayNames, isChinese]
  );

  const publicHolidays = useMemo(
    () => getHolidaysForYear(year, settings.language),
    [year, settings.language]
  );

  const regionalHolidays = useMemo(
    () => getParsedHolidaysForYear(year, settings.language, location),
    [year, settings.language, location, weatherRevision]
  );

  // Track month transitions for subtle parallax entrance animation
  useEffect(() => {
    const currKey = `${year}-${month}`;
    const prevKey = prevMonthKeyRef.current;
    if (currKey !== prevKey) {
      const [py, pm] = prevKey.split('-').map(Number);
      const isForward = year > py || (year === py && month > pm);
      setMonthTransitionDir(isForward ? 'next' : 'prev');
      prevMonthKeyRef.current = currKey;
      const timer = window.setTimeout(() => setMonthTransitionDir(null), 320);
      return () => window.clearTimeout(timer);
    }
  }, [year, month]);

  const handleContainerScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const top = Math.min(120, Math.max(0, el.scrollTop));
    setScrollParallaxY(Number((top * 0.035).toFixed(2)));
  };

  const applyCalendarSwipeGesture = (diffX: number, diffY: number) => {
    // Vertical swipe/drag: down expands full month, up collapses back to week strip
    if (Math.abs(diffY) > 32 && Math.abs(diffY) > Math.abs(diffX) * 1.1) {
      didSwipeGridRef.current = true;
      if (diffY > 0 && !isMonthExpanded) {
        triggerHaptic('selection', hapticsEnabled);
        setIsMonthExpanded(true);
      } else if (diffY < 0 && isMonthExpanded) {
        triggerHaptic('selection', hapticsEnabled);
        setIsMonthExpanded(false);
      }
      return;
    }

    // Horizontal swipe: prev/next month in expanded mode (or prev/next week in compact strip)
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      didSwipeGridRef.current = true;
      triggerHaptic('monthSwipe', hapticsEnabled);
      if (diffX < 0) {
        setMonthTransitionDir('next');
        if (isMonthExpanded) {
          onNext?.();
        } else {
          const nextWeek = new Date(currentDate);
          nextWeek.setDate(currentDate.getDate() + 7);
          onSelectDate?.(nextWeek);
        }
      } else {
        setMonthTransitionDir('prev');
        if (isMonthExpanded) {
          onPrev?.();
        } else {
          const prevWeek = new Date(currentDate);
          prevWeek.setDate(currentDate.getDate() - 7);
          onSelectDate?.(prevWeek);
        }
      }
    }
  };

  const handleGridTouchStart = (e: React.TouchEvent) => {
    didSwipeGridRef.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleGridTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      setSwipeDragX(Math.max(-44, Math.min(44, dx * 0.25)));
    }
  };

  const handleGridTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    setSwipeDragX(0);
    applyCalendarSwipeGesture(diffX, diffY);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleCalendarPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    didSwipeGridRef.current = false;
    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
  };

  const handleCalendarPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (pointerStartX.current === null || pointerStartY.current === null) return;
    const dx = e.clientX - pointerStartX.current;
    const dy = e.clientY - pointerStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      setSwipeDragX(Math.max(-44, Math.min(44, dx * 0.25)));
    }
  };

  const handleCalendarPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (pointerStartX.current === null || pointerStartY.current === null) return;
    const diffX = e.clientX - pointerStartX.current;
    const diffY = e.clientY - pointerStartY.current;
    setSwipeDragX(0);
    applyCalendarSwipeGesture(diffX, diffY);
    pointerStartX.current = null;
    pointerStartY.current = null;
  };

  const handleDaySelect = (date: Date, dateStr: string) => {
    if (didSwipeGridRef.current) {
      didSwipeGridRef.current = false;
      return;
    }
    triggerHaptic('cellTap', hapticsEnabled);
    setTappedDateStr(dateStr);
    window.setTimeout(() => {
      setTappedDateStr((prev) => (prev === dateStr ? null : prev));
    }, 260);
    if (dateStr === selectedDateStr) {
      onDateClick(dateStr);
    } else {
      onSelectDate?.(date);
    }
  };

  // Lunar & Daily Wisdom for the currently selected date
  const selectedLunar = useMemo(() => getLunarInfo(currentDate), [currentDate]);
  const defaultQuote = useMemo(() => getDailyQuote(currentDate), [currentDate]);
  const currentQuoteIndex =
    (DAILY_QUOTES.findIndex((q) => q.id === defaultQuote.id) + quoteOffset) % DAILY_QUOTES.length;
  const activeQuote = DAILY_QUOTES[currentQuoteIndex >= 0 ? currentQuoteIndex : 0];
  const bilingualQuote = useMemo(
    () => getBilingualQuote(activeQuote, settings.language),
    [activeQuote, settings.language]
  );

  // Weather forecast summary & enhanced multi-horizon trend calculation
  const weatherBundle = useMemo(() => {
    const cached = getCachedWeatherData();
    const daily = cached?.daily || [];
    const tomorrowObj = new Date(currentDate);
    tomorrowObj.setDate(currentDate.getDate() + 1);
    const tomorrowStr = toDateString(tomorrowObj);

    const tomorrowWeather =
      daily.find((d) => d.date === tomorrowStr) || getKnownDayWeather(tomorrowStr, location);

    const trendAnalysis = analyzeFutureWeatherTrend(selectedDateStr, settings.language);

    return {
      tomorrowWeather,
      tomorrowLabel:
        selectedDateStr === todayStr
          ? t.tomorrow
          : isChinese
          ? `${tomorrowObj.getMonth() + 1}月${tomorrowObj.getDate()}日`
          : `${tomorrowObj.getMonth() + 1}/${tomorrowObj.getDate()}`,
      trendDirection: trendAnalysis.direction,
      trendText: trendAnalysis.text,
      advisory: trendAnalysis.advisory,
    };
  }, [currentDate, selectedDateStr, todayStr, isChinese, settings.language, t.tomorrow, weatherRevision, location]);

  const renderWeatherLucideIcon = (iconName?: string, sizeClass = 'w-4 h-4') => {
    switch (iconName) {
      case 'sun':
        return <Sun className={`${sizeClass} text-amber-500 shrink-0`} />;
      case 'cloud':
        return <Cloud className={`${sizeClass} text-neutral-400 shrink-0`} />;
      case 'cloud-rain':
        return <CloudRain className={`${sizeClass} text-sky-500 shrink-0`} />;
      case 'cloud-snow':
        return <CloudSnow className={`${sizeClass} text-cyan-400 shrink-0`} />;
      case 'cloud-lightning':
        return <CloudLightning className={`${sizeClass} text-amber-500 shrink-0`} />;
      default:
        return <CloudSun className={`${sizeClass} text-amber-500 shrink-0`} />;
    }
  };

  // Integrated Countdowns + Upcoming 24 Solar Terms
  const upcomingCountdowns = useMemo(() => {
    const baseOnly = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    const localizedWeekdays = getWeekdayNames(settings.language, 0);

    const formatDateWithWeekday = (d: Date) => {
      if (isChinese) {
        return `${d.getMonth() + 1}月${d.getDate()}日(${localizedWeekdays[d.getDay()]})`;
      }
      const wk = new Intl.DateTimeFormat(localeCode, { weekday: 'short' }).format(d);
      return `${d.getMonth() + 1}/${d.getDate()} (${wk})`;
    };

    const items: {
      id: string;
      title: string;
      dateLabel: string;
      daysAway: number;
      isSolarTerm?: boolean;
    }[] = [];

    countdowns.forEach((c) => {
      const target = parseDate(c.targetDate);
      const targetOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());
      const daysAway = Math.round((targetOnly.getTime() - baseOnly.getTime()) / 86400000);
      if (daysAway >= 0) {
        items.push({
          id: c.id,
          title: c.title,
          dateLabel: formatDateWithWeekday(targetOnly),
          daysAway,
        });
      }
    });

    if (isChinese) {
      const terms = getUpcomingSolarTerms(baseOnly, 4);
      terms.forEach((term) => {
        if (!items.some((i) => i.title === term.name && i.daysAway === term.daysAway)) {
          items.push({
            id: `term_${term.dateString}`,
            title: term.name,
            dateLabel: formatDateWithWeekday(term.date),
            daysAway: term.daysAway,
            isSolarTerm: true,
          });
        }
      });
    }

    return items.sort((a, b) => a.daysAway - b.daysAway).slice(0, 3);
  }, [countdowns, todayDate, isChinese, localeCode]);

  const todoSection = useMemo(() => {
    const active = events.filter(
      (e) =>
        !e.isInTrash &&
        !e.isCompleted &&
        !e.isWontDo &&
        e.kind !== 'note' &&
        !e.id.startsWith('evt-acc-') &&
        e.categoryId !== 'cat-expense' &&
        e.categoryId !== 'cat-income'
    );
    const forSelected = sortEventsForDay(getEventsForDate(active, selectedDateStr));

    let targetDateStr = selectedDateStr;
    let tasks = forSelected;

    if (tasks.length === 0) {
      // Scan chronologically from today outward (including recurring events) for the nearest pending tasks
      const baseToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
      for (let offset = 0; offset <= 90; offset++) {
        const probe = new Date(baseToday);
        probe.setDate(baseToday.getDate() + offset);
        const probeStr = toDateString(probe);
        const found = sortEventsForDay(getEventsForDate(active, probeStr));
        if (found.length > 0) {
          targetDateStr = probeStr;
          tasks = found;
          break;
        }
      }
      if (tasks.length === 0) {
        const sortedFuture = active
          .filter((e) => e.startDate >= todayStr)
          .sort((a, b) => a.startDate.localeCompare(b.startDate));
        if (sortedFuture.length > 0) {
          targetDateStr = sortedFuture[0].startDate;
          tasks = sortEventsForDay(getEventsForDate(active, targetDateStr));
        }
      }
    }

    const tDate = parseDate(targetDateStr);
    const baseOnly = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    const targetOnly = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
    const diffDays = Math.round((targetOnly.getTime() - baseOnly.getTime()) / 86400000);

    const localizedWeekdays = getWeekdayNames(settings.language, 0);
    const wk = isChinese
      ? localizedWeekdays[tDate.getDay()]
      : new Intl.DateTimeFormat(localeCode, { weekday: 'short' }).format(tDate);

    const twoDaysLabel = ui.dayAfterTomorrow.replace(/\s*·\s*$/, '').trim();
    const inXDaysLabel = ui.inXDays.replace(/\s*·\s*$/, '').replace('{n}', String(diffDays)).trim();

    let relativeLabel = '';
    if (diffDays === 0) {
      relativeLabel = `${t.today} ${wk}`;
    } else if (diffDays === 1) {
      relativeLabel = `${t.tomorrow} ${wk}`;
    } else if (diffDays === 2) {
      relativeLabel = `${twoDaysLabel} ${wk}`;
    } else if (diffDays > 2) {
      relativeLabel = `${inXDaysLabel} ${wk}`;
    } else {
      relativeLabel = `${tDate.getMonth() + 1}/${tDate.getDate()} ${wk}`;
    }

    return {
      targetDateStr,
      relativeLabel,
      tasks: tasks.slice(0, 2),
      totalCount: tasks.length,
    };
  }, [events, selectedDateStr, todayStr, todayDate, isChinese, settings.language, localeCode, t.today, t.tomorrow, ui.dayAfterTomorrow, ui.inXDays]);

  const handleAnimatedTaskToggle = (evt: CalendarEvent) => {
    if (!onToggleEventComplete) return;
    triggerHaptic('success', hapticsEnabled);
    if (!evt.isCompleted) {
      if (completingTaskIds.has(evt.id)) return;
      setCompletingTaskIds((prev) => new Set(prev).add(evt.id));
      window.setTimeout(() => {
        onToggleEventComplete(evt);
        setCompletingTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(evt.id);
          return next;
        });
      }, 240);
      return;
    }
    onToggleEventComplete(evt);
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleContainerScroll}
      className="flex-1 flex flex-col h-full overflow-y-auto relative select-none pb-32 bg-[#F2F2F7] dark:bg-black transition-colors"
    >
      <div className="max-w-7xl mx-auto w-full px-2.5 sm:px-5 pt-2 sm:pt-3 space-y-3">
        {/* ==================== SECTION 1: WEEK STRIP / SWIPE-DOWN MONTH GRID ==================== */}
        <section
          onTouchStart={handleGridTouchStart}
          onTouchMove={handleGridTouchMove}
          onTouchEnd={handleGridTouchEnd}
          onPointerDown={handleCalendarPointerDown}
          onPointerMove={handleCalendarPointerMove}
          onPointerUp={handleCalendarPointerUp}
          className="rounded-3xl bg-white/85 dark:bg-white/[0.06] backdrop-blur-2xl border border-white/85 dark:border-white/12 shadow-2xs overflow-hidden touch-pan-y"
        >
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 text-center pt-2.5 pb-1.5 px-1 sm:px-2 border-b border-neutral-100/90 dark:border-neutral-800/70">
            {compactWeekdayNames.map((name, idx) => {
              const isWeekend =
                settings.firstDayOfWeek === 1 ? idx >= 5 : idx === 0 || idx === 6;
              return (
                <div
                  key={`${name}_${idx}`}
                  className={`text-xs font-bold tracking-wider ${
                    isWeekend
                      ? 'text-neutral-600 dark:text-neutral-300'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {name}
                </div>
              );
            })}
          </div>

          {/* 7-Day Week Strip or Full 5/6-Row Month Grid with Swipe Parallax */}
          <div
            className={`grid grid-cols-7 px-1 sm:px-2 py-2 gap-y-1.5 ${
              isMonthExpanded ? 'gap-x-0.5 sm:gap-x-1' : 'gap-x-0.5 sm:gap-x-1.5'
            } ${
              monthTransitionDir === 'next'
                ? 'animate-month-next'
                : monthTransitionDir === 'prev'
                ? 'animate-month-prev'
                : ''
            }`}
          >
            {displayCells.map((cell, idx) => {
              const dateStr = cell.dateString;
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === todayStr;
              const isTapped = tappedDateStr === dateStr;
              const colIdx = idx % 7;
              const rowIdx = Math.floor(idx / 7);
              const cellParallaxX = swipeDragX !== 0 ? swipeDragX * (0.65 + colIdx * 0.08) : 0;
              const cellParallaxY = scrollParallaxY > 0 ? -Math.min(5, scrollParallaxY * (0.25 + rowIdx * 0.12)) : 0;

              const dayEvents = sortEventsForDay(getEventsForDate(events, dateStr)).filter(
                (e) => !e.isInTrash && !e.isCompleted
              );
              const pubHoliday = publicHolidays.get(dateStr);
              const parsedHoliday =
                settings.showHolidays !== false
                  ? getHolidayForDate(
                      dateStr,
                      settings.language,
                      location,
                      settings.enableChineseWorkdays !== false
                    ) || regionalHolidays.get(dateStr) || null
                  : null;
              const isStatutoryOff = Boolean(parsedHoliday?.isOffDay);
              const lunar =
                isChinese && settings.showLunarCalendar !== false
                  ? getLunarInfo(cell.date)
                  : null;
              const weather =
                settings.showWeatherIcon !== false ? getKnownDayWeather(dateStr, location) : null;

              const isIsoWeekAnchor = cell.date.getDay() === 1;
              const isoWeek = getISOWeekInfo(cell.date);
              const isoYearDiffers = isoWeek.year !== cell.date.getFullYear();

              // Sub-label under date: statutory holiday -> ISO week on Monday -> solar term / festival / lunar day
              let subLabel = '';
              let isAccentSubLabel = false;
              if (parsedHoliday && parsedHoliday.isOffDay) {
                subLabel = parsedHoliday.localName;
                isAccentSubLabel = true;
              } else if (settings.showWeekNumbers !== false && isIsoWeekAnchor && !isMonthExpanded) {
                subLabel = formatWeekNumber(
                  isoWeek.week,
                  settings.language,
                  isoYearDiffers ? isoWeek.year : undefined
                );
              } else if (lunar) {
                if (lunar.solarTerm) {
                  subLabel = lunar.solarTerm;
                  isAccentSubLabel = true;
                } else if (lunar.lunarFestival) {
                  subLabel = lunar.lunarFestival;
                  isAccentSubLabel = true;
                } else if (lunar.lunarDayName === '初一') {
                  subLabel = lunar.lunarMonthName;
                  isAccentSubLabel = true;
                } else {
                  subLabel = lunar.lunarDayName;
                }
              } else if (pubHoliday) {
                subLabel = pubHoliday;
                isAccentSubLabel = true;
              }

              const firstTimedEvent = dayEvents.find((e) => !e.isAllDay && Boolean(e.startTime));
              const firstTimeChip = firstTimedEvent?.startTime
                ? formatTimeDisplay(firstTimedEvent.startTime, settings.use24HourFormat)
                : null;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDaySelect(cell.date, dateStr)}
                  style={{
                    transform:
                      cellParallaxX !== 0 || cellParallaxY !== 0
                        ? `translate3d(${cellParallaxX.toFixed(1)}px, ${cellParallaxY.toFixed(1)}px, 0)`
                        : undefined,
                  }}
                  className={`group relative flex flex-col items-center justify-start py-1 px-0.5 rounded-2xl transition-all duration-200 ease-out active:-translate-y-1 active:scale-[1.04] cursor-pointer min-w-0 ${
                    isTapped ? 'z-10' : isSelected ? 'z-10' : ''
                  } ${
                    isMonthExpanded ? 'min-h-[62px] sm:min-h-[74px]' : 'min-h-[66px] sm:min-h-[72px]'
                  } ${
                    !cell.isCurrentMonth && isMonthExpanded
                      ? 'opacity-40'
                      : isStatutoryOff && !isSelected
                      ? 'bg-amber-500/[0.06] dark:bg-amber-400/[0.08] hover:bg-amber-500/[0.11]'
                      : 'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  {/* Top-right daily micro weather icon */}
                  {weather && (
                    <span
                      className="absolute top-0.5 end-0.5 sm:end-1 z-10 pointer-events-none"
                      title={`${getLocalizedWeatherText(weather.weatherCode, settings.language)} · ${weather.minTemp}°~${weather.maxTemp}°`}
                    >
                      {renderWeatherLucideIcon(weather.weatherIcon, 'w-3 h-3')}
                    </span>
                  )}

                  {/* Selected Circle vs Today Luminous Ring vs Normal Date Cell */}
                  {isSelected ? (
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full text-white flex flex-col items-center justify-center shrink-0 mt-1.5 month-cell-selected-lift ${
                        isTapped ? 'animate-cell-tap' : ''
                      }`}
                      style={{
                        backgroundColor: isToday ? accentColor : '#689F38',
                        boxShadow: isToday
                          ? `0 10px 22px -2px ${accentColor}66, 0 4px 10px -2px rgba(0, 0, 0, 0.18), 0 0 0 3px ${accentColor}38`
                          : '0 10px 22px -2px rgba(104, 159, 56, 0.45), 0 4px 10px -2px rgba(0, 0, 0, 0.14)',
                      }}
                    >
                      <span className="text-[15px] sm:text-base font-bold font-mono tabular-nums leading-none">
                        {cell.date.getDate()}
                      </span>
                      {isChinese && lunar && (
                        <span className="text-[9.5px] leading-tight text-white/95 mt-0.5 font-medium truncate max-w-[38px]">
                          {parsedHoliday?.isOffDay
                            ? parsedHoliday.localName
                            : lunar.solarTerm || lunar.lunarFestival || lunar.lunarDayName}
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="relative flex items-center justify-center mt-1.5">
                        <span
                          style={
                            isToday
                              ? {
                                  color: accentColor,
                                  borderColor: `${accentColor}AA`,
                                  boxShadow: `0 0 0 3px ${accentColor}26, 0 0 14px ${accentColor}48`,
                                }
                              : undefined
                          }
                          className={`text-base sm:text-lg font-semibold font-mono tabular-nums leading-none transition-all ${
                            isToday
                              ? 'w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center font-black bg-white/85 dark:bg-neutral-900/80'
                              : isStatutoryOff
                              ? 'text-amber-700 dark:text-amber-300 font-bold'
                              : 'text-neutral-900 dark:text-neutral-100'
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>

                        {/* Statutory Holiday (休/班 or Regional Badge) */}
                        {parsedHoliday && (
                          <span
                            className={`ml-0.5 text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-black text-white shrink-0 ${
                              parsedHoliday.isOffDay
                                ? parsedHoliday.region === 'CN' || parsedHoliday.region === 'TW'
                                  ? 'bg-[#7CB342] dark:bg-emerald-600'
                                  : 'bg-amber-500 dark:bg-amber-500'
                                : 'bg-rose-600 dark:bg-rose-500'
                            }`}
                            title={parsedHoliday.localName}
                          >
                            {isChinese && (parsedHoliday.region === 'CN' || parsedHoliday.region === 'TW')
                              ? parsedHoliday.isOffDay
                                ? '休'
                                : '班'
                              : parsedHoliday.isOffDay
                              ? '★'
                              : 'W'}
                          </span>
                        )}
                      </div>

                      {/* Sub-label: Holiday / Week Number / Solar Term / Lunar Day */}
                      {subLabel && (
                        <span
                          className={`mt-1 text-[10px] leading-tight truncate max-w-full px-0.5 ${
                            parsedHoliday?.isOffDay
                              ? 'text-amber-700 dark:text-amber-300 font-bold'
                              : isAccentSubLabel
                              ? 'text-[#558B2F] dark:text-emerald-400 font-bold'
                              : 'text-neutral-500 dark:text-neutral-400 font-normal'
                          }`}
                        >
                          {subLabel}
                        </span>
                      )}
                    </>
                  )}

                  {/* Event Time Chip or Dot Indicator */}
                  {firstTimeChip ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onDateClick(dateStr);
                      }}
                      className="mt-1 px-1.5 py-[1px] rounded bg-[#E08A3C] dark:bg-amber-600 text-white text-[9px] font-mono tabular-nums font-bold leading-tight truncate max-w-full shadow-2xs"
                    >
                      {firstTimeChip}
                    </span>
                  ) : dayEvents.length > 0 && !isSelected ? (
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#689F38] dark:bg-emerald-400" />
                  ) : null}

                  {/* Expanded month ISO week micro badge on Mondays */}
                  {isMonthExpanded && settings.showWeekNumbers !== false && isIsoWeekAnchor && (
                    <span
                      className="mt-0.5 text-[8px] font-mono tabular-nums text-neutral-400 dark:text-neutral-500"
                      title={`${formatISOWeekCode(isoWeek)} (ISO 8601)`}
                    >
                      {formatWeekNumber(isoWeek.week, settings.language)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ==================== SECTION 2: RESPONSIVE BENTO DASHBOARD (3 CORE CARDS) ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          {/* CARD 1: Almanac, Zodiac, Live Weather Trend & Bilingual Quote */}
          <section className="lg:col-span-7 rounded-3xl bg-white/85 dark:bg-white/[0.06] backdrop-blur-2xl border border-white/85 dark:border-white/12 shadow-2xs p-3.5 sm:p-5 flex flex-col justify-between gap-3">
            {/* Top Header Split: Left Zodiac + Lunar / Right Live Weather Trend & Advisory */}
            <div className="flex items-start justify-between gap-2.5 sm:gap-3">
              <div
                onClick={() => onDateClick(selectedDateStr)}
                className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 cursor-pointer group"
              >
                <ZodiacEmblem zodiac={selectedLunar.zodiac} className="w-12 h-12 sm:w-14 sm:h-14" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 group-hover:text-[#558B2F] dark:group-hover:text-emerald-400 transition-colors">
                      {isChinese
                        ? `${selectedLunar.lunarMonthName.replace(/^正/, '正')}${selectedLunar.lunarDayName}`
                        : `${currentDate.toLocaleDateString(localeCode, { month: 'short', day: 'numeric', weekday: 'short' })}`}
                    </h2>
                    {selectedLunar.solarTerm && isChinese && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#689F38]/12 text-[#558B2F] dark:text-emerald-400">
                        {selectedLunar.solarTerm}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 whitespace-nowrap truncate tracking-tight">
                    {isChinese
                      ? selectedLunar.fullGanZhi
                      : `ISO ${formatISOWeekCode(getISOWeekInfo(currentDate))}`}
                  </p>
                </div>
              </div>

              {/* Right: Tomorrow Forecast + Multi-Day Trend + Dynamic Weather Advisory */}
              <div
                onClick={() => onOpenWeather?.(selectedDateStr)}
                className="flex flex-col items-end text-right shrink-0 cursor-pointer group"
              >
                {weatherBundle.tomorrowWeather ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      {renderWeatherLucideIcon(weatherBundle.tomorrowWeather.weatherIcon, 'w-5 h-5')}
                      <div className="text-left">
                        <div className="text-[10px] font-medium text-neutral-400 leading-none">
                          {weatherBundle.tomorrowLabel}
                        </div>
                        <div className="text-[11px] font-bold font-mono tabular-nums text-neutral-800 dark:text-neutral-200 leading-tight mt-0.5">
                          {weatherBundle.tomorrowWeather.maxTemp}°/{weatherBundle.tomorrowWeather.minTemp}°{' '}
                          <span className="font-sans font-medium text-neutral-500 dark:text-neutral-400">
                            {getLocalizedWeatherText(weatherBundle.tomorrowWeather.weatherCode, settings.language)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                      {weatherBundle.trendDirection === 'up' ? (
                        <TrendingUp className="w-3 h-3 text-amber-500" />
                      ) : weatherBundle.trendDirection === 'down' ? (
                        <TrendingDown className="w-3 h-3 text-sky-500" />
                      ) : (
                        <Minus className="w-3 h-3 text-neutral-400" />
                      )}
                      <span>{weatherBundle.trendText}</span>
                    </div>

                    {weatherBundle.advisory && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-100/90 dark:bg-neutral-800/80 group-hover:bg-neutral-200/80 dark:group-hover:bg-neutral-700/80 transition-colors">
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center ${
                            weatherBundle.advisory.isAlert
                              ? 'bg-rose-600 text-white'
                              : 'bg-[#689F38] text-white'
                          }`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                        </span>
                        <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                          {weatherBundle.advisory.label}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-xs font-semibold text-neutral-400">
                    {ui.weatherBtnTooltip}
                  </span>
                )}
              </div>
            </div>

            {/* Middle: 宜 / 忌 Rows (Chinese Locale) */}
            {isChinese && (
              <div
                onClick={() => setShowAllYiJi((prev) => !prev)}
                className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 cursor-pointer"
              >
                <div className="flex items-start gap-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-[#689F38]/15 text-[#558B2F] dark:text-emerald-400 font-black text-[10px] shrink-0">
                    宜
                  </span>
                  <span
                    className={`text-neutral-700 dark:text-neutral-300 leading-relaxed ${
                      showAllYiJi ? '' : 'truncate'
                    }`}
                  >
                    {selectedLunar.yi.join(' · ')}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-black text-[10px] shrink-0">
                    忌
                  </span>
                  <span
                    className={`text-neutral-500 dark:text-neutral-400 leading-relaxed ${
                      showAllYiJi ? '' : 'truncate'
                    }`}
                  >
                    {selectedLunar.ji.join(' · ')}
                  </span>
                </div>
              </div>
            )}

            {/* Bottom: Misty Offline-Safe Bilingual Quote Strip */}
            <div
              onClick={() => {
                triggerHaptic('selection', hapticsEnabled);
                setQuoteOffset((prev) => prev + 1);
                setIsQuoteRefreshing(true);
                window.setTimeout(() => setIsQuoteRefreshing(false), 320);
              }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-100 via-neutral-100/90 to-emerald-50/70 dark:from-neutral-800/90 dark:via-neutral-900/90 dark:to-emerald-950/30 border border-neutral-200/70 dark:border-neutral-700/60 px-4 py-3.5 cursor-pointer group"
            >
              {/* Subtle Offline Atmospheric Botanical Silhouette SVG */}
              <svg
                aria-hidden="true"
                viewBox="0 0 320 90"
                className="absolute inset-0 w-full h-full object-cover opacity-20 dark:opacity-15 pointer-events-none text-neutral-500 dark:text-emerald-300"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 90 L0 64 Q45 48 80 62 T165 56 T245 44 T320 58 L320 90 Z"
                  fill="currentColor"
                  fillOpacity="0.22"
                />
                <path
                  d="M28 90 L28 32 M28 46 L16 36 M28 52 L40 42 M286 90 L286 24 M286 38 L272 28 M286 45 L300 34"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.35"
                />
              </svg>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('selection', hapticsEnabled);
                  setQuoteOffset((prev) => prev + 1);
                  setIsQuoteRefreshing(true);
                  window.setTimeout(() => setIsQuoteRefreshing(false), 320);
                }}
                className="absolute top-2 right-2 z-20 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-white/75 dark:hover:bg-neutral-700/75 transition-colors cursor-pointer"
                title={t.refreshQuoteTooltip}
                aria-label={t.refreshQuoteTooltip}
              >
                <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-300 ${isQuoteRefreshing ? 'rotate-180' : ''}`} />
              </button>

              <div className="relative z-10 pr-7 space-y-1">
                <p className="text-sm sm:text-[15px] font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                  “{bilingualQuote.primaryText}”
                </p>
                <div className="text-right text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  —— {bilingualQuote.primaryAuthor}
                </div>
                {bilingualQuote.secondaryText && (
                  <p className="text-[11px] sm:text-xs italic text-neutral-500 dark:text-neutral-400 leading-snug pt-0.5">
                    "{bilingualQuote.secondaryText}"
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* RIGHT STACK ON DESKTOP / MIDDLE + BOTTOM ON MOBILE */}
          <div className="lg:col-span-5 flex flex-col gap-3 justify-between">
            {/* CARD 2: Nearest Pending To-Do Card (Clean bordered card, no schedule date header when empty) */}
            <section className="rounded-3xl bg-white/85 dark:bg-white/[0.06] backdrop-blur-2xl border border-neutral-200/85 dark:border-white/12 shadow-2xs p-4">
              {todoSection.tasks.length === 0 ? (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span>{ui.noPendingTasksDay}</span>
                    <button
                      type="button"
                      onClick={() => onCreateEventOnDate(selectedDateStr)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t.add}</span>
                    </button>
                  </div>
                  {onOpenAgenda && (
                    <div className="flex justify-end border-t border-neutral-100/90 dark:border-white/10 pt-2">
                      <button
                        type="button"
                        onClick={onOpenAgenda}
                        className="text-[11px] font-bold text-[#689F38] dark:text-emerald-400 hover:underline cursor-pointer shrink-0"
                      >
                        {ui.viewAllTodos}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-neutral-100/90 dark:border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span className="text-xs font-extrabold text-neutral-700 dark:text-neutral-200 truncate">
                        {todoSection.relativeLabel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onCreateEventOnDate(todoSection.targetDateStr)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t.add}</span>
                    </button>
                  </div>

                  <div className="mt-2.5 space-y-1.5">
                  {todoSection.tasks.map((evt) => {
                    const isCompleting = completingTaskIds.has(evt.id);
                    const priorityColor =
                      evt.priority === 'high'
                        ? 'bg-rose-500'
                        : evt.priority === 'medium'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500';
                    return (
                      <div
                        key={`todo_${evt.id}`}
                        onClick={() => onSelectEvent(evt)}
                        className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-2xl bg-neutral-100/75 dark:bg-white/[0.05] hover:bg-neutral-200/75 dark:hover:bg-white/[0.1] transition-all duration-200 cursor-pointer ${
                          isCompleting ? 'opacity-0 scale-[0.97]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnimatedTaskToggle(evt);
                            }}
                            className="text-neutral-400 hover:text-emerald-500 transition-colors shrink-0 cursor-pointer"
                            aria-label={evt.title}
                          >
                            {isCompleting ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-check-pop" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColor}`} />
                          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                            {evt.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {evt.startTime && !evt.isAllDay && (
                            <span className="text-[10px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
                              {formatTimeDisplay(evt.startTime, settings.use24HourFormat)}
                            </span>
                          )}
                          {onStartFocusForTask && !evt.isCompleted && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartFocusForTask(evt.id);
                              }}
                              className="opacity-75 sm:opacity-0 group-hover:opacity-100 p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
                              title={t.pomoStart}
                            >
                              <Flame className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {onOpenAgenda && (
                    <button
                      type="button"
                      onClick={onOpenAgenda}
                      className="w-full pt-1 text-right text-[11px] font-bold text-[#689F38] dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {ui.viewAllTodos}
                    </button>
                  )}
                  </div>
                </>
              )}
            </section>

            {/* CARD 3: 最近的倒数日 (Integrated Countdowns & Solar Terms Card) */}
            <section className="rounded-3xl bg-white/85 dark:bg-white/[0.06] backdrop-blur-2xl border border-white/85 dark:border-white/12 shadow-2xs p-4 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => onOpenCountdowns?.()}
                  className="text-xs font-extrabold text-[#558B2F] dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>{ui.recentCountdownsTitle}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenCountdowns?.()}
                  className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-0.5 cursor-pointer"
                >
                  <CalendarIcon className="w-3 h-3" />
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {upcomingCountdowns.length === 0 ? (
                  <div className="py-3 text-center text-xs text-neutral-400">
                    {t.emptyCountdownsTitle}
                  </div>
                ) : (
                  upcomingCountdowns.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onOpenCountdowns?.()}
                      className="flex items-center justify-between gap-2 py-1 px-1.5 -mx-1.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-baseline gap-2.5 min-w-0">
                        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {item.title}
                        </span>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono tabular-nums shrink-0">
                          {item.dateLabel}
                        </span>
                      </div>

                      <div className="text-right shrink-0 font-mono tabular-nums">
                        {item.daysAway === 0 ? (
                          <span className="text-sm font-black text-[#558B2F] dark:text-emerald-400">
                            {t.today}
                          </span>
                        ) : (
                          <span className="text-base font-black text-neutral-900 dark:text-neutral-100">
                            {item.daysAway}
                            <span className="text-[11px] font-sans font-normal text-neutral-500 dark:text-neutral-400 ml-0.5">
                              {ui.daysLaterSuffix}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

    </div>
  );
};
