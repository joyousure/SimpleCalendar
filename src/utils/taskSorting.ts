import { CalendarEvent } from '../types/calendar';

export type AgendaSortMode = 'smart' | 'deadline' | 'priority';
export type FocusPreferenceMode = 'balanced' | 'quickWins' | 'deepFocus';

export type SmartReasonKey =
  | 'overdue'
  | 'dueSoon'
  | 'highPriority'
  | 'inProgress'
  | 'quickWin'
  | 'deepWork'
  | 'focusAffinity';

export interface SmartTaskEvaluation {
  score: number;
  urgencyScore: number;
  importanceScore: number;
  focusScore: number;
  daysUntilDue: number | null;
  remainingPomodoros: number;
  primaryReason: SmartReasonKey;
}

export interface FocusProfileContext {
  todayStr: string;
  nowMinutes: number;
  focusPreference: FocusPreferenceMode;
  categoryFocusWeights: Record<string, number>; // 0..1 normalized affinity per categoryId
}

const PRIORITY_RANK: Record<'none' | 'low' | 'medium' | 'high', number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

function parseDateDaysDiff(targetDateStr: string, todayStr: string): number | null {
  if (!targetDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) return null;
  const [ty, tm, td] = targetDateStr.split('-').map(Number);
  const [cy, cm, cd] = todayStr.split('-').map(Number);
  const targetUtc = Date.UTC(ty, tm - 1, td);
  const todayUtc = Date.UTC(cy, cm - 1, cd);
  return Math.round((targetUtc - todayUtc) / 86400000);
}

function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return null;
  const [hh, mm] = timeStr.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

/**
 * Computes normalized [0..1] focus affinity per category based on user's completed pomodoros
 * and focus-tracked tasks across the workspace.
 */
export function buildCategoryFocusWeights(events: CalendarEvent[]): Record<string, number> {
  const totals: Record<string, number> = {};
  let maxWeight = 0;

  for (const evt of events) {
    if (evt.isInTrash) continue;
    const completedPomos = evt.completedPomodoros || 0;
    // Completed pomodoros strongly reflect real user focus preference;
    // estimated pomodoros on active tasks provide a gentle secondary signal.
    const signal = completedPomos * 3 + (evt.estimatedPomodoros && evt.estimatedPomodoros > 1 ? 0.5 : 0);
    if (signal <= 0 || !evt.categoryId) continue;
    totals[evt.categoryId] = (totals[evt.categoryId] || 0) + signal;
    if (totals[evt.categoryId] > maxWeight) {
      maxWeight = totals[evt.categoryId];
    }
  }

  if (maxWeight <= 0) return {};

  const normalized: Record<string, number> = {};
  for (const [catId, val] of Object.entries(totals)) {
    normalized[catId] = val / maxWeight;
  }
  return normalized;
}

export function buildFocusProfileContext(
  events: CalendarEvent[],
  todayStr: string,
  focusPreference: FocusPreferenceMode,
  nowDate: Date = new Date()
): FocusProfileContext {
  return {
    todayStr,
    nowMinutes: nowDate.getHours() * 60 + nowDate.getMinutes(),
    focusPreference,
    categoryFocusWeights: buildCategoryFocusWeights(events),
  };
}

/**
 * Evaluates a single task across 3 weighted dimensions:
 * 1. Deadline Urgency (0..50)
 * 2. Importance & Priority (0..40)
 * 3. User Focus Preference & Momentum (0..22)
 */
