import React, { useState, useMemo } from 'react';
import { CalendarEvent, EventCategory, AppSettings, Language } from '../types/calendar';
import { getTranslation, getExtraLabels, isRtlLanguage } from '../utils/i18n';
import { getLawsI18n } from '../utils/fabModalI18n';
import { getCategoryDisplayName } from '../utils/storage';
import { toDateString } from '../utils/dateUtils';
import { normalizeSearchText } from '../data/worldCities';
import {
  LAW_DOCUMENTS,
  JUDICIAL_CASES,
  LawCategory,
  LawDocument,
  LawArticle,
  JudicialCase,
  matchesArticleNumberQuery,
} from '../data/lawsData';
import { useSearchHistory } from '../utils/searchHistory';
import { SearchHistoryBar } from './SearchHistoryBar';
import { LawsInitialTarget } from './LawsModal';
import {
  Search,
  X,
  Calendar,
  Clock,
  MapPin,
  Bell,
  BellOff,
  Tag,
  Scale,
  Gavel,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  categories: EventCategory[];
  settings: AppSettings;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectLawResult?: (target: Omit<LawsInitialTarget, 'seq'>) => void;
}

type DateRangePreset = 'all' | 'today' | 'week' | 'month' | 'custom';
type ReminderFilter = 'all' | 'with' | 'none';
type SearchScopeTab = 'all' | 'events' | 'laws';

const FILTER_LABELS: Record<
  Language,
  {
    anyDate: string;
    next7d: string;
    thisMonth: string;
    range: string;
    allRem: string;
    reminded: string;
    muted: string;
    scopeAll: string;
    scopeEvents: string;
    scopeLaws: string;
    lawBranchLabel: string;
    lawsSectionHeading: string;
    eventsSectionHeading: string;
    searchAllPlaceholder: string;
  }
