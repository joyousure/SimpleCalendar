import { Language } from '../types/calendar';
import { COMPLETE_BASE_OVERRIDES, getExtraLabels, getLocaleCode, isRtlLanguage } from './i18nExtra';

export { getExtraLabels, getLocaleCode, isRtlLanguage };

export interface Translations {
  appName: string;
  offlineBadge: string;
  today: string;
  tomorrow: string;
  yesterday: string;
  allDay: string;
  viewMonth: string;
  viewWeek: string;
  viewDay: string;
  viewAgenda: string;
  viewYear: string;
  searchPlaceholder: string;
  noEventsFound: string;
  allCategories: string;
  filter: string;
  allEvents: string;
  noUpcomingEvents: string;
  noUpcomingEventsDesc: string;
  createEvent: string;
  editEvent: string;
  deleteEvent: string;
  duplicateEvent: string;
  saveChanges: string;
  cancel: string;
  done: string;
  eventTitlePlaceholder: string;
  category: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  repeat: string;
  reminderAlert: string;
  location: string;
  locationPlaceholder: string;
  notes: string;
  notesPlaceholder: string;
  checklist: string;
  addChecklistItem: string;
  add: string;
  tasksCount: string;
  quickPresets: string;
  quickMeeting: string;
  quickFocus: string;
  quickWorkout: string;
  quickAllDayNote: string;
  repeatNone: string;
  repeatDaily: string;
  repeatWeekly: string;
  repeatMonthly: string;
  repeatYearly: string;
  reminderNone: string;
  reminderAtTime: string;
  reminder10m: string;
  reminder30m: string;
  reminder1h: string;
  reminder1d: string;
  categoryWork: string;
  categoryPersonal: string;
  categoryFamily: string;
  categoryHealth: string;
  categoryFinance: string;
  categoryEducation: string;
  categoryUrgent: string;
  untitledEvent: string;
  settingsTitle: string;
  languageLabel: string;
  themeLabel: string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  themeAmoled: string;
  accentColorLabel: string;
  firstDayLabel: string;
  firstDayDesc: string;
  timeFormatLabel: string;
  timeFormatDesc: string;
  showHolidaysLabel: string;
  showHolidaysDesc: string;
  categoriesManagement: string;
  newCategoryPlaceholder: string;
  backupSectionLabel: string;
  exportIcs: string;
  importIcs: string;
  downloadJson: string;
  restoreJson: string;
  reloadSamples: string;
  clearAll: string;
  clearAllConfirm: string;
  privacyGuaranteeTitle: string;
  privacyGuaranteeSubtitle: string;
  privacyZeroRequestsTitle: string;
  privacyZeroRequestsDesc: string;
  privacyLocalStorageTitle: string;
  privacyLocalStorageDesc: string;
  privacyNoTrackingTitle: string;
  privacyNoTrackingDesc: string;
  privacyOpenStandardTitle: string;
  privacyOpenStandardDesc: string;
  privacyUnderstood: string;
  eventReminder: string;
  viewDetails: string;
  moreEvents: string;
  addEventAt: string;
  keyboardShortcuts: string;
  deleteConfirm: string;
  tvModeLabel: string;
  tvModeDesc: string;
  holidayOffBadge: string;
  workdayOvertimeBadge: string;
  holidayCnLabel: string;
  holidayCnDesc: string;
  holidaySyncNow: string;
  holidaySyncSuccess: string;
  workdayOvertimeLabel: string;
  holidayOffLabel: string;

  navCalendar: string;
  navAgenda: string;
  navCountdowns: string;
  navTools: string;
  navSettings: string;

  countdownsTitle: string;
  countdownsSubtitle: string;
  countdownsDesc: string;
  addCountdown: string;
  countdownTargetDate: string;
  countdownPinned: string;
  countdownNotesPlaceholder: string;
  countdownTitlePlaceholder: string;
  countdownCategoryAll: string;
  countdownCategoryAnniversary: string;
  countdownCategoryExam: string;
  countdownCategoryBirthday: string;
  countdownCategoryHoliday: string;
  countdownCategoryLife: string;
  countdownRepeatNone: string;
  countdownRepeatYearly: string;
  countdownRepeatMonthly: string;
  emptyCountdownsTitle: string;
  emptyCountdownsDesc: string;

  toolsTitle: string;
  toolsSubtitle: string;
  toolsDesc: string;
  toolsTabDateCalc: string;
  toolsTabLunar: string;
  toolsTabPomodoro: string;
  weatherQuickBtn: string;
  dateDiffCardTitle: string;
  dateDiffCardDesc: string;
  dateOffsetCardTitle: string;
  dateOffsetCardDesc: string;
  daysFromTodayCardTitle: string;
  daysFromTodayCardDesc: string;
  targetDateLabel: string;
  daysUntilLabel: string;
  daysPassedLabel: string;
  startDateLabel: string;
  endDateLabel: string;
  daysApartLabel: string;
  baseDateLabel: string;
  offsetDaysLabel: string;
  calculatedDateLabel: string;
  weekdayLabel: string;
  lunarDetailsTitle: string;
  lunarGanZhi: string;
  lunarZodiac: string;
  lunarSolarTerm: string;
  lunarFestival: string;
  almanacYiLabel: string;
  almanacJiLabel: string;
  almanacZodiacLabel: string;
  almanacWeekLabel: string;
  dailyQuoteTitle: string;
  refreshQuoteTooltip: string;
  pomoFocusSession: string;
  pomoShortBreak: string;
  pomoLongBreak: string;
  pomoStart: string;
  pomoPause: string;
  pomoReset: string;
  pomoCompletedCount: string;

  scheduleTodayTitle: string;
  schedulePastTitle: string;
  scheduleFutureTitle: string;
  annualDayProgress: string;
  annualDaysLeft: string;
  pastTasksArchive: string;
  noPastTasks: string;
  futurePlansTitle: string;
  noFuturePlans: string;
  jumpToDayView: string;
  createEventForDate: string;

  todoInbox: string;
  todoToday: string;
  todoNext7Days: string;
  todoCompleted: string;
  todoOverdue: string;
  todoUpcoming: string;
  todoQuickAddPlaceholder: string;
  priorityLabel: string;
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;
  priorityNone: string;
  todayProgress: string;
  clearCompleted: string;
  clearCompletedConfirm: string;
  taskCompletedStatus: string;
  taskPendingStatus: string;

  settingsTabPreferences: string;
  settingsTabAppearance: string;
  settingsTabLanguage: string;
  settingsTabBackup: string;
  settingsTabCategories: string;
  settingsTabDisplay: string;
  settingsShowLunarLabel: string;
  settingsShowLunarDesc: string;
  settingsShowWeatherLabel: string;
  settingsShowWeatherDesc: string;

  worldClock: string;
  worldClockLocal: string;
  worldClockGmt: string;
  worldClockNewYork: string;
  worldClockSyncSuccess: string;
  worldClockDetailTitle: string;
  worldClockLocationPrefix: string;
  worldClockPrecisionNotice: string;
  worldClockSunTimes: string;
  worldMapButton: string;
  worldMapTitle: string;
  worldMapSearchPlaceholder: string;
  worldMapTimezone: string;
  voiceControlTitle: string;
  voiceControlListening: string;
  voiceControlHelp: string;
  backButton: string;

  calendarLayoutLabel: string;
  layoutSplit: string;
  layoutZen: string;
  layoutScenic: string;
  layoutFullBg: string;
  bgImagePosLabel: string;
  bgImageBottom: string;
  bgImageFullscreen: string;
  bgImageNone: string;

  navFocus?: string;
  navWorldClock?: string;
  financeTitle?: string;
  stocksTitle?: string;
  metalsTitle?: string;
  macroTitle?: string;
  gold?: string;
  silver?: string;
  copper?: string;
  aluminum?: string;
  pmiManufacturing?: string;
  pmiNonManufacturing?: string;
  pmiThreshold?: string;
  cpiYoY?: string;
  fiveYearTrend?: string;
  pomodoroTitle?: string;
  pomodoroDesc?: string;
  pomoWork?: string;
  pomoSelectTask?: string;
  pomoNoTask?: string;
  pomoEstTomatoes?: string;
  pomoCompTomatoes?: string;
  ambientSoundLabel?: string;
  ambientRain?: string;
  ambientForest?: string;
  ambientWaves?: string;
  ambientCafe?: string;
  ambientCampfire?: string;
  ambientWhiteNoise?: string;
  fullscreenFocus?: string;
  strictModeLabel?: string;
  clockModeFlip?: string;
  clockModeAnalog?: string;
  clockModeCapsule?: string;
  clockModeGlass?: string;
  clockModeHud?: string;
  clockModeMinimal?: string;
}

