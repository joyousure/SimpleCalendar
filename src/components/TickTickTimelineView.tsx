import React, { useState, useMemo } from 'react';
import {
  CalendarEvent,
  EventCategory,
  Language,
  TaskSection,
} from '../types/calendar';
import { addDaysToDateStr, getTickTickLabels } from '../utils/ticktickEngine';
import { getCategoryDisplayName } from '../utils/storage';
import { parseDate } from '../utils/dateUtils';
import {
  CheckCircle2,
  Circle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  ArrowUpRight,
  Inbox,
  Trash2,
  MoveRight,
} from 'lucide-react';

export type KanbanGroupMode = 'section' | 'priority' | 'date' | 'category';

interface TickTickKanbanBoardProps {
  tasks: CalendarEvent[];
  categories: EventCategory[];
  sections: TaskSection[];
  language: Language;
  todayStr: string;
  tomorrowStr: string;
  groupBy: KanbanGroupMode;
  onChangeGroupBy: (mode: KanbanGroupMode) => void;
  onAddSection: (name: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveTask: (taskId: string, patch: Partial<CalendarEvent>) => void;
  onToggleComplete: (evt: CalendarEvent) => void;
  onInspectTask: (evt: CalendarEvent) => void;
  onQuickAddInColumn: (title: string, patch: Partial<CalendarEvent>) => void;
}

export const TickTickKanbanBoard: React.FC<TickTickKanbanBoardProps> = ({
  tasks,
  categories,
  sections,
  language,
  todayStr,
  tomorrowStr,
  groupBy,
  onChangeGroupBy,
  onAddSection,
  onDeleteSection,
  onMoveTask,
  onToggleComplete,
  onInspectTask,
  onQuickAddInColumn,
}) => {
  const tt = getTickTickLabels(language);
  const isZh = language === 'zh-CN' || language === 'zh-TW';

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [columnInputs, setColumnInputs] = useState<Record<string, string>>({});
  const [mobileMoveTaskId, setMobileMoveTaskId] = useState<string | null>(null);

  const catMap = useMemo(() => {
    const m = new Map<string, EventCategory>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  interface KanbanColumn {
    id: string;
    title: string;
    accentColor?: string;
    deletableSectionId?: string;
    patchOnDrop: Partial<CalendarEvent>;
    items: CalendarEvent[];
  }

  const columns: KanbanColumn[] = useMemo(() => {
    if (groupBy === 'section') {
      const cols: KanbanColumn[] = [
        {
          id: 'sec-none',
          title: isZh ? '未分组' : 'Unsectioned',
          patchOnDrop: { sectionId: undefined },
          items: tasks.filter((t) => !t.sectionId || !sections.some((s) => s.id === t.sectionId)),
        },
        ...sections.map((sec) => ({
          id: sec.id,
          title: sec.name,
          deletableSectionId: sec.id,
          patchOnDrop: { sectionId: sec.id },
          items: tasks.filter((t) => t.sectionId === sec.id),
        })),
      ];
      return cols;
    }

    if (groupBy === 'priority') {
      const defs: Array<{ id: 'high' | 'medium' | 'low' | 'none'; title: string; color: string }> = [
        { id: 'high', title: isZh ? 'P1 高优先级' : 'P1 High', color: '#E11D48' },
        { id: 'medium', title: isZh ? 'P2 中优先级' : 'P2 Medium', color: '#D97706' },
        { id: 'low', title: isZh ? 'P3 低优先级' : 'P3 Low', color: '#2563EB' },
        { id: 'none', title: isZh ? '无优先级' : 'No Priority', color: '#64748B' },
      ];
      return defs.map((d) => ({
        id: `prio-${d.id}`,
        title: d.title,
        accentColor: d.color,
        patchOnDrop: { priority: d.id },
        items: tasks.filter((t) => (t.priority || 'none') === d.id),
      }));
    }

    if (groupBy === 'date') {
      return [
        {
          id: 'date-inbox',
          title: isZh ? '待排期 / 收集箱' : 'Unscheduled',
          patchOnDrop: { startDate: '', endDate: '' },
          items: tasks.filter((t) => !t.startDate),
        },
        {
          id: 'date-overdue',
          title: isZh ? '已逾期' : 'Overdue',
          accentColor: '#E11D48',
          patchOnDrop: { startDate: todayStr, endDate: todayStr },
          items: tasks.filter((t) => t.startDate && t.startDate < todayStr),
        },
        {
          id: 'date-today',
          title: tt.today,
          accentColor: '#F57C00',
          patchOnDrop: { startDate: todayStr, endDate: todayStr },
          items: tasks.filter((t) => t.startDate === todayStr),
        },
        {
          id: 'date-tomorrow',
          title: tt.tomorrow,
          accentColor: '#2563EB',
          patchOnDrop: { startDate: tomorrowStr, endDate: tomorrowStr },
          items: tasks.filter((t) => t.startDate === tomorrowStr),
        },
        {
          id: 'date-later',
          title: isZh ? '未来日程' : 'Upcoming',
          patchOnDrop: { startDate: addDaysToDateStr(todayStr, 2), endDate: addDaysToDateStr(todayStr, 2) },
          items: tasks.filter((t) => t.startDate && t.startDate > tomorrowStr),
        },
      ];
    }

    // Group by category / list
    return categories.map((cat) => ({
      id: `cat-${cat.id}`,
      title: getCategoryDisplayName(cat, language),
      accentColor: cat.color,
      patchOnDrop: { categoryId: cat.id },
      items: tasks.filter((t) => t.categoryId === cat.id),
    }));
  }, [groupBy, tasks, sections, categories, language, todayStr, tomorrowStr, tt.today, tt.tomorrow, isZh]);

  const handleDropOnColumn = (col: KanbanColumn) => {
    if (!draggedTaskId) return;
    onMoveTask(draggedTaskId, col.patchOnDrop);
    setDraggedTaskId(null);
    setDragOverColId(null);
  };

  return (
    <div className="space-y-3">
      {/* Kanban Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {tt.groupBy}:
          </span>
          {(
            [
              { id: 'section', label: tt.groupSection },
              { id: 'priority', label: tt.groupPriority },
              { id: 'date', label: tt.groupDate },
              { id: 'category', label: tt.groupCategory },
            ] as const
          ).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onChangeGroupBy(g.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                groupBy === g.id
                  ? 'bg-orange-500/12 border-orange-500/40 text-orange-600 dark:text-orange-300'
                  : 'border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {groupBy === 'section' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newSectionName.trim()) return;
              onAddSection(newSectionName.trim());
              setNewSectionName('');
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder={isZh ? '+ 新增分组名称' : '+ New section'}
              className="w-36 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              {tt.newSection}
            </button>
          </form>
        )}
      </div>

      {/* Horizontal Columns */}
      <div className="flex gap-3.5 overflow-x-auto pb-4 items-start">
        {columns.map((col) => {
          const isDropTarget = dragOverColId === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColId(col.id);
              }}
              onDragLeave={() => {
                if (dragOverColId === col.id) setDragOverColId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDropOnColumn(col);
              }}
              className={`w-[288px] sm:w-[304px] shrink-0 rounded-3xl border p-3.5 transition-colors flex flex-col gap-2.5 ${
                isDropTarget
                  ? 'border-orange-500 bg-orange-500/[0.05]'
                  : 'border-neutral-200/80 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 [.amoled-mode_&]:bg-neutral-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2 min-w-0">
                  {col.accentColor && (
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: col.accentColor }}
                    />
                  )}
                  <h4 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100 truncate">
                    {col.title}
                  </h4>
                  <span className="text-xs font-bold text-neutral-400 tabular-nums shrink-0">
                    {col.items.length}
                  </span>
                </div>
                {col.deletableSectionId && (
                  <button
                    type="button"
                    onClick={() => onDeleteSection(col.deletableSectionId!)}
                    title={isZh ? '删除分组' : 'Delete Section'}
                    className="p-1 rounded-lg text-neutral-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Cards */}
              <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-0.5">
                {col.items.map((evt) => {
                  const cat = catMap.get(evt.categoryId);
                  const checklistTotal = evt.checklist?.length || 0;
                  const checklistDone = evt.checklist?.filter((c) => c.completed).length || 0;
                  const isMobileMoveOpen = mobileMoveTaskId === evt.id;

                  return (
                    <div
                      key={evt.id}
                      draggable
                      onDragStart={() => setDraggedTaskId(evt.id)}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDragOverColId(null);
                      }}
                      className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.03] p-3 space-y-2 hover:border-orange-500/40 transition-colors cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleComplete(evt)}
                          className="mt-0.5 text-neutral-400 hover:text-orange-500 shrink-0 cursor-pointer"
                        >
                          {evt.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onInspectTask(evt)}
                          className={`flex-1 text-left text-xs sm:text-sm font-semibold leading-snug cursor-pointer ${
                            evt.isCompleted
                              ? 'line-through text-neutral-400'
                              : 'text-neutral-900 dark:text-neutral-100'
                          }`}
                        >
                          {evt.kind === 'note' ? '📝 ' : ''}
                          {evt.title}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 tabular-nums">
                        <div className="truncate">
                          {[
                            cat ? getCategoryDisplayName(cat, language) : null,
                            evt.startDate || null,
                            checklistTotal > 0 ? `${checklistDone}/${checklistTotal}` : null,
                            evt.estimatedMinutes ? `${evt.estimatedMinutes}m` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setMobileMoveTaskId((curr) => (curr === evt.id ? null : evt.id))
                          }
                          title={isZh ? '移动到其他列' : 'Move to column'}
                          className="p-1 rounded-lg hover:bg-neutral-200/70 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 shrink-0 cursor-pointer"
                        >
                          <MoveRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isMobileMoveOpen && (
                        <div className="pt-1.5 border-t border-neutral-200/70 dark:border-white/10 flex flex-wrap gap-1">
                          {columns
                            .filter((targetCol) => targetCol.id !== col.id)
                            .map((targetCol) => (
                              <button
                                key={targetCol.id}
                                type="button"
                                onClick={() => {
                                  onMoveTask(evt.id, targetCol.patchOnDrop);
                                  setMobileMoveTaskId(null);
                                }}
                                className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 hover:border-orange-500 cursor-pointer"
                              >
                                → {targetCol.title}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Add Inside Column */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = (columnInputs[col.id] || '').trim();
                  if (!val) return;
                  onQuickAddInColumn(val, col.patchOnDrop);
                  setColumnInputs((prev) => ({ ...prev, [col.id]: '' }));
                }}
                className="flex items-center gap-1.5 pt-1"
              >
                <input
                  type="text"
                  value={columnInputs[col.id] || ''}
                  onChange={(e) =>
                    setColumnInputs((prev) => ({ ...prev, [col.id]: e.target.value }))
                  }
                  placeholder={isZh ? '+ 添加卡片...' : '+ Add card...'}
                  className="flex-1 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-white/5 px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-xl bg-neutral-100 dark:bg-white/10 hover:bg-orange-500 hover:text-white text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// TickTick Pro 7-Day Timebox Timeline Scheduler
// ============================================================================

interface TickTickTimelineViewProps {
  tasks: CalendarEvent[];
  categories: EventCategory[];
  language: Language;
  todayStr: string;
  onScheduleTask: (taskId: string, dateStr: string, startTime?: string, estimatedMinutes?: number) => void;
  onUnscheduleTask: (taskId: string) => void;
  onToggleComplete: (evt: CalendarEvent) => void;
  onInspectTask: (evt: CalendarEvent) => void;
  onNavigateToDate?: (dateStr: string) => void;
}

export const TickTickTimelineView: React.FC<TickTickTimelineViewProps> = ({
  tasks,
  categories,
  language,
  todayStr,
  onScheduleTask,
  onUnscheduleTask,
  onToggleComplete,
  onInspectTask,
  onNavigateToDate,
}) => {
  const tt = getTickTickLabels(language);
  const isZh = language === 'zh-CN' || language === 'zh-TW';

  const [weekAnchorStr, setWeekAnchorStr] = useState(todayStr);
  const [selectedSlotDate, setSelectedSlotDate] = useState(todayStr);
  const [selectedSlotHour, setSelectedSlotHour] = useState('09:00');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const catMap = useMemo(() => {
    const m = new Map<string, EventCategory>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const sevenDays = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const dStr = addDaysToDateStr(weekAnchorStr, i);
        const dObj = parseDate(dStr);
        const weekdayNames = isZh
          ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
          : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return {
          dateStr: dStr,
          dayNum: dStr.slice(8),
          monthDay: dStr.slice(5),
          weekday: weekdayNames[dObj.getDay()],
          isToday: dStr === todayStr,
        };
      }),
    [weekAnchorStr, todayStr, isZh]
  );

  const unscheduledTasks = useMemo(
    () => tasks.filter((t) => !t.isCompleted && !t.isWontDo && !t.startDate),
    [tasks]
  );

  const scheduledCountForDay = (dStr: string) =>
    tasks.filter((t) => !t.isWontDo && t.startDate === dStr);

  return (
    <div className="space-y-4">
      {/* Timeline Controls */}
      <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-neutral-200/80 dark:border-white/10 p-0.5 bg-neutral-50/70 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setWeekAnchorStr((d) => addDaysToDateStr(d, -7))}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setWeekAnchorStr(todayStr);
                setSelectedSlotDate(todayStr);
              }}
              className="px-3 py-1 text-xs font-bold tabular-nums cursor-pointer"
            >
              {sevenDays[0].monthDay} ~ {sevenDays[6].monthDay}
            </button>
            <button
              type="button"
              onClick={() => setWeekAnchorStr((d) => addDaysToDateStr(d, 7))}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:inline">
            {isZh
              ? '拖拽下方未排程任务到任意日期列，或直接点选时间排期'
              : 'Drag unscheduled tasks onto any day or tap to timebox'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-neutral-500">{isZh ? '快速排期目标:' : 'Target:'}</span>
          <input
            type="date"
            value={selectedSlotDate}
            onChange={(e) => setSelectedSlotDate(e.target.value)}
            className="rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-white/5 px-2.5 py-1 text-xs tabular-nums"
          />
          <input
            type="time"
            value={selectedSlotHour}
            onChange={(e) => setSelectedSlotHour(e.target.value)}
            className="rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-white/5 px-2 py-1 text-xs tabular-nums"
          />
        </div>
      </div>

      {/* 7-Day Horizontal Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
        {sevenDays.map((day) => {
          const dayItems = scheduledCountForDay(day.dateStr).sort((a, b) =>
            (a.startTime || '23:59').localeCompare(b.startTime || '23:59')
          );
          const totalMinutes = dayItems.reduce(
            (sum, item) => sum + (item.estimatedMinutes || (item.estimatedPomodoros || 1) * 25),
            0
          );

          return (
            <div
              key={day.dateStr}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedTaskId) {
                  onScheduleTask(draggedTaskId, day.dateStr, selectedSlotHour, 45);
                  setDraggedTaskId(null);
                }
              }}
              className={`rounded-3xl border p-3 flex flex-col gap-2.5 min-h-[220px] ${
                day.isToday
                  ? 'border-orange-500/60 bg-orange-500/[0.03]'
                  : 'border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950'
              }`}
            >
              <div className="flex items-center justify-between gap-1 pb-2 border-b border-neutral-200/70 dark:border-white/10">
                <div>
                  <div className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {day.weekday} · {day.monthDay}
                  </div>
                  <div className="text-[11px] text-neutral-400 tabular-nums">
                    {dayItems.length} {isZh ? '项' : 'tasks'} · {totalMinutes}m
                  </div>
                </div>
                {onNavigateToDate && (
                  <button
                    type="button"
                    onClick={() => onNavigateToDate(day.dateStr)}
                    title={isZh ? '打开日历当日视图' : 'Open in Calendar'}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-orange-500 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-2">
                {dayItems.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-neutral-400">
                    {isZh ? '空闲时段' : 'Open slot'}
                  </div>
                ) : (
                  dayItems.map((evt) => {
                    const cat = catMap.get(evt.categoryId);
                    const dur = evt.estimatedMinutes || (evt.estimatedPomodoros || 1) * 25;
                    return (
                      <div
                        key={evt.id}
                        draggable
                        onDragStart={() => setDraggedTaskId(evt.id)}
                        onDragEnd={() => setDraggedTaskId(null)}
                        className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.03] p-2.5 space-y-1.5 cursor-grab"
                      >
                        <div className="flex items-start gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleComplete(evt)}
                            className="mt-0.5 text-neutral-400 hover:text-orange-500 shrink-0 cursor-pointer"
                          >
                            {evt.isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onInspectTask(evt)}
                            className={`flex-1 text-left text-xs font-bold leading-snug cursor-pointer ${
                              evt.isCompleted
                                ? 'line-through text-neutral-400'
                                : 'text-neutral-900 dark:text-neutral-100'
                            }`}
                          >
                            {evt.title}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-neutral-500 tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat?.color || '#F57C00' }}
                            />
                            {evt.startTime || (isZh ? '全天' : 'All day')} · {dur}m
                          </span>
                          <button
                            type="button"
                            onClick={() => onUnscheduleTask(evt.id)}
                            title={isZh ? '移回收集箱' : 'Return to Inbox'}
                            className="text-neutral-400 hover:text-rose-500 cursor-pointer"
                          >
                            {isZh ? '撤回' : 'Unset'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unscheduled Inbox Tray */}
      <div className="rounded-3xl bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-neutral-950 border border-neutral-200/80 dark:border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Inbox className="w-4 h-4 text-orange-500" />
            <span>{tt.unscheduledTray}</span>
            <span className="text-neutral-400 tabular-nums">({unscheduledTasks.length})</span>
          </h3>
        </div>

        {unscheduledTasks.length === 0 ? (
          <p className="text-xs text-neutral-400 py-3">
            {isZh ? '所有任务均已安排日期，收集箱已清空。' : 'Inbox tasks are all scheduled!'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {unscheduledTasks.map((evt) => (
              <div
                key={evt.id}
                draggable
                onDragStart={() => setDraggedTaskId(evt.id)}
                onDragEnd={() => setDraggedTaskId(null)}
                className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.03] p-3 flex items-center justify-between gap-2 cursor-grab"
              >
                <button
                  type="button"
                  onClick={() => onInspectTask(evt)}
                  className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate text-left flex-1 cursor-pointer"
                >
                  {evt.title}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onScheduleTask(
                      evt.id,
                      selectedSlotDate,
                      selectedSlotHour,
                      evt.estimatedMinutes || 30
                    )
                  }
                  className="px-2.5 py-1 rounded-xl bg-orange-500/12 hover:bg-orange-500 hover:text-white text-orange-600 dark:text-orange-300 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Calendar className="w-3 h-3" />
                  <Clock className="w-3 h-3" />
                  <span>{selectedSlotDate.slice(5)}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