> = {
  'zh-CN': {
    anyDate: '全部日期',
    next7d: '近7天',
    thisMonth: '本月',
    range: '区间',
    allRem: '全部提醒',
    reminded: '有提醒',
    muted: '无提醒',
    scopeAll: '全部结果',
    scopeEvents: '日程待办',
    scopeLaws: '法律法规',
    lawBranchLabel: '法规门类',
    lawsSectionHeading: '法律法规与典型案例',
    eventsSectionHeading: '日程与待办事项',
    searchAllPlaceholder: '搜索日程、地点、法条号（如 第577条 / 民法 / 刑法）或案例...',
  },
  'zh-TW': {
    anyDate: '全部日期',
    next7d: '近7天',
    thisMonth: '本月',
    range: '區間',
    allRem: '全部提醒',
    reminded: '有提醒',
    muted: '無提醒',
    scopeAll: '全部結果',
    scopeEvents: '日程待辦',
    scopeLaws: '法律法規',
    lawBranchLabel: '法規門類',
    lawsSectionHeading: '法律法規與典型案例',
    eventsSectionHeading: '日程與待辦事項',
    searchAllPlaceholder: '搜尋日程、地點、法條號（如 第577條 / 民法 / 刑法）或案例...',
  },
  en: {
    anyDate: 'Any date',
    next7d: 'Next 7d',
    thisMonth: 'This month',
    range: 'Range',
    allRem: 'All',
    reminded: 'Reminded',
    muted: 'Muted',
    scopeAll: 'All',
    scopeEvents: 'Events',
    scopeLaws: 'Laws & Cases',
    lawBranchLabel: 'Law Branch',
    lawsSectionHeading: 'Statutes & Judicial Cases',
    eventsSectionHeading: 'Calendar Events',
    searchAllPlaceholder: 'Search events, locations, statutes, articles or cases...',
  },
  ja: {
    anyDate: '全期間',
    next7d: '今後7日',
    thisMonth: '今月',
    range: '範囲指定',
    allRem: 'すべて',
    reminded: '通知あり',
    muted: '通知なし',
    scopeAll: 'すべて',
    scopeEvents: '予定',
    scopeLaws: '法令・判例',
    lawBranchLabel: '法分野',
    lawsSectionHeading: '法令・判例',
    eventsSectionHeading: 'カレンダー予定',
    searchAllPlaceholder: '予定・場所・法令・条文番号・判例を検索...',
  },
  ko: {
    anyDate: '전체 기간',
    next7d: '향후 7일',
    thisMonth: '이번 달',
    range: '기간 선택',
    allRem: '전체',
    reminded: '알림 있음',
    muted: '알림 없음',
    scopeAll: '전체',
    scopeEvents: '일정',
    scopeLaws: '법령·판례',
    lawBranchLabel: '법령 분류',
    lawsSectionHeading: '법령 및 판례',
    eventsSectionHeading: '캘린더 일정',
    searchAllPlaceholder: '일정, 장소, 법령, 조문 번호 또는 판례 검색...',
  },
  fr: {
    anyDate: 'Toute date',
    next7d: '7 proch. j.',
    thisMonth: 'Ce mois',
    range: 'Plage',
    allRem: 'Tout',
    reminded: 'Avec rappel',
    muted: 'Sans rappel',
    scopeAll: 'Tout',
    scopeEvents: 'Agenda',
    scopeLaws: 'Lois & Arrêts',
    lawBranchLabel: 'Branche',
    lawsSectionHeading: 'Lois et Jurisprudence',
    eventsSectionHeading: 'Événements',
    searchAllPlaceholder: 'Rechercher événements, lois, articles ou arrêts...',
  },
  fa: {
    anyDate: 'همه تاریخ‌ها',
    next7d: '۷ روز آینده',
    thisMonth: 'این ماه',
    range: 'بازه',
    allRem: 'همه',
    reminded: 'با یادآور',
    muted: 'بدون یادآور',
    scopeAll: 'همه',
    scopeEvents: 'رویدادها',
    scopeLaws: 'قوانین و آرا',
    lawBranchLabel: 'شاخه حقوقی',
    lawsSectionHeading: 'قوانین و آرای قضایی',
    eventsSectionHeading: 'رویدادهای تقویم',
    searchAllPlaceholder: 'جستجو در رویدادها، قوانین، مواد یا آرای قضایی...',
  },
  mn: {
    anyDate: 'Бүх огноо',
    next7d: 'Дараах 7 хоног',
    thisMonth: 'Энэ сар',
    range: 'Муж',
    allRem: 'Бүгд',
    reminded: 'Сануулгатай',
    muted: 'Сануулгагүй',
    scopeAll: 'Бүгд',
    scopeEvents: 'Хуваарь',
    scopeLaws: 'Хууль, жишиг',
    lawBranchLabel: 'Хуулийн салбар',
    lawsSectionHeading: 'Хууль тогтоомж ба жишиг хэрэг',
    eventsSectionHeading: 'Хуанлийн үйл явдал',
    searchAllPlaceholder: 'Үйл явдал, хууль, зүйл заалт, жишиг хэрэг хайх...',
  },
  ru: {
    anyDate: 'Любая дата',
    next7d: 'След. 7 дн.',
    thisMonth: 'Этот месяц',
    range: 'Период',
    allRem: 'Все',
    reminded: 'С напом.',
    muted: 'Без напом.',
    scopeAll: 'Все',
    scopeEvents: 'События',
    scopeLaws: 'Законы и дела',
    lawBranchLabel: 'Отрасль',
    lawsSectionHeading: 'Законы и судебная практика',
    eventsSectionHeading: 'События календаря',
    searchAllPlaceholder: 'Поиск событий, законов, статей или судебных дел...',
  },
  ug: {
    anyDate: 'بارلىق كۈن',
    next7d: 'كېلەر 7 كۈن',
    thisMonth: 'بۇ ئاي',
    range: 'ئارىلىق',
    allRem: 'ھەممە',
    reminded: 'ئەسكەرتىش بار',
    muted: 'ئەسكەرتىش يوق',
    scopeAll: 'ھەممىسى',
    scopeEvents: 'كۈنتەرتىپ',
    scopeLaws: 'قانۇن-دېلو',
    lawBranchLabel: 'قانۇن تۈرى',
    lawsSectionHeading: 'قانۇن-نىزام ۋە تىپىك دېلولار',
    eventsSectionHeading: 'كۈنتەرتىپ ۋە ۋەزىپىلەر',
    searchAllPlaceholder: 'كۈنتەرتىپ، قانۇن، ماددا نومۇرى ياكى دېلو ئىزدەڭ...',
  },
};