const en: Translations = {
  appName: 'My Calendar',
  offlineBadge: 'Offline Verified',
  today: 'Today',
  tomorrow: 'Tomorrow',
  yesterday: 'Yesterday',
  allDay: 'All Day',
  viewMonth: 'Month',
  viewWeek: 'Week',
  viewDay: 'Day',
  viewAgenda: 'To-Do',
  viewYear: 'Year',
  searchPlaceholder: 'Search events, locations, notes...',
  noEventsFound: 'No matching events found.',
  allCategories: 'All Categories',
  filter: 'Filter:',
  allEvents: 'All Events',
  noUpcomingEvents: 'No Upcoming Tasks',
  noUpcomingEventsDesc: 'Your schedule is clear. Click below to add a new task or event.',
  createEvent: 'New Schedule',
  editEvent: 'Edit Schedule',
  deleteEvent: 'Delete',
  duplicateEvent: 'Duplicate',
  saveChanges: 'Save',
  cancel: 'Cancel',
  done: 'Done',
  eventTitlePlaceholder: 'Title (e.g. Weekly Meeting)',
  category: 'Category',
  startDate: 'Start Date',
  startTime: 'Start Time',
  endDate: 'End Date',
  endTime: 'End Time',
  repeat: 'Repeat',
  reminderAlert: 'Reminder',
  location: 'Location',
  locationPlaceholder: 'Add meeting room or place...',
  notes: 'Notes',
  notesPlaceholder: 'Add notes, links or key points...',
  checklist: 'Checklist / Subtasks',
  addChecklistItem: 'Add subtask item...',
  add: 'Add',
  tasksCount: 'tasks',
  quickPresets: 'Quick Presets',
  quickMeeting: 'Quick Meeting (30m)',
  quickFocus: 'Deep Focus (2h)',
  quickWorkout: 'Workout (45m)',
  quickAllDayNote: 'All-Day Note',
  repeatNone: 'Does not repeat',
  repeatDaily: 'Every day',
  repeatWeekly: 'Every week',
  repeatMonthly: 'Every month',
  repeatYearly: 'Every year',
  reminderNone: 'No reminder',
  reminderAtTime: 'At event start',
  reminder10m: '10 minutes before',
  reminder30m: '30 minutes before',
  reminder1h: '1 hour before',
  reminder1d: '1 day before',
  categoryWork: 'Work & Office',
  categoryPersonal: 'Personal',
  categoryFamily: 'Family',
  categoryHealth: 'Health & Fitness',
  categoryFinance: 'Finance & Bills',
  categoryEducation: 'Study & Exams',
  categoryUrgent: 'Urgent',
  untitledEvent: 'Untitled Event',
  settingsTitle: 'Settings & Preferences',
  languageLabel: 'Language & Region',
  themeLabel: 'Color Theme',
  themeSystem: 'Match System',
  themeLight: 'Clean Light',
  themeDark: 'Dark Mode',
  themeAmoled: 'AMOLED Black',
  accentColorLabel: 'Accent Color',
  firstDayLabel: 'Start Week On',
  firstDayDesc: 'Choose whether week starts on Sunday or Monday',
  timeFormatLabel: 'Time Display',
  timeFormatDesc: 'Use 24-hour military clock (14:30) vs 12-hour AM/PM',
  showHolidaysLabel: 'Public Holidays',
  showHolidaysDesc: 'Display statutory public holidays on dates',
  categoriesManagement: 'Event Categories',
  newCategoryPlaceholder: 'New category name...',
  backupSectionLabel: 'Data Backup & Sync',
  exportIcs: 'Export iCalendar (.ics)',
  importIcs: 'Import iCalendar (.ics)',
  downloadJson: 'Download JSON Backup',
  restoreJson: 'Restore JSON Backup',
  reloadSamples: 'Reload Sample Events',
  clearAll: 'Clear All Events',
  clearAllConfirm: 'Are you sure you want to delete ALL events? This action cannot be undone.',
  privacyGuaranteeTitle: 'Privacy & Data Protection',
  privacyGuaranteeSubtitle: '100% Offline-First Verified',
  privacyZeroRequestsTitle: 'Zero Remote Requests',
  privacyZeroRequestsDesc: 'No schedule or personal data is ever transmitted over the network.',
  privacyLocalStorageTitle: 'Local Device Sandbox',
  privacyLocalStorageDesc: 'Data is stored strictly in your browser local sandbox.',
  privacyNoTrackingTitle: 'Zero Tracking & No Ads',
  privacyNoTrackingDesc: 'No analytics, cookies, tracking scripts, or advertisement SDKs.',
  privacyOpenStandardTitle: 'Universal Open Format',
  privacyOpenStandardDesc: 'Standard RFC 5545 iCalendar support with total user data ownership.',
  privacyUnderstood: 'Understood',
  eventReminder: 'Event Reminder',
  viewDetails: 'View',
  moreEvents: 'more',
  addEventAt: 'Add event at',
  keyboardShortcuts: 'Shortcuts: T (Today), M (Month), W (Week), D (Day), A (To-Do), Y (Year), N (New)',
  deleteConfirm: 'Delete this event?',
  tvModeLabel: 'TV & Large Screen Display',
  tvModeDesc: 'Optimizes layouts for TV screens, tablets, and large displays with remote D-Pad focus.',
  holidayOffBadge: 'Off',
  workdayOvertimeBadge: 'Work',
  holidayCnLabel: 'Statutory Holidays & Workdays',
  holidayCnDesc: 'Automatic statutory holiday schedule with offline cache.',
  holidaySyncNow: 'Sync Holiday Data Now',
  holidaySyncSuccess: 'Holiday schedule synced successfully!',
  workdayOvertimeLabel: 'Workday Adjustment',
  holidayOffLabel: 'Statutory Holiday',

  navCalendar: 'Calendar',
  navAgenda: 'To-Do',
  navCountdowns: 'Countdowns',
  navTools: 'Tools',
  navSettings: 'Settings',

  countdownsTitle: 'Countdowns & Days',
  countdownsSubtitle: 'Capture Cherished Milestones',
  countdownsDesc: 'Track exams, anniversaries, birthdays, and upcoming vacations.',
  addCountdown: 'Add',
  countdownTargetDate: 'Target Date',
  countdownPinned: 'Pin to Top',
  countdownNotesPlaceholder: 'Add memories, goals, or preparation notes...',
  countdownTitlePlaceholder: 'Countdown Title (e.g. Graduation, Wedding, Exam)',
  countdownCategoryAll: 'All',
  countdownCategoryAnniversary: 'Anniversary',
  countdownCategoryExam: 'Exams',
  countdownCategoryBirthday: 'Birthday',
  countdownCategoryHoliday: 'Holidays',
  countdownCategoryLife: 'Life',
  countdownRepeatNone: 'Does not repeat',
  countdownRepeatYearly: 'Every Year',
  countdownRepeatMonthly: 'Every Month',
  emptyCountdownsTitle: 'No Countdowns Yet',
  emptyCountdownsDesc: 'Add your first countdown to remember what matters most.',

  toolsTitle: 'Practical Toolkit',
  toolsSubtitle: 'Productivity & Time Management',
  toolsDesc: 'Date calculations, focus timer, and global time.',
  toolsTabDateCalc: 'Date Calculators',
  toolsTabLunar: 'Lunar Details',
  toolsTabPomodoro: 'Focus Pomodoro',
  weatherQuickBtn: 'Weather Overview',
  dateDiffCardTitle: 'Interval Between Dates',
  dateDiffCardDesc: 'Calculate exact elapsed days and weeks between two dates',
  dateOffsetCardTitle: 'Date Offset Calculator',
  dateOffsetCardDesc: 'Calculate past or future date by adding or subtracting days',
  daysFromTodayCardTitle: 'Days From / Until Today',
  daysFromTodayCardDesc: 'Calculate days remaining until a future date or elapsed since a milestone',
  targetDateLabel: 'Target Date',
  daysUntilLabel: 'Days Until',
  daysPassedLabel: 'Days Passed',
  startDateLabel: 'Start Date',
  endDateLabel: 'End Date',
  daysApartLabel: 'Days Apart',
  baseDateLabel: 'Base Date',
  offsetDaysLabel: 'Days to Add/Subtract',
  calculatedDateLabel: 'Calculated Date',
  weekdayLabel: 'Day of Week',
  lunarDetailsTitle: 'Lunar & Solar Terms Information',
  lunarGanZhi: 'Heavenly Stems & Earthly Branches',
  lunarZodiac: 'Zodiac Sign',
  lunarSolarTerm: 'Solar Term',
  lunarFestival: 'Traditional Festival',
  almanacYiLabel: 'Auspicious',
  almanacJiLabel: 'Inauspicious',
  almanacZodiacLabel: 'Zodiac',
  almanacWeekLabel: 'Week',
  dailyQuoteTitle: 'Daily Wisdom',
  refreshQuoteTooltip: 'New Quote',
  pomoFocusSession: 'Focus Session (25m)',
  pomoShortBreak: 'Short Break (5m)',
  pomoLongBreak: 'Long Break (15m)',
  pomoStart: 'Start Focus',
  pomoPause: 'Pause',
  pomoReset: 'Reset',
  pomoCompletedCount: 'Pomodoros Completed',

  scheduleTodayTitle: "Today's Schedule & Day Count",
  schedulePastTitle: 'Past Tasks Archive',
  scheduleFutureTitle: 'Future Schedule & Milestones',
  annualDayProgress: 'Year Progress',
  annualDaysLeft: 'Days left in year:',
  pastTasksArchive: 'Historical Tasks & Completed Milestones',
  noPastTasks: 'No tasks or events recorded on this date.',
  futurePlansTitle: 'Plans for this Date',
  noFuturePlans: 'No events scheduled for this date.',
  jumpToDayView: 'Go to Day View',
  createEventForDate: 'Add on this date',

  todoInbox: 'Inbox',
  todoToday: 'Today',
  todoNext7Days: 'Next 7 Days',
  todoCompleted: 'Completed',
  todoOverdue: 'Overdue',
  todoUpcoming: 'Later',
  todoQuickAddPlaceholder: 'Add a new task, press Enter to submit...',
  priorityLabel: 'Priority',
  priorityHigh: 'High Priority',
  priorityMedium: 'Medium Priority',
  priorityLow: 'Low Priority',
  priorityNone: 'No Priority',
  todayProgress: "Today's Progress",
  clearCompleted: 'Clear Completed',
  clearCompletedConfirm: 'Are you sure you want to remove all completed tasks?',
  taskCompletedStatus: 'Completed',
  taskPendingStatus: 'Pending',

  settingsTabPreferences: 'Calendar Habits',
  settingsTabAppearance: 'Appearance & Themes',
  settingsTabLanguage: 'Language & Region',
  settingsTabBackup: 'Local Backup & Sync',
  settingsTabCategories: 'Categories',
  settingsTabDisplay: 'Calendar & Time Display',
  settingsShowLunarLabel: 'Show Lunar Calendar & Solar Terms',
  settingsShowLunarDesc: 'Display traditional lunar dates on Chinese locale (automatically hidden in non-Chinese locales)',
  settingsShowWeatherLabel: 'Show Weather Icons',
  settingsShowWeatherDesc: 'Display weather icons on date cells',

  worldClock: 'World Clock',
  worldClockLocal: 'Local Time',
  worldClockGmt: 'GMT / UTC',
  worldClockNewYork: 'New York',
  worldClockSyncSuccess: 'Synchronized with precision time: ±0.00s',
  worldClockDetailTitle: 'High-Precision World Clock',
  worldClockLocationPrefix: 'Current Location:',
  worldClockPrecisionNotice: 'Synchronized with atomic time standard (NTP accuracy)',
  worldClockSunTimes: 'Sun & Daylight',
  worldMapButton: 'Time Zone Map',
  worldMapTitle: 'Time Zone Map',
  worldMapSearchPlaceholder: 'Search city, country, or timezone (e.g. London, UTC+8)...',
  worldMapTimezone: 'Time Zone',
  voiceControlTitle: 'Voice Navigation',
  voiceControlListening: 'Listening for voice commands...',
  voiceControlHelp: 'Try saying "Back", "Clock", "Calendar", "Today", or "To-Do"',
  backButton: 'Back',

  calendarLayoutLabel: 'Calendar View Layout',
  layoutSplit: 'Split Stretch (Almanac & Quote)',
  layoutZen: 'Pure Grid (Zen Calendar)',
  layoutScenic: 'Scenic Quote Banner',
  layoutFullBg: 'Immersive Wallpaper',
  bgImagePosLabel: 'Artistic Illustration Position',
  bgImageBottom: 'Bottom Almanac Area Only',
  bgImageFullscreen: 'Full Screen Wallpaper',
  bgImageNone: 'Solid Clean Color (No Wallpaper)',
};

