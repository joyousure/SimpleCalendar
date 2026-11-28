import { Language } from '../types/calendar';

export type LoanMethod = 'equal_pi' | 'equal_p' | 'interest_first';
export type LoanPortfolioType = 'commercial' | 'provident' | 'combined';
export type PrepayStrategy = 'shorten_term' | 'reduce_payment';
export type DepositModeType = 'lump' | 'recurring';

export interface LoanScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remaining: number;
}

export interface LoanYearlyRow {
  year: number;
  totalPayment: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
}

export interface LoanCalcSummary {
  principalTotal: number;
  firstMonthPayment: number;
  lastMonthPayment: number;
  decreasePerMonth: number;
  totalInterest: number;
  totalPayment: number;
  isDecreasing: boolean;
  principalRatioPct: number;
  interestRatioPct: number;
  interestMultiplierPct: number;
  monthlySchedule: LoanScheduleRow[];
  yearlySchedule: LoanYearlyRow[];
}

export interface PrepaymentSimulationResult {
  valid: boolean;
  remainingPrincipalBefore: number;
  effectivePrepayAmount: number;
  remainingPrincipalAfter: number;
  oldMonthlyPayment: number;
  newMonthlyPayment: number;
  newMonthsRemaining: number;
  monthsSaved: number;
  interestSaved: number;
}

export interface DepositCalcResult {
  principalTotal: number;
  interest: number;
  total: number;
  dailyInterest: string;
  annualizedYieldPct: number;
  compoundExtraInterest: number;
  maturityDateStr: string;
  totalMonths: number;
}

export function calculateSingleLoanSchedule(
  amountWan: number,
  years: number,
  annualRatePct: number,
  method: LoanMethod
): LoanCalcSummary {
  const safeWan = Math.max(0, Math.min(100000, Number.isFinite(amountWan) ? amountWan : 0));
  const P = safeWan * 10000;
  const safeYears = Math.max(1, Math.min(100, Math.round(Number.isFinite(years) ? years : 1)));
  const n = safeYears * 12;
  const safeRate = Math.max(0, Math.min(30, Number.isFinite(annualRatePct) ? annualRatePct : 0));
  const r = safeRate / 100 / 12;

  if (P <= 0) {
    return {
      principalTotal: 0,
      firstMonthPayment: 0,
      lastMonthPayment: 0,
      decreasePerMonth: 0,
      totalInterest: 0,
      totalPayment: 0,
      isDecreasing: false,
      principalRatioPct: 100,
      interestRatioPct: 0,
      interestMultiplierPct: 0,
      monthlySchedule: [],
      yearlySchedule: [],
    };
  }

  const monthlySchedule: LoanScheduleRow[] = [];
  let balance = P;
  let totalInterest = 0;

  if (r === 0) {
    const monthlyPrincipal = P / n;
    for (let m = 1; m <= n; m++) {
      const payment = method === 'interest_first' ? (m === n ? P : 0) : monthlyPrincipal;
      const principalPaid = method === 'interest_first' ? (m === n ? P : 0) : monthlyPrincipal;
      balance = Math.max(0, balance - principalPaid);
      monthlySchedule.push({
        month: m,
        payment,
        principal: principalPaid,
        interest: 0,
        remaining: balance,
      });
    }
  } else if (method === 'equal_pi') {
    const pow = Math.pow(1 + r, n);
    const denom = pow - 1;
    const monthlyPayment = Number.isFinite(pow) && denom > 0 ? (P * r * pow) / denom : P / n;
    for (let m = 1; m <= n; m++) {
      const interest = balance * r;
      let principal = monthlyPayment - interest;
      if (m === n || principal > balance) {
        principal = balance;
      }
      const actualPayment = principal + interest;
      balance = Math.max(0, balance - principal);
      totalInterest += interest;
      monthlySchedule.push({
        month: m,
        payment: actualPayment,
        principal,
        interest,
        remaining: balance,
      });
    }
  } else if (method === 'equal_p') {
    const monthlyPrincipal = P / n;
    for (let m = 1; m <= n; m++) {
      const interest = balance * r;
      const principal = m === n ? balance : monthlyPrincipal;
      const payment = principal + interest;
      balance = Math.max(0, balance - principal);
      totalInterest += interest;
      monthlySchedule.push({
        month: m,
        payment,
        principal,
        interest,
        remaining: balance,
      });
    }
  } else {
    // interest_first
    const monthlyInterest = P * r;
    for (let m = 1; m <= n; m++) {
      const principal = m === n ? P : 0;
      const payment = principal + monthlyInterest;
      balance = Math.max(0, balance - principal);
      totalInterest += monthlyInterest;
      monthlySchedule.push({
        month: m,
        payment,
        principal,
        interest: monthlyInterest,
        remaining: balance,
      });
    }
  }

  const totalPayment = P + totalInterest;
  const firstMonthPayment = monthlySchedule[0]?.payment ?? 0;
  const lastMonthPayment = monthlySchedule[monthlySchedule.length - 1]?.payment ?? 0;
  const decreasePerMonth =
    method === 'equal_p' && n > 1 && r > 0 ? (P / n) * r : 0;

  const yearlySchedule: LoanYearlyRow[] = [];
  for (let y = 0; y < safeYears; y++) {
    const slice = monthlySchedule.slice(y * 12, (y + 1) * 12);
    if (slice.length === 0) break;
    yearlySchedule.push({
      year: y + 1,
      totalPayment: slice.reduce((acc, row) => acc + row.payment, 0),
      principalPaid: slice.reduce((acc, row) => acc + row.principal, 0),
      interestPaid: slice.reduce((acc, row) => acc + row.interest, 0),
      endingBalance: slice[slice.length - 1].remaining,
    });
  }

  const principalRatioPct = totalPayment > 0 ? Math.round((P / totalPayment) * 1000) / 10 : 100;
  const interestRatioPct = Math.round((100 - principalRatioPct) * 10) / 10;
  const interestMultiplierPct = P > 0 ? Math.round((totalInterest / P) * 1000) / 10 : 0;

  return {
    principalTotal: P,
    firstMonthPayment,
    lastMonthPayment,
    decreasePerMonth,
    totalInterest,
    totalPayment,
    isDecreasing: method === 'equal_p' && r > 0,
    principalRatioPct,
    interestRatioPct,
    interestMultiplierPct,
    monthlySchedule,
    yearlySchedule,
  };
}

