import {
  CalendarEvent,
  CustomRepeatRule,
  EventCategory,
  HabitItem,
  HabitLogEntry,
  Language,
  PomodoroSession,
  RecurrenceType,
  ReminderOffset,
  SmartFilterRule,
  TaskFolder,
  TaskKind,
  TaskSection,
  TaskTemplate,
} from '../types/calendar';
import { parseDate, toDateString } from './dateUtils';
import { loadTickTickWorkspaceIdb, saveTickTickWorkspaceIdb } from './offlineDb';
import { getCategoryDisplayName } from './storage';

export interface TickTickWorkspaceState {
  folders: TaskFolder[];
  sections: TaskSection[];
  filters: SmartFilterRule[];
  habits: HabitItem[];
  habitLogs: HabitLogEntry[];
  templates: TaskTemplate[];
  showHabitsInToday: boolean;
  updatedAt: number;
}

const STORAGE_KEY = 'smartcal_ticktick_workspace_v1';
export const TICKTICK_UPDATED_EVENT = 'smartcal:ticktick-updated';

export function addDaysToDateStr(dateStr: string, days: number): string {
  const base = parseDate(dateStr || toDateString(new Date()));
  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return toDateString(next);
}

export function getDefaultTickTickState(lang: Language = 'zh-CN'): TickTickWorkspaceState {
  const isZh = lang === 'zh-CN' || lang === 'zh-TW';
  const isTw = lang === 'zh-TW';

  const sections: TaskSection[] = [
    {
      id: 'sec-backlog',
      name: isTw ? '待規劃' : isZh ? '待规划' : 'To Plan',
      sortOrder: 0,
    },
    {
      id: 'sec-progress',
      name: isTw ? '進行中' : isZh ? '进行中' : 'In Progress',
      sortOrder: 1,
    },
    {
      id: 'sec-review',
      name: isTw ? '待驗收' : isZh ? '待验收' : 'Review',
      sortOrder: 2,
    },
  ];

  const folders: TaskFolder[] = [
    {
      id: 'folder-work-life',
      name: isTw ? '核心領域' : isZh ? '核心领域' : 'Core Areas',
      color: '#F57C00',
      categoryIds: ['cat-work', 'cat-personal'],
      sortOrder: 0,
    },
    {
      id: 'folder-life',
      name: isTw ? '生活關懷' : isZh ? '生活关怀' : 'Life & Care',
      color: '#059669',
      categoryIds: ['cat-family', 'cat-health', 'cat-birthday'],
      sortOrder: 1,
    },
  ];

  const filters: SmartFilterRule[] = [
    {
      id: 'filter-deep-focus',
      name: isTw ? '高優先緊急' : isZh ? '高优先紧急' : 'High Priority Focus',
      color: '#E11D48',
      priorities: ['high'],
      dateRange: 'any',
      kind: 'task',
      status: 'active',
    },
    {
      id: 'filter-notes',
      name: isTw ? '靈感與筆記' : isZh ? '灵感与笔记' : 'Notes & Ideas',
      color: '#7C3AED',
      kind: 'note',
      status: 'active',
    },
  ];

  const now = Date.now();
  const habits: HabitItem[] = [
    {
      id: 'habit-water',
      name: isTw ? '喝水補充水分' : isZh ? '每日饮水补充' : 'Drink Water',
      icon: '💧',
      color: '#0284C7',
      timeSlot: 'morning',
      goalType: 'count',
      targetValue: 8,
      unit: isZh ? '杯' : 'cups',
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      createdAt: now,
      quote: isTw ? '保持清醒從補水開始' : isZh ? '保持清醒与活力从补水开始' : 'Stay hydrated and sharp.',
    },
    {
      id: 'habit-reading',
      name: isTw ? '深度閱讀 30 分鐘' : isZh ? '深度阅读与输入' : 'Deep Reading',
      icon: '📖',
      color: '#7C3AED',
      timeSlot: 'night',
      goalType: 'count',
      targetValue: 30,
      unit: isZh ? '分钟' : 'min',
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      createdAt: now,
      quote: isTw ? '每天 30 分鐘沉澱思維' : isZh ? '每天 30 分钟沉淀思绪' : '30 minutes of deliberate reading.',
    },
    {
      id: 'habit-exercise',
      name: isTw ? '運動拉伸或有氧' : isZh ? '运动拉伸 / 有氧训练' : 'Workout & Stretch',
      icon: '🏃',
      color: '#059669',
      timeSlot: 'afternoon',
      goalType: 'checkin',
      targetValue: 1,
      weekdays: [1, 2, 3, 4, 5, 6],
      createdAt: now,
      quote: isTw ? '身體狀態決定專注上限' : isZh ? '身体状态决定专注上限' : 'Movement fuels clarity.',
    },
    {
      id: 'habit-review',
      name: isTw ? '睡前覆盤與明日清單' : isZh ? '睡前复盘与明日清单' : 'Evening Review',
      icon: '🌙',
      color: '#D97706',
      timeSlot: 'night',
      goalType: 'checkin',
      targetValue: 1,
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      createdAt: now,
      quote: isTw ? '清空大腦才能安心入眠' : isZh ? '清空大脑方能安稳入眠' : 'Clear your mind before rest.',
    },
  ];

  const templates: TaskTemplate[] = [
    {
      id: 'tpl-daily-standup',
      name: isTw ? '每日工作推進' : isZh ? '每日核心推进' : 'Daily Focus Sprint',
      title: isTw ? '完成今日最重要的 3 件事' : isZh ? '完成今日核心三件事 (MIT)' : 'Complete Top 3 MITs Today',
      description: isTw ? '先拆解目標再開啟番茄鐘推進。' : isZh ? '优先攻坚高价值产出，减少上下文切换。' : 'Tackle high-impact deliverables first.',
      categoryId: 'cat-work',
      priority: 'high',
      tags: [isZh ? '核心目标' : 'MIT'],
      estimatedPomodoros: 3,
      estimatedMinutes: 75,
      checklist: [
        isZh ? '确定首项攻坚任务并开启专注' : 'Lock in #1 priority deliverable',
        isZh ? '处理重要回复与协同确认' : 'Clear key follow-ups',
        isZh ? '晚间检查进度并归档已完成项' : 'Review & archive completed work',
      ],
      kind: 'task',
      createdAt: now,
    },
    {
      id: 'tpl-weekly-review',
      name: isTw ? '週度覆盤模板' : isZh ? 'GTD 周度复盘' : 'Weekly GTD Review',
      title: isTw ? '本週成果盤點與下週規劃' : isZh ? '本周复盘与下周日程整理' : 'Weekly Review & Next Week Plan',
      categoryId: 'cat-personal',
      priority: 'medium',
      tags: [isZh ? '复盘' : 'Review'],
      estimatedPomodoros: 2,
      estimatedMinutes: 50,
      checklist: [
        isZh ? '清空收集箱未归类事项' : 'Process Inbox to zero',
        isZh ? '检查下周日历与截止提醒' : 'Audit next week calendar & deadlines',
        isZh ? '总结本周耗时最高领域与改进点' : 'Write 3 wins & 1 improvement',
      ],
      kind: 'task',
      createdAt: now,
    },
    {
      id: 'tpl-meeting-note',
      name: isTw ? '會議紀要筆記' : isZh ? '会议纪要与行动项' : 'Meeting Notes & Actions',
      title: isTw ? '會議紀要：' : isZh ? '会议纪要：主题讨论' : 'Meeting Notes: Topic',
      description: isZh
        ? '【参会人】\n【核心结论】\n【待办行动项】'
        : 'Attendees:\nKey Decisions:\nAction Items:',
      categoryId: 'cat-work',
      priority: 'medium',
      tags: [isZh ? '会议' : 'Meeting'],
      estimatedPomodoros: 1,
      estimatedMinutes: 30,
      kind: 'note',
      createdAt: now,
    },
    {
      id: 'tpl-trip-prep',
      name: isTw ? '出行清單' : isZh ? '出行/差旅打包清单' : 'Travel Packing Checklist',
      title: isTw ? '出行準備清單' : isZh ? '出行证件与物品核对' : 'Travel Preparation Checklist',
      categoryId: 'cat-personal',
      priority: 'medium',
      tags: [isZh ? '出行' : 'Travel'],
      estimatedPomodoros: 1,
      estimatedMinutes: 20,
      checklist: [
        isZh ? '身份证件 / 车票 / 登机牌确认' : 'ID, passport & tickets',
        isZh ? '充电器、移动电源与转换插头' : 'Chargers & power bank',
        isZh ? '常备药品与洗漱衣物' : 'Essentials & clothes',
      ],
      kind: 'task',
      createdAt: now,
    },
  ];

  return {
    folders,
    sections,
    filters,
    habits,
    habitLogs: [],
    templates,
    showHabitsInToday: true,
    updatedAt: now,
  };
}