const zhCN: Translations = {
  ...en,
  appName: '我的日历',
  offlineBadge: '离线隐私',
  today: '今天',
  tomorrow: '明天',
  yesterday: '昨天',
  allDay: '全天',
  viewMonth: '月',
  viewWeek: '周',
  viewDay: '日',
  viewAgenda: '待办',
  viewYear: '年',
  searchPlaceholder: '搜索事件、地点或备注...',
  noEventsFound: '未找到匹配的事件。',
  allCategories: '所有分类',
  filter: '筛选：',
  allEvents: '所有事件',
  noUpcomingEvents: '暂无即将到来的日程',
  noUpcomingEventsDesc: '目前日程表为空。点击下方按钮新建事件。',
  createEvent: '新建日程',
  editEvent: '编辑日程',
  deleteEvent: '删除日程',
  duplicateEvent: '复制日程',
  saveChanges: '保存更改',
  cancel: '取消',
  done: '完成',
  eventTitlePlaceholder: '日程标题（如：部门周会）',
  category: '分类标签',
  startDate: '开始日期',
  startTime: '开始时间',
  endDate: '结束日期',
  endTime: '结束时间',
  repeat: '重复周期',
  reminderAlert: '提醒通知',
  location: '活动地点',
  locationPlaceholder: '添加地点或会议室...',
  notes: '备注说明',
  notesPlaceholder: '添加日程说明、链接或备忘要点...',
  checklist: '清单项 (待办检查)',
  addChecklistItem: '添加清单子项...',
  add: '添加',
  tasksCount: '项待办',
  quickPresets: '快捷日程模板',
  quickMeeting: '快捷会议 (30分钟)',
  quickFocus: '深度专注自习 (2小时)',
  quickWorkout: '每日健身锻炼 (45分钟)',
  quickAllDayNote: '全天备忘纪事',
  repeatNone: '不重复',
  repeatDaily: '每天重复',
  repeatWeekly: '每周重复',
  repeatMonthly: '每月重复',
  repeatYearly: '每年重复',
  reminderNone: '不提醒',
  reminderAtTime: '日程开始时',
  reminder10m: '提前 10 分钟',
  reminder30m: '提前 30 分钟',
  reminder1h: '提前 1 小时',
  reminder1d: '提前 1 天',
  categoryWork: '工作与办公',
  categoryPersonal: '个人与生活',
  categoryFamily: '家庭与亲友',
  categoryHealth: '运动与健康',
  categoryFinance: '财务与账单',
  categoryEducation: '学习与备考',
  categoryUrgent: '紧急优先',
  untitledEvent: '无标题事件',
  settingsTitle: '设置与偏好',
  languageLabel: '语言与地区',
  themeLabel: '界面色彩主题',
  themeSystem: '跟随系统',
  themeLight: '清爽明亮',
  themeDark: '沉浸暗色',
  themeAmoled: 'AMOLED 纯黑',
  accentColorLabel: '主题强调色',
  firstDayLabel: '每周开始时间',
  firstDayDesc: '设定日历表格以星期日还是星期一开始排列',
  timeFormatLabel: '时间显示制式',
  timeFormatDesc: '切换 24 小时制或 12 小时制 (上午/下午)',
  showHolidaysLabel: '公历节日',
  showHolidaysDesc: '在日历上显示元旦、劳动节等法定公历节日',
  categoriesManagement: '分类标签管理',
  newCategoryPlaceholder: '新分类名称（如：投资理财）...',
  backupSectionLabel: '本地备份与同步',
  exportIcs: '导出 iCalendar (.ics)',
  importIcs: '导入 iCalendar (.ics)',
  downloadJson: '下载 JSON 完整备份',
  restoreJson: '恢复 JSON 备份',
  reloadSamples: '重新载入示例日程',
  clearAll: '清空所有日程',
  clearAllConfirm: '确定要清空全部日程事件吗？此操作无法撤销。',
  privacyGuaranteeTitle: '隐私安全与数据架构说明',
  privacyGuaranteeSubtitle: '100% 离线端运行验证',
  privacyZeroRequestsTitle: '零远端网络请求',
  privacyZeroRequestsDesc: '您的任何日程、时间、备注或个人信息绝不通过网络传输。本应用在您的设备上完全离线、沙盒独立运行。',
  privacyLocalStorageTitle: '纯本地设备存储',
  privacyLocalStorageDesc: '所有数据安全存储于浏览器的 LocalStorage 中，您可以随时导出标准格式或彻底抹除。',
  privacyNoTrackingTitle: '无广告、无数据追踪',
  privacyNoTrackingDesc: '完全没有任何数据收集、分析埋点、Cookie 或广告 SDK。传承开源纯净精神。',
  privacyOpenStandardTitle: '通用标准与数据自主权',
  privacyOpenStandardDesc: '支持标准的 RFC 5545 iCalendar (.ics) 格式，可与系统日历无缝迁移。',
  privacyUnderstood: '我知道了',
  eventReminder: '日程提醒',
  viewDetails: '查看详情',
  moreEvents: '更多',
  addEventAt: '新建日程于',
  keyboardShortcuts: '快捷键: T (今天), M (月), W (周), D (日), A (待办), Y (年), N (新建)',
  deleteConfirm: '确定删除此事件吗？',
  tvModeLabel: '电视与大屏幕模式',
  tvModeDesc: '针对智能电视、机顶盒与平板大屏深度优化，强化遥控器方向键焦点与视距字号。',
  holidayOffBadge: '休',
  workdayOvertimeBadge: '班',
  holidayCnLabel: '法定节假日与调休补班 (休/班)',
  holidayCnDesc: '基于标准数据库，自动联网同步法定休假与调休工作日安排并持久化离线缓存。',
  holidaySyncNow: '立即联网同步节假日数据',
  holidaySyncSuccess: '节假日与调休补班数据同步成功！',
  workdayOvertimeLabel: '调休工作日',
  holidayOffLabel: '法定节假日',

  navCalendar: '日历',
  navAgenda: '待办',
  navCountdowns: '倒数日',
  navTools: '工具',
  navSettings: '设置',

  countdownsTitle: '倒数纪念日',
  countdownsSubtitle: '记录每一个珍贵时刻',
  countdownsDesc: '考试冲刺、心动纪念日、亲友生日与重要休假安排全景追踪。',
  addCountdown: '新增',
  countdownTargetDate: '目标日期',
  countdownPinned: '置顶显示',
  countdownNotesPlaceholder: '添加纪念意义、备考目标或准备清单...',
  countdownTitlePlaceholder: '倒数目标标题（如：高考冲刺、结婚纪念日）',
  countdownCategoryAll: '全部',
  countdownCategoryAnniversary: '纪念日',
  countdownCategoryExam: '考试',
  countdownCategoryBirthday: '生日',
  countdownCategoryHoliday: '节日',
  countdownCategoryLife: '生活',
  countdownRepeatNone: '不重复',
  countdownRepeatYearly: '每年重复',
  countdownRepeatMonthly: '每月重复',
  emptyCountdownsTitle: '暂无倒数纪念日',
  emptyCountdownsDesc: '点击右上角按钮创建第一个倒数日，记录重要里程碑。',

  toolsTitle: '实用工具箱',
  toolsSubtitle: '时间与生活效率助手',
  toolsDesc: '日期间隔换算、公农历黄历互查、番茄专注时钟与天气速查。',
  toolsTabDateCalc: '日期间隔计算',
  toolsTabLunar: '农历黄历转换',
  toolsTabPomodoro: '番茄专注时钟',
  weatherQuickBtn: '天气速览',
  dateDiffCardTitle: '两日期间隔天数',
  dateDiffCardDesc: '计算两个日期之间的精确相隔天数与周数',
  dateOffsetCardTitle: '以某天为基准推算',
  dateOffsetCardDesc: '以指定基准日期推算前后若干天是哪一天及星期几',
  daysFromTodayCardTitle: '距离当前日期天数计算',
  daysFromTodayCardDesc: '快速计算目标日期距离今天还剩多少天，或某一里程碑已过去多少天',
  targetDateLabel: '目标日期',
  daysUntilLabel: '距离目标还剩',
  daysPassedLabel: '距今已过去',
  startDateLabel: '起始日期',
  endDateLabel: '结束日期',
  daysApartLabel: '相隔天数',
  baseDateLabel: '基准日期',
  offsetDaysLabel: '推算天数 (正数往后 / 负数往前)',
  calculatedDateLabel: '推算结果',
  weekdayLabel: '星期几',
  lunarDetailsTitle: '农历与二十四节气详解',
  lunarGanZhi: '天干地支甲子',
  lunarZodiac: '生肖属相',
  lunarSolarTerm: '二十四节气',
  lunarFestival: '传统节日',
  almanacYiLabel: '宜',
  almanacJiLabel: '忌',
  almanacZodiacLabel: '生肖',
  almanacWeekLabel: '周数',
  dailyQuoteTitle: '每日名言雅句',
  refreshQuoteTooltip: '更换雅句',
  pomoFocusSession: '专注学习 (25分钟)',
  pomoShortBreak: '短休息 (5分钟)',
  pomoLongBreak: '长休息 (15分钟)',
  pomoStart: '开始专注',
  pomoPause: '暂停计时',
  pomoReset: '重置',
  pomoCompletedCount: '已累计完成番茄钟',

  scheduleTodayTitle: '今日全景概览',
  schedulePastTitle: '过去的待办事项',
  scheduleFutureTitle: '未来规划与倒数',
  annualDayProgress: '年度进度',
  annualDaysLeft: '距今年结束还有',
  pastTasksArchive: '历史待办事项与日程回顾',
  noPastTasks: '该日期没有安排任何待办事项或日程。',
  futurePlansTitle: '当日日程规划',
  noFuturePlans: '该日期暂未安排日程。',
  jumpToDayView: '进入日视图',
  createEventForDate: '在此日期新建',

  todoInbox: '收集箱',
  todoToday: '今天',
  todoNext7Days: '最近 7 天',
  todoCompleted: '已完成',
  todoOverdue: '已逾期',
  todoUpcoming: '稍后待办',
  todoQuickAddPlaceholder: '添加待办任务，按回车快速添加...',
  priorityLabel: '优先级',
  priorityHigh: '高优先级',
  priorityMedium: '中优先级',
  priorityLow: '低优先级',
  priorityNone: '无优先级',
  todayProgress: '今日进度',
  clearCompleted: '清理已完成',
  clearCompletedConfirm: '确定要彻底移除所有已完成的待办事项吗？',
  taskCompletedStatus: '已完成',
  taskPendingStatus: '待处理',

  settingsTabPreferences: '日历偏好习惯',
  settingsTabAppearance: '外观与个性化',
  settingsTabLanguage: '语言与地区',
  settingsTabBackup: '本地备份与同步',
  settingsTabCategories: '分类标签管理',
  settingsTabDisplay: '日历与时间显示',
  settingsShowLunarLabel: '显示农历与二十四节气',
  settingsShowLunarDesc: '在日历格展示农历传统节日、节气与天干地支（非中文界面自动屏蔽）',
  settingsShowWeatherLabel: '显示天气预报图标',
  settingsShowWeatherDesc: '在日历单元格呈现极简天气状态图标',

  worldClock: '世界时钟',
  worldClockLocal: '本机当地时间',
  worldClockGmt: '格林威治标准时间 (GMT)',
  worldClockNewYork: '纽约',
  worldClockSyncSuccess: '已同步校准时间：+0.00s 误差 · NTP精准同步',
  worldClockDetailTitle: '精准世界时钟与时区全景',
  worldClockLocationPrefix: '现在的地址：',
  worldClockPrecisionNotice: '您的设备时间与标准授时完全同步 (误差 ±0.002秒)',
  worldClockSunTimes: '日出与日落',
  worldMapButton: '时区地图',
  worldMapTitle: '时区地图',
  worldMapSearchPlaceholder: '按城市、国家或时区搜索（如：贵阳、纽约、GMT+8）...',
  worldMapTimezone: '时区',
  voiceControlTitle: '语音操控',
  voiceControlListening: '正在倾听语音指令...',
  voiceControlHelp: '您可以说出「返回」、「时钟」、「日历」、「今天」或「待办」',
  backButton: '返回',

  calendarLayoutLabel: '日历卡片拉伸显示模式',
  layoutSplit: '上下拉伸分屏 (图文画卷)',
  layoutZen: '纯粹全日历 (大网格)',
  layoutScenic: '图文名句画卷',
  layoutFullBg: '沉浸壁纸铺平',
  bgImagePosLabel: '艺术背景图显示位置',
  bgImageBottom: '严格限定在中下部图文区',
  bgImageFullscreen: '背景图铺平整个页面',
  bgImageNone: '纯净色块 (不显示背景图)',
};

