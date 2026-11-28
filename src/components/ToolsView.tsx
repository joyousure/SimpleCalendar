import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { AppSettings, CalendarEvent } from '../types/calendar';
import { CountdownItem } from '../types/countdown';
import { getTranslation, getExtraLabels, getLocaleCode, isChineseLocale, isRtlLanguage } from '../utils/i18n';
import { toDateString, parseDate } from '../utils/dateUtils';
import { readStorageJson, writeStorageJson } from '../utils/storage';
import { normalizeSearchText } from '../data/worldCities';
import { CountdownView } from './CountdownView';
import { getLunarInfo } from '../utils/lunarCalendar';
import { runSharedTransition, sharedTransitionStyle } from '../utils/viewTransitions';
import { useSearchHistory } from '../utils/searchHistory';
import { SearchHistoryBar } from './SearchHistoryBar';
import {
  LiveMarketQuote,
  MarketCategory,
  MarketRegion,
  LiveForexSnapshot,
  ForexPairSeries,
  ForexPairTimeframe,
  LiveBenchmarkRates,
  MacroIndicator,
  fetchAllLiveMarketQuotes,
  loadCachedMarketQuotes,
  fetchLiveForexRates,
  loadCachedForexRates,
  fetchForexPairSeries,
  fetchLiveBenchmarkRates,
  loadCachedBenchmarkRates,
  fetchLiveMacroIndicators,
  loadCachedMacroIndicators,
  fetchLiveMajorMacroMatrix,
  getQuoteShortName,
  getMarketTrendTheme,
} from '../utils/financeService';
import {
  LiveNetworkInfo,
  fetchLiveNetworkInfo,
  loadCachedNetworkInfo,
  measureRealNetworkSpeed,
} from '../utils/liveDataSync';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';

const MarketAnalysisModal = lazy(() =>
  import('./MarketAnalysisModal').then((m) => ({ default: m.MarketAnalysisModal }))
);
const MacroAnalysisModal = lazy(() =>
  import('./MacroAnalysisModal').then((m) => ({ default: m.MacroAnalysisModal }))
);
const HouseholdLoansModal = lazy(() =>
  import('./HouseholdLoansModal').then((m) => ({ default: m.HouseholdLoansModal }))
);
const MacroComparisonModal = lazy(() =>
  import('./MacroComparisonModal').then((m) => ({ default: m.MacroComparisonModal }))
);
const MajorMacroMatrixModal = lazy(() =>
  import('./MajorMacroMatrixModal').then((m) => ({ default: m.MajorMacroMatrixModal }))
);
import type { MacroComparisonMode } from './MacroComparisonModal';
import { saveFileToDevice } from '../utils/fileTransfer';
import {
  BarChart3,
  Activity,
  Clock,
  Calculator,
  Sparkles,
  DollarSign,
  Train,
  Plane,
  RefreshCw,
  CalendarPlus,
  ArrowRightLeft,
  Award,
  Wallet,
  FileText,
  Trash2,
  Gauge,
  Download,
  Upload,
  X,
  Leaf,
  Calendar as CalendarIcon,
  ShieldCheck,
  Gift,
  Star,
  ChevronDown,
  ChevronUp,
  Bus,
  SlidersHorizontal,
  Pencil,
  PieChart,
  Search,
  Copy,
  Check,
  TrendingUp,
  Plus,
} from 'lucide-react';
import {
  LoanMethod,
  LoanPortfolioType,
  PrepayStrategy,
  calculateSingleLoanSchedule,
  mergeLoanSummaries,
  simulatePrepayment,
  calculateAdvancedDeposit,
  getRatesProLabels,
} from '../utils/ratesCalculator';
import {
  TravelModeTab,
  TravelSortOption,
  TransitRegionTag,
  RichTrainItem,
  RichFlightItem,
  TransitTransferOption,
  RAIL_HUB_STATIONS,
  AIRPORT_HUB_DIRECTORY,
  getTravelProLabels,
  subtractMinutesFromHHMM,
  getPopularCorridors,
  getRichTrainList,
  getRichFlightList,
  getTransitTransfers,
  resolveDirectoryHub,
  queryDynamic12306Trains,
  queryDynamicGlobalFlights,
} from '../data/travelData';
import {
  LiveTravelSyncSnapshot,
  fetchLiveTravelSync,
  loadCachedTravelSync,
  getLiveDepartureStatusBadge,
} from '../utils/travelLiveSync';

interface ToolsViewProps {
  settings: AppSettings;
  countdowns?: CountdownItem[];
  onUpdateEvent?: (event: CalendarEvent) => void;
  onUpdateCountdowns?: (items: CountdownItem[]) => void;
  onOpenWeather: () => void;
  onNavigateToCalendar: () => void;
  onOpenSettings: () => void;
  requestedSubTab?: { tab: ToolSubTab; seq: number } | null;
  toolsResetSeq?: number;
}

// 10 Tools categorized by Financial and Utilities
export type ToolSubTab =
  | 'stocks'      // 📈 股市能源 (原股指金属)
  | 'macro'       // 📊 经济指标 (原宏观经济)
  | 'rates'       // 💰 存贷测算 (商贷/公积金/组合贷 + 提前还贷 + 分期明细)
  | 'forex'       // 💱 实时汇率 (原极简汇率)
  | 'accounting'  // 💳 极简记账 (收支结余同框)
  | 'travel'      // 🚄 交通出行 (高铁/航班/接驳 + 排序 + 经停)
  | 'speedtest'   // ⚡ 网络测速 (全球网测体系)
  | 'countdowns'  // ⏱️ 倒数日
  | 'calc'        // 🔢 日期计算 (原日期推算：恢复偏移及生辰年龄精算)
  | 'notes';      // 📝 备忘录

type DepositTermKey = 'demand' | '3m' | '6m' | '1y' | '2y' | '3y' | '5y' | 'cd3y';

interface AccountingRecord {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  account: string;
  date: string;
  note: string;
}

interface MemoItem {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  color: string;
  date: string;
  tags: string[];
}

