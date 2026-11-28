import React, { useState, useMemo } from 'react';
import { Lightbulb, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { AppSettings, CalendarEvent, ViewMode } from '../types/calendar';
import { getEventsForDate, toDateString } from '../utils/dateUtils';
import { getContextDailyInsight } from '../utils/dailyInsights';
import { triggerHaptic } from '../utils/haptics';

interface DailyInsightWidgetProps {
  events: CalendarEvent[];
  viewMode: ViewMode;
  settings: AppSettings;
}

const COLLAPSE_STORAGE_KEY = 'daily_insight_collapsed_v1';

export const DailyInsightWidget: React.FC<DailyInsightWidgetProps> = ({
  events,
  viewMode,
  settings,
}) => {
  const [rotationOffset, setRotationOffset] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const todayStr = toDateString(new Date());
  const todayEventCount = useMemo(() => {
    return getEventsForDate(events, todayStr).filter((e) => !e.isInTrash && !e.isCompleted).length;
  }, [events, todayStr]);

  const insight = useMemo(() => {
    return getContextDailyInsight({
      todayEventCount,
      viewMode,
      lang: settings.language,
      rotationOffset,
    });
  }, [todayEventCount, viewMode, settings.language, rotationOffset]);

  const widgetCopy = useMemo(() => {
    switch (settings.language) {
      case 'zh-CN':
        return { title: '每日洞察', next: '换一条', nextTip: '换一条离线洞察', expand: '展开每日洞察', collapse: '收起每日洞察' };
      case 'zh-TW':
        return { title: '每日洞察', next: '換一則', nextTip: '換一則離線洞察', expand: '展開每日洞察', collapse: '收起每日洞察' };
      case 'ja':
        return { title: '今日のインサイト', next: '次へ', nextTip: '別のインサイトを表示', expand: '展開', collapse: '折りたたむ' };
      case 'ko':
        return { title: '오늘의 인사이트', next: '다음', nextTip: '다른 인사이트 보기', expand: '펼치기', collapse: '접기' };
      case 'fr':
        return { title: 'Aperçu du jour', next: 'Suivant', nextTip: 'Autre aperçu hors ligne', expand: 'Développer', collapse: 'Réduire' };
      case 'ru':
        return { title: 'Совет дня', next: 'Ещё', nextTip: 'Другой офлайн-совет', expand: 'Развернуть', collapse: 'Свернуть' };
      case 'fa':
        return { title: 'بینش روزانه', next: 'بعدی', nextTip: 'نکته آفلاین بعدی', expand: 'باز کردن', collapse: 'جمع کردن' };
      case 'mn':
        return { title: 'Өдрийн санаа', next: 'Дараах', nextTip: 'Өөр зөвлөгөө харах', expand: 'Дэлгэх', collapse: 'Хураах' };
      case 'ug':
        return { title: 'كۈندىلىك ئىلھام', next: 'كېيىنكىسى', nextTip: 'باشقا تەۋسىيە', expand: 'يېيىش', collapse: 'يىغىش' };
      default:
        return { title: 'Daily Insight', next: 'Next', nextTip: 'Next offline insight', expand: 'Expand Daily Insight', collapse: 'Collapse Daily Insight' };
    }
  }, [settings.language]);
  const widgetTitle = widgetCopy.title;

  const handleCycle = () => {
    triggerHaptic('selection', settings.enableHaptics !== false);
    setRotationOffset((prev) => prev + 1);
  };

  const handleToggleCollapse = () => {
    triggerHaptic('selection', settings.enableHaptics !== false);
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  };

  return (
    <section
      aria-label={widgetTitle}
      className="relative z-10 w-full bg-white/90 dark:bg-neutral-900/90 border-b border-neutral-200/80 dark:border-neutral-800/80 px-3 sm:px-5 py-2 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div
            className="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80"
            style={{ color: settings.accentColor }}
          >
            <Lightbulb className="w-3.5 h-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] leading-tight">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                {widgetTitle}
              </span>
              <span className="text-neutral-400 dark:text-neutral-500">·</span>
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                {insight.category}
              </span>
              <span className="text-neutral-400 dark:text-neutral-500 hidden sm:inline">·</span>
              <span className="text-neutral-500 dark:text-neutral-400 hidden sm:inline tabular-nums">
                {insight.contextSummary}
              </span>
            </div>

            {!isCollapsed && (
              <div className="mt-0.5 flex flex-col sm:flex-row sm:items-baseline gap-x-2">
                <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-snug">
                  {insight.text}
                </p>
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0">
                  — {insight.source}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isCollapsed && (
            <button
              type="button"
              onClick={handleCycle}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95"
              title={widgetCopy.nextTip}
              aria-label={widgetCopy.next}
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">{widgetCopy.next}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isCollapsed ? widgetCopy.expand : widgetCopy.collapse}
            aria-label={isCollapsed ? widgetCopy.expand : widgetCopy.collapse}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </section>
  );
};
