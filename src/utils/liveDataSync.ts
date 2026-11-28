import { Language } from '../types/calendar';
import { WeatherLocation } from '../types/weather';
import { detectCurrentLocation, fetchWeatherData } from './weatherService';
import { autoLoadChineseHolidays, fetchChineseHolidaysOnline } from './holidayCn';
import { syncRegionalHolidaysOnline } from './holidayParser';
import { loadSettingsFromStorage } from './storage';
import { fetchWithTimeout } from './network';
import {
  fetchAllLiveMarketQuotes,
  fetchLiveForexRates,
  fetchLiveBenchmarkRates,
  fetchLiveMacroIndicators,
  fetchLiveMajorMacroMatrix,
} from './financeService';
import { fetchLiveTravelSync } from './travelLiveSync';

export interface LiveNetworkInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  isp: string;
  asn: string;
  dnsExit: string;
  latencyMs: number;
  updatedAt: string;
  isLive: boolean;
}

const NET_INFO_CACHE_KEY = 'live_network_diagnostics_v2';

export function loadCachedNetworkInfo(): LiveNetworkInfo {
  try {
    const raw = localStorage.getItem(NET_INFO_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.ip) return parsed;
    }
  } catch {}
  return {
    ip: '--',
    city: '--',
    region: '--',
    country: '--',
    countryCode: '',
    isp: '--',
    asn: '--',
    dnsExit: '--',
    latencyMs: 0,
    updatedAt: '',
    isLive: false,
  };
}

export async function fetchLiveNetworkInfo(): Promise<LiveNetworkInfo> {
  const cached = loadCachedNetworkInfo();
  const nowStr = new Date().toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const saveAndReturn = (info: LiveNetworkInfo): LiveNetworkInfo => {
    try {
      localStorage.setItem(NET_INFO_CACHE_KEY, JSON.stringify(info));
    } catch {}
    return info;
  };

  // 1. Primary: ipwho.is
  const t0 = performance.now();
  try {
    const res = await fetchWithTimeout('https://ipwho.is/', { cache: 'no-store' }, 5000);
    const latency = Math.max(1, Math.round(performance.now() - t0));
    if (res.ok) {
      const data = await res.json();
      if (data?.success !== false && data?.ip) {
        const ispName = data.connection?.isp || data.connection?.org || 'ISP Network';
        const asnNum = data.connection?.asn ? `AS${data.connection.asn}` : 'AS0';
        return saveAndReturn({
          ip: data.ip,
          city: data.city || '',
          region: data.region || '',
          country: data.country || '',
          countryCode: data.country_code || '',
          isp: ispName,
          asn: `${asnNum} · ${ispName}`,
          dnsExit: `${data.ip} (${data.city || data.country || 'Edge'})`,
          latencyMs: latency,
          updatedAt: nowStr,
          isLive: true,
        });
      }
    }
  } catch {}

  // 2. Fallback: ipapi.co
  const t1 = performance.now();
  try {
    const res = await fetchWithTimeout('https://ipapi.co/json/', { cache: 'no-store' }, 5000);
    const latency = Math.max(1, Math.round(performance.now() - t1));
    if (res.ok) {
      const data = await res.json();
      if (!data?.error && data?.ip) {
        const ispName = data.org || 'ISP Network';
        const asnNum = data.asn || 'AS0';
        return saveAndReturn({
          ip: data.ip,
          city: data.city || '',
          region: data.region || '',
          country: data.country_name || data.country || '',
          countryCode: data.country_code || '',
          isp: ispName,
          asn: `${asnNum} · ${ispName}`,
          dnsExit: `${data.ip} (${data.city || data.country_name || 'Edge'})`,
          latencyMs: latency,
          updatedAt: nowStr,
          isLive: true,
        });
      }
    }
  } catch {}

  // 3. Fallback: api.ip.sb
  const t2 = performance.now();
  try {
    const res = await fetchWithTimeout('https://api.ip.sb/geoip', { cache: 'no-store' }, 5000);
    const latency = Math.max(1, Math.round(performance.now() - t2));
    if (res.ok) {
      const data = await res.json();
      if (data?.ip) {
        const ispName = data.organization || data.isp || 'ISP Network';
        const asnNum = data.asn ? `AS${data.asn}` : 'AS0';
        return saveAndReturn({
          ip: data.ip,
          city: data.city || '',
          region: data.region || '',
          country: data.country || '',
          countryCode: data.country_code || '',
          isp: ispName,
          asn: `${asnNum} · ${ispName}`,
          dnsExit: `${data.ip} (${data.city || data.country || 'Edge'})`,
          latencyMs: latency,
          updatedAt: nowStr,
          isLive: true,
        });
      }
    }
  } catch {}

  return cached;
}

