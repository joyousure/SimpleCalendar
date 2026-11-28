import { IeltsBand } from './ieltsData';

export interface PrepStageTask {
  id: string;
  stageNum: 1 | 2 | 3 | 4;
  daysLabelZh: string;
  daysLabelEn: string;
  titleZh: string;
  titleEn: string;
  focusSkill: 'vocab' | 'listening' | 'reading' | 'writing' | 'speaking' | 'nce';
  actionZh: string;
  actionEn: string;
  targetBadge: string;
}

/**
 * Modeled on mcxiaoxiao/openIELTS 4-stage zero-cost roadmap
 * designed for working professionals and STEM students (Band 6.0 -> 7.5+).
 */
export const OPEN_IELTS_PREP_PLAN: PrepStageTask[] = [
  {
    id: 'prep-s1-t1',
    stageNum: 1,
    daysLabelZh: 'Day 1–5 · 地基扫描',
    daysLabelEn: 'Days 1–5 · Diagnostic Base',
    titleZh: '真经词汇 + 听力179高频拼写排雷',
    titleEn: 'Core Vault + Listening 179 Spelling Sweep',
    focusSkill: 'listening',
    actionZh: '每天用乱序模式刷 30 词并听写 6 组 Section 1–4 考点词，清零 double-c / double-m 等拼写丢分。',
    actionEn: 'Drill 30 shuffled vault cards daily plus 6 Listening 179 dictations to wipe out double-letter typos.',
    targetBadge: '6.0 Base',
  },
  {
    id: 'prep-s1-t2',
    stageNum: 1,
    daysLabelZh: 'Day 6–10 · 同义替换',
    daysLabelEn: 'Days 6–10 · Paraphrase Eye',
    titleZh: '阅读 538 考点词同义替换矩阵与 T/F/NG 边界',
    titleEn: 'Reading 538 Paraphrase Matrix & T/F/NG Rules',
    focusSkill: 'reading',
    actionZh: '强化区分 FALSE（直接反义/数量矛盾）与 NOT GIVEN（未提及比较维度），阅读正确率冲向 27/40。',
    actionEn: 'Separate FALSE (contradiction) from NOT GIVEN (unmentioned comparison) toward 27/40 raw accuracy.',
    targetBadge: '6.5 Reading',
  },
  {
    id: 'prep-s2-t1',
    stageNum: 2,
    daysLabelZh: 'Day 11–16 · 句法升级',
    daysLabelEn: 'Days 11–16 · Syntax Elevation',
    titleZh: '顾家北 100 句升档 + 语法导图 15 核心结构',
    titleEn: 'Band 6→8 Sentence Upgrades & 15 Grammar Core Structures',
    focusSkill: 'writing',
    actionZh: '练熟非限制性定语从句 (, which...)、名词化与 Not only 倒装，攻克 GRA 7.0 语法关。',
    actionEn: 'Master ", which" evaluation clauses, nominalization, and negative inversion to unlock GRA 7.0.',
    targetBadge: 'GRA 7.0',
  },
  {
    id: 'prep-s2-t2',
    stageNum: 2,
    daysLabelZh: 'Day 17–21 · 语料内化',
    daysLabelEn: 'Days 17–21 · Prose Fluency',
    titleZh: '新概念 3–4 册英伦精讲 + 核心搭配巩固',
    titleEn: 'NCE Book 3–4 Master Lectures & Collocation Lock',
    focusSkill: 'nce',
    actionZh: '每天精读 1 篇 NCE 名篇并慢速影子跟读金句，内化自然逻辑连接而非机械背模板。',
    actionEn: 'Study 1 NCE lecture daily with 0.8x shadowing to internalize cohesive logic over memorized templates.',
    targetBadge: 'C1 Tone',
  },
  {
    id: 'prep-s3-t1',
    stageNum: 3,
    daysLabelZh: 'Day 22–26 · 串题破局',
    daysLabelEn: 'Days 22–26 · Speaking Chaining',
    titleZh: 'openIELTS 口语串题工坊：4 个母题故事串联 16 道题卡',
    titleEn: 'Speaking Topic Chaining: 4 Core Stories → 16 Cue Cards',
    focusSkill: 'speaking',
    actionZh: '用 4 个真实感强的通用故事母题适配地点、人物、技能、科技四大类 Part 2 题卡，配合 1+2 分钟官方计时器实战。',
    actionEn: 'Adapt 4 versatile personal stories across 16 Cue Cards under the official 1m prep + 2m speak timer.',
    targetBadge: 'Speaking 7.0',
  },
  {
    id: 'prep-s4-t1',
    stageNum: 4,
    daysLabelZh: 'Day 27–30 · 全真加权',
    daysLabelEn: 'Days 27–30 · Weighted Polish',
    titleZh: 'Task 1 (1/3) + Task 2 (2/3) 写作诊断与错题清零',
    titleEn: 'Weighted Writing Diagnostic & Weak-Spot Zeroing',
    focusSkill: 'writing',
    actionZh: '用本地离线作文诊断器自查词数、学术词汇命中与从句密度，并清空路线图里的薄弱错题队列。',
    actionEn: 'Run the offline essay diagnostic on Task 2 drafts and clear every remaining item in the Weak Queue.',
    targetBadge: '7.5+ Target',
  },
];

