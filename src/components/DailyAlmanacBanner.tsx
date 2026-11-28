import React, { useState } from 'react';
import { AppSettings } from '../types/calendar';
import { getTranslation, getExtraLabels, isChineseLocale } from '../utils/i18n';
import { getLunarInfo } from '../utils/lunarCalendar';
import { getDailyQuote, getQuoteBg, getBilingualQuote, DAILY_QUOTES } from '../utils/quotes';
import {
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DailyAlmanacBannerProps {
  currentDate: Date;
  settings: AppSettings;
  isCompact?: boolean;
  onToggleStretch?: () => void;
}

export const DailyAlmanacBanner: React.FC<DailyAlmanacBannerProps> = ({
  currentDate,
  settings,
  isCompact,
  onToggleStretch,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);
  const isChinese = isChineseLocale(settings.language);

  // Quote rotation state
  const [quoteOffset, setQuoteOffset] = useState(0);

  const defaultQuote = getDailyQuote(currentDate);
  const currentQuoteIndex = (DAILY_QUOTES.findIndex((q) => q.id === defaultQuote.id) + quoteOffset) % DAILY_QUOTES.length;
  const activeQuote = DAILY_QUOTES[currentQuoteIndex >= 0 ? currentQuoteIndex : 0];

  const isDark =
    settings.themeMode === 'dark' ||
    settings.themeMode === 'amoled' ||
    (settings.themeMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Background illustration harmonious with dark / light themes
  const bgUrl = getQuoteBg(activeQuote, isDark);
  const bilingual = getBilingualQuote(activeQuote, settings.language);
  const lunar = isChinese ? getLunarInfo(currentDate) : null;

  const handleNextQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuoteOffset((prev) => prev + 1);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xl select-none transition-all duration-300">
      {/* Background illustration with harmonious blending and gradient mask */}
      {settings.bgImagePosition !== 'none' && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${bgUrl})` }}
        >
          <div
            className={`absolute inset-0 backdrop-blur-2xs ${
              isDark
                ? 'bg-gradient-to-t from-neutral-950/95 via-neutral-900/85 to-neutral-900/65'
                : 'bg-gradient-to-t from-white/95 via-white/85 to-white/75'
            }`}
          />
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 p-4 sm:p-6 flex flex-col justify-between gap-3.5">
        {/* Top bar: Chinese Almanac GanZhi or International Date Header */}
        <div className="flex items-center justify-between gap-2 border-b border-neutral-200/60 dark:border-neutral-800/60 pb-2.5">
          {isChinese && lunar ? (
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                {settings.language === 'zh-TW' ? '農曆' : '农历'} {lunar.lunarMonthName}{lunar.lunarDayName}
              </span>
              {/* Requirement 1 detail adjustment: "乙丑牛年 · 甲子月 · 丁卯日" */}
              <span className="text-neutral-700 dark:text-neutral-200 font-medium">
                {lunar.fullGanZhi}
              </span>
              {lunar.solarTerm && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                  {lunar.solarTerm}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>{t.dailyQuoteTitle}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleNextQuote}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              title={t.refreshQuoteTooltip}
              aria-label={t.refreshQuoteTooltip}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {onToggleStretch && (
              <button
                type="button"
                onClick={onToggleStretch}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                title={isCompact ? ui.monthStretchFull : ui.monthStretchCompact}
                aria-label={isCompact ? ui.monthStretchFull : ui.monthStretchCompact}
              >
                {isCompact ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Middle: Daily Wisdom Quote (Requirement 4: Bilingual display in non-English locales, single English in English locale) */}
        <div className="space-y-1.5 py-1">
          {/* Primary quote line (Localized native) */}
          <p className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed drop-shadow-2xs">
            “{bilingual.primaryText}”
          </p>
          <div className="text-right text-xs font-bold text-neutral-600 dark:text-neutral-300">
            —— {bilingual.primaryAuthor}
          </div>

          {/* Secondary quote line: English counterpart (only shown in non-English environments) */}
          {bilingual.secondaryText && (
            <div className="pt-1 border-t border-neutral-200/40 dark:border-neutral-800/40 space-y-0.5">
              <p className="text-xs sm:text-sm font-medium italic text-neutral-500 dark:text-neutral-400 leading-normal">
                "{bilingual.secondaryText}"
              </p>
              <div className="text-right text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                — {bilingual.secondaryAuthor}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Almanac 宜/忌 (Only displayed on Chinese locale) */}
        {isChinese && lunar && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 text-xs">
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                宜
              </span>
              <span className="truncate">{lunar.yi.slice(0, 4).join(' · ')}</span>
            </div>

            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                忌
              </span>
              <span className="truncate">{lunar.ji.slice(0, 4).join(' · ')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
