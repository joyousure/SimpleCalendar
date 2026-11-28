import React, { useEffect, useMemo, useState } from 'react';
import { Info, X } from 'lucide-react';
import { Language } from '../types/calendar';
import {
  MajorMacroDetailAnalysis,
  MajorMacroGroup,
  MajorMacroMatrixDataset,
  MajorMacroRow,
  buildMajorMacroDetailSeries,
  computeMajorMacroDetailStats,
} from '../utils/financeService';
import { isChineseLocale, isRtlLanguage } from '../utils/i18n';
import { getExtraLabels } from '../utils/i18nExtra';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';

interface MajorMacroDetailModalProps {
  open: boolean;
  row: MajorMacroRow | null;
  group: MajorMacroGroup | null;
  dataset: MajorMacroMatrixDataset;
  language: Language;
  onCloseAll: () => void;
}

type DetailScopeMode = 'trailing12' | 'year' | 'all2016';

function formatRowValue(
  val: number,
  row: MajorMacroRow,
  includeUnit: boolean = true
): string {
  const sign = row.signed && val > 0 ? '+' : '';
  const unit = includeUnit && row.id !== 'mfg_pmi' ? '%' : '';
  return `${sign}${val.toFixed(row.decimals)}${unit}`;
}

function formatPeriodDisplay(periodKey: string, isZh: boolean, isMergedJanFeb?: boolean): string {
  const [yr, mm] = periodKey.split('-');
  const mNum = parseInt(mm, 10) || 1;
  if (isMergedJanFeb) {
    return isZh ? `${yr}年1-2月` : `Jan–Feb ${yr}`;
  }
  return isZh ? `${yr}年${mNum}月` : `${yr}-${mm}`;
}

