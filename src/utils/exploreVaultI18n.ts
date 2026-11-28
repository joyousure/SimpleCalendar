import { Language } from '../types/calendar';
import { VocabTrack } from '../data/englishVaultData';

export interface ExploreVaultI18n {
  headerTitle: string;
  headerSubtitle: string;
  tabVault: string;
  tabNce: string;
  tabRoadmap: string;
  tabLS: string;
  tabRW: string;
  tabGrammar: string;
  tabFavorites: string;
  allTracksLabel: string;
  trackShortNames: Record<VocabTrack, string>;
  vaultDirectoryTitle: string;
  vaultDirectoryDesc: string;
  orderSequential: string;
  orderShuffle: string;
  reshuffleBtn: string;
  filterDueOnly: string;
  exportMenuLabel: string;
  exportAnkiTxt: string;
  exportExcelCsv: string;
  exportCopyText: string;
  exportSuccessNotice: (count: number, fmt: string) => string;
  srsRateLabel: string;
  srsAgain: string;
  srsHard: string;
  srsGood: string;
  srsStageLabels: Record<0 | 1 | 2 | 3, string>;
  dueCountLabel: (n: number) => string;
  nceTitle: string;
  nceSubtitle: string;
  nceAllBooks: string;
  nceBookLabel: (book: 1 | 2 | 3 | 4) => string;
  nceBookTaglines: Record<1 | 2 | 3 | 4, string>;
  nceShowZh: string;
  nceHideZh: string;
  nceReadFull: string;
  nceReadSlow: string;
  nceGrammarTitle: string;
  nceRhetoricTitle: string;
  nceGoldenTitle: string;
  nceKeyWordsTitle: string;
  nceMarkDone: string;
  nceDoneLabel: string;
  roadmapStepNceTitle: string;
  roadmapStepNceDesc: string;
  vaultTotalSummary: (total: number, mastered: number, due: number) => string;
  favoritesExportBtn: string;
  offlineReadyBadge: string;
  onlineReadyBadge: string;
  offlineNoticeDesc: string;
  openIeltsPlanTitle: string;
  openIeltsPlanSubtitle: string;
  openIeltsGoBtn: string;
  dictationPureBtn: string;
  dictationBlindHint: string;
  speakingChainTitle: string;
  speakingChainSubtitle: string;
  speakingChainPromptsLabel: string;
  speakingChainBridgeLabel: string;
  writingCalcTitle: string;
  writingTask1Label: string;
  writingTask2Label: string;
  writingWeightedLabel: string;
  bandMatrixToggle: string;
  bandMatrixColTR: string;
  bandMatrixColCC: string;
  bandMatrixColLR: string;
  bandMatrixColGRA: string;
  revisionStudioTitle: string;
  revisionStudioSubtitle: string;
  revisionDraftLabel: string;
  revisionUpgradeLabel: string;
  revisionCritiqueLabel: string;
  revisionAuditLabel: string;
  guLabTitle: string;
  guLabSubtitle: string;
  guInputPlaceholder: string;
  guHintBtn: string;
  guRevealBtn: string;
  guHideBtn: string;
  guTrapLabel: string;
  grammarMindMapTitle: string;
  grammarCategoryAll: string;
  grammarCategories: Record<
    'nominalization' | 'non_finite' | 'clause' | 'inversion' | 'subjunctive' | 'tense',
    string
  >;
}