/**
 * Official Academic Reading & Listening raw score (0-40) -> Band conversion
 */
export function rawScoreToIeltsBand(correctCount: number, module: 'listening' | 'reading'): number {
  const c = Math.max(0, Math.min(40, Math.round(correctCount)));
  if (module === 'listening') {
    if (c >= 39) return 9.0;
    if (c >= 37) return 8.5;
    if (c >= 35) return 8.0;
    if (c >= 32) return 7.5;
    if (c >= 30) return 7.0;
    if (c >= 26) return 6.5;
    if (c >= 23) return 6.0;
    if (c >= 18) return 5.5;
    if (c >= 16) return 5.0;
    if (c >= 13) return 4.5;
    return 4.0;
  }
  // Academic Reading
  if (c >= 39) return 9.0;
  if (c >= 37) return 8.5;
  if (c >= 35) return 8.0;
  if (c >= 33) return 7.5;
  if (c >= 30) return 7.0;
  if (c >= 27) return 6.5;
  if (c >= 23) return 6.0;
  if (c >= 19) return 5.5;
  if (c >= 15) return 5.0;
  if (c >= 13) return 4.5;
  return 4.0;
}

/**
 * openIELTS rule: Writing Total = roundToHalf((Task 1 * 1/3) + (Task 2 * 2/3))
 */
export function calculateWeightedWritingBand(task1Band: number, task2Band: number): number {
  const weighted = task1Band * (1 / 3) + task2Band * (2 / 3);
  return Math.round(weighted * 2) / 2;
}

export interface BandDescriptorRow {
  criterionZh: string;
  criterionEn: string;
  b6Zh: string;
  b6En: string;
  b7Zh: string;
  b7En: string;
  b8Zh: string;
  b8En: string;
}

