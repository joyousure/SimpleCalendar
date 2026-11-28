import { Language } from '../types/calendar';
import { isChineseLocale } from './i18n';
import {
  LiveMarketQuote,
  MarketChartSeries,
  TimeframeKey,
  MacroIndicator,
  MacroChartSeries,
  MacroTimeframeKey,
  PmiComparisonSeries,
  PpiCpiComparisonSeries,
  IndustrialRetailComparisonSeries,
  TsfSectorComparisonSeries,
  BondYieldComparisonSeries,
  HouseholdLoanSubIndicator,
} from './financeService';

export interface StructuredInsight {
  badge: string;
  badgeTone: 'bull' | 'bear' | 'neutral' | 'amber' | 'indigo';
  primaryLine: string;
  secondaryLine: string;
}

function getToneClasses(tone: StructuredInsight['badgeTone']): string {
  switch (tone) {
    case 'bull':
      return 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25';
    case 'bear':
      return 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25';
    case 'amber':
      return 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25';
    case 'indigo':
      return 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border-indigo-500/25';
    default:
      return 'bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 border-neutral-500/20';
  }
}

export function getInsightBadgeClass(tone: StructuredInsight['badgeTone']): string {
  return getToneClasses(tone);
}

function computePercentile(value: number, low: number, high: number): number {
  const span = high - low;
  if (!Number.isFinite(span) || span <= 0.0001) return 50;
  return Math.max(0, Math.min(100, Math.round(((value - low) / span) * 100)));
}

function computeMomentumDelta(values: number[], windowSize = 3): number {
  if (values.length < 2) return 0;
  const w = Math.min(windowSize, Math.floor(values.length / 2));
  if (w < 1) return values[values.length - 1] - values[0];
  const recent = values.slice(-w);
  const prev = values.slice(-w * 2, -w);
  const avgR = recent.reduce((s, v) => s + v, 0) / recent.length;
  const avgP = prev.reduce((s, v) => s + v, 0) / prev.length;
  return avgR - avgP;
}

