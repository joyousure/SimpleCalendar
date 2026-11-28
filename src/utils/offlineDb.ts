/**
 * Local IndexedDB Offline Cache Engine for English Training & Legal Resources + Progress Sync.
 * Ensures zero-network availability, removes 5MB localStorage quota ceilings on full statute markdown,
 * and bidirectionally synchronizes learning progress & legal bookmarks.
 */

const DB_NAME = 'smartcal_offline_v1';
const DB_VERSION = 1;

const STORE_RESOURCE_PACKS = 'resource_packs';
const STORE_LAW_FULLTEXTS = 'law_fulltexts';
const STORE_USER_PROGRESS = 'user_progress';

export interface ResourcePackRecord<T = unknown> {
  id: string;
  version: string;
  updatedAt: number;
  itemCount: number;
  payload: T;
}

export interface LawFullTextRecord {
  id: string;
  text: string;
  cachedAt: number;
}

export interface UserProgressRecord<T = unknown> {
  id: string;
  updatedAt: number;
  payload: T;
}

let dbOpenPromise: Promise<IDBDatabase | null> | null = null;

function openOfflineDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (dbOpenPromise) return dbOpenPromise;

  dbOpenPromise = new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_RESOURCE_PACKS)) {
          db.createObjectStore(STORE_RESOURCE_PACKS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_LAW_FULLTEXTS)) {
          db.createObjectStore(STORE_LAW_FULLTEXTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_USER_PROGRESS)) {
          db.createObjectStore(STORE_USER_PROGRESS, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => {
          db.close();
          dbOpenPromise = null;
        };
        resolve(db);
      };
      req.onerror = () => {
        dbOpenPromise = null;
        resolve(null);
      };
      req.onblocked = () => {
        resolve(null);
      };
    } catch {
      dbOpenPromise = null;
      resolve(null);
    }
  });

  return dbOpenPromise;
}

async function idbGet<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openOfflineDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openOfflineDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? (req.result as T[]) : []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function idbPut<T>(storeName: string, value: T): Promise<boolean> {
  const db = await openOfflineDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(value);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

// -------------------------------------------------------------
// English Explore Resource Pack & Progress Sync
// -------------------------------------------------------------

export interface EnglishIndexedPack {
  vocabCount: number;
  nceCount: number;
  listening179Count: number;
  speakingCount: number;
  synonymCount: number;
  tfngCount: number;
  grammarCount: number;
  vocabSearchIndex: Array<{ id: string; tokens: string }>;
  nceLessonIds: string[];
}

const ENGLISH_PACK_ID = 'english_vault_pack_v1';
const ENGLISH_PACK_VERSION = '2026.11.1';

export async function syncAndLoadExplorePackIdb<
  TVocab extends { id: string; word: string; meaning: string; meaningEn: string; collocation: string; group: string },
  TNce extends { id: string }
>(datasets: {
  vocab: TVocab[];
  nceLessons: TNce[];
  listening179Count: number;
  speakingCount: number;
  synonymCount: number;
  tfngCount: number;
  grammarCount: number;
}): Promise<ResourcePackRecord<EnglishIndexedPack> | null> {
  const existing = await idbGet<ResourcePackRecord<EnglishIndexedPack>>(STORE_RESOURCE_PACKS, ENGLISH_PACK_ID);
  if (
    existing &&
    existing.version === ENGLISH_PACK_VERSION &&
    existing.payload?.vocabCount === datasets.vocab.length &&
    existing.payload?.nceCount === datasets.nceLessons.length
  ) {
    return existing;
  }

  const record: ResourcePackRecord<EnglishIndexedPack> = {
    id: ENGLISH_PACK_ID,
    version: ENGLISH_PACK_VERSION,
    updatedAt: Date.now(),
    itemCount:
      datasets.vocab.length +
      datasets.nceLessons.length +
      datasets.listening179Count +
      datasets.speakingCount +
      datasets.synonymCount +
      datasets.tfngCount +
      datasets.grammarCount,
    payload: {
      vocabCount: datasets.vocab.length,
      nceCount: datasets.nceLessons.length,
      listening179Count: datasets.listening179Count,
      speakingCount: datasets.speakingCount,
      synonymCount: datasets.synonymCount,
      tfngCount: datasets.tfngCount,
      grammarCount: datasets.grammarCount,
      vocabSearchIndex: datasets.vocab.map((v) => ({
        id: v.id,
        tokens: `${v.word} ${v.meaning} ${v.meaningEn} ${v.collocation} ${v.group}`.toLowerCase(),
      })),
      nceLessonIds: datasets.nceLessons.map((l) => l.id),
    },
  };

  await idbPut(STORE_RESOURCE_PACKS, record);
  return record;
}

export interface ExploreProgressPayload {
  masteredIds: string[];
  completedModules: string[];
  weakIds: string[];
  xp: number;
  favoriteWords: string[];
  favoriteSentences: Array<{
    id: string;
    source: 'vocab' | 'speaking' | 'upgrade' | 'task1' | 'grammar' | 'nce';
    title: string;
    en: string;
    zh?: string;
    band?: string;
  }>;
  reviewMap: Record<string, { stage: 0 | 1 | 2 | 3; nextReviewAt: number; reps: number }>;
}

const EXPLORE_PROGRESS_IDB_KEY = 'explore_progress';

export function mergeExploreProgress(
  local: ExploreProgressPayload,
  remote: ExploreProgressPayload
): ExploreProgressPayload {
  const uniq = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));
  const sentMap = new Map(local.favoriteSentences.map((s) => [s.id, s]));
  remote.favoriteSentences.forEach((s) => {
    if (!sentMap.has(s.id)) sentMap.set(s.id, s);
  });
  const mergedReview = { ...remote.reviewMap };
  Object.entries(local.reviewMap).forEach(([k, v]) => {
    const prev = mergedReview[k];
    if (!prev || v.reps >= prev.reps) {
      mergedReview[k] = v;
    }
  });
  return {
    masteredIds: uniq(local.masteredIds, remote.masteredIds),
    completedModules: uniq(local.completedModules, remote.completedModules),
    weakIds: local.weakIds.length > 0 ? local.weakIds : remote.weakIds,
    xp: Math.max(local.xp, remote.xp),
    favoriteWords: uniq(local.favoriteWords, remote.favoriteWords),
    favoriteSentences: Array.from(sentMap.values()),
    reviewMap: mergedReview,
  };
}

