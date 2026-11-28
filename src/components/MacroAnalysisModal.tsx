import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, RefreshCw, ArrowUp, ArrowDown, ArrowUpRight, Info } from 'lucide-react';
import { Language } from '../types/calendar';
import {
  MacroIndicator,
  HouseholdLoanSubIndicator,
  MacroChartSeries,
  MacroTimeframeKey,
  fetchMacroChartSeries,
  getMarketTrendTheme,
} from '../utils/financeService';
import { getExtraLabels, isChineseLocale, isRtlLanguage } from '../utils/i18n';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';
import type { MacroComparisonMode } from './MacroComparisonModal';
import { HouseholdMonthlyChangeModal } from './HouseholdMonthlyChangeModal';
import { ConsumptionExpenditureModal } from './ConsumptionExpenditureModal';
import { RetailContributionModal } from './RetailContributionModal';
import { MajorBondYieldsModal } from './MajorBondYieldsModal';

interface MacroAnalysisModalProps {
  indicator: MacroIndicator | null;
  language: Language;
  onClose: () => void;
  onRefreshMacro?: () => void;
  onOpenComparison?: (mode: MacroComparisonMode) => void;
  isNested?: boolean;
}

const MACRO_TIMEFRAMES: MacroTimeframeKey[] = ['6M', '1Y', '2Y', '5Y', 'MAX'];

interface MacroCopy {
  latestReading: string;
  momChange: string;
  yoyChange: string;
  periodHigh: string;
  periodLow: string;
  periodAvg: string;
  publishDateLabel: string;
  publishPeriod: string;
  sourceLabel: string;
  periodStartRef: string;
  unitPctPts: string;
  tfLabels: Record<MacroTimeframeKey, string>;
  periodContext: Record<MacroTimeframeKey, string>;
}