// ---------------------------------------------------------------------------
// 1. Market Asset Analysis Insight (Indices / Gold & Silver / Energy)
// ---------------------------------------------------------------------------
export function buildMarketAssetInsight(
  quote: LiveMarketQuote,
  series: MarketChartSeries | null,
  timeframe: TimeframeKey,
  language: Language
): StructuredInsight {
  const isZh = isChineseLocale(language);
  const isTw = language === 'zh-TW';

  const current = quote.price;
  const high52 = series?.week52High ?? quote.week52High;
  const low52 = series?.week52Low ?? quote.week52Low;
  const pos52 = computePercentile(current, low52, high52);

  const pts = series?.points || [];
  const vals = pts.map((p) => p.price);
  const pHigh = vals.length > 0 ? Math.max(...vals) : quote.high;
  const pLow = vals.length > 0 ? Math.min(...vals) : quote.low;
  const amplitudePct = pLow > 0 ? ((pHigh - pLow) / pLow) * 100 : 0;
  const periodPct = series?.periodChangePct ?? quote.changePct;
  const posInPeriod = computePercentile(current, pLow, pHigh);

  const half = Math.floor(vals.length / 2);
  const firstHalfAvg = half > 0 ? vals.slice(0, half).reduce((a, b) => a + b, 0) / half : current;
  const secondHalfAvg =
    vals.length - half > 0 ? vals.slice(half).reduce((a, b) => a + b, 0) / (vals.length - half) : current;
  const slopeUp = secondHalfAvg > firstHalfAvg * 1.001;
  const slopeDown = secondHalfAvg < firstHalfAvg * 0.999;

  if (!isZh) {
    const badge =
      pos52 >= 75 && periodPct >= 0
        ? 'Upper Range Momentum'
        : pos52 <= 25 && periodPct < 0
        ? 'Oversold / Support Test'
        : Math.abs(periodPct) < 0.6
        ? 'Consolidation'
        : periodPct >= 0
        ? 'Rebound Bias'
        : 'Pullback Phase';
    const badgeTone: StructuredInsight['badgeTone'] =
      periodPct >= 0.5 ? 'bull' : periodPct <= -0.5 ? 'bear' : 'indigo';
    const catDriver =
      quote.category === 'metal'
        ? 'Precious metals reflect real-rate expectations, USD liquidity, and safe-haven hedging demand.'
        : quote.category === 'energy'
        ? 'Energy pricing tracks OPEC+ supply discipline, inventory cycles, and global industrial demand.'
        : 'Equity index structure reflects valuation multiples, earnings momentum, and cross-border risk appetite.';
    return {
      badge,
      badgeTone,
      primaryLine: `Trading at the ${pos52}th percentile of its 52-week range (${timeframe} amplitude ${amplitudePct.toFixed(1)}%, closing near ${posInPeriod}% of period band).`,
      secondaryLine: `${slopeUp ? 'Trend slope tilts higher' : slopeDown ? 'Near-term slope softens' : 'Price action stays range-bound'}: ${catDriver}`,
    };
  }

  let badge = '区间震荡';
  let badgeTone: StructuredInsight['badgeTone'] = 'indigo';
  if (pos52 >= 78 && periodPct >= 0) {
    badge = isTw ? '高位強勢運行' : '高位强势运行';
    badgeTone = 'bull';
  } else if (pos52 <= 25 && periodPct < 0) {
    badge = isTw ? '低位支撐測試' : '低位支撑测试';
    badgeTone = 'bear';
  } else if (periodPct >= 1.2 && slopeUp) {
    badge = isTw ? '動能上行修復' : '动能上行修复';
    badgeTone = 'bull';
  } else if (periodPct <= -1.2 && slopeDown) {
    badge = isTw ? '回調承壓整固' : '回调承压整固';
    badgeTone = 'bear';
  } else if (posInPeriod >= 68) {
    badge = isTw ? '偏強震盪蓄勢' : '偏强震荡蓄势';
    badgeTone = 'amber';
  }

  const posDesc =
    pos52 >= 80
      ? isTw
        ? '處於52週高位強勢區間'
        : '处于52周高位强势区间'
      : pos52 <= 22
      ? isTw
        ? '靠近52週低位估值支撐帶'
        : '靠近52周低位估值支撑带'
      : isTw
      ? '位於52週中樞均衡區域'
      : '位于52周中枢均衡区域';

  const momentumDesc = slopeUp
    ? isTw
      ? '後半程重心逐步上移，買盤承接較穩'
      : '后半程重心逐步上移，买盘承接较稳'
    : slopeDown
    ? isTw
      ? '後半程斜率走緩，短線仍需消化拋壓'
      : '后半程斜率走缓，短线仍需消化抛压'
    : isTw
    ? '多空振幅收斂，等待量價突破催化'
    : '多空振幅收敛，等待量价突破催化';

  const primaryLine = isTw
    ? `現價處於52週區間 ${pos52}% 分位（${posDesc}），${timeframe} 週期振幅 ${amplitudePct.toFixed(1)}%，當前位於區間 ${posInPeriod}% 位置。`
    : `现价处于52周区间 ${pos52}% 分位（${posDesc}），${timeframe} 周期振幅 ${amplitudePct.toFixed(1)}%，当前位于区间 ${posInPeriod}% 位置。`;

  let driver = '';
  if (quote.category === 'metal') {
    driver =
      quote.id === 'silver'
        ? isTw
          ? '白銀兼具貴金屬避險與光伏工業雙重屬性，波動彈性高於黃金，建議關注金銀比修復與實際利率預期。'
          : '白银兼具贵金属避险与光伏工业双重属性，波动弹性高于黄金，建议关注金银比修复与实际利率预期。'
        : isTw
        ? '黃金主要定價美債實際利率、央行購金趨勢與地緣避險溢價，回踩區間中樞往往具備中長期配置韌性。'
        : '黄金主要定价美债实际利率、央行购金趋势与地缘避险溢价，回踩区间中枢往往具备中长期配置韧性。';
  } else if (quote.category === 'energy') {
    driver =
      quote.id === 'natgas'
        ? isTw
          ? '天然氣受季節性庫存週期與極端天氣預期擾動顯著，短線彈性大，中線看歐亞LNG補庫節奏。'
          : '天然气受季节性库存周期与极端天气预期扰动显著，短线弹性大，中线看欧亚LNG补库节奏。'
        : isTw
        ? '原油直接錨定上游通脹與PPI傳導預期，供給端產量紀律與全球製造業補庫將決定區間突破方向。'
        : '原油直接锚定上游通胀与PPI传导预期，供给端产量纪律与全球制造业补库将决定区间突破方向。';
  } else {
    driver =
      quote.region === 'cn'
        ? isTw
          ? 'A股/港股核心指數定價國內宏觀政策落地與企業盈利兌現，關注量能持續性及順週期板塊輪動。'
          : 'A股/港股核心指数定价国内宏观政策落地与企业盈利兑现，关注量能持续性及顺周期板块轮动。'
        : quote.region === 'us'
        ? isTw
          ? '美股主要受聯準會利率路徑、企業資本開支與盈利估值消化影響，留意長端美債殖利率波動牽制。'
          : '美股主要受美联储利率路径、企业资本开支与盈利估值消化影响，留意长端美债收益率波动牵制。'
        : isTw
        ? '亞太及歐洲主流指數受匯率定價、出口週期與當地央行貨幣政策指引主導，注意跨市場風險偏好共振。'
        : '亚太及欧洲主流指数受汇率定价、出口周期与当地央行货币政策指引主导，注意跨市场风险偏好共振。';
  }

  return {
    badge,
    badgeTone,
    primaryLine,
    secondaryLine: `${momentumDesc}；${driver}`,
  };
}