const ZH_CN: ExploreVaultI18n = {
  headerTitle: '探索 · 英语全库精研',
  headerSubtitle: '雅思 · 四六级考研 · 托福GRE · IT极客 · 金融实务 · 新概念1–4精讲',
  tabVault: '全库背词',
  tabNce: '新概念NCE',
  tabRoadmap: '全库路线',
  tabLS: '听说179',
  tabRW: '读写538',
  tabGrammar: '核心语法',
  tabFavorites: '我的收藏',
  allTracksLabel: '全部词书',
  trackShortNames: {
    ielts: '雅思逻辑',
    cet_kaoyan: '四六级·考研',
    toefl_gre: '托福·GRE',
    it_tech: 'IT·极客',
    business_econ: '经管·金融',
    nce: '新概念1–4',
  },
  vaultDirectoryTitle: '全维度分级词书矩阵（点击直达精背）',
  vaultDirectoryDesc: '整合多阶段考试词库、IT 工程与金融实务术语、正序/乱序切换及 Anki/欧路词表导出',
  orderSequential: '正序词表',
  orderShuffle: '乱序记忆',
  reshuffleBtn: '换一批乱序',
  filterDueOnly: '今日待复习',
  exportMenuLabel: '导出词表',
  exportAnkiTxt: '导出 Anki / 欧路 (.txt)',
  exportExcelCsv: '导出 Excel 词单 (.csv)',
  exportCopyText: '复制当前词表文本',
  exportSuccessNotice: (n, fmt) => `已导出当前筛选的 ${n} 个词汇（${fmt}）`,
  srsRateLabel: '记忆掌握度打卡（自动排期复习）',
  srsAgain: '生疏 · 立即重练',
  srsHard: '模糊 · 1天后复习',
  srsGood: '熟记 · 延长间隔',
  srsStageLabels: {
    0: '待巩固',
    1: '初记 (1d)',
    2: '复习 (3d)',
    3: '稳固 (7d+)',
  },
  dueCountLabel: (n) => `${n} 词待复习`,
  nceTitle: '新概念英语 NCE 1–4 经典精读与修辞讲义',
  nceSubtitle: '按册精研英伦散文句法、端重语序、修辞对仗与高分金句（支持英/美音全文朗读与跟读对比）',
  nceAllBooks: '全部 1–4 册',
  nceBookLabel: (b) => `第 ${b} 册`,
  nceBookTaglines: {
    1: 'Book 1 · 英语初阶 · 日常语感与核心时态',
    2: 'Book 2 · 实践与进步 · 经典叙事与复合句型',
    3: 'Book 3 · 培养技能 · 端重语序与段落衔接',
    4: 'Book 4 · 流利英语 · 思辨散文与修辞巅峰',
  },
  nceShowZh: '显示中文精译',
  nceHideZh: '隐藏译文盲读',
  nceReadFull: '朗读全文',
  nceReadSlow: '0.85x 慢读',
  nceGrammarTitle: '核心句法与结构拆解',
  nceRhetoricTitle: '英伦修辞与语篇笔记',
  nceGoldenTitle: '名篇金句精析',
  nceKeyWordsTitle: '本课核心词汇联动',
  nceMarkDone: '完成本课精读 (+20 XP)',
  nceDoneLabel: '已完成精读',
  roadmapStepNceTitle: 'Step 5 · 新概念 NCE 1–4 散文精读与跟读',
  roadmapStepNceDesc: '研读英伦经典课文讲义，盲读全文朗读并收藏高分金句',
  vaultTotalSummary: (t, m, d) => `词库共 ${t} 词 · 已掌握 ${m} · 待复习 ${d}`,
  favoritesExportBtn: '导出收藏词表 (.txt)',
  offlineReadyBadge: '完全离线已就绪',
  onlineReadyBadge: '离线全库已本地缓存',
  offlineNoticeDesc: '词库、语法、NCE讲义、批改工坊与计算器全量本地运行，调用设备离线语音引擎。',
  openIeltsPlanTitle: 'openIELTS · 零成本 4 阶段备考冲刺路线',
  openIeltsPlanSubtitle: '吸收开源备考体系，按阶段打通 179 听写、538 平行阅读、精修批改与串题',
  openIeltsGoBtn: '直达训练',
  dictationPureBtn: '纯盲听听写',
  dictationBlindHint: '盲听模式已开启：题干关键词与释义已隐藏，点击朗读后凭听觉拼写',
  speakingChainTitle: 'openIELTS · 口语 Part 2 万能串题骨架 (Topic Chaining)',
  speakingChainSubtitle: '精研 3 套高密度真实故事内核，无缝串联人物、地点、物品与事件高频题库',
  speakingChainPromptsLabel: '可串联题目：',
  speakingChainBridgeLabel: '临场切换技巧：',
  writingCalcTitle: 'Task 1 + Task 2 官方加权总分推算',
  writingTask1Label: 'Task 1 小作文 (1/3 权重)',
  writingTask2Label: 'Task 2 大作文 (2/3 权重)',
  writingWeightedLabel: '写作折算分',
  bandMatrixToggle: '查看 Band 5.5–8.0+ 四维官方评分矩阵',
  bandMatrixColTR: '任务回应 TR/TA',
  bandMatrixColCC: '连贯衔接 CC',
  bandMatrixColLR: '词汇资源 LR',
  bandMatrixColGRA: '语法范围 GRA',
  revisionStudioTitle: 'openIELTS · 作文精批与升档工坊 (Band 5.5 → 7.5+)',
  revisionStudioSubtitle: '对比低分原稿与考官升档改写，逐条勾选自查消灭扣分硬伤',
  revisionDraftLabel: 'Band 5.5 原稿痛点',
  revisionUpgradeLabel: 'Band 7.5–8.0+ 精修升档',
  revisionCritiqueLabel: '精批诊断：',
  revisionAuditLabel: '交卷前自查清单：',
  guLabTitle: 'my-ielts · 顾家北高频 100 句主动中译英实验室',
  guLabSubtitle: '先手打英文句子再用参考范文校对，攻克中式搭配与主谓一致陷阱',
  guInputPlaceholder: '先试着用地道学术英文写出上面这句……',
  guHintBtn: '句型提示',
  guRevealBtn: '对照 8.0 译文',
  guHideBtn: '收起译文',
  guTrapLabel: '高频失分坑：',
  grammarMindMapTitle: '新东方语法思维导图分类筛查',
  grammarCategoryAll: '全部语法脉络',
  grammarCategories: {
    nominalization: '名词化压缩',
    non_finite: '非谓语/平行',
    clause: '三大复合从句',
    inversion: '倒装与强调',
    subjunctive: '虚拟假设',
    tense: '时态与一致',
  },
};