export function mergeLoanSummaries(a: LoanCalcSummary, b: LoanCalcSummary): LoanCalcSummary {
  const P = a.principalTotal + b.principalTotal;
  const maxMonths = Math.max(a.monthlySchedule.length, b.monthlySchedule.length);
  const monthlySchedule: LoanScheduleRow[] = [];

  for (let i = 0; i < maxMonths; i++) {
    const ra = a.monthlySchedule[i];
    const rb = b.monthlySchedule[i];
    monthlySchedule.push({
      month: i + 1,
      payment: (ra?.payment ?? 0) + (rb?.payment ?? 0),
      principal: (ra?.principal ?? 0) + (rb?.principal ?? 0),
      interest: (ra?.interest ?? 0) + (rb?.interest ?? 0),
      remaining: (ra?.remaining ?? 0) + (rb?.remaining ?? 0),
    });
  }

  const totalYears = Math.ceil(maxMonths / 12);
  const yearlySchedule: LoanYearlyRow[] = [];
  for (let y = 0; y < totalYears; y++) {
    const slice = monthlySchedule.slice(y * 12, (y + 1) * 12);
    if (slice.length === 0) break;
    yearlySchedule.push({
      year: y + 1,
      totalPayment: slice.reduce((acc, row) => acc + row.payment, 0),
      principalPaid: slice.reduce((acc, row) => acc + row.principal, 0),
      interestPaid: slice.reduce((acc, row) => acc + row.interest, 0),
      endingBalance: slice[slice.length - 1].remaining,
    });
  }

  const totalInterest = a.totalInterest + b.totalInterest;
  const totalPayment = P + totalInterest;
  const principalRatioPct = totalPayment > 0 ? Math.round((P / totalPayment) * 1000) / 10 : 100;

  return {
    principalTotal: P,
    firstMonthPayment: a.firstMonthPayment + b.firstMonthPayment,
    lastMonthPayment: a.lastMonthPayment + b.lastMonthPayment,
    decreasePerMonth: a.decreasePerMonth + b.decreasePerMonth,
    totalInterest,
    totalPayment,
    isDecreasing: a.isDecreasing || b.isDecreasing,
    principalRatioPct,
    interestRatioPct: Math.round((100 - principalRatioPct) * 10) / 10,
    interestMultiplierPct: P > 0 ? Math.round((totalInterest / P) * 1000) / 10 : 0,
    monthlySchedule,
    yearlySchedule,
  };
}