// ---------------------------------------------------------------------------
// 2. Macro Single-Indicator Analysis Insight
// ---------------------------------------------------------------------------
export function buildMacroIndicatorInsight(
  indicator: MacroIndicator,
  series: MacroChartSeries | null,
  timeframe: MacroTimeframeKey,
  language: Language
): StructuredInsight {
  const isZh = isChineseLocale(language);
  const isTw = language === 'zh-TW';
  const pts = series?.points || [];
  const vals = pts.map((p) => p.value);

  const latest = series?.latestValue ?? indicator.numericValue;
  const high = series?.periodHigh ?? Math.max(latest, ...vals);
  const low = series?.periodLow ?? Math.min(latest, ...vals);
  const avg = series?.periodAvg ?? latest;
  const pctRank = computePercentile(latest, low, high);
  const mom3 = computeMomentumDelta(vals, 3);
  const diffFromAvg = latest - avg;
  const unitLabel = indicator.unit === 'pt' ? '' : indicator.unit;

  const isHigherFavorable =
    indicator.id !== 'unemployment' && indicator.id !== 'us10y' && indicator.id !== 'cn10y';

  if (!isZh) {
    const slopeTag =
      mom3 > 0.15 ? 'Momentum Accelerating' : mom3 < -0.15 ? 'Momentum Softening' : 'Steady Trajectory';
    const tone: StructuredInsight['badgeTone'] =
      indicator.id === 'pmi'
        ? latest >= 50
          ? 'bull'
          : 'amber'
        : isHigherFavorable
        ? diffFromAvg >= 0
          ? 'bull'
          : 'indigo'
        : diffFromAvg <= 0
        ? 'bull'
        : 'amber';
    return {
      badge: slopeTag,
      badgeTone: tone,
      primaryLine: `Currently at ${latest.toFixed(indicator.decimals)}${unitLabel} (${pctRank}th percentile over ${timeframe}; ${diffFromAvg >= 0 ? '+' : ''}${diffFromAvg.toFixed(indicator.decimals)} vs period mean ${avg.toFixed(indicator.decimals)}).`,
      secondaryLine: indicator.summary,
    };
  }

  let badge = isTw ? '平穩運行' : '平稳运行';
  let badgeTone: StructuredInsight['badgeTone'] = 'indigo';

  if (indicator.id === 'pmi') {
    if (latest >= 50 && mom3 >= 0) {
      badge = isTw ? '擴張加速' : '扩张加速';
      badgeTone = 'bull';
    } else if (latest >= 50) {
      badge = isTw ? '榮枯線上方' : '荣枯线上方';
      badgeTone = 'bull';
    } else if (mom3 > 0.2) {
      badge = isTw ? '線下邊際修復' : '线下边际修复';
      badgeTone = 'amber';
    } else {
      badge = isTw ? '榮枯線下方承壓' : '荣枯线下方承压';
      badgeTone = 'bear';
    }
  } else if (indicator.id === 'unemployment') {
    if (mom3 < -0.3) {
      badge = isTw ? '季節性持續回落' : '季节性持续回落';
      badgeTone = 'bull';
    } else if (latest > avg) {
      badge = isTw ? '就業承壓觀察' : '就业承压观察';
      badgeTone = 'amber';
    } else {
      badge = isTw ? '吸納趨於平穩' : '吸纳趋于平稳';
      badgeTone = 'indigo';
    }
  } else if (indicator.id === 'cn10y' || indicator.id === 'us10y') {
    if (mom3 <= -0.05) {
      badge = isTw ? '利率下行通道' : '利率下行通道';
      badgeTone = 'indigo';
    } else if (mom3 >= 0.05) {
      badge = isTw ? '利率中樞上移' : '利率中枢上移';
      badgeTone = 'amber';
    } else {
      badge = isTw ? '長端窄幅震盪' : '长端窄幅震荡';
      badgeTone = 'neutral';
    }
  } else if (pctRank >= 75 && mom3 >= 0) {
    badge = isTw ? '高位景氣領跑' : '高位景气领跑';
    badgeTone = 'bull';
  } else if (pctRank <= 28 && mom3 < 0) {
    badge = isTw ? '低位築底整固' : '低位筑底整固';
    badgeTone = 'bear';
  } else if (mom3 > 0.2) {
    badge = isTw ? '斜率邊際改善' : '斜率边际改善';
    badgeTone = 'amber';
  }

  const slopeWord =
    mom3 > 0.12
      ? isTw
        ? '近3期斜率向上改善'
        : '近3期斜率向上改善'
      : mom3 < -0.12
      ? isTw
        ? '近3期動能邊際放緩'
        : '近3期动能边际放缓'
      : isTw
      ? '近3期走勢保持平穩'
      : '近3期走势保持平稳';

  const primaryLine = isTw
    ? `最新讀數 ${latest.toFixed(indicator.decimals)}${unitLabel}，處於 ${timeframe} 區間 ${pctRank}% 分位（均值 ${avg.toFixed(indicator.decimals)}${unitLabel}，偏離 ${diffFromAvg >= 0 ? '+' : ''}${diffFromAvg.toFixed(indicator.decimals)}），${slopeWord}。`
    : `最新读数 ${latest.toFixed(indicator.decimals)}${unitLabel}，处于 ${timeframe} 区间 ${pctRank}% 分位（均值 ${avg.toFixed(indicator.decimals)}${unitLabel}，偏离 ${diffFromAvg >= 0 ? '+' : ''}${diffFromAvg.toFixed(indicator.decimals)}），${slopeWord}。`;

  const domainMap: Record<string, string> = {
    cpi:
      latest < 1.0
        ? isTw
          ? '終端物價處於溫和低位區間，核心服務與食品價格分化，對貨幣政策降息降準不構成通脹掣肘。'
          : '终端物价处于温和低位区间，核心服务与食品价格分化，对货币政策降息降准不构成通胀掣肘。'
        : isTw
        ? '居民消費價格溫和回升，反映服務消費與內需動能修複，可結合核心CPI觀察內生需求持續性。'
        : '居民消费价格温和回升，反映服务消费与内需动能修复，可结合核心CPI观察内生需求持续性。',
    pce:
      latest <= 2.4
        ? isTw
          ? '美國核心PCE向 2% 政策目標靠攏，為聯準會維持漸進降息節奏及緩解全球無風險利率壓力提供窗口。'
          : '美国核心PCE向 2% 政策目标靠拢，为美联储维持渐进降息节奏及缓解全球无风险利率压力提供窗口。'
        : isTw
        ? 'PCE黏性仍高於 2% 目標線，服務通脹降溫緩慢將限制聯準會寬鬆幅度，持續牽動美元與美債定價。'
        : 'PCE黏性仍高于 2% 目标线，服务通胀降温缓慢将限制美联储宽松幅度，持续牵动美元与美债定价。',
    ppi:
      latest >= 0
        ? isTw
          ? '工業品出廠價格重回正增長區間，上游能源有色與中游製造報價改善，有望支撐工業企業營收與毛利回暖。'
          : '工业品出厂价格重回正增长区间，上游能源有色与中游制造报价改善，有望支撑工业企业营收与毛利回暖。'
        : isTw
        ? 'PPI仍受產能利用率與上游原料價格拖累，需關注穩增長實物工作量落地與供給側出清帶來的價差拐點。'
        : 'PPI仍受产能利用率与上游原料价格拖累，需关注稳增长实物工作量落地与供给侧出清带来的价差拐点。',
    pmi:
      latest >= 50
        ? isTw
          ? '製造業景氣維持 50.0 上方擴張區間，新訂單與生產分項形成支撐，但需觀察庫存週期與外需訂單延續性。'
          : '制造业景气维持 50.0 上方扩张区间，新订单与生产分项形成支撑，但需观察库存周期与外需订单延续性。'
        : isTw
        ? '製造業PMI略低於50榮枯線，大中型企業補庫偏謹慎，可點擊下方「官方與民間口徑對比」觀察出口與民營結構分化。'
        : '制造业PMI略低于50荣枯线，大中型企业补库偏谨慎，可点击下方「官方与民间口径对比」观察出口与民营结构分化。',
    tsf: isTw
      ? '政府債發行與企業中長期信貸構成社融基本盤；可進一步下鑽「各部門規模」與「社零與工業增加值同比」，透視信用向實體需求傳導效率。'
      : '政府债发行与企业中长期信贷构成社融基本盘；可进一步下钻「各部门规模」与「社零与工业增加值同比」，透视信用向实体需求传导效率。',
    mlf: isTw
      ? '政策利率與LPR聯動引導銀行負債與社會綜合融資成本下行，助力減輕存量企業債務利息負擔與按揭還貸壓力。'
      : '政策利率与LPR联动引导银行负债与社会综合融资成本下行，助力减轻存量企业债务利息负担与按揭还贷压力。',
    cn10y: isTw
      ? '中國10年期國債處於長期利率低位中樞，既定價國內溫和通脹與寬鬆預期，也與美債共同構成中美利差及匯率錨。'
      : '中国10年期国债处于长期利率低位中枢，既定价国内温和通胀与宽松预期，也与美债共同构成中美利差及汇率锚。',
    us10y: isTw
      ? '美債10年期殖利率承載增長預期、財政赤字供給與期限溢價三重博弈，其波動直接影響全球權益估值與跨境資本流向。'
      : '美债10年期收益率承载增长预期、财政赤字供给与期限溢价三重博弈，其波动直接影响全球权益估值与跨境资本流向。',
    rscg:
      latest < 2
        ? isTw
          ? '社零當月同比增速相對溫和，反映居民預防性儲蓄仍高、可選消費復甦漸進，結構上以舊換新與餐飲文旅更具彈性。'
          : '社零当月同比增速相对温和，反映居民预防性储蓄仍高、可选消费复苏渐进，结构上以旧换新与餐饮文旅更具弹性。'
        : isTw
          ? '社零同比保持穩健修復，政策補貼與服務消費場景拓展共同支撐消費基本盤，可對比工業增加值評估供需平衡度。'
          : '社零同比保持稳健修复，政策补贴与服务消费场景拓展共同支撑消费基本盘，可对比工业增加值评估供需平衡度。',
    unemployment: isTw
      ? '青年失業率呈現顯著畢業季脈衝與秋冬回落季節特徵，後續穩就業核心在於現代服務業與新質生產力崗位擴容吸納。'
      : '青年失业率呈现显著毕业季脉冲与秋冬回落季节特征，后续稳就业核心在于现代服务业与新质生产力岗位扩容吸纳。',
    hh_ml_consumer: isTw
      ? `中長期消費貸以居民房貸按揭為主體，歷經2022–2025年低位盤整後，最新為${latest > 0 ? '+' : ''}${latest.toFixed(1)}%（2016年以來最低），按揭去槓桿仍在延續。`
      : `中长期消费贷以居民房贷按揭为主体，历经2022–2025年低位盘整后，最新为${latest > 0 ? '+' : ''}${latest.toFixed(1)}%（2016年以来最低），按揭去杠杆仍在延续。`,
    hh_st_consumer: isTw
      ? `短期消費貸在2023年短暫反彈後自2024年中轉負並持續走低，最新降至${latest > 0 ? '+' : ''}${latest.toFixed(1)}%（2016年以來最低），顯示居民短期消費信貸擴張明顯收斂。`
      : `短期消费贷在2023年短暂反弹后自2024年中转负并持续走低，最新降至${latest > 0 ? '+' : ''}${latest.toFixed(1)}%（2016年以来最低），显示居民短期消费信贷扩张明显收敛。`,
    hh_st_business: isTw
      ? `短期經營貸自2021年初高點回落後最新降至${latest > 0 ? '+' : ''}${latest.toFixed(1)}%（2016年以來最低），反映個體商戶短期週轉與補庫類信貸需求階段性偏弱。`
      : `短期经营贷自2021年初高点回落后最新降至${latest > 0 ? '+' : ''}${latest.toFixed(1)}%（2016年以来最低），反映个体商户短期周转与补库类信贷需求阶段性偏弱。`,
    hh_ml_business: isTw
      ? `中長期經營貸最新錄得${latest > 0 ? '+' : ''}${latest.toFixed(1)}%，在四類住戶分項中唯一保持正增長區間，成為普惠小微與實體經營主體最穩定的信貸支撐。`
      : `中长期经营贷最新录得${latest > 0 ? '+' : ''}${latest.toFixed(1)}%，在四类住户分项中唯一保持正增长区间，成为普惠小微与实体经营主体最稳定的信贷支撑。`,
  };

  return {
    badge,
    badgeTone,
    primaryLine,
    secondaryLine: domainMap[indicator.id] || indicator.summary,
  };
}