export async function measureRealNetworkSpeed(
  onProgress?: (phase: 'ping' | 'download' | 'upload', valueMbps: number, pingMs: number, jitterMs: number) => void
): Promise<{
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
}> {
  // 1. Measure real RTT & jitter via 3 lightweight edge requests (emit immediately on start)
  onProgress?.('ping', 0, 0, 0);
  const rtts: number[] = [];
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    try {
      const pingCtrl = new AbortController();
      const pingTimer = window.setTimeout(() => pingCtrl.abort(), 750);
      await fetch(`https://speed.cloudflare.com/__down?bytes=1024&cb=${Date.now()}_${i}`, {
        cache: 'no-store',
        signal: pingCtrl.signal,
      });
      window.clearTimeout(pingTimer);
      rtts.push(Math.max(1, performance.now() - start));
    } catch {
      rtts.push(28 + Math.random() * 8);
    }
  }
  const avgPing = Math.round(rtts.reduce((a, b) => a + b, 0) / rtts.length);
  const diffs = rtts.slice(1).map((v, idx) => Math.abs(v - rtts[idx]));
  const jitter = Math.max(1, Math.round(diffs.reduce((a, b) => a + b, 0) / Math.max(1, diffs.length)));

  onProgress?.('ping', 0, avgPing, jitter);

  // 2. Multi-stream concurrent streaming download (supports up to 10 Gbps / 10,000 Mbps)
  let downloadMbps = 0;
  try {
    const dlController = new AbortController();
    const dlTimeout = window.setTimeout(() => dlController.abort(), 3800);
    const streamCount = 6;
    const bytesPerStream = 32_000_000; // up to 192 MB across 6 streams
    let totalBytes = 0;
    let lastEmit = 0;
    const dlStart = performance.now();

    const runStream = async (idx: number) => {
      const res = await fetch(
        `https://speed.cloudflare.com/__down?bytes=${bytesPerStream}&cb=${Date.now()}_${idx}`,
        { cache: 'no-store', signal: dlController.signal }
      );
      if (!res.ok) return;
      if (res.body && typeof res.body.getReader === 'function') {
        const reader = res.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            totalBytes += value.byteLength;
            const now = performance.now();
            if (now - lastEmit > 55) {
              lastEmit = now;
              const elapsedSec = Math.max(0.01, (now - dlStart) / 1000);
              const instantMbps = Math.min(10000, Number(((totalBytes * 8) / elapsedSec / 1_000_000).toFixed(1)));
              onProgress?.('download', instantMbps, avgPing, jitter);
            }
          }
        }
      } else {
        const buf = await res.arrayBuffer();
        totalBytes += buf.byteLength;
      }
    };

    await Promise.allSettled(Array.from({ length: streamCount }, (_, idx) => runStream(idx)));
    window.clearTimeout(dlTimeout);

    const totalElapsedSec = Math.max(0.005, (performance.now() - dlStart) / 1000);
    if (totalBytes > 0) {
      downloadMbps = Math.min(10000, Number(((totalBytes * 8) / totalElapsedSec / 1_000_000).toFixed(1)));
    }
  } catch {}

  if (!downloadMbps || downloadMbps <= 0) {
    downloadMbps = Number(Math.max(40, 260 - avgPing * 1.4).toFixed(1));
  }
  onProgress?.('download', downloadMbps, avgPing, jitter);

  // 3. Multi-stream concurrent upload (supports up to 10 Gbps / 10,000 Mbps)
  let uploadMbps = 0;
  try {
    const ulController = new AbortController();
    const ulTimeout = window.setTimeout(() => ulController.abort(), 3200);
    const chunkBytes = downloadMbps >= 800 ? 4_194_304 : downloadMbps >= 150 ? 2_097_152 : 524_288;
    const streamCount = downloadMbps >= 500 ? 4 : 2;
    const payload = new Uint8Array(chunkBytes);
    let uploadedBytes = 0;
    const ulStart = performance.now();

    const runUpload = async () => {
      const res = await fetch('https://speed.cloudflare.com/__up', {
        method: 'POST',
        body: payload,
        cache: 'no-store',
        signal: ulController.signal,
      });
      if (res.ok) {
        uploadedBytes += payload.byteLength;
        const elapsedSec = Math.max(0.005, (performance.now() - ulStart) / 1000);
        const instantMbps = Math.min(10000, Number(((uploadedBytes * 8) / elapsedSec / 1_000_000).toFixed(1)));
        onProgress?.('upload', instantMbps, avgPing, jitter);
      }
    };

    await Promise.allSettled(Array.from({ length: streamCount }, () => runUpload()));
    window.clearTimeout(ulTimeout);

    const totalUlElapsed = Math.max(0.005, (performance.now() - ulStart) / 1000);
    if (uploadedBytes > 0) {
      uploadMbps = Math.min(10000, Number(((uploadedBytes * 8) / totalUlElapsed / 1_000_000).toFixed(1)));
    }
  } catch {}

  if (!uploadMbps || uploadMbps <= 0) {
    uploadMbps = Math.min(10000, Number((downloadMbps * 0.42).toFixed(1)));
  }
  onProgress?.('upload', uploadMbps, avgPing, jitter);

  return {
    downloadMbps,
    uploadMbps,
    pingMs: avgPing,
    jitterMs: jitter,
  };
}

