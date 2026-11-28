import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Language } from '../types/calendar';
import {
  ConsumptionExpenditureItem,
  getConsumptionExpenditureMonthlyList,
} from '../utils/financeService';
import { isChineseLocale, isRtlLanguage } from '../utils/i18n';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';

interface ConsumptionExpenditureModalProps {
  open: boolean;
  language: Language;
  onClose: () => void;
}

const DEV_BAR_COLOR = '#54A9E6';
const ESS_BAR_COLOR = '#E3A272';
const REF_LINE_COLOR = '#DC4C4C';

const COMPARISON_ELIGIBLE_IDS = new Set([
  'healthcare',
  'household_goods',
  'housing',
  'clothing',
  'food_tobacco',
  'transport_comm',
  'edu_culture',
]);

export const ConsumptionExpenditureModal: React.FC<ConsumptionExpenditureModalProps> = ({
  open,
  language,
  onClose,
}) => {
  const isZh = isChineseLocale(language);
  const isTw = language === 'zh-TW';
  const isRtl = isRtlLanguage(language);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useSystemBackLayer(
    open,
    onClose,
    BACK_PRIORITY.INNER_OVERLAY + 10,
    'consumption-expenditure-modal'
  );

  const monthlyList = useMemo(() => {
    if (!open) return [];
    return getConsumptionExpenditureMonthlyList();
  }, [open]);

  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>('');

  useEffect(() => {
    if (open && monthlyList.length > 0) {
      setSelectedPeriodKey(monthlyList[monthlyList.length - 1].periodKey);
      setHoveredId(null);
    }
  }, [open, monthlyList]);

  const activeSnapshot = useMemo(() => {
    if (monthlyList.length === 0) return null;
    return (
      monthlyList.find((m) => m.periodKey === selectedPeriodKey) ||
      monthlyList[monthlyList.length - 1]
    );
  }, [monthlyList, selectedPeriodKey]);

  const years = useMemo(() => {
    const set = new Set<number>();
    monthlyList.forEach((m) => set.add(m.year));
    return Array.from(set).sort((a, b) => a - b);
  }, [monthlyList]);

  const monthsInYear = useMemo(() => {
    if (!activeSnapshot) return [];
    return monthlyList.filter((m) => m.year === activeSnapshot.year);
  }, [monthlyList, activeSnapshot]);

  const handleSelectYear = (year: number) => {
    const inYear = monthlyList.filter((m) => m.year === year);
    if (inYear.length === 0) return;
    const sameMonth = activeSnapshot
      ? inYear.find((m) => m.monthLabelZh === activeSnapshot.monthLabelZh)
      : undefined;
    setSelectedPeriodKey((sameMonth || inYear[inYear.length - 1]).periodKey);
    setHoveredId(null);
  };

  if (!open || !activeSnapshot) return null;

  const series = activeSnapshot.series;

  const title = isTw
    ? '居民人均消費支出分項名義增速對比'
    : isZh
    ? '居民人均消费支出分项名义增速对比'
    : 'Per Capita Consumption Expenditure Nominal YoY';

  const sourceText = isTw
    ? `數據來源：${series.sourceTw} · 統計期：${activeSnapshot.fullTimeLabel}`
    : isZh
    ? `数据来源：${series.sourceZh} · 统计期：${activeSnapshot.fullTimeLabel}`
    : `Source: ${series.sourceEn} · Period: ${activeSnapshot.timeLabel}`;

  const getItemLabel = (item: ConsumptionExpenditureItem) =>
    isTw ? item.nameTw : isZh ? item.nameZh : item.nameEn;

  const publishedItems = series.publishedItems;
  const unpublishedItems = series.unpublishedItems;

  const devRates = publishedItems
    .filter((i) => i.group === 'developmental')
    .map((i) => i.nominalYoY);
  const essRates = publishedItems
    .filter((i) => i.group === 'essential')
    .map((i) => i.nominalYoY);

  const formatRange = (vals: number[]) => {
    if (vals.length === 0) return '--';
    const lo = Math.floor(Math.min(...vals));
    const hi = Math.round(Math.max(...vals));
    return lo === hi ? `${hi}%` : `${lo}%–${hi}%`;
  };

  const devRange = formatRange(devRates);
  const essRange = formatRange(essRates);

  const unitSummaryLine = (() => {
    if (devRates.length > 0 && essRates.length > 0) {
      return isTw
        ? `單位：%；發展型消費增速${devRange}，基礎性消費僅${essRange}`
        : isZh
        ? `单位：%；发展型消费增速${devRange}，基础性消费仅${essRange}`
        : `Unit: %; Developmental ${devRange}, Essential ${essRange}`;
    }
    if (devRates.length > 0) {
      return isTw
        ? `單位：%；發展型消費增速${devRange}`
        : isZh
        ? `单位：%；发展型消费增速${devRange}`
        : `Unit: %; Developmental ${devRange}`;
    }
    if (essRates.length > 0) {
      return isTw
        ? `單位：%；基礎性消費增速${essRange}`
        : isZh
        ? `单位：%；基础性消费增速${essRange}`
        : `Unit: %; Essential ${essRange}`;
    }
    return isTw
      ? '單位：%；暫無已公布分項數據'
      : isZh
      ? '单位：%；暂无已公布分项数据'
      : 'Unit: %; No published category data yet';
  })();

  const unpublishedNames = unpublishedItems.map(getItemLabel);
  const unpublishedNoticeLine = (() => {
    if (unpublishedItems.length === 0) {
      return isTw
        ? '全部8項已公布；人均消費支出增速為名義口徑'
        : isZh
        ? '全部8项已公布；人均消费支出增速为名义口径'
        : 'All 8 categories published; nominal growth basis';
    }
    if (isTw) {
      const joined = unpublishedNames.join('、');
      const countSuffix =
        unpublishedNames.length === 2
          ? '兩項'
          : unpublishedNames.length > 2
          ? `共${unpublishedNames.length}項`
          : '';
      return `${joined}${countSuffix}未公布；人均消費支出增速為名義口徑`;
    }
    if (isZh) {
      const joined = unpublishedNames.join('、');
      const countSuffix =
        unpublishedNames.length === 2
          ? '两项'
          : unpublishedNames.length > 2
          ? `共${unpublishedNames.length}项`
          : '';
      return `${joined}${countSuffix}未公布；人均消费支出增速为名义口径`;
    }
    return `Unpublished: ${unpublishedNames.join(', ')}; nominal growth basis`;
  })();

  // Compare highest vs lowest published rate across the 7 eligible categories
  const comparisonPool = publishedItems.filter((item) =>
    COMPARISON_ELIGIBLE_IDS.has(item.id)
  );
  const maxCompareItem = comparisonPool.length >= 2 ? comparisonPool[0] : null;
  const minCompareItem =
    comparisonPool.length >= 2 ? comparisonPool[comparisonPool.length - 1] : null;
  const ratioVal =
    maxCompareItem &&
    minCompareItem &&
    maxCompareItem.id !== minCompareItem.id &&
    minCompareItem.nominalYoY > 0 &&
    maxCompareItem.nominalYoY > 0
      ? (maxCompareItem.nominalYoY / minCompareItem.nominalYoY).toFixed(1)
      : null;

  const calloutLine1 =
    ratioVal && maxCompareItem
      ? isTw || isZh
        ? `${getItemLabel(maxCompareItem)}增速`
        : `${getItemLabel(maxCompareItem)} Growth`
      : '';
  const calloutLine2 =
    ratioVal && minCompareItem
      ? isTw || isZh
        ? `是${getItemLabel(minCompareItem)}的${ratioVal}倍`
        : `${ratioVal}x ${getItemLabel(minCompareItem)}`
      : '';

  const maxDataRate = Math.max(
    12,
    series.overallNominalYoY,
    ...publishedItems.map((i) => i.nominalYoY)
  );
  const xMax = Math.max(12, Math.ceil(maxDataRate / 2) * 2);
  const xTicks: number[] = [];
  for (let t = 0; t <= xMax; t += 2) {
    xTicks.push(t);
  }

  const rowCount = Math.max(1, publishedItems.length);
  const VB_W = 620;
  const PAD_L = isZh ? 128 : 158;
  const PAD_R = 26;
  const PAD_T = 12;
  const PAD_B = 30;
  const ROW_STEP = rowCount <= 6 ? 44 : rowCount === 7 ? 38 : 34;
  const BAR_H = Math.min(26, ROW_STEP * 0.62);
  const PLOT_W = VB_W - PAD_L - PAD_R;
  const PLOT_H = rowCount * ROW_STEP;
  const VB_H = PAD_T + PLOT_H + PAD_B;

  const mapX = (pct: number) => PAD_L + (Math.max(0, pct) / xMax) * PLOT_W;
  const refX = mapX(series.overallNominalYoY);

  const activeItem =
    hoveredId !== null ? publishedItems.find((i) => i.id === hoveredId) : null;

  const legendDev = isTw
    ? '發展型改善型消費'
    : isZh
    ? '发展型改善型消费'
    : 'Developmental & Upgrading';
  const legendEss = isTw ? '基礎性消費' : isZh ? '基础性消费' : 'Essential Consumption';
  const legendOverall = isTw
    ? `人均消費支出增速（${series.overallNominalYoY.toFixed(1)}%）`
    : isZh
    ? `人均消费支出增速（${series.overallNominalYoY.toFixed(1)}%）`
    : `Avg Consumption Growth (${series.overallNominalYoY.toFixed(1)}%)`;

  // Compute non-overlapping placement for ratio callout box on the lower-right side
  const calloutMaxTextLen = Math.max(calloutLine1.length, calloutLine2.length);
  const calloutBoxW = isZh
    ? Math.max(128, Math.round(calloutMaxTextLen * 11.2 + 22))
    : Math.max(146, Math.round(calloutMaxTextLen * 6.4 + 22));
  const calloutBoxH = 40;
  const calloutBoxX = VB_W - PAD_R - calloutBoxW - 6;
  const lowerHalfIndex = Math.max(0, Math.floor(rowCount * 0.56));
  const calloutBoxY = PAD_T + lowerHalfIndex * ROW_STEP + (ROW_STEP - calloutBoxH) / 2;
  const calloutOverlapsBars = publishedItems
    .slice(Math.max(0, lowerHalfIndex - 1), Math.min(rowCount, lowerHalfIndex + 2))
    .some((item) => mapX(item.nominalYoY) + 46 > calloutBoxX);

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
        {/* Header Title + Divider */}
        <div className="shrink-0 flex items-center justify-between gap-2 pb-1.5 border-b border-neutral-900/75 dark:border-neutral-200/25 [.amoled-mode_&]:border-white/25">
          <div className="min-w-0 flex-1 flex items-baseline gap-2.5 flex-wrap">
            <h2 className="text-sm sm:text-lg [@media(max-height:560px)]:text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight truncate">
              {title}
            </h2>
            {activeItem && (
              <span className="text-[11px] font-mono tabular-nums font-bold text-sky-600 dark:text-sky-400">
                {getItemLabel(activeItem)}：{activeItem.nominalYoY.toFixed(1)}%
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
              const isSelected = yr === activeSnapshot.year;
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
              const isSelected = m.periodKey === activeSnapshot.periodKey;
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
        <div className="shrink-0 space-y-0.5 text-[10.5px] sm:text-xs [@media(max-height:560px)]:text-[10px] leading-snug">
          <p className="font-medium text-neutral-700 dark:text-neutral-200 tabular-nums">
            {sourceText}
          </p>
          <p className="text-neutral-600 dark:text-neutral-300 tabular-nums">
            {unitSummaryLine}
          </p>
          <p className="text-neutral-500 dark:text-neutral-400">{unpublishedNoticeLine}</p>
        </div>

        {/* Chart Panel */}
        <div className="flex-1 min-h-0 rounded-2xl bg-neutral-50/90 dark:bg-neutral-800/70 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/12 p-2 sm:p-3 [@media(max-height:560px)]:p-2 flex flex-col justify-between gap-1 overflow-hidden">
          <div className="econ-chart-cq flex-1 min-h-0 flex items-center justify-center">
            {publishedItems.length === 0 ? (
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 text-center px-4">
                {isTw
                  ? '各項人均消費支出數據暫未公布，公布後將自動繪製對比圖'
                  : isZh
                  ? '各项人均消费支出数据暂未公布，公布后将自动绘制对比图'
                  : 'No published category readings yet; bars will appear once released.'}
              </p>
            ) : (
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="econ-svg-responsive econ-svg-tall overflow-visible touch-none"
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Vertical Dotted X-Axis Gridlines & X-Axis Labels */}
                {xTicks.map((tick) => {
                  const tx = mapX(tick);
                  return (
                    <g key={tick}>
                      <line
                        x1={tx}
                        x2={tx}
                        y1={PAD_T}
                        y2={PAD_T + PLOT_H}
                        stroke="currentColor"
                        className="text-neutral-300/85 dark:text-neutral-700/75"
                        strokeWidth="0.9"
                        strokeDasharray="2.5 3"
                      />
                      <text
                        x={tx}
                        y={PAD_T + PLOT_H + 19}
                        textAnchor="middle"
                        className="fill-neutral-700 dark:fill-neutral-300 text-[11px] font-mono tabular-nums"
                      >
                        {tick}%
                      </text>
                    </g>
                  );
                })}

                {/* Published Horizontal Bars */}
                {publishedItems.map((item, idx) => {
                  const val = item.nominalYoY;
                  const rowCy = PAD_T + (idx + 0.5) * ROW_STEP;
                  const barY = rowCy - BAR_H / 2;
                  const barW = Math.max(4, mapX(val) - PAD_L);
                  const isDev = item.group === 'developmental';
                  const fill = isDev ? DEV_BAR_COLOR : ESS_BAR_COLOR;
                  const isHovered = hoveredId === item.id;

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
                        y={rowCy + 4}
                        textAnchor="end"
                        className={`text-[11.5px] ${
                          isHovered
                            ? 'fill-neutral-950 dark:fill-white font-bold'
                            : 'fill-neutral-800 dark:fill-neutral-200 font-medium'
                        }`}
                      >
                        {getItemLabel(item)}
                      </text>
                      <rect
                        x={PAD_L}
                        y={barY}
                        width={barW}
                        height={BAR_H}
                        rx="1.5"
                        fill={fill}
                        fillOpacity={hoveredId !== null && !isHovered ? 0.65 : 0.95}
                        className="transition-opacity duration-150"
                      />
                      <text
                        x={PAD_L + barW + 8}
                        y={rowCy + 4}
                        textAnchor="start"
                        className={`text-[11.5px] font-mono tabular-nums font-semibold ${
                          isDev
                            ? 'fill-sky-600 dark:fill-sky-400'
                            : 'fill-amber-700 dark:fill-amber-300'
                        }`}
                      >
                        {val.toFixed(1)}%
                      </text>
                    </g>
                  );
                })}

                {/* Overall Average Reference Vertical Dashed Line */}
                <line
                  x1={refX}
                  x2={refX}
                  y1={PAD_T - 4}
                  y2={PAD_T + PLOT_H + 2}
                  stroke={REF_LINE_COLOR}
                  strokeWidth="1.6"
                  strokeDasharray="4.5 3.5"
                />

                {/* Dynamic Highest vs Lowest Ratio Callout Box */}
                {ratioVal && !calloutOverlapsBars && (
                  <g>
                    <rect
                      x={calloutBoxX}
                      y={calloutBoxY}
                      width={calloutBoxW}
                      height={calloutBoxH}
                      rx="4"
                      fill="none"
                      stroke="#3B9AD9"
                      strokeWidth="1.2"
                    />
                    <text
                      x={calloutBoxX + calloutBoxW / 2}
                      y={calloutBoxY + 16}
                      textAnchor="middle"
                      className="fill-sky-600 dark:fill-sky-400 text-[10.5px] font-semibold"
                    >
                      {calloutLine1}
                    </text>
                    <text
                      x={calloutBoxX + calloutBoxW / 2}
                      y={calloutBoxY + 31}
                      textAnchor="middle"
                      className="fill-sky-600 dark:fill-sky-400 text-[10.5px] font-semibold tabular-nums"
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
            {ratioVal && publishedItems.length > 0 && calloutOverlapsBars ? (
              <span className="px-2 py-0.5 rounded border border-sky-500/70 text-[10px] font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                {isTw || isZh ? `${calloutLine1}${calloutLine2}` : `${calloutLine1}: ${calloutLine2}`}
              </span>
            ) : (
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                {isZh ? '悬停/点击柱条查看详情' : 'Tap bar to inspect'}
              </span>
            )}

            <div className="flex flex-wrap items-center justify-end gap-x-3.5 gap-y-1 text-[10.5px] sm:text-[11px] text-neutral-700 dark:text-neutral-200">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3.5 h-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: DEV_BAR_COLOR }}
                />
                <span>{legendDev}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3.5 h-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: ESS_BAR_COLOR }}
                />
                <span>{legendEss}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <span
                  className="w-4 h-0 border-t-2 border-dashed shrink-0"
                  style={{ borderColor: REF_LINE_COLOR }}
                />
                <span>{legendOverall}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
