import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Language } from '../types/calendar';
import {
  RETAIL_CATEGORY_WEIGHTS,
  RetailContributionCategoryId,
  RetailContributionItem,
  RetailContributionMonthSeries,
  fetchRetailContributionMonthlyList,
} from '../utils/financeService';
import { isChineseLocale, isRtlLanguage } from '../utils/i18n';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';

interface RetailContributionModalProps {
  open: boolean;
  language: Language;
  onClose: () => void;
}

const AUTO_POS_COLOR = '#4CA9E8';
const STEP_POS_COLOR = '#E494B2';
const STEP_NEG_COLOR = '#E05555';
const TOTAL_BAR_COLOR = '#4CA9E8';

function formatSignedPts(val: number, decimals = 2): string {
  const fixed = val.toFixed(decimals);
  return val > 0 ? `+${fixed}` : fixed;
}

function getDynamicOffsetPhrase(
  focusLabel: string,
  absDrag: number,
  otherPullSum: number,
  isTw: boolean,
  isZh: boolean
): string {
  if (otherPullSum <= 0.01) {
    if (!isZh && !isTw) return `with ${focusLabel} dragging ${absDrag.toFixed(2)}pt`;
    return isTw
      ? `${focusLabel}一項拖累${absDrag.toFixed(2)}個百分點`
      : `${focusLabel}一项拖累${absDrag.toFixed(2)}个百分点`;
  }
  if (!isZh && !isTw) {
    const pct = Math.round((absDrag / otherPullSum) * 100);
    return `with ~${pct}% offset by ${focusLabel}`;
  }
  const ratio = absDrag / otherPullSum;
  if (ratio >= 1.05) {
    return isTw ? `被${focusLabel}一項完全抵消並轉負` : `被${focusLabel}一项完全抵消并转负`;
  }
  if (ratio >= 0.88) {
    return isTw ? `接近全部被${focusLabel}一項抵消` : `接近全部被${focusLabel}一项抵消`;
  }
  if (ratio >= 0.72) {
    return isTw ? `約四分之三被${focusLabel}一項抵消` : `约四分之三被${focusLabel}一项抵消`;
  }
  if (ratio >= 0.60) {
    return isTw ? `約三分之二被${focusLabel}一項抵消` : `约三分之二被${focusLabel}一项抵消`;
  }
  if (ratio >= 0.44) {
    return isTw ? `約一半被${focusLabel}一項抵消` : `约一半被${focusLabel}一项抵消`;
  }
  if (ratio >= 0.28) {
    return isTw ? `約三分之一被${focusLabel}一項抵消` : `约三分之一被${focusLabel}一项抵消`;
  }
  return isTw
    ? `${focusLabel}一項抵消${absDrag.toFixed(2)}個百分點`
    : `${focusLabel}一项抵消${absDrag.toFixed(2)}个百分点`;
}

