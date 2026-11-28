import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarEvent,
  ChecklistItem,
  CustomRepeatRule,
  EventCategory,
  Language,
  RecurrenceType,
  ReminderOffset,
  TaskKind,
  TaskSection,
} from '../types/calendar';
import { getCategoryDisplayName } from '../utils/storage';
import { addDaysToDateStr, getTickTickLabels } from '../utils/ticktickEngine';
import { toDateString } from '../utils/dateUtils';
import {
  X,
  CheckCircle2,
  Circle,
  Flag,
  Calendar,
  Clock,
  Repeat,
  Bell,
  Tag,
  Plus,
  Trash2,
  Pin,
  Copy,
  BookmarkPlus,
  Timer,
  ArrowUpRight,
  Ban,
  RotateCcw,
  FileText,
  CheckSquare,
} from 'lucide-react';

interface TaskInspectorModalProps {
  isOpen: boolean;
  event: CalendarEvent | null;
  categories: EventCategory[];
  sections: TaskSection[];
  allExistingTags: string[];
  language: Language;
  onClose: () => void;
  onSave: (updated: CalendarEvent) => void;
  onDeleteToTrash: (id: string) => void;
  onRestoreFromTrash?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onToggleWontDo: (event: CalendarEvent) => void;
  onDuplicate: (event: CalendarEvent) => void;
  onSaveAsTemplate: (event: CalendarEvent) => void;
  onStartFocus?: (taskId: string) => void;
  onNavigateToDate?: (dateStr: string) => void;
}

const REMINDER_OPTIONS: Array<{ value: ReminderOffset; zh: string; en: string }> = [
  { value: 'at_time', zh: '准时提醒', en: 'At time' },
  { value: '10m', zh: '提前 10 分钟', en: '10m before' },
  { value: '30m', zh: '提前 30 分钟', en: '30m before' },
  { value: '1h', zh: '提前 1 小时', en: '1h before' },
  { value: '1d', zh: '提前 1 天', en: '1d before' },
];

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 240];

