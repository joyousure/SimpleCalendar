import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Scale,
  Search,
  X,
  Bookmark,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Gavel,
  DownloadCloud,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { AppSettings } from '../types/calendar';
import { isRtlLanguage } from '../utils/i18n';
import { getLawsI18n } from '../utils/fabModalI18n';
import { getLawsExtraI18n } from '../utils/lawsExploreExtraI18n';
import { useSearchHistory } from '../utils/searchHistory';
import { SearchHistoryBar } from './SearchHistoryBar';
import { triggerHaptic } from '../utils/haptics';
import { readStorageJson, writeStorageJson } from '../utils/storage';
import {
  syncAndLoadLawsPackIdb,
  saveLawFullTextIdb,
  getAllLawFullTextsIdb,
  loadLawsBookmarksIdb,
  saveLawsBookmarksIdb,
  loadLawsRecentIdb,
  saveLawsRecentIdb,
} from '../utils/offlineDb';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';
import {
  LAW_DOCUMENTS,
  JUDICIAL_CASES,
  LEGAL_SCENARIOS,
  LEGAL_TIMEFRAMES,
  LawCategory,
  LawScenarioId,
  LawDocument,
  LawArticle,
  JudicialCase,
  searchLawDocuments,
  searchJudicialCases,
  matchesArticleNumberQuery,
  resolveCitationToStatute,
  parseLawMarkdownBlocks,
  getLawRefRawUrl,
} from '../data/lawsData';

export interface LawsInitialTarget {
  lawId?: string;
  articleId?: string;
  caseId?: string;
  category?: Exclude<LawCategory, 'cases'>;
  seq: number;
}

interface LawsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  initialTarget?: LawsInitialTarget | null;
}

type LawsModeTab = 'statutes' | 'cases' | 'timeframes' | 'bookmarks';

const BOOKMARKS_KEY = 'laws_bookmarks_v1';
const RECENT_STATUTES_KEY = 'laws_recent_statutes_v1';
const FULL_TEXT_CACHE_KEY = 'laws_fulltext_cache_v1';

interface SavedLawBookmarks {
  statuteIds: string[];
  articleKeys: string[]; // `${lawId}:${articleId}`
  caseIds: string[];
}

interface CachedFullTextEntry {
  text: string;
  cachedAt: number;
}

const DEFAULT_BOOKMARKS: SavedLawBookmarks = {
  statuteIds: [],
  articleKeys: [],
  caseIds: [],
};