export function loadTickTickState(lang: Language = 'zh-CN'): TickTickWorkspaceState {
  const fallback = getDefaultTickTickState(lang);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveTickTickState(fallback);
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<TickTickWorkspaceState>;
    return {
      folders: Array.isArray(parsed.folders) ? parsed.folders : fallback.folders,
      sections: Array.isArray(parsed.sections) && parsed.sections.length > 0 ? parsed.sections : fallback.sections,
      filters: Array.isArray(parsed.filters) ? parsed.filters : fallback.filters,
      habits: Array.isArray(parsed.habits) ? parsed.habits : fallback.habits,
      habitLogs: Array.isArray(parsed.habitLogs) ? parsed.habitLogs : [],
      templates: Array.isArray(parsed.templates) ? parsed.templates : fallback.templates,
      showHabitsInToday: typeof parsed.showHabitsInToday === 'boolean' ? parsed.showHabitsInToday : true,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return fallback;
  }
}

export function saveTickTickState(state: TickTickWorkspaceState): void {
  const stamped: TickTickWorkspaceState = {
    ...state,
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
  } catch {}
  void saveTickTickWorkspaceIdb(stamped);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TICKTICK_UPDATED_EVENT));
  }
}

export async function hydrateTickTickStateFromIdb(
  current: TickTickWorkspaceState
): Promise<TickTickWorkspaceState | null> {
  const idb = await loadTickTickWorkspaceIdb<TickTickWorkspaceState>();
  if (!idb) return null;
  if ((idb.updatedAt || 0) > (current.updatedAt || 0)) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(idb));
    } catch {}
    return idb;
  }
  return null;
}

// ============================================================================
// Natural Language Quick-Add Parser (滴答清单智能识别)
// ============================================================================

export interface ParsedToken {
  type: 'date' | 'time' | 'priority' | 'tag' | 'repeat' | 'duration' | 'reminder' | 'kind';
  label: string;
}

export interface ParsedNaturalTask {
  title: string;
  startDate: string;
  startTime?: string;
  isAllDay: boolean;
  priority: 'none' | 'low' | 'medium' | 'high';
  tags: string[];
  recurrence: RecurrenceType;
  customRepeatRule?: CustomRepeatRule;
  estimatedMinutes?: number;
  estimatedPomodoros?: number;
  reminder: ReminderOffset;
  kind: TaskKind;
  tokens: ParsedToken[];
}

