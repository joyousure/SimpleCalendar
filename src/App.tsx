import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense, type SetStateAction } from 'react';
import {
  ViewMode,
  CalendarEvent,
  EventCategory,
  AppSettings,
  ActiveNotification,
  ThemeMode,
  ReminderOffset,
} from './types/calendar';
import { WeatherLocation } from './types/weather';
import { CountdownItem } from './types/countdown';
import {
  loadEventsFromStorage,
  saveEventsToStorage,
  loadCategoriesFromStorage,
  saveCategoriesToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
} from './utils/storage';
import {
  loadCountdownsFromStorage,
  saveCountdownsToStorage,
} from './utils/countdownStorage';
import { refreshAll, syncAllAppData } from './utils/liveDataSync';
import {
  getSavedLocation,
  saveSavedLocation,
  fetchWeatherData,
  getLocalizedDefaultLocation,
} from './utils/weatherService';
import { getHolidayForDate, syncRegionalHolidaysOnline } from './utils/holidayParser';
import {
  detectSystemLanguage,
  getTranslation,
  getExtraLabels,
  isRtlLanguage,
} from './utils/i18n';
import { toDateString, parseDate, getEventsForDate } from './utils/dateUtils';
import { advanceRecurringTaskOnComplete } from './utils/ticktickEngine';
import { triggerHaptic } from './utils/haptics';
import {
  BACK_PRIORITY,
  triggerSystemBack,
  useSystemBackHost,
  useSystemBackLayer,
} from './utils/systemBack';
import { runSharedTransition, sharedTransitionStyle } from './utils/viewTransitions';
import { isSmartTvEnvironment, useSpatialNavigation } from './utils/spatialNavigation';
import { RotateCcw, X } from 'lucide-react';
import { SystemBackEdgeIndicator } from './components/SystemBackEdgeIndicator';

// Eager Core Components
import { Header } from './components/Header';
import { BottomDock, MainNavTab } from './components/BottomDock';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { DayView } from './components/DayView';
import type { ToolSubTab } from './components/ToolsView';

// Eager Light Modals & Overlays
import { DateScheduleModal } from './components/DateScheduleModal';
import { EventModal } from './components/EventModal';
import { EventDetailModal } from './components/EventDetailModal';
import { SearchModal } from './components/SearchModal';
import { SettingsModal } from './components/SettingsModal';
import { PrivacyBadgeModal } from './components/PrivacyBadgeModal';
import { VoiceModal } from './components/VoiceModal';
import { CrossTimezoneSidebar } from './components/CrossTimezoneSidebar';
import { NotificationToast, playReminderSound } from './components/NotificationToast';
import {
  dispatchSystemNotification,
  hasFiredNotificationKey,
  markFiredNotificationKey,
} from './utils/systemNotifications';
import type { LawsInitialTarget } from './components/LawsModal';
import { scheduleIdleOfflineDbPrewarm } from './utils/offlineDb';

// Lazy-Loaded Heavy Views & Modals
const AgendaView = lazy(() => import('./components/AgendaView').then((m) => ({ default: m.AgendaView })));
const PomodoroView = lazy(() => import('./components/PomodoroView').then((m) => ({ default: m.PomodoroView })));
const YearView = lazy(() => import('./components/YearView').then((m) => ({ default: m.YearView })));
const ToolsView = lazy(() => import('./components/ToolsView').then((m) => ({ default: m.ToolsView })));
const SettingsView = lazy(() => import('./components/SettingsView').then((m) => ({ default: m.SettingsView })));
const WorldClockModal = lazy(() => import('./components/WorldClockModal').then((m) => ({ default: m.WorldClockModal })));
const WeatherModal = lazy(() => import('./components/WeatherModal').then((m) => ({ default: m.WeatherModal })));
const KeepNotesModal = lazy(() => import('./components/KeepNotesModal').then((m) => ({ default: m.KeepNotesModal })));
const HealthModal = lazy(() => import('./components/HealthModal').then((m) => ({ default: m.HealthModal })));
const LawsModal = lazy(() => import('./components/LawsModal').then((m) => ({ default: m.LawsModal })));
const ExploreEnglishModal = lazy(() => import('./components/ExploreEnglishModal').then((m) => ({ default: m.ExploreEnglishModal })));

