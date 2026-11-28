import React, { useState, useMemo } from 'react';
import {
  HabitGoalType,
  HabitItem,
  HabitLogEntry,
  HabitTimeSlot,
  Language,
} from '../types/calendar';
import {
  addDaysToDateStr,
  computeHabitStats,
  getHabitLogForDate,
  getTickTickLabels,
  isHabitScheduledOnDate,
} from '../utils/ticktickEngine';
import { toDateString } from '../utils/dateUtils';
import { triggerHaptic } from '../utils/haptics';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Check,
  Minus,
  Trash2,
  Edit3,
  Archive,
  X,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface HabitTrackerPanelProps {
  habits: HabitItem[];
  habitLogs: HabitLogEntry[];
  showHabitsInToday: boolean;
  language: Language;
  hapticsEnabled: boolean;
  onUpsertHabit: (habit: HabitItem) => void;
  onDeleteHabit: (habitId: string) => void;
  onLogHabit: (entry: HabitLogEntry) => void;
  onToggleShowInToday: (val: boolean) => void;
}

const EMOJI_PRESETS = ['💧', '📖', '🏃', '🌙', '🧘', '🥗', '💊', '✍️', '🎯', '🌅', '📵', '🧠'];
const COLOR_PRESETS = ['#0284C7', '#059669', '#7C3AED', '#F57C00', '#E11D48', '#D97706', '#0D9488'];