// ---------------------------------------------------------------------------
// 3. Household Loans 4-Panel Overview Insight
// ---------------------------------------------------------------------------
export function buildHouseholdLoansOverviewInsight(
  items: HouseholdLoanSubIndicator[],
  language: Language
): StructuredInsight {
  const isZh = isChineseLocale(language);
  const isTw = language === 'zh-TW';
  const map = new Map(items.map((i) => [i.id, i.numericValue]));
  const mlCons = map.get('hh_ml_consumer') ?? -1.9;
  const stCons = map.get('hh_st_consumer') ?? -13.3;
  const stBiz = map.get('hh_st_business') ?? -4.0;
  const mlBiz = map.get('hh_ml_business') ?? 6.4;

  const spread = (mlBiz - mlCons).toFixed(1);

  if (!isZh) {
    return {
      badge: 'Credit Divergence',
      badgeTone: 'indigo',
      primaryLine: `M/L Business loans (+${mlBiz.toFixed(1)}%) remain the sole positive segment, outpacing M/L Consumer (${mlCons.toFixed(1)}%) by ${spread} pts.`,
      secondaryLine: `M/L Consumer (${mlCons.toFixed(1)}%), ST Consumer (${stCons.toFixed(1)}%), and ST Business (${stBiz.toFixed(1)}%) all hit lows since 2016.`,
    };
  }

  return {
    badge: isTw ? '結構分化 · 唯中長經營正增' : '结构分化 · 唯中长经营正增',
    badgeTone: 'indigo',
    primaryLine: isTw
      ? `中長期經營貸（+${mlBiz.toFixed(1)}%）成為唯一維持正增長的分項，領先中長期消費貸（${mlCons.toFixed(1)}%）達 ${spread} 個百分點。`
      : `中长期经营贷（+${mlBiz.toFixed(1)}%）成为唯一维持正增长的分项，领先中长期消费贷（${mlCons.toFixed(1)}%）达 ${spread} 个百分点。`,
    secondaryLine: isTw
      ? `中長期消費（${mlCons.toFixed(1)}%）、短期消費（${stCons.toFixed(1)}%）與短期經營貸（${stBiz.toFixed(1)}%）均下探2016年以來最低水平。`
      : `中长期消费（${mlCons.toFixed(1)}%）、短期消费（${stCons.toFixed(1)}%）与短期经营贷（${stBiz.toFixed(1)}%）均下探2016年以来最低水平。`,
  };
}

