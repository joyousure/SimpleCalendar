import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Language } from '../types/calendar';
import {
  HOUSEHOLD_LOAN_MONTHLY_CHANGE_MAP,
  HouseholdMonthlyChangeSeries,
  getFilteredHouseholdMonthlyChange,
} from '../utils/financeService';
import { isChineseLocale, isRtlLanguage } from '../utils/i18n';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';

interface HouseholdMonthlyChangeModalProps {
  open: boolean;
  indicatorId: string;
  language: Language;
  onClose: () => void;
}

function isHouseholdSubId(
  id: string
): id is keyof typeof HOUSEHOLD_LOAN_MONTHLY_CHANGE_MAP {
  return (
    id === 'hh_ml_consumer' ||
    id === 'hh_st_consumer' ||
    id === 'hh_st_business' ||
    id === 'hh_ml_business'
  );
}

type DynamicBarRole = 'default' | 'peak' | 'inflection' | 'negative' | 'latest_neg' | 'latest_pos';

const DYNAMIC_BAR_COLORS: Record<DynamicBarRole, string> = {
  default: '#54A9E6',
  peak: '#2563EB',
  inflection: '#9A81C4',
  negative: '#E59866',
  latest_neg: '#D1586F',
  latest_pos: '#38B86B',
};

const CALLOUT_STYLES: Record<
  'purple' | 'rose' | 'emerald',
  { stroke: string; textClass: string }
> = {
  purple: { stroke: '#8B6FB9', textClass: 'fill-violet-700 dark:fill-violet-300' },
  rose: { stroke: '#C84E65', textClass: 'fill-rose-700 dark:fill-rose-300' },
  emerald: { stroke: '#2F9E5B', textClass: 'fill-emerald-700 dark:fill-emerald-300' },
};