const LAW_CATEGORY_ORDER: LawCategory[] = [
  'all',
  'constitution',
  'civil_commercial',
  'criminal',
  'administrative',
  'economic_social',
  'procedural',
  'cases',
];

const LAW_TAG_TONE: Record<Exclude<LawCategory, 'all'>, string> = {
  constitution: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30',
  civil_commercial: 'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/30',
  criminal: 'bg-red-500/12 text-red-700 dark:text-red-300 border-red-500/30',
  administrative: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/30',
  economic_social: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  procedural: 'bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-500/30',
  cases: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
};

const tokenizeText = (text: string): string[] => {
  const normalized = normalizeSearchText(text);
  if (!normalized) return [];
  const tokens = new Set<string>();
  const words = normalized.split(/[\s,.;:!?()[\]{}<>/\\|"'`~@#$%^&*+=_-]+/).filter(Boolean);
  for (const w of words) {
    tokens.add(w);
    if (/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(w)) {
      for (let i = 0; i < w.length; i++) {
        tokens.add(w[i]);
        if (i + 1 < w.length) tokens.add(w.slice(i, i + 2));
      }
    }
  }
  return Array.from(tokens);
};

function inferCaseBranch(caseCategory: string): Exclude<LawCategory, 'all' | 'cases'> {
  if (caseCategory.includes('刑')) return 'criminal';
  if (caseCategory.includes('行政')) return 'administrative';
  if (caseCategory.includes('劳动') || caseCategory.includes('工伤') || caseCategory.includes('消费')) {
    return 'economic_social';
  }
  if (caseCategory.includes('程序') || caseCategory.includes('执行') || caseCategory.includes('诉讼')) {
    return 'procedural';
  }
  return 'civil_commercial';
}

type LawSearchHit =
  | {
      kind: 'statute';
      id: string;
      law: LawDocument;
      matchedArticle: LawArticle | null;
      branch: Exclude<LawCategory, 'all' | 'cases'>;
    }
  | {
      kind: 'case';
      id: string;
      judicialCase: JudicialCase;
      branch: Exclude<LawCategory, 'all' | 'cases'>;
    };

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  events,
  categories,
  settings,
  onSelectEvent,
  onSelectLawResult,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);
  const lawsUi = getLawsI18n(settings.language);
  const isRtl = isRtlLanguage(settings.language);
  const fl = FILTER_LABELS[settings.language] || FILTER_LABELS.en;
  const todayStr = toDateString(new Date());

  const { history, recordQuery, removeQuery, clearHistory } = useSearchHistory('global_search');

  const [query, setQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScopeTab>('all');
  const [lawCategoryFilter, setLawCategoryFilter] = useState<LawCategory>('all');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [customFromDate, setCustomFromDate] = useState<string>(todayStr);
  const [customToDate, setCustomToDate] = useState<string>(todayStr);
  const [reminderFilter, setReminderFilter] = useState<ReminderFilter>('all');

  const categoryMap = useMemo(() => {
    const map = new Map<string, EventCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Full-text inverted index across title, notes, location, tags, checklist, category name, and dates
  const fullTextIndex = useMemo(() => {
    const index = new Map<string, Set<string>>();
    const docTextMap = new Map<string, string>();

    events.forEach((evt) => {
      if (evt.isInTrash) return;
      const cat = categoryMap.get(evt.categoryId);
      const catName = cat ? getCategoryDisplayName(cat, settings.language) : '';
      const checklistText = (evt.checklist || []).map((c) => c.text).join(' ');
      const tagsText = (evt.tags || []).join(' ');
      const combined = normalizeSearchText(
        [
          evt.title,
          evt.description || '',
          evt.location || '',
          checklistText,
          tagsText,
          catName,
          evt.priority || '',
          evt.startDate || '',
          evt.endDate || '',
        ].join(' ')
      );

      docTextMap.set(evt.id, combined);
      const tokens = tokenizeText(combined);
      tokens.forEach((tok) => {
        let bucket = index.get(tok);
        if (!bucket) {
          bucket = new Set<string>();
          index.set(tok, bucket);
        }
        bucket.add(evt.id);
      });
    });

    return { index, docTextMap };
  }, [events, categoryMap, settings.language]);

  const dateBounds = useMemo(() => {
    if (datePreset === 'all') return null;
    if (datePreset === 'today') return { from: todayStr, to: todayStr };
    if (datePreset === 'week') {
      const end = new Date();
      end.setDate(end.getDate() + 7);
      return { from: todayStr, to: toDateString(end) };
    }
    if (datePreset === 'month') {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: toDateString(first), to: toDateString(last) };
    }
    return {
      from: customFromDate || '',
      to: customToDate || '',
    };
  }, [datePreset, todayStr, customFromDate, customToDate]);

  const hasActiveFilter =
    Boolean(query.trim()) ||
    selectedCatId !== 'all' ||
    datePreset !== 'all' ||
    reminderFilter !== 'all' ||
    lawCategoryFilter !== 'all' ||
    searchScope === 'laws';

  const filteredEvents = useMemo(() => {
    if (!hasActiveFilter || searchScope === 'laws' || lawCategoryFilter !== 'all') return [];

    const q = normalizeSearchText(query);
    let candidateIds: Set<string> | null = null;

    if (q) {
      const qTokens = tokenizeText(q);
      for (const tok of qTokens) {
        const matched = fullTextIndex.index.get(tok);
        if (!matched || matched.size === 0) {
          candidateIds = new Set<string>();
          break;
        }
        if (candidateIds === null) {
          candidateIds = new Set(matched);
        } else {
          const nextSet = new Set<string>();
          candidateIds.forEach((id) => {
            if (matched.has(id)) nextSet.add(id);
          });
          candidateIds = nextSet;
        }
      }
    }

    const qTerms = q.split(/\s+/).filter(Boolean);

    return events
      .filter((e) => {
        if (e.isInTrash) return false;
        if (selectedCatId !== 'all' && e.categoryId !== selectedCatId) return false;

        if (reminderFilter === 'with' && (!e.reminder || e.reminder === 'none')) return false;
        if (reminderFilter === 'none' && e.reminder && e.reminder !== 'none') return false;

        if (dateBounds) {
          if (dateBounds.from && (e.endDate || e.startDate) < dateBounds.from) return false;
          if (dateBounds.to && e.startDate > dateBounds.to) return false;
        }

        if (!q) return true;

        const docText = fullTextIndex.docTextMap.get(e.id) || normalizeSearchText(e.title);
        if (candidateIds !== null && candidateIds.has(e.id)) {
          return qTerms.every((term) => docText.includes(term));
        }
        return docText.includes(q) || qTerms.every((term) => docText.includes(term));
      })
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  }, [
    hasActiveFilter,
    searchScope,
    lawCategoryFilter,
    query,
    fullTextIndex,
    events,
    selectedCatId,
    reminderFilter,
    dateBounds,
  ]);

  const filteredLawHits = useMemo<LawSearchHit[]>(() => {
    if (!hasActiveFilter || searchScope === 'events') return [];
    // If user explicitly picked event filters without a query & didn't ask for laws, avoid noisy empty law matches
    if (
      !query.trim() &&
      lawCategoryFilter === 'all' &&
      searchScope === 'all' &&
      (selectedCatId !== 'all' || datePreset !== 'all' || reminderFilter !== 'all')
    ) {
      return [];
    }

    const q = query.trim().toLowerCase();
    const hits: LawSearchHit[] = [];

    if (lawCategoryFilter !== 'cases') {
      for (const doc of LAW_DOCUMENTS) {
        if (lawCategoryFilter !== 'all' && doc.category !== lawCategoryFilter) continue;
        const branchLabel = lawsUi.categories[doc.category].toLowerCase();
        const matchedArticle = q
          ? doc.articles.find(
              (art) =>
                matchesArticleNumberQuery(art.number, q) ||
                art.chapter.toLowerCase().includes(q) ||
                art.summary.toLowerCase().includes(q) ||
                art.content.toLowerCase().includes(q)
            ) ?? null
          : doc.articles[0] ?? null;

        if (!q) {
          hits.push({
            kind: 'statute',
            id: `law-${doc.id}`,
            law: doc,
            matchedArticle,
            branch: doc.category,
          });
          continue;
        }

        const docMatches =
          doc.title.toLowerCase().includes(q) ||
          doc.shortTitle.toLowerCase().includes(q) ||
          branchLabel.includes(q) ||
          doc.tags.some((tg) => tg.toLowerCase().includes(q)) ||
          Boolean(matchedArticle);

        if (docMatches) {
          hits.push({
            kind: 'statute',
            id: `law-${doc.id}`,
            law: doc,
            matchedArticle,
            branch: doc.category,
          });
        }
      }
    }

    for (const c of JUDICIAL_CASES) {
      const inferredBranch = inferCaseBranch(c.category);
      if (
        lawCategoryFilter !== 'all' &&
        lawCategoryFilter !== 'cases' &&
        inferredBranch !== lawCategoryFilter
      ) {
        continue;
      }

      if (
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.caseNumber.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.tags.some((tg) => tg.toLowerCase().includes(q)) ||
        c.facts.toLowerCase().includes(q) ||
        c.holding.toLowerCase().includes(q) ||
        c.relatedArticles.some((ra) => ra.toLowerCase().includes(q))
      ) {
        hits.push({
          kind: 'case',
          id: `case-${c.id}`,
          judicialCase: c,
          branch: inferredBranch,
        });
      }
    }

    return hits;
  }, [
    hasActiveFilter,
    searchScope,
    query,
    lawCategoryFilter,
    selectedCatId,
    datePreset,
    reminderFilter,
    lawsUi.categories,
  ]);

  const getLawTagLabel = (cat: LawCategory): string => {
    if (cat === 'cases') return lawsUi.modes.cases;
    return lawsUi.categories[cat];
  };

  const commitHistoryIfValid = (raw: string) => {
    const clean = raw.trim();
    if (clean.length >= 2) {
      recordQuery(clean);
    }
  };

  const renderHighlightedTitle = (title: string) => {
    const q = query.trim();
    if (!q) return title;
    const terms = q
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (terms.length === 0) return title;

    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    const parts = title.split(regex);
    return parts.map((part, idx) =>
      idx % 2 === 1 ? (
        <mark
          key={idx}
          className="bg-amber-300/65 dark:bg-amber-500/35 text-neutral-950 dark:text-amber-100 rounded px-0.5 font-extrabold"
        >
          {part}
        </mark>
      ) : (
        <React.Fragment key={idx}>{part}</React.Fragment>
      )
    );
  };

  if (!isOpen) return null;

  const totalResultsCount = filteredEvents.length + filteredLawHits.length;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 sm:pt-5 bg-black/55 backdrop-blur-md select-none overflow-y-auto animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl border border-white/80 dark:border-white/15 shadow-2xl p-4 sm:p-5 space-y-3 max-h-[calc(100dvh-3.25rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col animate-modal-sheet"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            commitHistoryIfValid(query);
          }}
          className="relative"
        >
          <Search className="w-4 h-4 text-blue-500 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => commitHistoryIfValid(query)}
            placeholder={fl.searchAllPlaceholder || t.searchPlaceholder}
            className="w-full ps-10 pe-20 py-3 rounded-2xl bg-white/80 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/12 text-sm font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute end-11 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label={t.backButton}
            className="absolute end-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200/60 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        {/* Global Recent Search History */}
        <SearchHistoryBar
          history={history}
          language={settings.language}
          onSelectQuery={(q) => {
            setQuery(q);
            recordQuery(q);
          }}
          onRemoveQuery={removeQuery}
          onClearHistory={clearHistory}
          compact
        />

        {/* Scope Switcher: All | Events | Laws */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.07] border border-neutral-200/75 dark:border-white/10 text-xs">
          {(
            [
              { id: 'all', label: fl.scopeAll },
              { id: 'events', label: fl.scopeEvents },
              { id: 'laws', label: fl.scopeLaws },
            ] as const
          ).map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => {
                setSearchScope(sc.id);
                if (sc.id === 'events') setLawCategoryFilter('all');
              }}
              className={`py-1.5 px-2 rounded-full font-bold transition-all cursor-pointer truncate ${
                searchScope === sc.id
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Law Category Filter Tags (宪法 / 民商法 / 刑法 / 行政法 / 经济与社会法 / 诉讼程序法 / 典型案例) */}
        {searchScope !== 'events' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
            <Scale className="w-3.5 h-3.5 text-amber-500 shrink-0 me-0.5" />
            <span className="text-[10.5px] font-bold text-neutral-400 shrink-0">
              {fl.lawBranchLabel}:
            </span>
            {LAW_CATEGORY_ORDER.map((cat) => {
              const active = lawCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setLawCategoryFilter(cat);
                    if (cat !== 'all' && searchScope === 'all') {
                      setSearchScope('laws');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-full font-bold transition-all shrink-0 cursor-pointer border ${
                    active
                      ? 'bg-amber-600 border-amber-600 text-white shadow-2xs'
                      : 'bg-white/75 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 border-neutral-200/70 dark:border-white/10 hover:border-amber-400/70'
                  }`}
                >
                  {getLawTagLabel(cat)}
                </button>
              );
            })}
          </div>
        )}

        {/* Event Category & Date Filters (hidden when focusing solely on Laws) */}
        {searchScope !== 'laws' && (
          <>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
              <Tag className="w-3.5 h-3.5 text-violet-500 shrink-0 me-0.5" />
              <button
                type="button"
                onClick={() => setSelectedCatId('all')}
                className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCatId === 'all'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'bg-white/70 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-white/10'
                }`}
              >
                {t.allCategories}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`px-3 py-1 rounded-xl font-semibold transition-all shrink-0 cursor-pointer backdrop-blur-md border ${
                    selectedCatId === cat.id
                      ? 'shadow-2xs font-bold'
                      : 'bg-white/70 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 border-neutral-200/60 dark:border-white/10'
                  }`}
                  style={
                    selectedCatId === cat.id
                      ? { backgroundColor: `${cat.color}22`, borderColor: `${cat.color}66`, color: cat.color }
                      : undefined
                  }
                >
                  {getCategoryDisplayName(cat, settings.language)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1 flex-wrap">
                <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0 me-0.5" />
                {(
                  [
                    { id: 'all', label: fl.anyDate },
                    { id: 'today', label: t.today },
                    { id: 'week', label: fl.next7d },
                    { id: 'month', label: fl.thisMonth },
                    { id: 'custom', label: fl.range },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDatePreset(item.id)}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                      datePreset === item.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white/70 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0 me-0.5" />
                {(
                  [
                    { id: 'all', label: fl.allRem },
                    { id: 'with', label: fl.reminded },
                    { id: 'none', label: fl.muted },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReminderFilter(item.id)}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                      reminderFilter === item.id
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-white/70 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 text-xs p-2 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-neutral-200/70 dark:border-white/10">
                <input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="flex-1 px-2.5 py-1 rounded-xl bg-white/85 dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/12 font-mono text-xs"
                />
                <span className="text-neutral-400 font-bold">→</span>
                <input
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="flex-1 px-2.5 py-1 rounded-xl bg-white/85 dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/12 font-mono text-xs"
                />
              </div>
            )}
          </>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-3 pt-0.5">
          {hasActiveFilter ? (
            totalResultsCount === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                {t.noEventsFound}
              </div>
            ) : (
              <>
                {/* Laws & Judicial Cases Results */}
                {filteredLawHits.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300 px-0.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5" />
                        <span>{fl.lawsSectionHeading}</span>
                      </span>
                      <span className="tabular-nums opacity-80">{filteredLawHits.length}</span>
                    </div>

                    {filteredLawHits.map((hit) => {
                      if (hit.kind === 'statute') {
                        const doc = hit.law;
                        const branchTone = LAW_TAG_TONE[hit.branch];
                        return (
                          <div
                            key={hit.id}
                            onClick={() => {
                              commitHistoryIfValid(query);
                              onSelectLawResult?.({
                                lawId: doc.id,
                                articleId: hit.matchedArticle?.id,
                              });
                              onClose();
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                commitHistoryIfValid(query);
                                onSelectLawResult?.({
                                  lawId: doc.id,
                                  articleId: hit.matchedArticle?.id,
                                });
                                onClose();
                              }
                            }}
                            className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.05] backdrop-blur-md border border-neutral-200/75 dark:border-white/10 hover:border-amber-400/70 cursor-pointer flex items-start justify-between gap-3 transition-all"
                          >
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLawCategoryFilter(hit.branch);
                                    setSearchScope('laws');
                                  }}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer hover:brightness-95 transition-all inline-flex items-center gap-1 ${branchTone}`}
                                >
                                  <BookOpen className="w-2.5 h-2.5" />
                                  <span>{lawsUi.categories[hit.branch]}</span>
                                </button>
                                <span className="text-[10.5px] text-neutral-400 tabular-nums">
                                  {doc.articlesCountHint}
                                </span>
                              </div>
                              <div className="text-xs sm:text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                                {renderHighlightedTitle(doc.title)}
                              </div>
                              {hit.matchedArticle && (
                                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                                  <span className="font-bold text-amber-700 dark:text-amber-300 me-1">
                                    {hit.matchedArticle.number}
                                  </span>
                                  {renderHighlightedTitle(hit.matchedArticle.content)}
                                </p>
                              )}
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                          </div>
                        );
                      }

                      const jc = hit.judicialCase;
                      return (
                        <div
                          key={hit.id}
                          onClick={() => {
                            commitHistoryIfValid(query);
                            onSelectLawResult?.({ caseId: jc.id });
                            onClose();
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              commitHistoryIfValid(query);
                              onSelectLawResult?.({ caseId: jc.id });
                              onClose();
                            }
                          }}
                          className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.05] backdrop-blur-md border border-neutral-200/75 dark:border-white/10 hover:border-indigo-400/70 cursor-pointer flex items-start justify-between gap-3 transition-all"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLawCategoryFilter('cases');
                                  setSearchScope('laws');
                                }}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer hover:brightness-95 transition-all inline-flex items-center gap-1 ${LAW_TAG_TONE.cases}`}
                              >
                                <Gavel className="w-2.5 h-2.5" />
                                <span>{lawsUi.modes.cases}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLawCategoryFilter(hit.branch);
                                  setSearchScope('laws');
                                }}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer hover:brightness-95 transition-all ${LAW_TAG_TONE[hit.branch]}`}
                              >
                                {lawsUi.categories[hit.branch]}
                              </button>
                              <span className="text-[10.5px] text-neutral-400 tabular-nums">
                                {jc.decisionDate}
                              </span>
                            </div>
                            <div className="text-xs sm:text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                              {renderHighlightedTitle(jc.title)}
                            </div>
                            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                              {renderHighlightedTitle(jc.holding)}
                            </p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-indigo-500 shrink-0 mt-1" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Calendar Events Results */}
                {filteredEvents.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400 px-0.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{fl.eventsSectionHeading}</span>
                      </span>
                      <span className="tabular-nums opacity-80">{filteredEvents.length}</span>
                    </div>

                    {filteredEvents.map((evt) => {
                      const cat = categoryMap.get(evt.categoryId);
                      const color = evt.color || cat?.color || settings.accentColor;
                      const hasReminder = evt.reminder && evt.reminder !== 'none';

                      return (
                        <div
                          key={evt.id}
                          onClick={() => {
                            commitHistoryIfValid(query);
                            onSelectEvent(evt);
                            onClose();
                          }}
                          className="p-3.5 rounded-2xl bg-white/75 dark:bg-white/[0.05] backdrop-blur-md border border-neutral-200/70 dark:border-white/10 cursor-pointer hover:border-blue-400/60 dark:hover:border-blue-400/50 flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="text-xs sm:text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                              {renderHighlightedTitle(evt.title)}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10.5px] text-neutral-500 dark:text-neutral-400 font-mono tabular-nums">
                              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                                <Calendar className="w-3 h-3 shrink-0" />
                                <span>{evt.startDate}</span>
                              </span>
                              {!evt.isAllDay && evt.startTime && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                                  <span>{evt.startTime}</span>
                                </span>
                              )}
                              {evt.location && (
                                <span className="inline-flex items-center gap-1 font-sans">
                                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span className="truncate max-w-[140px]">{evt.location}</span>
                                </span>
                              )}
                              {hasReminder ? (
                                <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-sans">
                                  <Bell className="w-3 h-3 shrink-0" />
                                  <span>{evt.reminder}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-neutral-400 font-sans">
                                  <BellOff className="w-3 h-3 shrink-0" />
                                </span>
                              )}
                            </div>
                          </div>

                          {cat && (
                            <span
                              className="text-[10px] px-2.5 py-1 rounded-xl font-bold shrink-0 backdrop-blur-md border"
                              style={{
                                backgroundColor: `${color}1F`,
                                borderColor: `${color}4D`,
                                color,
                              }}
                            >
                              {getCategoryDisplayName(cat, settings.language)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )
          ) : (
            <div className="py-12 text-center text-xs text-neutral-400">
              {ui.searchEmptyPrompt}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