// ---------------------------------------------------------------------------
// 4. Macro Comparison Modals Dynamic Insights
// ---------------------------------------------------------------------------
export function buildPmiComparisonInsight(
  data: PmiComparisonSeries | null,
  language: Language
): StructuredInsight | null {
  if (!data || data.points.length < 2) return null;
  const isZh = isChineseLocale(language);
  const isTw = language === 'zh-TW';
  const spreads = data.points.map((p) => p.spread);
  const momSpread = computeMomentumDelta(spreads, 3);
  const expandPrivateCount = data.points.filter((p) => p.secondaryValue >= 50).length;
  const expandOfficialCount = data.points.filter((p) => p.primaryValue >= 50).length;

  if (!isZh) {
    return {
      badge: data.spreadLatest >= 0.8 ? 'Private Gauge Leads' : 'Narrowing Divergence',
      badgeTone: data.spreadLatest >= 0.8 ? 'amber' : 'indigo',
      primaryLine: `Private gauge stayed >=50 in ${expandPrivateCount}/${data.points.length} months vs ${expandOfficialCount}/${data.points.length} for the official print (latest spread ${data.spreadLatest >= 0 ? '+' : ''}${data.spreadLatest.toFixed(1)} pts).`,
      secondaryLine: `3-month spread trend is ${momSpread >= 0 ? 'widening' : 'converging'} (${momSpread >= 0 ? '+' : ''}${momSpread.toFixed(1)} pts), highlighting stronger export-oriented SME orders relative to domestic heavy manufacturing.`,
    };
  }

  const badge =
    data.spreadLatest >= 0.8
      ? isTw
        ? '外向民營景氣領先'
        : '外向民营景气领先'
      : data.spreadLatest <= -0.3
      ? isTw
        ? '大型國企逆勢占優'
        : '大型国企逆势占优'
      : isTw
      ? '雙口徑運行收斂'
      : '双口径运行收敛';

  return {
    badge,
    badgeTone: data.spreadLatest >= 0.8 ? 'amber' : 'indigo',
    primaryLine: isTw
      ? `近一年民間樣本有 ${expandPrivateCount}/${data.points.length} 個月高於50（官方 ${expandOfficialCount}/${data.points.length} 個月），最新口徑差 ${data.spreadLatest >= 0 ? '+' : ''}${data.spreadLatest.toFixed(1)} 點，近3月差值${momSpread >= 0 ? '走闊' : '收斂'} ${Math.abs(momSpread).toFixed(1)} 點。`
      : `近一年民间样本有 ${expandPrivateCount}/${data.points.length} 个月高于50（官方 ${expandOfficialCount}/${data.points.length} 个月），最新口径差 ${data.spreadLatest >= 0 ? '+' : ''}${data.spreadLatest.toFixed(1)} 点，近3月差值${momSpread >= 0 ? '走阔' : '收敛'} ${Math.abs(momSpread).toFixed(1)} 点。`,
    secondaryLine:
      data.spreadLatest > 0
        ? isTw
          ? '研判結論：沿海出口鏈與中小民營企業訂單韌性顯著強於國內大型傳統製造業，內需補庫節奏仍有待政策接續催化。'
          : '研判结论：沿海出口链与中小民营企业订单韧性显著强于国内大型传统制造业，内需补库节奏仍有待政策接续催化。'
        : isTw
        ? '研判結論：大型基礎設施與央國企製造項目托底明顯，出口鏈中小企業對海外需求波動的敏感度相對上升。'
        : '研判结论：大型基础设施与央国企制造项目托底明显，出口链中小企业对海外需求波动的敏感度相对上升。',
  };
}