function getMacroCopy(language: Language, uiAllTime: string): MacroCopy {
  const isZh = isChineseLocale(language);
  if (language === 'zh-TW') {
    return {
      latestReading: '最新讀數',
      momChange: '環比變動',
      yoyChange: '同比變動',
      periodHigh: '區間最高',
      periodLow: '區間最低',
      periodAvg: '區間均值',
      publishDateLabel: '公布日期',
      publishPeriod: '統計週期',
      sourceLabel: '數據來源',
      periodStartRef: '期初基準',
      unitPctPts: '百分點',
      tfLabels: { '6M': '6個月', '1Y': '1年', '2Y': '2年', '5Y': '5年', MAX: '全部' },
      periodContext: { '6M': '近6個月', '1Y': '近1年', '2Y': '近2年', '5Y': '近5年', MAX: uiAllTime },
    };
  }
  if (isZh) {
    return {
      latestReading: '最新读数',
      momChange: '环比变化',
      yoyChange: '同比变化',
      periodHigh: '区间最高',
      periodLow: '区间最低',
      periodAvg: '区间均值',
      publishDateLabel: '公布日期',
      publishPeriod: '统计周期',
      sourceLabel: '发布机构',
      periodStartRef: '期初基准',
      unitPctPts: '百分点',
      tfLabels: { '6M': '6个月', '1Y': '1年', '2Y': '2年', '5Y': '5年', MAX: '全部' },
      periodContext: { '6M': '近6个月', '1Y': '近1年', '2Y': '近2年', '5Y': '近5年', MAX: uiAllTime },
    };
  }
  if (language === 'ja') {
    return {
      latestReading: '最新値',
      momChange: '前月比',
      yoyChange: '前年比',
      periodHigh: '期間高値',
      periodLow: '期間安値',
      periodAvg: '期間平均',
      publishDateLabel: '公表日',
      publishPeriod: '統計月',
      sourceLabel: '公表元',
      periodStartRef: '期初基準',
      unitPctPts: 'pt',
      tfLabels: { '6M': '6ヶ月', '1Y': '1年', '2Y': '2年', '5Y': '5年', MAX: 'すべて' },
      periodContext: { '6M': '過去6ヶ月', '1Y': '過去1年', '2Y': '過去2年', '5Y': '過去5年', MAX: uiAllTime },
    };
  }
  if (language === 'ko') {
    return {
      latestReading: '최신 수치',
      momChange: '전월 대비',
      yoyChange: '전년 대비',
      periodHigh: '기간 최고',
      periodLow: '기간 최저',
      periodAvg: '기간 평균',
      publishDateLabel: '발표일',
      publishPeriod: '통계 기간',
      sourceLabel: '발표 기관',
      periodStartRef: '기초 기준',
      unitPctPts: 'pt',
      tfLabels: { '6M': '6개월', '1Y': '1년', '2Y': '2년', '5Y': '5년', MAX: '전체' },
      periodContext: { '6M': '최근 6개월', '1Y': '최근 1년', '2Y': '최근 2년', '5Y': '최근 5년', MAX: uiAllTime },
    };
  }
  if (language === 'fr') {
    return {
      latestReading: 'Dernière valeur',
      momChange: 'Var. mensuelle',
      yoyChange: 'Var. annuelle',
      periodHigh: 'Plus haut',
      periodLow: 'Plus bas',
      periodAvg: 'Moyenne',
      publishDateLabel: 'Date de pub.',
      publishPeriod: 'Période',
      sourceLabel: 'Source',
      periodStartRef: 'Début',
      unitPctPts: 'pts',
      tfLabels: { '6M': '6M', '1Y': '1A', '2Y': '2A', '5Y': '5A', MAX: 'MAX' },
      periodContext: { '6M': '6 derniers mois', '1Y': '1 an', '2Y': '2 ans', '5Y': '5 ans', MAX: uiAllTime },
    };
  }
  if (language === 'ru') {
    return {
      latestReading: 'Последнее знач.',
      momChange: 'М/м изм.',
      yoyChange: 'Г/г изм.',
      periodHigh: 'Макс. периода',
      periodLow: 'Мин. периода',
      periodAvg: 'Среднее',
      publishDateLabel: 'Дата публ.',
      publishPeriod: 'Период',
      sourceLabel: 'Источник',
      periodStartRef: 'Начало',
      unitPctPts: 'п.п.',
      tfLabels: { '6M': '6М', '1Y': '1Г', '2Y': '2Г', '5Y': '5Л', MAX: 'ВСЁ' },
      periodContext: { '6M': 'За 6 мес.', '1Y': 'За 1 год', '2Y': 'За 2 года', '5Y': 'За 5 лет', MAX: uiAllTime },
    };
  }
  if (language === 'fa') {
    return {
      latestReading: 'آخرین مقدار',
      momChange: 'تغییر ماهانه',
      yoyChange: 'تغییر سالانه',
      periodHigh: 'بیشینه دوره',
      periodLow: 'کمینه دوره',
      periodAvg: 'میانگین دوره',
      publishDateLabel: 'تاریخ انتشار',
      publishPeriod: 'دوره آماری',
      sourceLabel: 'منبع',
      periodStartRef: 'شروع دوره',
      unitPctPts: 'واحد',
      tfLabels: { '6M': '۶م', '1Y': '۱س', '2Y': '۲س', '5Y': '۵س', MAX: 'کل' },
      periodContext: { '6M': '۶ ماه اخیر', '1Y': '۱ سال اخیر', '2Y': '۲ سال اخیر', '5Y': '۵ سال اخیر', MAX: uiAllTime },
    };
  }
  if (language === 'mn') {
    return {
      latestReading: 'Сүүлийн утга',
      momChange: 'Сарын өөрчлөлт',
      yoyChange: 'Жилийн өөрчлөлт',
      periodHigh: 'Дээд утга',
      periodLow: 'Доод утга',
      periodAvg: 'Дундаж',
      publishDateLabel: 'Нийтэлсэн',
      publishPeriod: 'Хугацаа',
      sourceLabel: 'Эх сурвалж',
      periodStartRef: 'Эхлэл',
      unitPctPts: 'нэгж',
      tfLabels: { '6M': '6С', '1Y': '1Ж', '2Y': '2Ж', '5Y': '5Ж', MAX: 'БҮХ' },
      periodContext: { '6M': 'Сүүлийн 6 сар', '1Y': 'Сүүлийн 1 жил', '2Y': 'Сүүлийн 2 жил', '5Y': 'Сүүлийн 5 жил', MAX: uiAllTime },
    };
  }
  if (language === 'ug') {
    return {
      latestReading: 'ئەڭ يېڭى قىممەت',
      momChange: 'ئايلىق ئۆزگىرىش',
      yoyChange: 'يىللىق ئۆزگىرىش',
      periodHigh: 'ئەڭ يۇقىرى',
      periodLow: 'ئەڭ تۆۋەن',
      periodAvg: 'ئوتتۇرىچە',
      publishDateLabel: 'ئېلان ۋاقتى',
      publishPeriod: 'ئىستاتىستىكا دەۋرى',
      sourceLabel: 'مەنبە',
      periodStartRef: 'باشلىنىش',
      unitPctPts: 'پىرسەنت نۇقتىسى',
      tfLabels: { '6M': '6 ئاي', '1Y': '1 يىل', '2Y': '2 يىل', '5Y': '5 يىل', MAX: 'ھەممىسى' },
      periodContext: { '6M': 'يېقىنقى 6 ئاي', '1Y': 'يېقىنقى 1 يىل', '2Y': 'يېقىنقى 2 يىل', '5Y': 'يېقىنقى 5 يىل', MAX: uiAllTime },
    };
  }
  return {
    latestReading: 'Latest Reading',
    momChange: 'MoM Change',
    yoyChange: 'YoY Change',
    periodHigh: 'Period High',
    periodLow: 'Period Low',
    periodAvg: 'Period Avg',
    publishDateLabel: 'Release Date',
    publishPeriod: 'Stat Period',
    sourceLabel: 'Source',
    periodStartRef: 'Period Start',
    unitPctPts: 'pts',
    tfLabels: { '6M': '6M', '1Y': '1Y', '2Y': '2Y', '5Y': '5Y', MAX: 'MAX' },
    periodContext: { '6M': 'Past 6M', '1Y': 'Past 1Y', '2Y': 'Past 2Y', '5Y': 'Past 5Y', MAX: uiAllTime },
  };
}