const zhTW: Translations = {
  ...zhCN,
  appName: '我的行事曆',
  offlineBadge: '離線隱私',
  today: '今天',
  tomorrow: '明天',
  yesterday: '昨天',
  allDay: '全天',
  viewMonth: '月',
  viewWeek: '週',
  viewDay: '日',
  viewAgenda: '待辦',
  viewYear: '年',
  searchPlaceholder: '搜尋事件、地點或備註...',
  noEventsFound: '找不到符合的事件。',
  allCategories: '所有分類',
  filter: '篩選：',
  allEvents: '所有事件',
  noUpcomingEvents: '暫無即將到來的日程',
  noUpcomingEventsDesc: '目前日程表為空。點擊下方按鈕新增事件。',
  createEvent: '新增日程',
  editEvent: '編輯日程',
  deleteEvent: '刪除日程',
  duplicateEvent: '複製日程',
  saveChanges: '儲存變更',
  cancel: '取消',
  done: '完成',
  eventTitlePlaceholder: '日程標題（如：部門週會）',
  category: '分類標籤',
  startDate: '開始日期',
  startTime: '開始時間',
  endDate: '結束日期',
  endTime: '結束時間',
  repeat: '重複週期',
  reminderAlert: '提醒通知',
  location: '活動地點',
  locationPlaceholder: '新增地點或會議室...',
  notes: '備註說明',
  notesPlaceholder: '新增日程說明、連結或備忘要點...',
  checklist: '清單項目 (待辦檢查)',
  addChecklistItem: '新增清單子項...',
  add: '新增',
  tasksCount: '項待辦',
  quickPresets: '快捷日程範本',
  quickMeeting: '快捷會議 (30分鐘)',
  quickFocus: '深度專注自習 (2小時)',
  quickWorkout: '每日健身運動 (45分鐘)',
  quickAllDayNote: '全天備忘記事',
  repeatNone: '不重複',
  repeatDaily: '每天重複',
  repeatWeekly: '每週重複',
  repeatMonthly: '每月重複',
  repeatYearly: '每年重複',
  reminderNone: '不提醒',
  reminderAtTime: '日程開始時',
  reminder10m: '提前 10 分鐘',
  reminder30m: '提前 30 分鐘',
  reminder1h: '提前 1 小時',
  reminder1d: '提前 1 天',
  categoryWork: '工作與辦公',
  categoryPersonal: '個人與生活',
  categoryFamily: '家庭與親友',
  categoryHealth: '運動與健康',
  categoryFinance: '財務與帳單',
  categoryEducation: '學習與備考',
  categoryUrgent: '緊急優先',
  untitledEvent: '無標題事件',
  settingsTitle: '設定與偏好',
  languageLabel: '語言與地區',
  themeLabel: '介面色彩主題',
  themeSystem: '跟隨系統',
  themeLight: '清爽明亮',
  themeDark: '沉浸深色',
  themeAmoled: 'AMOLED 純黑',
  accentColorLabel: '主題強調色',
  firstDayLabel: '每週開始時間',
  firstDayDesc: '設定行事曆表格以星期日或星期一作為第一列',
  timeFormatLabel: '時間顯示制式',
  timeFormatDesc: '切換 24 小時制或 12 小時制 (上午/下午)',
  showHolidaysLabel: '國定與公曆節日',
  showHolidaysDesc: '在行事曆上顯示元旦、勞動節等法定公曆節日',
  categoriesManagement: '分類標籤管理',
  newCategoryPlaceholder: '新分類名稱（如：投資理財）',
  backupSectionLabel: '本機資料備份與同步',
  exportIcs: '匯出 iCalendar (.ics)',
  importIcs: '匯入 iCalendar (.ics)',
  downloadJson: '下載 JSON 完整備份',
  restoreJson: '還原 JSON 備份',
  reloadSamples: '重新載入範例日程',
  clearAll: '清空所有日程',
  clearAllConfirm: '確定要刪除所有事件嗎？此操作無法復原（除非您有備份檔案）。',
  privacyGuaranteeTitle: '隱私安全與資料架構說明',
  privacyGuaranteeSubtitle: '100% 離線端運作驗證',
  privacyZeroRequestsTitle: '零遠端網路請求',
  privacyZeroRequestsDesc: '您的任何日程、時間、備註或個人資訊絕不透過網路傳輸。本應用程式在您的裝置上完全離線、沙盒獨立運作。',
  privacyLocalStorageTitle: '純本機裝置儲存',
  privacyLocalStorageDesc: '所有資料安全儲存於瀏覽器的 LocalStorage 中，您可以隨時匯出標準格式或徹底抹除。',
  privacyNoTrackingTitle: '無廣告、無資料追蹤',
  privacyNoTrackingDesc: '完全沒有任何資料收集、分析埋點、Cookie 或廣告 SDK。傳承開源純淨精神。',
  privacyOpenStandardTitle: '通用標準與資料自主權',
  privacyOpenStandardDesc: '支援標準的 RFC 5545 iCalendar (.ics) 格式，可與系統日曆無縫遷移。',
  privacyUnderstood: '我知道了',
  eventReminder: '日程提醒',
  viewDetails: '檢視',
  moreEvents: '更多',
  addEventAt: '新增日程於',
  keyboardShortcuts: '快捷鍵: T (今天), M (月), W (週), D (日), A (待辦), Y (年), N (新增)',
  deleteConfirm: '確定刪除此事件嗎？',
  tvModeLabel: '電視與大螢幕模式',
  tvModeDesc: '針對智慧電視、機上盒與平板大螢幕深度最佳化，強化遙控器方向鍵焦點與視距字號。',
  holidayOffBadge: '休',
  workdayOvertimeBadge: '班',
  holidayCnLabel: '法定節假日與調休補班 (休/班)',
  holidayCnDesc: '基於標準資料庫，自動聯網同步法定休假與調休工作日安排並持久化離線快取。',
  holidaySyncNow: '立即聯網同步節假日資料',
  holidaySyncSuccess: '節假日與調休補班資料同步成功！',
  workdayOvertimeLabel: '調休工作日',
  holidayOffLabel: '法定節假日',

  navCalendar: '行事曆',
  navAgenda: '待辦',
  navCountdowns: '倒數日',
  navTools: '工具',
  navSettings: '設定',

  countdownsTitle: '倒數紀念日',
  countdownsSubtitle: '記錄每一個珍貴時刻',
  countdownsDesc: '考試衝刺、心動紀念日、親友生日與重要休假安排全景追蹤。',
  addCountdown: '新增',
  countdownTargetDate: '目標日期',
  countdownPinned: '置頂顯示',
  countdownNotesPlaceholder: '新增紀念意義、備考目標或準備清單...',
  countdownTitlePlaceholder: '倒數目標標題（如：學測衝刺、結婚紀念日）',
  countdownCategoryAll: '全部',
  countdownCategoryAnniversary: '紀念日',
  countdownCategoryExam: '考試',
  countdownCategoryBirthday: '生日',
  countdownCategoryHoliday: '節日',
  countdownCategoryLife: '生活',
  countdownRepeatNone: '不重複',
  countdownRepeatYearly: '每年重複',
  countdownRepeatMonthly: '每月重複',
  emptyCountdownsTitle: '暫無倒數紀念日',
  emptyCountdownsDesc: '點擊右上角按鈕建立第一個倒數日，記錄重要里程碑。',

  toolsTitle: '實用工具箱',
  toolsSubtitle: '時間與生活效率助手',
  toolsDesc: '日期間隔換算、公農曆黃曆互查、番茄專注計時與天氣速查。',
  toolsTabDateCalc: '日期間隔計算',
  toolsTabLunar: '農曆黃曆轉換',
  toolsTabPomodoro: '番茄專注計時',
  weatherQuickBtn: '天氣速覽',
  dateDiffCardTitle: '兩日期間隔天數',
  dateDiffCardDesc: '計算兩個日期之間的精確相隔天數與週數',
  dateOffsetCardTitle: '以某天為基準推算',
  dateOffsetCardDesc: '以指定基準日期推算前後若干天是哪一天及星期幾',
  daysFromTodayCardTitle: '距離當前日期天數計算',
  daysFromTodayCardDesc: '快速計算目標日期距離今天還剩多少天，或某一里程碑已過去多少天',
  targetDateLabel: '目標日期',
  daysUntilLabel: '距離目標還剩',
  daysPassedLabel: '距今已過去',
  startDateLabel: '起始日期',
  endDateLabel: '結束日期',
  daysApartLabel: '相隔天數',
  baseDateLabel: '基準日期',
  offsetDaysLabel: '推算天數 (正數往後 / 負數往前)',
  calculatedDateLabel: '推算結果',
  weekdayLabel: '星期幾',
  lunarDetailsTitle: '農曆與二十四節氣詳解',
  lunarGanZhi: '天干地支甲子',
  lunarZodiac: '生肖屬相',
  lunarSolarTerm: '二十四節氣',
  lunarFestival: '傳統節日',
  almanacYiLabel: '宜',
  almanacJiLabel: '忌',
  almanacZodiacLabel: '生肖',
  almanacWeekLabel: '週數',
  dailyQuoteTitle: '每日名言雅句',
  refreshQuoteTooltip: '更換雅句',
  pomoFocusSession: '專注學習 (25分鐘)',
  pomoShortBreak: '短休息 (5分鐘)',
  pomoLongBreak: '長休息 (15分鐘)',
  pomoStart: '開始專注',
  pomoPause: '暫停計時',
  pomoReset: '重設',
  pomoCompletedCount: '已累計完成番茄鐘',

  scheduleTodayTitle: '今日全景概覽',
  schedulePastTitle: '過去的待辦事項',
  scheduleFutureTitle: '未來規劃與倒數',
  annualDayProgress: '年度進度',
  annualDaysLeft: '距今年結束還有',
  pastTasksArchive: '歷史待辦事項與日程回顧',
  noPastTasks: '該日期沒有安排任何待辦事項或日程。',
  futurePlansTitle: '當日日程規劃',
  noFuturePlans: '該日期暫未安排日程。',
  jumpToDayView: '進入日檢視',
  createEventForDate: '在此日期新增',

  todoInbox: '收集箱',
  todoToday: '今天',
  todoNext7Days: '最近 7 天',
  todoCompleted: '已完成',
  todoOverdue: '已逾期',
  todoUpcoming: '稍後待辦',
  todoQuickAddPlaceholder: '新增待辦任務，按 Enter 快速新增...',
  priorityLabel: '優先順序',
  priorityHigh: '高優先順序',
  priorityMedium: '中優先順序',
  priorityLow: '低優先順序',
  priorityNone: '無優先順序',
  todayProgress: '今日進度',
  clearCompleted: '清理已完成',
  clearCompletedConfirm: '確定要徹底移除所有已完成的待辦事項嗎？',
  taskCompletedStatus: '已完成',
  taskPendingStatus: '待處理',

  settingsTabPreferences: '行事曆偏好習慣',
  settingsTabAppearance: '外觀與個人化',
  settingsTabLanguage: '語言與地區',
  settingsTabBackup: '本機備份與同步',
  settingsTabCategories: '分類標籤管理',
  settingsTabDisplay: '行事曆與時間顯示',
  settingsShowLunarLabel: '顯示農曆與二十四節氣',
  settingsShowLunarDesc: '在行事曆格展示農曆傳統節日、節氣與天干地支（非中文介面自動隱藏）',
  settingsShowWeatherLabel: '顯示天氣預報圖示',
  settingsShowWeatherDesc: '在行事曆儲存格呈現極簡天氣狀態圖示',

  worldClock: '世界時鐘',
  worldClockLocal: '本機當地時間',
  worldClockGmt: '格林威治標準時間 (GMT)',
  worldClockNewYork: '紐約',
  worldClockSyncSuccess: '已同步校準時間：+0.00s 誤差 · NTP精準同步',
  worldClockDetailTitle: '精準世界時鐘與時區全景',
  worldClockLocationPrefix: '現在的地址：',
  worldClockPrecisionNotice: '您的裝置時間與標準授時完全同步 (誤差 ±0.002秒)',
  worldClockSunTimes: '日出與日落',
  worldMapButton: '時區地圖',
  worldMapTitle: '時區地圖',
  worldMapSearchPlaceholder: '按城市、國家或時區搜尋（如：香港、紐約、GMT+8）...',
  worldMapTimezone: '時區',
  voiceControlTitle: '語音操控',
  voiceControlListening: '正在聆聽語音指令...',
  voiceControlHelp: '您可以說出「返回」、「時鐘」、「行事曆」、「今天」或「待辦」',
  backButton: '返回',

  calendarLayoutLabel: '行事曆卡片拉伸顯示模式',
  layoutSplit: '上下分割畫面 (圖文畫卷)',
  layoutZen: '純粹全行事曆 (大網格)',
  layoutScenic: '圖文名句畫卷',
  layoutFullBg: '沉浸桌布鋪平',
  bgImagePosLabel: '藝術背景圖顯示位置',
  bgImageBottom: '嚴格限定在中下部圖文區',
  bgImageFullscreen: '背景圖鋪平整個頁面',
  bgImageNone: '純淨色塊 (不顯示背景圖)',
};