export function evaluateTaskSmartPriority(
  evt: CalendarEvent,
  ctx: FocusProfileContext
): SmartTaskEvaluation {
  const effectiveDueDate = evt.endDate || evt.startDate || '';
  const daysUntilDue = parseDateDaysDiff(effectiveDueDate, ctx.todayStr);
  const dueTimeMinutes = !evt.isAllDay ? parseTimeToMinutes(evt.endTime || evt.startTime) : null;

  // 1. Deadline Urgency (0..50)
  let urgencyScore = 4; // Base for undated Inbox tasks
  if (daysUntilDue !== null) {
    if (daysUntilDue < 0) {
      // Overdue: 42..50 depending on how many days overdue
      urgencyScore = 42 + Math.min(8, Math.abs(daysUntilDue) * 1.5);
    } else if (daysUntilDue === 0) {
      // Due today: 38..45 depending on remaining minutes today
      urgencyScore = 38;
      if (dueTimeMinutes !== null) {
        const minutesLeft = dueTimeMinutes - ctx.nowMinutes;
        if (minutesLeft <= 0) urgencyScore += 7; // Passed deadline time today
        else if (minutesLeft <= 120) urgencyScore += 6; // Within 2 hours
        else if (minutesLeft <= 360) urgencyScore += 4; // Within 6 hours
        else urgencyScore += 2;
      }
    } else if (daysUntilDue === 1) {
      urgencyScore = 28;
    } else if (daysUntilDue <= 3) {
      urgencyScore = 21 - (daysUntilDue - 2) * 3; // 21 or 18
    } else if (daysUntilDue <= 7) {
      urgencyScore = 14 - (daysUntilDue - 4) * 2; // 14..8
    } else {
      urgencyScore = Math.max(2, 7 - Math.floor((daysUntilDue - 7) / 7));
    }
  }

  // 2. Importance & Priority (0..40)
  const prio = evt.priority || 'none';
  let importanceScore =
    prio === 'high' ? 34 : prio === 'medium' ? 22 : prio === 'low' ? 10 : 2;
  if (evt.isPinned) importanceScore += 6;
  if (evt.reminder && evt.reminder !== 'none') importanceScore += 2;
  importanceScore = Math.min(40, importanceScore);

  // 3. User Focus Preference & Momentum (0..22)
  const estPomos = Math.max(1, evt.estimatedPomodoros || 1);
  const donePomos = Math.max(0, evt.completedPomodoros || 0);
  const remainingPomodoros = Math.max(1, estPomos - donePomos);

  const checklist = evt.checklist || [];
  const doneSubtasks = checklist.filter((item) => item.completed).length;
  const hasChecklistProgress = checklist.length > 0 && doneSubtasks > 0 && doneSubtasks < checklist.length;

  // Focus strategy alignment (0..12)
  let strategyScore = 0;
  if (ctx.focusPreference === 'quickWins') {
    if (remainingPomodoros === 1) strategyScore = 12;
    else if (remainingPomodoros === 2) strategyScore = 7;
    else strategyScore = 2;
  } else if (ctx.focusPreference === 'deepFocus') {
    if (remainingPomodoros >= 3) strategyScore = 12;
    else if (remainingPomodoros === 2) strategyScore = 8;
    else strategyScore = 3;
    if (checklist.length >= 2) strategyScore = Math.min(12, strategyScore + 2);
  } else {
    // Balanced: prefers tasks that are actively focused or neatly scoped (1-3 pomodoros)
    if (remainingPomodoros <= 2) strategyScore = 7;
    else if (remainingPomodoros === 3) strategyScore = 5;
    else strategyScore = 4;
  }

  // Active execution momentum (0..6): already invested pomodoros or partial subtask progress
  let momentumScore = 0;
  if (donePomos > 0 && donePomos < estPomos) momentumScore += 4;
  if (hasChecklistProgress) momentumScore += 2;

  // Historical category focus affinity (0..4)
  const catAffinity = ctx.categoryFocusWeights[evt.categoryId] || 0;
  const affinityScore = Math.round(catAffinity * 4 * 10) / 10;

  const focusScore = Math.min(22, strategyScore + momentumScore + affinityScore);
  const totalScore = Math.round((urgencyScore + importanceScore + focusScore) * 10) / 10;

  // Determine the clearest human-readable primary reason badge
  let primaryReason: SmartReasonKey = 'dueSoon';
  if (daysUntilDue !== null && daysUntilDue < 0) {
    primaryReason = 'overdue';
  } else if (prio === 'high' || evt.isPinned) {
    primaryReason = 'highPriority';
  } else if (daysUntilDue !== null && daysUntilDue <= 1) {
    primaryReason = 'dueSoon';
  } else if (momentumScore >= 4) {
    primaryReason = 'inProgress';
  } else if (ctx.focusPreference === 'quickWins' && remainingPomodoros === 1) {
    primaryReason = 'quickWin';
  } else if (ctx.focusPreference === 'deepFocus' && remainingPomodoros >= 2) {
    primaryReason = 'deepWork';
  } else if (catAffinity >= 0.6) {
    primaryReason = 'focusAffinity';
  }

  return {
    score: totalScore,
    urgencyScore,
    importanceScore,
    focusScore,
    daysUntilDue,
    remainingPomodoros,
    primaryReason,
  };
}