const ZH_TW: ExploreVaultI18n = {
  headerTitle: '探索 · 英語全庫精研',
  headerSubtitle: '雅思 · 四六級考研 · 托福GRE · IT極客 · 金融實務 · 新概念1–4精講',
  tabVault: '全庫背詞',
  tabNce: '新概念NCE',
  tabRoadmap: '全庫路線',
  tabLS: '聽說179',
  tabRW: '讀寫538',
  tabGrammar: '核心語法',
  tabFavorites: '我的收藏',
  allTracksLabel: '全部詞書',
  trackShortNames: {
    ielts: '雅思邏輯',
    cet_kaoyan: '四六級·考研',
    toefl_gre: '托福·GRE',
    it_tech: 'IT·極客',
    business_econ: '經管·金融',
    nce: '新概念1–4',
  },
  vaultDirectoryTitle: '全維度分級詞書矩陣（點擊直達精背）',
  vaultDirectoryDesc: '整合多階段考試詞庫、IT 工程與金融實務術語、正序/亂序切換及 Anki/歐路詞表匯出',
  orderSequential: '正序詞表',
  orderShuffle: '亂序記憶',
  reshuffleBtn: '換一批亂序',
  filterDueOnly: '今日待複習',
  exportMenuLabel: '匯出詞表',
  exportAnkiTxt: '匯出 Anki / 歐路 (.txt)',
  exportExcelCsv: '匯出 Excel 詞單 (.csv)',
  exportCopyText: '複製目前詞表文字',
  exportSuccessNotice: (n, fmt) => `已匯出目前篩選的 ${n} 個詞彙（${fmt}）`,
  srsRateLabel: '記憶掌握度打卡（自動排程複習）',
  srsAgain: '生疏 · 立即重練',
  srsHard: '模糊 · 1天後複習',
  srsGood: '熟記 · 延長間隔',
  srsStageLabels: {
    0: '待鞏固',
    1: '初記 (1d)',
    2: '複習 (3d)',
    3: '穩固 (7d+)',
  },
  dueCountLabel: (n) => `${n} 詞待複習`,
  nceTitle: '新概念英語 NCE 1–4 經典精讀與修辭講義',
  nceSubtitle: '按冊精研英倫散文句法、端重語序、修辭對仗與高分金句（支援英/美音全文朗讀與跟讀對比）',
  nceAllBooks: '全部 1–4 冊',
  nceBookLabel: (b) => `第 ${b} 冊`,
  nceBookTaglines: {
    1: 'Book 1 · 英語初階 · 日常語感與核心時態',
    2: 'Book 2 · 實踐與進步 · 經典敘事與複合句型',
    3: 'Book 3 · 培養技能 · 端重語序與段落銜接',
    4: 'Book 4 · 流利英語 · 思辨散文與修辭巔峰',
  },
  nceShowZh: '顯示中文精譯',
  nceHideZh: '隱藏譯文盲讀',
  nceReadFull: '朗讀全文',
  nceReadSlow: '0.85x 慢讀',
  nceGrammarTitle: '核心句法與結構拆解',
  nceRhetoricTitle: '英倫修辭與語篇筆記',
  nceGoldenTitle: '名篇金句精析',
  nceKeyWordsTitle: '本課核心詞彙連動',
  nceMarkDone: '完成本課精讀 (+20 XP)',
  nceDoneLabel: '已完成精讀',
  roadmapStepNceTitle: 'Step 5 · 新概念 NCE 1–4 散文精讀與跟讀',
  roadmapStepNceDesc: '研讀英倫經典課文講義，盲讀全文朗讀並收藏高分金句',
  vaultTotalSummary: (t, m, d) => `詞庫共 ${t} 詞 · 已掌握 ${m} · 待複習 ${d}`,
  favoritesExportBtn: '匯出收藏詞表 (.txt)',
  offlineReadyBadge: '完全離線已就緒',
  onlineReadyBadge: '離線全庫已本機快取',
  offlineNoticeDesc: '詞庫、語法、NCE講義與批改工坊全量本機運行，離線亦可完整朗讀與練習。',
  openIeltsPlanTitle: 'openIELTS · 零成本 4 階段備考衝刺路線',
  openIeltsPlanSubtitle: '吸收開源備考體系，按階段打通 179 聽寫、538 平行閱讀、精修批改與串題',
  openIeltsGoBtn: '直達訓練',
  dictationPureBtn: '純盲聽聽寫',
  dictationBlindHint: '盲聽模式已開啟：題幹關鍵詞與釋義已隱藏，點擊朗讀後憑聽覺拼寫',
  speakingChainTitle: 'openIELTS · 口語 Part 2 萬能串題骨架 (Topic Chaining)',
  speakingChainSubtitle: '精研 3 套高密度真實故事內核，無縫串聯人物、地點、物品與事件高頻題庫',
  speakingChainPromptsLabel: '可串聯題目：',
  speakingChainBridgeLabel: '臨場切換技巧：',
  writingCalcTitle: 'Task 1 + Task 2 官方加權總分推算',
  writingTask1Label: 'Task 1 小作文 (1/3 權重)',
  writingTask2Label: 'Task 2 大作文 (2/3 權重)',
  writingWeightedLabel: '寫作折算分',
  bandMatrixToggle: '查看 Band 5.5–8.0+ 四維官方評分矩陣',
  bandMatrixColTR: '任務回應 TR/TA',
  bandMatrixColCC: '連貫銜接 CC',
  bandMatrixColLR: '詞彙資源 LR',
  bandMatrixColGRA: '語法範圍 GRA',
  revisionStudioTitle: 'openIELTS · 作文精批與升檔工坊 (Band 5.5 → 7.5+)',
  revisionStudioSubtitle: '對比低分原稿與考官升檔改寫，逐條勾選自查消滅扣分硬傷',
  revisionDraftLabel: 'Band 5.5 原稿痛點',
  revisionUpgradeLabel: 'Band 7.5–8.0+ 精修升檔',
  revisionCritiqueLabel: '精批診斷：',
  revisionAuditLabel: '交卷前自查清單：',
  guLabTitle: 'my-ielts · 顧家北高頻 100 句主動中譯英實驗室',
  guLabSubtitle: '先手打英文句子再用參考範文校對，攻克中式搭配與主謂一致陷阱',
  guInputPlaceholder: '先試著用道地學術英文寫出上面這句……',
  guHintBtn: '句型提示',
  guRevealBtn: '對照 8.0 譯文',
  guHideBtn: '收起譯文',
  guTrapLabel: '高頻失分坑：',
  grammarMindMapTitle: '新東方語法思維導圖分類篩查',
  grammarCategoryAll: '全部語法脈絡',
  grammarCategories: {
    nominalization: '名詞化壓縮',
    non_finite: '非謂語/平行',
    clause: '三大複合從句',
    inversion: '倒裝與強調',
    subjunctive: '虛擬假設',
    tense: '時態與一致',
  },
};