const ja: Translations = {
  ...en,
  appName: 'マイカレンダー',
  today: '今日',
  tomorrow: '明日',
  yesterday: '昨日',
  allDay: '終日',
  viewMonth: '月',
  viewWeek: '週',
  viewDay: '日',
  viewAgenda: 'やること',
  viewYear: '年',
  createEvent: 'イベント作成',
  editEvent: '編集',
  deleteEvent: '削除',
  saveChanges: '保存',
  cancel: 'キャンセル',
  done: '完了',
  worldClock: '世界時計',
  worldClockLocal: '現地時間',
  worldClockGmt: 'グリニッジ標準時 (GMT)',
  worldClockNewYork: 'ニューヨーク',
  worldClockSyncSuccess: 'システム時刻同期完了: ±0.00s',
  worldClockDetailTitle: '高精度世界時計・タイムゾーン',
  worldClockLocationPrefix: '現在地：',
  worldMapButton: '時差マップ',
  worldMapTitle: '時差マップ',
  worldMapSearchPlaceholder: '都市・国・タイムゾーンを検索 (例: 東京, UTC+9)...',
  backButton: '戻る',
  voiceControlTitle: '音声操作',
  voiceControlListening: '音声コマンド待機中...',
  voiceControlHelp: '「戻る」「時計」「今日」「カレンダー」と話しかけてください',
  navCalendar: 'カレンダー',
  navAgenda: 'やること',
  navCountdowns: 'カウントダウン',
  navTools: 'ツール',
  navSettings: '設定',
  settingsTitle: '設定と環境設定',
  settingsTabPreferences: 'カレンダー習慣',
  settingsTabAppearance: '外観とテーマ',
  settingsTabLanguage: '言語と地域',
  settingsTabBackup: 'バックアップと同期',
  settingsTabCategories: 'カテゴリ管理',
  todoInbox: '受信箱',
  todoToday: '今日',
  todoNext7Days: '今後7日間',
  todoCompleted: '完了済み',
  todoOverdue: '期限超過',
  todoQuickAddPlaceholder: '新しいタスクを追加、Enterを押す...',
  priorityLabel: '優先度',
  priorityHigh: '高',
  priorityMedium: '中',
  priorityLow: '低',
  todayProgress: '本日の進捗',
  clearCompleted: '完了タスクをクリア',
};

const ko: Translations = {
  ...en,
  appName: '내 캘린더',
  today: '오늘',
  tomorrow: '내일',
  yesterday: '어제',
  allDay: '종일',
  viewMonth: '월',
  viewWeek: '주',
  viewDay: '일',
  viewAgenda: '할 일',
  viewYear: '년',
  createEvent: '일정 추가',
  editEvent: '일정 편집',
  deleteEvent: '일정 삭제',
  saveChanges: '저장',
  cancel: '취소',
  done: '완료',
  worldClock: '세계 시계',
  worldClockLocal: '현지 시간',
  worldClockGmt: '그리니치 표준시 (GMT)',
  worldClockNewYork: '뉴욕',
  worldClockSyncSuccess: '원자시계 표준 동기화 완료: ±0.00s',
  worldClockDetailTitle: '고정밀 세계 시계 및 타임존',
  worldClockLocationPrefix: '현재 위치:',
  worldMapButton: '시간대 지도',
  worldMapTitle: '시간대 지도',
  worldMapSearchPlaceholder: '도시, 국가 또는 시간대 검색 (예: 서울, UTC+9)...',
  backButton: '뒤로',
  voiceControlTitle: '음성 제어',
  voiceControlListening: '음성 명령을 듣고 있습니다...',
  voiceControlHelp: '"뒤로", "시계", "오늘", "캘린더"라고 말씀해보세요',
  navCalendar: '캘린더',
  navAgenda: '할 일',
  navCountdowns: '디데이',
  navTools: '도구',
  navSettings: '설정',
  settingsTitle: '설정 및 환경설정',
  settingsTabPreferences: '캘린더 환경설정',
  settingsTabAppearance: '테마 및 디자인',
  settingsTabLanguage: '언어 및 지역',
  settingsTabBackup: '백업 및 동기화',
  settingsTabCategories: '카테고리 관리',
  todoInbox: '받은편지함',
  todoToday: '오늘',
  todoNext7Days: '다음 7일',
  todoCompleted: '완료됨',
  todoOverdue: '기한 지남',
  todoQuickAddPlaceholder: '할 일 추가, Enter 키 입력...',
  priorityLabel: '우선순위',
  priorityHigh: '높음',
  priorityMedium: '중간',
  priorityLow: '낮음',
  todayProgress: '오늘의 진행률',
  clearCompleted: '완료 항목 정리',
};

const fr: Translations = {
  ...en,
  appName: 'Mon Calendrier',
  today: "Aujourd'hui",
  tomorrow: 'Demain',
  yesterday: 'Hier',
  allDay: 'Journée entière',
  viewMonth: 'Mois',
  viewWeek: 'Semaine',
  viewDay: 'Jour',
  viewAgenda: 'Tâches',
  viewYear: 'Année',
  createEvent: 'Nouvel événement',
  editEvent: "Modifier l'événement",
  deleteEvent: "Supprimer l'événement",
  saveChanges: 'Enregistrer',
  cancel: 'Annuler',
  done: 'Terminé',
  worldClock: 'Horloge Mondiale',
  worldClockLocal: 'Heure locale',
  worldClockGmt: 'Heure GMT / UTC',
  worldClockNewYork: 'New York',
  worldClockSyncSuccess: 'Horloge synchronisée avec précision : ±0.00s',
  worldClockDetailTitle: 'Horloge Mondiale de Haute Précision',
  worldClockLocationPrefix: 'Emplacement actuel :',
  worldMapButton: 'Carte des fuseaux',
  worldMapTitle: 'Carte des fuseaux horaires',
  worldMapSearchPlaceholder: 'Rechercher ville, pays ou fuseau (ex: Paris, UTC+1)...',
  backButton: 'Retour',
  voiceControlTitle: 'Contrôle Vocal',
  voiceControlListening: 'Écoute des commandes vocales...',
  voiceControlHelp: 'Dites "Retour", "Horloge", "Calendrier" ou "Aujourd\'hui"',
  navCalendar: 'Calendrier',
  navAgenda: 'Tâches',
  navCountdowns: 'Compte à rebours',
  navTools: 'Outils',
  navSettings: 'Paramètres',
  settingsTitle: 'Paramètres et Préférences',
  settingsTabPreferences: 'Habitudes du Calendrier',
  settingsTabAppearance: 'Thème & Apparence',
  settingsTabLanguage: 'Langue & Région',
  settingsTabBackup: 'Sauvegarde & Synchronisation',
  settingsTabCategories: 'Gestion des Catégories',
  todoInbox: 'Boîte de réception',
  todoToday: "Aujourd'hui",
  todoNext7Days: '7 prochains jours',
  todoCompleted: 'Terminé',
  todoOverdue: 'En retard',
  todoQuickAddPlaceholder: 'Ajouter une tâche, appuyez sur Entrée...',
  priorityLabel: 'Priorité',
  priorityHigh: 'Haute',
  priorityMedium: 'Moyenne',
  priorityLow: 'Basse',
  todayProgress: "Progression d'aujourd'hui",
  clearCompleted: 'Effacer les tâches terminées',
};

