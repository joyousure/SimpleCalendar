import React, { useState, useMemo } from 'react';
import {
  CalendarEvent,
  EventCategory,
  HabitItem,
  HabitLogEntry,
  Language,
  PomodoroSession,
} from '../types/calendar';
import {
  buildSummaryMarkdown,
  computeTickTickAnalytics,
  getTickTickLabels,
  HeatmapDayCell,
} from '../utils/ticktickEngine';
import { getCategoryDisplayName } from '../utils/storage';
import { toDateString } from '../utils/dateUtils';
import {
  Award,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  FilePlus2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface TickTickStatsPanelProps {
  events: CalendarEvent[];
  categories: EventCategory[];
  habits: HabitItem[];
  habitLogs: HabitLogEntry[];
  focusSessions: PomodoroSession[];
  language: Language;
  onSaveSummaryAsNote: (title: string, markdownBody: string) => void;
}

export const TickTickStatsPanel: React.FC<TickTickStatsPanelProps> = ({
  events,
  categories,
  habits,
  habitLogs,
  focusSessions,
  language,
  onSaveSummaryAsNote,
}) => {
  const tt = getTickTickLabels(language);
  const isZh = language === 'zh-CN' || language === 'zh-TW';
  const todayStr = toDateString(new Date());

  const analytics = useMemo(
    () => computeTickTickAnalytics(events, habits, habitLogs, focusSessions, todayStr),
    [events, habits, habitLogs, focusSessions, todayStr]
  );

  const catMap = useMemo(() => {
    const m = new Map<string, EventCategory>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const [hoveredCell, setHoveredCell] = useState<HeatmapDayCell | null>(null);
  const [summaryPeriod, setSummaryPeriod] = useState<'daily' | 'weekly'>('daily');
  const [summaryDraft, setSummaryDraft] = useState<string>(() =>
    buildSummaryMarkdown('daily', events, habits, habitLogs, focusSessions, todayStr, categories, language)
  );
  const [copied, setCopied] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const handleSwitchPeriod = (period: 'daily' | 'weekly') => {
    setSummaryPeriod(period);
    setSummaryDraft(
      buildSummaryMarkdown(period, events, habits, habitLogs, focusSessions, todayStr, categories, language)
    );
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(summaryDraft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const maxWeeklyDone = Math.max(1, ...analytics.weeklyVelocity.map((v) => v.completed));

  const levelFillClass = (level: HeatmapDayCell['level']) => {
    switch (level) {
      case 0:
        return 'fill-neutral-100 dark:fill-white/[0.06]';
      case 1:
        return 'fill-orange-200 dark:fill-orange-900/60';
      case 2:
        return 'fill-orange-300 dark:fill-orange-700/80';
      case 3:
        return 'fill-orange-500 dark:fill-orange-500';
      case 4:
        return 'fill-orange-600 dark:fill-orange-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-orange-500" />
            <span>{tt.achievementScore}</span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {analytics.achievementScore}
          </div>
          <div className="mt-0.5 text-[11px] text-neutral-400 tabular-nums">
            {isZh ? `累计完成 ${analytics.completedTotal} 项` : `${analytics.completedTotal} total done`}
          </div>
        </div>

        <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{isZh ? '本周完成' : 'Done This Week'}</span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {analytics.completedThisWeek}
          </div>
          <div className="mt-0.5 text-[11px] text-neutral-400 tabular-nums">
            {isZh ? `今日已完成 ${analytics.completedToday} 项` : `${analytics.completedToday} done today`}
          </div>
        </div>

        <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>{isZh ? '按时完成率' : 'On-Time Rate'}</span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {analytics.onTimeRate}%
          </div>
          <div className="mt-0.5 text-[11px] text-neutral-400 tabular-nums">
            {isZh ? `当前逾期 ${analytics.overdueCount} 项` : `${analytics.overdueCount} overdue`}
          </div>
        </div>

        <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-500" />
            <span>{isZh ? '7日专注 & 打卡' : '7d Focus & Habits'}</span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {analytics.focusMinutes7Days}
            <span className="text-xs font-semibold text-neutral-400 ml-1">{isZh ? '分' : 'm'}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-neutral-400 tabular-nums">
            {isZh ? `习惯打卡 ${analytics.habitCheckins7Days} 次` : `${analytics.habitCheckins7Days} habit check-ins`}
          </div>
        </div>
      </div>

      {/* 16-Week Activity Contribution Heatmap */}
      <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
            {tt.heatmapTitle}
          </h3>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
            {hoveredCell
              ? `${hoveredCell.date} · ${isZh ? '任务' : 'Tasks'} ${hoveredCell.tasksCompleted} · ${isZh ? '习惯' : 'Habits'} ${hoveredCell.habitsDone} · ${hoveredCell.focusMinutes}m`
              : isZh
              ? '悬停或点击方格查看当日明细'
              : 'Hover or tap any square for daily breakdown'}
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <svg
            viewBox={`0 0 ${analytics.heatmapWeeks.length * 16 + 4} ${7 * 16 + 4}`}
            className="w-full min-w-[340px] max-w-[680px] h-auto"
          >
            {analytics.heatmapWeeks.map((week, wIdx) =>
              week.map((cell, dIdx) => (
                <rect
                  key={cell.date}
                  x={wIdx * 16 + 2}
                  y={dIdx * 16 + 2}
                  width={12}
                  height={12}
                  rx={3}
                  className={`${levelFillClass(cell.level)} cursor-pointer transition-opacity hover:opacity-80`}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onClick={() => setHoveredCell(cell)}
                />
              ))
            )}
          </svg>
        </div>
      </div>

      {/* Category Distribution + 7-Day Completion Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
            {isZh ? '清单完成分布' : 'Completion by List'}
          </h3>
          {analytics.categoryBreakdown.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">
              {isZh ? '完成任务后自动统计清单占比' : 'Complete tasks to see list breakdown'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {analytics.categoryBreakdown.map((row) => {
                const cat = catMap.get(row.categoryId);
                const name = cat ? getCategoryDisplayName(cat, language) : row.categoryId;
                const color = cat?.color || '#F57C00';
                return (
                  <div key={row.categoryId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span>{name}</span>
                      </span>
                      <span className="text-neutral-500 tabular-nums">
                        {row.count} ({row.percent}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${row.percent}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
            {isZh ? '近 7 天推进节奏' : '7-Day Velocity'}
          </h3>
          <div className="grid grid-cols-7 gap-2 items-end h-36 pt-4">
            {analytics.weeklyVelocity.map((day) => {
              const barPct = Math.round((day.completed / maxWeeklyDone) * 100);
              return (
                <div key={day.date} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 tabular-nums">
                    {day.completed}
                  </span>
                  <div className="w-full max-w-[28px] flex-1 flex items-end rounded-lg bg-neutral-100/80 dark:bg-white/5 overflow-hidden">
                    <div
                      className="w-full rounded-t-lg bg-orange-500 transition-all duration-300"
                      style={{ height: `${Math.max(day.completed > 0 ? 14 : 4, barPct)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-neutral-400 tabular-nums">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily / Weekly Summary Generator */}
      <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
              {tt.summaryTitle}
            </h3>
            <div className="inline-flex rounded-xl border border-neutral-200/80 dark:border-white/10 p-0.5 bg-neutral-100/70 dark:bg-white/5">
              <button
                type="button"
                onClick={() => handleSwitchPeriod('daily')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  summaryPeriod === 'daily'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white'
                    : 'text-neutral-500'
                }`}
              >
                {isZh ? '每日总结' : 'Daily'}
              </button>
              <button
                type="button"
                onClick={() => handleSwitchPeriod('weekly')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  summaryPeriod === 'weekly'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white'
                    : 'text-neutral-500'
                }`}
              >
                {isZh ? '每周复盘' : 'Weekly'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleSwitchPeriod(summaryPeriod)}
              className="min-h-[36px] px-3 rounded-xl border border-neutral-200/80 dark:border-white/10 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isZh ? '刷新采集' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="min-h-[36px] px-3 rounded-xl border border-neutral-200/80 dark:border-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isZh ? '已复制' : 'Copied') : tt.copySummary}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const title =
                  summaryPeriod === 'daily'
                    ? isZh
                      ? `每日总结 ${todayStr}`
                      : `Daily Summary ${todayStr}`
                    : isZh
                    ? `每周复盘 ${todayStr}`
                    : `Weekly Review ${todayStr}`;
                onSaveSummaryAsNote(title, summaryDraft);
                setSavedFlash(true);
                window.setTimeout(() => setSavedFlash(false), 1800);
              }}
              className="min-h-[36px] px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>{savedFlash ? (isZh ? '已存为笔记' : 'Saved!') : tt.saveSummaryAsNote}</span>
            </button>
          </div>
        </div>

        <textarea
          value={summaryDraft}
          onChange={(e) => setSummaryDraft(e.target.value)}
          rows={10}
          className="w-full rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.03] p-3.5 text-xs font-mono text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-orange-500 resize-y"
        />
      </div>
    </div>
  );
};