const EN: ExploreVaultI18n = {
  headerTitle: 'Explore · English Vault & IELTS',
  headerSubtitle: 'IELTS · CET/Kaoyan · TOEFL/GRE · IT Systems · Finance · New Concept 1–4',
  tabVault: 'Vocab Vault',
  tabNce: 'NCE 1–4',
  tabRoadmap: 'Overview',
  tabLS: 'L&S 179',
  tabRW: 'R538/ABC',
  tabGrammar: 'Grammar',
  tabFavorites: 'Saved',
  allTracksLabel: 'All Decks',
  trackShortNames: {
    ielts: 'IELTS Core',
    cet_kaoyan: 'CET & Kaoyan',
    toefl_gre: 'TOEFL & GRE',
    it_tech: 'IT & Systems',
    business_econ: 'Finance & Macro',
    nce: 'New Concept',
  },
  vaultDirectoryTitle: 'Multi-Track Vocabulary Vault (Tap to Study)',
  vaultDirectoryDesc: 'Exam & domain decks with IPA, Sequential/Shuffled order, SRS scheduling & Anki/CSV export',
  orderSequential: 'Sequential',
  orderShuffle: 'Shuffled',
  reshuffleBtn: 'Re-shuffle',
  filterDueOnly: 'Due Review',
  exportMenuLabel: 'Export Deck',
  exportAnkiTxt: 'Export Anki / Eudic (.txt)',
  exportExcelCsv: 'Export Excel Sheet (.csv)',
  exportCopyText: 'Copy Filtered List',
  exportSuccessNotice: (n, fmt) => `Exported ${n} filtered words (${fmt})`,
  srsRateLabel: 'Recall Rating (Auto-Schedules Next Review)',
  srsAgain: 'Again · Reset',
  srsHard: 'Hard · 1d',
  srsGood: 'Good · Advance',
  srsStageLabels: {
    0: 'New/Lapsed',
    1: 'Stage 1 (1d)',
    2: 'Stage 2 (3d)',
    3: 'Solid (7d+)',
  },
  dueCountLabel: (n) => `${n} due`,
  nceTitle: 'New Concept English (Books 1–4) Master Lectures',
  nceSubtitle: 'Close reading of British prose syntax, end-weight structure, rhetoric & golden sentences',
  nceAllBooks: 'All Books 1–4',
  nceBookLabel: (b) => `Book ${b}`,
  nceBookTaglines: {
    1: 'Book 1 · First Things First — Tense precision & everyday cadence',
    2: 'Book 2 · Practice & Progress — Narrative twists & clause linking',
    3: 'Book 3 · Developing Skills — End-weight balance & essay architecture',
    4: 'Book 4 · Fluency in English — Formal prose & rhetorical mastery',
  },
  nceShowZh: 'Show Translation',
  nceHideZh: 'Hide Translation',
  nceReadFull: 'Read Passage',
  nceReadSlow: '0.85x Slow',
  nceGrammarTitle: 'Syntax & Structure Breakdown',
  nceRhetoricTitle: 'Rhetoric & Prose Craft',
  nceGoldenTitle: 'Golden Sentence Analysis',
  nceKeyWordsTitle: 'Linked Lesson Vocabulary',
  nceMarkDone: 'Complete Lecture (+20 XP)',
  nceDoneLabel: 'Lecture Completed',
  roadmapStepNceTitle: 'Step 5 · New Concept 1–4 Close Reading',
  roadmapStepNceDesc: 'Study British prose lectures, practice shadowing & bookmark golden lines',
  vaultTotalSummary: (t, m, d) => `${t} total words · ${m} mastered · ${d} due`,
  favoritesExportBtn: 'Export Saved (.txt)',
  offlineReadyBadge: '100% Offline Ready',
  onlineReadyBadge: 'Offline Vault Cached',
  offlineNoticeDesc: 'All decks, grammar trees, NCE lectures & critique labs run locally with device TTS.',
  openIeltsPlanTitle: 'openIELTS · Zero-Cost 4-Stage Prep Roadmap',
  openIeltsPlanSubtitle: 'Progressive open-source path across dictation, 538 reading, critique & chaining',
  openIeltsGoBtn: 'Open Stage',
  dictationPureBtn: 'Blind Dictation',
  dictationBlindHint: 'Blind Dictation active: question cues & meanings hidden until solved or revealed',
  speakingChainTitle: 'openIELTS · Speaking Part 2 Topic Chaining',
  speakingChainSubtitle: 'Reuse 3 vivid core narratives across Person, Place, Object & Event cues',
  speakingChainPromptsLabel: 'Covers Prompts:',
  speakingChainBridgeLabel: 'Pivot Cue:',
  writingCalcTitle: 'Official Writing Weighted Score (1/3 + 2/3)',
  writingTask1Label: 'Task 1 (Weight 1/3)',
  writingTask2Label: 'Task 2 (Weight 2/3)',
  writingWeightedLabel: 'Writing Band',
  bandMatrixToggle: 'Band 5.5–8.0+ Official Rubric Matrix',
  bandMatrixColTR: 'Task Response (TR/TA)',
  bandMatrixColCC: 'Coherence (CC)',
  bandMatrixColLR: 'Lexical (LR)',
  bandMatrixColGRA: 'Grammar (GRA)',
  revisionStudioTitle: 'openIELTS · Essay Revision Critique Studio (5.5 → 7.5+)',
  revisionStudioSubtitle: 'Compare Band 5.5 drafts with examiner upgrades and audit every rubric pitfall',
  revisionDraftLabel: 'Band 5.5 Draft Issues',
  revisionUpgradeLabel: 'Band 7.5–8.0+ Upgrade',
  revisionCritiqueLabel: 'Examiner Critique:',
  revisionAuditLabel: 'Self-Audit Checklist:',
  guLabTitle: 'my-ielts · Gu Jiabei Interactive C→E Translation Lab',
  guLabSubtitle: 'Draft your English sentence first, then verify patterns and eliminate traps',
  guInputPlaceholder: 'Type your academic English translation here before revealing...',
  guHintBtn: 'Pattern Hint',
  guRevealBtn: 'Reveal Model',
  guHideBtn: 'Hide Model',
  guTrapLabel: 'Common Trap:',
  grammarMindMapTitle: 'Grammar Mind-Map Categories',
  grammarCategoryAll: 'All Structures',
  grammarCategories: {
    nominalization: 'Nominalization',
    non_finite: 'Participles & Parallel',
    clause: 'Complex Clauses',
    inversion: 'Inversion & Cleft',
    subjunctive: 'Conditionals',
    tense: 'Tense & Agreement',
  },
};

