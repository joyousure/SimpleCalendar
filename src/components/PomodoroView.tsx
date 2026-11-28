import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AmbientSoundType,
  AppSettings,
  CalendarEvent,
  EventCategory,
} from '../types/calendar';
import { getLocaleCode, isRtlLanguage } from '../utils/i18n';
import { getPomodoroWorldBarI18n } from '../utils/fabModalI18n';
import { getTodoFocusLabels } from '../utils/todoFocusI18n';
import { getCategoryDisplayName } from '../utils/storage';
import { toDateString } from '../utils/dateUtils';
import { ambientAudio } from '../utils/ambientAudio';
import { triggerHaptic } from '../utils/haptics';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';
import { dispatchSystemNotification, getSystemNotifUi } from '../utils/systemNotifications';
import {
  computeFocusAnalytics,
  clearFocusSessions,
  deleteFocusSession,
  ExtendedFocusSession,
  FOCUS_UPDATED_EVENT,
  FocusPreferences,
  loadFocusPrefs,
  loadFocusSessions,
  recordFocusSession,
  saveFocusPrefs,
} from '../utils/focusStorage';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  CheckCircle2,
  Circle,
  ListTodo,
  Maximize2,
  Minimize2,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Search,
  Check,
  Trash2,
  Clock,
  Coffee,
  Bell,
} from 'lucide-react';

interface PomodoroViewProps {
  events: CalendarEvent[];
  categories?: EventCategory[];
  settings: AppSettings;
  activeTaskId?: string;
  onSelectTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onToggleSubtask?: (eventId: string, itemId: string) => void;
  onAddPomodoroToTask?: (taskId: string, durationMinutes: number) => void;
  onNavigateToAgenda?: () => void;
}