export function App() {
  // Core state
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  // Requirement 1: Restored 'settings' tab, moved countdowns to tools
  const [mainTab, setMainTab] = useState<MainNavTab>('calendar');
  const [tabHistory, setTabHistory] = useState<MainNavTab[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [viewModeHistory, setViewModeHistory] = useState<ViewMode[]>([]);

  const [events, setEvents] = useState<CalendarEvent[]>(() => loadEventsFromStorage());
  const [categories, setCategories] = useState<EventCategory[]>(() => loadCategoriesFromStorage());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettingsFromStorage());
  const [countdowns, setCountdowns] = useState<CountdownItem[]>(() => loadCountdownsFromStorage());

  // Location for Weather & Calendar Cross-Timezone (Localized fallback on fresh install)
  const [weatherLocation, setWeatherLocation] = useState<WeatherLocation>(() =>
    getSavedLocation() || getLocalizedDefaultLocation(settings.language)
  );

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEventForModal, setSelectedEventForModal] = useState<Partial<CalendarEvent> | undefined>(undefined);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(null);

  const [isDateScheduleModalOpen, setIsDateScheduleModalOpen] = useState(false);
  const [selectedDateForSchedule, setSelectedDateForSchedule] = useState<string>(() => toDateString(new Date()));

  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [weatherTargetDate, setWeatherTargetDate] = useState<string>(() => toDateString(new Date()));

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isKeepNotesModalOpen, setIsKeepNotesModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isLawsModalOpen, setIsLawsModalOpen] = useState(false);
  const [lawsInitialTarget, setLawsInitialTarget] = useState<LawsInitialTarget | null>(null);
  const [isExploreModalOpen, setIsExploreModalOpen] = useState(false);
  const [showRootBackHint, setShowRootBackHint] = useState(false);
  const rootBackTimerRef = useRef<number | null>(null);

  const [isWorldClockOpen, setIsWorldClockOpen] = useState(false);
  const [worldClockInitialCity, setWorldClockInitialCity] = useState<string | undefined>(undefined);
  const [focusedTaskId, setFocusedTaskId] = useState<string | undefined>(undefined);
  const [requestedToolTab, setRequestedToolTab] = useState<{ tab: ToolSubTab; seq: number } | null>(null);
  const [toolsResetSeq, setToolsResetSeq] = useState(0);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [syncFeedbackToast, setSyncFeedbackToast] = useState<string | null>(null);
  const syncToastTimerRef = useRef<number | null>(null);
  const hasAppliedThemeRef = useRef(false);
  const themeTransitionTimerRef = useRef<number | null>(null);
  const ui = useMemo(() => getExtraLabels(settings.language), [settings.language]);

  const [undoEntry, setUndoEntry] = useState<{
    id: number;
    label: string;
    restore: () => void;
  } | null>(null);
  const [undoRemainingSec, setUndoRemainingSec] = useState(30);
  const undoTimerRef = useRef<number | null>(null);
  const undoIntervalRef = useRef<number | null>(null);

  // Active Notifications
  const [notifications, setNotifications] = useState<ActiveNotification[]>([]);
  const notifiedEventsRef = useRef<Set<string>>(new Set());

  // 1. Dynamic System Language Listener
  useEffect(() => {
    const handleLanguageChange = () => {
      const sysLang = detectSystemLanguage();
      setSettings((prev) => {
        const updated = { ...prev, language: sysLang };
        saveSettingsToStorage(updated);
        return updated;
      });
    };

    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  // 2. Persist state changes
  useEffect(() => {
    saveEventsToStorage(events);
  }, [events]);

  useEffect(() => {
    saveCategoriesToStorage(categories);
  }, [categories]);

  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings]);

  useEffect(() => {
    saveCountdownsToStorage(countdowns);
  }, [countdowns]);

  // 3. Theme application with smooth cross-fade
  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (hasAppliedThemeRef.current && !prefersReducedMotion) {
      root.classList.add('theme-transitioning');
      if (themeTransitionTimerRef.current) {
        window.clearTimeout(themeTransitionTimerRef.current);
      }
      themeTransitionTimerRef.current = window.setTimeout(() => {
        root.classList.remove('theme-transitioning');
        themeTransitionTimerRef.current = null;
      }, 340);
    } else {
      hasAppliedThemeRef.current = true;
    }

    const mediaQuery =
      typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    const applyThemeState = () => {
      const isDark =
        settings.themeMode === 'dark' ||
        settings.themeMode === 'amoled' ||
        (settings.themeMode === 'system' && Boolean(mediaQuery?.matches));

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      if (settings.themeMode === 'amoled') {
        root.classList.add('amoled-mode');
      } else {
        root.classList.remove('amoled-mode');
      }
    };

    applyThemeState();

    const syncTvModeClass = () => {
      root.classList.toggle('tv-mode', isSmartTvEnvironment(settings));
    };
    syncTvModeClass();
    window.addEventListener('resize', syncTvModeClass);

    root.dir = isRtlLanguage(settings.language) ? 'rtl' : 'ltr';
    root.lang = settings.language;

    if (settings.themeMode !== 'system' || !mediaQuery) {
      return () => window.removeEventListener('resize', syncTvModeClass);
    }
    const onSystemThemeChange = () => applyThemeState();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onSystemThemeChange);
      return () => {
        window.removeEventListener('resize', syncTvModeClass);
        mediaQuery.removeEventListener('change', onSystemThemeChange);
      };
    }
    mediaQuery.addListener?.(onSystemThemeChange);
    return () => {
      window.removeEventListener('resize', syncTvModeClass);
      mediaQuery.removeListener?.(onSystemThemeChange);
    };
  }, [settings]);

  // 4. Immediate live data sync on launch via refreshAll UTC baseline (skipped when Offline Mode is enabled)
  const lastSyncRef = useRef<number>(0);
  useEffect(() => {
    let isMounted = true;
    if (!settings.offlineMode) {
      lastSyncRef.current = Date.now();
      refreshAll(settings.language, currentDate.getFullYear(), weatherLocation, true).then((loc) => {
        if (isMounted && loc) {
          setWeatherLocation(loc);
        }
      });
    }

    const handleLocationUpdated = (e: CustomEvent<WeatherLocation>) => {
      if (e.detail) {
        setWeatherLocation(e.detail);
      }
    };

    window.addEventListener('location-updated', handleLocationUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('location-updated', handleLocationUpdated);
    };
  }, []);

  // Sync regional holidays whenever language or detected location changes (if online)
  useEffect(() => {
    if (settings.offlineMode) return;
    syncRegionalHolidaysOnline(currentDate.getFullYear(), settings.language, weatherLocation, false).catch(() => {});
  }, [settings.language, settings.offlineMode, weatherLocation.country, weatherLocation.name]);

  // Idle-prefetch ExploreEnglishModal chunk & warm IndexedDB offline packs so full-offline launch always succeeds
  useEffect(() => {
    scheduleIdleOfflineDbPrewarm();
    const timer = window.setTimeout(() => {
      void import('./components/ExploreEnglishModal').catch(() => {});
      void import('./components/LawsModal').catch(() => {});
    }, 2000);
    return () => window.clearTimeout(timer);
  }, []);

  // 5. Notification & Reminder Engine + Optional Statutory Holiday Morning Reminder + Native OS Notifications
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const nowMs = now.getTime();
      const todayStr = toDateString(now);
      const tomorrowDate = new Date(now);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = toDateString(tomorrowDate);
      const systemNotifsEnabled = settings.enableSystemNotifications !== false;

      // Optional Holiday Morning Reminder (05:00 - 11:59 on statutory holidays)
      if (
        settings.showHolidays !== false &&
        settings.enableHolidayMorningReminder !== false &&
        now.getHours() >= 5 &&
        now.getHours() < 12
      ) {
        const holiday = getHolidayForDate(
          todayStr,
          settings.language,
          weatherLocation,
          settings.enableChineseWorkdays !== false
        );
        const holidayStorageKey = `holiday_morning_notified_${todayStr}_${holiday?.region || 'CN'}`;
        const alreadyNotifiedHoliday =
          notifiedEventsRef.current.has(holidayStorageKey) ||
          hasFiredNotificationKey(holidayStorageKey) ||
          Boolean(localStorage.getItem(holidayStorageKey));

        if (holiday && holiday.isOffDay && !alreadyNotifiedHoliday) {
          notifiedEventsRef.current.add(holidayStorageKey);
          markFiredNotificationKey(holidayStorageKey);
          try {
            localStorage.setItem(holidayStorageKey, '1');
          } catch {}
          const holidayName = holiday.localName || holiday.name;
          const holidayTitle = `${ui.holidayMorningTitle} · ${holidayName}`;
          const holidayBody = ui.holidayMorningBody.replace('{name}', holidayName);
          const holidayNotif: ActiveNotification = {
            id: `notif_holiday_${todayStr}`,
            eventId: `holiday_${todayStr}`,
            title: holidayTitle,
            message: holidayBody,
            timeString: ui.holidayMorningTitle,
          };
          setNotifications((prev) => [holidayNotif, ...prev]);
          if (settings.enableSoundAlerts) {
            playReminderSound();
          }
          if (systemNotifsEnabled) {
            void dispatchSystemNotification({
              title: holidayTitle,
              body: holidayBody,
              tag: holidayStorageKey,
              silent: !settings.enableSoundAlerts,
              vibrate: settings.enableHaptics !== false,
              onClick: () => {
                setSelectedDateForSchedule(todayStr);
                setIsDateScheduleModalOpen(true);
              },
            });
          }
        }
      }

      const candidateDates = [todayStr, tomorrowStr];
      const t = getTranslation(settings.language);

      events.forEach((evt) => {
        if (evt.isInTrash || evt.isCompleted || evt.isWontDo) return;

        const activeReminders: ReminderOffset[] =
          evt.multipleReminders && evt.multipleReminders.length > 0
            ? evt.multipleReminders.filter((r) => r !== 'none')
            : evt.reminder && evt.reminder !== 'none'
            ? [evt.reminder]
            : [];
        if (activeReminders.length === 0) return;

        for (const remOffset of activeReminders) {
          let reminderOffsetMinutes = 0;
          if (remOffset === 'at_time') reminderOffsetMinutes = 0;
          else if (remOffset === '10m') reminderOffsetMinutes = 10;
          else if (remOffset === '30m') reminderOffsetMinutes = 30;
          else if (remOffset === '1h') reminderOffsetMinutes = 60;
          else if (remOffset === '1d') reminderOffsetMinutes = 1440;

          for (const targetDateStr of candidateDates) {
            if (targetDateStr === tomorrowStr && reminderOffsetMinutes < 60) continue;
            if (getEventsForDate([evt], targetDateStr).length === 0) continue;

            let hours = 9;
            let mins = 0;
            if (evt.startTime) {
              const [h, m] = evt.startTime.split(':').map(Number);
              if (Number.isFinite(h) && Number.isFinite(m)) {
                hours = h;
                mins = m;
              }
            }

            const baseDate = parseDate(targetDateStr);
            baseDate.setHours(hours, mins, 0, 0);
            const targetAlertMs = baseDate.getTime() - reminderOffsetMinutes * 60_000;
            const diffMs = Math.abs(nowMs - targetAlertMs);

            // Within 75 second window and not already notified
            const notifyKey = `${evt.id}_${targetDateStr}_${remOffset}`;
            if (
              diffMs <= 75_000 &&
              !notifiedEventsRef.current.has(notifyKey) &&
              !hasFiredNotificationKey(notifyKey)
            ) {
              notifiedEventsRef.current.add(notifyKey);
              markFiredNotificationKey(notifyKey);

              const bodyText = evt.location
                ? `${t.location}: ${evt.location}`
                : evt.description || t.reminderAtTime;
              const timeLabel = evt.startTime || t.today;

              const newNotif: ActiveNotification = {
                id: `notif_${Date.now()}_${Math.random()}`,
                eventId: evt.id,
                title: evt.title,
                message: bodyText,
                timeString: timeLabel,
              };

              setNotifications((prev) => [newNotif, ...prev]);
              if (settings.enableSoundAlerts) {
                playReminderSound();
              }
              if (systemNotifsEnabled) {
                void dispatchSystemNotification({
                  title: evt.title,
                  body: `${bodyText} (${timeLabel})`,
                  tag: notifyKey,
                  silent: !settings.enableSoundAlerts,
                  vibrate: settings.enableHaptics !== false,
                  onClick: () => {
                    setSelectedEventForDetail(evt);
                    setIsDetailModalOpen(true);
                  },
                });
              }
            }
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [
    events,
    settings.enableSoundAlerts,
    settings.enableSystemNotifications,
    settings.enableHaptics,
    settings.language,
    settings.showHolidays,
    settings.enableHolidayMorningReminder,
    settings.enableChineseWorkdays,
    weatherLocation,
    ui,
  ]);

  const hapticsEnabled = settings.enableHaptics !== false;

  const clearUndoTimers = useCallback(() => {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    if (undoIntervalRef.current) {
      window.clearInterval(undoIntervalRef.current);
      undoIntervalRef.current = null;
    }
  }, []);

  const pushUndo = useCallback(
    (label: string, restore: () => void) => {
      clearUndoTimers();
      setUndoEntry({
        id: Date.now(),
        label,
        restore,
      });
      setUndoRemainingSec(30);
      undoIntervalRef.current = window.setInterval(() => {
        setUndoRemainingSec((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
      undoTimerRef.current = window.setTimeout(() => {
        clearUndoTimers();
        setUndoEntry(null);
      }, 30000);
    },
    [clearUndoTimers]
  );

  const handleExecuteUndo = useCallback(() => {
    if (!undoEntry) return;
    triggerHaptic('selection', hapticsEnabled);
    const restoreFn = undoEntry.restore;
    clearUndoTimers();
    setUndoEntry(null);
    restoreFn();
  }, [undoEntry, hapticsEnabled, clearUndoTimers]);

  const handleDismissUndo = useCallback(() => {
    clearUndoTimers();
    setUndoEntry(null);
  }, [clearUndoTimers]);

  useEffect(() => {
    const onExternalUndo = (e: Event) => {
      const detail = (e as CustomEvent<{ label?: string; restore?: () => void }>).detail;
      if (detail?.restore && detail?.label) {
        pushUndo(detail.label, detail.restore);
      }
    };
    window.addEventListener('app-push-undo', onExternalUndo);
    return () => {
      window.removeEventListener('app-push-undo', onExternalUndo);
      clearUndoTimers();
    };
  }, [pushUndo, clearUndoTimers]);

  const handleTabChange = useCallback(
    (tab: MainNavTab) => {
      if (tab !== mainTab) {
        triggerHaptic('tab', hapticsEnabled);
        runSharedTransition(
          () => {
            setTabHistory((prev) => {
              if (tab === 'calendar') return [];
              const next = prev[prev.length - 1] === mainTab ? prev : [...prev, mainTab];
              return next.slice(-6);
            });
            setMainTab(tab);
          },
          { direction: 'tab' }
        );
      } else if (tab === 'tools') {
        triggerHaptic('selection', hapticsEnabled);
        setToolsResetSeq((s) => s + 1);
      } else {
        setMainTab(tab);
      }
      if (settings.offlineMode) return;
      const nowMs = Date.now();
      if (nowMs - lastSyncRef.current > 20000 || tab === 'tools') {
        lastSyncRef.current = nowMs;
        syncAllAppData(settings.language, currentDate.getFullYear(), weatherLocation).then((loc) => {
          if (loc) setWeatherLocation(loc);
        });
      }
    },
    [mainTab, hapticsEnabled, settings.language, settings.offlineMode, currentDate, weatherLocation]
  );

  const handleCalendarViewChange = useCallback(
    (nextView: ViewMode) => {
      if (nextView === viewMode) return;
      runSharedTransition(
        () => {
          setViewModeHistory((prev) => {
            if (nextView === 'month' && mainTab === 'calendar' && viewMode !== 'year') {
              return [];
            }
            const next = prev[prev.length - 1] === viewMode ? prev : [...prev, viewMode];
            return next.slice(-4);
          });
          setViewMode(nextView);
        },
        { direction: nextView === 'month' ? 'back' : 'forward' }
      );
    },
    [viewMode, mainTab]
  );

  const handleCalendarViewBack = useCallback(() => {
    runSharedTransition(
      () => {
        const prevView = viewModeHistory[viewModeHistory.length - 1];
        if (prevView && prevView !== viewMode) {
          setViewModeHistory((prev) => prev.slice(0, -1));
          setViewMode(prevView);
        } else {
          setViewModeHistory([]);
          setViewMode('month');
        }
      },
      { direction: 'back' }
    );
  }, [viewModeHistory, viewMode]);

  const handleTabBack = useCallback(() => {
    runSharedTransition(
      () => {
        const prevTab = tabHistory[tabHistory.length - 1];
        if (prevTab && prevTab !== mainTab) {
          setTabHistory((prev) => prev.slice(0, -1));
          setMainTab(prevTab);
        } else {
          setTabHistory([]);
          setMainTab('calendar');
        }
      },
      { direction: 'back' }
    );
  }, [tabHistory, mainTab]);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedEventForDetail(null);
  }, []);

  // Global System Back Host (popstate, Escape/BrowserBack/Alt+Arrow, mouse side-back, edge-swipe)
  useSystemBackHost({
    hapticsEnabled,
    isRtl: isRtlLanguage(settings.language),
  });

  // Global Keyboard / TV D-Pad Remote Spatial Navigation
  useSpatialNavigation({
    onBack: () => triggerSystemBack('keyboard'),
    onSearch: () => setIsSearchModalOpen(true),
    onVoice: () => setIsVoiceModalOpen(true),
  });

  useEffect(() => {
    const onRootBack = () => {
      setShowRootBackHint(true);
      if (rootBackTimerRef.current) {
        window.clearTimeout(rootBackTimerRef.current);
      }
      rootBackTimerRef.current = window.setTimeout(() => {
        setShowRootBackHint(false);
        rootBackTimerRef.current = null;
      }, 1900);
    };
    window.addEventListener('app-system-back-at-root', onRootBack);
    return () => {
      window.removeEventListener('app-system-back-at-root', onRootBack);
      if (rootBackTimerRef.current) {
        window.clearTimeout(rootBackTimerRef.current);
      }
    };
  }, []);

  // Register navigation & all 13 root modal layers into global LIFO back stack
  useSystemBackLayer(
    mainTab === 'calendar' && viewMode !== 'month',
    handleCalendarViewBack,
    BACK_PRIORITY.VIEW_DRILLDOWN,
    'calendar-view-drilldown'
  );
  useSystemBackLayer(
    mainTab !== 'calendar',
    handleTabBack,
    BACK_PRIORITY.MAIN_TAB,
    'main-tab'
  );
  useSystemBackLayer(
    isDateScheduleModalOpen,
    () => setIsDateScheduleModalOpen(false),
    BACK_PRIORITY.MODAL,
    'date-schedule-modal'
  );
  useSystemBackLayer(
    isWorldClockOpen,
    () => setIsWorldClockOpen(false),
    BACK_PRIORITY.MODAL,
    'world-clock-modal'
  );
  useSystemBackLayer(
    isWeatherModalOpen,
    () => setIsWeatherModalOpen(false),
    BACK_PRIORITY.MODAL,
    'weather-modal'
  );
  useSystemBackLayer(
    isDetailModalOpen && Boolean(selectedEventForDetail),
    closeDetailModal,
    BACK_PRIORITY.MODAL,
    'event-detail-modal'
  );
  useSystemBackLayer(
    isEventModalOpen,
    () => setIsEventModalOpen(false),
    BACK_PRIORITY.MODAL,
    'event-modal'
  );
  useSystemBackLayer(
    isSearchModalOpen,
    () => setIsSearchModalOpen(false),
    BACK_PRIORITY.MODAL,
    'search-modal'
  );
  useSystemBackLayer(
    isSettingsModalOpen,
    () => setIsSettingsModalOpen(false),
    BACK_PRIORITY.MODAL,
    'settings-modal'
  );
  useSystemBackLayer(
    isPrivacyModalOpen,
    () => setIsPrivacyModalOpen(false),
    BACK_PRIORITY.MODAL,
    'privacy-modal'
  );
  useSystemBackLayer(
    isVoiceModalOpen,
    () => setIsVoiceModalOpen(false),
    BACK_PRIORITY.MODAL,
    'voice-modal'
  );
  useSystemBackLayer(
    isKeepNotesModalOpen,
    () => setIsKeepNotesModalOpen(false),
    BACK_PRIORITY.MODAL,
    'keep-notes-modal'
  );
  useSystemBackLayer(
    isHealthModalOpen,
    () => setIsHealthModalOpen(false),
    BACK_PRIORITY.MODAL,
    'health-modal'
  );
  useSystemBackLayer(
    isLawsModalOpen,
    () => setIsLawsModalOpen(false),
    BACK_PRIORITY.MODAL,
    'laws-modal'
  );
  useSystemBackLayer(
    isExploreModalOpen,
    () => setIsExploreModalOpen(false),
    BACK_PRIORITY.MODAL,
    'explore-english-modal'
  );

  const handleRefreshAll = useCallback(async () => {
    if (isRefreshingAll) return;
    triggerHaptic('selection', hapticsEnabled);
    if (settings.offlineMode) {
      setSyncFeedbackToast(ui.syncOfflineNotice);
      if (syncToastTimerRef.current) {
        window.clearTimeout(syncToastTimerRef.current);
      }
      syncToastTimerRef.current = window.setTimeout(() => {
        setSyncFeedbackToast(null);
      }, 2400);
      return;
    }
    setIsRefreshingAll(true);
    try {
      const loc = await refreshAll(
        settings.language,
        currentDate.getFullYear(),
        weatherLocation,
        true
      );
      if (loc) {
        setWeatherLocation(loc);
      }
      lastSyncRef.current = Date.now();
      setSyncFeedbackToast(ui.syncDoneNotice);
      if (syncToastTimerRef.current) {
        window.clearTimeout(syncToastTimerRef.current);
      }
      syncToastTimerRef.current = window.setTimeout(() => {
        setSyncFeedbackToast(null);
      }, 2600);
    } finally {
      setIsRefreshingAll(false);
    }
  }, [isRefreshingAll, hapticsEnabled, settings.language, settings.offlineMode, currentDate, weatherLocation, ui]);

  // Date Navigation
  const handlePrev = useCallback(() => {
    triggerHaptic('selection', hapticsEnabled);
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() - 7);
      } else if (viewMode === 'day') {
        d.setDate(d.getDate() - 1);
      } else if (viewMode === 'year') {
        d.setFullYear(d.getFullYear() - 1);
      }
      return d;
    });
  }, [viewMode, hapticsEnabled]);

  const handleNext = useCallback(() => {
    triggerHaptic('selection', hapticsEnabled);
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() + 7);
      } else if (viewMode === 'day') {
        d.setDate(d.getDate() + 1);
      } else if (viewMode === 'year') {
        d.setFullYear(d.getFullYear() + 1);
      }
      return d;
    });
  }, [viewMode, hapticsEnabled]);

  const handleToday = useCallback(() => {
    triggerHaptic('selection', hapticsEnabled);
    setCurrentDate(new Date());
  }, [hapticsEnabled]);

  // Event handlers
  const handleNewEvent = useCallback((initialDate?: string, initialTime?: string) => {
    triggerHaptic('create', hapticsEnabled);
    let defaultEndTime = '10:00';
    if (initialTime) {
      const [hPart, mPart = '00'] = initialTime.split(':');
      const startHour = parseInt(hPart, 10);
      if (Number.isFinite(startHour)) {
        defaultEndTime =
          startHour >= 23
            ? '23:59'
            : `${String(startHour + 1).padStart(2, '0')}:${mPart.padStart(2, '0')}`;
      }
    }
    setSelectedEventForModal({
      startDate: initialDate || toDateString(currentDate),
      endDate: initialDate || toDateString(currentDate),
      startTime: initialTime || '09:00',
      endTime: defaultEndTime,
    });
    setIsEventModalOpen(true);
  }, [currentDate, hapticsEnabled]);

  // Weather Modal
  const handleOpenWeather = useCallback((dateStr?: string) => {
    setWeatherTargetDate(dateStr || toDateString(currentDate));
    setIsWeatherModalOpen(true);
  }, [currentDate]);

  // Voice Command Handler
  const handleVoiceCommand = useCallback((action: string) => {
    if (action === 'calendar') {
      handleTabChange('calendar');
    } else if (action === 'agenda') {
      handleTabChange('agenda');
    } else if (action === 'focus') {
      handleTabChange('focus');
    } else if (action === 'tools') {
      handleTabChange('tools');
    } else if (action === 'settings') {
      handleTabChange('settings');
    } else if (action === 'view_day') {
      handleCalendarViewChange('day');
      handleTabChange('calendar');
      handleToday();
    } else if (action === 'view_week') {
      handleCalendarViewChange('week');
      handleTabChange('calendar');
    } else if (action === 'view_month') {
      handleCalendarViewChange('month');
      handleTabChange('calendar');
    } else if (action === 'view_year') {
      handleCalendarViewChange('year');
      handleTabChange('calendar');
    } else if (action === 'next') {
      handleNext();
    } else if (action === 'prev') {
      handlePrev();
    } else if (action === 'new_event') {
      handleNewEvent();
    } else if (action === 'weather') {
      handleOpenWeather();
    } else if (action === 'world_clock') {
      setIsWorldClockOpen(true);
    } else if (action === 'laws') {
      setIsLawsModalOpen(true);
    } else if (action === 'search') {
      setIsSearchModalOpen(true);
    }
  }, [handleTabChange, handleCalendarViewChange, handleToday, handleNext, handlePrev, handleNewEvent, handleOpenWeather]);

  // 6. Keyboard & TV Remote Navigation (Back / Escape is handled globally via useSystemBackHost)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when inside inputs or textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'v' || e.key === 'V') {
        setIsVoiceModalOpen((prev) => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        setCurrentDate(new Date());
      } else if (e.key === 'ArrowLeft' || e.keyCode === 21) {
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.keyCode === 22) {
        handleNext();
      } else if (e.key === 'n' || e.key === 'N') {
        handleNewEvent();
      } else if (e.key === '1') {
        handleTabChange('calendar');
      } else if (e.key === '2') {
        handleTabChange('agenda');
      } else if (e.key === '3') {
        handleTabChange('focus');
      } else if (e.key === '4') {
        handleTabChange('tools');
      } else if (e.key === '5' || e.keyCode === 170) {
        handleTabChange('settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handlePrev, handleNext, handleNewEvent, handleTabChange]);

  const handleSaveEvent = useCallback((event: CalendarEvent) => {
    triggerHaptic('success', hapticsEnabled);
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === event.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = event;
        return next;
      } else {
        return [event, ...prev];
      }
    });
    setIsEventModalOpen(false);
  }, [hapticsEnabled]);

  const handleDeleteEvent = useCallback(
    (id: string) => {
      const prevEvents = events;
      const target = prevEvents.find((e) => e.id === id);
      if (target) {
        const label = `${ui.undoActionDelete}: ${target.title}`;
        pushUndo(label, () => setEvents(prevEvents));
      }
      setEvents((prev) => prev.filter((e) => e.id !== id));
      closeDetailModal();
      setIsEventModalOpen(false);
    },
    [events, ui, pushUndo, closeDetailModal]
  );

  const handleDuplicateEvent = useCallback((event: CalendarEvent) => {
    triggerHaptic('create', hapticsEnabled);
    const duplicated: CalendarEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: `${event.title} (${ui.undoActionCreate})`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setEvents((prev) => [duplicated, ...prev]);
    closeDetailModal();
  }, [hapticsEnabled, ui, closeDetailModal]);

  const handleUpdateEvent = useCallback(
    (updated: CalendarEvent) => {
      const prevEvents = events;
      const existing = prevEvents.find((e) => e.id === updated.id);
      if (existing) {
        const completionChanged = Boolean(existing.isCompleted) !== Boolean(updated.isCompleted);
        const checklistChanged =
          JSON.stringify(existing.checklist || []) !== JSON.stringify(updated.checklist || []);
        if (completionChanged || checklistChanged) {
          const label = `${ui.undoActionEdit}: ${updated.title}`;
          pushUndo(label, () => {
            setEvents(prevEvents);
            setSelectedEventForDetail((curr) => (curr?.id === existing.id ? existing : curr));
          });
        }
      }
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      if (selectedEventForDetail?.id === updated.id) {
        setSelectedEventForDetail(updated);
      }
    },
    [events, ui, selectedEventForDetail, pushUndo]
  );

  const handleToggleEventComplete = useCallback(
    (event: CalendarEvent) => {
      triggerHaptic('success', hapticsEnabled);
      const prevEvents = events;
      const { completedSnapshot, updatedEvent } = advanceRecurringTaskOnComplete(
        event,
        toDateString(new Date())
      );
      const label = `${ui.undoActionEdit}: ${event.title}`;
      pushUndo(label, () => {
        setEvents(prevEvents);
        setSelectedEventForDetail((curr) => (curr?.id === event.id ? event : curr));
      });
      setEvents((prev) => {
        const mapped = prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e));
        return completedSnapshot ? [completedSnapshot, ...mapped] : mapped;
      });
      if (selectedEventForDetail?.id === updatedEvent.id) {
        setSelectedEventForDetail(updatedEvent);
      }
    },
    [events, hapticsEnabled, ui, selectedEventForDetail, pushUndo]
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEventForDetail(event);
    setIsDetailModalOpen(true);
  }, []);

  // Date schedule click
  const handleDateClick = useCallback((dateStr: string) => {
    triggerHaptic('selection', hapticsEnabled);
    setSelectedDateForSchedule(dateStr);
    setIsDateScheduleModalOpen(true);
  }, [hapticsEnabled]);



  // World Clock Modal
  const handleOpenWorldClock = useCallback((city?: string) => {
    setWorldClockInitialCity(city);
    setIsWorldClockOpen(true);
  }, []);

  // Clear all events cleanly without seeding sample data
  const handleResetSampleEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Dismiss notification
  const handleDismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleOpenEventFromNotification = useCallback((eventId: string) => {
    if (eventId.startsWith('holiday_')) {
      setSelectedDateForSchedule(eventId.replace('holiday_', ''));
      setIsDateScheduleModalOpen(true);
      return;
    }
    const found = events.find((e) => e.id === eventId);
    if (found) {
      setSelectedEventForDetail(found);
      setIsDetailModalOpen(true);
    }
  }, [events]);

  // Theme toggle with deterministic state flipping
  const handleToggleTheme = useCallback(() => {
    setSettings((prev) => {
      const isCurrentlyDark =
        prev.themeMode === 'dark' ||
        prev.themeMode === 'amoled' ||
        (prev.themeMode === 'system' &&
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      const nextTheme: ThemeMode = isCurrentlyDark ? 'light' : 'dark';
      const updated = { ...prev, themeMode: nextTheme };
      saveSettingsToStorage(updated);
      return updated;
    });
  }, []);

  // Toggle checklist inside DateScheduleModal
  const handleToggleChecklistFromSchedule = useCallback(
    (eventId: string, itemId: string) => {
      const prevEvents = events;
      const target = prevEvents.find((e) => e.id === eventId);
      if (target) {
        const label = `${ui.undoActionEdit}: ${target.title}`;
        pushUndo(label, () => setEvents(prevEvents));
      }
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== eventId || !e.checklist) return e;
          const updatedChecklist = e.checklist.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
          return { ...e, checklist: updatedChecklist, updatedAt: Date.now() };
        })
      );
    },
    [events, ui, pushUndo]
  );

  // Wrapped bulk / list updaters so deletes and status changes across Agenda, Settings, and Tools trigger Undo
  const eventsRef = useRef<CalendarEvent[]>(events);
  eventsRef.current = events;

  const handleUpdateEventsWithUndo = useCallback(
    (updater: SetStateAction<CalendarEvent[]>) => {
      const prevEvents = eventsRef.current;
      const nextEvents = typeof updater === 'function' ? updater(prevEvents) : updater;
      eventsRef.current = nextEvents;

      if (nextEvents.length < prevEvents.length) {
        const nextIds = new Set(nextEvents.map((e) => e.id));
        const removed = prevEvents.filter((e) => !nextIds.has(e.id));
        const label =
          removed.length === 1
            ? `${ui.undoActionDelete}: ${removed[0].title}`
            : `${ui.undoActionBatch} (${removed.length})`;
        pushUndo(label, () => setEvents(prevEvents));
      } else {
        const prevMap = new Map(prevEvents.map((e) => [e.id, e]));
        const changed = nextEvents.find((ne) => {
          const pe = prevMap.get(ne.id);
          return (
            pe &&
            (Boolean(pe.isCompleted) !== Boolean(ne.isCompleted) ||
              pe.priority !== ne.priority ||
              pe.startDate !== ne.startDate ||
              JSON.stringify(pe.checklist || []) !== JSON.stringify(ne.checklist || []))
          );
        });
        if (changed) {
          const label = `${ui.undoActionEdit}: ${changed.title}`;
          pushUndo(label, () => setEvents(prevEvents));
        }
      }
      setEvents(nextEvents);
    },
    [ui, pushUndo]
  );

  const handleUpdateCategoriesWithUndo = useCallback(
    (nextCategories: EventCategory[]) => {
      const prevCategories = categories;
      if (nextCategories.length < prevCategories.length) {
        const nextIds = new Set(nextCategories.map((c) => c.id));
        const removed = prevCategories.find((c) => !nextIds.has(c.id));
        const label = `${ui.undoActionCategories}: ${removed?.name || ''}`;
        pushUndo(label, () => setCategories(prevCategories));
      }
      setCategories(nextCategories);
    },
    [categories, ui, pushUndo]
  );

  const handleUpdateCountdownsWithUndo = useCallback(
    (nextCountdowns: CountdownItem[]) => {
      const prevCountdowns = countdowns;
      if (nextCountdowns.length < prevCountdowns.length) {
        const nextIds = new Set(nextCountdowns.map((c) => c.id));
        const removed = prevCountdowns.find((c) => !nextIds.has(c.id));
        const label = `${ui.undoActionDelete}: ${removed?.title || ''}`;
        pushUndo(label, () => setCountdowns(prevCountdowns));
      } else {
        const prevMap = new Map(prevCountdowns.map((c) => [c.id, c]));
        const pinChanged = nextCountdowns.find((nc) => {
          const pc = prevMap.get(nc.id);
          return pc && Boolean(pc.isPinned) !== Boolean(nc.isPinned);
        });
        if (pinChanged) {
          const label = `${ui.undoActionEdit}: ${pinChanged.title}`;
          pushUndo(label, () => setCountdowns(prevCountdowns));
        }
      }
      setCountdowns(nextCountdowns);
    },
    [countdowns, ui, pushUndo]
  );

  return (
    <div
      dir={isRtlLanguage(settings.language) ? 'rtl' : 'ltr'}
      className="min-h-screen bg-neutral-100/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-orange-500/20 selection:text-orange-600"
    >
      {/* Top Header (Shown on Calendar tab; hidden on Agenda, Focus, Tools & Settings) */}
      {mainTab === 'calendar' && (
        <Header
          currentDate={currentDate}
          viewMode={viewMode}
          onViewModeChange={(v) => {
            triggerHaptic('tab', hapticsEnabled);
            handleCalendarViewChange(v);
            if (mainTab !== 'calendar') handleTabChange('calendar');
          }}
          canGoBack={mainTab !== 'calendar' || viewMode !== 'month'}
          onSystemBack={() => triggerSystemBack('button')}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onNewEvent={() => handleNewEvent()}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onOpenSettings={() => handleTabChange('settings')}
          onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
          onOpenVoice={() => setIsVoiceModalOpen(true)}
          onOpenWeather={() => handleOpenWeather()}
          onOpenWorldClock={() => setIsWorldClockOpen(true)}
          location={weatherLocation}
          settings={settings}
          onUpdateSettings={setSettings}
          onToggleTheme={handleToggleTheme}
          onRefreshAll={handleRefreshAll}
          isRefreshingAll={isRefreshingAll}
        />
      )}

      {/* Main Content Area (iOS 27 Shared-Element Pane) */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div
          key={mainTab}
          style={sharedTransitionStyle('main-content-pane')}
          className="flex-1 flex flex-col min-h-0 animate-view-enter"
        >
        <Suspense fallback={null}>
        {mainTab === 'calendar' && (
          <>
            {viewMode === 'day' && (
              <DayView
                currentDate={currentDate}
                events={events}
                categories={categories}
                settings={settings}
                location={weatherLocation}
                onSelectEvent={handleSelectEvent}
                onOpenWeather={(d) => handleOpenWeather(d)}
                onCreateEventAt={(d, t) => handleNewEvent(d, t)}
              />
            )}
            {viewMode === 'week' && (
              <WeekView
                currentDate={currentDate}
                events={events}
                categories={categories}
                settings={settings}
                location={weatherLocation}
                onSelectEvent={handleSelectEvent}
                onDateClick={handleDateClick}
                onCreateEventAt={(d, t) => handleNewEvent(d, t)}
              />
            )}
            {viewMode === 'month' && (
              <MonthView
                currentDate={currentDate}
                events={events}
                categories={categories}
                countdowns={countdowns}
                settings={settings}
                location={weatherLocation}
                onSelectEvent={handleSelectEvent}
                onToggleEventComplete={handleToggleEventComplete}
                onSelectDate={(d) => setCurrentDate(d)}
                onDateClick={handleDateClick}
                onCreateEventOnDate={(d) => handleNewEvent(d)}
                onOpenWorldClock={handleOpenWorldClock}
                onOpenWeather={(d) => handleOpenWeather(d)}
                onOpenAgenda={() => handleTabChange('agenda')}
                onOpenCountdowns={() => {
                  setRequestedToolTab({ tab: 'countdowns', seq: Date.now() });
                  handleTabChange('tools');
                }}
                onStartFocusForTask={(taskId) => {
                  setFocusedTaskId(taskId);
                  handleTabChange('focus');
                }}
                onUpdateSettings={setSettings}
                onPrev={handlePrev}
                onNext={handleNext}
              />
            )}
            {viewMode === 'year' && (
              <YearView
                currentDate={currentDate}
                events={events}
                settings={settings}
                onNavigateToMonth={(y, m) => {
                  triggerHaptic('selection', hapticsEnabled);
                  const d = new Date(y, m, 1);
                  setCurrentDate(d);
                  handleCalendarViewChange('month');
                }}
                onNavigateToDay={(d) => {
                  triggerHaptic('selection', hapticsEnabled);
                  setCurrentDate(d);
                  handleCalendarViewChange('day');
                }}
              />
            )}
          </>
        )}

        {/* Tab 2: To-Do / Agenda View (TickTick Pro) */}
        {mainTab === 'agenda' && (
          <AgendaView
            currentDate={currentDate}
            events={events}
            categories={categories}
            settings={settings}
            onSelectEvent={handleSelectEvent}
            onNewEvent={() => handleNewEvent()}
            onUpdateEvents={handleUpdateEventsWithUndo}
            onUpdateCategories={handleUpdateCategoriesWithUndo}
            onNavigateToDate={(dStr) => {
              triggerHaptic('selection', hapticsEnabled);
              setCurrentDate(parseDate(dStr));
              setViewMode('month');
              handleTabChange('calendar');
            }}
            onStartFocusInTab={(taskId) => {
              setFocusedTaskId(taskId);
              handleTabChange('focus');
            }}
          />
        )}

        {/* Tab 3: Dedicated Focus Studio View */}
        {mainTab === 'focus' && (
          <PomodoroView
            events={events}
            categories={categories}
            settings={settings}
            activeTaskId={focusedTaskId}
            onSelectTask={setFocusedTaskId}
            onCompleteTask={(taskId) => {
              const target = events.find((e) => e.id === taskId);
              if (target) handleToggleEventComplete(target);
            }}
            onToggleSubtask={handleToggleChecklistFromSchedule}
            onAddPomodoroToTask={(taskId) => {
              setEvents((prev) =>
                prev.map((e) =>
                  e.id === taskId
                    ? {
                        ...e,
                        completedPomodoros: (e.completedPomodoros || 0) + 1,
                        updatedAt: Date.now(),
                      }
                    : e
                )
              );
            }}
            onNavigateToAgenda={() => handleTabChange('agenda')}
          />
        )}

        {/* Tab 4: Tools (Contains Countdowns, Stock Indices, Metals, PMI/CPI, Date Calculators) */}
        {mainTab === 'tools' && (
          <ToolsView
            settings={settings}
            countdowns={countdowns}
            onUpdateEvent={(newEvt) => {
              setEvents((prev) => {
                const exists = prev.some((e) => e.id === newEvt.id);
                return exists ? prev.map((e) => (e.id === newEvt.id ? newEvt : e)) : [newEvt, ...prev];
              });
            }}
            onUpdateCountdowns={handleUpdateCountdownsWithUndo}
            onOpenWeather={() => handleOpenWeather()}
            onNavigateToCalendar={() => handleTabChange('calendar')}
            onOpenSettings={() => handleTabChange('settings')}
            requestedSubTab={requestedToolTab}
            toolsResetSeq={toolsResetSeq}
          />
        )}

        {/* Tab 5: Settings */}
        {mainTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            categories={categories}
            onUpdateCategories={handleUpdateCategoriesWithUndo}
            events={events}
            onUpdateEvents={handleUpdateEventsWithUndo}
            onResetSampleEvents={handleResetSampleEvents}
            currentYear={currentDate.getFullYear()}
            onBack={() => triggerSystemBack('button')}
            onRefreshAll={handleRefreshAll}
            isRefreshingAll={isRefreshingAll}
          />
        )}
        </Suspense>
        </div>
      </main>

      {/* Auto Cross-Timezone Floating Left Sidebar (Calendar page when location differs from system country/timezone) */}
      <CrossTimezoneSidebar
        location={weatherLocation}
        settings={settings}
        isCalendarActive={mainTab === 'calendar'}
        onOpenWorldClock={handleOpenWorldClock}
      />

      {/* Global 30-Second Floating Undo Overlay (iOS 27 Liquid Glass) */}
      {undoEntry && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(144px+env(safe-area-inset-bottom))] sm:bottom-[calc(154px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 w-[min(92vw,420px)] px-3.5 py-2.5 rounded-[20px] bg-neutral-900/88 dark:bg-neutral-100/92 text-white dark:text-neutral-900 backdrop-blur-2xl border border-white/15 dark:border-black/10 shadow-[0_14px_40px_rgba(0,0,0,0.28)] flex items-center justify-between gap-2.5 animate-fade-in"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center shrink-0 text-[10px] font-bold tabular-nums">
              {undoRemainingSec}s
            </span>
            <span className="text-xs font-semibold truncate">{undoEntry.label}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExecuteUndo}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{ui.undoBtnLabel}</span>
            </button>
            <button
              type="button"
              onClick={handleDismissUndo}
              className="p-1 rounded-full text-white/60 dark:text-neutral-600 hover:text-white dark:hover:text-neutral-900 transition-colors"
              aria-label="Dismiss undo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Global Live Sync Feedback Toast */}
      {syncFeedbackToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(94px+env(safe-area-inset-bottom))] sm:bottom-[calc(104px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-neutral-900/90 dark:bg-white/95 text-white dark:text-neutral-900 text-xs font-bold shadow-lg backdrop-blur-md animate-fade-in whitespace-nowrap pointer-events-none"
        >
          {syncFeedbackToast}
        </div>
      )}

      {/* Floating Bottom Dock */}
      <BottomDock
        currentTab={mainTab}
        onTabChange={handleTabChange}
        onNewEvent={() => handleNewEvent()}
        onOpenKeepNotes={() => setIsKeepNotesModalOpen(true)}
        onOpenHealth={() => setIsHealthModalOpen(true)}
        onOpenLaws={() => setIsLawsModalOpen(true)}
        onOpenExplore={() => setIsExploreModalOpen(true)}
        settings={settings}
      />

      {/* Audio / Visual Notification Toast */}
      <NotificationToast
        notifications={notifications}
        onDismiss={handleDismissNotification}
        onOpenEvent={handleOpenEventFromNotification}
        language={settings.language}
      />

      {/* Modals */}
      {/* 1. Date Schedule Modal */}
      <DateScheduleModal
        isOpen={isDateScheduleModalOpen}
        onClose={() => setIsDateScheduleModalOpen(false)}
        dateStr={selectedDateForSchedule}
        events={events}
        categories={categories}
        settings={settings}
        location={weatherLocation}
        onSelectEvent={(e) => {
          setIsDateScheduleModalOpen(false);
          handleSelectEvent(e);
        }}
        onCreateEventOnDate={(d) => {
          setIsDateScheduleModalOpen(false);
          handleNewEvent(d);
        }}
        onNavigateToDayView={(d) => {
          triggerHaptic('selection', hapticsEnabled);
          setIsDateScheduleModalOpen(false);
          setCurrentDate(d);
          handleCalendarViewChange('day');
          handleTabChange('calendar');
        }}
        onOpenWeather={(d) => {
          setIsDateScheduleModalOpen(false);
          handleOpenWeather(d);
        }}
        onToggleChecklist={handleToggleChecklistFromSchedule}
        onStartFocus={(taskId) => {
          setIsDateScheduleModalOpen(false);
          setFocusedTaskId(taskId);
          handleTabChange('focus');
        }}
      />

      {/* 2 & 3. Lazy World Clock & Weather Modals */}
      <Suspense fallback={null}>
        {isWorldClockOpen && (
          <WorldClockModal
            isOpen={isWorldClockOpen}
            onClose={() => setIsWorldClockOpen(false)}
            settings={settings}
            initialCity={worldClockInitialCity}
          />
        )}

        {isWeatherModalOpen && (
          <WeatherModal
            isOpen={isWeatherModalOpen}
            onClose={() => setIsWeatherModalOpen(false)}
            targetDateStr={weatherTargetDate}
            location={weatherLocation}
            offlineMode={settings.offlineMode}
            onUpdateLocation={(loc) => {
              setWeatherLocation(loc);
              saveSavedLocation(loc);
              if (!settings.offlineMode) {
                fetchWeatherData(loc, settings.language, true).catch(() => {});
              }
            }}
            language={settings.language}
            onNavigateToDay={(d) => {
              triggerHaptic('selection', hapticsEnabled);
              setIsWeatherModalOpen(false);
              setCurrentDate(d);
              handleCalendarViewChange('day');
              handleTabChange('calendar');
            }}
            onCreateEventOnDate={(d) => {
              setIsWeatherModalOpen(false);
              handleNewEvent(d);
            }}
          />
        )}
      </Suspense>

      {/* 4. Event Create / Edit Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialEvent={selectedEventForModal}
        categories={categories}
        settings={settings}
      />

      {/* 5. Event Detail Modal */}
      <EventDetailModal
        event={isDetailModalOpen ? selectedEventForDetail : null}
        categories={categories}
        settings={settings}
        onClose={closeDetailModal}
        onEdit={(e) => {
          closeDetailModal();
          setSelectedEventForModal(e);
          setIsEventModalOpen(true);
        }}
        onDelete={handleDeleteEvent}
        onDuplicate={handleDuplicateEvent}
        onUpdateEvent={handleUpdateEvent}
        onStartFocus={(taskId) => {
          closeDetailModal();
          setFocusedTaskId(taskId);
          handleTabChange('focus');
        }}
      />

      {/* 6. Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        events={events}
        categories={categories}
        settings={settings}
        onSelectEvent={(e) => {
          setIsSearchModalOpen(false);
          handleSelectEvent(e);
        }}
        onSelectLawResult={(target) => {
          setIsSearchModalOpen(false);
          setLawsInitialTarget({ ...target, seq: Date.now() });
          setIsLawsModalOpen(true);
        }}
      />

      {/* 7. Settings Modal (Optional quick access) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        categories={categories}
        onUpdateCategories={handleUpdateCategoriesWithUndo}
        onResetSampleEvents={handleResetSampleEvents}
        currentYear={currentDate.getFullYear()}
      />

      {/* 8. Privacy Badge Modal */}
      <PrivacyBadgeModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        settings={settings}
        eventCount={events.length}
      />

      {/* 9. Voice & Smart Accessibility Modal */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        settings={settings}
        onCommand={handleVoiceCommand}
      />

      {/* 10-13. Lazy Tool & Utility Modals (Notes, Health, Laws, English) */}
      <Suspense fallback={null}>
        {isKeepNotesModalOpen && (
          <KeepNotesModal
            isOpen={isKeepNotesModalOpen}
            onClose={() => setIsKeepNotesModalOpen(false)}
            settings={settings}
          />
        )}

        {isHealthModalOpen && (
          <HealthModal
            isOpen={isHealthModalOpen}
            onClose={() => setIsHealthModalOpen(false)}
            settings={settings}
            completedFocusSessionsToday={events.reduce(
              (sum, ev) => sum + (ev.completedPomodoros || 0),
              0
            )}
          />
        )}

        {isLawsModalOpen && (
          <LawsModal
            isOpen={isLawsModalOpen}
            onClose={() => {
              setIsLawsModalOpen(false);
              setLawsInitialTarget(null);
            }}
            settings={settings}
            initialTarget={lawsInitialTarget}
          />
        )}

        {isExploreModalOpen && (
          <ExploreEnglishModal
            isOpen={isExploreModalOpen}
            onClose={() => setIsExploreModalOpen(false)}
            settings={settings}
          />
        )}
      </Suspense>

      {/* Global Leading-Edge Swipe Back Visual Indicator */}
      <SystemBackEdgeIndicator />

      {/* Root Double-Back Exit Toast */}
      {showRootBackHint && (
        <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[80] px-4 py-2 rounded-full bg-neutral-900/90 dark:bg-white/90 text-white dark:text-neutral-900 text-xs font-semibold shadow-xl backdrop-blur-md animate-fade-in pointer-events-none">
          {ui.rootBackExitHint}
        </div>
      )}
    </div>
  );
}

export default App;
