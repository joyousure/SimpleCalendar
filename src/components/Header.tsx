import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MoreVertical,
  Globe,
  Sparkles,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Calendar as CalendarIcon,
  RefreshCw,
  Settings,
  Shield,
  ChevronLeft,
} from 'lucide-react';
import { ViewMode, AppSettings, WorldClockMode } from '../types/calendar';
import { WeatherLocation, DetailedWeatherData } from '../types/weather';
import { formatMonthYear, formatFullDate } from '../utils/dateUtils';
import { getTranslation, getExtraLabels, getLocaleCode, isChineseLocale, isRtlLanguage } from '../utils/i18n';
import { saveSettingsToStorage } from '../utils/storage';
import { fetchWeatherData } from '../utils/weatherService';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';

interface HeaderProps {
  currentDate: Date;
  viewMode?: ViewMode;
  onViewModeChange?: (view: ViewMode) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  onNewEvent?: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy?: () => void;
  onOpenVoice?: () => void;
  onOpenWeather?: () => void;
  onOpenWorldClock?: (city?: string) => void;
  location?: WeatherLocation;
  settings: AppSettings;
  onToggleTheme?: () => void;
  onUpdateSettings?: (settings: AppSettings) => void;
  onRefreshAll?: () => void;
  isRefreshingAll?: boolean;
  canGoBack?: boolean;
  onSystemBack?: () => void;
}

