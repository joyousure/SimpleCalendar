import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Language } from '../types/calendar';
import {
  MacroDualPoint,
  PmiComparisonSeries,
  PpiCpiComparisonSeries,
  IndustrialRetailComparisonSeries,
  TsfSectorComparisonSeries,
  TsfSectorKey,
  TsfSectorPoint,
  TsfSectorSeriesPoint,
  TsfSectorStat,
  BondYieldComparisonSeries,
  BondYieldTimeframe,
  fetchPmiComparisonSeries,
  fetchPpiCpiComparisonSeries,
  fetchIndustrialRetailComparisonSeries,
  fetchTsfSectorSeries,
  fetchBondYieldComparisonSeries,
} from '../utils/financeService';
import { isChineseLocale, isRtlLanguage } from '../utils/i18n';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';

export type MacroComparisonMode =
  | 'pmi_compare'
  | 'ppi_cpi_compare'
  | 'industrial_retail_compare'
  | 'tsf_sectors_compare'
  | 'bond_10y_compare';

interface MacroComparisonModalProps {
  mode: MacroComparisonMode | null;
  language: Language;
  onClose: () => void;
}

function getComparisonCopy(language: Language) {
  if (language === 'zh-TW') {
    return {
      pmiTitle: 'PMI 官方與民間口徑對比',
      pmiSubtitle: '近一年製造業景氣對比走勢 · 國家統計局 vs 標普全球',
      pmiPrimaryLabel: '官方PMI（國家統計局）',
      pmiSecondaryLabel: '民間PMI（標普全球）',
      pmiSpreadLabel: '口徑差（民間 - 官方）',
      pmiThresholdLabel: '50.0 榮枯線',
      pmiNote:
        '官方口徑數據採集至國家統計局（側重大中型及國有製造業樣本），民間口徑數據採集至標普全球（側重中小民營及出口導向企業）。50.0 為景氣擴張與收縮分界線。',
      ppiCpiTitle: 'PPI與CPI同比走勢',
      ppiCpiSubtitle: '工業品出廠價格與居民消費價格同比對比（%）',
      ppiLabel: 'PPI 當月同比',
      cpiLabel: 'CPI 當月同比',
      scissorsLabel: 'PPI - CPI 剪刀差',
      zeroLineLabel: '0.0% 零軸',
      ppiCpiNote:
        'PPI 反映上游工業與原材料價格景氣，CPI 反映終端消費與服務物價趨勢；兩者剪刀差收斂或擴張可輔助觀察上中下游利潤傳導與需求強弱。',
      indRetailTitle: '社零與工業增加值月度同比',
      indRetailSubtitle: '近一年規上工業增加值（扣除價格因素實際增速）與社會消費品零售總額（名義增速）走勢（%）',
      indLabel: '規上工業增加值（實際增速）',
      retailLabel: '社會消費品零售總額（名義增速）',
      indRetailSpreadLabel: '兩者差距（工業 - 社零）',
      gapBadgePrefix: '差距',
      avgGapLabel: '近一年均值差',
      indRetailNote:
        '對比近一年規上工業增加值當月實際同比（扣除價格因素）與社會消費品零售總額當月名義同比（1-2月合併口徑），清晰標註供給生產與終端消費之間的增速差距（百分點）。',
      tsfTitle: '社融增量各部門規模走勢',
      tsfSubtitle: '數據來源：中國人民銀行',
      tsfCaliberNote: '每期為截至當月的近12個月累計；居民=住戶貸款，其他=ABS與貸款核銷，企業為其餘',
      tsfCorpLabel: '企業部門',
      tsfGovtLabel: '政府部門',
      tsfHouseLabel: '居民部門',
      tsfOtherLabel: '其他',
      tsfCorpShort: '企業',
      tsfGovtShort: '政府',
      tsfHouseShort: '居民',
      tsfTotalLabel: '近12月合計',
      tsfSharePrefix: '佔比',
      tsfUnit: '萬億',
      tsfUnitFull: '萬億元',
      tsfPeakLabel: '峰值',
      tsfLowest2016: '2016年以來最低',
      tsfHighest2016: '2016年以來最高',
      tsfUnpublishedFiltered: '已自動過濾未公布項',
      tsfNote:
        '追蹤2016年至今各部門近12個月累計社融增量規模：政府債靠前發力、企業融資穩步支撐，居民部門淨融資創2016年以來新低。',
      bondTitle: '中美10年期國債收益率對比',
      bondSubtitle: '中國10年期國債 vs 美國10年期國債收益率及利差走勢（%）',
      bondCnLabel: '中國10年期國債',
      bondUsLabel: '美國10年期國債',
      bondSpreadLabel: '中美利差（中 - 美）',
      bondNote:
        '對比中美兩大基準無風險利率（10年期國債收益率）走勢及利差變化：利差反映跨國貨幣政策週期差異、通脹預期與跨境資金定價錨。',
      tfLabels: { '6M': '近6月', '1Y': '近1年', '2Y': '近2年', '5Y': '近5年', MAX: '2016至今' },
      syncing: '正在同步官方最新序列…',
    };
  }
  if (isChineseLocale(language)) {
    return {
      pmiTitle: 'PMI 官方与民间口径对比',
      pmiSubtitle: '近一年制造业景气对比走势 · 国家统计局 vs 标普全球',
      pmiPrimaryLabel: '官方PMI（国家统计局）',
      pmiSecondaryLabel: '民间PMI（标普全球）',
      pmiSpreadLabel: '口径差（民间 - 官方）',
      pmiThresholdLabel: '50.0 荣枯线',
      pmiNote:
        '官方口径数据采集至国家统计局（侧重大中型及国有制造样本），民间口径数据采集至标普全球（侧重中小民营及外向型企业样本）。50.0 虚线为制造业扩张与收缩荣枯线。',
      ppiCpiTitle: 'PPI与CPI同比走势',
      ppiCpiSubtitle: '工业生产者出厂价格与居民消费价格当月同比（%）',
      ppiLabel: 'PPI 同比',
      cpiLabel: 'CPI 同比',
      scissorsLabel: 'PPI - CPI 剪刀差',
      zeroLineLabel: '0.0% 零轴',
      ppiCpiNote:
        'PPI 反映工业上游生产端价格波动，CPI 反映终端消费品与服务物价水平；观察 PPI 与 CPI 剪刀差变化有助于研判上下游利润传导节奏。',
      indRetailTitle: '社零与工业增加值月度同比',
      indRetailSubtitle: '近一年规上工业增加值（扣除价格因素实际增速）与社会消费品零售总额（名义增速）走势（%）',
      indLabel: '规上工业增加值（实际增速）',
      retailLabel: '社会消费品零售总额（名义增速）',
      indRetailSpreadLabel: '两者差距（工业 - 社零）',
      gapBadgePrefix: '差距',
      avgGapLabel: '近一年均值差',
      indRetailNote:
        '对比近一年规上工业增加值当月实际同比（扣除价格因素）与社会消费品零售总额当月名义同比（1-2月合并统计），直接标注工业生产与社会零售之间的增速差距（百分点）。',
      tsfTitle: '社融增量各部门规模走势',
      tsfSubtitle: '数据来源：中国人民银行',
      tsfCaliberNote: '每期为截至当月的近12个月累计；居民=住户贷款，其他=ABS与贷款核销，企业为其余',
      tsfCorpLabel: '企业部门',
      tsfGovtLabel: '政府部门',
      tsfHouseLabel: '居民部门',
      tsfOtherLabel: '其他',
      tsfCorpShort: '企业',
      tsfGovtShort: '政府',
      tsfHouseShort: '居民',
      tsfTotalLabel: '近12月合计',
      tsfSharePrefix: '占比',
      tsfUnit: '万亿',
      tsfUnitFull: '万亿元',
      tsfPeakLabel: '峰值',
      tsfLowest2016: '2016年以来最低',
      tsfHighest2016: '2016年以来最高',
      tsfUnpublishedFiltered: '已自动过滤未公布项',
      tsfNote:
        '刻画2016年至今非金融企业、政府、居民（住户贷款）与其他（ABS及贷款核销）近12个月累计社融增量走势，自动过滤未公布项并实时计算各部门极值状态。',
      bondTitle: '中美10年期国债收益率对比',
      bondSubtitle: '中国10年期国债 vs 美国10年期国债收益率及中美利差走势（%）',
      bondCnLabel: '中国10年期国债',
      bondUsLabel: '美国10年期国债',
      bondSpreadLabel: '中美利差（中 - 美）',
      bondNote:
        '追踪中国10年期国债与美国10年期国债收益率曲线及利差（bp）走势：反映中美货币政策周期分化、通胀预期及跨境资本汇率定价锚变化。',
      tfLabels: { '6M': '近6月', '1Y': '近1年', '2Y': '近2年', '5Y': '近5年', MAX: '2016至今' },
      syncing: '正在同步最新统计序列…',
    };
  }
  return {
    pmiTitle: 'PMI: Official vs Private Sector',
    pmiSubtitle: 'Trailing 1-Year Comparison · NBS Official vs S&P Global',
    pmiPrimaryLabel: 'Official PMI (NBS)',
    pmiSecondaryLabel: 'Private PMI (S&P Global)',
    pmiSpreadLabel: 'Spread (Private - Official)',
    pmiThresholdLabel: '50.0 Boom-Bust Line',
    pmiNote:
      'Official Manufacturing PMI is surveyed by the National Bureau of Statistics (NBS), while the private-sector gauge is compiled by S&P Global. Readings above 50.0 indicate expansion.',
    ppiCpiTitle: 'PPI vs CPI YoY Trend',
    ppiCpiSubtitle: 'Producer Price Index vs Consumer Price Index YoY (%)',
    ppiLabel: 'PPI YoY',
    cpiLabel: 'CPI YoY',
    scissorsLabel: 'PPI - CPI Spread',
    zeroLineLabel: '0.0% Zero Line',
    ppiCpiNote:
      'PPI tracks upstream industrial factory-gate inflation while CPI measures downstream consumer prices. Tracking the PPI-CPI spread highlights margin and demand transmission.',
    indRetailTitle: 'Industrial Output vs Retail Sales YoY',
    indRetailSubtitle: 'Trailing 1Y Industrial Value-Added (Real) vs Total Retail Sales (Nominal) (%)',
    indLabel: 'Industrial Value-Added (Real)',
    retailLabel: 'Retail Sales (Nominal)',
    indRetailSpreadLabel: 'Spread (Ind - Retail)',
    gapBadgePrefix: 'Gap',
    avgGapLabel: '1Y Avg Gap',
    indRetailNote:
      'Compares trailing 1-year real YoY growth of industrial value-added above designated size against nominal YoY total retail sales (Jan-Feb combined), highlighting the production-consumption spread in percentage points.',
    tsfTitle: 'TSF Increment by Sector (2016–Present)',
    tsfSubtitle: 'Source: People’s Bank of China (PBOC)',
    tsfCaliberNote: 'Rolling 12-month cumulative increment; Household = household loans, Other = ABS & loan write-offs, Corporate = remainder',
    tsfCorpLabel: 'Corporate',
    tsfGovtLabel: 'Government',
    tsfHouseLabel: 'Household',
    tsfOtherLabel: 'Other',
    tsfCorpShort: 'Corp',
    tsfGovtShort: 'Govt',
    tsfHouseShort: 'Household',
    tsfTotalLabel: '12M Total',
    tsfSharePrefix: 'Share',
    tsfUnit: 'T',
    tsfUnitFull: 'Trillion RMB',
    tsfPeakLabel: 'Peak',
    tsfLowest2016: 'Lowest since 2016',
    tsfHighest2016: 'Highest since 2016',
    tsfUnpublishedFiltered: 'Unpublished items filtered',
    tsfNote:
      'Tracks rolling 12-month cumulative TSF increments since 2016 across Corporate, Government, Household, and Other sectors, automatically filtering unpublished records and computing real-time extremes.',
    bondTitle: 'China vs US 10Y Treasury Yields',
    bondSubtitle: 'China 10Y vs US 10Y Sovereign Bond Yield & Spread (%)',
    bondCnLabel: 'China 10Y Yield',
    bondUsLabel: 'US 10Y Yield',
    bondSpreadLabel: 'CN - US Spread',
    bondNote:
      'Compares 10-year sovereign benchmark yields and cross-border basis-point spreads between China and the United States, reflecting divergent monetary cycles and FX rate anchors.',
    tfLabels: { '6M': '6M', '1Y': '1Y', '2Y': '2Y', '5Y': '5Y', MAX: '2016+' },
    syncing: 'Syncing macro comparison series…',
  };
}