export function buildPpiCpiComparisonInsight(
  data: PpiCpiComparisonSeries | null,
  language: Language
): StructuredInsight | null {
  if (!data || data.points.length < 2) return null;
  const isZh = isChineseLocale(language);
  const isTw = language === 'zh-TW';
  const scissors = data.points.map((p) => p.spread);
  const momScissors = computeMomentumDelta(scissors, 3);
  const latestScissors = data.scissorsLatest;

  if (!isZh) {
    return {
      badge: latestScissors > 0 ? 'Upstream Reflation' : 'Downstream Margin Buffer',
      badgeTone: latestScissors > 0 ? 'bull' : 'indigo',
      primaryLine: `PPI-CPI scissors stand at ${latestScissors >= 0 ? '+' : ''}${latestScissors.toFixed(1)} pts (3M shift ${momScissors >= 0 ? '+' : ''}${momScissors.toFixed(1)} pts).`,
      secondaryLine:
        latestScissors > 1
          ? 'Rising factory-gate prices relative to CPI bolster upstream industrial revenue, though mid/downstream pass-through to consumer demand warrants tracking.'
          : 'Modest producer inflation keeps downstream manufacturing input costs contained while CPI remains anchored.',
    };
  }

  const badge =
    data.ppiLatest > 0 && latestScissors > 1.0
      ? isTw
        ? '上游再通脹 · 剪刀差擴張'
        : '上游再通胀 · 剪刀差扩张'
      : data.ppiLatest < 0 && data.cpiLatest >= 0
      ? isTw
        ? '上游偏弱 · 下游利潤緩衝'
        : '上游偏弱 · 下游利润缓冲'
      : isTw
      ? '上下游物價溫和收斂'
      : '上下游物价温和收敛';

  const badgeTone: StructuredInsight['badgeTone'] =
    data.ppiLatest > 0 && latestScissors > 1.0 ? 'bull' : data.ppiLatest < 0 ? 'indigo' : 'amber';

  return {
    badge,
    badgeTone,
    primaryLine: isTw
      ? `最新 PPI-CPI 剪刀差為 ${latestScissors >= 0 ? '+' : ''}${latestScissors.toFixed(1)} 個百分點（近3月${momScissors >= 0 ? '走闊' : '收窄'} ${Math.abs(momScissors).toFixed(1)} 個百分點），上游價格（${data.ppiLatest >= 0 ? '+' : ''}${data.ppiLatest.toFixed(1)}%）與終端物價（+${data.cpiLatest.toFixed(1)}%）分化明顯。`
      : `最新 PPI-CPI 剪刀差为 ${latestScissors >= 0 ? '+' : ''}${latestScissors.toFixed(1)} 个百分点（近3月${momScissors >= 0 ? '走阔' : '收窄'} ${Math.abs(momScissors).toFixed(1)} 个百分点），上游价格（${data.ppiLatest >= 0 ? '+' : ''}${data.ppiLatest.toFixed(1)}%）与终端物价（+${data.cpiLatest.toFixed(1)}%）分化明显。`,
    secondaryLine:
      latestScissors > 1.0
        ? isTw
          ? '傳導研判：大宗商品與上中游製造報價抬升帶動工業企業盈利修復，但終端CPI反應克制，意味著中下游向消費端順價能力仍受有效需求約束。'
          : '传导研判：大宗商品与上中游制造报价抬升带动工业企业盈利修复，但终端CPI反应克制，意味着中下游向消费端顺价能力仍受有效需求约束。'
        : isTw
        ? '傳導研判：上游成本壓力溫和有利於中下游製造毛利率維持穩定，整體低通脹環境為財政與貨幣協同寬鬆保留充分空間。'
        : '传导研判：上游成本压力温和有利于中下游制造毛利率维持稳定，整体低通胀环境为财政与货币协同宽松保留充分空间。',
  };
}