const JA: ExploreVaultI18n = {
  ...EN,
  headerTitle: '探索 · 英語全領域ボキャブラリー庫',
  headerSubtitle: 'IELTS · CET/大学院 · TOEFL/GRE · IT工学 · 金融経済 · New Concept 1–4',
  tabVault: '語彙庫',
  tabNce: 'NCE精読',
  tabRoadmap: '全体進捗',
  tabLS: '聴説179',
  tabRW: '読解538',
  tabGrammar: '核心文法',
  tabFavorites: '保存済み',
  allTracksLabel: '全デッキ',
  trackShortNames: {
    ielts: 'IELTS論理',
    cet_kaoyan: 'CET·院試',
    toefl_gre: 'TOEFL·GRE',
    it_tech: 'IT·エンジニア',
    business_econ: '金融·マクロ',
    nce: 'New Concept',
  },
  vaultDirectoryTitle: '階層別ボキャブラリー庫（タップして学習）',
  orderSequential: '正順',
  orderShuffle: 'シャッフル',
  reshuffleBtn: '再シャッフル',
  filterDueOnly: '要復習のみ',
  exportMenuLabel: 'エクスポート',
  exportAnkiTxt: 'Anki / Eudic (.txt)',
  exportExcelCsv: 'Excel CSV (.csv)',
  exportCopyText: 'テキストをコピー',
  exportSuccessNotice: (n, fmt) => `${n} 語をエクスポートしました（${fmt}）`,
  srsRateLabel: '記憶定着評価（次回復習を自動設定）',
  srsAgain: 'もう一度',
  srsHard: '曖昧 (1日)',
  srsGood: '定着 (間隔延長)',
  dueCountLabel: (n) => `要復習 ${n}語`,
  nceTitle: 'New Concept English 1–4 精読レクチャー',
  nceAllBooks: '全 1–4 巻',
  nceBookLabel: (b) => `第 ${b} 巻`,
  nceShowZh: '訳文を表示',
  nceHideZh: '訳文を隠す',
  nceReadFull: '全文再生',
  nceReadSlow: '0.85x 精聴',
  nceMarkDone: '講義完了 (+20 XP)',
  nceDoneLabel: '学習済み',
  vaultTotalSummary: (t, m, d) => `全 ${t} 語 · 習得 ${m} · 要復習 ${d}`,
  favoritesExportBtn: '保存単語を出力 (.txt)',
  offlineReadyBadge: '完全オフライン対応',
  onlineReadyBadge: 'オフライン同期済み',
  dictationPureBtn: '純ディクテーション',
};