const MODES: WorldClockMode[] = ['flip', 'analog', 'capsule', 'glass', 'hud', 'minimal'];

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  viewMode = 'month',
  onViewModeChange,
  onToday,
  onOpenSearch,
  onOpenSettings,
  onOpenPrivacy,
  onOpenWeather,
  onOpenWorldClock,
  location,
  settings,
  onUpdateSettings,
  onRefreshAll,
  isRefreshingAll = false,
  canGoBack = false,
  onSystemBack,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);
  const isChinese = isChineseLocale(settings.language);
  const isRtl = isRtlLanguage(settings.language);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);

  useSystemBackLayer(
    isViewMenuOpen || isSettingsMenuOpen,
    () => {
      setIsViewMenuOpen(false);
      setIsSettingsMenuOpen(false);
    },
    BACK_PRIORITY.MENU_POPOVER,
    'header-dropdown-menu'
  );

  useEffect(() => {
    if (!isViewMenuOpen && !isSettingsMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (isViewMenuOpen && viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setIsViewMenuOpen(false);
      }
      if (isSettingsMenuOpen && settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isViewMenuOpen, isSettingsMenuOpen]);

  // Live ticking time for the 2 reference World Clocks (updates every 5 seconds since no seconds displayed)
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Weather state (auto-fetched & updated for current device location)
  const [currentWeather, setCurrentWeather] = useState<{ temp: number; icon: string; text: string } | null>(() => {
    try {
      const cached = localStorage.getItem('weather_data_cache_v2');
      if (cached) {
        const parsed: DetailedWeatherData = JSON.parse(cached);
        if (parsed.current) {
          return {
            temp: parsed.current.temp,
            icon: parsed.current.weatherIcon || 'cloud-sun',
            text: parsed.current.weatherText || '',
          };
        }
      }
    } catch {}
    return { temp: 22, icon: 'cloud-sun', text: '' };
  });

  useEffect(() => {
    let isMounted = true;
    if (location) {
      fetchWeatherData(location, settings.language).then((data) => {
        if (isMounted && data && data.current) {
          setCurrentWeather({
            temp: data.current.temp,
            icon: data.current.weatherIcon || 'cloud-sun',
            text: data.current.weatherText || '',
          });
        }
      });
    }

    const handleWeatherUpdate = (e: CustomEvent<DetailedWeatherData>) => {
      if (e.detail?.current) {
        setCurrentWeather({
          temp: e.detail.current.temp,
          icon: e.detail.current.weatherIcon || 'cloud-sun',
          text: e.detail.current.weatherText || '',
        });
      }
    };

    window.addEventListener('weather-updated', handleWeatherUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('weather-updated', handleWeatherUpdate);
    };
  }, [location, settings.language]);

  // 6 World Clock Styles (swipeable)
  const [activeMode, setActiveMode] = useState<WorldClockMode>(settings.worldClockMode || 'flip');

  useEffect(() => {
    if (settings.worldClockMode && settings.worldClockMode !== activeMode) {
      setActiveMode(settings.worldClockMode);
    }
  }, [settings.worldClockMode]);

  // Swipe gesture handling for world clock (with swipe-vs-click guard)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const didSwipeClockRef = useRef<boolean>(false);

  const handleNextMode = () => {
    const idx = MODES.indexOf(activeMode);
    const nextMode = MODES[(idx + 1) % MODES.length];
    changeMode(nextMode);
  };

  const handlePrevMode = () => {
    const idx = MODES.indexOf(activeMode);
    const prevMode = MODES[(idx - 1 + MODES.length) % MODES.length];
    changeMode(prevMode);
  };

  const changeMode = (newMode: WorldClockMode) => {
    setActiveMode(newMode);
    const updated = { ...settings, worldClockMode: newMode };
    if (onUpdateSettings) {
      onUpdateSettings(updated);
    }
    saveSettingsToStorage(updated);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    didSwipeClockRef.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(diffX) > 25 && Math.abs(diffX) > Math.abs(diffY)) {
      didSwipeClockRef.current = true;
      if (diffX < 0) {
        handleNextMode();
      } else {
        handlePrevMode();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    didSwipeClockRef.current = false;
    mouseStartX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX.current === null) return;
    const diffX = e.clientX - mouseStartX.current;
    if (Math.abs(diffX) > 25) {
      didSwipeClockRef.current = true;
      if (diffX < 0) {
        handleNextMode();
      } else {
        handlePrevMode();
      }
    }
    mouseStartX.current = null;
  };

  // High-precision clean formatter: returns concise localized weekday + "HH:mm"
  const formatClockWeekdayAndTime = (date: Date, timeZone: string) => {
    try {
      const is12Hour = !settings.use24HourFormat;
      const localeCode = getLocaleCode(settings.language);
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: is12Hour,
      }).formatToParts(date);

      let hour = '00';
      let minute = '00';
      let weekdayEn = 'Mon';

      parts.forEach((p) => {
        if (p.type === 'hour') hour = p.value;
        else if (p.type === 'minute') minute = p.value;
        else if (p.type === 'weekday') weekdayEn = p.value;
      });

      const cnWeekdayMap: Record<string, string> = {
        Mon: '周一',
        Tue: '周二',
        Wed: '周三',
        Thu: '周四',
        Fri: '周五',
        Sat: '周六',
        Sun: '周日',
      };
      const twWeekdayMap: Record<string, string> = {
        Mon: '週一',
        Tue: '週二',
        Wed: '週三',
        Thu: '週四',
        Fri: '週五',
        Sat: '週六',
        Sun: '週日',
      };

      let weekdayStr = weekdayEn;
      if (settings.language === 'zh-TW') {
        weekdayStr = twWeekdayMap[weekdayEn] || weekdayEn;
      } else if (settings.language === 'zh-CN') {
        weekdayStr = cnWeekdayMap[weekdayEn] || weekdayEn;
      } else {
        weekdayStr = new Intl.DateTimeFormat(localeCode, {
          timeZone,
          weekday: 'short',
        }).format(date);
      }

      return {
        timeStr: `${hour}:${minute}`,
        weekdayStr,
      };
    } catch {
      const str = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      return { timeStr: str, weekdayStr: '' };
    }
  };

  // Relative offset calculation
  const getRelativeOffset = (timeZone: string) => {
    try {
      const localH = now.getHours() + now.getMinutes() / 60;
      const targetStr = now.toLocaleTimeString('en-US', {
        timeZone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
      const [th, tm] = targetStr.split(':').map(Number);
      const targetH = th + tm / 60;
      let diff = Math.round(targetH - localH);
      if (diff > 12) diff -= 24;
      if (diff < -12) diff += 24;
      if (diff === 0) return ui.clockBaseLabel;
      return diff > 0 ? `+${diff}h` : `${diff}h`;
    } catch {
      return '';
    }
  };

  const londonClock = formatClockWeekdayAndTime(now, 'Europe/London');
  const nyClock = formatClockWeekdayAndTime(now, 'America/New_York');

  const londonLabels: Record<string, string> = {
    'zh-CN': '伦敦',
    'zh-TW': '倫敦',
    en: 'London',
    ja: 'ロンドン',
    ko: '런던',
    fr: 'Londres',
    ru: 'Лондон',
    fa: 'لندن',
    mn: 'Лондон',
    ug: 'لوندون',
  };
  const nyLabels: Record<string, string> = {
    'zh-CN': '纽约',
    'zh-TW': '紐約',
    en: 'New York',
    ja: 'ニューヨーク',
    ko: '뉴욕',
    fr: 'New York',
    ru: 'Нью-Йорк',
    fa: 'نیویورک',
    mn: 'Нью-Йорк',
    ug: 'نيۇ-يورك',
  };

  const clocks = [
    {
      id: 'london',
      title: londonLabels[settings.language] || 'London',
      city: 'London',
      icon: Globe,
      flag: '🇬🇧',
      weekday: londonClock.weekdayStr,
      time: londonClock.timeStr,
      offset: getRelativeOffset('Europe/London') || '-8h',
    },
    {
      id: 'ny',
      title: nyLabels[settings.language] || t.worldClockNewYork,
      city: 'New York',
      icon: Sparkles,
      flag: '🇺🇸',
      weekday: nyClock.weekdayStr,
      time: nyClock.timeStr,
      offset: getRelativeOffset('America/New_York') || '-13h',
    },
  ];

  const getDisplayTitle = () => {
    if (viewMode === 'day') {
      return formatFullDate(currentDate, settings.language);
    }
    if (viewMode === 'year') {
      return isChinese
        ? `${currentDate.getFullYear()}年`
        : currentDate.getFullYear().toString();
    }
    if (isChinese) {
      return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
    }
    return formatMonthYear(currentDate, settings.language);
  };

  const renderWeatherIcon = (iconName: string) => {
    switch (iconName) {
      case 'sun':
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      case 'cloud':
        return <Cloud className="w-3.5 h-3.5 text-neutral-400" />;
      case 'cloud-rain':
        return <CloudRain className="w-3.5 h-3.5 text-blue-400" />;
      case 'cloud-snow':
        return <CloudSnow className="w-3.5 h-3.5 text-sky-300" />;
      case 'cloud-lightning':
        return <CloudLightning className="w-3.5 h-3.5 text-yellow-500" />;
      case 'cloud-fog':
        return <CloudFog className="w-3.5 h-3.5 text-neutral-400" />;
      default:
        return <CloudSun className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 pt-[env(safe-area-inset-top)] bg-[#FAFBF8]/95 dark:bg-neutral-900/95 backdrop-blur-2xl border-b border-neutral-200/60 dark:border-neutral-800/80 transition-colors select-none">
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 px-2.5 sm:px-5 h-12 sm:h-14 max-w-7xl mx-auto w-full flex-nowrap">
        {/* 1. Left: Contextual System Back + Interactive Month/View Selector */}
        <div className="relative flex items-center gap-0.5 shrink-0 min-w-0" ref={viewMenuRef}>
          {canGoBack && onSystemBack && (
            <button
              type="button"
              onClick={onSystemBack}
              aria-label={t.backButton}
              title={t.backButton}
              className="min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] -ms-1 flex items-center justify-center rounded-xl hover:bg-neutral-100/90 dark:hover:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 transition-all active:scale-95 cursor-pointer shrink-0 animate-fade-in"
            >
              <ChevronLeft className={`w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2.4] ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsViewMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 min-h-[38px] sm:min-h-[40px] py-1 px-1.5 -ms-0.5 rounded-xl hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer whitespace-nowrap min-w-0 shrink"
            aria-expanded={isViewMenuOpen}
            aria-label={getDisplayTitle()}
          >
            <h1 className="text-[15px] sm:text-xl font-medium tracking-tight text-neutral-900 dark:text-neutral-50 whitespace-nowrap truncate max-w-[138px] xs:max-w-[168px] sm:max-w-none leading-none">
              {getDisplayTitle()}
            </h1>
            <span
              aria-hidden="true"
              className={`inline-block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4.5px] border-t-neutral-800 dark:border-t-neutral-200 transition-transform duration-150 shrink-0 ${
                isViewMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isViewMenuOpen && (
            <div className="absolute start-0 top-full mt-1.5 w-44 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xl p-1.5 z-50 animate-fade-in">
              <div className="grid grid-cols-2 gap-1 pb-1.5 mb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                {(
                  [
                    { id: 'month' as ViewMode, label: t.viewMonth },
                    { id: 'week' as ViewMode, label: t.viewWeek },
                    { id: 'day' as ViewMode, label: t.viewDay },
                    { id: 'year' as ViewMode, label: t.viewYear },
                  ]
                ).map((item) => {
                  const active = viewMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onViewModeChange?.(item.id);
                        setIsViewMenuOpen(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {onToday && (
                <button
                  type="button"
                  onClick={() => {
                    onToday();
                    setIsViewMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{t.today}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. Center: Balanced Dual World Clocks (Full display, swipe-guarded) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="flex items-center justify-center gap-1 sm:gap-2.5 cursor-grab active:cursor-grabbing select-none min-w-0 overflow-hidden"
          title={ui.clockSwipeTooltip}
        >
          {clocks.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                if (didSwipeClockRef.current) {
                  didSwipeClockRef.current = false;
                  return;
                }
                onOpenWorldClock?.(c.city);
              }}
              aria-label={`${c.title} ${c.weekday} ${c.time}`}
              className={`flex flex-col items-start justify-center px-1 sm:px-1.5 py-0.5 rounded-md cursor-pointer transition-colors active:scale-[0.98] shrink-0 whitespace-nowrap ${
                activeMode === 'hud'
                  ? 'bg-neutral-950 text-cyan-400 px-1.5'
                  : 'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/70'
              }`}
            >
              <div className="flex items-center gap-0.5 leading-none whitespace-nowrap">
                <span className="text-[10px] sm:text-xs leading-none shrink-0">{c.flag}</span>
                <span
                  className={`text-[8.5px] sm:text-[10px] font-medium leading-none whitespace-nowrap ${
                    activeMode === 'hud'
                      ? 'text-cyan-300'
                      : 'text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  {c.title}
                </span>
              </div>
              <div
                className={`text-[8.5px] sm:text-[10px] font-medium tracking-tighter tabular-nums leading-[1.15] mt-[1px] whitespace-nowrap ${
                  activeMode === 'hud'
                    ? 'text-cyan-400 font-mono'
                    : 'text-neutral-800 dark:text-neutral-200'
                }`}
              >
                {c.weekday}
                {c.time}
              </div>
            </button>
          ))}
        </div>

        {/* 3. Right: Compact Weather Chip + Search + Settings Vertical 3-Dots (+ Offline Shield) */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0 z-20">
          {/* Weather Chip (transparently embedded, zero shadow box) */}
          <button
            type="button"
            onClick={onOpenWeather}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg bg-transparent hover:bg-neutral-100/80 dark:hover:bg-neutral-800/70 transition-colors active:scale-95 text-[11px] font-semibold text-neutral-800 dark:text-neutral-100 cursor-pointer shrink-0"
            title={`${location?.name || ui.currentLocationDefault} · ${ui.weatherBtnTooltip}`}
            aria-label={ui.weatherBtnTooltip}
          >
            {renderWeatherIcon(currentWeather?.icon || 'cloud-sun')}
            <span className="font-mono font-bold text-[11px] tabular-nums">
              {currentWeather ? `${currentWeather.temp}°` : '--°'}
            </span>
          </button>

          {/* Search Icon */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100 transition-colors active:scale-95 cursor-pointer shrink-0"
            title={ui.searchBtnTooltip}
            aria-label={ui.searchBtnTooltip}
          >
            <Search className="w-[16px] h-[16px] sm:w-[17px] sm:h-[17px] stroke-[2]" />
          </button>

          {/* Settings Vertical 3-Dots Button + Dropdown */}
          <div className="relative shrink-0" ref={settingsMenuRef}>
            <button
              type="button"
              onClick={() => setIsSettingsMenuOpen((prev) => !prev)}
              className={`relative min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center rounded-xl transition-colors active:scale-95 cursor-pointer shrink-0 ${
                isSettingsMenuOpen
                  ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100'
              }`}
              title={t.navSettings}
              aria-label={t.navSettings}
              aria-expanded={isSettingsMenuOpen}
              aria-haspopup="menu"
            >
              <MoreVertical className="w-[17px] h-[17px] stroke-[2]" />
            </button>

            {isSettingsMenuOpen && (
              <div
                role="menu"
                className="absolute end-0 top-full mt-1.5 w-36 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xl p-1.5 z-50 animate-fade-in space-y-0.5"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={isRefreshingAll}
                  onClick={() => {
                    onRefreshAll?.();
                    setIsSettingsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ${isRefreshingAll ? 'animate-spin' : ''}`} />
                  <span>{ui.refreshLabel}</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsSettingsMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                  <span>{t.navSettings}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tiny Shield Indicator in Top-Right when Offline Mode is active */}
          {settings.offlineMode && (
            <button
              type="button"
              onClick={() => (onOpenPrivacy ? onOpenPrivacy() : onOpenSettings())}
              className="min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-xl bg-emerald-500/12 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 transition-all active:scale-95 cursor-pointer shrink-0 animate-fade-in"
              title={ui.offlineModeActive}
              aria-label={ui.offlineModeActive}
            >
              <Shield className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