export interface RankedTaskItem {
  event: CalendarEvent;
  evaluation: SmartTaskEvaluation;
}

/**
 * Sorts a task list according to the selected sort mode and user focus preference.
 * Completed tasks always sort by completion timestamp descending.
 */
export function sortAgendaTasks(
  tasks: CalendarEvent[],
  sortMode: AgendaSortMode,
  ctx: FocusProfileContext,
  isCompletedTab: boolean = false
): RankedTaskItem[] {
  if (isCompletedTab) {
    return [...tasks]
      .sort((a, b) => (b.completedAt || b.updatedAt || 0) - (a.completedAt || a.updatedAt || 0))
      .map((event) => ({
        event,
        evaluation: evaluateTaskSmartPriority(event, ctx),
      }));
  }

  const evaluated = tasks.map((event) => ({
    event,
    evaluation: evaluateTaskSmartPriority(event, ctx),
  }));

  evaluated.sort((a, b) => {
    const ea = a.event;
    const eb = b.event;
    const ra = a.evaluation;
    const rb = b.evaluation;

    if (sortMode === 'smart') {
      if (Math.abs(rb.score - ra.score) > 0.01) return rb.score - ra.score;
    } else if (sortMode === 'deadline') {
      const da = ea.endDate || ea.startDate || '9999-12-31';
      const db = eb.endDate || eb.startDate || '9999-12-31';
      if (da !== db) return da.localeCompare(db);
      const ta = ea.startTime || '23:59';
      const tb = eb.startTime || '23:59';
      if (ta !== tb) return ta.localeCompare(tb);
      if (Math.abs(rb.score - ra.score) > 0.01) return rb.score - ra.score;
    } else if (sortMode === 'priority') {
      const pa = PRIORITY_RANK[ea.priority || 'none'];
      const pb = PRIORITY_RANK[eb.priority || 'none'];
      if (pb !== pa) return pb - pa;
      if (Boolean(eb.isPinned) !== Boolean(ea.isPinned)) return eb.isPinned ? 1 : -1;
      if (Math.abs(rb.score - ra.score) > 0.01) return rb.score - ra.score;
    }

    // Deterministic tie-breakers
    const dateA = ea.endDate || ea.startDate || '9999-12-31';
    const dateB = eb.endDate || eb.startDate || '9999-12-31';
    if (dateA !== dateB) return dateA.localeCompare(dateB);

    const prioDiff = PRIORITY_RANK[eb.priority || 'none'] - PRIORITY_RANK[ea.priority || 'none'];
    if (prioDiff !== 0) return prioDiff;

    const timeA = ea.startTime || '23:59';
    const timeB = eb.startTime || '23:59';
    if (timeA !== timeB) return timeA.localeCompare(timeB);

    return (b.event.createdAt || 0) - (a.event.createdAt || 0);
  });

  return evaluated;
}