export function buildIndustrialRetailInsight(
  data: IndustrialRetailComparisonSeries | null,
  language: Language
): StructuredInsight | null {
  if (!data || data.points.length < 2) return null;
  const isZh = isChineseLocale(language);
  const isTw = language === 'zh-TW';
  const spreads = data.points.map((p) => p.spread);
  const momSpread = computeMomentumDelta(spreads, 3);
  const strongProdMonths = data.points.filter((p) => p.spread > 0).length;

  if (!isZh) {
    return {
      badge: data.spreadLatest >= 2 ? 'Supply Outpaces Demand' : 'Supply-Demand Balanced',
      badgeTone: data.spreadLatest >= 2 ? 'amber' : 'bull',
      primaryLine: `Real industrial output exceeded nominal retail growth in ${strongProdMonths}/${data.points.length} periods (latest gap ${data.spreadLatest >= 0 ? '+' : ''}${data.spreadLatest.toFixed(1)} pts vs 1Y avg ${data.avgSpread >= 0 ? '+' : ''}${data.avgSpread.toFixed(1)} pts).`,
      secondaryLine: `3M divergence shifted ${momSpread >= 0 ? '+' : ''}${momSpread.toFixed(1)} pts; sustained industrial resilience leans on external demand unless domestic retail momentum accelerates.`,
    };
  }

  const badge =
    data.spreadLatest >= 2.5
      ? isTw
        ? '供給強於消費 · 外需承接'
        : '供给强于消费 · 外需承接'
      : data.spreadLatest <= 0.5
      ? isTw
        ? '供需剪刀差收斂'
        : '供需剪刀差收敛'
      : isTw
      ? '生產溫和領先消費'
      : '生产温和领先消费';

  return {
    badge,
    badgeTone: data.spreadLatest >= 2.5 ? 'amber' : 'indigo',
    primaryLine: isTw
      ? `近一年規上工業（實際增速）在 ${strongProdMonths}/${data.points.length} 個時期高於社零（名義增速），最新差距 ${data.spreadLatest >= 0 ? '+' : ''}${data.spreadLatest.toFixed(1)} 個百分點（均值差 ${data.avgSpread >= 0 ? '+' : ''}${data.avgSpread.toFixed(1)} 點，近3月${momSpread >= 0 ? '擴大' : '收窄'} ${Math.abs(momSpread).toFixed(1)} 點）。`
      : `近一年规上工业（实际增速）在 ${strongProdMonths}/${data.points.length} 个时期高于社零（名义增速），最新差距 ${data.spreadLatest >= 0 ? '+' : ''}${data.spreadLatest.toFixed(1)} 个百分点（均值差 ${data.avgSpread >= 0 ? '+' : ''}${data.avgSpread.toFixed(1)} 点，近3月${momSpread >= 0 ? '扩大' : '收窄'} ${Math.abs(momSpread).toFixed(1)} 点）。`,
    secondaryLine:
      data.spreadLatest >= 2.0
        ? isTw
          ? '深層研判：「生產強、消費緩」意味著工業產能高度依賴海外出口與設備投資消化，下階段經濟再平衡的關鍵在於提振居民收入預期與服務消費彈性。'
          : '深层研判：「生产强、消费缓」意味着工业产能高度依赖海外出口与设备投资消化，下阶段经济再平衡的关键在于提振居民收入预期与服务消费弹性。'
        : isTw
        ? '深層研判：工業生產與終端零售增速差距維持合理區間，有助於工業品庫存去化及企業現金流良性循環。'
        : '深层研判：工业生产与终端零售增速差距维持合理区间，有助于工业品库存去化及企业现金流良性循环。',
  };
}

