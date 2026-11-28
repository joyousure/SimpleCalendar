import React, { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, AppSettings, AmbientSoundType } from '../types/calendar';
import { getTranslation } from '../utils/i18n';
import { getTodoFocusLabels } from '../utils/todoFocusI18n';
import { ambientAudio } from '../utils/ambientAudio';
import {
  FOCUS_UPDATED_EVENT,
  loadFocusPrefs,
  loadFocusSessions,
  recordFocusSession,
} from '../utils/focusStorage';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  ListTodo,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';

interface PomodoroTimerProps {
  events: CalendarEvent[];
  onUpdateEvent: (event: CalendarEvent) => void;
  settings: AppSettings;
  activeTaskId?: string;
  onSelectTask?: (taskId: string) => void;
  onOpenFullFocus?: (taskId?: string) => void;
}

type PomoMode = 'work' | 'short_break' | 'long_break';

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  events,
  onUpdateEvent,
  settings,
  activeTaskId,
  onSelectTask,
  onOpenFullFocus,
}) => {
  const t = getTranslation(settings.language);
  const tf = getTodoFocusLabels(settings.language);

  const [prefs, setPrefs] = useState(() => loadFocusPrefs());
  const workMinutes = prefs.workDuration;
  const shortBreakMinutes = prefs.shortBreakDuration;
  const longBreakMinutes = prefs.longBreakDuration;

  const [mode, setMode] = useState<PomoMode>('work');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [todayTomatoesCount, setTodayTomatoesCount] = useState(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return loadFocusSessions().filter(
      (s) => s.mode === 'work' && new Date(s.completedAt).toISOString().slice(0, 10) === todayStr
    ).length;
  });

  // Ambient sound
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('none');
  const [ambientVolume, setAmbientVolume] = useState(prefs.ambientVolume);

  // Strict Mode
  const [strictMode, setStrictMode] = useState(false);

  // Selected task for focus
  const [currentTaskId, setCurrentTaskId] = useState<string | undefined>(activeTaskId);

  useEffect(() => {
    if (activeTaskId) {
      setCurrentTaskId(activeTaskId);
    }
  }, [activeTaskId]);

  useEffect(() => {
    const sync = () => {
      const nextPrefs = loadFocusPrefs();
      setPrefs(nextPrefs);
      const todayStr = new Date().toISOString().slice(0, 10);
      setTodayTomatoesCount(
        loadFocusSessions().filter(
          (s) => s.mode === 'work' && new Date(s.completedAt).toISOString().slice(0, 10) === todayStr
        ).length
      );
    };
    window.addEventListener(FOCUS_UPDATED_EVENT, sync);
    return () => window.removeEventListener(FOCUS_UPDATED_EVENT, sync);
  }, []);

  const activeTask = events.find((e) => e.id === currentTaskId);

  const completeCurrentSession = useCallback(() => {
    setIsRunning(false);
    ambientAudio.playGong();

    if (mode === 'work') {
      recordFocusSession({
        taskId: activeTask?.id,
        taskTitle: activeTask?.title,
        durationMinutes: workMinutes,
        mode: 'work',
        kind: 'pomodoro',
      });
      const nextTomatoCount = todayTomatoesCount + 1;
      setTodayTomatoesCount(nextTomatoCount);

      if (activeTask) {
        const nextCompleted = (activeTask.completedPomodoros || 0) + 1;
        onUpdateEvent({
          ...activeTask,
          completedPomodoros: nextCompleted,
          updatedAt: Date.now(),
        });
      }

      if (nextTomatoCount % prefs.longBreakInterval === 0) {
        setMode('long_break');
        setTimeLeftSeconds(longBreakMinutes * 60);
      } else {
        setMode('short_break');
        setTimeLeftSeconds(shortBreakMinutes * 60);
      }
    } else {
      setMode('work');
      setTimeLeftSeconds(workMinutes * 60);
    }
  }, [
    mode,
    todayTomatoesCount,
    activeTask,
    onUpdateEvent,
    workMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    prefs.longBreakInterval,
  ]);

  // Pure 1-second timer tick while running
  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning]);

  // Trigger session completion cleanly outside the state updater
  useEffect(() => {
    if (!isRunning || timeLeftSeconds > 0) return;
    completeCurrentSession();
  }, [isRunning, timeLeftSeconds, completeCurrentSession]);

  // Handle ambient sound change
  useEffect(() => {
    if (isRunning && ambientSound !== 'none') {
      ambientAudio.setSound(ambientSound, ambientVolume);
    } else {
      ambientAudio.stop();
    }
    return () => {
      ambientAudio.stop();
    };
  }, [isRunning, ambientSound, ambientVolume]);

  const switchMode = (newMode: PomoMode) => {
    if (isRunning && strictMode) return;
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'work') {
      setTimeLeftSeconds(workMinutes * 60);
    } else if (newMode === 'short_break') {
      setTimeLeftSeconds(shortBreakMinutes * 60);
    } else {
      setTimeLeftSeconds(longBreakMinutes * 60);
    }
  };

  const handleReset = () => {
    if (isRunning && strictMode) return;
    setIsRunning(false);
    if (mode === 'work') setTimeLeftSeconds(workMinutes * 60);
    else if (mode === 'short_break') setTimeLeftSeconds(shortBreakMinutes * 60);
    else setTimeLeftSeconds(longBreakMinutes * 60);
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSeconds =
    mode === 'work'
      ? workMinutes * 60
      : mode === 'short_break'
      ? shortBreakMinutes * 60
      : longBreakMinutes * 60;
  const progressPercent = ((totalSeconds - timeLeftSeconds) / Math.max(1, totalSeconds)) * 100;

  const incompleteTasks = events.filter(
    (e) =>
      !e.isCompleted &&
      !e.isInTrash &&
      !e.isWontDo &&
      e.kind !== 'note' &&
      !e.id.startsWith('evt-acc-') &&
      e.categoryId !== 'cat-expense' &&
      e.categoryId !== 'cat-income'
  );

  return (
    <div className="relative rounded-3xl transition-all duration-300 p-5 sm:p-6 bg-white/90 dark:bg-neutral-900/90 [.amoled-mode_&]:bg-neutral-950 backdrop-blur-2xl border border-neutral-200/80 dark:border-white/10 shadow-sm">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between gap-2 pb-3 border-b border-neutral-200/70 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>{t.pomodoroTitle}</span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-mono tabular-nums">
              · {todayTomatoesCount} 🍅
            </span>
          </h2>
        </div>

        {onOpenFullFocus && (
          <button
            type="button"
            onClick={() => onOpenFullFocus(currentTaskId)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>{tf.openFocusStudio}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-center gap-2 my-4">
        <div className="grid grid-cols-3 p-1 rounded-xl bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200/70 dark:border-white/10 w-full max-w-md">
          <button
            type="button"
            onClick={() => switchMode('work')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer truncate ${
              mode === 'work'
                ? 'bg-white dark:bg-neutral-800 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
            }`}
          >
            {t.pomoWork} ({workMinutes}m)
          </button>
          <button
            type="button"
            onClick={() => switchMode('short_break')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer truncate ${
              mode === 'short_break'
                ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
            }`}
          >
            {t.pomoShortBreak} ({shortBreakMinutes}m)
          </button>
          <button
            type="button"
            onClick={() => switchMode('long_break')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer truncate ${
              mode === 'long_break'
                ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
            }`}
          >
            {t.pomoLongBreak} ({longBreakMinutes}m)
          </button>
        </div>
      </div>

      {/* Linked Task Selector */}
      <div className="w-full max-w-md mx-auto mb-3">
        <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 text-xs">
          <ListTodo className="w-4 h-4 text-blue-500 shrink-0" />
          <select
            value={currentTaskId || ''}
            onChange={(e) => {
              const val = e.target.value || undefined;
              setCurrentTaskId(val);
              if (onSelectTask && val) onSelectTask(val);
            }}
            className="flex-1 bg-transparent text-neutral-800 dark:text-neutral-200 focus:outline-none truncate font-medium"
          >
            <option value="">{t.pomoNoTask}</option>
            {incompleteTasks.map((tItem) => (
              <option key={tItem.id} value={tItem.id}>
                {tItem.title} {tItem.completedPomodoros ? `(${tItem.completedPomodoros}🍅)` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Circular Countdown Display */}
      <div className="relative my-3 flex flex-col items-center justify-center">
        <div className="relative w-48 sm:w-56 h-48 sm:h-56 rounded-full flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-neutral-200 dark:text-neutral-800"
              strokeWidth="5"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`transition-all duration-500 ${
                mode === 'work'
                  ? 'text-rose-600'
                  : mode === 'short_break'
                  ? 'text-emerald-600'
                  : 'text-blue-600'
              }`}
              strokeWidth="5"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
              {timeFormatted}
            </span>
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mt-1">
              {mode === 'work' ? t.pomoWork : mode === 'short_break' ? t.pomoShortBreak : t.pomoLongBreak}
            </span>
            {activeTask && (
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 max-w-[140px] truncate mt-0.5">
                {activeTask.title}
              </span>
            )}
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={handleReset}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            title={t.pomoReset}
          >
            <RotateCcw className="w-4.5 h-4.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`min-h-[44px] px-7 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 transition-transform active:scale-[0.98] text-sm cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700'
                : mode === 'work'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4.5 h-4.5" />
                <span>{t.pomoPause}</span>
              </>
            ) : (
              <>
                <Play className="w-4.5 h-4.5 fill-white" />
                <span>{t.pomoStart}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={completeCurrentSession}
            disabled={isRunning && strictMode}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer disabled:opacity-40"
            title={t.done}
          >
            <SkipForward className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Ambient Sound & Strict Mode Controls */}
      <div className="w-full pt-3 mt-3 border-t border-neutral-200/70 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <span className="text-neutral-500 font-medium shrink-0">{t.ambientSoundLabel}:</span>
          {[
            { id: 'none' as AmbientSoundType, label: t.priorityNone || 'Off' },
            { id: 'rain' as AmbientSoundType, label: t.ambientRain || 'Rain' },
            { id: 'waves' as AmbientSoundType, label: t.ambientWaves || 'Waves' },
            { id: 'forest' as AmbientSoundType, label: t.ambientForest || 'Forest' },
            { id: 'cafe' as AmbientSoundType, label: t.ambientCafe || 'Cafe' },
            { id: 'campfire' as AmbientSoundType, label: t.ambientCampfire || 'Campfire' },
            { id: 'whitenoise' as AmbientSoundType, label: t.ambientWhiteNoise || 'White' },
          ].map((snd) => (
            <button
              key={snd.id}
              type="button"
              onClick={() => setAmbientSound(snd.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                ambientSound === snd.id
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {snd.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {ambientSound !== 'none' && (
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                className="w-16 accent-rose-600"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setStrictMode(!strictMode)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              strictMode
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{t.strictModeLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
