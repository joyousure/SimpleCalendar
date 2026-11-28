export interface LunarInfo {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeap: boolean;
  lunarMonthName: string;
  lunarDayName: string;
  solarTerm?: string;
  lunarFestival?: string;
  solarFestival?: string;
  ganZhiYear: string;
  ganZhiMonth: string;
  ganZhiDay: string;
  zodiac: string;
  fullGanZhi: string;
  yi: string[];
  ji: string[];
}

const LUNAR_MONTH_NAMES = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月'
];

const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
];

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZODIAC_ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 1900-2100 standard Chinese lunar data (201 years)
// 0x04bd8: 1900 ...
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d260,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
  0x0d520
];

const YI_POOL = [
  '祭祀', '祈福', '嫁娶', '出行', '开市', '交易', '纳财', '入宅', '安床', '安门', '修造', '动土', '签约', '进学', '会友'
];

const JI_POOL = [
  '破土', '安葬', '开仓', '掘井', '伐木', '行丧', '出火', '词讼', '针灸', '置产', '作灶'
];

// Helper functions for Lunar bitmask
function getLunarYearDays(y: number): number {
  let sum = 348;
  const info = LUNAR_INFO[y - 1900];
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (info & i) ? 1 : 0;
  }
  return sum + getLeapMonthDays(y);
}

function getLeapMonth(y: number): number {
  return LUNAR_INFO[y - 1900] & 0xf;
}

