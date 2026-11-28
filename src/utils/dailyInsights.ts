import { Language, ViewMode } from '../types/calendar';

export type InsightContextTag =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'busy'
  | 'light'
  | 'monday'
  | 'friday'
  | 'weekend'
  | 'focus'
  | 'general';

interface LocalizedCopy {
  zhCN: string;
  zhTW: string;
  en: string;
}

export interface OfflineInsightEntry {
  id: string;
  contexts: InsightContextTag[];
  category: LocalizedCopy;
  text: LocalizedCopy;
  source: LocalizedCopy;
}

export interface ResolvedDailyInsight {
  id: string;
  category: string;
  text: string;
  source: string;
  contextSummary: string;
  index: number;
  total: number;
}

/**
 * Strictly offline-only curated library of context-aware productivity tips and reflections.
 * Zero network calls, zero external assets.
 */
export const OFFLINE_INSIGHTS_LIBRARY: OfflineInsightEntry[] = [
  {
    id: 'morn-1',
    contexts: ['morning', 'monday', 'focus'],
    category: { zhCN: '晨间启动', zhTW: '晨間啟動', en: 'Morning Kickoff' },
    text: {
      zhCN: '在打开消息和邮件前，先用 20 分钟推进今天最重要的一件事。',
      zhTW: '在打開訊息和郵件前，先用 20 分鐘推進今天最重要的一件事。',
      en: 'Spend your first 20 minutes on your single highest-leverage task before checking messages.',
    },
    source: { zhCN: '日程节律原则', zhTW: '日程節律原則', en: 'Priority First' },
  },
  {
    id: 'morn-2',
    contexts: ['morning', 'busy'],
    category: { zhCN: '精力分配', zhTW: '精力分配', en: 'Energy Routing' },
    text: {
      zhCN: '今天安排紧凑，建议为高难度事项锁定上午连续的 60 分钟免打扰时段。',
      zhTW: '今天安排緊湊，建議為高難度事項鎖定上午連續的 60 分鐘免打擾時段。',
      en: 'With a full schedule ahead, protect one uninterrupted 60-minute block this morning for deep thinking.',
    },
    source: { zhCN: '时间块管理', zhTW: '時間塊管理', en: 'Time Blocking' },
  },
  {
    id: 'morn-3',
    contexts: ['morning', 'light'],
    category: { zhCN: '留白规划', zhTW: '留白規劃', en: 'Open Horizon' },
    text: {
      zhCN: '今日日程较为宽松，趁精力充沛时攻克一项拖延已久的关键目标。',
      zhTW: '今日日程較為寬鬆，趁精力充沛時攻克一項拖延已久的關鍵目標。',
      en: 'An open calendar gives you rare momentum—use this fresh morning to move a postponed milestone forward.',
    },
    source: { zhCN: '深度工作法', zhTW: '深度工作法', en: 'Deep Work' },
  },
  {
    id: 'aft-1',
    contexts: ['afternoon', 'busy'],
    category: { zhCN: '午后续航', zhTW: '午後續航', en: 'Afternoon Reset' },
    text: {
      zhCN: '连续日程之间保留 5 分钟起身走动与补水，比硬撑更能维持决策质量。',
      zhTW: '連續日程之間保留 5 分鐘起身走動與補水，比硬撐更能維持決策品質。',
      en: 'A 5-minute walk and water break between back-to-back items preserves clarity better than pushing straight through.',
    },
    source: { zhCN: '认知恢复法则', zhTW: '認知恢復法則', en: 'Ultradian Rhythm' },
  },
  {
    id: 'aft-2',
    contexts: ['afternoon', 'focus'],
    category: { zhCN: '单线程执行', zhTW: '單線程執行', en: 'Single-Tasking' },
    text: {
      zhCN: '午后精力易分散，将待办收窄到“只做眼前这一项”，配合 25 分钟番茄钟推进。',
      zhTW: '午後精力易分散，將待辦收窄到「只做眼前這一項」，配合 25 分鐘蕃茄鐘推進。',
      en: 'Counter afternoon drift by narrowing focus to a single active task for one 25-minute sprint.',
    },
    source: { zhCN: '专注力练习', zhTW: '專注力練習', en: 'Monotasking' },
  },
  {
    id: 'aft-3',
    contexts: ['afternoon', 'light'],
    category: { zhCN: '批量清理', zhTW: '批量清理', en: 'Batch Processing' },
    text: {
      zhCN: '用下午 15 分钟集中回复琐碎消息与整理收件箱，把完整时段留给创造性工作。',
      zhTW: '用下午 15 分鐘集中回覆瑣碎訊息與整理收件匣，把完整時段留給創造性工作。',
      en: 'Batch small replies and quick admin into one 15-minute window so your longer blocks stay intact.',
    },
    source: { zhCN: '高效事务管理', zhTW: '高效事務管理', en: 'Task Batching' },
  },
  {
    id: 'eve-1',
    contexts: ['evening', 'general'],
    category: { zhCN: '晚间复盘', zhTW: '晚間複盤', en: 'Evening Shutdown' },
    text: {
      zhCN: '睡前写下明天最关键的 3 项安排并关闭提醒，让大脑在夜晚彻底切换回休息模式。',
      zhTW: '睡前寫下明天最關鍵的 3 項安排並關閉提醒，讓大腦在夜晚徹底切換回休息模式。',
      en: 'Capture your top 3 priorities for tomorrow before closing the day so your mind can truly rest.',
    },
    source: { zhCN: '关机仪式', zhTW: '關機儀式', en: 'Shutdown Ritual' },
  },
  {
    id: 'eve-2',
    contexts: ['evening', 'busy'],
    category: { zhCN: '减负哲学', zhTW: '減負哲學', en: 'Essentialism' },
    text: {
      zhCN: '忙碌的一天即将收尾，未完成的小事不必自责，果断顺延或删减非必要事项。',
      zhTW: '忙碌的一天即將收尾，未完成的小事不必自責，果斷順延或刪減非必要事項。',
      en: 'After a packed day, defer or trim remaining low-impact items guilt-free—clarity beats completeness.',
    },
    source: { zhCN: '精要主义', zhTW: '精要主義', en: 'Essentialism' },
  },
  {
    id: 'mon-1',
    contexts: ['monday', 'morning', 'general'],
    category: { zhCN: '周初定调', zhTW: '週初定調', en: 'Monday Compass' },
    text: {
      zhCN: '新的一周开始，与其列出 20 条清单，不如明确周五前必须交付的 2 个核心结果。',
      zhTW: '新的一週開始，與其列出 20 條清單，不如明確週五前必須交付的 2 個核心結果。',
      en: 'Start the week by defining the 2 outcomes that will matter most by Friday rather than an endless list.',
    },
    source: { zhCN: '周计划校准', zhTW: '週計劃校準', en: 'Weekly Compass' },
  },
  {
    id: 'fri-1',
    contexts: ['friday', 'afternoon', 'evening'],
    category: { zhCN: '周五归档', zhTW: '週五歸檔', en: 'Friday Review' },
    text: {
      zhCN: '花 10 分钟浏览本周已完成日程，确认成就感，并清理下周初的日程冲突。',
      zhTW: '花 10 分鐘瀏覽本週已完成日程，確認成就感，並清理下週初的日程衝突。',
      en: 'Take 10 minutes to review completed milestones this week and clear early conflicts for Monday.',
    },
    source: { zhCN: '周度回顾', zhTW: '週度回顧', en: 'Weekly Review' },
  },
  {
    id: 'wknd-1',
    contexts: ['weekend', 'light'],
    category: { zhCN: '周末蓄能', zhTW: '週末蓄能', en: 'Weekend Recharge' },
    text: {
      zhCN: '高质量的休息本身就是生产力的一部分，留足离线时间给运动、阅读与家人陪伴。',
      zhTW: '高品質的休息本身就是生產力的一部分，留足離線時間給運動、閱讀與家人陪伴。',
      en: 'Deliberate rest sustains long-term pace—reserve unscheduled offline hours for movement, reading, or family.',
    },
    source: { zhCN: '可持续节奏', zhTW: '可持續節奏', en: 'Sustainable Pace' },
  },
  {
    id: 'wknd-2',
    contexts: ['weekend', 'evening'],
    category: { zhCN: '平稳过渡', zhTW: '平穩過渡', en: 'Gentle Prep' },
    text: {
      zhCN: '周日傍晚用五分钟快速浏览未来七天安排，能显著缓解周一早上的时间焦虑。',
      zhTW: '週日傍晚用五分鐘快速瀏覽未來七天安排，能顯著緩解週一早上的時間焦慮。',
      en: 'A quick 5-minute glance at the next 7 days this weekend removes Monday morning friction.',
    },
    source: { zhCN: '前瞻视野', zhTW: '前瞻視野', en: 'Calm Readiness' },
  },
  {
    id: 'busy-1',
    contexts: ['busy', 'focus'],
    category: { zhCN: '日程降噪', zhTW: '日程降噪', en: 'Calendar Triage' },
    text: {
      zhCN: '事件密集时遵循“两分钟法则”：两分钟能解决的即时处理，其余统一排入日程槽。',
      zhTW: '事件密集時遵循「兩分鐘法則」：兩分鐘能解決的即時處理，其餘統一排入日程槽。',
      en: 'On dense days, clear any 2-minute task immediately and schedule everything larger into explicit slots.',
    },
    source: { zhCN: 'GTD 核心法', zhTW: 'GTD 核心法', en: 'Two-Minute Rule' },
  },
  {
    id: 'light-1',
    contexts: ['light', 'focus'],
    category: { zhCN: '主动规划', zhTW: '主動規劃', en: 'Proactive Slot' },
    text: {
      zhCN: '空白日程最容易被琐事填满，先给自己预约一段学习、锻炼或长期复盘时间。',
      zhTW: '空白日程最容易被瑣事填滿，先給自己預約一段學習、鍛鍊或長期複盤時間。',
      en: 'Unclaimed hours get absorbed by trivia—book a calendar slot for your own learning or workout first.',
    },
    source: { zhCN: '自我预约', zhTW: '自我預約', en: 'Pay Yourself First' },
  },
  {
    id: 'gen-1',
    contexts: ['general', 'focus'],
    category: { zhCN: '系统思维', zhTW: '系統思維', en: 'Systems Thinking' },
    text: {
      zhCN: '“我们不会上升到目标的高度，而是会落回系统的基准线。”',
      zhTW: '「我們不會上升到目標的高度，而是會落回系統的基準線。」',
      en: '"You do not rise to the level of your goals. You fall to the level of your systems."',
    },
    source: { zhCN: 'James Clear', zhTW: 'James Clear', en: 'James Clear' },
  },
  {
    id: 'gen-2',
    contexts: ['general', 'morning'],
    category: { zhCN: '清晰优先', zhTW: '清晰優先', en: 'Clarity' },
    text: {
      zhCN: '“日程表上的空白，不是效率的浪费，而是思考与创造得以呼吸的空间。”',
      zhTW: '「日程表上的空白，不是效率的浪費，而是思考與創造得以呼吸的空間。」',
      en: 'White space on your calendar is not wasted time—it is the margin where clarity happens.',
    },
    source: { zhCN: '效率手记', zhTW: '效率手記', en: 'Craft of Focus' },
  },
  {
    id: 'gen-3',
    contexts: ['general', 'afternoon'],
    category: { zhCN: '节奏掌控', zhTW: '節奏掌控', en: 'Cadence' },
    text: {
      zhCN: '完成比完美更重要：先把任务推进到 60%，再决定是否值得继续打磨。',
      zhTW: '完成比完美更重要：先把任務推進到 60%，再決定是否值得繼續打磨。',
      en: 'Momentum beats perfection: push an important task to 60% first, then decide what needs polish.',
    },
    source: { zhCN: '迭代推进法', zhTW: '迭代推進法', en: 'Iterative Progress' },
  },
  {
    id: 'gen-4',
    contexts: ['general', 'evening'],
    category: { zhCN: '复利效应', zhTW: '複利效應', en: 'Compounding' },
    text: {
      zhCN: '每天坚持 30 分钟的专注积累，一年就是超过 180 小时的深度沉淀。',
      zhTW: '每天堅持 30 分鐘的專注積累，一年就是超過 180 小時的深度沉澱。',
      en: 'Thirty focused minutes a day quietly compounds into more than 180 hours of deliberate craft a year.',
    },
    source: { zhCN: '时间复利', zhTW: '時間複利', en: 'Daily Compound' },
  },
];