type TimerPhase = 'work' | 'short_break' | 'long_break';

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  events,
  categories = [],
  settings,
  activeTaskId,
  onSelectTask,
  onCompleteTask,
  onToggleSubtask,
  onAddPomodoroToTask,
}) => {
  const pw = getPomodoroWorldBarI18n(settings.language);
  const tf = getTodoFocusLabels(settings.language);
  const isRtl = isRtlLanguage(settings.language);
  const localeCode = getLocaleCode(settings.language);
  const hapticsEnabled = settings.enableHaptics !== false;

  const [prefs, setPrefs] = useState<FocusPreferences>(() => loadFocusPrefs());
  const [sessions, setSessions] = useState<ExtendedFocusSession[]>(() => loadFocusSessions());

  const [phase, setPhase] = useState<TimerPhase>('work');
  const [timeLeft, setTimeLeft] = useState<number>(() => loadFocusPrefs().workDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [roundInCycle, setRoundInCycle] = useState<number>(1);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(activeTaskId || '');
  const [freeIntention, setFreeIntention] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [strictConfirmAction, setStrictConfirmAction] = useState<null | 'reset' | 'skip' | 'stop'>(null);

  // Task queue UI state
  const [queueFilter, setQueueFilter] = useState<'today' | 'all'>('today');
  const [taskSearch, setTaskSearch] = useState<string>('');
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);

  // Sync external focus storage updates (e.g. from AgendaView compact PomodoroTimer)
  useEffect(() => {
    const syncFromStorage = () => {
      setSessions(loadFocusSessions());
    };
    window.addEventListener(FOCUS_UPDATED_EVENT, syncFromStorage);
    return () => window.removeEventListener(FOCUS_UPDATED_EVENT, syncFromStorage);
  }, []);

  // Save prefs when updated
  const updatePrefs = useCallback((patch: Partial<FocusPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveFocusPrefs(next);
      return next;
    });
  }, []);

  // Sync external activeTaskId
  useEffect(() => {
    if (activeTaskId !== undefined) {
      setSelectedTaskId(activeTaskId);
    }
  }, [activeTaskId]);

  // System Back / Escape exits fullscreen mode
  useSystemBackLayer(
    isFullScreen,
    () => setIsFullScreen(false),
    BACK_PRIORITY.SUB_VIEW,
    'pomodoro-fullscreen'
  );

  const phaseTotalSeconds = useMemo(() => {
    if (phase === 'work') return prefs.workDuration * 60;
    if (phase === 'short_break') return prefs.shortBreakDuration * 60;
    return prefs.longBreakDuration * 60;
  }, [phase, prefs.workDuration, prefs.shortBreakDuration, prefs.longBreakDuration]);

  // Keep idle countdown synchronized when user adjusts durations while not running & unstarted
  const handleDurationChange = (field: 'workDuration' | 'shortBreakDuration' | 'longBreakDuration', minutes: number) => {
    const clamped =
      field === 'workDuration'
        ? Math.min(120, Math.max(5, minutes))
        : field === 'shortBreakDuration'
        ? Math.min(30, Math.max(1, minutes))
        : Math.min(60, Math.max(5, minutes));
    updatePrefs({ [field]: clamped });
    if (!isRunning) {
      if (
        (field === 'workDuration' && phase === 'work') ||
        (field === 'shortBreakDuration' && phase === 'short_break') ||
        (field === 'longBreakDuration' && phase === 'long_break')
      ) {
        setTimeLeft(clamped * 60);
      }
    }
  };

  // Ambient Audio lifecycle
  useEffect(() => {
    if (prefs.ambientSound !== 'none') {
      ambientAudio.setSound(prefs.ambientSound, prefs.ambientVolume);
    } else {
      ambientAudio.stop();
    }
  }, [prefs.ambientSound, prefs.ambientVolume]);

  useEffect(() => {
    return () => {
      ambientAudio.stop();
    };
  }, []);

  // Category map for display
  const categoryMap = useMemo(() => {
    const m = new Map<string, EventCategory>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const todayStr = toDateString(new Date());

  const activeTask = useMemo(
    () => events.find((e) => e.id === selectedTaskId && !e.isInTrash),
    [events, selectedTaskId]
  );

  const pendingTasks = useMemo(() => {
    const open = events.filter(
      (e) =>
        !e.isCompleted &&
        !e.isInTrash &&
        !e.isWontDo &&
        e.kind !== 'note' &&
        !e.id.startsWith('evt-acc-') &&
        e.categoryId !== 'cat-expense' &&
        e.categoryId !== 'cat-income'
    );
    const filteredByTab =
      queueFilter === 'today'
        ? open.filter((e) => e.startDate && e.startDate <= todayStr)
        : open;
    const q = taskSearch.trim().toLowerCase();
    const list = q
      ? filteredByTab.filter((e) => e.title.toLowerCase().includes(q))
      : filteredByTab;
    return list.sort((a, b) => {
      const pOrder = { high: 3, medium: 2, low: 1, none: 0 };
      const pa = pOrder[a.priority || 'none'];
      const pb = pOrder[b.priority || 'none'];
      if (pb !== pa) return pb - pa;
      return (a.startDate || '9999').localeCompare(b.startDate || '9999');
    });
  }, [events, queueFilter, taskSearch, todayStr]);

  // Timer tick loop
  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  const completeCountdownRound = useCallback(
    (overrideMinutes?: number) => {
      setIsRunning(false);
      setStrictConfirmAction(null);
      if (prefs.soundAlerts) {
        ambientAudio.playGong();
      }
      triggerHaptic('success', hapticsEnabled);

      const durationMinutes =
        overrideMinutes ??
        Math.max(
          1,
          Math.round(
            (phase === 'work'
              ? prefs.workDuration
              : phase === 'short_break'
              ? prefs.shortBreakDuration
              : prefs.longBreakDuration)
          )
        );

      const sessionTitle = activeTask?.title || freeIntention.trim() || undefined;
      const updated = recordFocusSession({
        taskId: activeTask?.id,
        taskTitle: sessionTitle,
        durationMinutes,
        mode: phase,
        kind: 'pomodoro',
      });
      setSessions(updated);

      if (settings.enableSystemNotifications !== false) {
        const sysUi = getSystemNotifUi(settings.language);
        const notifTitle =
          phase === 'work' ? sysUi.focusWorkDoneTitle : sysUi.focusBreakDoneTitle;
        const notifBody =
          phase === 'work'
            ? sysUi.focusWorkDoneBody.replace('{mins}', String(durationMinutes))
            : sysUi.focusBreakDoneBody;
        void dispatchSystemNotification({
          title: sessionTitle ? `${notifTitle} · ${sessionTitle}` : notifTitle,
          body: notifBody,
          tag: `focus-round-${phase}`,
          silent: !prefs.soundAlerts,
          vibrate: hapticsEnabled,
        });
      }

      if (phase === 'work') {
        if (activeTask && onAddPomodoroToTask) {
          onAddPomodoroToTask(activeTask.id, durationMinutes);
        }
        const isLongBreakNext = roundInCycle >= prefs.longBreakInterval;
        const nextPhase: TimerPhase = isLongBreakNext ? 'long_break' : 'short_break';
        const nextDurationSec =
          (isLongBreakNext ? prefs.longBreakDuration : prefs.shortBreakDuration) * 60;
        setRoundInCycle((prev) => (isLongBreakNext ? 1 : prev + 1));
        setPhase(nextPhase);
        setTimeLeft(nextDurationSec);
        if (prefs.autoStartBreaks) {
          setIsRunning(true);
        }
      } else {
        setPhase('work');
        setTimeLeft(prefs.workDuration * 60);
        if (prefs.autoStartPomodoros) {
          setIsRunning(true);
        }
      }
    },
    [
      phase,
      prefs,
      activeTask,
      freeIntention,
      onAddPomodoroToTask,
      roundInCycle,
      hapticsEnabled,
      settings.enableSystemNotifications,
      settings.language,
    ]
  );

  // Trigger completion when countdown reaches 0
  useEffect(() => {
    if (!isRunning || timeLeft > 0) return;
    completeCountdownRound();
  }, [isRunning, timeLeft, completeCountdownRound]);

  const handleTogglePlay = useCallback(() => {
    triggerHaptic('selection', hapticsEnabled);
    if (isRunning && prefs.strictMode && phase === 'work') {
      setStrictConfirmAction('stop');
      return;
    }
    setStrictConfirmAction(null);
    setIsRunning((prev) => !prev);
  }, [isRunning, prefs.strictMode, phase, hapticsEnabled]);

  const handleReset = useCallback(() => {
    if (isRunning && prefs.strictMode && phase === 'work') {
      setStrictConfirmAction('reset');
      return;
    }
    setStrictConfirmAction(null);
    setIsRunning(false);
    setTimeLeft(phaseTotalSeconds);
  }, [isRunning, prefs.strictMode, phase, phaseTotalSeconds]);

  const handleSkipOrFinishEarly = () => {
    if (isRunning && prefs.strictMode && phase === 'work') {
      setStrictConfirmAction('skip');
      return;
    }

    const elapsedSec = phaseTotalSeconds - timeLeft;
    if (phase === 'work' && elapsedSec >= 60) {
      completeCountdownRound(Math.max(1, Math.round(elapsedSec / 60)));
      return;
    }

    setIsRunning(false);
    setStrictConfirmAction(null);
    if (phase === 'work') {
      setPhase('short_break');
      setTimeLeft(prefs.shortBreakDuration * 60);
    } else {
      setPhase('work');
      setTimeLeft(prefs.workDuration * 60);
    }
  };

  const handleConfirmStrictAction = () => {
    const action = strictConfirmAction;
    setStrictConfirmAction(null);
    if (action === 'stop') {
      setIsRunning(false);
    } else if (action === 'reset') {
      setIsRunning(false);
      setTimeLeft(phaseTotalSeconds);
    } else if (action === 'skip') {
      setIsRunning(false);
      if (phase === 'work') {
        setPhase('short_break');
        setTimeLeft(prefs.shortBreakDuration * 60);
      } else {
        setPhase('work');
        setTimeLeft(prefs.workDuration * 60);
      }
    }
  };

  const handleSwitchPhase = (target: TimerPhase) => {
    if (isRunning && prefs.strictMode && phase === 'work') {
      return;
    }
    setIsRunning(false);
    setStrictConfirmAction(null);
    setPhase(target);
    const secs =
      target === 'work'
        ? prefs.workDuration * 60
        : target === 'short_break'
        ? prefs.shortBreakDuration * 60
        : prefs.longBreakDuration * 60;
    setTimeLeft(secs);
  };

  // Keyboard shortcuts (Space: start/pause, R: reset, F: fullscreen)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullScreen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTogglePlay, handleReset]);

  // Analytics computed from real localStorage sessions
  const analytics = useMemo(
    () => computeFocusAnalytics(sessions, prefs.dailyGoalMinutes, localeCode),
    [sessions, prefs.dailyGoalMinutes, localeCode]
  );

  // Time formatting
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Progress calculation
  const progressPercent = Math.max(
    0,
    Math.min(100, ((phaseTotalSeconds - timeLeft) / Math.max(1, phaseTotalSeconds)) * 100)
  );

  const estimatedEndTimeStr = useMemo(() => {
    const endDate = new Date(Date.now() + timeLeft * 1000);
    try {
      return new Intl.DateTimeFormat(localeCode, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !settings.use24HourFormat,
      }).format(endDate);
    } catch {
      return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    }
  }, [timeLeft, localeCode, settings.use24HourFormat]);

  const elapsedCountdownSec = phaseTotalSeconds - timeLeft;
  const canLogEarly = phase === 'work' && elapsedCountdownSec >= 60;

  const accentStrokeClass =
    phase === 'work'
      ? 'stroke-rose-600 dark:stroke-rose-500'
      : phase === 'short_break'
      ? 'stroke-teal-600 dark:stroke-teal-400'
      : 'stroke-blue-600 dark:stroke-blue-400';

  const primaryCtaClasses =
    phase === 'work'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : phase === 'short_break'
      ? 'bg-teal-600 hover:bg-teal-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white';

  const noiseOptions: { id: AmbientSoundType; label: string }[] = [
    { id: 'none', label: tf.ambientOff },
    { id: 'rain', label: pw.noiseNames.rain },
    { id: 'waves', label: pw.noiseNames.waves },
    { id: 'forest', label: pw.noiseNames.forest },
    { id: 'campfire', label: pw.noiseNames.campfire },
    { id: 'cafe', label: pw.noiseNames.cafe },
    { id: 'whitenoise', label: 'White' },
  ];

  const maxWeekMinutes = Math.max(
    prefs.dailyGoalMinutes,
    ...analytics.weekSeries.map((d) => d.minutes),
    30
  );

  // Fullscreen Zen View
  if (isFullScreen) {
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col justify-between px-6 py-[max(1.5rem,env(safe-area-inset-top))] select-none"
      >
        <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="font-semibold text-white">
              {phase === 'work'
                ? tf.modeFocus
                : phase === 'short_break'
                ? tf.modeShortBreak
                : tf.modeLongBreak}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {tf.roundLabel
                .replace('{cur}', String(roundInCycle))
                .replace('{total}', String(prefs.longBreakInterval))}
            </span>
            {prefs.strictMode && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-rose-400 font-semibold">{tf.strictModeOn}</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsFullScreen(false)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title={pw.exitFullscreenTitle}
            aria-label={pw.exitFullscreenTitle}
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center text-center my-auto">
          <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                className="stroke-neutral-800"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                className={`transition-all duration-500 ease-linear ${accentStrokeClass}`}
                strokeWidth="4.5"
                strokeDasharray={326.73}
                strokeDashoffset={326.73 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
              <span className="text-6xl sm:text-7xl font-bold font-mono tabular-nums tracking-tight text-white">
                {timeDisplay}
              </span>
              <div className="mt-3 text-sm font-medium text-neutral-300 max-w-[230px] truncate">
                {activeTask ? activeTask.title : freeIntention.trim() || pw.keepDeepFocus}
              </div>
              <div className="mt-1 text-xs text-neutral-500 font-mono tabular-nums">
                {tf.estFinishAt.replace('{time}', estimatedEndTimeStr)}
              </div>
            </div>
          </div>

          {strictConfirmAction && (
            <div className="mt-4 px-4 py-2.5 rounded-xl bg-neutral-900 border border-rose-500/40 flex items-center gap-3 text-xs">
              <span className="text-neutral-200">{tf.strictConfirmStop}</span>
              <button
                type="button"
                onClick={handleConfirmStrictAction}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold cursor-pointer"
              >
                {tf.strictConfirmYes}
              </button>
              <button
                type="button"
                onClick={() => setStrictConfirmAction(null)}
                className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-300 font-semibold cursor-pointer"
              >
                {tf.strictConfirmNo}
              </button>
            </div>
          )}

          <div className="flex items-center gap-4 mt-8">
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors cursor-pointer"
              title={pw.resetTimerTitle}
              aria-label={pw.resetTimerTitle}
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              className={`min-h-[48px] px-10 rounded-xl font-bold text-base flex items-center gap-2 transition-transform active:scale-[0.98] cursor-pointer ${primaryCtaClasses}`}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              <span>
                {isRunning
                  ? pw.pause
                  : timeLeft < phaseTotalSeconds
                  ? pw.resume
                  : pw.startFocus}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSkipOrFinishEarly}
              className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors cursor-pointer"
              title={canLogEarly ? tf.finishAndLog : pw.skipRoundTitle}
              aria-label={canLogEarly ? tf.finishAndLog : pw.skipRoundTitle}
            >
              {canLogEarly ? <Check className="w-5 h-5 text-emerald-400" /> : <SkipForward className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto w-full pb-2">
          {noiseOptions.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => updatePrefs({ ambientSound: n.id })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                prefs.ambientSound === n.id
                  ? 'bg-white text-neutral-950 font-semibold'
                  : 'bg-white/10 text-neutral-300 hover:bg-white/15'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex-1 flex flex-col select-none px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-[max(1.25rem,env(safe-area-inset-top))] pb-32 max-w-6xl mx-auto w-full"
    >
      {/* Top Studio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 truncate">
            {tf.focusStudioTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => updatePrefs({ strictMode: !prefs.strictMode })}
            className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              prefs.strictMode
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white/85 dark:bg-white/[0.06] border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-white/20'
            }`}
          >
            {prefs.strictMode ? (
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{prefs.strictMode ? tf.strictModeOn : tf.strictModeOff}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsDrawer((prev) => !prev)}
            className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              showSettingsDrawer
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                : 'bg-white/85 dark:bg-white/[0.06] border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-white/20'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{tf.settingsTitle}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/85 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            title={pw.fullscreenFocusTitle}
            aria-label={pw.fullscreenFocusTitle}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Precision Focus Timer & Soundscape Mixer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 sm:p-7 rounded-3xl bg-white/90 dark:bg-neutral-900/90 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 shadow-sm">
            {/* Phase Switcher Row */}
            <div className="pb-4 border-b border-neutral-200/70 dark:border-white/10">
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200/60 dark:border-white/10">
                {(
                  [
                    { id: 'work' as TimerPhase, label: `${tf.modeFocus} ${prefs.workDuration}m`, icon: Clock },
                    { id: 'short_break' as TimerPhase, label: `${tf.modeShortBreak} ${prefs.shortBreakDuration}m`, icon: Coffee },
                    { id: 'long_break' as TimerPhase, label: `${tf.modeLongBreak} ${prefs.longBreakDuration}m`, icon: Coffee },
                  ] as const
                ).map((item) => {
                  const active = phase === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSwitchPhase(item.id)}
                      disabled={isRunning && prefs.strictMode}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap truncate transition-colors cursor-pointer disabled:opacity-50 ${
                        active
                          ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expandable Inline Settings Panel */}
            {showSettingsDrawer && (
              <div className="mt-4 p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/10 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    {tf.settingsTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => ambientAudio.playGong()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    <Bell className="w-3 h-3" />
                    <span>{tf.testChimeBtn}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                      {tf.workDurationLabel} ({tf.minutesUnit})
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={prefs.workDuration}
                      onChange={(e) => handleDurationChange('workDuration', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-xs font-mono tabular-nums text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                      {tf.shortBreakLabel} ({tf.minutesUnit})
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={prefs.shortBreakDuration}
                      onChange={(e) => handleDurationChange('shortBreakDuration', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-xs font-mono tabular-nums text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                      {tf.longBreakLabel} ({tf.minutesUnit})
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={prefs.longBreakDuration}
                      onChange={(e) => handleDurationChange('longBreakDuration', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-xs font-mono tabular-nums text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                      {tf.dailyGoalLabel} ({tf.minutesUnit})
                    </label>
                    <input
                      type="number"
                      min={15}
                      max={480}
                      step={15}
                      value={prefs.dailyGoalMinutes}
                      onChange={(e) =>
                        updatePrefs({ dailyGoalMinutes: Math.min(480, Math.max(15, Number(e.target.value) || 100)) })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-xs font-mono tabular-nums text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-neutral-700 dark:text-neutral-300">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.autoStartBreaks}
                      onChange={(e) => updatePrefs({ autoStartBreaks: e.target.checked })}
                      className="accent-rose-600 rounded"
                    />
                    <span>{tf.autoStartBreaksLabel}</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.autoStartPomodoros}
                      onChange={(e) => updatePrefs({ autoStartPomodoros: e.target.checked })}
                      className="accent-rose-600 rounded"
                    />
                    <span>{tf.autoStartFocusLabel}</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.soundAlerts}
                      onChange={(e) => updatePrefs({ soundAlerts: e.target.checked })}
                      className="accent-rose-600 rounded"
                    />
                    <span>{tf.soundChimeLabel}</span>
                  </label>
                </div>
              </div>
            )}

            {/* Central Precision Dial */}
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-60 h-60 sm:w-72 sm:h-72 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  {/* Subtle 24-tick outer dial markers */}
                  {Array.from({ length: 24 }).map((_, i) => {
                    const angle = (i * 15 * Math.PI) / 180;
                    const x1 = 60 + 56 * Math.cos(angle);
                    const y1 = 60 + 56 * Math.sin(angle);
                    const x2 = 60 + 53.5 * Math.cos(angle);
                    const y2 = 60 + 53.5 * Math.sin(angle);
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        className="stroke-neutral-300/80 dark:stroke-neutral-700/80"
                        strokeWidth={i % 6 === 0 ? 1.4 : 0.8}
                      />
                    );
                  })}

                  {/* Track */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    className="stroke-neutral-200/85 dark:stroke-neutral-800"
                    strokeWidth="4.5"
                    fill="transparent"
                  />

                  {/* Active Progress Ring */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    className={`transition-all duration-500 ease-linear ${accentStrokeClass}`}
                    strokeWidth="5"
                    strokeDasharray={301.59}
                    strokeDashoffset={301.59 * (1 - progressPercent / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Center Telemetry & Task Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {Array.from({ length: prefs.longBreakInterval }).map((_, idx) => {
                      const completedOrCurrent = idx + 1 <= roundInCycle;
                      return (
                        <span
                          key={idx}
                          className={`h-1.5 rounded-full transition-all ${
                            idx + 1 === roundInCycle && phase === 'work'
                              ? 'w-4 bg-rose-600 dark:bg-rose-500'
                              : completedOrCurrent
                              ? 'w-1.5 bg-neutral-700 dark:bg-neutral-300'
                              : 'w-1.5 bg-neutral-300 dark:bg-neutral-700'
                          }`}
                        />
                      );
                    })}
                  </div>

                  <span className="text-5xl sm:text-6xl font-bold font-mono tabular-nums tracking-tight text-neutral-950 dark:text-white">
                    {timeDisplay}
                  </span>

                  <div className="mt-2 max-w-[190px] truncate text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    {activeTask ? activeTask.title : freeIntention.trim() || pw.keepDeepFocus}
                  </div>

                  <div className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500 font-mono tabular-nums">
                    {tf.roundLabel
                      .replace('{cur}', String(roundInCycle))
                      .replace('{total}', String(prefs.longBreakInterval))}
                    <span aria-hidden="true"> · </span>
                    {tf.estFinishAt.replace('{time}', estimatedEndTimeStr)}
                  </div>
                </div>
              </div>

              {/* Quick Duration Presets when Countdown Focus is idle */}
              {phase === 'work' && !isRunning && timeLeft === phaseTotalSeconds && (
                <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
                  {[15, 25, 45, 60].map((presetMin) => (
                    <button
                      key={presetMin}
                      type="button"
                      onClick={() => handleDurationChange('workDuration', presetMin)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold tabular-nums transition-colors cursor-pointer ${
                        prefs.workDuration === presetMin
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                          : 'bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {presetMin}m
                    </button>
                  ))}
                </div>
              )}

              {/* Strict Lock Confirmation Strip */}
              {strictConfirmAction && (
                <div className="mt-4 w-full max-w-md px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-rose-700 dark:text-rose-300">
                    {tf.strictConfirmStop}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleConfirmStrictAction}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold cursor-pointer"
                    >
                      {tf.strictConfirmYes}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStrictConfirmAction(null)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold cursor-pointer"
                    >
                      {tf.strictConfirmNo}
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Tactile Control Buttons */}
              <div className="flex items-center justify-center gap-3 mt-5 w-full">
                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[46px] min-w-[46px] flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
                  title={pw.resetTimerTitle}
                  aria-label={pw.resetTimerTitle}
                >
                  <RotateCcw className="w-4.5 h-4.5" />
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={`min-h-[48px] px-8 sm:px-10 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 shadow-sm transition-transform active:scale-[0.98] cursor-pointer whitespace-nowrap ${primaryCtaClasses}`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-4.5 h-4.5 fill-current" />
                      <span>{pw.pause}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4.5 h-4.5 fill-current" />
                      <span>
                        {timeLeft < phaseTotalSeconds ? pw.resume : pw.startFocus}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkipOrFinishEarly}
                  className={`min-h-[46px] px-3.5 flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    canLogEarly
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-700 dark:text-neutral-200'
                  }`}
                  title={canLogEarly ? tf.finishAndLog : pw.skipRoundTitle}
                >
                  {canLogEarly ? (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline">{tf.finishAndLog}</span>
                    </>
                  ) : (
                    <SkipForward className="w-4.5 h-4.5 shrink-0" />
                  )}
                </button>
              </div>

              {isRunning && prefs.strictMode && phase === 'work' && (
                <p className="mt-3 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {tf.strictLockedNotice}
                </p>
              )}
            </div>

            {/* Offline Ambient Soundscape Mixer */}
            <div className="pt-4 border-t border-neutral-200/70 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  {tf.ambientMixerTitle}
                </span>

                <div className="flex items-center gap-2">
                  {prefs.ambientSound === 'none' ? (
                    <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  )}
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={prefs.ambientVolume}
                    onChange={(e) => updatePrefs({ ambientVolume: parseFloat(e.target.value) })}
                    aria-label={tf.volumeLabel}
                    className="w-24 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-[11px] font-mono tabular-nums text-neutral-500 w-8 text-end">
                    {Math.round(prefs.ambientVolume * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {noiseOptions.map((opt) => {
                  const active = prefs.ambientSound === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection', hapticsEnabled);
                        updatePrefs({ ambientSound: active && opt.id !== 'none' ? 'none' : opt.id });
                      }}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                          : 'bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-white/[0.12]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="hidden sm:block pt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                {tf.keyboardHints}
              </div>
            </div>
          </div>

          {/* Focus Session Timeline Log */}
          <div className="p-5 rounded-3xl bg-white/90 dark:bg-neutral-900/90 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {tf.focusLogTitle}
              </h2>
              {sessions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSessions(clearFocusSessions())}
                  className="text-xs font-medium text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  {tf.clearFocusLog}
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 py-4 text-center">
                {tf.focusLogEmpty}
              </p>
            ) : (
              <div className="divide-y divide-neutral-200/70 dark:divide-white/10 max-h-64 overflow-y-auto pr-1">
                {sessions.slice(0, 12).map((s) => {
                  const dt = new Date(s.completedAt);
                  const dateLabel = toDateString(dt) === todayStr ? '' : `${dt.getMonth() + 1}/${dt.getDate()} `;
                  const timeLabel = `${dateLabel}${String(dt.getHours()).padStart(2, '0')}:${String(
                    dt.getMinutes()
                  ).padStart(2, '0')}`;
                  return (
                    <div key={s.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                          {s.taskTitle || pw.freeFocus}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 font-mono tabular-nums mt-0.5">
                          <span>{tf.pomoBadge}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {s.durationMinutes} {tf.minutesUnit}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{timeLabel}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSessions(deleteFocusSession(s.id))}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                        title={tf.deleteRecord}
                        aria-label={tf.deleteRecord}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Linked Task Queue + KPI Analytics & 7-Day Trend */}
        <div className="lg:col-span-5 space-y-4">
          {/* Analytics Summary & 7-Day Bar Trend */}
          <div className="p-5 rounded-3xl bg-white/90 dark:bg-neutral-900/90 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 shadow-sm space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-px bg-neutral-200/70 dark:bg-white/10 rounded-2xl overflow-hidden border border-neutral-200/70 dark:border-white/10">
              <div className="bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-3">
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {pw.statTodayFocus}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-neutral-950 dark:text-white mt-0.5">
                  {analytics.todayMinutes}
                  <span className="text-xs font-normal text-neutral-500 ms-1">{pw.statMinUnit}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-3">
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {pw.statCompletedPomos}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">
                  {analytics.todaySessions}
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-3">
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {pw.statGoalRate} · {tf.todayGoalLabel.replace('{goal}', String(analytics.dailyGoalMinutes))}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {analytics.goalPercent}%
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-3">
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {pw.statStreakDays}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
                  {analytics.streakDays}
                  <span className="text-xs font-normal text-neutral-500 ms-1">{pw.statDayUnit}</span>
                </div>
              </div>
            </div>

            {/* 7-Day Focus Trend Chart */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {tf.weeklyTrendTitle}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
                  {tf.allTimeMinutesLabel}: {analytics.totalMinutesAllTime} {tf.minutesUnit}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-3 relative">
                {analytics.weekSeries.map((day, idx) => {
                  const pct = Math.max(4, Math.round((day.minutes / maxWeekMinutes) * 100));
                  const isHovered = hoveredDayIdx === idx;
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onMouseEnter={() => setHoveredDayIdx(idx)}
                      onMouseLeave={() => setHoveredDayIdx(null)}
                      onClick={() => setHoveredDayIdx(isHovered ? null : idx)}
                      className="flex flex-col items-center justify-end h-full gap-1.5 group cursor-pointer focus:outline-none"
                    >
                      <span
                        className={`text-[10px] font-mono tabular-nums transition-opacity ${
                          day.minutes > 0 || isHovered
                            ? 'text-neutral-700 dark:text-neutral-300 opacity-100'
                            : 'opacity-0'
                        }`}
                      >
                        {day.minutes}m
                      </span>
                      <div className="w-full flex-1 flex items-end justify-center">
                        <div
                          style={{ height: `${day.minutes === 0 ? 4 : pct}%` }}
                          className={`w-full max-w-[26px] rounded-t-md transition-all ${
                            day.isToday
                              ? 'bg-rose-600 dark:bg-rose-500'
                              : day.minutes > 0
                              ? 'bg-neutral-800 dark:bg-neutral-300 group-hover:bg-rose-500'
                              : 'bg-neutral-200 dark:bg-neutral-800'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-[10px] truncate max-w-full ${
                          day.isToday
                            ? 'font-bold text-rose-600 dark:text-rose-400'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                      >
                        {day.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Linked Task Workspace & Queue */}
          <div className="p-5 rounded-3xl bg-white/90 dark:bg-neutral-900/90 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-sm font-bold text-neutral-900 dark:text-neutral-100">
                <ListTodo className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{tf.taskQueueTitle}</span>
              </div>

              <div className="inline-grid grid-cols-2 p-0.5 rounded-lg bg-neutral-100 dark:bg-white/[0.06] text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setQueueFilter('today')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    queueFilter === 'today'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {tf.queueTabToday}
                </button>
                <button
                  type="button"
                  onClick={() => setQueueFilter('all')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    queueFilter === 'all'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {tf.queueTabAll}
                </button>
              </div>
            </div>

            {/* Active Selection Display / Free Focus Intention */}
            {activeTask ? (
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/10 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {activeTask.title}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 font-mono tabular-nums">
                      {activeTask.startDate && <span>{activeTask.startDate}</span>}
                      {activeTask.startDate && <span aria-hidden="true">·</span>}
                      <span>
                        {activeTask.completedPomodoros || 0}/{activeTask.estimatedPomodoros || 1} 🍅
                      </span>
                      {categoryMap.get(activeTask.categoryId) && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            {getCategoryDisplayName(
                              categoryMap.get(activeTask.categoryId)!,
                              settings.language
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {onCompleteTask && (
                    <button
                      type="button"
                      onClick={() => onCompleteTask(activeTask.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{tf.markTaskComplete}</span>
                    </button>
                  )}
                </div>

                {/* Inline Subtasks while Focusing */}
                {activeTask.checklist && activeTask.checklist.length > 0 && (
                  <div className="pt-2 border-t border-neutral-200/70 dark:border-white/10 space-y-1.5">
                    <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                      {tf.subtasksInFocus}
                    </div>
                    {activeTask.checklist.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onToggleSubtask?.(activeTask.id, item.id)}
                        className="w-full flex items-center gap-2 text-start text-xs py-1 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        )}
                        <span
                          className={
                            item.completed
                              ? 'line-through text-neutral-400'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }
                        >
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={freeIntention}
                onChange={(e) => setFreeIntention(e.target.value)}
                placeholder={tf.freeFocusPlaceholder}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            )}

            {/* Search Queue */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder={tf.searchTasksPlaceholder}
                className="w-full ps-8 pe-3 py-1.5 rounded-xl bg-neutral-100/80 dark:bg-white/[0.04] border border-neutral-200/70 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
              />
            </div>

            {/* Interactive Queue List */}
            <div className="divide-y divide-neutral-200/60 dark:divide-white/10 max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedTaskId('');
                  onSelectTask?.('');
                }}
                className={`w-full py-2.5 px-2.5 rounded-xl flex items-center justify-between text-start text-xs transition-colors cursor-pointer ${
                  !selectedTaskId
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <span>{pw.freeFocus}</span>
                {!selectedTaskId && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>

              {pendingTasks.map((task) => {
                const isSelected = selectedTaskId === task.id;
                const cat = categoryMap.get(task.categoryId);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      onSelectTask?.(task.id);
                    }}
                    className={`w-full py-2.5 px-2.5 flex items-center justify-between gap-2 text-start text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold rounded-xl'
                        : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{task.title}</div>
                      <div className="text-[11px] text-neutral-400 font-mono tabular-nums flex items-center gap-1.5">
                        {cat && <span>{getCategoryDisplayName(cat, settings.language)}</span>}
                        {cat && task.startDate && <span aria-hidden="true">·</span>}
                        {task.startDate && <span>{task.startDate}</span>}
                        <span aria-hidden="true">·</span>
                        <span>
                          {task.completedPomodoros || 0}/{task.estimatedPomodoros || 1} 🍅
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
