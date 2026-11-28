import React, { useState, useEffect } from 'react';
import { AppSettings, EventCategory, Language, ThemeMode, WorldClockMode } from '../types/calendar';
import { getTranslation, getExtraLabels, isRtlLanguage } from '../utils/i18n';
import {
  ACCENT_PALETTES,
  exportDatabaseBackup,
  importDatabaseBackup,
  getCategoryDisplayName,
} from '../utils/storage';
import { fetchChineseHolidaysOnline } from '../utils/holidayCn';
import { triggerHaptic } from '../utils/haptics';
import {
  saveFileToDevice,
  saveFileToChosenDirectory,
  pickFileFromDevice,
} from '../utils/fileTransfer';
import {
  getSystemNotificationPermission,
  requestSystemNotificationPermission,
  sendTestSystemNotification,
  getSystemNotifUi,
  SystemNotificationPermission,
} from '../utils/systemNotifications';
import {
  X,
  Palette,
  Globe,
  Sliders,
  FolderSync,
  Tag,
  Check,
  RefreshCw,
  Trash2,
  Bell,
  Download,
  FolderDown,
  Upload,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  categories: EventCategory[];
  onUpdateCategories: (categories: EventCategory[]) => void;
  onResetSampleEvents: () => void;
  currentYear?: number;
}

