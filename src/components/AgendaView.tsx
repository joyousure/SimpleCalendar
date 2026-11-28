import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CalendarEvent,
  EventCategory,
  AppSettings,
  HabitItem,
  HabitLogEntry,
  SmartFilterRule,
  TaskFolder,
  TaskKind,
  TaskTemplate,
} from '../types/calendar';
import { toDateString, getEventsForDate } from '../utils/dateUtils';
import { getLocaleCode, isRtlLanguage } from '../utils/i18n';
import { getCategoryDisplayName, ACCENT_PALETTES } from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';
import { normalizeSearchText } from '../data/worldCities';
import { PomodoroTimer } from './PomodoroTimer';
import { useSearchHistory } from '../utils/searchHistory';
import { SearchHistoryBar } from './SearchHistoryBar';
import {
  computeFocusAnalytics,
  FOCUS_UPDATED_EVENT,
  loadFocusPrefs,
  loadFocusSessions,
} from '../utils/focusStorage';
import {
  AgendaSortMode,
  FocusPreferenceMode,
  buildFocusProfileContext,
  sortAgendaTasks,
} from '../utils/taskSorting';
import {
  TickTickWorkspaceState,
  TICKTICK_UPDATED_EVENT,
  addDaysToDateStr,
  advanceRecurringTaskOnComplete,
  computeTickTickAnalytics,
  getHabitLogForDate,
  getTickTickLabels,
  hydrateTickTickStateFromIdb,
  isHabitScheduledOnDate,
  loadTickTickState,
  matchesSmartFilter,
  parseNaturalTaskInput,
  saveTickTickState,
} from '../utils/ticktickEngine';
import { TaskInspectorModal } from './TaskInspectorModal';
import { HabitTrackerPanel } from './HabitTrackerPanel';
import { TickTickStatsPanel } from './TickTickStatsPanel';
import {
  KanbanGroupMode,
  TickTickKanbanBoard,
  TickTickTimelineView,
} from './TickTickTimelineView';
import {
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  AlertCircle,
  CheckSquare,
  Search,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  ArrowUpDown,
  Zap,
  Target,
  LayoutList,
  LayoutGrid,
  Columns3,
  GanttChart,
  Pin,
  Trash2,
  Timer,
  Check,
  Inbox,
  Sun,
  CalendarDays,
  Filter,
  Folder,
  FolderPlus,
  ListPlus,
  Tag,
  Ban,
  Flame,
  BarChart3,
  Sparkles,
  FileText,
  BookTemplate,
  SlidersHorizontal,
  X,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  categories: EventCategory[];
  settings: AppSettings;
  onSelectEvent: (event: CalendarEvent) => void;
  onNewEvent: () => void;
  onUpdateEvents?: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  onUpdateCategories?: (categories: EventCategory[]) => void;
  onNavigateToDate?: (dateStr: string) => void;
  onStartFocusInTab?: (taskId: string) => void;
  quickAddFocusSeq?: number;
}

type WorkspaceMode = 'tasks' | 'habits' | 'stats';
type TaskViewMode = 'list' | 'kanban' | 'timeline' | 'matrix';
type SmartNavSelection =
  | { type: 'smart'; key: 'inbox' | 'today' | 'tomorrow' | 'next7' | 'all' | 'overdue' | 'completed' | 'wontdo' | 'trash' }
  | { type: 'category'; categoryId: string }
  | { type: 'filter'; filterId: string }
  | { type: 'tag'; tag: string };