export const OFFICIAL_BAND_DESCRIPTORS: BandDescriptorRow[] = [
  {
    criterionZh: 'TR / TA 任务回应',
    criterionEn: 'Writing TR / TA',
    b6Zh: '回应各部分要求，但论证深度不均，Task 1 Overview 偏简略',
    b6En: 'Addresses parts of prompt; uneven support or basic Task 1 overview.',
    b7Zh: '立场全程清晰，Task 2 有充分延展论据，Task 1 准确概括主要趋势',
    b7En: 'Clear position throughout; well-extended ideas and clear Task 1 overview.',
    b8Zh: '深度且精准回应所有子问题，论证充分有洞见，极少遗漏细节',
    b8En: 'Comprehensive, insightful coverage with zero unsubstantiated jumps.',
  },
  {
    criterionZh: 'CC 连贯与衔接',
    criterionEn: 'Coherence & Cohesion',
    b6Zh: '连接词基本准确但略显机械 (Firstly/In conclusion)',
    b6En: 'Clear progression overall, though cohesive devices can feel mechanical.',
    b7Zh: '段落逻辑流畅，指代清晰，每段只有一个明确中心主题',
    b7En: 'Logical sequencing, smooth referencing, one clear central topic per paragraph.',
    b8Zh: '衔接几乎隐形自然，段落层次推进如丝般顺滑',
    b8En: 'Seamless cohesion where transitions feel effortless rather than formulaic.',
  },
  {
    criterionZh: 'LR 词汇资源',
    criterionEn: 'Lexical Resource',
    b6Zh: '日常词汇够用，学术搭配偶尔生硬或出现拼写笔误',
    b6En: 'Adequate general vocabulary; occasional awkward collocation or spelling slip.',
    b7Zh: '能自如运用不常见学术词与精准搭配，同义替换自然',
    b7En: 'Uses less common academic lexis and natural collocations with rare slips.',
    b8Zh: '选词精准凝练且富有细微语体辨析，拼写极少失误',
    b8En: 'Precise register, skillful idiomatic/academic nuance, negligible slips.',
  },
  {
    criterionZh: 'GRA 语法广度与准确',
    criterionEn: 'Grammar Range & Accuracy',
    b6Zh: '简单句与常见复合句混用，复杂从句偶有主谓一致失误',
    b6En: 'Mix of simple and complex structures; occasional errors in longer clauses.',
    b7Zh: '高频产出无错误复合句，灵活运用分词、定语及让步从句',
    b7En: 'Frequent error-free complex sentences with confident clause variety.',
    b8Zh: '多样复杂句法（倒装/虚拟/同位语）驾轻就熟，绝大多数句子全对',
    b8En: 'Wide, natural syntactic range with the vast majority of sentences error-free.',
  },
];

export interface SpeakingChainStory {
  id: string;
  band: IeltsBand;
  storyTitleZh: string;
  storyTitleEn: string;
  archetypeZh: string;
  archetypeEn: string;
  chainsToCueCardsZh: string[];
  chainsToCueCardsEn: string[];
  hookEn: string;
  coreStoryEn: string;
  coreStoryZh: string;
  p3ExtensionEn: string;
  keyPhrases: string[];
}

/**
 * Signature openIELTS Speaking Topic Chaining (口语串题法):
 * Adapt 4 high-density stories across 16+ Cue Cards with zero rote-script stiffness.
 */