export async function loadExploreProgressIdb(): Promise<ExploreProgressPayload | null> {
  const rec = await idbGet<UserProgressRecord<ExploreProgressPayload>>(
    STORE_USER_PROGRESS,
    EXPLORE_PROGRESS_IDB_KEY
  );
  return rec?.payload ?? null;
}

export async function saveExploreProgressIdb(payload: ExploreProgressPayload): Promise<boolean> {
  return idbPut<UserProgressRecord<ExploreProgressPayload>>(STORE_USER_PROGRESS, {
    id: EXPLORE_PROGRESS_IDB_KEY,
    updatedAt: Date.now(),
    payload,
  });
}

// -------------------------------------------------------------
// Legal Corpus Pack, Full-Text Statutes & Bookmarks Sync
// -------------------------------------------------------------

export interface LawsIndexedPack {
  statuteCount: number;
  articleCount: number;
  caseCount: number;
  timeframeCount: number;
  statuteIndex: Array<{ id: string; title: string; keywords: string }>;
}

const LAWS_PACK_ID = 'laws_corpus_pack_v1';
const LAWS_PACK_VERSION = '2026.11.1';

export async function syncAndLoadLawsPackIdb<
  TDoc extends { id: string; title: string; category: string; articles: Array<{ number: string; summary: string }> }
>(datasets: {
  laws: TDoc[];
  caseCount: number;
  timeframeCount: number;
}): Promise<ResourcePackRecord<LawsIndexedPack> | null> {
  const existing = await idbGet<ResourcePackRecord<LawsIndexedPack>>(STORE_RESOURCE_PACKS, LAWS_PACK_ID);
  const articleCount = datasets.laws.reduce((sum, d) => sum + d.articles.length, 0);
  if (
    existing &&
    existing.version === LAWS_PACK_VERSION &&
    existing.payload?.statuteCount === datasets.laws.length &&
    existing.payload?.articleCount === articleCount
  ) {
    return existing;
  }

  const record: ResourcePackRecord<LawsIndexedPack> = {
    id: LAWS_PACK_ID,
    version: LAWS_PACK_VERSION,
    updatedAt: Date.now(),
    itemCount: datasets.laws.length + datasets.caseCount + datasets.timeframeCount,
    payload: {
      statuteCount: datasets.laws.length,
      articleCount,
      caseCount: datasets.caseCount,
      timeframeCount: datasets.timeframeCount,
      statuteIndex: datasets.laws.map((d) => ({
        id: d.id,
        title: d.title,
        keywords: `${d.title} ${d.category} ${d.articles.slice(0, 8).map((a) => `${a.number} ${a.summary}`).join(' ')}`.toLowerCase(),
      })),
    },
  };

  await idbPut(STORE_RESOURCE_PACKS, record);
  return record;
}