export function simulatePrepayment(
  summary: LoanCalcSummary,
  annualRatePct: number,
  method: LoanMethod,
  prepayAtMonth: number,
  prepayAmountWan: number,
  strategy: PrepayStrategy
): PrepaymentSimulationResult {
  const totalMonths = summary.monthlySchedule.length;
  const safeMonth = Math.max(1, Math.min(Math.max(1, totalMonths - 1), prepayAtMonth));
  const rowAtMonth = summary.monthlySchedule[safeMonth - 1];
  if (!rowAtMonth || totalMonths <= 1 || rowAtMonth.remaining <= 0) {
    return {
      valid: false,
      remainingPrincipalBefore: 0,
      effectivePrepayAmount: 0,
      remainingPrincipalAfter: 0,
      oldMonthlyPayment: 0,
      newMonthlyPayment: 0,
      newMonthsRemaining: 0,
      monthsSaved: 0,
      interestSaved: 0,
    };
  }

  const remainingPrincipalBefore = rowAtMonth.remaining;
  const prepayYuan = Math.max(0, prepayAmountWan) * 10000;
  const effectivePrepayAmount = Math.min(remainingPrincipalBefore, prepayYuan);
  const remainingPrincipalAfter = Math.max(0, remainingPrincipalBefore - effectivePrepayAmount);

  const originalFutureRows = summary.monthlySchedule.slice(safeMonth);
  const originalFutureInterest = originalFutureRows.reduce((acc, row) => acc + row.interest, 0);
  const remainingMonthsOriginal = originalFutureRows.length;
  const oldMonthlyPayment = originalFutureRows[0]?.payment ?? summary.firstMonthPayment;

  if (effectivePrepayAmount <= 0 || remainingMonthsOriginal <= 0) {
    return {
      valid: false,
      remainingPrincipalBefore,
      effectivePrepayAmount: 0,
      remainingPrincipalAfter: remainingPrincipalBefore,
      oldMonthlyPayment,
      newMonthlyPayment: oldMonthlyPayment,
      newMonthsRemaining: remainingMonthsOriginal,
      monthsSaved: 0,
      interestSaved: 0,
    };
  }

  if (remainingPrincipalAfter <= 0.01) {
    return {
      valid: true,
      remainingPrincipalBefore,
      effectivePrepayAmount,
      remainingPrincipalAfter: 0,
      oldMonthlyPayment,
      newMonthlyPayment: 0,
      newMonthsRemaining: 0,
      monthsSaved: remainingMonthsOriginal,
      interestSaved: Math.max(0, originalFutureInterest),
    };
  }

  const r = Math.max(0, annualRatePct) / 100 / 12;

  if (strategy === 'reduce_payment' || method === 'interest_first') {
    let newInterestTotal = 0;
    let newMonthlyPayment = 0;
    if (r === 0) {
      newMonthlyPayment = remainingPrincipalAfter / remainingMonthsOriginal;
      newInterestTotal = 0;
    } else if (method === 'equal_pi') {
      const pow = Math.pow(1 + r, remainingMonthsOriginal);
      newMonthlyPayment = (remainingPrincipalAfter * r * pow) / (pow - 1);
      newInterestTotal = newMonthlyPayment * remainingMonthsOriginal - remainingPrincipalAfter;
    } else if (method === 'equal_p') {
      const monthlyPrincipal = remainingPrincipalAfter / remainingMonthsOriginal;
      newMonthlyPayment = monthlyPrincipal + remainingPrincipalAfter * r;
      newInterestTotal = ((remainingMonthsOriginal + 1) * remainingPrincipalAfter * r) / 2;
    } else {
      newMonthlyPayment = remainingPrincipalAfter * r;
      newInterestTotal = newMonthlyPayment * remainingMonthsOriginal;
    }

    return {
      valid: true,
      remainingPrincipalBefore,
      effectivePrepayAmount,
      remainingPrincipalAfter,
      oldMonthlyPayment,
      newMonthlyPayment,
      newMonthsRemaining: remainingMonthsOriginal,
      monthsSaved: 0,
      interestSaved: Math.max(0, originalFutureInterest - newInterestTotal),
    };
  }

  // shorten_term (keep monthly payment roughly at current scheduled payment)
  let newMonthsRemaining = 0;
  let newInterestTotal = 0;
  let bal = remainingPrincipalAfter;

  if (r === 0) {
    const targetPay = Math.max(1, oldMonthlyPayment);
    newMonthsRemaining = Math.min(remainingMonthsOriginal, Math.ceil(bal / targetPay));
  } else if (method === 'equal_pi') {
    const targetPay = Math.max(oldMonthlyPayment, bal * r + 1);
    while (bal > 0.01 && newMonthsRemaining < remainingMonthsOriginal) {
      newMonthsRemaining++;
      const interest = bal * r;
      const principal = Math.min(bal, Math.max(targetPay - interest, bal / remainingMonthsOriginal));
      newInterestTotal += interest;
      bal -= principal;
    }
  } else {
    // equal_p: keep monthly principal step constant
    const oldPrincipalStep = summary.principalTotal / totalMonths;
    newMonthsRemaining = Math.min(remainingMonthsOriginal, Math.ceil(bal / Math.max(1, oldPrincipalStep)));
    newInterestTotal = ((newMonthsRemaining + 1) * bal * r) / 2;
  }

  const newMonthlyPayment =
    r === 0
      ? remainingPrincipalAfter / Math.max(1, newMonthsRemaining)
      : method === 'equal_pi'
      ? (remainingPrincipalAfter * r * Math.pow(1 + r, Math.max(1, newMonthsRemaining))) /
        Math.max(1e-9, Math.pow(1 + r, Math.max(1, newMonthsRemaining)) - 1)
      : remainingPrincipalAfter / Math.max(1, newMonthsRemaining) + remainingPrincipalAfter * r;

  return {
    valid: true,
    remainingPrincipalBefore,
    effectivePrepayAmount,
    remainingPrincipalAfter,
    oldMonthlyPayment,
    newMonthlyPayment,
    newMonthsRemaining,
    monthsSaved: Math.max(0, remainingMonthsOriginal - newMonthsRemaining),
    interestSaved: Math.max(0, originalFutureInterest - newInterestTotal),
  };
}