function computeSharpestInflectionIndex(bars: Array<{ year: number; value: number }>): number {
  if (bars.length <= 2) return 0;
  let bestIdx = Math.max(0, bars.length - 2);
  let bestScore = -1;
  // Evaluate interior historical points before the latest month to detect true regime/slope inflection
  for (let i = 1; i < bars.length - 1; i++) {
    const prev = bars[i - 1].value;
    const curr = bars[i].value;
    const next = bars[i + 1].value;
    const slopeIn = curr - prev;
    const slopeOut = next - curr;
    // Discrete second difference captures curvature / turning sharpness
    const curvature = Math.abs(slopeOut - slopeIn);
    const isLocalExtremum = (slopeIn > 0 && slopeOut < 0) || (slopeIn < 0 && slopeOut > 0);
    const crossesZeroAround =
      (curr >= 0 && next < 0) || (curr <= 0 && next > 0) || (prev >= 0 && curr < 0) || (prev <= 0 && curr > 0);
    let score = curvature;
    if (isLocalExtremum) score *= 1.3;
    if (crossesZeroAround) score *= 1.35;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export const HouseholdMonthlyChangeModal: React.FC<HouseholdMonthlyChangeModalProps> = ({
  open,
  indicatorId,
  language,
  onClose,
}) => {
  const isZh = isChineseLocale(language);
  const isTw = language === 'zh-TW';
  const isRtl = isRtlLanguage(language);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  useSystemBackLayer(
    open,
    onClose,
    BACK_PRIORITY.INNER_OVERLAY + 10,
    'household-monthly-change-modal'
  );

  const series: HouseholdMonthlyChangeSeries | null = useMemo(() => {
    if (!isHouseholdSubId(indicatorId)) return null;
    return HOUSEHOLD_LOAN_MONTHLY_CHANGE_MAP[indicatorId];
  }, [indicatorId]);

  const filtered = useMemo(() => {
    if (!series) return null;
    return getFilteredHouseholdMonthlyChange(series, 2016);
  }, [series]);

  if (!open || !series || !filtered) return null;

  const title = isTw ? series.titleTw : isZh ? series.titleZh : series.titleEn;
  const unitText = isTw
    ? '單位：億元'
    : isZh
    ? '单位：亿元'
    : 'Unit: 100M CNY';
  const sourceNote = isTw
    ? '數據來源：中國人民銀行；按信貸收支表月末餘額差計算'
    : isZh
    ? '数据来源：中国人民银行；按信贷收支表月末余额差计算'
    : 'Source: PBOC; calculated from month-end credit balance differences';

  const bars = filtered.publishedBars;
  const unpublishedYears = filtered.unpublishedYears;

  const filterStatusLine = (() => {
    if (bars.length === 0) {
      return isTw ? '2016年至今暫無已公布數據' : isZh ? '2016年至今暂无已公布数据' : 'No published data since 2016';
    }
    const avgSigned =
      filtered.meanValue !== null
        ? `${filtered.meanValue > 0 ? '+' : ''}${filtered.meanValue}`
        : '--';
    const peakStr = filtered.peakBar
      ? `${filtered.peakBar.year}年(${filtered.peakBar.value > 0 ? '+' : ''}${filtered.peakBar.value})`
      : '';
    if (unpublishedYears.length > 0) {
      const excl = unpublishedYears.map((y) => (isZh ? `${y}年` : String(y))).join('、');
      return isTw
        ? `${excl}未公布已過濾 · 2016至今均值 ${avgSigned}億 · 峰值 ${peakStr}億`
        : isZh
        ? `${excl}未公布已过滤 · 2016至今均值 ${avgSigned}亿 · 峰值 ${peakStr}亿`
        : `Excluded unpublished (${unpublishedYears.join(', ')}) · Avg ${avgSigned} (100M)`;
    }
    return isTw
      ? `2016年至今全部${bars.length}個已公布年份 · 均值 ${avgSigned}億 · 峰值 ${peakStr}億`
      : isZh
      ? `2016年至今全部${bars.length}个已公布年份 · 均值 ${avgSigned}亿 · 峰值 ${peakStr}亿`
      : `All ${bars.length} published years since 2016 · Mean ${avgSigned} (100M)`;
  })();

  const minTick = Math.min(0, ...series.yTicks);
  const maxTick = Math.max(0, ...series.yTicks);
  const minBarVal = bars.length > 0 ? Math.min(0, ...bars.map((b) => b.value)) : 0;
  const maxBarVal = bars.length > 0 ? Math.max(0, ...bars.map((b) => b.value)) : 0;
  const hasNegative = minBarVal < 0;

  const spanRaw = Math.max(maxTick - minTick, maxBarVal - minBarVal, 400);
  const yMax = Math.max(maxTick, maxBarVal) + spanRaw * 0.14;
  const yMin = hasNegative
    ? Math.min(minTick, minBarVal) - spanRaw * 0.22
    : -spanRaw * 0.05;
  const ySpan = Math.max(yMax - yMin, 1);

  const VB_W = 620;
  const VB_H = 356;
  const PAD_L = 48;
  const PAD_R = 14;
  const PAD_T = 24;
  const PAD_B = 56;
  const PLOT_W = VB_W - PAD_L - PAD_R;
  const PLOT_H = VB_H - PAD_T - PAD_B;

  const mapY = (val: number) => PAD_T + ((yMax - val) / ySpan) * PLOT_H;
  const yZero = mapY(0);
  const stepW = PLOT_W / Math.max(1, bars.length);
  const barW = Math.min(30, stepW * 0.56);
  const mapCenterX = (idx: number) => PAD_L + (idx + 0.5) * stepW;

  const activeBar = hoveredYear !== null ? bars.find((b) => b.year === hoveredYear) : null;

  // Dynamically assign bar roles directly from plotted data
  const latestIdx = bars.length - 1;
  const inflectionIdx = bars.length >= 3 ? computeSharpestInflectionIndex(bars) : -1;
  let peakPosIdx = -1;
  let maxPosVal = 0;
  bars.forEach((b, idx) => {
    if (b.value > maxPosVal) {
      maxPosVal = b.value;
      peakPosIdx = idx;
    }
  });

  const getBarRole = (bar: { value: number }, idx: number): DynamicBarRole => {
    if (idx === latestIdx) return bar.value < 0 ? 'latest_neg' : 'latest_pos';
    if (idx === inflectionIdx) return 'inflection';
    if (bar.value < 0) return 'negative';
    if (idx === peakPosIdx && bar.value > 0) return 'peak';
    return 'default';
  };

  // Dynamically compute 2 callout boxes: (1) Inflection point & (2) Current month
  const resolvedCallouts = (() => {
    if (bars.length === 0) return [];
    const items: Array<{
      id: string;
      barIdx: number;
      bar: { year: number; value: number };
      tone: 'purple' | 'rose' | 'emerald';
      lines: string[];
    }> = [];

    const fmtSigned = (v: number) => `${v > 0 ? '+' : ''}${v}`;

    if (inflectionIdx >= 0 && inflectionIdx < latestIdx) {
      const infBar = bars[inflectionIdx];
      const prevInfBar = inflectionIdx > 0 ? bars[inflectionIdx - 1] : null;
      const nextInfBar = inflectionIdx < bars.length - 1 ? bars[inflectionIdx + 1] : null;
      const isCyclePeak =
        prevInfBar !== null &&
        nextInfBar !== null &&
        infBar.value >= prevInfBar.value &&
        infBar.value > nextInfBar.value;
      const isTransitionNeg =
        infBar.value < 0 && prevInfBar !== null && prevInfBar.value >= 0;
      const isTurnWeak =
        prevInfBar !== null && infBar.value < prevInfBar.value;

      const headerLine = isTransitionNeg
        ? isTw
          ? `${infBar.year}年轉負拐點`
          : isZh
          ? `${infBar.year}年转负拐点`
          : `${infBar.year} Inflection (<0)`
        : isCyclePeak
        ? isTw
          ? `${infBar.year}年高位拐點`
          : isZh
          ? `${infBar.year}年高位拐点`
          : `${infBar.year} Peak Inflection`
        : isTurnWeak
        ? isTw
          ? `${infBar.year}年轉弱拐點`
          : isZh
          ? `${infBar.year}年转弱拐点`
          : `${infBar.year} Downturn`
        : isTw
        ? `${infBar.year}年修復拐點`
        : isZh
        ? `${infBar.year}年修复拐点`
        : `${infBar.year} Rebound`;

      const stepDelta = prevInfBar !== null ? infBar.value - prevInfBar.value : null;
      const deltaLine =
        stepDelta !== null
          ? isTw
            ? `${series.monthNumber}月 ${fmtSigned(infBar.value)}億 (較上年${fmtSigned(stepDelta)})`
            : isZh
            ? `${series.monthNumber}月 ${fmtSigned(infBar.value)}亿 (较上年${fmtSigned(stepDelta)})`
            : `${series.monthNumber}M ${fmtSigned(infBar.value)} (YoY ${fmtSigned(stepDelta)})`
          : isTw
          ? `當年${series.monthNumber}月 ${fmtSigned(infBar.value)}億`
          : isZh
          ? `当年${series.monthNumber}月 ${fmtSigned(infBar.value)}亿`
          : `${series.monthNumber}M ${fmtSigned(infBar.value)}`;

      items.push({
        id: 'inflection',
        barIdx: inflectionIdx,
        bar: infBar,
        tone: 'purple',
        lines: [headerLine, deltaLine],
      });
    }

    const latBar = bars[latestIdx];
    const prevLatBar = latestIdx > 0 ? bars[latestIdx - 1] : null;
    const isHistLow =
      filtered.troughBar !== null && filtered.troughBar.year === latBar.year && latBar.value < 0;
    const isHistPeak =
      filtered.peakBar !== null && filtered.peakBar.year === latBar.year && latBar.value > 0;
    const latTone: 'rose' | 'emerald' = latBar.value < 0 ? 'rose' : 'emerald';

    const latHeader = isHistLow
      ? isTw
        ? `當前${latBar.year}年創2016來新低`
        : isZh
        ? `当前${latBar.year}年创2016来新低`
        : `${latBar.year}: Lowest Since 2016`
      : isHistPeak
      ? isTw
        ? `當前${latBar.year}年創2016來新高`
        : isZh
        ? `当前${latBar.year}年创2016来新高`
        : `${latBar.year}: Peak Since 2016`
      : latBar.value < 0
      ? isTw
        ? `當前${latBar.year}年${series.monthNumber}月淨收縮`
        : isZh
        ? `当前${latBar.year}年${series.monthNumber}月净收缩`
        : `${latBar.year} Contraction`
      : isTw
      ? `當前${latBar.year}年${series.monthNumber}月淨擴張`
      : isZh
      ? `当前${latBar.year}年${series.monthNumber}月净扩张`
      : `${latBar.year} Expansion`;

    const yoyDiff = prevLatBar !== null ? latBar.value - prevLatBar.value : null;
    const latMetric =
      yoyDiff !== null
        ? isTw
          ? `當月${fmtSigned(latBar.value)}億 (同比${fmtSigned(yoyDiff)})`
          : isZh
          ? `当月${fmtSigned(latBar.value)}亿 (同比${fmtSigned(yoyDiff)})`
          : `Curr ${fmtSigned(latBar.value)} (YoY ${fmtSigned(yoyDiff)})`
        : isTw
        ? `當月${fmtSigned(latBar.value)}億`
        : isZh
        ? `当月${fmtSigned(latBar.value)}亿`
        : `Current: ${fmtSigned(latBar.value)}`;

    items.push({
      id: 'latest',
      barIdx: latestIdx,
      bar: latBar,
      tone: latTone,
      lines: [latHeader, latMetric],
    });

    // Place boxes cleanly near their anchors without overlapping each other
    const placed = items.map((item) => {
      const boxH = item.lines.length * 13.5 + 10;
      const maxLen = Math.max(...item.lines.map((l) => l.length));
      const boxW = Math.min(182, Math.max(122, isZh ? maxLen * 9.5 + 18 : maxLen * 6.4 + 18));
      const anchorX = mapCenterX(item.barIdx);
      const anchorY = mapY(item.bar.value);
      const preferBelow = item.bar.value < 0;
      const boxX = Math.max(
        PAD_L + 4,
        Math.min(
          VB_W - PAD_R - boxW - 2,
          anchorX - (item.id === 'latest' ? boxW * 0.78 : boxW * 0.5)
        )
      );
      const rawBoxY = preferBelow
        ? Math.min(VB_H - PAD_B - boxH - 2, anchorY + 22)
        : Math.max(PAD_T + 2, anchorY - boxH - 24);
      return {
        ...item,
        anchorX,
        anchorY,
        boxX,
        boxY: rawBoxY,
        boxW,
        boxH,
      };
    });

    if (placed.length === 2) {
      const a = placed[0];
      const b = placed[1];
      const overlapX = a.boxX < b.boxX + b.boxW + 8 && a.boxX + a.boxW + 8 > b.boxX;
      const overlapY = a.boxY < b.boxY + b.boxH + 6 && a.boxY + a.boxH + 6 > b.boxY;
      if (overlapX && overlapY) {
        a.boxX = Math.max(PAD_L + 4, b.boxX - a.boxW - 12);
        if (a.boxX + a.boxW + 6 > b.boxX) {
          a.boxY = PAD_T + 2;
        }
      }
    }

    return placed;
  })();

  const legendItems = [
    {
      label: isTw ? '擴張年份' : isZh ? '扩张年份' : 'Expansion',
      color: DYNAMIC_BAR_COLORS.default,
    },
    {
      label: isTw ? '歷史峰值' : isZh ? '历史峰值' : 'Peak',
      color: DYNAMIC_BAR_COLORS.peak,
    },
    {
      label: isTw ? '關鍵拐點' : isZh ? '关键拐点' : 'Inflection',
      color: DYNAMIC_BAR_COLORS.inflection,
    },
    ...(bars.some((b, idx) => idx !== latestIdx && b.value < 0)
      ? [
          {
            label: isTw ? '淨收縮' : isZh ? '净收缩' : 'Contraction',
            color: DYNAMIC_BAR_COLORS.negative,
          },
        ]
      : []),
    {
      label: isTw ? '當月最新' : isZh ? '当月最新' : 'Latest',
      color:
        bars[latestIdx]?.value < 0
          ? DYNAMIC_BAR_COLORS.latest_neg
          : DYNAMIC_BAR_COLORS.latest_pos,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-1.5 sm:p-3 pt-[max(0.4rem,env(safe-area-inset-top))] pb-[max(0.4rem,env(safe-area-inset-bottom))] bg-black/60 backdrop-blur-md select-none animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="econ-modal-cq w-full max-w-2xl [@media(max-height:560px)]:max-w-5xl max-h-[calc(100dvh-0.8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col overflow-hidden rounded-[22px] bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-black backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 [.amoled-mode_&]:border-white/15 shadow-2xl p-2.5 sm:p-4 [@media(max-height:560px)]:p-2.5 gap-1.5 sm:gap-2 animate-modal-sheet"
      >
        {/* Top Title + Unit + Close */}
        <div className="shrink-0 flex items-start justify-between gap-2">
          <div className="min-w-0 flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h2 className="text-sm sm:text-lg [@media(max-height:560px)]:text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight truncate">
                {title}
              </h2>
              {activeBar && (
                <span className="text-[11px] font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                  {activeBar.year}年{series.monthNumber}月：{activeBar.value > 0 ? '+' : ''}
                  {activeBar.value}
                </span>
              )}
            </div>
            <p className="text-[10.5px] sm:text-[11px] font-medium text-neutral-500 dark:text-neutral-400 tabular-nums truncate">
              {filterStatusLine}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 tabular-nums">
              {unitText}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 [@media(max-height:560px)]:w-8 [@media(max-height:560px)]:h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Bar Chart Card */}
        <div className="flex-1 min-h-0 rounded-2xl bg-neutral-50/90 dark:bg-neutral-800/70 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/12 p-2 sm:p-3 [@media(max-height:560px)]:p-2 flex flex-col justify-between gap-1 overflow-hidden">
          <div className="econ-chart-cq flex-1 min-h-0 flex items-center justify-center">
            <svg
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              className="econ-svg-responsive econ-svg-tall overflow-visible touch-none"
              onMouseLeave={() => setHoveredYear(null)}
            >
              {/* Y-Axis Ticks & Dashed Horizontal Gridlines + Solid 0 Line */}
              {series.yTicks.map((tick) => {
                const ty = mapY(tick);
                const isZero = tick === 0;
                return (
                  <g key={tick}>
                    <line
                      x1={PAD_L}
                      x2={VB_W - PAD_R}
                      y1={ty}
                      y2={ty}
                      stroke="currentColor"
                      className={
                        isZero
                          ? 'text-neutral-800 dark:text-neutral-200'
                          : 'text-neutral-300/85 dark:text-neutral-700/75'
                      }
                      strokeWidth={isZero ? '1.2' : '0.85'}
                      strokeDasharray={isZero ? undefined : '2.5 3'}
                    />
                    <text
                      x={PAD_L - 8}
                      y={ty + 3.5}
                      textAnchor="end"
                      className="fill-neutral-700 dark:fill-neutral-300 text-[10.5px] font-mono tabular-nums"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* 2016–Present Annual Bars & Dynamic Role Colors */}
              {bars.map((bar, idx) => {
                const cx = mapCenterX(idx);
                const yVal = mapY(bar.value);
                const isPos = bar.value >= 0;
                const rectY = isPos ? yVal : yZero;
                const rectH = Math.max(2, Math.abs(yVal - yZero));
                const role = getBarRole(bar, idx);
                const fillColor = DYNAMIC_BAR_COLORS[role];
                const isHovered = hoveredYear === bar.year;

                const labelColorClass =
                  role === 'inflection'
                    ? 'fill-violet-700 dark:fill-violet-300 font-bold'
                    : role === 'latest_neg'
                    ? 'fill-rose-600 dark:fill-rose-400 font-bold'
                    : role === 'latest_pos'
                    ? 'fill-emerald-600 dark:fill-emerald-400 font-bold'
                    : role === 'negative'
                    ? 'fill-amber-700 dark:fill-amber-300 font-bold'
                    : role === 'peak'
                    ? 'fill-blue-700 dark:fill-blue-300 font-bold'
                    : 'fill-neutral-800 dark:fill-neutral-100 font-semibold';

                const yearLabelText = isZh ? `${bar.year}年` : String(bar.year);

                return (
                  <g
                    key={bar.year}
                    onMouseEnter={() => setHoveredYear(bar.year)}
                    onTouchStart={() => setHoveredYear(bar.year)}
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
                      rx="1.5"
                      fill={fillColor}
                      fillOpacity={hoveredYear !== null && !isHovered ? 0.65 : 0.95}
                      className="transition-opacity duration-150"
                    />
                    <text
                      x={cx}
                      y={isPos ? rectY - 5 : rectY + rectH + 12}
                      textAnchor="middle"
                      className={`text-[10px] font-mono tabular-nums ${labelColorClass}`}
                    >
                      {bar.value}
                    </text>
                    <text
                      x={cx}
                      y={VB_H - 12}
                      textAnchor="end"
                      transform={`rotate(-30 ${cx.toFixed(1)} ${(VB_H - 12).toFixed(1)})`}
                      className={`text-[10px] font-mono tabular-nums ${
                        isHovered
                          ? 'fill-neutral-950 dark:fill-white font-bold'
                          : 'fill-neutral-700 dark:fill-neutral-300'
                      }`}
                    >
                      {yearLabelText}
                    </text>
                  </g>
                );
              })}

              {/* Dynamically Calculated Inflection & Current-Month Boxed Callouts */}
              {resolvedCallouts.map((c) => {
                const style = CALLOUT_STYLES[c.tone];
                const barTopOrBotY =
                  c.bar.value >= 0 ? c.anchorY - 14 : c.anchorY + 14;
                const boxEdgeY =
                  c.boxY + c.boxH < barTopOrBotY
                    ? c.boxY + c.boxH
                    : c.boxY > barTopOrBotY
                    ? c.boxY
                    : c.boxY + c.boxH / 2;
                const boxEdgeX = Math.max(
                  c.boxX + 8,
                  Math.min(c.boxX + c.boxW - 8, c.anchorX)
                );

                return (
                  <g key={`callout-${c.id}-${c.bar.year}`} className="pointer-events-none">
                    <line
                      x1={boxEdgeX}
                      y1={boxEdgeY}
                      x2={c.anchorX}
                      y2={barTopOrBotY}
                      stroke={style.stroke}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      strokeOpacity="0.8"
                    />
                    <rect
                      x={c.boxX}
                      y={c.boxY}
                      width={c.boxW}
                      height={c.boxH}
                      rx="5"
                      className="fill-white/95 dark:fill-neutral-900/95 [.amoled-mode_&]:fill-neutral-950"
                      stroke={style.stroke}
                      strokeWidth="1.2"
                    />
                    {c.lines.map((ln, lIdx) => (
                      <text
                        key={lIdx}
                        x={c.boxX + c.boxW / 2}
                        y={c.boxY + 14.5 + lIdx * 13.5}
                        textAnchor="middle"
                        className={`text-[9.5px] font-semibold tabular-nums ${style.textClass}`}
                      >
                        {ln}
                      </text>
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Dynamic Color Role Legend */}
          <div className="shrink-0 pt-1 border-t border-neutral-200/70 dark:border-neutral-700/60 [.amoled-mode_&]:border-white/10 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
            {legendItems.map((it) => (
              <span key={it.label} className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: it.color }}
                />
                <span>{it.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Attribution Strip */}
        <p className="shrink-0 text-[10px] sm:text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
          {sourceNote}
        </p>
      </div>
    </div>
  );
};