export function parseNaturalTaskInput(rawInput: string, todayStr: string): ParsedNaturalTask {
  let working = rawInput.trim();
  let startDate = '';
  let startTime: string | undefined;
  let priority: 'none' | 'low' | 'medium' | 'high' = 'none';
  const tags: string[] = [];
  let recurrence: RecurrenceType = 'none';
  let customRepeatRule: CustomRepeatRule | undefined;
  let estimatedMinutes: number | undefined;
  let estimatedPomodoros: number | undefined;
  let reminder: ReminderOffset = 'none';
  let kind: TaskKind = 'task';
  const tokens: ParsedToken[] = [];

  // 1. Note prefix: 笔记: / note:
  const noteMatch = working.match(/^(?:笔记[:：]|隨手記[:：]|随手记[:：]|note:\s*)/i);
  if (noteMatch) {
    kind = 'note';
    working = working.slice(noteMatch[0].length).trim();
    tokens.push({ type: 'kind', label: '笔记' });
  }

  // 2. #Tags
  working = working.replace(/#([A-Za-z0-9_\-\u4e00-\u9fa5]+)/g, (_m, tag) => {
    const clean = String(tag).trim();
    if (clean && !tags.includes(clean)) {
      tags.push(clean);
      tokens.push({ type: 'tag', label: `#${clean}` });
    }
    return ' ';
  });

  // 3. Priorities
  const highMatch = working.match(/(?:^|\s)(?:!!!|!高|!urgent|!high)(?=\s|$)/i);
  const medMatch = working.match(/(?:^|\s)(?:!!|!中|!medium|!med)(?=\s|$)/i);
  const lowMatch = working.match(/(?:^|\s)(?:!低|!low|!(?=\s|$))(?=\s|$)/i);
  if (highMatch) {
    priority = 'high';
    working = working.replace(highMatch[0], ' ');
    tokens.push({ type: 'priority', label: 'P1 高' });
  } else if (medMatch) {
    priority = 'medium';
    working = working.replace(medMatch[0], ' ');
    tokens.push({ type: 'priority', label: 'P2 中' });
  } else if (lowMatch) {
    priority = 'low';
    working = working.replace(lowMatch[0], ' ');
    tokens.push({ type: 'priority', label: 'P3 低' });
  }

  // 4. Reminders (@10m, @30m, @1h, @1d, @准时)
  const remRules: Array<{ regex: RegExp; val: ReminderOffset; label: string }> = [
    { regex: /(?:^|\s)@(?:准时|準時|at)(?=\s|$)/i, val: 'at_time', label: '@准时' },
    { regex: /(?:^|\s)@(?:10m|10分)(?=\s|$)/i, val: '10m', label: '@10m' },
    { regex: /(?:^|\s)@(?:30m|30分)(?=\s|$)/i, val: '30m', label: '@30m' },
    { regex: /(?:^|\s)@(?:1h|1小时|1小時)(?=\s|$)/i, val: '1h', label: '@1h' },
    { regex: /(?:^|\s)@(?:1d|1天|提前1天)(?=\s|$)/i, val: '1d', label: '@1d' },
  ];
  for (const r of remRules) {
    const m = working.match(r.regex);
    if (m) {
      reminder = r.val;
      working = working.replace(m[0], ' ');
      tokens.push({ type: 'reminder', label: r.label });
      break;
    }
  }

  // 5. Duration & Pomodoro count (~45m, ~2h, 2番茄)
  const durMatch = working.match(/~(\d+(?:\.\d+)?)\s*(h|hr|hrs|小时|小時|m|min|mins|分钟|分鐘|分)/i);
  if (durMatch) {
    const rawNum = parseFloat(durMatch[1]);
    const unit = durMatch[2].toLowerCase();
    const mins = unit.startsWith('h') || unit.includes('小') ? Math.round(rawNum * 60) : Math.round(rawNum);
    if (mins > 0) {
      estimatedMinutes = Math.min(480, mins);
      estimatedPomodoros = Math.max(1, Math.round(estimatedMinutes / 25));
      working = working.replace(durMatch[0], ' ');
      tokens.push({ type: 'duration', label: `${estimatedMinutes}m` });
    }
  }
  const pomoMatch = working.match(/(\d+)\s*(?:个?番茄|個?番茄|pomodoros?|pomos?)/i);
  if (pomoMatch) {
    const cnt = Math.max(1, Math.min(12, parseInt(pomoMatch[1], 10)));
    estimatedPomodoros = cnt;
    if (!estimatedMinutes) estimatedMinutes = cnt * 25;
    working = working.replace(pomoMatch[0], ' ');
    tokens.push({ type: 'duration', label: `${cnt}🍅` });
  }

  // 6. Recurrence
  const weekdayRepeat = working.match(/(?:^|\s)(?:每个?工作日|每个?工作日|every weekday|weekdays)(?=\s|$)/i);
  const dailyRepeat = working.match(/(?:^|\s)(?:每天|每日|every day|daily)(?=\s|$)/i);
  const weeklyRepeat = working.match(/(?:^|\s)(?:每周|每週|every week|weekly)(?=\s|$)/i);
  const monthlyRepeat = working.match(/(?:^|\s)(?:每月|every month|monthly)(?=\s|$)/i);
  const yearlyRepeat = working.match(/(?:^|\s)(?:每年|every year|yearly)(?=\s|$)/i);

  if (weekdayRepeat) {
    recurrence = 'weekly';
    customRepeatRule = { freq: 'weekly', interval: 1, byWeekday: [1, 2, 3, 4, 5], repeatBy: 'due' };
    working = working.replace(weekdayRepeat[0], ' ');
    tokens.push({ type: 'repeat', label: '工作日重复' });
  } else if (dailyRepeat) {
    recurrence = 'daily';
    working = working.replace(dailyRepeat[0], ' ');
    tokens.push({ type: 'repeat', label: '每天' });
  } else if (weeklyRepeat) {
    recurrence = 'weekly';
    working = working.replace(weeklyRepeat[0], ' ');
    tokens.push({ type: 'repeat', label: '每周' });
  } else if (monthlyRepeat) {
    recurrence = 'monthly';
    working = working.replace(monthlyRepeat[0], ' ');
    tokens.push({ type: 'repeat', label: '每月' });
  } else if (yearlyRepeat) {
    recurrence = 'yearly';
    working = working.replace(yearlyRepeat[0], ' ');
    tokens.push({ type: 'repeat', label: '每年' });
  }

  // 7. Dates (Chinese + English + ISO/MD)
  const todayBase = parseDate(todayStr);
  const datePatterns: Array<{ regex: RegExp; resolve: (m: RegExpMatchArray) => string | null }> = [
    { regex: /(?:^|\s)(?:今天|今日|today)(?=\s|$)/i, resolve: () => todayStr },
    { regex: /(?:^|\s)(?:明天|明日|tomorrow)(?=\s|$)/i, resolve: () => addDaysToDateStr(todayStr, 1) },
    { regex: /(?:^|\s)(?:后天|後天)(?=\s|$)/i, resolve: () => addDaysToDateStr(todayStr, 2) },
    { regex: /(?:^|\s)(?:大后天|大後天)(?=\s|$)/i, resolve: () => addDaysToDateStr(todayStr, 3) },
    {
      regex: /(?:^|\s)(?:下周|下週|本周|本週|这周|這週)(一|二|三|四|五|六|日|天)(?=\s|$)/,
      resolve: (m) => {
        const charMap: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 0, 天: 0 };
        const targetWd = charMap[m[1]];
        if (targetWd === undefined) return null;
        const isNextWeek = /下/.test(m[0]);
        const curWd = todayBase.getDay();
        const normCur = curWd === 0 ? 7 : curWd;
        const normTarget = targetWd === 0 ? 7 : targetWd;
        let offset = normTarget - normCur;
        if (isNextWeek) offset += 7;
        else if (offset < 0) offset += 7;
        return addDaysToDateStr(todayStr, offset);
      },
    },
    {
      regex: /(?:^|\s)(\d{4})-(\d{1,2})-(\d{1,2})(?=\s|$)/,
      resolve: (m) => {
        const mm = String(parseInt(m[2], 10)).padStart(2, '0');
        const dd = String(parseInt(m[3], 10)).padStart(2, '0');
        return `${m[1]}-${mm}-${dd}`;
      },
    },
    {
      regex: /(?:^|\s)(\d{1,2})月(\d{1,2})[日号號]?(?=\s|$)/,
      resolve: (m) => {
        const mo = parseInt(m[1], 10);
        const da = parseInt(m[2], 10);
        if (mo < 1 || mo > 12 || da < 1 || da > 31) return null;
        let yr = todayBase.getFullYear();
        const candidate = `${yr}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
        if (candidate < todayStr) yr += 1;
        return `${yr}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
      },
    },
  ];

  for (const dp of datePatterns) {
    const m = working.match(dp.regex);
    if (m) {
      const resolved = dp.resolve(m);
      if (resolved) {
        startDate = resolved;
        working = working.replace(m[0], ' ');
        tokens.push({ type: 'date', label: resolved });
        break;
      }
    }
  }

  // 8. Times: HH:mm or 上午/下午/晚上 X点(半/Y分) or 3pm
  const cnTimeMatch = working.match(
    /(?:^|\s)(早上|上午|中午|下午|晚上|凌晨)?\s*(\d{1,2})[点點:：](\d{1,2}|半)?(?:分)?(?=\s|$)/
  );
  if (cnTimeMatch) {
    const period = cnTimeMatch[1] || '';
    let hh = parseInt(cnTimeMatch[2], 10);
    const minToken = cnTimeMatch[3];
    const mm = minToken === '半' ? 30 : minToken ? parseInt(minToken, 10) : 0;
    if ((period === '下午' || period === '晚上') && hh < 12) hh += 12;
    else if (period === '中午' && hh < 11) hh += 12;
    else if ((period === '上午' || period === '早上' || period === '凌晨') && hh === 12) hh = 0;
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
      startTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      working = working.replace(cnTimeMatch[0], ' ');
      tokens.push({ type: 'time', label: startTime });
    }
  } else {
    const enTimeMatch = working.match(/(?:^|\s)(\d{1,2})(?::(\d{2}))?\s*(am|pm)(?=\s|$)/i);
    if (enTimeMatch) {
      let hh = parseInt(enTimeMatch[1], 10);
      const mm = enTimeMatch[2] ? parseInt(enTimeMatch[2], 10) : 0;
      const ap = enTimeMatch[3].toLowerCase();
      if (ap === 'pm' && hh < 12) hh += 12;
      if (ap === 'am' && hh === 12) hh = 0;
      if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
        startTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        working = working.replace(enTimeMatch[0], ' ');
        tokens.push({ type: 'time', label: startTime });
      }
    }
  }

  // If a time or recurrence was extracted without a date, anchor to today
  if (!startDate && (startTime || recurrence !== 'none')) {
    startDate = todayStr;
    tokens.push({ type: 'date', label: todayStr });
  }

  const cleanedTitle = working.replace(/\s+/g, ' ').trim() || rawInput.trim();

  return {
    title: cleanedTitle,
    startDate,
    startTime,
    isAllDay: !startTime,
    priority,
    tags,
    recurrence,
    customRepeatRule,
    estimatedMinutes,
    estimatedPomodoros,
    reminder,
    kind,
    tokens,
  };
}