export function calculateAdvancedDeposit(params: {
  mode: DepositModeType;
  principalOrMonthly: number;
  months: number;
  annualRatePct: number;
  rolloverCycles: number; // 1 = single term, 2..5 = compounded auto-rollover
  startDateStr: string;
}): DepositCalcResult {
  const { mode, principalOrMonthly, months, annualRatePct, rolloverCycles, startDateStr } = params;
  const safeAmt = Math.max(0, Math.min(1_000_000_000, Number.isFinite(principalOrMonthly) ? principalOrMonthly : 0));
  const safeMonths = Math.max(1, Math.min(360, months));
  const cycles = mode === 'lump' ? Math.max(1, Math.min(5, rolloverCycles)) : 1;
  const safeRate = Math.max(0, Math.min(30, Number.isFinite(annualRatePct) ? annualRatePct : 0)) / 100;

  let principalTotal = safeAmt;
  let interest = 0;
  let total = safeAmt;
  let compoundExtraInterest = 0;
  const totalMonths = safeMonths * cycles;

  if (mode === 'lump') {
    const simpleInterestAll = safeAmt * safeRate * (totalMonths / 12);
    if (cycles <= 1) {
      interest = Math.round(simpleInterestAll);
      total = Math.round(safeAmt + interest);
    } else {
      const cycleRate = safeRate * (safeMonths / 12);
      const compoundedTotal = safeAmt * Math.pow(1 + cycleRate, cycles);
      total = Math.round(compoundedTotal);
      interest = Math.max(0, total - Math.round(safeAmt));
      compoundExtraInterest = Math.max(0, Math.round(interest - simpleInterestAll));
    }
  } else {
    // 零存整取：monthly fixed deposit compounded monthly / standard simple formula:
    // Interest = monthly * months * (months + 1) / 2 * (annualRate / 12)
    principalTotal = Math.round(safeAmt * safeMonths);
    const simpleAccrual = safeAmt * ((safeMonths * (safeMonths + 1)) / 2) * (safeRate / 12);
    interest = Math.round(simpleAccrual);
    total = principalTotal + interest;
  }

  const baseDate = new Date(`${startDateStr}T00:00:00`);
  const validStart = !isNaN(baseDate.getTime()) ? baseDate : new Date();
  const maturity = new Date(validStart.getTime());
  maturity.setMonth(maturity.getMonth() + totalMonths);
  const y = maturity.getFullYear();
  const m = String(maturity.getMonth() + 1).padStart(2, '0');
  const d = String(maturity.getDate()).padStart(2, '0');

  const annualizedYieldPct =
    principalTotal > 0 && totalMonths > 0
      ? Math.round(((interest / principalTotal) / (totalMonths / 12)) * 10000) / 100
      : 0;

  return {
    principalTotal: Math.round(principalTotal),
    interest,
    total,
    dailyInterest: ((principalTotal * safeRate) / 365).toFixed(2),
    annualizedYieldPct,
    compoundExtraInterest,
    maturityDateStr: `${y}-${m}-${d}`,
    totalMonths,
  };
}

export interface RatesProLabels {
  portfolioCommercial: string;
  portfolioProvident: string;
  portfolioCombined: string;
  commercialAmountLabel: string;
  providentAmountLabel: string;
  providentRateLabel: string;
  bpOffsetLabel: string;
  principalRatioLabel: string;
  interestRatioLabel: string;
  compareTipEqualP: string;
  compareTipEqualPi: string;
  prepayTitle: string;
  prepayMonthLabel: string;
  prepayAmountLabel: string;
  prepayShortenTerm: string;
  prepayReducePay: string;
  prepayNewMonthly: string;
  prepayMonthsSaved: string;
  prepayInterestSaved: string;
  scheduleTitle: string;
  scheduleByYear: string;
  scheduleFirst24: string;
  colPeriod: string;
  colPayment: string;
  colPrincipal: string;
  colInterest: string;
  colRemaining: string;
  yearUnit: string;
  monthUnit: string;
  exportCsvBtn: string;
  exportCsvToast: string;
  addPaymentReminder: string;
  addedLoanEventToast: string;
  depositModeLump: string;
  depositModeRecurring: string;
  monthlyDepositLabel: string;
  customRateLabel: string;
  rolloverCyclesLabel: string;
  rolloverBonusLabel: string;
  maturityDateLabel: string;
  annualYieldLabel: string;
  addMaturityReminder: string;
  addedMaturityToast: string;
  monthsUnit: string;
  hpfShort: string;
}