export const SPEAKING_CHAIN_STORIES: SpeakingChainStory[] = [
  {
    id: 'chain-cafe',
    band: '7.0',
    storyTitleZh: '故事母题 A · 植物园旁的老图书馆与玻璃房',
    storyTitleEn: 'Hub A · Top-Floor Conservatory Reading Room',
    archetypeZh: '地点 / 建筑 / 减压习惯 / 周末安排',
    archetypeEn: 'Place / Architecture / Unwinding / Study Routine',
    chainsToCueCardsZh: [
      '想去的安静地方 (Quiet Place)',
      '喜欢的公共建筑 (Public Building)',
      '高效学习/工作角落 (Study Corner)',
      '不用手机的一小时 (Screen-Free Routine)',
    ],
    chainsToCueCardsEn: [
      'A quiet place to concentrate',
      'An impressive modern/old public building',
      'A place you recommend visiting in your city',
      'A healthy screen-free weekend habit',
    ],
    hookEn: 'If there is one corner of town that instantly resets my focus, it is the glass-roofed reading conservatory above our municipal library.',
    coreStoryEn:
      'Built from restored timber beams overlooking an old botanical courtyard, it filters warm daylight without any glare. Whenever my schedule turns chaotic, I silence my phone, bring a thermos of roasted oolong tea, and spend ninety uninterrupted minutes reading essays—the gentle rustle of turning pages beats any noise-canceling headphones.',
    coreStoryZh:
      '它由修复后的木梁建成，俯瞰着老植物园庭院，漫射进柔和日光而不刺眼。每当日程混乱时，我就会静音手机、带一壶乌龙茶，在那里沉浸读散文九十分钟——轻轻的翻书声胜过任何降噪耳机。',
    p3ExtensionEn:
      'Public third spaces remain vital in hyper-connected cities because citizens need calm physical sanctuaries free from commercial pressure.',
    keyPhrases: ['glass-roofed conservatory', 'instantly resets my focus', 'calm physical sanctuary'],
  },
  {
    id: 'chain-mentor',
    band: '8.0+',
    storyTitleZh: '故事母题 B · 带我拆解难题的导师 Dr. Lin',
    storyTitleEn: 'Hub B · Mentor Dr. Lin & Blueprint Thinking',
    archetypeZh: '钦佩的人 / 宝贵建议 / 团队合作 / 学到的技能',
    archetypeEn: 'Admired Person / Good Advice / Teamwork / Problem-Solving',
    chainsToCueCardsZh: [
      '擅长本职工作的人 (Skilled Person)',
      '给过你关键建议的长辈 (Important Advice)',
      '一起共事的伙伴 (Teammate)',
      '克服困难的一次经历 (Overcoming a Setback)',
    ],
    chainsToCueCardsEn: [
      'Someone excellent at their job',
      'A piece of practical advice you followed',
      'A person who inspired your work ethic',
      'A time you solved a complex challenge calmly',
    ],
    hookEn: 'The professional who transformed how I tackle complexity is Dr. Lin, a structural engineer who supervised my university capstone.',
    coreStoryEn:
      'Two days before our bridge-load presentation, our sensor log diverged wildly and the whole team panicked. Instead of assigning blame, she sketched the feedback loop on a whiteboard, isolated one miscalibrated bolt, and taught us a lasting rule: separate noisy symptoms from structural root causes before rewriting a single line.',
    coreStoryZh:
      '在桥梁荷载答辩前两天，传感器数据剧烈漂移，全队陷入慌乱。她没有追责，而是平静地在白板画出反馈链路，定位到一个未校准的螺栓，并教会我们一条受用至今的原则：先剥离噪声与表象，找出结构性根因再动手修改。',
    p3ExtensionEn:
      'True expertise is rarely about knowing answers instantly; rather, it lies in staying composed when live systems behave unexpectedly.',
    keyPhrases: ['supervising capstone', 'isolated the root cause', 'separate symptoms from structure'],
  },
  {
    id: 'chain-app',
    band: '7.0',
    storyTitleZh: '故事母题 C · 离线极简时间块与番茄工作流',
    storyTitleEn: 'Hub C · Offline Time-Block & Pomodoro Routine',
    archetypeZh: '实用科技 / 好习惯 / 提高效率 / 学到的工具',
    archetypeEn: 'Useful App / Positive Habit / Productivity / Time Management',
    chainsToCueCardsZh: [
      '常用的高效软件 (Helpful App)',
      '改善生活的好习惯 (Positive Routine)',
      '节省时间的技巧 (Time-Saving Method)',
      '难忘的自学成就 (Self-Taught Milestone)',
    ],
    chainsToCueCardsEn: [
      'A mobile tool you rely on daily',
      'A daily routine change that improved focus',
      'An effective way you save time',
      'A practical skill you developed independently',
    ],
    hookEn: 'Ironically, the digital habit that saved me most time was adopting an offline-first time-blocking schedule.',
    coreStoryEn:
      'I used to juggle five bloated productivity apps whose notifications ironically broke my concentration every ten minutes. Switching to a clean local calendar paired with 25-minute Pomodoro sprints forced me to batch shallow messages at 5 p.m.—boosting my deep-study output dramatically while leaving evenings genuinely guilt-free.',
    coreStoryZh:
      '过去我同时切换五款臃肿的效率软件，弹窗反而每十分钟就打断专注。改用支持全本地离线的极简日程搭配 25 分钟番茄专注后，我把零碎消息统一安排到傍晚五点处理，深度学习产出大幅提升，晚上也终于能彻底放松无负罪感。',
    p3ExtensionEn:
      'Well-designed software ought to respect human attention spans rather than monetizing endless push notifications.',
    keyPhrases: ['offline-first workflow', 'batch shallow messages', 'genuinely guilt-free evenings'],
  },
  {
    id: 'chain-rail',
    band: '6.5',
    storyTitleZh: '故事母题 D · 清晨穿越崖壁的沿海景观列车',
    storyTitleEn: 'Hub D · Sunrise Coastal Train & Slow Travel',
    archetypeZh: '公共交通出行 / 难忘旅行 / 自然风光 / 环保选择',
    archetypeEn: 'Public Transport / Memorable Trip / Scenery / Eco Choice',
    chainsToCueCardsZh: [
      '难忘的公交/火车出行 (Public Transit Trip)',
      '预算友好的短途游 (Budget Journey)',
      '看过的自然美景 (Scenic View)',
      '值得推荐的环保方式 (Eco-Friendly Choice)',
    ],
    chainsToCueCardsEn: [
      'A memorable journey by public transport',
      'A scenic place outside your hometown',
      'An unexpectedly relaxing short trip',
      'An eco-friendly way people travel locally',
    ],
    hookEn: 'Rather than rushing along an expressway, my favorite memory is boarding a 6 a.m. coastal commuter train across cliffside viaducts.',
    coreStoryEn:
      'As morning mist lifted off quiet fishing coves, sunlight spilled across the panoramic carriage windows while locals chatted softly over fresh pastries. For less than the cost of highway fuel, the three-hour ride turned a routine errand into a restorative break that proved greener infrastructure can also enrich everyday joy.',
    coreStoryZh:
      '清晨海雾散去时，阳光洒进全景车窗，邻座当地人端着刚出炉的面包轻声交谈。这张车票比自驾油费便宜得多，却把一趟平常办事变成了治愈身心的旅程——更绿色的轨道交通也能让日常出行充满愉悦。',
    p3ExtensionEn:
      'Investing in dependable regional rail nudges travelers away from private cars far more reliably than lecturing about carbon footprints.',
    keyPhrases: ['cliffside viaducts', 'panoramic carriage windows', 'restorative break'],
  },
];