export const AgendaView: React.FC<AgendaViewProps> = ({
  events,
  categories,
  settings,
  onSelectEvent,
  onUpdateEvents,
  onUpdateCategories,
  onNavigateToDate,
  onStartFocusInTab,
  quickAddFocusSeq,
}) => {
  const tt = getTickTickLabels(settings.language);
  const isRtl = isRtlLanguage(settings.language);
  const isZh = settings.language === 'zh-CN' || settings.language === 'zh-TW';
  const localeCode = getLocaleCode(settings.language);
  const hapticsEnabled = settings.enableHaptics !== false;

  const [nowMinuteTick, setNowMinuteTick] = useState<number>(() => Date.now());
  const todayStr = toDateString(new Date(nowMinuteTick));
  const tomorrowStr = useMemo(() => addDaysToDateStr(todayStr, 1), [todayStr]);
  const next7DateStr = useMemo(() => addDaysToDateStr(todayStr, 7), [todayStr]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMinuteTick(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  // TickTick Pro Workspace State (Folders, Sections, Filters, Habits, HabitLogs, Templates)
  const [ttState, setTtState] = useState<TickTickWorkspaceState>(() =>
    loadTickTickState(settings.language)
  );

  useEffect(() => {
    let active = true;
    void hydrateTickTickStateFromIdb(ttState).then((hydrated) => {
      if (active && hydrated) setTtState(hydrated);
    });
    const onExternalUpdate = () => {
      setTtState(loadTickTickState(settings.language));
    };
    window.addEventListener(TICKTICK_UPDATED_EVENT, onExternalUpdate);
    return () => {
      active = false;
      window.removeEventListener(TICKTICK_UPDATED_EVENT, onExternalUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.language]);

  const updateTickTick = (updater: (prev: TickTickWorkspaceState) => TickTickWorkspaceState) => {
    setTtState((prev) => {
      const next = updater(prev);
      saveTickTickState(next);
      return next;
    });
  };

  // Focus sessions & live stats
  const [focusSessions, setFocusSessions] = useState(() => loadFocusSessions());
  const [focusTodayStats, setFocusTodayStats] = useState(() => {
    const prefs = loadFocusPrefs();
    return computeFocusAnalytics(loadFocusSessions(), prefs.dailyGoalMinutes, localeCode);
  });

  useEffect(() => {
    const syncFocus = () => {
      const sessions = loadFocusSessions();
      const prefs = loadFocusPrefs();
      setFocusSessions(sessions);
      setFocusTodayStats(computeFocusAnalytics(sessions, prefs.dailyGoalMinutes, localeCode));
    };
    syncFocus();
    window.addEventListener(FOCUS_UPDATED_EVENT, syncFocus);
    return () => window.removeEventListener(FOCUS_UPDATED_EVENT, syncFocus);
  }, [localeCode]);

  // Workspace Modes & View State
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('tasks');
  const [navSelection, setNavSelection] = useState<SmartNavSelection>({ type: 'smart', key: 'today' });
  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>(() => {
    try {
      const saved = localStorage.getItem('ticktick_task_view_mode_v1');
      if (saved === 'list' || saved === 'kanban' || saved === 'timeline' || saved === 'matrix') {
        return saved;
      }
    } catch {}
    return 'list';
  });
  const [kanbanGroupBy, setKanbanGroupBy] = useState<KanbanGroupMode>('section');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showSidebarFocusCard, setShowSidebarFocusCard] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('ticktick_task_view_mode_v1', taskViewMode);
    } catch {}
  }, [taskViewMode]);

  // Sorting, Search & Batch selection
  const [sortMode, setSortMode] = useState<AgendaSortMode>('smart');
  const [focusPreference, setFocusPreference] = useState<FocusPreferenceMode>('balanced');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedSubtaskIds, setExpandedSubtaskIds] = useState<Set<string>>(new Set());

  const {
    history: agendaSearchHistory,
    recordQuery: addAgendaSearchHistory,
    removeQuery: removeAgendaSearchHistory,
    clearHistory: clearAgendaSearchHistory,
  } = useSearchHistory('agenda');

  // Quick Add + NLP + Kind + Template Drawer
  const [quickInput, setQuickInput] = useState('');
  const [quickKind, setQuickKind] = useState<TaskKind>('task');
  const [showTemplatesDrawer, setShowTemplatesDrawer] = useState(false);
  const quickAddRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quickAddFocusSeq && quickAddFocusSeq > 0) {
      setWorkspaceMode('tasks');
      window.setTimeout(() => quickAddRef.current?.focus(), 60);
    }
  }, [quickAddFocusSeq]);

  // Modals: Task Inspector, New Filter, New List/Folder
  const [inspectedEventId, setInspectedEventId] = useState<string | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState<'list' | 'folder' | null>(null);

  // Filter Builder state
  const [filterName, setFilterName] = useState('');
  const [filterColor, setFilterColor] = useState('#E11D48');
  const [filterDateRange, setFilterDateRange] = useState<SmartFilterRule['dateRange']>('any');
  const [filterKind, setFilterKind] = useState<SmartFilterRule['kind']>('all');
  const [filterPriorities, setFilterPriorities] = useState<Array<'high' | 'medium' | 'low' | 'none'>>([]);
  const [filterCatIds, setFilterCatIds] = useState<string[]>([]);
  const [filterTagText, setFilterTagText] = useState('');

  // List / Folder Creator state
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#2563EB');
  const [newFolderName, setNewFolderName] = useState('');

  // Matrix Drag & Drop state
  const [matrixDraggedId, setMatrixDraggedId] = useState<string | null>(null);

  const parsedPreview = useMemo(
    () => (quickInput.trim() ? parseNaturalTaskInput(quickInput, todayStr) : null),
    [quickInput, todayStr]
  );

  const categoryMap = useMemo(() => {
    const m = new Map<string, EventCategory>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  // Clean non-accounting events
  const allTaskEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          !e.id.startsWith('evt-acc-') &&
          e.categoryId !== 'cat-expense' &&
          e.categoryId !== 'cat-income'
      ),
    [events]
  );

  const inspectedEvent = useMemo(
    () => (inspectedEventId ? allTaskEvents.find((e) => e.id === inspectedEventId) || null : null),
    [inspectedEventId, allTaskEvents]
  );

  // Aggregated Tags & Smart Counts
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allTaskEvents.forEach((evt) => {
      if (evt.isInTrash || evt.isCompleted || evt.isWontDo) return;
      (evt.tags || []).forEach((tg) => {
        counts.set(tg, (counts.get(tg) || 0) + 1);
      });
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [allTaskEvents]);

  const allExistingTags = useMemo(() => tagCounts.map(([tg]) => tg), [tagCounts]);

  const smartCounts = useMemo(() => {
    const active = allTaskEvents.filter((e) => !e.isInTrash && !e.isCompleted && !e.isWontDo);
    const todayRecurrenceIds = new Set(getEventsForDate(active, todayStr).map((e) => e.id));
    const tomorrowRecurrenceIds = new Set(getEventsForDate(active, tomorrowStr).map((e) => e.id));

    return {
      inbox: active.filter((e) => !e.startDate).length,
      today: active.filter(
        (e) => (e.startDate && e.startDate <= todayStr) || todayRecurrenceIds.has(e.id)
      ).length,
      tomorrow: active.filter(
        (e) => e.startDate === tomorrowStr || tomorrowRecurrenceIds.has(e.id)
      ).length,
      next7: active.filter((e) => e.startDate && e.startDate >= todayStr && e.startDate <= next7DateStr).length,
      all: active.length,
      overdue: active.filter((e) => e.startDate && e.startDate < todayStr).length,
      completed: allTaskEvents.filter((e) => !e.isInTrash && e.isCompleted).length,
      wontdo: allTaskEvents.filter((e) => !e.isInTrash && e.isWontDo).length,
      trash: allTaskEvents.filter((e) => e.isInTrash).length,
    };
  }, [allTaskEvents, todayStr, tomorrowStr, next7DateStr]);

  // Filter tasks according to navSelection & searchQuery
  const filteredTasks = useMemo(() => {
    let base: CalendarEvent[] = [];

    if (navSelection.type === 'smart') {
      const k = navSelection.key;
      if (k === 'trash') {
        base = allTaskEvents.filter((e) => e.isInTrash);
      } else if (k === 'wontdo') {
        base = allTaskEvents.filter((e) => !e.isInTrash && e.isWontDo);
      } else if (k === 'completed') {
        base = allTaskEvents.filter((e) => !e.isInTrash && e.isCompleted);
      } else {
        const active = allTaskEvents.filter((e) => !e.isInTrash && !e.isCompleted && !e.isWontDo);
        if (k === 'inbox') {
          base = active.filter((e) => !e.startDate);
        } else if (k === 'today') {
          const todayMatchIds = new Set(getEventsForDate(active, todayStr).map((e) => e.id));
          base = active.filter(
            (e) => (e.startDate && e.startDate <= todayStr) || todayMatchIds.has(e.id)
          );
        } else if (k === 'tomorrow') {
          const tomIds = new Set(getEventsForDate(active, tomorrowStr).map((e) => e.id));
          base = active.filter((e) => e.startDate === tomorrowStr || tomIds.has(e.id));
        } else if (k === 'next7') {
          base = active.filter(
            (e) => e.startDate && e.startDate >= todayStr && e.startDate <= next7DateStr
          );
        } else if (k === 'overdue') {
          base = active.filter((e) => e.startDate && e.startDate < todayStr);
        } else {
          base = active;
        }
      }
    } else if (navSelection.type === 'category') {
      base = allTaskEvents.filter(
        (e) =>
          !e.isInTrash &&
          !e.isCompleted &&
          !e.isWontDo &&
          e.categoryId === navSelection.categoryId
      );
    } else if (navSelection.type === 'tag') {
      base = allTaskEvents.filter(
        (e) =>
          !e.isInTrash &&
          !e.isCompleted &&
          !e.isWontDo &&
          (e.tags || []).includes(navSelection.tag)
      );
    } else if (navSelection.type === 'filter') {
      const rule = ttState.filters.find((f) => f.id === navSelection.filterId);
      base = rule
        ? allTaskEvents.filter((e) =>
            matchesSmartFilter(e, rule, todayStr, tomorrowStr, next7DateStr)
          )
        : [];
    }

    const q = normalizeSearchText(searchQuery);
    if (q) {
      base = base.filter((e) => {
        const cat = categoryMap.get(e.categoryId);
        const catName = cat ? getCategoryDisplayName(cat, settings.language) : '';
        const text = normalizeSearchText(
          `${e.title} ${e.description || ''} ${catName} ${(e.tags || []).join(' ')} ${(e.checklist || []).map((c) => c.text).join(' ')}`
        );
        return text.includes(q);
      });
    }

    const focusCtx = buildFocusProfileContext(
      allTaskEvents,
      todayStr,
      focusPreference,
      new Date(nowMinuteTick)
    );
    const isArchivedSort =
      navSelection.type === 'smart' &&
      (navSelection.key === 'completed' || navSelection.key === 'wontdo' || navSelection.key === 'trash');

    return sortAgendaTasks(base, sortMode, focusCtx, isArchivedSort).map((r) => r.event);
  }, [
    allTaskEvents,
    navSelection,
    todayStr,
    tomorrowStr,
    next7DateStr,
    ttState.filters,
    searchQuery,
    categoryMap,
    settings.language,
    focusPreference,
    nowMinuteTick,
    sortMode,
  ]);

  const analyticsSnapshot = useMemo(
    () =>
      computeTickTickAnalytics(
        allTaskEvents,
        ttState.habits,
        ttState.habitLogs,
        focusSessions,
        todayStr
      ),
    [allTaskEvents, ttState.habits, ttState.habitLogs, focusSessions, todayStr]
  );

  const todayHabits = useMemo(
    () => ttState.habits.filter((h) => !h.archived && isHabitScheduledOnDate(h, todayStr)),
    [ttState.habits, todayStr]
  );

  // ============================================================================
  // Task Mutations (Syncing directly with App.tsx CalendarEvent[])
  // ============================================================================

  const handleToggleComplete = (evt: CalendarEvent) => {
    if (!onUpdateEvents) return;
    triggerHaptic('success', hapticsEnabled);
    const { completedSnapshot, updatedEvent } = advanceRecurringTaskOnComplete(evt, todayStr);
    onUpdateEvents((prev) => {
      const mapped = prev.map((e) => (e.id === evt.id ? updatedEvent : e));
      return completedSnapshot ? [completedSnapshot, ...mapped] : mapped;
    });
  };

  const handleSaveInspected = (updated: CalendarEvent) => {
    if (!onUpdateEvents) return;
    onUpdateEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleMoveToTrash = (id: string) => {
    if (!onUpdateEvents) return;
    triggerHaptic('warning', hapticsEnabled);
    onUpdateEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, isInTrash: true, trashedAt: Date.now(), updatedAt: Date.now() } : e
      )
    );
  };

  const handleRestoreFromTrash = (id: string) => {
    if (!onUpdateEvents) return;
    onUpdateEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, isInTrash: false, trashedAt: undefined, updatedAt: Date.now() } : e
      )
    );
  };

  const handlePermanentDelete = (id: string) => {
    if (!onUpdateEvents) return;
    onUpdateEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleEmptyTrash = () => {
    if (!onUpdateEvents) return;
    triggerHaptic('warning', hapticsEnabled);
    onUpdateEvents((prev) => prev.filter((e) => !e.isInTrash));
  };

  const handleToggleWontDo = (evt: CalendarEvent) => {
    if (!onUpdateEvents) return;
    const nextWontDo = !evt.isWontDo;
    onUpdateEvents((prev) =>
      prev.map((e) =>
        e.id === evt.id
          ? {
              ...e,
              isWontDo: nextWontDo,
              wontDoAt: nextWontDo ? Date.now() : undefined,
              isCompleted: false,
              completedAt: undefined,
              updatedAt: Date.now(),
            }
          : e
      )
    );
  };

  const handleDuplicateTask = (evt: CalendarEvent) => {
    if (!onUpdateEvents) return;
    const now = Date.now();
    const copy: CalendarEvent = {
      ...evt,
      id: `evt_copy_${now}_${Math.random().toString(36).slice(2, 6)}`,
      title: `${evt.title} (${isZh ? '副本' : 'Copy'})`,
      isCompleted: false,
      completedAt: undefined,
      isWontDo: false,
      isInTrash: false,
      createdAt: now,
      updatedAt: now,
    };
    onUpdateEvents((prev) => [copy, ...prev]);
  };

  const handleSaveAsTemplate = (evt: CalendarEvent) => {
    const tpl: TaskTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: evt.title.slice(0, 28),
      title: evt.title,
      description: evt.description,
      categoryId: evt.categoryId,
      priority: evt.priority,
      tags: evt.tags,
      estimatedPomodoros: evt.estimatedPomodoros,
      estimatedMinutes: evt.estimatedMinutes,
      checklist: (evt.checklist || []).map((c) => c.text),
      kind: evt.kind || 'task',
      createdAt: Date.now(),
    };
    updateTickTick((prev) => ({
      ...prev,
      templates: [tpl, ...prev.templates],
    }));
  };

  const handleCreateTask = (
    rawText: string,
    overrides: Partial<CalendarEvent> = {}
  ) => {
    if (!onUpdateEvents || !rawText.trim()) return;
    triggerHaptic('selection', hapticsEnabled);
    const parsed = parseNaturalTaskInput(rawText, todayStr);
    const now = Date.now();

    let defaultDate = parsed.startDate;
    if (!defaultDate && navSelection.type === 'smart') {
      if (navSelection.key === 'today') defaultDate = todayStr;
      else if (navSelection.key === 'tomorrow') defaultDate = tomorrowStr;
    }

    const defaultCategoryId =
      navSelection.type === 'category'
        ? navSelection.categoryId
        : categories[0]?.id || 'cat-personal';

    const mergedTags = Array.from(
      new Set([
        ...parsed.tags,
        ...(navSelection.type === 'tag' ? [navSelection.tag] : []),
        ...(overrides.tags || []),
      ])
    );

    const effectiveDate = overrides.startDate !== undefined ? overrides.startDate : defaultDate;
    const effectiveKind = overrides.kind || (parsed.tokens.some((tk) => tk.type === 'kind') ? parsed.kind : quickKind);

    const newEvent: CalendarEvent = {
      id: `evt_${now}_${Math.random().toString(36).slice(2, 7)}`,
      title: parsed.title,
      categoryId: overrides.categoryId || defaultCategoryId,
      startDate: effectiveDate,
      endDate: overrides.endDate !== undefined ? overrides.endDate : effectiveDate,
      startTime: overrides.startTime ?? parsed.startTime,
      isAllDay: overrides.isAllDay ?? (parsed.startTime ? false : true),
      recurrence: overrides.recurrence ?? parsed.recurrence,
      customRepeatRule: overrides.customRepeatRule ?? parsed.customRepeatRule,
      reminder: overrides.reminder ?? parsed.reminder,
      multipleReminders:
        parsed.reminder !== 'none' ? [parsed.reminder] : undefined,
      priority: overrides.priority ?? parsed.priority,
      tags: mergedTags.length > 0 ? mergedTags : undefined,
      estimatedMinutes: overrides.estimatedMinutes ?? parsed.estimatedMinutes,
      estimatedPomodoros: overrides.estimatedPomodoros ?? parsed.estimatedPomodoros ?? 1,
      kind: effectiveKind,
      sectionId: overrides.sectionId,
      checklist: overrides.checklist,
      description: overrides.description,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    onUpdateEvents((prev) => [newEvent, ...prev]);
  };

  const handleApplyTemplate = (tpl: TaskTemplate) => {
    if (!onUpdateEvents) return;
    triggerHaptic('selection', hapticsEnabled);
    const now = Date.now();
    const targetDate =
      navSelection.type === 'smart' && navSelection.key === 'tomorrow'
        ? tomorrowStr
        : navSelection.type === 'smart' && navSelection.key === 'inbox'
        ? ''
        : todayStr;

    const newEvent: CalendarEvent = {
      id: `evt_tpl_${now}_${Math.random().toString(36).slice(2, 6)}`,
      title: tpl.title,
      description: tpl.description,
      categoryId: tpl.categoryId || categories[0]?.id || 'cat-personal',
      startDate: targetDate,
      endDate: targetDate,
      isAllDay: true,
      recurrence: 'none',
      reminder: 'none',
      priority: tpl.priority || 'medium',
      tags: tpl.tags,
      estimatedPomodoros: tpl.estimatedPomodoros || 1,
      estimatedMinutes: tpl.estimatedMinutes,
      kind: tpl.kind || 'task',
      checklist: (tpl.checklist || []).map((txt, idx) => ({
        id: `sub_${now}_${idx}`,
        text: txt,
        completed: false,
      })),
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    };
    onUpdateEvents((prev) => [newEvent, ...prev]);
    setShowTemplatesDrawer(false);
    setInspectedEventId(newEvent.id);
  };

  // Batch Bar Handlers
  const handleToggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchPatch = (patch: Partial<CalendarEvent>) => {
    if (!onUpdateEvents || selectedIds.size === 0) return;
    const now = Date.now();
    onUpdateEvents((prev) =>
      prev.map((e) => (selectedIds.has(e.id) ? { ...e, ...patch, updatedAt: now } : e))
    );
    setSelectedIds(new Set());
  };

  // ============================================================================
  // Habit Handlers
  // ============================================================================

  const handleUpsertHabit = (habit: HabitItem) => {
    updateTickTick((prev) => {
      const exists = prev.habits.some((h) => h.id === habit.id);
      return {
        ...prev,
        habits: exists
          ? prev.habits.map((h) => (h.id === habit.id ? habit : h))
          : [...prev.habits, habit],
      };
    });
  };

  const handleDeleteHabit = (habitId: string) => {
    updateTickTick((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== habitId),
      habitLogs: prev.habitLogs.filter((l) => l.habitId !== habitId),
    }));
  };

  const handleLogHabit = (entry: HabitLogEntry) => {
    updateTickTick((prev) => {
      const idx = prev.habitLogs.findIndex(
        (l) => l.habitId === entry.habitId && l.date === entry.date
      );
      const nextLogs = [...prev.habitLogs];
      if (idx >= 0) nextLogs[idx] = entry;
      else nextLogs.push(entry);
      return { ...prev, habitLogs: nextLogs };
    });
  };

  // ============================================================================
  // Title for Current Nav Selection
  // ============================================================================
  const currentNavTitle = useMemo(() => {
    if (navSelection.type === 'smart') {
      const map: Record<string, string> = {
        inbox: tt.inbox,
        today: tt.today,
        tomorrow: tt.tomorrow,
        next7: tt.next7,
        all: tt.allTasks,
        overdue: tt.overdue,
        completed: tt.completed,
        wontdo: tt.wontDo,
        trash: tt.trash,
      };
      return map[navSelection.key] || tt.today;
    }
    if (navSelection.type === 'category') {
      const cat = categoryMap.get(navSelection.categoryId);
      return cat ? getCategoryDisplayName(cat, settings.language) : tt.allTasks;
    }
    if (navSelection.type === 'tag') return `#${navSelection.tag}`;
    const flt = ttState.filters.find((f) => f.id === navSelection.filterId);
    return flt?.name || tt.customFilters;
  }, [navSelection, tt, categoryMap, settings.language, ttState.filters]);

  const isTrashTab = navSelection.type === 'smart' && navSelection.key === 'trash';
  const isWontDoTab = navSelection.type === 'smart' && navSelection.key === 'wontdo';
  const isCompletedTab = navSelection.type === 'smart' && navSelection.key === 'completed';
  const isArchivedView = isTrashTab || isWontDoTab || isCompletedTab;

  // ============================================================================
  // Reusable Clean Task Row Renderer (Zero pill-sandwich clutter!)
  // ============================================================================
  const renderTaskRow = (evt: CalendarEvent, compact = false) => {
    const cat = categoryMap.get(evt.categoryId);
    const catColor = cat?.color || '#F57C00';
    const catName = cat ? getCategoryDisplayName(cat, settings.language) : '';
    const isOverdue = Boolean(!evt.isCompleted && !evt.isWontDo && evt.startDate && evt.startDate < todayStr);
    const checklistTotal = evt.checklist?.length || 0;
    const checklistDone = evt.checklist?.filter((c) => c.completed).length || 0;
    const isSubExpanded = expandedSubtaskIds.has(evt.id);
    const isSelected = selectedIds.has(evt.id);

    const priorityColor =
      evt.priority === 'high'
        ? 'text-rose-500 border-rose-500'
        : evt.priority === 'medium'
        ? 'text-amber-500 border-amber-500'
        : evt.priority === 'low'
        ? 'text-blue-500 border-blue-500'
        : 'text-neutral-400 border-neutral-300 dark:border-neutral-600';

    const metaParts: string[] = [];
    if (evt.kind === 'note') metaParts.push(tt.taskKindNote);
    if (catName) metaParts.push(catName);
    if (evt.startDate) {
      metaParts.push(
        evt.startDate === todayStr
          ? tt.today
          : evt.startDate === tomorrowStr
          ? tt.tomorrow
          : evt.startDate
      );
    }
    if (evt.startTime && !evt.isAllDay) metaParts.push(evt.startTime);
    if (evt.estimatedMinutes) metaParts.push(`${evt.estimatedMinutes}m`);
    if (evt.recurrence && evt.recurrence !== 'none') {
      metaParts.push(
        evt.customRepeatRule?.repeatBy === 'completion'
          ? tt.repeatByCompletion
          : isZh
          ? '重复'
          : 'Repeat'
      );
    }
    if ((evt.tags || []).length > 0) {
      metaParts.push((evt.tags || []).map((tg) => `#${tg}`).join(' '));
    }

    return (
      <div
        key={evt.id}
        className={`group rounded-2xl border transition-colors ${
          isSelected
            ? 'border-orange-500 bg-orange-500/[0.05]'
            : 'border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 hover:border-neutral-300 dark:hover:border-white/20'
        } ${compact ? 'p-2.5' : 'px-3.5 py-2.5'}`}
      >
        <div className="flex items-start gap-2.5">
          {batchMode && (
            <button
              type="button"
              onClick={() => handleToggleSelectId(evt.id)}
              className="mt-0.5 text-orange-500 cursor-pointer shrink-0"
            >
              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Circle className="w-4 h-4 text-neutral-400" />}
            </button>
          )}

          {/* Checkbox / Note / Won't Do Icon */}
          {!evt.isInTrash && !evt.isWontDo && (
            <button
              type="button"
              onClick={() => handleToggleComplete(evt)}
              aria-label={isZh ? '完成任务' : 'Toggle complete'}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                evt.isCompleted
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : priorityColor + ' hover:bg-orange-500/10'
              }`}
            >
              {evt.isCompleted && <Check className="w-3 h-3" />}
            </button>
          )}
          {evt.isWontDo && (
            <Ban className="w-4 h-4 text-neutral-400 mt-1 shrink-0" />
          )}

          {/* Main Clickable Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {evt.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              {evt.kind === 'note' && <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
              <button
                type="button"
                onClick={() => setInspectedEventId(evt.id)}
                className={`text-left text-sm font-semibold truncate cursor-pointer flex-1 ${
                  evt.isCompleted || evt.isWontDo
                    ? 'line-through text-neutral-400 dark:text-neutral-500'
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {evt.title}
              </button>
            </div>

            {(metaParts.length > 0 || checklistTotal > 0) && (
              <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                <span className="inline-flex items-center gap-1.5 truncate max-w-full">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: catColor }}
                  />
                  <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
                    {metaParts.join(' · ')}
                  </span>
                </span>
                {checklistTotal > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSubtaskIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(evt.id)) next.delete(evt.id);
                        else next.add(evt.id);
                        return next;
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-orange-500 cursor-pointer"
                  >
                    {isSubExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <span>
                      {checklistDone}/{checklistTotal}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Quick Actions */}
          <div className="flex items-center gap-1 shrink-0 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {isTrashTab ? (
              <>
                <button
                  type="button"
                  onClick={() => handleRestoreFromTrash(evt.id)}
                  title={tt.restoreTask}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePermanentDelete(evt.id)}
                  title={isZh ? '彻底删除' : 'Delete Forever'}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : isWontDoTab ? (
              <>
                <button
                  type="button"
                  onClick={() => handleToggleWontDo(evt)}
                  title={tt.reopenTask}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveToTrash(evt.id)}
                  title={isZh ? '移至垃圾桶' : 'Move to Trash'}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                {onStartFocusInTab && !evt.isCompleted && (
                  <button
                    type="button"
                    onClick={() => onStartFocusInTab(evt.id)}
                    title={isZh ? '开启专注' : 'Focus'}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Timer className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectEvent(evt)}
                  title={isZh ? '日历详情' : 'Calendar Detail'}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-orange-500 hover:bg-orange-500/10 cursor-pointer hidden sm:inline-flex"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveToTrash(evt.id)}
                  title={isZh ? '移至垃圾桶' : 'Trash'}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Inline Expandable Subtasks */}
        {isSubExpanded && evt.checklist && evt.checklist.length > 0 && (
          <div className="mt-2 pt-2 pl-7 border-t border-neutral-200/60 dark:border-white/10 space-y-1">
            {evt.checklist.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  if (!onUpdateEvents) return;
                  onUpdateEvents((prev) =>
                    prev.map((e) =>
                      e.id === evt.id
                        ? {
                            ...e,
                            checklist: (e.checklist || []).map((c) =>
                              c.id === sub.id ? { ...c, completed: !c.completed } : c
                            ),
                            updatedAt: Date.now(),
                          }
                        : e
                    )
                  );
                }}
                className="w-full flex items-center gap-2 text-left text-xs py-0.5 cursor-pointer"
              >
                {sub.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                )}
                <span
                  className={
                    sub.completed
                      ? 'line-through text-neutral-400'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }
                >
                  {sub.text}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // Sidebar Content (Shared between Desktop Rail & Mobile Drawer)
  // ============================================================================
  const sidebarContent = (
    <div className="space-y-5 text-xs">
      {/* Smart Lists */}
      <div className="space-y-1">
        <div className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          {tt.smartLists}
        </div>
        {(
          [
            { key: 'inbox', label: tt.inbox, count: smartCounts.inbox, icon: Inbox, color: 'text-blue-500' },
            { key: 'today', label: tt.today, count: smartCounts.today, icon: Sun, color: 'text-orange-500' },
            { key: 'tomorrow', label: tt.tomorrow, count: smartCounts.tomorrow, icon: Calendar, color: 'text-indigo-500' },
            { key: 'next7', label: tt.next7, count: smartCounts.next7, icon: CalendarDays, color: 'text-emerald-500' },
            { key: 'all', label: tt.allTasks, count: smartCounts.all, icon: CheckSquare, color: 'text-neutral-500' },
            { key: 'overdue', label: tt.overdue, count: smartCounts.overdue, icon: AlertCircle, color: 'text-rose-500' },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active =
            workspaceMode === 'tasks' &&
            navSelection.type === 'smart' &&
            navSelection.key === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setWorkspaceMode('tasks');
                setNavSelection({ type: 'smart', key: item.key });
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 font-semibold transition-colors cursor-pointer ${
                active
                  ? 'bg-orange-500/12 text-orange-600 dark:text-orange-300'
                  : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                <span className="truncate">{item.label}</span>
              </span>
              {item.count > 0 && (
                <span className="text-[11px] font-bold text-neutral-400 tabular-nums">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Smart Filters (Pro) */}
      <div className="space-y-1">
        <div className="px-2.5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {tt.customFilters}
          </span>
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            title={tt.newFilter}
            className="p-1 rounded-lg text-neutral-400 hover:text-orange-500 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {ttState.filters.map((flt) => {
          const active =
            workspaceMode === 'tasks' &&
            navSelection.type === 'filter' &&
            navSelection.filterId === flt.id;
          const cnt = allTaskEvents.filter((e) =>
            matchesSmartFilter(e, flt, todayStr, tomorrowStr, next7DateStr)
          ).length;

          return (
            <div key={flt.id} className="group flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setWorkspaceMode('tasks');
                  setNavSelection({ type: 'filter', filterId: flt.id });
                  setIsMobileSidebarOpen(false);
                }}
                className={`flex-1 px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 font-semibold transition-colors cursor-pointer min-w-0 ${
                  active
                    ? 'bg-orange-500/12 text-orange-600 dark:text-orange-300'
                    : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Filter className="w-3.5 h-3.5 shrink-0" style={{ color: flt.color }} />
                  <span className="truncate">{flt.name}</span>
                </span>
                <span className="text-[11px] font-bold text-neutral-400 tabular-nums">{cnt}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  updateTickTick((prev) => ({
                    ...prev,
                    filters: prev.filters.filter((x) => x.id !== flt.id),
                  }))
                }
                className="p-1 text-neutral-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Folders & Lists */}
      <div className="space-y-1.5">
        <div className="px-2.5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {tt.foldersAndLists}
          </span>
          <div className="flex items-center gap-0.5">
            {onUpdateCategories && (
              <button
                type="button"
                onClick={() => setIsListModalOpen('list')}
                title={tt.newList}
                className="p-1 rounded-lg text-neutral-400 hover:text-orange-500 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <ListPlus className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsListModalOpen('folder')}
              title={tt.newFolder}
              className="p-1 rounded-lg text-neutral-400 hover:text-orange-500 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Folders */}
        {ttState.folders.map((folder) => {
          const folderCats = categories.filter((c) => folder.categoryIds.includes(c.id));
          return (
            <div key={folder.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() =>
                  updateTickTick((prev) => ({
                    ...prev,
                    folders: prev.folders.map((f) =>
                      f.id === folder.id ? { ...f, collapsed: !f.collapsed } : f
                    ),
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 font-bold cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate">
                  {folder.collapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <Folder className="w-3.5 h-3.5" style={{ color: folder.color || '#F57C00' }} />
                  <span className="truncate">{folder.name}</span>
                </span>
                <span className="text-[11px] text-neutral-400 tabular-nums">{folderCats.length}</span>
              </button>
              {!folder.collapsed && (
                <div className="pl-4 space-y-0.5">
                  {folderCats.map((cat) => {
                    const active =
                      workspaceMode === 'tasks' &&
                      navSelection.type === 'category' &&
                      navSelection.categoryId === cat.id;
                    const cnt = allTaskEvents.filter(
                      (e) => !e.isInTrash && !e.isCompleted && !e.isWontDo && e.categoryId === cat.id
                    ).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setWorkspaceMode('tasks');
                          setNavSelection({ type: 'category', categoryId: cat.id });
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-orange-500/12 text-orange-600 dark:text-orange-300 font-semibold'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate">{getCategoryDisplayName(cat, settings.language)}</span>
                        </span>
                        {cnt > 0 && <span className="text-[11px] text-neutral-400 tabular-nums">{cnt}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Ungrouped Lists */}
        {categories
          .filter((cat) => !ttState.folders.some((f) => f.categoryIds.includes(cat.id)))
          .map((cat) => {
            const active =
              workspaceMode === 'tasks' &&
              navSelection.type === 'category' &&
              navSelection.categoryId === cat.id;
            const cnt = allTaskEvents.filter(
              (e) => !e.isInTrash && !e.isCompleted && !e.isWontDo && e.categoryId === cat.id
            ).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setWorkspaceMode('tasks');
                  setNavSelection({ type: 'category', categoryId: cat.id });
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-orange-500/12 text-orange-600 dark:text-orange-300 font-semibold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate">{getCategoryDisplayName(cat, settings.language)}</span>
                </span>
                {cnt > 0 && <span className="text-[11px] text-neutral-400 tabular-nums">{cnt}</span>}
              </button>
            );
          })}
      </div>

      {/* Tags Index */}
      {tagCounts.length > 0 && (
        <div className="space-y-1">
          <div className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {tt.tagsIndex}
          </div>
          <div className="flex flex-wrap gap-1.5 px-2">
            {tagCounts.map(([tg, cnt]) => {
              const active =
                workspaceMode === 'tasks' &&
                navSelection.type === 'tag' &&
                navSelection.tag === tg;
              return (
                <button
                  key={tg}
                  type="button"
                  onClick={() => {
                    setWorkspaceMode('tasks');
                    setNavSelection({ type: 'tag', tag: tg });
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                    active
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300'
                      : 'border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10'
                  }`}
                >
                  <Tag className="w-3 h-3 text-teal-500" />
                  <span>{tg}</span>
                  <span className="text-neutral-400 tabular-nums">{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Archives: Completed, Won't Do, Trash */}
      <div className="space-y-1 pt-2 border-t border-neutral-200/70 dark:border-white/10">
        <div className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          {tt.archives}
        </div>
        {(
          [
            { key: 'completed', label: tt.completed, count: smartCounts.completed, icon: CheckCircle2, color: 'text-emerald-500' },
            { key: 'wontdo', label: tt.wontDo, count: smartCounts.wontdo, icon: Ban, color: 'text-neutral-400' },
            { key: 'trash', label: tt.trash, count: smartCounts.trash, icon: Trash2, color: 'text-rose-500' },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active =
            workspaceMode === 'tasks' &&
            navSelection.type === 'smart' &&
            navSelection.key === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setWorkspaceMode('tasks');
                setNavSelection({ type: 'smart', key: item.key });
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between font-semibold transition-colors cursor-pointer ${
                active
                  ? 'bg-orange-500/12 text-orange-600 dark:text-orange-300'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span>{item.label}</span>
              </span>
              {item.count > 0 && <span className="text-[11px] text-neutral-400 tabular-nums">{item.count}</span>}
            </button>
          );
        })}
      </div>

      {/* Focus Mini Widget Toggle */}
      <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3 space-y-2 bg-neutral-50/70 dark:bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-rose-500" />
            <span>{isZh ? '今日专注' : 'Today Focus'}</span>
          </span>
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {focusTodayStats.todayMinutes}m · {focusTodayStats.todaySessions}🍅
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowSidebarFocusCard((s) => !s)}
          className="w-full py-1.5 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-neutral-900 text-[11px] font-bold text-neutral-700 dark:text-neutral-200 hover:border-orange-500/50 cursor-pointer"
        >
          {showSidebarFocusCard ? (isZh ? '收起迷你番茄钟' : 'Hide Mini Timer') : (isZh ? '展开迷你番茄钟' : 'Open Mini Timer')}
        </button>
      </div>
    </div>
  );

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto w-full pb-32 space-y-4"
    >
      {/* Top TickTick Workspace Command Header */}
      <header className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-3.5 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {workspaceMode === 'tasks' && (
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen((s) => !s)}
              className="lg:hidden p-2 rounded-xl border border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300 cursor-pointer"
              aria-label="Toggle Lists"
            >
              {isMobileSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>{tt.workspaceTasks}</span>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                · {tt.achievementScore} {analyticsSnapshot.achievementScore}
              </span>
            </h1>
          </div>
        </div>

        {/* Workspace Mode Tabs: Tasks | Habits | Stats & Summary */}
        <div className="inline-flex rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-100/80 dark:bg-white/5 p-1 gap-1">
          {(
            [
              { id: 'tasks', label: tt.workspaceTasks, icon: CheckSquare },
              { id: 'habits', label: tt.workspaceHabits, icon: Flame },
              { id: 'stats', label: tt.workspaceStats, icon: BarChart3 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = workspaceMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic('tab', hapticsEnabled);
                  setWorkspaceMode(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-orange-500' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Embedded Mini Pomodoro Drawer */}
      {showSidebarFocusCard && (
        <PomodoroTimer
          events={allTaskEvents}
          settings={settings}
          onUpdateEvent={handleSaveInspected}
        />
      )}

      {/* Workspace Mode 2: Habits */}
      {workspaceMode === 'habits' && (
        <HabitTrackerPanel
          habits={ttState.habits}
          habitLogs={ttState.habitLogs}
          showHabitsInToday={ttState.showHabitsInToday}
          language={settings.language}
          hapticsEnabled={hapticsEnabled}
          onUpsertHabit={handleUpsertHabit}
          onDeleteHabit={handleDeleteHabit}
          onLogHabit={handleLogHabit}
          onToggleShowInToday={(val) =>
            updateTickTick((prev) => ({ ...prev, showHabitsInToday: val }))
          }
        />
      )}

      {/* Workspace Mode 3: Productivity Analytics, Heatmap & Summary */}
      {workspaceMode === 'stats' && (
        <TickTickStatsPanel
          events={allTaskEvents}
          categories={categories}
          habits={ttState.habits}
          habitLogs={ttState.habitLogs}
          focusSessions={focusSessions}
          language={settings.language}
          onSaveSummaryAsNote={(title, markdownBody) => {
            if (!onUpdateEvents) return;
            const now = Date.now();
            const noteEvt: CalendarEvent = {
              id: `evt_sum_${now}_${Math.random().toString(36).slice(2, 6)}`,
              title,
              description: markdownBody,
              categoryId: categories[0]?.id || 'cat-personal',
              startDate: '',
              endDate: '',
              isAllDay: true,
              recurrence: 'none',
              reminder: 'none',
              kind: 'note',
              tags: [isZh ? '复盘总结' : 'Review'],
              createdAt: now,
              updatedAt: now,
            };
            onUpdateEvents((prev) => [noteEvt, ...prev]);
          }}
        />
      )}

      {/* Workspace Mode 1: Tasks (Sidebar + List / Kanban / Timeline / Matrix) */}
      {workspaceMode === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Mobile Drawer Overlay */}
          {isMobileSidebarOpen && (
            <div className="lg:hidden col-span-1 rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4">
              {sidebarContent}
            </div>
          )}

          {/* Desktop Persistent Left Rail */}
          <aside className="hidden lg:block lg:col-span-3 rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-3.5 sticky top-4 max-h-[82vh] overflow-y-auto">
            {sidebarContent}
          </aside>

          {/* Main Task Workspace Canvas */}
          <section className="lg:col-span-9 space-y-3.5 min-w-0">
            {/* List Title + View Mode Switcher + Search + Sort */}
            <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-3.5 sm:p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-neutral-100 truncate">
                    {currentNavTitle}
                  </h2>
                  <span className="text-xs font-bold text-neutral-400 tabular-nums">
                    ({filteredTasks.length})
                  </span>
                </div>

                {/* 4 Pro View Switcher: List | Kanban | Timeline | Matrix */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="inline-flex rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-100/70 dark:bg-white/5 p-0.5">
                    {(
                      [
                        { id: 'list', label: tt.viewList, icon: LayoutList },
                        { id: 'kanban', label: tt.viewKanban, icon: Columns3 },
                        { id: 'timeline', label: tt.viewTimeline, icon: GanttChart },
                        { id: 'matrix', label: tt.viewMatrix, icon: LayoutGrid },
                      ] as const
                    ).map((v) => {
                      const Icon = v.icon;
                      const active = taskViewMode === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setTaskViewMode(v.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{v.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {isTrashTab && smartCounts.trash > 0 && (
                    <button
                      type="button"
                      onClick={handleEmptyTrash}
                      className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      {tt.emptyTrash}
                    </button>
                  )}
                </div>
              </div>

              {/* Search, Sort, Focus Strategy & Batch Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 160)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        addAgendaSearchHistory(searchQuery.trim());
                      }
                    }}
                    placeholder={isZh ? '搜索任务、#标签、清单或笔记...' : 'Search tasks, #tags, lists...'}
                    className="w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/5 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-orange-500"
                  />
                  {isSearchFocused && agendaSearchHistory.length > 0 && !searchQuery && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-20">
                      <SearchHistoryBar
                        history={agendaSearchHistory}
                        onSelectQuery={(q: string) => setSearchQuery(q)}
                        onRemoveQuery={removeAgendaSearchHistory}
                        onClearHistory={clearAgendaSearchHistory}
                        language={settings.language}
                      />
                    </div>
                  )}
                </div>

                <div className="inline-flex items-center gap-1 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/5 px-2.5 py-1 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as AgendaSortMode)}
                    className="bg-transparent font-semibold text-neutral-700 dark:text-neutral-200 focus:outline-none cursor-pointer"
                  >
                    <option value="smart">{isZh ? '智能排序' : 'Smart'}</option>
                    <option value="deadline">{isZh ? '按到期日' : 'Deadline'}</option>
                    <option value="priority">{isZh ? '按优先级' : 'Priority'}</option>
                  </select>
                </div>

                <div className="inline-flex items-center gap-1 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/5 px-2.5 py-1 text-xs">
                  <Zap className="w-3.5 h-3.5 text-orange-500" />
                  <select
                    value={focusPreference}
                    onChange={(e) => setFocusPreference(e.target.value as FocusPreferenceMode)}
                    className="bg-transparent font-semibold text-neutral-700 dark:text-neutral-200 focus:outline-none cursor-pointer"
                  >
                    <option value="balanced">{isZh ? '均衡模式' : 'Balanced'}</option>
                    <option value="quickWins">{isZh ? '速胜优先' : 'Quick Wins'}</option>
                    <option value="deepFocus">{isZh ? '深度专注' : 'Deep Focus'}</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBatchMode((b) => !b);
                    setSelectedIds(new Set());
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                    batchMode
                      ? 'bg-orange-500 text-white border-transparent'
                      : 'border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10'
                  }`}
                >
                  {isZh ? '批量' : 'Select'}
                </button>
              </div>
            </div>

            {/* Smart NLP Quick Add + Templates Drawer */}
            {!isArchivedView && (
              <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-3 sm:p-3.5 space-y-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!quickInput.trim()) return;
                    handleCreateTask(quickInput);
                    setQuickInput('');
                  }}
                  className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
                >
                  {/* Kind toggle: Task vs Note */}
                  <button
                    type="button"
                    onClick={() => setQuickKind((k) => (k === 'task' ? 'note' : 'task'))}
                    title={quickKind === 'task' ? tt.convertToNote : tt.convertToTask}
                    className={`min-h-[38px] px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                      quickKind === 'note'
                        ? 'bg-purple-500/12 border-purple-500/40 text-purple-600 dark:text-purple-300'
                        : 'border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {quickKind === 'note' ? (
                      <FileText className="w-3.5 h-3.5" />
                    ) : (
                      <CheckSquare className="w-3.5 h-3.5 text-orange-500" />
                    )}
                    <span>{quickKind === 'note' ? tt.taskKindNote : tt.taskKindTask}</span>
                  </button>

                  <input
                    ref={quickAddRef}
                    type="text"
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    placeholder={tt.nlpPlaceholder}
                    className="flex-1 min-w-[200px] rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/5 px-3.5 py-2 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500"
                  />

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowTemplatesDrawer((s) => !s)}
                      className={`min-h-[38px] px-3 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                        showTemplatesDrawer
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                          : 'border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <BookTemplate className="w-3.5 h-3.5" />
                      <span>{tt.templatesBtn}</span>
                    </button>

                    <button
                      type="submit"
                      className="min-h-[38px] px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{quickKind === 'note' ? tt.addNote : tt.addTask}</span>
                    </button>
                  </div>
                </form>

                {/* Live NLP Token Recognition Strip */}
                {parsedPreview && parsedPreview.tokens.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap px-1 text-[11px] text-orange-600 dark:text-orange-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{isZh ? '智能识别：' : 'Parsed:'}</span>
                    <span>{parsedPreview.tokens.map((tk) => tk.label).join(' · ')}</span>
                  </div>
                )}

                {/* Templates Library Drawer */}
                {showTemplatesDrawer && (
                  <div className="pt-2 border-t border-neutral-200/70 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ttState.templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.03] p-2.5 flex items-center justify-between gap-2"
                      >
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(tpl)}
                          className="text-left min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {tpl.name}
                          </div>
                          <div className="text-[11px] text-neutral-500 truncate">
                            {tpl.title}
                            {tpl.checklist && tpl.checklist.length > 0
                              ? ` · ${tpl.checklist.length} ${isZh ? '步' : 'steps'}`
                              : ''}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateTickTick((prev) => ({
                              ...prev,
                              templates: prev.templates.filter((x) => x.id !== tpl.id),
                            }))
                          }
                          className="p-1 text-neutral-400 hover:text-rose-500 cursor-pointer shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Multi-Select Batch Action Bar */}
            {batchMode && selectedIds.size > 0 && (
              <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-orange-700 dark:text-orange-300 tabular-nums">
                  {isZh ? `已选中 ${selectedIds.size} 项` : `${selectedIds.size} selected`}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => handleBatchPatch({ isCompleted: true, completedAt: Date.now() })}
                    className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white font-bold cursor-pointer"
                  >
                    {isZh ? '完成' : 'Complete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchPatch({ startDate: todayStr, endDate: todayStr })}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 font-semibold cursor-pointer"
                  >
                    {tt.today}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchPatch({ startDate: tomorrowStr, endDate: tomorrowStr })}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 font-semibold cursor-pointer"
                  >
                    {tt.tomorrow}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchPatch({ priority: 'high' })}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 font-semibold text-rose-600 cursor-pointer"
                  >
                    {isZh ? '设为高优' : 'High'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchPatch({ isWontDo: true, wontDoAt: Date.now() })}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 font-semibold cursor-pointer"
                  >
                    {tt.markWontDo}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchPatch({ isInTrash: true, trashedAt: Date.now() })}
                    className="px-2.5 py-1 rounded-xl bg-rose-500 text-white font-bold cursor-pointer"
                  >
                    {tt.trash}
                  </button>
                </div>
              </div>
            )}

            {/* Today's Habits Quick Strip inside Today list view */}
            {navSelection.type === 'smart' &&
              navSelection.key === 'today' &&
              ttState.showHabitsInToday &&
              todayHabits.length > 0 &&
              taskViewMode === 'list' && (
                <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span>{tt.todayHabitsStrip}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setWorkspaceMode('habits')}
                      className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                    >
                      {isZh ? '管理习惯 →' : 'Manage →'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {todayHabits.map((h) => {
                      const log = getHabitLogForDate(ttState.habitLogs, h.id, todayStr);
                      const done = Boolean(log?.completed);
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic('success', hapticsEnabled);
                            if (h.goalType === 'count') {
                              const nextVal = (log?.value || 0) + 1;
                              handleLogHabit({
                                habitId: h.id,
                                date: todayStr,
                                value: nextVal,
                                completed: nextVal >= h.targetValue,
                                updatedAt: Date.now(),
                              });
                            } else {
                              handleLogHabit({
                                habitId: h.id,
                                date: todayStr,
                                value: done ? 0 : 1,
                                completed: !done,
                                updatedAt: Date.now(),
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            done
                              ? 'bg-emerald-500/12 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                              : 'border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10'
                          }`}
                        >
                          <span>{h.icon}</span>
                          <span>{h.name}</span>
                          {h.goalType === 'count' && (
                            <span className="text-[11px] text-neutral-400 tabular-nums">
                              {log?.value || 0}/{h.targetValue}
                            </span>
                          )}
                          {done && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Main View 1: List */}
            {taskViewMode === 'list' && (
              <div className="space-y-2">
                {filteredTasks.length === 0 ? (
                  <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-12 text-center space-y-1.5">
                    <Target className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
                    <p className="text-sm font-bold text-neutral-600 dark:text-neutral-300">
                      {isZh ? '当前清单暂无事项' : 'No tasks in this view'}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {isZh
                        ? '使用上方智能输入框速记任务或笔记，支持日期、标签与耗时识别'
                        : 'Use Smart Add above with dates, #tags, ~duration or !priority'}
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((evt) => renderTaskRow(evt))
                )}
              </div>
            )}

            {/* Main View 2: Kanban Pro */}
            {taskViewMode === 'kanban' && (
              <TickTickKanbanBoard
                tasks={filteredTasks}
                categories={categories}
                sections={ttState.sections}
                language={settings.language}
                todayStr={todayStr}
                tomorrowStr={tomorrowStr}
                groupBy={kanbanGroupBy}
                onChangeGroupBy={setKanbanGroupBy}
                onAddSection={(name) =>
                  updateTickTick((prev) => ({
                    ...prev,
                    sections: [
                      ...prev.sections,
                      {
                        id: `sec_${Date.now()}`,
                        name,
                        sortOrder: prev.sections.length,
                      },
                    ],
                  }))
                }
                onDeleteSection={(secId) =>
                  updateTickTick((prev) => ({
                    ...prev,
                    sections: prev.sections.filter((s) => s.id !== secId),
                  }))
                }
                onMoveTask={(taskId, patch) => {
                  if (!onUpdateEvents) return;
                  triggerHaptic('selection', hapticsEnabled);
                  onUpdateEvents((prev) =>
                    prev.map((e) =>
                      e.id === taskId ? { ...e, ...patch, updatedAt: Date.now() } : e
                    )
                  );
                }}
                onToggleComplete={handleToggleComplete}
                onInspectTask={(evt) => setInspectedEventId(evt.id)}
                onQuickAddInColumn={(title, patch) => handleCreateTask(title, patch)}
              />
            )}

            {/* Main View 3: 7-Day Timebox Timeline Scheduler Pro */}
            {taskViewMode === 'timeline' && (
              <TickTickTimelineView
                tasks={allTaskEvents.filter((e) => !e.isInTrash && !e.isWontDo)}
                categories={categories}
                language={settings.language}
                todayStr={todayStr}
                onScheduleTask={(taskId, dateStr, startTime, estimatedMinutes) => {
                  if (!onUpdateEvents) return;
                  triggerHaptic('selection', hapticsEnabled);
                  onUpdateEvents((prev) =>
                    prev.map((e) =>
                      e.id === taskId
                        ? {
                            ...e,
                            startDate: dateStr,
                            endDate: dateStr,
                            startTime: startTime || e.startTime || '09:00',
                            isAllDay: false,
                            estimatedMinutes: estimatedMinutes || e.estimatedMinutes || 30,
                            updatedAt: Date.now(),
                          }
                        : e
                    )
                  );
                }}
                onUnscheduleTask={(taskId) => {
                  if (!onUpdateEvents) return;
                  onUpdateEvents((prev) =>
                    prev.map((e) =>
                      e.id === taskId
                        ? { ...e, startDate: '', endDate: '', startTime: undefined, isAllDay: true, updatedAt: Date.now() }
                        : e
                    )
                  );
                }}
                onToggleComplete={handleToggleComplete}
                onInspectTask={(evt) => setInspectedEventId(evt.id)}
                onNavigateToDate={onNavigateToDate}
              />
            )}

            {/* Main View 4: Eisenhower Matrix Pro (Drag & Drop Q1-Q4) */}
            {taskViewMode === 'matrix' && (() => {
              const quadrants = [
                {
                  id: 'q1',
                  title: isZh ? 'I · 重要且紧急' : 'Q1 · Urgent & Important',
                  sub: isZh ? '立即优先处理' : 'Do First',
                  accent: '#E11D48',
                  filter: (e: CalendarEvent) =>
                    e.priority === 'high' && Boolean(e.startDate && e.startDate <= tomorrowStr),
                  dropPatch: { priority: 'high' as const, startDate: todayStr, endDate: todayStr },
                },
                {
                  id: 'q2',
                  title: isZh ? 'II · 重要不紧急' : 'Q2 · Important, Not Urgent',
                  sub: isZh ? '战略规划推进' : 'Schedule',
                  accent: '#D97706',
                  filter: (e: CalendarEvent) =>
                    e.priority === 'high' && (!e.startDate || e.startDate > tomorrowStr),
                  dropPatch: { priority: 'high' as const, startDate: addDaysToDateStr(todayStr, 3), endDate: addDaysToDateStr(todayStr, 3) },
                },
                {
                  id: 'q3',
                  title: isZh ? 'III · 紧急不重要' : 'Q3 · Urgent, Not Important',
                  sub: isZh ? '快速推进或委派' : 'Delegate / Fast',
                  accent: '#2563EB',
                  filter: (e: CalendarEvent) =>
                    e.priority !== 'high' && Boolean(e.startDate && e.startDate <= tomorrowStr),
                  dropPatch: { priority: 'medium' as const, startDate: todayStr, endDate: todayStr },
                },
                {
                  id: 'q4',
                  title: isZh ? 'IV · 不重要不紧急' : 'Q4 · Neither Urgent Nor Important',
                  sub: isZh ? '闲暇处理或暂存' : 'Backlog',
                  accent: '#64748B',
                  filter: (e: CalendarEvent) =>
                    e.priority !== 'high' && (!e.startDate || e.startDate > tomorrowStr),
                  dropPatch: { priority: 'low' as const, startDate: '', endDate: '' },
                },
              ];

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {quadrants.map((q) => {
                    const items = filteredTasks.filter((e) => !e.isCompleted && q.filter(e));
                    return (
                      <div
                        key={q.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (matrixDraggedId && onUpdateEvents) {
                            onUpdateEvents((prev) =>
                              prev.map((item) =>
                                item.id === matrixDraggedId
                                  ? { ...item, ...q.dropPatch, updatedAt: Date.now() }
                                  : item
                              )
                            );
                            setMatrixDraggedId(null);
                          }
                        }}
                        className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4 space-y-3 min-h-[240px]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: q.accent }}
                            />
                            <div>
                              <h3 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                                {q.title}
                              </h3>
                              <p className="text-[11px] text-neutral-400">{q.sub}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-neutral-400 tabular-nums">
                            {items.length}
                          </span>
                        </div>

                        <div className="space-y-2 max-h-[340px] overflow-y-auto">
                          {items.length === 0 ? (
                            <p className="text-xs text-neutral-400 py-8 text-center">
                              {isZh ? '拖拽任务到此象限' : 'Drag tasks here'}
                            </p>
                          ) : (
                            items.map((evt) => (
                              <div
                                key={evt.id}
                                draggable
                                onDragStart={() => setMatrixDraggedId(evt.id)}
                                onDragEnd={() => setMatrixDraggedId(null)}
                                className="cursor-grab"
                              >
                                {renderTaskRow(evt, true)}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        </div>
      )}

      {/* Deep Task & Note Inspector Modal */}
      <TaskInspectorModal
        isOpen={Boolean(inspectedEvent)}
        event={inspectedEvent}
        categories={categories}
        sections={ttState.sections}
        allExistingTags={allExistingTags}
        language={settings.language}
        onClose={() => setInspectedEventId(null)}
        onSave={handleSaveInspected}
        onDeleteToTrash={handleMoveToTrash}
        onRestoreFromTrash={handleRestoreFromTrash}
        onPermanentDelete={handlePermanentDelete}
        onToggleWontDo={handleToggleWontDo}
        onDuplicate={handleDuplicateTask}
        onSaveAsTemplate={handleSaveAsTemplate}
        onStartFocus={onStartFocusInTab}
        onNavigateToDate={onNavigateToDate}
      />

      {/* Custom Smart Filter Builder Modal */}
      {isFilterModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFilterModalOpen(false);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!filterName.trim()) return;
              const rule: SmartFilterRule = {
                id: `filter_${Date.now()}`,
                name: filterName.trim(),
                color: filterColor,
                dateRange: filterDateRange,
                kind: filterKind,
                priorities: filterPriorities.length > 0 ? filterPriorities : undefined,
                categoryIds: filterCatIds.length > 0 ? filterCatIds : undefined,
                tags: filterTagText.trim()
                  ? filterTagText
                      .split(/[,，\s]+/)
                      .map((s) => s.replace(/^#/, '').trim())
                      .filter(Boolean)
                  : undefined,
                status: 'active',
              };
              updateTickTick((prev) => ({ ...prev, filters: [...prev.filters, rule] }));
              setFilterName('');
              setFilterPriorities([]);
              setFilterCatIds([]);
              setFilterTagText('');
              setIsFilterModalOpen(false);
            }}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 shadow-2xl p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-orange-500" />
                <span>{tt.newFilter}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder={isZh ? '筛选名称（如：本周工作高优）' : 'Filter name...'}
              className="w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/5 px-3 py-2 text-xs font-semibold"
            />

            <div className="flex items-center gap-2">
              {ACCENT_PALETTES.slice(0, 6).map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => setFilterColor(p.color)}
                  className={`w-6 h-6 rounded-full cursor-pointer ${
                    filterColor === p.color ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white' : ''
                  }`}
                  style={{ backgroundColor: p.color }}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value as SmartFilterRule['dateRange'])}
                className="rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="any">{isZh ? '任意时间' : 'Any date'}</option>
                <option value="today">{tt.today}</option>
                <option value="tomorrow">{tt.tomorrow}</option>
                <option value="next7">{tt.next7}</option>
                <option value="overdue">{tt.overdue}</option>
                <option value="unscheduled">{tt.inbox}</option>
              </select>

              <select
                value={filterKind}
                onChange={(e) => setFilterKind(e.target.value as SmartFilterRule['kind'])}
                className="rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="all">{isZh ? '任务 + 笔记' : 'Tasks & Notes'}</option>
                <option value="task">{tt.taskKindTask}</option>
                <option value="note">{tt.taskKindNote}</option>
              </select>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-neutral-500 block mb-1">
                {isZh ? '限定优先级' : 'Priorities'}
              </span>
              <div className="flex gap-1.5">
                {(['high', 'medium', 'low'] as const).map((p) => {
                  const active = filterPriorities.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setFilterPriorities((prev) =>
                          prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                        )
                      }
                      className={`px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${
                        active
                          ? 'bg-orange-500/15 border-orange-500 text-orange-600'
                          : 'border-neutral-200/80 dark:border-white/10 text-neutral-500'
                      }`}
                    >
                      {p === 'high' ? (isZh ? '高' : 'High') : p === 'medium' ? (isZh ? '中' : 'Med') : (isZh ? '低' : 'Low')}
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              type="text"
              value={filterTagText}
              onChange={(e) => setFilterTagText(e.target.value)}
              placeholder={isZh ? '包含标签（逗号分隔）' : 'Tags (comma separated)'}
              className="w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/5 px-3 py-2 text-xs"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200/80 dark:border-white/10 text-xs font-semibold cursor-pointer"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold cursor-pointer"
              >
                {isZh ? '创建筛选' : 'Save Filter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Custom List or Folder Modal */}
      {isListModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsListModalOpen(null);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isListModalOpen === 'list' && onUpdateCategories) {
                const name = newListName.trim();
                if (!name) return;
                const newCat: EventCategory = {
                  id: `cat_custom_${Date.now()}`,
                  name,
                  color: newListColor,
                };
                onUpdateCategories([...categories, newCat]);
                setNewListName('');
                setIsListModalOpen(null);
              } else if (isListModalOpen === 'folder') {
                const name = newFolderName.trim();
                if (!name) return;
                const folder: TaskFolder = {
                  id: `folder_${Date.now()}`,
                  name,
                  color: newListColor,
                  categoryIds: [],
                  sortOrder: ttState.folders.length,
                };
                updateTickTick((prev) => ({
                  ...prev,
                  folders: [...prev.folders, folder],
                }));
                setNewFolderName('');
                setIsListModalOpen(null);
              }
            }}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 shadow-2xl p-5 space-y-3.5"
          >
            <h3 className="text-base font-extrabold">
              {isListModalOpen === 'list' ? tt.newList : tt.newFolder}
            </h3>
            <input
              type="text"
              required
              value={isListModalOpen === 'list' ? newListName : newFolderName}
              onChange={(e) =>
                isListModalOpen === 'list'
                  ? setNewListName(e.target.value)
                  : setNewFolderName(e.target.value)
              }
              placeholder={isListModalOpen === 'list' ? (isZh ? '清单名称...' : 'List name...') : (isZh ? '文件夹名称...' : 'Folder name...')}
              className="w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/5 px-3 py-2 text-xs font-semibold"
            />
            <div className="flex items-center gap-2">
              {ACCENT_PALETTES.slice(0, 6).map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => setNewListColor(p.color)}
                  className={`w-6 h-6 rounded-full cursor-pointer ${
                    newListColor === p.color ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white' : ''
                  }`}
                  style={{ backgroundColor: p.color }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsListModalOpen(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200/80 dark:border-white/10 text-xs font-semibold cursor-pointer"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold cursor-pointer"
              >
                {isZh ? '创建' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
