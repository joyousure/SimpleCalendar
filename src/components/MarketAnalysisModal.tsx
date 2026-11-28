import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, RefreshCw, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { Language } from '../types/calendar';
import {
  LiveMarketQuote,
  MarketChartSeries,
  TimeframeKey,
  fetchMarketChartSeries,
  getQuoteOfficialName,
  getMarketTrendTheme,
} from '../utils/financeService';
import { getExtraLabels, isChineseLocale, getLocaleCode, isRtlLanguage } from '../utils/i18n';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';

interface MarketAnalysisModalProps {
  quote: LiveMarketQuote | null;
  language: Language;
  usdToCny?: number;
  onClose: () => void;
  onRefreshQuote?: () => void;
}

const TIMEFRAMES: TimeframeKey[] = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX'];
const TROY_OZ_GRAMS = 31.1034768;

export const MarketAnalysisModal: React.FC<MarketAnalysisModalProps> = ({
  quote,
  language,
  usdToCny = 7.245,
  onClose,
  onRefreshQuote,
}) => {
  const ui = getExtraLabels(language);
  const isZh = isChineseLocale(language);
  const localeCode = getLocaleCode(language);
  const isRtl = isRtlLanguage(language);

  const [timeframe, setTimeframe] = useState<TimeframeKey>('1D');
  const [series, setSeries] = useState<MarketChartSeries | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!quote) return;
    setTimeframe('1D');
    setHoverIdx(null);
    setShowDisclaimer(false);
  }, [quote?.id]);

  useEffect(() => {
    if (!quote) return;
    let active = true;
    setIsLoading(true);
    fetchMarketChartSeries(quote, timeframe)
      .then((res) => {
        if (active) setSeries(res);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [quote, timeframe]);

  useSystemBackLayer(
    Boolean(quote),
    onClose,
    BACK_PRIORITY.NESTED_MODAL,
    'market-analysis-modal'
  );

  const tfLabels: Record<TimeframeKey, string> = useMemo(() => {
    const map: Record<Language, Record<TimeframeKey, string>> = {
      'zh-CN': { '1D': '1天', '5D': '5天', '1M': '1个月', '6M': '6个月', YTD: 'YTD', '1Y': '1年', '5Y': '5年', MAX: '最大' },
      'zh-TW': { '1D': '1天', '5D': '5天', '1M': '1個月', '6M': '6個月', YTD: 'YTD', '1Y': '1年', '5Y': '5年', MAX: '最大' },
      en: { '1D': '1D', '5D': '5D', '1M': '1M', '6M': '6M', YTD: 'YTD', '1Y': '1Y', '5Y': '5Y', MAX: ui.gfAllTime },
      ja: { '1D': '1日', '5D': '5日', '1M': '1ヶ月', '6M': '6ヶ月', YTD: 'YTD', '1Y': '1年', '5Y': '5年', MAX: ui.gfAllTime },
      ko: { '1D': '1일', '5D': '5일', '1M': '1개월', '6M': '6개월', YTD: 'YTD', '1Y': '1년', '5Y': '5년', MAX: ui.gfAllTime },
      fr: { '1D': '1J', '5D': '5J', '1M': '1M', '6M': '6M', YTD: 'YTD', '1Y': '1A', '5Y': '5A', MAX: ui.gfAllTime },
      ru: { '1D': '1Д', '5D': '5Д', '1M': '1М', '6M': '6М', YTD: 'YTD', '1Y': '1Г', '5Y': '5Л', MAX: ui.gfAllTime },
      fa: { '1D': '۱ر', '5D': '۵ر', '1M': '۱م', '6M': '۶م', YTD: 'امسال', '1Y': '۱س', '5Y': '۵س', MAX: ui.gfAllTime },
      mn: { '1D': '1Ө', '5D': '5Ө', '1M': '1С', '6M': '6С', YTD: 'Энэ жил', '1Y': '1Ж', '5Y': '5Ж', MAX: ui.gfAllTime },
      ug: { '1D': '1ك', '5D': '5ك', '1M': '1ئاي', '6M': '6ئاي', YTD: 'بۇيىل', '1Y': '1ي', '5Y': '5ي', MAX: ui.gfAllTime },
    };
    return map[language] || map.en;
  }, [language, ui.gfAllTime]);

  const periodContextLabel: Record<TimeframeKey, string> = useMemo(
    () => ({
      '1D': ui.gfToday,
      '5D': ui.gfPast5Days,
      '1M': ui.gfPast1Month,
      '6M': ui.gfPast6Months,
      YTD: ui.gfYtd,
      '1Y': ui.gfPast1Year,
      '5Y': ui.gfPast5Years,
      MAX: ui.gfAllTime,
    }),
    [ui]
  );

  if (!quote) return null;

  const formatPrice = (val: number) => {
    const decimals = val < 20 ? 3 : 2;
    return val.toLocaleString(localeCode === 'fa-IR' ? 'en-US' : localeCode, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const points = series?.points || [];
  const prevClose = series?.prevClose ?? quote.prevClose;
  const activePoint = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : null;
  const displayPrice = activePoint ? activePoint.price : quote.price;

  const baselinePrice =
    timeframe === '1D' ? prevClose : points[0]?.price || prevClose;
  const displayDelta =
    activePoint
      ? Number((activePoint.price - baselinePrice).toFixed(2))
      : series?.periodChange ?? quote.change;
  const displayDeltaPct =
    activePoint
      ? baselinePrice > 0
        ? Number((((activePoint.price - baselinePrice) / baselinePrice) * 100).toFixed(3))
        : 0
      : series?.periodChangePct ?? quote.changePct;

  const isUp = displayDelta >= 0;
  // Automatically adapts to system language market convention:
  // zh-CN / zh-TW / ja / ug => Red Up / Green Down
  // ko => Red Up / Blue Down
  // International (en / fr / ru / fa / mn) => Green Up / Red Down
  const trendTheme = getMarketTrendTheme(language, isUp);
  const strokeColor = trendTheme.strokeHex;
  const trendTextClass = trendTheme.textClass;

  // Compact Chart Geometry for single-page fit
  const VB_W = 540;
  const VB_H = 172;
  const PAD_L = 54;
  const PAD_R = 82; // Room for Prev Close label on right
  const PAD_T = 16;
  const PAD_B = 22;
  const PLOT_W = VB_W - PAD_L - PAD_R;
  const PLOT_H = VB_H - PAD_T - PAD_B;

  const allVals = points.map((p) => p.price);
  if (timeframe === '1D' && prevClose > 0) allVals.push(prevClose);
  const rawMin = allVals.length > 0 ? Math.min(...allVals) : quote.low;
  const rawMax = allVals.length > 0 ? Math.max(...allVals) : quote.high;
  const rawSpan = Math.max(rawMax - rawMin, Math.abs(quote.price) * 0.004);
  const yMin = rawMin - rawSpan * 0.14;
  const yMax = rawMax + rawSpan * 0.14;
  const ySpan = Math.max(yMax - yMin, 0.001);

  const mapY = (val: number) => PAD_T + ((yMax - val) / ySpan) * PLOT_H;

  // Map X coordinates, leaving a crisp visual gap for midday lunch break on 1D CN/HK sessions
  const amPoints = points.filter((p) => p.session === 'am');
  const pmPoints = points.filter((p) => p.session === 'pm');
  const hasSplitSessions =
    series?.hasLunchBreak && amPoints.length >= 2 && pmPoints.length >= 2;

  const mapX = (idx: number) => {
    if (points.length <= 1) return PAD_L;
    if (!hasSplitSessions) {
      return PAD_L + (idx / (points.length - 1)) * PLOT_W;
    }
    const gapWidth = 26;
    const amEndIdx = amPoints.length - 1;
    const pmCount = pmPoints.length;
    const halfW = (PLOT_W - gapWidth) / 2;
    if (idx <= amEndIdx) {
      return PAD_L + (idx / Math.max(1, amEndIdx)) * halfW;
    }
    const pmLocalIdx = idx - amPoints.length;
    return PAD_L + halfW + gapWidth + (pmLocalIdx / Math.max(1, pmCount - 1)) * halfW;
  };

  const buildPolyline = (slice: { idx: number; price: number }[]) =>
    slice.map((p) => `${mapX(p.idx).toFixed(1)},${mapY(p.price).toFixed(1)}`).join(' ');

  const buildAreaPath = (slice: { idx: number; price: number }[]) => {
    if (slice.length < 2) return '';
    const bottomY = (PAD_T + PLOT_H).toFixed(1);
    const firstX = mapX(slice[0].idx).toFixed(1);
    const lastX = mapX(slice[slice.length - 1].idx).toFixed(1);
    const linePts = slice
      .map((p) => `L ${mapX(p.idx).toFixed(1)} ${mapY(p.price).toFixed(1)}`)
      .join(' ');
    return `M ${firstX} ${bottomY} ${linePts} L ${lastX} ${bottomY} Z`;
  };

  const indexedPoints = points.map((p, idx) => ({ ...p, idx }));
  const amSlice = hasSplitSessions ? indexedPoints.slice(0, amPoints.length) : indexedPoints;
  const pmSlice = hasSplitSessions ? indexedPoints.slice(amPoints.length) : [];

  const yTicks = [yMax - ySpan * 0.08, (yMax + yMin) / 2, yMin + ySpan * 0.08];
  const prevCloseY = mapY(prevClose);
  const showPrevCloseLine =
    timeframe === '1D' && prevCloseY >= PAD_T && prevCloseY <= PAD_T + PLOT_H;

  const lastPt = indexedPoints[indexedPoints.length - 1];
  const breakCenterX = PAD_L + PLOT_W / 2;

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

  const todayDisplayDate = new Date().toLocaleDateString(localeCode, {
    month: 'short',
    day: 'numeric',
  });

  const officialTitle = getQuoteOfficialName(quote, language);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-black/55 backdrop-blur-md select-none animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-label={officialTitle}
        className="econ-modal-cq w-full max-w-xl sm:max-w-2xl [@media(max-height:560px)]:max-w-4xl max-h-[calc(100dvh-0.8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col overflow-hidden rounded-[22px] bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xl p-2.5 sm:p-4 [@media(max-height:560px)]:p-2 gap-1.5 sm:gap-2 [@media(max-height:560px)]:gap-1.5 animate-modal-sheet"
      >
        {/* Top Title Header */}
        <div className="shrink-0 flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg [@media(max-height:560px)]:text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight truncate">
              {officialTitle}
            </h2>
            <span className="text-[11px] font-mono tracking-wide text-neutral-500 dark:text-neutral-400">
              {quote.exchangeSymbol}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onRefreshQuote && (
              <button
                type="button"
                onClick={onRefreshQuote}
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

        {/* Main Compact Card Container */}
        <div className="flex-1 min-h-0 rounded-2xl bg-neutral-100/85 dark:bg-neutral-800/75 [.amoled-mode_&]:bg-neutral-900/90 border border-neutral-200/75 dark:border-neutral-700/70 p-2.5 sm:p-3.5 [@media(max-height:560px)]:p-2 flex flex-col justify-between gap-2 [@media(max-height:560px)]:grid [@media(max-height:560px)]:grid-cols-12 [@media(max-height:560px)]:gap-3 overflow-hidden">
          <div className="min-w-0 flex-1 min-h-0 flex flex-col justify-between gap-1.5 sm:gap-2 [@media(max-height:560px)]:col-span-8">
          {/* Price + Change + Timestamp */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white font-mono tabular-nums leading-none">
                {formatPrice(displayPrice)}
              </span>

              <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold font-mono tabular-nums ${trendTextClass}`}>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-extrabold ${trendTheme.badgeClass}`}>
                  {isUp ? (
                    <ArrowUp className="w-3 h-3 stroke-[2.75]" />
                  ) : (
                    <ArrowDown className="w-3 h-3 stroke-[2.75]" />
                  )}
                  <span>
                    {displayDelta >= 0 ? '+' : ''}
                    {formatPrice(displayDelta)}
                  </span>
                  <span>
                    ({displayDeltaPct >= 0 ? '+' : ''}
                    {displayDeltaPct.toFixed(Math.abs(displayDeltaPct) < 1 ? 3 : 2)}%)
                  </span>
                </span>
                <span className="font-sans text-[11px] sm:text-xs font-medium opacity-85">
                  {activePoint ? activePoint.fullTimeLabel : periodContextLabel[timeframe]}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              {(quote.category === 'metal' || quote.category === 'energy') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-[10.5px] font-semibold text-amber-700 dark:text-amber-300 font-mono tabular-nums">
                  {quote.category === 'metal' ? (
                    <>
                      <span>
                        ≈ ¥{((displayPrice * usdToCny) / TROY_OZ_GRAMS).toFixed(quote.id === 'silver' ? 2 : 1)}/
                        {isZh ? '克' : language === 'ja' ? 'g' : language === 'ko' ? 'g' : language === 'ru' ? 'г' : language === 'fa' ? 'گرم' : language === 'ug' ? 'گ' : 'g'}
                      </span>
                      <span className="opacity-50">·</span>
                      <span>
                        ¥{Math.round(displayPrice * usdToCny).toLocaleString('en-US')}/
                        {isZh ? '盎司' : language === 'ja' ? 'オンス' : language === 'ko' ? '온스' : language === 'ru' ? 'унц.' : language === 'fa' ? 'اونس' : language === 'mn' ? 'унц' : language === 'ug' ? 'ئۇنسىيە' : 'oz'}
                      </span>
                    </>
                  ) : (
                    <span>
                      ≈ ¥{(displayPrice * usdToCny).toFixed(2)}/
                      {quote.id === 'natgas'
                        ? language === 'zh-TW'
                          ? '百萬英熱'
                          : isZh
                          ? '百万英热'
                          : 'MMBtu'
                        : isZh
                        ? '桶'
                        : language === 'ja'
                        ? 'バレル'
                        : language === 'ko'
                        ? '배럴'
                        : language === 'ru'
                        ? 'барр.'
                        : language === 'fa'
                        ? 'بشکه'
                        : language === 'mn'
                        ? 'баррель'
                        : language === 'ug'
                        ? 'تۇڭ'
                        : 'bbl'}
                    </span>
                  )}
                </span>
              )}
              <span className="tabular-nums">
                {todayDisplayDate} {quote.timezoneLabel} {series?.updatedAt || quote.updatedAt || '15:00'}
              </span>
              <span>·</span>
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
              <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 bg-white/80 dark:bg-neutral-900/80 rounded-xl px-2.5 py-1.5 border border-neutral-200/70 dark:border-neutral-800">
                {ui.gfDisclaimerText}
              </p>
            )}
          </div>

          {/* Timeframe Selector Row (single horizontal row on all viewports) */}
          <div className="w-full">
            <div className="flex items-center justify-between gap-0.5 p-0.5 sm:p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full overflow-x-auto no-scrollbar">
              {TIMEFRAMES.map((tf) => {
                const isActive = timeframe === tf;
                return (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => {
                      setTimeframe(tf);
                      setHoverIdx(null);
                    }}
                    className={`flex-1 min-w-fit px-1 sm:px-1.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold whitespace-nowrap text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {tfLabels[tf]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive SVG Area Chart */}
          <div className="econ-chart-cq relative w-full flex-1 min-h-[104px] sm:min-h-[132px] [@media(max-height:560px)]:min-h-[96px] flex items-center">
            {isLoading && points.length === 0 ? (
              <div className="w-full h-28 sm:h-36 [@media(max-height:560px)]:h-24 flex flex-col items-center justify-center gap-1.5 text-xs text-neutral-400">
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
                  <linearGradient id={`gfArea_${quote.id}`} x1="0" y1="0" x2="0" y2="1">
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
                        {tickVal >= 1000
                          ? Math.round(tickVal).toLocaleString('en-US')
                          : tickVal.toFixed(tickVal < 20 ? 2 : 0)}
                      </text>
                    </g>
                  );
                })}

                {/* Midday Lunch Break Label (Exact Google Finance Touch) */}
                {hasSplitSessions && (
                  <text
                    x={breakCenterX}
                    y={PAD_T + 14}
                    textAnchor="middle"
                    className="fill-neutral-600 dark:fill-neutral-400 text-[11px] font-medium"
                  >
                    {ui.gfLunchBreak}
                  </text>
                )}

                {/* Prev Close Dashed Reference Line + Right Label */}
                {showPrevCloseLine && (
                  <g>
                    <line
                      x1={PAD_L}
                      x2={VB_W - PAD_R + 4}
                      y1={prevCloseY}
                      y2={prevCloseY}
                      stroke="currentColor"
                      className="text-neutral-400 dark:text-neutral-500"
                      strokeWidth="1.25"
                      strokeDasharray="3 5"
                    />
                    <text
                      x={VB_W - PAD_R + 10}
                      y={prevCloseY - 6}
                      className="fill-neutral-500 dark:fill-neutral-400 text-[10px] font-medium"
                    >
                      {ui.gfPrevClose}
                    </text>
                    <text
                      x={VB_W - PAD_R + 10}
                      y={prevCloseY + 8}
                      className="fill-neutral-700 dark:fill-neutral-200 text-[11px] font-mono font-semibold tabular-nums"
                    >
                      {formatPrice(prevClose)}
                    </text>
                  </g>
                )}

                {/* Area Fill & Stroke (Morning + Afternoon split or single continuous) */}
                {amSlice.length >= 2 && (
                  <>
                    <path d={buildAreaPath(amSlice)} fill={`url(#gfArea_${quote.id})`} />
                    <polyline
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2.4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={buildPolyline(amSlice)}
                    />
                  </>
                )}

                {pmSlice.length >= 2 && (
                  <>
                    <path d={buildAreaPath(pmSlice)} fill={`url(#gfArea_${quote.id})`} />
                    <polyline
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2.4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={buildPolyline(pmSlice)}
                    />
                  </>
                )}

                {/* Terminal Current Price Dot */}
                {lastPt && (
                  <circle
                    cx={mapX(lastPt.idx)}
                    cy={mapY(lastPt.price)}
                    r="4"
                    fill={strokeColor}
                    className="stroke-white dark:stroke-neutral-900"
                    strokeWidth="1.5"
                  />
                )}

                {/* Bottom Baseline & X-Axis Tick Labels */}
                <line
                  x1={PAD_L}
                  x2={VB_W - PAD_R}
                  y1={PAD_T + PLOT_H}
                  y2={PAD_T + PLOT_H}
                  stroke="currentColor"
                  className="text-neutral-400 dark:text-neutral-600"
                  strokeWidth="1"
                />

                {points.length >= 4 && (
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
                      x={breakCenterX}
                      y={PAD_T + PLOT_H + 16}
                      textAnchor="middle"
                      className="fill-neutral-500 dark:fill-neutral-400 text-[10px] font-mono tabular-nums"
                    >
                      {hasSplitSessions
                        ? '12:00'
                        : points[Math.floor(points.length / 2)].timeLabel}
                    </text>
                    <text
                      x={VB_W - PAD_R}
                      y={PAD_T + PLOT_H + 16}
                      textAnchor="end"
                      className="fill-neutral-500 dark:fill-neutral-400 text-[10px] font-mono tabular-nums"
                    >
                      {points[points.length - 1].timeLabel}
                    </text>
                  </>
                )}

                {/* Hover / Touch Crosshair */}
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
                      cy={mapY(points[hoverIdx].price)}
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

          {/* Bottom / Side 2-Column Key Stats Grid */}
          <div className="shrink-0 pt-2 border-t border-neutral-200/90 dark:border-neutral-700/70 [@media(max-height:560px)]:col-span-4 [@media(max-height:560px)]:pt-0 [@media(max-height:560px)]:border-t-0 [@media(max-height:560px)]:border-s [@media(max-height:560px)]:ps-2.5 [@media(max-height:560px)]:flex [@media(max-height:560px)]:flex-col [@media(max-height:560px)]:justify-center grid grid-cols-2 [@media(max-height:560px)]:grid-cols-1 gap-x-3 sm:gap-x-5 gap-y-1 text-[10.5px] sm:text-xs">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-neutral-500 dark:text-neutral-400 truncate">{ui.gfOpen}</span>
                <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                  {formatPrice(series?.open ?? quote.open)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-neutral-500 dark:text-neutral-400 truncate">{ui.gfHigh}</span>
                <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                  {formatPrice(series?.high ?? quote.high)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-neutral-500 dark:text-neutral-400 truncate">{ui.gfLow}</span>
                <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                  {formatPrice(series?.low ?? quote.low)}
                </span>
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-neutral-500 dark:text-neutral-400 truncate">{ui.gfPrevClose}</span>
                <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                  {formatPrice(series?.prevClose ?? quote.prevClose)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-neutral-500 dark:text-neutral-400 truncate">{ui.gf52wHigh}</span>
                <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                  {formatPrice(series?.week52High ?? quote.week52High)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-neutral-500 dark:text-neutral-400 truncate">{ui.gf52wLow}</span>
                <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                  {formatPrice(series?.week52Low ?? quote.week52Low)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