export interface RootAffixRow {
  root: string;
  origin: string;
  meaningZh: string;
  meaningEn: string;
  examples: string[];
}

export const ROOT_AFFIX_MATRIX: RootAffixRow[] = [
  {
    root: 'mit- / mis-',
    origin: 'Latin mittere',
    meaningZh: '送，放，缓和',
    meaningEn: 'send / soften / let go',
    examples: ['mitigate', 'remittance', 'transmit', 'dismiss'],
  },
  {
    root: 'duc- / duct-',
    origin: 'Latin ducere',
    meaningZh: '引导，带来',
    meaningEn: 'lead / guide / bring',
    examples: ['induce', 'conducive', 'productivity', 'deduce'],
  },
  {
    root: 'sed- / sid-',
    origin: 'Latin sedere',
    meaningZh: '坐，安置，支撑',
    meaningEn: 'sit / settle / back up',
    examples: ['sedentary', 'subsidize', 'subsidy', 'resident'],
  },
  {
    root: 'chron-',
    origin: 'Greek khronos',
    meaningZh: '时间，时代',
    meaningEn: 'time / sequence',
    examples: ['chronicle', 'chronological', 'asynchronous', 'chronic'],
  },
  {
    root: 'cogn- / gno-',
    origin: 'Latin gnoscere',
    meaningZh: '知道，识别',
    meaningEn: 'know / recognize',
    examples: ['cognitive', 'acknowledge', 'diagnose', 'ignorance'],
  },
  {
    root: 'equ- / par-',
    origin: 'Latin aequus / par',
    meaningZh: '平等，均衡',
    meaningEn: 'equal / fair / comparable',
    examples: ['disparity', 'equitable', 'egalitarian', 'comparable'],
  },
  {
    root: 'vi- / vit-',
    origin: 'Latin vita / via',
    meaningZh: '生命，道路可行',
    meaningEn: 'life / way / workable',
    examples: ['viable', 'revitalize', 'vital', 'inevitable'],
  },
  {
    root: 'spec- / spect-',
    origin: 'Latin specere',
    meaningZh: '看，观察，审视',
    meaningEn: 'look / examine',
    examples: ['speculative', 'perspective', 'retrospective', 'inspect'],
  },
  {
    root: 'voc- / loqu-',
    origin: 'Latin vocare / loqui',
    meaningZh: '声音，说，倡导',
    meaningEn: 'call / speak / voice',
    examples: ['vocational', 'eloquent', 'advocate', 'provoke'],
  },
  {
    root: 'cur- / curr-',
    origin: 'Latin currere',
    meaningZh: '跑，进程，流通',
    meaningEn: 'run / flow / course',
    examples: ['curriculum', 'concurrency', 'incur', 'concurrent'],
  },
  {
    root: 'anthropo- / demo-',
    origin: 'Greek',
    meaningZh: '人类 / 民众人口',
    meaningEn: 'humanity / population',
    examples: ['anthropogenic', 'demographic', 'epidemic', 'endemic'],
  },
  {
    root: 'bio- / eco-',
    origin: 'Greek bios / oikos',
    meaningZh: '生命 / 生态家园',
    meaningEn: 'life / habitat / household',
    examples: ['biodiversity', 'ecosystem', 'symbiosis', 'biodegradable'],
  },
];

