import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Language } from '../types/calendar';
import {
  HOUSEHOLD_LOAN_SUB_INDICATORS,
  HouseholdLoanSubIndicator,
  MacroIndicator,
  fetchLiveMacroIndicators,
  getFilteredHouseholdLoanData,
} from '../utils/financeService';
import { isChineseLocale, isRtlLanguage } from '../utils/i18n';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';

interface HouseholdLoansModalProps {
  open: boolean;
  language: Language;
  onClose: () => void;
  onSelectSubIndicator: (indicator: MacroIndicator) => void;
}

function getCopy(language: Language) {
  if (language === 'zh-TW') {
    return {
      title: '住戶貸款分項走勢',
      subtitle: '2016年至今餘額同比（%）· 中國人民銀行',
      latestWord: '最新',
      lowestSince2016: '2016年以來最低',
      highestSince2016: '2016年以來最高',
      peakWord: '峰值',
      avgWord: '均值',
      latestLabel: '2026年10月',
      unpublishedSuffix: '項未公布已過濾',
      names: {
        hh_ml_consumer: '中長期消費貸款（以房貸為主）',
        hh_st_consumer: '短期消費貸款',
        hh_st_business: '短期經營貸款',
        hh_ml_business: '中長期經營貸款',
      } as Record<string, string>,
    };
  }
  if (isChineseLocale(language)) {
    return {
      title: '住户贷款分项走势',
      subtitle: '2016年至今余额同比（%）· 中国人民银行',
      latestWord: '最新',
      lowestSince2016: '2016年以来最低',
      highestSince2016: '2016年以来最高',
      peakWord: '峰值',
      avgWord: '均值',
      latestLabel: '2026年10月',
      unpublishedSuffix: '项未公布已过滤',
      names: {
        hh_ml_consumer: '中长期消费贷款（以房贷为主）',
        hh_st_consumer: '短期消费贷款',
        hh_st_business: '短期经营贷款',
        hh_ml_business: '中长期经营贷款',
      } as Record<string, string>,
    };
  }
  if (language === 'ja') {
    return {
      title: '家計部門ローン内訳推移',
      subtitle: '2016年〜現在 残高前年比 (%) · 中国人民銀行',
      latestWord: '最新',
      lowestSince2016: '2016年以降で最低',
      highestSince2016: '2016年以降で最高',
      peakWord: 'ピーク',
      avgWord: '平均',
      latestLabel: '2026年10月',
      unpublishedSuffix: '件未公表を除外',
      names: {
        hh_ml_consumer: '中長期消費ローン（住宅中心）',
        hh_st_consumer: '短期消費ローン',
        hh_st_business: '短期事業性ローン',
        hh_ml_business: '中長期事業性ローン',
      } as Record<string, string>,
    };
  }
  if (language === 'ko') {
    return {
      title: '가계대출 세부 항목 추이',
      subtitle: '2016년~현재 잔액 전년 대비 (%) · 중국인민은행',
      latestWord: '최신',
      lowestSince2016: '2016년 이후 최저',
      highestSince2016: '2016년 이후 최고',
      peakWord: '고점',
      avgWord: '평균',
      latestLabel: '2026년 10월',
      unpublishedSuffix: '건 미발표 제외',
      names: {
        hh_ml_consumer: '중장기 소비대출(주택담보 중심)',
        hh_st_consumer: '단기 소비대출',
        hh_st_business: '단기 경영대출',
        hh_ml_business: '중장기 경영대출',
      } as Record<string, string>,
    };
  }
  if (language === 'fr') {
    return {
      title: 'Prêts aux ménages (2016–2026)',
      subtitle: 'Croissance annuelle des encours (%) · PBOC',
      latestWord: 'Dernier',
      lowestSince2016: 'plus bas depuis 2016',
      highestSince2016: 'plus haut depuis 2016',
      peakWord: 'Pic',
      avgWord: 'Moy.',
      latestLabel: 'Oct. 2026',
      unpublishedSuffix: 'non publiés exclus',
      names: {
        hh_ml_consumer: 'Conso moyen/long terme (immo.)',
        hh_st_consumer: 'Conso court terme',
        hh_st_business: 'Pro court terme',
        hh_ml_business: 'Pro moyen/long terme',
      } as Record<string, string>,
    };
  }
  if (language === 'ru') {
    return {
      title: 'Кредиты домохозяйствам (2016–2026)',
      subtitle: 'Годовой темп роста остатков (%) · НБК',
      latestWord: 'Посл.',
      lowestSince2016: 'минимум с 2016 г.',
      highestSince2016: 'максимум с 2016 г.',
      peakWord: 'Пик',
      avgWord: 'Сред.',
      latestLabel: 'Окт. 2026',
      unpublishedSuffix: 'неопубл. исключено',
      names: {
        hh_ml_consumer: 'Долгоср. потреб. (ипотека)',
        hh_st_consumer: 'Краткоср. потребительские',
        hh_st_business: 'Краткоср. бизнес-кредиты',
        hh_ml_business: 'Долгоср. бизнес-кредиты',
      } as Record<string, string>,
    };
  }
  return {
    title: 'Household Loans Breakdown',
    subtitle: 'Balance YoY Growth Since 2016 (%) · PBOC',
    latestWord: 'Latest',
    lowestSince2016: 'lowest since 2016',
    highestSince2016: 'highest since 2016',
    peakWord: 'Peak',
    avgWord: 'Avg',
    latestLabel: 'Oct 2026',
    unpublishedSuffix: 'unpublished excluded',
    names: {
      hh_ml_consumer: 'M/L Consumer Loans (Mortgages)',
      hh_st_consumer: 'Short-Term Consumer Loans',
      hh_st_business: 'Short-Term Business Loans',
      hh_ml_business: 'M/L Business Loans',
    } as Record<string, string>,
  };
}

