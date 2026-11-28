import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Strict server-side allowlisted upstream data endpoints (no user-supplied URLs)
const OFFICIAL_ENDPOINTS = {
  cpi: 'https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ECONOMY_CPI&columns=REPORT_DATE,TIME,NATIONAL_SAME,NATIONAL_SEQUENTIAL,CITY_SAME,RURAL_SAME&pageSize=140&sortColumns=REPORT_DATE&sortTypes=-1',
  ppi: 'https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ECONOMY_PPI&columns=REPORT_DATE,TIME,BASE,BASE_SAME&pageSize=140&sortColumns=REPORT_DATE&sortTypes=-1',
  pmi: 'https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ECONOMY_PMI&columns=REPORT_DATE,TIME,MAKE_INDEX,NMAKE_INDEX&pageSize=140&sortColumns=REPORT_DATE&sortTypes=-1',
  rscg: 'https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ECONOMY_TOTAL_RETAIL&columns=REPORT_DATE,TIME,RETAIL_TOTAL,RETAIL_TOTAL_SAME,RETAIL_TOTAL_ACCUMULATE&pageSize=140&sortColumns=REPORT_DATE&sortTypes=-1',
  treasury: 'https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPTA_WEB_TREASURYYIELD&columns=SOLAR_DATE,EMM00166462,EMM00166466,EMM00166469,EMG00001306,EMG00001310,EMG00001312&pageSize=120&sortColumns=SOLAR_DATE&sortTypes=-1',
  rmbLoan: 'https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ECONOMY_RMB_LOAN&columns=REPORT_DATE,LOAN_TOTAL,LOAN_SAME&pageSize=48&sortColumns=REPORT_DATE&sortTypes=-1',
  moneySupply: 'https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ECONOMY_MONEY_SUPPLY&columns=REPORT_DATE,BASIC_CURRENCY_SAME,CURRENCY_SAME&pageSize=48&sortColumns=REPORT_DATE&sortTypes=-1',
  usTreasuryCsv: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/2026/all?type=daily_treasury_yield_curve&field_tdr_date_value=2026&_format=csv',
} as const;

const MEDIA_ENDPOINTS = {
  yicaiLatest: 'https://www.yicai.com/api/ajax/getlatest?page=1&pagesize=25',
  yicaiMacroSearch: 'https://www.yicai.com/api/ajax/getsearch?type=0&key=%E7%A4%BE%E8%9E%8D',
  wsjChinaRss: 'https://feeds.content.dowjones.io/public/rss/RSSMarketsMain',
  wsjEconomyRss: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
} as const;

export interface TriSourceChannelStatus {
  id: 'official' | 'yicai' | 'wsj_cn';
  name: string;
  ok: boolean;
  latencyMs: number;
  headline?: string;
}

export interface TriSourceSeriesPoint {
  period: string;
  value: number;
  secondaryValue?: number;
}

export interface TriSourceSnapshot {
  timestampUtc: number;
  utcIso: string;
  channels: TriSourceChannelStatus[];
  cpi?: {
    period: string;
    yoy: number;
    mom?: number;
    citySame?: number;
    ruralSame?: number;
    history: TriSourceSeriesPoint[];
  };
  ppi?: {
    period: string;
    yoy: number;
    momDelta?: number;
    baseIdx?: number;
    history: TriSourceSeriesPoint[];
  };
  pmi?: {
    period: string;
    mfg: number;
    nonMfg?: number;
    momDiff?: number;
    yoyDiff?: number;
    history: TriSourceSeriesPoint[];
  };
  rscg?: {
    period: string;
    totalTrillion?: number;
    accTrillion?: number;
    yoy: number;
    history: TriSourceSeriesPoint[];
  };
  tsf?: {
    period: string;
    stockTrillion?: number;
    yoy?: number;
    sourceChannel: string;
  };
  cn10y?: {
    date: string;
    yieldPct: number;
    bpsDiff: number;
    y5?: number;
    y30?: number;
    history: TriSourceSeriesPoint[];
  };
  us10y?: {
    date: string;
    yieldPct: number;
    bpsDiff: number;
    y2?: number;
    y30?: number;
    history: TriSourceSeriesPoint[];
  };
  mediaInsights: {
    yicaiHeadlines: string[];
    wsjCnHeadlines: string[];
  };
}