// ============================================================================
// Recurring Task Completion Advancement (支持按完成时间重复 / 自定义周期)
// ============================================================================

export function computeNextOccurrenceDate(
  evt: CalendarEvent,
  todayStr: string
): string | null {
  const rule = evt.customRepeatRule;
  const freq = rule?.freq || (evt.recurrence !== 'none' ? evt.recurrence : null);
  if (!freq) return null;

  const interval = Math.max(1, rule?.interval || 1);
  const anchorStr =
    rule?.repeatBy === 'completion'
      ? todayStr
      : evt.startDate && evt.startDate >= todayStr
      ? evt.startDate
      : evt.startDate || todayStr;
  const anchor = parseDate(anchorStr);

  let nextStr = anchorStr;
  if (freq === 'daily') {
    const next = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + interval);
    nextStr = toDateString(next);
  } else if (freq === 'weekly') {
    const weekdays = rule?.byWeekday && rule.byWeekday.length > 0 ? [...rule.byWeekday].sort((a, b) => a - b) : null;
    if (weekdays && weekdays.length > 0 && rule?.repeatBy !== 'completion') {
      // Find next matching weekday after anchor
      for (let offset = 1; offset <= 7 * interval + 7; offset++) {
        const cand = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + offset);
        if (weekdays.includes(cand.getDay())) {
          nextStr = toDateString(cand);
          break;
        }
      }
    } else {
      const next = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 7 * interval);
      nextStr = toDateString(next);
    }
  } else if (freq === 'monthly') {
    const next = new Date(anchor.getFullYear(), anchor.getMonth() + interval, anchor.getDate());
    nextStr = toDateString(next);
  } else if (freq === 'yearly') {
    const next = new Date(anchor.getFullYear() + interval, anchor.getMonth(), anchor.getDate());
    nextStr = toDateString(next);
  }

  if (evt.recurrenceEnd && nextStr > evt.recurrenceEnd) {
    return null;
  }
  return nextStr;
}

/**
 * When a user completes a recurring task:
 * - Creates a completed snapshot entry (so Completed tab & Heatmap track it)
 * - Advances the active recurring task to its next occurrence with reset checklist
 */
