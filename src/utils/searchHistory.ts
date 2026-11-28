import { useState, useCallback, useEffect } from 'react';
import { Language } from '../types/calendar';
import { readStorageJson, writeStorageJson } from './storage';

export type SearchScope =
  | 'global_search'
  | 'laws'
  | 'explore_vocab'
  | 'explore_synonym'
  | 'agenda'
  | 'accounting'
  | 'travel'
  | 'notes'
  | 'world_clock'
  | 'weather'
  | 'countdown';

const SEARCH_HISTORY_KEY = 'global_search_history_v1';
const SEARCH_HISTORY_EVENT = 'global-search-history-updated';
const MAX_HISTORY_ITEMS = 8;

type HistoryMap = Partial<Record<SearchScope, string[]>>;

function loadHistoryMap(): HistoryMap {
  return (
    readStorageJson<HistoryMap>(
      SEARCH_HISTORY_KEY,
      (val): val is HistoryMap => Boolean(val) && typeof val === 'object' && !Array.isArray(val)
    ) ?? {}
  );
}

export function getSearchHistory(scope: SearchScope): string[] {
  const map = loadHistoryMap();
  const list = map[scope];
  return Array.isArray(list) ? list.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

export function pushSearchHistory(scope: SearchScope, rawQuery: string): string[] {
  const clean = rawQuery.trim();
  if (!clean) return getSearchHistory(scope);
  const map = loadHistoryMap();
  const prev = Array.isArray(map[scope]) ? map[scope]! : [];
  const lower = clean.toLowerCase();
  const next = [clean, ...prev.filter((item) => item.trim().toLowerCase() !== lower)].slice(0, MAX_HISTORY_ITEMS);
  map[scope] = next;
  writeStorageJson(SEARCH_HISTORY_KEY, map);
  window.dispatchEvent(new CustomEvent(SEARCH_HISTORY_EVENT, { detail: { scope, history: next } }));
  return next;
}

export function removeSearchHistoryItem(scope: SearchScope, queryToRemove: string): string[] {
  const map = loadHistoryMap();
  const prev = Array.isArray(map[scope]) ? map[scope]! : [];
  const next = prev.filter((item) => item !== queryToRemove);
  map[scope] = next;
  writeStorageJson(SEARCH_HISTORY_KEY, map);
  window.dispatchEvent(new CustomEvent(SEARCH_HISTORY_EVENT, { detail: { scope, history: next } }));
  return next;
}

export function clearSearchHistoryScope(scope: SearchScope): void {
  const map = loadHistoryMap();
  map[scope] = [];
  writeStorageJson(SEARCH_HISTORY_KEY, map);
  window.dispatchEvent(new CustomEvent(SEARCH_HISTORY_EVENT, { detail: { scope, history: [] } }));
}

export function useSearchHistory(scope: SearchScope) {
  const [history, setHistory] = useState<string[]>(() => getSearchHistory(scope));

  useEffect(() => {
    setHistory(getSearchHistory(scope));
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.scope === scope && Array.isArray(detail.history)) {
        setHistory(detail.history);
      }
    };
    window.addEventListener(SEARCH_HISTORY_EVENT, onUpdated);
    return () => window.removeEventListener(SEARCH_HISTORY_EVENT, onUpdated);
  }, [scope]);

  const recordQuery = useCallback(
    (q: string) => {
      const clean = q.trim();
      if (!clean) return;
      setHistory(pushSearchHistory(scope, clean));
    },
    [scope]
  );

  const removeQuery = useCallback(
    (q: string) => {
      setHistory(removeSearchHistoryItem(scope, q));
    },
    [scope]
  );

  const clearHistory = useCallback(() => {
    clearSearchHistoryScope(scope);
    setHistory([]);
  }, [scope]);

  return { history, recordQuery, removeQuery, clearHistory };
}

export interface SearchHistoryLabels {
  recentLabel: string;
  clearLabel: string;
}

const LABELS: Record<Language, SearchHistoryLabels> = {
  'zh-CN': { recentLabel: '最近搜索', clearLabel: '清空历史记录' },
  'zh-TW': { recentLabel: '最近搜尋', clearLabel: '清空歷史記錄' },
  en: { recentLabel: 'Recent Searches', clearLabel: 'Clear History' },
  ja: { recentLabel: '検索履歴', clearLabel: '履歴をクリア' },
  ko: { recentLabel: '최근 검색', clearLabel: '기록 지우기' },
  fr: { recentLabel: 'Recherches récentes', clearLabel: 'Effacer' },
  fa: { recentLabel: 'جستجوهای اخیر', clearLabel: 'پاک کردن تاریخچه' },
  mn: { recentLabel: 'Сүүлийн хайлт', clearLabel: 'Түүх цэвэрлэх' },
  ru: { recentLabel: 'Недавние запросы', clearLabel: 'Очистить историю' },
  ug: { recentLabel: 'يېقىنقى ئىزدەش', clearLabel: 'تارىخنى تازىلاش' },
};

export function getSearchHistoryLabels(language: Language): SearchHistoryLabels {
  return LABELS[language] || LABELS.en;
}
