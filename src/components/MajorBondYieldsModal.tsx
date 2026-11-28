import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Language } from '../types/calendar';
import {
  MajorBondYieldItem,
  MajorBondYieldMonthSeries,
  fetchMajorBondYieldMonthlyList,
} from '../utils/financeService';
import { isChineseLocale, isRtlLanguage } from '../utils/i18n';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';

interface MajorBondYieldsModalProps {
  open: boolean;
  language: Language;
  onClose: () => void;
}

const PEER_BAR_COLOR = '#54A9E6';
const CN_BAR_COLOR = '#E38B4F';
const US_BAR_COLOR = '#3B6FD8';
const AVG_LINE_COLOR = '#DC4C4C';

export const MajorBondYieldsModal: React.FC<MajorBondYieldsModalProps> = ({
  open,
  language,
  onClose,
}) => {
  const isZh = isChineseLocale(language);
  const isTw = language === 'zh-TW';
  const isRtl = isRtlLanguage(language);

  const [monthlyList, setMonthlyList] = useState<MajorBondYieldMonthSeries[]>([]);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useSystemBackLayer(
    open,
    onClose,
    BACK_PRIORITY.INNER_OVERLAY + 10,
    'major-bond-yields-modal'
  );

  useEffect(() => {
    if (!open) return;
    let active = true;
    setIsLoading(true);
    fetchMajorBondYieldMonthlyList(false)
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
    ? '主要經濟體10年期國債收益率'
    : isZh
    ? '主要经济体10年期国债收益率'
    : 'Major Economies 10Y Sovereign Bond Yields';

  const getEconomyLabel = (item: MajorBondYieldItem) =>
    isTw ? item.nameTw : isZh ? item.nameZh : item.nameEn;

  const publishedItems = activeSeries.publishedItems;
  const unpublishedItems = activeSeries.unpublishedItems;

  const sourceText = isTw
    ? `數據來源：${activeSeries.sourceTw} · 統計期：${activeSeries.fullTimeLabel}`
    : isZh
    ? `数据来源：${activeSeries.sourceZh} · 统计期：${activeSeries.fullTimeLabel}`
    : `Source: ${activeSeries.sourceEn} · Period: ${activeSeries.timeLabel}`;

  const topItem = publishedItems.length > 0 ? publishedItems[0] : null;
  const bottomItem =
    publishedItems.length > 0 ? publishedItems[publishedItems.length - 1] : null;
  const cnItem = publishedItems.find((i) => i.id === 'cn') || null;
  const usItem = publishedItems.find((i) => i.id === 'us') || null;

  const spreadMaxMin =
    topItem && bottomItem ? (topItem.yieldPct - bottomItem.yieldPct).toFixed(2) : null;
  const cnUsSpreadBp =
    cnItem && usItem ? Math.round((cnItem.yieldPct - usItem.yieldPct) * 100) : null;

  const prevAvg = prevSeries?.publishedItems.length ? prevSeries.avgYieldPct : null;
  const avgDeltaBp =
    prevAvg !== null && publishedItems.length > 0
      ? Math.round((activeSeries.avgYieldPct - prevAvg) * 100)
      : null;

  const summaryLine = (() => {
    if (publishedItems.length === 0) {
      return isTw
        ? '單位：%；暫無已公布經濟體收益率數據'
        : isZh
        ? '单位：%；暂无已公布经济体收益率数据'
        : 'Unit: %; no published yield readings';
    }
    if (topItem && bottomItem && topItem.id !== bottomItem.id && spreadMaxMin) {
      if (isTw) {
        return `單位：%；當月均值${activeSeries.avgYieldPct.toFixed(2)}%，最高${getEconomyLabel(topItem)}（${topItem.yieldPct.toFixed(2)}%）高於最低${getEconomyLabel(bottomItem)}（${bottomItem.yieldPct.toFixed(2)}%）${spreadMaxMin}個百分點`;
      }
      if (isZh) {
        return `单位：%；当月均值${activeSeries.avgYieldPct.toFixed(2)}%，最高${getEconomyLabel(topItem)}（${topItem.yieldPct.toFixed(2)}%）高于最低${getEconomyLabel(bottomItem)}（${bottomItem.yieldPct.toFixed(2)}%）${spreadMaxMin}个百分点`;
      }
      return `Unit: %; Avg ${activeSeries.avgYieldPct.toFixed(2)}%, Spread ${topItem.nameEn} (${topItem.yieldPct.toFixed(2)}%) vs ${bottomItem.nameEn} (${bottomItem.yieldPct.toFixed(2)}%): ${spreadMaxMin}pt`;
    }
    return `Unit: %; Avg ${activeSeries.avgYieldPct.toFixed(2)}%`;
  })();

  const unpublishedNames = unpublishedItems.map(getEconomyLabel);
  const statusLine = (() => {
    if (unpublishedItems.length === 0) {
      return isTw
        ? `全部${activeSeries.items.length}個主要經濟體已公布；按當月收益率由高到低排序`
        : isZh
        ? `全部${activeSeries.items.length}个主要经济体已公布；按当月收益率由高到低排序`
        : `All ${activeSeries.items.length} major economies published, sorted high to low`;
    }
    const joined = unpublishedNames.join('、');
    return isTw
      ? `${joined}未公布，已自動從對比圖中排除`
      : isZh
      ? `${joined}未公布，已自动从对比图中排除`
      : `Unpublished (excluded): ${unpublishedNames.join(', ')}`;
  })();

  // Dynamic callout lines computed from currently plotted items
  const calloutLine1 = (() => {
    if (cnUsSpreadBp !== null) {
      const sign = cnUsSpreadBp > 0 ? '+' : '';
      return isTw
        ? `中美10年利差：${sign}${cnUsSpreadBp}bp`
        : isZh
        ? `中美10年利差：${sign}${cnUsSpreadBp}bp`
        : `CN–US 10Y Spread: ${sign}${cnUsSpreadBp}bp`;
    }
    if (spreadMaxMin) {
      return isTw
        ? `極差：${spreadMaxMin}個百分點`
        : isZh
        ? `极差：${spreadMaxMin}个百分点`
        : `Range Spread: ${spreadMaxMin}pt`;
    }
    return '';
  })();

  const calloutLine2 = (() => {
    const momText =
      avgDeltaBp !== null
        ? ` (${avgDeltaBp > 0 ? '+' : ''}${avgDeltaBp}bp)`
        : '';
    return isTw
      ? `均值${activeSeries.avgYieldPct.toFixed(2)}%${momText}`
      : isZh
      ? `均值${activeSeries.avgYieldPct.toFixed(2)}%${momText}`
      : `Avg ${activeSeries.avgYieldPct.toFixed(2)}%${momText}`;
  })();

  // Support both positive and negative (2016/2019 JGB/Bund) yields cleanly
  const rawMin = Math.min(0, ...publishedItems.map((i) => i.yieldPct));
  const rawMax = Math.max(2, activeSeries.avgYieldPct, ...publishedItems.map((i) => i.yieldPct));
  const xMin = rawMin < 0 ? Math.floor((rawMin - 0.3) * 2) / 2 : 0;
  const xMax = Math.ceil((rawMax + 0.5) * 2) / 2;
  const xSpan = Math.max(xMax - xMin, 1);

  const tickStep = xSpan > 4.5 ? 1 : 0.5;
  const xTicks: number[] = [];
  const startTick = Math.ceil(xMin / tickStep) * tickStep;
  for (let v = startTick; v <= xMax + 1e-6; v += tickStep) {
    xTicks.push(Math.abs(v) < 1e-4 ? 0 : Number(v.toFixed(1)));
  }
  if (!xTicks.some((t) => t === 0)) {
    xTicks.push(0);
    xTicks.sort((a, b) => a - b);
  }

  const rowCount = Math.max(1, publishedItems.length);
  const VB_W = 620;
  const PAD_L = isZh ? 96 : 124;
  const PAD_R = 30;
  const PAD_T = 10;
  const PAD_B = 28;
  const ROW_STEP = rowCount <= 7 ? 36 : rowCount <= 9 ? 31 : 28;
  const BAR_H = Math.min(20, ROW_STEP * 0.65);
  const PLOT_W = VB_W - PAD_L - PAD_R;
  const PLOT_H = rowCount * ROW_STEP;
  const VB_H = PAD_T + PLOT_H + PAD_B;

  const mapX = (val: number) => PAD_L + ((val - xMin) / xSpan) * PLOT_W;
  const zeroX = mapX(0);
  const avgX = mapX(activeSeries.avgYieldPct);

  const activeItem =
    hoveredId !== null ? publishedItems.find((i) => i.id === hoveredId) : null;

  // Dynamic callout placement in lower-right open area if clear of bars
  const maxCalloutLen = Math.max(calloutLine1.length, calloutLine2.length);
  const calloutBoxW = isZh
    ? Math.max(138, Math.round(maxCalloutLen * 9.5 + 22))
    : Math.max(155, Math.round(maxCalloutLen * 6.0 + 22));
  const calloutBoxH = 38;
  const calloutBoxX = VB_W - PAD_R - calloutBoxW - 6;
  const lowerIdx = Math.max(0, Math.floor(rowCount * 0.65));
  const calloutBoxY = PAD_T + lowerIdx * ROW_STEP + (ROW_STEP - calloutBoxH) / 2;
  const calloutOverlapsBars =
    publishedItems.length === 0 ||
    publishedItems
      .slice(Math.max(0, lowerIdx - 1), Math.min(rowCount, lowerIdx + 2))
      .some((item) => {
        const endX = item.yieldPct >= 0 ? mapX(item.yieldPct) + 52 : zeroX + 20;
        return endX > calloutBoxX;
      });

  const handleSelectYear = (year: number) => {
    const inYear = monthlyList.filter((m) => m.year === year);
    if (inYear.length === 0) return;
    const sameMonth = activeSeries
      ? inYear.find((m) => m.monthNumber === activeSeries.monthNumber)
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
        {/* Header Title + Divider */}
        <div className="shrink-0 flex items-center justify-between gap-2 pb-1.5 border-b border-neutral-900/75 dark:border-neutral-200/25 [.amoled-mode_&]:border-white/25">
          <div className="min-w-0 flex-1 flex items-baseline gap-2.5 flex-wrap">
            <h2 className="text-sm sm:text-lg [@media(max-height:560px)]:text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight truncate">
              {title}
            </h2>
            {activeItem && (
              <span className="text-[11px] font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                {getEconomyLabel(activeItem)}：{activeItem.yieldPct.toFixed(2)}%
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
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-neutral-100/80 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-700/70 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70'
                  }`}
                >
                  {isZh ? `${m.monthNumber}月` : `M${m.monthNumber}`}
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
          <p
            className={
              unpublishedItems.length > 0
                ? 'text-amber-700 dark:text-amber-400 font-medium'
                : 'text-neutral-500 dark:text-neutral-400'
            }
          >
            {statusLine}
          </p>
        </div>

        {/* Horizontal Bar Chart Panel */}
        <div className="flex-1 min-h-0 rounded-2xl bg-neutral-50/90 dark:bg-neutral-800/70 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/12 p-2 sm:p-3 [@media(max-height:560px)]:p-1.5 flex flex-col justify-between gap-1 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-[1px]">
              <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
            </div>
          )}

          <div className="econ-chart-cq flex-1 min-h-0 flex items-center justify-center">
            {publishedItems.length === 0 ? (
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 text-center px-4">
                {isTw
                  ? '當月主要經濟體收益率暫未公布'
                  : isZh
                  ? '当月主要经济体收益率暂未公布'
                  : 'No published 10Y bond yields for this period.'}
              </p>
            ) : (
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="econ-svg-responsive econ-svg-tall overflow-visible touch-none"
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Vertical Gridlines & X-Axis Labels */}
                {xTicks.map((tick) => {
                  const tx = mapX(tick);
                  const isZero = tick === 0;
                  return (
                    <g key={tick}>
                      <line
                        x1={tx}
                        x2={tx}
                        y1={PAD_T}
                        y2={PAD_T + PLOT_H}
                        stroke="currentColor"
                        className={
                          isZero
                            ? 'text-neutral-700 dark:text-neutral-300'
                            : 'text-neutral-300/85 dark:text-neutral-700/75'
                        }
                        strokeWidth={isZero ? '1.15' : '0.85'}
                        strokeDasharray={isZero ? undefined : '2.5 3'}
                      />
                      <text
                        x={tx}
                        y={PAD_T + PLOT_H + 18}
                        textAnchor="middle"
                        className="fill-neutral-700 dark:fill-neutral-300 text-[10.5px] font-mono tabular-nums"
                      >
                        {tick.toFixed(tickStep < 1 ? 1 : 0)}%
                      </text>
                    </g>
                  );
                })}

                {/* Economy Bars */}
                {publishedItems.map((item, idx) => {
                  const val = item.yieldPct;
                  const rowCy = PAD_T + (idx + 0.5) * ROW_STEP;
                  const barY = rowCy - BAR_H / 2;
                  const isPos = val >= 0;
                  const xEnd = mapX(val);
                  const barX = isPos ? zeroX : xEnd;
                  const barW = Math.max(3, Math.abs(xEnd - zeroX));
                  const isHovered = hoveredId === item.id;

                  const fill =
                    item.id === 'cn'
                      ? CN_BAR_COLOR
                      : item.id === 'us'
                      ? US_BAR_COLOR
                      : PEER_BAR_COLOR;

                  const valTextClass =
                    item.id === 'cn'
                      ? 'fill-amber-700 dark:fill-amber-300'
                      : item.id === 'us'
                      ? 'fill-blue-700 dark:fill-blue-300'
                      : 'fill-sky-600 dark:fill-sky-400';

                  return (
                    <g
                      key={item.id}
                      onMouseEnter={() => setHoveredId(item.id)}
                      onTouchStart={() => setHoveredId(item.id)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={0}
                        y={PAD_T + idx * ROW_STEP}
                        width={VB_W}
                        height={ROW_STEP}
                        fill="transparent"
                      />
                      <text
                        x={PAD_L - 10}
                        y={rowCy + 3.8}
                        textAnchor="end"
                        className={`text-[11px] ${
                          isHovered || item.id === 'cn' || item.id === 'us'
                            ? 'fill-neutral-950 dark:fill-white font-bold'
                            : 'fill-neutral-800 dark:fill-neutral-200 font-medium'
                        }`}
                      >
                        {getEconomyLabel(item)}
                      </text>
                      <rect
                        x={barX}
                        y={barY}
                        width={barW}
                        height={BAR_H}
                        rx="1.5"
                        fill={fill}
                        fillOpacity={hoveredId !== null && !isHovered ? 0.65 : 0.95}
                        className="transition-opacity duration-150"
                      />
                      <text
                        x={isPos ? barX + barW + 7 : barX - 6}
                        y={rowCy + 3.8}
                        textAnchor={isPos ? 'start' : 'end'}
                        className={`text-[10.8px] font-mono tabular-nums font-semibold ${valTextClass}`}
                      >
                        {val.toFixed(2)}%
                      </text>
                    </g>
                  );
                })}

                {/* Mean Reference Dashed Vertical Line */}
                <line
                  x1={avgX}
                  x2={avgX}
                  y1={PAD_T - 4}
                  y2={PAD_T + PLOT_H + 2}
                  stroke={AVG_LINE_COLOR}
                  strokeWidth="1.5"
                  strokeDasharray="4.5 3.5"
                />

                {/* Dynamic CN-US Spread & Mean Callout Box */}
                {calloutLine1 && !calloutOverlapsBars && (
                  <g>
                    <rect
                      x={calloutBoxX}
                      y={calloutBoxY}
                      width={calloutBoxW}
                      height={calloutBoxH}
                      rx="4"
                      fill="none"
                      stroke="#DC4C4C"
                      strokeWidth="1.15"
                    />
                    <text
                      x={calloutBoxX + calloutBoxW / 2}
                      y={calloutBoxY + 15}
                      textAnchor="middle"
                      className="fill-rose-700 dark:fill-rose-300 text-[10px] font-semibold tabular-nums"
                    >
                      {calloutLine1}
                    </text>
                    <text
                      x={calloutBoxX + calloutBoxW / 2}
                      y={calloutBoxY + 30}
                      textAnchor="middle"
                      className="fill-rose-700 dark:fill-rose-300 text-[10px] font-semibold tabular-nums"
                    >
                      {calloutLine2}
                    </text>
                  </g>
                )}
              </svg>
            )}
          </div>

          {/* Bottom Legend Strip */}
          <div className="shrink-0 pt-1 border-t border-neutral-200/70 dark:border-neutral-700/60 [.amoled-mode_&]:border-white/10 flex flex-wrap items-center justify-between gap-2">
            {calloutLine1 && calloutOverlapsBars ? (
              <span className="px-2 py-0.5 rounded border border-rose-500/60 text-[10px] font-semibold text-rose-700 dark:text-rose-300 tabular-nums">
                {calloutLine1} · {calloutLine2}
              </span>
            ) : (
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                {isZh ? '悬停/点击柱条查看收益率' : 'Tap bar to inspect yield'}
              </span>
            )}

            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-neutral-700 dark:text-neutral-200">
              <span className="inline-flex items-center gap-1">
                <span
                  className="w-3 h-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: CN_BAR_COLOR }}
                />
                <span>{isTw ? '中國' : isZh ? '中国' : 'China'}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="w-3 h-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: US_BAR_COLOR }}
                />
                <span>{isTw ? '美國' : isZh ? '美国' : 'US'}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="w-3 h-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: PEER_BAR_COLOR }}
                />
                <span>{isTw ? '其他經濟體' : isZh ? '其他经济体' : 'Peers'}</span>
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <span
                  className="w-3.5 h-0 border-t-2 border-dashed shrink-0"
                  style={{ borderColor: AVG_LINE_COLOR }}
                />
                <span>
                  {isTw
                    ? `均值（${activeSeries.avgYieldPct.toFixed(2)}%）`
                    : isZh
                    ? `均值（${activeSeries.avgYieldPct.toFixed(2)}%）`
                    : `Avg (${activeSeries.avgYieldPct.toFixed(2)}%)`}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