const KO: ExploreVaultI18n = {
  ...EN,
  headerTitle: '탐색 · 통합 영어 어휘 & IELTS',
  headerSubtitle: 'IELTS · CET/대학원 · TOEFL/GRE · IT공학 · 금융경제 · New Concept 1–4',
  tabVault: '어휘 저장소',
  tabNce: 'NCE 강독',
  tabRoadmap: '학습 개요',
  tabLS: '청해179',
  tabRW: '독해538',
  tabGrammar: '핵심 문법',
  tabFavorites: '즐겨찾기',
  allTracksLabel: '전체 단어장',
  trackShortNames: {
    ielts: 'IELTS 핵심',
    cet_kaoyan: 'CET·대학원',
    toefl_gre: 'TOEFL·GRE',
    it_tech: 'IT·개발',
    business_econ: '금융·경제',
    nce: 'New Concept',
  },
  vaultDirectoryTitle: '분야별 어휘 볼트 (탭하여 학습 시작)',
  orderSequential: '정순',
  orderShuffle: '랜덤 순서',
  reshuffleBtn: '다시 섞기',
  filterDueOnly: '복습 예정',
  exportMenuLabel: '내보내기',
  exportAnkiTxt: 'Anki / Eudic (.txt)',
  exportExcelCsv: 'Excel 시트 (.csv)',
  exportCopyText: '목록 텍스트 복사',
  exportSuccessNotice: (n, fmt) => `${n}개 단어 내보내기 완료 (${fmt})`,
  srsRateLabel: '기억 인출 평가 (복습 일정 자동 조정)',
  srsAgain: '다시 학습',
  srsHard: '모호함 (1일)',
  srsGood: '암기 완료',
  dueCountLabel: (n) => `${n}단어 복습`,
  nceTitle: 'New Concept English 1–4 핵심 구문 강독',
  nceAllBooks: '1–4권 전체',
  nceBookLabel: (b) => `${b}권`,
  nceShowZh: '번역 보기',
  nceHideZh: '번역 숨기기',
  nceReadFull: '본문 듣기',
  nceReadSlow: '0.85x 천천히',
  nceMarkDone: '강독 완료 (+20 XP)',
  nceDoneLabel: '완료됨',
  vaultTotalSummary: (t, m, d) => `총 ${t}단어 · 완료 ${m} · 복습 ${d}`,
  favoritesExportBtn: '저장 단어 내보내기 (.txt)',
  offlineReadyBadge: '오프라인 사용 가능',
  onlineReadyBadge: '오프라인 캐시 완료',
  dictationPureBtn: '블라인드 받아쓰기',
};