function highlightMatch(text: string, query: string): React.ReactNode {
  const clean = query.trim();
  if (!clean) return text;
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(re);
  if (parts.length <= 1) return text;
  return parts.map((part, idx) =>
    part.toLowerCase() === clean.toLowerCase() ? (
      <mark
        key={idx}
        className="px-0.5 rounded bg-amber-300/60 dark:bg-amber-400/35 text-neutral-950 dark:text-amber-100 font-semibold"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

export const LawsModal: React.FC<LawsModalProps> = ({
  isOpen,
  onClose,
  settings,
  initialTarget,
}) => {
  const ui = getLawsI18n(settings.language);
  const extra = getLawsExtraI18n(settings.language);
  const isRtl = isRtlLanguage(settings.language);
  const hapticsEnabled = settings.enableHaptics !== false;
  const lawsSearchHistory = useSearchHistory('laws');

  const [modeTab, setModeTab] = useState<LawsModeTab>('statutes');
  const [category, setCategory] = useState<Exclude<LawCategory, 'cases'>>('all');
  const [scenario, setScenario] = useState<LawScenarioId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedLaw, setSelectedLaw] = useState<LawDocument | null>(null);
  const [selectedCase, setSelectedCase] = useState<JudicialCase | null>(null);
  const [inStatuteQuery, setInStatuteQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [focusedArticleId, setFocusedArticleId] = useState<string | null>(null);

  const focusedArticleRef = useRef<HTMLDivElement | null>(null);

  const [bookmarks, setBookmarks] = useState<SavedLawBookmarks>(() => {
    const saved = readStorageJson<SavedLawBookmarks>(
      BOOKMARKS_KEY,
      (val): val is SavedLawBookmarks =>
        Boolean(val) &&
        typeof val === 'object' &&
        Array.isArray((val as SavedLawBookmarks).statuteIds) &&
        Array.isArray((val as SavedLawBookmarks).articleKeys) &&
        Array.isArray((val as SavedLawBookmarks).caseIds)
    );
    return saved || DEFAULT_BOOKMARKS;
  });

  const [recentStatuteIds, setRecentStatuteIds] = useState<string[]>(() => {
    return (
      readStorageJson<string[]>(
        RECENT_STATUTES_KEY,
        (val): val is string[] =>
          Array.isArray(val) && val.every((item) => typeof item === 'string')
      ) ?? []
    );
  });

  const [fullTextCache, setFullTextCache] = useState<Record<string, CachedFullTextEntry>>(() => {
    return (
      readStorageJson<Record<string, CachedFullTextEntry>>(
        FULL_TEXT_CACHE_KEY,
        (val): val is Record<string, CachedFullTextEntry> =>
          Boolean(val) && typeof val === 'object' && !Array.isArray(val)
      ) ?? {}
    );
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFullMarkdown, setShowFullMarkdown] = useState(false);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [fullLoadNotice, setFullLoadNotice] = useState<string | null>(null);

  const idbLawsHydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await syncAndLoadLawsPackIdb({
        laws: LAW_DOCUMENTS,
        caseCount: JUDICIAL_CASES.length,
        timeframeCount: LEGAL_TIMEFRAMES.length,
      });
      const [idbBookmarks, idbRecent, idbFullTexts] = await Promise.all([
        loadLawsBookmarksIdb(),
        loadLawsRecentIdb(),
        getAllLawFullTextsIdb(),
      ]);
      if (cancelled) return;
      idbLawsHydratedRef.current = true;
      if (idbBookmarks) {
        setBookmarks((prev) => ({
          statuteIds: Array.from(new Set([...prev.statuteIds, ...idbBookmarks.statuteIds])),
          articleKeys: Array.from(new Set([...prev.articleKeys, ...idbBookmarks.articleKeys])),
          caseIds: Array.from(new Set([...prev.caseIds, ...idbBookmarks.caseIds])),
        }));
      } else {
        void saveLawsBookmarksIdb(bookmarks);
      }
      if (idbRecent && idbRecent.length > 0) {
        setRecentStatuteIds((prev) =>
          Array.from(new Set([...prev, ...idbRecent])).slice(0, 6)
        );
      }
      if (Object.keys(idbFullTexts).length > 0) {
        setFullTextCache((prev) => ({ ...idbFullTexts, ...prev }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    writeStorageJson(BOOKMARKS_KEY, bookmarks);
    if (idbLawsHydratedRef.current) {
      void saveLawsBookmarksIdb(bookmarks);
    }
  }, [bookmarks]);

  useEffect(() => {
    writeStorageJson(RECENT_STATUTES_KEY, recentStatuteIds);
    if (idbLawsHydratedRef.current) {
      void saveLawsRecentIdb(recentStatuteIds);
    }
  }, [recentStatuteIds]);

  useEffect(() => {
    // Keep only top 5 most recent full texts mirrored to localStorage for quota safety; IndexedDB stores all indefinitely
    const keys = Object.keys(fullTextCache);
    if (keys.length <= 5) {
      writeStorageJson(FULL_TEXT_CACHE_KEY, fullTextCache);
    } else {
      const trimmed: Record<string, CachedFullTextEntry> = {};
      keys
        .sort((a, b) => fullTextCache[b].cachedAt - fullTextCache[a].cachedAt)
        .slice(0, 5)
        .forEach((k) => {
          trimmed[k] = fullTextCache[k];
        });
      writeStorageJson(FULL_TEXT_CACHE_KEY, trimmed);
    }
  }, [fullTextCache]);

  // Register inner detail layer so system Back returns from statute/case view to the list
  useSystemBackLayer(
    isOpen && Boolean(selectedLaw || selectedCase),
    () => {
      setSelectedLaw(null);
      setSelectedCase(null);
      setShowFullMarkdown(false);
      setFullLoadNotice(null);
      setFocusedArticleId(null);
    },
    BACK_PRIORITY.NESTED_MODAL,
    'laws-detail-view'
  );

  useEffect(() => {
    if (!isOpen) {
      setSelectedLaw(null);
      setSelectedCase(null);
      setShowFullMarkdown(false);
      setFullLoadNotice(null);
      setInStatuteQuery('');
      setSelectedChapter('ALL');
      setFocusedArticleId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!focusedArticleId || !selectedLaw) return;
    const timer = window.setTimeout(() => {
      focusedArticleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [focusedArticleId, selectedLaw]);

  useEffect(() => {
    if (!isOpen || !initialTarget) return;
    if (initialTarget.lawId) {
      const targetDoc = LAW_DOCUMENTS.find((d) => d.id === initialTarget.lawId);
      if (targetDoc) {
        setModeTab('statutes');
        setSelectedCase(null);
        setSelectedLaw(targetDoc);
        setShowFullMarkdown(false);
        setFullLoadNotice(initialTarget.articleId ? extra.jumpToArticleLabel : null);
        setInStatuteQuery('');
        setSelectedChapter('ALL');
        setFocusedArticleId(initialTarget.articleId ?? null);
        setRecentStatuteIds((prev) =>
          [targetDoc.id, ...prev.filter((id) => id !== targetDoc.id)].slice(0, 4)
        );
        return;
      }
    }
    if (initialTarget.caseId) {
      const targetCase = JUDICIAL_CASES.find((c) => c.id === initialTarget.caseId);
      if (targetCase) {
        setModeTab('cases');
        setSelectedLaw(null);
        setSelectedCase(targetCase);
        setFocusedArticleId(null);
        return;
      }
    }
    if (initialTarget.category) {
      setSelectedLaw(null);
      setSelectedCase(null);
      setModeTab('statutes');
      setCategory(initialTarget.category);
    }
  }, [isOpen, initialTarget, extra.jumpToArticleLabel]);

  const recordSearchQuery = (q: string) => {
    const clean = q.trim();
    if (!clean || clean.length < 2) return;
    lawsSearchHistory.recordQuery(clean);
  };

  const openStatute = (doc: LawDocument, focusArticleId?: string | null) => {
    if (searchQuery.trim().length >= 2) {
      lawsSearchHistory.recordQuery(searchQuery);
    }
    setSelectedCase(null);
    setSelectedLaw(doc);
    setShowFullMarkdown(false);
    setFullLoadNotice(focusArticleId ? extra.jumpToArticleLabel : null);
    setInStatuteQuery('');
    setSelectedChapter('ALL');
    setFocusedArticleId(focusArticleId ?? null);
    setRecentStatuteIds((prev) => [doc.id, ...prev.filter((id) => id !== doc.id)].slice(0, 4));
  };

  const openCase = (c: JudicialCase) => {
    if (searchQuery.trim().length >= 2) {
      lawsSearchHistory.recordQuery(searchQuery);
    }
    setSelectedLaw(null);
    setSelectedCase(c);
    setFocusedArticleId(null);
  };

  const matchedStatutes = useMemo(() => {
    if (modeTab === 'bookmarks') {
      return LAW_DOCUMENTS.filter(
        (doc) =>
          bookmarks.statuteIds.includes(doc.id) ||
          bookmarks.articleKeys.some((k) => k.startsWith(`${doc.id}:`))
      );
    }
    return searchLawDocuments(searchQuery, category, scenario);
  }, [modeTab, bookmarks, searchQuery, category, scenario]);

  const matchedCases = useMemo(() => {
    if (modeTab === 'bookmarks') {
      return JUDICIAL_CASES.filter((c) => bookmarks.caseIds.includes(c.id));
    }
    return searchJudicialCases(searchQuery, scenario);
  }, [modeTab, bookmarks, searchQuery, scenario]);

  const matchedTimeframes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return LEGAL_TIMEFRAMES.filter((tf) => {
      if (scenario !== 'all' && tf.scenario !== scenario) return false;
      if (category !== 'all' && tf.category !== category) return false;
      if (!q) return true;
      return `${tf.title} ${tf.duration} ${tf.basisArticle} ${tf.detail}`.toLowerCase().includes(q);
    });
  }, [searchQuery, scenario, category]);

  const bookmarkedArticleEntries = useMemo(() => {
    const list: { key: string; law: LawDocument; article: LawArticle }[] = [];
    for (const key of bookmarks.articleKeys) {
      const [lawId, articleId] = key.split(':');
      const law = LAW_DOCUMENTS.find((d) => d.id === lawId);
      const article = law?.articles.find((a) => a.id === articleId);
      if (law && article) {
        list.push({ key, law, article });
      }
    }
    return list;
  }, [bookmarks.articleKeys]);

  const recentStatutes = useMemo(
    () =>
      recentStatuteIds
        .map((id) => LAW_DOCUMENTS.find((d) => d.id === id))
        .filter((d): d is LawDocument => Boolean(d)),
    [recentStatuteIds]
  );

  const selectedLawChapters = useMemo(() => {
    if (!selectedLaw) return [];
    const seen = new Set<string>();
    const chapters: string[] = [];
    for (const art of selectedLaw.articles) {
      if (!seen.has(art.chapter)) {
        seen.add(art.chapter);
        chapters.push(art.chapter);
      }
    }
    return chapters;
  }, [selectedLaw]);

  const filteredSelectedArticles = useMemo(() => {
    if (!selectedLaw) return [];
    const activeFilter = inStatuteQuery.trim() || searchQuery.trim();
    return selectedLaw.articles.filter((art) => {
      if (selectedChapter !== 'ALL' && art.chapter !== selectedChapter) return false;
      if (!inStatuteQuery.trim()) return true;
      const q = inStatuteQuery.trim().toLowerCase();
      return (
        matchesArticleNumberQuery(art.number, q) ||
        art.chapter.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.content.toLowerCase().includes(q)
      );
    }).sort((a, b) => {
      if (!activeFilter) return 0;
      const aMatch = matchesArticleNumberQuery(a.number, activeFilter) ? 1 : 0;
      const bMatch = matchesArticleNumberQuery(b.number, activeFilter) ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [selectedLaw, selectedChapter, inStatuteQuery, searchQuery]);

  const parsedMarkdownBlocks = useMemo(() => {
    if (!selectedLaw || !showFullMarkdown) return [];
    const entry = fullTextCache[selectedLaw.id];
    if (!entry) return [];
    return parseLawMarkdownBlocks(entry.text, inStatuteQuery || searchQuery);
  }, [selectedLaw, showFullMarkdown, fullTextCache, inStatuteQuery, searchQuery]);

  if (!isOpen) return null;

  const copyText = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    triggerHaptic('success', hapticsEnabled);
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1800);
  };

  const toggleStatuteBookmark = (lawId: string) => {
    triggerHaptic('selection', hapticsEnabled);
    setBookmarks((prev) => {
      const exists = prev.statuteIds.includes(lawId);
      return {
        ...prev,
        statuteIds: exists
          ? prev.statuteIds.filter((id) => id !== lawId)
          : [...prev.statuteIds, lawId],
      };
    });
  };

  const toggleArticleBookmark = (lawId: string, articleId: string) => {
    const key = `${lawId}:${articleId}`;
    triggerHaptic('selection', hapticsEnabled);
    setBookmarks((prev) => {
      const exists = prev.articleKeys.includes(key);
      return {
        ...prev,
        articleKeys: exists
          ? prev.articleKeys.filter((k) => k !== key)
          : [...prev.articleKeys, key],
      };
    });
  };

  const toggleCaseBookmark = (caseId: string) => {
    triggerHaptic('selection', hapticsEnabled);
    setBookmarks((prev) => {
      const exists = prev.caseIds.includes(caseId);
      return {
        ...prev,
        caseIds: exists
          ? prev.caseIds.filter((id) => id !== caseId)
          : [...prev.caseIds, caseId],
      };
    });
  };

  const handleLoadFullLawRef = async (law: LawDocument) => {
    if (fullTextCache[law.id]) {
      setShowFullMarkdown(true);
      setFullLoadNotice(ui.fullTextLoadedLabel);
      return;
    }
    if (settings.offlineMode) {
      setFullLoadNotice(ui.offlineFullNotice);
      return;
    }
    setIsLoadingFull(true);
    setFullLoadNotice(null);
    try {
      const res = await fetch(getLawRefRawUrl(law.lawRefPath));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const markdown = await res.text();
      void saveLawFullTextIdb(law.id, markdown);
      setFullTextCache((prev) => ({
        ...prev,
        [law.id]: { text: markdown, cachedAt: Date.now() },
      }));
      setShowFullMarkdown(true);
      setFullLoadNotice(ui.fullTextLoadedLabel);
    } catch {
      setFullLoadNotice(ui.fullTextFailedNotice);
    } finally {
      setIsLoadingFull(false);
    }
  };

  const handleCitationJump = (citationText: string) => {
    const resolved = resolveCitationToStatute(citationText);
    if (!resolved) return;
    triggerHaptic('selection', hapticsEnabled);
    openStatute(resolved.lawDoc, resolved.article?.id ?? null);
    if (!resolved.article && resolved.articleNumberHint) {
      setInStatuteQuery(resolved.articleNumberHint);
    }
  };

  const handleTimeframeJump = (lawId: string, basisArticle: string) => {
    const doc = LAW_DOCUMENTS.find((d) => d.id === lawId);
    if (!doc) return;
    const match = doc.articles.find(
      (a) => a.number === basisArticle || matchesArticleNumberQuery(a.number, basisArticle)
    );
    triggerHaptic('selection', hapticsEnabled);
    openStatute(doc, match?.id ?? null);
  };

  const isStatuteSaved = (lawId: string) => bookmarks.statuteIds.includes(lawId);
  const isArticleSaved = (lawId: string, articleId: string) =>
    bookmarks.articleKeys.includes(`${lawId}:${articleId}`);
  const isCaseSaved = (caseId: string) => bookmarks.caseIds.includes(caseId);

  const totalBookmarkCount =
    bookmarks.statuteIds.length + bookmarks.articleKeys.length + bookmarks.caseIds.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4 animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-3xl h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:h-[90vh] sm:max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-modal-content"
      >
        {/* Header */}
        <div className="shrink-0 px-4 sm:px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-600 to-rose-700 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {ui.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer shrink-0"
            aria-label={ui.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs + Search + Filters (shown when browsing index) */}
        {!selectedLaw && !selectedCase && (
          <div className="shrink-0 px-4 sm:px-5 pt-3 pb-2.5 space-y-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/30">
            {/* Uniform 4-Segment Bar */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10">
              {(
                [
                  { id: 'statutes', label: ui.modes.statutes, icon: BookOpen },
                  { id: 'cases', label: ui.modes.cases, icon: Gavel },
                  { id: 'timeframes', label: extra.timeframesTab, icon: Clock },
                  { id: 'bookmarks', label: ui.modes.bookmarks, icon: Bookmark },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = modeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection', hapticsEnabled);
                      setModeTab(tab.id);
                    }}
                    className={`min-h-[38px] py-1.5 px-1.5 rounded-full text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer tabular-nums ${
                      active
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                    {tab.id === 'bookmarks' && totalBookmarkCount > 0 && (
                      <span className="text-[10px] opacity-75">({totalBookmarkCount})</span>
                    )}
                  </button>
                );
              })}
            </div>

            {modeTab !== 'bookmarks' && (
              <>
                {/* Search Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    recordSearchQuery(searchQuery);
                  }}
                  className="flex items-center gap-2 bg-white dark:bg-neutral-900 rounded-xl px-3 min-h-[44px] border border-neutral-200/80 dark:border-neutral-700/80 focus-within:ring-2 focus-within:ring-amber-500/35"
                >
                  <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => recordSearchQuery(searchQuery)}
                    placeholder={ui.searchPlaceholder}
                    className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label={ui.clearSearch}
                      className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                {/* Shared Recent Search History */}
                <SearchHistoryBar
                  history={lawsSearchHistory.history}
                  language={settings.language}
                  onSelectQuery={(rq) => {
                    setSearchQuery(rq);
                    lawsSearchHistory.recordQuery(rq);
                  }}
                  onRemoveQuery={lawsSearchHistory.removeQuery}
                  onClearHistory={lawsSearchHistory.clearHistory}
                  compact
                />

                {/* Life Scenario Quick Filter Row */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  <span className="text-[10px] font-bold text-neutral-400 shrink-0 me-0.5">
                    {extra.scenariosLabel}:
                  </span>
                  {(['all', ...LEGAL_SCENARIOS.map((s) => s.id)] as LawScenarioId[]).map((sid) => {
                    const active = scenario === sid;
                    return (
                      <button
                        key={sid}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection', hapticsEnabled);
                          setScenario(sid);
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                          active
                            ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-sm'
                            : 'bg-white dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700/70'
                        }`}
                      >
                        {extra.scenarios[sid]}
                      </button>
                    );
                  })}
                </div>

                {/* Hot Keywords */}
                {!searchQuery && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-400">
                      {ui.hotKeywordsLabel}:
                    </span>
                    {ui.hotKeywords.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => {
                          setSearchQuery(kw);
                          recordSearchQuery(kw);
                        }}
                        className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/25 text-[11px] font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-500/20 cursor-pointer transition-colors"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                )}

                {/* Legal Branch Category Grid (for Statutes) */}
                {modeTab === 'statutes' && (
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 p-1 rounded-2xl bg-neutral-100/95 dark:bg-white/[0.06] border border-neutral-200/75 dark:border-white/10">
                    {(
                      [
                        'all',
                        'constitution',
                        'civil_commercial',
                        'criminal',
                        'administrative',
                        'economic_social',
                        'procedural',
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-1.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-semibold text-center truncate cursor-pointer transition-all ${
                          category === cat
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        {ui.categories[cat]}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* STATUTE DETAIL VIEW */}
          {selectedLaw ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLaw(null);
                    setShowFullMarkdown(false);
                    setFullLoadNotice(null);
                    setFocusedArticleId(null);
                  }}
                  className="min-h-[40px] px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 inline-flex items-center gap-1 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  <span>{ui.backToList}</span>
                </button>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        `law-${selectedLaw.id}`,
                        `《${selectedLaw.title}》（${selectedLaw.effectiveDate}，${selectedLaw.authority}）\n\n${selectedLaw.articles
                          .map((a) => `${a.number} ${a.content}`)
                          .join('\n\n')}`
                      )
                    }
                    className="min-h-[38px] px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === `law-${selectedLaw.id}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {copiedId === `law-${selectedLaw.id}` ? ui.copiedToast : ui.copyCitation}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleStatuteBookmark(selectedLaw.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 cursor-pointer border transition-colors ${
                      isStatuteSaved(selectedLaw.id)
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>
                      {isStatuteSaved(selectedLaw.id) ? ui.bookmarkRemove : ui.bookmarkAdd}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      showFullMarkdown
                        ? setShowFullMarkdown(false)
                        : handleLoadFullLawRef(selectedLaw)
                    }
                    disabled={isLoadingFull}
                    className="min-h-[38px] px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>
                      {isLoadingFull
                        ? ui.loadingFullText
                        : showFullMarkdown
                        ? ui.showCoreOnlyBtn
                        : ui.loadFullLawRefBtn}
                    </span>
                  </button>
                </div>
              </div>

              {/* Statute Metadata Header Card */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                    {selectedLaw.title}
                  </h3>
                  {fullTextCache[selectedLaw.id] && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                      {extra.offlineCachedBadge}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                  <span>
                    <strong className="font-semibold">{ui.authorityLabel}:</strong>{' '}
                    {selectedLaw.authority}
                  </span>
                  <span>·</span>
                  <span className="tabular-nums">
                    <strong className="font-semibold">{ui.effectiveLabel}:</strong>{' '}
                    {selectedLaw.effectiveDate}
                  </span>
                  <span>·</span>
                  <span className="tabular-nums">
                    <strong className="font-semibold">{ui.articlesHintLabel}:</strong>{' '}
                    {selectedLaw.articlesCountHint}
                  </span>
                </div>
                {fullLoadNotice && (
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    {fullLoadNotice}
                  </p>
                )}
              </div>

              {/* In-Statute Quick Filter + Chapter Chips */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl px-3 min-h-[42px] border border-neutral-200/70 dark:border-neutral-700/70">
                  <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    value={inStatuteQuery}
                    onChange={(e) => setInStatuteQuery(e.target.value)}
                    placeholder={extra.inStatuteSearchPlaceholder}
                    className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
                  />
                  {inStatuteQuery && (
                    <button
                      type="button"
                      onClick={() => setInStatuteQuery('')}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {!showFullMarkdown && selectedLawChapters.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedChapter('ALL')}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedChapter === 'ALL'
                          ? 'bg-amber-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {extra.allChapters}
                    </button>
                    {selectedLawChapters.map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setSelectedChapter(ch)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                          selectedChapter === ch
                            ? 'bg-amber-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clean Structured Statute Markdown View OR Curated Articles */}
              {showFullMarkdown && fullTextCache[selectedLaw.id] ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>{ui.fullTextLoadedLabel}</span>
                    <span className="tabular-nums">
                      {extra.matchedMarkdownCount(parsedMarkdownBlocks.length)}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                    {parsedMarkdownBlocks.map((block, idx) => {
                      const activeFilter = inStatuteQuery.trim() || searchQuery.trim();
                      if (block.type === 'h1') {
                        return (
                          <h4
                            key={idx}
                            className="text-base font-extrabold text-neutral-900 dark:text-neutral-100 pt-1"
                          >
                            {highlightMatch(block.text, activeFilter)}
                          </h4>
                        );
                      }
                      if (block.type === 'h2') {
                        return (
                          <h5
                            key={idx}
                            className="text-sm font-bold text-amber-700 dark:text-amber-300 pt-2 border-t border-neutral-200/70 dark:border-neutral-800"
                          >
                            {highlightMatch(block.text, activeFilter)}
                          </h5>
                        );
                      }
                      if (block.type === 'h3') {
                        return (
                          <div
                            key={idx}
                            className="text-xs font-bold text-neutral-700 dark:text-neutral-300 pt-1"
                          >
                            {highlightMatch(block.text, activeFilter)}
                          </div>
                        );
                      }
                      if (block.type === 'article') {
                        return (
                          <p
                            key={idx}
                            className="text-xs sm:text-[13px] text-neutral-900 dark:text-neutral-100 leading-relaxed bg-white dark:bg-neutral-900/70 p-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800"
                          >
                            {highlightMatch(block.text, activeFilter)}
                          </p>
                        );
                      }
                      return (
                        <p
                          key={idx}
                          className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed"
                        >
                          {highlightMatch(block.text, activeFilter)}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {ui.coreArticlesHeading}
                  </h4>
                  {filteredSelectedArticles.map((art) => {
                    const activeFilter = inStatuteQuery.trim() || searchQuery.trim();
                    const isMatched =
                      Boolean(activeFilter) &&
                      (matchesArticleNumberQuery(art.number, activeFilter) ||
                        art.content.toLowerCase().includes(activeFilter.toLowerCase()));
                    const isFocused = focusedArticleId === art.id;
                    const saved = isArticleSaved(selectedLaw.id, art.id);

                    return (
                      <div
                        key={art.id}
                        ref={isFocused ? focusedArticleRef : undefined}
                        className={`p-4 rounded-2xl border space-y-2 transition-colors ${
                          isFocused
                            ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-500 ring-2 ring-amber-400/40'
                            : isMatched
                            ? 'bg-amber-50/70 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40'
                            : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0 tabular-nums">
                              {art.number}
                            </span>
                            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                              {art.chapter}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  art.id,
                                  `《${selectedLaw.title}》${art.number}：${art.content}`
                                )
                              }
                              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                              title={ui.copyCitation}
                            >
                              {copiedId === art.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleArticleBookmark(selectedLaw.id, art.id)}
                              className={`p-2 rounded-lg cursor-pointer ${
                                saved
                                  ? 'text-amber-500'
                                  : 'text-neutral-400 hover:text-neutral-600'
                              }`}
                              title={saved ? ui.bookmarkRemove : ui.bookmarkAdd}
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                          {highlightMatch(art.content, activeFilter)}
                        </p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                          {art.summary}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : selectedCase ? (
            /* JUDICIAL CASE DETAIL VIEW */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="min-h-[40px] px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  <span>{ui.backToList}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        `case-${selectedCase.id}`,
                        `${selectedCase.title}（${selectedCase.caseNumber}）\n【裁判要旨】${selectedCase.holding}\n【关联法条】${selectedCase.relatedArticles.join('、')}`
                      )
                    }
                    className="min-h-[38px] px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === `case-${selectedCase.id}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {copiedId === `case-${selectedCase.id}` ? ui.copiedToast : ui.copyCitation}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCaseBookmark(selectedCase.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 cursor-pointer border ${
                      isCaseSaved(selectedCase.id)
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>
                      {isCaseSaved(selectedCase.id) ? ui.bookmarkRemove : ui.bookmarkAdd}
                    </span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                  {selectedCase.category} · {selectedCase.caseNumber}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                  {selectedCase.title}
                </h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>
                    {ui.caseCourtLabel}: {selectedCase.court}
                  </span>
                  <span>·</span>
                  <span className="tabular-nums">
                    {ui.caseDateLabel}: {selectedCase.decisionDate}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="text-xs font-bold text-neutral-500">{ui.caseFactsLabel}</div>
                <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  {selectedCase.facts}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/30 space-y-2">
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  {ui.caseHoldingLabel}
                </div>
                <p className="text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed font-medium">
                  {selectedCase.holding}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-neutral-500">{ui.caseRelatedLabel}</div>
                  <div className="text-[10px] text-neutral-400">{extra.caseRelatedClickHint}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCase.relatedArticles.map((art) => {
                    const resolved = resolveCitationToStatute(art);
                    return resolved ? (
                      <button
                        key={art}
                        type="button"
                        onClick={() => handleCitationJump(art)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-200 inline-flex items-center gap-1 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-500/25"
                      >
                        <span>{art}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span
                        key={art}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200"
                      >
                        {art}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : modeTab === 'timeframes' ? (
            /* STATUTORY TIMEFRAMES & DEADLINES VIEW */
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {extra.timeframesHeading}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {extra.timeframesSubtitle}
                </p>
              </div>

              {matchedTimeframes.length === 0 ? (
                <div className="text-center py-10 space-y-1.5">
                  <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                    {ui.emptyTitle}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{ui.emptyDesc}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {matchedTimeframes.map((tf) => {
                    const basisDoc = LAW_DOCUMENTS.find((d) => d.id === tf.basisLawId);
                    return (
                      <div
                        key={tf.id}
                        className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between gap-2.5"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                              {tf.title}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-extrabold shrink-0 tabular-nums">
                              {tf.duration}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                            {tf.detail}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200/70 dark:border-neutral-700/70">
                          <span className="text-[11px] font-medium text-neutral-500 truncate">
                            {basisDoc ? `《${basisDoc.shortTitle}》` : ''}
                            {tf.basisArticle}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTimeframeJump(tf.basisLawId, tf.basisArticle)}
                            className="px-2.5 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-amber-700 dark:text-amber-300 inline-flex items-center gap-1 cursor-pointer hover:border-amber-400 shrink-0"
                          >
                            <span>{extra.openBasisStatute}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : modeTab === 'bookmarks' ? (
            /* BOOKMARKS TAB */
            <div className="space-y-5">
              {totalBookmarkCount === 0 ? (
                <div className="text-center py-12 space-y-1.5">
                  <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                    {ui.bookmarksEmptyTitle}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {ui.bookmarksEmptyDesc}
                  </p>
                </div>
              ) : (
                <>
                  {bookmarks.statuteIds.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        {extra.bookmarkedStatutesSection}
                      </h4>
                      {LAW_DOCUMENTS.filter((d) => bookmarks.statuteIds.includes(d.id)).map(
                        (doc) => (
                          <div
                            key={doc.id}
                            onClick={() => openStatute(doc)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openStatute(doc);
                              }
                            }}
                            className="w-full p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 hover:border-amber-400 flex items-center justify-between gap-3 text-start cursor-pointer"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                                {doc.title}
                              </div>
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                {ui.categories[doc.category]} · {doc.articlesCountHint}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStatuteBookmark(doc.id);
                                }}
                                title={ui.bookmarkRemove}
                                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                              >
                                <Bookmark className="w-4 h-4 fill-current" />
                              </button>
                              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 rtl:rotate-180" />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {bookmarkedArticleEntries.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        {extra.bookmarkedArticlesSection}
                      </h4>
                      {bookmarkedArticleEntries.map(({ key, law, article }) => (
                        <div
                          key={key}
                          className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                              《{law.shortTitle}》{article.number}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openStatute(law, article.id)}
                                className="px-2.5 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>{extra.jumpToArticleBtn}</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  copyText(key, `《${law.title}》${article.number}：${article.content}`)
                                }
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
                                title={ui.copyCitation}
                              >
                                {copiedId === key ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleArticleBookmark(law.id, article.id)}
                                className="p-1.5 rounded-lg text-amber-500 cursor-pointer"
                                title={ui.bookmarkRemove}
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                            {article.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedCases.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        {extra.bookmarkedCasesSection}
                      </h4>
                      {matchedCases.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => openCase(c)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openCase(c);
                            }
                          }}
                          className="w-full p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 hover:border-amber-400 flex items-center justify-between gap-3 text-start cursor-pointer"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                              {c.category} · {c.caseNumber}
                            </div>
                            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                              {c.title}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCaseBookmark(c.id);
                              }}
                              title={ui.bookmarkRemove}
                              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                            >
                              <Bookmark className="w-4 h-4 fill-current" />
                            </button>
                            <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 rtl:rotate-180" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : modeTab === 'cases' ? (
            /* CASES LIST VIEW */
            <div className="space-y-3">
              <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 tabular-nums">
                {ui.matchCountCases(matchedCases.length)}
              </div>
              {matchedCases.length === 0 ? (
                <div className="text-center py-10 space-y-1.5">
                  <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                    {ui.emptyTitle}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{ui.emptyDesc}</p>
                </div>
              ) : (
                matchedCases.map((item) => {
                  const saved = isCaseSaved(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => openCase(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openCase(item);
                        }
                      }}
                      className="w-full p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 hover:border-amber-400 dark:hover:border-amber-500/50 text-start transition-colors space-y-1.5 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-neutral-400 tabular-nums">
                            {item.decisionDate}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCaseBookmark(item.id);
                            }}
                            title={saved ? ui.bookmarkRemove : ui.bookmarkAdd}
                            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                              saved
                                ? 'text-amber-500 bg-amber-500/10'
                                : 'text-neutral-400 hover:text-amber-500'
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {highlightMatch(item.title, searchQuery)}
                      </h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">
                        {highlightMatch(item.holding, searchQuery)}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.relatedArticles.slice(0, 2).map((ra) => (
                          <span
                            key={ra}
                            className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400"
                          >
                            {ra}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* STATUTES LIST VIEW */
            <div className="space-y-3">
              {/* Recently Viewed Statutes Strip */}
              {!searchQuery && category === 'all' && scenario === 'all' && recentStatutes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400">
                    {extra.recentStatutesLabel}:
                  </span>
                  {recentStatutes.map((rs) => (
                    <button
                      key={rs.id}
                      type="button"
                      onClick={() => openStatute(rs)}
                      className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer"
                    >
                      《{rs.shortTitle}》
                    </button>
                  ))}
                </div>
              )}

              <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 tabular-nums">
                {ui.matchCountStatutes(matchedStatutes.length)}
              </div>

              {matchedStatutes.length === 0 ? (
                <div className="text-center py-10 space-y-1.5">
                  <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                    {ui.emptyTitle}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{ui.emptyDesc}</p>
                </div>
              ) : (
                matchedStatutes.map((doc) => {
                  const previewArticle =
                    searchQuery.trim() !== ''
                      ? doc.articles.find(
                          (a) =>
                            matchesArticleNumberQuery(a.number, searchQuery) ||
                            a.content.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                            a.summary.toLowerCase().includes(searchQuery.trim().toLowerCase())
                        ) || doc.articles[0]
                      : doc.articles[0];

                  const saved = isStatuteSaved(doc.id);

                  return (
                    <div
                      key={doc.id}
                      onClick={() =>
                        openStatute(
                          doc,
                          searchQuery.trim() ? previewArticle?.id ?? null : null
                        )
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openStatute(
                            doc,
                            searchQuery.trim() ? previewArticle?.id ?? null : null
                          );
                        }
                      }}
                      className="w-full p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 hover:border-amber-400 dark:hover:border-amber-500/50 flex items-center justify-between gap-3 text-start transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap text-[11px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('selection', hapticsEnabled);
                              setCategory(doc.category);
                            }}
                            className="px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-500/15 font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/25 cursor-pointer transition-colors"
                          >
                            {ui.categories[doc.category]}
                          </button>
                          <span className="text-neutral-400 tabular-nums">
                            {doc.articlesCountHint}
                          </span>
                          {fullTextCache[doc.id] && (
                            <>
                              <span className="text-neutral-300 dark:text-neutral-700">·</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                {extra.offlineCachedBadge}
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {highlightMatch(doc.title, searchQuery)}
                        </h3>
                        {previewArticle && (
                          <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">
                            <span className="font-semibold text-amber-700 dark:text-amber-300 me-1">
                              {previewArticle.number}
                            </span>
                            {highlightMatch(previewArticle.content, searchQuery)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatuteBookmark(doc.id);
                          }}
                          title={saved ? ui.bookmarkRemove : ui.bookmarkAdd}
                          className={`p-2 rounded-xl cursor-pointer transition-colors ${
                            saved
                              ? 'text-amber-500 bg-amber-500/10'
                              : 'text-neutral-400 hover:text-amber-500'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                        </button>
                        <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 rtl:rotate-180" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LawsModal;