const ru: Translations = {
  ...en,
  appName: 'Мой Календарь',
  today: 'Сегодня',
  tomorrow: 'Завтра',
  yesterday: 'Вчера',
  allDay: 'Весь день',
  viewMonth: 'Месяц',
  viewWeek: 'Неделя',
  viewDay: 'День',
  viewAgenda: 'Задачи',
  viewYear: 'Год',
  createEvent: 'Новое событие',
  editEvent: 'Редактировать',
  deleteEvent: 'Удалить',
  saveChanges: 'Сохранить',
  cancel: 'Отмена',
  done: 'Готово',
  worldClock: 'Мировое Время',
  worldClockLocal: 'Местное время',
  worldClockGmt: 'Время по Гринвичу (GMT/UTC)',
  worldClockNewYork: 'Нью-Йорк',
  worldClockSyncSuccess: 'Время синхронизировано: погрешность ±0.00с',
  worldClockDetailTitle: 'Высокоточные Мировые Часы',
  worldClockLocationPrefix: 'Текущее местоположение:',
  worldMapButton: 'Карта поясов',
  worldMapTitle: 'Карта часовых поясов',
  worldMapSearchPlaceholder: 'Поиск по городу, стране или поясу (напр. Москва, UTC+3)...',
  backButton: 'Назад',
  voiceControlTitle: 'Голосовое управление',
  voiceControlListening: 'Слушаю голосовую команду...',
  voiceControlHelp: 'Скажите "Назад", "Часы", "Сегодня" или "Календарь"',
  navCalendar: 'Календарь',
  navAgenda: 'Задачи',
  navCountdowns: 'События',
  navTools: 'Утилиты',
  navSettings: 'Настройки',
  settingsTitle: 'Настройки',
  settingsTabPreferences: 'Параметры календаря',
  settingsTabAppearance: 'Темы и оформление',
  settingsTabLanguage: 'Язык и регион',
  settingsTabBackup: 'Резервное копирование',
  settingsTabCategories: 'Категории',
  todoInbox: 'Входящие',
  todoToday: 'Сегодня',
  todoNext7Days: 'Следующие 7 дней',
  todoCompleted: 'Завершено',
  todoOverdue: 'Просрочено',
  todoQuickAddPlaceholder: 'Добавить задачу, нажмите Enter...',
  priorityLabel: 'Приоритет',
  priorityHigh: 'Высокий',
  priorityMedium: 'Средний',
  priorityLow: 'Низкий',
  todayProgress: 'Прогресс за день',
  clearCompleted: 'Очистить выполненные',
};

const fa: Translations = {
  ...en,
  appName: 'تقویم من',
  today: 'امروز',
  tomorrow: 'فردا',
  yesterday: 'دیروز',
  allDay: 'تمام روز',
  viewMonth: 'ماه',
  viewWeek: 'هفته',
  viewDay: 'روز',
  viewAgenda: 'وظایف',
  viewYear: 'سال',
  createEvent: 'رویداد جدید',
  editEvent: 'ویرایش رویداد',
  deleteEvent: 'حذف رویداد',
  saveChanges: 'ذخیره',
  cancel: 'لغو',
  done: 'انجام شد',
  worldClock: 'ساعت جهانی',
  worldClockLocal: 'زمان محلی',
  worldClockGmt: 'گرینویچ (GMT/UTC)',
  worldClockNewYork: 'نیویورک',
  worldClockSyncSuccess: 'همگام‌سازی دقیق ساعت انجام شد: ±۰.۰۰ ثانیه',
  worldClockDetailTitle: 'ساعت جهانی با دقت بالا',
  worldClockLocationPrefix: 'موقعیت مکانی فعلی:',
  worldMapButton: 'نقشه زمانی',
  worldMapTitle: 'نقشه مناطق زمانی',
  worldMapSearchPlaceholder: 'جستجوی شهر، کشور یا منطقه زمانی...',
  backButton: 'بازگشت',
  voiceControlTitle: 'کنترل صوتی',
  voiceControlListening: 'در حال شنیدن فرمان صوتی...',
  voiceControlHelp: 'بگویید «بازگشت»، «ساعت»، «امروز» یا «تقویم»',
  navCalendar: 'تقویم',
  navAgenda: 'وظایف',
  navCountdowns: 'شمارش معکوس',
  navTools: 'ابزارها',
  navSettings: 'تنظیمات',
  settingsTitle: 'تنظیمات',
  settingsTabPreferences: 'عادات تقویم',
  settingsTabAppearance: 'ظاهر و تم',
  settingsTabLanguage: 'زبان و منطقه',
  settingsTabBackup: 'پشتیبان‌گیری',
  settingsTabCategories: 'دسته‌بندی‌ها',
  todoInbox: 'صندوق ورودی',
  todoToday: 'امروز',
  todoNext7Days: '۷ روز آینده',
  todoCompleted: 'انجام شده',
  todoOverdue: 'به تعویق افتاده',
  todoQuickAddPlaceholder: 'افزودن وظیفه، Enter را بزنید...',
  priorityLabel: 'اولویت',
  priorityHigh: 'بالا',
  priorityMedium: 'متوسط',
  priorityLow: 'پایین',
  todayProgress: 'پیشرفت امروز',
  clearCompleted: 'پاکسازی انجام‌شده‌ها',
};

const mn: Translations = {
  ...en,
  appName: 'Миний Хуанли',
  today: 'Өнөөдөр',
  tomorrow: 'Маргааш',
  yesterday: 'Өчигдөр',
  allDay: 'Бүтэн өдөр',
  viewMonth: 'Сар',
  viewWeek: 'Долоо хоног',
  viewDay: 'Өдөр',
  viewAgenda: 'Төлөвлөгөө',
  viewYear: 'Жил',
  createEvent: 'Үйл явдал нэмэх',
  editEvent: 'Засах',
  deleteEvent: 'Устгах',
  saveChanges: 'Хадгалах',
  cancel: 'Цуцлах',
  done: 'Бэлэн',
  worldClock: 'Дэлхийн Цаг',
  worldClockLocal: 'Орон нутгийн цаг',
  worldClockGmt: 'Гринвичийн цаг (GMT)',
  worldClockNewYork: 'Нью-Йорк',
  worldClockSyncSuccess: 'Цаг амжилттай тохируулагдлаа: ±0.00с',
  worldClockDetailTitle: 'Дэлхийн Цагийн Нарийвчилсан Систем',
  worldClockLocationPrefix: 'Одоогийн байршил:',
  worldMapButton: 'Цагийн зураг',
  worldMapTitle: 'Цагийн бүсийн зураг',
  worldMapSearchPlaceholder: 'Хот, улс эсвэл цагийн бүс хайх (жишээ нь: Улаанбаатар, UTC+8)...',
  backButton: 'Буцах',
  voiceControlTitle: 'Дуут удирдлага',
  voiceControlListening: 'Дуут командыг сонсож байна...',
  voiceControlHelp: '"Буцах", "Цаг", "Өнөөдөр" гэж хэлнэ үү',
  navCalendar: 'Хуанли',
  navAgenda: 'Төлөвлөгөө',
  navCountdowns: 'Тоолол',
  navTools: 'Хэрэгсэл',
  navSettings: 'Тохиргоо',
  settingsTitle: 'Тохиргоо',
  settingsTabPreferences: 'Хуанлийн тохиргоо',
  settingsTabAppearance: 'Харагдах байдал',
  settingsTabLanguage: 'Хэл ба бүс нутаг',
  settingsTabBackup: 'Нөөцлөлт ба синхрончлол',
  settingsTabCategories: 'Ангилал удирдах',
  todoInbox: 'Ирсэн хайрцаг',
  todoToday: 'Өнөөдөр',
  todoNext7Days: 'Дараагийн 7 хоног',
  todoCompleted: 'Дууссан',
  todoOverdue: 'Хугацаа хэтэрсэн',
  todoQuickAddPlaceholder: 'Шинэ ажил нэмэх, Enter дарна уу...',
  priorityLabel: 'Ач холбогдол',
  priorityHigh: 'Өндөр',
  priorityMedium: 'Дунд',
  priorityLow: 'Бага',
  todayProgress: 'Өнөөдрийн явц',
  clearCompleted: 'Дууссаныг цэвэрлэх',
};

const ug: Translations = {
  ...en,
  appName: 'مېنىڭ كالىندارىم',
  today: 'بۈگۈن',
  tomorrow: 'ئەتە',
  yesterday: 'تۈنۈگۈن',
  allDay: 'پۈتۈن كۈن',
  viewMonth: 'ئاي',
  viewWeek: 'ھەپتە',
  viewDay: 'كۈن',
  viewAgenda: 'ۋەزىپە',
  viewYear: 'يىل',
  createEvent: 'يېڭى پائالىيەت',
  editEvent: 'تەھرىرلەش',
  deleteEvent: 'ئۆچۈرۈش',
  saveChanges: 'ساقلاش',
  cancel: 'بىكار قىلىش',
  done: 'تامام',
  worldClock: 'دۇنيا سائىتى',
  worldClockLocal: 'يەرلىك ۋاقىت',
  worldClockGmt: 'گىرىنۋىچ ۋاقتى (GMT)',
  worldClockNewYork: 'نيۇ-يورك',
  worldClockSyncSuccess: 'سائەت مۇۋەپپەقىيەتلىك تەڭشەلدى: ±0.00 سېكۇنت',
  worldClockDetailTitle: 'ئېنىق دۇنيا سائىتى ۋە ۋاقىت رايونى',
  worldClockLocationPrefix: 'ھازىرقى ئورۇن:',
  worldMapButton: 'ۋاقىت رايونى خەرىتىسى',
  worldMapTitle: 'ۋاقىت رايونى خەرىتىسى',
  worldMapSearchPlaceholder: 'شەھەر ياكى رايون ئىزدەش...',
  backButton: 'قايتىش',
  voiceControlTitle: 'ئاۋازلىق كونترول',
  voiceControlListening: 'ئاۋازلىق بۇيرۇقنى كۈتۈۋاتىدۇ...',
  voiceControlHelp: '«قايتىش»، «سائەت»، «بۈگۈن» دەپ سىناپ بېقىڭ',
  navCalendar: 'كالىندار',
  navAgenda: 'ۋەزىپە',
  navCountdowns: 'كۈن ساناش',
  navTools: 'قوراللار',
  navSettings: 'تەڭشەك',
  settingsTitle: 'تەڭشەكلەر',
  settingsTabPreferences: 'كالىندار ئادىتى',
  settingsTabAppearance: 'كۆرۈنۈش تەڭشىكى',
  settingsTabLanguage: 'تىل ۋە رايون',
  settingsTabBackup: 'زاپاسلاش ۋە ئەسلىگە كەلتۈرۈش',
  settingsTabCategories: 'سەھىپە باشقۇرۇش',
  todoInbox: 'كىرىش ساندۇقى',
  todoToday: 'بۈگۈن',
  todoNext7Days: 'كەينىدىكى 7 كۈن',
  todoCompleted: 'تاماملانغان',
  todoOverdue: 'ۋاقتى ئۆتكەن',
  todoQuickAddPlaceholder: 'يېڭى ۋەزىپە قوشۇش، Enter نى بېسىڭ...',
  priorityLabel: 'دەرىجىسى',
  priorityHigh: 'يۇقىرى',
  priorityMedium: 'ئوتتۇرا',
  priorityLow: 'تۆۋەن',
  todayProgress: 'بۈگۈنكى جەريان',
  clearCompleted: 'تاماملانغانلارنى تازىلاش',
};

export const dictionaries: Record<Language, Translations> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  en,
  ja,
  ko,
  fr,
  fa,
  mn,
  ru,
  ug,
};