export const RetailContributionModal: React.FC<RetailContributionModalProps> = ({
  open,
  language,
  onClose,
}) => {
  const isZh = isChineseLocale(language);
  const isTw = language === 'zh-TW';
  const isRtl = isRtlLanguage(language);

  const [monthlyList, setMonthlyList] = useState<RetailContributionMonthSeries[]>([]);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useSystemBackLayer(
    open,
    onClose,
    BACK_PRIORITY.INNER_OVERLAY + 10,
    'retail-contribution-modal'
  );

  useEffect(() => {
    if (!open) return;
    let active = true;
    setIsLoading(true);
    fetchRetailContributionMonthlyList(false)
      .then((list) => {
        if (!active) return;
        setMonthlyList(list);
        if (list.length > 0) {
          setSelectedPeriodKey((prev) =>
            prev && list.some((m) => m.periodKey === prev)
              ? prev
              : list[list.length - 1].periodKey
          );
        }
        setHoveredId(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  const years = useMemo(() => {
    const set = new Set<number>();
    monthlyList.forEach((m) => set.add(m.year));
    return Array.from(set).sort((a, b) => a - b);
  }, [monthlyList]);

  const activeIdx = useMemo(() => {
    if (monthlyList.length === 0) return -1;
    const found = monthlyList.findIndex((m) => m.periodKey === selectedPeriodKey);
    return found >= 0 ? found : monthlyList.length - 1;
  }, [monthlyList, selectedPeriodKey]);

  const activeSeries = activeIdx >= 0 ? monthlyList[activeIdx] : null;
  const prevSeries = activeIdx > 0 ? monthlyList[activeIdx - 1] : null;

  const monthsInYear = useMemo(() => {
    if (!activeSeries) return [];
    return monthlyList.filter((m) => m.year === activeSeries.year);
  }, [monthlyList, activeSeries]);

  if (!open || !activeSeries) return null;

  const title = isTw
    ? '社會消費品零售總額同比拉動拆分'
    : isZh
    ? '社会消费品零售总额同比拉动拆分'
    : 'Total Retail Sales YoY Contribution Breakdown';

  const getItemLabel = (item: RetailContributionItem) =>
    isTw ? item.nameTw : isZh ? item.nameZh : item.nameEn;

  const getShortLines = (item: RetailContributionItem) =>
    isTw ? item.shortTw : isZh ? item.shortZh : item.shortEn;

  const publishedItems = activeSeries.publishedItems;
  const unpublishedItems = activeSeries.unpublishedItems;

  const sourceText = isTw
    ? `數據來源：${activeSeries.sourceTw} · 統計期：${activeSeries.fullTimeLabel}`
    : isZh
    ? `数据来源：${activeSeries.sourceZh} · 统计期：${activeSeries.fullTimeLabel}`
    : `Source: ${activeSeries.sourceEn} · Period: ${activeSeries.timeLabel}`;

  // Dynamically identify largest negative drag (or strongest driver if all positive) from plotted components
  const componentItems = publishedItems.filter((item) => !item.isTotal);
  const negativeItems = componentItems
    .filter((item) => item.value < 0)
    .sort((a, b) => a.value - b.value);
  const positiveItems = componentItems
    .filter((item) => item.value >= 0)
    .sort((a, b) => b.value - a.value);
  const focusItem = negativeItems[0] || positiveItems[0] || null;
  const focusLabel = focusItem ? getItemLabel(focusItem) : '';
  const totalNegativeDrag = Number(
    componentItems
      .filter((i) => i.value < 0)
      .reduce((acc, i) => acc + Math.abs(i.value), 0)
      .toFixed(2)
  );
  const totalPositivePull = Number(
    componentItems
      .filter((i) => i.value > 0)
      .reduce((acc, i) => acc + i.value, 0)
      .toFixed(2)
  );
  const otherComponentsSum = focusItem
    ? Number(
        componentItems
          .filter((i) => i.id !== focusItem.id)
          .reduce((acc, i) => acc + i.value, 0)
          .toFixed(2)
      )
    : 0;

  const computeExItemYoY = (
    seriesData: RetailContributionMonthSeries | null,
    targetId: RetailContributionCategoryId
  ): number | null => {
    if (!seriesData) return null;
    const comps = seriesData.publishedItems.filter((i) => !i.isTotal);
    const target = comps.find((i) => i.id === targetId);
    if (!target) return null;
    const tot =
      seriesData.publishedItems.find((i) => i.isTotal)?.value ??
      comps.reduce((acc, i) => acc + i.value, 0);
    const weight =
      targetId !== 'rscg_yoy' ? (RETAIL_CATEGORY_WEIGHTS[targetId] ?? 0.1) : 0.1;
    return Number(((tot - target.value) / Math.max(0.1, 1 - weight)).toFixed(1));
  };

  // Dynamic summary line calculated strictly from plotted published items
  const summaryLine = (() => {
    if (publishedItems.length === 0 || componentItems.length === 0) {
      return isTw
        ? '單位：百分點；暫無已公布分項數據'
        : isZh
        ? '单位：百分点；暂无已公布分项数据'
        : 'Unit: pct pts; no published data';
    }
    if (focusItem && focusItem.value < 0) {
      const phrase = getDynamicOffsetPhrase(
        focusLabel,
        Math.abs(focusItem.value),
        otherComponentsSum,
        isTw,
        isZh
      );
      if (isTw) {
        return `單位：百分點；其餘各項合計拉動${formatSignedPts(otherComponentsSum)}個百分點，${phrase}`;
      }
      if (isZh) {
        return `单位：百分点；其余各项合计拉动${formatSignedPts(otherComponentsSum)}个百分点，${phrase}`;
      }
      return `Unit: pct pts; Ex-${focusLabel} sum ${formatSignedPts(otherComponentsSum)}pt, ${phrase}`;
    }
    if (focusItem) {
      const sharePct =
        totalPositivePull > 0
          ? Math.round((focusItem.value / totalPositivePull) * 100)
          : 0;
      if (isTw) {
        return `單位：百分點；全部已公布分項合計拉動${formatSignedPts(totalPositivePull - totalNegativeDrag)}個百分點，${focusLabel}拉動最大(+${focusItem.value.toFixed(2)}pt，佔正拉動${sharePct}%)`;
      }
      if (isZh) {
        return `单位：百分点；全部已公布分项合计拉动${formatSignedPts(totalPositivePull - totalNegativeDrag)}个百分点，${focusLabel}拉动最大(+${focusItem.value.toFixed(2)}pt，占正拉动${sharePct}%)`;
      }
      return `Unit: pct pts; Total pull ${formatSignedPts(totalPositivePull - totalNegativeDrag)}pt; top driver ${focusLabel} (+${focusItem.value.toFixed(2)}pt, ${sharePct}%)`;
    }
    const netPull = Number((totalPositivePull - totalNegativeDrag).toFixed(2));
    return isTw
      ? `單位：百分點；已公布分項合計拉動${formatSignedPts(netPull)}個百分點`
      : isZh
      ? `单位：百分点；已公布分项合计拉动${formatSignedPts(netPull)}个百分点`
      : `Unit: pct pts; Published sum ${formatSignedPts(netPull)}pt`;
  })();

  const formulaLine = isTw
    ? '拉動 = 該項同比增量/上年同月社零總額，按統計局公布的當月額與同比推算'
    : isZh
    ? '拉动 = 该项同比增量/上年同月社零总额，按统计局公布的当月额与同比推算'
    : 'Contribution = Category YoY increment / Prior-year monthly retail sales';

  const unpublishedNames = unpublishedItems.map(getItemLabel);
  const unpublishedNotice =
    unpublishedItems.length > 0
      ? isTw
        ? `${unpublishedNames.join('、')}未公布，已自動從拆分圖中排除`
        : isZh
        ? `${unpublishedNames.join('、')}未公布，已自动从拆分图中排除`
        : `Unpublished (excluded): ${unpublishedNames.join(', ')}`
      : null;

  // Dynamic Callout Box analyzing largest negative drag (or strongest positive driver) & ex-item YoY
  const prevMonthLabel = prevSeries ? prevSeries.monthLabelZh : '';
  const prevFocusItem =
    focusItem && prevSeries
      ? prevSeries.publishedItems.find((i) => i.id === focusItem.id) ?? null
      : null;

  const calloutLine1 = (() => {
    if (!focusItem) return '';
    const v = focusItem.value;
    const prevV = prevFocusItem ? prevFocusItem.value : null;
    const prevSuffix =
      prevV !== null
        ? isTw
          ? `（${prevMonthLabel}為${prevV < 0 ? `-${Math.abs(prevV).toFixed(2)}` : `+${prevV.toFixed(2)}`}）`
          : isZh
          ? `（${prevMonthLabel}为${prevV < 0 ? `-${Math.abs(prevV).toFixed(2)}` : `+${prevV.toFixed(2)}`}）`
          : ` (${prevSeries?.timeLabel}: ${formatSignedPts(prevV)})`
        : '';
    if (isTw) {
      return `${
        v < 0
          ? `${focusLabel}一項拉低${Math.abs(v).toFixed(2)}個百分點`
          : `${focusLabel}一項拉動+${v.toFixed(2)}個百分點`
      }${prevSuffix}`;
    }
    if (isZh) {
      return `${
        v < 0
          ? `${focusLabel}一项拉低${Math.abs(v).toFixed(2)}个百分点`
          : `${focusLabel}一项拉动+${v.toFixed(2)}个百分点`
      }${prevSuffix}`;
    }
    return `${focusLabel} ${v < 0 ? 'drag' : 'boost'} ${formatSignedPts(v)}pt${prevSuffix}`;
  })();

  const calloutLine2 = (() => {
    if (!focusItem) return '';
    const exFocusYoY = computeExItemYoY(activeSeries, focusItem.id);
    if (exFocusYoY === null) return '';
    const prevExFocusYoY = computeExItemYoY(prevSeries, focusItem.id);
    const prevSuffix =
      prevExFocusYoY !== null
        ? isTw
          ? `（${prevMonthLabel}為${prevExFocusYoY.toFixed(1)}%）`
          : isZh
          ? `（${prevMonthLabel}为${prevExFocusYoY.toFixed(1)}%）`
          : ` (${prevSeries?.timeLabel}: ${prevExFocusYoY.toFixed(1)}%)`
        : '';
    if (isTw) {
      return `除${focusLabel}外消費品同比${exFocusYoY.toFixed(1)}%${prevSuffix}`;
    }
    if (isZh) {
      return `除${focusLabel}外消费品同比${exFocusYoY.toFixed(1)}%${prevSuffix}`;
    }
    return `Ex-${focusLabel} Retail YoY ${exFocusYoY.toFixed(1)}%${prevSuffix}`;
  })();

  const calloutIsDrag = focusItem ? focusItem.value < 0 : false;

  // Build waterfall bar rectangles from filtered publishedItems
  interface WaterfallBar {
    item: RetailContributionItem & { value: number };
    start: number;
    end: number;
    isTotal: boolean;
  }

  let running = 0;
  const waterfallBars: WaterfallBar[] = publishedItems.map((item) => {
    if (item.isTotal) {
      return { item, start: 0, end: item.value, isTotal: true };
    }
    const start = running;
    const end = Number((running + item.value).toFixed(2));
    running = end;
    return { item, start, end, isTotal: false };
  });

  // Compute Y-axis bounds & clean ticks dynamically
  const allVals = waterfallBars.flatMap((b) => [b.start, b.end, 0]);
  const rawMin = Math.min(...allVals, 0);
  const rawMax = Math.max(...allVals, 0);
  const rawRange = Math.max(rawMax - rawMin, 1.5);
  const tickStep =
    rawRange > 25 ? 10 : rawRange > 14 ? 5 : rawRange > 8 ? 2 : rawRange > 4.5 ? 1 : 0.5;
  const yMax = Math.ceil((rawMax + tickStep * 0.45) / tickStep) * tickStep;
  const yMin =
    rawMin < 0
      ? Math.floor((rawMin - tickStep * 0.45) / tickStep) * tickStep
      : -tickStep * 0.25;
  const ySpan = Math.max(yMax - yMin, 1);

  const yTicks: number[] = [];
  const tickStart = Math.ceil(yMin / tickStep) * tickStep;
  for (let v = tickStart; v <= yMax + 1e-6; v += tickStep) {
    const clean = Math.abs(v) < 1e-4 ? 0 : Number(v.toFixed(2));
    yTicks.push(clean);
  }
  if (!yTicks.some((t) => t === 0)) {
    yTicks.push(0);
    yTicks.sort((a, b) => a - b);
  }

  const VB_W = 640;
  const VB_H = 315;
  const PAD_L = 46;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 42;
  const PLOT_W = VB_W - PAD_L - PAD_R;
  const PLOT_H = VB_H - PAD_T - PAD_B;

  const mapY = (val: number) => PAD_T + ((yMax - val) / ySpan) * PLOT_H;
  const barCount = Math.max(1, waterfallBars.length);
  const stepW = PLOT_W / barCount;
  const barW = Math.min(42, stepW * 0.54);
  const mapCenterX = (idx: number) => PAD_L + (idx + 0.5) * stepW;

  const activeBar =
    hoveredId !== null
      ? waterfallBars.find((b) => b.item.id === hoveredId)?.item ?? null
      : null;

  // Callout box in upper-left/middle open space (automatically checks for bar overlap)
  const calloutHasContent = Boolean(calloutLine1 || calloutLine2);
  const maxCalloutChars = Math.max(calloutLine1.length, calloutLine2.length);
  const calloutW = isZh
    ? Math.max(198, Math.round(maxCalloutChars * 9.5 + 22))
    : Math.max(210, Math.round(maxCalloutChars * 5.8 + 22));
  const calloutH = calloutLine1 && calloutLine2 ? 38 : 22;
  const calloutX = PAD_L + Math.max(36, PLOT_W * 0.17);
  const calloutY = PAD_T + 8;

  const calloutOverlapsBars = waterfallBars.some((b, idx) => {
    const bx1 = mapCenterX(idx) - barW / 2;
    const bx2 = mapCenterX(idx) + barW / 2;
    const byTop = Math.min(mapY(b.start), mapY(b.end)) - 16;
    const horizOverlap = bx2 > calloutX - 6 && bx1 < calloutX + calloutW + 6;
    const vertOverlap = byTop < calloutY + calloutH + 4;
    return horizOverlap && vertOverlap;
  });

  const handleSelectYear = (year: number) => {
    const inYear = monthlyList.filter((m) => m.year === year);
    if (inYear.length === 0) return;
    const sameMonth = activeSeries
      ? inYear.find((m) => m.monthLabelZh === activeSeries.monthLabelZh)
      : undefined;
    setSelectedPeriodKey((sameMonth || inYear[inYear.length - 1]).periodKey);
    setHoveredId(null);
  };

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
        className="econ-modal-cq w-full max-w-2xl [@media(max-height:560px)]:max-w-5xl max-h-[calc(100dvh-0.8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col overflow-hidden rounded-[22px] bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-black backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 [.amoled-mode_&]:border-white/15 shadow-2xl p-2.5 sm:p-4 [@media(max-height:560px)]:p-2.5 gap-1 sm:gap-1.5 animate-modal-sheet"
      >
        {/* Top Title + Divider */}
        <div className="shrink-0 flex items-center justify-between gap-2 pb-1.5 border-b border-neutral-900/75 dark:border-neutral-200/25 [.amoled-mode_&]:border-white/25">
          <div className="min-w-0 flex-1 flex items-baseline gap-2.5 flex-wrap">
            <h2 className="text-sm sm:text-lg [@media(max-height:560px)]:text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight truncate">
              {title}
            </h2>
            {activeBar && (
              <span
                className={`text-[11px] font-mono tabular-nums font-bold ${
                  activeBar.isTotal
                    ? 'text-sky-600 dark:text-sky-400'
                    : activeBar.value >= 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {getItemLabel(activeBar)}：
                {activeBar.isTotal
                  ? `${activeBar.value.toFixed(1)}%`
                  : `${formatSignedPts(activeBar.value)}${isZh ? '百分点' : 'pt'}`}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 [@media(max-height:560px)]:w-8 [@media(max-height:560px)]:h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2016–Present Year + Month Selector */}
        <div className="shrink-0 space-y-1">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {years.map((yr) => {
              const isSelected = yr === activeSeries.year;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => handleSelectYear(yr)}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-mono tabular-nums font-semibold shrink-0 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
                      : 'bg-neutral-100/80 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-700/70 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70'
                  }`}
                >
                  {yr}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
            {monthsInYear.map((m) => {
              const isSelected = m.periodKey === activeSeries.periodKey;
              return (
                <button
                  key={m.periodKey}
                  type="button"
                  onClick={() => {
                    setSelectedPeriodKey(m.periodKey);
                    setHoveredId(null);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-mono tabular-nums font-semibold shrink-0 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-neutral-100/80 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-700/70 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70'
                  }`}
                >
                  {m.monthLabelZh}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subtitle Metadata Block */}
        <div className="shrink-0 space-y-0.5 text-[10px] sm:text-[11px] [@media(max-height:560px)]:text-[9.5px] leading-snug">
          <p className="font-medium text-neutral-700 dark:text-neutral-200 tabular-nums">
            {sourceText}
          </p>
          <p className="text-neutral-700 dark:text-neutral-200 tabular-nums">{summaryLine}</p>
          <p className="text-neutral-500 dark:text-neutral-400">{formulaLine}</p>
          {unpublishedNotice && (
            <p className="text-amber-700 dark:text-amber-400 font-medium">
              {unpublishedNotice}
            </p>
          )}
        </div>

        {/* Waterfall Chart Panel */}
        <div className="flex-1 min-h-0 rounded-2xl bg-neutral-50/90 dark:bg-neutral-800/70 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/12 p-2 sm:p-3 [@media(max-height:560px)]:p-1.5 flex flex-col justify-between gap-1 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-[1px]">
              <div className="w-5 h-5 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            </div>
          )}

          <div className="econ-chart-cq flex-1 min-h-0 flex items-center justify-center">
            {waterfallBars.length === 0 ? (
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 text-center px-4">
                {isTw
                  ? '各項同比拉動數據暫未公布，公布後將自動繪製拆分圖'
                  : isZh
                  ? '各项同比拉动数据暂未公布，公布后将自动绘制拆分图'
                  : 'No published contribution data for this period.'}
              </p>
            ) : (
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="econ-svg-responsive econ-svg-tall overflow-visible touch-none"
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Y-Axis Ticks & Zero Baseline */}
                {yTicks.map((tick) => {
                  const ty = mapY(tick);
                  const isZero = tick === 0;
                  return (
                    <g key={tick}>
                      <line
                        x1={PAD_L}
                        x2={isZero ? VB_W - PAD_R : PAD_L - 4}
                        y1={ty}
                        y2={ty}
                        stroke="currentColor"
                        className="text-neutral-800 dark:text-neutral-200"
                        strokeWidth={isZero ? '1.15' : '0.9'}
                      />
                      <text
                        x={PAD_L - 7}
                        y={ty + 3.5}
                        textAnchor="end"
                        className="fill-neutral-700 dark:fill-neutral-300 text-[10.5px] font-mono tabular-nums"
                      >
                        {tickStep >= 1 ? tick.toFixed(0) : tick.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* Bottom X-Axis Line */}
                <line
                  x1={PAD_L}
                  x2={VB_W - PAD_R}
                  y1={PAD_T + PLOT_H}
                  y2={PAD_T + PLOT_H}
                  stroke="currentColor"
                  className="text-neutral-700 dark:text-neutral-300"
                  strokeWidth="0.9"
                />

                {/* Dotted Waterfall Connectors */}
                {waterfallBars.map((bar, idx) => {
                  if (idx >= waterfallBars.length - 1) return null;
                  const nextBar = waterfallBars[idx + 1];
                  const cx1 = mapCenterX(idx);
                  const cx2 = mapCenterX(idx + 1);
                  const yConn = mapY(bar.end);
                  // Connect bar's ending level to next bar's starting level (or headline level for total)
                  if (nextBar.isTotal && Math.abs(bar.end - nextBar.end) < 0.25) {
                    const yHead = mapY(nextBar.end);
                    return (
                      <line
                        key={`conn-${bar.item.id}`}
                        x1={cx1 + barW / 2}
                        x2={cx2 - barW / 2}
                        y1={yHead}
                        y2={yHead}
                        stroke="currentColor"
                        className="text-neutral-400 dark:text-neutral-500"
                        strokeWidth="1"
                        strokeDasharray="2 2.5"
                      />
                    );
                  }
                  return (
                    <line
                      key={`conn-${bar.item.id}`}
                      x1={cx1 + barW / 2}
                      x2={cx2 - barW / 2}
                      y1={yConn}
                      y2={yConn}
                      stroke="currentColor"
                      className="text-neutral-400 dark:text-neutral-500"
                      strokeWidth="1"
                      strokeDasharray="2 2.5"
                    />
                  );
                })}

                {/* Waterfall Bars, Labels & Wrapped X-Axis Names */}
                {waterfallBars.map((bar, idx) => {
                  const cx = mapCenterX(idx);
                  const yTop = Math.min(mapY(bar.start), mapY(bar.end));
                  const yBot = Math.max(mapY(bar.start), mapY(bar.end));
                  const rectH = Math.max(3, yBot - yTop);
                  const isHovered = hoveredId === bar.item.id;
                  const isPosVal = bar.item.value >= 0;

                  const fillColor = bar.isTotal
                    ? TOTAL_BAR_COLOR
                    : !isPosVal
                    ? STEP_NEG_COLOR
                    : focusItem && bar.item.id === focusItem.id
                    ? AUTO_POS_COLOR
                    : STEP_POS_COLOR;

                  const valLabel = bar.isTotal
                    ? bar.item.value.toFixed(1)
                    : formatSignedPts(bar.item.value);

                  const placeBelow = !bar.isTotal ? !isPosVal : bar.item.value < 0;
                  const labelY = placeBelow ? yBot + 12.5 : yTop - 5;

                  const labelClass = bar.isTotal
                    ? 'fill-sky-600 dark:fill-sky-400'
                    : isPosVal
                    ? 'fill-rose-700 dark:fill-rose-300'
                    : 'fill-red-600 dark:fill-red-400';

                  const lines = getShortLines(bar.item);

                  return (
                    <g
                      key={bar.item.id}
                      onMouseEnter={() => setHoveredId(bar.item.id)}
                      onTouchStart={() => setHoveredId(bar.item.id)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={cx - stepW / 2}
                        y={PAD_T}
                        width={stepW}
                        height={PLOT_H + PAD_B}
                        fill="transparent"
                      />
                      <rect
                        x={cx - barW / 2}
                        y={yTop}
                        width={barW}
                        height={rectH}
                        rx="1.2"
                        fill={fillColor}
                        fillOpacity={hoveredId !== null && !isHovered ? 0.65 : 0.95}
                        className="transition-opacity duration-150"
                      />
                      <text
                        x={cx}
                        y={labelY}
                        textAnchor="middle"
                        className={`text-[10.5px] font-mono tabular-nums font-bold ${labelClass}`}
                      >
                        {valLabel}
                      </text>
                      {lines.map((line, li) => (
                        <text
                          key={li}
                          x={cx}
                          y={PAD_T + PLOT_H + 14 + li * 12}
                          textAnchor="middle"
                          className={`text-[10px] ${
                            isHovered
                              ? 'fill-neutral-950 dark:fill-white font-bold'
                              : 'fill-neutral-800 dark:fill-neutral-200 font-medium'
                          }`}
                        >
                          {line}
                        </text>
                      ))}
                    </g>
                  );
                })}

                {/* Dynamic Focus Callout Box (largest negative drag or strongest positive driver) */}
                {calloutHasContent && !calloutOverlapsBars && (
                  <g>
                    <rect
                      x={calloutX}
                      y={calloutY}
                      width={calloutW}
                      height={calloutH}
                      rx="4"
                      className="fill-white/90 dark:fill-neutral-900/90 [.amoled-mode_&]:fill-black"
                      stroke={calloutIsDrag ? '#D14949' : '#2563EB'}
                      strokeWidth="1.2"
                    />
                    {calloutLine1 && (
                      <text
                        x={calloutX + 10}
                        y={calloutY + 15}
                        textAnchor="start"
                        className={`text-[10.5px] font-semibold tabular-nums ${
                          calloutIsDrag
                            ? 'fill-rose-700 dark:fill-rose-300'
                            : 'fill-sky-700 dark:fill-sky-300'
                        }`}
                      >
                        {calloutLine1}
                      </text>
                    )}
                    {calloutLine2 && (
                      <text
                        x={calloutX + 10}
                        y={calloutY + (calloutLine1 ? 30 : 15)}
                        textAnchor="start"
                        className={`text-[10.5px] font-semibold tabular-nums ${
                          calloutIsDrag
                            ? 'fill-rose-700 dark:fill-rose-300'
                            : 'fill-sky-700 dark:fill-sky-300'
                        }`}
                      >
                        {calloutLine2}
                      </text>
                    )}
                  </g>
                )}
              </svg>
            )}
          </div>

          {/* Overlap Fallback Strip for Extreme Regimes */}
          {calloutHasContent && calloutOverlapsBars && (
            <div className="shrink-0 pt-1 border-t border-neutral-200/70 dark:border-neutral-700/60 [.amoled-mode_&]:border-white/10 flex flex-wrap items-center justify-between gap-2">
              <span
                className={`px-2 py-0.5 rounded border text-[10px] font-semibold tabular-nums ${
                  calloutIsDrag
                    ? 'border-rose-500/70 text-rose-700 dark:text-rose-300'
                    : 'border-sky-500/70 text-sky-700 dark:text-sky-300'
                }`}
              >
                {calloutLine1}
                {calloutLine1 && calloutLine2 ? ' · ' : ''}
                {calloutLine2}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