export interface EssayDiagnosticResult {
  wordCount: number;
  paragraphCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  targetWords: number;
  academicHits: string[];
  connectorHits: string[];
  complexSyntaxHits: string[];
  estimatedBand: string;
  checklist: { ok: boolean; labelZh: string; labelEn: string }[];
}

const ACADEMIC_WORDS_SET = new Set([
  'mitigate', 'exacerbate', 'alleviate', 'resilient', 'resilience', 'disparity',
  'subsidize', 'subsidies', 'ubiquitous', 'ubiquity', 'obsolete', 'disseminate',
  'infrastructure', 'demographic', 'segregation', 'cohesion', 'sedentary', 'mandatory',
  'preventive', 'detrimental', 'legislation', 'viable', 'feasible', 'empirical',
  'cognitive', 'pedagogy', 'autonomous', 'corroborate', 'lucrative', 'incentive',
  'allocation', 'allocate', 'curtail', 'eradicate', 'ameliorate', 'prevalent',
  'pervasive', 'inevitably', 'substantially', 'predominantly', 'unprecedented',
  'sustainable', 'sustainability', 'productivity', 'automation', 'accountability',
  'prudent', 'pragmatic', 'paradigm', 'interplay', 'cumulative', 'prioritize',
  'reallocate', 'indispensable', 'equitable', 'egalitarian', 'overwhelmingly',
]);

const ACADEMIC_CONNECTORS = [
  'however', 'nevertheless', 'nonetheless', 'conversely', 'consequently',
  'therefore', 'moreover', 'furthermore', 'meanwhile', 'although', 'whereas',
  'albeit', 'while', 'provided that', 'contingent upon', 'in contrast',
  'as a result', 'ultimately', 'fundamentally', 'not only', 'on the other hand',
];

/**
 * 100% Offline local IELTS Writing rubric analyzer (zero API calls required)
 */