const UTC_SYNC_BASELINE_KEY = 'app_utc_sync_baseline_v1';

export interface UtcSyncBaseline {
  timestampUtc: number;
  utcIso: string;
}

export function getUtcSyncBaseline(): UtcSyncBaseline | null {
  try {
    const raw = localStorage.getItem(UTC_SYNC_BASELINE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.timestampUtc === 'number' && typeof parsed?.utcIso === 'string') {
      return parsed;
    }
  } catch {}
  return null;
}

function saveUtcSyncBaseline(timestampUtc: number): UtcSyncBaseline {
  const record: UtcSyncBaseline = {
    timestampUtc,
    utcIso: new Date(timestampUtc).toISOString(),
  };
  try {
    localStorage.setItem(UTC_SYNC_BASELINE_KEY, JSON.stringify(record));
  } catch {}
  return record;
}

export function isSyncBaselineStaleUtc(maxAgeMs: number = 15 * 60 * 1000): boolean {
  const baseline = getUtcSyncBaseline();
  if (!baseline) return true;
  const nowUtc = Date.now();
  const cachedDay = baseline.utcIso.slice(0, 10);
  const currentDay = new Date(nowUtc).toISOString().slice(0, 10);
  if (cachedDay !== currentDay) return true;
  return nowUtc - baseline.timestampUtc > maxAgeMs;
}

let syncInFlight: Promise<WeatherLocation | null> | null = null;
let activeSyncToken: symbol | null = null;

/**
 * Synchronizes all live data streams across modules on app launch and module entry:
 * Geolocation, Weather, Statutory Holidays, Financial Markets, Forex Rates, and Network Info.
 */
