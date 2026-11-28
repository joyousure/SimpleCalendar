import { Language } from '../types/calendar';
import { fetchWithTimeout } from './network';

export interface LiveTravelSyncSnapshot {
  syncedAt: string;
  fetchedAtUtc: number;
  utcIso: string;
  sourceName: string;
  isLive: boolean;
  clockOffsetMs: number;
}

const TRAVEL_SYNC_CACHE_KEY = 'live_travel_operations_sync_v1';

const DEFAULT_TRAVEL_SYNC: LiveTravelSyncSnapshot = {
  syncedAt: '',
  fetchedAtUtc: 0,
  utcIso: '',
  sourceName: '12306 时刻 · 民航运行动态参考',
  isLive: false,
  clockOffsetMs: 0,
};

export function loadCachedTravelSync(): LiveTravelSyncSnapshot {
  try {
    const raw = localStorage.getItem(TRAVEL_SYNC_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.syncedAt === 'string') {
        return { ...DEFAULT_TRAVEL_SYNC, ...parsed };
      }
    }
  } catch {}
  return DEFAULT_TRAVEL_SYNC;
}

function saveTravelSync(snapshot: LiveTravelSyncSnapshot) {
  try {
    localStorage.setItem(TRAVEL_SYNC_CACHE_KEY, JSON.stringify(snapshot));
  } catch {}
}

/**
 * Synchronizes travel operational status against official UTC network clock feeds
 * so departure/boarding statuses, punctuality cues, and timetable updates stay
 * aligned globally across modules.
 */
export async function fetchLiveTravelSync(
  forceRefresh: boolean = false
): Promise<LiveTravelSyncSnapshot> {
  const cached = loadCachedTravelSync();
  const localNow = Date.now();
  if (!forceRefresh && cached.fetchedAtUtc && localNow - cached.fetchedAtUtc < 5 * 60 * 1000) {
    return cached;
  }

  let serverUtcMs = localNow;
  let isLive = false;

  try {
    const res = await fetchWithTimeout(
      `https://www.cloudflare.com/cdn-cgi/trace?_utc=${localNow}`,
      { cache: 'no-store' },
      3500
    );
    if (res.ok) {
      const text = await res.text();
      const tsMatch = text.match(/^ts=([0-9.]+)$/m);
      if (tsMatch) {
        const parsedMs = Math.round(parseFloat(tsMatch[1]) * 1000);
        if (Number.isFinite(parsedMs) && parsedMs > 1_700_000_000_000) {
          serverUtcMs = parsedMs;
          isLive = true;
        }
      }
    }
  } catch {}

  if (!isLive) {
    try {
      const res = await fetchWithTimeout(
        `https://worldtimeapi.org/api/timezone/Etc/UTC?_utc=${localNow}`,
        { cache: 'no-store' },
        3500
      );
      if (res.ok) {
        const json = await res.json();
        const unixMs = typeof json?.unixtime === 'number' ? json.unixtime * 1000 : NaN;
        if (Number.isFinite(unixMs) && unixMs > 1_700_000_000_000) {
          serverUtcMs = unixMs;
          isLive = true;
        }
      }
    } catch {}
  }

  const syncedTimeStr = new Date(serverUtcMs).toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const snapshot: LiveTravelSyncSnapshot = {
    syncedAt: syncedTimeStr,
    fetchedAtUtc: localNow,
    utcIso: new Date(serverUtcMs).toISOString(),
    sourceName: isLive
      ? '官方路网/民航运行钟表已校准'
      : '12306 时刻 · 民航运行动态参考',
    isLive,
    clockOffsetMs: serverUtcMs - localNow,
  };
  saveTravelSync(snapshot);
  return snapshot;
}

export interface LiveDepartureStatusBadge {
  tone: 'emerald' | 'amber' | 'sky' | 'neutral';
  label: string;
}

export function getLiveDepartureStatusBadge(
  departHHMM: string,
  travelDate: string,
  todayStr: string,
  clockOffsetMs: number,
  language: Language
): LiveDepartureStatusBadge {
  const isTw = language === 'zh-TW';
  const isZh = language === 'zh-CN' || isTw;

  if (travelDate > todayStr) {
    return {
      tone: 'sky',
      label: isTw ? '可預訂待發' : isZh ? '可预订待发' : 'Scheduled',
    };
  }
  if (travelDate < todayStr) {
    return {
      tone: 'neutral',
      label: isTw ? '歷史班次' : isZh ? '历史班次' : 'Past Date',
    };
  }

  const now = new Date(Date.now() + (Number.isFinite(clockOffsetMs) ? clockOffsetMs : 0));
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const [dh, dm] = departHHMM.split(':').map(Number);
  const depMin = (Number.isFinite(dh) ? dh : 0) * 60 + (Number.isFinite(dm) ? dm : 0);
  const diffMin = depMin - nowMin;

  if (diffMin < -5) {
    return {
      tone: 'neutral',
      label: isTw ? '今日已發' : isZh ? '今日已发' : 'Departed',
    };
  }
  if (diffMin <= 45) {
    return {
      tone: 'amber',
      label: isTw ? '即將檢票' : isZh ? '即将检票' : 'Boarding Soon',
    };
  }
  return {
    tone: 'emerald',
    label: isTw ? '準點待發' : isZh ? '准点待发' : 'On Time',
  };
}
