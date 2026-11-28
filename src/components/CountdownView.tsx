import React, { useState, useMemo } from 'react';
import { CountdownItem, CountdownCategory } from '../types/countdown';
import { AppSettings, CalendarEvent } from '../types/calendar';
import { getTranslation, getExtraLabels, isRtlLanguage } from '../utils/i18n';
import { toDateString } from '../utils/dateUtils';
import { useSearchHistory } from '../utils/searchHistory';
import { SearchHistoryBar } from './SearchHistoryBar';
import {
  Clock,
  Plus,
  Trash2,
  Pin,
  Heart,
  GraduationCap,
  Cake,
  Plane,
  Sparkles,
  X,
  Pencil,
  Search,
  CalendarPlus,
  Repeat,
  ArrowUpDown,
} from 'lucide-react';

interface CountdownViewProps {
  countdowns: CountdownItem[];
  onUpdateCountdowns: (items: CountdownItem[]) => void;
  onAddToCalendar?: (event: CalendarEvent) => void;
  settings: AppSettings;
  onClose?: () => void;
}

function getEffectiveTargetDate(targetDate: string, repeatMode: CountdownItem['repeatMode'], todayStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return todayStr;
  if (repeatMode === 'none') return targetDate;

  const [ty, tm] = todayStr.split('-').map(Number);
  const [oy, om, od] = targetDate.split('-').map(Number);
  if (!oy || !om || !od) return targetDate;

  if (repeatMode === 'yearly') {
    let year = Math.max(ty, oy);
    const makeSafeDate = (y: number, m: number, d: number) => {
      const lastDay = new Date(y, m, 0).getDate();
      return `${y}-${String(m).padStart(2, '0')}-${String(Math.min(d, lastDay)).padStart(2, '0')}`;
    };
    let candidate = makeSafeDate(year, om, od);
    if (candidate < todayStr) {
      year += 1;
      candidate = makeSafeDate(year, om, od);
    }
    return candidate;
  }

  // monthly repeat
  let year = ty;
  let month = tm;
  const makeMonthly = (y: number, m: number, d: number) => {
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(Math.min(d, lastDay)).padStart(2, '0')}`;
  };
  let candidate = makeMonthly(year, month, od);
  if (candidate < todayStr || candidate < targetDate) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    candidate = makeMonthly(year, month, od);
  }
  return candidate;
}

function diffDaysBetween(fromStr: string, toStr: string): number {
  const [y1, m1, d1] = fromStr.split('-').map(Number);
  const [y2, m2, d2] = toStr.split('-').map(Number);
  const dt1 = Date.UTC(y1, m1 - 1, d1);
  const dt2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((dt2 - dt1) / 86400000);
}

export const CountdownView: React.FC<CountdownViewProps> = ({
  countdowns,
  onUpdateCountdowns,
  onAddToCalendar,
  settings,
  onClose,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);
  const isRtl = isRtlLanguage(settings.language);
  const todayStr = toDateString(new Date());

  const labels = useMemo(() => {
    const map: Record<string, {
      editTitle: string;
      searchPlaceholder: string;
      sortSoonest: string;
      sortNewest: string;
      repeatLabel: string;
      repeatNone: string;
      repeatYearly: string;
      repeatMonthly: string;
      addToCal: string;
      addedToast: string;
      pinnedHero: string;
      nextMilestone: string;
      originDate: string;
    }> = {
      'zh-CN': {
        editTitle: '编辑倒数日',
        searchPlaceholder: '搜索纪念日、目标或备注',
        sortSoonest: '按日期',
        sortNewest: '按创建',
        repeatLabel: '重复周期',
        repeatNone: '不重复',
        repeatYearly: '每年循环',
        repeatMonthly: '每月循环',
        addToCal: '加入日程',
        addedToast: '已同步至日历日程',
        pinnedHero: '置顶焦点',
        nextMilestone: '下个百日纪念',
        originDate: '起始',
      },
      'zh-TW': {
        editTitle: '編輯倒數日',
        searchPlaceholder: '搜尋紀念日、目標或備註',
        sortSoonest: '依日期',
        sortNewest: '依建立',
        repeatLabel: '重複週期',
        repeatYearly: '每年循環',
        repeatMonthly: '每月循環',
        repeatNone: '不重複',
        addToCal: '加入行程',
        addedToast: '已同步至行事曆',
        pinnedHero: '置頂焦點',
        nextMilestone: '下個百日紀念',
        originDate: '起始',
      },
      ja: {
        editTitle: 'カウントダウン編集',
        searchPlaceholder: '記念日・目標・メモを検索',
        sortSoonest: '日付順',
        sortNewest: '作成順',
        repeatLabel: '繰り返し',
        repeatNone: 'なし',
        repeatYearly: '毎年',
        repeatMonthly: '毎月',
        addToCal: '予定に追加',
        addedToast: 'カレンダーに追加しました',
        pinnedHero: 'ピン留め',
        nextMilestone: '次の100日節目',
        originDate: '開始',
      },
      ko: {
        editTitle: '디데이 수정',
        searchPlaceholder: '기념일, 목표, 메모 검색',
        sortSoonest: '날짜순',
        sortNewest: '최신순',
        repeatLabel: '반복 주기',
        repeatNone: '반복 안 함',
        repeatYearly: '매년 반복',
        repeatMonthly: '매월 반복',
        addToCal: '일정 추가',
        addedToast: '캘린더에 추가되었습니다',
        pinnedHero: '고정 디데이',
        nextMilestone: '다음 100일 단위',
        originDate: '기준',
      },
      fr: {
        editTitle: 'Modifier',
        searchPlaceholder: 'Rechercher un compte à rebours',
        sortSoonest: 'Par date',
        sortNewest: 'Récents',
        repeatLabel: 'Répétition',
        repeatNone: 'Aucune',
        repeatYearly: 'Chaque année',
        repeatMonthly: 'Chaque mois',
        addToCal: 'Ajouter au calendrier',
        addedToast: 'Ajouté au calendrier',
        pinnedHero: 'Épinglé',
        nextMilestone: 'Prochain palier 100j',
        originDate: 'Origine',
      },
      ru: {
        editTitle: 'Изменить дату',
        searchPlaceholder: 'Поиск по датам и заметкам',
        sortSoonest: 'По дате',
        sortNewest: 'Новые',
        repeatLabel: 'Повтор',
        repeatNone: 'Не повторять',
        repeatYearly: 'Каждый год',
        repeatMonthly: 'Каждый месяц',
        addToCal: 'В календарь',
        addedToast: 'Добавлено в календарь',
        pinnedHero: 'Закреплено',
        nextMilestone: 'Следующие 100 дн.',
        originDate: 'Начало',
      },
      fa: {
        editTitle: 'ویرایش روزشمار',
        searchPlaceholder: 'جستجو در مناسبت‌ها و یادداشت‌ها',
        sortSoonest: 'بر اساس تاریخ',
        sortNewest: 'جدیدترین',
        repeatLabel: 'تکرار',
        repeatNone: 'بدون تکرار',
        repeatYearly: 'سالانه',
        repeatMonthly: 'ماهانه',
        addToCal: 'افزودن به تقویم',
        addedToast: 'به تقویم اضافه شد',
        pinnedHero: 'پین‌شده',
        nextMilestone: 'صدروز بعدی',
        originDate: 'شروع',
      },
      mn: {
        editTitle: 'Засах',
        searchPlaceholder: 'Огноо, тэмдэглэл хайх',
        sortSoonest: 'Огноогоор',
        sortNewest: 'Шинэ нь эхэндээ',
        repeatLabel: 'Давтамж',
        repeatNone: 'Давтахгүй',
        repeatYearly: 'Жил бүр',
        repeatMonthly: 'Сар бүр',
        addToCal: 'Хуанлид нэмэх',
        addedToast: 'Хуанлид нэмэгдлээ',
        pinnedHero: 'Онцолсон',
        nextMilestone: 'Дараагийн 100 хоног',
        originDate: 'Эхэлсэн',
      },
      ug: {
        editTitle: 'ساناقنى تەھرىرلەش',
        searchPlaceholder: 'خاتىرە كۈن ياكى ئىزاھات ئىزدەش',
        sortSoonest: 'چېسلا تەرتىپى',
        sortNewest: 'يېڭىلىق تەرتىپى',
        repeatLabel: 'تەكرارلاش',
        repeatNone: 'تەكرارلىماسلىق',
        repeatYearly: 'ھەر يىلى',
        repeatMonthly: 'ھەر ئايدا',
        addToCal: 'كالېندارغا قوشۇش',
        addedToast: 'كالېندارغا قوشۇلدى',
        pinnedHero: 'مۇقىملانغان',
        nextMilestone: 'كېيىنكى 100 كۈن',
        originDate: 'باشلىنىش',
      },
      en: {
        editTitle: 'Edit Countdown',
        searchPlaceholder: 'Search countdowns or notes',
        sortSoonest: 'By Date',
        sortNewest: 'Newest',
        repeatLabel: 'Repeat',
        repeatNone: 'None',
        repeatYearly: 'Yearly',
        repeatMonthly: 'Monthly',
        addToCal: 'Add Reminder',
        addedToast: 'Added to Calendar',
        pinnedHero: 'Pinned Spotlight',
        nextMilestone: 'Next 100-day milestone',
        originDate: 'Since',
      },
    };
    return map[settings.language] || map.en;
  }, [settings.language]);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const countdownSearchHistory = useSearchHistory('countdown');
  const commitCountdownSearch = (raw: string) => {
    const clean = raw.trim();
    if (clean.length >= 2) countdownSearchHistory.recordQuery(clean);
  };
  const [sortBy, setSortBy] = useState<'soonest' | 'newest'>('soonest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState(todayStr);
  const [category, setCategory] = useState<CountdownCategory>('anniversary');
  const [repeatMode, setRepeatMode] = useState<CountdownItem['repeatMode']>('none');
  const [isPinned, setIsPinned] = useState(false);
  const [notes, setNotes] = useState('');

  const showNotice = (msg: string) => {
    setLocalNotice(msg);
    window.setTimeout(() => setLocalNotice(null), 2600);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setTargetDate(todayStr);
    setCategory(activeCategory !== 'all' ? (activeCategory as CountdownCategory) : 'anniversary');
    setRepeatMode('none');
    setIsPinned(false);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: CountdownItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    setTitle(item.title);
    setTargetDate(item.targetDate);
    setCategory(item.category);
    setRepeatMode(item.repeatMode || 'none');
    setIsPinned(item.isPinned);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingId) {
      onUpdateCountdowns(
        countdowns.map((c) =>
          c.id === editingId
            ? {
                ...c,
                title: title.trim(),
                targetDate,
                category,
                repeatMode,
                isPinned,
                notes: notes.trim() || undefined,
              }
            : c
        )
      );
    } else {
      const newItem: CountdownItem = {
        id: 'cd-' + Date.now(),
        title: title.trim(),
        targetDate,
        category,
        isPinned,
        notes: notes.trim() || undefined,
        repeatMode,
        createdAt: Date.now(),
      };
      onUpdateCountdowns([newItem, ...countdowns]);
    }

    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateCountdowns(countdowns.filter((c) => c.id !== id));
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateCountdowns(
      countdowns.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  const handleSyncToCalendar = (item: CountdownItem, effectiveDate: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddToCalendar) return;
    const calRecurrence =
      item.repeatMode === 'yearly'
        ? 'yearly'
        : item.repeatMode === 'monthly'
        ? 'monthly'
        : 'none';
    onAddToCalendar({
      id: `evt-cd-${Date.now()}`,
      title: `⏳ ${item.title}`,
      startDate: effectiveDate,
      endDate: effectiveDate,
      isAllDay: true,
      categoryId: 'anniversary',
      recurrence: calRecurrence,
      reminder: '1d',
      description: item.notes || item.targetDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    showNotice(labels.addedToast);
  };

  const enrichedItems = useMemo(() => {
    return countdowns.map((item) => {
      const effectiveDate = getEffectiveTargetDate(item.targetDate, item.repeatMode || 'none', todayStr);
      const diff = diffDaysBetween(todayStr, effectiveDate);
      const createdDateStr = toDateString(new Date(item.createdAt || Date.now()));
      const totalSpan = Math.max(1, diffDaysBetween(createdDateStr, effectiveDate));
      const elapsedSpan = Math.max(0, diffDaysBetween(createdDateStr, todayStr));
      const progressPct = diff <= 0 ? 100 : Math.min(98, Math.max(4, Math.round((elapsedSpan / totalSpan) * 100)));

      // For past non-recurring memories, show next 100-day anniversary milestone
      const rawOriginDiff = diffDaysBetween(item.targetDate, todayStr);
      const nextHundredDays =
        item.repeatMode === 'none' && diff < 0
          ? Math.ceil((rawOriginDiff + 1) / 100) * 100 - rawOriginDiff
          : null;

      return {
        item,
        effectiveDate,
        diff,
        progressPct,
        nextHundredDays,
      };
    });
  }, [countdowns, todayStr]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedItems
      .filter(({ item }) => activeCategory === 'all' || item.category === activeCategory)
      .filter(({ item }) => {
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          (item.notes || '').toLowerCase().includes(q) ||
          item.targetDate.includes(q)
        );
      })
      .sort((a, b) => {
        if (a.item.isPinned && !b.item.isPinned) return -1;
        if (!a.item.isPinned && b.item.isPinned) return 1;
        if (sortBy === 'newest') {
          return (b.item.createdAt || 0) - (a.item.createdAt || 0);
        }
        // Future events soonest first, then past events most recent
        const aFuture = a.diff >= 0;
        const bFuture = b.diff >= 0;
        if (aFuture && !bFuture) return -1;
        if (!aFuture && bFuture) return 1;
        if (aFuture && bFuture) return a.diff - b.diff;
        return b.diff - a.diff;
      });
  }, [enrichedItems, activeCategory, searchQuery, sortBy]);

  const spotlightPinned = useMemo(() => {
    return filtered.find((entry) => entry.item.isPinned) || null;
  }, [filtered]);

  const gridEntries = useMemo(() => {
    if (!spotlightPinned) return filtered;
    return filtered.filter((entry) => entry.item.id !== spotlightPinned.item.id);
  }, [filtered, spotlightPinned]);

  const categoriesList: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: t.countdownCategoryAll, icon: Clock },
    { id: 'anniversary', label: t.countdownCategoryAnniversary, icon: Heart },
    { id: 'exam', label: t.countdownCategoryExam, icon: GraduationCap },
    { id: 'birthday', label: t.countdownCategoryBirthday, icon: Cake },
    { id: 'holiday', label: t.countdownCategoryHoliday, icon: Plane },
    { id: 'life', label: t.countdownCategoryLife, icon: Sparkles },
  ];

  const getCategoryIcon = (cat: CountdownCategory) => {
    switch (cat) {
      case 'anniversary': return Heart;
      case 'exam': return GraduationCap;
      case 'birthday': return Cake;
      case 'holiday': return Plane;
      default: return Sparkles;
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`flex-1 w-full h-full overflow-y-auto max-w-5xl mx-auto select-none flex flex-col ${
        onClose ? 'gap-2.5 px-0 py-0 pb-16 md:pb-1' : 'gap-4 px-4 sm:px-6 py-5 pb-36'
      }`}
    >
      {localNotice && (
        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center shrink-0">
          {localNotice}
        </div>
      )}

      {/* Top Header */}
      {onClose ? (
        <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ backgroundColor: settings.accentColor }}
            >
              <Clock className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
              {t.countdownsTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
              style={{ backgroundColor: settings.accentColor }}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t.addCountdown}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.backButton}
              title={t.backButton}
              className="w-8 h-8 rounded-xl bg-neutral-100/90 dark:bg-white/[0.08] hover:bg-neutral-200/80 dark:hover:bg-white/15 border border-neutral-200/70 dark:border-white/12 text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                style={{ backgroundColor: settings.accentColor }}
              >
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
                {t.countdownsTitle}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t.countdownsDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer self-start sm:self-center shrink-0"
            style={{ backgroundColor: settings.accentColor }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.addCountdown}</span>
          </button>
        </div>
      )}

      {/* Search & Sort Strip */}
      <div className="space-y-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              commitCountdownSearch(searchQuery);
            }}
            className="relative flex-1 min-w-0"
          >
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => commitCountdownSearch(searchQuery)}
              placeholder={labels.searchPlaceholder}
              className="w-full ps-8 pe-3 py-1.5 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </form>
          <button
            type="button"
            onClick={() => setSortBy((s) => (s === 'soonest' ? 'newest' : 'soonest'))}
            className="px-3 py-1.5 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 cursor-pointer shrink-0 hover:border-blue-400"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-500" />
            <span>{sortBy === 'soonest' ? labels.sortSoonest : labels.sortNewest}</span>
          </button>
        </div>

        <SearchHistoryBar
          history={countdownSearchHistory.history}
          language={settings.language}
          onSelectQuery={(q) => {
            setSearchQuery(q);
            countdownSearchHistory.recordQuery(q);
          }}
          onRemoveQuery={countdownSearchHistory.removeQuery}
          onClearHistory={countdownSearchHistory.clearHistory}
          compact
        />
      </div>

      {/* Category Tabs - Balanced 6-category grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 rounded-2xl sm:rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full shrink-0">
        {categoriesList.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl sm:rounded-full text-xs font-semibold transition-all cursor-pointer min-w-0 ${
                isActive
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Pinned Spotlight Card */}
      {spotlightPinned && (
        <div
          onClick={(e) => openEditModal(spotlightPinned.item, e)}
          className="rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-blue-600/[0.09] via-indigo-500/[0.06] to-amber-500/[0.09] dark:from-blue-600/20 dark:via-indigo-500/15 dark:to-amber-500/15 border border-blue-500/25 dark:border-blue-400/25 shadow-sm cursor-pointer transition-all hover:shadow-md shrink-0 space-y-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Pin className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>{labels.pinnedHero}</span>
                {spotlightPinned.item.repeatMode !== 'none' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 text-[10px]">
                    <Repeat className="w-2.5 h-2.5" />
                    {spotlightPinned.item.repeatMode === 'yearly' ? labels.repeatYearly : labels.repeatMonthly}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-neutral-950 dark:text-white truncate">
                {spotlightPinned.item.title}
              </h3>
              <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                {spotlightPinned.effectiveDate}
                {spotlightPinned.effectiveDate !== spotlightPinned.item.targetDate && (
                  <span className="ms-2 opacity-75">({labels.originDate}: {spotlightPinned.item.targetDate})</span>
                )}
              </div>
              {spotlightPinned.item.notes && (
                <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-1">
                  {spotlightPinned.item.notes}
                </p>
              )}
            </div>

            <div className="text-end shrink-0">
              <div className="flex items-baseline justify-end gap-1 font-mono tabular-nums">
                <span className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">
                  {Math.abs(spotlightPinned.diff)}
                </span>
                <span className="text-xs font-bold text-neutral-500">{ui.countdownDaysUnit}</span>
              </div>
              <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                {spotlightPinned.diff === 0
                  ? ui.countdownToday
                  : spotlightPinned.diff < 0
                  ? ui.countdownPast
                  : ui.countdownLeft}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex-1 h-1.5 rounded-full bg-neutral-200/80 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 dark:bg-blue-400 transition-all"
                style={{ width: `${spotlightPinned.progressPct}%` }}
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onAddToCalendar && (
                <button
                  type="button"
                  onClick={(e) => handleSyncToCalendar(spotlightPinned.item, spotlightPinned.effectiveDate, e)}
                  title={labels.addToCal}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 hover:text-blue-600 hover:bg-blue-500/10 cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => openEditModal(spotlightPinned.item, e)}
                title={labels.editTitle}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 hover:text-indigo-600 hover:bg-indigo-500/10 cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => handleTogglePin(spotlightPinned.item.id, e)}
                title={t.countdownPinned}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-500 bg-amber-500/10 cursor-pointer"
              >
                <Pin className="w-4 h-4 fill-current" />
              </button>
              <button
                type="button"
                onClick={(e) => handleDelete(spotlightPinned.item.id, e)}
                title={t.deleteEvent}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-neutral-200/60 dark:border-neutral-800 space-y-2">
          <Clock className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-700" />
          <h4 className="font-bold text-sm text-neutral-700 dark:text-neutral-300">
            {t.emptyCountdownsTitle}
          </h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {t.emptyCountdownsDesc}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {gridEntries.map(({ item, effectiveDate, diff, progressPct, nextHundredDays }) => {
            const isPast = diff < 0;
            const isToday = diff === 0;
            const CatIcon = getCategoryIcon(item.category);

            return (
              <div
                key={item.id}
                onClick={(e) => openEditModal(item, e)}
                className="group relative p-4 rounded-3xl bg-white/85 dark:bg-neutral-900/80 backdrop-blur-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:shadow-md hover:border-blue-400/50 transition-all flex flex-col justify-between min-h-[152px] cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 pt-1">
                      <CatIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {onAddToCalendar && (
                        <button
                          type="button"
                          onClick={(e) => handleSyncToCalendar(item, effectiveDate, e)}
                          className="w-7 h-7 rounded-xl flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 text-neutral-400 hover:text-blue-600 hover:bg-blue-500/10 transition-all cursor-pointer"
                          title={labels.addToCal}
                          aria-label={labels.addToCal}
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title={t.deleteEvent}
                        aria-label={t.deleteEvent}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(item.id, e)}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs transition-colors cursor-pointer ${
                          item.isPinned ? 'text-amber-500 bg-amber-500/10' : 'text-neutral-300 hover:text-neutral-500 hover:bg-neutral-500/10'
                        }`}
                        title={t.countdownPinned}
                        aria-label={t.countdownPinned}
                      >
                        <Pin className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 mt-0.5">
                    <span>{effectiveDate}</span>
                    {item.repeatMode !== 'none' && (
                      <span className="inline-flex items-center gap-0.5 text-blue-500 dark:text-blue-400 font-sans font-semibold">
                        <Repeat className="w-3 h-3" />
                        {item.repeatMode === 'yearly' ? labels.repeatYearly : labels.repeatMonthly}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2">
                      {item.notes}
                    </p>
                  )}
                  {nextHundredDays !== null && (
                    <div className="text-[10.5px] font-semibold text-amber-600 dark:text-amber-400 mt-1.5">
                      {labels.nextMilestone}: +{nextHundredDays} {ui.countdownDaysUnit}
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  <div className="h-1 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isToday ? 'bg-emerald-500' : isPast ? 'bg-neutral-400' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-end justify-between">
                    <div className="text-xs text-neutral-400 font-medium">
                      {isToday ? ui.countdownToday : isPast ? ui.countdownPast : ui.countdownLeft}
                    </div>
                    <div className="flex items-baseline gap-1 font-mono tabular-nums">
                      <span
                        className={`text-2xl font-black ${
                          isToday
                            ? 'text-emerald-500'
                            : isPast
                            ? 'text-neutral-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {Math.abs(diff)}
                      </span>
                      <span className="text-xs font-bold text-neutral-500">{ui.countdownDaysUnit}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-black/60 backdrop-blur-md animate-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <form
            onSubmit={handleSave}
            className="w-full max-w-md max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl space-y-4 animate-modal-sheet"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {editingId ? labels.editTitle : t.addCountdown}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label={t.cancel}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                {ui.countdownTitleField}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.countdownTitlePlaceholder}
                className="w-full p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  {t.countdownTargetDate}
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  {ui.countdownCategoryField}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CountdownCategory)}
                  className="w-full p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100"
                >
                  <option value="anniversary">{t.countdownCategoryAnniversary}</option>
                  <option value="exam">{t.countdownCategoryExam}</option>
                  <option value="birthday">{t.countdownCategoryBirthday}</option>
                  <option value="holiday">{t.countdownCategoryHoliday}</option>
                  <option value="life">{t.countdownCategoryLife}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                {labels.repeatLabel}
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                {[
                  { id: 'none' as const, label: labels.repeatNone },
                  { id: 'yearly' as const, label: labels.repeatYearly },
                  { id: 'monthly' as const, label: labels.repeatMonthly },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRepeatMode(opt.id)}
                    className={`py-1.5 px-2 rounded-full transition-all cursor-pointer truncate ${
                      repeatMode === opt.id
                        ? 'bg-white dark:bg-neutral-700 text-neutral-950 dark:text-white font-bold shadow-2xs'
                        : 'text-neutral-500 dark:text-neutral-400 font-semibold'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                {ui.countdownNotesField}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.countdownNotesPlaceholder}
                rows={3}
                className="w-full p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>{t.countdownPinned}</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-blue-600 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {ui.countdownSaveBtn}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