export function buildTsfSectorInsight(
  data: TsfSectorComparisonSeries | null,
  language: Language
): StructuredInsight | null {
  if (!data || data.points.length < 2) return null;
  const isZh = isChineseLocale(language);
  const isTw = language === 'zh-TW';
  const corpStat = data.sectorStats.corp;
  const govtStat = data.sectorStats.govt;
  const houseStat = data.sectorStats.household;
  const otherStat = data.sectorStats.other;
  const corpVal = corpStat.latestPoint?.value ?? data.corpLatest;
  const govtVal = govtStat.latestPoint?.value ?? data.govtLatest;
  const houseVal = houseStat.latestPoint?.value ?? data.householdLatest;
  const otherVal = otherStat.latestPoint?.value ?? data.otherLatest;
  const corpPeak = corpStat.peakPoint;
  const govtPeak = govtStat.peakPoint;
  const houseAction =
    houseVal < 0
      ? isTw
        ? `淨減少 ${Math.abs(houseVal).toFixed(2)} 萬億`
        : `净减少 ${Math.abs(houseVal).toFixed(2)} 万亿`
      : isTw
      ? `淨融資 ${houseVal.toFixed(2)} 萬億`
      : `净融资 ${houseVal.toFixed(2)} 万亿`;
  const govtAction =
    govtVal < 0
      ? isTw
        ? `淨減少 ${Math.abs(govtVal).toFixed(1)} 萬億`
        : `净减少 ${Math.abs(govtVal).toFixed(1)} 万亿`
      : isTw
      ? `淨融資 ${govtVal.toFixed(1)} 萬億`
      : `净融资 ${govtVal.toFixed(1)} 万亿`;

  if (!isZh) {
    return {
      badge: 'Fiscal Bond Anchor',
      badgeTone: 'indigo',
      primaryLine: `Rolling 12M TSF increments: Corporate ${corpVal.toFixed(1)}T, Government ${govtVal.toFixed(1)}T (peak ${govtPeak?.value.toFixed(1) ?? '--'}T in ${govtPeak?.periodKey ?? '--'}), Household ${houseVal.toFixed(2)}T, Other ${otherVal.toFixed(1)}T.`,
      secondaryLine: `${houseStat.isLowestSince2016 ? 'Household net borrowing hit its lowest level since 2016' : 'Household borrowing remains subdued'} while fiscal bonds and corporate credit anchor total financing.`,
    };
  }

  return {
    badge: isTw ? '政府與企業接力居民去槓桿' : '政府与企业接力居民去杠杆',
    badgeTone: 'indigo',
    primaryLine: isTw
      ? `截至 ${data.updatedAt}，近12個月企業部門累計融資 ${corpVal.toFixed(1)} 萬億（峰值 ${corpPeak?.value.toFixed(1) ?? '--'} 萬億，${corpPeak?.fullTimeLabel ?? '--'}），政府部門${govtAction}（峰值 ${govtPeak?.value.toFixed(1) ?? '--'} 萬億），其他（ABS與核銷）${otherVal.toFixed(1)} 萬億。`
      : `截至 ${data.updatedAt}，近12个月企业部门累计融资 ${corpVal.toFixed(1)} 万亿（峰值 ${corpPeak?.value.toFixed(1) ?? '--'} 万亿，${corpPeak?.fullTimeLabel ?? '--'}），政府部门${govtAction}（峰值 ${govtPeak?.value.toFixed(1) ?? '--'} 万亿），其他（ABS与核销）${otherVal.toFixed(1)} 万亿。`,
    secondaryLine: isTw
      ? `結構研判：近12個月居民部門${houseAction}${houseStat.isLowestSince2016 ? '（2016年以來最低）' : ''}，實體信用擴張呈「政府債靠前發力 + 企業中長期修復」雙支柱支撐總量。`
      : `结构研判：近12个月居民部门${houseAction}${houseStat.isLowestSince2016 ? '（2016年以来最低）' : ''}，实体信用扩张呈「政府债靠前发力 + 企业中长期修复」双支柱支撑总量。`,
  };
}

export function buildBondYieldComparisonInsight(
  data: BondYieldComparisonSeries | null,
  language: Language
): StructuredInsight | null {
  if (!data || data.points.length < 2) return null;
  const isZh = isChineseLocale(language);
  const isTw = language === 'zh-TW';
  const spreadsBp = data.points.map((p) => Math.round(p.spread * 100));
  const avgBp = Math.round(spreadsBp.reduce((s, v) => s + v, 0) / spreadsBp.length);
  const minBp = Math.min(...spreadsBp);
  const maxBp = Math.max(...spreadsBp);
  const momBp = Math.round(computeMomentumDelta(spreadsBp, Math.max(3, Math.floor(spreadsBp.length / 8))));
  const absCur = Math.abs(data.spreadBpLatest);
  const absAvg = Math.abs(avgBp);

  if (!isZh) {
    return {
      badge: data.spreadBpLatest < 0 ? 'Inverted Spread Cycle' : 'Positive Carry',
      badgeTone: data.spreadBpLatest < 0 ? 'amber' : 'bull',
      primaryLine: `CN-US 10Y spread sits at ${data.spreadBpLatest > 0 ? '+' : ''}${data.spreadBpLatest} bps (period range ${minBp} to ${maxBp} bps, mean ${avgBp} bps).`,
      secondaryLine: `Spread shifted ${momBp >= 0 ? '+' : ''}${momBp} bps in recent sessions, reflecting monetary cycle divergence and shaping cross-border FX carry dynamics.`,
    };
  }

  const badge =
    absCur < absAvg - 12
      ? isTw
        ? '中美倒掛邊際收斂'
        : '中美倒挂边际收敛'
      : absCur > absAvg + 12
      ? isTw
        ? '倒掛深度走闊'
        : '倒挂深度走阔'
      : isTw
      ? '利差中樞區間震盪'
      : '利差中枢区间震荡';

  return {
    badge,
    badgeTone: absCur < absAvg - 10 ? 'bull' : 'amber',
    primaryLine: isTw
      ? `最新中美10年期利差 ${data.spreadBpLatest}bp（所選週期均值 ${avgBp}bp，極值區間 ${minBp}bp ~ ${maxBp}bp），近期利差變動 ${momBp >= 0 ? '+' : ''}${momBp}bp。`
      : `最新中美10年期利差 ${data.spreadBpLatest}bp（所选周期均值 ${avgBp}bp，极值区间 ${minBp}bp ~ ${maxBp}bp），近期利差变动 ${momBp >= 0 ? '+' : ''}${momBp}bp。`,
    secondaryLine:
      absCur < absAvg
        ? isTw
          ? '配置與匯率研判：利差倒掛較週期均值收窄，有助於緩解人民幣匯率外部約束並改善外資回流境內債市與核心權益資產的預期。'
          : '配置与汇率研判：利差倒挂较周期均值收窄，有助于缓解人民币汇率外部约束并改善外资回流境内债市与核心权益资产的预期。'
        : isTw
        ? '配置與匯率研判：美債長端定價黏性疊加國內低利率中樞使利差維持深幅倒掛，境內貨幣政策重心仍將「以我為主」兼顧匯率穩預期。'
        : '配置与汇率研判：美债长端定价黏性叠加国内低利率中枢使利差维持深幅倒挂，境内货币政策重心仍将「以我为主」兼顾汇率稳预期。',
  };
}