export const MacroAnalysisModal: React.FC<MacroAnalysisModalProps> = ({
  indicator,
  language,
  onClose,
  onRefreshMacro,
  onOpenComparison,
  isNested = false,
}) => {
  const ui = getExtraLabels(language);
  const isZh = isChineseLocale(language);
  const isRtl = isRtlLanguage(language);
  const copy = useMemo(() => getMacroCopy(language, ui.gfAllTime), [language, ui.gfAllTime]);

  const [timeframe, setTimeframe] = useState<MacroTimeframeKey>('2Y');
  const [series, setSeries] = useState<MacroChartSeries | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showMonthlyChange, setShowMonthlyChange] = useState(false);
  const [showConsumptionExp, setShowConsumptionExp] = useState(false);
  const [showRetailContrib, setShowRetailContrib] = useState(false);
  const [showMajorBondYields, setShowMajorBondYields] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!indicator) return;
    setTimeframe(indicator.id.startsWith('hh_') ? 'MAX' : '2Y');
    setHoverIdx(null);
    setShowDisclaimer(false);
    setShowMonthlyChange(false);
    setShowConsumptionExp(false);
    setShowRetailContrib(false);
    setShowMajorBondYields(false);
  }, [indicator?.id]);

  useEffect(() => {
    if (!indicator) return;
    let active = true;
    setIsLoading(true);
    fetchMacroChartSeries(indicator, timeframe, true)
      .then((res) => {
        if (active) setSeries(res);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [indicator, timeframe]);

  useSystemBackLayer(
    Boolean(indicator),
    onClose,
    isNested ? BACK_PRIORITY.INNER_OVERLAY : BACK_PRIORITY.NESTED_MODAL,
    'macro-analysis-modal'
  );

  if (!indicator) return null;

  const isRscgYoY = indicator.id === 'rscg';
  const isTsfYoY = indicator.id === 'tsf';
  const isYoYChart = isRscgYoY || isTsfYoY;
  const chartUnit = isYoYChart ? '%' : indicator.unit;
  const chartDecimals = isYoYChart ? 1 : indicator.decimals;
  const chartSigned = isRscgYoY ? true : isTsfYoY ? false : indicator.signed;
  const chartBenchmarkValue = isRscgYoY ? 0 : isTsfYoY ? undefined : indicator.benchmarkValue;
  const chartBenchmarkLabel = isRscgYoY
    ? language === 'zh-TW'
      ? '零增長線'
      : isZh
      ? '零增长线'
      : '0% Baseline'
    : isTsfYoY
    ? undefined
    : indicator.benchmarkLabel;

  const formatMetricValue = (val: number, forceSigned = chartSigned) => {
    const sign = forceSigned && val > 0 ? '+' : '';
    return `${sign}${val.toFixed(chartDecimals)}${chartUnit}`;
  };

  const trillionUnit =
    language === 'zh-TW'
      ? '萬億'
      : isZh
      ? '万亿'
      : language === 'ja'
      ? '兆'
      : language === 'ko'
      ? '조'
      : language === 'ru'
      ? 'трлн'
      : language === 'fa'
      ? 'تریلیون'
      : language === 'mn'
      ? 'их наяд'
      : language === 'ug'
      ? 'تىرىليون'
      : 'T';

  const formatDelta = (delta: number) => {
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(chartDecimals)}${chartUnit === '%' ? ` ${copy.unitPctPts}` : chartUnit}`;
  };

  const points = series?.points || [];
  const activePoint = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : null;
  const fallbackYoy = parseFloat(String(indicator.changeYoY || '').replace(/[^0-9.-]/g, ''));
  const defaultLatestNumeric = isYoYChart
    ? Number.isFinite(fallbackYoy)
      ? fallbackYoy
      : isTsfYoY
      ? 8.4
      : 0.4
    : indicator.numericValue;
  const startPointVal = points[0]?.value ?? defaultLatestNumeric;
  const displayNumeric = activePoint ? activePoint.value : (series?.latestValue ?? defaultLatestNumeric);

  const periodDelta = activePoint
    ? Number((activePoint.value - startPointVal).toFixed(chartDecimals))
    : (series?.periodDelta ?? 0);

  const isHouseholdSub = indicator.id.startsWith('hh_');
  const hhAccentHex = isHouseholdSub
    ? (indicator as Partial<HouseholdLoanSubIndicator>).accentHex
    : undefined;
  const isUp = periodDelta >= 0;
  // For unemployment, an increase is negative macro signal; invert semantic direction before applying regional color convention
  const isFavorableTrend = indicator.id === 'unemployment' ? !isUp : isUp;
  const trendTheme = getMarketTrendTheme(language, isFavorableTrend);
  const strokeColor = hhAccentHex || trendTheme.strokeHex;
  const trendTextClass = trendTheme.textClass;

  // Compact Chart Geometry for single-page fit
  const VB_W = 540;
  const VB_H = 172;
  const PAD_L = 54;
  const PAD_R = 84;
  const PAD_T = 16;
  const PAD_B = 22;
  const PLOT_W = VB_W - PAD_L - PAD_R;
  const PLOT_H = VB_H - PAD_T - PAD_B;

  const allVals = points.map((p) => p.value);
  if (typeof chartBenchmarkValue === 'number') {
    allVals.push(chartBenchmarkValue);
  }
  const rawMin = allVals.length > 0 ? Math.min(...allVals) : defaultLatestNumeric - 1;
  const rawMax = allVals.length > 0 ? Math.max(...allVals) : defaultLatestNumeric + 1;
  const rawSpan = Math.max(rawMax - rawMin, Math.abs(defaultLatestNumeric) * 0.05, 0.4);
  const yMin = rawMin - rawSpan * 0.16;
  const yMax = rawMax + rawSpan * 0.16;
  const ySpan = Math.max(yMax - yMin, 0.01);

  const mapY = (val: number) => PAD_T + ((yMax - val) / ySpan) * PLOT_H;
  const mapX = (idx: number) =>
    points.length <= 1 ? PAD_L : PAD_L + (idx / (points.length - 1)) * PLOT_W;

  const polylineStr = points
    .map((p, idx) => `${mapX(idx).toFixed(1)},${mapY(p.value).toFixed(1)}`)
    .join(' ');

  const areaPathStr = (() => {
    if (points.length < 2) return '';
    const bottomY = (PAD_T + PLOT_H).toFixed(1);
    const firstX = mapX(0).toFixed(1);
    const lastX = mapX(points.length - 1).toFixed(1);
    const linePts = points
      .map((p, idx) => `L ${mapX(idx).toFixed(1)} ${mapY(p.value).toFixed(1)}`)
      .join(' ');
    return `M ${firstX} ${bottomY} ${linePts} L ${lastX} ${bottomY} Z`;
  })();

  const yTicks = [yMax - ySpan * 0.08, (yMax + yMin) / 2, yMin + ySpan * 0.08];
  const refLineVal =
    typeof chartBenchmarkValue === 'number' ? chartBenchmarkValue : startPointVal;
  const refLineLabel = chartBenchmarkLabel || copy.periodStartRef;
  const refLineY = mapY(refLineVal);
  const showRefLine = refLineY >= PAD_T + 4 && refLineY <= PAD_T + PLOT_H - 4;
  const lastIdx = points.length - 1;
  const midIdx = Math.floor(points.length / 2);

  const handlePointerMove = (clientX: number) => {
    if (!svgRef.current || points.length < 2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * VB_W;
    let closestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(mapX(i) - relX);
      if (dist < bestDist) {
        bestDist = dist;
        closestIdx = i;
      }
    }
    setHoverIdx(closestIdx);
  };

  return (
    <div
      className={`fixed inset-0 ${isNested ? 'z-[60]' : 'z-50'} flex items-center justify-center p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4 bg-black/55 backdrop-blur-md select-none animate-modal-backdrop`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-label={indicator.officialName}
        className="econ-modal-cq w-full max-w-xl sm:max-w-2xl [@media(max-height:560px)]:max-w-4xl max-h-[calc(100dvh-0.8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col overflow-hidden rounded-[22px] bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-black backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 [.amoled-mode_&]:border-white/15 shadow-2xl p-2.5 sm:p-3.5 [@media(max-height:560px)]:p-2 gap-1.5 sm:gap-2 [@media(max-height:560px)]:gap-1.5 animate-modal-sheet"
      >
        {/* Top Title Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg [@media(max-height:560px)]:text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight truncate">
              {indicator.officialName}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10.5px] sm:text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
              <span className="font-mono tracking-wide">{indicator.code}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{indicator.source}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onRefreshMacro && (
              <button
                type="button"
                onClick={onRefreshMacro}
                className="w-9 h-9 [@media(max-height:560px)]:w-8 [@media(max-height:560px)]:h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title={ui.toolRefreshLive}
                aria-label={ui.toolRefreshLive}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 [@media(max-height:560px)]:w-8 [@media(max-height:560px)]:h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Compact Card Container (Single-Column Portrait / Split 2-Column Landscape) */}
        <div className="flex-1 min-h-0 rounded-2xl bg-neutral-100/85 dark:bg-neutral-800/75 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/75 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/12 p-2 sm:p-3 [@media(max-height:560px)]:p-2 flex flex-col justify-between gap-1.5 sm:gap-2 [@media(max-height:560px)]:grid [@media(max-height:560px)]:grid-cols-12 [@media(max-height:560px)]:gap-2.5 [@media(max-height:560px)]:items-stretch overflow-hidden">
          {/* Left Pane: Hero Readout + Timeframe Switcher + Chart */}
          <div className="min-w-0 flex-1 min-h-0 flex flex-col justify-between gap-1.5 [@media(max-height:560px)]:col-span-7">
            {/* Hero Value + Period Delta + Release Date */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-2xl sm:text-3xl [@media(max-height:560px)]:text-xl font-extrabold tracking-tight text-neutral-950 dark:text-white font-mono tabular-nums leading-none">
                  {formatMetricValue(displayNumeric)}
                </span>

                <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold font-mono tabular-nums ${trendTextClass}`}>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-extrabold ${trendTheme.badgeClass}`}>
                    {isUp ? (
                      <ArrowUp className="w-3 h-3 stroke-[2.75]" />
                    ) : (
                      <ArrowDown className="w-3 h-3 stroke-[2.75]" />
                    )}
                    <span>{formatDelta(periodDelta)}</span>
                  </span>
                  {(activePoint || !(isHouseholdSub && timeframe === 'MAX')) && (
                    <span className="font-sans text-[11px] sm:text-xs font-medium opacity-85">
                      {activePoint
                        ? isYoYChart && typeof activePoint.secondaryValue === 'number'
                          ? `${activePoint.fullTimeLabel} · ${activePoint.secondaryValue.toFixed(isTsfYoY ? 1 : 2)} ${trillionUnit}`
                          : activePoint.fullTimeLabel
                        : copy.periodContext[timeframe]}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10.5px] sm:text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="font-semibold text-neutral-700 dark:text-neutral-200 tabular-nums">
                  {copy.publishDateLabel}：{indicator.publishDate || indicator.updateDate}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {copy.publishPeriod}：{indicator.statPeriod || indicator.updateDate}
                </span>
                <span aria-hidden="true">·</span>
                <span>{indicator.statusTag}</span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setShowDisclaimer((v) => !v)}
                  className="underline decoration-neutral-400 underline-offset-2 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer inline-flex items-center gap-0.5"
                >
                  <span>{ui.gfDisclaimer}</span>
                  <Info className="w-3 h-3" />
                </button>
              </div>

              {showDisclaimer && (
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 bg-white/80 dark:bg-neutral-900/80 [.amoled-mode_&]:bg-neutral-900 rounded-xl px-2.5 py-1 border border-neutral-200/70 dark:border-neutral-800">
                  {ui.gfDisclaimerText}
                </p>
              )}
            </div>

            {/* Timeframe Selector Row */}
            <div className="grid grid-cols-5 gap-0.5 p-0.5 sm:p-1 rounded-full bg-neutral-200/75 dark:bg-white/[0.08] [.amoled-mode_&]:bg-neutral-900 border border-neutral-200/75 dark:border-white/10 w-full">
              {MACRO_TIMEFRAMES.map((tf) => {
                const isActive = timeframe === tf;
                return (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => {
                      setTimeframe(tf);
                      setHoverIdx(null);
                    }}
                    className={`px-2 py-1 [@media(max-height:560px)]:py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold whitespace-nowrap text-center truncate transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {copy.tfLabels[tf]}
                  </button>
                );
              })}
            </div>

            {/* Interactive SVG Area Chart */}
            <div className="econ-chart-cq relative w-full flex-1 min-h-[96px] sm:min-h-[124px] [@media(max-height:560px)]:min-h-[96px] flex items-center">
              {isLoading && points.length === 0 ? (
                <div className="w-full h-24 sm:h-32 [@media(max-height:560px)]:h-24 flex flex-col items-center justify-center gap-1.5 text-xs text-neutral-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  <span>{ui.gfSyncing}</span>
                </div>
              ) : (
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${VB_W} ${VB_H}`}
                  className="econ-svg-responsive econ-svg-area overflow-visible touch-none cursor-crosshair"
                  onMouseMove={(e) => handlePointerMove(e.clientX)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onTouchMove={(e) => {
                    if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
                  }}
                  onTouchEnd={() => setHoverIdx(null)}
                >
                  <defs>
                    <linearGradient id={`macroArea_${indicator.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={strokeColor} stopOpacity="0.24" />
                      <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines & Left Y-Axis Labels */}
                  {yTicks.map((tickVal, idx) => {
                    const yPos = mapY(tickVal);
                    return (
                      <g key={idx}>
                        <line
                          x1={PAD_L}
                          x2={VB_W - PAD_R}
                          y1={yPos}
                          y2={yPos}
                          stroke="currentColor"
                          className="text-neutral-300/70 dark:text-neutral-700/60"
                          strokeWidth="1"
                        />
                        <text
                          x={PAD_L - 8}
                          y={yPos + 4}
                          textAnchor="end"
                          className="fill-neutral-500 dark:fill-neutral-400 text-[11px] font-mono tabular-nums"
                        >
                          {tickVal.toFixed(chartDecimals)}
                          {chartUnit === '%' ? '%' : ''}
                        </text>
                      </g>
                    );
                  })}

                  {/* Benchmark / Baseline Reference Line + Right Label */}
                  {showRefLine && (
                    <g>
                      <line
                        x1={PAD_L}
                        x2={VB_W - PAD_R + 4}
                        y1={refLineY}
                        y2={refLineY}
                        stroke="currentColor"
                        className={
                          isHouseholdSub && refLineVal === 0
                            ? 'text-neutral-700 dark:text-neutral-300'
                            : 'text-neutral-400 dark:text-neutral-500'
                        }
                        strokeWidth="1.25"
                        strokeDasharray={isHouseholdSub && refLineVal === 0 ? undefined : '3 5'}
                      />
                      <text
                        x={VB_W - PAD_R + 10}
                        y={refLineY - 6}
                        className="fill-neutral-500 dark:fill-neutral-400 text-[10px] font-medium"
                      >
                        {refLineLabel}
                      </text>
                      <text
                        x={VB_W - PAD_R + 10}
                        y={refLineY + 8}
                        className="fill-neutral-700 dark:fill-neutral-200 text-[11px] font-mono font-semibold tabular-nums"
                      >
                        {formatMetricValue(refLineVal, false)}
                      </text>
                    </g>
                  )}

                  {/* Combined History Transition Marker (2016-2017 existing + 2018+ first page) */}
                  {isHouseholdSub && timeframe === 'MAX' && (() => {
                    const idx2018 = points.findIndex((p) => p.timeLabel === '18/01');
                    if (idx2018 <= 0 || idx2018 >= points.length - 2) return null;
                    const x2018 = mapX(idx2018);
                    return (
                      <g>
                        <line
                          x1={x2018}
                          x2={x2018}
                          y1={PAD_T}
                          y2={PAD_T + PLOT_H}
                          stroke="currentColor"
                          className="text-neutral-400/60 dark:text-neutral-500/60"
                          strokeWidth="1"
                          strokeDasharray="2 3"
                        />
                        <text
                          x={x2018 + 3}
                          y={PAD_T + 10}
                          className="fill-neutral-500 dark:fill-neutral-400 text-[9px] font-mono tabular-nums"
                        >
                          2018+
                        </text>
                      </g>
                    );
                  })()}

                  {/* Area Fill & Stroke */}
                  {points.length >= 2 && (
                    <>
                      <path d={areaPathStr} fill={`url(#macroArea_${indicator.id})`} />
                      <polyline
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="2.4"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={polylineStr}
                      />
                    </>
                  )}

                  {/* Terminal Latest Dot */}
                  {lastIdx >= 0 && points[lastIdx] && (
                    <circle
                      cx={mapX(lastIdx)}
                      cy={mapY(points[lastIdx].value)}
                      r="4"
                      fill={strokeColor}
                      className="stroke-white dark:stroke-neutral-900"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Bottom Baseline & X-Axis Labels */}
                  <line
                    x1={PAD_L}
                    x2={VB_W - PAD_R}
                    y1={PAD_T + PLOT_H}
                    y2={PAD_T + PLOT_H}
                    stroke="currentColor"
                    className="text-neutral-400 dark:text-neutral-600"
                    strokeWidth="1"
                  />

                  {points.length >= 3 && (
                    <>
                      <text
                        x={PAD_L + 6}
                        y={PAD_T + PLOT_H + 16}
                        textAnchor="start"
                        className="fill-neutral-500 dark:fill-neutral-400 text-[10px] font-mono tabular-nums"
                      >
                        {points[0].timeLabel}
                      </text>
                      <text
                        x={PAD_L + PLOT_W / 2}
                        y={PAD_T + PLOT_H + 16}
                        textAnchor="middle"
                        className="fill-neutral-500 dark:fill-neutral-400 text-[10px] font-mono tabular-nums"
                      >
                        {points[midIdx].timeLabel}
                      </text>
                      <text
                        x={VB_W - PAD_R}
                        y={PAD_T + PLOT_H + 16}
                        textAnchor="end"
                        className="fill-neutral-500 dark:fill-neutral-400 text-[10px] font-mono tabular-nums"
                      >
                        {points[lastIdx].timeLabel}
                      </text>
                    </>
                  )}

                  {/* Interactive Hover / Touch Crosshair */}
                  {hoverIdx !== null && points[hoverIdx] && (
                    <g>
                      <line
                        x1={mapX(hoverIdx)}
                        x2={mapX(hoverIdx)}
                        y1={PAD_T}
                        y2={PAD_T + PLOT_H}
                        stroke="currentColor"
                        className="text-neutral-400 dark:text-neutral-500"
                        strokeWidth="1"
                        strokeDasharray="2 3"
                      />
                      <circle
                        cx={mapX(hoverIdx)}
                        cy={mapY(points[hoverIdx].value)}
                        r="5"
                        fill={strokeColor}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    </g>
                  )}
                </svg>
              )}
            </div>
          </div>

          {/* Right Pane: Key Stats Grid + Macro Interpretation + Drill-Down Comparison */}
          <div className="min-w-0 shrink-0 flex flex-col justify-between gap-1.5 [@media(max-height:560px)]:col-span-5 [@media(max-height:560px)]:border-s [@media(max-height:560px)]:border-neutral-200/80 dark:[@media(max-height:560px)]:border-neutral-700/70 [.amoled-mode_&]:[@media(max-height:560px)]:border-white/12 [@media(max-height:560px)]:ps-2.5">
            {/* Bottom / Right 2-Column Key Stats Grid */}
            <div className="pt-1.5 border-t border-neutral-200/90 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/10 [@media(max-height:560px)]:pt-0 [@media(max-height:560px)]:border-t-0 grid grid-cols-2 gap-x-2.5 sm:gap-x-4 gap-y-0.5 text-[10px] sm:text-xs">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-neutral-500 dark:text-neutral-400 truncate">{copy.latestReading}</span>
                  <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                    {indicator.latestVal}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-neutral-500 dark:text-neutral-400 truncate">{copy.momChange}</span>
                  <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                    {indicator.changeMoM}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-neutral-500 dark:text-neutral-400 truncate">{copy.yoyChange}</span>
                  <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                    {indicator.changeYoY}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-neutral-500 dark:text-neutral-400 truncate">{copy.publishDateLabel}</span>
                  <span className="font-semibold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 shrink-0">
                    {indicator.publishDate || indicator.updateDate}
                  </span>
                </div>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-neutral-500 dark:text-neutral-400 truncate">{copy.periodHigh}</span>
                  <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                    {series ? formatMetricValue(series.periodHigh) : '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-neutral-500 dark:text-neutral-400 truncate">{copy.periodLow}</span>
                  <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                    {series ? formatMetricValue(series.periodLow) : '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-neutral-500 dark:text-neutral-400 truncate">
                    {indicator.secondaryLabel || copy.periodAvg}
                  </span>
                  <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                    {indicator.secondaryVal || (series ? formatMetricValue(series.periodAvg) : '--')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-neutral-500 dark:text-neutral-400 truncate">{copy.publishPeriod}</span>
                  <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                    {indicator.statPeriod || indicator.updateDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Macro Interpretation Summary */}
            <div className="pt-1.5 border-t border-neutral-200/80 dark:border-neutral-800 [.amoled-mode_&]:border-white/10 text-[10.5px] sm:text-[11px] text-neutral-600 dark:text-neutral-300 leading-snug line-clamp-2 [@media(max-height:560px)]:line-clamp-3">
              {indicator.summary}
            </div>

            {/* Contextual Comparison Drill-Down Triggers */}
            {indicator.id === 'pmi' && onOpenComparison && (
              <div className="pt-1 border-t border-neutral-200/75 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/10 flex justify-center">
                <button
                  type="button"
                  onClick={() => onOpenComparison('pmi_compare')}
                  className="w-full min-h-[38px] sm:min-h-[42px] [@media(max-height:560px)]:min-h-[32px] px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/18 active:scale-[0.99] border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>
                    {language === 'zh-TW'
                      ? '官方與民間口徑對比'
                      : isZh
                      ? '官方与民间口径对比'
                      : 'Official vs Private PMI Comparison'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}

            {indicator.id === 'cpi' && (
              <div
                className={`pt-1 border-t border-neutral-200/75 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/10 ${
                  onOpenComparison ? 'grid grid-cols-2 gap-1.5' : 'flex justify-center'
                }`}
              >
                {onOpenComparison && (
                  <button
                    type="button"
                    onClick={() => onOpenComparison('ppi_cpi_compare')}
                    className="w-full min-h-[38px] sm:min-h-[42px] [@media(max-height:560px)]:min-h-[32px] px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/18 active:scale-[0.99] border border-orange-500/25 text-orange-700 dark:text-orange-300 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
                  >
                    <span className="truncate">
                      {language === 'zh-TW'
                        ? 'PPI與CPI同比'
                        : isZh
                        ? 'PPI与CPI同比'
                        : 'PPI vs CPI YoY'}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowConsumptionExp(true)}
                  className="w-full min-h-[38px] sm:min-h-[42px] [@media(max-height:560px)]:min-h-[32px] px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/18 active:scale-[0.99] border border-sky-500/25 text-sky-700 dark:text-sky-300 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
                >
                  <span className="truncate">
                    {language === 'zh-TW'
                      ? '人均消費支出分項名義增速'
                      : isZh
                      ? '人均消费支出分项名义增速'
                      : 'Per Capita Spending YoY'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}

            {indicator.id === 'ppi' && onOpenComparison && (
              <div className="pt-1 border-t border-neutral-200/75 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/10 flex justify-center">
                <button
                  type="button"
                  onClick={() => onOpenComparison('ppi_cpi_compare')}
                  className="w-full min-h-[38px] sm:min-h-[42px] [@media(max-height:560px)]:min-h-[32px] px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/18 active:scale-[0.99] border border-orange-500/25 text-orange-700 dark:text-orange-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>
                    {language === 'zh-TW'
                      ? 'PPI與CPI同比'
                      : isZh
                      ? 'PPI与CPI同比'
                      : 'PPI vs CPI YoY Trend'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}

            {indicator.id === 'rscg' && (
              <div
                className={`pt-1 border-t border-neutral-200/75 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/10 ${
                  onOpenComparison ? 'grid grid-cols-2 gap-1.5' : 'flex justify-center'
                }`}
              >
                {onOpenComparison && (
                  <button
                    type="button"
                    onClick={() => onOpenComparison('industrial_retail_compare')}
                    className="w-full min-h-[38px] sm:min-h-[42px] [@media(max-height:560px)]:min-h-[32px] px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/18 active:scale-[0.99] border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
                  >
                    <span className="truncate">
                      {language === 'zh-TW'
                        ? '工業增加值與社零月度同比'
                        : isZh
                        ? '工业增加值与社零月度同比'
                        : 'Output vs Retail YoY'}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowRetailContrib(true)}
                  className="w-full min-h-[38px] sm:min-h-[42px] [@media(max-height:560px)]:min-h-[32px] px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/18 active:scale-[0.99] border border-sky-500/25 text-sky-700 dark:text-sky-300 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
                >
                  <span className="truncate">
                    {language === 'zh-TW'
                      ? '同比拉動拆分圖'
                      : isZh
                      ? '同比拉动拆分图'
                      : 'YoY Contribution Split'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}

            {indicator.id === 'tsf' && onOpenComparison && (
              <div className="pt-1 border-t border-neutral-200/75 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/10 flex justify-center">
                <button
                  type="button"
                  onClick={() => onOpenComparison('tsf_sectors_compare')}
                  className="w-full min-h-[38px] sm:min-h-[42px] [@media(max-height:560px)]:min-h-[32px] px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/18 active:scale-[0.99] border border-blue-500/25 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>
                    {language === 'zh-TW'
                      ? '各部門規模'
                      : isZh
                      ? '各部门规模'
                      : 'Sector Breakdown'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}

            {(indicator.id === 'cn10y' || indicator.id === 'us10y') && (
              <div
                className={`pt-1 border-t border-neutral-200/75 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/10 ${
                  onOpenComparison ? 'grid grid-cols-2 gap-1.5' : 'flex justify-center'
                }`}
              >
                {onOpenComparison && (
                  <button
                    type="button"
                    onClick={() => onOpenComparison('bond_10y_compare')}
                    className="w-full min-h-[38px] sm:min-h-[42px] [@media(max-height:560px)]:min-h-[32px] px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/18 active:scale-[0.99] border border-rose-500/25 text-rose-700 dark:text-rose-300 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
                  >
                    <span className="truncate">
                      {language === 'zh-TW'
                        ? '中美10年期收益率'
                        : isZh
                        ? '中美10年期收益率'
                        : 'CN vs US 10Y Yields'}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMajorBondYields(true)}
                  className="w-full min-h-[38px] sm:min-h-[42px] [@media(max-height:560px)]:min-h-[32px] px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/18 active:scale-[0.99] border border-sky-500/25 text-sky-700 dark:text-sky-300 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
                >
                  <span className="truncate">
                    {language === 'zh-TW'
                      ? '主要經濟體10年期國債收益率'
                      : isZh
                      ? '主要经济体10年期国债收益率'
                      : 'Major 10Y Bond Yields'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}

            {isHouseholdSub && (
              <div className="pt-1 border-t border-neutral-200/75 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowMonthlyChange(true)}
                  className="w-full min-h-[38px] sm:min-h-[42px] [@media(max-height:560px)]:min-h-[32px] px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/18 active:scale-[0.99] border border-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>
                    {language === 'zh-TW'
                      ? '當月變動'
                      : isZh
                      ? '当月变动'
                      : 'Monthly Change'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isHouseholdSub && (
        <HouseholdMonthlyChangeModal
          open={showMonthlyChange}
          indicatorId={indicator.id}
          language={language}
          onClose={() => setShowMonthlyChange(false)}
        />
      )}

      {indicator.id === 'cpi' && (
        <ConsumptionExpenditureModal
          open={showConsumptionExp}
          language={language}
          onClose={() => setShowConsumptionExp(false)}
        />
      )}

      {indicator.id === 'rscg' && (
        <RetailContributionModal
          open={showRetailContrib}
          language={language}
          onClose={() => setShowRetailContrib(false)}
        />
      )}

      {(indicator.id === 'cn10y' || indicator.id === 'us10y') && (
        <MajorBondYieldsModal
          open={showMajorBondYields}
          language={language}
          onClose={() => setShowMajorBondYields(false)}
        />
      )}
    </div>
  );
};