export function advanceRecurringTaskOnComplete(
  evt: CalendarEvent,
  todayStr: string
): {
  completedSnapshot?: CalendarEvent;
  updatedEvent: CalendarEvent;
} {
  const now = Date.now();
  const isRecurring = evt.recurrence !== 'none' || Boolean(evt.customRepeatRule);
  if (!isRecurring || evt.isCompleted) {
    const nextCompleted = !evt.isCompleted;
    return {
      updatedEvent: {
        ...evt,
        isCompleted: nextCompleted,
        completedAt: nextCompleted ? now : undefined,
        isWontDo: false,
        updatedAt: now,
      },
    };
  }

  const nextStart = computeNextOccurrenceDate(evt, todayStr);
  if (!nextStart) {
    return {
      updatedEvent: {
        ...evt,
        isCompleted: true,
        completedAt: now,
        isWontDo: false,
        updatedAt: now,
      },
    };
  }

  const spanDays =
    evt.startDate && evt.endDate && evt.endDate > evt.startDate
      ? Math.max(
          0,
          Math.round(
            (parseDate(evt.endDate).getTime() - parseDate(evt.startDate).getTime()) / 86400000
          )
        )
      : 0;
  const nextEnd = spanDays > 0 ? addDaysToDateStr(nextStart, spanDays) : nextStart;

  const completedSnapshot: CalendarEvent = {
    ...evt,
    id: `evt_done_${now}_${Math.random().toString(36).slice(2, 6)}`,
    recurrence: 'none',
    customRepeatRule: undefined,
    isCompleted: true,
    completedAt: now,
    isWontDo: false,
    updatedAt: now,
  };

  const updatedEvent: CalendarEvent = {
    ...evt,
    startDate: nextStart,
    endDate: nextEnd,
    isCompleted: false,
    completedAt: undefined,
    checklist: (evt.checklist || []).map((c) => ({ ...c, completed: false })),
    updatedAt: now,
  };

  return { completedSnapshot, updatedEvent };
}

// ============================================================================
// Smart Filter Evaluation
// ============================================================================

export function matchesSmartFilter(
  evt: CalendarEvent,
  rule: SmartFilterRule,
  todayStr: string,
  tomorrowStr: string,
  next7Str: string
): boolean {
  if (evt.isInTrash) return false;

  const status = rule.status || 'active';
  if (status === 'active' && (evt.isCompleted || evt.isWontDo)) return false;
  if (status === 'completed' && !evt.isCompleted) return false;
  if (status === 'wontdo' && !evt.isWontDo) return false;

  if (rule.kind && rule.kind !== 'all') {
    const k = evt.kind || 'task';
    if (k !== rule.kind) return false;
  }

  if (rule.categoryIds && rule.categoryIds.length > 0) {
    if (!rule.categoryIds.includes(evt.categoryId)) return false;
  }

  if (rule.priorities && rule.priorities.length > 0) {
    const p = evt.priority || 'none';
    if (!rule.priorities.includes(p)) return false;
  }

  if (rule.tags && rule.tags.length > 0) {
    const evtTags = evt.tags || [];
    if (!rule.tags.some((tg) => evtTags.includes(tg))) return false;
  }

  if (rule.dateRange && rule.dateRange !== 'any') {
    const d = evt.startDate || '';
    if (rule.dateRange === 'unscheduled' && d !== '') return false;
    if (rule.dateRange === 'today' && d !== todayStr) return false;
    if (rule.dateRange === 'tomorrow' && d !== tomorrowStr) return false;
    if (rule.dateRange === 'next7' && (!d || d < todayStr || d > next7Str)) return false;
    if (rule.dateRange === 'overdue' && (!d || d >= todayStr)) return false;
  }

  if (rule.keyword && rule.keyword.trim()) {
    const kw = rule.keyword.trim().toLowerCase();
    const text = `${evt.title} ${evt.description || ''} ${(evt.tags || []).join(' ')}`.toLowerCase();
    if (!text.includes(kw)) return false;
  }

  return true;
}

// ============================================================================
// Habit Helpers (打卡习惯引擎)
// ============================================================================

export function isHabitScheduledOnDate(habit: HabitItem, dateStr: string): boolean {
  if (habit.archived) return false;
  const d = parseDate(dateStr);
  return habit.weekdays.includes(d.getDay());
}

export function getHabitLogForDate(
  logs: HabitLogEntry[],
  habitId: string,
  dateStr: string
): HabitLogEntry | undefined {
  return logs.find((l) => l.habitId === habitId && l.date === dateStr);
}

export interface HabitComputedStats {
  currentStreak: number;
  bestStreak: number;
  totalCheckins: number;
  rate30Days: number;
}

export function computeHabitStats(
  habit: HabitItem,
  logs: HabitLogEntry[],
  todayStr: string
): HabitComputedStats {
  const habitLogs = logs.filter((l) => l.habitId === habit.id && l.completed);
  const doneSet = new Set(habitLogs.map((l) => l.date));
  const totalCheckins = doneSet.size;

  // Current streak walking backwards from today (if today isn't scheduled or not yet checked, start from yesterday)
  let currentStreak = 0;
  let started = false;
  for (let i = 0; i < 365; i++) {
    const dStr = addDaysToDateStr(todayStr, -i);
    if (!isHabitScheduledOnDate(habit, dStr)) continue;
    if (doneSet.has(dStr)) {
      currentStreak += 1;
      started = true;
    } else {
      if (i === 0 && !started) {
        // Today not checked yet doesn't break yesterday's active streak
        continue;
      }
      break;
    }
  }

  // Best streak across all sorted dates
  const sortedDates = Array.from(doneSet).sort();
  let bestStreak = currentStreak;
  let running = 0;
  let prevScheduledIdx: string | null = null;
  for (const dStr of sortedDates) {
    if (!prevScheduledIdx) {
      running = 1;
    } else {
      // Check if there was any missed scheduled date strictly between prevScheduledIdx and dStr
      let missed = false;
      for (let step = 1; step <= 14; step++) {
        const probe = addDaysToDateStr(prevScheduledIdx, step);
        if (probe >= dStr) break;
        if (isHabitScheduledOnDate(habit, probe) && !doneSet.has(probe)) {
          missed = true;
          break;
        }
      }
      running = missed ? 1 : running + 1;
    }
    if (running > bestStreak) bestStreak = running;
    prevScheduledIdx = dStr;
  }

  // 30-day completion rate on scheduled days
  let scheduled30 = 0;
  let done30 = 0;
  for (let i = 0; i < 30; i++) {
    const dStr = addDaysToDateStr(todayStr, -i);
    if (isHabitScheduledOnDate(habit, dStr)) {
      scheduled30 += 1;
      if (doneSet.has(dStr)) done30 += 1;
    }
  }
  const rate30Days = scheduled30 > 0 ? Math.round((done30 / scheduled30) * 100) : 0;

  return { currentStreak, bestStreak, totalCheckins, rate30Days };
}