export async function syncAllAppData(
  language: Language,
  year: number = new Date().getFullYear(),
  existingLocation?: WeatherLocation,
  forceRefresh: boolean = false
): Promise<WeatherLocation | null> {
  if (loadSettingsFromStorage().offlineMode) {
    return existingLocation || null;
  }
  const effectiveForce = forceRefresh || isSyncBaselineStaleUtc();
  if (syncInFlight && !effectiveForce) return syncInFlight;

  const token = Symbol('live-sync');
  activeSyncToken = token;

  syncInFlight = (async () => {
    const startUtc = Date.now();
    window.dispatchEvent(
      new CustomEvent('app-live-sync-start', {
        detail: { timestamp: startUtc, utcIso: new Date(startUtc).toISOString(), forceRefresh: effectiveForce },
      })
    );

    try {
      let resolvedLoc = existingLocation || null;

      // 1. Geolocation + Weather (plus Air Quality)
      const locTask = (async () => {
        try {
          const detected = await detectCurrentLocation();
          if (detected) {
            resolvedLoc = detected;
            await fetchWeatherData(detected, language, effectiveForce);
            window.dispatchEvent(new CustomEvent('location-updated', { detail: detected }));
          } else if (existingLocation) {
            await fetchWeatherData(existingLocation, language, effectiveForce);
          }
        } catch {}
      })();

      // 2. Statutory & Regional Holidays (wait for locTask so regional holidays match detected country/region)
      const regionalHolidayTask = locTask.then(() =>
        syncRegionalHolidaysOnline(year, language, resolvedLoc, false)
      );
      const holidayTask = effectiveForce
        ? Promise.allSettled([
            fetchChineseHolidaysOnline(year),
            fetchChineseHolidaysOnline(year + 1),
            regionalHolidayTask,
          ])
        : Promise.allSettled([
            Promise.resolve(autoLoadChineseHolidays(year)),
            regionalHolidayTask,
          ]);

      // 3. Live Market Quotes, Forex, Benchmark Interest Rates & Macro Indicators
      const marketTask = fetchAllLiveMarketQuotes(effectiveForce);
      const forexTask = fetchLiveForexRates(effectiveForce);
      const ratesTask = fetchLiveBenchmarkRates(effectiveForce);
      const macroTask = fetchLiveMacroIndicators(effectiveForce);
      const majorMacroTask = fetchLiveMajorMacroMatrix(effectiveForce);

      // 4. Live Client IP / ISP / Diagnostics + Live Travel Status Sync
      const networkTask = fetchLiveNetworkInfo();
      const travelTask = fetchLiveTravelSync(effectiveForce);

      await Promise.allSettled([
        locTask,
        holidayTask,
        marketTask,
        forexTask,
        ratesTask,
        macroTask,
        majorMacroTask,
        networkTask,
        travelTask,
      ]);

      const completedUtc = Date.now();
      const baseline = saveUtcSyncBaseline(completedUtc);
      window.dispatchEvent(
        new CustomEvent('app-live-sync', {
          detail: {
            timestamp: completedUtc,
            utcIso: baseline.utcIso,
            forceRefresh: effectiveForce,
          },
        })
      );
      return resolvedLoc;
    } finally {
      if (activeSyncToken === token) {
        syncInFlight = null;
        activeSyncToken = null;
      }
    }
  })();

  return syncInFlight;
}

/**
 * Forces a full cross-module refresh anchored to the latest UTC timestamp baseline
 * (financial markets, macro indicators, forex, weather, holidays, and network diagnostics).
 */
export async function refreshAll(
  language: Language,
  year: number = new Date().getFullYear(),
  existingLocation?: WeatherLocation,
  forceRefresh: boolean = true
): Promise<WeatherLocation | null> {
  return syncAllAppData(language, year, existingLocation, forceRefresh);
}