let cachedTriSource: { ts: number; data: TriSourceSnapshot } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function inRange(n: number | null, min: number, max: number): n is number {
  return n !== null && Number.isFinite(n) && n >= min && n <= max;
}

async function fetchJsonSafe(url: string, timeoutMs = 5500): Promise<{ ok: boolean; data: unknown; latencyMs: number }> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MacroCalendarBot/1.0)',
        Accept: 'application/json, text/plain, */*',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const latencyMs = Date.now() - t0;
    if (!res.ok) return { ok: false, data: null, latencyMs };
    const text = await res.text();
    try {
      return { ok: true, data: JSON.parse(text), latencyMs };
    } catch {
      return { ok: false, data: null, latencyMs };
    }
  } catch {
    return { ok: false, data: null, latencyMs: Date.now() - t0 };
  }
}

async function fetchTextSafe(url: string, timeoutMs = 5500): Promise<{ ok: boolean; text: string; latencyMs: number }> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MacroCalendarBot/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml, text/csv, text/plain, */*',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const latencyMs = Date.now() - t0;
    if (!res.ok) return { ok: false, text: '', latencyMs };
    const text = await res.text();
    return { ok: true, text, latencyMs };
  } catch {
    return { ok: false, text: '', latencyMs: Date.now() - t0 };
  }
}

function extractXmlTitles(xml: string, limit = 15): string[] {
  if (!xml) return [];
  const titles: string[] = [];
  const itemRegex = /<item[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>[\s\S]*?<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null && titles.length < limit) {
    const clean = match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (clean) titles.push(clean);
  }
  return titles;
}

function extractMacroSnippetsFromTexts(texts: string[]): {
  tsfStock?: number;
  tsfYoY?: number;
  cpiYoY?: number;
  ppiYoY?: number;
  pmiMfg?: number;
  rscgYoY?: number;
} {
  const out: {
    tsfStock?: number;
    tsfYoY?: number;
    cpiYoY?: number;
    ppiYoY?: number;
    pmiMfg?: number;
    rscgYoY?: number;
  } = {};

  for (const raw of texts) {
    const t = raw.replace(/\s+/g, '');
    if (out.tsfStock === undefined && /社会融资规模存量|社融存量/.test(t)) {
      const mStock = t.match(/([4-6]\d{2}(?:\.\d{1,2})?)万亿/);
      if (mStock) {
        const v = Number(mStock[1]);
        if (inRange(v, 400, 650)) out.tsfStock = Number(v.toFixed(2));
      }
      const mYoY = t.match(/同比(?:增长|增)?([0-9]+(?:\.[0-9])?)%/);
      if (mYoY) {
        const v = Number(mYoY[1]);
        if (inRange(v, 4, 16)) out.tsfYoY = Number(v.toFixed(1));
      }
    }
    if (out.cpiYoY === undefined && /CPI/i.test(t)) {
      const mCpi = t.match(/CPI[^0-9\-+]{0,12}(?:同比(?:上涨|增长|下降|回落)?)\s*([-+]?\d+(?:\.\d)?)%/i);
      if (mCpi) {
        const v = Number(mCpi[1]);
        if (inRange(v, -3, 8)) out.cpiYoY = Number(v.toFixed(1));
      }
    }
    if (out.ppiYoY === undefined && /PPI/i.test(t)) {
      const mPpi = t.match(/PPI[^0-9\-+]{0,12}(?:同比(?:上涨|增长|下降)?)\s*([-+]?\d+(?:\.\d)?)%/i);
      if (mPpi) {
        const v = Number(mPpi[1]);
        if (inRange(v, -8, 15)) out.ppiYoY = Number(v.toFixed(1));
      }
    }
    if (out.pmiMfg === undefined && /制造业PMI/i.test(t)) {
      const mPmi = t.match(/制造业PMI[^\d]{0,10}(\d{2}(?:\.\d)?)/i);
      if (mPmi) {
        const v = Number(mPmi[1]);
        if (inRange(v, 35, 62)) out.pmiMfg = Number(v.toFixed(1));
      }
    }
    if (out.rscgYoY === undefined && /社会消费品零售总额|社零/.test(t)) {
      const mRscg = t.match(/同比(?:增长|下降)?\s*([-+]?\d+(?:\.\d)?)%/);
      if (mRscg) {
        const v = Number(mRscg[1]);
        if (inRange(v, -25, 35)) out.rscgYoY = Number(v.toFixed(1));
      }
    }
  }
  return out;
}

async function buildTriSourceSnapshot(): Promise<TriSourceSnapshot> {
  const now = Date.now();

  const [
    cpiRes,
    ppiRes,
    pmiRes,
    rscgRes,
    treasuryRes,
    usTreasuryCsvRes,
    yicaiLatestRes,
    yicaiSearchRes,
    wsjCnRes,
    wsjEcoRes,
  ] = await Promise.all([
    fetchJsonSafe(OFFICIAL_ENDPOINTS.cpi),
    fetchJsonSafe(OFFICIAL_ENDPOINTS.ppi),
    fetchJsonSafe(OFFICIAL_ENDPOINTS.pmi),
    fetchJsonSafe(OFFICIAL_ENDPOINTS.rscg),
    fetchJsonSafe(OFFICIAL_ENDPOINTS.treasury),
    fetchTextSafe(OFFICIAL_ENDPOINTS.usTreasuryCsv),
    fetchJsonSafe(MEDIA_ENDPOINTS.yicaiLatest),
    fetchJsonSafe(MEDIA_ENDPOINTS.yicaiMacroSearch),
    fetchTextSafe(MEDIA_ENDPOINTS.wsjChinaRss),
    fetchTextSafe(MEDIA_ENDPOINTS.wsjEconomyRss),
  ]);

  const officialOk =
    cpiRes.ok || ppiRes.ok || pmiRes.ok || rscgRes.ok || treasuryRes.ok || usTreasuryCsvRes.ok;

  // Parse Yicai items
  const yicaiItems: string[] = [];
  for (const res of [yicaiLatestRes, yicaiSearchRes]) {
    if (res.ok && res.data && typeof res.data === 'object') {
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray((res.data as Record<string, unknown>).data)
        ? ((res.data as Record<string, unknown>).data as unknown[])
        : [];
      for (const item of list) {
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          const title = String(obj.NewsTitle || obj.title || '').trim();
          const notes = String(obj.NewsNotes || obj.desc || '').trim();
          if (title) yicaiItems.push(notes ? `${title}：${notes}` : title);
        }
      }
    }
  }
  const yicaiOk = yicaiLatestRes.ok || yicaiSearchRes.ok;

  // Parse WSJ Chinese headlines
  const wsjCnHeadlines = [
    ...extractXmlTitles(wsjCnRes.text, 12),
    ...extractXmlTitles(wsjEcoRes.text, 12),
  ].slice(0, 15);
  const wsjOk = (wsjCnRes.ok && wsjCnHeadlines.length > 0) || (wsjEcoRes.ok && wsjCnHeadlines.length > 0);

  const yicaiExtracted = extractMacroSnippetsFromTexts(yicaiItems);
  const wsjExtracted = extractMacroSnippetsFromTexts(wsjCnHeadlines);

  const snapshot: TriSourceSnapshot = {
    timestampUtc: now,
    utcIso: new Date(now).toISOString(),
    channels: [
      {
        id: 'official',
        name: '官方权威数据源 (统计局/央行/财政部)',
        ok: officialOk,
        latencyMs: Math.min(
          cpiRes.latencyMs,
          treasuryRes.latencyMs,
          usTreasuryCsvRes.latencyMs
        ),
      },
      {
        id: 'yicai',
        name: '第一财经 (Yicai)',
        ok: yicaiOk,
        latencyMs: Math.min(yicaiLatestRes.latencyMs, yicaiSearchRes.latencyMs),
        headline: yicaiItems[0]?.slice(0, 80),
      },
      {
        id: 'wsj_cn',
        name: '华尔街日报中文网 (WSJ Chinese)',
        ok: wsjOk,
        latencyMs: Math.min(wsjCnRes.latencyMs, wsjEcoRes.latencyMs),
        headline: wsjCnHeadlines[0]?.slice(0, 80),
      },
    ],
    mediaInsights: {
      yicaiHeadlines: yicaiItems.slice(0, 8),
      wsjCnHeadlines: wsjCnHeadlines.slice(0, 8),
    },
  };

  // Official CPI
  const cpiRows = ((cpiRes.data as { result?: { data?: Record<string, unknown>[] } })?.result?.data || [])
    .filter((r) => String(r.REPORT_DATE || '').slice(0, 7) >= '2016-01' && inRange(toNum(r.NATIONAL_SAME), -4, 10));
  if (cpiRows.length > 0) {
    const latest = cpiRows[0];
    const yoy = toNum(latest.NATIONAL_SAME)!;
    const mom = toNum(latest.NATIONAL_SEQUENTIAL);
    const citySame = toNum(latest.CITY_SAME);
    const ruralSame = toNum(latest.RURAL_SAME);
    snapshot.cpi = {
      period: String(latest.REPORT_DATE || '').slice(0, 7),
      yoy: Number(yoy.toFixed(1)),
      mom: mom !== null ? Number(mom.toFixed(1)) : undefined,
      citySame: citySame !== null ? Number(citySame.toFixed(1)) : undefined,
      ruralSame: ruralSame !== null ? Number(ruralSame.toFixed(1)) : undefined,
      history: [...cpiRows].reverse().map((r) => ({
        period: String(r.REPORT_DATE || '').slice(0, 7),
        value: Number(toNum(r.NATIONAL_SAME)!.toFixed(1)),
      })),
    };
  }

  // Official PPI
  const ppiRows = ((ppiRes.data as { result?: { data?: Record<string, unknown>[] } })?.result?.data || [])
    .filter((r) => String(r.REPORT_DATE || '').slice(0, 7) >= '2016-01' && inRange(toNum(r.BASE_SAME), -10, 20));
  if (ppiRows.length > 0) {
    const latest = ppiRows[0];
    const prev = ppiRows[1];
    const yoy = toNum(latest.BASE_SAME)!;
    const prevYoy = prev ? toNum(prev.BASE_SAME) : yoy;
    const baseIdx = toNum(latest.BASE);
    snapshot.ppi = {
      period: String(latest.REPORT_DATE || '').slice(0, 7),
      yoy: Number(yoy.toFixed(1)),
      momDelta: prevYoy !== null ? Number((yoy - prevYoy).toFixed(1)) : undefined,
      baseIdx: baseIdx !== null ? Number(baseIdx.toFixed(1)) : undefined,
      history: [...ppiRows].reverse().map((r) => ({
        period: String(r.REPORT_DATE || '').slice(0, 7),
        value: Number(toNum(r.BASE_SAME)!.toFixed(1)),
      })),
    };
  }

  // Official PMI
  const pmiRows = ((pmiRes.data as { result?: { data?: Record<string, unknown>[] } })?.result?.data || [])
    .filter((r) => String(r.REPORT_DATE || '').slice(0, 7) >= '2016-01' && inRange(toNum(r.MAKE_INDEX), 30, 65));
  if (pmiRows.length > 0) {
    const latest = pmiRows[0];
    const prev = pmiRows[1];
    const prevYear = pmiRows[12];
    const mfg = toNum(latest.MAKE_INDEX)!;
    const nonMfg = toNum(latest.NMAKE_INDEX);
    const prevMfg = prev ? toNum(prev.MAKE_INDEX) : mfg;
    const prevYearMfg = prevYear ? toNum(prevYear.MAKE_INDEX) : mfg;
    snapshot.pmi = {
      period: String(latest.REPORT_DATE || '').slice(0, 7),
      mfg: Number(mfg.toFixed(1)),
      nonMfg: nonMfg !== null ? Number(nonMfg.toFixed(1)) : undefined,
      momDiff: prevMfg !== null ? Number((mfg - prevMfg).toFixed(1)) : undefined,
      yoyDiff: prevYearMfg !== null ? Number((mfg - prevYearMfg).toFixed(1)) : undefined,
      history: [...pmiRows].reverse().map((r) => ({
        period: String(r.REPORT_DATE || '').slice(0, 7),
        value: Number(toNum(r.MAKE_INDEX)!.toFixed(1)),
      })),
    };
  }

  // Official RSCG
  const rscgRows = ((rscgRes.data as { result?: { data?: Record<string, unknown>[] } })?.result?.data || [])
    .filter((r) => String(r.REPORT_DATE || '').slice(0, 7) >= '2016-01' && inRange(toNum(r.RETAIL_TOTAL_SAME), -30, 45));
  if (rscgRows.length > 0) {
    const latest = rscgRows[0];
    const yoy = toNum(latest.RETAIL_TOTAL_SAME)!;
    const totalYi = toNum(latest.RETAIL_TOTAL);
    const accYi = toNum(latest.RETAIL_TOTAL_ACCUMULATE);
    snapshot.rscg = {
      period: String(latest.REPORT_DATE || '').slice(0, 7),
      totalTrillion: totalYi && totalYi > 0 ? Number((totalYi / 10000).toFixed(2)) : undefined,
      accTrillion: accYi && accYi > 0 ? Number((accYi / 10000).toFixed(2)) : undefined,
      yoy: Number(yoy.toFixed(1)),
      history: [...rscgRows].reverse().map((r) => ({
        period: String(r.REPORT_DATE || '').slice(0, 7),
        value: Number(toNum(r.RETAIL_TOTAL_SAME)!.toFixed(1)),
      })),
    };
  }

  // TSF reconciliation from Yicai + WSJ Chinese when official API is unreachable or missing TSF table
  const tsfStock = yicaiExtracted.tsfStock ?? wsjExtracted.tsfStock;
  const tsfYoY = yicaiExtracted.tsfYoY ?? wsjExtracted.tsfYoY;
  if (tsfStock !== undefined || tsfYoY !== undefined) {
    snapshot.tsf = {
      period: snapshot.cpi?.period || '2026-10',
      stockTrillion: tsfStock,
      yoy: tsfYoY,
      sourceChannel:
        yicaiExtracted.tsfStock !== undefined || yicaiExtracted.tsfYoY !== undefined
          ? '第一财经'
          : '华尔街日报中文网',
    };
  }

  // Official CN & US 10Y Treasury yields
  const yieldRows = ((treasuryRes.data as { result?: { data?: Record<string, unknown>[] } })?.result?.data || [])
    .filter((r) => String(r.SOLAR_DATE || '').slice(0, 10) >= '2016-01-01');
  const cnRows = yieldRows.filter((r) => inRange(toNum(r.EMM00166466), 0.5, 6.0));
  const usRows = yieldRows.filter((r) => inRange(toNum(r.EMG00001310), 0.2, 8.0));

  if (cnRows.length > 0) {
    const latest = cnRows[0];
    const prev = cnRows[1];
    const val = toNum(latest.EMM00166466)!;
    const prevVal = prev ? toNum(prev.EMM00166466) : val;
    snapshot.cn10y = {
      date: String(latest.SOLAR_DATE || '').slice(0, 10),
      yieldPct: Number(val.toFixed(2)),
      bpsDiff: prevVal !== null ? Math.round((val - prevVal) * 100) : 0,
      y5: toNum(latest.EMM00166462) ?? undefined,
      y30: toNum(latest.EMM00166469) ?? undefined,
      history: [...cnRows].reverse().map((r) => ({
        period: String(r.SOLAR_DATE || '').slice(0, 7),
        value: Number(toNum(r.EMM00166466)!.toFixed(2)),
      })),
    };
  }

  if (usRows.length > 0) {
    const latest = usRows[0];
    const prev = usRows[1];
    const val = toNum(latest.EMG00001310)!;
    const prevVal = prev ? toNum(prev.EMG00001310) : val;
    snapshot.us10y = {
      date: String(latest.SOLAR_DATE || '').slice(0, 10),
      yieldPct: Number(val.toFixed(2)),
      bpsDiff: prevVal !== null ? Math.round((val - prevVal) * 100) : 0,
      y2: toNum(latest.EMG00001306) ?? undefined,
      y30: toNum(latest.EMG00001312) ?? undefined,
      history: [...usRows].reverse().map((r) => ({
        period: String(r.SOLAR_DATE || '').slice(0, 7),
        value: Number(toNum(r.EMG00001310)!.toFixed(2)),
      })),
    };
  } else if (usTreasuryCsvRes.ok && usTreasuryCsvRes.text) {
    // Parse US Treasury official CSV if Eastmoney US yield column is absent
    const lines = usTreasuryCsvRes.text.trim().split(/\r?\n/);
    if (lines.length >= 2) {
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const dateIdx = headers.findIndex((h) => /date/i.test(h));
      const y10Idx = headers.findIndex((h) => /^10\s*yr/i.test(h));
      const y2Idx = headers.findIndex((h) => /^2\s*yr/i.test(h));
      const y30Idx = headers.findIndex((h) => /^30\s*yr/i.test(h));
      if (dateIdx >= 0 && y10Idx >= 0) {
        const parsed: Array<{ date: string; y10: number; y2?: number; y30?: number }> = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          const y10 = toNum(cols[y10Idx]);
          const rawDate = cols[dateIdx];
          if (rawDate && inRange(y10, 0.2, 8.0)) {
            const mdy = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            const isoDate = mdy ? `${mdy[3]}-${mdy[1]}-${mdy[2]}` : rawDate.slice(0, 10);
            parsed.push({
              date: isoDate,
              y10: Number(y10.toFixed(2)),
              y2: y2Idx >= 0 ? toNum(cols[y2Idx]) ?? undefined : undefined,
              y30: y30Idx >= 0 ? toNum(cols[y30Idx]) ?? undefined : undefined,
            });
          }
        }
        parsed.sort((a, b) => b.date.localeCompare(a.date));
        if (parsed.length > 0) {
          const latest = parsed[0];
          const prev = parsed[1] || latest;
          snapshot.us10y = {
            date: latest.date,
            yieldPct: latest.y10,
            bpsDiff: Math.round((latest.y10 - prev.y10) * 100),
            y2: latest.y2,
            y30: latest.y30,
            history: [...parsed].reverse().map((p) => ({
              period: p.date.slice(0, 7),
              value: p.y10,
            })),
          };
        }
      }
    }
  }

  return snapshot;
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestampUtc: Date.now() });
  });

  app.get('/api/macro/tri-source', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const force = req.query.force === '1';
    try {
      if (!force && cachedTriSource && Date.now() - cachedTriSource.ts < CACHE_TTL_MS) {
        res.json(cachedTriSource.data);
        return;
      }
      const data = await buildTriSourceSnapshot();
      cachedTriSource = { ts: Date.now(), data };
      res.json(data);
    } catch {
      if (cachedTriSource) {
        res.json(cachedTriSource.data);
        return;
      }
      res.status(200).json({
        timestampUtc: Date.now(),
        utcIso: new Date().toISOString(),
        channels: [
          { id: 'official', name: '官方权威数据源', ok: false, latencyMs: 0 },
          { id: 'yicai', name: '第一财经 (Yicai)', ok: false, latencyMs: 0 },
          { id: 'wsj_cn', name: '华尔街日报中文网 (WSJ Chinese)', ok: false, latencyMs: 0 },
        ],
        mediaInsights: { yicaiHeadlines: [], wsjCnHeadlines: [] },
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        next();
        return;
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