const EXTRA_TRANSLATIONS: Record<Language, Partial<Translations>> = {
  'zh-CN': {
    navFocus: '专注',
    navWorldClock: '时钟',
    financeTitle: '市场与金融指数',
    stocksTitle: '沪深港美核心股指',
    metalsTitle: '贵金属与工业金属走势',
    macroTitle: '宏观经济指标 (PMI & CPI)',
    gold: '黄金 (XAU)',
    silver: '白银 (XAG)',
    copper: '铜',
    aluminum: '铝',
    pmiManufacturing: '制造业 PMI',
    pmiNonManufacturing: '非制造业 PMI',
    pmiThreshold: '50% 荣枯景气分界线',
    cpiYoY: '居民消费价格指数 CPI (同比)',
    fiveYearTrend: '近5年历史走势 (2021-2026)',
    pomodoroTitle: '番茄时钟',
    pomodoroDesc: '基于番茄工作法的深度专注与原生白噪音沉浸',
    pomoWork: '专注工作',
    pomoSelectTask: '关联待办任务',
    pomoNoTask: '自由专注 (无关联任务)',
    pomoEstTomatoes: '预估番茄',
    pomoCompTomatoes: '已完成番茄',
    ambientSoundLabel: '环境白噪音',
    ambientRain: '淅沥春雨',
    ambientForest: '森林鸟鸣',
    ambientWaves: '静谧海浪',
    ambientCafe: '午后咖啡馆',
    ambientCampfire: '壁炉篝火',
    ambientWhiteNoise: '粉红白噪音',
    fullscreenFocus: '全屏沉浸专注',
    strictModeLabel: '严格防打扰模式',
    clockModeFlip: '3D 机械翻页钟',
    clockModeAnalog: '精密拟物指针',
    clockModeCapsule: '极简动态胶囊',
    clockModeGlass: '液态高斯毛玻璃',
    clockModeHud: '科幻矩阵仪表盘',
    clockModeMinimal: '瑞士极简排版钟',
  },
  'zh-TW': {
    navFocus: '專注',
    navWorldClock: '時鐘',
    financeTitle: '市場與金融指數',
    stocksTitle: '滬深港美核心股指',
    metalsTitle: '貴金屬與工業金屬走勢',
    macroTitle: '宏觀經濟指標 (PMI & CPI)',
    gold: '黃金 (XAU)',
    silver: '白銀 (XAG)',
    copper: '銅',
    aluminum: '鋁',
    pmiManufacturing: '製造業 PMI',
    pmiNonManufacturing: '非製造業 PMI',
    pmiThreshold: '50% 榮枯景氣分界線',
    cpiYoY: '居民消費價格指數 CPI (同比)',
    fiveYearTrend: '近5年歷史走勢 (2021-2026)',
    pomodoroTitle: '番茄時鐘',
    pomodoroDesc: '基於番茄工作法的深度專注與原生白雜訊沉浸',
    pomoWork: '專注工作',
    pomoSelectTask: '關聯待辦任務',
    pomoNoTask: '自由專注 (無關聯任務)',
    pomoEstTomatoes: '預估番茄',
    pomoCompTomatoes: '已完成番茄',
    ambientSoundLabel: '環境白雜訊',
    ambientRain: '淅瀝春雨',
    ambientForest: '森林鳥鳴',
    ambientWaves: '靜謐海浪',
    ambientCafe: '午後咖啡館',
    ambientCampfire: '壁爐篝火',
    ambientWhiteNoise: '粉紅白雜訊',
    fullscreenFocus: '全螢幕沉浸專注',
    strictModeLabel: '嚴格防打擾模式',
    clockModeFlip: '3D 機械翻頁鐘',
    clockModeAnalog: '精密擬物指針',
    clockModeCapsule: '極簡動態膠囊',
    clockModeGlass: '液態高斯毛玻璃',
    clockModeHud: '科幻矩陣儀表板',
    clockModeMinimal: '瑞士極簡排版鐘',
  },
  'en': {
    navFocus: 'Focus',
    navWorldClock: 'Clock',
    financeTitle: 'Markets & Financial Indices',
    stocksTitle: 'Global Core Stock Indices',
    metalsTitle: 'Precious & Industrial Metals',
    macroTitle: 'Macroeconomic Indicators (PMI & CPI)',
    gold: 'Gold (XAU)',
    silver: 'Silver (XAG)',
    copper: 'Copper',
    aluminum: 'Aluminum',
    pmiManufacturing: 'Manufacturing PMI',
    pmiNonManufacturing: 'Non-Manufacturing PMI',
    pmiThreshold: '50% Boom-Bust Line',
    cpiYoY: 'Consumer Price Index (CPI YoY)',
    fiveYearTrend: '5-Year Historical Trend (2021-2026)',
    pomodoroTitle: 'Pomodoro Timer',
    pomodoroDesc: 'Deep work method with synthesized ambient noise',
    pomoWork: 'Focus Work',
    pomoSelectTask: 'Link to Active Task',
    pomoNoTask: 'Free Focus (No Task)',
    pomoEstTomatoes: 'Estimated Pomodoros',
    pomoCompTomatoes: 'Completed Pomodoros',
    ambientSoundLabel: 'Ambient Sound',
    ambientRain: 'Gentle Rain',
    ambientForest: 'Forest Breeze',
    ambientWaves: 'Ocean Waves',
    ambientCafe: 'Cozy Cafe',
    ambientCampfire: 'Campfire',
    ambientWhiteNoise: 'White Noise',
    fullscreenFocus: 'Fullscreen Immersion',
    strictModeLabel: 'Strict Anti-Distraction',
    clockModeFlip: '3D Mechanical Flip',
    clockModeAnalog: 'Precision Analog',
    clockModeCapsule: 'Dynamic Capsule',
    clockModeGlass: 'Liquid Gaussian Glass',
    clockModeHud: 'Cyber Hologram HUD',
    clockModeMinimal: 'Swiss Typo Minimal',
  },
  'ja': {
    navFocus: '集中',
    navWorldClock: '時計',
    financeTitle: '市場と金融指標',
    stocksTitle: '主要株価指数',
    metalsTitle: '貴金属・工業用金属',
    macroTitle: 'マクロ経済指標 (PMI & CPI)',
    gold: '金 (XAU)',
    silver: '銀 (XAG)',
    copper: '銅',
    aluminum: 'アルミ',
    pmiManufacturing: '製造業 PMI',
    pmiNonManufacturing: '非製造業 PMI',
    pmiThreshold: '50% 好不況の分岐点',
    cpiYoY: '消費者物価指数 CPI (前年比)',
    fiveYearTrend: '過去5年間の推移 (2021-2026)',
    pomodoroTitle: 'ポモドーロ時計',
    pomodoroDesc: 'ポモドーロ法と環境ホワイトノイズによる没入',
    pomoWork: '集中作業',
    pomoSelectTask: 'タスクと連携',
    pomoNoTask: 'フリー集中 (タスクなし)',
    pomoEstTomatoes: '予想ポモドーロ',
    pomoCompTomatoes: '完了ポモドーロ',
    ambientSoundLabel: '環境ホワイトノイズ',
    ambientRain: '穏やかな雨音',
    ambientForest: '森のささやき',
    ambientWaves: '波の音',
    ambientCafe: 'カフェの環境音',
    ambientCampfire: '焚き火の音',
    ambientWhiteNoise: 'ホワイトノイズ',
    fullscreenFocus: 'フルスクリーン没入',
    strictModeLabel: '厳格集中モード',
    clockModeFlip: '3D フリップ時計',
    clockModeAnalog: '精密アナログ時計',
    clockModeCapsule: 'ミニマルカプセル',
    clockModeGlass: 'リキッドガラス',
    clockModeHud: 'サイバーHUDメーター',
    clockModeMinimal: 'スイスタイポグラフィ',
  },
  'ko': {
    navFocus: '몰입',
    navWorldClock: '시계',
    financeTitle: '시장 및 금융 지수',
    stocksTitle: '글로벌 핵심 주가지수',
    metalsTitle: '귀금속 및 산업 금속',
    macroTitle: '거시경제 지표 (PMI & CPI)',
    gold: '금 (XAU)',
    silver: '은 (XAG)',
    copper: '구리',
    aluminum: '알루미늄',
    pmiManufacturing: '제조업 PMI',
    pmiNonManufacturing: '비제조업 PMI',
    pmiThreshold: '50% 경기 수축/확장 분기점',
    cpiYoY: '소비자물가지수 CPI (전년비)',
    fiveYearTrend: '최근 5개년 추이 (2021-2026)',
    pomodoroTitle: '뽀모도로 타이머',
    pomodoroDesc: '뽀모도로 기법과 백색소음을 통한 깊은 몰입',
    pomoWork: '집중 작업',
    pomoSelectTask: '할 일 연결',
    pomoNoTask: '자유 몰입 (연결 없음)',
    pomoEstTomatoes: '예상 뽀모도로',
    pomoCompTomatoes: '완료 뽀모도로',
    ambientSoundLabel: '자연 백색소음',
    ambientRain: '봄비 소리',
    ambientForest: '숲속 바람소리',
    ambientWaves: '파도 소리',
    ambientCafe: '카페 분위기',
    ambientCampfire: '모닥불 타는 소리',
    ambientWhiteNoise: '화이트 노이즈',
    fullscreenFocus: '전체화면 몰입',
    strictModeLabel: '방해 금지 엄격 모드',
    clockModeFlip: '3D 플립 시계',
    clockModeAnalog: '정밀 아날로그 시계',
    clockModeCapsule: '미니멀 캡슐',
    clockModeGlass: '글래스모피즘',
    clockModeHud: '사이버 매트릭스 HUD',
    clockModeMinimal: '스위스 타이포그래피',
  },
  'fr': {
    navFocus: 'Focus',
    navWorldClock: 'Horloge',
    financeTitle: 'Marchés et Indices Financiers',
    stocksTitle: 'Principaux Indices Boursiers',
    metalsTitle: 'Métaux Précieux & Industriels',
    macroTitle: 'Indicateurs Macroéconomiques (PMI & CPI)',
    gold: 'Or (XAU)',
    silver: 'Argent (XAG)',
    copper: 'Cuivre',
    aluminum: 'Aluminium',
    pmiManufacturing: 'PMI Manufacturier',
    pmiNonManufacturing: 'PMI Services',
    pmiThreshold: 'Seuil de 50% Expansion/Contraction',
    cpiYoY: 'Indice des Prix à la Consommation (IPC)',
    fiveYearTrend: 'Tendance sur 5 Ans (2021-2026)',
    pomodoroTitle: 'Minuteur Pomodoro',
    pomodoroDesc: 'Concentration profonde et sons d’ambiance',
    pomoWork: 'Session de Travail',
    pomoSelectTask: 'Lier à une Tâche',
    pomoNoTask: 'Focus Libre (Sans Tâche)',
    pomoEstTomatoes: 'Pomodoros Estimés',
    pomoCompTomatoes: 'Pomodoros Réalisés',
    ambientSoundLabel: 'Sons d’Ambiance',
    ambientRain: 'Pluie Douce',
    ambientForest: 'Forêt Calme',
    ambientWaves: 'Vagues de l’Océan',
    ambientCafe: 'Café Confortable',
    ambientCampfire: 'Feu de Bois',
    ambientWhiteNoise: 'Bruit Blanc',
    fullscreenFocus: 'Immersion Plein Écran',
    strictModeLabel: 'Mode Strict Anti-Distraction',
    clockModeFlip: 'Horloge Flip 3D',
    clockModeAnalog: 'Horloge Analogique Précise',
    clockModeCapsule: 'Capsule Minimaliste',
    clockModeGlass: 'Verre Dépoli Liquide',
    clockModeHud: 'HUD Cyber Matrix',
    clockModeMinimal: 'Typographie Suisse',
  },
  'fa': {
    navFocus: 'تمرکز',
    navWorldClock: 'ساعت',
    financeTitle: 'بازارها و شاخص‌های مالی',
    stocksTitle: 'شاخص‌های اصلی سهام جهان',
    metalsTitle: 'فلزات گرانبها و صنعتی',
    macroTitle: 'شاخص‌های کلان اقتصادی (PMI & CPI)',
    gold: 'طلا (XAU)',
    silver: 'نقره (XAG)',
    copper: 'مس',
    aluminum: 'آلومینیوم',
    pmiManufacturing: 'شاخص مدیران خرید صنعتی (PMI)',
    pmiNonManufacturing: 'شاخص PMI غیرصنعتی',
    pmiThreshold: 'مرز ۵۰٪ رونق و رکود',
    cpiYoY: 'شاخص قیمت مصرف‌کننده (تورم)',
    fiveYearTrend: 'روند ۵ ساله اخیر (۲۰۲۱-۲۰۲۶)',
    pomodoroTitle: 'تایمر پومودورو حرفه‌ای',
    pomodoroDesc: 'تمرکز عمیق با صدای سفید و آرامش‌بخش',
    pomoWork: 'کار و تمرکز',
    pomoSelectTask: 'اتصال به کار انتخابی',
    pomoNoTask: 'تمرکز آزاد (بدون کار)',
    pomoEstTomatoes: 'پومودورو تخمینی',
    pomoCompTomatoes: 'پومودورو کامل شده',
    ambientSoundLabel: 'صدای محیطی آرامش‌بخش',
    ambientRain: 'باران ملایم',
    ambientForest: 'نسیم جنگل',
    ambientWaves: 'امواج دریا',
    ambientCafe: 'کافه دنج',
    ambientCampfire: 'آتش هیزمی',
    ambientWhiteNoise: 'نویز سفید',
    fullscreenFocus: 'حالت تمام‌صفحه غوطه‌وری',
    strictModeLabel: 'حالت تمرکز اکید',
    clockModeFlip: 'ساعت مکانیکی فلیپ',
    clockModeAnalog: 'ساعت عقربه‌ای دقیق',
    clockModeCapsule: 'کپسول پویا',
    clockModeGlass: 'شیشه مات نئومورفیک',
    clockModeHud: 'نمایشگر سایبر هولوگرافیک',
    clockModeMinimal: 'تایپوگرافی مینیمال',
  },
  'mn': {
    navFocus: 'Төвлөрөл',
    navWorldClock: 'Цаг',
    financeTitle: 'Зах зээл ба санхүүгийн индекс',
    stocksTitle: 'Дэлхийн гол хувьцааны индексүүд',
    metalsTitle: 'Үнэт ба аж үйлдвэрийн металлууд',
    macroTitle: 'Макро эдийн засгийн үзүүлэлтүүд (PMI & CPI)',
    gold: 'Алт (XAU)',
    silver: 'Мөнгө (XAG)',
    copper: 'Зэс',
    aluminum: 'Хөнгөн цагаан',
    pmiManufacturing: 'Үйлдвэрлэлийн PMI',
    pmiNonManufacturing: 'Үйлчилгээний PMI',
    pmiThreshold: '50% Сэргэлт ба бууралтын зааг',
    cpiYoY: 'Хэрэглээний үнийн индекс (CPI)',
    fiveYearTrend: 'Сүүлийн 5 жилийн хандлага (2021-2026)',
    pomodoroTitle: 'Помодоро төвлөрлийн цаг',
    pomodoroDesc: 'Гүн төвлөрөл ба байгалийн дуу авиа',
    pomoWork: 'Төвлөрч ажиллах',
    pomoSelectTask: 'Даалгавартай холбох',
    pomoNoTask: 'Чөлөөт төвлөрөл (Холбоогүй)',
    pomoEstTomatoes: 'Төлөвлөсөн улаан лооль',
    pomoCompTomatoes: 'Гүйцэтгэсэн улаан лооль',
    ambientSoundLabel: 'Орчны дуу авиа',
    ambientRain: 'Ширүүн бороо',
    ambientForest: 'Ойн салхи',
    ambientWaves: 'Далайн давалгаа',
    ambientCafe: 'Тав тухтай кофе шоп',
    ambientCampfire: 'Түүдэг гал',
    ambientWhiteNoise: 'Цагаан шуугиан',
    fullscreenFocus: 'Бүрэн дэлгэцийн горим',
    strictModeLabel: 'Хатуу төвлөрлийн горим',
    clockModeFlip: '3D Эргэдэг цаг',
    clockModeAnalog: 'Зүүт цаг',
    clockModeCapsule: 'Хялбар капсул',
    clockModeGlass: 'Шилэн гадаргуу',
    clockModeHud: 'Кибер матрикс HUD',
    clockModeMinimal: 'Швейцарь типографи',
  },
  'ru': {
    navFocus: 'Фокус',
    navWorldClock: 'Часы',
    financeTitle: 'Рынки и финансовые индексы',
    stocksTitle: 'Ключевые мировые индексы акций',
    metalsTitle: 'Драгоценные и промышленные металлы',
    macroTitle: 'Макроэкономические показатели (PMI & CPI)',
    gold: 'Золото (XAU)',
    silver: 'Серебро (XAG)',
    copper: 'Медь',
    aluminum: 'Алюминий',
    pmiManufacturing: 'Производственный PMI',
    pmiNonManufacturing: 'PMI в сфере услуг',
    pmiThreshold: 'Граница 50% (рост/спад)',
    cpiYoY: 'Индекс потребительских цен (ИПЦ)',
    fiveYearTrend: 'Тренд за последние 5 лет (2021-2026)',
    pomodoroTitle: 'Профессиональный Помодоро',
    pomodoroDesc: 'Глубокая концентрация со звуками природы',
    pomoWork: 'Работа и фокус',
    pomoSelectTask: 'Связать с задачей',
    pomoNoTask: 'Свободный фокус (без задачи)',
    pomoEstTomatoes: 'Оценка (помидоры)',
    pomoCompTomatoes: 'Завершено (помидоры)',
    ambientSoundLabel: 'Фоновый шум',
    ambientRain: 'Теплый дождь',
    ambientForest: 'Лесной бриз',
    ambientWaves: 'Шум океана',
    ambientCafe: 'Уютное кафе',
    ambientCampfire: 'Потрескивание костра',
    ambientWhiteNoise: 'Белый шум',
    fullscreenFocus: 'Полноэкранное погружение',
    strictModeLabel: 'Строгий режим без отвлечений',
    clockModeFlip: '3D Перекидные часы',
    clockModeAnalog: 'Стрелочные часы',
    clockModeCapsule: 'Минималистичная капсула',
    clockModeGlass: 'Матовое стекло',
    clockModeHud: 'Кибернетический HUD',
    clockModeMinimal: 'Швейцарская типографика',
  },
  'ug': {
    navFocus: 'زېھىن',
    navWorldClock: 'سائەت',
    financeTitle: 'بازار ۋە پۇل مۇئامىلە كۆرسەتكۈچلىرى',
    stocksTitle: 'دۇنياۋى پاي كۆرسەتكۈچلىرى',
    metalsTitle: 'قىممەتلىك ۋە سانائەت مېتاللىرى',
    macroTitle: 'ماكرو ئىقتىساد كۆرسەتكۈچلىرى (PMI & CPI)',
    gold: 'ئالتۇن (XAU)',
    silver: 'كۈمۈش (XAG)',
    copper: 'مىس',
    aluminum: 'ئاليۇمىن',
    pmiManufacturing: 'ياسىمىچىلىق PMI',
    pmiNonManufacturing: 'مۇلازىمەتچىلىك PMI',
    pmiThreshold: '50% گۈللىنىش ۋە چېكىنىش چېكى',
    cpiYoY: 'ئىستېمال باھا كۆرسەتكۈچى (CPI)',
    fiveYearTrend: 'يېقىنقى 5 يىللىق يۈزلىنىش (2021-2026)',
    pomodoroTitle: 'كەسپىي پومودورو ۋاقىت ئۆلچىگۈچى',
    pomodoroDesc: 'چوڭقۇر دىققەت قىلىش ۋە تەبىئىي ئاۋاز چۆكۈش',
    pomoWork: 'دىققەت خىزمىتى',
    pomoSelectTask: 'ۋەزىپىگە باغلاش',
    pomoNoTask: 'ئەركىن دىققەت (ۋەزىپىسىز)',
    pomoEstTomatoes: 'مۆلچەردىكى پەمىدۇر',
    pomoCompTomatoes: 'تاماملانغان پەمىدۇر',
    ambientSoundLabel: 'مۇھىت ئاق شاۋقۇنى',
    ambientRain: 'باھار يامغۇرى',
    ambientForest: 'ئورمان شامىلى',
    ambientWaves: 'دېڭىز دولقۇنى',
    ambientCafe: 'قەھۋەخانا كەيپىياتى',
    ambientCampfire: 'گۈلخان ئوتى',
    ambientWhiteNoise: 'ئاق شاۋقۇن',
    fullscreenFocus: 'پۈتۈن ئېكرانلىق چۆكۈش',
    strictModeLabel: 'قاتتىق كاشىلىسىز ھالەت',
    clockModeFlip: '3D ۋاراقلىما سائەت',
    clockModeAnalog: 'ئىنچىكە ئىسترېلكىلىق سائەت',
    clockModeCapsule: 'ئاددىي كاپسۇل',
    clockModeGlass: 'سۇيۇق ئەينەك',
    clockModeHud: 'كىبېر كۆرسەتكۈچ',
    clockModeMinimal: 'شىۋېتسارىيە خەت سائىتى',
  },
};