const FR: ExploreVaultI18n = {
  ...EN,
  headerTitle: 'Explorer · Base Lexicale & IELTS',
  tabVault: 'Lexique',
  tabNce: 'NCE 1–4',
  tabRoadmap: 'Aperçu',
  tabFavorites: 'Favoris',
  allTracksLabel: 'Tous niveaux',
  orderSequential: 'Séquentiel',
  orderShuffle: 'Mélangé',
  reshuffleBtn: 'Remélanger',
  filterDueOnly: 'À revoir',
  exportMenuLabel: 'Exporter',
  exportAnkiTxt: 'Anki / Eudic (.txt)',
  exportExcelCsv: 'Tableau Excel (.csv)',
  exportCopyText: 'Copier la liste',
  nceReadFull: 'Écouter le texte',
  nceReadSlow: '0.85x Lent',
  nceMarkDone: 'Terminer (+20 XP)',
  nceDoneLabel: 'Terminé',
  favoritesExportBtn: 'Exporter favoris (.txt)',
  offlineReadyBadge: '100% Hors ligne',
  onlineReadyBadge: 'Base hors ligne prête',
};

const RU: ExploreVaultI18n = {
  ...EN,
  headerTitle: 'Обзор · База английской лексики',
  tabVault: 'Словарь',
  tabNce: 'NCE 1–4',
  tabRoadmap: 'План',
  tabFavorites: 'Избранное',
  allTracksLabel: 'Все темы',
  orderSequential: 'По порядку',
  orderShuffle: 'Вразброс',
  reshuffleBtn: 'Перемешать',
  filterDueOnly: 'На повтор',
  exportMenuLabel: 'Экспорт',
  exportAnkiTxt: 'Anki / Eudic (.txt)',
  exportExcelCsv: 'Таблица Excel (.csv)',
  exportCopyText: 'Копировать список',
  nceReadFull: 'Озвучить текст',
  nceReadSlow: '0.85x Медленно',
  nceMarkDone: 'Завершить (+20 XP)',
  nceDoneLabel: 'Пройдено',
  favoritesExportBtn: 'Экспорт избранного (.txt)',
  offlineReadyBadge: 'Готово офлайн',
  onlineReadyBadge: 'Кэш офлайн готов',
};

const EXPLORE_VAULT_I18N: Record<Language, ExploreVaultI18n> = {
  'zh-CN': ZH_CN,
  'zh-TW': ZH_TW,
  en: EN,
  ja: JA,
  ko: KO,
  fr: FR,
  fa: EN,
  mn: EN,
  ru: RU,
  ug: EN,
};

export function getExploreVaultI18n(lang: Language): ExploreVaultI18n {
  return EXPLORE_VAULT_I18N[lang] || EXPLORE_VAULT_I18N.en;
}