export const MajorMacroDetailModal: React.FC<MajorMacroDetailModalProps> = ({
  open,
  row,
  group,
  dataset,
  language,
  onCloseAll,
}) => {
  const ui = getExtraLabels(language);
  const isZh = isChineseLocale(language);
  const isTw = language === 'zh-TW';
  const isRtl = isRtlLanguage(language);

  const [scopeMode, setScopeMode] = useState<DetailScopeMode>('trailing12');
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>('');
  const [hoveredPeriodKey, setHoveredPeriodKey] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useSystemBackLayer(
    open,
    onCloseAll,
    BACK_PRIORITY.INNER_OVERLAY + 10,
    'major-macro-detail-modal'
  );

  const series = useMemo(() => {
    if (!row || !group) return null;
    return buildMajorMacroDetailSeries(row, group, dataset);
  }, [row, group, dataset]);

  const latestPublishedKey = useMemo(() => {
    if (!series) return '';
    for (let i = series.points.length - 1; i >= 0; i--) {
      if (series.points[i].published && series.points[i].value !== null) {
        return series.points[i].periodKey;
      }
    }
    return series.points[series.points.length - 1]?.periodKey || '';
  }, [series]);

  useEffect(() => {
    if (!open || !row) return;
    setScopeMode('trailing12');
    setSelectedPeriodKey(latestPublishedKey);
    setHoveredPeriodKey(null);
    setShowDisclaimer(false);
  }, [open, row?.id, latestPublishedKey]);

  const years = useMemo(() => {
    if (!series) return [];
    const set = new Set<number>();
    series.points.forEach((p) => set.add(p.year));
    return Array.from(set).sort((a, b) => a - b);
  }, [series]);

  const effectivePeriodKey = selectedPeriodKey || latestPublishedKey;
  const activeYear = parseInt(effectivePeriodKey.slice(0, 4), 10) || 2026;

  const monthsInYear = useMemo(() => {
    if (!series) return [];
    return series.points.filter((p) => p.year === activeYear);
  }, [series, activeYear]);

  const analysis: MajorMacroDetailAnalysis | null = useMemo(() => {
    if (!series || !effectivePeriodKey) return null;
    return computeMajorMacroDetailStats(series, effectivePeriodKey, dataset, scopeMode);
  }, [series, effectivePeriodKey, dataset, scopeMode]);

  if (!open || !row || !group || !series || !analysis) return null;

  const publishedPts = analysis.publishedPoints;
  const unpublishedPts = analysis.unpublishedPoints;
  const highlightedPt =
    (hoveredPeriodKey
      ? publishedPts.find((p) => p.periodKey === hoveredPeriodKey)
      : null) || analysis.activePublishedPoint;

  const handleSelectYear = (yr: number) => {
    const yearPts = series.points.filter((p) => p.year === yr);
    const sameMonth = effectivePeriodKey.slice(5, 7);
    const matchingMonth = yearPts.find(
      (p) => p.periodKey.slice(5, 7) === sameMonth && p.published
    );
    if (matchingMonth) {
      setSelectedPeriodKey(matchingMonth.periodKey);
    } else {
      const lastPub = [...yearPts].reverse().find((p) => p.published);
      if (lastPub) setSelectedPeriodKey(lastPub.periodKey);
      else if (yearPts[0]) setSelectedPeriodKey(yearPts[0].periodKey);
    }
    setHoveredPeriodKey(null);
  };

  // Dynamic unpublished filter notice
  const filterNoticeLine = (() => {
    if (unpublishedPts.length === 0) {
      return isTw
        ? `全部 ${publishedPts.length} 個統計期均已公布並自動繪製`
        : isZh
        ? `全部 ${publishedPts.length} 个统计期均已公布并自动绘制`
        : `All ${publishedPts.length} periods published and plotted`;
    }
    const previewNames = unpublishedPts
      .slice(0, 4)
      .map((p) => formatPeriodDisplay(p.periodKey, isZh, false));
    const moreText =
      unpublishedPts.length > 4
        ? isZh
          ? ` 等${unpublishedPts.length}项`
          : ` (+${unpublishedPts.length - 4} more)`
        : '';
    return isTw
      ? `未公布已過濾：${previewNames.join('、')}${moreText}（已自動從圖表中排除）`
      : isZh
      ? `未公布已过滤：${previewNames.join('、')}${moreText}（已自动从图表中排除）`
      : `Excluded unpublished: ${previewNames.join(', ')}${moreText}`;
  })();

  const selectedUnpublishedBanner =
    analysis.selectedPoint && !analysis.selectedPoint.published
      ? isTw
        ? `${formatPeriodDisplay(analysis.selectedPoint.periodKey, true)}尚未公布（${analysis.selectedPoint.unpublishedReasonZh || '未公布'}），圖表已自動過濾該月`
        : isZh
        ? `${formatPeriodDisplay(analysis.selectedPoint.periodKey, true)}尚未公布（${analysis.selectedPoint.unpublishedReasonZh || '未公布'}），图表已自动过滤该月`
        : `${formatPeriodDisplay(analysis.selectedPoint.periodKey, false)} is unpublished and excluded from plotting`
      : null;

  // Dynamic chart bounds
  const isPmi = row.id === 'mfg_pmi';
  const baselineVal = isPmi ? 50 : 0;
  const vals = publishedPts.map((p) => p.value);
  const minVal = vals.length > 0 ? Math.min(baselineVal, ...vals) : baselineVal - 2;
  const maxVal = vals.length > 0 ? Math.max(baselineVal, ...vals) : baselineVal + 2;
  const rawSpan = Math.max(maxVal - minVal, isPmi ? 2.5 : 2.0);
  const yMax = maxVal + rawSpan * 0.18;
  const yMin = minVal - rawSpan * (minVal < baselineVal ? 0.18 : 0.08);
  const ySpan = Math.max(yMax - yMin, 0.5);

  const VB_W = 640;
  const VB_H = 264;
  const PAD_L = 46;
  const PAD_R = 16;
  const PAD_T = 22;
  const PAD_B = 34;
  const PLOT_W = VB_W - PAD_L - PAD_R;
  const PLOT_H = VB_H - PAD_T - PAD_B;

  const mapY = (v: number) => PAD_T + ((yMax - v) / ySpan) * PLOT_H;
  const yBase = mapY(baselineVal);
  const yMean = analysis.meanValue !== null ? mapY(analysis.meanValue) : null;

  const yTickStep = rawSpan > 25 ? 10 : rawSpan > 12 ? 5 : rawSpan > 5 ? 2 : 1;
  const yTicks: number[] = [];
  const startTick = Math.ceil(yMin / yTickStep) * yTickStep;
  for (let v = startTick; v <= yMax + 1e-6; v += yTickStep) {
    yTicks.push(Number(v.toFixed(1)));
  }
  if (!yTicks.some((t) => Math.abs(t - baselineVal) < 1e-4)) {
    yTicks.push(baselineVal);
    yTicks.sort((a, b) => a - b);
  }

  // Auto-computed callout box lines (标注框数值自动采集动态计算)
  const calloutLines: string[] = (() => {
    if (!highlightedPt) {
      return [isZh ? '当前所选区间暂无已公布数据' : 'No published data in window'];
    }
    const periodLabel = formatPeriodDisplay(
      highlightedPt.periodKey,
      isZh,
      highlightedPt.isMergedJanFeb
    );
    const valStr = formatRowValue(highlightedPt.value, row, true);
    const momStr =
      analysis.momDelta !== null
        ? `${analysis.momDelta > 0 ? '+' : ''}${analysis.momDelta.toFixed(row.decimals)}`
        : '--';
    const meanStr =
      analysis.meanValue !== null
        ? formatRowValue(analysis.meanValue, row, true)
        : '--';
    const rangeStr =
      analysis.lowPoint && analysis.highPoint
        ? `${formatRowValue(analysis.lowPoint.value, row, true)} ~ ${formatRowValue(
            analysis.highPoint.value,
            row,
            true
          )}`
        : '--';

    if (isTw) {
      return [
        `${periodLabel}：${valStr}`,
        `較上期 ${momStr} · 區間均值 ${meanStr}`,
        `區間極值：${rangeStr}`,
      ];
    }
    if (isZh) {
      return [
        `${periodLabel}：${valStr}`,
        `较上期 ${momStr} · 区间均值 ${meanStr}`,
        `区间极值：${rangeStr}`,
      ];
    }
    return [
      `${periodLabel}: ${valStr}`,
      `MoM ${momStr} · Avg ${meanStr}`,
      `Range: ${rangeStr}`,
    ];
  })();

  const calloutLineH = 14;
  const calloutH = calloutLines.length * calloutLineH + 10;
  const maxCalloutChars = Math.max(...calloutLines.map((l) => l.length));
  const calloutW = Math.min(238, Math.max(154, maxCalloutChars * 8.2 + 22));
  const calloutX = VB_W - PAD_R - calloutW - 4;
  const calloutY = PAD_T + 2;

  const isLineMode = scopeMode === 'all2016' || publishedPts.length > 16;
  const mapPointX = (idx: number) =>
    publishedPts.length <= 1
      ? PAD_L + PLOT_W / 2
      : PAD_L + (idx / (publishedPts.length - 1)) * PLOT_W;

  const stepW = PLOT_W / Math.max(1, publishedPts.length);
  const barW = Math.min(28, stepW * 0.56);
  const mapBarCenterX = (idx: number) => PAD_L + (idx + 0.5) * stepW;

  const polylineStr = publishedPts
    .map((p, idx) => `${mapPointX(idx).toFixed(1)},${mapY(p.value).toFixed(1)}`)
    .join(' ');

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-1.5 sm:p-3 pt-[max(0.4rem,env(safe-area-inset-top))] pb-[max(0.4rem,env(safe-area-inset-bottom))] bg-black/60 backdrop-blur-md select-none animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCloseAll();
      }}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-label={`${group.title} ${row.name}`}
        className="econ-modal-cq w-full max-w-3xl [@media(max-height:560px)]:max-w-5xl max-h-[calc(100dvh-0.8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col overflow-hidden rounded-[22px] bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-black backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 [.amoled-mode_&]:border-white/15 shadow-2xl p-2.5 sm:p-4 [@media(max-height:560px)]:p-2.5 gap-1.5 sm:gap-2 animate-modal-sheet"
      >
        {/* Top Bar: Indicator Title + Scope Switcher + X Close Button */}
        <div className="shrink-0 flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">

            <span
              className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-bold text-white shrink-0"
              style={{ backgroundColor: group.accentHex }}
            >
              {group.title}
            </span>

            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 truncate">
              {row.name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center rounded-lg bg-neutral-100 dark:bg-neutral-800 [.amoled-mode_&]:bg-neutral-950 p-0.5 border border-neutral-200/70 dark:border-neutral-700/60">
              {(
                [
                  { id: 'trailing12', zh: '近1年', en: '1Y' },
                  { id: 'year', zh: '当年', en: 'Year' },
                  { id: 'all2016', zh: '2016至今', en: '2016+' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setScopeMode(tab.id);
                    setHoveredPeriodKey(null);
                  }}
                  className={`px-2 py-1 rounded-md text-[10.5px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    scopeMode === tab.id
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  {isZh ? tab.zh : tab.en}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onCloseAll}
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Month Selector Band (Year + 12 Months) */}
        <div className="shrink-0 flex flex-col gap-1 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/60 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 px-2 py-1.5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 shrink-0 me-1">
              {isZh ? '年份' : 'Year'}
            </span>
            {years.map((yr) => {
              const isActive = yr === activeYear;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => handleSelectYear(yr)}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-mono tabular-nums font-semibold transition-colors cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-600 dark:text-neutral-300 hover:bg-white/70 dark:hover:bg-neutral-700/70'
                  }`}
                >
                  {yr}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 shrink-0 me-1">
              {isZh ? '月份' : 'Month'}
            </span>
            {monthsInYear.map((pt) => {
              const isSelected = pt.periodKey === effectivePeriodKey;
              return (
                <button
                  key={pt.periodKey}
                  type="button"
                  onClick={() => {
                    setSelectedPeriodKey(pt.periodKey);
                    setHoveredPeriodKey(null);
                  }}
                  title={
                    pt.published
                      ? `${formatPeriodDisplay(pt.periodKey, isZh, pt.isMergedJanFeb)}`
                      : pt.unpublishedReasonZh || (isZh ? '未公布' : 'Unpublished')
                  }
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-mono tabular-nums font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-0.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                      : pt.published
                      ? 'text-neutral-700 dark:text-neutral-200 hover:bg-white/80 dark:hover:bg-neutral-700/70'
                      : 'text-neutral-400 dark:text-neutral-500 bg-neutral-200/50 dark:bg-neutral-800/80'
                  }`}
                >
                  <span>{isZh ? pt.labelZh : pt.labelEn}</span>
                  {!pt.published && (
                    <span className="text-[8.5px] opacity-80">
                      ({isZh ? '未' : 'N/A'})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Source, Published Filter Notice & Disclaimer */}
        <div className="shrink-0 flex flex-col gap-1 px-0.5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[10.5px] sm:text-[11px] text-neutral-500 dark:text-neutral-400">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
              <span className="truncate">
                {isZh
                  ? `来源：${series.sourceZh} · 口径：${series.unitZh}`
                  : `Source: ${series.sourceEn} · ${series.unitEn}`}
              </span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setShowDisclaimer((v) => !v)}
                className="underline decoration-neutral-400 underline-offset-2 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer inline-flex items-center gap-0.5 shrink-0"
              >
                <span>{ui.gfDisclaimer}</span>
                <Info className="w-3 h-3" />
              </button>
            </div>
            <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
              {selectedUnpublishedBanner || filterNoticeLine}
            </span>
          </div>

          {showDisclaimer && (
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-100/80 dark:bg-neutral-800/70 [.amoled-mode_&]:bg-neutral-900 rounded-xl px-2.5 py-1 border border-neutral-200/70 dark:border-neutral-800">
              {isTw
                ? '宏觀數據來源於官方公開統計發布，僅供參考，不構成任何投資建議。'
                : isZh
                ? '宏观数据来源于官方公开统计发布，仅供参考，不构成任何投资建议。'
                : ui.gfDisclaimerText}
            </p>
          )}
        </div>

        {/* Main Dynamic Chart Area + Auto-Computed Callout Box (标注框) */}
        <div className="flex-1 min-h-0 rounded-2xl bg-neutral-50/90 dark:bg-neutral-800/70 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/12 p-2 sm:p-3 flex flex-col justify-between overflow-hidden">
          <div className="econ-chart-cq flex-1 min-h-0 flex items-center justify-center">
            {publishedPts.length === 0 ? (
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 py-8">
                {isZh ? '所选时段暂无已公布统计数据' : 'No published data in selected window'}
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="econ-svg-responsive econ-svg-detail overflow-visible touch-none"
                onMouseLeave={() => setHoveredPeriodKey(null)}
              >
                {/* Y-Axis Gridlines & Baseline */}
                {yTicks.map((tick) => {
                  const ty = mapY(tick);
                  const isBase = Math.abs(tick - baselineVal) < 1e-4;
                  return (
                    <g key={tick}>
                      <line
                        x1={PAD_L}
                        x2={VB_W - PAD_R}
                        y1={ty}
                        y2={ty}
                        stroke="currentColor"
                        className={
                          isBase
                            ? 'text-neutral-800 dark:text-neutral-200'
                            : 'text-neutral-300/80 dark:text-neutral-700/75'
                        }
                        strokeWidth={isBase ? '1.15' : '0.8'}
                        strokeDasharray={isBase ? undefined : '2.5 3'}
                      />
                      <text
                        x={PAD_L - 8}
                        y={ty + 3.5}
                        textAnchor="end"
                        className="fill-neutral-700 dark:fill-neutral-300 text-[10px] font-mono tabular-nums"
                      >
                        {isPmi ? tick.toFixed(0) : `${tick}%`}
                      </text>
                    </g>
                  );
                })}

                {/* Auto-Computed Mean Reference Line */}
                {yMean !== null && (
                  <g className="pointer-events-none">
                    <line
                      x1={PAD_L}
                      x2={VB_W - PAD_R}
                      y1={yMean}
                      y2={yMean}
                      stroke="#DC4C4C"
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                    />
                    <text
                      x={PAD_L + 4}
                      y={Math.max(PAD_T + 9, yMean - 4)}
                      className="fill-rose-600 dark:fill-rose-400 text-[9.5px] font-semibold tabular-nums"
                    >
                      {isZh ? '均值' : 'Mean'}{' '}
                      {formatRowValue(analysis.meanValue!, row, true)}
                    </text>
                  </g>
                )}

                {isLineMode ? (
                  <>
                    {/* 2016–Present Multi-Year Trajectory Line */}
                    {publishedPts.length >= 2 && (
                      <polyline
                        fill="none"
                        stroke={group.accentHex}
                        strokeWidth="2.1"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={polylineStr}
                      />
                    )}
                    {/* Year Ticks along X-axis */}
                    {years.map((yr) => {
                      const firstInYr = publishedPts.findIndex((p) => p.year === yr);
                      if (firstInYr < 0) return null;
                      return (
                        <text
                          key={yr}
                          x={mapPointX(firstInYr)}
                          y={VB_H - 8}
                          textAnchor="middle"
                          className="fill-neutral-600 dark:fill-neutral-300 text-[9.5px] font-mono tabular-nums"
                        >
                          {yr}
                        </text>
                      );
                    })}
                    {/* Interactive Hit Targets */}
                    {publishedPts.map((pt, idx) => {
                      const cx = mapPointX(idx);
                      const cy = mapY(pt.value);
                      const isActive = highlightedPt?.periodKey === pt.periodKey;
                      return (
                        <g
                          key={pt.periodKey}
                          onMouseEnter={() => setHoveredPeriodKey(pt.periodKey)}
                          onClick={() => setSelectedPeriodKey(pt.periodKey)}
                          className="cursor-pointer"
                        >
                          <rect
                            x={cx - Math.max(4, PLOT_W / publishedPts.length / 2)}
                            y={PAD_T}
                            width={Math.max(8, PLOT_W / publishedPts.length)}
                            height={PLOT_H}
                            fill="transparent"
                          />
                          {isActive && (
                            <>
                              <line
                                x1={cx}
                                x2={cx}
                                y1={PAD_T}
                                y2={VB_H - PAD_B}
                                stroke={group.accentHex}
                                strokeWidth="1"
                                strokeDasharray="2 3"
                              />
                              <circle
                                cx={cx}
                                cy={cy}
                                r="4.5"
                                fill={group.accentHex}
                                className="stroke-white dark:stroke-neutral-900"
                                strokeWidth="1.8"
                              />
                            </>
                          )}
                        </g>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {/* Monthly Bar Chart for Trailing 1Y or Selected Year */}
                    {publishedPts.map((pt, idx) => {
                      const cx = mapBarCenterX(idx);
                      const yVal = mapY(pt.value);
                      const aboveBase = pt.value >= baselineVal;
                      const rectY = aboveBase ? yVal : yBase;
                      const rectH = Math.max(2, Math.abs(yVal - yBase));
                      const isActive = highlightedPt?.periodKey === pt.periodKey;
                      const fillHex = isActive
                        ? group.accentHex
                        : pt.value >= baselineVal
                        ? '#54A9E6'
                        : '#6E8FB8';

                      return (
                        <g
                          key={pt.periodKey}
                          onMouseEnter={() => setHoveredPeriodKey(pt.periodKey)}
                          onClick={() => setSelectedPeriodKey(pt.periodKey)}
                          className="cursor-pointer"
                        >
                          <rect
                            x={cx - stepW / 2}
                            y={PAD_T}
                            width={stepW}
                            height={PLOT_H}
                            fill="transparent"
                          />
                          <rect
                            x={cx - barW / 2}
                            y={rectY}
                            width={barW}
                            height={rectH}
                            rx="2"
                            fill={fillHex}
                            fillOpacity={isActive ? 1 : 0.85}
                            stroke={isActive ? '#111827' : 'none'}
                            strokeOpacity={isActive ? 0.35 : 0}
                            strokeWidth="1"
                          />
                          <text
                            x={cx}
                            y={aboveBase ? rectY - 5 : rectY + rectH + 11}
                            textAnchor="middle"
                            className={`text-[9.5px] font-mono tabular-nums ${
                              isActive
                                ? 'fill-neutral-950 dark:fill-white font-bold'
                                : 'fill-neutral-700 dark:fill-neutral-300 font-semibold'
                            }`}
                          >
                            {formatRowValue(pt.value, row, false)}
                          </text>
                          <text
                            x={cx}
                            y={VB_H - 9}
                            textAnchor="middle"
                            className={`text-[9.5px] font-mono tabular-nums ${
                              isActive
                                ? 'fill-indigo-600 dark:fill-indigo-400 font-bold'
                                : 'fill-neutral-600 dark:fill-neutral-300'
                            }`}
                          >
                            {pt.month === 1 || (pt.month === 2 && pt.isMergedJanFeb)
                              ? `${String(pt.year).slice(2)}/${pt.labelZh}`
                              : isZh
                              ? pt.labelZh
                              : pt.labelEn}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {/* Auto-Computed Callout Box (标注框) */}
                <g className="pointer-events-none">
                  <rect
                    x={calloutX}
                    y={calloutY}
                    width={calloutW}
                    height={calloutH}
                    rx="6"
                    className="fill-white/95 dark:fill-neutral-900/95 [.amoled-mode_&]:fill-neutral-950"
                    stroke={group.accentHex}
                    strokeWidth="1.2"
                  />
                  {calloutLines.map((ln, idx) => (
                    <text
                      key={idx}
                      x={calloutX + calloutW / 2}
                      y={calloutY + 14.5 + idx * calloutLineH}
                      textAnchor="middle"
                      className="text-[10px] font-semibold tabular-nums fill-neutral-800 dark:fill-neutral-100"
                    >
                      {ln}
                    </text>
                  ))}
                </g>
              </svg>
            )}
          </div>
        </div>

        {/* Bottom Auto-Computed Key Stats + Same-Sector Peer Comparison */}
        <div className="shrink-0 flex flex-col gap-1.5">
          <div className="grid grid-cols-4 gap-1.5 text-[10.5px] sm:text-xs">
            <div className="rounded-xl bg-neutral-100/90 dark:bg-neutral-800/75 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/75 dark:border-neutral-800 px-2 py-1.5">
              <div className="text-[9.5px] text-neutral-500 dark:text-neutral-400 truncate">
                {isZh ? '当期读数' : 'Reading'}
              </div>
              <div className="font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
                {highlightedPt ? formatRowValue(highlightedPt.value, row, true) : '--'}
              </div>
            </div>
            <div className="rounded-xl bg-neutral-100/90 dark:bg-neutral-800/75 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/75 dark:border-neutral-800 px-2 py-1.5">
              <div className="text-[9.5px] text-neutral-500 dark:text-neutral-400 truncate">
                {isZh ? '较上期' : 'MoM'}
              </div>
              <div
                className={`font-mono font-bold tabular-nums ${
                  analysis.momDelta === null
                    ? 'text-neutral-500'
                    : analysis.momDelta >= 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {analysis.momDelta !== null
                  ? `${analysis.momDelta > 0 ? '+' : ''}${analysis.momDelta.toFixed(row.decimals)}`
                  : '--'}
              </div>
            </div>
            <div className="rounded-xl bg-neutral-100/90 dark:bg-neutral-800/75 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/75 dark:border-neutral-800 px-2 py-1.5">
              <div className="text-[9.5px] text-neutral-500 dark:text-neutral-400 truncate">
                {isZh ? '区间均值' : 'Period Avg'}
              </div>
              <div className="font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
                {analysis.meanValue !== null ? formatRowValue(analysis.meanValue, row, true) : '--'}
              </div>
            </div>
            <div className="rounded-xl bg-neutral-100/90 dark:bg-neutral-800/75 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/75 dark:border-neutral-800 px-2 py-1.5">
              <div className="text-[9.5px] text-neutral-500 dark:text-neutral-400 truncate">
                {isZh ? '区间最高/低' : 'High / Low'}
              </div>
              <div className="font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-50 truncate">
                {analysis.highPoint && analysis.lowPoint
                  ? `${formatRowValue(analysis.highPoint.value, row, false)} / ${formatRowValue(
                      analysis.lowPoint.value,
                      row,
                      false
                    )}`
                  : '--'}
              </div>
            </div>
          </div>

          {group.rows.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px] sm:text-[10.5px]">
              {analysis.publishedPeers.map((peer) => (
                <span
                  key={peer.id}
                  className={`px-2 py-0.5 rounded-md font-mono tabular-nums shrink-0 border ${
                    peer.id === row.id
                      ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-neutral-200/80 dark:border-neutral-700/70 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  {peer.name}{' '}
                  {`${peer.signed && peer.value > 0 ? '+' : ''}${peer.value.toFixed(peer.decimals)}${
                    peer.id === 'mfg_pmi' ? '' : '%'
                  }`}
                </span>
              ))}
              {analysis.unpublishedPeers.length > 0 && (
                <span className="text-neutral-400 dark:text-neutral-500 shrink-0">
                  {isZh
                    ? `（${analysis.unpublishedPeers.map((p) => p.name).join('、')}当月未公布已排除）`
                    : `(Unpublished: ${analysis.unpublishedPeers.map((p) => p.name).join(', ')})`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