function pickLocalized(copy: LocalizedCopy, lang: Language): string {
  if (lang === 'zh-CN') return copy.zhCN;
  if (lang === 'zh-TW') return copy.zhTW;
  return copy.en;
}

export function getContextDailyInsight(params: {
  now?: Date;
  todayEventCount: number;
  viewMode: ViewMode;
  lang: Language;
  rotationOffset?: number;
}): ResolvedDailyInsight {
  const now = params.now || new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0=Sun..6=Sat

  const activeTags: InsightContextTag[] = ['general'];
  let timeLabelCN = '午间专注';
  let timeLabelTW = '午間專注';
  let timeLabelEN = 'Midday';

  if (hour >= 5 && hour < 12) {
    activeTags.push('morning');
    timeLabelCN = '晨间';
    timeLabelTW = '晨間';
    timeLabelEN = 'Morning';
  } else if (hour >= 12 && hour < 18) {
    activeTags.push('afternoon');
    timeLabelCN = '午后';
    timeLabelTW = '午後';
    timeLabelEN = 'Afternoon';
  } else {
    activeTags.push('evening');
    timeLabelCN = '晚间';
    timeLabelTW = '晚間';
    timeLabelEN = 'Evening';
  }

  if (dayOfWeek === 1) activeTags.push('monday');
  else if (dayOfWeek === 5) activeTags.push('friday');
  else if (dayOfWeek === 0 || dayOfWeek === 6) activeTags.push('weekend');

  if (params.todayEventCount >= 3) {
    activeTags.push('busy');
  } else if (params.todayEventCount === 0) {
    activeTags.push('light');
  }

  if (params.viewMode === 'day' || params.viewMode === 'week') {
    activeTags.push('focus');
  }

  const tagSet = new Set(activeTags);
  const scored = OFFLINE_INSIGHTS_LIBRARY.map((entry, idx) => {
    let score = 0;
    for (const ctx of entry.contexts) {
      if (tagSet.has(ctx)) {
        score += ctx === 'general' ? 1 : 3;
      }
    }
    return { entry, score, idx };
  }).sort((a, b) => b.score - a.score || a.idx - b.idx);

  // Take the highest-relevance context pool (top 8 items) so cycling stays context-relevant
  const pool = scored.slice(0, Math.min(8, scored.length)).map((s) => s.entry);
  const daySeed = now.getFullYear() * 1000 + (now.getMonth() + 1) * 40 + now.getDate();
  const offset = params.rotationOffset || 0;
  const chosenIndex = ((daySeed + offset) % pool.length + pool.length) % pool.length;
  const chosen = pool[chosenIndex];

  const loadLabel =
    params.lang === 'zh-CN'
      ? params.todayEventCount > 0
        ? `今日 ${params.todayEventCount} 项日程`
        : '今日日程留白'
      : params.lang === 'zh-TW'
      ? params.todayEventCount > 0
        ? `今日 ${params.todayEventCount} 項日程`
        : '今日日程留白'
      : params.todayEventCount > 0
      ? `${params.todayEventCount} scheduled today`
      : 'Open day';

  const timeLabel =
    params.lang === 'zh-CN' ? timeLabelCN : params.lang === 'zh-TW' ? timeLabelTW : timeLabelEN;

  return {
    id: chosen.id,
    category: pickLocalized(chosen.category, params.lang),
    text: pickLocalized(chosen.text, params.lang),
    source: pickLocalized(chosen.source, params.lang),
    contextSummary: `${timeLabel} · ${loadLabel}`,
    index: chosenIndex,
    total: pool.length,
  };
}