type SettingsSection = 'preferences' | 'appearance' | 'language' | 'backup' | 'categories';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  categories,
  onUpdateCategories,
  onResetSampleEvents,
  currentYear,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);
  const isRtl = isRtlLanguage(settings.language);
  const [activeSection, setActiveSection] = useState<SettingsSection>('preferences');
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#2563EB');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isSyncingHolidays, setIsSyncingHolidays] = useState(false);
  const [sysPerm, setSysPerm] = useState<SystemNotificationPermission>('default');

  useEffect(() => {
    if (!isOpen) return;
    getSystemNotificationPermission().then(setSysPerm).catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const sysUi = getSystemNotifUi(settings.language);
  const folderExportLabel =
    settings.language === 'zh-CN'
      ? '选择文件夹导出'
      : settings.language === 'zh-TW'
      ? '選擇資料夾匯出'
      : 'Save to Folder';

  const handleExportJson = async () => {
    const jsonStr = exportDatabaseBackup();
    const filename = `calendar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const res = await saveFileToDevice(filename, jsonStr, 'application/json;charset=utf-8');
    if (res.ok) {
      setImportMessage(
        res.pathHint ? `${ui.backupSavedMsg} (${res.pathHint})` : ui.backupSavedMsg
      );
    } else if (res.error !== 'cancelled') {
      setImportMessage(res.error || 'Export Failed');
    }
  };

  const handleExportToFolder = async () => {
    const jsonStr = exportDatabaseBackup();
    const filename = `calendar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const res = await saveFileToChosenDirectory(filename, jsonStr, 'application/json;charset=utf-8');
    if (res.ok) {
      setImportMessage(
        res.pathHint ? `${ui.backupSavedMsg} (${res.pathHint})` : ui.backupSavedMsg
      );
    } else if (res.error !== 'cancelled') {
      setImportMessage(res.error || 'Export Failed');
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
      const res = importDatabaseBackup(content);
      if (res.success) {
        setImportMessage(`${t.restoreJson} (${res.eventCount})`);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setImportMessage(res.error || ui.backupInvalidMsg);
      }
    } catch {
      setImportMessage(ui.backupInvalidMsg);
    }
  };

  const handleRequestSysPerm = async () => {
    const nextPerm = await requestSystemNotificationPermission();
    setSysPerm(nextPerm);
    if (nextPerm === 'granted') {
      onUpdateSettings({ ...settings, enableSystemNotifications: true });
      setImportMessage(sysUi.statusGranted);
    } else {
      setImportMessage(sysUi.testNeedPerm);
    }
  };

  const handleTestSysNotif = async () => {
    const res = await sendTestSystemNotification(settings.language);
    const refreshed = await getSystemNotificationPermission();
    setSysPerm(refreshed);
    setImportMessage(res === 'sent' ? sysUi.testSentOk : sysUi.testNeedPerm);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    onUpdateCategories([
      ...categories,
      { id: 'cat-' + Date.now(), name: newCatName.trim(), color: newCatColor },
    ]);
    setNewCatName('');
  };

  const handleDeleteCategory = (id: string) => {
    onUpdateCategories(categories.filter((c) => c.id !== id));
  };

  const handleSyncHolidays = async () => {
    setIsSyncingHolidays(true);
    try {
      const y = currentYear || new Date().getFullYear();
      await fetchChineseHolidaysOnline(y);
      setImportMessage(t.holidaySyncSuccess);
    } catch {
      setImportMessage('Sync Failed');
    } finally {
      setIsSyncingHolidays(false);
    }
  };

  const sectionsList: { id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'preferences', label: t.settingsTabPreferences, icon: Sliders },
    { id: 'appearance', label: t.settingsTabAppearance, icon: Palette },
    { id: 'language', label: t.settingsTabLanguage, icon: Globe },
    { id: 'backup', label: t.settingsTabBackup, icon: FolderSync },
    { id: 'categories', label: t.settingsTabCategories, icon: Tag },
  ];

  const languagesList: { id: Language; label: string; nativeName: string; note?: string }[] = [
    { id: 'zh-CN', label: '简体中文', nativeName: '简体中文' },
    { id: 'zh-TW', label: '繁體中文', nativeName: '繁體中文', note: '港澳台地區標準' },
    { id: 'en', label: 'English', nativeName: 'English' },
    { id: 'ja', label: '日本語', nativeName: '日本語' },
    { id: 'ko', label: '한국어', nativeName: '한국어' },
    { id: 'fr', label: 'Français', nativeName: 'Français' },
    { id: 'fa', label: 'فارسی', nativeName: 'فارسی' },
    { id: 'mn', label: 'Монгол хэл', nativeName: 'Монгол' },
    { id: 'ru', label: 'Русский', nativeName: 'Русский' },
    { id: 'ug', label: 'ئۇيغۇرچە', nativeName: 'ئۇيغۇر تىلى' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 bg-black/60 backdrop-blur-md select-none animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="w-full max-w-2xl max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:max-h-[calc(90dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-modal-sheet"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-950/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ backgroundColor: settings.accentColor }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
              {t.settingsTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
            aria-label={t.backButton}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls (Market-unified rounded-full frosted even grid bar) */}
        <div className="px-4 sm:px-6 py-2 bg-neutral-50/70 dark:bg-neutral-950/40 border-b border-neutral-200/60 dark:border-neutral-800">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 p-1 rounded-2xl sm:rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10">
            {sectionsList.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-full text-xs transition-all cursor-pointer min-w-0 ${
                    isActive
                      ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{sec.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {importMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300">
              {importMessage}
            </div>
          )}

          {/* Section 1: Preferences */}
          {activeSection === 'preferences' && (
            <div className="space-y-4">
              {/* Start Week On */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800">
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {t.firstDayLabel}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {t.firstDayDesc}
                  </div>
                </div>
                <div className="flex p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, firstDayOfWeek: 0 })}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      settings.firstDayOfWeek === 0 ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm' : 'text-neutral-600 dark:text-neutral-400 font-semibold'
                    }`}
                  >
                    {ui.sundayShort}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, firstDayOfWeek: 1 })}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      settings.firstDayOfWeek === 1 ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm' : 'text-neutral-600 dark:text-neutral-400 font-semibold'
                    }`}
                  >
                    {ui.mondayShort}
                  </button>
                </div>
              </div>

              {/* Time Format */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800">
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {t.timeFormatLabel}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {t.timeFormatDesc}
                  </div>
                </div>
                <div className="flex p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, use24HourFormat: false })}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      !settings.use24HourFormat ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm' : 'text-neutral-600 dark:text-neutral-400 font-semibold'
                    }`}
                  >
                    12h
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, use24HourFormat: true })}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      settings.use24HourFormat ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm' : 'text-neutral-600 dark:text-neutral-400 font-semibold'
                    }`}
                  >
                    24h
                  </button>
                </div>
              </div>

              {/* ISO 8601 Week Numbers Toggle */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800">
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {ui.weekNumbersTitle}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {ui.weekNumbersDesc}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showWeekNumbers !== false}
                  onClick={() => {
                    triggerHaptic('selection', settings.enableHaptics !== false);
                    onUpdateSettings({ ...settings, showWeekNumbers: !(settings.showWeekNumbers !== false) });
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    settings.showWeekNumbers !== false ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all ${
                      settings.showWeekNumbers !== false ? 'start-5.5' : 'start-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* System Native Notifications */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Bell className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {sysUi.toggleTitle}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {sysUi.toggleDesc}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.enableSystemNotifications !== false}
                    onClick={async () => {
                      const nextEnabled = !(settings.enableSystemNotifications !== false);
                      if (nextEnabled && sysPerm === 'default') {
                        const grantedPerm = await requestSystemNotificationPermission();
                        setSysPerm(grantedPerm);
                      }
                      onUpdateSettings({ ...settings, enableSystemNotifications: nextEnabled });
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                      settings.enableSystemNotifications !== false ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all ${
                        settings.enableSystemNotifications !== false ? 'start-5.5' : 'start-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
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
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer"
                      >
                        {sysUi.requestBtn}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleTestSysNotif}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-800 dark:text-neutral-100 text-[11px] font-semibold cursor-pointer"
                    >
                      {sysUi.testBtn}
                    </button>
                  </div>
                </div>
              </div>

              {/* Haptic Feedback Toggle */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800">
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {ui.hapticsTitle}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {ui.hapticsDesc}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.enableHaptics !== false}
                  onClick={() => {
                    const nextVal = !(settings.enableHaptics !== false);
                    if (nextVal) triggerHaptic('selection', true);
                    onUpdateSettings({ ...settings, enableHaptics: nextVal });
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    settings.enableHaptics !== false ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all ${
                      settings.enableHaptics !== false ? 'start-5.5' : 'start-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* World Clock Mode Selector */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {ui.worldClockStylesTitle}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-bold">
                  {[
                    { id: 'flip', label: t.clockModeFlip || 'Flip' },
                    { id: 'analog', label: t.clockModeAnalog || 'Analog' },
                    { id: 'capsule', label: t.clockModeCapsule || 'Capsule' },
                    { id: 'glass', label: t.clockModeGlass || 'Glass' },
                    { id: 'hud', label: t.clockModeHud || 'HUD' },
                    { id: 'minimal', label: t.clockModeMinimal || 'Minimal' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, worldClockMode: m.id as WorldClockMode })}
                      className={`p-2 rounded-xl transition-all border ${
                        (settings.worldClockMode || 'flip') === m.id
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 shadow-xs'
                          : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Statutory Holidays Sync */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {t.holidayCnLabel}
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncHolidays}
                    disabled={isSyncingHolidays}
                    title={t.holidaySyncNow}
                    aria-label={t.holidaySyncNow}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-700 dark:text-neutral-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingHolidays ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500">{t.holidayCnDesc}</p>
              </div>
            </div>
          )}

          {/* Section 2: Appearance */}
          {activeSection === 'appearance' && (
            <div className="space-y-4">
              {/* Theme Mode */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  {t.themeLabel}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'system', label: t.themeSystem },
                      { id: 'light', label: t.themeLight },
                      { id: 'dark', label: t.themeDark },
                      { id: 'amoled', label: t.themeAmoled },
                    ] as { id: ThemeMode; label: string }[]
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, themeMode: item.id })}
                      className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                        settings.themeMode === item.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/30'
                          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Palette */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  {t.accentColorLabel}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {ACCENT_PALETTES.map((p) => {
                    const isSelected = settings.accentColor === p.color;
                    return (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() => onUpdateSettings({ ...settings, accentColor: p.color })}
                        className="h-10 rounded-2xl flex items-center justify-center text-white transition-transform active:scale-90 shadow-2xs"
                        style={{ backgroundColor: p.color }}
                        title={p.name}
                      >
                        {isSelected && <Check className="w-5 h-5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Language */}
          {activeSection === 'language' && (
            <div className="space-y-3">
              <div className="text-xs text-neutral-500 mb-2">
                {ui.languageAutoNote}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {languagesList.map((lang) => {
                  const isSel = settings.language === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, language: lang.id })}
                      className={`p-3.5 rounded-2xl border text-start flex items-center justify-between transition-all ${
                        isSel
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{lang.label}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5 font-mono">{lang.nativeName}</div>
                      </div>
                      {lang.note && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                          {lang.note}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4: Backup */}
          {activeSection === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {t.backupSectionLabel}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.downloadJson}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportToFolder}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                  >
                    <FolderDown className="w-3.5 h-3.5" />
                    <span>{folderExportLabel}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePickAndImportJson}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer hover:bg-neutral-300 dark:hover:bg-neutral-600"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t.restoreJson}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetSampleEvents();
                      setImportMessage(t.clearAll);
                    }}
                    className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer"
                  >
                    {t.clearAll}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Categories */}
          {activeSection === 'categories' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder={t.newCategoryPlaceholder}
                  className="flex-1 p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-10 h-10 rounded-2xl border-none cursor-pointer p-1 bg-neutral-100 dark:bg-neutral-800"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-bold"
                >
                  {t.add}
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {getCategoryDisplayName(cat, settings.language)}
                      </span>
                    </div>
                    {!cat.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-neutral-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