function getLeapMonthDays(y: number): number {
  if (getLeapMonth(y)) {
    return (LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

function getLunarMonthDays(y: number, m: number): number {
  return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29;
}

const SOLAR_TERM_NAMES = [
  '春分', '清明', '谷雨', '立夏', '小满', '芒种',
  '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
  '秋分', '寒露', '霜降', '立冬', '小雪', '大雪',
  '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰',
] as const;

function toJulianDayUtc(year: number, month: number, day: number, utcHour: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + utcHour / 24 + b - 1524.5;
}

function getSolarLongitudeDeg(jd: number): number {
  const n = jd - 2451545.0;
  const g = ((357.528 + 0.9856003 * n) * Math.PI) / 180;
  const q = 280.46 + 0.9856474 * n;
  const lon = q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g);
  return ((lon % 360) + 360) % 360;
}

export function getExactSolarTerm(date: Date): string | undefined {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  // Beijing time (UTC+8) day window: [day 00:00 CST = -8h UTC, day 24:00 CST = +16h UTC]
  const jdStart = toJulianDayUtc(y, m, d, -8);
  const jdEnd = jdStart + 1;
  const lonStart = getSolarLongitudeDeg(jdStart);
  const lonEnd = getSolarLongitudeDeg(jdEnd);

  const segStart = Math.floor(lonStart / 15);
  const segEnd = Math.floor(lonEnd / 15);
  if (segStart !== segEnd) {
    const idx = ((segEnd % 24) + 24) % 24;
    return SOLAR_TERM_NAMES[idx];
  }
  return undefined;
}

export interface UpcomingSolarTerm {
  name: string;
  date: Date;
  dateString: string;
  daysAway: number;
}

export function getUpcomingSolarTerms(fromDate: Date, count = 4): UpcomingSolarTerm[] {
  const base = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const results: UpcomingSolarTerm[] = [];
  for (let offset = 0; offset <= 120 && results.length < count; offset++) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    const term = getExactSolarTerm(d);
    if (term) {
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      results.push({
        name: term,
        date: d,
        dateString: `${yy}-${mm}-${dd}`,
        daysAway: offset,
      });
    }
  }
  return results;
}

export function getLunarInfo(solarDate: Date): LunarInfo {
  const y = solarDate.getFullYear();
  const m = solarDate.getMonth() + 1;
  const d = solarDate.getDate();

  // Base date: 1900-01-31 is Lunar Year 1900 正月初一 (庚子年 丁丑月 甲午日)
  const baseDate = new Date(1900, 0, 31);
  let offsetDays = Math.floor((new Date(y, m - 1, d).getTime() - baseDate.getTime()) / 86400000);

  let lunarYear = 1900;
  let daysInYear = 0;
  for (let i = 1900; i < 2100 && offsetDays > 0; i++) {
    daysInYear = getLunarYearDays(i);
    if (offsetDays < daysInYear) {
      lunarYear = i;
      break;
    }
    offsetDays -= daysInYear;
    lunarYear = i + 1;
  }

  const leapMonth = getLeapMonth(lunarYear);
  let isLeap = false;
  let lunarMonth = 1;
  let daysInMonth = 0;

  for (let i = 1; i <= 12; i++) {
    // Regular month
    if (leapMonth > 0 && i === (leapMonth + 1) && !isLeap) {
      isLeap = true;
      i--;
      daysInMonth = getLeapMonthDays(lunarYear);
    } else {
      daysInMonth = getLunarMonthDays(lunarYear, i);
      isLeap = false;
    }

    if (offsetDays < daysInMonth) {
      lunarMonth = i;
      break;
    }
    offsetDays -= daysInMonth;
  }

  const lunarDay = offsetDays + 1;

  // GanZhi calculation:
  // Year GanZhi (1900 is 庚子)
  const yearIdx = (lunarYear - 4) % 60;
  const ganZhiYear = `${TIAN_GAN[yearIdx % 10]}${DI_ZHI[yearIdx % 12]}年`;
  const zodiac = ZODIAC_ANIMALS[yearIdx % 12];

  // Month GanZhi
  // Wu Hu Dun (五虎遁): Year Gan determines month Gan for 正月 (寅月)
  const yearGanIdx = (lunarYear - 4) % 10;
  const monthGanBase = (yearGanIdx % 5) * 2 + 2; // 正月天干
  const monthGanIdx = (monthGanBase + (lunarMonth - 1)) % 10;
  const monthZhiIdx = (lunarMonth + 1) % 12; // 正月为寅(2)
  const ganZhiMonth = `${TIAN_GAN[monthGanIdx]}${DI_ZHI[monthZhiIdx]}月`;

  // Day GanZhi (1900-01-31 is 甲午日, index 30 in 60-cycle: 甲=0, 午=6)
  const totalDaysFromRef = Math.floor((new Date(y, m - 1, d).getTime() - new Date(1900, 0, 31).getTime()) / 86400000);
  const dayCycleIdx = (30 + totalDaysFromRef) % 60;
  const positiveDayIdx = (dayCycleIdx + 60) % 60;
  const ganZhiDay = `${TIAN_GAN[positiveDayIdx % 10]}${DI_ZHI[positiveDayIdx % 12]}日`;

  const stemBranchYear = `${TIAN_GAN[yearIdx % 10]}${DI_ZHI[yearIdx % 12]}`;
  const fullGanZhi = `${stemBranchYear}${zodiac}年${ganZhiMonth}${ganZhiDay}`;

  const lunarMonthName = `${isLeap ? '闰' : ''}${LUNAR_MONTH_NAMES[(lunarMonth - 1) % 12]}`;
  const lunarDayName = LUNAR_DAY_NAMES[(lunarDay - 1) % 30] || '初一';

  // Exact 24 Solar Terms
  const solarTerm = getExactSolarTerm(solarDate);

  // Traditional Lunar Festivals
  let lunarFestival: string | undefined;
  if (!isLeap) {
    if (lunarMonth === 1 && lunarDay === 1) lunarFestival = '春节';
    else if (lunarMonth === 1 && lunarDay === 15) lunarFestival = '元宵节';
    else if (lunarMonth === 2 && lunarDay === 2) lunarFestival = '龙抬头';
    else if (lunarMonth === 5 && lunarDay === 5) lunarFestival = '端午节';
    else if (lunarMonth === 7 && lunarDay === 7) lunarFestival = '七夕节';
    else if (lunarMonth === 7 && lunarDay === 15) lunarFestival = '中元节';
    else if (lunarMonth === 8 && lunarDay === 15) lunarFestival = '中秋节';
    else if (lunarMonth === 9 && lunarDay === 9) lunarFestival = '重阳节';
    else if (lunarMonth === 12 && lunarDay === 8) lunarFestival = '腊八节';
    else if (lunarMonth === 12 && lunarDay === 23) lunarFestival = '北方小年';
    else if (lunarMonth === 12 && lunarDay === 24) lunarFestival = '南方小年';
    else if (lunarMonth === 12 && lunarDay >= 29) {
      // Check if this is the last day of lunar 12th month
      const daysInDec = getLunarMonthDays(lunarYear, 12);
      if (lunarDay === daysInDec) lunarFestival = '除夕';
    }
  }

  // Yi & Ji calculation based on Day GanZhi
  const seed = (positiveDayIdx * 7 + y + m + d) % 1000;
  const yiCount = 3 + (seed % 3);
  const jiCount = 2 + ((seed >> 2) % 3);

  const yi: string[] = [];
  const ji: string[] = [];
  for (let i = 0; i < yiCount; i++) {
    const item = YI_POOL[(seed + i * 3) % YI_POOL.length];
    if (!yi.includes(item)) yi.push(item);
  }
  for (let i = 0; i < jiCount; i++) {
    const item = JI_POOL[(seed + i * 5) % JI_POOL.length];
    if (!ji.includes(item) && !yi.includes(item)) ji.push(item);
  }

  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeap,
    lunarMonthName,
    lunarDayName,
    solarTerm,
    lunarFestival,
    ganZhiYear,
    ganZhiMonth,
    ganZhiDay,
    zodiac,
    fullGanZhi,
    yi,
    ji,
  };
}

export function formatGanzhiFull(input: LunarInfo | Date): string {
  if (input instanceof Date) {
    return getLunarInfo(input).fullGanZhi;
  }
  return input.fullGanZhi;
}
