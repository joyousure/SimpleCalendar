import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { AppSettings, EventCategory, CalendarEvent, Language, WorldClockMode } from '../types/calendar';
import { getTranslation, getExtraLabels, isChineseLocale, isRtlLanguage } from '../utils/i18n';
import { toDateString } from '../utils/dateUtils';
import {
  DEFAULT_ACCENT_COLOR,
  ACCENT_PALETTES,
  exportDatabaseBackup,
  importDatabaseBackup,
  loadEventsFromStorage,
  loadCategoriesFromStorage,
  loadSettingsFromStorage,
  getFirstSeenTimestamp,
  getLastBackupTimestamp,
  recordBackupTimestamp,
  getCategoryDisplayName,
} from '../utils/storage';
import { fetchChineseHolidaysOnline } from '../utils/holidayCn';
import { syncRegionalHolidaysOnline } from '../utils/holidayParser';
import { triggerHaptic } from '../utils/haptics';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';
import {
  saveFileToDevice,
  saveFileToChosenDirectory,
  pickFileFromDevice,
} from '../utils/fileTransfer';
import { generateIcsCalendar, parseIcsCalendar } from '../utils/icsExportImport';
import {
  getSystemNotificationPermission,
  requestSystemNotificationPermission,
  sendTestSystemNotification,
  getSystemNotifUi,
  SystemNotificationPermission,
} from '../utils/systemNotifications';
import {
  Palette,
  Globe,
  Sliders,
  FolderSync,
  Tag,
  ShieldCheck,
  Shield,
  WifiOff,
  Check,
  RefreshCw,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Bell,
  Clock,
  Download,
  FolderDown,
  Upload,
  RotateCcw,
  Plus,
  AlertCircle,
  CheckSquare,
  Square,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  categories: EventCategory[];
  onUpdateCategories: (categories: EventCategory[]) => void;
  events: CalendarEvent[];
  onUpdateEvents: (events: CalendarEvent[]) => void;
  onResetSampleEvents: () => void;
  currentYear?: number;
  onBack?: () => void;
  onRefreshAll?: () => void;
  isRefreshingAll?: boolean;
}

type SettingsSection = 'preferences' | 'appearance' | 'language' | 'categories' | 'backup';
type MobileSettingsPanel = 'home' | SettingsSection;
type NoticeTone = 'success' | 'warning';

