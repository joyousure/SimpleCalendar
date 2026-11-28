import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, WorldClockMode } from '../types/calendar';
import { getTranslation, getLocaleCode, isRtlLanguage } from '../utils/i18n';
import { getPomodoroWorldBarI18n } from '../utils/fabModalI18n';
import { saveSettingsToStorage } from '../utils/storage';
import {
  Clock,
  Globe,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

interface WorldClockMiniBarProps {
  settings: AppSettings;
  onOpenWorldClock: (initialCity?: string) => void;
  onUpdateSettings?: (settings: AppSettings) => void;
}

const MODES: WorldClockMode[] = ['flip', 'analog', 'capsule', 'glass', 'hud', 'minimal'];

export const WorldClockMiniBar: React.FC<WorldClockMiniBarProps> = ({
  settings,
  onOpenWorldClock,
  onUpdateSettings,
}) => {
  const t = getTranslation(settings.language);
  const pw = getPomodoroWorldBarI18n(settings.language);
  const localeCode = getLocaleCode(settings.language);
  const isRtl = isRtlLanguage(settings.language);
  const [now, setNow] = useState<Date>(new Date());

  // 6 Styles in sequence
  const [activeMode, setActiveMode] = useState<WorldClockMode>(settings.worldClockMode || 'flip');

  useEffect(() => {
    if (settings.worldClockMode && settings.worldClockMode !== activeMode) {
      setActiveMode(settings.worldClockMode);
    }
  }, [settings.worldClockMode]);

  // Live tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Swipe left / right to change clock style (touch & mouse drag)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);

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
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Trigger only if horizontal swipe dominates vertical scroll
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
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
    mouseStartX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX.current === null) return;
    const diffX = e.clientX - mouseStartX.current;
    if (Math.abs(diffX) > 40) {
      if (diffX < 0) {
        handleNextMode();
      } else {
        handlePrevMode();
      }
    }
    mouseStartX.current = null;
  };

  // Formatter helpers
  const formatTime = (date: Date, timeZone?: string) => {
    try {
      return date.toLocaleTimeString(localeCode, {
        timeZone,
        hour12: !settings.use24HourFormat,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return date.toLocaleTimeString();
    }
  };

  const localTimeStr = formatTime(now);
  const gmtTimeStr = formatTime(now, 'UTC');
  const nyTimeStr = formatTime(now, 'America/New_York');

  const clocks = [
    {
      id: 'local',
      title: t.worldClockLocal,
      city: 'Local',
      icon: Clock,
      time: localTimeStr,
      tz: 'UTC' + (now.getTimezoneOffset() <= 0 ? '+' : '-') + Math.abs(now.getTimezoneOffset() / 60),
      color: '#3B82F6',
    },
    {
      id: 'gmt',
      title: t.worldClockGmt,
      city: 'GMT',
      icon: Globe,
      time: gmtTimeStr,
      tz: 'UTC+0',
      color: '#10B981',
    },
    {
      id: 'ny',
      title: t.worldClockNewYork,
      city: 'New York',
      icon: Sparkles,
      time: nyTimeStr,
      tz: 'EDT',
      color: '#8B5CF6',
    },
  ];

  const currentIdx = MODES.indexOf(activeMode);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="relative w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border-b border-neutral-200/80 dark:border-neutral-800/80 px-3 sm:px-6 py-2 transition-all select-none group cursor-grab active:cursor-grabbing"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Swipe arrow controls for desktop/mouse users (Visible on hover) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevMode();
          }}
          className="hidden md:flex absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/95 dark:bg-neutral-800/95 shadow-md border border-neutral-200 dark:border-neutral-700 items-center justify-center text-neutral-600 dark:text-neutral-300 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
          title={pw.prevClockStyle}
          aria-label={pw.prevClockStyle}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNextMode();
          }}
          className="hidden md:flex absolute right-12 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/95 dark:bg-neutral-800/95 shadow-md border border-neutral-200 dark:border-neutral-700 items-center justify-center text-neutral-600 dark:text-neutral-300 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
          title={pw.nextClockStyle}
          aria-label={pw.nextClockStyle}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* 3 World Clocks */}
        <div className="flex-1 grid grid-cols-3 gap-2 sm:gap-3">
          {clocks.map((c) => {
            const Icon = c.icon;

            return (
              <div
                key={c.id}
                onClick={() => onOpenWorldClock(c.city)}
                className={`group/card relative flex flex-col justify-between p-2 sm:p-2.5 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
                  activeMode === 'flip'
                    ? 'bg-neutral-100/90 dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs hover:border-blue-500/50'
                    : activeMode === 'analog'
                    ? 'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 border border-neutral-200/80 dark:border-neutral-800 hover:shadow-xs'
                    : activeMode === 'capsule'
                    ? 'bg-transparent border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60'
                    : activeMode === 'glass'
                    ? 'bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-xs'
                    : activeMode === 'hud'
                    ? 'bg-black text-cyan-400 border border-cyan-950 font-mono shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'
                }`}
                title={`${c.title} - ${pw.clickOpenWorldClockSuffix}`}
              >
                {/* Header label & Icon */}
                <div className="flex items-center justify-between gap-1 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1 truncate">
                    <Icon className="w-3 h-3 shrink-0" style={{ color: c.color }} />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono">
                    {c.tz}
                  </span>
                </div>

                {/* Clock Face */}
                <div className="my-0.5 flex items-baseline justify-between">
                  <span
                    className={`text-sm sm:text-base font-black tracking-tight tabular-nums truncate ${
                      activeMode === 'hud'
                        ? 'text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]'
                        : activeMode === 'glass'
                        ? 'text-neutral-900 dark:text-white drop-shadow-2xs'
                        : activeMode === 'minimal'
                        ? 'font-light text-neutral-900 dark:text-neutral-100'
                        : 'text-neutral-900 dark:text-neutral-100 font-mono'
                    }`}
                  >
                    {c.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Isolated Controls: Completely removed bottom text prompt to prevent accidental taps */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center justify-center gap-1.5 shrink-0 pl-1"
        >
          {/* Distinct, isolated expand button with generous touch target to prevent misclicks */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenWorldClock();
            }}
            className="p-2 sm:p-2.5 rounded-2xl bg-neutral-100/90 dark:bg-neutral-800/90 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-neutral-600 hover:text-blue-600 dark:text-neutral-300 dark:hover:text-blue-400 transition-all border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs hover:shadow-xs active:scale-90"
            title={pw.expandPrecisionClock}
            aria-label={pw.expandPrecisionClock}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Minimal 6 Dots Indicator without any cluttered text label */}
          <div className="flex items-center gap-0.5">
            {MODES.map((m, idx) => (
              <div
                key={m}
                onClick={(e) => {
                  e.stopPropagation();
                  changeMode(m);
                }}
                className={`h-1 rounded-full cursor-pointer transition-all duration-300 ${
                  idx === currentIdx
                    ? 'w-2.5 bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]'
                    : 'w-1 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400'
                }`}
                title={pw.clockModeNames[m]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