export async function saveLawFullTextIdb(id: string, text: string): Promise<boolean> {
  return idbPut<LawFullTextRecord>(STORE_LAW_FULLTEXTS, {
    id,
    text,
    cachedAt: Date.now(),
  });
}

export async function getAllLawFullTextsIdb(): Promise<Record<string, { text: string; cachedAt: number }>> {
  const rows = await idbGetAll<LawFullTextRecord>(STORE_LAW_FULLTEXTS);
  const map: Record<string, { text: string; cachedAt: number }> = {};
  rows.forEach((r) => {
    if (r?.id && typeof r.text === 'string') {
      map[r.id] = { text: r.text, cachedAt: r.cachedAt || Date.now() };
    }
  });
  return map;
}

export interface LawsBookmarksPayload {
  statuteIds: string[];
  articleKeys: string[];
  caseIds: string[];
}

const LAWS_BOOKMARKS_IDB_KEY = 'laws_bookmarks';
const LAWS_RECENT_IDB_KEY = 'laws_recent';

export async function loadLawsBookmarksIdb(): Promise<LawsBookmarksPayload | null> {
  const rec = await idbGet<UserProgressRecord<LawsBookmarksPayload>>(
    STORE_USER_PROGRESS,
    LAWS_BOOKMARKS_IDB_KEY
  );
  return rec?.payload ?? null;
}

export async function saveLawsBookmarksIdb(payload: LawsBookmarksPayload): Promise<boolean> {
  return idbPut<UserProgressRecord<LawsBookmarksPayload>>(STORE_USER_PROGRESS, {
    id: LAWS_BOOKMARKS_IDB_KEY,
    updatedAt: Date.now(),
    payload,
  });
}

export async function loadLawsRecentIdb(): Promise<string[] | null> {
  const rec = await idbGet<UserProgressRecord<string[]>>(STORE_USER_PROGRESS, LAWS_RECENT_IDB_KEY);
  return rec?.payload ?? null;
}

export async function saveLawsRecentIdb(ids: string[]): Promise<boolean> {
  return idbPut<UserProgressRecord<string[]>>(STORE_USER_PROGRESS, {
    id: LAWS_RECENT_IDB_KEY,
    updatedAt: Date.now(),
    payload: ids,
  });
}

const TICKTICK_WORKSPACE_IDB_KEY = 'ticktick_workspace_v1';

export async function loadTickTickWorkspaceIdb<T>(): Promise<T | null> {
  const rec = await idbGet<UserProgressRecord<T>>(STORE_USER_PROGRESS, TICKTICK_WORKSPACE_IDB_KEY);
  return rec?.payload ?? null;
}

export async function saveTickTickWorkspaceIdb<T>(payload: T): Promise<boolean> {
  return idbPut<UserProgressRecord<T>>(STORE_USER_PROGRESS, {
    id: TICKTICK_WORKSPACE_IDB_KEY,
    updatedAt: Date.now(),
    payload,
  });
}

let prewarmStarted = false;

/**
 * Silently warms IndexedDB with both English & Legal parsed resource indices
 * in idle time after app launch so full offline readiness works immediately.
 */
export function scheduleIdleOfflineDbPrewarm(): void {
  if (prewarmStarted || typeof window === 'undefined') return;
  prewarmStarted = true;

  const run = async () => {
    try {
      const [englishMod, ieltsMod, lawsMod] = await Promise.all([
        import('../data/englishVaultData'),
        import('../data/ieltsData'),
        import('../data/lawsData'),
      ]);
      await Promise.all([
        syncAndLoadExplorePackIdb({
          vocab: englishMod.ALL_VAULT_VOCAB,
          nceLessons: englishMod.NCE_LESSONS,
          listening179Count: ieltsMod.LISTENING_179_ITEMS.length,
          speakingCount: ieltsMod.SPEAKING_PROMPTS.length,
          synonymCount: ieltsMod.SYNONYM_538_PAIRS.length,
          tfngCount: ieltsMod.TFNG_DRILLS.length,
          grammarCount: ieltsMod.GRAMMAR_MODULES.length,
        }),
        syncAndLoadLawsPackIdb({
          laws: lawsMod.LAW_DOCUMENTS,
          caseCount: lawsMod.JUDICIAL_CASES.length,
          timeframeCount: lawsMod.LEGAL_TIMEFRAMES.length,
        }),
      ]);
    } catch {}
  };

  if ('requestIdleCallback' in window && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => {
      void run();
    }, { timeout: 4500 });
  } else {
    window.setTimeout(() => {
      void run();
    }, 1800);
  }
}