const LANGUAGES_LIST: { id: Language; label: string; nativeName: string; code: string }[] = [
  { id: 'zh-CN', label: '简体中文', nativeName: '简体中文', code: 'ZH-CN' },
  { id: 'zh-TW', label: '繁體中文', nativeName: '繁體中文', code: 'ZH-TW' },
  { id: 'en', label: 'English', nativeName: 'English', code: 'EN' },
  { id: 'ja', label: '日本語', nativeName: '日本語', code: 'JA' },
  { id: 'ko', label: '한국어', nativeName: '한국어', code: 'KO' },
  { id: 'fr', label: 'Français', nativeName: 'Français', code: 'FR' },
  { id: 'fa', label: 'فارسی', nativeName: 'فارسی', code: 'FA' },
  { id: 'mn', label: 'Монгол хэл', nativeName: 'Монгол', code: 'MN' },
  { id: 'ru', label: 'Русский', nativeName: 'Русский', code: 'RU' },
  { id: 'ug', label: 'ئۇيغۇرچە', nativeName: 'ئۇيغۇر تىلى', code: 'UG' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  categories,
  onUpdateCategories,
  events,
  onUpdateEvents,
  onResetSampleEvents,
  currentYear = new Date().getFullYear(),
  onBack,
  onRefreshAll,
  isRefreshingAll = false,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);
  const hapticsEnabled = settings.enableHaptics !== false;
  const isRtl = isRtlLanguage(settings.language);
  const showChineseWorkdaysOption = isChineseLocale(settings.language);
  const holidaysEnabled = settings.showHolidays !== false;

  const [activeSection, setActiveSection] = useState<SettingsSection>('preferences');
  const [mobilePanel, setMobilePanel] = useState<MobileSettingsPanel>('home');

  // Category editing state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(DEFAULT_ACCENT_COLOR);

  // Notice banner state with timer cleanup
  const [notice, setNotice] = useState<{ text: string; tone: NoticeTone } | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const [isSyncingHolidays, setIsSyncingHolidays] = useState(false);
  const [dismissedBackupBanner, setDismissedBackupBanner] = useState(false);
  const [sysPerm, setSysPerm] = useState<SystemNotificationPermission>('default');
  const sysUi = useMemo(() => getSystemNotifUi(settings.language), [settings.language]);

  useEffect(() => {
    getSystemNotificationPermission().then(setSysPerm).catch(() => {});
  }, []);

  // Batch Data Cleanup state
  type CleanupRangePreset = '1y' | '6m' | '3m' | 'all' | 'custom';
  const [cleanupRange, setCleanupRange] = useState<CleanupRangePreset>('1y');
  const [cleanupCategoryId, setCleanupCategoryId] = useState<string>('all');
  const [cleanupOnlyCompleted, setCleanupOnlyCompleted] = useState<boolean>(true);
  const [cleanupStartDate, setCleanupStartDate] = useState<string>('');
  const [cleanupEndDate, setCleanupEndDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return toDateString(d);
  });
  const [selectedCleanupIds, setSelectedCleanupIds] = useState<Set<string>>(new Set());

  const showNotice = useCallback((text: string, tone: NoticeTone = 'success', durationMs = 3200) => {
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }
    setNotice({ text, tone });
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const openMobileSection = useCallback((sec: SettingsSection) => {
    triggerHaptic('selection', hapticsEnabled);
    setActiveSection(sec);
    setMobilePanel(sec);
  }, [hapticsEnabled]);

  const closeMobileSection = useCallback(() => {
    triggerHaptic('selection', hapticsEnabled);
    setMobilePanel('home');
  }, [hapticsEnabled]);

  useSystemBackLayer(
    mobilePanel !== 'home',
    closeMobileSection,
    BACK_PRIORITY.SUB_VIEW,
    'settings-mobile-subpanel'
  );

  const eventCountByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach((evt) => {
      map[evt.categoryId] = (map[evt.categoryId] || 0) + 1;
    });
    return map;
  }, [events]);

  // Keep cleanupCategoryId valid if its category gets deleted
  useEffect(() => {
    if (cleanupCategoryId !== 'all' && !categories.some((c) => c.id === cleanupCategoryId)) {
      setCleanupCategoryId('all');
      setSelectedCleanupIds(new Set());
    }
  }, [categories, cleanupCategoryId]);

  // 30-day backup reminder computation
  const backupReminderInfo = useMemo(() => {
    const now = Date.now();
    const thirtyDaysMs = 30 * 86400000;
    const lastBackupAt = settings.lastBackupAt ?? getLastBackupTimestamp();
    const firstSeenAt = getFirstSeenTimestamp();
    const latestEventUpdate = events.reduce(
      (maxTs, evt) => Math.max(maxTs, evt.updatedAt || evt.createdAt || 0),
      0
    );
    const earliestActivity = events.reduce(
      (minTs, evt) => (evt.createdAt > 0 ? Math.min(minTs, evt.createdAt) : minTs),
      firstSeenAt
    );

    const referenceTs = lastBackupAt ?? earliestActivity;
    const daysElapsed = Math.floor((now - referenceTs) / 86400000);
    const dataDeltaMs = latestEventUpdate > 0 ? latestEventUpdate - referenceTs : 0;

    const shouldRemind =
      events.length > 0 &&
      (now - referenceTs > thirtyDaysMs || dataDeltaMs > thirtyDaysMs);

    return {
      shouldRemind,
      daysElapsed,
      neverBackedUp: lastBackupAt === null,
    };
  }, [settings.lastBackupAt, events]);

  // Matching old/completed events for batch cleanup
  const cleanupCutoffDateStr = useMemo(() => {
    const d = new Date();
    if (cleanupRange === '1y') d.setFullYear(d.getFullYear() - 1);
    else if (cleanupRange === '6m') d.setMonth(d.getMonth() - 6);
    else if (cleanupRange === '3m') d.setMonth(d.getMonth() - 3);
    else return '';
    return toDateString(d);
  }, [cleanupRange]);

  // Guard against inverted custom date bounds
  const normalizedCustomDates = useMemo(() => {
    if (cleanupStartDate && cleanupEndDate && cleanupStartDate > cleanupEndDate) {
      return { start: cleanupEndDate, end: cleanupStartDate };
    }
    return { start: cleanupStartDate, end: cleanupEndDate };
  }, [cleanupStartDate, cleanupEndDate]);

  const cleanupCandidates = useMemo(() => {
    return events
      .filter((evt) => {
        if (cleanupOnlyCompleted && !evt.isCompleted) return false;
        if (cleanupCategoryId !== 'all' && evt.categoryId !== cleanupCategoryId) return false;
        const evtDate = evt.endDate || evt.startDate;
        if (cleanupRange === 'custom') {
          if (normalizedCustomDates.start && evtDate < normalizedCustomDates.start) return false;
          if (normalizedCustomDates.end && evtDate > normalizedCustomDates.end) return false;
        } else if (cleanupRange !== 'all' && cleanupCutoffDateStr) {
          if (evtDate >= cleanupCutoffDateStr) return false;
        }
        return true;
      })
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  }, [
    events,
    cleanupOnlyCompleted,
    cleanupCategoryId,
    cleanupRange,
    normalizedCustomDates,
    cleanupCutoffDateStr,
  ]);

  const estimatedCleanupKb = useMemo(() => {
    const targetEvents =
      selectedCleanupIds.size > 0
        ? cleanupCandidates.filter((e) => selectedCleanupIds.has(e.id))
        : cleanupCandidates;
    if (targetEvents.length === 0) return 0;
    const bytes = new Blob([JSON.stringify(targetEvents)]).size;
    return Math.max(1, Math.round(bytes / 1024));
  }, [cleanupCandidates, selectedCleanupIds]);

  const handleToggleCleanupId = (id: string) => {
    setSelectedCleanupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAllCleanup = () => {
    if (selectedCleanupIds.size === cleanupCandidates.length && cleanupCandidates.length > 0) {
      setSelectedCleanupIds(new Set());
    } else {
      setSelectedCleanupIds(new Set(cleanupCandidates.map((e) => e.id)));
    }
  };

  const handleExecuteBatchCleanup = () => {
    const idsToDelete =
      selectedCleanupIds.size > 0
        ? selectedCleanupIds
        : new Set(cleanupCandidates.map((e) => e.id));
    if (idsToDelete.size === 0) {
      showNotice(ui.cleanupToastNoMatch, 'warning', 2500);
      return;
    }
    triggerHaptic('warning', hapticsEnabled);
    onUpdateEvents(events.filter((e) => !idsToDelete.has(e.id)));
    setSelectedCleanupIds(new Set());
    showNotice(ui.cleanupToastDeleted.replace('{count}', String(idsToDelete.size)), 'success', 3500);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    const normalized = trimmed.toLowerCase();
    const isDuplicate = categories.some((c) => {
      const display = getCategoryDisplayName(c, settings.language).trim().toLowerCase();
      return c.name.trim().toLowerCase() === normalized || display === normalized;
    });

    if (isDuplicate) {
      triggerHaptic('warning', hapticsEnabled);
      showNotice(ui.categoryDuplicateNotice, 'warning', 2800);
      return;
    }

    const newCat: EventCategory = {
      id: 'cat-custom-' + Date.now(),
      name: trimmed,
      color: newCatColor,
    };

    triggerHaptic('selection', hapticsEnabled);
    onUpdateCategories([...categories, newCat]);
    setNewCatName('');
  };

  const handleDeleteCategory = (catId: string) => {
    const target = categories.find((c) => c.id === catId);
    if (!target || target.isDefault || categories.length <= 1) return;

    const remaining = categories.filter((c) => c.id !== catId);
    const fallbackCat = remaining.find((c) => c.isDefault) || remaining[0];
    const hasAffectedEvents = events.some((evt) => evt.categoryId === catId);

    triggerHaptic('warning', hapticsEnabled);
    if (hasAffectedEvents && fallbackCat) {
      onUpdateEvents(
        events.map((evt) =>
          evt.categoryId === catId ? { ...evt, categoryId: fallbackCat.id } : evt
        )
      );
    }
    onUpdateCategories(remaining);
  };

  const folderExportLabel =
    settings.language === 'zh-CN'
      ? '选择文件夹导出'
      : settings.language === 'zh-TW'
      ? '選擇資料夾匯出'
      : settings.language === 'ja'
      ? 'フォルダへ保存'
      : settings.language === 'ko'
      ? '폴더 선택 내보내기'
      : 'Save to Folder';

  const handleRequestSysPerm = async () => {
    const nextPerm = await requestSystemNotificationPermission();
    setSysPerm(nextPerm);
    if (nextPerm === 'granted') {
      triggerHaptic('selection', hapticsEnabled);
      onUpdateSettings({ ...settings, enableSystemNotifications: true });
      showNotice(sysUi.statusGranted, 'success', 2800);
    } else {
      showNotice(sysUi.testNeedPerm, 'warning', 3200);
    }
  };

  const handleTestSysNotif = async () => {
    const res = await sendTestSystemNotification(settings.language);
    const refreshed = await getSystemNotificationPermission();
    setSysPerm(refreshed);
    if (res === 'sent') {
      triggerHaptic('selection', hapticsEnabled);
      showNotice(sysUi.testSentOk, 'success', 2800);
    } else {
      showNotice(sysUi.testNeedPerm, 'warning', 3200);
    }
  };

  const handleExportData = async () => {
    const nowTs = Date.now();
    const jsonStr = exportDatabaseBackup();
    const filename = `calendar-backup-${toDateString(new Date(nowTs))}.json`;
    const res = await saveFileToDevice(filename, jsonStr, 'application/json;charset=utf-8');
    if (res.ok) {
      recordBackupTimestamp(nowTs);
      onUpdateSettings({ ...settings, lastBackupAt: nowTs });
      showNotice(
        res.pathHint ? `${ui.backupSavedMsg} (${res.pathHint})` : ui.backupSavedMsg,
        'success',
        3200
      );
    } else if (res.error !== 'cancelled') {
      showNotice(res.error || ui.backupInvalidMsg, 'warning', 3500);
    }
  };

  const handleExportDataToFolder = async () => {
    const nowTs = Date.now();
    const jsonStr = exportDatabaseBackup();
    const filename = `calendar-backup-${toDateString(new Date(nowTs))}.json`;
    const res = await saveFileToChosenDirectory(
      filename,
      jsonStr,
      'application/json;charset=utf-8'
    );
    if (res.ok) {
      recordBackupTimestamp(nowTs);
      onUpdateSettings({ ...settings, lastBackupAt: nowTs });
      showNotice(
        res.pathHint ? `${ui.backupSavedMsg} (${res.pathHint})` : ui.backupSavedMsg,
        'success',
        3500
      );
    } else if (res.error !== 'cancelled') {
      showNotice(res.error || ui.backupInvalidMsg, 'warning', 3500);
    }
  };

  const processImportedJsonContent = (content: string) => {
    try {
      const res = importDatabaseBackup(content);
      if (res.success) {
        const loadedEvents = loadEventsFromStorage();
        const loadedCategories = loadCategoriesFromStorage();
        const loadedSettings = loadSettingsFromStorage();
        onUpdateEvents(loadedEvents);
        onUpdateCategories(loadedCategories);
        onUpdateSettings(loadedSettings);
        showNotice(ui.backupRestoredMsg, 'success', 3500);
      } else {
        showNotice(res.error || ui.backupInvalidMsg, 'warning', 4000);
      }
    } catch {
      showNotice(ui.backupInvalidMsg, 'warning', 4000);
    }
  };

  const handlePickAndImportJson = async () => {
    const file = await pickFileFromDevice({
      accept: '.json',
      mimeTypes: ['application/json'],
      description: 'Calendar Backup JSON',
    });
    if (!file) return;
    try {
      const content = await file.text();
      processImportedJsonContent(content);
    } catch {
      showNotice(ui.backupInvalidMsg, 'warning', 4000);
    }
  };

  const handleExportIcs = async () => {
    const activeEvents = events.filter((e) => !e.isInTrash);
    const icsContent = generateIcsCalendar(activeEvents, t.appName);
    const filename = `calendar-events-${toDateString(new Date())}.ics`;
    const res = await saveFileToDevice(filename, icsContent, 'text/calendar;charset=utf-8');
    if (res.ok) {
      showNotice(
        res.pathHint ? `${ui.backupSavedMsg} (${res.pathHint})` : ui.backupSavedMsg,
        'success',
        3200
      );
    } else if (res.error !== 'cancelled') {
      showNotice(res.error || ui.backupInvalidMsg, 'warning', 3500);
    }
  };

  const handlePickAndImportIcs = async () => {
    const file = await pickFileFromDevice({
      accept: '.ics,.ical',
      mimeTypes: ['text/calendar'],
      description: 'iCalendar (.ics)',
    });
    if (!file) return;
    try {
      const content = await file.text();
      const defaultCatId = categories.find((c) => c.isDefault)?.id || categories[0]?.id || 'cat-personal';
      const parsedEvents = parseIcsCalendar(content, defaultCatId);
      if (parsedEvents.length === 0) {
        showNotice(ui.backupInvalidMsg, 'warning', 3500);
        return;
      }
      onUpdateEvents([...parsedEvents, ...events]);
      triggerHaptic('selection', hapticsEnabled);
      showNotice(`${ui.backupRestoredMsg} (+${parsedEvents.length})`, 'success', 3500);
    } catch {
      showNotice(ui.backupInvalidMsg, 'warning', 4000);
    }
  };

  const handleSyncHolidays = async () => {
    if (settings.offlineMode) {
      showNotice(ui.syncOfflineNotice, 'warning', 3000);
      return;
    }
    setIsSyncingHolidays(true);
    try {
      const results = await Promise.allSettled([
        fetchChineseHolidaysOnline(currentYear),
        syncRegionalHolidaysOnline(currentYear, settings.language, null, false),
      ]);
      const hasSyncedRecords = results.some(
        (res) => res.status === 'fulfilled' && Array.isArray(res.value) && res.value.length > 0
      );
      if (hasSyncedRecords) {
        triggerHaptic('selection', hapticsEnabled);
        showNotice(t.holidaySyncSuccess, 'success', 3000);
      } else {
        showNotice(ui.holidaySyncFailedNotice, 'warning', 3200);
      }
    } finally {
      setIsSyncingHolidays(false);
    }
  };

  const currentLangLabel = useMemo(
    () => LANGUAGES_LIST.find((l) => l.id === settings.language)?.label || settings.language,
    [settings.language]
  );

  const currentThemeLabel = useMemo(() => {
    if (settings.themeMode === 'light') return t.themeLight;
    if (settings.themeMode === 'dark') return t.themeDark;
    if (settings.themeMode === 'amoled') return t.themeAmoled;
    return t.themeSystem;
  }, [settings.themeMode, t.themeLight, t.themeDark, t.themeAmoled, t.themeSystem]);

  const sections: {
    id: SettingsSection;
    label: string;
    summary: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBgClass: string;
  }[] = [
    {
      id: 'preferences',
      label: t.settingsTabPreferences,
      summary: `${settings.firstDayOfWeek === 1 ? ui.mondayShort : ui.sundayShort} · ${settings.use24HourFormat ? '24h' : '12h'}`,
      icon: Sliders,
      iconBgClass: 'bg-emerald-500 text-white',
    },
    {
      id: 'appearance',
      label: t.settingsTabAppearance,
      summary: currentThemeLabel,
      icon: Palette,
      iconBgClass: 'bg-indigo-500 text-white',
    },
    {
      id: 'language',
      label: t.settingsTabLanguage,
      summary: currentLangLabel,
      icon: Globe,
      iconBgClass: 'bg-sky-500 text-white',
    },
    {
      id: 'categories',
      label: t.settingsTabCategories,
      summary: `${categories.length}`,
      icon: Tag,
      iconBgClass: 'bg-amber-500 text-white',
    },
    {
      id: 'backup',
      label: t.settingsTabBackup,
      summary: `${events.length}`,
      icon: FolderSync,
      iconBgClass: 'bg-teal-600 text-white',
    },
  ];

  const activeSectionMeta = sections.find((s) => s.id === activeSection) || sections[0];

  const cardSurfaceClass =
    'rounded-2xl bg-white/88 dark:bg-white/[0.06] [.amoled-mode_&]:bg-neutral-950/90 backdrop-blur-2xl border border-neutral-200/75 dark:border-white/12 [.amoled-mode_&]:border-white/15 shadow-2xs';

  const renderToggle = (
    checked: boolean,
    onToggle: () => void,
    ariaLabel: string,
    disabled: boolean = false
  ) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onToggle}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
        disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
    >
      <span
        className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked
            ? isRtl
              ? '-translate-x-5'
              : 'translate-x-5'
            : 'translate-x-0'
        }`}
      />
    </button>
  );

  // Reusable active section detail renderer (shared across Mobile drill-down, Tablet, and Desktop)
  const renderActiveSectionContent = () => (
    <div className="space-y-3.5 animate-fade-in">
      {/* SECTION 1: Preferences */}
      {activeSection === 'preferences' && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5 items-start">
            {/* Group 1: Calendar & Time Display */}
            <div>
              <div className="px-3 pb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                <CalendarDays className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t.settingsTabDisplay}</span>
              </div>
              <div className={`${cardSurfaceClass} overflow-hidden divide-y divide-neutral-100 dark:divide-white/8`}>
                {/* First Day of Week */}
                <div className="px-3.5 py-2.5 min-h-[52px] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {t.firstDayLabel}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">{t.firstDayDesc}</div>
                  </div>
                  <div className="flex items-center p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection', hapticsEnabled);
                        onUpdateSettings({ ...settings, firstDayOfWeek: 0 });
                      }}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                        settings.firstDayOfWeek === 0
                          ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                      }`}
                    >
                      {ui.sundayShort}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection', hapticsEnabled);
                        onUpdateSettings({ ...settings, firstDayOfWeek: 1 });
                      }}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                        settings.firstDayOfWeek === 1
                          ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                      }`}
                    >
                      {ui.mondayShort}
                    </button>
                  </div>
                </div>

                {/* 24-Hour Format */}
                <div className="px-3.5 py-2.5 min-h-[52px] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {t.timeFormatLabel}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">{t.timeFormatDesc}</div>
                  </div>
                  <div className="flex items-center p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 text-xs font-mono shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection', hapticsEnabled);
                        onUpdateSettings({ ...settings, use24HourFormat: false });
                      }}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                        !settings.use24HourFormat
                          ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                      }`}
                    >
                      12h
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection', hapticsEnabled);
                        onUpdateSettings({ ...settings, use24HourFormat: true });
                      }}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                        settings.use24HourFormat
                          ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                      }`}
                    >
                      24h
                    </button>
                  </div>
                </div>

                {/* ISO Week Numbers */}
                <div className="px-3.5 py-2.5 min-h-[52px] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {ui.weekNumbersTitle}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">{ui.weekNumbersDesc}</div>
                  </div>
                  {renderToggle(
                    settings.showWeekNumbers !== false,
                    () => {
                      triggerHaptic('selection', hapticsEnabled);
                      onUpdateSettings({
                        ...settings,
                        showWeekNumbers: !(settings.showWeekNumbers !== false),
                      });
                    },
                    ui.weekNumbersTitle
                  )}
                </div>

                {/* Statutory Holidays Toggle */}
                <div className="px-3.5 py-2.5 min-h-[52px] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {t.showHolidaysLabel}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">{t.showHolidaysDesc}</div>
                  </div>
                  {renderToggle(
                    holidaysEnabled,
                    () => {
                      triggerHaptic('selection', hapticsEnabled);
                      onUpdateSettings({ ...settings, showHolidays: !holidaysEnabled });
                    },
                    t.showHolidaysLabel
                  )}
                </div>

                {/* Chinese Adjusted Workday Badges (休/班) */}
                {showChineseWorkdaysOption && (
                  <div
                    className={`px-3.5 py-2.5 min-h-[52px] flex items-center justify-between gap-3 transition-opacity ${
                      !holidaysEnabled ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {t.workdayOvertimeLabel}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {t.holidayOffBadge} / {t.workdayOvertimeBadge}
                      </div>
                    </div>
                    {renderToggle(
                      holidaysEnabled && settings.enableChineseWorkdays !== false,
                      () => {
                        triggerHaptic('selection', hapticsEnabled);
                        onUpdateSettings({
                          ...settings,
                          enableChineseWorkdays: !(settings.enableChineseWorkdays !== false),
                        });
                      },
                      t.workdayOvertimeLabel,
                      !holidaysEnabled
                    )}
                  </div>
                )}

                {/* Lunar & Solar Terms Toggle */}
                <div className="px-3.5 py-2.5 min-h-[52px] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {t.settingsShowLunarLabel}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {t.settingsShowLunarDesc}
                    </div>
                  </div>
                  {renderToggle(
                    settings.showLunarCalendar !== false,
                    () => {
                      triggerHaptic('selection', hapticsEnabled);
                      onUpdateSettings({
                        ...settings,
                        showLunarCalendar: !(settings.showLunarCalendar !== false),
                      });
                    },
                    t.settingsShowLunarLabel
                  )}
                </div>

                {/* Weather Icons Toggle */}
                <div className="px-3.5 py-2.5 min-h-[52px] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {t.settingsShowWeatherLabel}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {t.settingsShowWeatherDesc}
                    </div>
                  </div>
                  {renderToggle(
                    settings.showWeatherIcon !== false,
                    () => {
                      triggerHaptic('selection', hapticsEnabled);
                      onUpdateSettings({
                        ...settings,
                        showWeatherIcon: !(settings.showWeatherIcon !== false),
                      });
                    },
                    t.settingsShowWeatherLabel
                  )}
                </div>
              </div>
            </div>

            {/* Group 2: Reminders, Haptics & Privacy */}
            <div>
              <div className="px-3 pb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{t.eventReminder}</span>
              </div>
              <div className={`${cardSurfaceClass} overflow-hidden divide-y divide-neutral-100 dark:divide-white/8`}>
                {/* System Native Notifications */}
                <div className="px-3.5 py-2.5 space-y-2">
                  <div className="min-h-[44px] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {sysUi.toggleTitle}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">{sysUi.toggleDesc}</div>
                    </div>
                    {renderToggle(
                      settings.enableSystemNotifications !== false,
                      async () => {
                        triggerHaptic('selection', hapticsEnabled);
                        const nextVal = !(settings.enableSystemNotifications !== false);
                        if (nextVal && sysPerm === 'default') {
                          const p = await requestSystemNotificationPermission();
                          setSysPerm(p);
                        }
                        onUpdateSettings({
                          ...settings,
                          enableSystemNotifications: nextVal,
                        });
                      },
                      sysUi.toggleTitle
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-neutral-100 dark:border-white/8">
                    <span
                      className={`text-[11px] font-semibold ${
                        sysPerm === 'granted'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : sysPerm === 'denied'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {sysPerm === 'granted'
                        ? sysUi.statusGranted
                        : sysPerm === 'denied'
                        ? sysUi.statusDenied
                        : sysPerm === 'unsupported'
                        ? sysUi.statusUnsupported
                        : sysUi.statusDefault}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {sysPerm !== 'granted' && sysPerm !== 'unsupported' && (
                        <button
                          type="button"
                          onClick={handleRequestSysPerm}
                          className="min-h-[30px] px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          {sysUi.requestBtn}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleTestSysNotif}
                        className="min-h-[30px] px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200/80 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        {sysUi.testBtn}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-3.5 py-2.5 min-h-[52px] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {ui.soundAlertsTitle}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">{ui.soundAlertsDesc}</div>
                  </div>
                  {renderToggle(
                    Boolean(settings.enableSoundAlerts),
                    () => {
                      triggerHaptic('selection', hapticsEnabled);
                      onUpdateSettings({
                        ...settings,
                        enableSoundAlerts: !settings.enableSoundAlerts,
                      });
                    },
                    ui.soundAlertsTitle
                  )}
                </div>

                <div className="px-3.5 py-2.5 min-h-[52px] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {ui.hapticsTitle}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">{ui.hapticsDesc}</div>
                  </div>
                  {renderToggle(
                    settings.enableHaptics !== false,
                    () => {
                      const nextVal = !(settings.enableHaptics !== false);
                      if (nextVal) triggerHaptic('selection', true);
                      onUpdateSettings({ ...settings, enableHaptics: nextVal });
                    },
                    ui.hapticsTitle
                  )}
                </div>

                <div
                  className={`px-3.5 py-2.5 min-h-[52px] flex items-center justify-between gap-3 transition-opacity ${
                    !holidaysEnabled ? 'opacity-50' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {ui.holidayMorningTitle}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {ui.holidayMorningDesc}
                    </div>
                  </div>
                  {renderToggle(
                    holidaysEnabled && settings.enableHolidayMorningReminder !== false,
                    () => {
                      triggerHaptic('selection', hapticsEnabled);
                      onUpdateSettings({
                        ...settings,
                        enableHolidayMorningReminder: !(
                          settings.enableHolidayMorningReminder !== false
                        ),
                      });
                    },
                    ui.holidayMorningTitle,
                    !holidaysEnabled
                  )}
                </div>

                <div className="px-3.5 py-2.5 min-h-[52px] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      {settings.offlineMode ? (
                        <Shield className="w-3.5 h-3.5" />
                      ) : (
                        <WifiOff className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {ui.offlineModeTitle}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {ui.offlineModeDesc}
                      </div>
                    </div>
                  </div>
                  {renderToggle(
                    Boolean(settings.offlineMode),
                    () => {
                      triggerHaptic('selection', hapticsEnabled);
                      onUpdateSettings({ ...settings, offlineMode: !settings.offlineMode });
                    },
                    ui.offlineModeTitle
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Group 3: World Clock Style & Holiday Sync */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className={`${cardSurfaceClass} p-3.5 sm:p-4 space-y-2.5`}>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-neutral-900 dark:text-neutral-100">
                <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{ui.worldClockStylesTitle}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                {[
                  { id: 'flip' as WorldClockMode, label: t.clockModeFlip || 'Flip' },
                  { id: 'analog' as WorldClockMode, label: t.clockModeAnalog || 'Analog' },
                  { id: 'capsule' as WorldClockMode, label: t.clockModeCapsule || 'Capsule' },
                  { id: 'glass' as WorldClockMode, label: t.clockModeGlass || 'Glass' },
                  { id: 'hud' as WorldClockMode, label: t.clockModeHud || 'HUD' },
                  { id: 'minimal' as WorldClockMode, label: t.clockModeMinimal || 'Minimal' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection', hapticsEnabled);
                      onUpdateSettings({ ...settings, worldClockMode: m.id });
                    }}
                    className={`min-h-[38px] py-2 px-2 rounded-xl border text-center transition-all cursor-pointer truncate ${
                      (settings.worldClockMode || 'flip') === m.id
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                        : 'border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-50/80 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`${cardSurfaceClass} p-3.5 sm:p-4 flex flex-col justify-between gap-2.5`}>
              <div>
                <div className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100">
                  {t.holidayCnLabel}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  {t.holidayCnDesc}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-white/8">
                <span className="text-[11px] font-mono tabular-nums text-neutral-500 truncate">
                  {currentYear} · {t.holidayCnLabel}
                </span>
                <button
                  type="button"
                  onClick={handleSyncHolidays}
                  disabled={isSyncingHolidays || Boolean(settings.offlineMode)}
                  title={settings.offlineMode ? ui.syncOfflineNotice : t.holidaySyncNow}
                  aria-label={t.holidaySyncNow}
                  className="min-w-[40px] min-h-[40px] px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-700 dark:text-neutral-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-neutral-200 dark:border-neutral-700 inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingHolidays ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline whitespace-nowrap">{ui.refreshLabel}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Appearance */}
      {activeSection === 'appearance' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-start">
          <div className={`${cardSurfaceClass} xl:col-span-7 p-3.5 sm:p-4 space-y-3`}>
            <div className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100">
              {t.themeLabel}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'system',
                  label: t.themeSystem,
                  previewClass: 'bg-gradient-to-br from-neutral-100 via-neutral-200 to-neutral-900',
                },
                {
                  id: 'light',
                  label: t.themeLight,
                  previewClass: 'bg-gradient-to-br from-white to-neutral-100',
                },
                {
                  id: 'dark',
                  label: t.themeDark,
                  previewClass: 'bg-gradient-to-br from-neutral-800 to-neutral-900',
                },
                { id: 'amoled', label: t.themeAmoled, previewClass: 'bg-black' },
              ].map((item) => {
                const active = settings.themeMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection', hapticsEnabled);
                      onUpdateSettings({
                        ...settings,
                        themeMode: item.id as AppSettings['themeMode'],
                      });
                    }}
                    className={`p-2.5 min-h-[76px] rounded-2xl border text-start transition-all cursor-pointer space-y-2 ${
                      active
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                        : 'border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-50/70 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div
                      className={`h-8 w-full rounded-xl border border-neutral-300/60 dark:border-neutral-700 ${item.previewClass}`}
                    />
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-bold truncate ${
                          active
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {item.label}
                      </span>
                      {active && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`${cardSurfaceClass} xl:col-span-5 p-3.5 sm:p-4 space-y-3`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100">
                {t.accentColorLabel}
              </span>
              <span className="text-[11px] font-mono text-neutral-400 truncate">
                {ACCENT_PALETTES.find((p) => p.color === settings.accentColor)?.name ||
                  settings.accentColor}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {ACCENT_PALETTES.map((palette) => {
                const isSelected = settings.accentColor === palette.color;
                return (
                  <button
                    key={palette.color}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection', hapticsEnabled);
                      onUpdateSettings({ ...settings, accentColor: palette.color });
                    }}
                    className={`w-11 h-11 rounded-2xl transition-transform flex items-center justify-center cursor-pointer shadow-xs ${
                      isSelected
                        ? 'scale-105 ring-2 ring-offset-2 ring-neutral-900 dark:ring-white ring-offset-white dark:ring-offset-neutral-900'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: palette.color }}
                    title={palette.name}
                    aria-label={palette.name}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Language */}
      {activeSection === 'language' && (
        <div className="space-y-2.5">
          <div className="px-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            {ui.languageAutoNote}
          </div>
          <div
            className={`${cardSurfaceClass} overflow-hidden grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 divide-y sm:divide-y-0 sm:gap-px sm:bg-neutral-200/60 sm:dark:bg-white/10`}
          >
            {LANGUAGES_LIST.map((lang) => {
              const isSel = settings.language === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection', hapticsEnabled);
                    onUpdateSettings({ ...settings, language: lang.id });
                  }}
                  className={`px-3.5 py-3 min-h-[54px] text-start flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSel
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                      : 'bg-white/95 dark:bg-neutral-900/90 [.amoled-mode_&]:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold truncate">{lang.label}</div>
                    <div className="text-[10.5px] text-neutral-400 font-mono truncate">
                      {lang.nativeName} · {lang.code}
                    </div>
                  </div>
                  {isSel && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: Categories */}
      {activeSection === 'categories' && (
        <div className="space-y-3.5">
          <form
            onSubmit={handleAddCategory}
            className={`${cardSurfaceClass} p-3 flex items-center gap-2`}
          >
            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent shrink-0"
              aria-label="Category color"
            />
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder={t.newCategoryPlaceholder}
              className="flex-1 min-w-0 min-h-[40px] px-3 py-2 text-xs bg-neutral-100/90 dark:bg-neutral-800 rounded-xl border border-neutral-200/80 dark:border-neutral-700 focus:outline-none focus:border-emerald-500 text-neutral-900 dark:text-neutral-100"
            />
            <button
              type="submit"
              disabled={!newCatName.trim()}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-40 shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{t.add}</span>
            </button>
          </form>

          <div
            className={`${cardSurfaceClass} overflow-hidden grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:gap-px lg:bg-neutral-200/60 lg:dark:bg-white/10`}
          >
            {categories.map((cat) => {
              const count = eventCountByCategory[cat.id] || 0;
              const displayCatName = getCategoryDisplayName(cat, settings.language);
              return (
                <div
                  key={cat.id}
                  className="px-3.5 py-2.5 min-h-[52px] flex items-center justify-between gap-2 bg-white/95 dark:bg-neutral-900/90 [.amoled-mode_&]:bg-neutral-950"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200 truncate">
                      {displayCatName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-neutral-400 font-mono tabular-nums">
                      {count} {ui.itemsUnit}
                    </span>
                    {!cat.isDefault && categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
                        aria-label={`${t.deleteEvent} ${displayCatName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 5: Backup, Batch Data Cleanup & Storage Management */}
      {activeSection === 'backup' && (
        <div className="space-y-3.5">
          <div className={`${cardSurfaceClass} p-3.5 sm:p-4 space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[13px] font-extrabold text-neutral-900 dark:text-neutral-100">
                  {t.backupSectionLabel}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">{t.privacyLocalStorageDesc}</p>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-neutral-500 shrink-0">
                {ui.storedRecordsLabel.replace('{count}', String(events.length))} ·{' '}
                {categories.length} {ui.itemsUnit}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleExportData}
                className="min-h-[42px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.downloadJson}</span>
              </button>

              <button
                type="button"
                onClick={handleExportDataToFolder}
                className="min-h-[42px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <FolderDown className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{folderExportLabel}</span>
              </button>

              <button
                type="button"
                onClick={handlePickAndImportJson}
                className="min-h-[42px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold cursor-pointer transition-all border border-neutral-200 dark:border-neutral-700"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.restoreJson}</span>
              </button>

              <button
                type="button"
                onClick={handleExportIcs}
                className="min-h-[42px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.exportIcs}</span>
              </button>

              <button
                type="button"
                onClick={handlePickAndImportIcs}
                className="min-h-[42px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold cursor-pointer transition-all border border-neutral-200 dark:border-neutral-700"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.importIcs}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onResetSampleEvents();
                  showNotice(t.clearAll, 'success', 2500);
                }}
                className="min-h-[42px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.clearAll}</span>
              </button>
            </div>
          </div>

          {/* Batch Data Cleanup */}
          <div className={`${cardSurfaceClass} p-3.5 sm:p-4 space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <h3 className="text-[13px] font-extrabold text-neutral-900 dark:text-neutral-100">
                  {ui.batchCleanupTitle}
                </h3>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-neutral-500">
                {ui.batchCleanupMatched
                  .replace('{count}', String(cleanupCandidates.length))
                  .replace('{kb}', String(estimatedCleanupKb))}
              </span>
            </div>

            {/* Time Range Options (Even multi-viewport frosted bar) */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 p-1 rounded-2xl sm:rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full">
              {(
                [
                  { id: '1y', label: ui.cleanupRange1y },
                  { id: '6m', label: ui.cleanupRange6m },
                  { id: '3m', label: ui.cleanupRange3m },
                  { id: 'all', label: ui.cleanupRangeAll },
                  { id: 'custom', label: ui.cleanupRangeCustom },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setCleanupRange(opt.id);
                    setSelectedCleanupIds(new Set());
                  }}
                  className={`px-2 py-1 rounded-full text-[11px] text-center truncate transition-all cursor-pointer ${
                    cleanupRange === opt.id
                      ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {cleanupRange === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <input
                  type="date"
                  value={cleanupStartDate}
                  onChange={(e) => {
                    setCleanupStartDate(e.target.value);
                    setSelectedCleanupIds(new Set());
                  }}
                  className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-neutral-800 dark:text-neutral-100"
                  aria-label={ui.cleanupStartDateAria}
                />
                <input
                  type="date"
                  value={cleanupEndDate}
                  onChange={(e) => {
                    setCleanupEndDate(e.target.value);
                    setSelectedCleanupIds(new Set());
                  }}
                  className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-neutral-800 dark:text-neutral-100"
                  aria-label={ui.cleanupEndDateAria}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={cleanupCategoryId}
                  onChange={(e) => {
                    setCleanupCategoryId(e.target.value);
                    setSelectedCleanupIds(new Set());
                  }}
                  className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-100"
                  aria-label={ui.cleanupCategoryAria}
                >
                  <option value="all">{ui.cleanupAllCategories}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {getCategoryDisplayName(cat, settings.language)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setCleanupOnlyCompleted((prev) => !prev);
                    setSelectedCleanupIds(new Set());
                  }}
                  className={`min-h-[36px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    cleanupOnlyCompleted
                      ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {cleanupOnlyCompleted ? (
                    <CheckSquare className="w-3.5 h-3.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  <span>{ui.cleanupCompletedOnly}</span>
                </button>
              </div>

              {cleanupCandidates.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAllCleanup}
                  className="min-h-[34px] px-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {selectedCleanupIds.size === cleanupCandidates.length
                    ? ui.cleanupDeselectAll
                    : ui.cleanupSelectAll}
                </button>
              )}
            </div>

            {cleanupCandidates.length === 0 ? (
              <div className="py-3.5 text-center text-xs text-neutral-400 rounded-xl bg-neutral-100/60 dark:bg-neutral-800/40">
                {ui.cleanupNoMatch}
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto space-y-1.5 pe-1">
                {cleanupCandidates.map((evt) => {
                  const checked = selectedCleanupIds.has(evt.id);
                  const cat = categories.find((c) => c.id === evt.categoryId);
                  return (
                    <button
                      key={`clean_${evt.id}`}
                      type="button"
                      onClick={() => handleToggleCleanupId(evt.id)}
                      className={`w-full min-h-[42px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-start transition-colors cursor-pointer ${
                        checked
                          ? 'bg-rose-500/10 border-rose-500/30 text-neutral-900 dark:text-neutral-100'
                          : 'bg-neutral-50/90 dark:bg-neutral-800/60 border-neutral-200/70 dark:border-neutral-700/60 text-neutral-700 dark:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {checked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        )}
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat?.color || '#64748B' }}
                        />
                        <span className="text-xs font-semibold truncate">{evt.title}</span>
                      </div>
                      <span className="text-[10px] font-mono tabular-nums text-neutral-400 shrink-0">
                        {evt.startDate}
                        {evt.isCompleted ? ui.cleanupDoneTag : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                type="button"
                disabled={cleanupCandidates.length === 0}
                onClick={handleExecuteBatchCleanup}
                className="min-h-[40px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {selectedCleanupIds.size > 0
                    ? ui.cleanupDeleteSelected.replace('{count}', String(selectedCleanupIds.size))
                    : ui.cleanupDeleteAllMatched.replace(
                        '{count}',
                        String(cleanupCandidates.length)
                      )}
                </span>
              </button>
            </div>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="px-3.5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="font-bold">{t.privacyOpenStandardTitle}</div>
              <p className="text-[11px] opacity-90 mt-0.5">{t.privacyNoTrackingDesc}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const DrillChevron = isRtl ? ChevronLeft : ChevronRight;
  const BackChevron = isRtl ? ChevronRight : ChevronLeft;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex-1 flex flex-col h-full overflow-y-auto select-none px-3 sm:px-5 lg:px-8 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-[max(1rem,env(safe-area-inset-top))] pb-28 md:pb-32 max-w-7xl mx-auto w-full space-y-3 bg-[#F2F2F7] dark:bg-neutral-950 [.amoled-mode_&]:bg-black"
    >
      {/* 30-Day Unbacked-Up Gentle Reminder Banner */}
      {backupReminderInfo.shouldRemind && !dismissedBackupBanner && (
        <div className="px-3.5 py-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 backdrop-blur-xl border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-medium leading-snug">
              {backupReminderInfo.neverBackedUp
                ? ui.backupReminderNever
                : ui.backupReminderBannerTitle.replace(
                    '{days}',
                    String(Math.max(30, backupReminderInfo.daysElapsed))
                  )}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportData}
              className="min-h-[34px] px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
            >
              {ui.backupReminderAction}
            </button>
            <button
              type="button"
              onClick={() => setDismissedBackupBanner(true)}
              className="min-h-[34px] px-2 text-[11px] text-amber-700/75 dark:text-amber-300/75 hover:underline cursor-pointer"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Action Feedback Banner */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold animate-fade-in flex items-center gap-2 border ${
            notice.tone === 'warning'
              ? 'bg-amber-500/12 border-amber-500/30 text-amber-800 dark:text-amber-200'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {notice.tone === 'warning' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <Check className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* ==================== MOBILE (< md / < 768px): Native iOS Inset-Grouped Master / Drill-Down ==================== */}
      <div className="md:hidden space-y-3">
        {mobilePanel === 'home' ? (
          <div className="space-y-3 animate-fade-in">
            {/* Compact Top Action Bar */}
            <div className="flex items-center justify-between gap-2 px-0.5">
              <div className="flex items-center gap-2 min-w-0">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-10 h-10 rounded-xl bg-white/85 dark:bg-white/[0.08] border border-white/80 dark:border-white/12 flex items-center justify-center text-neutral-700 dark:text-neutral-200 shrink-0 active:scale-95 transition-transform cursor-pointer"
                    aria-label={t.backButton}
                  >
                    <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                  </button>
                )}
                <h1 className="text-lg font-black text-neutral-900 dark:text-neutral-50 tracking-tight truncate">
                  {t.settingsTitle}
                </h1>
              </div>

              {onRefreshAll && !settings.offlineMode && (
                <button
                  type="button"
                  onClick={onRefreshAll}
                  disabled={isRefreshingAll}
                  title={ui.refreshLabel}
                  aria-label={ui.refreshLabel}
                  className="w-10 h-10 rounded-xl bg-white/85 dark:bg-white/[0.08] border border-white/80 dark:border-white/12 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingAll ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            {/* Primary Settings Group 1: General, Appearance, Language */}
            <div className={`${cardSurfaceClass} overflow-hidden divide-y divide-neutral-100 dark:divide-white/8`}>
              {sections.slice(0, 3).map((sec) => {
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => openMobileSection(sec.id)}
                    className="w-full px-3.5 py-3 min-h-[54px] flex items-center justify-between gap-3 text-start hover:bg-neutral-50/70 dark:hover:bg-white/[0.04] active:bg-neutral-100/80 dark:active:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${sec.iconBgClass}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[13.5px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {sec.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {sec.id === 'appearance' && (
                        <span
                          className="w-3 h-3 rounded-full border border-white/60 dark:border-black/40 shrink-0"
                          style={{ backgroundColor: settings.accentColor }}
                        />
                      )}
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate max-w-[120px]">
                        {sec.summary}
                      </span>
                      <DrillChevron className="w-4 h-4 text-neutral-300 dark:text-neutral-600 shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Primary Settings Group 2: Categories & Backup */}
            <div className={`${cardSurfaceClass} overflow-hidden divide-y divide-neutral-100 dark:divide-white/8`}>
              {sections.slice(3).map((sec) => {
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => openMobileSection(sec.id)}
                    className="w-full px-3.5 py-3 min-h-[54px] flex items-center justify-between gap-3 text-start hover:bg-neutral-50/70 dark:hover:bg-white/[0.04] active:bg-neutral-100/80 dark:active:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${sec.iconBgClass}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[13.5px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {sec.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-mono tabular-nums text-neutral-400 dark:text-neutral-500">
                        {sec.summary}
                      </span>
                      <DrillChevron className="w-4 h-4 text-neutral-300 dark:text-neutral-600 shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {/* Mobile Sub-view Sticky Back Header (Safe-Area Aware) */}
            <div className="sticky top-[env(safe-area-inset-top)] z-20 -mx-3 px-3 py-2 bg-[#F2F2F7]/92 dark:bg-neutral-950/92 [.amoled-mode_&]:bg-black/92 backdrop-blur-xl flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={closeMobileSection}
                className="min-h-[40px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/85 dark:bg-white/[0.08] border border-white/80 dark:border-white/12 text-xs font-bold text-neutral-800 dark:text-neutral-100 active:scale-95 transition-transform cursor-pointer shrink-0"
              >
                <BackChevron className="w-4 h-4" />
                <span>{t.settingsTitle}</span>
              </button>

              <span className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100 truncate">
                {activeSectionMeta.label}
              </span>

              <div className="w-10 shrink-0 flex justify-end">
                {onRefreshAll && !settings.offlineMode && (
                  <button
                    type="button"
                    onClick={onRefreshAll}
                    disabled={isRefreshingAll}
                    aria-label={ui.refreshLabel}
                    className="w-10 h-10 rounded-xl bg-white/85 dark:bg-white/[0.08] border border-white/80 dark:border-white/12 text-emerald-700 dark:text-emerald-300 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {renderActiveSectionContent()}
          </div>
        )}
      </div>

      {/* ==================== TABLET & DESKTOP (>= md / >= 768px): Split-Pane Master-Detail ==================== */}
      <div className="hidden md:block space-y-3.5">
        {/* Tablet & Desktop Top Header */}
        <div className="flex items-center justify-between gap-3 px-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-9 h-9 rounded-xl bg-white/88 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/12 flex items-center justify-center text-neutral-700 dark:text-neutral-200 shrink-0 active:scale-95 transition-transform cursor-pointer"
                aria-label={t.backButton}
              >
                <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            )}
            <h1 className="text-lg lg:text-xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight truncate">
              {t.settingsTitle}
            </h1>
            <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 truncate">
              / {activeSectionMeta.label}
            </span>
          </div>

          {onRefreshAll && !settings.offlineMode && (
            <button
              type="button"
              onClick={onRefreshAll}
              disabled={isRefreshingAll}
              className="h-9 px-3 rounded-xl bg-white/88 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/12 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5 text-xs font-bold shrink-0 active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">{ui.refreshLabel}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-12 gap-4 lg:gap-5 items-start">
          {/* Sticky Master Sidebar */}
          <div className="col-span-4 xl:col-span-3 space-y-3 sticky top-3">
            <div className={`${cardSurfaceClass} overflow-hidden divide-y divide-neutral-100 dark:divide-white/8`}>
              {sections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection', hapticsEnabled);
                      setActiveSection(sec.id);
                    }}
                    className={`w-full px-3.5 py-2.5 min-h-[52px] flex items-center justify-between gap-2.5 text-start transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50/80 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-white/15 dark:bg-neutral-900/12 text-current'
                            : sec.iconBgClass
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[13px] font-bold truncate">{sec.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {sec.id === 'appearance' && (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/50 dark:border-black/30 shrink-0"
                          style={{ backgroundColor: settings.accentColor }}
                        />
                      )}
                      <span
                        className={`text-[11px] font-mono tabular-nums truncate max-w-[90px] ${
                          isActive
                            ? 'text-white/75 dark:text-neutral-600'
                            : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                      >
                        {sec.summary}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail Content Pane */}
          <div className="col-span-8 xl:col-span-9 min-w-0">
            {renderActiveSectionContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