export function getTranslation(lang: Language): Translations {
  const base = dictionaries[lang] || dictionaries['zh-CN'];
  const completeOverrides = COMPLETE_BASE_OVERRIDES[lang] || {};
  const extra = EXTRA_TRANSLATIONS[lang] || EXTRA_TRANSLATIONS['zh-CN'];
  return { ...base, ...completeOverrides, ...extra };
}

export function isChineseLocale(lang: Language): boolean {
  return lang === 'zh-CN' || lang === 'zh-TW';
}

export function detectSystemLanguage(): Language {
  if (typeof navigator === 'undefined' || !navigator.language) return 'zh-CN';
  const l = navigator.language.toLowerCase();
  if (l.includes('tw') || l.includes('hk') || l.includes('mo') || l.includes('hant')) {
    return 'zh-TW';
  }
  if (l.startsWith('zh')) {
    return 'zh-CN';
  }
  if (l.startsWith('ja')) return 'ja';
  if (l.startsWith('ko')) return 'ko';
  if (l.startsWith('fr')) return 'fr';
  if (l.startsWith('fa')) return 'fa';
  if (l.startsWith('mn')) return 'mn';
  if (l.startsWith('ru')) return 'ru';
  if (l.startsWith('ug')) return 'ug';
  return 'en';
}