const RATES_PRO_LABELS: Record<Language, RatesProLabels> = {
  'zh-CN': {
    portfolioCommercial: '商业贷款',
    portfolioProvident: '公积金贷',
    portfolioCombined: '组合贷款',
    commercialAmountLabel: '商贷金额',
    providentAmountLabel: '公积金金额',
    providentRateLabel: '公积金利率',
    bpOffsetLabel: 'LPR 基点微调',
    principalRatioLabel: '本金占比',
    interestRatioLabel: '利息占比',
    compareTipEqualP: '切换「等额本金」总利息可省',
    compareTipEqualPi: '切换「等额本息」首月少还',
    prepayTitle: '提前还款精算',
    prepayMonthLabel: '第 N 期后提前还',
    prepayAmountLabel: '提前还款额',
    prepayShortenTerm: '缩短年限(月供不变)',
    prepayReducePay: '减少月供(年限不变)',
    prepayNewMonthly: '调整后月供',
    prepayMonthsSaved: '缩短期数',
    prepayInterestSaved: '节省总利息',
    scheduleTitle: '分期还款明细',
    scheduleByYear: '按年汇总',
    scheduleFirst24: '前24期逐月',
    colPeriod: '期数',
    colPayment: '本期还款',
    colPrincipal: '偿还本金',
    colInterest: '支付利息',
    colRemaining: '剩余本金',
    yearUnit: '第{n}年',
    monthUnit: '第{n}期',
    exportCsvBtn: '导出对账单',
    exportCsvToast: '还款计划明细 CSV 已下载',
    addPaymentReminder: '月供记入日历',
    addedLoanEventToast: '已将月供还款计划写入日历',
    depositModeLump: '整存整取',
    depositModeRecurring: '零存整取(定投)',
    monthlyDepositLabel: '每月定存金额',
    customRateLabel: '年利率(%)',
    rolloverCyclesLabel: '自动复利转存',
    rolloverBonusLabel: '复利多赚',
    maturityDateLabel: '预计到期日',
    annualYieldLabel: '折合年化',
    addMaturityReminder: '到期日加日历',
    addedMaturityToast: '已添加存款到期提醒至 {date}',
    monthsUnit: '个月',
    hpfShort: '公积金',
  },
  'zh-TW': {
    portfolioCommercial: '商業貸款',
    portfolioProvident: '公積金貸',
    portfolioCombined: '組合貸款',
    commercialAmountLabel: '商貸金額',
    providentAmountLabel: '公積金金額',
    providentRateLabel: '公積金利率',
    bpOffsetLabel: 'LPR 基點微調',
    principalRatioLabel: '本金佔比',
    interestRatioLabel: '利息佔比',
    compareTipEqualP: '切換「等額本金」總利息可省',
    compareTipEqualPi: '切換「等額本息」首月少還',
    prepayTitle: '提前還款精算',
    prepayMonthLabel: '第 N 期後提前還',
    prepayAmountLabel: '提前還款額',
    prepayShortenTerm: '縮短年限(月供不變)',
    prepayReducePay: '減少月供(年限不變)',
    prepayNewMonthly: '調整後月供',
    prepayMonthsSaved: '縮短期數',
    prepayInterestSaved: '節省總利息',
    scheduleTitle: '分期還款明細',
    scheduleByYear: '按年彙總',
    scheduleFirst24: '前24期逐月',
    colPeriod: '期數',
    colPayment: '本期還款',
    colPrincipal: '償還本金',
    colInterest: '支付利息',
    colRemaining: '剩餘本金',
    yearUnit: '第{n}年',
    monthUnit: '第{n}期',
    exportCsvBtn: '匯出對帳單',
    exportCsvToast: '還款計劃明細 CSV 已下載',
    addPaymentReminder: '月供記入日曆',
    addedLoanEventToast: '已將月供還款計劃寫入日曆',
    depositModeLump: '整存整取',
    depositModeRecurring: '零存整取(定投)',
    monthlyDepositLabel: '每月定存金額',
    customRateLabel: '年利率(%)',
    rolloverCyclesLabel: '自動複利轉存',
    rolloverBonusLabel: '複利多賺',
    maturityDateLabel: '預計到期日',
    annualYieldLabel: '折合年化',
    addMaturityReminder: '到期日加日曆',
    addedMaturityToast: '已新增存款到期提醒至 {date}',
    monthsUnit: '個月',
    hpfShort: '公積金',
  },
  en: {
    portfolioCommercial: 'Commercial',
    portfolioProvident: 'Provident Fund',
    portfolioCombined: 'Combined',
    commercialAmountLabel: 'Commercial Loan',
    providentAmountLabel: 'HPF Loan',
    providentRateLabel: 'HPF Rate',
    bpOffsetLabel: 'LPR BP Adjust',
    principalRatioLabel: 'Principal',
    interestRatioLabel: 'Interest',
    compareTipEqualP: 'Equal Principal saves',
    compareTipEqualPi: 'Equal P&I lowers 1st mo by',
    prepayTitle: 'Prepayment Simulator',
    prepayMonthLabel: 'Prepay after month',
    prepayAmountLabel: 'Prepay Amount',
    prepayShortenTerm: 'Shorten Term',
    prepayReducePay: 'Lower Payment',
    prepayNewMonthly: 'New Monthly',
    prepayMonthsSaved: 'Months Saved',
    prepayInterestSaved: 'Interest Saved',
    scheduleTitle: 'Amortization Schedule',
    scheduleByYear: 'Annual Summary',
    scheduleFirst24: 'First 24 Months',
    colPeriod: 'Period',
    colPayment: 'Payment',
    colPrincipal: 'Principal',
    colInterest: 'Interest',
    colRemaining: 'Balance',
    yearUnit: 'Yr {n}',
    monthUnit: 'Mo {n}',
    exportCsvBtn: 'Export CSV',
    exportCsvToast: 'Amortization CSV exported',
    addPaymentReminder: 'Add Payment Reminder',
    addedLoanEventToast: 'Loan payment reminder added to calendar',
    depositModeLump: 'Lump Sum',
    depositModeRecurring: 'Monthly Recurring',
    monthlyDepositLabel: 'Monthly Deposit',
    customRateLabel: 'Rate (%)',
    rolloverCyclesLabel: 'Auto-Rollover',
    rolloverBonusLabel: 'Compound Bonus',
    maturityDateLabel: 'Maturity Date',
    annualYieldLabel: 'Eff. Yield',
    addMaturityReminder: 'Add Maturity Alert',
    addedMaturityToast: 'Deposit maturity reminder added for {date}',
    monthsUnit: 'mos',
    hpfShort: 'HPF',
  },
  ja: {
    portfolioCommercial: '銀行ローン',
    portfolioProvident: '公的融資',
    portfolioCombined: '併用ローン',
    commercialAmountLabel: '銀行融資額',
    providentAmountLabel: '公的融資額',
    providentRateLabel: '公的金利',
    bpOffsetLabel: 'LPR BP 調整',
    principalRatioLabel: '元本比率',
    interestRatioLabel: '利息比率',
    compareTipEqualP: '元金均等に変更で利息節約',
    compareTipEqualPi: '元利均等に変更で初回軽減',
    prepayTitle: '繰上返済試算',
    prepayMonthLabel: 'N回目後に繰上',
    prepayAmountLabel: '繰上返済額',
    prepayShortenTerm: '期間短縮型',
    prepayReducePay: '返済額軽減型',
    prepayNewMonthly: '変更後月額',
    prepayMonthsSaved: '短縮回数',
    prepayInterestSaved: '節約利息',
    scheduleTitle: '返済明細表',
    scheduleByYear: '年別集計',
    scheduleFirst24: '初回24ヶ月',
    colPeriod: '回次',
    colPayment: '返済額',
    colPrincipal: '元本',
    colInterest: '利息',
    colRemaining: '残高',
    yearUnit: '{n}年目',
    monthUnit: '{n}回',
    exportCsvBtn: 'CSV出力',
    exportCsvToast: '返済明細CSVを出力しました',
    addPaymentReminder: 'カレンダー登録',
    addedLoanEventToast: '返済リマインダーをカレンダーに追加しました',
    depositModeLump: '一括定期',
    depositModeRecurring: '積立定期',
    monthlyDepositLabel: '毎月積立額',
    customRateLabel: '年利率(%)',
    rolloverCyclesLabel: '自動複利継続',
    rolloverBonusLabel: '複利上乗せ',
    maturityDateLabel: '満期予定日',
    annualYieldLabel: '実効利回り',
    addMaturityReminder: '満期日を登録',
    addedMaturityToast: '{date} に預金満期通知を追加しました',
    monthsUnit: 'ヶ月',
    hpfShort: '公的',
  },
  ko: {
    portfolioCommercial: '시중 대출',
    portfolioProvident: '주택기금',
    portfolioCombined: '혼합 대출',
    commercialAmountLabel: '시중 대출액',
    providentAmountLabel: '기금 대출액',
    providentRateLabel: '기금 금리',
    bpOffsetLabel: 'LPR BP 조정',
    principalRatioLabel: '원금 비중',
    interestRatioLabel: '이자 비중',
    compareTipEqualP: '원금균등 전환 시 이자 절약',
    compareTipEqualPi: '원리금균등 전환 시 첫 달 절감',
    prepayTitle: '중도상환 시뮬레이션',
    prepayMonthLabel: 'N회차 후 상환',
    prepayAmountLabel: '중도상환액',
    prepayShortenTerm: '기간 단축형',
    prepayReducePay: '월 납입액 감축',
    prepayNewMonthly: '변경 후 월납입',
    prepayMonthsSaved: '단축 회차',
    prepayInterestSaved: '총 절감 이자',
    scheduleTitle: '상환 일정표',
    scheduleByYear: '연도별 요약',
    scheduleFirst24: '초기 24개월',
    colPeriod: '회차',
    colPayment: '납입액',
    colPrincipal: '원금',
    colInterest: '이자',
    colRemaining: '잔여 원금',
    yearUnit: '{n}년차',
    monthUnit: '{n}회',
    exportCsvBtn: 'CSV 내보내기',
    exportCsvToast: '상환 계획 CSV가 다운로드되었습니다',
    addPaymentReminder: '일정 등록',
    addedLoanEventToast: '월 상환 알림이 캘린더에 추가되었습니다',
    depositModeLump: '거치식 예금',
    depositModeRecurring: '월 적립식',
    monthlyDepositLabel: '월 납입 금액',
    customRateLabel: '연이율(%)',
    rolloverCyclesLabel: '복리 자동재예치',
    rolloverBonusLabel: '복리 추가수익',
    maturityDateLabel: '만기 예정일',
    annualYieldLabel: '연환산 수익률',
    addMaturityReminder: '만기일 등록',
    addedMaturityToast: '{date} 예금 만기 알림을 추가했습니다',
    monthsUnit: '개월',
    hpfShort: '기금',
  },
  fr: {
    portfolioCommercial: 'Commercial',
    portfolioProvident: 'Fonds Logement',
    portfolioCombined: 'Combiné',
    commercialAmountLabel: 'Prêt commercial',
    providentAmountLabel: 'Prêt Fonds',
    providentRateLabel: 'Taux Fonds',
    bpOffsetLabel: 'Ajustement LPR (pb)',
    principalRatioLabel: 'Capital',
    interestRatioLabel: 'Intérêts',
    compareTipEqualP: 'Amortissement constant économise',
    compareTipEqualPi: 'Mensualité fixe réduit 1er mois de',
    prepayTitle: 'Simulateur de remboursement anticipé',
    prepayMonthLabel: 'Après mois N',
    prepayAmountLabel: 'Montant anticipé',
    prepayShortenTerm: 'Réduire la durée',
    prepayReducePay: 'Réduire la mensualité',
    prepayNewMonthly: 'Nouvelle mensualité',
    prepayMonthsSaved: 'Mois gagnés',
    prepayInterestSaved: 'Intérêts économisés',
    scheduleTitle: 'Tableau d’amortissement',
    scheduleByYear: 'Synthèse annuelle',
    scheduleFirst24: '24 premiers mois',
    colPeriod: 'Période',
    colPayment: 'Échéance',
    colPrincipal: 'Capital',
    colInterest: 'Intérêts',
    colRemaining: 'Restant dû',
    yearUnit: 'An {n}',
    monthUnit: 'M{n}',
    exportCsvBtn: 'Exporter CSV',
    exportCsvToast: 'Échéancier CSV téléchargé',
    addPaymentReminder: 'Ajouter rappel',
    addedLoanEventToast: 'Rappel d’échéance ajouté au calendrier',
    depositModeLump: 'Dépôt à terme',
    depositModeRecurring: 'Épargne mensuelle',
    monthlyDepositLabel: 'Versement mensuel',
    customRateLabel: 'Taux (%)',
    rolloverCyclesLabel: 'Reconduction composée',
    rolloverBonusLabel: 'Gain composé',
    maturityDateLabel: 'Date d’échéance',
    annualYieldLabel: 'Rendement annuel',
    addMaturityReminder: 'Alerte échéance',
    addedMaturityToast: 'Rappel d’échéance ajouté le {date}',
    monthsUnit: 'mois',
    hpfShort: 'Fonds',
  },
  ru: {
    portfolioCommercial: 'Коммерческий',
    portfolioProvident: 'Льготный фонд',
    portfolioCombined: 'Смешанный',
    commercialAmountLabel: 'Коммерч. кредит',
    providentAmountLabel: 'Льготный кредит',
    providentRateLabel: 'Льготн. ставка',
    bpOffsetLabel: 'Сдвиг LPR (б.п.)',
    principalRatioLabel: 'Основной долг',
    interestRatioLabel: 'Проценты',
    compareTipEqualP: 'Дифф. платежи сэкономят',
    compareTipEqualPi: 'Аннуитет снизит 1-й платёж на',
    prepayTitle: 'Досрочное погашение',
    prepayMonthLabel: 'После месяца №',
    prepayAmountLabel: 'Сумма досрочно',
    prepayShortenTerm: 'Сократить срок',
    prepayReducePay: 'Снизить платёж',
    prepayNewMonthly: 'Новый платёж',
    prepayMonthsSaved: 'Срок короче на',
    prepayInterestSaved: 'Экономия %',
    scheduleTitle: 'График платежей',
    scheduleByYear: 'По годам',
    scheduleFirst24: 'Первые 24 мес.',
    colPeriod: 'Период',
    colPayment: 'Платёж',
    colPrincipal: 'Долг',
    colInterest: 'Проценты',
    colRemaining: 'Остаток',
    yearUnit: '{n} год',
    monthUnit: '{n} мес.',
    exportCsvBtn: 'Скачать CSV',
    exportCsvToast: 'График платежей (CSV) загружен',
    addPaymentReminder: 'В календарь',
    addedLoanEventToast: 'Напоминание о платеже добавлено',
    depositModeLump: 'Срочный вклад',
    depositModeRecurring: 'Пополняемый',
    monthlyDepositLabel: 'Взнос в месяц',
    customRateLabel: 'Ставка (%)',
    rolloverCyclesLabel: 'Капитализация',
    rolloverBonusLabel: 'Бонус сложн. %',
    maturityDateLabel: 'Дата закрытия',
    annualYieldLabel: 'Эффект. доход',
    addMaturityReminder: 'Напомнить о сроке',
    addedMaturityToast: 'Напоминание о вкладе на {date}',
    monthsUnit: 'мес.',
    hpfShort: 'Фонд',
  },
  fa: {
    portfolioCommercial: 'تجاری',
    portfolioProvident: 'صندوق مسکن',
    portfolioCombined: 'ترکیبی',
    commercialAmountLabel: 'وام تجاری',
    providentAmountLabel: 'وام صندوق',
    providentRateLabel: 'نرخ صندوق',
    bpOffsetLabel: 'تنظیم BP',
    principalRatioLabel: 'اصل وام',
    interestRatioLabel: 'بهره',
    compareTipEqualP: 'روش اصل برابر صرفه‌جویی می‌کند',
    compareTipEqualPi: 'قسط مساوی ماه اول را کم می‌کند',
    prepayTitle: 'شبیه‌ساز بازپرداخت زودهنگام',
    prepayMonthLabel: 'پس از قسط شماره',
    prepayAmountLabel: 'مبلغ تسویه زودهنگام',
    prepayShortenTerm: 'کاهش مدت',
    prepayReducePay: 'کاهش قسط',
    prepayNewMonthly: 'قسط جدید',
    prepayMonthsSaved: 'کاهش اقساط',
    prepayInterestSaved: 'صرفه‌جویی سود',
    scheduleTitle: 'جدول بازپرداخت',
    scheduleByYear: 'خلاصه سالانه',
    scheduleFirst24: '۲۴ قسط اول',
    colPeriod: 'دوره',
    colPayment: 'مبلغ قسط',
    colPrincipal: 'اصل',
    colInterest: 'سود',
    colRemaining: 'مانده',
    yearUnit: 'سال {n}',
    monthUnit: 'ماه {n}',
    exportCsvBtn: 'خروجی CSV',
    exportCsvToast: 'فایل جدول اقساط ذخیره شد',
    addPaymentReminder: 'افزودن یادآور',
    addedLoanEventToast: 'یادآور قسط در تقویم ثبت شد',
    depositModeLump: 'سپرده یکجا',
    depositModeRecurring: 'سپرده ماهانه',
    monthlyDepositLabel: 'واریز ماهانه',
    customRateLabel: 'نرخ سود(%)',
    rolloverCyclesLabel: 'تمدید مرکب',
    rolloverBonusLabel: 'سود مرکب اضافه',
    maturityDateLabel: 'تاریخ سررسید',
    annualYieldLabel: 'بازده سالانه',
    addMaturityReminder: 'ثبت سررسید',
    addedMaturityToast: 'یادآور سررسید برای {date} ثبت شد',
    monthsUnit: 'ماه',
    hpfShort: 'صندوق',
  },
  mn: {
    portfolioCommercial: 'Арилжааны',
    portfolioProvident: 'Орон сууцны сан',
    portfolioCombined: 'Хосолсон',
    commercialAmountLabel: 'Арилжааны зээл',
    providentAmountLabel: 'Сангийн зээл',
    providentRateLabel: 'Сангийн хүү',
    bpOffsetLabel: 'LPR BP тохиргоо',
    principalRatioLabel: 'Үндсэн төлбөр',
    interestRatioLabel: 'Хүүгийн дүн',
    compareTipEqualP: 'Тэнцүү үндсэн төлбөрөөр хэмнэнэ',
    compareTipEqualPi: 'Тэнцүү төлөлтөөр эхний сар хөнгөрнө',
    prepayTitle: 'Урьдчилсан төлөлтийн тооцоо',
    prepayMonthLabel: 'N-р сарын дараа',
    prepayAmountLabel: 'Урьдчилан төлөх',
    prepayShortenTerm: 'Хугацаа богиносгох',
    prepayReducePay: 'Төлөлт багасгах',
    prepayNewMonthly: 'Шинэ сарын төлөлт',
    prepayMonthsSaved: 'Хэмнэсэн сар',
    prepayInterestSaved: 'Хэмнэсэн хүү',
    scheduleTitle: 'Эргэн төлөлтийн хуваарь',
    scheduleByYear: 'Жилийн хураангуй',
    scheduleFirst24: 'Эхний 24 сар',
    colPeriod: 'Үе',
    colPayment: 'Төлбөр',
    colPrincipal: 'Үндсэн',
    colInterest: 'Хүү',
    colRemaining: 'Үлдэгдэл',
    yearUnit: '{n}-р жил',
    monthUnit: '{n}-р сар',
    exportCsvBtn: 'CSV татах',
    exportCsvToast: 'Зээлийн хуваарь CSV татагдлаа',
    addPaymentReminder: 'Хуваарь нэмэх',
    addedLoanEventToast: 'Зээлийн сануулга хуанлид нэмэгдлээ',
    depositModeLump: 'Хугацаатай',
    depositModeRecurring: 'Сар бүрийн хуримтлал',
    monthlyDepositLabel: 'Сард хийх дүн',
    customRateLabel: 'Хүү (%)',
    rolloverCyclesLabel: 'Нийлмэл сунгалт',
    rolloverBonusLabel: 'Нийлмэл нэмэгдэл',
    maturityDateLabel: 'Дуусах огноо',
    annualYieldLabel: 'Жилийн өгөөж',
    addMaturityReminder: 'Дуусах өдөр нэмэх',
    addedMaturityToast: '{date} хадгаламжийн сануулга нэмэгдлээ',
    monthsUnit: 'сар',
    hpfShort: 'Сан',
  },
  ug: {
    portfolioCommercial: 'سودا قەرزى',
    portfolioProvident: 'ئۆي فوندى',
    portfolioCombined: 'بىرىكمە قەرز',
    commercialAmountLabel: 'سودا قەرز سوممىسى',
    providentAmountLabel: 'فوند قەرز سوممىسى',
    providentRateLabel: 'فوند ئۆسۈمى',
    bpOffsetLabel: 'LPR BP تەڭشەش',
    principalRatioLabel: 'ئەسلى مەبلەغ',
    interestRatioLabel: 'ئۆسۈم نىسبىتى',
    compareTipEqualP: 'تەڭ دىرى بويىچە تېجەيدۇ',
    compareTipEqualPi: 'تەڭ سومما بويىچە تۇنجى ئاي يېنىكلەيدۇ',
    prepayTitle: 'مۇددەتتىن بۇرۇن قايتۇرۇش',
    prepayMonthLabel: 'N-ئايدىن كېيىن',
    prepayAmountLabel: 'قايتۇرۇش سوممىسى',
    prepayShortenTerm: 'مۇددەت قىسقارتىش',
    prepayReducePay: 'ئايلىقنى ئازايتىش',
    prepayNewMonthly: 'يېڭى ئايلىق',
    prepayMonthsSaved: 'قىسقارغان ئاي',
    prepayInterestSaved: 'تېجەلگەن ئۆسۈم',
    scheduleTitle: 'قايتۇرۇش جەدۋىلى',
    scheduleByYear: 'يىللىق خۇلاسە',
    scheduleFirst24: 'تۇنجى 24 ئاي',
    colPeriod: 'قېتىم',
    colPayment: 'قايتۇرۇش',
    colPrincipal: 'ئەسلى مەبلەغ',
    colInterest: 'ئۆسۈم',
    colRemaining: 'قالدۇق',
    yearUnit: '{n}-يىل',
    monthUnit: '{n}-ئاي',
    exportCsvBtn: 'CSV چىقىرىش',
    exportCsvToast: 'قەرز جەدۋىلى CSV چۈشۈرۈلدى',
    addPaymentReminder: 'كالېندارغا قوشۇش',
    addedLoanEventToast: 'قەرز ئەسكەرتمىسى كالېندارغا قوشۇلدى',
    depositModeLump: 'قەرەللىك ئامانەت',
    depositModeRecurring: 'ئايلىق تۇراقلىق',
    monthlyDepositLabel: 'ئايلىق سېلىنما',
    customRateLabel: 'ئۆسۈم (%)',
    rolloverCyclesLabel: 'مۇرەككەپ ئۇزارتىش',
    rolloverBonusLabel: 'قوشۇمچە ئۆسۈم',
    maturityDateLabel: 'مۇددەت توشۇش',
    annualYieldLabel: 'يىللىق نىسبەت',
    addMaturityReminder: 'توشۇش كۈنى قوشۇش',
    addedMaturityToast: '{date} ئامانەت ئەسكەرتمىسى قوشۇلدى',
    monthsUnit: 'ئاي',
    hpfShort: 'فوند',
  },
};

export function getRatesProLabels(lang: Language): RatesProLabels {
  return RATES_PRO_LABELS[lang] || RATES_PRO_LABELS.en;
}