export const HabitTrackerPanel: React.FC<HabitTrackerPanelProps> = ({
  habits,
  habitLogs,
  showHabitsInToday,
  language,
  hapticsEnabled,
  onUpsertHabit,
  onDeleteHabit,
  onLogHabit,
  onToggleShowInToday,
}) => {
  const tt = getTickTickLabels(language);
  const isZh = language === 'zh-CN' || language === 'zh-TW';
  const todayStr = toDateString(new Date());

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedHabitId, setSelectedHabitId] = useState<string>(() => habits[0]?.id || '');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [showArchived, setShowArchived] = useState(false);

  // Create / Edit modal state
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('💧');
  const [formColor, setFormColor] = useState('#0284C7');
  const [formSlot, setFormSlot] = useState<HabitTimeSlot>('morning');
  const [formGoalType, setFormGoalType] = useState<HabitGoalType>('checkin');
  const [formTarget, setFormTarget] = useState(1);
  const [formUnit, setFormUnit] = useState('');
  const [formWeekdays, setFormWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [formQuote, setFormQuote] = useState('');

  const visibleHabits = useMemo(
    () => habits.filter((h) => (showArchived ? Boolean(h.archived) : !h.archived)),
    [habits, showArchived]
  );

  const selectedHabit = useMemo(
    () => habits.find((h) => h.id === selectedHabitId) || visibleHabits[0] || null,
    [habits, selectedHabitId, visibleHabits]
  );

  const scheduledForDate = useMemo(
    () => visibleHabits.filter((h) => isHabitScheduledOnDate(h, selectedDate)),
    [visibleHabits, selectedDate]
  );

  const completedForDateCount = useMemo(
    () =>
      scheduledForDate.filter((h) => getHabitLogForDate(habitLogs, h.id, selectedDate)?.completed)
        .length,
    [scheduledForDate, habitLogs, selectedDate]
  );

  const slotLabels: Record<HabitTimeSlot, string> = isZh
    ? {
        morning: '清晨习惯',
        afternoon: '午后节奏',
        night: '晚间与睡前',
        anytime: '全天任意时段',
      }
    : {
        morning: 'Morning',
        afternoon: 'Afternoon',
        night: 'Night',
        anytime: 'Anytime',
      };

  const weekdayLabels = isZh ? ['日', '一', '二', '三', '四', '五', '六'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handleToggleOrStep = (habit: HabitItem, dateStr: string, delta?: number) => {
    const existing = getHabitLogForDate(habitLogs, habit.id, dateStr);
    triggerHaptic('success', hapticsEnabled);

    if (habit.goalType === 'checkin' && delta === undefined) {
      const nextCompleted = !(existing?.completed);
      onLogHabit({
        habitId: habit.id,
        date: dateStr,
        value: nextCompleted ? 1 : 0,
        completed: nextCompleted,
        mood: existing?.mood,
        note: existing?.note,
        updatedAt: Date.now(),
      });
      return;
    }

    const currVal = existing?.value || 0;
    const stepDelta = delta ?? 1;
    const nextVal = Math.max(0, currVal + stepDelta);
    onLogHabit({
      habitId: habit.id,
      date: dateStr,
      value: nextVal,
      completed: nextVal >= habit.targetValue,
      mood: existing?.mood,
      note: existing?.note,
      updatedAt: Date.now(),
    });
  };

  const handleOpenModal = (habit?: HabitItem) => {
    if (habit) {
      setEditingHabit(habit);
      setFormName(habit.name);
      setFormIcon(habit.icon);
      setFormColor(habit.color);
      setFormSlot(habit.timeSlot);
      setFormGoalType(habit.goalType);
      setFormTarget(habit.targetValue);
      setFormUnit(habit.unit || '');
      setFormWeekdays(habit.weekdays);
      setFormQuote(habit.quote || '');
    } else {
      setEditingHabit(null);
      setFormName('');
      setFormIcon('🎯');
      setFormColor('#F57C00');
      setFormSlot('anytime');
      setFormGoalType('checkin');
      setFormTarget(1);
      setFormUnit(isZh ? '次' : 'times');
      setFormWeekdays([0, 1, 2, 3, 4, 5, 6]);
      setFormQuote('');
    }
    setIsModalOpen(true);
  };

  const handleSaveHabitModal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) return;

    const item: HabitItem = {
      id: editingHabit?.id || `habit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      icon: formIcon,
      color: formColor,
      timeSlot: formSlot,
      goalType: formGoalType,
      targetValue: formGoalType === 'checkin' ? 1 : Math.max(1, formTarget),
      unit: formGoalType === 'count' ? formUnit.trim() || (isZh ? '次' : 'x') : undefined,
      weekdays: formWeekdays.length > 0 ? formWeekdays : [0, 1, 2, 3, 4, 5, 6],
      archived: editingHabit?.archived || false,
      createdAt: editingHabit?.createdAt || Date.now(),
      quote: formQuote.trim() || undefined,
    };

    onUpsertHabit(item);
    setSelectedHabitId(item.id);
    setIsModalOpen(false);
  };

  // Monthly grid for selectedHabit
  const monthGridCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ dateStr: string; dayNum: number } | null> = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        dateStr: toDateString(new Date(year, month, d)),
        dayNum: d,
      });
    }
    return cells;
  }, [calendarMonth]);

  const selectedStats = useMemo(
    () => (selectedHabit ? computeHabitStats(selectedHabit, habitLogs, todayStr) : null),
    [selectedHabit, habitLogs, todayStr]
  );

  const selectedDateLog = selectedHabit
    ? getHabitLogForDate(habitLogs, selectedHabit.id, selectedDate)
    : undefined;

  return (
    <div className="space-y-4">
      {/* Top Bar: Date Switcher & Progress */}
      <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDaysToDateStr(d, -1))}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-white/10 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-100 tabular-nums cursor-pointer whitespace-nowrap"
            >
              {selectedDate === todayStr
                ? `${tt.today} · ${selectedDate}`
                : selectedDate}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDaysToDateStr(d, 1))}
              disabled={selectedDate >= todayStr}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-white/10 disabled:opacity-35 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 tabular-nums">
            {isZh ? '当日完成' : 'Completed'}:{' '}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {completedForDateCount}/{scheduledForDate.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 cursor-pointer px-2.5 py-1.5 rounded-xl border border-neutral-200/80 dark:border-white/10">
            <input
              type="checkbox"
              checked={showHabitsInToday}
              onChange={(e) => onToggleShowInToday(e.target.checked)}
              className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
            />
            <span className="whitespace-nowrap">{isZh ? '在“今天”显示习惯' : 'Show in Today'}</span>
          </label>

          <button
            type="button"
            onClick={() => setShowArchived((s) => !s)}
            className={`min-h-[38px] px-3 rounded-xl border text-xs font-semibold cursor-pointer whitespace-nowrap ${
              showArchived
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : 'border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10'
            }`}
          >
            {showArchived ? (isZh ? '查看进行中' : 'Active') : (isZh ? '已归档' : 'Archived')}
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="min-h-[38px] px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{tt.habitAdd}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Grid: Habit List + Selected Habit Monthly Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Time-of-day Habit Check-ins */}
        <div className="lg:col-span-7 space-y-4">
          {visibleHabits.length === 0 ? (
            <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-10 text-center">
              <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                {showArchived
                  ? isZh
                    ? '暂无已归档习惯'
                    : 'No archived habits'
                  : isZh
                  ? '暂无习惯，点击右上角「新建习惯」开启打卡坚持！'
                  : 'No active habits yet. Create your first habit to begin tracking.'}
              </p>
            </div>
          ) : (
            (['morning', 'afternoon', 'night', 'anytime'] as HabitTimeSlot[]).map((slot) => {
              const items = visibleHabits.filter((h) => h.timeSlot === slot);
              if (items.length === 0) return null;
              return (
                <div
                  key={slot}
                  className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      {slotLabels[slot]}
                    </h3>
                    <span className="text-[11px] font-semibold text-neutral-400 tabular-nums">
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {items.map((habit) => {
                      const log = getHabitLogForDate(habitLogs, habit.id, selectedDate);
                      const stats = computeHabitStats(habit, habitLogs, todayStr);
                      const isDone = Boolean(log?.completed);
                      const val = log?.value || 0;
                      const scheduled = isHabitScheduledOnDate(habit, selectedDate);
                      const isSelected = selectedHabit?.id === habit.id;

                      return (
                        <div
                          key={habit.id}
                          onClick={() => setSelectedHabitId(habit.id)}
                          className={`rounded-2xl border p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-orange-500/60 bg-orange-500/[0.04]'
                              : 'border-neutral-200/80 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
                              style={{ backgroundColor: `${habit.color}1A` }}
                            >
                              {habit.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-bold truncate ${
                                    isDone
                                      ? 'text-neutral-500 dark:text-neutral-400 line-through'
                                      : 'text-neutral-900 dark:text-neutral-100'
                                  }`}
                                >
                                  {habit.name}
                                </span>
                                {!scheduled && (
                                  <span className="text-[11px] text-neutral-400">
                                    · {isZh ? '休息日' : 'Rest'}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2 tabular-nums">
                                <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
                                  <Flame className="w-3.5 h-3.5" />
                                  {stats.currentStreak}
                                  {isZh ? '天' : 'd'}
                                </span>
                                <span>·</span>
                                <span>
                                  {stats.rate30Days}% {isZh ? '月达成' : '30d'}
                                </span>
                                {habit.goalType === 'count' && (
                                  <>
                                    <span>·</span>
                                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                      {val}/{habit.targetValue} {habit.unit || ''}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {habit.goalType === 'count' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleOrStep(habit, selectedDate, -1)}
                                  className="w-9 h-9 rounded-xl border border-neutral-200/80 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleOrStep(habit, selectedDate, 1)}
                                  className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold transition-colors cursor-pointer ${
                                    isDone
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-orange-500/10 hover:border-orange-500/40'
                                  }`}
                                >
                                  {isDone ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleOrStep(habit, selectedDate)}
                                className={`min-h-[38px] px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                  isDone
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-emerald-500/50 hover:text-emerald-600'
                                }`}
                              >
                                <Check className="w-4 h-4" />
                                <span>{isDone ? (isZh ? '已打卡' : 'Done') : (isZh ? '打卡' : 'Check')}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Habit Inspector + Monthly Calendar Grid */}
        {selectedHabit && selectedStats && (
          <div className="lg:col-span-5 rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${selectedHabit.color}1F` }}
                >
                  {selectedHabit.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100 truncate">
                    {selectedHabit.name}
                  </h3>
                  {selectedHabit.quote && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {selectedHabit.quote}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenModal(selectedHabit)}
                  title={isZh ? '编辑习惯' : 'Edit Habit'}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpsertHabit({ ...selectedHabit, archived: !selectedHabit.archived })
                  }
                  title={selectedHabit.archived ? (isZh ? '取消归档' : 'Unarchive') : (isZh ? '归档' : 'Archive')}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteHabit(selectedHabit.id)}
                  title={isZh ? '删除习惯' : 'Delete Habit'}
                  className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3 Streak Metrics */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3">
                <div className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>{tt.habitStreak}</span>
                </div>
                <div className="mt-1 text-lg font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {selectedStats.currentStreak}
                  <span className="text-xs font-medium text-neutral-400 ml-0.5">{isZh ? '天' : 'd'}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3">
                <div className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>{tt.habitBest}</span>
                </div>
                <div className="mt-1 text-lg font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {selectedStats.bestStreak}
                  <span className="text-xs font-medium text-neutral-400 ml-0.5">{isZh ? '天' : 'd'}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3">
                <div className="text-[11px] font-semibold text-neutral-500">
                  {tt.habitRate30}
                </div>
                <div className="mt-1 text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {selectedStats.rate30Days}%
                </div>
              </div>
            </div>

            {/* Monthly Check-in Calendar Grid */}
            <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 tabular-nums">
                  <CalendarIcon className="w-3.5 h-3.5 text-orange-500" />
                  <span>
                    {calendarMonth.getFullYear()}-{String(calendarMonth.getMonth() + 1).padStart(2, '0')}
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)
                      )
                    }
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)
                      )
                    }
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-neutral-400">
                {weekdayLabels.map((lbl) => (
                  <div key={lbl}>{lbl}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthGridCells.map((cell, idx) => {
                  if (!cell) return <div key={`pad-${idx}`} className="h-8" />;
                  const log = getHabitLogForDate(habitLogs, selectedHabit.id, cell.dateStr);
                  const isDone = Boolean(log?.completed);
                  const isFuture = cell.dateStr > todayStr;
                  const isSel = cell.dateStr === selectedDate;
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      disabled={isFuture}
                      onClick={() => {
                        setSelectedDate(cell.dateStr);
                        if (selectedHabit.goalType === 'checkin') {
                          handleToggleOrStep(selectedHabit, cell.dateStr);
                        }
                      }}
                      className={`h-8 rounded-lg text-xs font-semibold tabular-nums transition-all cursor-pointer disabled:opacity-30 ${
                        isDone
                          ? 'text-white shadow-xs'
                          : isSel
                          ? 'bg-orange-500/15 text-orange-600 dark:text-orange-300 border border-orange-500/40'
                          : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10'
                      }`}
                      style={isDone ? { backgroundColor: selectedHabit.color } : undefined}
                    >
                      {cell.dayNum}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Mood & Habit Reflection Note */}
            <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                  {isZh ? `打卡日志 (${selectedDate})` : `Habit Log (${selectedDate})`}
                </span>
                <div className="flex items-center gap-1">
                  {(
                    [
                      { key: 'great', emoji: '🤩' },
                      { key: 'good', emoji: '🙂' },
                      { key: 'neutral', emoji: '😐' },
                      { key: 'tired', emoji: '😪' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() =>
                        onLogHabit({
                          habitId: selectedHabit.id,
                          date: selectedDate,
                          value: selectedDateLog?.value || 0,
                          completed: Boolean(selectedDateLog?.completed),
                          mood: m.key,
                          note: selectedDateLog?.note,
                          updatedAt: Date.now(),
                        })
                      }
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center cursor-pointer ${
                        selectedDateLog?.mood === m.key
                          ? 'bg-orange-500/15 ring-1 ring-orange-500/50'
                          : 'hover:bg-neutral-100 dark:hover:bg-white/10 opacity-75'
                      }`}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={selectedDateLog?.note || ''}
                onChange={(e) =>
                  onLogHabit({
                    habitId: selectedHabit.id,
                    date: selectedDate,
                    value: selectedDateLog?.value || 0,
                    completed: Boolean(selectedDateLog?.completed),
                    mood: selectedDateLog?.mood,
                    note: e.target.value,
                    updatedAt: Date.now(),
                  })
                }
                placeholder={isZh ? '写一句今天的感受或完成心得...' : 'Add a reflection note...'}
                className="w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/5 px-3 py-2 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Habit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <form
            onSubmit={handleSaveHabitModal}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                {editingHabit ? (isZh ? '编辑习惯' : 'Edit Habit') : tt.habitAdd}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={isZh ? '习惯名称（如：早起冥想15分钟）' : 'Habit name...'}
                className="w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-white/5 px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-orange-500"
              />

              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block mb-1.5">
                  {isZh ? '图标与颜色' : 'Icon & Color'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {EMOJI_PRESETS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setFormIcon(em)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center cursor-pointer ${
                        formIcon === em
                          ? 'bg-orange-500/15 ring-1 ring-orange-500'
                          : 'hover:bg-neutral-100 dark:hover:bg-white/10'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setFormColor(col)}
                      className={`w-6 h-6 rounded-full cursor-pointer ${
                        formColor === col ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white' : ''
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="block">
                  <span className="text-[11px] font-semibold text-neutral-500">
                    {isZh ? '打卡时段' : 'Time Slot'}
                  </span>
                  <select
                    value={formSlot}
                    onChange={(e) => setFormSlot(e.target.value as HabitTimeSlot)}
                    className="mt-1 w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs font-semibold"
                  >
                    {(['morning', 'afternoon', 'night', 'anytime'] as HabitTimeSlot[]).map((s) => (
                      <option key={s} value={s}>
                        {slotLabels[s]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold text-neutral-500">
                    {isZh ? '目标方式' : 'Goal Type'}
                  </span>
                  <select
                    value={formGoalType}
                    onChange={(e) => setFormGoalType(e.target.value as HabitGoalType)}
                    className="mt-1 w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <option value="checkin">{isZh ? '单次完成打卡' : 'Daily Check-in'}</option>
                    <option value="count">{isZh ? '累计计数目标' : 'Numeric Target'}</option>
                  </select>
                </label>
              </div>

              {formGoalType === 'count' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="block">
                    <span className="text-[11px] font-semibold text-neutral-500">
                      {isZh ? '每日目标值' : 'Target'}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={formTarget}
                      onChange={(e) => setFormTarget(Math.max(1, Number(e.target.value) || 1))}
                      className="mt-1 w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-white/5 px-2.5 py-1.5 text-xs tabular-nums"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold text-neutral-500">
                      {isZh ? '单位' : 'Unit'}
                    </span>
                    <input
                      type="text"
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      placeholder={isZh ? '杯 / 分钟 / 页' : 'cups / min'}
                      className="mt-1 w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-white/5 px-2.5 py-1.5 text-xs"
                    />
                  </label>
                </div>
              )}

              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block mb-1.5">
                  {isZh ? '打卡周期' : 'Repeat Days'}
                </span>
                <div className="flex items-center gap-1">
                  {weekdayLabels.map((lbl, idx) => {
                    const active = formWeekdays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setFormWeekdays((prev) =>
                            prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
                          )
                        }
                        className={`w-8 h-8 rounded-lg text-xs font-bold border cursor-pointer ${
                          active
                            ? 'bg-orange-500/15 border-orange-500/40 text-orange-600 dark:text-orange-300'
                            : 'border-neutral-200/80 dark:border-white/10 text-neutral-500'
                        }`}
                      >
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              </div>

              <input
                type="text"
                value={formQuote}
                onChange={(e) => setFormQuote(e.target.value)}
                placeholder={isZh ? '激励短语（可选）' : 'Motivational note (optional)'}
                className="w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-white/5 px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200/80 dark:border-white/10 text-xs font-semibold cursor-pointer"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer"
              >
                {isZh ? '保存习惯' : 'Save Habit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