const X_TICKS = [2016, 2018, 2020, 2022, 2024, 2026];

interface SubChartCardProps {
  item: HouseholdLoanSubIndicator;
  displayName: string;
  latestWord: string;
  lowestSince2016Label: string;
  highestSince2016Label: string;
  peakWord: string;
  avgWord: string;
  isZh: boolean;
  onSelect: (enrichedItem: HouseholdLoanSubIndicator) => void;
}

function formatSignedPct(v: number, decimals: number = 1): string {
  return `${v > 0 ? '+' : ''}${v.toFixed(decimals)}%`;
}

const HouseholdLoanSubCard: React.FC<SubChartCardProps> = ({
  item,
  displayName,
  latestWord,
  lowestSince2016Label,
  highestSince2016Label,
  peakWord,
  avgWord,
  isZh,
  onSelect,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Dynamically filter 2016-to-present published points and auto-compute all stats
  const filtered = useMemo(
    () => getFilteredHouseholdLoanData(item, '2016-01'),
    [item]
  );

  const pts = filtered.publishedPoints;
  const activePt =
    hoveredIdx !== null && pts[hoveredIdx]
      ? pts[hoveredIdx]
      : filtered.latestPoint;
  const isHovering = hoveredIdx !== null && pts[hoveredIdx] !== undefined;

  const { yMin, yMax } = useMemo(() => {
    const vals = pts.map((p) => p.value);
    const minData = vals.length > 0 ? Math.min(0, ...vals) : 0;
    const maxTick = vals.length > 0 ? Math.max(...item.yTicks, ...vals) : Math.max(...item.yTicks);
    const negSpan = minData < 0 ? Math.abs(minData) : 0;
    const bottomPad = Math.max(negSpan * 0.36, 4.5);
    const topPad = Math.max((maxTick - minData) * 0.1, 3.5);
    return {
      yMin: minData - bottomPad,
      yMax: maxTick + topPad,
    };
  }, [pts, item.yTicks]);

  const VB_W = 320;
  const VB_H = 148;
  const PAD_L = 36;
  const PAD_R = 14;
  const PAD_T = 10;
  const PAD_B = 22;
  const PLOT_W = VB_W - PAD_L - PAD_R;
  const PLOT_H = VB_H - PAD_T - PAD_B;

  const X_MIN = 2015.75;
  const X_MAX = 2027.15;

  const mapY = (v: number) => PAD_T + ((yMax - v) / Math.max(yMax - yMin, 0.1)) * PLOT_H;
  const mapX = (yearVal: number) =>
    PAD_L + ((yearVal - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;

  const polylinePoints = pts
    .map((p) => `${mapX(p.timeYear).toFixed(1)},${mapY(p.value).toFixed(1)}`)
    .join(' ');

  const latestPt = filtered.latestPoint;
  const signedActiveVal = activePt ? formatSignedPct(activePt.value, item.decimals) : '--';

  const statusText = isHovering && activePt
    ? `${activePt.period} · ${signedActiveVal}`
    : filtered.isLowestSince2016
    ? isZh
      ? `${latestWord} ${signedActiveVal}，${lowestSince2016Label}`
      : `${latestWord} ${signedActiveVal}, ${lowestSince2016Label}`
    : filtered.isHighestSince2016
    ? isZh
      ? `${latestWord} ${signedActiveVal}，${highestSince2016Label}`
      : `${latestWord} ${signedActiveVal}, ${highestSince2016Label}`
    : `${latestWord} ${signedActiveVal}`;

  const handleSvgPointerMove = (clientX: number, svgEl: SVGSVGElement | null) => {
    if (!svgEl || pts.length < 2) return;
    const rect = svgEl.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * VB_W;
    let best = 0;
    let minD = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.abs(mapX(pts[i].timeYear) - relX);
      if (d < minD) {
        minD = d;
        best = i;
      }
    }
    setHoveredIdx(best);
  };

  const handleCardClick = () => {
    const latestStr = latestPt ? formatSignedPct(latestPt.value, item.decimals) : item.latestVal;
    const peakLabel = filtered.maxPoint
      ? `${filtered.maxPoint.period.slice(0, 4)}${isZh ? '年高点' : ' Peak'}`
      : item.secondaryLabel;
    const peakVal = filtered.maxPoint
      ? formatSignedPct(filtered.maxPoint.value, item.decimals)
      : item.secondaryVal;

    onSelect({
      ...item,
      latestVal: latestStr,
      numericValue: latestPt ? latestPt.value : item.numericValue,
      changeYoY: latestStr,
      statusTag: filtered.isLowestSince2016
        ? lowestSince2016Label
        : filtered.isHighestSince2016
        ? highestSince2016Label
        : item.statusTag,
      secondaryLabel: peakLabel,
      secondaryVal: peakVal,
      history: pts.map((p) => ({ period: p.period, value: p.value })),
    });
  };

  // Auto-computed SVG callout box inside top-right open plot area
  const calloutPeakText = filtered.maxPoint
    ? `${peakWord} ${formatSignedPct(filtered.maxPoint.value, 1)} (${filtered.maxPoint.period.slice(2).replace('-', '/')})`
    : '';
  const calloutAvgText =
    filtered.meanValue !== null ? `${avgWord} ${formatSignedPct(filtered.meanValue, 1)}` : '';
  const calloutText = calloutAvgText ? `${calloutPeakText} · ${calloutAvgText}` : calloutPeakText;
  const calloutW = Math.min(168, Math.max(106, calloutText.length * 5.6 + 14));
  const calloutX = VB_W - PAD_R - calloutW;
  const calloutY = PAD_T + 1;

  return (
    <button
      type="button"
      onClick={handleCardClick}
      onMouseLeave={() => setHoveredIdx(null)}
      className="group h-full min-h-0 text-start rounded-2xl bg-neutral-50/90 dark:bg-neutral-800/70 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/12 hover:border-neutral-400/80 dark:hover:border-neutral-500 hover:bg-white dark:hover:bg-neutral-800 [.amoled-mode_&]:hover:bg-neutral-900 px-2 pt-2 pb-1.5 sm:px-3.5 sm:pt-3 sm:pb-2 [@media(max-height:560px)]:p-2 transition-all active:scale-[0.99] cursor-pointer flex flex-col justify-between gap-0.5 sm:gap-1 shadow-2xs"
    >
      {/* Colored Title & Dynamically Computed Status Subtitle */}
      <div className="ps-4 sm:ps-7 min-w-0 shrink-0">
        <h3
          className="text-xs sm:text-[13.5px] font-bold leading-snug truncate"
          style={{ color: item.accentHex }}
        >
          {displayName}
        </h3>
        <p
          className="text-[10.5px] sm:text-xs font-semibold tabular-nums leading-snug mt-0.5 truncate"
          style={{ color: item.accentHex }}
        >
          {statusText}
        </p>
      </div>

      {/* 2016–2026 Line Chart with Y-ticks, 0% solid baseline, auto-computed callout box & terminal marker */}
      <div className="econ-chart-cq w-full flex-1 min-h-0 flex items-center">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="econ-svg-responsive econ-svg-subcard overflow-visible touch-none"
          onMouseMove={(e) => handleSvgPointerMove(e.clientX, e.currentTarget)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Y-Axis Ticks & Horizontal Gridlines */}
          {item.yTicks.map((tickVal) => {
            const ty = mapY(tickVal);
            const isZero = tickVal === 0;
            return (
              <g key={tickVal}>
                <line
                  x1={PAD_L}
                  x2={VB_W - PAD_R}
                  y1={ty}
                  y2={ty}
                  stroke="currentColor"
                  className={
                    isZero
                      ? 'text-neutral-800 dark:text-neutral-200'
                      : 'text-neutral-300/80 dark:text-neutral-700/75'
                  }
                  strokeWidth={isZero ? '1.15' : '0.85'}
                  strokeDasharray={isZero ? undefined : '2.5 3'}
                />
                <text
                  x={PAD_L - 6}
                  y={ty + 3.5}
                  textAnchor="end"
                  className="fill-neutral-700 dark:fill-neutral-300 text-[10px] font-mono tabular-nums"
                >
                  {tickVal}%
                </text>
              </g>
            );
          })}

          {/* X-Axis Year Labels: 2016, 2018, 2020, 2022, 2024, 2026 */}
          {X_TICKS.map((yr) => (
            <text
              key={yr}
              x={mapX(yr)}
              y={VB_H - 4}
              textAnchor="middle"
              className="fill-neutral-700 dark:fill-neutral-300 text-[9.5px] font-mono tabular-nums"
            >
              {yr}
            </text>
          ))}

          {/* Auto-Computed Peak & Mean Annotation Callout Box */}
          {calloutText && (
            <g className="pointer-events-none">
              <rect
                x={calloutX}
                y={calloutY}
                width={calloutW}
                height={15}
                rx="4"
                className="fill-white/90 dark:fill-neutral-900/90 [.amoled-mode_&]:fill-neutral-950"
                stroke={item.accentHex}
                strokeOpacity="0.45"
                strokeWidth="0.9"
              />
              <text
                x={calloutX + calloutW / 2}
                y={calloutY + 10.5}
                textAnchor="middle"
                style={{ fill: item.accentHex }}
                className="text-[8.5px] font-mono font-semibold tabular-nums"
              >
                {calloutText}
              </text>
            </g>
          )}

          {/* Trajectory Line */}
          {pts.length >= 2 && (
            <polyline
              fill="none"
              stroke={item.accentHex}
              strokeWidth="2.3"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={polylinePoints}
            />
          )}

          {/* Hover Crosshair & Highlight Dot */}
          {isHovering && activePt && (
            <g>
              <line
                x1={mapX(activePt.timeYear)}
                x2={mapX(activePt.timeYear)}
                y1={PAD_T}
                y2={VB_H - PAD_B}
                stroke="currentColor"
                className="text-neutral-400/75 dark:text-neutral-500/75"
                strokeWidth="0.9"
                strokeDasharray="2 3"
              />
              <circle
                cx={mapX(activePt.timeYear)}
                cy={mapY(activePt.value)}
                r="4"
                fill={item.accentHex}
                className="stroke-neutral-900 dark:stroke-white"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Terminal Point Circle Marker */}
          {latestPt && (
            <circle
              cx={mapX(latestPt.timeYear)}
              cy={mapY(latestPt.value)}
              r="4.3"
              fill={item.accentHex}
              className="stroke-neutral-900 dark:stroke-white"
              strokeWidth="1.6"
            />
          )}
        </svg>
      </div>
    </button>
  );
};

export const HouseholdLoansModal: React.FC<HouseholdLoansModalProps> = ({
  open,
  language,
  onClose,
  onSelectSubIndicator,
}) => {
  const isRtl = isRtlLanguage(language);
  const isZh = isChineseLocale(language);
  const copy = useMemo(() => getCopy(language), [language]);

  useEffect(() => {
    if (!open) return;
    void fetchLiveMacroIndicators(true);
  }, [open]);

  useSystemBackLayer(
    open,
    onClose,
    BACK_PRIORITY.NESTED_MODAL,
    'household-loans-modal'
  );

  // Aggregate dynamic unpublished period count across all 4 sub-indicators
  const totalUnpublishedCount = useMemo(() => {
    return HOUSEHOLD_LOAN_SUB_INDICATORS.reduce((acc, item) => {
      return acc + getFilteredHouseholdLoanData(item, '2016-01').unpublishedPeriods.length;
    }, 0);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-3 pt-[max(0.4rem,env(safe-area-inset-top))] pb-[max(0.4rem,env(safe-area-inset-bottom))] bg-black/55 backdrop-blur-md select-none animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        className="econ-modal-cq w-full max-w-3xl [@media(max-height:560px)]:max-w-5xl max-h-[calc(100dvh-0.8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col overflow-hidden rounded-[22px] bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-black backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 [.amoled-mode_&]:border-white/15 shadow-2xl p-2.5 sm:p-4 [@media(max-height:560px)]:p-2.5 gap-1.5 sm:gap-2.5 [@media(max-height:560px)]:gap-1.5 animate-modal-sheet"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight truncate">
              {copy.title}
            </h2>
            <p className="text-[10.5px] sm:text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              {copy.subtitle} · {copy.latestLabel}
              {totalUnpublishedCount > 0 ? ` · ${totalUnpublishedCount}${copy.unpublishedSuffix}` : ''}
            </p>
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

        {/* 4 Sub-Indicator Cards: responsive via Container Queries (1-col narrow, 2x2 default, 4x1 wide/landscape) */}
        <div className="econ-loans-grid flex-1 min-h-0 overflow-hidden [@media(max-height:560px)]:grid-cols-4 [@media(max-height:560px)]:grid-rows-1 gap-1.5 sm:gap-2.5 [@media(max-height:560px)]:gap-2">
          {HOUSEHOLD_LOAN_SUB_INDICATORS.map((item) => (
            <HouseholdLoanSubCard
              key={item.id}
              item={item}
              displayName={copy.names[item.id] || item.title}
              latestWord={copy.latestWord}
              lowestSince2016Label={copy.lowestSince2016}
              highestSince2016Label={copy.highestSince2016}
              peakWord={copy.peakWord}
              avgWord={copy.avgWord}
              isZh={isZh}
              onSelect={onSelectSubIndicator}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