export const TaskInspectorModal: React.FC<TaskInspectorModalProps> = ({
  isOpen,
  event,
  categories,
  sections,
  allExistingTags,
  language,
  onClose,
  onSave,
  onDeleteToTrash,
  onRestoreFromTrash,
  onPermanentDelete,
  onToggleWontDo,
  onDuplicate,
  onSaveAsTemplate,
  onStartFocus,
  onNavigateToDate,
}) => {
  const tt = getTickTickLabels(language);
  const isZh = language === 'zh-CN' || language === 'zh-TW';
  const todayStr = toDateString(new Date());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<TaskKind>('task');
  const [categoryId, setCategoryId] = useState('cat-personal');
  const [sectionId, setSectionId] = useState('');
  const [priority, setPriority] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(undefined);
  const [estimatedPomodoros, setEstimatedPomodoros] = useState<number>(1);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [customRule, setCustomRule] = useState<CustomRepeatRule>({
    freq: 'daily',
    interval: 1,
    byWeekday: [],
    repeatBy: 'due',
  });
  const [recurrenceEnd, setRecurrenceEnd] = useState('');
  const [reminders, setReminders] = useState<ReminderOffset[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [templateSavedFlash, setTemplateSavedFlash] = useState(false);

  useEffect(() => {
    if (!event || !isOpen) return;
    setTitle(event.title || '');
    setDescription(event.description || '');
    setKind(event.kind || 'task');
    setCategoryId(event.categoryId || 'cat-personal');
    setSectionId(event.sectionId || '');
    setPriority(event.priority || 'none');
    setStartDate(event.startDate || '');
    setEndDate(event.endDate || event.startDate || '');
    setIsAllDay(event.isAllDay !== false);
    setStartTime(event.startTime || '09:00');
    setEndTime(event.endTime || '10:00');
    setEstimatedMinutes(event.estimatedMinutes);
    setEstimatedPomodoros(event.estimatedPomodoros || 1);
    const activeFreq = event.customRepeatRule?.freq || event.recurrence || 'none';
    setRecurrence(activeFreq);
    setCustomRule({
      freq: activeFreq === 'none' ? 'daily' : activeFreq,
      interval: Math.max(1, event.customRepeatRule?.interval || 1),
      byWeekday: event.customRepeatRule?.byWeekday || [],
      repeatBy: event.customRepeatRule?.repeatBy || 'due',
    });
    setRecurrenceEnd(event.recurrenceEnd || '');
    const initialReminders: ReminderOffset[] =
      event.multipleReminders && event.multipleReminders.length > 0
        ? event.multipleReminders.filter((r) => r !== 'none')
        : event.reminder && event.reminder !== 'none'
        ? [event.reminder]
        : [];
    setReminders(initialReminders);
    setTags(event.tags || []);
    setChecklist(event.checklist || []);
    setIsPinned(Boolean(event.isPinned));
    setTemplateSavedFlash(false);
  }, [event, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const checklistStats = useMemo(() => {
    const total = checklist.length;
    const done = checklist.filter((c) => c.completed).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [checklist]);

  if (!isOpen || !event) return null;

  const handleBuildUpdated = (): CalendarEvent => {
    const trimmedTitle = title.trim() || event.title;
    const normalizedReminders = reminders.filter((r) => r !== 'none');
    const primaryReminder: ReminderOffset = normalizedReminders[0] || 'none';
    const nextEndDate = startDate ? (endDate && endDate >= startDate ? endDate : startDate) : '';
    const nextCustomRepeat: CustomRepeatRule | undefined =
      recurrence === 'none'
        ? undefined
        : {
            freq: recurrence,
            interval: Math.max(1, customRule.interval || 1),
            byWeekday: recurrence === 'weekly' ? customRule.byWeekday : undefined,
            repeatBy: customRule.repeatBy || 'due',
          };

    return {
      ...event,
      title: trimmedTitle,
      description: description.trim() || undefined,
      kind,
      categoryId,
      sectionId: sectionId || undefined,
      priority,
      startDate,
      endDate: nextEndDate,
      isAllDay,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      estimatedMinutes,
      estimatedPomodoros: Math.max(1, estimatedPomodoros),
      recurrence,
      customRepeatRule: nextCustomRepeat,
      recurrenceEnd: recurrence !== 'none' && recurrenceEnd ? recurrenceEnd : undefined,
      reminder: primaryReminder,
      multipleReminders: normalizedReminders.length > 0 ? normalizedReminders : undefined,
      tags: tags.length > 0 ? tags : undefined,
      checklist: checklist.length > 0 ? checklist : undefined,
      isPinned,
      updatedAt: Date.now(),
    };
  };

  const handleSaveAndClose = () => {
    onSave(handleBuildUpdated());
    onClose();
  };

  const handleAddSubtask = () => {
    const clean = newSubtask.trim();
    if (!clean) return;
    setChecklist((prev) => [
      ...prev,
      { id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, text: clean, completed: false },
    ]);
    setNewSubtask('');
  };

  const handleAddTag = (rawTag?: string) => {
    const clean = (rawTag ?? newTagInput).replace(/^#/, '').trim();
    if (!clean) return;
    if (!tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
    }
    if (rawTag === undefined) setNewTagInput('');
  };

  const handleToggleReminder = (offset: ReminderOffset) => {
    setReminders((prev) => {
      if (prev.includes(offset)) return prev.filter((r) => r !== offset);
      if (prev.length >= 5) return prev;
      return [...prev, offset];
    });
  };

  const weekdayLabels = isZh
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const nextMondayStr = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    return addDaysToDateStr(todayStr, diff);
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end sm:justify-center bg-black/45 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSaveAndClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full sm:max-w-2xl h-[92dvh] sm:h-auto sm:max-h-[90dvh] mt-auto sm:mt-0 rounded-t-3xl sm:rounded-3xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Inspector Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                const updated = handleBuildUpdated();
                const nextCompleted = !event.isCompleted;
                onSave({
                  ...updated,
                  isCompleted: nextCompleted,
                  completedAt: nextCompleted ? Date.now() : undefined,
                  isWontDo: false,
                });
              }}
              className={`min-h-[38px] px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                event.isCompleted
                  ? 'bg-emerald-500/12 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-neutral-50 dark:bg-white/5 border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10'
              }`}
            >
              {event.isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
              <span>{event.isCompleted ? (isZh ? '已完成' : 'Completed') : (isZh ? '标记完成' : 'Complete')}</span>
            </button>

            {/* Task vs Note Switch (Pro) */}
            <div className="inline-flex rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-100/70 dark:bg-white/5 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setKind('task')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                  kind === 'task'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{tt.taskKindTask}</span>
              </button>
              <button
                type="button"
                onClick={() => setKind('note')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                  kind === 'note'
                    ? 'bg-white dark:bg-neutral-800 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{tt.taskKindNote}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsPinned((p) => !p)}
              title={isZh ? '置顶' : 'Pin'}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isPinned
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10'
              }`}
            >
              <Pin className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onSaveAsTemplate(handleBuildUpdated());
                setTemplateSavedFlash(true);
                window.setTimeout(() => setTemplateSavedFlash(false), 1800);
              }}
              title={tt.saveAsTemplate}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                templateSavedFlash
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10'
              }`}
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onDuplicate(handleBuildUpdated());
                onClose();
              }}
              title={tt.duplicateTask}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleWontDo(handleBuildUpdated());
                onClose();
              }}
              title={event.isWontDo ? tt.reopenTask : tt.markWontDo}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                event.isWontDo
                  ? 'bg-neutral-200 dark:bg-white/15 text-neutral-700 dark:text-neutral-200'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10'
              }`}
            >
              <Ban className="w-4 h-4" />
            </button>
            {event.isInTrash ? (
              <>
                {onRestoreFromTrash && (
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreFromTrash(event.id);
                      onClose();
                    }}
                    title={tt.restoreTask}
                    className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                {onPermanentDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      onPermanentDelete(event.id);
                      onClose();
                    }}
                    title={isZh ? '彻底删除' : 'Delete Forever'}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onDeleteToTrash(event.id);
                  onClose();
                }}
                title={isZh ? '移至垃圾桶' : 'Move to Trash'}
                className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveAndClose}
              aria-label="Close"
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
          {/* Title & Description */}
          <div className="space-y-2.5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isZh ? '任务或笔记标题...' : 'Task or note title...'}
              className="w-full text-lg sm:text-xl font-bold bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={kind === 'note' ? 6 : 3}
              placeholder={
                kind === 'note'
                  ? isZh
                    ? '记录完整思路、会议纪要或 Markdown 草稿...'
                    : 'Capture full notes, ideas, or structured bullets...'
                  : isZh
                  ? '添加详细描述、交付标准或备忘...'
                  : 'Add description, notes, or criteria...'
              }
              className="w-full text-sm rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.03] px-3.5 py-2.5 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500/60 resize-y"
            />
          </div>

          {/* Subtasks & Checklist */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                {isZh ? '子任务 / 检查项' : 'Subtasks & Checklist'}
              </span>
              {checklistStats.total > 0 && (
                <span className="text-xs font-semibold tabular-nums text-neutral-500 dark:text-neutral-400">
                  {checklistStats.done}/{checklistStats.total} ({checklistStats.pct}%)
                </span>
              )}
            </div>
            {checklistStats.total > 0 && (
              <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${checklistStats.pct}%` }}
                />
              </div>
            )}
            <div className="space-y-1.5">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <button
                    type="button"
                    onClick={() =>
                      setChecklist((prev) =>
                        prev.map((c) => (c.id === item.id ? { ...c, completed: !c.completed } : c))
                      )
                    }
                    className="p-1 text-neutral-400 hover:text-orange-500 cursor-pointer shrink-0"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) =>
                      setChecklist((prev) =>
                        prev.map((c) => (c.id === item.id ? { ...c, text: e.target.value } : c))
                      )
                    }
                    className={`flex-1 text-sm bg-transparent focus:outline-none ${
                      item.completed
                        ? 'line-through text-neutral-400'
                        : 'text-neutral-800 dark:text-neutral-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setChecklist((prev) => prev.filter((c) => c.id !== item.id))}
                    className="p-1 text-neutral-400 hover:text-rose-500 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder={isZh ? '输入子任务后按 Enter 添加...' : 'Add subtask and press Enter...'}
                className="flex-1 text-xs rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-neutral-950 px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/15 text-xs font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Date, Time & Duration */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3.5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <span>{isZh ? '日期与时间规划' : 'Date & Timebox'}</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: tt.today, val: todayStr },
                  { label: tt.tomorrow, val: addDaysToDateStr(todayStr, 1) },
                  { label: isZh ? '下周一' : 'Next Mon', val: nextMondayStr },
                  { label: isZh ? '放入收集箱' : 'Inbox', val: '' },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setStartDate(chip.val);
                      setEndDate(chip.val);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                      startDate === chip.val
                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-600 dark:text-orange-300'
                        : 'border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="block">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {isZh ? '开始日期' : 'Start Date'}
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStartDate(v);
                    if (!endDate || v > endDate) setEndDate(v);
                  }}
                  className="mt-1 w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-100 tabular-nums"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {isZh ? '截止日期' : 'Due Date'}
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-100 tabular-nums"
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!isAllDay}
                  onChange={(e) => setIsAllDay(!e.target.checked)}
                  className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
                />
                <span>{isZh ? '指定具体时段' : 'Specific time slot'}</span>
              </label>

              {!isAllDay && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/5 px-2.5 py-1 text-xs tabular-nums"
                  />
                  <span className="text-xs text-neutral-400">-</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/5 px-2.5 py-1 text-xs tabular-nums"
                  />
                </div>
              )}
            </div>

            {/* Duration Presets & Pomodoros */}
            <div className="pt-1 border-t border-neutral-200/60 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{tt.durationPreset}</span>
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {DURATION_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      setEstimatedMinutes(mins);
                      setEstimatedPomodoros(Math.max(1, Math.round(mins / 25)));
                    }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border tabular-nums cursor-pointer ${
                      estimatedMinutes === mins
                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-600 dark:text-orange-300'
                        : 'border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
                <span className="text-xs text-neutral-400 mx-1">·</span>
                <label className="inline-flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                  <span>🍅</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={estimatedPomodoros}
                    onChange={(e) => setEstimatedPomodoros(Math.max(1, Number(e.target.value) || 1))}
                    className="w-12 rounded-lg border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-white/5 px-1.5 py-0.5 text-center text-xs tabular-nums"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Priority, List, Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3">
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-2">
                <Flag className="w-3.5 h-3.5" />
                <span>{isZh ? '优先级' : 'Priority'}</span>
              </span>
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    { val: 'high', label: isZh ? '高' : 'P1', cls: 'text-rose-600 dark:text-rose-400' },
                    { val: 'medium', label: isZh ? '中' : 'P2', cls: 'text-amber-600 dark:text-amber-400' },
                    { val: 'low', label: isZh ? '低' : 'P3', cls: 'text-blue-600 dark:text-blue-400' },
                    { val: 'none', label: isZh ? '无' : 'None', cls: 'text-neutral-500' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setPriority(opt.val)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      priority === opt.val
                        ? 'bg-orange-500/12 border-orange-500/40 ' + opt.cls
                        : 'border-neutral-200/80 dark:border-white/10 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3">
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-2">
                {isZh ? '所属清单' : 'List'}
              </span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-100"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryDisplayName(cat, language)}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3">
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-2">
                {isZh ? '看板分组 (Section)' : 'Kanban Section'}
              </span>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-100"
              >
                <option value="">{isZh ? '未分组' : 'Unsectioned'}</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Recurrence (Pro) */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-indigo-500" />
                <span>{tt.repeatLabel}</span>
              </span>
              <select
                value={recurrence}
                onChange={(e) => {
                  const val = e.target.value as RecurrenceType;
                  setRecurrence(val);
                  if (val !== 'none') {
                    setCustomRule((prev) => ({ ...prev, freq: val }));
                  }
                }}
                className="rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-100"
              >
                <option value="none">{isZh ? '不重复' : 'No Repeat'}</option>
                <option value="daily">{isZh ? '按天重复' : 'Daily'}</option>
                <option value="weekly">{isZh ? '按周重复' : 'Weekly'}</option>
                <option value="monthly">{isZh ? '按月重复' : 'Monthly'}</option>
                <option value="yearly">{isZh ? '按年重复' : 'Yearly'}</option>
              </select>
            </div>

            {recurrence !== 'none' && (
              <div className="space-y-2.5 pt-1 border-t border-neutral-200/60 dark:border-white/10">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="inline-flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                    <span>{isZh ? '每' : 'Every'}</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={customRule.interval}
                      onChange={(e) =>
                        setCustomRule((prev) => ({
                          ...prev,
                          interval: Math.max(1, Number(e.target.value) || 1),
                        }))
                      }
                      className="w-12 rounded-lg border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-white/5 px-1.5 py-0.5 text-center text-xs tabular-nums"
                    />
                    <span>
                      {recurrence === 'daily'
                        ? isZh
                          ? '天'
                          : 'day(s)'
                        : recurrence === 'weekly'
                        ? isZh
                          ? '周'
                          : 'week(s)'
                        : recurrence === 'monthly'
                        ? isZh
                          ? '月'
                          : 'month(s)'
                        : isZh
                        ? '年'
                        : 'year(s)'}
                    </span>
                  </label>

                  <div className="inline-flex rounded-xl border border-neutral-200/80 dark:border-white/10 p-0.5 bg-neutral-100/60 dark:bg-white/5">
                    <button
                      type="button"
                      onClick={() => setCustomRule((prev) => ({ ...prev, repeatBy: 'due' }))}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        customRule.repeatBy !== 'completion'
                          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white'
                          : 'text-neutral-500'
                      }`}
                    >
                      {tt.repeatByDue}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomRule((prev) => ({ ...prev, repeatBy: 'completion' }))}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        customRule.repeatBy === 'completion'
                          ? 'bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400'
                          : 'text-neutral-500'
                      }`}
                    >
                      {tt.repeatByCompletion}
                    </button>
                  </div>
                </div>

                {recurrence === 'weekly' && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {weekdayLabels.map((lbl, idx) => {
                      const active = (customRule.byWeekday || []).includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setCustomRule((prev) => {
                              const curr = prev.byWeekday || [];
                              const next = curr.includes(idx)
                                ? curr.filter((x) => x !== idx)
                                : [...curr, idx];
                              return { ...prev, byWeekday: next };
                            })
                          }
                          className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            active
                              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300'
                              : 'border-neutral-200/80 dark:border-white/10 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10'
                          }`}
                        >
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Multiple Reminders (Pro) */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>{tt.remindersMulti}</span>
              </span>
              <span className="text-[11px] text-neutral-400 tabular-nums">{reminders.length}/5</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {REMINDER_OPTIONS.map((opt) => {
                const active = reminders.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggleReminder(opt.value)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                        : 'border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {isZh ? opt.zh : opt.en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 p-3.5 space-y-2.5">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-teal-500" />
              <span>{isZh ? '标签 (#Tag)' : 'Tags'}</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((tg) => (
                <span
                  key={tg}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/12 border border-teal-500/30 text-xs font-semibold text-teal-700 dark:text-teal-300"
                >
                  <span>#{tg}</span>
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((x) => x !== tg))}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder={isZh ? '+ 添加标签...' : '+ Add tag...'}
                className="w-28 text-xs rounded-lg border border-neutral-200/80 dark:border-white/10 bg-transparent px-2.5 py-1 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:border-teal-500"
              />
            </div>
            {allExistingTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-neutral-500">
                <span>{isZh ? '常用：' : 'Quick:'}</span>
                {allExistingTags
                  .filter((tg) => !tags.includes(tg))
                  .slice(0, 8)
                  .map((tg) => (
                    <button
                      key={tg}
                      type="button"
                      onClick={() => handleAddTag(tg)}
                      className="px-2 py-0.5 rounded-md border border-neutral-200/70 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
                    >
                      #{tg}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-4 sm:px-5 py-3 border-t border-neutral-200/80 dark:border-white/10 flex items-center justify-between gap-2 shrink-0 bg-neutral-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            {onStartFocus && !event.isCompleted && !event.isWontDo && !event.isInTrash && (
              <button
                type="button"
                onClick={() => {
                  onSave(handleBuildUpdated());
                  onStartFocus(event.id);
                  onClose();
                }}
                className="min-h-[40px] px-3.5 rounded-xl border border-rose-500/35 bg-rose-500/10 hover:bg-rose-500/15 text-xs font-bold text-rose-600 dark:text-rose-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Timer className="w-4 h-4" />
                <span>{isZh ? '开启专注' : 'Focus'}</span>
              </button>
            )}
            {onNavigateToDate && startDate && (
              <button
                type="button"
                onClick={() => {
                  onSave(handleBuildUpdated());
                  onNavigateToDate(startDate);
                  onClose();
                }}
                className="min-h-[40px] px-3 rounded-xl border border-neutral-200/80 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>{isZh ? '日历视图' : 'Calendar'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveAndClose}
            className="min-h-[40px] px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            {isZh ? '保存更新' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