export const ToolsView: React.FC<ToolsViewProps> = ({
  settings,
  countdowns = [],
  onUpdateEvent = () => {},
  onUpdateCountdowns = () => {},
  requestedSubTab = null,
  toolsResetSeq = 0,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);
  const localeCode = getLocaleCode(settings.language);
  const isChinese = isChineseLocale(settings.language);
  const isRtl = isRtlLanguage(settings.language);
  const todayStr = toDateString(new Date());

  const [activeTab, setActiveTab] = useState<ToolSubTab>(() => requestedSubTab?.tab || 'stocks');
  const [viewMode, setViewMode] = useState<'hub' | 'detail'>(() => (requestedSubTab?.tab ? 'detail' : 'hub'));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openToolDetail = useCallback((tab: ToolSubTab) => {
    runSharedTransition(
      () => {
        setActiveTab(tab);
        setViewMode('detail');
      },
      { direction: 'forward', sharedName: `hero-tool-${tab}` }
    );
  }, []);

  const closeToolDetail = useCallback(() => {
    runSharedTransition(
      () => {
        setViewMode('hub');
      },
      { direction: 'back', sharedName: `hero-tool-${activeTab}` }
    );
  }, [activeTab]);

  useEffect(() => {
    if (requestedSubTab?.tab) {
      openToolDetail(requestedSubTab.tab);
    }
  }, [requestedSubTab, openToolDetail]);

  const prevToolsResetSeqRef = useRef(toolsResetSeq);
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  useEffect(() => {
    if (toolsResetSeq !== prevToolsResetSeqRef.current) {
      prevToolsResetSeqRef.current = toolsResetSeq;
      if (toolsResetSeq > 0 && viewModeRef.current === 'detail') {
        closeToolDetail();
      }
    }
  }, [toolsResetSeq, closeToolDetail]);

  useSystemBackLayer(
    viewMode === 'detail',
    closeToolDetail,
    BACK_PRIORITY.SUB_VIEW,
    'tools-detail'
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // -------------------------------------------------------------
  // Tool 1: 📈 股市能源 (实时直连行情 + Google财经交互分析弹窗)
  // -------------------------------------------------------------
  const [liveQuotes, setLiveQuotes] = useState<LiveMarketQuote[]>(() => loadCachedMarketQuotes());
  const [selectedQuote, setSelectedQuote] = useState<LiveMarketQuote | null>(null);
  const [marketCategoryTab, setMarketCategoryTab] = useState<MarketCategory>('index');
  const [marketRegionTab, setMarketRegionTab] = useState<MarketRegion>('cn');
  const [isStockRefreshing, setIsStockRefreshing] = useState(false);
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
  const [lastStockUpdateTime, setLastStockUpdateTime] = useState<string>(() => {
    const cached = loadCachedMarketQuotes();
    return (
      cached[0]?.updatedAt ||
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    );
  });

  const refreshLiveMarkets = useCallback(async (manual = false) => {
    if (manual) setIsStockRefreshing(true);
    try {
      const updated = await fetchAllLiveMarketQuotes(manual);
      if (manual) {
        fetchLiveForexRates(true).then(setForexSnapshot);
      }
      setLiveQuotes(updated);
      const ts =
        updated.find((q) => q.isLive && q.updatedAt)?.updatedAt ||
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      setLastStockUpdateTime(ts);
      setSelectedQuote((prev) => (prev ? updated.find((u) => u.id === prev.id) || prev : null));
      if (manual) {
        showToast(ui.toolToastMarketsSynced);
      }
    } finally {
      if (manual) setIsStockRefreshing(false);
    }
  }, [showToast, ui.toolToastMarketsSynced]);

  const handleRefreshStockMarket = () => {
    refreshLiveMarkets(true);
  };

  const [benchmarkRates, setBenchmarkRates] = useState<LiveBenchmarkRates>(() => loadCachedBenchmarkRates());
  const [isRatesRefreshing, setIsRatesRefreshing] = useState(false);
  const hasCustomLoanRateRef = useRef(false);
  const hasCustomHpfRateRef = useRef(false);
  const hasCustomDepositRateRef = useRef(false);
  const [depositTerm, setDepositTerm] = useState<DepositTermKey>('3y');
  const depositTermRef = useRef<DepositTermKey>('3y');
  depositTermRef.current = depositTerm;
  const [depositCustomRate, setDepositCustomRate] = useState(() => loadCachedBenchmarkRates().depositRates?.['3y'] ?? 1.75);
  const [depositCustomRateInput, setDepositCustomRateInput] = useState(() => (loadCachedBenchmarkRates().depositRates?.['3y'] ?? 1.75).toFixed(2));
  const [loanYears, setLoanYears] = useState(30); // 30年
  const [loanYearsInput, setLoanYearsInput] = useState('30');
  const [loanRatePct, setLoanRatePct] = useState(() => loadCachedBenchmarkRates().lpr5Y);
  const [loanRateInput, setLoanRateInput] = useState(() => loadCachedBenchmarkRates().lpr5Y.toFixed(2));
  const [hpfRatePct, setHpfRatePct] = useState(() => loadCachedBenchmarkRates().providentFundRate);
  const [hpfRateInput, setHpfRateInput] = useState(() => loadCachedBenchmarkRates().providentFundRate.toFixed(2));

  const refreshBenchmarkRates = useCallback(async (manual = false, forceSync = false) => {
    const shouldForce = manual || forceSync;
    if (shouldForce) setIsRatesRefreshing(true);
    try {
      const updated = await fetchLiveBenchmarkRates(shouldForce);
      setBenchmarkRates(updated);
      if (!hasCustomLoanRateRef.current) {
        const autoRate = loanYears > 5 ? updated.lpr5Y : updated.lpr1Y;
        setLoanRatePct(autoRate);
        setLoanRateInput(autoRate.toFixed(2));
      }
      if (!hasCustomHpfRateRef.current) {
        setHpfRatePct(updated.providentFundRate);
        setHpfRateInput(updated.providentFundRate.toFixed(2));
      }
      if (!hasCustomDepositRateRef.current) {
        const autoDepositRate = updated.depositRates?.[depositTermRef.current] ?? 1.75;
        setDepositCustomRate(autoDepositRate);
        setDepositCustomRateInput(autoDepositRate.toFixed(2));
      }
      if (manual) {
        showToast(
          ui.toolToastRatesSynced
            .replace('{lpr1}', updated.lpr1Y.toFixed(2))
            .replace('{lpr5}', updated.lpr5Y.toFixed(2))
        );
      }
    } finally {
      if (shouldForce) setIsRatesRefreshing(false);
    }
  }, [loanYears, showToast, ui.toolToastRatesSynced]);

  useEffect(() => {
    if (!hasCustomLoanRateRef.current) {
      const autoRate = loanYears > 5 ? benchmarkRates.lpr5Y : benchmarkRates.lpr1Y;
      setLoanRatePct(autoRate);
      setLoanRateInput(autoRate.toFixed(2));
    }
  }, [loanYears, benchmarkRates.lpr1Y, benchmarkRates.lpr5Y]);

  // -------------------------------------------------------------
  // Tool 2: 📊 经济指标 (CPI, PCE, PPI, PMI, TSF, MLF, 10Y Yield, 青年失业率)
  // -------------------------------------------------------------
  const [macroIndicators, setMacroIndicators] = useState<MacroIndicator[]>(() => loadCachedMacroIndicators());
  const [isMacroRefreshing, setIsMacroRefreshing] = useState(false);
  const [activeTrendModal, setActiveTrendModal] = useState<MacroIndicator | null>(null);
  const [showHouseholdLoansModal, setShowHouseholdLoansModal] = useState(false);
  const [showMajorMacroModal, setShowMajorMacroModal] = useState(false);
  const [macroComparisonMode, setMacroComparisonMode] = useState<MacroComparisonMode | null>(null);

  const refreshLiveMacro = useCallback(async (manual = false, forceSync = false) => {
    if (manual) setIsMacroRefreshing(true);
    const shouldForce = manual || forceSync;
    try {
      const [updated] = await Promise.all([
        fetchLiveMacroIndicators(shouldForce),
        fetchLiveMajorMacroMatrix(shouldForce),
      ]);
      if (manual) {
        fetchAllLiveMarketQuotes(true).then(setLiveQuotes);
        fetchLiveForexRates(true).then(setForexSnapshot);
      }
      setMacroIndicators(updated);
      setActiveTrendModal((prev) => (prev ? updated.find((u) => u.id === prev.id) || prev : null));
      if (manual) {
        showToast(ui.toolToastMacroSynced);
      }
    } finally {
      if (manual) setIsMacroRefreshing(false);
    }
  }, [showToast, ui.toolToastMacroSynced]);

  // Sync live feeds on mount, on tab entry, and on global app-live-sync
  useEffect(() => {
    refreshLiveMarkets(false);
    refreshBenchmarkRates(false);
    refreshLiveMacro(false);
    fetchLiveForexRates().then(setForexSnapshot);
    let syncTimeoutId: number | null = null;
    const onGlobalSyncStart = () => {
      setIsGlobalSyncing(true);
      if (syncTimeoutId) window.clearTimeout(syncTimeoutId);
      syncTimeoutId = window.setTimeout(() => setIsGlobalSyncing(false), 12000);
    };
    const onGlobalSync = () => {
      if (syncTimeoutId) {
        window.clearTimeout(syncTimeoutId);
        syncTimeoutId = null;
      }
      setIsGlobalSyncing(false);
      setLiveQuotes(loadCachedMarketQuotes());
      setMacroIndicators(loadCachedMacroIndicators());
      const cachedNet = loadCachedNetworkInfo();
      setNetInfo(cachedNet);
      setForexSnapshot(loadCachedForexRates());
      const latestRates = loadCachedBenchmarkRates();
      setBenchmarkRates(latestRates);
      if (!hasCustomLoanRateRef.current) {
        const autoRate = loanYears > 5 ? latestRates.lpr5Y : latestRates.lpr1Y;
        setLoanRatePct(autoRate);
        setLoanRateInput(autoRate.toFixed(2));
      }
      if (!hasCustomHpfRateRef.current) {
        setHpfRatePct(latestRates.providentFundRate);
        setHpfRateInput(latestRates.providentFundRate.toFixed(2));
      }
      if (!hasCustomDepositRateRef.current) {
        const autoDepRate = latestRates.depositRates?.[depositTermRef.current] ?? 1.75;
        setDepositCustomRate(autoDepRate);
        setDepositCustomRateInput(autoDepRate.toFixed(2));
      }
    };
    window.addEventListener('app-live-sync-start', onGlobalSyncStart);
    window.addEventListener('app-live-sync', onGlobalSync);
    return () => {
      if (syncTimeoutId) window.clearTimeout(syncTimeoutId);
      window.removeEventListener('app-live-sync-start', onGlobalSyncStart);
      window.removeEventListener('app-live-sync', onGlobalSync);
    };
  }, [loanYears, refreshLiveMarkets, refreshBenchmarkRates, refreshLiveMacro]);

  useEffect(() => {
    if (activeTab === 'stocks') {
      refreshLiveMarkets(false);
      fetchLiveForexRates().then(setForexSnapshot);
    } else if (activeTab === 'macro') {
      refreshLiveMacro(false, true);
      refreshLiveMarkets(false);
      fetchLiveForexRates().then(setForexSnapshot);
    } else if (activeTab === 'rates') {
      hasCustomLoanRateRef.current = false;
      hasCustomHpfRateRef.current = false;
      hasCustomDepositRateRef.current = false;
      refreshBenchmarkRates(false, true);
    } else if (activeTab === 'forex') {
      fetchLiveForexRates().then(setForexSnapshot);
    } else if (activeTab === 'travel') {
      fetchLiveTravelSync(false).then(setTravelSync);
    } else if (activeTab === 'speedtest') {
      fetchLiveNetworkInfo().then(setNetInfo);
    }
  }, [activeTab, refreshLiveMarkets, refreshBenchmarkRates, refreshLiveMacro]);

  // Periodic live polling every 15s while viewing stocks
  useEffect(() => {
    if (activeTab !== 'stocks') return;
    const timer = setInterval(() => {
      refreshLiveMarkets(false);
    }, 15000);
    return () => clearInterval(timer);
  }, [activeTab, refreshLiveMarkets]);

  const energyQuotes = useMemo(() => liveQuotes.filter((q) => q.category === 'energy'), [liveQuotes]);
  const metalsQuotes = useMemo(() => liveQuotes.filter((q) => q.category === 'metal'), [liveQuotes]);

  // -------------------------------------------------------------
  // Tool 3: 💰 存贷测算 (商业/公积金/组合贷 + LPR基点 + 提前还贷 + 明细导出 + 复利/定存)
  // -------------------------------------------------------------
  const ratesPro = useMemo(() => getRatesProLabels(settings.language), [settings.language]);
  const [rateCalcType, setRateCalcType] = useState<'loan' | 'deposit'>('deposit');
  const [loanPortfolioType, setLoanPortfolioType] = useState<LoanPortfolioType>('commercial');
  const [loanAmountWan, setLoanAmountWan] = useState(100); // 100万元 (商贷/主贷)
  const [loanAmountInput, setLoanAmountInput] = useState('100');
  const [hpfAmountWan, setHpfAmountWan] = useState(80); // 80万元 (组合贷公积金部分)
  const [hpfAmountInput, setHpfAmountInput] = useState('80');
  const [loanMethod, setLoanMethod] = useState<LoanMethod>('equal_pi');

  // Prepayment & Schedule drawer states
  const [isPrepayOpen, setIsPrepayOpen] = useState(false);
  const [prepayMonth, setPrepayMonth] = useState(12);
  const [prepayAmountWan, setPrepayAmountWan] = useState(20);
  const [prepayStrategy, setPrepayStrategy] = useState<PrepayStrategy>('shorten_term');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleView, setScheduleView] = useState<'yearly' | 'monthly24'>('yearly');

  // Deposit params (Lump-sum fixed deposit with optional auto-rollover & start date)
  const [depositAmount, setDepositAmount] = useState(100000);
  const [depositAmountInput, setDepositAmountInput] = useState('100,000');
  const [depositRolloverCycles, setDepositRolloverCycles] = useState(1);
  const [depositStartDate, setDepositStartDate] = useState<string>(() => toDateString(new Date()));

  // 正则校验与千分位格式化工具
  const formatWithThousands = (rawNumeric: string, maxDecimals = 2): string => {
    if (!rawNumeric) return '';
    const cleaned = rawNumeric.replace(/,/g, '');
    const parts = cleaned.split('.');
    const intRaw = parts[0].replace(/^0+(?=\d)/, '') || '0';
    const intFormatted = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (parts.length > 1) {
      return `${intFormatted}.${parts[1].slice(0, maxDecimals)}`;
    }
    return intFormatted;
  };

  const sanitizeCurrencyInput = (raw: string, allowDecimal: boolean, maxDecimals = 2): string => {
    const stripped = raw.replace(/,/g, '');
    if (!stripped) return '';
    if (!allowDecimal) {
      const digitsOnly = stripped.replace(/\D/g, '').slice(0, 10);
      if (!digitsOnly) return '';
      return digitsOnly.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    let result = '';
    let hasDot = false;
    for (const ch of stripped) {
      if (/\d/.test(ch)) {
        result += ch;
      } else if (ch === '.' && !hasDot) {
        hasDot = true;
        result += result === '' ? '0.' : '.';
      }
    }
    if (!result) return '';
    const [intPart, decPart] = result.split('.');
    const safeInt = (intPart.replace(/^0+(?=\d)/, '') || '0').slice(0, 8);
    const commaInt = safeInt.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (hasDot) {
      return `${commaInt}.${(decPart ?? '').slice(0, maxDecimals)}`;
    }
    return commaInt;
  };

  const parseFormattedNumber = (formatted: string): number => {
    const num = parseFloat(formatted.replace(/,/g, ''));
    return Number.isFinite(num) ? num : 0;
  };

  const handleLoanAmountChange = (raw: string) => {
    const formatted = sanitizeCurrencyInput(raw, true, 2);
    setLoanAmountInput(formatted);
    const parsed = parseFormattedNumber(formatted);
    setLoanAmountWan(Math.max(0, Math.min(100000, parsed)));
  };

  const handleLoanAmountBlur = () => {
    const clamped = Math.max(0, Math.min(100000, parseFormattedNumber(loanAmountInput)));
    setLoanAmountWan(clamped);
    setLoanAmountInput(clamped > 0 ? formatWithThousands(String(clamped), 2) : '0');
  };

  const handleHpfAmountChange = (raw: string) => {
    const formatted = sanitizeCurrencyInput(raw, true, 2);
    setHpfAmountInput(formatted);
    const parsed = parseFormattedNumber(formatted);
    setHpfAmountWan(Math.max(0, Math.min(100000, parsed)));
  };

  const handleHpfAmountBlur = () => {
    const clamped = Math.max(0, Math.min(100000, parseFormattedNumber(hpfAmountInput)));
    setHpfAmountWan(clamped);
    setHpfAmountInput(clamped > 0 ? formatWithThousands(String(clamped), 2) : '0');
  };

  const handleLoanYearsChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 3);
    setLoanYearsInput(digits);
    const parsed = parseInt(digits, 10);
    if (Number.isFinite(parsed) && parsed >= 1) {
      setLoanYears(Math.min(100, parsed));
    }
  };

  const handleLoanYearsBlur = () => {
    const parsed = parseInt(loanYearsInput, 10);
    const clamped = Number.isFinite(parsed) ? Math.max(1, Math.min(100, parsed)) : 1;
    setLoanYears(clamped);
    setLoanYearsInput(String(clamped));
  };

  const handleLoanRateChange = (raw: string) => {
    hasCustomLoanRateRef.current = true;
    const formatted = sanitizeCurrencyInput(raw, true, 2).replace(/,/g, '');
    setLoanRateInput(formatted);
    const parsed = parseFloat(formatted);
    if (Number.isFinite(parsed)) {
      setLoanRatePct(Math.max(0, Math.min(30, parsed)));
    } else if (!formatted) {
      setLoanRatePct(0);
    }
  };

  const handleLoanRateBlur = () => {
    const parsed = parseFloat(loanRateInput);
    const clamped = Number.isFinite(parsed) ? Math.max(0, Math.min(30, parsed)) : 0;
    setLoanRatePct(clamped);
    setLoanRateInput(clamped.toFixed(2));
  };

  const handleHpfRateChange = (raw: string) => {
    hasCustomHpfRateRef.current = true;
    const formatted = sanitizeCurrencyInput(raw, true, 2).replace(/,/g, '');
    setHpfRateInput(formatted);
    const parsed = parseFloat(formatted);
    if (Number.isFinite(parsed)) {
      setHpfRatePct(Math.max(0, Math.min(30, parsed)));
    } else if (!formatted) {
      setHpfRatePct(0);
    }
  };

  const handleHpfRateBlur = () => {
    const parsed = parseFloat(hpfRateInput);
    const clamped = Number.isFinite(parsed) ? Math.max(0, Math.min(30, parsed)) : 0;
    setHpfRatePct(clamped);
    setHpfRateInput(clamped.toFixed(2));
  };

  const handleDepositAmountChange = (raw: string) => {
    const formatted = sanitizeCurrencyInput(raw, false, 0);
    setDepositAmountInput(formatted);
    const parsed = parseFormattedNumber(formatted);
    setDepositAmount(Math.max(0, Math.min(1000000000, parsed)));
  };

  const handleDepositAmountBlur = () => {
    const clamped = Math.max(0, Math.min(1000000000, Math.round(parseFormattedNumber(depositAmountInput))));
    setDepositAmount(clamped);
    setDepositAmountInput(clamped.toLocaleString('en-US'));
  };

  const handleDepositCustomRateChange = (raw: string) => {
    hasCustomDepositRateRef.current = true;
    const formatted = sanitizeCurrencyInput(raw, true, 2).replace(/,/g, '');
    setDepositCustomRateInput(formatted);
    const parsed = parseFloat(formatted);
    if (Number.isFinite(parsed)) {
      setDepositCustomRate(Math.max(0, Math.min(30, parsed)));
    } else if (!formatted) {
      setDepositCustomRate(0);
    }
  };

  const handleDepositCustomRateBlur = () => {
    const parsed = parseFloat(depositCustomRateInput);
    const clamped = Number.isFinite(parsed) ? Math.max(0, Math.min(30, parsed)) : 0;
    setDepositCustomRate(clamped);
    setDepositCustomRateInput(clamped.toFixed(2));
  };

  const depositRateTable: Record<DepositTermKey, { label: string; rate: number; months: number }> = useMemo(() => {
    const lang = settings.language;
    const labels: Record<string, [string, string, string, string, string, string, string, string]> = {
      'zh-CN': ['活期存款', '三个月定存', '半年定存', '一年期定存', '二年期定存', '三年期定存', '五年期定存', '大额存单(3年)'],
      'zh-TW': ['活期存款', '三個月定存', '半年定存', '一年期定存', '二年期定存', '三年期定存', '五年期定存', '大額存單(3年)'],
      ja: ['普通預金', '3ヶ月定期', '6ヶ月定期', '1年定期', '2年定期', '3年定期', '5年定期', '大口定期(3年)'],
      ko: ['보통예금', '3개월 정기', '6개월 정기', '1년 정기', '2년 정기', '3년 정기', '5년 정기', 'CD (3년)'],
      fr: ['À vue', '3 mois', '6 mois', '1 an', '2 ans', '3 ans', '5 ans', 'CD 3 ans'],
      ru: ['До востреб.', '3 мес.', '6 мес.', '1 год', '2 года', '3 года', '5 лет', 'Депозит 3Г'],
      fa: ['جاری', '۳ ماهه', '۶ ماهه', '۱ ساله', '۲ ساله', '۳ ساله', '۵ ساله', 'گواهی ۳س'],
      mn: ['Хугацаагүй', '3 сар', '6 сар', '1 жил', '2 жил', '3 жил', '5 жил', 'Хадгаламж 3Ж'],
      ug: ['نەق ئامانەت', '3 ئايلىق', '6 ئايلىق', '1 يىللىق', '2 يىللىق', '3 يىللىق', '5 يىللىق', 'چوڭ ئامانەت(3ي)'],
      en: ['Demand', '3M Fixed', '6M Fixed', '1Y Fixed', '2Y Fixed', '3Y Fixed', '5Y Fixed', 'CD 3Y'],
    };
    const l = labels[lang] || labels.en;
    const dr = benchmarkRates.depositRates;
    return {
      demand: { label: l[0], rate: dr?.demand ?? 0.15, months: 12 },
      '3m': { label: l[1], rate: dr?.['3m'] ?? 1.05, months: 3 },
      '6m': { label: l[2], rate: dr?.['6m'] ?? 1.25, months: 6 },
      '1y': { label: l[3], rate: dr?.['1y'] ?? 1.35, months: 12 },
      '2y': { label: l[4], rate: dr?.['2y'] ?? 1.45, months: 24 },
      '3y': { label: l[5], rate: dr?.['3y'] ?? 1.75, months: 36 },
      '5y': { label: l[6], rate: dr?.['5y'] ?? 1.80, months: 60 },
      cd3y: { label: l[7], rate: dr?.cd3y ?? 2.15, months: 36 },
    };
  }, [settings.language, benchmarkRates.depositRates]);

  const loanSummary = useMemo(() => {
    if (loanPortfolioType === 'commercial') {
      return calculateSingleLoanSchedule(loanAmountWan, loanYears, loanRatePct, loanMethod);
    }
    if (loanPortfolioType === 'provident') {
      return calculateSingleLoanSchedule(loanAmountWan, loanYears, hpfRatePct, loanMethod);
    }
    const commPart = calculateSingleLoanSchedule(loanAmountWan, loanYears, loanRatePct, loanMethod);
    const hpfPart = calculateSingleLoanSchedule(hpfAmountWan, loanYears, hpfRatePct, loanMethod);
    return mergeLoanSummaries(commPart, hpfPart);
  }, [loanPortfolioType, loanAmountWan, hpfAmountWan, loanYears, loanRatePct, hpfRatePct, loanMethod]);

  const effectiveAnnualRatePct = useMemo(() => {
    if (loanPortfolioType === 'commercial') return loanRatePct;
    if (loanPortfolioType === 'provident') return hpfRatePct;
    const totalWan = loanAmountWan + hpfAmountWan;
    if (totalWan <= 0) return loanRatePct;
    return (loanAmountWan * loanRatePct + hpfAmountWan * hpfRatePct) / totalWan;
  }, [loanPortfolioType, loanAmountWan, hpfAmountWan, loanRatePct, hpfRatePct]);

  const loanComparisonDiff = useMemo(() => {
    if (loanMethod === 'interest_first') return 0;
    const altMethod: LoanMethod = loanMethod === 'equal_pi' ? 'equal_p' : 'equal_pi';
    const altSummary =
      loanPortfolioType === 'commercial'
        ? calculateSingleLoanSchedule(loanAmountWan, loanYears, loanRatePct, altMethod)
        : loanPortfolioType === 'provident'
        ? calculateSingleLoanSchedule(loanAmountWan, loanYears, hpfRatePct, altMethod)
        : mergeLoanSummaries(
            calculateSingleLoanSchedule(loanAmountWan, loanYears, loanRatePct, altMethod),
            calculateSingleLoanSchedule(hpfAmountWan, loanYears, hpfRatePct, altMethod)
          );
    if (loanMethod === 'equal_pi') {
      return Math.max(0, loanSummary.totalInterest - altSummary.totalInterest);
    }
    return Math.max(0, loanSummary.firstMonthPayment - altSummary.firstMonthPayment);
  }, [loanMethod, loanPortfolioType, loanAmountWan, hpfAmountWan, loanYears, loanRatePct, hpfRatePct, loanSummary]);

  const prepayResult = useMemo(() => {
    return simulatePrepayment(
      loanSummary,
      effectiveAnnualRatePct,
      loanMethod,
      prepayMonth,
      prepayAmountWan,
      prepayStrategy
    );
  }, [loanSummary, effectiveAnnualRatePct, loanMethod, prepayMonth, prepayAmountWan, prepayStrategy]);

  const handleExportLoanCsv = () => {
    if (loanSummary.monthlySchedule.length === 0) return;
    const headers = [
      ratesPro.colPeriod,
      ratesPro.colPayment,
      ratesPro.colPrincipal,
      ratesPro.colInterest,
      ratesPro.colRemaining,
    ];
    const rows = loanSummary.monthlySchedule.map((r) => [
      String(r.month),
      r.payment.toFixed(2),
      r.principal.toFixed(2),
      r.interest.toFixed(2),
      r.remaining.toFixed(2),
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    void saveFileToDevice(`loan-schedule-${todayStr}.csv`, csvContent, 'text/csv;charset=utf-8;').then((res) => {
      if (res.ok) showToast(ratesPro.exportCsvToast);
    });
  };

  const handleAddLoanReminderToCalendar = () => {
    const methodLabel =
      loanMethod === 'equal_pi'
        ? ui.toolRatesEqualPi
        : loanMethod === 'equal_p'
        ? ui.toolRatesEqualP
        : ui.toolRatesInterestFirst;
    const newEvent: CalendarEvent = {
      id: `evt-loan-${Date.now()}`,
      title: `🏦 ${ui.toolRatesLoanMode}: ¥${loanSummary.firstMonthPayment.toFixed(2)}`,
      startDate: todayStr,
      endDate: todayStr,
      startTime: '09:00',
      endTime: '09:30',
      isAllDay: false,
      categoryId: 'finance',
      recurrence: 'monthly',
      location: methodLabel,
      description: `${methodLabel} · ${loanYears}${ui.toolRatesUnitYears} · ${effectiveAnnualRatePct.toFixed(2)}%`,
      reminder: '1d',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onUpdateEvent(newEvent);
    showToast(ratesPro.addedLoanEventToast);
  };

  const depositCalculationResult = useMemo(() => {
    const item = depositRateTable[depositTerm];
    return calculateAdvancedDeposit({
      mode: 'lump',
      principalOrMonthly: depositAmount,
      months: item.months,
      annualRatePct: depositCustomRate,
      rolloverCycles: depositRolloverCycles,
      startDateStr: depositStartDate || todayStr,
    });
  }, [depositAmount, depositRateTable, depositTerm, depositCustomRate, depositRolloverCycles, depositStartDate, todayStr]);

  const depositTermComparisons = useMemo(() => {
    const compareKeys: DepositTermKey[] = ['1y', '2y', '3y', '5y', 'cd3y'];
    return compareKeys.map((key) => {
      const cfg = depositRateTable[key];
      const res = calculateAdvancedDeposit({
        mode: 'lump',
        principalOrMonthly: depositAmount,
        months: cfg.months,
        annualRatePct: cfg.rate,
        rolloverCycles: depositRolloverCycles,
        startDateStr: depositStartDate || todayStr,
      });
      return {
        key,
        label: cfg.label,
        rate: cfg.rate,
        interest: res.interest,
        total: res.total,
      };
    });
  }, [depositAmount, depositRateTable, depositRolloverCycles, depositStartDate, todayStr]);

  const handleAddDepositMaturityToCalendar = () => {
    const newEvent: CalendarEvent = {
      id: `evt-deposit-${Date.now()}`,
      title: `💰 ${ui.toolRatesDepositMode} · ¥${depositCalculationResult.total.toLocaleString('en-US')}`,
      startDate: depositCalculationResult.maturityDateStr,
      endDate: depositCalculationResult.maturityDateStr,
      startTime: '09:30',
      endTime: '10:00',
      isAllDay: false,
      categoryId: 'finance',
      recurrence: 'none',
      location: depositRateTable[depositTerm].label,
      description: `${depositCustomRate.toFixed(2)}% · +¥${depositCalculationResult.interest.toLocaleString('en-US')}`,
      reminder: '1d',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onUpdateEvent(newEvent);
    showToast(ratesPro.addedMaturityToast.replace('{date}', depositCalculationResult.maturityDateStr));
  };

  // -------------------------------------------------------------
  // Tool 4: 💱 实时汇率 (双向实时换算 + 历史走势 + 明确数据源标注)
  // -------------------------------------------------------------
  const [forexSnapshot, setForexSnapshot] = useState<LiveForexSnapshot>(() => loadCachedForexRates());
  const TROY_OZ_GRAMS = 31.1034768;
  const usdToCny = forexSnapshot.rates.CNY || 6.6757;
  const [forexBaseCurrency, setForexBaseCurrency] = useState('CNY');
  const [forexTargetCurrency, setForexTargetCurrency] = useState('USD');
  const [forexInputStr, setForexInputStr] = useState('100');
  const [forexTargetStr, setForexTargetStr] = useState('');
  const [forexLastEditedSide, setForexLastEditedSide] = useState<'base' | 'target'>('base');
  const [isForexRefreshing, setIsForexRefreshing] = useState(false);
  const [forexPairTimeframe, setForexPairTimeframe] = useState<ForexPairTimeframe>('1M');
  const [forexPairSeries, setForexPairSeries] = useState<ForexPairSeries | null>(null);
  const [isForexHistoryLoading, setIsForexHistoryLoading] = useState(false);
  const [forexPairHoverIdx, setForexPairHoverIdx] = useState<number | null>(null);
  const [forexCopied, setForexCopied] = useState(false);
  const forexSvgRef = useRef<SVGSVGElement | null>(null);

  const forexPro = useMemo(() => {
    const map: Record<
      string,
      {
        fromLabel: string;
        toLabel: string;
        swapLabel: string;
        copyLabel: string;
        copiedLabel: string;
        sourcePrefix: string;
        quoteDateLabel: string;
        trendTitle: string;
        chartSourceLabel: string;
        highLabel: string;
        lowLabel: string;
        baseBadge: string;
        targetBadge: string;
        disclaimer: string;
        tfLabels: Record<ForexPairTimeframe, string>;
        providers: Record<'er_api' | 'ecb' | 'fawaz' | 'cache', string>;
      }
    > = {
      'zh-CN': {
        fromLabel: '持有币种',
        toLabel: '目标币种',
        swapLabel: '互换币种',
        copyLabel: '复制换算结果',
        copiedLabel: '已复制',
        sourcePrefix: '数据来源',
        quoteDateLabel: '报价日期',
        trendTitle: '汇率走势',
        chartSourceLabel: '走势源',
        highLabel: '区间最高',
        lowLabel: '区间最低',
        baseBadge: '基准',
        targetBadge: '目标',
        disclaimer: '采用国际外汇中间价参考数据，实际结售汇请以银行实时牌价为准',
        tfLabels: { '7D': '7天', '1M': '1个月', '3M': '3个月', '1Y': '1年' },
        providers: {
          er_api: 'ExchangeRate-API（国际银行间中间价）',
          ecb: '欧洲央行 ECB（Frankfurter 参考汇率）',
          fawaz: 'FawazFX 全球实时汇率源',
          cache: '本地参考汇率缓存',
        },
      },
      'zh-TW': {
        fromLabel: '持有幣種',
        toLabel: '目標幣種',
        swapLabel: '互換幣種',
        copyLabel: '複製換算結果',
        copiedLabel: '已複製',
        sourcePrefix: '數據來源',
        quoteDateLabel: '報價日期',
        trendTitle: '匯率走勢',
        chartSourceLabel: '走勢源',
        highLabel: '區間最高',
        lowLabel: '區間最低',
        baseBadge: '基準',
        targetBadge: '目標',
        disclaimer: '採用國際外匯中間價參考數據，實際交易請以銀行即時牌價為準',
        tfLabels: { '7D': '7天', '1M': '1個月', '3M': '3個月', '1Y': '1年' },
        providers: {
          er_api: 'ExchangeRate-API（國際銀行間中間價）',
          ecb: '歐洲央行 ECB（Frankfurter 參考匯率）',
          fawaz: 'FawazFX 全球即時匯率源',
          cache: '本地參考匯率快取',
        },
      },
      ja: {
        fromLabel: '換算元',
        toLabel: '換算先',
        swapLabel: '通貨入替',
        copyLabel: '結果をコピー',
        copiedLabel: 'コピー済',
        sourcePrefix: 'データ出典',
        quoteDateLabel: '基準日',
        trendTitle: '為替推移',
        chartSourceLabel: '推移出典',
        highLabel: '高値',
        lowLabel: '安値',
        baseBadge: '基準',
        targetBadge: '対象',
        disclaimer: 'インターバンク仲値参考レート（実取引は各金融機関レートをご確認ください）',
        tfLabels: { '7D': '7日', '1M': '1ヶ月', '3M': '3ヶ月', '1Y': '1年' },
        providers: {
          er_api: 'ExchangeRate-API (銀行間仲値)',
          ecb: '欧州中央銀行 ECB (Frankfurter)',
          fawaz: 'FawazFX グローバル為替フィード',
          cache: 'ローカルキャッシュ',
        },
      },
      ko: {
        fromLabel: '보유 통화',
        toLabel: '목표 통화',
        swapLabel: '통화 전환',
        copyLabel: '결과 복사',
        copiedLabel: '복사됨',
        sourcePrefix: '데이터 출처',
        quoteDateLabel: '기준일',
        trendTitle: '환율 추이',
        chartSourceLabel: '차트 출처',
        highLabel: '최고',
        lowLabel: '최저',
        baseBadge: '기준',
        targetBadge: '목표',
        disclaimer: '국제 매매기준율 참고치이며 실제 거래 시 은행 고시 환율을 확인하세요',
        tfLabels: { '7D': '7일', '1M': '1개월', '3M': '3개월', '1Y': '1년' },
        providers: {
          er_api: 'ExchangeRate-API (은행간 기준율)',
          ecb: '유럽중앙은행 ECB (Frankfurter)',
          fawaz: 'FawazFX 글로벌 환율',
          cache: '로컬 캐시',
        },
      },
      en: {
        fromLabel: 'From',
        toLabel: 'To',
        swapLabel: 'Swap Currencies',
        copyLabel: 'Copy Result',
        copiedLabel: 'Copied',
        sourcePrefix: 'Source',
        quoteDateLabel: 'Quote Date',
        trendTitle: 'Pair Trend',
        chartSourceLabel: 'Chart Source',
        highLabel: 'High',
        lowLabel: 'Low',
        baseBadge: 'Base',
        targetBadge: 'Target',
        disclaimer: 'Mid-market FX reference rates for informational use; check bank execution quotes',
        tfLabels: { '7D': '7D', '1M': '1M', '3M': '3M', '1Y': '1Y' },
        providers: {
          er_api: 'ExchangeRate-API (Mid-Market)',
          ecb: 'European Central Bank (Frankfurter)',
          fawaz: 'FawazFX Global FX Feed',
          cache: 'Local Fallback Cache',
        },
      },
    };
    return map[settings.language] || map.en;
  }, [settings.language]);

  const sanitizeForexDecimal = (raw: string): string => {
    const cleaned = raw.replace(/[^\d.]/g, '');
    const firstDot = cleaned.indexOf('.');
    const normalized =
      firstDot === -1
        ? cleaned
        : `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, '')}`;
    return normalized.slice(0, 14);
  };

  const formatForexNumericInput = (val: number, code: string): string => {
    if (!Number.isFinite(val) || val <= 0) return '0';
    const dec = val < 1 ? 4 : code === 'JPY' || code === 'KRW' ? 2 : 2;
    return Number(val.toFixed(dec)).toString();
  };

  const currencyMatrix: Record<
    string,
    { name: string; nameTw: string; nameEn: string; symbol: string; flag: string; rateToUsd: number }
  > = useMemo(
    () => ({
      CNY: { name: '人民币', nameTw: '人民幣', nameEn: 'CNY', symbol: '¥', flag: '🇨🇳', rateToUsd: forexSnapshot.rates.CNY || 6.6757 },
      USD: { name: '美元', nameTw: '美元', nameEn: 'USD', symbol: '$', flag: '🇺🇸', rateToUsd: 1.0 },
      EUR: { name: '欧元', nameTw: '歐元', nameEn: 'EUR', symbol: '€', flag: '🇪🇺', rateToUsd: forexSnapshot.rates.EUR || 0.9145 },
      JPY: { name: '日元', nameTw: '日圓', nameEn: 'JPY', symbol: '¥', flag: '🇯🇵', rateToUsd: forexSnapshot.rates.JPY || 159.32 },
      HKD: { name: '港币', nameTw: '港幣', nameEn: 'HKD', symbol: 'HK$', flag: '🇭🇰', rateToUsd: forexSnapshot.rates.HKD || 7.838 },
      GBP: { name: '英镑', nameTw: '英鎊', nameEn: 'GBP', symbol: '£', flag: '🇬🇧', rateToUsd: forexSnapshot.rates.GBP || 0.7657 },
      TWD: { name: '新台币', nameTw: '新台幣', nameEn: 'TWD', symbol: 'NT$', flag: '🇹🇼', rateToUsd: forexSnapshot.rates.TWD || 31.85 },
      KRW: { name: '韩元', nameTw: '韓元', nameEn: 'KRW', symbol: '₩', flag: '🇰🇷', rateToUsd: forexSnapshot.rates.KRW || 1345.4 },
      SGD: { name: '新加坡元', nameTw: '新加坡幣', nameEn: 'SGD', symbol: 'S$', flag: '🇸🇬', rateToUsd: forexSnapshot.rates.SGD || 1.326 },
      AUD: { name: '澳元', nameTw: '澳幣', nameEn: 'AUD', symbol: 'A$', flag: '🇦🇺', rateToUsd: forexSnapshot.rates.AUD || 1.5221 },
      CAD: { name: '加拿大元', nameTw: '加幣', nameEn: 'CAD', symbol: 'C$', flag: '🇨🇦', rateToUsd: forexSnapshot.rates.CAD || 1.4258 },
      CHF: { name: '瑞士法郎', nameTw: '瑞士法郎', nameEn: 'CHF', symbol: 'Fr', flag: '🇨🇭', rateToUsd: forexSnapshot.rates.CHF || 0.8308 },
    }),
    [forexSnapshot.rates]
  );

  const getUnitExchangeRate = useCallback(
    (fromCode: string, toCode: string): number => {
      const baseItem = currencyMatrix[fromCode];
      const targetItem = currencyMatrix[toCode];
      if (!baseItem || !targetItem || baseItem.rateToUsd <= 0) return 0;
      const res = targetItem.rateToUsd / baseItem.rateToUsd;
      return Number.isFinite(res) ? res : 0;
    },
    [currencyMatrix]
  );

  const forexInputAmount = useMemo(() => {
    const parsed = parseFloat(forexInputStr);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [forexInputStr]);

  const getConvertedRate = (targetCode: string) => {
    try {
      const unitRate = getUnitExchangeRate(forexBaseCurrency, targetCode);
      const res = forexInputAmount * unitRate;
      return Number.isFinite(res) ? res : 0;
    } catch {
      return 0;
    }
  };

  const displayTargetStr =
    forexLastEditedSide === 'target'
      ? forexTargetStr
      : formatForexNumericInput(getConvertedRate(forexTargetCurrency), forexTargetCurrency);

  const handleForexInputChange = (raw: string) => {
    setForexLastEditedSide('base');
    setForexInputStr(sanitizeForexDecimal(raw));
  };

  const handleForexTargetInputChange = (raw: string) => {
    const trimmed = sanitizeForexDecimal(raw);
    setForexLastEditedSide('target');
    setForexTargetStr(trimmed);
    const parsedTarget = parseFloat(trimmed);
    const unitRate = getUnitExchangeRate(forexBaseCurrency, forexTargetCurrency);
    if (Number.isFinite(parsedTarget) && parsedTarget > 0 && unitRate > 0) {
      setForexInputStr(formatForexNumericInput(parsedTarget / unitRate, forexBaseCurrency));
    } else {
      setForexInputStr('0');
    }
  };

  const handleSwapForexPair = () => {
    const nextBase = forexTargetCurrency;
    const nextTarget = forexBaseCurrency;
    setForexBaseCurrency(nextBase);
    setForexTargetCurrency(nextTarget);
    setForexLastEditedSide('base');
    setForexPairHoverIdx(null);
  };

  const handleCopyForexResult = () => {
    const outVal = displayTargetStr || '0';
    const text = `${forexInputStr || '0'} ${forexBaseCurrency} = ${outVal} ${forexTargetCurrency}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setForexCopied(true);
        window.setTimeout(() => setForexCopied(false), 1800);
      }).catch(() => {});
    }
  };

  const handleRefreshForex = async () => {
    setIsForexRefreshing(true);
    try {
      const snap = await fetchLiveForexRates(true);
      setForexSnapshot(snap);
      showToast(`${ui.toolLastUpdated} ${snap.updatedAt}`);
    } finally {
      setIsForexRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'forex') return;
    let active = true;
    const spot = getUnitExchangeRate(forexBaseCurrency, forexTargetCurrency);
    setIsForexHistoryLoading(true);
    setForexPairHoverIdx(null);
    fetchForexPairSeries(forexBaseCurrency, forexTargetCurrency, forexPairTimeframe, spot)
      .then((res) => {
        if (active) setForexPairSeries(res);
      })
      .finally(() => {
        if (active) setIsForexHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, forexBaseCurrency, forexTargetCurrency, forexPairTimeframe, getUnitExchangeRate]);

  // -------------------------------------------------------------
  // Tool 5: 💳 极简记账 (收入、支出、结余在同一个展示框内显示)
  // -------------------------------------------------------------
  const accCategoryOptions = useMemo(() => {
    switch (settings.language) {
      case 'zh-CN':
        return ['餐饮美食', '交通出行', '日用生活', '数码设备', '文娱休闲', '薪资报酬', '投资理财'];
      case 'zh-TW':
        return ['餐飲美食', '交通出行', '日用生活', '數位裝置', '文娛休閒', '薪資報酬', '投資理財'];
      case 'ja':
        return ['食事', '交通', '日用品', 'デジタル', '娯楽', '給与', '投資'];
      case 'ko':
        return ['식비', '교통', '생활용품', '디지털', '여가', '급여', '투자'];
      case 'fr':
        return ['Repas', 'Transport', 'Quotidien', 'Tech', 'Loisirs', 'Salaire', 'Épargne'];
      case 'ru':
        return ['Питание', 'Транспорт', 'Быт', 'Техника', 'Досуг', 'Зарплата', 'Инвестиции'];
      case 'fa':
        return ['غذا', 'حمل‌ونقل', 'روزمره', 'دیجیتال', 'تفریح', 'حقوق', 'سرمایه‌گذاری'];
      case 'mn':
        return ['Хоол', 'Тээвэр', 'Ахуй', 'Төхөөрөмж', 'Чөлөөт цаг', 'Цалин', 'Хөрөнгө оруулалт'];
      case 'ug':
        return ['تاماق', 'قاتناش', 'تۇرمۇش', 'رەقەملىك', 'كۆڭۈل ئېچىش', 'مائاش', 'مەبلەغ'];
      default:
        return ['Dining', 'Transit', 'Daily', 'Tech', 'Leisure', 'Salary', 'Investment'];
    }
  }, [settings.language]);

  const accAccountOptions = useMemo(() => {
    switch (settings.language) {
      case 'zh-CN':
        return ['微信支付', '支付宝', '招商银行', '工商银行', '现金'];
      case 'zh-TW':
        return ['LINE Pay', '街口支付', '銀行卡', '信用卡', '現金'];
      case 'ja':
        return ['PayPay', 'クレジットカード', '銀行口座', '交通系IC', '現金'];
      case 'ko':
        return ['카카오페이', '신용카드', '은행 계좌', '교통카드', '현금'];
      case 'fr':
        return ['Apple Pay', 'Carte bancaire', 'Virement', 'Portefeuille', 'Espèces'];
      case 'ru':
        return ['Карта', 'СБП', 'Банк', 'Электронный кошелёк', 'Наличные'];
      case 'fa':
        return ['کارت بانکی', 'کیف پول', 'حساب جاری', 'انتقال', 'نقد'];
      case 'mn':
        return ['Карт', 'Цахим хэтэвч', 'Данс', 'Шилжүүлэг', 'Бэлэн мөнгө'];
      case 'ug':
        return ['ئۈندىدار', 'ئالىپاي', 'بانكا كارتىسى', 'ئىناۋەت كارتا', 'نەق پۇل'];
      default:
        return ['Apple Pay', 'Credit Card', 'Bank Account', 'Debit Card', 'Cash'];
    }
  }, [settings.language]);

  const [accountingList, setAccountingList] = useState<AccountingRecord[]>(() => {
    const saved = readStorageJson<AccountingRecord[]>(
      'tools_accounting_v1',
      (val): val is AccountingRecord[] => Array.isArray(val)
    );
    return saved || [];
  });

  const [newAccType, setNewAccType] = useState<'expense' | 'income'>('expense');
  const [newAccAmount, setNewAccAmount] = useState('');
  const [newAccCategory, setNewAccCategory] = useState(accCategoryOptions[0]);
  const [newAccAccount, setNewAccAccount] = useState(accAccountOptions[0]);
  const [newAccNote, setNewAccNote] = useState('');
  const [newAccDate, setNewAccDate] = useState(todayStr);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [accFilterMonth, setAccFilterMonth] = useState<string>(todayStr.slice(0, 7));
  const [accFilterType, setAccFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [accSearch, setAccSearch] = useState('');
  const accSearchHistory = useSearchHistory('accounting');
  const travelSearchHistory = useSearchHistory('travel');
  const [accSubPanel, setAccSubPanel] = useState<'records' | 'analytics'>('records');
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = readStorageJson<number>(
      'tools_monthly_budget_v1',
      (val): val is number => typeof val === 'number' && Number.isFinite(val) && val >= 0
    );
    return saved ?? 8000;
  });

  const accProLabels = useMemo(() => {
    const map: Record<string, {
      allMonths: string;
      allTypes: string;
      tabRecords: string;
      tabAnalytics: string;
      searchPlaceholder: string;
      budgetProgress: string;
      budgetLeftDaily: string;
      budgetOver: string;
      categoryBreakdown: string;
      accountBreakdown: string;
      exportCsv: string;
      editSave: string;
      cancelEdit: string;
      emptyRecords: string;
      amountInputLabel: string;
    }> = {
      'zh-CN': {
        allMonths: '全部月份',
        allTypes: '全部',
        tabRecords: '明细流水',
        tabAnalytics: '收支分析',
        searchPlaceholder: '搜索分类、账户或备注',
        budgetProgress: '月度预算已用',
        budgetLeftDaily: '日均可用',
        budgetOver: '已超支',
        categoryBreakdown: '分类占比统计',
        accountBreakdown: '账户净额分布',
        exportCsv: '导出CSV',
        editSave: '保存修改',
        cancelEdit: '取消编辑',
        emptyRecords: '当前筛选暂无记账记录',
        amountInputLabel: '金额',
      },
      'zh-TW': {
        allMonths: '全部月份',
        allTypes: '全部',
        tabRecords: '明細流水',
        tabAnalytics: '收支分析',
        searchPlaceholder: '搜尋分類、帳戶或備註',
        budgetProgress: '月度預算已用',
        budgetLeftDaily: '日均可用',
        budgetOver: '已超支',
        categoryBreakdown: '分類佔比統計',
        accountBreakdown: '帳戶淨額分佈',
        exportCsv: '匯出CSV',
        editSave: '儲存修改',
        cancelEdit: '取消編輯',
        emptyRecords: '目前篩選暫無記帳紀錄',
        amountInputLabel: '金額',
      },
      ja: {
        allMonths: '全期間',
        allTypes: 'すべて',
        tabRecords: '取引明細',
        tabAnalytics: '収支分析',
        searchPlaceholder: 'カテゴリ・口座・メモを検索',
        budgetProgress: '月間予算使用率',
        budgetLeftDaily: '1日あたり残り',
        budgetOver: '予算超過',
        categoryBreakdown: 'カテゴリ別内訳',
        accountBreakdown: '口座別残高',
        exportCsv: 'CSV出力',
        editSave: '変更を保存',
        cancelEdit: 'キャンセル',
        emptyRecords: '該当する記録はありません',
        amountInputLabel: '金額',
      },
      ko: {
        allMonths: '전체 월',
        allTypes: '전체',
        tabRecords: '거래 내역',
        tabAnalytics: '수지 분석',
        searchPlaceholder: '분류, 계좌, 메모 검색',
        budgetProgress: '월 예산 사용률',
        budgetLeftDaily: '일일 잔여 예산',
        budgetOver: '예산 초과',
        categoryBreakdown: '분류별 비율',
        accountBreakdown: '계좌별 내역',
        exportCsv: 'CSV 내보내기',
        editSave: '수정 저장',
        cancelEdit: '취소',
        emptyRecords: '표시할 가계부 내역이 없습니다',
        amountInputLabel: '금액',
      },
      fr: {
        allMonths: 'Tous les mois',
        allTypes: 'Tout',
        tabRecords: 'Opérations',
        tabAnalytics: 'Analyse',
        searchPlaceholder: 'Catégorie, compte ou note',
        budgetProgress: 'Budget utilisé',
        budgetLeftDaily: 'Reste / jour',
        budgetOver: 'Dépassé',
        categoryBreakdown: 'Répartition par catégorie',
        accountBreakdown: 'Solde par compte',
        exportCsv: 'Export CSV',
        editSave: 'Mettre à jour',
        cancelEdit: 'Annuler',
        emptyRecords: 'Aucune transaction trouvée',
        amountInputLabel: 'Montant',
      },
      ru: {
        allMonths: 'Все месяцы',
        allTypes: 'Все',
        tabRecords: 'Операции',
        tabAnalytics: 'Аналитика',
        searchPlaceholder: 'Поиск по категории, счёту, заметке',
        budgetProgress: 'Использовано бюджета',
        budgetLeftDaily: 'Остаток в день',
        budgetOver: 'Превышение',
        categoryBreakdown: 'По категориям',
        accountBreakdown: 'По счетам',
        exportCsv: 'Экспорт CSV',
        editSave: 'Сохранить',
        cancelEdit: 'Отмена',
        emptyRecords: 'Нет записей по фильтру',
        amountInputLabel: 'Сумма',
      },
      fa: {
        allMonths: 'همه ماه‌ها',
        allTypes: 'همه',
        tabRecords: 'تراکنش‌ها',
        tabAnalytics: 'تحلیل مالی',
        searchPlaceholder: 'جستجو در دسته‌بندی، حساب یا یادداشت',
        budgetProgress: 'مصرف بودجه ماهانه',
        budgetLeftDaily: 'سهمیه روزانه',
        budgetOver: 'مازاد هزینه',
        categoryBreakdown: 'تفکیک دسته‌بندی',
        accountBreakdown: 'مانده حساب‌ها',
        exportCsv: 'خروجی CSV',
        editSave: 'ذخیره ویرایش',
        cancelEdit: 'لغو',
        emptyRecords: 'هیچ تراکنشی یافت نشد',
        amountInputLabel: 'مبلغ',
      },
      mn: {
        allMonths: 'Бүх сар',
        allTypes: 'Бүгд',
        tabRecords: 'Гүйлгээ',
        tabAnalytics: 'Шинжилгээ',
        searchPlaceholder: 'Ангилал, данс эсвэл тэмдэглэл',
        budgetProgress: 'Төсвийн зарцуулалт',
        budgetLeftDaily: 'Өдрийн үлдэгдэл',
        budgetOver: 'Хэтэрсэн',
        categoryBreakdown: 'Ангиллаар',
        accountBreakdown: 'Дансаар',
        exportCsv: 'CSV татах',
        editSave: 'Хадгалах',
        cancelEdit: 'Цуцлах',
        emptyRecords: 'Бүртгэл олдсонгүй',
        amountInputLabel: 'Дүн',
      },
      ug: {
        allMonths: 'بارلىق ئايلار',
        allTypes: 'ھەممىسى',
        tabRecords: 'تەپسىلات',
        tabAnalytics: 'تەھلىل',
        searchPlaceholder: 'تۈر، ھېسابات ياكى ئىزاھات ئىزدەش',
        budgetProgress: 'ئايلىق خامچوت',
        budgetLeftDaily: 'كۈندىلىك قالدۇق',
        budgetOver: 'ئېشىپ كەتتى',
        categoryBreakdown: 'تۈر نىسبىتى',
        accountBreakdown: 'ھېسابات ئەھۋالى',
        exportCsv: 'CSV چىقىرىش',
        editSave: 'ساقلاش',
        cancelEdit: 'بىكار قىلىش',
        emptyRecords: 'خاتىرە تېپىلمىدى',
        amountInputLabel: 'سومما',
      },
      en: {
        allMonths: 'All Months',
        allTypes: 'All',
        tabRecords: 'Records',
        tabAnalytics: 'Analytics',
        searchPlaceholder: 'Search category, account, or note',
        budgetProgress: 'Monthly Budget Used',
        budgetLeftDaily: 'Daily Allowance',
        budgetOver: 'Over Budget',
        categoryBreakdown: 'Category Breakdown',
        accountBreakdown: 'Account Breakdown',
        exportCsv: 'Export CSV',
        editSave: 'Save Changes',
        cancelEdit: 'Cancel',
        emptyRecords: 'No ledger entries match filter',
        amountInputLabel: 'Amount',
      },
    };
    return map[settings.language] || map.en;
  }, [settings.language]);

  useEffect(() => {
    writeStorageJson('tools_accounting_v1', accountingList);
  }, [accountingList]);

  useEffect(() => {
    writeStorageJson('tools_monthly_budget_v1', monthlyBudget);
  }, [monthlyBudget]);

  useEffect(() => {
    if (!editingAccId) {
      setNewAccCategory(accCategoryOptions[0]);
      setNewAccAccount(accAccountOptions[0]);
    }
  }, [accCategoryOptions, accAccountOptions, editingAccId]);

  const accAvailableMonths = useMemo(() => {
    const months = new Set<string>([todayStr.slice(0, 7)]);
    accountingList.forEach((r) => {
      if (r.date && r.date.length >= 7) months.add(r.date.slice(0, 7));
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [accountingList, todayStr]);

  const monthAccountingRecords = useMemo(() => {
    if (accFilterMonth === 'ALL') return accountingList;
    return accountingList.filter((r) => r.date.startsWith(accFilterMonth));
  }, [accountingList, accFilterMonth]);

  const filteredAccRecords = useMemo(() => {
    const q = accSearch.trim().toLowerCase();
    return monthAccountingRecords
      .filter((r) => accFilterType === 'all' || r.type === accFilterType)
      .filter((r) => {
        if (!q) return true;
        return (
          r.category.toLowerCase().includes(q) ||
          r.account.toLowerCase().includes(q) ||
          r.note.toLowerCase().includes(q) ||
          r.date.includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [monthAccountingRecords, accFilterType, accSearch]);

  const totalExpense = monthAccountingRecords.filter((a) => a.type === 'expense').reduce((acc, c) => acc + c.amount, 0);
  const totalIncome = monthAccountingRecords.filter((a) => a.type === 'income').reduce((acc, c) => acc + c.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const budgetUsedPct = monthlyBudget > 0 ? Math.min(100, Math.round((totalExpense / monthlyBudget) * 100)) : 0;
  const budgetRemaining = monthlyBudget - totalExpense;
  const remainingDaysInSelectedMonth = useMemo(() => {
    const nowDt = new Date();
    const daysInMon = new Date(nowDt.getFullYear(), nowDt.getMonth() + 1, 0).getDate();
    return Math.max(1, daysInMon - nowDt.getDate() + 1);
  }, []);
  const dailyAllowance = budgetRemaining / remainingDaysInSelectedMonth;

  const accCategoryStats = useMemo(() => {
    const totals = new Map<string, number>();
    const targetType = accFilterType === 'income' ? 'income' : 'expense';
    monthAccountingRecords
      .filter((r) => r.type === targetType)
      .forEach((r) => {
        totals.set(r.category, (totals.get(r.category) || 0) + r.amount);
      });
    const sum = Array.from(totals.values()).reduce((a, b) => a + b, 0);
    return Array.from(totals.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        pct: sum > 0 ? Math.round((amount / sum) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthAccountingRecords, accFilterType]);

  const accAccountStats = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    monthAccountingRecords.forEach((r) => {
      const cur = map.get(r.account) || { income: 0, expense: 0 };
      if (r.type === 'income') cur.income += r.amount;
      else cur.expense += r.amount;
      map.set(r.account, cur);
    });
    return Array.from(map.entries()).map(([account, v]) => ({
      account,
      income: v.income,
      expense: v.expense,
      net: v.income - v.expense,
    }));
  }, [monthAccountingRecords]);

  const handleAddAccountingRecord = () => {
    const val = parseFloat(newAccAmount);
    if (isNaN(val) || val <= 0) {
      showToast(ui.toolToastAmountInvalid);
      return;
    }
    const cleanDate = /^\d{4}-\d{2}-\d{2}$/.test(newAccDate) ? newAccDate : todayStr;
    if (editingAccId) {
      setAccountingList((prev) =>
        prev.map((item) =>
          item.id === editingAccId
            ? {
                ...item,
                type: newAccType,
                amount: val,
                category: newAccCategory,
                account: newAccAccount,
                date: cleanDate,
                note: newAccNote.trim() || newAccCategory,
              }
            : item
        )
      );
      setEditingAccId(null);
      setNewAccAmount('');
      setNewAccNote('');
      showToast(accProLabels.editSave);
      return;
    }

    const newRecord: AccountingRecord = {
      id: `acc-${Date.now()}`,
      type: newAccType,
      amount: val,
      category: newAccCategory,
      account: newAccAccount,
      date: cleanDate,
      note: newAccNote.trim() || newAccCategory,
    };
    setAccountingList([newRecord, ...accountingList]);
    setNewAccAmount('');
    setNewAccNote('');
    const typeLabel = newAccType === 'expense' ? ui.toolAccExpenseLabel : ui.toolAccIncomeLabel;
    showToast(
      ui.toolToastLedgerAdded
        .replace('{type}', typeLabel)
        .replace('{amount}', val.toFixed(2))
    );
  };

  const handleEditAccountingRecord = (rec: AccountingRecord) => {
    setEditingAccId(rec.id);
    setNewAccType(rec.type);
    setNewAccAmount(String(rec.amount));
    setNewAccCategory(rec.category);
    setNewAccAccount(rec.account);
    setNewAccDate(rec.date || todayStr);
    setNewAccNote(rec.note);
  };

  const handleDeleteAccountingRecord = (rec: AccountingRecord) => {
    const snapshot = accountingList;
    setAccountingList((prev) => prev.filter((item) => item.id !== rec.id));
    if (editingAccId === rec.id) {
      setEditingAccId(null);
      setNewAccAmount('');
      setNewAccNote('');
    }
    window.dispatchEvent(
      new CustomEvent('app-push-undo', {
        detail: {
          label: `${ui.undoActionDelete}: ${rec.category} ¥${rec.amount.toFixed(2)}`,
          restore: () => setAccountingList(snapshot),
        },
      })
    );
  };

  const handleExportAccountingCsv = () => {
    const rows = filteredAccRecords.map((r) => [
      r.date,
      r.type === 'expense' ? ui.toolAccExpenseLabel : ui.toolAccIncomeLabel,
      `"${r.category.replace(/"/g, '""')}"`,
      `"${r.account.replace(/"/g, '""')}"`,
      r.amount.toFixed(2),
      `"${(r.note || '').replace(/"/g, '""')}"`,
    ]);
    const header = [
      'Date',
      'Type',
      ui.toolAccCategoryLabel,
      ui.toolAccAccountLabel,
      accProLabels.amountInputLabel,
      'Note',
    ].join(',');
    const csv = '\uFEFF' + [header, ...rows.map((r) => r.join(','))].join('\n');
    void saveFileToDevice(`ledger-${accFilterMonth}.csv`, csv, 'text/csv;charset=utf-8;').then((res) => {
      if (res.ok) showToast(accProLabels.exportCsv);
    });
  };

  // -------------------------------------------------------------
  // Tool 6: 🚄 交通出行 (高铁动车 / 民航航班 / 枢纽接驳 + 排序 + 热门干线 + 收藏 + 经停详情)
  // -------------------------------------------------------------
  const travelPro = useMemo(() => getTravelProLabels(settings.language), [settings.language]);
  const [travelSync, setTravelSync] = useState<LiveTravelSyncSnapshot>(() => loadCachedTravelSync());
  const [isTravelSyncing, setIsTravelSyncing] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelModeTab>('train');
  const [travelSort, setTravelSort] = useState<TravelSortOption>('default');
  const [travelTimeWindow, setTravelTimeWindow] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [trainTypeFilter, setTrainTypeFilter] = useState<'all' | 'G' | 'D' | 'C'>('all');
  const [transitRegionFilter, setTransitRegionFilter] = useState<'all' | TransitRegionTag>('all');
  const [trainOrigin, setTrainOrigin] = useState('');
  const [trainDest, setTrainDest] = useState('');
  const [flightOrigin, setFlightOrigin] = useState('');
  const [flightDest, setFlightDest] = useState('');
  const [transitQuery, setTransitQuery] = useState('');
  const [travelDate, setTravelDate] = useState(todayStr);
  const [expandedTravelId, setExpandedTravelId] = useState<string | null>(null);
  const [showTravelFavsOnly, setShowTravelFavsOnly] = useState(false);
  const [showCustomTripForm, setShowCustomTripForm] = useState(false);
  const [customTripFrom, setCustomTripFrom] = useState('');
  const [customTripTo, setCustomTripTo] = useState('');
  const [customTripCode, setCustomTripCode] = useState('');
  const [customTripDepart, setCustomTripDepart] = useState('09:00');
  const [customTripArrive, setCustomTripArrive] = useState('12:30');
  const [travelFavIds, setTravelFavIds] = useState<string[]>(() =>
    readStorageJson<string[]>(
      'tools_travel_favs_v1',
      (v): v is string[] => Array.isArray(v) && v.every((item) => typeof item === 'string')
    ) ?? []
  );

  const handleRefreshTravelLive = useCallback(async () => {
    setIsTravelSyncing(true);
    try {
      const snap = await fetchLiveTravelSync(true);
      setTravelSync(snap);
      showToast(
        isChineseLocale(settings.language)
          ? `12306 与民航时刻状态已同步 (${snap.syncedAt})`
          : `12306 & Aviation status synced (${snap.syncedAt})`
      );
    } finally {
      setIsTravelSyncing(false);
    }
  }, [settings.language, showToast]);

  const toggleTravelFavorite = (id: string) => {
    setTravelFavIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      writeStorageJson('tools_travel_favs_v1', next);
      return next;
    });
    showToast(travelPro.routeFavoritedToast);
  };

  const swapTrainStations = () => {
    const o = trainOrigin;
    setTrainOrigin(trainDest);
    setTrainDest(o);
  };

  const swapFlightAirports = () => {
    const o = flightOrigin;
    setFlightOrigin(flightDest);
    setFlightDest(o);
  };

  const matchesTimeWindow = (hhmm: string, win: 'all' | 'morning' | 'afternoon' | 'evening') => {
    if (win === 'all') return true;
    const h = parseInt(hhmm.split(':')[0] || '0', 10);
    if (win === 'morning') return h < 12;
    if (win === 'afternoon') return h >= 12 && h < 18;
    return h >= 18;
  };

  const splitSmartQuery = (raw: string): string[] =>
    raw
      .trim()
      .split(/[\s,，→\->/|]+/)
      .map((t) => normalizeSearchText(t))
      .filter(Boolean);

  const trainList = useMemo(() => getRichTrainList(settings.language), [settings.language]);
  const flightList = useMemo(() => getRichFlightList(settings.language), [settings.language]);
  const transitList = useMemo(() => getTransitTransfers(settings.language), [settings.language]);
  const popularCorridors = useMemo(() => {
    if (travelMode === 'transit') return [];
    return getPopularCorridors(travelMode, settings.language);
  }, [travelMode, settings.language]);

  const filteredTrainList = useMemo(() => {
    const oTokens = splitSmartQuery(trainOrigin);
    const dTokens = splitSmartQuery(trainDest);

    const staticMatched = trainList.filter((item) => {
      if (showTravelFavsOnly && !travelFavIds.includes(item.trainNo)) return false;
      if (trainTypeFilter !== 'all' && !item.trainNo.toUpperCase().startsWith(trainTypeFilter)) {
        return false;
      }
      if (!matchesTimeWindow(item.depart, travelTimeWindow)) return false;

      const stopTexts = item.stops.map((s) => normalizeSearchText(s.station));
      const allOriginFields = [
        normalizeSearchText(item.from),
        normalizeSearchText(item.trainNo),
        normalizeSearchText(item.trainTag),
        ...item.fromKeys.map(normalizeSearchText),
        ...stopTexts,
      ];
      const allDestFields = [
        normalizeSearchText(item.to),
        ...item.toKeys.map(normalizeSearchText),
        ...stopTexts,
      ];

      const matchOrigin =
        oTokens.length === 0 ||
        oTokens.every(
          (tok) =>
            allOriginFields.some((f) => f.includes(tok)) ||
            (!dTokens.length && allDestFields.some((f) => f.includes(tok)))
        );

      const matchDest =
        dTokens.length === 0 ||
        dTokens.every((tok) => allDestFields.some((f) => f.includes(tok)));

      if (oTokens.length === 1 && dTokens.length === 1) {
        const oInStopIdx = item.stops.findIndex(
          (s) =>
            normalizeSearchText(s.station).includes(oTokens[0]) ||
            (s === item.stops[0] && item.fromKeys.some((k) => normalizeSearchText(k).includes(oTokens[0])))
        );
        const dInStopIdx = item.stops.findIndex(
          (s) =>
            normalizeSearchText(s.station).includes(dTokens[0]) ||
            (s === item.stops[item.stops.length - 1] &&
              item.toKeys.some((k) => normalizeSearchText(k).includes(dTokens[0])))
        );
        if (oInStopIdx !== -1 && dInStopIdx !== -1 && oInStopIdx >= dInStopIdx) {
          return false;
        }
      }

      return matchOrigin && matchDest;
    });

    // Dynamic 12306 network fallback for any supported domestic/international station pair
    const combined = [...staticMatched];
    if (!showTravelFavsOnly && combined.length < 2 && (trainOrigin.trim() || trainDest.trim())) {
      const oHub = resolveDirectoryHub(trainOrigin, 'rail');
      const dHub = resolveDirectoryHub(trainDest, 'rail');
      const effOrigin = trainOrigin.trim()
        ? trainOrigin
        : dHub && dHub.code !== 'BJP'
        ? '北京南'
        : '上海虹桥';
      const effDest = trainDest.trim()
        ? trainDest
        : oHub && oHub.code !== 'BJP'
        ? oHub.region === 'international'
          ? '昆明南'
          : '北京南'
        : '上海虹桥';
      const dyn = queryDynamic12306Trains(effOrigin, effDest, settings.language).filter((item) => {
        if (trainTypeFilter !== 'all' && !item.trainNo.toUpperCase().startsWith(trainTypeFilter)) return false;
        if (!matchesTimeWindow(item.depart, travelTimeWindow)) return false;
        return !combined.some((c) => c.trainNo === item.trainNo);
      });
      combined.push(...dyn);
    }

    if (travelSort === 'earliest') {
      return [...combined].sort((a, b) => a.depart.localeCompare(b.depart));
    }
    if (travelSort === 'fastest') {
      return [...combined].sort((a, b) => a.durationMinutes - b.durationMinutes);
    }
    if (travelSort === 'cheapest') {
      return [...combined].sort((a, b) => a.minPrice - b.minPrice);
    }
    return combined;
  }, [
    trainList,
    trainOrigin,
    trainDest,
    showTravelFavsOnly,
    travelFavIds,
    travelSort,
    travelTimeWindow,
    trainTypeFilter,
    settings.language,
  ]);

  const filteredFlightList = useMemo(() => {
    const oTokens = splitSmartQuery(flightOrigin);
    const dTokens = splitSmartQuery(flightDest);
    const staticMatched = flightList.filter((item) => {
      if (showTravelFavsOnly && !travelFavIds.includes(item.flightNo)) return false;
      if (!matchesTimeWindow(item.depart, travelTimeWindow)) return false;

      const originPool = [
        normalizeSearchText(item.from),
        normalizeSearchText(item.flightNo),
        normalizeSearchText(item.airline),
        normalizeSearchText(item.aircraft),
        ...item.fromKeys.map(normalizeSearchText),
      ];
      const destPool = [
        normalizeSearchText(item.to),
        ...item.toKeys.map(normalizeSearchText),
      ];

      const matchOrigin =
        oTokens.length === 0 ||
        oTokens.every(
          (tok) =>
            originPool.some((f) => f.includes(tok)) ||
            (!dTokens.length && destPool.some((f) => f.includes(tok)))
        );
      const matchDest =
        dTokens.length === 0 ||
        dTokens.every((tok) => destPool.some((f) => f.includes(tok)));
      return matchOrigin && matchDest;
    });

    // Dynamic aviation fallback for any supported China domestic, HK/MO/TW, or global IATA airport
    const combined = [...staticMatched];
    if (!showTravelFavsOnly && combined.length < 2 && (flightOrigin.trim() || flightDest.trim())) {
      const oHub = resolveDirectoryHub(flightOrigin, 'airport');
      const dHub = resolveDirectoryHub(flightDest, 'airport');
      const effOrigin = flightOrigin.trim()
        ? flightOrigin
        : dHub && dHub.code !== 'PEK'
        ? 'PEK'
        : 'PVG';
      const effDest = flightDest.trim()
        ? flightDest
        : oHub && oHub.code !== 'PEK'
        ? 'PEK'
        : 'HKG';
      const dyn = queryDynamicGlobalFlights(effOrigin, effDest, settings.language).filter((item) => {
        if (!matchesTimeWindow(item.depart, travelTimeWindow)) return false;
        return !combined.some((c) => c.flightNo === item.flightNo);
      });
      combined.push(...dyn);
    }

    if (travelSort === 'earliest') {
      return [...combined].sort((a, b) => a.depart.localeCompare(b.depart));
    }
    if (travelSort === 'fastest') {
      return [...combined].sort((a, b) => a.durationMinutes - b.durationMinutes);
    }
    if (travelSort === 'cheapest') {
      return [...combined].sort((a, b) => a.minPrice - b.minPrice);
    }
    return combined;
  }, [flightList, flightOrigin, flightDest, showTravelFavsOnly, travelFavIds, travelSort, travelTimeWindow, settings.language]);

  const filteredTransitList = useMemo(() => {
    const tokens = splitSmartQuery(transitQuery);
    return transitList.filter((item) => {
      if (showTravelFavsOnly && !travelFavIds.includes(item.id)) return false;
      if (transitRegionFilter !== 'all' && item.regionTag !== transitRegionFilter) return false;
      if (tokens.length === 0) return true;
      const pool = [
        normalizeSearchText(item.city),
        normalizeSearchText(item.hubPair),
        normalizeSearchText(item.modeLabel),
        normalizeSearchText(item.notes),
        normalizeSearchText(item.airportCode || ''),
        normalizeSearchText(item.railHub || ''),
        ...item.cityKeys.map(normalizeSearchText),
      ];
      return tokens.every((tok) => pool.some((f) => f.includes(tok)));
    });
  }, [transitList, transitQuery, transitRegionFilter, showTravelFavsOnly, travelFavIds]);

  const handleAddCustomTripToCalendar = () => {
    const fromVal = customTripFrom.trim();
    const toVal = customTripTo.trim();
    if (!fromVal || !toVal) return;
    const code = customTripCode.trim();
    const icon = travelMode === 'flight' ? '✈️' : travelMode === 'transit' ? '🧭' : '🚄';
    const routeTitle = `${icon} ${code ? `${code} ` : ''}${fromVal} ➔ ${toVal}`;
    const newEvent: CalendarEvent = {
      id: `evt-custom-travel-${Date.now()}`,
      title: routeTitle,
      startDate: travelDate,
      endDate: travelDate,
      startTime: customTripDepart || '09:00',
      endTime: customTripArrive || '12:30',
      isAllDay: false,
      categoryId: 'travel',
      recurrence: 'none',
      location: fromVal,
      description: `${code ? `${code} · ` : ''}${fromVal} → ${toVal}`,
      reminder: '1h',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onUpdateEvent(newEvent);
    showToast(travelPro.customTripAddedToast.replace('{title}', routeTitle));
    setShowCustomTripForm(false);
    setCustomTripFrom('');
    setCustomTripTo('');
    setCustomTripCode('');
  };

  const handleAddTrainToCalendar = (train: RichTrainItem) => {
    const boardBy = subtractMinutesFromHHMM(train.depart, 25);
    const newEvent: CalendarEvent = {
      id: `evt-travel-${Date.now()}`,
      title: `🚄 ${train.trainNo} ${train.from} ➔ ${train.to}`,
      startDate: travelDate,
      endDate: travelDate,
      startTime: train.depart,
      endTime: train.arrive,
      isAllDay: false,
      categoryId: 'travel',
      recurrence: 'none',
      location: train.from,
      description: `${train.trainNo} (${train.trainTag}) · ${train.duration} · ${travelPro.recommendArriveAt}: ${boardBy}`,
      reminder: '1h',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onUpdateEvent(newEvent);
    showToast(
      ui.toolToastAddedTrain
        .replace('{no}', train.trainNo)
        .replace('{date}', travelDate)
        .replace('{time}', train.depart)
    );
  };

  const handleAddFlightToCalendar = (flight: RichFlightItem) => {
    const checkinBy = subtractMinutesFromHHMM(flight.depart, flight.checkinGateOffsetMin);
    const newEvent: CalendarEvent = {
      id: `evt-flight-${Date.now()}`,
      title: `✈️ ${flight.flightNo} ${flight.from} ➔ ${flight.to}`,
      startDate: travelDate,
      endDate: travelDate,
      startTime: flight.depart,
      endTime: flight.arrive,
      isAllDay: false,
      categoryId: 'travel',
      recurrence: 'none',
      location: flight.from,
      description: `${flight.airline} ${flight.flightNo} (${flight.aircraft}) · ${travelPro.recommendCheckinAt}: ${checkinBy} · ${flight.baggage} · ${flight.meal}`,
      reminder: '1h',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onUpdateEvent(newEvent);
    showToast(
      ui.toolToastAddedFlight
        .replace('{no}', flight.flightNo)
        .replace('{date}', travelDate)
        .replace('{time}', flight.depart)
    );
  };

  const handleAddTransitToCalendar = (transit: TransitTransferOption) => {
    const newEvent: CalendarEvent = {
      id: `evt-transit-${Date.now()}`,
      title: `🧭 ${transit.hubPair}`,
      startDate: travelDate,
      endDate: travelDate,
      startTime: '09:00',
      endTime: '10:00',
      isAllDay: false,
      categoryId: 'travel',
      recurrence: 'none',
      location: transit.city,
      description: `${transit.modeLabel} · ${transit.duration} · ${transit.fare} · ${transit.notes}`,
      reminder: '30m',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onUpdateEvent(newEvent);
    showToast(travelPro.addedTransitToast.replace('{title}', transit.hubPair));
  };

  // -------------------------------------------------------------
  // Tool 7: ⚡ 网络测速 (真实全双工测速 + 公网节点实时识别)
  // -------------------------------------------------------------
  const [netInfo, setNetInfo] = useState<LiveNetworkInfo>(() => loadCachedNetworkInfo());
  const [isSpeedTesting, setIsSpeedTesting] = useState(false);
  const [speedProgress, setSpeedProgress] = useState(100);
  const [speedPhase, setSpeedPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'done'>('idle');
  const [liveGaugeMbps, setLiveGaugeMbps] = useState(0);
  const [speedMetrics, setSpeedMetrics] = useState({
    download: 0,
    upload: 0,
    ping: 0,
    jitter: 0,
    packetLoss: '0.0%',
    statusGrade: '--',
  });

  useEffect(() => {
    fetchLiveNetworkInfo().then(setNetInfo);
  }, []);

  const runSpeedTest = async () => {
    if (isSpeedTesting) return;
    setIsSpeedTesting(true);
    setSpeedProgress(12);
    setSpeedPhase('ping');
    setLiveGaugeMbps(0);
    setSpeedMetrics((prev) => ({
      ...prev,
      download: 0,
      upload: 0,
      ping: 0,
      jitter: 0,
      statusGrade: '--',
    }));

    fetchLiveNetworkInfo().then(setNetInfo);

    try {
      const result = await measureRealNetworkSpeed((phase, valueMbps, pingMs, jitterMs) => {
        setSpeedPhase(phase);
        if (phase === 'ping') {
          setSpeedProgress(30);
          setSpeedMetrics((prev) => ({ ...prev, ping: pingMs, jitter: jitterMs }));
        } else if (phase === 'download') {
          setSpeedProgress(68);
          setLiveGaugeMbps(valueMbps);
          setSpeedMetrics((prev) => ({ ...prev, download: valueMbps, ping: pingMs, jitter: jitterMs }));
        } else if (phase === 'upload') {
          setSpeedProgress(95);
          setLiveGaugeMbps(valueMbps);
          setSpeedMetrics((prev) => ({ ...prev, upload: valueMbps }));
        }
      });

      const grade =
        result.downloadMbps >= 1000
          ? 'S++'
          : result.downloadMbps >= 300
          ? 'S+'
          : result.downloadMbps >= 100
          ? 'S'
          : result.downloadMbps >= 30
          ? 'A'
          : 'B';
      setSpeedMetrics({
        download: result.downloadMbps,
        upload: result.uploadMbps,
        ping: result.pingMs,
        jitter: result.jitterMs,
        packetLoss: '0.0%',
        statusGrade: grade,
      });
      setLiveGaugeMbps(result.downloadMbps);
      setSpeedProgress(100);
      setSpeedPhase('done');
      showToast(ui.toolTabSpeedtest);
    } finally {
      setIsSpeedTesting(false);
    }
  };

  // -------------------------------------------------------------
  // Tool 9: 🔢 日期计算 (顶端三标签分拆：日期间隔 · 日期推算 · 年龄换算)
  // -------------------------------------------------------------
  const [dateCalcSubTab, setDateCalcSubTab] = useState<'diff' | 'offset' | 'age'>('diff');

  // 模块 1: 日期间隔计算
  const [intervalStart, setIntervalStart] = useState(todayStr);
  const [intervalEnd, setIntervalEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 100);
    return toDateString(d);
  });
  const [includeEndDay, setIncludeEndDay] = useState(true);

  // 模块 2: 日期偏移推算
  const [offsetBaseDate, setOffsetBaseDate] = useState(todayStr);
  const [offsetDays, setOffsetDays] = useState(30);
  const [offsetDaysInput, setOffsetDaysInput] = useState('30');
  const [offsetDirection, setOffsetDirection] = useState<'forward' | 'backward'>('forward');
  const [workdaysOnly, setWorkdaysOnly] = useState(false);

  // Interval calculation between 2 dates (DST-safe UTC day diff + boundary-aligned workdays)
  const intervalResult = useMemo(() => {
    try {
      const s = parseDate(intervalStart);
      const e = parseDate(intervalEnd);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;

      const sUtc = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
      const eUtc = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
      const rawDiff = eUtc - sUtc;
      const isReverse = rawDiff < 0;
      let diffDays = Math.abs(Math.round(rawDiff / 86400000));
      if (includeEndDay) diffDays += 1;

      // Workdays count aligned with includeEndDay boundary
      let workdays = 0;
      const cur = new Date(isReverse ? e : s);
      const endD = new Date(isReverse ? s : e);
      while (includeEndDay ? cur <= endD : cur < endD) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) {
          workdays++;
        }
        cur.setDate(cur.getDate() + 1);
      }

      const weeks = Math.floor(diffDays / 7);
      const remDays = diffDays % 7;

      return {
        diffDays,
        weeks,
        remDays,
        workdays,
        weekendDays: Math.max(0, diffDays - workdays),
        isReverse,
      };
    } catch {
      return null;
    }
  }, [intervalStart, intervalEnd, includeEndDay]);

  const offsetCalcResult = (() => {
    try {
      const d = parseDate(offsetBaseDate);
      if (isNaN(d.getTime())) return null;

      const step = offsetDirection === 'forward' ? 1 : -1;
      let remaining = Math.max(1, offsetDays);

      while (remaining > 0) {
        d.setDate(d.getDate() + step);
        if (workdaysOnly) {
          const day = d.getDay();
          if (day !== 0 && day !== 6) {
            remaining--;
          }
        } else {
          remaining--;
        }
      }

      const lunar = getLunarInfo(d);
      const weekDayStr = new Intl.DateTimeFormat(localeCode === 'fa-IR' ? 'fa-IR' : localeCode, {
        weekday: 'short',
      }).format(d);
      return {
        targetDateStr: toDateString(d),
        weekDayStr,
        lunarMonthDay: `${lunar.lunarMonthName}${lunar.lunarDayName}`,
        fullGanZhi: lunar.fullGanZhi,
        solarTerm: lunar.solarTerm,
        festival: lunar.lunarFestival || lunar.solarFestival,
        yi: lunar.yi.slice(0, 4).join(' · '),
        ji: lunar.ji.slice(0, 3).join(' · '),
      };
    } catch {
      return null;
    }
  })();

  // Sub B: 生辰与年龄精算
  const [birthDateInput, setBirthDateInput] = useState('1998-06-18');

  const ageCalcResult = (() => {
    try {
      const birth = parseDate(birthDateInput);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (isNaN(birth.getTime())) return null;

      const diffTime = today.getTime() - birth.getTime();
      const livingDays = Math.max(0, Math.floor(diffTime / 86400000));

      let zhouSui = today.getFullYear() - birth.getFullYear();
      const mDiff = today.getMonth() - birth.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
        zhouSui--;
      }
      zhouSui = Math.max(0, zhouSui);

      const xuSui = birth > today ? 0 : today.getFullYear() - birth.getFullYear() + 1;

      let nextBday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      if (nextBday.getTime() < today.getTime()) {
        nextBday = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
      }
      const daysToNextBday = Math.round((nextBday.getTime() - today.getTime()) / 86400000);

      // Western 12 Zodiac Sign
      const m = birth.getMonth() + 1;
      const d = birth.getDate();
      const signs: { names: Partial<Record<typeof settings.language, string>> & { en: string }; symbol: string; startM: number; startD: number; endM: number; endD: number }[] = [
        { symbol: '♒', startM: 1, startD: 20, endM: 2, endD: 18, names: { 'zh-CN': '水瓶座', 'zh-TW': '水瓶座', en: 'Aquarius', ja: 'みずがめ座', ko: '물병자리', fr: 'Verseau', fa: 'دلو', mn: 'Хумх', ru: 'Водолей', ug: 'سۇغۇلغان' } },
        { symbol: '♓', startM: 2, startD: 19, endM: 3, endD: 20, names: { 'zh-CN': '双鱼座', 'zh-TW': '雙魚座', en: 'Pisces', ja: 'うお座', ko: '물고기자리', fr: 'Poissons', fa: 'حوت', mn: 'Загас', ru: 'Рыбы', ug: 'بېلىق' } },
        { symbol: '♈', startM: 3, startD: 21, endM: 4, endD: 19, names: { 'zh-CN': '白羊座', 'zh-TW': '牡羊座', en: 'Aries', ja: 'おひつじ座', ko: '양자리', fr: 'Bélier', fa: 'حمل', mn: 'Хонь', ru: 'Овен', ug: 'قوزا' } },
        { symbol: '♉', startM: 4, startD: 20, endM: 5, endD: 20, names: { 'zh-CN': '金牛座', 'zh-TW': '金牛座', en: 'Taurus', ja: 'おうし座', ko: '황소자리', fr: 'Taureau', fa: 'ثور', mn: 'Үхэр', ru: 'Телец', ug: 'بۇقا' } },
        { symbol: '♊', startM: 5, startD: 21, endM: 6, endD: 21, names: { 'zh-CN': '双子座', 'zh-TW': '雙子座', en: 'Gemini', ja: 'ふたご座', ko: '쌍둥이자리', fr: 'Gémeaux', fa: 'جوزا', mn: 'Ихэр', ru: 'Близнецы', ug: 'قوشماق' } },
        { symbol: '♋', startM: 6, startD: 22, endM: 7, endD: 22, names: { 'zh-CN': '巨蟹座', 'zh-TW': '巨蟹座', en: 'Cancer', ja: 'かに座', ko: '게자리', fr: 'Cancer', fa: 'سرطان', mn: 'Мэлхий', ru: 'Рак', ug: 'قىسقۇچپاقا' } },
        { symbol: '♌', startM: 7, startD: 23, endM: 8, endD: 22, names: { 'zh-CN': '狮子座', 'zh-TW': '獅子座', en: 'Leo', ja: 'しし座', ko: '사자자리', fr: 'Lion', fa: 'اسد', mn: 'Арслан', ru: 'Лев', ug: 'شىر' } },
        { symbol: '♍', startM: 8, startD: 23, endM: 9, endD: 22, names: { 'zh-CN': '处女座', 'zh-TW': '處女座', en: 'Virgo', ja: 'おとめ座', ko: '처녀자리', fr: 'Vierge', fa: 'سنبله', mn: 'Охин', ru: 'Дева', ug: 'سۇمبۇلە' } },
        { symbol: '♎', startM: 9, startD: 23, endM: 10, endD: 23, names: { 'zh-CN': '天秤座', 'zh-TW': '天秤座', en: 'Libra', ja: 'てんびん座', ko: '천칭자리', fr: 'Balance', fa: 'میزان', mn: 'Жинлүүр', ru: 'Весы', ug: 'تارازا' } },
        { symbol: '♏', startM: 10, startD: 24, endM: 11, endD: 22, names: { 'zh-CN': '天蝎座', 'zh-TW': '天蠍座', en: 'Scorpio', ja: 'さそり座', ko: '전갈자리', fr: 'Scorpion', fa: 'عقرب', mn: 'Хилэнц', ru: 'Скорпион', ug: 'چايان' } },
        { symbol: '♐', startM: 11, startD: 23, endM: 12, endD: 21, names: { 'zh-CN': '射手座', 'zh-TW': '射手座', en: 'Sagittarius', ja: 'いて座', ko: '사수자리', fr: 'Sagittaire', fa: 'قوس', mn: 'Нум', ru: 'Стрелец', ug: 'ياي' } },
        { symbol: '♑', startM: 12, startD: 22, endM: 1, endD: 19, names: { 'zh-CN': '摩羯座', 'zh-TW': '摩羯座', en: 'Capricorn', ja: 'やぎ座', ko: '염소자리', fr: 'Capricorne', fa: 'جدی', mn: 'Матар', ru: 'Козерог', ug: 'ئوغلاق' } },
      ];
      const matched = signs.find((s) => {
        if (s.startM === m && d >= s.startD) return true;
        if (s.endM === m && d <= s.endD) return true;
        return false;
      }) || signs[2];
      const sign = {
        name: matched.names[settings.language] || matched.names.en,
        symbol: matched.symbol,
      };

      const lunar = getLunarInfo(birth);

      return {
        zhouSui,
        xuSui,
        livingDays,
        daysToNextBday: daysToNextBday < 0 ? 0 : daysToNextBday,
        sign,
        zodiac: lunar.zodiac,
        lunarBirth: `${lunar.lunarYear} ${lunar.lunarMonthName}${lunar.lunarDayName}`,
      };
    } catch {
      return null;
    }
  })();

  // -------------------------------------------------------------
  // Tool 10: 📝 备忘录 (Memos)
  // -------------------------------------------------------------
  const [memoList, setMemoList] = useState<MemoItem[]>(() => {
    const saved = readStorageJson<MemoItem[]>(
      'tools_memos_v1',
      (val): val is MemoItem[] => Array.isArray(val)
    );
    return saved || [];
  });

  useEffect(() => {
    writeStorageJson('tools_memos_v1', memoList);
  }, [memoList]);
  const [newMemoTitle, setNewMemoTitle] = useState('');
  const [newMemoContent, setNewMemoContent] = useState('');
  const memoTitleInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddMemo = () => {
    if (!newMemoTitle.trim() && !newMemoContent.trim()) {
      showToast(ui.toolToastMemoTitleReq);
      return;
    }
    const newMemo: MemoItem = {
      id: `memo-${Date.now()}`,
      title: newMemoTitle.trim() || ui.toolTabMemos,
      content: newMemoContent.trim(),
      isPinned: false,
      color: 'bg-emerald-500/10 border-emerald-500/30',
      date: todayStr,
      tags: [],
    };
    setMemoList([newMemo, ...memoList]);
    setNewMemoTitle('');
    setNewMemoContent('');
    showToast(ui.toolToastMemoAdded);
  };

  // 10 Tools ordered logically: Market & Finance Suite -> Time, Notes & Life Utilities
  const allToolTiles = useMemo(
    () => [
      { id: 'stocks' as ToolSubTab, icon: '📈', label: ui.toolTabStocks, aura: 'from-rose-500/10 via-transparent to-transparent' },
      { id: 'macro' as ToolSubTab, icon: '📊', label: ui.toolTabMacro, aura: 'from-indigo-500/10 via-transparent to-transparent' },
      { id: 'forex' as ToolSubTab, icon: '💱', label: ui.toolTabForex, aura: 'from-amber-500/10 via-transparent to-transparent' },
      { id: 'rates' as ToolSubTab, icon: '💰', label: ui.toolTabRates, aura: 'from-emerald-500/10 via-transparent to-transparent' },
      { id: 'accounting' as ToolSubTab, icon: '💳', label: ui.toolTabAccounting, aura: 'from-cyan-500/10 via-transparent to-transparent' },
      { id: 'countdowns' as ToolSubTab, icon: '⏱️', label: ui.toolTabCountdown, aura: 'from-violet-500/10 via-transparent to-transparent' },
      { id: 'calc' as ToolSubTab, icon: '🔢', label: ui.toolTabDateCalc, aura: 'from-sky-500/10 via-transparent to-transparent' },
      { id: 'notes' as ToolSubTab, icon: '📝', label: ui.toolTabMemos, aura: 'from-teal-500/10 via-transparent to-transparent' },
      { id: 'travel' as ToolSubTab, icon: '🚄', label: ui.toolTabTravel, aura: 'from-blue-500/10 via-transparent to-transparent' },
      { id: 'speedtest' as ToolSubTab, icon: '⚡', label: ui.toolTabSpeedtest, aura: 'from-orange-500/10 via-transparent to-transparent' },
    ],
    [ui]
  );

  const stocksSyncActive = isStockRefreshing || isGlobalSyncing;
  const macroSyncActive = isMacroRefreshing || isGlobalSyncing;

  const toolCloseBtn = (
    <button
      type="button"
      onClick={closeToolDetail}
      aria-label={t.backButton}
      title={t.backButton}
      className="w-9 h-9 rounded-xl bg-neutral-100/90 dark:bg-white/[0.08] hover:bg-neutral-200/80 dark:hover:bg-white/15 border border-neutral-200/70 dark:border-white/12 text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
    >
      <X className="w-4 h-4 stroke-[2.2]" />
    </button>
  );

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex-1 flex flex-col h-dvh pt-[max(0.5rem,env(safe-area-inset-top))] sm:pt-[max(0.85rem,env(safe-area-inset-top))] overflow-hidden relative select-none px-2 pb-2 sm:px-4 sm:pb-4 max-w-7xl mx-auto w-full gap-2 bg-[#F2F2F7] dark:bg-black"
    >
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-neutral-900/90 text-white dark:bg-white/90 dark:text-neutral-900 shadow-xl backdrop-blur-md text-xs font-bold animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {viewMode === 'hub' ? (
        /* Single-Viewport 10-Tile iOS 27 Frosted Glass Hub (Clean bare icons, zero chevrons/category pills) */
        <div className="flex-1 min-h-0 flex flex-col justify-center pb-[72px] sm:pb-[84px]">
          <div className="grid grid-cols-2 sm:grid-cols-5 grid-rows-5 sm:grid-rows-2 gap-2.5 sm:gap-4 h-full max-h-[620px]">
            {allToolTiles.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => openToolDetail(tab.id)}
                style={sharedTransitionStyle(`hero-tool-${tab.id}`)}
                className="group relative h-full min-h-0 rounded-2xl sm:rounded-3xl bg-white/75 dark:bg-neutral-900/60 [.amoled-mode_&]:bg-neutral-950/90 backdrop-blur-2xl border border-white/85 dark:border-white/10 hover:border-blue-400/55 dark:hover:border-blue-400/45 shadow-[0_6px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(37,99,235,0.1)] p-3 sm:p-5 flex flex-col items-center justify-center gap-2 sm:gap-3 text-center transition-all duration-200 active:scale-[0.97] cursor-pointer overflow-hidden"
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tab.aura} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                />
                <span className="relative text-[28px] sm:text-[36px] leading-none select-none transition-transform duration-200 group-hover:scale-110">
                  {tab.icon}
                </span>
                <span className="relative text-[13px] sm:text-[15px] font-bold text-neutral-900 dark:text-neutral-50 tracking-tight truncate max-w-full">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Detail Mode: Integrated X Close Button inside Tool Card & System Back Support */
        <div key={activeTab} className="flex-1 min-h-0 flex flex-col animate-tool-expand pb-[80px] sm:pb-[92px]">
          <div
            style={sharedTransitionStyle(`hero-tool-${activeTab}`)}
            className="flex-1 min-h-0 overflow-hidden flex flex-col justify-between rounded-3xl bg-white/85 dark:bg-white/[0.06] backdrop-blur-2xl border border-white/85 dark:border-white/12 p-3 sm:p-5 shadow-xs"
          >
        {/* ================= TAB 1: 📈 股市能源 (3大独立分类卡片 + 点击展开Google财经交互图表) ================= */}
        {activeTab === 'stocks' && (
          <div className="h-full flex flex-col justify-between overflow-hidden gap-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-200/70 dark:border-white/10 pb-2.5 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2 truncate">
                  <Activity className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">{ui.toolTabStocks}</span>
                </h2>
                <button
                  type="button"
                  onClick={handleRefreshStockMarket}
                  disabled={stocksSyncActive}
                  title={ui.toolRefreshLive}
                  aria-label={ui.toolRefreshLive}
                  className="relative w-7 h-7 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  {stocksSyncActive && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-1 rounded-2xl border border-rose-400/55 animate-sync-halo"
                    />
                  )}
                  <RefreshCw className={`w-3.5 h-3.5 ${stocksSyncActive ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400 font-semibold">
                  {ui.toolLastUpdated} {lastStockUpdateTime}
                </span>
                {toolCloseBtn}
              </div>
            </div>

            {/* 3-Segment Category Switcher (股市 | 能源 | 贵金属) */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full shrink-0">
              <button
                type="button"
                onClick={() => setMarketCategoryTab('index')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-full text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                  marketCategoryTab === 'index'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                }`}
              >
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
                <span className="truncate">{ui.toolStocksCategory}</span>
              </button>
              <button
                type="button"
                onClick={() => setMarketCategoryTab('energy')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-full text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                  marketCategoryTab === 'energy'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                }`}
              >
                <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500 shrink-0" />
                <span className="truncate">{ui.toolEnergyCategory}</span>
              </button>
              <button
                type="button"
                onClick={() => setMarketCategoryTab('metal')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-full text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                  marketCategoryTab === 'metal'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                }`}
              >
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                <span className="truncate">{ui.toolMetalsCategory}</span>
              </button>
            </div>

            {/* Regional Filter Row for Stocks (evenly distributed across mobile/landscape/tablet/TV) */}
            {marketCategoryTab === 'index' && (
              <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full shrink-0">
                {(
                  [
                    { id: 'cn', label: ui.marketRegionCn },
                    { id: 'us', label: ui.marketRegionUs },
                    { id: 'asia', label: ui.marketRegionAsia },
                    { id: 'eu', label: ui.marketRegionEu },
                  ] as { id: MarketRegion; label: string }[]
                ).map((reg) => {
                  const isActive = marketRegionTab === reg.id;
                  return (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => setMarketRegionTab(reg.id)}
                      className={`px-1.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-[13px] transition-all text-center truncate cursor-pointer border min-w-0 ${
                        isActive
                          ? 'bg-white dark:bg-neutral-800 border-neutral-300/70 dark:border-white/25 text-neutral-950 dark:text-white font-bold shadow-sm'
                          : 'bg-transparent border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-white/[0.06] font-medium'
                      }`}
                    >
                      {reg.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Clean Stacked Quote Cards */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 py-0.5 pb-16 md:pb-1 pe-0.5">
              {(marketCategoryTab === 'index'
                ? liveQuotes.filter(
                    (q) =>
                      q.category === 'index' &&
                      ((q.region || 'cn') === marketRegionTab || Boolean(q.regions?.includes(marketRegionTab)))
                  )
                : marketCategoryTab === 'energy'
                ? energyQuotes
                : metalsQuotes
              ).map((item) => {
                const isUp = item.change >= 0;
                const trendTheme = getMarketTrendTheme(settings.language, isUp);
                const isUsdCommodity = item.category === 'energy' || item.category === 'metal';
                const dec = item.category === 'energy' && item.price < 20 ? 3 : 2;
                const prefix = isUsdCommodity ? '$' : '';
                const priceStr = `${prefix}${item.price.toLocaleString('en-US', {
                  minimumFractionDigits: dec,
                  maximumFractionDigits: dec,
                })}`;
                const highStr = `${prefix}${item.high.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`;
                const lowStr = `${prefix}${item.low.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`;
                const changeStr = `${isUp ? '+' : ''}${item.change.toFixed(dec)}`;
                const pctStr = `${isUp ? '▲ +' : '▼ '}${item.changePct.toFixed(2)}%`;
                const shortName = getQuoteShortName(item, settings.language);

                const gramUnitMap: Record<string, string> = {
                  'zh-CN': '克',
                  'zh-TW': '克',
                  ja: 'g',
                  ko: 'g',
                  ru: 'г',
                  mn: 'г',
                  fa: 'گرم',
                  ug: 'گ',
                  en: 'g',
                  fr: 'g',
                };
                const bblUnitMap: Record<string, string> = {
                  'zh-CN': '桶',
                  'zh-TW': '桶',
                  ja: 'バレル',
                  ko: '배럴',
                  ru: 'барр.',
                  mn: 'баррель',
                  fa: 'بشکه',
                  ug: 'تۇڭ',
                  en: 'bbl',
                  fr: 'bbl',
                };
                const gramUnit = gramUnitMap[settings.language] || 'g';
                const mmbtuUnit =
                  settings.language === 'zh-TW'
                    ? '百萬英熱'
                    : settings.language === 'zh-CN'
                    ? '百万英热'
                    : 'MMBtu';
                const bblUnit = bblUnitMap[settings.language] || 'bbl';

                const rmbNote =
                  item.category === 'metal'
                    ? `≈ ¥${((item.price * usdToCny) / TROY_OZ_GRAMS).toFixed(item.id === 'silver' ? 2 : 1)}/${gramUnit}`
                    : item.category === 'energy'
                    ? `≈ ¥${(item.price * usdToCny).toFixed(2)}/${item.id === 'natgas' ? mmbtuUnit : bblUnit}`
                    : null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedQuote(item)}
                    className="w-full text-start px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl bg-white/95 dark:bg-white/[0.05] border border-neutral-200/75 dark:border-white/10 hover:border-blue-400/60 dark:hover:border-blue-400/50 hover:bg-white dark:hover:bg-white/[0.09] transition-all cursor-pointer group flex items-center justify-between gap-2.5 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-bold text-sm sm:text-[15px] text-neutral-900 dark:text-neutral-50 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {shortName}
                        </span>
                        {rmbNote && (
                          <span className="text-[11px] font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                            {rmbNote}
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5 text-[11px] font-mono tabular-nums font-medium text-neutral-500 dark:text-neutral-400 leading-snug">
                        <div className="whitespace-nowrap">
                          {ui.gfHigh} {highStr}
                        </div>
                        <div className="whitespace-nowrap">
                          {ui.gfLow} {lowStr}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 font-mono tabular-nums">
                      <div className="text-end">
                        <div className="text-[15px] sm:text-base font-extrabold tracking-tight text-neutral-950 dark:text-white leading-tight">
                          {priceStr}
                        </div>
                        <div className={`text-[11.5px] font-bold tracking-tight leading-tight mt-0.5 ${trendTheme.textClass}`}>
                          {changeStr}
                        </div>
                      </div>
                      <span
                        className={`min-w-[78px] sm:min-w-[84px] px-2 sm:px-2.5 text-center py-1.5 rounded-xl text-[11.5px] sm:text-xs font-extrabold tracking-tight ${trendTheme.badgeClass}`}
                      >
                        {pctStr}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 2: 📊 经济指标 (12大宏观与热力矩阵指标) ================= */}
        {activeTab === 'macro' && (
          <div className="h-full flex flex-col justify-between overflow-hidden gap-1 [@media(max-height:560px)]:gap-0.5">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-200/75 dark:border-neutral-800 [.amoled-mode_&]:border-white/12 pb-1.5 [@media(max-height:560px)]:pb-1 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-sm sm:text-[15px] font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 truncate">
                  <BarChart3 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate">{ui.toolTabMacro}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => refreshLiveMacro(true)}
                  disabled={macroSyncActive}
                  title={ui.toolRefreshLive}
                  aria-label={ui.toolRefreshLive}
                  className="relative w-7 h-7 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  {macroSyncActive && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-1 rounded-2xl border border-indigo-400/55 animate-sync-halo"
                    />
                  )}
                  <RefreshCw className={`w-3.5 h-3.5 ${macroSyncActive ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {toolCloseBtn}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto py-0.5 pb-14 md:pb-0.5 [@media(max-height:560px)]:pb-12 pr-0.5 flex flex-col justify-center">
              {/* Balanced 12 Macro Indicator Cards: 2x6 portrait, 4x3 landscape/tablet/desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-4 [@media(max-height:560px)]:grid-cols-4 gap-1.5 sm:gap-2.5 [@media(max-height:560px)]:gap-1.5 content-center">
                {macroIndicators.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      void refreshLiveMacro(false, true);
                      if (item.id === 'household_loans') {
                        setShowHouseholdLoansModal(true);
                      } else if (item.id === 'major_macro') {
                        setShowMajorMacroModal(true);
                      } else {
                        setActiveTrendModal(item);
                      }
                    }}
                    className="text-start p-2 sm:p-2.5 [@media(max-height:560px)]:p-1.5 rounded-xl bg-neutral-50/90 dark:bg-neutral-800/70 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/75 dark:border-neutral-700/65 [.amoled-mode_&]:border-white/12 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500/70 hover:bg-white dark:hover:bg-neutral-800 [.amoled-mode_&]:hover:bg-neutral-900 transition-all active:scale-[0.98] shadow-2xs flex flex-col justify-between gap-0.5 sm:gap-1"
                  >
                    <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-[11px] font-bold text-neutral-700 dark:text-neutral-200 leading-tight">
                      <span className="truncate">{item.title.split(' ')[0]}</span>
                      <span className={`text-[9px] sm:text-[9.5px] font-semibold shrink-0 ${item.statusColor.split(' ')[0]}`}>
                        {item.statusTag}
                      </span>
                    </div>

                    <div className="text-base sm:text-xl [@media(max-height:560px)]:text-sm font-black font-mono tabular-nums text-neutral-900 dark:text-neutral-50 tracking-tight leading-tight">
                      {item.latestVal}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between gap-1 text-[9.5px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 tabular-nums leading-tight">
                        <span className="truncate">{item.changeMoM}</span>
                        <span className="text-indigo-500 font-bold shrink-0">↗</span>
                      </div>

                      <div className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono truncate border-t border-neutral-200/60 dark:border-neutral-700/50 [.amoled-mode_&]:border-white/10 pt-0.5">
                        {item.updateDate} · {item.code}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: 💰 存贷测算 (商贷/公积金/组合贷 + LPR基点 + 提前还贷 + 分期明细 + 复利定存) ================= */}
        {activeTab === 'rates' && (
          <div className="h-full flex flex-col justify-between overflow-hidden gap-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-200/70 dark:border-white/10 pb-2.5 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2 truncate">
                  <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">{ui.toolTabRates}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => refreshBenchmarkRates(true)}
                  disabled={isRatesRefreshing}
                  title={ui.toolRefreshLive}
                  aria-label={ui.toolRefreshLive}
                  className="relative w-7 h-7 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  {(isRatesRefreshing || isGlobalSyncing) && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-1 rounded-2xl border border-emerald-400/55 animate-sync-halo"
                    />
                  )}
                  <RefreshCw className={`w-3.5 h-3.5 ${isRatesRefreshing || isGlobalSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="shrink-0">
                {toolCloseBtn}
              </div>
            </div>

            {/* 2-Segment Mode Switcher: 存款 (first) | 贷款 (second) */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full shrink-0">
              <button
                type="button"
                onClick={() => setRateCalcType('deposit')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-full text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                  rateCalcType === 'deposit'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                }`}
              >
                <span aria-hidden="true" className="shrink-0">🏦</span>
                <span className="truncate">{ui.toolRatesDepositMode}</span>
              </button>
              <button
                type="button"
                onClick={() => setRateCalcType('loan')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-full text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                  rateCalcType === 'loan'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                }`}
              >
                <span aria-hidden="true" className="shrink-0">🏠</span>
                <span className="truncate">{ui.toolRatesLoanMode}</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pb-16 md:pb-1 space-y-3 pe-0.5">
              {rateCalcType === 'loan' ? (
                <>
                  {/* 3-Column Portfolio Switcher: 商业贷款 | 公积金贷 | 组合贷款 */}
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full">
                    {[
                      { id: 'commercial' as LoanPortfolioType, label: ratesPro.portfolioCommercial },
                      { id: 'provident' as LoanPortfolioType, label: ratesPro.portfolioProvident },
                      { id: 'combined' as LoanPortfolioType, label: ratesPro.portfolioCombined },
                    ].map((pt) => (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => setLoanPortfolioType(pt.id)}
                        className={`flex items-center justify-center py-1.5 px-2 rounded-full text-xs transition-all cursor-pointer min-w-0 ${
                          loanPortfolioType === pt.id
                            ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                        }`}
                      >
                        <span className="truncate">{pt.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {/* Compact Single-Row Loan Inputs (Rate follows latest benchmark automatically, editable) */}
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 items-center">
                        <div className="flex items-center gap-1 min-w-0 bg-white dark:bg-neutral-700/90 border border-neutral-200/80 dark:border-neutral-600 rounded-xl px-1.5 sm:px-2.5 py-1.5">
                          <span className="text-[11px] sm:text-xs font-bold text-neutral-600 dark:text-neutral-300 shrink-0 truncate">
                            {loanPortfolioType === 'combined'
                              ? ratesPro.commercialAmountLabel
                              : ui.toolRatesLoanAmount}
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={loanAmountInput}
                            onChange={(e) => handleLoanAmountChange(e.target.value)}
                            onBlur={handleLoanAmountBlur}
                            placeholder="0"
                            aria-label={loanPortfolioType === 'combined' ? ratesPro.commercialAmountLabel : ui.toolRatesLoanAmount}
                            className="flex-1 min-w-0 w-full text-end font-mono tabular-nums font-black text-blue-600 dark:text-blue-400 bg-transparent text-xs focus:outline-none"
                          />
                          <span className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-bold shrink-0">{ui.toolRatesUnitWan}</span>
                        </div>

                        <div className="flex items-center gap-1 min-w-0 bg-white dark:bg-neutral-700/90 border border-neutral-200/80 dark:border-neutral-600 rounded-xl px-1.5 sm:px-2.5 py-1.5">
                          <span className="text-[11px] sm:text-xs font-bold text-neutral-600 dark:text-neutral-300 shrink-0 truncate">{ui.toolRatesLoanYears}</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={loanYearsInput}
                            onChange={(e) => handleLoanYearsChange(e.target.value)}
                            onBlur={handleLoanYearsBlur}
                            placeholder="1"
                            aria-label={ui.toolRatesLoanYears}
                            className="flex-1 min-w-0 w-full text-end font-mono tabular-nums font-black text-blue-600 dark:text-blue-400 bg-transparent text-xs focus:outline-none"
                          />
                          <span className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-bold shrink-0">{ui.toolRatesUnitYears}</span>
                        </div>

                        {loanPortfolioType === 'provident' ? (
                          <div className="flex items-center gap-1 min-w-0 bg-white dark:bg-neutral-700/90 border border-neutral-200/80 dark:border-neutral-600 rounded-xl px-1.5 sm:px-2.5 py-1.5">
                            <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 truncate">{ui.toolRatesLoanRate}</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={hpfRateInput}
                              onChange={(e) => handleHpfRateChange(e.target.value)}
                              onBlur={handleHpfRateBlur}
                              placeholder="2.85"
                              aria-label={ui.toolRatesLoanRate}
                              className="flex-1 min-w-0 w-full text-end font-mono tabular-nums font-black text-emerald-600 dark:text-emerald-400 bg-transparent text-xs focus:outline-none"
                            />
                            <span className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-bold shrink-0">%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 min-w-0 bg-white dark:bg-neutral-700/90 border border-neutral-200/80 dark:border-neutral-600 rounded-xl px-1.5 sm:px-2.5 py-1.5">
                            <span className="text-[11px] sm:text-xs font-bold text-neutral-600 dark:text-neutral-300 shrink-0 truncate">{ui.toolRatesLoanRate}</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={loanRateInput}
                              onChange={(e) => handleLoanRateChange(e.target.value)}
                              onBlur={handleLoanRateBlur}
                              placeholder="0.00"
                              aria-label={ui.toolRatesLoanRate}
                              className="flex-1 min-w-0 w-full text-end font-mono tabular-nums font-black text-blue-600 dark:text-blue-400 bg-transparent text-xs focus:outline-none"
                            />
                            <span className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-bold shrink-0">%</span>
                          </div>
                        )}
                      </div>

                      {loanPortfolioType === 'combined' && (
                        <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 grid grid-cols-2 gap-2 items-center">
                          <div className="flex items-center gap-1 min-w-0 bg-white dark:bg-neutral-700/90 border border-neutral-200/80 dark:border-neutral-600 rounded-xl px-2 py-1.5">
                            <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 truncate">
                              {ratesPro.providentAmountLabel}
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={hpfAmountInput}
                              onChange={(e) => handleHpfAmountChange(e.target.value)}
                              onBlur={handleHpfAmountBlur}
                              placeholder="0"
                              aria-label={ratesPro.providentAmountLabel}
                              className="flex-1 min-w-0 w-full text-end font-mono tabular-nums font-black text-emerald-600 dark:text-emerald-400 bg-transparent text-xs focus:outline-none"
                            />
                            <span className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-bold shrink-0">{ui.toolRatesUnitWan}</span>
                          </div>

                          <div className="flex items-center gap-1 min-w-0 bg-white dark:bg-neutral-700/90 border border-neutral-200/80 dark:border-neutral-600 rounded-xl px-2 py-1.5">
                            <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 truncate">{ratesPro.providentRateLabel}</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={hpfRateInput}
                              onChange={(e) => handleHpfRateChange(e.target.value)}
                              onBlur={handleHpfRateBlur}
                              placeholder="2.85"
                              aria-label={ratesPro.providentRateLabel}
                              className="flex-1 min-w-0 w-full text-end font-mono tabular-nums font-black text-emerald-600 dark:text-emerald-400 bg-transparent text-xs focus:outline-none"
                            />
                            <span className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-bold shrink-0">%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Repayment Method, Results, Ratio Bar, Actions */}
                    <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-3 flex flex-col justify-between">
                      <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 text-xs w-full">
                        {[
                          { id: 'equal_pi' as LoanMethod, label: ui.toolRatesEqualPi },
                          { id: 'equal_p' as LoanMethod, label: ui.toolRatesEqualP },
                          { id: 'interest_first' as LoanMethod, label: ui.toolRatesInterestFirst },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setLoanMethod(m.id)}
                            className={`flex items-center justify-center py-2 px-1.5 sm:px-3 rounded-full text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                              loanMethod === m.id
                                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm font-bold'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                            }`}
                          >
                            <span className="truncate">{m.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 min-w-0 overflow-hidden flex flex-col justify-between">
                          <div className="text-[10px] text-blue-600 font-bold truncate">
                            {loanMethod === 'equal_pi'
                              ? ui.toolRatesMonthlyPay
                              : loanMethod === 'equal_p'
                              ? ui.toolRatesFirstMonthPay
                              : ui.toolRatesMonthlyInterest}
                          </div>
                          <div
                            className="text-sm sm:text-base md:text-lg font-black font-mono tabular-nums text-blue-600 my-0.5 truncate"
                            title={`¥${loanSummary.firstMonthPayment.toFixed(2)}`}
                          >
                            ¥{loanSummary.firstMonthPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {loanSummary.isDecreasing ? (
                            <div className="text-[9px] text-neutral-400 font-mono tabular-nums truncate">
                              {ui.toolRatesLastMonth} ¥{loanSummary.lastMonthPayment.toFixed(0)}
                            </div>
                          ) : (
                            <div className="text-[9px] text-neutral-400 font-mono tabular-nums truncate">
                              {effectiveAnnualRatePct.toFixed(2)}%
                            </div>
                          )}
                        </div>

                        <div className="p-2 sm:p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 min-w-0 overflow-hidden flex flex-col justify-between">
                          <div className="text-[10px] text-rose-600 font-bold truncate">{ui.toolRatesTotalInterest}</div>
                          <div
                            className="text-sm sm:text-base md:text-lg font-black font-mono tabular-nums text-rose-600 my-0.5 truncate"
                            title={`¥${loanSummary.totalInterest.toFixed(2)}`}
                          >
                            ¥{Math.round(loanSummary.totalInterest).toLocaleString('en-US')}
                          </div>
                          <div className="text-[9px] text-neutral-400 font-mono tabular-nums truncate">
                            +{loanSummary.interestMultiplierPct}%
                          </div>
                        </div>

                        <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 min-w-0 overflow-hidden flex flex-col justify-between">
                          <div className="text-[10px] text-emerald-600 font-bold truncate">{ui.toolRatesTotalPayment}</div>
                          <div
                            className="text-sm sm:text-base md:text-lg font-black font-mono tabular-nums text-emerald-600 my-0.5 truncate"
                            title={`¥${loanSummary.totalPayment.toFixed(2)}`}
                          >
                            ¥{Math.round(loanSummary.totalPayment).toLocaleString('en-US')}
                          </div>
                          <div className="text-[9px] text-neutral-400 font-mono tabular-nums truncate">
                            ¥{(loanSummary.principalTotal / 10000).toFixed(0)}{ui.toolRatesUnitWan}
                          </div>
                        </div>
                      </div>

                      {/* Principal vs Interest Stacked Ratio Visualization (SVG, no inline style) */}
                      <div className="space-y-1.5 px-0.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-blue-600 dark:text-blue-400">
                            {ratesPro.principalRatioLabel} {loanSummary.principalRatioPct}%
                          </span>
                          <span className="text-rose-500">
                            {ratesPro.interestRatioLabel} {loanSummary.interestRatioPct}%
                          </span>
                        </div>
                        <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="w-full h-2 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                          <rect x="0" y="0" width={loanSummary.principalRatioPct} height="6" className="fill-blue-500" />
                          <rect x={loanSummary.principalRatioPct} y="0" width={loanSummary.interestRatioPct} height="6" className="fill-rose-500" />
                        </svg>
                      </div>

                      {/* Live Method Comparison Tip + Action Buttons */}
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-xl bg-white/75 dark:bg-neutral-800/75 border border-neutral-200/60 dark:border-neutral-700/60 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-blue-600">{ui.toolRatesPlanSummary}</span>
                            {loanMethod === 'equal_pi'
                              ? ui.toolRatesDescEqualPi
                              : loanMethod === 'equal_p'
                              ? ui.toolRatesDescEqualP
                              : ui.toolRatesDescInterestFirst}
                          </div>
                          {loanMethod !== 'interest_first' && loanComparisonDiff > 10 && (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              {loanMethod === 'equal_pi' ? ratesPro.compareTipEqualP : ratesPro.compareTipEqualPi}{' '}
                              ¥{Math.round(loanComparisonDiff).toLocaleString('en-US')}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
                          <button
                            type="button"
                            onClick={() => setIsPrepayOpen((p) => !p)}
                            className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer min-w-0 transition-all ${
                              isPrepayOpen
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-600'
                            }`}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{ratesPro.prepayTitle}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsScheduleOpen((p) => !p)}
                            className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer min-w-0 transition-all ${
                              isScheduleOpen
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-600'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{ratesPro.scheduleTitle}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleExportLoanCsv}
                            className="px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer min-w-0 transition-all"
                          >
                            <Download className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{ratesPro.exportCsvBtn}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleAddLoanReminderToCalendar}
                            className="px-2 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer min-w-0 transition-all"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{ratesPro.addPaymentReminder}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prepayment Simulator Collapsible Drawer */}
                  {isPrepayOpen && (
                    <div className="p-3.5 rounded-2xl bg-indigo-500/8 border border-indigo-500/20 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                          <span>{ratesPro.prepayTitle}</span>
                        </span>
                        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-full bg-white/80 dark:bg-neutral-800/80 border border-indigo-500/20 w-56 sm:w-72">
                          {[
                            { id: 'shorten_term' as PrepayStrategy, label: ratesPro.prepayShortenTerm },
                            { id: 'reduce_payment' as PrepayStrategy, label: ratesPro.prepayReducePay },
                          ].map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setPrepayStrategy(st.id)}
                              className={`py-1 px-2 rounded-full text-[10px] font-bold cursor-pointer truncate min-w-0 ${
                                prepayStrategy === st.id
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-neutral-600 dark:text-neutral-300'
                              }`}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center justify-between gap-2 bg-white/80 dark:bg-neutral-800/80 px-3 py-2 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                          <span className="font-bold text-neutral-600 dark:text-neutral-300 truncate">{ratesPro.prepayMonthLabel}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              min={1}
                              max={Math.max(1, loanYears * 12 - 1)}
                              value={prepayMonth}
                              onChange={(e) => setPrepayMonth(Math.max(1, Math.min(loanYears * 12 - 1, Number(e.target.value) || 1)))}
                              className="w-16 px-2 py-0.5 text-end font-mono font-bold bg-neutral-100 dark:bg-neutral-700 rounded-md border text-xs"
                            />
                            <span className="text-[11px] text-neutral-400">{ratesPro.monthsUnit}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 bg-white/80 dark:bg-neutral-800/80 px-3 py-2 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                          <span className="font-bold text-neutral-600 dark:text-neutral-300 truncate">{ratesPro.prepayAmountLabel}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              min={1}
                              max={1000}
                              value={prepayAmountWan}
                              onChange={(e) => setPrepayAmountWan(Math.max(0, Math.min(10000, Number(e.target.value) || 0)))}
                              className="w-20 px-2 py-0.5 text-end font-mono font-bold bg-neutral-100 dark:bg-neutral-700 rounded-md border text-xs"
                            />
                            <span className="text-[11px] text-neutral-400">{ui.toolRatesUnitWan}</span>
                          </div>
                        </div>
                      </div>

                      {prepayResult.valid && (
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-indigo-500/15 min-w-0">
                            <div className="text-[10px] text-neutral-500 font-bold truncate">{ratesPro.prepayNewMonthly}</div>
                            <div className="text-sm font-black font-mono text-indigo-600 truncate">
                              ¥{prepayResult.newMonthlyPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </div>
                          </div>
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-indigo-500/15 min-w-0">
                            <div className="text-[10px] text-neutral-500 font-bold truncate">{ratesPro.prepayMonthsSaved}</div>
                            <div className="text-sm font-black font-mono text-blue-600 truncate">
                              {prepayResult.monthsSaved} {ratesPro.monthsUnit}
                            </div>
                          </div>
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-indigo-500/15 min-w-0">
                            <div className="text-[10px] text-neutral-500 font-bold truncate">{ratesPro.prepayInterestSaved}</div>
                            <div className="text-sm font-black font-mono text-emerald-600 truncate">
                              ¥{Math.round(prepayResult.interestSaved).toLocaleString('en-US')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Amortization Schedule Collapsible Drawer */}
                  {isScheduleOpen && loanSummary.monthlySchedule.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-neutral-50/90 dark:bg-neutral-800/70 border border-neutral-200/70 dark:border-neutral-700/70 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-neutral-800 dark:text-neutral-100">{ratesPro.scheduleTitle}</span>
                        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-full bg-neutral-200/80 dark:bg-neutral-700/80 w-52">
                          <button
                            type="button"
                            onClick={() => setScheduleView('yearly')}
                            className={`py-1 px-2 rounded-full text-[10px] font-bold cursor-pointer truncate ${
                              scheduleView === 'yearly' ? 'bg-white dark:bg-neutral-800 text-blue-600 shadow-2xs' : 'text-neutral-500'
                            }`}
                          >
                            {ratesPro.scheduleByYear}
                          </button>
                          <button
                            type="button"
                            onClick={() => setScheduleView('monthly24')}
                            className={`py-1 px-2 rounded-full text-[10px] font-bold cursor-pointer truncate ${
                              scheduleView === 'monthly24' ? 'bg-white dark:bg-neutral-800 text-blue-600 shadow-2xs' : 'text-neutral-500'
                            }`}
                          >
                            {ratesPro.scheduleFirst24}
                          </button>
                        </div>
                      </div>

                      <div className="max-h-52 overflow-y-auto rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-900/40">
                        <table className="w-full text-[11px] font-mono tabular-nums text-end">
                          <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-sans font-bold">
                            <tr>
                              <th className="py-1.5 px-2 text-start">{ratesPro.colPeriod}</th>
                              <th className="py-1.5 px-2">{ratesPro.colPayment}</th>
                              <th className="py-1.5 px-2">{ratesPro.colPrincipal}</th>
                              <th className="py-1.5 px-2">{ratesPro.colInterest}</th>
                              <th className="py-1.5 px-2">{ratesPro.colRemaining}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {scheduleView === 'yearly'
                              ? loanSummary.yearlySchedule.map((row) => (
                                  <tr key={row.year} className="hover:bg-blue-500/5">
                                    <td className="py-1.5 px-2 text-start font-sans font-bold text-neutral-700 dark:text-neutral-200">
                                      {ratesPro.yearUnit.replace('{n}', String(row.year))}
                                    </td>
                                    <td className="py-1.5 px-2 font-bold">¥{Math.round(row.totalPayment).toLocaleString('en-US')}</td>
                                    <td className="py-1.5 px-2 text-blue-600">¥{Math.round(row.principalPaid).toLocaleString('en-US')}</td>
                                    <td className="py-1.5 px-2 text-rose-500">¥{Math.round(row.interestPaid).toLocaleString('en-US')}</td>
                                    <td className="py-1.5 px-2 text-neutral-500">¥{Math.round(row.endingBalance).toLocaleString('en-US')}</td>
                                  </tr>
                                ))
                              : loanSummary.monthlySchedule.slice(0, 24).map((row) => (
                                  <tr key={row.month} className="hover:bg-blue-500/5">
                                    <td className="py-1.5 px-2 text-start font-sans font-bold text-neutral-700 dark:text-neutral-200">
                                      {ratesPro.monthUnit.replace('{n}', String(row.month))}
                                    </td>
                                    <td className="py-1.5 px-2 font-bold">¥{row.payment.toFixed(0)}</td>
                                    <td className="py-1.5 px-2 text-blue-600">¥{row.principal.toFixed(0)}</td>
                                    <td className="py-1.5 px-2 text-rose-500">¥{row.interest.toFixed(0)}</td>
                                    <td className="py-1.5 px-2 text-neutral-500">¥{Math.round(row.remaining).toLocaleString('en-US')}</td>
                                  </tr>
                                ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3 py-0.5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Left Column: Principal, Rate, Term & Rollover Controls */}
                    <div className="p-4 rounded-2xl bg-neutral-50/85 dark:bg-neutral-800/60 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-700/60 [.amoled-mode_&]:border-white/12 space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span>{ui.toolRatesDepositPrincipal}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums font-black">
                            ¥{depositAmount.toLocaleString('en-US')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-neutral-400">¥</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={depositAmountInput}
                              onChange={(e) => handleDepositAmountChange(e.target.value)}
                              onBlur={handleDepositAmountBlur}
                              placeholder="0"
                              className="w-full ps-7 pe-3 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200/80 dark:border-neutral-600 text-sm font-bold font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div className="flex items-center gap-1 bg-white dark:bg-neutral-700 border border-neutral-200/80 dark:border-neutral-600 rounded-xl px-2 py-1 shrink-0">
                            <span className="text-[10px] font-bold text-neutral-400">{ratesPro.customRateLabel}</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={depositCustomRateInput}
                              onChange={(e) => handleDepositCustomRateChange(e.target.value)}
                              onBlur={handleDepositCustomRateBlur}
                              className="w-12 text-end font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs bg-transparent focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400">
                          <span>{ui.toolRatesDepositTermRef}</span>
                          <span className="text-[10px] font-mono text-neutral-400">{benchmarkRates.publishDate}</span>
                        </div>
                        <div className="flex flex-nowrap items-stretch gap-1 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-4 sm:gap-1.5 sm:overflow-visible">
                          {(Object.keys(depositRateTable) as DepositTermKey[]).map((k) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => {
                                hasCustomDepositRateRef.current = false;
                                setDepositTerm(k);
                                const r = depositRateTable[k].rate;
                                setDepositCustomRate(r);
                                setDepositCustomRateInput(r.toFixed(2));
                              }}
                              className={`shrink-0 min-w-[68px] sm:min-w-0 px-2 py-1 sm:p-1.5 rounded-xl text-center border transition-all cursor-pointer ${
                                depositTerm === k
                                  ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
                                  : 'bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-600 hover:border-emerald-400'
                              }`}
                            >
                              <div className="text-[10px] font-bold truncate">{depositRateTable[k].label}</div>
                              <div className="text-xs font-mono tabular-nums font-black">{depositRateTable[k].rate}%</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-0.5 items-end">
                        <div className="sm:col-span-7 space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400">
                            <span>{ratesPro.rolloverCyclesLabel}</span>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              {depositCalculationResult.totalMonths} {ratesPro.monthsUnit}
                            </span>
                          </div>
                          <div className="grid grid-cols-5 gap-1">
                            {[1, 2, 3, 4, 5].map((cyc) => (
                              <button
                                key={cyc}
                                type="button"
                                onClick={() => setDepositRolloverCycles(cyc)}
                                className={`text-[11px] py-1 px-1 rounded-lg border font-mono font-bold cursor-pointer text-center min-w-0 transition-all ${
                                  depositRolloverCycles === cyc
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-600 hover:border-emerald-400'
                                }`}
                              >
                                {cyc}x
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="sm:col-span-5 space-y-1">
                          <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                            {(
                              {
                                'zh-CN': '起存日期',
                                'zh-TW': '起存日期',
                                ja: '預入開始日',
                                ko: '예치 시작일',
                                fr: 'Date de départ',
                                ru: 'Дата вклада',
                                fa: 'تاریخ شروع',
                                mn: 'Эхлэх огноо',
                                ug: 'باشلىنىش ۋاقتى',
                                en: 'Start Date',
                              } as Record<string, string>
                            )[settings.language] || 'Start Date'}
                          </label>
                          <input
                            type="date"
                            value={depositStartDate}
                            onChange={(e) => setDepositStartDate(e.target.value || todayStr)}
                            className="w-full px-2 py-1 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-[11px] font-mono font-bold text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Yield Breakdown + Principal/Interest Ratio + Multi-Term Matrix */}
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between gap-2.5">
                      <div className="text-center space-y-1">
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          {ui.toolRatesDepositTotalInterest}
                        </div>
                        <div className="text-3xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                          ¥{depositCalculationResult.interest.toLocaleString('en-US')}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums">
                          {ui.toolRatesDepositDailyEst.replace('{amount}', depositCalculationResult.dailyInterest)}
                        </div>
                        {depositCalculationResult.compoundExtraInterest > 0 && (
                          <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold font-mono">
                            {ratesPro.rolloverBonusLabel}: +¥{depositCalculationResult.compoundExtraInterest.toLocaleString('en-US')}
                          </div>
                        )}
                      </div>

                      {/* Principal vs Interest Visual Ratio Bar */}
                      {(() => {
                        const totalVal = Math.max(1, depositCalculationResult.total);
                        const principalPct = Math.round((depositCalculationResult.principalTotal / totalVal) * 1000) / 10;
                        const interestPct = Math.max(0, Math.round((100 - principalPct) * 10) / 10);
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-600 dark:text-neutral-300">
                              <span>
                                {ratesPro.principalRatioLabel} {principalPct}%
                              </span>
                              <span className="text-emerald-700 dark:text-emerald-300">
                                {ratesPro.interestRatioLabel} {interestPct}%
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-neutral-200/80 dark:bg-neutral-800 overflow-hidden flex">
                              <div
                                className="h-full bg-neutral-500/75 dark:bg-neutral-500 transition-all duration-300"
                                style={{ width: `${principalPct}%` }}
                              />
                              <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${Math.max(interestPct, depositCalculationResult.interest > 0 ? 1.5 : 0)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-white/70 dark:bg-neutral-800/70 min-w-0">
                          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold truncate">
                            {ratesPro.maturityDateLabel}
                          </div>
                          <div className="text-xs font-black font-mono text-neutral-800 dark:text-neutral-100 truncate">
                            {depositCalculationResult.maturityDateStr}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-white/70 dark:bg-neutral-800/70 min-w-0">
                          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold truncate">
                            {ratesPro.annualYieldLabel}
                          </div>
                          <div className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 truncate">
                            {depositCalculationResult.annualizedYieldPct.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      {/* Multi-Term Yield Quick Comparison Strip */}
                      <div className="grid grid-cols-5 gap-1">
                        {depositTermComparisons.map((cmp) => {
                          const isCurrent = depositTerm === cmp.key;
                          return (
                            <button
                              key={cmp.key}
                              type="button"
                              onClick={() => {
                                setDepositTerm(cmp.key);
                                setDepositCustomRate(cmp.rate);
                                setDepositCustomRateInput(cmp.rate.toFixed(2));
                              }}
                              className={`p-1.5 rounded-xl text-center border transition-all cursor-pointer min-w-0 ${
                                isCurrent
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : 'bg-white/65 dark:bg-neutral-800/65 text-neutral-700 dark:text-neutral-200 border-emerald-500/15 hover:border-emerald-500/50'
                              }`}
                            >
                              <div className="text-[9.5px] font-bold truncate">{cmp.label.replace('定存', '')}</div>
                              <div className={`text-[10px] font-mono font-black truncate ${isCurrent ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                +¥{cmp.interest >= 10000 ? `${(cmp.interest / 10000).toFixed(2)}w` : cmp.interest.toLocaleString('en-US')}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 rounded-xl bg-white/80 dark:bg-neutral-800/80">
                        <div className="font-mono tabular-nums font-black text-sm text-neutral-800 dark:text-neutral-100 truncate">
                          {ui.toolRatesDepositTotalMaturity.replace('{amount}', depositCalculationResult.total.toLocaleString('en-US'))}
                        </div>
                        <button
                          type="button"
                          onClick={handleAddDepositMaturityToCalendar}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shrink-0 active:scale-95 transition-all"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 shrink-0" />
                          <span>{ratesPro.addMaturityReminder}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-neutral-400 flex flex-wrap items-center justify-between gap-2 shrink-0 pt-1">
              <span>{ui.toolRatesSourceLabel} {benchmarkRates.sourceName}</span>
              {rateCalcType === 'loan' && benchmarkRates.publishDate && (
                <span className="font-mono tabular-nums">{benchmarkRates.publishDate}</span>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: 💱 实时汇率 (双向实时换算 + ECB历史走势 + 12币种矩阵 + 数据来源标注) ================= */}
        {activeTab === 'forex' && (() => {
          const providerCode = forexSnapshot.providerCode || (forexSnapshot.isLive ? 'er_api' : 'cache');
          const providerDisplay = forexSnapshot.sourceName || forexPro.providers[providerCode];
          const unitRateDirect = getUnitExchangeRate(forexBaseCurrency, forexTargetCurrency);
          const unitRateInverse = getUnitExchangeRate(forexTargetCurrency, forexBaseCurrency);
          const pairPts = forexPairSeries?.points || [];
          const activeFxPt = forexPairHoverIdx !== null && pairPts[forexPairHoverIdx] ? pairPts[forexPairHoverIdx] : pairPts[pairPts.length - 1] || null;
          const fxVals = pairPts.map((p) => p.rate);
          const fxMin = fxVals.length > 0 ? Math.min(...fxVals) : unitRateDirect;
          const fxMax = fxVals.length > 0 ? Math.max(...fxVals) : unitRateDirect;
          const fxSpan = Math.max(fxMax - fxMin, unitRateDirect * 0.002, 0.0001);
          const fxPlotMin = fxMin - fxSpan * 0.14;
          const fxPlotMax = fxMax + fxSpan * 0.14;
          const fxPlotSpan = Math.max(fxPlotMax - fxPlotMin, 0.0001);
          const FX_W = 480;
          const FX_H = 88;
          const FX_PX = 8;
          const FX_PY = 8;
          const mapFxX = (idx: number) =>
            pairPts.length <= 1 ? FX_PX : FX_PX + (idx / (pairPts.length - 1)) * (FX_W - FX_PX * 2);
          const mapFxY = (r: number) =>
            FX_PY + ((fxPlotMax - r) / fxPlotSpan) * (FX_H - FX_PY * 2);
          const fxPolyline = pairPts.map((p, idx) => `${mapFxX(idx).toFixed(1)},${mapFxY(p.rate).toFixed(1)}`).join(' ');
          const fxAreaPath =
            pairPts.length >= 2
              ? `M ${mapFxX(0).toFixed(1)} ${(FX_H - FX_PY).toFixed(1)} ${pairPts
                  .map((p, idx) => `L ${mapFxX(idx).toFixed(1)} ${mapFxY(p.rate).toFixed(1)}`)
                  .join(' ')} L ${mapFxX(pairPts.length - 1).toFixed(1)} ${(FX_H - FX_PY).toFixed(1)} Z`
              : '';
          const fxUp = (forexPairSeries?.changePct ?? 0) >= 0;
          const fxTheme = getMarketTrendTheme(settings.language, fxUp);
          const rateDec = unitRateDirect < 0.1 ? 5 : unitRateDirect >= 50 ? 2 : 4;
          const invDec = unitRateInverse < 0.1 ? 5 : unitRateInverse >= 50 ? 2 : 4;

          return (
            <div className="h-full flex flex-col justify-between overflow-hidden gap-1.5">
              {/* Header Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-neutral-200/70 dark:border-white/10 pb-1.5 shrink-0">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-sm sm:text-base font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 truncate">
                      <ArrowRightLeft className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate">{ui.toolTabForex}</span>
                    </h2>
                    <button
                      type="button"
                      onClick={handleRefreshForex}
                      disabled={isForexRefreshing}
                      title={ui.toolRefreshLive}
                      aria-label={ui.toolRefreshLive}
                      className="relative w-7 h-7 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      {isForexRefreshing && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -inset-1 rounded-2xl border border-indigo-400/55 animate-sync-halo"
                        />
                      )}
                      <RefreshCw className={`w-3.5 h-3.5 ${isForexRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <span
                      className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border truncate max-w-[230px] ${
                        forexSnapshot.isLive
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                          : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 border-neutral-500/20'
                      }`}
                      title={`${forexPro.sourcePrefix}: ${providerDisplay}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${forexSnapshot.isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="truncate">{forexPro.sourcePrefix}：{providerDisplay}</span>
                    </span>
                  </div>
                  <div className="text-[10px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 ps-5.5 truncate">
                    <span>
                      {forexPro.quoteDateLabel}：{forexSnapshot.rateDate || toDateString(new Date())}
                      {forexSnapshot.updatedAt ? ` · ${forexSnapshot.updatedAt}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {toolCloseBtn}
                </div>
              </div>

              {/* Compact 1-Page Adaptive Workspace (Converter + Full-Size Chart on Left, 12-Currency Matrix on Right on Desktop/Landscape) */}
              <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-2 py-0.5 overflow-y-auto lg:overflow-hidden pb-12 md:pb-0.5">
                {/* Left Column: Converter + Full-Size ECB Trend Chart */}
                <div className="lg:col-span-6 flex flex-col gap-2 min-h-0">
                  {/* Bidirectional Dual-Currency Converter Card */}
                  <div className="rounded-2xl bg-gradient-to-br from-indigo-500/[0.09] via-blue-500/[0.06] to-sky-500/[0.09] dark:from-indigo-500/15 dark:via-blue-500/10 dark:to-sky-500/15 border border-indigo-500/20 dark:border-indigo-400/25 p-2 sm:p-2.5 space-y-1.5 shadow-2xs shrink-0">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 sm:gap-1.5">
                      {/* From Side */}
                      <div className="rounded-xl bg-white/95 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-white/10 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1.5 sm:px-2.5 space-y-1 shadow-2xs transition-all min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-sm leading-none shrink-0" aria-hidden="true">
                            {currencyMatrix[forexBaseCurrency]?.flag}
                          </span>
                          <select
                            value={forexBaseCurrency}
                            onChange={(e) => {
                              const next = e.target.value;
                              if (next === forexTargetCurrency) setForexTargetCurrency(forexBaseCurrency);
                              setForexBaseCurrency(next);
                              setForexLastEditedSide('base');
                            }}
                            aria-label={forexPro.fromLabel}
                            className="w-full min-w-0 bg-transparent text-[11px] sm:text-[11.5px] font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer truncate"
                          >
                            {Object.keys(currencyMatrix).map((code) => (
                              <option key={code} value={code}>
                                {code} · {settings.language === 'zh-TW' ? currencyMatrix[code].nameTw : isChinese ? currencyMatrix[code].name : currencyMatrix[code].nameEn}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400 shrink-0">
                            {currencyMatrix[forexBaseCurrency]?.symbol}
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={forexInputStr}
                            onChange={(e) => handleForexInputChange(e.target.value)}
                            onBlur={() => {
                              if (!forexInputStr) setForexInputStr('0');
                            }}
                            placeholder="100"
                            className="flex-1 bg-transparent text-end font-black font-mono tabular-nums text-sm sm:text-lg text-neutral-950 dark:text-white focus:outline-none min-w-0"
                          />
                          {forexInputStr && forexInputStr !== '0' && (
                            <button
                              type="button"
                              onClick={() => {
                                setForexLastEditedSide('base');
                                setForexInputStr('');
                              }}
                              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer shrink-0"
                              aria-label="Clear"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Center Swap Button */}
                      <div className="flex items-center justify-center shrink-0">
                        <button
                          type="button"
                          onClick={handleSwapForexPair}
                          title={forexPro.swapLabel}
                          aria-label={forexPro.swapLabel}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 dark:bg-neutral-800 border border-indigo-200 dark:border-indigo-500/35 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* To Side (also directly editable) */}
                      <div className="rounded-xl bg-white/95 dark:bg-neutral-900/90 border border-indigo-200/80 dark:border-indigo-500/30 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 px-2 py-1.5 sm:px-2.5 space-y-1 shadow-2xs transition-all min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-sm leading-none shrink-0" aria-hidden="true">
                            {currencyMatrix[forexTargetCurrency]?.flag}
                          </span>
                          <select
                            value={forexTargetCurrency}
                            onChange={(e) => {
                              const next = e.target.value;
                              if (next === forexBaseCurrency) setForexBaseCurrency(forexTargetCurrency);
                              setForexTargetCurrency(next);
                              setForexLastEditedSide('base');
                            }}
                            aria-label={forexPro.toLabel}
                            className="w-full min-w-0 bg-transparent text-[11px] sm:text-[11.5px] font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer truncate"
                          >
                            {Object.keys(currencyMatrix).map((code) => (
                              <option key={code} value={code}>
                                {code} · {settings.language === 'zh-TW' ? currencyMatrix[code].nameTw : isChinese ? currencyMatrix[code].name : currencyMatrix[code].nameEn}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                            {currencyMatrix[forexTargetCurrency]?.symbol}
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={displayTargetStr}
                            onChange={(e) => handleForexTargetInputChange(e.target.value)}
                            onBlur={() => {
                              setForexLastEditedSide('base');
                            }}
                            placeholder="0.00"
                            className="flex-1 bg-transparent text-end font-black font-mono tabular-nums text-sm sm:text-lg text-neutral-950 dark:text-white focus:outline-none min-w-0"
                          />
                          <button
                            type="button"
                            onClick={handleCopyForexResult}
                            title={forexPro.copyLabel}
                            aria-label={forexPro.copyLabel}
                            className="px-1 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                          >
                            {forexCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bidirectional unit rate strip */}
                    <div className="flex items-center justify-end text-[10.5px] font-mono tabular-nums font-semibold text-indigo-700 dark:text-indigo-300">
                      1 {forexBaseCurrency} = {unitRateDirect.toFixed(rateDec)} {forexTargetCurrency} · 1 {forexTargetCurrency} = {unitRateInverse.toFixed(invDec)} {forexBaseCurrency}
                    </div>
                  </div>

                  {/* Interactive ECB Pair Trend & High/Low Card (Chart height intentionally kept uncompressed) */}
                  <div className="lg:flex-1 min-h-0 rounded-2xl bg-neutral-50/90 dark:bg-neutral-800/65 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/75 dark:border-white/10 p-2.5 flex flex-col justify-between gap-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 shrink-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100">
                          {forexBaseCurrency}/{forexTargetCurrency} {forexPro.trendTitle}
                        </span>
                        {forexPairSeries && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${fxTheme.badgeClass}`}>
                            {forexPairSeries.changePct > 0 ? '+' : ''}
                            {forexPairSeries.changePct.toFixed(2)}%
                          </span>
                        )}
                        {activeFxPt && (
                          <span className="text-[10px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400 truncate">
                            {activeFxPt.date} · {activeFxPt.rate.toFixed(rateDec)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {forexPairSeries && (
                          <span className="hidden xl:inline text-[10px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
                            {forexPro.highLabel} {forexPairSeries.periodHigh.toFixed(rateDec)} · {forexPro.lowLabel} {forexPairSeries.periodLow.toFixed(rateDec)}
                          </span>
                        )}
                        <div className="grid grid-cols-4 gap-0.5 p-0.5 rounded-full bg-neutral-200/75 dark:bg-white/[0.08] border border-neutral-200/70 dark:border-white/10">
                          {(['7D', '1M', '3M', '1Y'] as ForexPairTimeframe[]).map((tf) => (
                            <button
                              key={tf}
                              type="button"
                              onClick={() => setForexPairTimeframe(tf)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition-colors ${
                                forexPairTimeframe === tf
                                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-2xs'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                              }`}
                            >
                              {forexPro.tfLabels[tf]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="relative w-full lg:flex-1 flex items-center min-h-[76px] sm:min-h-[88px]">
                      {isForexHistoryLoading && pairPts.length === 0 ? (
                        <div className="h-20 w-full flex items-center justify-center text-xs text-neutral-400 gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                          <span>{ui.gfSyncing}</span>
                        </div>
                      ) : (
                        <svg
                          ref={forexSvgRef}
                          viewBox={`0 0 ${FX_W} ${FX_H}`}
                          className="w-full h-20 sm:h-24 lg:h-full lg:max-h-[124px] overflow-visible touch-none cursor-crosshair"
                          onMouseMove={(e) => {
                            if (!forexSvgRef.current || pairPts.length < 2) return;
                            const rect = forexSvgRef.current.getBoundingClientRect();
                            const relX = ((e.clientX - rect.left) / rect.width) * FX_W;
                            let best = 0;
                            let minD = Infinity;
                            for (let i = 0; i < pairPts.length; i++) {
                              const d = Math.abs(mapFxX(i) - relX);
                              if (d < minD) {
                                minD = d;
                                best = i;
                              }
                            }
                            setForexPairHoverIdx(best);
                          }}
                          onMouseLeave={() => setForexPairHoverIdx(null)}
                          onTouchMove={(e) => {
                            if (!forexSvgRef.current || pairPts.length < 2 || !e.touches[0]) return;
                            const rect = forexSvgRef.current.getBoundingClientRect();
                            const relX = ((e.touches[0].clientX - rect.left) / rect.width) * FX_W;
                            let best = 0;
                            let minD = Infinity;
                            for (let i = 0; i < pairPts.length; i++) {
                              const d = Math.abs(mapFxX(i) - relX);
                              if (d < minD) {
                                minD = d;
                                best = i;
                              }
                            }
                            setForexPairHoverIdx(best);
                          }}
                          onTouchEnd={() => setForexPairHoverIdx(null)}
                        >
                          <defs>
                            <linearGradient id="forexTrendFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={fxTheme.strokeHex} stopOpacity="0.22" />
                              <stop offset="100%" stopColor={fxTheme.strokeHex} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {pairPts.length >= 2 && (
                            <>
                              <path d={fxAreaPath} fill="url(#forexTrendFill)" />
                              <polyline
                                fill="none"
                                stroke={fxTheme.strokeHex}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={fxPolyline}
                              />
                            </>
                          )}
                          {forexPairHoverIdx !== null && pairPts[forexPairHoverIdx] && (
                            <g>
                              <line
                                x1={mapFxX(forexPairHoverIdx)}
                                x2={mapFxX(forexPairHoverIdx)}
                                y1={FX_PY}
                                y2={FX_H - FX_PY}
                                stroke="currentColor"
                                className="text-neutral-400/70"
                                strokeDasharray="2 3"
                              />
                              <circle
                                cx={mapFxX(forexPairHoverIdx)}
                                cy={mapFxY(pairPts[forexPairHoverIdx].rate)}
                                r="4"
                                fill={fxTheme.strokeHex}
                                stroke="#ffffff"
                                strokeWidth="1.5"
                              />
                            </g>
                          )}
                        </svg>
                      )}
                    </div>

                    {forexPairSeries && (
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0">
                        <span className="font-mono">{pairPts[0]?.timeLabel || ''}</span>
                        <span className="truncate px-1">
                          {forexPro.highLabel} {forexPairSeries.periodHigh.toFixed(rateDec)} · {forexPro.lowLabel} {forexPairSeries.periodLow.toFixed(rateDec)} · {forexPro.chartSourceLabel}：{forexPairSeries.sourceName}
                        </span>
                        <span className="font-mono">{pairPts[pairPts.length - 1]?.timeLabel || ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Compact 12-Currency Matrix (3x4 on Desktop/Landscape, 3x4 or 2x6 on Mobile) */}
                <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-rows-4 gap-1.5 min-h-0">
                  {Object.keys(currencyMatrix).map((code) => {
                    const item = currencyMatrix[code];
                    const isBase = code === forexBaseCurrency;
                    const isTarget = code === forexTargetCurrency;
                    const converted = getConvertedRate(code);
                    const unitRate = getUnitExchangeRate(forexBaseCurrency, code);
                    const displayDecimals = converted > 0 && converted < 1 ? 4 : code === 'JPY' || code === 'KRW' ? 0 : 2;

                    return (
                      <button
                        type="button"
                        key={code}
                        onClick={() => {
                          if (isTarget) {
                            handleSwapForexPair();
                          } else if (!isBase) {
                            setForexTargetCurrency(code);
                            setForexLastEditedSide('base');
                          }
                        }}
                        className={`text-start px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-0.5 min-w-0 ${
                          isBase
                            ? 'bg-indigo-600/10 border-indigo-500 shadow-xs ring-1 ring-indigo-500/40'
                            : isTarget
                            ? 'bg-emerald-500/10 border-emerald-500/80 shadow-xs ring-1 ring-emerald-500/35'
                            : 'bg-white/90 dark:bg-neutral-800/65 [.amoled-mode_&]:bg-neutral-950 border-neutral-200/70 dark:border-neutral-700/60 hover:border-indigo-400/60 hover:bg-white dark:hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 dark:text-neutral-300 gap-1">
                          <span className="flex items-center gap-1 min-w-0">
                            <span className="shrink-0">{item.flag}</span>
                            <span className="font-black text-neutral-900 dark:text-white">{code}</span>
                            {isBase && (
                              <span className="px-1 py-0 rounded bg-indigo-600 text-white text-[8.5px] font-bold leading-tight">
                                {forexPro.baseBadge}
                              </span>
                            )}
                            {isTarget && (
                              <span className="px-1 py-0 rounded bg-emerald-600 text-white text-[8.5px] font-bold leading-tight">
                                {forexPro.targetBadge}
                              </span>
                            )}
                          </span>
                          <span className="text-[9.5px] text-neutral-400 truncate">
                            {settings.language === 'zh-TW' ? item.nameTw : isChinese ? item.name : item.nameEn}
                          </span>
                        </div>

                        <div className="text-xs sm:text-sm font-black font-mono tabular-nums text-neutral-950 dark:text-neutral-50 truncate">
                          {item.symbol} {converted.toLocaleString('en-US', { minimumFractionDigits: displayDecimals, maximumFractionDigits: displayDecimals })}
                        </div>

                        <div className="text-[9.5px] font-mono tabular-nums text-neutral-400 truncate">
                          1 {forexBaseCurrency} = {unitRate.toFixed(unitRate < 0.1 ? 4 : 3)} {code}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compact Single-Strip Data Source & Attribution Footer */}
              <div className="text-[9.5px] text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 shrink-0 pt-1 border-t border-neutral-200/60 dark:border-white/10">
                <span className="truncate max-w-full sm:max-w-[70%]">
                  {forexPro.sourcePrefix}：{providerDisplay}
                  {` · ${forexPro.disclaimer}`}
                </span>
                <span className="font-mono tabular-nums shrink-0">
                  {forexSnapshot.isLive ? 'LIVE' : 'CACHE'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* ================= TAB 5: 💳 记账管理 (收支结余 + 月度预算进度条 + 分类占比 + 账户分析 + 编辑删除 + CSV导出) ================= */}
        {activeTab === 'accounting' && (
          <div className="h-full flex flex-col justify-between overflow-hidden gap-2">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-200/70 dark:border-white/10 pb-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2 truncate">
                  <Wallet className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">{ui.toolTabAccounting}</span>
                </h2>
                <button
                  type="button"
                  onClick={handleExportAccountingCsv}
                  disabled={filteredAccRecords.length === 0}
                  title={accProLabels.exportCsv}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                >
                  <Download className="w-3 h-3 shrink-0" />
                  <span className="hidden sm:inline">{accProLabels.exportCsv}</span>
                </button>
              </div>
              {toolCloseBtn}
            </div>

            {/* Unified 3-in-1 Box with Month Filter & Budget Consumption Bar */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-neutral-100/90 dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs shrink-0 space-y-2">
              <div className="flex flex-nowrap items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-500 gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                  <span>{ui.toolAccOverviewTitle}</span>
                  <select
                    value={accFilterMonth}
                    onChange={(e) => setAccFilterMonth(e.target.value)}
                    className="px-1.5 py-0.5 rounded-lg bg-white/85 dark:bg-neutral-700/85 border border-neutral-200 dark:border-neutral-600 text-[11px] font-mono text-neutral-800 dark:text-neutral-100 cursor-pointer"
                  >
                    <option value="ALL">{accProLabels.allMonths}</option>
                    {accAvailableMonths.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-1 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 shrink-0">
                  <span className="whitespace-nowrap">{ui.toolAccMonthlyBudget} ¥</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={monthlyBudget}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (Number.isFinite(val) && val >= 0) setMonthlyBudget(val);
                    }}
                    className="w-16 sm:w-20 px-1.5 py-0.5 rounded-lg bg-white/80 dark:bg-neutral-700/80 border border-neutral-200 dark:border-neutral-600 text-end font-mono text-[11px] text-neutral-800 dark:text-neutral-100"
                    aria-label={ui.toolAccMonthlyBudget}
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{ui.toolAccIncomeLabel}</div>
                  <div className="text-base sm:text-xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 truncate">
                    +¥{totalIncome.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{ui.toolAccExpenseLabel}</div>
                  <div className="text-base sm:text-xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400 truncate">
                    -¥{totalExpense.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{ui.toolAccNetBalanceLabel}</div>
                  <div className={`text-base sm:text-xl font-black font-mono tabular-nums truncate ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-500'}`}>
                    {netBalance >= 0 ? '+' : ''}¥{netBalance.toFixed(2)}
                  </div>
                </div>
              </div>

              {monthlyBudget > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10.5px] font-mono tabular-nums">
                    <span className="text-neutral-500 dark:text-neutral-400 font-semibold">
                      {accProLabels.budgetProgress}: {budgetUsedPct}%
                    </span>
                    <span className={budgetRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-500 font-bold'}>
                      {budgetRemaining >= 0
                        ? `${accProLabels.budgetLeftDaily} ¥${Math.max(0, dailyAllowance).toFixed(0)}`
                        : `${accProLabels.budgetOver} ¥${Math.abs(budgetRemaining).toFixed(0)}`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        budgetUsedPct >= 95
                          ? 'bg-rose-500'
                          : budgetUsedPct >= 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${budgetUsedPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Panel Switcher: Records vs Analytics */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full shrink-0">
              <button
                type="button"
                onClick={() => setAccSubPanel('records')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full text-xs transition-all cursor-pointer ${
                  accSubPanel === 'records'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 font-semibold'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{accProLabels.tabRecords}</span>
              </button>
              <button
                type="button"
                onClick={() => setAccSubPanel('analytics')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full text-xs transition-all cursor-pointer ${
                  accSubPanel === 'analytics'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 font-semibold'
                }`}
              >
                <PieChart className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{accProLabels.tabAnalytics}</span>
              </button>
            </div>

            {/* Quick entry / edit + Filtered Records or Category Analytics */}
            <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-3 py-0.5 pb-16 md:pb-1 pe-0.5 content-start">
              <div className="p-3 rounded-2xl bg-neutral-50/85 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2 h-fit">
                <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 text-xs w-full">
                  <button
                    type="button"
                    onClick={() => setNewAccType('expense')}
                    className={`flex items-center justify-center py-1.5 px-2 rounded-full text-xs transition-all cursor-pointer min-w-0 ${newAccType === 'expense' ? 'bg-white dark:bg-neutral-800 text-rose-600 dark:text-rose-400 font-bold shadow-sm' : 'text-neutral-600 dark:text-neutral-400 font-semibold'}`}
                  >
                    <span className="truncate">{ui.toolAccExpenseLabel}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccType('income')}
                    className={`flex items-center justify-center py-1.5 px-2 rounded-full text-xs transition-all cursor-pointer min-w-0 ${newAccType === 'income' ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm' : 'text-neutral-600 dark:text-neutral-400 font-semibold'}`}
                  >
                    <span className="truncate">{ui.toolAccIncomeLabel}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={ui.toolAccAmountPlaceholder}
                    value={newAccAmount}
                    onChange={(e) => setNewAccAmount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-sm font-bold font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="date"
                    value={newAccDate}
                    onChange={(e) => setNewAccDate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={newAccCategory}
                    onChange={(e) => setNewAccCategory(e.target.value)}
                    aria-label={ui.toolAccCategoryLabel}
                    className="px-2 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-xs"
                  >
                    {accCategoryOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <select
                    value={newAccAccount}
                    onChange={(e) => setNewAccAccount(e.target.value)}
                    aria-label={ui.toolAccAccountLabel}
                    className="px-2 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-xs"
                  >
                    {accAccountOptions.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder={ui.toolAccNotePlaceholder}
                  value={newAccNote}
                  onChange={(e) => setNewAccNote(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-xs"
                />

                <div className="flex items-center gap-1.5">
                  {editingAccId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAccId(null);
                        setNewAccAmount('');
                        setNewAccNote('');
                        setNewAccDate(todayStr);
                      }}
                      className="px-3 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold cursor-pointer shrink-0"
                    >
                      {accProLabels.cancelEdit}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddAccountingRecord}
                    className="flex-1 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold cursor-pointer active:scale-95 transition-all"
                  >
                    {editingAccId ? accProLabels.editSave : ui.toolAccRecordBtn}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-2 min-h-0">
                {accSubPanel === 'records' ? (
                  <>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const clean = accSearch.trim();
                          if (clean.length >= 2) accSearchHistory.recordQuery(clean);
                        }}
                        className="relative flex-1 min-w-0"
                      >
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={accSearch}
                          onChange={(e) => setAccSearch(e.target.value)}
                          onBlur={() => {
                            const clean = accSearch.trim();
                            if (clean.length >= 2) accSearchHistory.recordQuery(clean);
                          }}
                          placeholder={accProLabels.searchPlaceholder}
                          className="w-full ps-8 pe-3 py-1.5 rounded-xl bg-neutral-100/90 dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-white/10 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </form>
                      <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 shrink-0">
                        {[
                          { id: 'all' as const, label: accProLabels.allTypes },
                          { id: 'expense' as const, label: ui.toolAccExpenseLabel },
                          { id: 'income' as const, label: ui.toolAccIncomeLabel },
                        ].map((ft) => (
                          <button
                            key={ft.id}
                            type="button"
                            onClick={() => setAccFilterType(ft.id)}
                            className={`px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer truncate ${
                              accFilterType === ft.id
                                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-2xs'
                                : 'text-neutral-600 dark:text-neutral-400 font-semibold'
                            }`}
                          >
                            {ft.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <SearchHistoryBar
                      history={accSearchHistory.history}
                      language={settings.language}
                      onSelectQuery={(q) => {
                        setAccSearch(q);
                        accSearchHistory.recordQuery(q);
                      }}
                      onRemoveQuery={accSearchHistory.removeQuery}
                      onClearHistory={accSearchHistory.clearHistory}
                      compact
                    />

                    <div className="space-y-1.5 overflow-y-auto max-h-[240px] lg:max-h-[300px] pe-0.5">
                      {filteredAccRecords.length === 0 ? (
                        <div className="p-6 text-center text-xs text-neutral-400 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/40">
                          {accProLabels.emptyRecords}
                        </div>
                      ) : (
                        filteredAccRecords.map((rec) => (
                          <div
                            key={rec.id}
                            className={`p-2.5 rounded-xl bg-white/80 dark:bg-neutral-800/70 border transition-colors flex items-center justify-between gap-2 text-xs ${
                              editingAccId === rec.id
                                ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                                : 'border-neutral-200/60 dark:border-neutral-700/60'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                                {rec.category} · {rec.note}
                              </div>
                              <div className="text-[10.5px] text-neutral-400 truncate">
                                {rec.account} · {rec.date}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`font-mono font-black text-sm tabular-nums ${
                                  rec.type === 'expense' ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {rec.type === 'expense' ? '-' : '+'}¥{rec.amount.toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEditAccountingRecord(rec)}
                                title={accProLabels.editSave}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-blue-600 hover:bg-blue-500/10 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAccountingRecord(rec)}
                                title={t.deleteEvent}
                                aria-label={t.deleteEvent}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[280px] pe-0.5">
                    <div className="p-3 rounded-2xl bg-neutral-50/85 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-200">
                        <span>{accProLabels.categoryBreakdown}</span>
                        <span className="text-[11px] font-mono text-neutral-400">
                          {accFilterType === 'income' ? ui.toolAccIncomeLabel : ui.toolAccExpenseLabel}
                        </span>
                      </div>
                      {accCategoryStats.length === 0 ? (
                        <div className="py-4 text-center text-xs text-neutral-400">{accProLabels.emptyRecords}</div>
                      ) : (
                        <div className="space-y-2">
                          {accCategoryStats.map((cat) => (
                            <div key={cat.name} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{cat.name}</span>
                                <span className="font-mono tabular-nums text-neutral-600 dark:text-neutral-300">
                                  ¥{cat.amount.toFixed(2)} ({cat.pct}%)
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${accFilterType === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                  style={{ width: `${Math.max(4, cat.pct)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-neutral-50/85 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                      <div className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                        {accProLabels.accountBreakdown}
                      </div>
                      {accAccountStats.length === 0 ? (
                        <div className="py-3 text-center text-xs text-neutral-400">{accProLabels.emptyRecords}</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {accAccountStats.map((acc) => (
                            <div key={acc.account} className="p-2.5 rounded-xl bg-white/85 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-white/10 flex items-center justify-between text-xs">
                              <div className="min-w-0">
                                <div className="font-bold text-neutral-900 dark:text-neutral-100 truncate">{acc.account}</div>
                                <div className="text-[10px] font-mono text-neutral-400">
                                  +¥{acc.income.toFixed(0)} / -¥{acc.expense.toFixed(0)}
                                </div>
                              </div>
                              <span className={`font-mono font-black tabular-nums ${acc.net >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {acc.net >= 0 ? '+' : ''}¥{acc.net.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-neutral-400 text-end shrink-0 pt-0.5">
              {ui.toolAccTimelineTitle} · {filteredAccRecords.length} {ui.toolAccRecordsUnit}
            </div>
          </div>
        )}

        {/* ================= TAB 6: 🚄 交通出行 (高铁动车 / 民航航班 / 枢纽接驳 + 多字段模糊搜索 + 时段车型筛选 + 自定义行程) ================= */}
        {activeTab === 'travel' && (
          <div className="h-full flex flex-col justify-between overflow-hidden gap-2">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-200/70 dark:border-white/10 pb-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2 truncate">
                  {travelMode === 'train' ? (
                    <Train className="w-4 h-4 text-blue-500 shrink-0" />
                  ) : travelMode === 'flight' ? (
                    <Plane className="w-4 h-4 text-sky-500 shrink-0" />
                  ) : (
                    <Bus className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  <span className="truncate">{ui.toolTabTravel}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowTravelFavsOnly((v) => !v)}
                  className={`px-2 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-all ${
                    showTravelFavsOnly
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <Star className={`w-3 h-3 shrink-0 ${showTravelFavsOnly ? 'fill-white' : ''}`} />
                  <span className="hidden sm:inline">{travelPro.favoritesOnly}</span>
                  <span>({travelFavIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomTripForm((v) => !v)}
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-all ${
                    showCustomTripForm
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 hover:bg-blue-500/15'
                  }`}
                >
                  <CalendarPlus className="w-3 h-3 shrink-0" />
                  <span className="hidden sm:inline">{travelPro.customTripBtn}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {travelSync.syncedAt && (
                  <span className="hidden lg:inline text-[10px] font-mono tabular-nums text-neutral-400">
                    {travelSync.syncedAt}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleRefreshTravelLive}
                  disabled={isTravelSyncing}
                  title={isChineseLocale(settings.language) ? '实时校准时刻与运行动态' : 'Sync live travel clock'}
                  className="px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-bold text-neutral-600 dark:text-neutral-300 flex items-center gap-1 cursor-pointer hover:border-blue-400 transition-colors shrink-0"
                >
                  <RefreshCw className={`w-3 h-3 ${isTravelSyncing ? 'animate-spin text-blue-500' : ''}`} />
                  <span className="hidden sm:inline">
                    {isChineseLocale(settings.language) ? '实时更新' : 'Live Sync'}
                  </span>
                </button>
                {toolCloseBtn}
              </div>
            </div>

            {/* 3-Segment Mode Switcher */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full shrink-0">
              {[
                { id: 'train' as TravelModeTab, label: travelPro.modeTrain, icon: <Train className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" /> },
                { id: 'flight' as TravelModeTab, label: travelPro.modeFlight, icon: <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500 shrink-0" /> },
                { id: 'transit' as TravelModeTab, label: travelPro.modeTransit, icon: <Bus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" /> },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setTravelMode(m.id);
                    setExpandedTravelId(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-1.5 sm:px-3 rounded-full text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                    travelMode === m.id
                      ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm font-bold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                  }`}
                >
                  {m.icon}
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Expandable Custom Trip Planner */}
            {showCustomTripForm && (
              <div className="p-2.5 rounded-2xl bg-blue-500/8 dark:bg-blue-500/12 border border-blue-500/25 space-y-2 shrink-0 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
                  <input
                    type="text"
                    value={customTripFrom}
                    onChange={(e) => setCustomTripFrom(e.target.value)}
                    placeholder={travelPro.customTripFromPh}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold"
                  />
                  <input
                    type="text"
                    value={customTripTo}
                    onChange={(e) => setCustomTripTo(e.target.value)}
                    placeholder={travelPro.customTripToPh}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold"
                  />
                  <input
                    type="text"
                    value={customTripCode}
                    onChange={(e) => setCustomTripCode(e.target.value)}
                    placeholder={travelPro.customTripNoPh}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={customTripDepart}
                      onChange={(e) => setCustomTripDepart(e.target.value)}
                      className="px-2 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                    />
                    <span className="text-neutral-400">➔</span>
                    <input
                      type="time"
                      value={customTripArrive}
                      onChange={(e) => setCustomTripArrive(e.target.value)}
                      className="px-2 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!customTripFrom.trim() || !customTripTo.trim()}
                    onClick={handleAddCustomTripToCalendar}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-45 text-white font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>{travelPro.customTripAddBtn}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced Multi-Field Search Filter Bar + Date */}
            <div className="space-y-1.5 shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-2 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (travelMode === 'transit') {
                      const clean = transitQuery.trim();
                      if (clean.length >= 2) travelSearchHistory.recordQuery(clean);
                    } else {
                      const o = (travelMode === 'train' ? trainOrigin : flightOrigin).trim();
                      const d = (travelMode === 'train' ? trainDest : flightDest).trim();
                      if (o && d) travelSearchHistory.recordQuery(`${o} → ${d}`);
                      else if (o.length >= 2) travelSearchHistory.recordQuery(o);
                      else if (d.length >= 2) travelSearchHistory.recordQuery(d);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold min-w-0"
                >
                  {travelMode === 'train' ? (
                    <>
                      <datalist id="travel-rail-hubs">
                        {RAIL_HUB_STATIONS.map((st) => (
                          <option
                            key={`rail-dl-${st.code}`}
                            value={
                              settings.language === 'zh-TW'
                                ? st.nameTw
                                : isChineseLocale(settings.language)
                                ? st.nameZh
                                : st.nameEn
                            }
                            label={`${st.code} · ${
                              isChineseLocale(settings.language) ? st.cityZh : st.cityEn
                            }`}
                          />
                        ))}
                      </datalist>
                      <div className="relative flex-1 min-w-0">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          list="travel-rail-hubs"
                          value={trainOrigin}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Quick paste/enter format "北京→上海" auto-splits into origin + destination
                            const arrowParts = val.split(/\s*(?:→|->)\s*/);
                            if (arrowParts.length === 2 && arrowParts[0] && arrowParts[1]) {
                              setTrainOrigin(arrowParts[0].trim());
                              setTrainDest(arrowParts[1].trim());
                            } else {
                              setTrainOrigin(val);
                            }
                          }}
                          onBlur={() => {
                            const o = trainOrigin.trim();
                            const d = trainDest.trim();
                            if (o && d) travelSearchHistory.recordQuery(`${o} → ${d}`);
                            else if (o.length >= 2) travelSearchHistory.recordQuery(o);
                          }}
                          placeholder={travelPro.searchPlaceholderTrain}
                          className="w-full ps-7 pe-2 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border font-bold truncate placeholder:font-normal placeholder:text-neutral-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={swapTrainStations}
                        className="w-8 h-8 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        title={ui.toolTravelSwapTitle}
                        aria-label={ui.toolTravelSwapTitle}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        list="travel-rail-hubs"
                        value={trainDest}
                        onChange={(e) => setTrainDest(e.target.value)}
                        onBlur={() => {
                          const o = trainOrigin.trim();
                          const d = trainDest.trim();
                          if (o && d) travelSearchHistory.recordQuery(`${o} → ${d}`);
                          else if (d.length >= 2) travelSearchHistory.recordQuery(d);
                        }}
                        placeholder={
                          ({
                            'zh-CN': '到达站 / 国际站 (如 上海/西九龙/万象)',
                            'zh-TW': '到達站 / 國際站 (如 上海/西九龍/萬象)',
                            ja: '到着駅 (例: 上海/西九龍/ビエンチャン)',
                            ko: '도착역 (예: 상하이/홍콩/비엔티안)',
                            fr: 'Arrivée (ex. Shanghai / HK / Vientiane)',
                            ru: 'Прибытие (Шанхай / Москва)',
                            fa: 'مقصد (مثلاً شانگهای / هنگ‌کنگ)',
                            mn: 'Хүрэх буудал (Шанхай / УБ)',
                            ug: 'بېرىش بېكىتى',
                            en: 'To / Int’l Hub (e.g. Shanghai / HK / Vientiane)',
                          } as Record<string, string>)[settings.language] || 'To / Int’l Hub'
                        }
                        className="w-[42%] sm:flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border text-center font-bold truncate placeholder:font-normal placeholder:text-neutral-400"
                      />
                      {(trainOrigin || trainDest) && (
                        <button
                          type="button"
                          onClick={() => {
                            setTrainOrigin('');
                            setTrainDest('');
                          }}
                          className="px-2 py-1.5 rounded-xl text-[11px] bg-neutral-200/80 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer shrink-0"
                        >
                          {t.cancel}
                        </button>
                      )}
                    </>
                  ) : travelMode === 'flight' ? (
                    <>
                      <datalist id="travel-airport-hubs">
                        {AIRPORT_HUB_DIRECTORY.map((ap) => (
                          <option
                            key={`air-dl-${ap.code}`}
                            value={ap.code}
                            label={`${
                              settings.language === 'zh-TW'
                                ? ap.nameTw
                                : isChineseLocale(settings.language)
                                ? ap.nameZh
                                : ap.nameEn
                            } · ${isChineseLocale(settings.language) ? ap.cityZh : ap.cityEn}`}
                          />
                        ))}
                      </datalist>
                      <div className="relative flex-1 min-w-0">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          list="travel-airport-hubs"
                          value={flightOrigin}
                          onChange={(e) => {
                            const val = e.target.value;
                            const arrowParts = val.split(/\s*(?:→|->)\s*/);
                            if (arrowParts.length === 2 && arrowParts[0] && arrowParts[1]) {
                              setFlightOrigin(arrowParts[0].trim());
                              setFlightDest(arrowParts[1].trim());
                            } else {
                              setFlightOrigin(val);
                            }
                          }}
                          onBlur={() => {
                            const o = flightOrigin.trim();
                            const d = flightDest.trim();
                            if (o && d) travelSearchHistory.recordQuery(`${o} → ${d}`);
                            else if (o.length >= 2) travelSearchHistory.recordQuery(o);
                          }}
                          placeholder={
                            ({
                              'zh-CN': '出发机场/三字码 (如 CAN/PEK/HKG/TPE)',
                              'zh-TW': '出發機場/代碼 (如 CAN/PEK/HKG/TPE)',
                              en: 'From IATA / City (e.g. CAN / HKG / TPE)',
                            } as Record<string, string>)[settings.language] || 'From Airport / IATA'
                          }
                          className="w-full ps-7 pe-2 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border font-bold truncate placeholder:font-normal placeholder:text-neutral-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={swapFlightAirports}
                        className="w-8 h-8 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        title={ui.toolTravelSwapTitle}
                        aria-label={ui.toolTravelSwapTitle}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        list="travel-airport-hubs"
                        value={flightDest}
                        onChange={(e) => setFlightDest(e.target.value)}
                        onBlur={() => {
                          const o = flightOrigin.trim();
                          const d = flightDest.trim();
                          if (o && d) travelSearchHistory.recordQuery(`${o} → ${d}`);
                          else if (d.length >= 2) travelSearchHistory.recordQuery(d);
                        }}
                        placeholder={
                          ({
                            'zh-CN': '到达机场 (如 PKX/MFM/HND/LHR/JFK)',
                            'zh-TW': '到達機場 (如 PKX/MFM/HND/LHR/JFK)',
                            en: 'To IATA / City (e.g. PKX/MFM/HND/LHR)',
                          } as Record<string, string>)[settings.language] || 'To IATA / City'
                        }
                        className="w-[42%] sm:flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border text-center font-bold truncate placeholder:font-normal placeholder:text-neutral-400"
                      />
                      {(flightOrigin || flightDest) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFlightOrigin('');
                            setFlightDest('');
                          }}
                          className="px-2 py-1.5 rounded-xl text-[11px] bg-neutral-200/80 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer shrink-0"
                        >
                          {t.cancel}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 w-full relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={transitQuery}
                        onChange={(e) => setTransitQuery(e.target.value)}
                        onBlur={() => {
                          const clean = transitQuery.trim();
                          if (clean.length >= 2) travelSearchHistory.recordQuery(clean);
                        }}
                        placeholder={travelPro.transitSearchPlaceholder}
                        className="flex-1 min-w-0 ps-7 pe-3 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border font-bold truncate placeholder:font-normal placeholder:text-neutral-400"
                      />
                      {transitQuery && (
                        <button
                          type="button"
                          onClick={() => setTransitQuery('')}
                          className="px-2.5 py-1.5 rounded-xl text-[11px] bg-neutral-200/80 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer shrink-0"
                        >
                          {t.cancel}
                        </button>
                      )}
                    </div>
                  )}
                  <button type="submit" className="hidden" aria-hidden="true" />
                </form>

                <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
                  <span className="text-[11px] text-neutral-400 font-bold">{ui.toolTravelDepartureDate}:</span>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-700 border text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <SearchHistoryBar
                history={travelSearchHistory.history}
                language={settings.language}
                onSelectQuery={(q) => {
                  travelSearchHistory.recordQuery(q);
                  if (travelMode === 'transit') {
                    setTransitQuery(q);
                    return;
                  }
                  const parts = q
                    .split(/\s*(?:→|->|—|–|-)\s*/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  if (parts.length >= 2) {
                    if (travelMode === 'train') {
                      setTrainOrigin(parts[0]);
                      setTrainDest(parts[1]);
                    } else {
                      setFlightOrigin(parts[0]);
                      setFlightDest(parts[1]);
                    }
                  } else if (travelMode === 'train') {
                    setTrainOrigin(q);
                    setTrainDest('');
                  } else {
                    setFlightOrigin(q);
                    setFlightDest('');
                  }
                }}
                onRemoveQuery={travelSearchHistory.removeQuery}
                onClearHistory={travelSearchHistory.clearHistory}
                compact
              />
            </div>

            {/* Sort Bar + Time Window + Train Type Filter + Popular Corridors */}
            {travelMode !== 'transit' ? (
              <div className="space-y-1.5 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 flex-1">
                    {[
                      { id: 'default' as TravelSortOption, label: travelPro.sortAll },
                      { id: 'earliest' as TravelSortOption, label: travelPro.sortEarliest },
                      { id: 'fastest' as TravelSortOption, label: travelPro.sortFastest },
                      { id: 'cheapest' as TravelSortOption, label: travelPro.sortCheapest },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setTravelSort(s.id)}
                        className={`py-1 px-1.5 rounded-full text-[11px] transition-all cursor-pointer truncate min-w-0 ${
                          travelSort === s.id
                            ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs font-bold'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Departure Time Window Filter */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {([
                      { id: 'all', label: travelPro.timeAll },
                      { id: 'morning', label: travelPro.timeMorning },
                      { id: 'afternoon', label: travelPro.timeAfternoon },
                      { id: 'evening', label: travelPro.timeEvening },
                    ] as const).map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setTravelTimeWindow(w.id)}
                        className={`px-2 py-1 rounded-xl border text-[10.5px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                          travelTimeWindow === w.id
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                            : 'bg-white/80 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300 border-neutral-200/70 dark:border-white/10'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Train Type Filter (in Train mode) + Popular Corridors + Match Count */}
                <div className="flex flex-wrap items-center gap-1">
                  {travelMode === 'train' &&
                    (['all', 'G', 'D', 'C'] as const).map((tCode) => (
                      <button
                        key={tCode}
                        type="button"
                        onClick={() => setTrainTypeFilter(tCode)}
                        className={`px-2 py-0.5 rounded-lg border text-[10.5px] font-bold cursor-pointer transition-colors ${
                          trainTypeFilter === tCode
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200/70 dark:border-white/10'
                        }`}
                      >
                        {tCode === 'all' ? travelPro.typeAll : `${tCode}`}
                      </button>
                    ))}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-1 min-w-[200px]">
                    {popularCorridors.map((chip) => {
                      const isActive =
                        travelMode === 'train'
                          ? trainOrigin === chip.origin && trainDest === chip.dest
                          : flightOrigin === chip.origin && flightDest === chip.dest;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => {
                            travelSearchHistory.recordQuery(`${chip.origin} → ${chip.dest}`);
                            if (travelMode === 'train') {
                              setTrainOrigin(chip.origin);
                              setTrainDest(chip.dest);
                            } else {
                              setFlightOrigin(chip.origin);
                              setFlightDest(chip.dest);
                            }
                          }}
                          className={`px-2 py-1 rounded-xl border text-[10.5px] font-bold truncate min-w-0 cursor-pointer transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-neutral-50/90 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300 border-neutral-200/70 dark:border-neutral-700/70 hover:border-blue-400'
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <span className="truncate">{travelPro.transitHintTitle}</span>
                  <span className="font-mono text-[10px] shrink-0">
                    {travelPro.matchedCount.replace('{count}', String(filteredTransitList.length))}
                  </span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {([
                    {
                      id: 'all',
                      labelZh: `全部枢纽 (${transitList.length})`,
                      labelTw: `全部樞紐 (${transitList.length})`,
                      labelEn: `All Hubs (${transitList.length})`,
                    },
                    {
                      id: 'municipality_capital',
                      labelZh: '省会与直辖市机场',
                      labelTw: '省會與直轄市機場',
                      labelEn: 'Mainland Capitals',
                    },
                    {
                      id: 'hk_mo_tw',
                      labelZh: '港澳台机场全覆盖',
                      labelTw: '港澳台機場全覆蓋',
                      labelEn: 'HK / Macau / Taiwan',
                    },
                    {
                      id: 'intl_hub',
                      labelZh: '国际机场枢纽',
                      labelTw: '國際機場樞紐',
                      labelEn: 'International Hubs',
                    },
                  ] as const).map((rf) => (
                    <button
                      key={rf.id}
                      type="button"
                      onClick={() => setTransitRegionFilter(rf.id)}
                      className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                        transitRegionFilter === rf.id
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white/80 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300 border-neutral-200/70 dark:border-white/10'
                      }`}
                    >
                      {settings.language === 'zh-TW'
                        ? rf.labelTw
                        : isChineseLocale(settings.language)
                        ? rf.labelZh
                        : rf.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Travel Items List */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 py-0.5 pb-16 md:pb-1 pe-0.5">
              {travelMode === 'train' ? (
                filteredTrainList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400 space-y-2">
                    <div>{t.noEventsFound}</div>
                    <button
                      type="button"
                      onClick={() => {
                        setTrainOrigin('');
                        setTrainDest('');
                        setShowTravelFavsOnly(false);
                        setTravelTimeWindow('all');
                        setTrainTypeFilter('all');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold cursor-pointer"
                    >
                      {travelPro.resetFilterBtn}
                    </button>
                  </div>
                ) : (
                  filteredTrainList.map((train) => {
                    const isFav = travelFavIds.includes(train.trainNo);
                    const isExpanded = expandedTravelId === train.trainNo;
                    const arriveStationBy = subtractMinutesFromHHMM(train.depart, 25);
                    const liveBadge = getLiveDepartureStatusBadge(
                      train.depart,
                      travelDate,
                      todayStr,
                      travelSync.clockOffsetMs,
                      settings.language
                    );
                    const qCombined = `${trainOrigin} ${trainDest}`.trim();
                    const qToks = splitSmartQuery(qCombined);
                    const matchedViaStop =
                      qToks.length > 0
                        ? train.stops.find(
                            (st, sIdx) =>
                              sIdx > 0 &&
                              sIdx < train.stops.length - 1 &&
                              qToks.some((tok) => normalizeSearchText(st.station).includes(tok))
                          )
                        : undefined;
                    return (
                      <div
                        key={train.trainNo}
                        className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2 shadow-2xs hover:border-blue-300 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex flex-col items-center gap-0.5 shrink-0">
                              <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-black text-sm">
                                {train.trainNo}
                              </span>
                              <span className="text-[9px] font-bold text-neutral-400 max-w-[92px] truncate text-center">{train.trainTag}</span>
                            </div>
                            <div className="text-xs min-w-0">
                              <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center flex-wrap gap-x-2 gap-y-0.5">
                                <span>
                                  <span className="font-mono text-base font-black">{train.depart}</span> {train.from}
                                </span>
                                <span className="text-neutral-400 font-normal">➔</span>
                                <span>
                                  <span className="font-mono text-base font-black">{train.arrive}</span> {train.to}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold ${
                                    liveBadge.tone === 'emerald'
                                      ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
                                      : liveBadge.tone === 'amber'
                                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                                      : liveBadge.tone === 'sky'
                                      ? 'bg-sky-500/12 text-sky-600 dark:text-sky-400'
                                      : 'bg-neutral-200/80 dark:bg-neutral-700 text-neutral-500'
                                  }`}
                                >
                                  {liveBadge.label}
                                </span>
                              </div>
                              <div className="text-[10px] text-neutral-400 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                                <span>{train.duration}</span>
                                <span>· {travelPro.punctualityLabel} {train.punctuality}</span>
                                <span className="text-blue-600 dark:text-blue-400 font-bold">
                                  · {travelPro.recommendArriveAt} {arriveStationBy}
                                </span>
                                {matchedViaStop && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/12 text-amber-700 dark:text-amber-300 font-sans font-bold">
                                    {travelPro.viaStopPrefix}: {matchedViaStop.station} ({matchedViaStop.arrive})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {train.seats.map((seat) => (
                              <div key={seat.name} className="text-center text-[10px] bg-white dark:bg-neutral-700 px-2 py-1 rounded-lg border border-neutral-200/50">
                                <div className="text-neutral-400">{seat.name} ({seat.left})</div>
                                <div className="font-mono font-black text-neutral-800 dark:text-neutral-200">{seat.price}</div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => toggleTravelFavorite(train.trainNo)}
                              title={isFav ? travelPro.unfavoriteRouteLabel : travelPro.favoriteRouteLabel}
                              aria-label={isFav ? travelPro.unfavoriteRouteLabel : travelPro.favoriteRouteLabel}
                              className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200/60 dark:border-neutral-600 flex items-center justify-center cursor-pointer hover:border-amber-400 shrink-0"
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedTravelId(isExpanded ? null : train.trainNo)}
                              className="px-2 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200/60 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <span>{isExpanded ? travelPro.detailsCollapse : travelPro.detailsExpand}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddTrainToCalendar(train)}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-xs ms-auto sm:ms-0"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span>{ui.toolTravelAddScheduleBtn}</span>
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 space-y-2 text-[11px]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-neutral-500">{travelPro.facilitiesTitle}:</span>
                              {train.amenities.map((am) => (
                                <span
                                  key={am}
                                  className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]"
                                >
                                  {am}
                                </span>
                              ))}
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-neutral-500">{travelPro.stopsTitle}</div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                                {train.stops.map((st, idx) => (
                                  <div
                                    key={`${train.trainNo}-${st.station}`}
                                    className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between gap-2"
                                  >
                                    <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                                      {idx + 1}. {st.station}
                                    </span>
                                    <span className="font-mono text-[10px] text-neutral-500 shrink-0">
                                      {st.arrive} / {st.depart} ({st.stay})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : travelMode === 'flight' ? (
                filteredFlightList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400 space-y-2">
                    <div>{t.noEventsFound}</div>
                    <button
                      type="button"
                      onClick={() => {
                        setFlightOrigin('');
                        setFlightDest('');
                        setShowTravelFavsOnly(false);
                        setTravelTimeWindow('all');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold cursor-pointer"
                    >
                      {travelPro.resetFilterBtn}
                    </button>
                  </div>
                ) : (
                  filteredFlightList.map((flight) => {
                    const isFav = travelFavIds.includes(flight.flightNo);
                    const isExpanded = expandedTravelId === flight.flightNo;
                    const checkinBy = subtractMinutesFromHHMM(flight.depart, flight.checkinGateOffsetMin);
                    const liveBadge = getLiveDepartureStatusBadge(
                      flight.depart,
                      travelDate,
                      todayStr,
                      travelSync.clockOffsetMs,
                      settings.language
                    );
                    return (
                      <div
                        key={flight.flightNo}
                        className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2 shadow-2xs hover:border-sky-300 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono font-black text-sm shrink-0">
                              {flight.flightNo}
                            </span>
                            <div className="text-xs min-w-0">
                              <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center flex-wrap gap-x-2 gap-y-0.5">
                                <span>
                                  <span className="font-mono text-base font-black">{flight.depart}</span> {flight.from}
                                </span>
                                <span className="text-neutral-400 font-normal">➔</span>
                                <span>
                                  <span className="font-mono text-base font-black">{flight.arrive}</span> {flight.to}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold ${
                                    liveBadge.tone === 'emerald'
                                      ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
                                      : liveBadge.tone === 'amber'
                                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                                      : liveBadge.tone === 'sky'
                                      ? 'bg-sky-500/12 text-sky-600 dark:text-sky-400'
                                      : 'bg-neutral-200/80 dark:bg-neutral-700 text-neutral-500'
                                  }`}
                                >
                                  {liveBadge.label}
                                </span>
                              </div>
                              <div className="text-[10px] text-neutral-400 mt-0.5 flex flex-wrap items-center gap-2">
                                <span>{flight.airline} · {flight.aircraft} · {flight.duration}</span>
                                <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">
                                  · {travelPro.recommendCheckinAt} {checkinBy}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {flight.seats.map((seat) => (
                              <div key={seat.name} className="text-center text-[10px] bg-white dark:bg-neutral-700 px-2 py-1 rounded-lg border border-neutral-200/50">
                                <div className="text-neutral-400">{seat.name} · {seat.left}</div>
                                <div className="font-mono font-black text-sky-600 dark:text-sky-400">{seat.price}</div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => toggleTravelFavorite(flight.flightNo)}
                              title={isFav ? travelPro.unfavoriteRouteLabel : travelPro.favoriteRouteLabel}
                              aria-label={isFav ? travelPro.unfavoriteRouteLabel : travelPro.favoriteRouteLabel}
                              className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200/60 dark:border-neutral-600 flex items-center justify-center cursor-pointer hover:border-amber-400 shrink-0"
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedTravelId(isExpanded ? null : flight.flightNo)}
                              className="px-2 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200/60 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <span>{isExpanded ? travelPro.detailsCollapse : travelPro.detailsExpand}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddFlightToCalendar(flight)}
                              className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-xs ms-auto sm:ms-0"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span>{ui.toolTravelAddScheduleBtn}</span>
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                            <div className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60">
                              <div className="text-[10px] text-neutral-400 font-bold">{travelPro.baggageLabel}</div>
                              <div className="font-bold text-neutral-800 dark:text-neutral-200">{flight.baggage}</div>
                            </div>
                            <div className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60">
                              <div className="text-[10px] text-neutral-400 font-bold">{travelPro.mealLabel}</div>
                              <div className="font-bold text-neutral-800 dark:text-neutral-200">{flight.meal}</div>
                            </div>
                            <div className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60">
                              <div className="text-[10px] text-neutral-400 font-bold">{travelPro.punctualityLabel}</div>
                              <div className="font-bold text-sky-600 dark:text-sky-400">{flight.punctuality} · {flight.cabinNote}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : filteredTransitList.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400 space-y-2">
                  <div>{t.noEventsFound}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setTransitQuery('');
                      setShowTravelFavsOnly(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer"
                  >
                    {travelPro.resetFilterBtn}
                  </button>
                </div>
              ) : (
                filteredTransitList.map((tr) => {
                  const isFav = travelFavIds.includes(tr.id);
                  return (
                    <div
                      key={tr.id}
                      className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs hover:border-emerald-300 transition-all"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            {tr.city}
                          </span>
                          {tr.airportCode && (
                            <span className="font-mono text-[9.5px] font-bold text-neutral-400">
                              {tr.airportCode}
                            </span>
                          )}
                        </div>
                        <div className="text-xs min-w-0 space-y-0.5">
                          <div className="font-black text-neutral-900 dark:text-neutral-100">{tr.hubPair}</div>
                          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{tr.modeLabel}</div>
                          <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                            {tr.duration} · {tr.fare} · {travelPro.frequencyLabel}: {tr.frequency} · {travelPro.operatingLabel}: {tr.operatingHours}
                          </div>
                          <div className="text-[10px] text-neutral-400">{tr.notes}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ms-auto sm:ms-0">
                        <button
                          type="button"
                          onClick={() => toggleTravelFavorite(tr.id)}
                          title={isFav ? travelPro.unfavoriteRouteLabel : travelPro.favoriteRouteLabel}
                          aria-label={isFav ? travelPro.unfavoriteRouteLabel : travelPro.favoriteRouteLabel}
                          className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200/60 dark:border-neutral-600 flex items-center justify-center cursor-pointer hover:border-amber-400 shrink-0"
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddTransitToCalendar(tr)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>{travelPro.addTransitBtn}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="text-[10px] text-neutral-400 flex items-center justify-between shrink-0 pt-1">
              <span>
                {travelMode === 'train'
                  ? travelPro.modeTrain
                  : travelMode === 'flight'
                  ? travelPro.modeFlight
                  : travelPro.modeTransit}
              </span>
              <span className="font-mono tabular-nums">
                {travelPro.matchedCount.replace(
                  '{count}',
                  String(
                    travelMode === 'train'
                      ? filteredTrainList.length
                      : travelMode === 'flight'
                      ? filteredFlightList.length
                      : filteredTransitList.length
                  )
                )}
              </span>
            </div>
          </div>
        )}

        {/* ================= TAB 7: ⚡ 网络测速 (Speedtest 经典指针仪表盘 + 0~10G 实时测速) ================= */}
        {activeTab === 'speedtest' && (
          <div className="h-full flex flex-col justify-between overflow-hidden gap-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2 shrink-0">
              <div className="min-w-0">
                <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <Gauge className="w-4 h-4" />
                  </span>
                  <span>{ui.toolTabSpeedtest}</span>
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                  {netInfo.asn || '--'} · {netInfo.city || netInfo.country || '--'}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className={`text-xs font-bold shrink-0 tabular-nums ${
                    isSpeedTesting
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : speedMetrics.download > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-neutral-400'
                  }`}
                >
                  {isSpeedTesting ? ui.toolSpeedTesting : speedMetrics.statusGrade}
                </span>
                {toolCloseBtn}
              </div>
            </div>

            {/* Ookla Speedtest Style Dial Gauge (0 ~ 10G + Center Needle + Morphing Start/Live Readout) */}
            {(() => {
              const cx = 180;
              const cy = 148;
              const rArc = 122;
              const startDeg = 138;
              const sweepDeg = 264;
              const circumference = 2 * Math.PI * rArc;
              const arcLength = circumference * (sweepDeg / 360);
              const activeMbps = Math.min(10000, isSpeedTesting ? liveGaugeMbps : speedMetrics.download);
              const speedStops = [0, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000] as const;
              const speedLabels = ['0', '5', '10', '20', '50', '100', '200', '500', '1G', '2G', '5G', '10G'] as const;

              const mbpsToGaugeRatio = (mbps: number): number => {
                const clamped = Math.max(0, Math.min(10000, mbps));
                if (clamped <= 0) return 0;
                for (let i = 0; i < speedStops.length - 1; i++) {
                  const lo = speedStops[i];
                  const hi = speedStops[i + 1];
                  if (clamped <= hi) {
                    const segFrac = hi > lo ? (clamped - lo) / (hi - lo) : 0;
                    return (i + segFrac) / (speedStops.length - 1);
                  }
                }
                return 1;
              };

              const formatSpeedDisplay = (mbps: number, showZeroWhenActive = false) => {
                if (!mbps || mbps <= 0) {
                  return { val: showZeroWhenActive ? '0.0' : '--', unit: 'Mbps' };
                }
                if (mbps >= 1000) return { val: (mbps / 1000).toFixed(2), unit: 'Gbps' };
                return { val: mbps.toFixed(1), unit: 'Mbps' };
              };

              const gaugeRatio = isSpeedTesting
                ? speedPhase === 'ping'
                  ? Math.max(0.015, speedProgress / 600)
                  : Math.max(0.015, mbpsToGaugeRatio(activeMbps))
                : activeMbps > 0
                ? Math.max(0.015, mbpsToGaugeRatio(activeMbps))
                : 0;

              const dashOffset = arcLength * (1 - gaugeRatio);
              const totalTicks = (speedStops.length - 1) * 4;
              const needleDeg = startDeg + gaugeRatio * sweepDeg;
              const startRad = (startDeg * Math.PI) / 180;
              const activeRad = (needleDeg * Math.PI) / 180;
              const sweepR = 114;
              const sx = cx + sweepR * Math.cos(startRad);
              const sy = cy + sweepR * Math.sin(startRad);
              const ex = cx + sweepR * Math.cos(activeRad);
              const ey = cy + sweepR * Math.sin(activeRad);
              const largeArcFlag = gaugeRatio * sweepDeg > 180 ? 1 : 0;
              const sweepWedgePath =
                gaugeRatio > 0.005
                  ? `M ${cx} ${cy} L ${sx.toFixed(1)} ${sy.toFixed(1)} A ${sweepR} ${sweepR} 0 ${largeArcFlag} 1 ${ex.toFixed(1)} ${ey.toFixed(1)} Z`
                  : '';

              const isUploadPhase = speedPhase === 'upload';
              const phaseStroke = isUploadPhase
                ? '#a855f7'
                : speedPhase === 'ping'
                ? '#f59e0b'
                : '#06b6d4';

              const showLiveInButtonSlot = isSpeedTesting || speedMetrics.download > 0;
              const centerDisplay = formatSpeedDisplay(activeMbps, isSpeedTesting);
              const dlDisplay = formatSpeedDisplay(speedMetrics.download);
              const ulDisplay = formatSpeedDisplay(speedMetrics.upload);

              return (
                <>
                  <div className="relative flex flex-col items-center justify-center py-3 sm:py-4 px-3 my-auto rounded-3xl bg-gradient-to-b from-neutral-50/90 via-white to-neutral-100/75 dark:from-neutral-800/50 dark:via-neutral-900/85 dark:to-neutral-950/95 border border-neutral-200/75 dark:border-neutral-800 shadow-2xs">
                    <div className="relative w-full max-w-[360px] aspect-[360/274]">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 360 274">
                        <defs>
                          <linearGradient id="speedtestDownGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#00e5ff" />
                            <stop offset="45%" stopColor="#0ea5e9" />
                            <stop offset="80%" stopColor="#2563eb" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                          <linearGradient id="speedtestUpGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="55%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                          <radialGradient id="speedtestSweepGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor={phaseStroke} stopOpacity="0.02" />
                            <stop offset="65%" stopColor={phaseStroke} stopOpacity="0.11" />
                            <stop offset="100%" stopColor={phaseStroke} stopOpacity="0.22" />
                          </radialGradient>
                          <linearGradient id="speedtestNeedleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={phaseStroke} stopOpacity="0.35" />
                            <stop offset="45%" stopColor={phaseStroke} stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                          </linearGradient>
                        </defs>

                        {/* Outer Subtle Bezel Ring */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={134}
                          transform={`rotate(${startDeg} ${cx} ${cy})`}
                          fill="transparent"
                          className="stroke-neutral-200/75 dark:stroke-neutral-800/90"
                          strokeWidth="1"
                          strokeDasharray={`${2 * Math.PI * 134 * (sweepDeg / 360)} ${2 * Math.PI * 134}`}
                          strokeLinecap="round"
                        />

                        {/* Luminous Swept Sector Behind Pointer (Speedtest Signature Glow) */}
                        {sweepWedgePath && (
                          <path d={sweepWedgePath} fill="url(#speedtestSweepGlow)" />
                        )}

                        {/* Inner Concentric Guide Circle */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={62}
                          fill="transparent"
                          className="stroke-neutral-200/60 dark:stroke-neutral-800/80"
                          strokeWidth="1"
                          strokeDasharray="2 5"
                        />

                        {/* Base Horseshoe Groove Track */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={rArc}
                          transform={`rotate(${startDeg} ${cx} ${cy})`}
                          fill="transparent"
                          className="stroke-neutral-200/90 dark:stroke-neutral-800"
                          strokeWidth="14"
                          strokeDasharray={`${arcLength} ${circumference}`}
                          strokeLinecap="round"
                        />

                        {/* Active Speedtest Progress Arc */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={rArc}
                          transform={`rotate(${startDeg} ${cx} ${cy})`}
                          fill="transparent"
                          stroke={isUploadPhase ? 'url(#speedtestUpGrad)' : 'url(#speedtestDownGrad)'}
                          strokeWidth="14"
                          strokeDasharray={`${arcLength} ${circumference}`}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          className="transition-all duration-150 drop-shadow-[0_0_12px_rgba(14,165,233,0.38)]"
                        />

                        {/* Precision Radial Ticks Inside Arc Rim */}
                        {Array.from({ length: totalTicks + 1 }).map((_, idx) => {
                          const deg = startDeg + (idx / totalTicks) * sweepDeg;
                          const rad = (deg * Math.PI) / 180;
                          const isMajor = idx % 4 === 0;
                          const rInner = isMajor ? 103 : 106;
                          const rOuter = 111;
                          const x1 = cx + rInner * Math.cos(rad);
                          const y1 = cy + rInner * Math.sin(rad);
                          const x2 = cx + rOuter * Math.cos(rad);
                          const y2 = cy + rOuter * Math.sin(rad);
                          const activeTick = gaugeRatio > 0 && idx / totalTicks <= gaugeRatio + 0.001;
                          return (
                            <line
                              key={idx}
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              strokeWidth={isMajor ? 2.2 : 1.1}
                              strokeLinecap="round"
                              className={
                                activeTick
                                  ? isUploadPhase
                                    ? 'stroke-purple-500 dark:stroke-purple-400 transition-colors duration-150'
                                    : 'stroke-cyan-500 dark:stroke-cyan-400 transition-colors duration-150'
                                  : isMajor
                                  ? 'stroke-neutral-400/75 dark:stroke-neutral-600'
                                  : 'stroke-neutral-300/70 dark:stroke-neutral-700/80'
                              }
                            />
                          );
                        })}

                        {/* Speed Scale Numbers Inside Dial Rim: 0 ~ 10G */}
                        {speedLabels.map((label, i) => {
                          const deg = startDeg + (i / (speedLabels.length - 1)) * sweepDeg;
                          const rad = (deg * Math.PI) / 180;
                          const rLabel = 88;
                          const lx = cx + rLabel * Math.cos(rad);
                          const ly = cy + rLabel * Math.sin(rad);
                          const isReached =
                            gaugeRatio > 0 && i / (speedLabels.length - 1) <= gaugeRatio + 0.001;
                          return (
                            <text
                              key={label}
                              x={lx}
                              y={ly}
                              fontSize="10.5"
                              textAnchor="middle"
                              dominantBaseline="central"
                              className={`font-mono tabular-nums transition-colors duration-150 ${
                                isReached
                                  ? isUploadPhase
                                    ? 'fill-purple-600 dark:fill-purple-300 font-bold'
                                    : 'fill-sky-600 dark:fill-cyan-300 font-bold'
                                  : 'fill-neutral-500 dark:fill-neutral-400 font-semibold'
                              }`}
                            >
                              {label}
                            </text>
                          );
                        })}

                        {/* Center Rotating Speedometer Pointer Needle (网速指针) */}
                        <g
                          transform={`rotate(${needleDeg} ${cx} ${cy})`}
                          className="transition-transform duration-150 ease-out"
                        >
                          {/* Subtle Soft Needle Glow */}
                          <polygon
                            points={`${cx - 12},${cy} ${cx + 2},${cy - 5} ${cx + 75},${cy} ${cx + 2},${cy + 5}`}
                            fill={phaseStroke}
                            fillOpacity="0.24"
                          />
                          {/* Sharp Tapered Needle Blade */}
                          <polygon
                            points={`${cx - 10},${cy} ${cx},${cy - 3.6} ${cx + 73},${cy} ${cx},${cy + 3.6}`}
                            fill="url(#speedtestNeedleGrad)"
                            stroke={phaseStroke}
                            strokeWidth="0.9"
                            strokeLinejoin="round"
                          />
                        </g>

                        {/* Center Pivot Cap */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r="13"
                          fill={phaseStroke}
                          fillOpacity="0.18"
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r="8.5"
                          className="fill-white dark:fill-neutral-900"
                          stroke={phaseStroke}
                          strokeWidth="2.5"
                        />
                        <circle cx={cx} cy={cy} r="3.5" fill={phaseStroke} />
                      </svg>

                      {/* Bottom-Center Morphing Action Slot: Compact "开始" Button -> Immediate Live Rate Readout */}
                      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-2 min-h-[70px]">
                        {!showLiveInButtonSlot ? (
                          <button
                            type="button"
                            onClick={runSpeedTest}
                            className="group relative w-[54px] h-[54px] sm:w-[58px] sm:h-[58px] rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white shadow-[0_0_18px_rgba(14,165,233,0.38)] hover:shadow-[0_0_26px_rgba(6,182,212,0.58)] ring-[2.5px] ring-sky-500/20 dark:ring-cyan-400/25 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center"
                          >
                            <span className="pointer-events-none absolute -inset-1 rounded-full border border-cyan-400/35 group-hover:border-cyan-400/65 transition-colors" />
                            <span className="text-[13px] sm:text-sm font-black tracking-widest leading-none">
                              {ui.toolSpeedStart}
                            </span>
                          </button>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center animate-fade-in">
                            <span
                              className={`text-[11px] font-bold tracking-wide mb-0.5 ${
                                speedPhase === 'ping'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : speedPhase === 'download'
                                  ? 'text-sky-600 dark:text-cyan-400'
                                  : speedPhase === 'upload'
                                  ? 'text-purple-600 dark:text-purple-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {speedPhase === 'ping'
                                ? ui.toolSpeedPing
                                : speedPhase === 'download'
                                ? ui.toolSpeedDownload
                                : speedPhase === 'upload'
                                ? ui.toolSpeedUpload
                                : ui.toolTabSpeedtest}
                            </span>

                            <div className="flex items-baseline justify-center gap-1.5">
                              <span className="text-3xl sm:text-[34px] font-black font-mono tracking-tight text-neutral-950 dark:text-white tabular-nums leading-none">
                                {centerDisplay.val}
                              </span>
                              <span className="text-xs font-mono font-bold text-sky-600 dark:text-cyan-400">
                                {centerDisplay.unit}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
                                {activeMbps > 0 ? `${(activeMbps / 8).toFixed(1)} MB/s` : '0.0 MB/s'}
                              </span>
                              {!isSpeedTesting && (
                                <button
                                  type="button"
                                  onClick={runSpeedTest}
                                  className="px-2.5 py-0.5 rounded-full bg-sky-500/12 hover:bg-sky-500/20 text-sky-600 dark:text-cyan-400 text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                                >
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  <span>{ui.toolSpeedTestAgain}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom 4 Key Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/8 dark:bg-emerald-500/10 border border-emerald-500/20 text-center flex flex-col justify-between">
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        <span>{ui.toolSpeedDownload}</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 my-0.5">
                        {dlDisplay.val} <span className="text-xs font-sans font-semibold">{dlDisplay.unit}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono tabular-nums">
                        {(speedMetrics.download / 8).toFixed(1)} MB/s
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-violet-500/8 dark:bg-violet-500/10 border border-violet-500/20 text-center flex flex-col justify-between">
                      <div className="text-[11px] font-bold text-violet-600 dark:text-violet-400 flex items-center justify-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{ui.toolSpeedUpload}</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-violet-600 dark:text-violet-400 my-0.5">
                        {ulDisplay.val} <span className="text-xs font-sans font-semibold">{ulDisplay.unit}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono tabular-nums">
                        {(speedMetrics.upload / 8).toFixed(1)} MB/s
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-sky-500/8 dark:bg-sky-500/10 border border-sky-500/20 text-center flex flex-col justify-between">
                      <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center justify-center gap-1">
                        <Activity className="w-3.5 h-3.5" />
                        <span>{ui.toolSpeedPing}</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-sky-600 dark:text-sky-400 my-0.5">
                        {speedMetrics.ping > 0 ? speedMetrics.ping : netInfo.latencyMs || '--'}{' '}
                        <span className="text-xs font-sans font-semibold">ms</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono tabular-nums">
                        {ui.toolSpeedJitter} {speedMetrics.jitter} ms
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-neutral-100/85 dark:bg-neutral-800/85 border border-neutral-200/70 dark:border-neutral-700/70 text-center flex flex-col justify-between">
                      <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{ui.toolSpeedGeo}</span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-neutral-900 dark:text-neutral-100 my-0.5 truncate">
                        {netInfo.city || netInfo.country || '--'}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                        {netInfo.region || netInfo.countryCode || '--'}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Diagnostic Information Grid (No IPv6, Real Client IP & ISP & DNS Exit) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-2xl bg-neutral-50/85 dark:bg-neutral-800/60 border border-neutral-200/65 dark:border-neutral-700/65 text-[11px] shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-neutral-400 shrink-0">{ui.toolSpeedIpv4}:</span>
                <span className="font-mono tabular-nums font-bold text-neutral-800 dark:text-neutral-200 truncate">
                  {netInfo.ip}
                </span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-neutral-400 shrink-0">{ui.toolSpeedIsp}:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{netInfo.asn}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-neutral-400 shrink-0">{ui.toolSpeedDnsExit}:</span>
                <span className="text-neutral-800 dark:text-neutral-200 truncate">{netInfo.dnsExit}</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 8: ⏱️ 倒数日 ================= */}
        {activeTab === 'countdowns' && (
          <div className="h-full overflow-hidden flex flex-col justify-between">
            <CountdownView
              countdowns={countdowns}
              onUpdateCountdowns={onUpdateCountdowns}
              onAddToCalendar={onUpdateEvent}
              settings={settings}
              onClose={closeToolDetail}
            />
          </div>
        )}

        {/* ================= TAB 9: 🔢 日期计算 (顶端分拆三标签：日期间隔 · 日期推算 · 年龄换算) ================= */}
        {activeTab === 'calc' && (
          <div className="h-full flex flex-col justify-between overflow-hidden gap-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-200/70 dark:border-white/10 pb-2.5 shrink-0">
              <div className="min-w-0">
                <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2 truncate">
                  <span className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                    <Calculator className="w-4 h-4" />
                  </span>
                  <span className="truncate">{ui.toolTabDateCalc}</span>
                </h2>
              </div>
              {toolCloseBtn}
            </div>

            {/* 3-Segment Category Switcher (Matched to 行情市场 top bar) */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full shrink-0">
              <button
                type="button"
                onClick={() => setDateCalcSubTab('diff')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-full text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                  dateCalcSubTab === 'diff'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 shrink-0" />
                <span className="truncate">{ui.toolCalcTabDiff}</span>
              </button>
              <button
                type="button"
                onClick={() => setDateCalcSubTab('offset')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-full text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                  dateCalcSubTab === 'offset'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                }`}
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                <span className="truncate">{ui.toolCalcTabOffset}</span>
              </button>
              <button
                type="button"
                onClick={() => setDateCalcSubTab('age')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-full text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                  dateCalcSubTab === 'age'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                }`}
              >
                <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
                <span className="truncate">{ui.toolCalcTabAge}</span>
              </button>
            </div>

            {/* Active Date Calc Sub-Module Content */}
            <div className="flex-1 min-h-0 overflow-y-auto py-0.5 pb-16 md:pb-1">
              {dateCalcSubTab === 'diff' && (
                <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-2xl bg-neutral-50/85 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-700/60">
                    <span className="text-sm font-black text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{ui.toolCalcDiffTitle}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-500">{t.startDate}</label>
                      <input
                        type="date"
                        value={intervalStart}
                        onChange={(e) => setIntervalStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold font-mono focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-500">{t.endDate}</label>
                      <input
                        type="date"
                        value={intervalEnd}
                        onChange={(e) => setIntervalEnd(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold font-mono focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeEndDay}
                      onChange={(e) => setIncludeEndDay(e.target.checked)}
                      className="rounded accent-purple-600"
                    />
                    <span>+1 {ui.daysUnit}</span>
                  </label>

                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-neutral-500 font-bold">{ui.toolCalcDaysTotal}</span>
                      <div className="text-3xl font-black font-mono tabular-nums text-purple-700 dark:text-purple-300">
                        {intervalResult?.diffDays ?? 0} <span className="text-sm font-bold">{ui.daysUnit}</span>
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500 font-mono tabular-nums">
                      {ui.toolCalcWeeksDays
                        .replace('{weeks}', String(intervalResult?.weeks ?? 0))
                        .replace('{days}', String(intervalResult?.remDays ?? 0))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-500/20 text-center">
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-neutral-800/80">
                        <div className="text-[11px] text-neutral-400">{t.categoryWork}</div>
                        <div className="text-base font-black font-mono tabular-nums text-emerald-600">
                          {intervalResult?.workdays ?? 0} {ui.daysUnit}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-neutral-800/80">
                        <div className="text-[11px] text-neutral-400">{t.holidayOffBadge}</div>
                        <div className="text-base font-black font-mono tabular-nums text-blue-600">
                          {intervalResult?.weekendDays ?? 0} {ui.daysUnit}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {dateCalcSubTab === 'offset' && (
                <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-2xl bg-neutral-50/85 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-700/60">
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{ui.toolCalcOffsetTitle}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-500">{t.startDate}</label>
                      <input
                        type="date"
                        value={offsetBaseDate}
                        onChange={(e) => setOffsetBaseDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-500">{ui.daysUnit}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={offsetDaysInput}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setOffsetDaysInput(digits);
                          const parsed = parseInt(digits, 10);
                          if (Number.isFinite(parsed) && parsed >= 1) {
                            setOffsetDays(Math.min(3650, parsed));
                          }
                        }}
                        onBlur={() => {
                          const parsed = parseInt(offsetDaysInput, 10);
                          const safe = Number.isFinite(parsed) ? Math.max(1, Math.min(3650, parsed)) : 1;
                          setOffsetDays(safe);
                          setOffsetDaysInput(String(safe));
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold font-mono tabular-nums focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="grid grid-cols-5 gap-1.5 w-full sm:flex-1">
                      {[7, 15, 30, 60, 100].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setOffsetDays(d);
                            setOffsetDaysInput(String(d));
                          }}
                          className={`text-xs px-1.5 py-1 rounded-full border cursor-pointer font-mono text-center truncate min-w-0 transition-colors ${
                            offsetDays === d ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          {d}{ui.wcDaysShort}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full sm:w-44 shrink-0">
                      <button
                        type="button"
                        onClick={() => setOffsetDirection('forward')}
                        className={`px-2 py-1 rounded-full text-xs text-center truncate min-w-0 cursor-pointer transition-all ${
                          offsetDirection === 'forward' ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm' : 'text-neutral-600 dark:text-neutral-400 font-semibold'
                        }`}
                      >
                        +{ui.daysUnit}
                      </button>
                      <button
                        type="button"
                        onClick={() => setOffsetDirection('backward')}
                        className={`px-2 py-1 rounded-full text-xs text-center truncate min-w-0 cursor-pointer transition-all ${
                          offsetDirection === 'backward' ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm' : 'text-neutral-600 dark:text-neutral-400 font-semibold'
                        }`}
                      >
                        -{ui.daysUnit}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={workdaysOnly}
                      onChange={(e) => setWorkdaysOnly(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span>{t.categoryWork}</span>
                  </label>

                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{t.countdownTargetDate}</span>
                      <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-indigo-700 dark:text-indigo-300">
                        {offsetCalcResult?.targetDateStr}
                        <span className="text-xs font-bold ms-1.5">({offsetCalcResult?.weekDayStr})</span>
                      </div>
                    </div>

                    {isChinese && (
                      <>
                        <div className="text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center justify-between gap-1 flex-wrap">
                          <span>{offsetCalcResult?.lunarMonthDay}</span>
                          {offsetCalcResult?.solarTerm && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 text-[11px]">
                              {offsetCalcResult.solarTerm}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-500 truncate">{offsetCalcResult?.fullGanZhi}</div>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (offsetCalcResult) {
                          onUpdateEvent({
                            id: `evt-offset-${Date.now()}`,
                            title: `📌 ${offsetCalcResult.targetDateStr} (${offsetDirection === 'forward' ? '+' : '-'}${offsetDays})`,
                            startDate: offsetCalcResult.targetDateStr,
                            endDate: offsetCalcResult.targetDateStr,
                            isAllDay: true,
                            categoryId: 'default',
                            recurrence: 'none',
                            reminder: 'none',
                            description: `${offsetBaseDate} (${offsetDirection === 'forward' ? '+' : '-'}${offsetDays})`,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                          });
                          showToast(`${offsetCalcResult.targetDateStr}`);
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      {ui.toolTravelAddScheduleBtn}
                    </button>
                  </div>
                </div>
              )}

              {dateCalcSubTab === 'age' && (
                <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-2xl bg-neutral-50/85 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-700/60">
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <Gift className="w-4 h-4" />
                      <span>{ui.toolCalcAgeTitle}</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-500">{ui.toolCalcBirthdayInput}</label>
                    <input
                      type="date"
                      value={birthDateInput}
                      onChange={(e) => setBirthDateInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
                      <div className="text-xs text-neutral-500 font-bold">{ui.toolCalcActualAge}</div>
                      <div className="text-2xl font-black font-mono tabular-nums text-rose-600 mt-1">{ageCalcResult?.zhouSui ?? 0}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
                      <div className="text-xs text-neutral-500 font-bold">{ui.toolCalcNominalAge}</div>
                      <div className="text-2xl font-black font-mono tabular-nums text-neutral-800 dark:text-neutral-200 mt-1">{ageCalcResult?.xuSui ?? 0}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2.5">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-neutral-800/80">
                        <div className="text-[11px] text-neutral-400">{ui.toolCalcDaysAgo}</div>
                        <div className="text-sm font-black font-mono tabular-nums text-blue-600 mt-0.5">
                          {ageCalcResult?.livingDays?.toLocaleString('en-US') ?? 0} {ui.wcDaysShort}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-neutral-800/80">
                        <div className="text-[11px] text-neutral-400">{ui.toolCalcNextBday}</div>
                        <div className="text-sm font-black font-mono tabular-nums text-amber-600 mt-0.5">
                          {ageCalcResult?.daysToNextBday ?? 0} {ui.wcDaysShort}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-neutral-800/80">
                        <div className="text-[11px] text-neutral-400">{ui.toolCalcZodiacLabel}</div>
                        <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1 truncate">
                          {ageCalcResult?.sign.symbol} {ageCalcResult?.sign.name}
                        </div>
                      </div>
                    </div>

                    {isChinese && (
                      <div className="text-xs text-neutral-500 font-mono text-center pt-1.5 border-t border-rose-500/15 truncate">
                        {ageCalcResult?.zodiac} · <span className="font-bold text-neutral-700 dark:text-neutral-200">{ageCalcResult?.lunarBirth}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-neutral-400 text-end shrink-0">
              1900–2100
            </div>
          </div>
        )}

        {/* ================= TAB 10: 📝 备忘录 ================= */}
        {activeTab === 'notes' && (
          <div className="h-full flex flex-col justify-between overflow-hidden gap-2.5">
            <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 shrink-0 flex items-center justify-between gap-2">
              <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">{ui.toolTabMemos}</span>
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (newMemoTitle.trim() || newMemoContent.trim()) {
                      handleAddMemo();
                    } else {
                      memoTitleInputRef.current?.focus();
                      showToast(ui.toolToastMemoTitleReq);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                  style={{ backgroundColor: settings.accentColor }}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{t.addCountdown}</span>
                </button>
                {toolCloseBtn}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-3 py-1 pb-16 md:pb-1 pe-0.5 content-start">
              {/* Input */}
              <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                <input
                  ref={memoTitleInputRef}
                  type="text"
                  placeholder={ui.toolMemosTitlePlaceholder}
                  value={newMemoTitle}
                  onChange={(e) => setNewMemoTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 text-xs font-bold focus:outline-none focus:border-amber-500"
                />
                <textarea
                  placeholder={ui.toolMemosContentPlaceholder}
                  value={newMemoContent}
                  onChange={(e) => setNewMemoContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 text-xs resize-none focus:outline-none focus:border-amber-500"
                />
                <div className="flex justify-end pt-0.5">
                  <span className="text-[11px] text-neutral-400 font-mono tabular-nums">
                    {memoList.length}{isChinese ? ui.toolMemosCountSuffix : ` ${ui.toolMemosCountSuffix}`}
                  </span>
                </div>
              </div>

              {/* List */}
              <div className="lg:col-span-2 space-y-2 overflow-y-auto max-h-[170px]">
                {memoList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-400">{ui.toolMemosEmpty}</div>
                ) : (
                  memoList.map((memo) => (
                    <div
                      key={memo.id}
                      className={`p-3 rounded-2xl border ${memo.color} flex flex-col justify-between space-y-1`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{memo.title}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateEvent({
                                id: `evt-memo-${Date.now()}`,
                                title: `📝 ${memo.title}`,
                                startDate: todayStr,
                                endDate: todayStr,
                                isAllDay: true,
                                categoryId: 'default',
                                recurrence: 'none',
                                reminder: 'none',
                                description: memo.content,
                                createdAt: Date.now(),
                                updatedAt: Date.now(),
                              });
                              showToast(ui.toolToastMemoAdded);
                            }}
                            className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                          >
                            {ui.toolTravelAddScheduleBtn}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const prevMemos = memoList;
                              setMemoList(prevMemos.filter((m) => m.id !== memo.id));
                              window.dispatchEvent(
                                new CustomEvent('app-push-undo', {
                                  detail: {
                                    label: `${ui.undoActionDelete}: ${memo.title}`,
                                    restore: () => setMemoList(prevMemos),
                                  },
                                })
                              );
                            }}
                            className="text-neutral-400 hover:text-rose-500 cursor-pointer"
                            aria-label={t.deleteEvent}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">{memo.content}</p>
                      <div className="text-[9px] text-neutral-400 font-mono">{memo.date}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      )}

      {/* ================= GOOGLE FINANCE STYLE INTERACTIVE MARKET MODAL ================= */}
      <Suspense fallback={null}>
        {selectedQuote && (
          <MarketAnalysisModal
            quote={selectedQuote}
            language={settings.language}
            usdToCny={usdToCny}
            onClose={() => setSelectedQuote(null)}
            onRefreshQuote={handleRefreshStockMarket}
          />
        )}

        {/* ================= HOUSEHOLD LOANS 4-PANEL MODAL ================= */}
        {showHouseholdLoansModal && (
          <HouseholdLoansModal
            open={showHouseholdLoansModal}
            language={settings.language}
            onClose={() => setShowHouseholdLoansModal(false)}
            onSelectSubIndicator={(subIndicator) => setActiveTrendModal(subIndicator)}
          />
        )}

        {/* ================= MAJOR MACRO HEATMAP MATRIX MODAL ================= */}
        {showMajorMacroModal && (
          <MajorMacroMatrixModal
            open={showMajorMacroModal}
            language={settings.language}
            onClose={() => setShowMajorMacroModal(false)}
          />
        )}

        {/* ================= GOOGLE FINANCE STYLE INTERACTIVE MACRO ANALYSIS MODAL ================= */}
        {activeTrendModal && (
          <MacroAnalysisModal
            indicator={activeTrendModal}
            language={settings.language}
            onClose={() => setActiveTrendModal(null)}
            onRefreshMacro={() => refreshLiveMacro(true)}
            onOpenComparison={(mode) => setMacroComparisonMode(mode)}
            isNested={showHouseholdLoansModal && activeTrendModal.id.startsWith('hh_')}
          />
        )}

        {/* ================= MACRO COMPARISON MODAL (PMI OFFICIAL VS S&P / PPI VS CPI) ================= */}
        {macroComparisonMode && (
          <MacroComparisonModal
            mode={macroComparisonMode}
            language={settings.language}
            onClose={() => setMacroComparisonMode(null)}
          />
        )}
      </Suspense>
    </div>
  );
};