export function analyzeEssayOffline(
  rawText: string,
  taskType: 'task2' | 'task1' = 'task2'
): EssayDiagnosticResult {
  const trimmed = rawText.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const paragraphCount = trimmed
    ? trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
    : 0;
  const sentences = trimmed
    ? trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 2)
    : [];
  const sentenceCount = sentences.length;
  const avgWordsPerSentence =
    sentenceCount > 0 ? Math.round((wordCount / sentenceCount) * 10) / 10 : 0;

  const lower = trimmed.toLowerCase();
  const normalizedWords = Array.from(
    new Set(lower.replace(/[^a-z\s-]/g, ' ').split(/\s+/).filter(Boolean))
  );
  const academicHits = normalizedWords.filter((w) => ACADEMIC_WORDS_SET.has(w));
  const connectorHits = ACADEMIC_CONNECTORS.filter((conn) =>
    new RegExp(`\\b${conn.replace(/\s+/g, '\\s+')}\\b`, 'i').test(lower)
  );

  const complexSyntaxHits: string[] = [];
  if (/,\s*which\b/i.test(trimmed)) complexSyntaxHits.push(', which (Non-restrictive)');
  if (/\b(?:although|whereas|while|albeit)\b/i.test(trimmed)) complexSyntaxHits.push('Concession');
  if (/\bnot only\b[\s\S]*\b(?:does|can|will|do|are|is)\b/i.test(trimmed))
    complexSyntaxHits.push('Inversion');
  if (/\b(?:were\s+\w+\s+to|had\s+\w+\s+not|would\s+(?:have|be|rise|drop|decline|improve|worsen))\b/i.test(trimmed))
    complexSyntaxHits.push('Conditional / Modal');
  if (/\bwith\s+[a-z\s]{3,28}\s+(?:rising|falling|growing|expanding|declining|increasing)\b/i.test(trimmed))
    complexSyntaxHits.push('With-Absolute');

  const targetWords = taskType === 'task2' ? 250 : 150;

  let score = 5.0;
  if (wordCount >= targetWords) score += 1.0;
  else if (wordCount >= Math.round(targetWords * 0.6)) score += 0.5;
  if (paragraphCount >= 3 || (wordCount >= 80 && sentenceCount >= 4)) score += 0.5;
  if (academicHits.length >= 4) score += 0.5;
  if (academicHits.length >= 8) score += 0.5;
  if (connectorHits.length >= 3) score += 0.5;
  if (complexSyntaxHits.length >= 2) score += 0.5;
  if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 26) score += 0.5;

  const capped = Math.min(8.5, Math.max(4.5, Math.round(score * 2) / 2));
  const estimatedBand =
    wordCount < 25 ? '—' : `${capped.toFixed(1)} – ${Math.min(9.0, capped + 0.5).toFixed(1)}`;

  const checklist = [
    {
      ok: wordCount >= targetWords,
      labelZh: `字数达标 (${wordCount}/${targetWords} 词)`,
      labelEn: `Word Target (${wordCount}/${targetWords} words)`,
    },
    {
      ok: connectorHits.length >= 2,
      labelZh: `逻辑衔接词 (${connectorHits.length} 处)`,
      labelEn: `Cohesive Links (${connectorHits.length} hits)`,
    },
    {
      ok: academicHits.length >= 3,
      labelZh: `C1/C2 学术核心词 (${academicHits.length} 词)`,
      labelEn: `Academic Lexis (${academicHits.length} words)`,
    },
    {
      ok: complexSyntaxHits.length >= 2,
      labelZh: `高分复合句型 (${complexSyntaxHits.length} 类)`,
      labelEn: `Complex Syntax (${complexSyntaxHits.length} types)`,
    },
  ];

  return {
    wordCount,
    paragraphCount,
    sentenceCount,
    avgWordsPerSentence,
    targetWords,
    academicHits,
    connectorHits,
    complexSyntaxHits,
    estimatedBand,
    checklist,
  };
}