// ============================================================================
// Productivity Analytics & Summary Generator (成就值 / 热力图 / 每日每周总结)
// ============================================================================

export interface HeatmapDayCell {
  date: string;
  tasksCompleted: number;
  habitsDone: number;
  focusMinutes: number;
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface TickTickAnalyticsSummary {
  achievementScore: number;
  completedTotal: number;
  completedThisWeek: number;
  completedToday: number;
  onTimeRate: number;
  overdueCount: number;
  focusMinutes7Days: number;
  habitCheckins7Days: number;
  heatmapWeeks: HeatmapDayCell[][]; // 16 weeks x 7 days
  categoryBreakdown: Array<{ categoryId: string; count: number; percent: number }>;
  weeklyVelocity: Array<{ date: string; label: string; completed: number; focusMinutes: number }>;
}

export function computeTickTickAnalytics(
  events: CalendarEvent[],
  habits: HabitItem[],
  habitLogs: HabitLogEntry[],
  focusSessions: PomodoroSession[],
  todayStr: string
): TickTickAnalyticsSummary {
  const validEvents = events.filter(
    (e) => !e.isInTrash && !e.id.startsWith('evt-acc-') && e.categoryId !== 'cat-expense' && e.categoryId !== 'cat-income'
  );
  const completedEvents = validEvents.filter((e) => e.isCompleted);
  const activeEvents = validEvents.filter((e) => !e.isCompleted && !e.isWontDo);
  const overdueCount = activeEvents.filter((e) => e.startDate && e.startDate < todayStr).length;

  const taskDoneByDate = new Map<string, number>();
  let onTimeNumerator = 0;
  let onTimeDenominator = 0;
  let completedToday = 0;
  let completedThisWeek = 0;
  const weekCutoff = addDaysToDateStr(todayStr, -6);

  completedEvents.forEach((evt) => {
    const doneDateStr = evt.completedAt
      ? toDateString(new Date(evt.completedAt))
      : evt.startDate || todayStr;
    taskDoneByDate.set(doneDateStr, (taskDoneByDate.get(doneDateStr) || 0) + 1);
    if (doneDateStr === todayStr) completedToday += 1;
    if (doneDateStr >= weekCutoff && doneDateStr <= todayStr) completedThisWeek += 1;
    if (evt.startDate) {
      onTimeDenominator += 1;
      if (doneDateStr <= (evt.endDate || evt.startDate)) {
        onTimeNumerator += 1;
      }
    }
  });

  const onTimeRate =
    onTimeDenominator > 0 ? Math.round((onTimeNumerator / onTimeDenominator) * 100) : 100;

  const habitsByDate = new Map<string, number>();
  let habitCheckins7Days = 0;
  habitLogs.forEach((l) => {
    if (!l.completed) return;
    habitsByDate.set(l.date, (habitsByDate.get(l.date) || 0) + 1);
    if (l.date >= weekCutoff && l.date <= todayStr) habitCheckins7Days += 1;
  });

  const focusByDate = new Map<string, number>();
  let focusMinutes7Days = 0;
  let totalFocusMinutes = 0;
  focusSessions.forEach((s) => {
    if (s.mode !== 'work') return;
    const dStr = toDateString(new Date(s.completedAt));
    focusByDate.set(dStr, (focusByDate.get(dStr) || 0) + s.durationMinutes);
    totalFocusMinutes += s.durationMinutes;
    if (dStr >= weekCutoff && dStr <= todayStr) focusMinutes7Days += s.durationMinutes;
  });

  // Real Achievement Score (0..1000) computed exclusively from real data
  const rawScore =
    completedEvents.length * 12 +
    Math.round(totalFocusMinutes * 0.4) +
    habitLogs.filter((l) => l.completed).length * 8 +
    Math.round((onTimeRate / 100) * Math.min(80, completedEvents.length * 4));
  const achievementScore = Math.min(9999, rawScore);

  // Build 16-week (112 days) activity heatmap aligned by weekday
  const todayDate = parseDate(todayStr);
  const startDayOffset = -111;
  const firstDateStr = addDaysToDateStr(todayStr, startDayOffset);
  const firstParsed = parseDate(firstDateStr);
  const padDays = firstParsed.getDay(); // pad so col starts on Sunday
  const gridStartStr = addDaysToDateStr(firstDateStr, -padDays);

  const heatmapWeeks: HeatmapDayCell[][] = [];
  let cursor = gridStartStr;
  for (let w = 0; w < 17; w++) {
    const col: HeatmapDayCell[] = [];
    for (let d = 0; d < 7; d++) {
      if (cursor > todayStr) {
        col.push({
          date: cursor,
          tasksCompleted: 0,
          habitsDone: 0,
          focusMinutes: 0,
          score: 0,
          level: 0,
        });
      } else {
        const tc = taskDoneByDate.get(cursor) || 0;
        const hd = habitsByDate.get(cursor) || 0;
        const fm = focusByDate.get(cursor) || 0;
        const sc = tc * 2 + hd + Math.floor(fm / 25);
        const level: 0 | 1 | 2 | 3 | 4 =
          sc === 0 ? 0 : sc <= 2 ? 1 : sc <= 5 ? 2 : sc <= 9 ? 3 : 4;
        col.push({
          date: cursor,
          tasksCompleted: tc,
          habitsDone: hd,
          focusMinutes: fm,
          score: sc,
          level,
        });
      }
      cursor = addDaysToDateStr(cursor, 1);
    }
    if (col[0].date <= toDateString(todayDate)) {
      heatmapWeeks.push(col);
    }
  }

  // Category breakdown of completed tasks
  const catCounts = new Map<string, number>();
  completedEvents.forEach((e) => {
    const cid = e.categoryId || 'cat-personal';
    catCounts.set(cid, (catCounts.get(cid) || 0) + 1);
  });
  const totalCompletedForCat = Math.max(1, completedEvents.length);
  const categoryBreakdown = Array.from(catCounts.entries())
    .map(([categoryId, count]) => ({
      categoryId,
      count,
      percent: Math.round((count / totalCompletedForCat) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Weekly 7-day velocity
  const weeklyVelocity: Array<{ date: string; label: string; completed: number; focusMinutes: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const dStr = addDaysToDateStr(todayStr, -i);
    weeklyVelocity.push({
      date: dStr,
      label: dStr.slice(5),
      completed: taskDoneByDate.get(dStr) || 0,
      focusMinutes: focusByDate.get(dStr) || 0,
    });
  }

  // Keep active habits used so unused lint doesn't trigger
  void habits;

  return {
    achievementScore,
    completedTotal: completedEvents.length,
    completedThisWeek,
    completedToday,
    onTimeRate,
    overdueCount,
    focusMinutes7Days,
    habitCheckins7Days,
    heatmapWeeks,
    categoryBreakdown,
    weeklyVelocity,
  };
}

export function buildSummaryMarkdown(
  period: 'daily' | 'weekly',
  events: CalendarEvent[],
  habits: HabitItem[],
  habitLogs: HabitLogEntry[],
  focusSessions: PomodoroSession[],
  todayStr: string,
  categories: EventCategory[],
  lang: Language
): string {
  const isZh = lang === 'zh-CN' || lang === 'zh-TW';
  const startRange = period === 'daily' ? todayStr : addDaysToDateStr(todayStr, -6);
  const catMap = new Map(categories.map((c) => [c.id, getCategoryDisplayName(c, lang)]));

  const doneInRange = events.filter((e) => {
    if (e.isInTrash || !e.isCompleted) return false;
    const d = e.completedAt ? toDateString(new Date(e.completedAt)) : e.startDate;
    return d >= startRange && d <= todayStr;
  });

  const pendingUrgent = events.filter(
    (e) =>
      !e.isInTrash &&
      !e.isCompleted &&
      !e.isWontDo &&
      e.kind !== 'note' &&
      (e.priority === 'high' || (e.startDate && e.startDate <= addDaysToDateStr(todayStr, 1)))
  );

  const focusMins = focusSessions
    .filter((s) => {
      if (s.mode !== 'work') return false;
      const d = toDateString(new Date(s.completedAt));
      return d >= startRange && d <= todayStr;
    })
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const habitsSummary = habits
    .filter((h) => !h.archived)
    .map((h) => {
      const doneCnt = habitLogs.filter(
        (l) => l.habitId === h.id && l.completed && l.date >= startRange && l.date <= todayStr
      ).length;
      return `- ${h.icon} ${h.name}: ${doneCnt}${isZh ? ' 次' : 'x'}`;
    })
    .join('\n');

  const header =
    period === 'daily'
      ? isZh
        ? `# 今日工作与生活总结 (${todayStr})`
        : `# Daily Summary (${todayStr})`
      : isZh
      ? `# 本周效率复盘 (${startRange} ~ ${todayStr})`
      : `# Weekly Review (${startRange} ~ ${todayStr})`;

  const doneLines =
    doneInRange.length > 0
      ? doneInRange
          .slice(0, 20)
          .map((e) => `- [x] ${e.title} (${catMap.get(e.categoryId) || ''})`)
          .join('\n')
      : isZh
      ? '- 暂无已完成记录'
      : '- No completed tasks yet';

  const nextLines =
    pendingUrgent.length > 0
      ? pendingUrgent
          .slice(0, 8)
          .map((e) => `- [ ] ${e.title}${e.startDate ? ` (${e.startDate})` : ''}`)
          .join('\n')
      : isZh
      ? '- 暂无紧急待推进事项'
      : '- All clear for now';

  if (isZh) {
    return [
      header,
      '',
      `> 完成待办：${doneInRange.length} 项 ｜ 专注时长：${focusMins} 分钟`,
      '',
      '## 已完成交付',
      doneLines,
      '',
      '## 习惯打卡记录',
      habitsSummary || '- 暂无启用习惯',
      '',
      '## 下一步重点推进',
      nextLines,
    ].join('\n');
  }

  return [
    header,
    '',
    `> Completed: ${doneInRange.length} tasks | Focus: ${focusMins} min`,
    '',
    '## Completed Deliverables',
    doneLines,
    '',
    '## Habit Check-ins',
    habitsSummary || '- No active habits',
    '',
    '## Next Priorities',
    nextLines,
  ].join('\n');
}

// ============================================================================
// TickTick Pro UI Localization Helper
// ============================================================================

export function getTickTickLabels(lang: Language) {
  const isTw = lang === 'zh-TW';
  const isZh = lang === 'zh-CN' || isTw;

  if (isTw) {
    return {
      workspaceTasks: '待辦清單',
      workspaceHabits: '習慣打卡',
      workspaceStats: '統計與總結',
      inbox: '收集箱',
      today: '今天',
      tomorrow: '明天',
      next7: '最近 7 天',
      allTasks: '全部待辦',
      overdue: '已逾期',
      completed: '已完成',
      wontDo: '已放棄',
      trash: '垃圾桶',
      smartLists: '智慧清單',
      customFilters: '自訂篩選',
      foldersAndLists: '資料夾與清單',
      tagsIndex: '標籤索引',
      archives: '歸檔與狀態',
      viewList: '列表',
      viewKanban: '看板',
      viewTimeline: '時間軸',
      viewMatrix: '四象限',
      nlpPlaceholder: '支援自然語言：如「明天下午3點 見客戶 !高 #工作 ~45m @10m 每週」',
      addTask: '新增待辦',
      addNote: '記筆記',
      taskKindTask: '任務',
      taskKindNote: '筆記',
      templatesBtn: '範本庫',
      newList: '新增清單',
      newFolder: '新增資料夾',
      newFilter: '新增篩選',
      newSection: '新增分組',
      emptyTrash: '清空垃圾桶',
      restoreTask: '還原',
      markWontDo: '標記放棄',
      reopenTask: '恢復為進行中',
      saveAsTemplate: '存為範本',
      duplicateTask: '複製一份',
      repeatLabel: '重複週期',
      repeatByDue: '按到期日重複',
      repeatByCompletion: '按完成時間重複',
      remindersMulti: '多重提醒',
      durationPreset: '預估耗時',
      todayHabitsStrip: '今日習慣打卡',
      habitAdd: '新增習慣',
      habitStreak: '連續天數',
      habitBest: '最佳紀錄',
      habitRate30: '30天達成率',
      achievementScore: '成就總分',
      heatmapTitle: '16 週專注與行動熱力圖',
      summaryTitle: '每日 / 每週總結生成器',
      copySummary: '複製 Markdown',
      saveSummaryAsNote: '存為靈感筆記',
      unscheduledTray: '未排程收集箱（點擊一鍵排入日期）',
      groupBy: '分組方式',
      groupSection: '自訂分組',
      groupPriority: '優先級',
      groupDate: '日期時間',
      groupCategory: '所屬清單',
      convertToNote: '轉為筆記',
      convertToTask: '轉為任務',
    };
  }

  if (isZh) {
    return {
      workspaceTasks: '待办清单',
      workspaceHabits: '习惯打卡',
      workspaceStats: '统计与总结',
      inbox: '收集箱',
      today: '今天',
      tomorrow: '明天',
      next7: '最近 7 天',
      allTasks: '全部待办',
      overdue: '已逾期',
      completed: '已完成',
      wontDo: '已放弃',
      trash: '垃圾桶',
      smartLists: '智能清单',
      customFilters: '自定义筛选',
      foldersAndLists: '文件夹与清单',
      tagsIndex: '标签索引',
      archives: '归档与状态',
      viewList: '列表',
      viewKanban: '看板',
      viewTimeline: '时间轴',
      viewMatrix: '四象限',
      nlpPlaceholder: '自然语言速记：如「明天下午3点 见客户 !高 #工作 ~45m @10m 每周」',
      addTask: '添加待办',
      addNote: '随手笔记',
      taskKindTask: '任务',
      taskKindNote: '笔记',
      templatesBtn: '模板库',
      newList: '新建清单',
      newFolder: '新建文件夹',
      newFilter: '新建筛选',
      newSection: '新增分组',
      emptyTrash: '清空垃圾桶',
      restoreTask: '还原',
      markWontDo: '放弃任务',
      reopenTask: '恢复为待办',
      saveAsTemplate: '存为模板',
      duplicateTask: '创建副本',
      repeatLabel: '重复规则',
      repeatByDue: '按到期日重复',
      repeatByCompletion: '按完成时间重复',
      remindersMulti: '多重提醒',
      durationPreset: '预估耗时',
      todayHabitsStrip: '今日习惯打卡',
      habitAdd: '新建习惯',
      habitStreak: '当前连续',
      habitBest: '历史最佳',
      habitRate30: '30天达成率',
      achievementScore: '成就积分',
      heatmapTitle: '16 周行动与专注热力图',
      summaryTitle: '每日 / 每周总结生成器',
      copySummary: '复制 Markdown',
      saveSummaryAsNote: '存为笔记',
      unscheduledTray: '未排程收集箱（点选日期快速排程）',
      groupBy: '分组方式',
      groupSection: '自定义分组',
      groupPriority: '优先级',
      groupDate: '日期阶段',
      groupCategory: '所属清单',
      convertToNote: '转为笔记',
      convertToTask: '转为任务',
    };
  }

  return {
    workspaceTasks: 'Tasks',
    workspaceHabits: 'Habits',
    workspaceStats: 'Stats & Review',
    inbox: 'Inbox',
    today: 'Today',
    tomorrow: 'Tomorrow',
    next7: 'Next 7 Days',
    allTasks: 'All Active',
    overdue: 'Overdue',
    completed: 'Completed',
    wontDo: "Won't Do",
    trash: 'Trash',
    smartLists: 'Smart Lists',
    customFilters: 'Custom Filters',
    foldersAndLists: 'Folders & Lists',
    tagsIndex: 'Tags',
    archives: 'Archives',
    viewList: 'List',
    viewKanban: 'Kanban',
    viewTimeline: 'Timeline',
    viewMatrix: 'Matrix',
    nlpPlaceholder: 'Smart Add: e.g. "Tomorrow 3pm Client sync !high #work ~45m @10m weekly"',
    addTask: 'Add Task',
    addNote: 'Add Note',
    taskKindTask: 'Task',
    taskKindNote: 'Note',
    templatesBtn: 'Templates',
    newList: 'New List',
    newFolder: 'New Folder',
    newFilter: 'New Filter',
    newSection: 'Add Section',
    emptyTrash: 'Empty Trash',
    restoreTask: 'Restore',
    markWontDo: "Won't Do",
    reopenTask: 'Reopen',
    saveAsTemplate: 'Save Template',
    duplicateTask: 'Duplicate',
    repeatLabel: 'Repeat Rule',
    repeatByDue: 'Repeat by Due Date',
    repeatByCompletion: 'Repeat by Completion',
    remindersMulti: 'Multiple Reminders',
    durationPreset: 'Duration',
    todayHabitsStrip: "Today's Habits",
    habitAdd: 'New Habit',
    habitStreak: 'Current Streak',
    habitBest: 'Best Streak',
    habitRate30: '30-Day Rate',
    achievementScore: 'Achievement Score',
    heatmapTitle: '16-Week Activity & Focus Heatmap',
    summaryTitle: 'Daily / Weekly Summary',
    copySummary: 'Copy Markdown',
    saveSummaryAsNote: 'Save as Note',
    unscheduledTray: 'Unscheduled Inbox (Click to schedule)',
    groupBy: 'Group by',
    groupSection: 'Sections',
    groupPriority: 'Priority',
    groupDate: 'Date Bucket',
    groupCategory: 'List',
    convertToNote: 'Convert to Note',
    convertToTask: 'Convert to Task',
  };
}