export const MacroComparisonModal: React.FC<MacroComparisonModalProps> = ({
  mode,
  language,
  onClose,
}) => {
  const isRtl = isRtlLanguage(language);
  const copy = useMemo(() => getComparisonCopy(language), [language]);

  const [pmiData, setPmiData] = useState<PmiComparisonSeries | null>(null);
  const [ppiCpiData, setPpiCpiData] = useState<PpiCpiComparisonSeries | null>(null);
  const [indRetailData, setIndRetailData] = useState<IndustrialRetailComparisonSeries | null>(null);
  const [tsfSectorData, setTsfSectorData] = useState<TsfSectorComparisonSeries | null>(null);
  const [bondData, setBondData] = useState<BondYieldComparisonSeries | null>(null);

  const [timeframe, setTimeframe] = useState<'1Y' | '2Y' | '5Y' | 'MAX'>('1Y');
  const [bondTimeframe, setBondTimeframe] = useState<BondYieldTimeframe>('1Y');
  const [isLoading, setIsLoading] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!mode) return;
    setHoverIdx(null);
    let active = true;
    setIsLoading(true);
    if (mode === 'pmi_compare') {
      fetchPmiComparisonSeries(true, timeframe)
        .then((res) => {
          if (active) setPmiData(res);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    } else if (mode === 'industrial_retail_compare') {
      fetchIndustrialRetailComparisonSeries(true, timeframe)
        .then((res) => {
          if (active) setIndRetailData(res);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    } else if (mode === 'tsf_sectors_compare') {
      fetchTsfSectorSeries(true)
        .then((res) => {
          if (active) setTsfSectorData(res);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    } else if (mode === 'bond_10y_compare') {
      fetchBondYieldComparisonSeries(bondTimeframe, true)
        .then((res) => {
          if (active) setBondData(res);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    } else {
      fetchPpiCpiComparisonSeries(timeframe, true)
        .then((res) => {
          if (active) setPpiCpiData(res);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [mode, timeframe, bondTimeframe]);

  useSystemBackLayer(
    Boolean(mode),
    onClose,
    BACK_PRIORITY.INNER_OVERLAY,
    'macro-comparison-modal'
  );

  if (!mode) return null;

  const isPmi = mode === 'pmi_compare';
  const isIndRetail = mode === 'industrial_retail_compare';
  const isTsfSectors = mode === 'tsf_sectors_compare';
  const isBondCompare = mode === 'bond_10y_compare';

  const tsfPoints: TsfSectorPoint[] = isTsfSectors ? tsfSectorData?.points || [] : [];
  const activeTsfPt =
    hoverIdx !== null && tsfPoints[hoverIdx]
      ? tsfPoints[hoverIdx]
      : tsfPoints[tsfPoints.length - 1] || null;

  const dualPoints: MacroDualPoint[] = isPmi
    ? pmiData?.points || []
    : isIndRetail
    ? indRetailData?.points || []
    : isBondCompare
    ? bondData?.points || []
    : ppiCpiData?.points || [];
  const activeDualPt =
    hoverIdx !== null && dualPoints[hoverIdx]
      ? dualPoints[hoverIdx]
      : dualPoints[dualPoints.length - 1] || null;

  const pointCount = isTsfSectors ? tsfPoints.length : dualPoints.length;

  const title = isTsfSectors
    ? copy.tsfTitle
    : isBondCompare
    ? copy.bondTitle
    : isPmi
    ? copy.pmiTitle
    : isIndRetail
    ? copy.indRetailTitle
    : copy.ppiCpiTitle;
  const subtitle = isTsfSectors
    ? copy.tsfSubtitle
    : isBondCompare
    ? copy.bondSubtitle
    : isPmi
    ? copy.pmiSubtitle
    : isIndRetail
    ? copy.indRetailSubtitle
    : copy.ppiCpiSubtitle;

  const primaryLabel = isBondCompare
    ? copy.bondCnLabel
    : isPmi
    ? copy.pmiPrimaryLabel
    : isIndRetail
    ? copy.indLabel
    : copy.ppiLabel;
  const secondaryLabel = isBondCompare
    ? copy.bondUsLabel
    : isPmi
    ? copy.pmiSecondaryLabel
    : isIndRetail
    ? copy.retailLabel
    : copy.cpiLabel;
  const spreadLabel = isBondCompare
    ? copy.bondSpreadLabel
    : isPmi
    ? copy.pmiSpreadLabel
    : isIndRetail
    ? copy.indRetailSpreadLabel
    : copy.scissorsLabel;
  const refValue = isPmi ? 50.0 : isBondCompare ? null : 0.0;
  const refLabel = isPmi ? copy.pmiThresholdLabel : copy.zeroLineLabel;

  const primaryColor = isBondCompare
    ? '#E11D48'
    : isPmi
    ? '#4F46E5'
    : isIndRetail
    ? '#059669'
    : '#EA580C';
  const secondaryColor = isBondCompare ? '#2563EB' : isPmi ? '#E11D48' : '#2563EB';

  // TSF 4-sector colors matching PBOC increment chart
  const corpColor = '#4B9CE2';
  const govtColor = '#D44E54';
  const houseColor = '#49BA76';
  const otherColor = '#9D7AC4';

  const formatDualVal = (v: number) => {
    if (isPmi) return v.toFixed(1);
    if (isBondCompare) return `${v.toFixed(2)}%`;
    return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
  };

  // Chart Geometry
  const VB_W = isTsfSectors ? 600 : 560;
  const VB_H = isTsfSectors ? 256 : 196;
  const PAD_L = isTsfSectors ? 38 : 48;
  const PAD_R = isTsfSectors ? 44 : isBondCompare ? 30 : 90;
  const PAD_T = isTsfSectors ? 14 : 18;
  const PAD_B = isTsfSectors ? 34 : 24;
  const PLOT_W = VB_W - PAD_L - PAD_R;
  const PLOT_H = VB_H - PAD_T - PAD_B;

  const tsfStats = isTsfSectors ? tsfSectorData?.sectorStats : undefined;
  const tsfAllSeriesVals = isTsfSectors && tsfStats
    ? [
        ...tsfStats.corp.points.map((p) => p.value),
        ...tsfStats.govt.points.map((p) => p.value),
        ...tsfStats.household.points.map((p) => p.value),
        ...tsfStats.other.points.map((p) => p.value),
      ]
    : [];

  const allVals = isTsfSectors
    ? tsfAllSeriesVals
    : dualPoints.flatMap((p) => [p.primaryValue, p.secondaryValue]);
  if (refValue !== null) allVals.push(refValue);

  const rawMin = allVals.length > 0 ? Math.min(...allVals) : 0;
  const rawMax = allVals.length > 0 ? Math.max(...allVals) : 10;
  const rawSpan = Math.max(rawMax - rawMin, isPmi ? 1.8 : isBondCompare ? 0.6 : isTsfSectors ? 25 : 2.0);

  const tsfYTickStep = rawMax > 25 ? 5 : 5;
  const tsfTopTick = Math.max(25, Math.ceil(rawMax / tsfYTickStep) * tsfYTickStep);
  const tsfMinAxis = Math.min(-3.4, rawMin - 1.4);

  const yMin = isTsfSectors ? tsfMinAxis : rawMin - rawSpan * 0.16;
  const yMax = isTsfSectors ? tsfTopTick + 0.8 : rawMax + rawSpan * 0.16;
  const ySpan = Math.max(yMax - yMin, 0.1);

  const mapY = (v: number) => PAD_T + ((yMax - v) / ySpan) * PLOT_H;

  const tsfTimeYears = isTsfSectors ? tsfPoints.map((p) => p.timeYear) : [];
  const tsfYearMin = tsfTimeYears.length > 0 ? Math.min(2016, tsfTimeYears[0]) - 0.18 : 2015.82;
  const tsfYearMax = tsfTimeYears.length > 0 ? Math.max(2026.75, tsfTimeYears[tsfTimeYears.length - 1]) + 0.18 : 2026.95;

  const mapXByYear = (yearVal: number) =>
    PAD_L + ((yearVal - tsfYearMin) / Math.max(tsfYearMax - tsfYearMin, 0.1)) * PLOT_W;

  const mapX = (i: number) => {
    if (isTsfSectors && tsfPoints[i]) {
      return mapXByYear(tsfPoints[i].timeYear);
    }
    return pointCount <= 1 ? PAD_L : PAD_L + (i / (pointCount - 1)) * PLOT_W;
  };

  // Build SVG path splitting across any unpublished month gaps (> 0.12 year gap)
  const buildTsfPath = (pts: TsfSectorSeriesPoint[]) => {
    if (pts.length === 0) return '';
    const segments: string[] = [];
    pts.forEach((pt, idx) => {
      const x = mapXByYear(pt.timeYear).toFixed(1);
      const y = mapY(pt.value).toFixed(1);
      const prev = idx > 0 ? pts[idx - 1] : null;
      const hasGap = prev ? pt.timeYear - prev.timeYear > 0.13 : true;
      segments.push(`${hasGap ? 'M' : 'L'}${x},${y}`);
    });
    return segments.join(' ');
  };

  const primaryLine = !isTsfSectors
    ? dualPoints.map((p, idx) => `${mapX(idx).toFixed(1)},${mapY(p.primaryValue).toFixed(1)}`).join(' ')
    : '';
  const secondaryLine = !isTsfSectors
    ? dualPoints.map((p, idx) => `${mapX(idx).toFixed(1)},${mapY(p.secondaryValue).toFixed(1)}`).join(' ')
    : '';

  const tsfCorpPath = isTsfSectors && tsfStats ? buildTsfPath(tsfStats.corp.points) : '';
  const tsfGovtPath = isTsfSectors && tsfStats ? buildTsfPath(tsfStats.govt.points) : '';
  const tsfHousePath = isTsfSectors && tsfStats ? buildTsfPath(tsfStats.household.points) : '';
  const tsfOtherPath = isTsfSectors && tsfStats ? buildTsfPath(tsfStats.other.points) : '';

  const spreadRibbonPoints =
    !isTsfSectors && dualPoints.length >= 2
      ? [
          ...dualPoints.map((p, idx) => `${mapX(idx).toFixed(1)},${mapY(p.primaryValue).toFixed(1)}`),
          ...dualPoints
            .slice()
            .reverse()
            .map((p, revIdx) => {
              const origIdx = dualPoints.length - 1 - revIdx;
              return `${mapX(origIdx).toFixed(1)},${mapY(p.secondaryValue).toFixed(1)}`;
            }),
        ].join(' ')
      : '';

  const refY = refValue !== null ? mapY(refValue) : null;
  const tsfYTicks = Array.from(
    { length: Math.floor(tsfTopTick / tsfYTickStep) + 1 },
    (_, idx) => tsfTopTick - idx * tsfYTickStep
  );
  const yTicks = isTsfSectors
    ? tsfYTicks
    : [yMax - ySpan * 0.08, (yMax + yMin) / 2, yMin + ySpan * 0.08];
  const lastIdx = pointCount - 1;
  const midIdx = Math.floor(pointCount / 2);
  const gapIdx = hoverIdx !== null && dualPoints[hoverIdx] ? hoverIdx : lastIdx;
  const gapPt = !isTsfSectors && gapIdx >= 0 ? dualPoints[gapIdx] : null;

  const tsfYearTicks = isTsfSectors
    ? Array.from(
        {
          length:
            Math.max(2026, Math.floor(tsfYearMax - 0.18)) -
            Math.min(2016, Math.ceil(tsfYearMin)) +
            1,
        },
        (_, idx) => Math.min(2016, Math.ceil(tsfYearMin)) + idx
      )
    : [];

  // Helper to resolve vertical label collisions for start/end annotations
  const resolveVerticalOffsets = (
    items: Array<{ key: string; rawY: number; text: string; color: string; x: number }>
  ) => {
    const sorted = [...items].sort((a, b) => a.rawY - b.rawY);
    const minGap = 11.5;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].rawY - sorted[i - 1].rawY < minGap) {
        sorted[i].rawY = sorted[i - 1].rawY + minGap;
      }
    }
    const maxAllowedY = PAD_T + PLOT_H - 4;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].rawY > maxAllowedY) sorted[i].rawY = maxAllowedY;
      if (i > 0 && sorted[i].rawY - sorted[i - 1].rawY < minGap) {
        sorted[i - 1].rawY = sorted[i].rawY - minGap;
      }
    }
    return sorted;
  };

  const tsfStartLabels = isTsfSectors && tsfStats
    ? resolveVerticalOffsets(
        (
          [
            { key: 'corp', stat: tsfStats.corp, color: corpColor },
            { key: 'govt', stat: tsfStats.govt, color: govtColor },
            { key: 'household', stat: tsfStats.household, color: houseColor },
            { key: 'other', stat: tsfStats.other, color: otherColor },
          ] as Array<{ key: TsfSectorKey; stat: TsfSectorStat; color: string }>
        )
          .filter((s) => s.stat.startPoint !== null)
          .map((s) => ({
            key: s.key,
            rawY: mapY(s.stat.startPoint!.value) + 3,
            text: s.stat.startPoint!.value.toFixed(1),
            color: s.color,
            x: mapXByYear(s.stat.startPoint!.timeYear) - 5,
          }))
      )
    : [];

  const tsfEndLabels = isTsfSectors && tsfStats
    ? resolveVerticalOffsets(
        (
          [
            { key: 'corp', stat: tsfStats.corp, color: corpColor },
            { key: 'govt', stat: tsfStats.govt, color: govtColor },
            { key: 'household', stat: tsfStats.household, color: houseColor },
            { key: 'other', stat: tsfStats.other, color: otherColor },
          ] as Array<{ key: TsfSectorKey; stat: TsfSectorStat; color: string }>
        )
          .filter((s) => s.stat.latestPoint !== null)
          .map((s) => ({
            key: s.key,
            rawY: mapY(s.stat.latestPoint!.value) + 3.5,
            text: s.stat.latestPoint!.value.toFixed(1),
            color: s.color,
            x: mapXByYear(s.stat.latestPoint!.timeYear) + 7,
          }))
      )
    : [];

  // Dynamic curved-arrow peak callout boxes for Corporate, Household, and Government
  const tsfPeakCallouts = (() => {
    if (!isTsfSectors || !tsfStats) return [];
    const boxW = 104;
    const boxH = 31;
    const isZhLocal = isChineseLocale(language);
    const formatPeakDate = (periodKey: string) => {
      const [yy, mm] = periodKey.split('-');
      const mNum = parseInt(mm, 10);
      return isZhLocal ? `${yy}年${mNum}月` : `${yy}-${mm}`;
    };

    const defs: Array<{
      key: TsfSectorKey;
      stat: TsfSectorStat;
      shortName: string;
      color: string;
      dx: number;
      dy: number;
    }> = [
      {
        key: 'corp',
        stat: tsfStats.corp,
        shortName: copy.tsfCorpShort,
        color: corpColor,
        dx: -158,
        dy: -8,
      },
      {
        key: 'household',
        stat: tsfStats.household,
        shortName: copy.tsfHouseShort,
        color: houseColor,
        dx: -130,
        dy: -76,
      },
      {
        key: 'govt',
        stat: tsfStats.govt,
        shortName: copy.tsfGovtShort,
        color: govtColor,
        dx: -132,
        dy: 26,
      },
    ];

    const zeroY = mapY(0);
    const placed = defs
      .filter((d) => d.stat.peakPoint !== null)
      .map((d) => {
        const peak = d.stat.peakPoint!;
        const px = mapXByYear(peak.timeYear);
        const py = mapY(peak.value);
        const bx = Math.min(
          Math.max(px + d.dx, PAD_L + 4),
          VB_W - PAD_R - boxW - 4
        );
        const by = Math.min(
          Math.max(py + d.dy, PAD_T + 2),
          zeroY - boxH - 8
        );
        return {
          key: d.key,
          color: d.color,
          px,
          py,
          bx,
          by,
          boxW,
          boxH,
          line1: isZhLocal
            ? `${d.shortName}${copy.tsfPeakLabel}${peak.value.toFixed(1)}${copy.tsfUnit}`
            : `${d.shortName} ${copy.tsfPeakLabel} ${peak.value.toFixed(1)}${copy.tsfUnit}`,
          line2: formatPeakDate(peak.periodKey),
        };
      });

    // Resolve any vertical overlap between boxes cleanly
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const a = placed[i];
          const b = placed[j];
          const overlapX = a.bx < b.bx + b.boxW + 6 && a.bx + a.boxW + 6 > b.bx;
          const overlapY = a.by < b.by + b.boxH + 6 && a.by + a.boxH + 6 > b.by;
          if (overlapX && overlapY) {
            b.by = Math.min(zeroY - boxH - 8, a.by + a.boxH + 8);
          }
        }
      }
    }

    return placed.map((item) => {
      const boxCy = item.by + item.boxH / 2;
      let startX = item.bx + item.boxW;
      let startY = boxCy;
      if (item.px < item.bx) {
        startX = item.bx;
      } else if (item.key === 'household' && item.py > item.by + item.boxH) {
        startX = item.bx + item.boxW * 0.56;
        startY = item.by + item.boxH;
      } else if (item.key === 'govt' && item.py < item.by) {
        startX = item.bx + item.boxW * 0.78;
        startY = item.by;
      } else if (item.key === 'corp') {
        startX = item.bx + item.boxW;
        startY = item.by + item.boxH * 0.35;
      }

      const dx = item.px - startX;
      const dy = item.py - startY;
      const dist = Math.hypot(dx, dy) || 1;
      const endX = item.px - (dx / dist) * 4.5;
      const endY = item.py - (dy / dist) * 4.5;
      const ctrlX =
        item.key === 'household'
          ? (startX + endX) / 2 - 10
          : item.key === 'govt'
          ? (startX + endX) / 2 + 2
          : (startX + endX) / 2 + 4;
      const ctrlY =
        item.key === 'household'
          ? (startY + endY) / 2 + 12
          : item.key === 'govt'
          ? (startY + endY) / 2 - 6
          : (startY + endY) / 2 - 12;
      const angle = Math.atan2(endY - ctrlY, endX - ctrlX);
      const arrowLen = 6;
      const p1x = endX - arrowLen * Math.cos(angle - Math.PI / 7);
      const p1y = endY - arrowLen * Math.sin(angle - Math.PI / 7);
      const p2x = endX - arrowLen * Math.cos(angle + Math.PI / 7);
      const p2y = endY - arrowLen * Math.sin(angle + Math.PI / 7);

      return {
        ...item,
        arrowPath: `M${startX.toFixed(1)},${startY.toFixed(1)} Q${ctrlX.toFixed(1)},${ctrlY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`,
        arrowHeadPoints: `${endX.toFixed(1)},${endY.toFixed(1)} ${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}`,
      };
    });
  })();

  const handlePointerMove = (clientX: number) => {
    if (!svgRef.current || pointCount < 2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * VB_W;
    let closest = 0;
    let best = Infinity;
    for (let i = 0; i < pointCount; i++) {
      const dist = Math.abs(mapX(i) - relX);
      if (dist < best) {
        best = dist;
        closest = i;
      }
    }
    setHoverIdx(closest);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-1.5 sm:p-3 pt-[max(0.4rem,env(safe-area-inset-top))] pb-[max(0.4rem,env(safe-area-inset-bottom))] bg-black/60 backdrop-blur-md select-none animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="econ-modal-cq w-full max-w-2xl [@media(max-height:560px)]:max-w-5xl max-h-[calc(100dvh-0.8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col overflow-hidden rounded-[22px] bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-black backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 [.amoled-mode_&]:border-white/15 shadow-2xl p-2.5 sm:p-3.5 [@media(max-height:560px)]:p-2 gap-1.5 sm:gap-2 [@media(max-height:560px)]:gap-1.5 animate-modal-sheet"
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-start justify-between gap-2 pb-1 border-b border-neutral-200/80 dark:border-neutral-800 [.amoled-mode_&]:border-white/10">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg [@media(max-height:560px)]:text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight truncate">
              {title}
            </h2>
            {isTsfSectors ? (
              <div className="mt-0.5 space-y-0.5">
                <p className="text-[10px] sm:text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                  {copy.tsfSubtitle}
                </p>
                {tsfStats && (() => {
                  const hVal = tsfStats.household.latestPoint?.value ?? tsfSectorData?.householdLatest ?? 0;
                  const gVal = tsfStats.govt.latestPoint?.value ?? tsfSectorData?.govtLatest ?? 0;
                  const isZhLocal = isChineseLocale(language);
                  const isTwLocal = language === 'zh-TW';
                  const dynamicUnitSummary = isZhLocal
                    ? isTwLocal
                      ? `單位：${copy.tsfUnitFull}；近12個月居民${hVal < 0 ? `淨減少${Math.abs(hVal).toFixed(2)}` : `淨融資${hVal.toFixed(2)}`}${copy.tsfUnit}，政府${gVal < 0 ? `淨減少${Math.abs(gVal).toFixed(1)}` : `淨融資${gVal.toFixed(1)}`}${copy.tsfUnit}`
                      : `单位：${copy.tsfUnitFull}；近12个月居民${hVal < 0 ? `净减少${Math.abs(hVal).toFixed(2)}` : `净融资${hVal.toFixed(2)}`}${copy.tsfUnit}，政府${gVal < 0 ? `净减少${Math.abs(gVal).toFixed(1)}` : `净融资${gVal.toFixed(1)}`}${copy.tsfUnit}`
                    : `Unit: ${copy.tsfUnitFull}; Trailing 12M Household ${hVal < 0 ? `-${Math.abs(hVal).toFixed(2)}` : `+${hVal.toFixed(2)}`}${copy.tsfUnit}, Govt ${gVal.toFixed(1)}${copy.tsfUnit}`;
                  return (
                    <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-neutral-700 dark:text-neutral-200 leading-snug tabular-nums">
                      {dynamicUnitSummary}
                    </p>
                  );
                })()}
                <p className="text-[9.5px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug truncate">
                  {copy.tsfCaliberNote}
                  {tsfSectorData && tsfSectorData.unpublishedCount > 0
                    ? ` · ${copy.tsfUnpublishedFiltered}: ${tsfSectorData.unpublishedItems
                        .slice(0, 3)
                        .map((u) => u.fullTimeLabel)
                        .join('、')}`
                    : ''}
                </p>
              </div>
            ) : (
              <p className="text-[10.5px] sm:text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                {subtitle}
              </p>
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

        {/* Comparison Chart Card */}
        <div className="flex-1 min-h-0 rounded-2xl bg-neutral-100/85 dark:bg-neutral-800/75 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/75 dark:border-neutral-700/70 [.amoled-mode_&]:border-white/12 p-2 sm:p-3 [@media(max-height:560px)]:p-2 flex flex-col justify-between gap-1.5 sm:gap-2 [@media(max-height:560px)]:grid [@media(max-height:560px)]:grid-cols-12 [@media(max-height:560px)]:gap-2.5 overflow-hidden">
          <div className="shrink-0 [@media(max-height:560px)]:col-span-4 [@media(max-height:560px)]:flex [@media(max-height:560px)]:flex-col [@media(max-height:560px)]:justify-between [@media(max-height:560px)]:gap-1.5 [@media(max-height:560px)]:order-2 [@media(max-height:560px)]:border-s [@media(max-height:560px)]:border-neutral-200/80 dark:[@media(max-height:560px)]:border-neutral-700/70 [@media(max-height:560px)]:ps-2.5">
          {/* Top KPI Strip */}
          {isTsfSectors ? (
            <div className="econ-kpi-grid grid grid-cols-2 sm:grid-cols-4 [@media(max-height:560px)]:grid-cols-2 gap-1 sm:gap-1.5">
              {(
                [
                  {
                    key: 'corp' as TsfSectorKey,
                    label: copy.tsfCorpLabel,
                    color: corpColor,
                    val: activeTsfPt?.corpScale ?? tsfStats?.corp.latestPoint?.value ?? null,
                    decimals: 1,
                    stat: tsfStats?.corp,
                  },
                  {
                    key: 'govt' as TsfSectorKey,
                    label: copy.tsfGovtLabel,
                    color: govtColor,
                    val: activeTsfPt?.govtScale ?? tsfStats?.govt.latestPoint?.value ?? null,
                    decimals: 1,
                    stat: tsfStats?.govt,
                  },
                  {
                    key: 'household' as TsfSectorKey,
                    label: copy.tsfHouseLabel,
                    color: houseColor,
                    val: activeTsfPt?.householdScale ?? tsfStats?.household.latestPoint?.value ?? null,
                    decimals: 2,
                    stat: tsfStats?.household,
                  },
                  {
                    key: 'other' as TsfSectorKey,
                    label: copy.tsfOtherLabel,
                    color: otherColor,
                    val: activeTsfPt?.otherScale ?? tsfStats?.other.latestPoint?.value ?? null,
                    decimals: 1,
                    stat: tsfStats?.other,
                  },
                ]
              ).map((card) => {
                const isHovering = hoverIdx !== null && activeTsfPt !== null;
                const extremeLabel = card.stat
                  ? card.stat.isLowestSince2016
                    ? copy.tsfLowest2016
                    : card.stat.isHighestSince2016
                    ? copy.tsfHighest2016
                    : card.stat.peakPoint
                    ? `${copy.tsfPeakLabel} ${card.stat.peakPoint.value.toFixed(1)} (${card.stat.peakPoint.periodKey.slice(2).replace('-', '/')})`
                    : ''
                  : '';
                return (
                  <div
                    key={card.key}
                    className="rounded-xl bg-white/85 dark:bg-neutral-900/80 [.amoled-mode_&]:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-700/70 px-2 py-1 [@media(max-height:560px)]:py-1 min-w-0"
                  >
                    <div className="flex items-center gap-1 text-[9.5px] sm:text-[10px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
                      <span className="truncate">{card.label}</span>
                    </div>
                    <div
                      className="text-xs sm:text-sm [@media(max-height:560px)]:text-xs font-extrabold font-mono tabular-nums mt-0.5 truncate"
                      style={{ color: card.color }}
                    >
                      {card.val !== null ? `${card.val.toFixed(card.decimals)} ${copy.tsfUnit}` : '--'}
                    </div>
                    <div className="text-[9px] font-medium text-neutral-500 dark:text-neutral-400 truncate tabular-nums">
                      {isHovering && activeTsfPt ? activeTsfPt.fullTimeLabel : extremeLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 [@media(max-height:560px)]:grid-cols-1 gap-1.5 sm:gap-2">
              <div className="rounded-xl bg-white/85 dark:bg-neutral-900/80 [.amoled-mode_&]:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-700/70 px-2 py-1.5 [@media(max-height:560px)]:py-1">
                <div className="flex items-center gap-1 text-[10px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: primaryColor }} />
                  <span className="truncate">{primaryLabel}</span>
                </div>
                <div className="text-sm sm:text-lg [@media(max-height:560px)]:text-sm font-extrabold font-mono tabular-nums text-neutral-950 dark:text-white mt-0.5">
                  {activeDualPt ? formatDualVal(activeDualPt.primaryValue) : '--'}
                </div>
              </div>

              <div className="rounded-xl bg-white/85 dark:bg-neutral-900/80 [.amoled-mode_&]:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-700/70 px-2 py-1.5 [@media(max-height:560px)]:py-1">
                <div className="flex items-center gap-1 text-[10px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: secondaryColor }} />
                  <span className="truncate">{secondaryLabel}</span>
                </div>
                <div className="text-sm sm:text-lg [@media(max-height:560px)]:text-sm font-extrabold font-mono tabular-nums text-neutral-950 dark:text-white mt-0.5">
                  {activeDualPt ? formatDualVal(activeDualPt.secondaryValue) : '--'}
                </div>
              </div>

              <div className="rounded-xl bg-white/85 dark:bg-neutral-900/80 [.amoled-mode_&]:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-700/70 px-2 py-1.5 [@media(max-height:560px)]:py-1">
                <div className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                  {spreadLabel}
                </div>
                <div
                  className={`text-sm sm:text-lg [@media(max-height:560px)]:text-sm font-extrabold font-mono tabular-nums mt-0.5 ${
                    (activeDualPt?.spread ?? 0) >= 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {activeDualPt
                    ? isBondCompare
                      ? `${activeDualPt.spread > 0 ? '+' : ''}${Math.round(activeDualPt.spread * 100)} bp`
                      : `${activeDualPt.spread > 0 ? '+' : ''}${activeDualPt.spread.toFixed(1)} pt`
                    : '--'}
                </div>
              </div>
            </div>
          )}
          {!isPmi && (
            <div className="hidden [@media(max-height:560px)]:block text-[10px] text-neutral-600 dark:text-neutral-300 leading-snug line-clamp-3">
              {isTsfSectors
                ? copy.tsfNote
                : isBondCompare
                ? copy.bondNote
                : isIndRetail
                ? copy.indRetailNote
                : copy.ppiCpiNote}
            </div>
          )}
          </div>

          <div className="flex-1 min-h-0 flex flex-col justify-between gap-1 [@media(max-height:560px)]:col-span-8 [@media(max-height:560px)]:order-1">
          {/* Subheader: Active Timestamp + Mode Controls */}
          <div className="shrink-0 flex items-center justify-between gap-2">
            <span className="text-[10.5px] sm:text-[11px] font-semibold font-mono tabular-nums text-neutral-600 dark:text-neutral-300">
              {isTsfSectors
                ? activeTsfPt?.fullTimeLabel || '--'
                : activeDualPt?.fullTimeLabel || '--'}
            </span>
            {isTsfSectors && activeTsfPt && (
              <span className="px-2 py-0.5 rounded-md bg-blue-500/12 border border-blue-500/25 text-[10px] sm:text-[10.5px] font-bold font-mono tabular-nums text-blue-700 dark:text-blue-300">
                {copy.tsfTotalLabel}: {activeTsfPt.totalScale.toFixed(1)} {copy.tsfUnit}
              </span>
            )}
            {isIndRetail && indRetailData && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/12 border border-emerald-500/25 text-[10.5px] font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
                {copy.avgGapLabel}: {indRetailData.avgSpread > 0 ? '+' : ''}
                {indRetailData.avgSpread.toFixed(1)} pt
              </span>
            )}
            {isBondCompare && (
              <div className="grid grid-cols-5 gap-0.5 p-0.5 rounded-full bg-neutral-200/80 dark:bg-white/[0.08] border border-neutral-200/70 dark:border-white/10">
                {(['6M', '1Y', '2Y', '5Y', 'MAX'] as const).map((tf) => {
                  const active = bondTimeframe === tf;
                  return (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => {
                        setBondTimeframe(tf);
                        setHoverIdx(null);
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        active
                          ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {copy.tfLabels[tf]}
                    </button>
                  );
                })}
              </div>
            )}
            {!isBondCompare && !isTsfSectors && (
              <div className="grid grid-cols-4 gap-0.5 p-0.5 rounded-full bg-neutral-200/80 dark:bg-white/[0.08] border border-neutral-200/70 dark:border-white/10">
                {(['1Y', '2Y', '5Y', 'MAX'] as const).map((tf) => {
                  const active = timeframe === tf;
                  return (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => {
                        setTimeframe(tf);
                        setHoverIdx(null);
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        active
                          ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {copy.tfLabels[tf]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Multi-Line Comparison SVG Chart */}
          <div className="econ-chart-cq relative w-full flex-1 min-h-[120px] sm:min-h-[168px] [@media(max-height:560px)]:min-h-[112px] flex items-center">
            {isLoading && pointCount === 0 ? (
              <div className="w-full h-28 sm:h-40 [@media(max-height:560px)]:h-28 flex flex-col items-center justify-center gap-1.5 text-xs text-neutral-400">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                <span>{copy.syncing}</span>
              </div>
            ) : (
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className={`econ-svg-responsive ${
                  isTsfSectors ? 'econ-svg-tsf' : 'econ-svg-compare'
                } overflow-visible touch-none cursor-crosshair`}
                onMouseMove={(e) => handlePointerMove(e.clientX)}
                onMouseLeave={() => setHoverIdx(null)}
                onTouchMove={(e) => {
                  if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
                }}
                onTouchEnd={() => setHoverIdx(null)}
              >
                {/* Y-Axis Gridlines */}
                {yTicks.map((tickVal, idx) => {
                  const ty = mapY(tickVal);
                  const isZeroLine = isTsfSectors && tickVal === 0;
                  return (
                    <g key={idx}>
                      <line
                        x1={PAD_L}
                        x2={VB_W - PAD_R}
                        y1={ty}
                        y2={ty}
                        stroke="currentColor"
                        className={
                          isZeroLine
                            ? 'text-neutral-800 dark:text-neutral-300'
                            : 'text-neutral-300/65 dark:text-neutral-700/60'
                        }
                        strokeWidth={isZeroLine ? '1.3' : '1'}
                        strokeDasharray={isTsfSectors && !isZeroLine ? '3 3' : undefined}
                      />
                      <text
                        x={PAD_L - 8}
                        y={ty + 3.5}
                        textAnchor="end"
                        className="fill-neutral-500 dark:fill-neutral-400 text-[10.5px] font-mono tabular-nums"
                      >
                        {isTsfSectors
                          ? `${tickVal.toFixed(0)}`
                          : isPmi
                          ? tickVal.toFixed(1)
                          : isBondCompare
                          ? `${tickVal.toFixed(2)}%`
                          : `${tickVal.toFixed(1)}%`}
                      </text>
                    </g>
                  );
                })}

                {/* Reference Dashed Line (50.0 or 0.0%) */}
                {refY !== null && (
                  <g>
                    <line
                      x1={PAD_L}
                      x2={VB_W - PAD_R + 6}
                      y1={refY}
                      y2={refY}
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={VB_W - PAD_R + 10}
                      y={refY + 3.5}
                      className="fill-amber-600 dark:fill-amber-400 text-[10.5px] font-bold"
                    >
                      {refLabel}
                    </text>
                  </g>
                )}

                {/* TSF 4-Sector Rolling 12M Series Lines */}
                {isTsfSectors && tsfStats && (
                  <>
                    {tsfCorpPath && (
                      <path
                        d={tsfCorpPath}
                        fill="none"
                        stroke={corpColor}
                        strokeWidth="2.3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}
                    {tsfGovtPath && (
                      <path
                        d={tsfGovtPath}
                        fill="none"
                        stroke={govtColor}
                        strokeWidth="2.3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}
                    {tsfHousePath && (
                      <path
                        d={tsfHousePath}
                        fill="none"
                        stroke={houseColor}
                        strokeWidth="2.3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}
                    {tsfOtherPath && (
                      <path
                        d={tsfOtherPath}
                        fill="none"
                        stroke={otherColor}
                        strokeWidth="2.3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Left Start Value Labels */}
                    {tsfStartLabels.map((lbl) => (
                      <text
                        key={`start-${lbl.key}`}
                        x={lbl.x}
                        y={lbl.rawY}
                        textAnchor="end"
                        fill={lbl.color}
                        className="text-[10px] font-bold font-mono tabular-nums"
                      >
                        {lbl.text}
                      </text>
                    ))}

                    {/* Right Terminal Dots & Value Labels */}
                    {hoverIdx === null && (
                      <>
                        {(
                          [
                            { key: 'corp', stat: tsfStats.corp, color: corpColor },
                            { key: 'govt', stat: tsfStats.govt, color: govtColor },
                            { key: 'household', stat: tsfStats.household, color: houseColor },
                            { key: 'other', stat: tsfStats.other, color: otherColor },
                          ] as Array<{ key: TsfSectorKey; stat: TsfSectorStat; color: string }>
                        ).map((s) =>
                          s.stat.latestPoint ? (
                            <circle
                              key={`dot-${s.key}`}
                              cx={mapXByYear(s.stat.latestPoint.timeYear)}
                              cy={mapY(s.stat.latestPoint.value)}
                              r="4.2"
                              fill={s.color}
                              className="stroke-white dark:stroke-neutral-900"
                              strokeWidth="1.4"
                            />
                          ) : null
                        )}
                        {tsfEndLabels.map((lbl) => (
                          <text
                            key={`end-${lbl.key}`}
                            x={lbl.x}
                            y={lbl.rawY}
                            textAnchor="start"
                            fill={lbl.color}
                            className="text-[11px] font-extrabold font-mono tabular-nums"
                          >
                            {lbl.text}
                          </text>
                        ))}
                      </>
                    )}

                    {/* 3 Dynamically Computed Curved-Arrow Peak Callout Boxes */}
                    {tsfPeakCallouts.map((box) => (
                      <g key={`callout-${box.key}`}>
                        <path
                          d={box.arrowPath}
                          fill="none"
                          stroke={box.color}
                          strokeWidth="1.25"
                          strokeLinecap="round"
                        />
                        <polygon points={box.arrowHeadPoints} fill={box.color} />
                        <rect
                          x={box.bx}
                          y={box.by}
                          width={box.boxW}
                          height={box.boxH}
                          rx="4"
                          ry="4"
                          className="fill-white/95 dark:fill-neutral-900/95 [.amoled-mode_&]:fill-black"
                          stroke={box.color}
                          strokeWidth="1.15"
                        />
                        <text
                          x={box.bx + box.boxW / 2}
                          y={box.by + 13}
                          textAnchor="middle"
                          fill={box.color}
                          className="text-[9.5px] font-bold font-mono tabular-nums"
                        >
                          {box.line1}
                        </text>
                        <text
                          x={box.bx + box.boxW / 2}
                          y={box.by + 25}
                          textAnchor="middle"
                          fill={box.color}
                          className="text-[9px] font-semibold tabular-nums"
                        >
                          {box.line2}
                        </text>
                      </g>
                    ))}
                  </>
                )}

                {!isTsfSectors && dualPoints.length >= 2 && (
                  <>
                    {(isIndRetail || isBondCompare) && spreadRibbonPoints && (
                      <polygon
                        points={spreadRibbonPoints}
                        fill={
                          isBondCompare
                            ? 'rgba(225, 29, 72, 0.10)'
                            : 'rgba(16, 185, 129, 0.13)'
                        }
                      />
                    )}
                    <polyline
                      fill="none"
                      stroke={primaryColor}
                      strokeWidth="2.4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={primaryLine}
                    />
                    <polyline
                      fill="none"
                      stroke={secondaryColor}
                      strokeWidth="2.4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={secondaryLine}
                    />
                  </>
                )}

                {/* Vertical Gap Bracket & Direct Callout Label (Industrial vs Retail) */}
                {isIndRetail && gapPt && gapIdx >= 0 && (() => {
                  const gx = mapX(gapIdx);
                  const gy1 = mapY(gapPt.primaryValue);
                  const gy2 = mapY(gapPt.secondaryValue);
                  const midY = (gy1 + gy2) / 2;
                  const placeLeft = gapIdx >= Math.floor(dualPoints.length * 0.68);
                  const labelX = placeLeft ? gx - 10 : gx + 10;
                  const anchor = placeLeft ? 'end' : 'start';
                  const spreadText = `${copy.gapBadgePrefix} ${gapPt.spread > 0 ? '+' : ''}${gapPt.spread.toFixed(1)} pt`;
                  return (
                    <g>
                      <line
                        x1={gx}
                        x2={gx}
                        y1={gy1}
                        y2={gy2}
                        stroke="#10B981"
                        strokeWidth="1.8"
                        strokeDasharray="3 2"
                      />
                      <line x1={gx - 4} x2={gx + 4} y1={gy1} y2={gy1} stroke="#10B981" strokeWidth="1.5" />
                      <line x1={gx - 4} x2={gx + 4} y1={gy2} y2={gy2} stroke="#10B981" strokeWidth="1.5" />
                      <text
                        x={labelX}
                        y={midY + 3.5}
                        textAnchor={anchor}
                        className="fill-emerald-700 dark:fill-emerald-300 text-[10.5px] font-extrabold font-mono tabular-nums"
                      >
                        {spreadText}
                      </text>
                    </g>
                  );
                })()}

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
                {isTsfSectors &&
                  tsfYearTicks.map((yr) => {
                    const tx = mapXByYear(yr);
                    const yBase = PAD_T + PLOT_H;
                    const labelStr = isChineseLocale(language) ? `${yr}年` : `${yr}`;
                    return (
                      <g key={`yr-${yr}`}>
                        <line
                          x1={tx}
                          x2={tx}
                          y1={yBase}
                          y2={yBase + 4}
                          stroke="currentColor"
                          className="text-neutral-400 dark:text-neutral-600"
                          strokeWidth="1"
                        />
                        <text
                          x={tx + 2}
                          y={yBase + 13}
                          textAnchor="end"
                          transform={`rotate(-28 ${tx + 2} ${yBase + 13})`}
                          className="fill-neutral-600 dark:fill-neutral-400 text-[9.5px] font-semibold font-mono tabular-nums"
                        >
                          {labelStr}
                        </text>
                      </g>
                    );
                  })}

                {!isTsfSectors && pointCount >= 3 && (
                  <>
                    <text
                      x={PAD_L + 6}
                      y={PAD_T + PLOT_H + 16}
                      textAnchor="start"
                      className="fill-neutral-500 dark:fill-neutral-400 text-[10px] font-mono tabular-nums"
                    >
                      {dualPoints[0].timeLabel}
                    </text>
                    <text
                      x={PAD_L + PLOT_W / 2}
                      y={PAD_T + PLOT_H + 16}
                      textAnchor="middle"
                      className="fill-neutral-500 dark:fill-neutral-400 text-[10px] font-mono tabular-nums"
                    >
                      {dualPoints[midIdx].timeLabel}
                    </text>
                    <text
                      x={VB_W - PAD_R}
                      y={PAD_T + PLOT_H + 16}
                      textAnchor="end"
                      className="fill-neutral-500 dark:fill-neutral-400 text-[10px] font-mono tabular-nums"
                    >
                      {dualPoints[lastIdx].timeLabel}
                    </text>
                  </>
                )}

                {lastIdx >= 0 && hoverIdx === null && !isTsfSectors && dualPoints[lastIdx] && (
                  <>
                    <circle
                      cx={mapX(lastIdx)}
                      cy={mapY(dualPoints[lastIdx].primaryValue)}
                      r="4"
                      fill={primaryColor}
                      className="stroke-white dark:stroke-neutral-900"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={mapX(lastIdx)}
                      cy={mapY(dualPoints[lastIdx].secondaryValue)}
                      r="4"
                      fill={secondaryColor}
                      className="stroke-white dark:stroke-neutral-900"
                      strokeWidth="1.5"
                    />
                  </>
                )}

                {/* Interactive Crosshair */}
                {hoverIdx !== null && isTsfSectors && tsfPoints[hoverIdx] && (
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
                    {tsfPoints[hoverIdx].corpScale !== null && (
                      <circle cx={mapX(hoverIdx)} cy={mapY(tsfPoints[hoverIdx].corpScale!)} r="4.5" fill={corpColor} stroke="#ffffff" strokeWidth="2" />
                    )}
                    {tsfPoints[hoverIdx].govtScale !== null && (
                      <circle cx={mapX(hoverIdx)} cy={mapY(tsfPoints[hoverIdx].govtScale!)} r="4.5" fill={govtColor} stroke="#ffffff" strokeWidth="2" />
                    )}
                    {tsfPoints[hoverIdx].householdScale !== null && (
                      <circle cx={mapX(hoverIdx)} cy={mapY(tsfPoints[hoverIdx].householdScale!)} r="4.5" fill={houseColor} stroke="#ffffff" strokeWidth="2" />
                    )}
                    {tsfPoints[hoverIdx].otherScale !== null && (
                      <circle cx={mapX(hoverIdx)} cy={mapY(tsfPoints[hoverIdx].otherScale!)} r="4.5" fill={otherColor} stroke="#ffffff" strokeWidth="2" />
                    )}
                  </g>
                )}

                {hoverIdx !== null && !isTsfSectors && dualPoints[hoverIdx] && (
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
                      cy={mapY(dualPoints[hoverIdx].primaryValue)}
                      r="4.5"
                      fill={primaryColor}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <circle
                      cx={mapX(hoverIdx)}
                      cy={mapY(dualPoints[hoverIdx].secondaryValue)}
                      r="4.5"
                      fill={secondaryColor}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                )}
              </svg>
            )}
          </div>

          {/* 4-Sector Line-Dot Legend Strip (TSF Sectors) */}
          {isTsfSectors && (
            <div className="shrink-0 flex flex-wrap items-center justify-center sm:justify-start gap-x-3.5 gap-y-1 pt-0.5 text-[10.5px] sm:text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">
              {(
                [
                  { label: copy.tsfCorpLabel, color: corpColor },
                  { label: copy.tsfGovtLabel, color: govtColor },
                  { label: copy.tsfHouseLabel, color: houseColor },
                  { label: copy.tsfOtherLabel, color: otherColor },
                ]
              ).map((item) => (
                <div key={item.label} className="inline-flex items-center gap-1.5">
                  <span className="relative inline-flex items-center justify-center w-5 h-2.5">
                    <span className="w-full h-[2.5px] rounded-full" style={{ backgroundColor: item.color }} />
                    <span
                      className="absolute w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Explanation Footer (portrait/desktop; landscape displays it in side rail above) */}
          {!isPmi && !isTsfSectors && (
            <div className="shrink-0 [@media(max-height:560px)]:hidden pt-1.5 border-t border-neutral-200/80 dark:border-neutral-800 [.amoled-mode_&]:border-white/10 text-[10px] sm:text-[11px] text-neutral-600 dark:text-neutral-300 leading-snug line-clamp-2 sm:line-clamp-3">
              {isBondCompare
                ? copy.bondNote
                : isIndRetail
                ? copy.indRetailNote
                : copy.ppiCpiNote}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
