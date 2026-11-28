export type IeltsBand = '5.5' | '6.5' | '7.0' | '8.0+';

export interface VocabItem {
  id: string;
  word: string;
  ipa: string;
  pos: string;
  band: IeltsBand;
  group: '自然生态' | '经济商业' | '教育学术' | '科技媒体' | '社会城建' | '健康政策';
  groupEn: string;
  meaning: string;
  meaningEn: string;
  collocation: string;
  rootHint: string;
  rootHintEn: string;
  exampleEn: string;
  exampleZh: string;
}

export interface Listening179Item {
  id: string;
  band: IeltsBand;
  section: string;
  questionWord: string;
  audioParaphrase: string;
  meaning: string;
  meaningEn: string;
  trapNote: string;
  trapNoteEn: string;
}

export interface SpeakingPrompt {
  id: string;
  part: 'P1' | 'P2' | 'P3';
  band: IeltsBand;
  topic: string;
  topicEn: string;
  question: string;
  cueBullets?: string[];
  band8Model: string;
  band8ModelZh: string;
  collocations: string[];
}

export interface Synonym538Pair {
  id: string;
  band: IeltsBand;
  passageTerm: string;
  questionParaphrase: string;
  meaning: string;
  meaningEn: string;
  note: string;
  noteEn: string;
}

export interface TfngDrill {
  id: string;
  band: IeltsBand;
  passage: string;
  statement: string;
  answer: 'TRUE' | 'FALSE' | 'NOT GIVEN';
  reason: string;
  reasonEn: string;
}

export interface AbcChainTopic {
  id: string;
  band: IeltsBand;
  topic: string;
  topicEn: string;
  prompt: string;
  chainA: string;
  chainB: string;
  chainC: string;
  band8ConnectorSample: string;
}

export interface Task1Pattern {
  id: string;
  type: 'trend' | 'comparison' | 'process' | 'map';
  band: IeltsBand;
  title: string;
  titleEn: string;
  verbs: string[];
  sampleEn: string;
  sampleZh: string;
}

export interface SentenceUpgrade {
  id: string;
  band: IeltsBand;
  topic: string;
  band6Draft: string;
  band8Upgrade: string;
  keyTakeaway: string;
  keyTakeawayEn: string;
}

export type GrammarCategory =
  | 'nominalization'
  | 'non_finite'
  | 'clause'
  | 'inversion'
  | 'subjunctive'
  | 'tense';

export interface GrammarModule {
  id: string;
  band: IeltsBand;
  category?: GrammarCategory;
  title: string;
  titleEn: string;
  formula: string;
  explanation: string;
  explanationEn: string;
  correctEn: string;
  correctZh: string;
  pitfall: string;
  pitfallEn: string;
  checkQuestion: string;
  checkOptions: string[];
  checkAnswerIdx: number;
}

export interface OpenIeltsStage {
  id: string;
  stageNum: number;
  titleZh: string;
  titleEn: string;
  durationZh: string;
  durationEn: string;
  focusZh: string;
  focusEn: string;
  checklistZh: string[];
  checklistEn: string[];
  targetTab: 'vocab' | 'listening_speaking' | 'reading_writing' | 'grammar' | 'nce';
}

export interface WritingBandCriterionRow {
  band: string;
  trTaZh: string;
  trTaEn: string;
  ccZh: string;
  ccEn: string;
  lrZh: string;
  lrEn: string;
  graZh: string;
  graEn: string;
}

export interface OpenIeltsRevisionCase {
  id: string;
  topicZh: string;
  topicEn: string;
  targetBand: IeltsBand;
  band55Draft: string;
  band75Revision: string;
  examinerCritiqueZh: string;
  examinerCritiqueEn: string;
  auditItemsZh: string[];
  auditItemsEn: string[];
}

export interface SpeakingTopicChain {
  id: string;
  archetypeZh: string;
  archetypeEn: string;
  linkedPromptsZh: string[];
  linkedPromptsEn: string[];
  coreStoryEn: string;
  coreStoryZh: string;
  pivotBridgeEn: string;
  collocations: string[];
}

export interface GuJiabeiTranslationDrill {
  id: string;
  topicZh: string;
  topicEn: string;
  band: IeltsBand;
  chinesePrompt: string;
  keyPattern: string;
  band8Target: string;
  grammarNoteZh: string;
  grammarNoteEn: string;
  commonTrapZh: string;
  commonTrapEn: string;
}

export function calculateIeltsWritingOverall(task1: number, task2: number): number {
  const weighted = (task1 + task2 * 2) / 3;
  return Math.round(weighted * 2) / 2;
}

export function calculateOfficialIeltsOverall(
  listening: number,
  reading: number,
  writing: number,
  speaking: number
): number {
  const rawAvg = (listening + reading + writing + speaking) / 4;
  // Official IELTS rounding: .25 -> .5, .75 -> next whole band
  return Math.round(rawAvg * 2) / 2;
}

export const IELTS_VOCAB_DECK: VocabItem[] = [
  // 自然生态 Nature & Ecology (8)
  {
    id: 'voc-1',
    word: 'biodiversity',
    ipa: '/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/',
    pos: 'n.',
    band: '6.5',
    group: '自然生态',
    groupEn: 'Nature & Ecology',
    meaning: '生物多样性',
    meaningEn: 'the variety of plant and animal life in an ecosystem',
    collocation: 'preserve biodiversity · biodiversity loss',
    rootHint: 'bio(生命) + divers(多样) + ity',
    rootHintEn: 'bio (life) + diverse (varied) + -ity',
    exampleEn: 'Deforestation accelerates biodiversity loss across tropical wetlands.',
    exampleZh: '森林砍伐加剧了热带湿地的生物多样性丧失。',
  },
  {
    id: 'voc-2',
    word: 'mitigate',
    ipa: '/ˈmɪt.ɪ.ɡeɪt/',
    pos: 'v.',
    band: '7.0',
    group: '自然生态',
    groupEn: 'Nature & Ecology',
    meaning: '缓和，减轻（灾害/影响）',
    meaningEn: 'to make something harmful or severe less painful or serious',
    collocation: 'mitigate climate risks · mitigate carbon emissions',
    rootHint: 'mit(温和) + igate → 使变温和、减轻',
    rootHintEn: 'mit (mild) + -igate → soften or reduce severity',
    exampleEn: 'Coastal mangroves help mitigate the devastating impact of storm surges.',
    exampleZh: '沿海红树林有助于减轻风暴潮带来的破坏性影响。',
  },
  {
    id: 'voc-3',
    word: 'resilient',
    ipa: '/rɪˈzɪl.i.ənt/',
    pos: 'adj.',
    band: '7.0',
    group: '自然生态',
    groupEn: 'Nature & Ecology',
    meaning: '有韧性的，能迅速恢复的',
    meaningEn: 'able to recover quickly after shock, drought, or disruption',
    collocation: 'climate-resilient crops · resilient ecosystem',
    rootHint: 're(回) + sil(跳) + ient → 弹回原状的',
    rootHintEn: 're- (back) + salire (leap) → bouncing back',
    exampleEn: 'Drought-resilient crop varieties safeguard rural food security.',
    exampleZh: '抗旱作物品种保障了农村地区的粮食安全。',
  },
  {
    id: 'voc-4',
    word: 'exacerbate',
    ipa: '/ɪɡˈzæs.ə.beɪt/',
    pos: 'v.',
    band: '8.0+',
    group: '自然生态',
    groupEn: 'Nature & Ecology',
    meaning: '使恶化，加剧（写作高频高分动词）',
    meaningEn: 'to make a problem, bad situation, or negative feeling worse',
    collocation: 'exacerbate air pollution · exacerbate urban heat',
    rootHint: 'ex(极度) + acerb(尖刻/苦) + ate → 使雪上加霜',
    rootHintEn: 'ex- (out) + acerbus (bitter/harsh) → worsen',
    exampleEn: 'Unregulated industrial discharge will inevitably exacerbate freshwater scarcity.',
    exampleZh: '不受监管的工业排放将不可避免地加剧淡水短缺。',
  },
  {
    id: 'voc-5',
    word: 'deplete',
    ipa: '/dɪˈpliːt/',
    pos: 'v.',
    band: '6.5',
    group: '自然生态',
    groupEn: 'Nature & Ecology',
    meaning: '耗尽，大量消耗（资源）',
    meaningEn: 'to use up most of the supply or energy of something',
    collocation: 'deplete fossil fuels · ozone depletion',
    rootHint: 'de(向下/去除) + plete(装满) → 清空、耗尽',
    rootHintEn: 'de- (un-) + plere (fill) → empty out',
    exampleEn: 'Intensive agriculture can gradually deplete essential soil nutrients.',
    exampleZh: '集约化农业会逐渐消耗土壤中的关键养分。',
  },
  {
    id: 'voc-6',
    word: 'habitat',
    ipa: '/ˈhæb.ɪ.tæt/',
    pos: 'n.',
    band: '5.5',
    group: '自然生态',
    groupEn: 'Nature & Ecology',
    meaning: '（动植物）栖息地',
    meaningEn: 'the natural home or environment of an animal or plant',
    collocation: 'habitat fragmentation · natural habitat',
    rootHint: 'habit(居住) + at → 生物居住之地',
    rootHintEn: 'habitare (to dwell) → dwelling environment',
    exampleEn: 'Highway expansion leads to severe habitat fragmentation for migratory species.',
    exampleZh: '高速公路扩建导致迁徙物种的栖息地严重破碎化。',
  },
  {
    id: 'voc-7',
    word: 'catastrophic',
    ipa: '/ˌkæt.əˈstrɒf.ɪk/',
    pos: 'adj.',
    band: '7.0',
    group: '自然生态',
    groupEn: 'Nature & Ecology',
    meaning: '灾难性的，毁灭性的',
    meaningEn: 'causing sudden and very great harm or destruction',
    collocation: 'catastrophic consequences · catastrophic flooding',
    rootHint: 'cata(向下) + strophe(转折) → 天塌地陷的灾难',
    rootHintEn: 'cata- (down) + strophe (turn) → sudden overturn',
    exampleEn: 'Rising sea levels pose catastrophic risks to low-lying island nations.',
    exampleZh: '海平面上升对地势低洼的岛国构成灾难性威胁。',
  },
  {
    id: 'voc-8',
    word: 'sustainable',
    ipa: '/səˈsteɪ.nə.bəl/',
    pos: 'adj.',
    band: '5.5',
    group: '自然生态',
    groupEn: 'Nature & Ecology',
    meaning: '可持续的，不破坏生态的',
    meaningEn: 'able to continue over a long period without harming resources',
    collocation: 'sustainable development · sustainable energy',
    rootHint: 'sus(在下面) + tain(握住) + able → 能长久托住维持的',
    rootHintEn: 'sub- (under) + tenere (hold) → able to be maintained',
    exampleEn: 'Transitioning to solar power is vital for sustainable urban growth.',
    exampleZh: '向太阳能转型对城市的可持续发展至关重要。',
  },

  // 经济商业 Economy & Business (8)
  {
    id: 'voc-9',
    word: 'lucrative',
    ipa: '/ˈluː.krə.tɪv/',
    pos: 'adj.',
    band: '7.0',
    group: '经济商业',
    groupEn: 'Economy & Business',
    meaning: '利润丰厚的，赚钱的',
    meaningEn: 'producing a great deal of profit',
    collocation: 'lucrative market · lucrative contract',
    rootHint: 'lucr(利润) + ative → 带来丰厚收益的',
    rootHintEn: 'lucrum (gain/profit) + -ative',
    exampleEn: 'Green logistics has emerged as an increasingly lucrative sector.',
    exampleZh: '绿色物流已成为一个利润日益丰厚的行业。',
  },
  {
    id: 'voc-10',
    word: 'incentive',
    ipa: '/ɪnˈsen.tɪv/',
    pos: 'n.',
    band: '6.5',
    group: '经济商业',
    groupEn: 'Economy & Business',
    meaning: '激励，刺激政策，动因',
    meaningEn: 'something that encourages a person or firm to do something',
    collocation: 'financial incentive · tax incentives',
    rootHint: 'in(使) + cent(唱/点燃) → 鼓舞刺激动因',
    rootHintEn: 'in- + cantare (sing/inspire) → motivator',
    exampleEn: 'Governments can offer tax incentives to accelerate electric vehicle adoption.',
    exampleZh: '政府可以提供税收激励以加速电动车的普及。',
  },
  {
    id: 'voc-11',
    word: 'disparity',
    ipa: '/dɪˈspær.ə.ti/',
    pos: 'n.',
    band: '8.0+',
    group: '经济商业',
    groupEn: 'Economy & Business',
    meaning: '（贫富/地区）显著差距，不平等',
    meaningEn: 'a noticeable and often unfair difference between groups',
    collocation: 'income disparity · widen the disparity',
    rootHint: 'dis(不) + par(平等) + ity → 不平等差距',
    rootHintEn: 'dis- (not) + par (equal) + -ity',
    exampleEn: 'Unequal access to broadband threatens to widen regional economic disparities.',
    exampleZh: '宽带接入的不平等可能进一步拉大地区间的经济差距。',
  },
  {
    id: 'voc-12',
    word: 'fluctuate',
    ipa: '/ˈflʌk.tʃu.eɪt/',
    pos: 'v.',
    band: '6.5',
    group: '经济商业',
    groupEn: 'Economy & Business',
    meaning: '波动，上下起伏（Task 1 核心词）',
    meaningEn: 'to rise and fall irregularly in number or amount',
    collocation: 'fluctuate wildly · minor fluctuation',
    rootHint: 'fluctu(波浪) + ate → 如海浪般波动起伏',
    rootHintEn: 'fluctus (wave) + -ate → rise and fall like waves',
    exampleEn: 'Between 2015 and 2020, energy expenditure fluctuated around 18%.',
    exampleZh: '2015至2020年间，能源支出比例在18%上下波动。',
  },
  {
    id: 'voc-13',
    word: 'subsidize',
    ipa: '/ˈsʌb.sɪ.daɪz/',
    pos: 'v.',
    band: '7.0',
    group: '经济商业',
    groupEn: 'Economy & Business',
    meaning: '补贴，资助（政府常见考点词）',
    meaningEn: 'to pay part of the cost of producing or providing something',
    collocation: 'subsidize public transit · state-subsidized',
    rootHint: 'sub(在下面) + sid(坐/守) + ize → 在背后托底资助',
    rootHintEn: 'sub- (under) + sedere (sit) → financial backing',
    exampleEn: 'Authorities should subsidize public transport to discourage solo commuting.',
    exampleZh: '当局应当补贴公共交通，以减少单人驾车通勤。',
  },
  {
    id: 'voc-14',
    word: 'prosperity',
    ipa: '/prɒsˈper.ə.ti/',
    pos: 'n.',
    band: '6.5',
    group: '经济商业',
    groupEn: 'Economy & Business',
    meaning: '繁荣，兴旺',
    meaningEn: 'the state of being successful and having plenty of wealth',
    collocation: 'economic prosperity · shared prosperity',
    rootHint: 'pro(向前) + sper(希望) + ity → 欣欣向荣',
    rootHintEn: 'pro- (forward) + spes (hope) → thriving state',
    exampleEn: 'Investment in vocational skills underpins long-term national prosperity.',
    exampleZh: '对职业技能的投资支撑着国家的长期经济繁荣。',
  },
  {
    id: 'voc-15',
    word: 'inflation',
    ipa: '/ɪnˈfleɪ.ʃən/',
    pos: 'n.',
    band: '5.5',
    group: '经济商业',
    groupEn: 'Economy & Business',
    meaning: '通货膨胀',
    meaningEn: 'a general continuous rise in prices and fall in purchasing value',
    collocation: 'curb inflation · inflationary pressure',
    rootHint: 'in(向内) + flat(吹气) + ion → 物价像气球一样膨胀',
    rootHintEn: 'in- + flare (blow) → blowing up prices',
    exampleEn: 'Persistent inflation erodes household purchasing power over time.',
    exampleZh: '持续的通货膨胀会随时间推移侵蚀家庭购买力。',
  },
  {
    id: 'voc-16',
    word: 'monopoly',
    ipa: '/məˈnɒp.əl.i/',
    pos: 'n.',
    band: '8.0+',
    group: '经济商业',
    groupEn: 'Economy & Business',
    meaning: '垄断，独占权',
    meaningEn: 'complete control over a market or service by one organization',
    collocation: 'break a monopoly · digital monopoly',
    rootHint: 'mono(单一) + poly(卖) → 仅此一家售卖',
    rootHintEn: 'monos (single) + polein (sell)',
    exampleEn: 'Antitrust regulators aim to curb tech monopolies and foster fair competition.',
    exampleZh: '反垄断监管机构旨在遏制科技巨头垄断并促进公平竞争。',
  },

  // 教育学术 Education & Research (8)
  {
    id: 'voc-17',
    word: 'curriculum',
    ipa: '/kəˈrɪk.jə.ləm/',
    pos: 'n.',
    band: '5.5',
    group: '教育学术',
    groupEn: 'Education & Research',
    meaning: '（学校）全部课程，课程体系',
    meaningEn: 'the subjects comprising a course of study in a school',
    collocation: 'revise the curriculum · extracurricular activities',
    rootHint: 'curr(跑) + iculum → 学习跑完的赛道课程',
    rootHintEn: 'currere (to run) → prescribed course of study',
    exampleEn: 'Coding and media literacy should be embedded into the national curriculum.',
    exampleZh: '编程与媒介素养应当纳入国家课程体系。',
  },
  {
    id: 'voc-18',
    word: 'cognitive',
    ipa: '/ˈkɒɡ.nə.tɪv/',
    pos: 'adj.',
    band: '7.0',
    group: '教育学术',
    groupEn: 'Education & Research',
    meaning: '认知的，认识能力的',
    meaningEn: 'connected with thinking or conscious mental processes',
    collocation: 'cognitive development · cognitive load',
    rootHint: 'co(共同) + gn(知道) + itive → 脑中形成认识',
    rootHintEn: 'con- + gnoscere (know) → mental knowing',
    exampleEn: 'Bilingual upbringing enhances children’s cognitive flexibility.',
    exampleZh: '双语成长环境能够提升儿童的认知灵活性。',
  },
  {
    id: 'voc-19',
    word: 'empirical',
    ipa: '/ɪmˈpɪr.ɪ.kəl/',
    pos: 'adj.',
    band: '8.0+',
    group: '教育学术',
    groupEn: 'Education & Research',
    meaning: '实证的，以实验观察为依据的',
    meaningEn: 'based on observation or experience rather than pure theory',
    collocation: 'empirical evidence · empirical study',
    rootHint: 'em(在…内) + pir(实验/尝试) + ical → 经实验检验的',
    rootHintEn: 'en- + peira (trial/experiment)',
    exampleEn: 'Their educational reform was backed by compelling empirical evidence.',
    exampleZh: '他们的教育改革得到了有力实证依据的支撑。',
  },
  {
    id: 'voc-20',
    word: 'pedagogy',
    ipa: '/ˈped.ə.ɡɒdʒ.i/',
    pos: 'n.',
    band: '8.0+',
    group: '教育学术',
    groupEn: 'Education & Research',
    meaning: '教育学，教学法',
    meaningEn: 'the method and practice of teaching',
    collocation: 'innovative pedagogy · student-centered pedagogy',
    rootHint: 'ped(儿童) + agog(引导) + y → 引导教学方法',
    rootHintEn: 'paidos (child) + agogos (leader)',
    exampleEn: 'Interactive pedagogy motivates learners far better than rote memorization.',
    exampleZh: '互动式教学法远比死记硬背更能激发学习者动力。',
  },
  {
    id: 'voc-21',
    word: 'holistic',
    ipa: '/həˈlɪs.tɪk/',
    pos: 'adj.',
    band: '7.0',
    group: '教育学术',
    groupEn: 'Education & Research',
    meaning: '全面的，整体的（素质教育高频词）',
    meaningEn: 'dealing with the whole system rather than isolated parts',
    collocation: 'holistic development · holistic approach',
    rootHint: 'holo(整体/完整) + istic → 全局综合视角',
    rootHintEn: 'holos (whole) + -istic',
    exampleEn: 'Universities increasingly adopt holistic assessments beyond test scores.',
    exampleZh: '大学越来越多地采用超越单纯分数的综合素质评估。',
  },
  {
    id: 'voc-22',
    word: 'plagiarism',
    ipa: '/ˈpleɪ.dʒər.ɪ.zəm/',
    pos: 'n.',
    band: '6.5',
    group: '教育学术',
    groupEn: 'Education & Research',
    meaning: '剽窃，抄袭（学术诚信核心词）',
    meaningEn: 'copying another person’s ideas or writing as one’s own',
    collocation: 'combat plagiarism · academic plagiarism',
    rootHint: 'plag(网/绑架) + iarism → 偷走他人文章想法',
    rootHintEn: 'plagium (kidnapping/literary theft)',
    exampleEn: 'Clear citation training helps freshmen avoid unintentional plagiarism.',
    exampleZh: '清晰的引用训练有助于新生避免无意抄袭。',
  },
  {
    id: 'voc-23',
    word: 'autonomous',
    ipa: '/ɔːˈtɒn.ə.məs/',
    pos: 'adj.',
    band: '7.0',
    group: '教育学术',
    groupEn: 'Education & Research',
    meaning: '自主的，独立自治的',
    meaningEn: 'having the freedom to govern or learn independently',
    collocation: 'autonomous learner · autonomous driving',
    rootHint: 'auto(自己) + nom(法则) + ous → 自我主导规划',
    rootHintEn: 'autos (self) + nomos (law)',
    exampleEn: 'Self-paced online modules foster more autonomous learning habits.',
    exampleZh: '自主进度的在线课程能够培养更独立的学习习惯。',
  },
  {
    id: 'voc-24',
    word: 'corroborate',
    ipa: '/kəˈrɒb.ə.reɪt/',
    pos: 'v.',
    band: '8.0+',
    group: '教育学术',
    groupEn: 'Education & Research',
    meaning: '证实，印证（研究发现/证词）',
    meaningEn: 'to confirm or give support to a theory or finding',
    collocation: 'corroborate the hypothesis · corroborate findings',
    rootHint: 'cor(加强) + robor(力量/橡树) + ate → 让结论更站得住脚',
    rootHintEn: 'com- + robur (strength/oak) → strengthen proof',
    exampleEn: 'Longitudinal field surveys corroborate earlier laboratory conclusions.',
    exampleZh: '长期实地调查印证了早先的实验室结论。',
  },

  // 科技媒体 Technology & Media (8)
  {
    id: 'voc-25',
    word: 'ubiquitous',
    ipa: '/juːˈbɪk.wɪ.təs/',
    pos: 'adj.',
    band: '8.0+',
    group: '科技媒体',
    groupEn: 'Tech & Media',
    meaning: '无处不在的，普遍存在的',
    meaningEn: 'present, appearing, or found everywhere',
    collocation: 'ubiquitous smartphones · become ubiquitous',
    rootHint: 'ubique(到处) + ous → 随处可见的',
    rootHintEn: 'ubique (everywhere)',
    exampleEn: 'Smart algorithms have become ubiquitous in daily digital services.',
    exampleZh: '智能算法已在日常数字服务中无处不在。',
  },
  {
    id: 'voc-26',
    word: 'obsolete',
    ipa: '/ˌɒb.səlˈiːt/',
    pos: 'adj.',
    band: '7.0',
    group: '科技媒体',
    groupEn: 'Tech & Media',
    meaning: '过时的，被淘汰的',
    meaningEn: 'no longer used because something newer has replaced it',
    collocation: 'render obsolete · planned obsolescence',
    rootHint: 'ob(离开) + sol(习惯使用) → 不再被使用而淘汰',
    rootHintEn: 'ob- + solere (be accustomed) → out of use',
    exampleEn: 'Rapid software updates often render older hardware prematurely obsolete.',
    exampleZh: '快速的软件迭代往往使旧款硬件过早被淘汰。',
  },
  {
    id: 'voc-27',
    word: 'disseminate',
    ipa: '/dɪˈsem.ɪ.neɪt/',
    pos: 'v.',
    band: '8.0+',
    group: '科技媒体',
    groupEn: 'Tech & Media',
    meaning: '传播，散布（信息/知识）',
    meaningEn: 'to spread information or knowledge widely',
    collocation: 'disseminate misinformation · disseminate knowledge',
    rootHint: 'dis(分散) + semin(种子) + ate → 四处播种传播',
    rootHintEn: 'dis- (apart) + semen (seed)',
    exampleEn: 'Social platforms can disseminate unverified claims within minutes.',
    exampleZh: '社交平台可以在几分钟内传播未经核实的言论。',
  },
  {
    id: 'voc-28',
    word: 'surveillance',
    ipa: '/səˈveɪ.ləns/',
    pos: 'n.',
    band: '7.0',
    group: '科技媒体',
    groupEn: 'Tech & Media',
    meaning: '监控，密切监视',
    meaningEn: 'close observation, especially by cameras or data tracking',
    collocation: 'mass surveillance · video surveillance',
    rootHint: 'sur(在上方) + veill(看守) + ance → 高处盯梢看守',
    rootHintEn: 'sur- (over) + veiller (watch)',
    exampleEn: 'Digital surveillance raises fierce debate between public safety and privacy.',
    exampleZh: '数字监控引发了公共安全与个人隐私之间的激烈争论。',
  },
  {
    id: 'voc-29',
    word: 'breakthrough',
    ipa: '/ˈbreɪk.θruː/',
    pos: 'n.',
    band: '5.5',
    group: '科技媒体',
    groupEn: 'Tech & Media',
    meaning: '重大突破，关键进展',
    meaningEn: 'an important discovery or development that helps solve a problem',
    collocation: 'scientific breakthrough · achieve a breakthrough',
    rootHint: 'break(打破) + through(穿过) → 冲破瓶颈取得突破',
    rootHintEn: 'break + through → sudden advance',
    exampleEn: 'Battery chemistry breakthroughs are slashing charging times for EVs.',
    exampleZh: '电池化学领域的突破正在大幅缩短电动车的充电时间。',
  },
  {
    id: 'voc-30',
    word: 'automate',
    ipa: '/ˈɔː.tə.meɪt/',
    pos: 'v.',
    band: '6.5',
    group: '科技媒体',
    groupEn: 'Tech & Media',
    meaning: '使自动化，自动执行',
    meaningEn: 'to operate a process largely by machines or software',
    collocation: 'automate repetitive tasks · workplace automation',
    rootHint: 'auto(自己) + mate → 无需人工干预自动运行',
    rootHintEn: 'autos (self) + -mate',
    exampleEn: 'Factories automate repetitive assembly tasks to raise precision.',
    exampleZh: '工厂将重复性装配工序自动化以提高精度。',
  },
  {
    id: 'voc-31',
    word: 'credible',
    ipa: '/ˈkred.ə.bəl/',
    pos: 'adj.',
    band: '6.5',
    group: '科技媒体',
    groupEn: 'Tech & Media',
    meaning: '可信的，可靠的（新闻/证据）',
    meaningEn: 'that can be believed or trusted',
    collocation: 'credible journalism · credible alternative',
    rootHint: 'cred(相信) + ible → 值得信任的',
    rootHintEn: 'credere (believe) + -ible',
    exampleEn: 'Readers struggle to distinguish credible journalism from clickbait headlines.',
    exampleZh: '读者很难区分可信新闻与标题党内容。',
  },
  {
    id: 'voc-32',
    word: 'cybersecurity',
    ipa: '/ˈsaɪ.bə.sɪˌkjʊə.rə.ti/',
    pos: 'n.',
    band: '6.5',
    group: '科技媒体',
    groupEn: 'Tech & Media',
    meaning: '网络安全',
    meaningEn: 'protection of computer systems and data from digital attacks',
    collocation: 'cybersecurity breach · bolster cybersecurity',
    rootHint: 'cyber(网络控制) + security(安全)',
    rootHintEn: 'cybernetics + security',
    exampleEn: 'Banks invest heavily in cybersecurity to prevent identity theft.',
    exampleZh: '银行在网络安全上投入巨资以防范身份盗窃。',
  },

  // 社会城建 Society & Urbanization (8)
  {
    id: 'voc-33',
    word: 'infrastructure',
    ipa: '/ˈɪn.frə.strʌk.tʃər/',
    pos: 'n.',
    band: '6.5',
    group: '社会城建',
    groupEn: 'Society & Urban',
    meaning: '基础设施（交通/管网/通信）',
    meaningEn: 'basic systems and facilities needed for a city or economy to function',
    collocation: 'upgrade public infrastructure · aging infrastructure',
    rootHint: 'infra(在下面) + structure(结构) → 支撑城市运转的底层结构',
    rootHintEn: 'infra- (below) + structura (building)',
    exampleEn: 'Modernizing rail infrastructure helps ease highway congestion.',
    exampleZh: '铁路基础设施的现代化有助于缓解高速公路拥堵。',
  },
  {
    id: 'voc-34',
    word: 'alleviate',
    ipa: '/əˈliː.vi.eɪt/',
    pos: 'v.',
    band: '7.0',
    group: '社会城建',
    groupEn: 'Society & Urban',
    meaning: '缓解，减轻（拥堵/贫困/压力）',
    meaningEn: 'to make pain, crowding, or difficulty less severe',
    collocation: 'alleviate traffic congestion · alleviate poverty',
    rootHint: 'al(去) + levi(轻) + ate → 使负担变轻',
    rootHintEn: 'ad- + levis (light) → lighten a burden',
    exampleEn: 'Flexible commuting hours can substantially alleviate peak-hour gridlock.',
    exampleZh: '弹性通勤时间可以显著缓解高峰期的交通瘫痪。',
  },
  {
    id: 'voc-35',
    word: 'demographic',
    ipa: '/ˌdem.əˈɡræf.ɪk/',
    pos: 'adj./n.',
    band: '7.0',
    group: '社会城建',
    groupEn: 'Society & Urban',
    meaning: '人口结构的，人口统计特征',
    meaningEn: 'relating to the structure and characteristics of populations',
    collocation: 'demographic shift · aging demographic',
    rootHint: 'demo(民众/人口) + graph(写/统计) + ic → 人口分布画像',
    rootHintEn: 'demos (people) + graphein (write)',
    exampleEn: 'Many developed nations face an unprecedented demographic shift toward aging.',
    exampleZh: '许多发达国家正面临前所未有的人口老龄化结构转型。',
  },
  {
    id: 'voc-36',
    word: 'segregation',
    ipa: '/ˌseɡ.rɪˈɡeɪ.ʃən/',
    pos: 'n.',
    band: '8.0+',
    group: '社会城建',
    groupEn: 'Society & Urban',
    meaning: '隔离，隔绝，分离',
    meaningEn: 'the separation of different groups of people socially or spatially',
    collocation: 'spatial segregation · social integration vs segregation',
    rootHint: 'se(分开) + greg(群体) + ation → 把群体隔离开来',
    rootHintEn: 'se- (apart) + grex (flock/group)',
    exampleEn: 'Mixed-income housing projects prevent residential segregation in major cities.',
    exampleZh: '混合收入住房项目可防止大城市出现居住阶层隔离。',
  },
  {
    id: 'voc-37',
    word: 'amenity',
    ipa: '/əˈmiː.nə.ti/',
    pos: 'n.',
    band: '7.0',
    group: '社会城建',
    groupEn: 'Society & Urban',
    meaning: '生活便利设施（公园/图书馆等）',
    meaningEn: 'a desirable or useful feature or facility of a building or place',
    collocation: 'local amenities · recreational amenities',
    rootHint: 'amen(愉快舒适) + ity → 提升居住舒适度的公共设施',
    rootHintEn: 'amoenus (pleasant) + -ity',
    exampleEn: 'Walking distance to essential amenities determines neighborhood livability.',
    exampleZh: '步行可达基础便利设施决定了一个社区的宜居性。',
  },
  {
    id: 'voc-38',
    word: 'congestion',
    ipa: '/kənˈdʒes.tʃən/',
    pos: 'n.',
    band: '5.5',
    group: '社会城建',
    groupEn: 'Society & Urban',
    meaning: '（交通/网络）拥堵',
    meaningEn: 'crowding and blocking of roads or systems',
    collocation: 'congestion charge · ease traffic congestion',
    rootHint: 'con(共同) + gest(搬运/堆积) + ion → 车流堆积在一起',
    rootHintEn: 'con- (together) + gerere (carry/heap)',
    exampleEn: 'Congestion pricing in central London cut private car volume noticeably.',
    exampleZh: '伦敦市中心的拥堵费政策显著减少了私家车通行量。',
  },
  {
    id: 'voc-39',
    word: 'integration',
    ipa: '/ˌɪn.tɪˈɡreɪ.ʃən/',
    pos: 'n.',
    band: '6.5',
    group: '社会城建',
    groupEn: 'Society & Urban',
    meaning: '融合，一体化，融入',
    meaningEn: 'combining two or more things or helping newcomers join a community',
    collocation: 'social integration · seamless integration',
    rootHint: 'integr(完整) + ation → 融合成一个整体',
    rootHintEn: 'integer (whole) + -ation',
    exampleEn: 'Community centers play a vital role in encouraging cultural integration.',
    exampleZh: '社区中心在促进文化融合方面发挥着重要作用。',
  },
  {
    id: 'voc-40',
    word: 'revitalize',
    ipa: '/ˌriːˈvaɪ.təl.aɪz/',
    pos: 'v.',
    band: '8.0+',
    group: '社会城建',
    groupEn: 'Society & Urban',
    meaning: '使重获生机，振兴（老街区/经济）',
    meaningEn: 'to bring new life, energy, or growth back to a declining area',
    collocation: 'revitalize historic districts · revitalize rural economies',
    rootHint: 're(再) + vit(生命) + al + ize → 注入第二次生命力',
    rootHintEn: 're- (again) + vita (life)',
    exampleEn: 'Converting abandoned warehouses into art hubs can revitalize inner cities.',
    exampleZh: '将废弃仓库改造成艺术中心能够重振老城区的活力。',
  },

  // 健康政策 Health & Public Policy (8)
  {
    id: 'voc-41',
    word: 'sedentary',
    ipa: '/ˈsed.ən.tər.i/',
    pos: 'adj.',
    band: '7.0',
    group: '健康政策',
    groupEn: 'Health & Policy',
    meaning: '久坐不动的，缺乏运动的',
    meaningEn: 'involving sitting for long periods with little physical activity',
    collocation: 'sedentary lifestyle · sedentary desk jobs',
    rootHint: 'sed(坐) + entary → 长时间坐着的',
    rootHintEn: 'sedere (to sit) → sitting habitually',
    exampleEn: 'A predominantly sedentary lifestyle increases the risk of cardiovascular disease.',
    exampleZh: '长期久坐的生活方式会增加患心血管疾病的风险。',
  },
  {
    id: 'voc-42',
    word: 'mandatory',
    ipa: '/ˈmæn.də.tər.i/',
    pos: 'adj.',
    band: '6.5',
    group: '健康政策',
    groupEn: 'Health & Policy',
    meaning: '强制性的，法定的（反义: voluntary）',
    meaningEn: 'required by law or official rule; compulsory',
    collocation: 'mandatory nutrition labeling · make sth mandatory',
    rootHint: 'mand(命令/委托) + atory → 必须执行的法定要求',
    rootHintEn: 'mandare (command) → compulsory',
    exampleEn: 'Mandatory calorie labeling empowers consumers to choose healthier meals.',
    exampleZh: '强制热量标识能让消费者选择更健康的餐食。',
  },
  {
    id: 'voc-43',
    word: 'preventive',
    ipa: '/prɪˈven.tɪv/',
    pos: 'adj.',
    band: '6.5',
    group: '健康政策',
    groupEn: 'Health & Policy',
    meaning: '预防性的，防患未然的',
    meaningEn: 'designed to stop something bad from happening before it occurs',
    collocation: 'preventive healthcare · preventive measures',
    rootHint: 'pre(提前) + vent(来) + ive → 赶在问题发生前阻挡',
    rootHintEn: 'prae- (before) + venire (come)',
    exampleEn: 'Investing in preventive healthcare slashes long-term hospital expenditure.',
    exampleZh: '投资预防性医疗能够大幅削减长期住院开支。',
  },
  {
    id: 'voc-44',
    word: 'rehabilitate',
    ipa: '/ˌriː.həˈbɪl.ɪ.teɪt/',
    pos: 'v.',
    band: '8.0+',
    group: '健康政策',
    groupEn: 'Health & Policy',
    meaning: '使康复；改造（罪犯/生态）',
    meaningEn: 'to help someone recover health or return to normal productive life',
    collocation: 'rehabilitate offenders · physical rehabilitation',
    rootHint: 're(重新) + habil(能力) + itate → 使恢复正常生活能力',
    rootHintEn: 're- + habilis (able/fit)',
    exampleEn: 'Job training programs aim to rehabilitate former offenders into society.',
    exampleZh: '职业培训项目旨在帮助曾服刑人员重新融入社会。',
  },
  {
    id: 'voc-45',
    word: 'detrimental',
    ipa: '/ˌdet.rɪˈmen.təl/',
    pos: 'adj.',
    band: '7.0',
    group: '健康政策',
    groupEn: 'Health & Policy',
    meaning: '有害的，不利的（替换 harmful）',
    meaningEn: 'tending to cause harm or damage',
    collocation: 'be detrimental to mental health',
    rootHint: 'de(向下) + tri(磨损) + mental → 造成损耗伤害的',
    rootHintEn: 'de- + terere (wear away) → damaging',
    exampleEn: 'Chronic sleep deprivation is deeply detrimental to adolescent concentration.',
    exampleZh: '长期睡眠不足对青少年的注意力极为有害。',
  },
  {
    id: 'voc-46',
    word: 'legislation',
    ipa: '/ˌledʒ.ɪˈsleɪ.ʃən/',
    pos: 'n.',
    band: '6.5',
    group: '健康政策',
    groupEn: 'Health & Policy',
    meaning: '立法，法规总称（不可数名词！）',
    meaningEn: 'a law or set of laws enacted by a government',
    collocation: 'tighten legislation · enact strict legislation',
    rootHint: 'leg(法律) + lat(带来) + ion → 制定法律（注意不可加-s）',
    rootHintEn: 'lex (law) + ferre (bring) — uncountable noun',
    exampleEn: 'Strict legislation on tobacco packaging lowered youth smoking rates.',
    exampleZh: '关于烟草包装的严格立法降低了青少年吸烟率。',
  },
  {
    id: 'voc-47',
    word: 'viable',
    ipa: '/ˈvaɪ.ə.bəl/',
    pos: 'adj.',
    band: '7.0',
    group: '健康政策',
    groupEn: 'Health & Policy',
    meaning: '可行的，切合实际的（方案/替代）',
    meaningEn: 'capable of working successfully; feasible',
    collocation: 'economically viable · viable alternative',
    rootHint: 'vi(生命/道路) + able → 走得通、有生命力的方案',
    rootHintEn: 'vita (life) / via (way) → workable',
    exampleEn: 'Telemedicine offers a viable solution for remote rural clinics.',
    exampleZh: '远程医疗为偏远乡村诊所提供了可行的解决方案。',
  },
  {
    id: 'voc-48',
    word: 'ubiquity',
    ipa: '/juːˈbɪk.wə.ti/',
    pos: 'n.',
    band: '8.0+',
    group: '健康政策',
    groupEn: 'Health & Policy',
    meaning: '普遍存在（高分名词化表达）',
    meaningEn: 'the fact of appearing everywhere or being very common',
    collocation: 'the ubiquity of processed food',
    rootHint: '来自 ubiquitous 的名词形式，写作名词化加分项',
    rootHintEn: 'noun form of ubiquitous (nominalization)',
    exampleEn: 'The ubiquity of ultra-processed food fuels rising childhood obesity.',
    exampleZh: '超加工食品的普及助推了儿童肥胖率的攀升。',
  },
  // 扩容高分进阶词群 (voc-49 ~ voc-66)
  {
    id: 'voc-49',
    word: 'resilience',
    ipa: '/rɪˈzɪl.i.əns/',
    pos: 'n.',
    band: '7.0',
    group: '自然生态',
    groupEn: 'Nature & Ecology',
    meaning: '生态韧性，恢复力，抗逆力',
    meaningEn: 'capacity of ecosystems or systems to recover quickly from shocks',
    collocation: 'ecological resilience · build climate resilience',
    rootHint: 're(回) + sil(跳) → 遭受冲击后弹回原状的能力',
    rootHintEn: 're (back) + salire (leap) → bounce back',
    exampleEn: 'Wetland restoration strengthens coastal resilience against storm surges.',
    exampleZh: '湿地修复增强了海岸带抵御风暴潮的生态韧性。',
  },
  {
    id: 'voc-50',
    word: 'depletion',
    ipa: '/dɪˈpliː.ʃən/',
    pos: 'n.',
    band: '7.0',
    group: '自然生态',
    groupEn: 'Nature & Ecology',
    meaning: '枯竭，耗尽（资源/臭氧/地下水）',
    meaningEn: 'reduction in the number or quantity of a vital resource',
    collocation: 'groundwater depletion · resource depletion',
    rootHint: 'de(向下/去掉) + plet(满) → 从满变空即“枯竭”',
    rootHintEn: 'de- + plere (fill) → empty out',
    exampleEn: 'Unregulated irrigation accelerates aquifer depletion in arid regions.',
    exampleZh: '无序灌溉加速了干旱地区含水层的枯竭。',
  },
  {
    id: 'voc-51',
    word: 'anthropogenic',
    ipa: '/ˌæn.θrə.pəˈdʒen.ɪk/',
    pos: 'adj.',
    band: '8.0+',
    group: '自然生态',
    groupEn: 'Nature & Ecology',
    meaning: '人为引起的（尤指气候/环境变化）',
    meaningEn: 'originating in human activity rather than natural cycles',
    collocation: 'anthropogenic emissions · anthropogenic climate change',
    rootHint: 'anthropo(人类) + gen(产生) → 人类活动造成的',
    rootHintEn: 'anthropos (human) + gen (produce)',
    exampleEn: 'Ice-core records isolate anthropogenic warming from natural solar cycles.',
    exampleZh: '冰芯记录将人类活动引起的变暖与自然太阳周期区分开来。',
  },
  {
    id: 'voc-52',
    word: 'disparity',
    ipa: '/dɪˈspær.ə.ti/',
    pos: 'n.',
    band: '7.0',
    group: '经济商业',
    groupEn: 'Economy & Business',
    meaning: '（收入/地区/教育）显著差距，不平等',
    meaningEn: 'a clear and often unfair difference between two groups',
    collocation: 'widen regional disparity · wealth disparity',
    rootHint: 'dis(不) + par(相等) → 不对等即差距',
    rootHintEn: 'dis- (not) + par (equal)',
    exampleEn: 'Targeted broadband subsidies help narrow the urban-rural digital disparity.',
    exampleZh: '定向宽带补贴有助于缩小城乡数字鸿沟。',
  },
  {
    id: 'voc-53',
    word: 'monopoly',
    ipa: '/məˈnɒp.əl.i/',
    pos: 'n.',
    band: '6.5',
    group: '经济商业',
    groupEn: 'Economy & Business',
    meaning: '垄断，独占控制权',
    meaningEn: 'exclusive control of a market or commodity by one provider',
    collocation: 'break up a tech monopoly · natural monopoly',
    rootHint: 'mono(单一) + poly(卖) → 独家售卖权',
    rootHintEn: 'monos (single) + polein (sell)',
    exampleEn: 'Antitrust watchdogs intervened to curb the platform’s market monopoly.',
    exampleZh: '反垄断监管机构介入以遏制该平台的市场垄断。',
  },
  {
    id: 'voc-54',
    word: 'lucrative',
    ipa: '/ˈluː.krə.tɪv/',
    pos: 'adj.',
    band: '8.0+',
    group: '经济商业',
    groupEn: 'Economy & Business',
    meaning: '利润丰厚的，赚大钱的（替代 very profitable）',
    meaningEn: 'producing a great deal of profit',
    collocation: 'a lucrative career · lucrative export market',
    rootHint: 'lucr(利润) + ative → 带来丰厚收益的',
    rootHintEn: 'lucrum (gain/profit)',
    exampleEn: 'Clean battery recycling has emerged as a surprisingly lucrative sector.',
    exampleZh: '清洁电池回收已崛起为一个利润意外丰厚的行业。',
  },
  {
    id: 'voc-55',
    word: 'curriculum',
    ipa: '/kəˈrɪk.jə.ləm/',
    pos: 'n.',
    band: '5.5',
    group: '教育学术',
    groupEn: 'Education & Academia',
    meaning: '（学校）全部课程体系（复数 curricula）',
    meaningEn: 'the subjects comprising a course of study in a school or college',
    collocation: 'integrate coding into the national curriculum',
    rootHint: 'curr(跑) → 学习进程/课程表',
    rootHintEn: 'currere (to run a course)',
    exampleEn: 'Financial literacy should be embedded within the secondary school curriculum.',
    exampleZh: '金融素养教育应当纳入中学课程体系。',
  },
  {
    id: 'voc-56',
    word: 'pedagogy',
    ipa: '/ˈped.ə.ɡɒdʒ.i/',
    pos: 'n.',
    band: '8.0+',
    group: '教育学术',
    groupEn: 'Education & Academia',
    meaning: '教学法，教育方法论',
    meaningEn: 'the method and practice of teaching as an academic discipline',
    collocation: 'student-centered pedagogy · inquiry-based pedagogy',
    rootHint: 'ped(儿童/学习者) + agog(引导) → 引导教学的方法',
    rootHintEn: 'pais (child) + agein (lead)',
    exampleEn: 'Interactive pedagogy prioritizes critical inquiry over passive memorization.',
    exampleZh: '互动式教学法将批判性探究置于死记硬背之上。',
  },
  {
    id: 'voc-57',
    word: 'aptitude',
    ipa: '/ˈæp.tɪ.tjuːd/',
    pos: 'n.',
    band: '7.0',
    group: '教育学术',
    groupEn: 'Education & Academia',
    meaning: '天赋，自然倾向（替代 talent）',
    meaningEn: 'a natural ability or knack to learn a particular skill',
    collocation: 'demonstrate an aptitude for mathematics',
    rootHint: 'apt(适合/敏锐) + itude → 天生契合某领域的能力',
    rootHintEn: 'aptus (fitted/suited)',
    exampleEn: 'Vocational tracks support students who show strong practical aptitude.',
    exampleZh: '职业教育路径支持展现出强大动手天赋的学生。',
  },
  {
    id: 'voc-58',
    word: 'obsolete',
    ipa: '/ˌɒb.səˈliːt/',
    pos: 'adj.',
    band: '7.0',
    group: '科技媒体',
    groupEn: 'Tech & Media',
    meaning: '过时的，被淘汰的（替代 old-fashioned）',
    meaningEn: 'no longer produced or used; out of date',
    collocation: 'render skills obsolete · planned obsolescence',
    rootHint: 'ob(向/渐) + sol(习惯/使用) → 不再被使用即过时',
    rootHintEn: 'obsolescere (grow old / fall into disuse)',
    exampleEn: 'Rapid software updates deliberately make older devices feel obsolete.',
    exampleZh: '快速的软件迭代刻意让旧款设备显得过时。',
  },
  {
    id: 'voc-59',
    word: 'algorithm',
    ipa: '/ˈæl.ɡə.rɪ.ðəm/',
    pos: 'n.',
    band: '6.5',
    group: '科技媒体',
    groupEn: 'Tech & Media',
    meaning: '算法（听力/阅读高频拼写词）',
    meaningEn: 'a step-by-step set of rules followed by a computer in problem-solving',
    collocation: 'recommendation algorithm · algorithmic bias',
    rootHint: '注意拼写：al-go-ri-thm（无 y，th 结尾）',
    rootHintEn: 'Spelling watch: al-go-ri-thm',
    exampleEn: 'Social feeds rely on opaque algorithms that maximize watch time.',
    exampleZh: '社交信息流依赖不透明算法来最大化观看时长。',
  },
  {
    id: 'voc-60',
    word: 'disseminate',
    ipa: '/dɪˈsem.ɪ.neɪt/',
    pos: 'v.',
    band: '8.0+',
    group: '科技媒体',
    groupEn: 'Tech & Media',
    meaning: '广泛传播（信息/知识/观点）',
    meaningEn: 'spread information, ideas, or knowledge widely',
    collocation: 'disseminate verified findings · disseminate misinformation',
    rootHint: 'dis(分散) + semin(种子) + ate → 播撒信息种子',
    rootHintEn: 'dis- (apart) + semen (seed)',
    exampleEn: 'Open-access journals accelerate how swiftly scientists disseminate findings.',
    exampleZh: '开放获取期刊加速了科学家传播研究成果的速度。',
  },
  {
    id: 'voc-61',
    word: 'congestion',
    ipa: '/kənˈdʒes.tʃən/',
    pos: 'n.',
    band: '5.5',
    group: '社会城建',
    groupEn: 'Society & Urban',
    meaning: '交通拥堵，过度拥挤',
    meaningEn: 'extreme crowding or blocking of roads and urban infrastructure',
    collocation: 'alleviate traffic congestion · congestion pricing',
    rootHint: 'con(一起) + gest(带来/堆积) → 车流堆积到一起',
    rootHintEn: 'con- + gerere (pile up)',
    exampleEn: 'Dedicated tram corridors measurably ease peak-hour road congestion.',
    exampleZh: '专用有轨电车走廊显著缓解了高峰期道路拥堵。',
  },
  {
    id: 'voc-62',
    word: 'gentrification',
    ipa: '/ˌdʒen.trɪ.fɪˈkeɪ.ʃən/',
    pos: 'n.',
    band: '8.0+',
    group: '社会城建',
    groupEn: 'Society & Urban',
    meaning: '城市旧区绅士化/高档化改造',
    meaningEn: 'renovation of poorer urban areas attracting wealthier residents and raising rents',
    collocation: 'urban gentrification · displace long-term tenants',
    rootHint: 'gentry(富裕阶层) + ification → 中产/高收入群体迁入旧城改造',
    rootHintEn: 'gentry + -ification',
    exampleEn: 'Unchecked gentrification frequently prices longtime residents out of historic wards.',
    exampleZh: '无节制的旧城高档化常常将老住户挤出历史街区。',
  },
  {
    id: 'voc-63',
    word: 'cohesion',
    ipa: '/kəʊˈhiː.ʒən/',
    pos: 'n.',
    band: '7.0',
    group: '社会城建',
    groupEn: 'Society & Urban',
    meaning: '社会凝聚力，团结紧凑',
    meaningEn: 'the action or fact of forming a united social whole',
    collocation: 'foster social cohesion · community cohesion',
    rootHint: 'co(共同) + hes(黏附) → 彼此紧扣团结在一起',
    rootHintEn: 'co- (together) + haerere (stick)',
    exampleEn: 'Mixed-use public plazas strengthen neighborhood cohesion across generations.',
    exampleZh: '混合功能公共广场增强了跨代际社区凝聚力。',
  },
  {
    id: 'voc-64',
    word: 'preventive',
    ipa: '/prɪˈven.tɪv/',
    pos: 'adj.',
    band: '6.5',
    group: '健康政策',
    groupEn: 'Health & Policy',
    meaning: '预防性的（医疗/措施）',
    meaningEn: 'designed to keep something undesirable such as illness from occurring',
    collocation: 'preventive healthcare · preventive screening',
    rootHint: 'pre(提前) + vent(来) → 走在疾病前面阻拦',
    rootHintEn: 'pre- (before) + venire (come)',
    exampleEn: 'Funding preventive screenings reduces emergency hospital admissions later on.',
    exampleZh: '资助预防性体检能减少日后的急诊住院负担。',
  },
  {
    id: 'voc-65',
    word: 'sedentary',
    ipa: '/ˈsed.ən.tər.i/',
    pos: 'adj.',
    band: '7.0',
    group: '健康政策',
    groupEn: 'Health & Policy',
    meaning: '久坐不动的（生活方式/工作）',
    meaningEn: 'tending to spend much time seated and physically inactive',
    collocation: 'sedentary lifestyle · counteract sedentary habits',
    rootHint: 'sed(坐) + entary → 长期坐着不动',
    rootHintEn: 'sedere (to sit)',
    exampleEn: 'Office-based economies have normalized dangerously sedentary daily routines.',
    exampleZh: '以办公室为主导的经济形态让危险的久坐日常趋于常态。',
  },
  {
    id: 'voc-66',
    word: 'mandate',
    ipa: '/ˈmæn.deɪt/',
    pos: 'v. / n.',
    band: '8.0+',
    group: '健康政策',
    groupEn: 'Health & Policy',
    meaning: '强制规定，授权令（替代 force）',
    meaningEn: 'officially require or give authority to carry out a policy',
    collocation: 'mandate calorie labeling · public health mandate',
    rootHint: 'man(手) + date(给) → 正式交办指令',
    rootHintEn: 'manus (hand) + dare (give)',
    exampleEn: 'Several municipalities mandate clear sugar-content labels on bottled drinks.',
    exampleZh: '多个城市强制要求瓶装饮料标注清晰的含糖量标签。',
  },
];

export const LISTENING_179_ITEMS: Listening179Item[] = [
  {
    id: 'l179-1',
    band: '5.5',
    section: 'Section 1',
    questionWord: 'book in advance',
    audioParaphrase: 'reservation',
    meaning: '提前预订',
    meaningEn: 'make a booking beforehand',
    trapNote: '警惕单复数：two reservations；避免漏写末尾 -tion。',
    trapNoteEn: 'Watch plural -s and -tion spelling.',
  },
  {
    id: 'l179-2',
    band: '5.5',
    section: 'Section 1',
    questionWord: 'price includes breakfast',
    audioParaphrase: 'accommodation',
    meaning: '住宿费用',
    meaningEn: 'lodging / room stay',
    trapNote: '听力 Section 1 超高频：注意双写 c 和双写 m（ac-com-mo-dation）。',
    trapNoteEn: 'Double c and double m trap word in Section 1.',
  },
  {
    id: 'l179-3',
    band: '6.5',
    section: 'Section 2',
    questionWord: 'repair work / closed for fixing',
    audioParaphrase: 'renovation',
    meaning: '翻新，修缮',
    meaningEn: 'repairing and improving a building',
    trapNote: '地图/配对题常听到 under renovation / refurbishment。',
    trapNoteEn: 'Audio frequently paraphrases closed/repair as renovation.',
  },
  {
    id: 'l179-4',
    band: '6.5',
    section: 'Section 2',
    questionWord: 'free entrance / no fee',
    audioParaphrase: 'complimentary',
    meaning: '免费的，赠送的',
    meaningEn: 'given free of charge (with an i, not e)',
    trapNote: '易混拼写陷阱：complimentary (免费/赞美) vs complementary (互补)。',
    trapNoteEn: 'Spelling trap: complimentary (free) vs complementary (matching).',
  },
  {
    id: 'l179-5',
    band: '7.0',
    section: 'Section 3',
    questionWord: 'main problem / limitation',
    audioParaphrase: 'drawback',
    meaning: '缺点，局限性',
    meaningEn: 'disadvantage or problem',
    trapNote: '学术讨论题常见信号词：however, the main drawback / flaw is...',
    trapNoteEn: 'Academic signal word following however/actually.',
  },
  {
    id: 'l179-6',
    band: '7.0',
    section: 'Section 3',
    questionWord: 'check sources / look up books',
    audioParaphrase: 'bibliography',
    meaning: '参考文献目录',
    meaningEn: 'list of books/articles cited in research',
    trapNote: '注意拼写 bib-li-o-graphy；Section 3 论文讨论极常作为填空答案。',
    trapNoteEn: 'High-frequency Section 3 academic dictation target.',
  },
  {
    id: 'l179-7',
    band: '6.5',
    section: 'Section 3',
    questionWord: 'set a strict time limit',
    audioParaphrase: 'deadline',
    meaning: '截止日期',
    meaningEn: 'final time by which work must be submitted',
    trapNote: '题干说 submission date，录音常替换为 strict deadline / cut-off。',
    trapNoteEn: 'Replaces submission date or due time.',
  },
  {
    id: 'l179-8',
    band: '7.0',
    section: 'Section 4',
    questionWord: 'completely disappear',
    audioParaphrase: 'extinct',
    meaning: '灭绝的，消失的',
    meaningEn: 'no longer existing as a species or practice',
    trapNote: '区分词性：题目要形容词填 extinct，要名词填 extinction。',
    trapNoteEn: 'Check word class carefully: extinct (adj) vs extinction (n).',
  },
  {
    id: 'l179-9',
    band: '7.0',
    section: 'Section 4',
    questionWord: 'keep temperature steady',
    audioParaphrase: 'insulation',
    meaning: '隔热，绝缘，保温层',
    meaningEn: 'material reducing loss of heat, sound, or electricity',
    trapNote: '建筑/环保讲座高频词，常与 heat loss / timber frame 同现。',
    trapNoteEn: 'Common in Section 4 eco-architecture & energy lectures.',
  },
  {
    id: 'l179-10',
    band: '6.5',
    section: 'Section 1',
    questionWord: 'allergic / cannot eat',
    audioParaphrase: 'vegetarian',
    meaning: '素食者，素食',
    meaningEn: 'person who does not eat meat',
    trapNote: '饮食需求题注意 veg-e-tar-i-an 中间字母 e/a 顺序。',
    trapNoteEn: 'Check vowel sequence v-e-g-e-t-a-r-i-a-n.',
  },
  {
    id: 'l179-11',
    band: '7.0',
    section: 'Section 4',
    questionWord: 'move from one region to another',
    audioParaphrase: 'migration',
    meaning: '迁徙，迁移',
    meaningEn: 'seasonal movement of animals or people',
    trapNote: '常与 bird/salmon/urban migration 搭配，注意不要误写成 immigration。',
    trapNoteEn: 'Distinguish migration from immigration/emigration by context.',
  },
  {
    id: 'l179-12',
    band: '8.0+',
    section: 'Section 4',
    questionWord: 'lack of water / dry climate',
    audioParaphrase: 'drought',
    meaning: '干旱，长期缺水',
    meaningEn: 'prolonged period of abnormally low rainfall',
    trapNote: '发音易混淆：drought (/draʊt/ 干旱) vs draught (/drɑːft/ 穿堂风/草稿)。',
    trapNoteEn: 'Phonetic trap: drought (dry spell) vs draught (current of air).',
  },
  {
    id: 'l179-13',
    band: '5.5',
    section: 'Section 1',
    questionWord: 'nearest pharmacy / medical store',
    audioParaphrase: 'chemist',
    meaning: '药店（英式高频替换）',
    meaningEn: 'UK term for pharmacy or drugstore',
    trapNote: '雅思英音主导，Section 1/2 地图题常把 pharmacy 说成 chemist’s。',
    trapNoteEn: 'British English vocabulary swap in Section 1 & 2.',
  },
  {
    id: 'l179-14',
    band: '6.5',
    section: 'Section 2',
    questionWord: 'handouts / printed guide',
    audioParaphrase: 'brochure',
    meaning: '宣传小册子',
    meaningEn: 'small booklet containing pictures and information',
    trapNote: '注意法语词源拼写 bro-ch-ure，读音 /ˈbrəʊ.ʃər/。',
    trapNoteEn: 'French-origin spelling trap: b-r-o-c-h-u-r-e.',
  },
  {
    id: 'l179-15',
    band: '7.0',
    section: 'Section 3',
    questionWord: 'ask people questions',
    audioParaphrase: 'questionnaire',
    meaning: '调查问卷',
    meaningEn: 'set of printed or digital questions for a survey',
    trapNote: '双写 n 极易丢分：question + naire。',
    trapNoteEn: 'Double-n spelling trap: question-naire.',
  },
  {
    id: 'l179-16',
    band: '8.0+',
    section: 'Section 4',
    questionWord: 'unexpected danger / threat',
    audioParaphrase: 'hazard',
    meaning: '危险，公害，隐患',
    meaningEn: 'a potential source of danger or health risk',
    trapNote: '单一 z 而非双写 z；常搭配 environmental/fire hazard。',
    trapNoteEn: 'Single-z spelling: h-a-z-a-r-d.',
  },
  {
    id: 'l179-17',
    band: '5.5',
    section: 'Section 1',
    questionWord: 'monthly fee / cost',
    audioParaphrase: 'subscription',
    meaning: '订阅费，会费',
    meaningEn: 'regular payment made to belong to a club or receive service',
    trapNote: 'Club membership / gym / magazine 场景常替换为 annual subscription。',
    trapNoteEn: 'Replaces membership fee in Section 1.',
  },
  {
    id: 'l179-18',
    band: '8.0+',
    section: 'Section 4',
    questionWord: 'original native group',
    audioParaphrase: 'indigenous',
    meaning: '本土的，土著的',
    meaningEn: 'originating or occurring naturally in a particular place',
    trapNote: '人类学/生态学 Section 4 超级高频替换 native / local。',
    trapNoteEn: 'Replaces native/original in anthropology & ecology talks.',
  },
  {
    id: 'l179-101',
    band: '5.5',
    section: 'Section 1',
    questionWord: 'car park / place to leave car',
    audioParaphrase: 'garage',
    meaning: '车库，修车厂',
    meaningEn: 'covered building or space for parking or repairing a vehicle',
    trapNote: '租房/设施问答 Section 1 高频词，注意结尾 -age 拼写。',
    trapNoteEn: 'Common Section 1 housing/facility answer; check -age ending.',
  },
  {
    id: 'l179-102',
    band: '6.5',
    section: 'Section 2',
    questionWord: 'guide / path for walkers',
    audioParaphrase: 'itinerary',
    meaning: '行程表，路线安排',
    meaningEn: 'planned route or detailed schedule of a journey or tour',
    trapNote: '注意多音节拼写 i-ti-ne-ra-ry，旅游介绍 Section 2 极高频。',
    trapNoteEn: 'Check vowel pattern i-t-i-n-e-r-a-r-y in tour briefings.',
  },
  {
    id: 'l179-103',
    band: '6.5',
    section: 'Section 2',
    questionWord: 'put money into',
    audioParaphrase: 'sponsor',
    meaning: '赞助，资助方',
    meaningEn: 'person or organization providing funds for an event or project',
    trapNote: '注意结尾是 -or 而非 -er：spon-sor。',
    trapNoteEn: 'Ends in -or rather than -er: s-p-o-n-s-o-r.',
  },
  {
    id: 'l179-104',
    band: '7.0',
    section: 'Section 3',
    questionWord: 'work together with others',
    audioParaphrase: 'collaborate',
    meaning: '合作，协作',
    meaningEn: 'work jointly on an activity or academic project',
    trapNote: '注意双写 l：col-la-bo-rate，学术讨论常替代 work jointly。',
    trapNoteEn: 'Double-l spelling: c-o-l-l-a-b-o-r-a-t-e.',
  },
  {
    id: 'l179-105',
    band: '7.0',
    section: 'Section 3',
    questionWord: 'prove / check accuracy',
    audioParaphrase: 'verify',
    meaning: '核实，验证',
    meaningEn: 'make sure or demonstrate that data or a claim is true',
    trapNote: '论文研究方法讨论高频动词，注意不要误写成 veryfy。',
    trapNoteEn: 'Section 3 research discussion target: v-e-r-i-f-y.',
  },
  {
    id: 'l179-106',
    band: '7.0',
    section: 'Section 4',
    questionWord: 'break down naturally',
    audioParaphrase: 'decompose',
    meaning: '分解，腐烂（生态/材料）',
    meaningEn: 'decay or break down into simpler substances organically',
    trapNote: '环保与堆肥讲座 Section 4 常用来替换 rot / break down。',
    trapNoteEn: 'Paraphrases rot/break down in environmental lectures.',
  },
  {
    id: 'l179-107',
    band: '8.0+',
    section: 'Section 4',
    questionWord: 'enough / adequate supply',
    audioParaphrase: 'sufficient',
    meaning: '充足的，足够的',
    meaningEn: 'adequate for a specific purpose or need',
    trapNote: '高频拼写陷阱：双写 f 且中间是 -ci-（suf-fi-cient）。',
    trapNoteEn: 'Double-f and -cient trap: s-u-f-f-i-c-i-e-n-t.',
  },
  {
    id: 'l179-108',
    band: '8.0+',
    section: 'Section 4',
    questionWord: 'harmful / unsafe substance',
    audioParaphrase: 'toxic',
    meaning: '有毒的，有害的',
    meaningEn: 'poisonous or severely harmful to health and ecosystems',
    trapNote: '注意名词形式 toxicity 与形容词 toxic 根据空前词性判断。',
    trapNoteEn: 'Watch part of speech: toxic (adj) vs toxicity (n).',
  },
  {
    id: 'l179-109',
    band: '5.5',
    section: 'Section 1',
    questionWord: 'free / no charge',
    audioParaphrase: 'complimentary',
    meaning: '免费的，赠送的',
    meaningEn: 'given or supplied free of charge',
    trapNote: '拼写易错：中间是 -pli-（赞美/赠送）而非 -ple-（补充 complete）。',
    trapNoteEn: 'Spelling contrast: com-pli-mentary (free) vs com-ple-mentary.',
  },
  {
    id: 'l179-110',
    band: '5.5',
    section: 'Section 1',
    questionWord: 'place to live / room',
    audioParaphrase: 'accommodation',
    meaning: '住宿，住处',
    meaningEn: 'a room, building, or space where someone stays',
    trapNote: '雅思 Section 1 最高频拼写坑：双写 c 与双写 m（ac-com-mo-dation）。',
    trapNoteEn: 'Classic double-c, double-m trap: a-c-c-o-m-m-o-d-a-t-i-o-n.',
  },
  {
    id: 'l179-111',
    band: '6.5',
    section: 'Section 2',
    questionWord: 'put back to original state',
    audioParaphrase: 'restore',
    meaning: '修复，恢复原貌',
    meaningEn: 'repair or bring back a building or habitat to its former condition',
    trapNote: '古建修缮与生态湿地公园地图题高频动词。',
    trapNoteEn: 'Common in heritage building and wetland map descriptions.',
  },
  {
    id: 'l179-112',
    band: '6.5',
    section: 'Section 2',
    questionWord: 'not near traffic / walk only',
    audioParaphrase: 'pedestrian',
    meaning: '步行的，行人的',
    meaningEn: 'a person walking rather than travelling in a vehicle',
    trapNote: '注意词尾 -ian：pe-des-tri-an（常搭配 zone / bridge）。',
    trapNoteEn: 'Watch ending -ian: p-e-d-e-s-t-r-i-a-n.',
  },
  {
    id: 'l179-113',
    band: '7.0',
    section: 'Section 3',
    questionWord: 'plan of stages / timeline',
    audioParaphrase: 'schedule',
    meaning: '日程表，进度安排',
    meaningEn: 'a plan for carrying out a process or procedure with times',
    trapNote: '英音 /ˈʃedjuːl/ 与美音 /ˈskedʒuːl/ 差异极大，务必盲听辨音。',
    trapNoteEn: 'Listen for both UK /ˈʃedjuːl/ and US /ˈskedʒuːl/ pronunciations.',
  },
  {
    id: 'l179-114',
    band: '7.0',
    section: 'Section 3',
    questionWord: 'list of questions / survey',
    audioParaphrase: 'questionnaire',
    meaning: '调查问卷',
    meaningEn: 'a set of printed or online questions for gathering research data',
    trapNote: '注意双写 n：ques-tion-naire，Section 3 论文讨论极高频。',
    trapNoteEn: 'Double-n spelling: q-u-e-s-t-i-o-n-n-a-i-r-e.',
  },
  {
    id: 'l179-115',
    band: '7.0',
    section: 'Section 3',
    questionWord: 'opposite view / flaw in method',
    audioParaphrase: 'limitation',
    meaning: '局限性，不足之处',
    meaningEn: 'a limiting rule, weakness, or restriction in a study',
    trapNote: '导师评价实验样本太小时常说 major limitation。',
    trapNoteEn: 'Used when tutors critique small sample sizes in Section 3.',
  },
  {
    id: 'l179-116',
    band: '7.0',
    section: 'Section 4',
    questionWord: 'keep doing for long time',
    audioParaphrase: 'sustainable',
    meaning: '可持续的，环保耐久的',
    meaningEn: 'able to be maintained at a certain rate without depleting resources',
    trapNote: '农业、能源、城市规划 Section 4 核心高频词。',
    trapNoteEn: 'Core Section 4 adjective across agriculture, energy, and cities.',
  },
  {
    id: 'l179-117',
    band: '8.0+',
    section: 'Section 4',
    questionWord: 'disappear completely / die out',
    audioParaphrase: 'extinct',
    meaning: '灭绝的，消亡的',
    meaningEn: 'no longer in existence (of a species, volcano, or custom)',
    trapNote: '注意区分名词 extinction 与形容词 extinct（填空看空前 be/become）。',
    trapNoteEn: 'Distinguish adj "extinct" from noun "extinction".',
  },
  {
    id: 'l179-118',
    band: '8.0+',
    section: 'Section 4',
    questionWord: 'change to fit new conditions',
    audioParaphrase: 'adapt',
    meaning: '适应，改造以适应',
    meaningEn: 'become adjusted to new environmental or social conditions',
    trapNote: '听写高频混音词：adapt（适应）vs adopt（采用/收养）。',
    trapNoteEn: 'Do not confuse "adapt" (adjust) with "adopt" (take up).',
  },
  {
    id: 'l179-119',
    band: '8.0+',
    section: 'Section 4',
    questionWord: 'speed up / grow faster',
    audioParaphrase: 'accelerate',
    meaning: '加速，促使加快',
    meaningEn: 'begin to move more quickly or increase in rate or extent',
    trapNote: '双写 c 单写 l：ac-ce-le-rate，气候变化融冰讲座高频。',
    trapNoteEn: 'Double-c, single-l: a-c-c-e-l-e-r-a-t-e.',
  },
  {
    id: 'l179-120',
    band: '8.0+',
    section: 'Section 4',
    questionWord: 'hard to notice / minor',
    audioParaphrase: 'subtle',
    meaning: '微妙的，难以察觉的',
    meaningEn: 'so delicate or precise as to be difficult to analyze or describe',
    trapNote: '字母 b 不发音！发音 /ˈsʌt.əl/，听力盲听极易拼丢 b。',
    trapNoteEn: 'Silent "b" trap: s-u-b-t-l-e (/ˈsʌt.əl/).',
  },
];

export const SPEAKING_PROMPTS: SpeakingPrompt[] = [
  {
    id: 'sp-p1-1',
    part: 'P1',
    band: '5.5',
    topic: '家乡与居住环境',
    topicEn: 'Hometown',
    question: 'What do you like most about the neighborhood you currently live in?',
    band8Model:
      'What strikes me most is how walkable and leafy the neighborhood is. Everything from a fresh produce market to a tranquil riverside path is literally a five-minute stroll away, which makes unwinding after work effortless.',
    band8ModelZh:
      '最打动我的是社区非常适合步行且绿树成荫。从生鲜市场到安静的河畔步道全都只要步行五分钟，下班后放松变得格外轻松。',
    collocations: ['walkable and leafy', 'five-minute stroll away', 'unwind after work'],
  },
  {
    id: 'sp-p1-2',
    part: 'P1',
    band: '6.5',
    topic: '工作与学习节律',
    topicEn: 'Study & Focus',
    question: 'Do you prefer studying early in the morning or late at night?',
    band8Model:
      'I am definitely an early bird. My concentration peaks right after breakfast before the outside world gets hectic, so I try to knock out my heaviest reading tasks before noon.',
    band8ModelZh:
      '我绝对是个早起型的人。在外界开始喧嚣之前、刚吃完早饭时我的专注力达到巅峰，所以我尽量在中午前攻克最费脑的阅读任务。',
    collocations: ['early bird', 'concentration peaks', 'knock out heavy tasks'],
  },
  {
    id: 'sp-p1-3',
    part: 'P1',
    band: '6.5',
    topic: '数字工具与效率',
    topicEn: 'Apps & Tech',
    question: 'What kind of mobile tools help you manage your daily schedule?',
    band8Model:
      'I rely heavily on minimalist calendar and timer apps that combine focus blocks with gentle reminders. Rather than juggling five cluttered platforms, keeping everything in one streamlined workspace stops me from procrastinating.',
    band8ModelZh:
      '我非常依赖将专注时段和温和提醒结合在一起的极简日历和计时工具。把一切放在一个精简的工作区里，能防止我在五个杂乱平台间切换导致拖延。',
    collocations: ['rely heavily on', 'streamlined workspace', 'stop me from procrastinating'],
  },
  {
    id: 'sp-p1-4',
    part: 'P1',
    band: '5.5',
    topic: '天气与四季',
    topicEn: 'Weather & Seasons',
    question: 'Which season is your favorite where you live, and why?',
    band8Model:
      'Hands down autumn. After the stifling summer humidity finally lifts, crisp golden afternoons with a gentle breeze feel utterly refreshing and ideal for outdoor hikes.',
    band8ModelZh:
      '毫无疑问是秋天。闷热的夏季湿气终于消退后，微风拂面的爽朗金色午后让人神清气爽，最适合户外徒步。',
    collocations: ['hands down', 'stifling humidity', 'utterly refreshing'],
  },
  {
    id: 'sp-p1-5',
    part: 'P1',
    band: '7.0',
    topic: '阅读习惯',
    topicEn: 'Reading',
    question: 'Do you prefer reading paper books or e-books?',
    band8Model:
      'While e-readers are unbeatable for commuting since you can carry an entire library in your pocket, nothing quite beats the tactile pleasure of a paperback when I want to disconnect from screens before bed.',
    band8ModelZh:
      '虽然电子阅读器能把整个图书馆装进口袋、通勤时无可匹敌，但睡前想远离屏幕时，纸质书的翻阅触感依然无可替代。',
    collocations: ['unbeatable for', 'tactile pleasure', 'disconnect from screens'],
  },
  {
    id: 'sp-p2-1',
    part: 'P2',
    band: '6.5',
    topic: '一位擅长工作的人',
    topicEn: 'Skilled Person',
    question: 'Describe someone you know who is very good at what they do.',
    cueBullets: [
      'Who this person is and what field they work in',
      'How you came to know them',
      'What makes them stand out professionally',
      'And explain how they have influenced your own approach',
    ],
    band8Model:
      'I would like to talk about my former mentor, Dr. Lin, a seasoned structural engineer. What truly sets her apart is her calm precision under tight deadlines: instead of rushing into solutions, she breaks down complex blueprints step by step, leaving virtually zero room for error.',
    band8ModelZh:
      '我想介绍我的前导师林博士，她是一位经验丰富的结构工程师。她真正出众之处在于紧迫工期下的沉着精准：她不会急于下结论，而是把复杂图纸逐层拆解，几乎不留任何差错空间。',
    collocations: ['what truly sets her apart', 'under tight deadlines', 'zero room for error'],
  },
  {
    id: 'sp-p2-2',
    part: 'P2',
    band: '7.0',
    topic: '一门想学的新技能',
    topicEn: 'Skill to Learn',
    question: 'Describe a practical skill you would like to master in the near future.',
    cueBullets: [
      'What the skill is and why it interests you',
      'Where and how you plan to acquire it',
      'What difficulties you expect to face',
      'And explain how it would benefit your life or career',
    ],
    band8Model:
      'A practical skill high on my wishlist is data visualization—turning messy spreadsheets into clear interactive charts. While getting used to statistical libraries initially feels daunting, being able to tell compelling stories with numbers is indispensable in modern project management.',
    band8ModelZh:
      '我愿望清单上排名靠前的一项实用技能是数据可视化——把杂乱的表格变成清晰可交互的图表。虽然起初熟悉统计库会有些棘手，但用数据讲出有说服力的故事在现代项目管理中不可或缺。',
    collocations: ['high on my wishlist', 'initially feels daunting', 'tell compelling stories'],
  },
  {
    id: 'sp-p2-3',
    part: 'P2',
    band: '7.0',
    topic: '安静集中注意力的地方',
    topicEn: 'Quiet Place',
    question: 'Describe a quiet place you like to visit when you need to concentrate or relax.',
    cueBullets: [
      'Where this place is located',
      'What it looks and sounds like',
      'How often you go there',
      'And explain why you find it peaceful',
    ],
    band8Model:
      'My go-to sanctuary is the top-floor reading room of our municipal library. Floor-to-ceiling windows overlook an old botanical garden, bathing the oak desks in natural daylight. With zero street noise and the gentle rustle of turning pages, I can slip into deep focus effortlessly.',
    band8ModelZh:
      '我常去的静谧之地是市立图书馆顶层阅览室。落地窗俯瞰着一座老植物园，自然光照在橡木书桌上。没有街道噪音，只有轻轻的翻书声，我能毫不费力地进入深度专注状态。',
    collocations: ['my go-to sanctuary', 'floor-to-ceiling windows', 'slip into deep focus'],
  },
  {
    id: 'sp-p2-4',
    part: 'P2',
    band: '8.0+',
    topic: '改变习惯的决定',
    topicEn: 'Positive Change',
    question: 'Describe a routine change you made that significantly improved your health or focus.',
    cueBullets: [
      'What the old habit was',
      'Why you decided to change it',
      'How you stuck to the new routine',
      'And explain the long-term results you noticed',
    ],
    band8Model:
      'About a year ago, I cut out mindless scrolling during breakfast and replaced it with a 20-minute brisk walk outdoors. At first it took genuine willpower, yet within three weeks my morning grogginess vanished and my productivity for the rest of the day surged noticeably.',
    band8ModelZh:
      '大约一年前，我戒掉了吃早饭时无意识刷手机的习惯，改为户外快走20分钟。起初确实需要毅力坚持，但不到三周，我早晨的昏沉感就消失了，全天工作效率明显跃升。',
    collocations: ['mindless scrolling', 'genuine willpower', 'surged noticeably'],
  },
  {
    id: 'sp-p2-5',
    part: 'P2',
    band: '6.5',
    topic: '难忘的公共交通出行',
    topicEn: 'Memorable Journey',
    question: 'Describe a memorable journey you took using public transportation.',
    cueBullets: [
      'Where you traveled from and to',
      'Who accompanied you',
      'What happened along the route',
      'And explain why this trip stood out',
    ],
    band8Model:
      'The most unforgettable ride I ever had was taking a scenic coastal train across steep cliffs at sunrise. Watching fishing harbors slowly wake up through the panoramic carriage window gave me a vivid sense of how well-planned public rail connects remote communities.',
    band8ModelZh:
      '我最难忘的一次出行是在日出时分搭乘沿海景观列车穿过陡峭崖壁。透过全景车窗看着渔港渐渐苏醒，让我真切感受到规划得当的公共交通如何把偏远社区连接起来。',
    collocations: ['scenic coastal route', 'panoramic carriage window', 'well-planned infrastructure'],
  },
  {
    id: 'sp-p3-1',
    part: 'P3',
    band: '7.0',
    topic: '传统技艺 vs 现代自动化',
    topicEn: 'Tradition vs Automation',
    question: 'Why do some traditional crafts struggle to survive in modern economies?',
    band8Model:
      'Fundamentally, it comes down to cost efficiency and changing consumer priorities. Mass-produced goods can be turned out at a fraction of the price, whereas artisanal crafts demand years of apprenticeship—meaning younger generations are often reluctant to enter a trade with uncertain financial returns.',
    band8ModelZh:
      '归根结底在于成本效益和消费偏好的转变。批量生产的商品只需零头价格，而手工技艺需要多年学徒期——这使得年轻一代往往不愿投身收入不确定的传统行当。',
    collocations: ['comes down to', 'at a fraction of the price', 'uncertain financial returns'],
  },
  {
    id: 'sp-p3-2',
    part: 'P3',
    band: '8.0+',
    topic: '公共投资与文化保护',
    topicEn: 'Public Funding',
    question: 'Should governments subsidize museums and public libraries even when digital content is free?',
    band8Model:
      'Unquestionably yes. Beyond merely housing collections, public cultural venues serve as egalitarian third spaces where citizens across income brackets can gather, debate, and learn without commercial pressure—something profit-driven digital algorithms rarely replicate.',
    band8ModelZh:
      '毫无疑问应该。除了存放馆藏之外，公共文化场所还充当着平等的“第三空间”，让不同收入阶层的市民能够在没有商业压力的环境下聚会、思辨和学习——这是盈利驱动的数字算法难以复制的价值。',
    collocations: ['unquestionably yes', 'egalitarian third spaces', 'across income brackets'],
  },
  {
    id: 'sp-p3-3',
    part: 'P3',
    band: '7.0',
    topic: '城市扩张与交通规划',
    topicEn: 'Urban Mobility',
    question: 'Are congestion charges fairer than simply building wider roads?',
    band8Model:
      'In the long haul, pricing road use is far more effective because widening highways simply induces additional car demand—a paradox urban planners call induced traffic. Reinvesting congestion revenue into frequent metro lines yields a much more equitable outcome.',
    band8ModelZh:
      '从长远来看，道路拥堵收费要有效得多，因为拓宽公路只会诱发更多驾车需求——规划师称之为“诱增交通悖论”。将拥堵费收入再投资于高频地铁线路，才能带来更公平的结果。',
    collocations: ['in the long haul', 'induced traffic', 'equitable outcome'],
  },
  {
    id: 'sp-p3-4',
    part: 'P3',
    band: '8.0+',
    topic: '远程办公与工作边界',
    topicEn: 'Remote Work',
    question: 'How has hybrid working reshaped the boundary between work and personal life?',
    band8Model:
      'It is very much a double-edged sword. On one hand, eliminating long commutes frees up precious family hours; on the other hand, constant digital availability blurs psychological boundaries, making employees feel subtly pressured to answer emails well after hours.',
    band8ModelZh:
      '这在很大程度上是一把双刃剑。一方面，省去漫长通勤腾出了宝贵的家庭时间；另一方面，全天候数字在线模糊了心理边界，让员工隐约觉得下班后也必须回复邮件。',
    collocations: ['double-edged sword', 'eliminating long commutes', 'blurs psychological boundaries'],
  },
  {
    id: 'sp-p3-5',
    part: 'P3',
    band: '8.0+',
    topic: '终身学习与职业转型',
    topicEn: 'Lifelong Learning',
    question: 'Should employers or individuals bear primary responsibility for continuous reskilling?',
    band8Model:
      'It ought to be a shared compact rather than an either-or burden. Companies reap direct productivity gains when staff adopt emerging tools, so funding structured training makes commercial sense, yet workers themselves must remain proactive about staying adaptable.',
    band8ModelZh:
      '这应当是一项共同契约，而非非此即彼的负担。员工掌握新兴工具时企业直接收获生产力红利，因此资助系统培训在商业上完全合算；但劳动者自身也必须主动保持适应力。',
    collocations: ['shared compact', 'rather than an either-or burden', 'reap productivity gains'],
  },
  {
    id: 'sp-p1-101',
    part: 'P1',
    band: '6.5',
    topic: '数字工具与日常效率',
    topicEn: 'Digital Productivity',
    question: 'Do you prefer planning your day on paper or using a mobile calendar?',
    band8Model:
      'I lean heavily toward a digital calendar nowadays because color-coded time blocks sync effortlessly across my devices, though I still jot down rough brainstorming sketches in a pocket notebook.',
    band8ModelZh:
      '我现在明显倾向于使用电子日历，因为按颜色区分的时间块可以在设备间无缝同步，不过我仍会随身带小本子记录零散的灵感草图。',
    collocations: ['lean heavily toward', 'sync effortlessly', 'jot down rough sketches'],
  },
  {
    id: 'sp-p2-101',
    part: 'P2',
    band: '7.0',
    topic: '城市里的安静绿地',
    topicEn: 'Quiet Urban Park',
    question: 'Describe a quiet public park or green space in your city that you enjoy visiting.',
    cueBullets: [
      'Where this green space is located',
      'What trees, water features, or paths it has',
      'What people usually do when visiting there',
      'And explain why this place helps you unwind',
    ],
    band8Model:
      'Whenever city noise gets overwhelming, I head to a botanical riverside trail about twenty minutes from downtown. Lined with weeping willows and timber boardwalks, it shields joggers from street traffic. Watching cyclists glide past at dusk instantly slows down my racing thoughts and restores my focus for the week ahead.',
    band8ModelZh:
      '每当城市喧嚣令人透不过气时，我就会去离市中心约二十分钟的滨河植物步道。两岸垂柳与木栈道隔绝了车流噪音，黄昏看骑行者掠过总能瞬间安抚焦虑思绪，为新一周恢复专注力。',
    collocations: ['gets overwhelming', 'shields joggers from', 'restores my focus'],
  },
  {
    id: 'sp-p2-102',
    part: 'P2',
    band: '8.0+',
    topic: '一次解决棘手问题的经历',
    topicEn: 'Solving a Practical Problem',
    question: 'Describe a time when you used creativity or patience to solve an unexpected problem.',
    cueBullets: [
      'When and where the problem happened',
      'Why it was tricky to fix',
      'How you approached the solution step by step',
      'And explain how you felt afterward',
    ],
    band8Model:
      'Last autumn our community reading club lost access to its usual café venue two days before a guest talk. Rather than canceling, I coordinated with a neighborhood courtyard bookstore to set up folding chairs under string lights and streamed an audio backup for overflow guests. Pulling it off under pressure taught me to stay resourceful rather than panic.',
    band8ModelZh:
      '去年秋天，我们社区读书会在嘉宾分享前两天突然失去了原定咖啡馆场地。我没有选择取消活动，而是紧急协调附近四合院书店在灯串下摆起折叠椅，并为溢出的听众同步了音频转播。在重压下化解危机让我学会了沉着应变。',
    collocations: ['lost access to', 'pulling it off under pressure', 'stay resourceful'],
  },
  {
    id: 'sp-p3-101',
    part: 'P3',
    band: '7.0',
    topic: '传统手工艺与现代保护',
    topicEn: 'Craft Heritage',
    question: 'Why do many traditional handmade crafts struggle to survive in modern cities?',
    band8Model:
      'The core bottleneck is pure economics: mastering intricate handcraft takes years of apprenticeship, whereas mass-produced goods sell for a fraction of the price. Unless artisans pair heritage techniques with contemporary design and storytelling, younger consumers rarely justify the premium.',
    band8ModelZh:
      '核心瓶颈在于纯粹的经济规律：掌握精密手工艺需要多年学徒积累，而工业量产商品价格低得多。除非手艺人将传统技艺与现代审美设计和品牌故事结合，否则年轻消费者很难为溢价买单。',
    collocations: ['core bottleneck', 'a fraction of the price', 'justify the premium'],
  },
  {
    id: 'sp-p3-102',
    part: 'P3',
    band: '8.0+',
    topic: '跨代际沟通与工作观',
    topicEn: 'Generational Work Values',
    question: 'Do younger workers hold fundamentally different expectations about careers than their parents did?',
    band8Model:
      'Undoubtedly, yes. Earlier generations often prized lifelong job security above almost everything else, having witnessed scarcer economic safety nets. Younger cohorts, by contrast, prioritize autonomy, mental wellbeing, and continuous skill growth, willingly switching employers when a role stagnates.',
    band8ModelZh:
      '毫无疑问是的。老一辈往往因经历过保障相对匮乏的年代而把终身岗位稳定性置于首位；相比之下，年轻群体更看重自主权、心理健康与持续技能成长，当岗位陷入停滞时会果断跳槽。',
    collocations: ['prized lifelong security', 'economic safety nets', 'when a role stagnates'],
  },
];

export const SYNONYM_538_PAIRS: Synonym538Pair[] = [
  {
    id: 'r538-1',
    band: '5.5',
    passageTerm: 'resemble / look similar to',
    questionParaphrase: 'bear a striking similarity to',
    meaning: '与……高度相似',
    meaningEn: 'strongly look or function alike',
    note: '雅思阅读填空/判断经典高频动宾替换。',
    noteEn: 'Classic IELTS TFNG paraphrase for resemble.',
  },
  {
    id: 'r538-2',
    band: '6.5',
    passageTerm: 'trigger / give rise to',
    questionParaphrase: 'account for / bring about',
    meaning: '引发，是……的原因',
    meaningEn: 'cause or explain why something occurs',
    note: '因果逻辑定位关键信号词，常对应题干中的 why / cause。',
    noteEn: 'Causal locator replacing cause or result in.',
  },
  {
    id: 'r538-3',
    band: '6.5',
    passageTerm: 'cut down / curb',
    questionParaphrase: 'scale back / slash',
    meaning: '大幅削减，缩减',
    meaningEn: 'substantially lower in size or frequency',
    note: '环保或经济篇极高频：reduce = curb = slash = scale back。',
    noteEn: 'Very frequent in environment & budget passages.',
  },
  {
    id: 'r538-4',
    band: '7.0',
    passageTerm: 'neglect / turn a blind eye to',
    questionParaphrase: 'overlook / disregard',
    meaning: '忽视，低估，未予理会',
    meaningEn: 'fail to notice or intentionally ignore',
    note: '作者态度或局限性段落（limitation）常用替换。',
    noteEn: 'Signals author criticism or ignored variables.',
  },
  {
    id: 'r538-5',
    band: '8.0+',
    passageTerm: 'unprecedented / never seen before',
    questionParaphrase: 'unrivalled / without historical parallel',
    meaning: '史无前例的，无与伦比的',
    meaningEn: 'greater or newer than anything recorded earlier',
    note: '注意审题限定词边界，防止把“史无前例”误判为“唯一”。',
    noteEn: 'Watch absolute modifier boundaries in T/F/NG.',
  },
  {
    id: 'r538-6',
    band: '5.5',
    passageTerm: 'important / vital',
    questionParaphrase: 'pivotal / indispensable',
    meaning: '至关重要的，不可或缺的',
    meaningEn: 'essential and central to success',
    note: 'Passage C9-C19 出现率极高的程度替换词。',
    noteEn: 'Core importance paraphrase across Academic passages.',
  },
  {
    id: 'r538-7',
    band: '6.5',
    passageTerm: 'grow rapidly / soar',
    questionParaphrase: 'surge / mushroom',
    meaning: '激增，迅速蔓延增长',
    meaningEn: 'increase very quickly in number or scale',
    note: 'mushroom 作动词表示“如雨后春笋般涌现”，阅读高频考点。',
    noteEn: 'Verb mushroom means multiply rapidly.',
  },
  {
    id: 'r538-8',
    band: '6.5',
    passageTerm: 'agree with / endorse',
    questionParaphrase: 'subscribe to / echo the view',
    meaning: '赞同（观点），支持（理论）',
    meaningEn: 'accept or support an opinion',
    note: '人名观点配对题（Matching Features）核心态度词！',
    noteEn: 'Crucial for Researcher Opinion Matching tasks.',
  },
  {
    id: 'r538-9',
    band: '7.0',
    passageTerm: 'question / be skeptical of',
    questionParaphrase: 'cast doubt on / challenge',
    meaning: '质疑，怀疑……的可靠性',
    meaningEn: 'express uncertainty or critique toward a claim',
    note: '人名观点配对题否定/质疑态度识别，与 endorse 形成对照。',
    noteEn: 'Denotes researcher skepticism or counter-argument.',
  },
  {
    id: 'r538-10',
    band: '7.0',
    passageTerm: 'stop / prevent from happening',
    questionParaphrase: 'deter / preclude / avert',
    meaning: '威慑阻止，排除，避免',
    meaningEn: 'discourage or make impossible beforehand',
    note: 'policy/crime 话题极高频，注意 deter A from B 句型。',
    noteEn: 'Frequent in policy, law & ecology texts.',
  },
  {
    id: 'r538-11',
    band: '5.5',
    passageTerm: 'predict / forecast',
    questionParaphrase: 'anticipate / project',
    meaning: '预测，预计，预期',
    meaningEn: 'estimate future trends or outcomes',
    note: 'project 作动词读 /prəˈdʒekt/，在调查数据段落替 predict。',
    noteEn: 'Used interchangeably with expect/estimate.',
  },
  {
    id: 'r538-12',
    band: '6.5',
    passageTerm: 'match / fit together',
    questionParaphrase: 'coincide with / align with',
    meaning: '与……同时发生/相吻合',
    meaningEn: 'occur at the same time or match closely',
    note: '时间轴或原因匹配题提示：coincide with ≠ 因果关系。',
    noteEn: 'Note: coinciding in time does not prove causation!',
  },
  {
    id: 'r538-13',
    band: '7.0',
    passageTerm: 'depend on / need',
    questionParaphrase: 'hinge on / be contingent upon',
    meaning: '取决于，视……而定',
    meaningEn: 'rely completely on a specific condition',
    note: 'Conditional 题干常考，决定因素常跟在 hinge on 后面。',
    noteEn: 'Signals a decisive condition in passages.',
  },
  {
    id: 'r538-14',
    band: '8.0+',
    passageTerm: 'short-lived / temporary',
    questionParaphrase: 'ephemeral / transient',
    meaning: '短暂的，转瞬即逝的',
    meaningEn: 'lasting for only a brief time',
    note: '与 permanent / enduring 构成 T/F/NG 经典反义陷阱。',
    noteEn: 'Classic FALSE antonym trap opposite permanent.',
  },
  {
    id: 'r538-15',
    band: '6.5',
    passageTerm: 'complex / complicated',
    questionParaphrase: 'intricate / multifaceted',
    meaning: '错综复杂的，多维度的',
    meaningEn: 'having many interconnected parts or aspects',
    note: '生物构造、社会系统、古代工程阅读必见同义替换。',
    noteEn: 'Appears in biology, architecture, and sociology articles.',
  },
  {
    id: 'r538-16',
    band: '7.0',
    passageTerm: 'replace / take the place of',
    questionParaphrase: 'supersede / supplant',
    meaning: '取代，替代旧事物',
    meaningEn: 'take the place of something older or less effective',
    note: '技术更迭史阅读（印刷术/能源/通讯）必考动词替换。',
    noteEn: 'Key verb in technology history passages.',
  },
  {
    id: 'r538-17',
    band: '8.0+',
    passageTerm: 'unbiased / fair',
    questionParaphrase: 'impartial / objective',
    meaning: '公正的，不偏不倚的，客观的',
    meaningEn: 'treating all sides equally without prejudice',
    note: '研究方法论严谨性考察段落的高频同义词。',
    noteEn: 'Used for scientific methodology & peer review.',
  },
  {
    id: 'r538-18',
    band: '8.0+',
    passageTerm: 'reveal / uncover',
    questionParaphrase: 'shed light on / unearth',
    meaning: '揭示，阐明，发掘出',
    meaningEn: 'make previously unknown facts clear',
    note: '考古及科研突破类文章末段总结常用短语 shed light on。',
    noteEn: 'Frequent in archaeology & research conclusions.',
  },
  {
    id: 'r538-101',
    band: '5.5',
    passageTerm: 'yearly / once a year',
    questionParaphrase: 'annually / on an annual basis',
    meaning: '每年一次，年度地',
    meaningEn: 'occurring once every year',
    note: '时间频率替换基础高频：yearly ↔ annually。',
    noteEn: 'Core frequency paraphrase.',
  },
  {
    id: 'r538-102',
    band: '6.5',
    passageTerm: 'vulnerable to / at risk of',
    questionParaphrase: 'susceptible to / prone to',
    meaning: '易受……影响的，脆弱的',
    meaningEn: 'likely to be harmed or affected by something',
    note: '生态保护与医学文章必考搭配 susceptible to。',
    noteEn: 'Common in ecology & medical reading passages.',
  },
  {
    id: 'r538-103',
    band: '7.0',
    passageTerm: 'eliminate / wipe out completely',
    questionParaphrase: 'eradicate / phase out',
    meaning: '根除，逐步淘汰',
    meaningEn: 'destroy completely or withdraw gradually',
    note: 'T/F/NG 常考范围陷阱：phase out（逐步淘汰）≠ instant ban（立刻禁止）。',
    noteEn: 'Distinguish gradual phase-out from immediate eradication.',
  },
  {
    id: 'r538-104',
    band: '7.0',
    passageTerm: 'plausible explanation',
    questionParaphrase: 'credible hypothesis',
    meaning: '合理解释 / 可信假说',
    meaningEn: 'seemingly reasonable or believable theory',
    note: '科普论证段落区分事实 (fact) 与推论 (hypothesis) 的关键线索。',
    noteEn: 'Signals theory rather than proven fact.',
  },
  {
    id: 'r538-105',
    band: '8.0+',
    passageTerm: 'prevailing view / mainstream consensus',
    questionParaphrase: 'conventional wisdom',
    meaning: '主流观点，传统认知',
    meaningEn: 'the generally accepted belief among experts or the public',
    note: '出现 conventional wisdom 后往往紧跟转折词 challenge / overturn！',
    noteEn: 'Often precedes a paradigm shift or refutation.',
  },
  {
    id: 'r538-106',
    band: '8.0+',
    passageTerm: 'hinder / slow down progress',
    questionParaphrase: 'impede / hamper / stifle',
    meaning: '阻碍，抑制（发展/创新）',
    meaningEn: 'delay or obstruct progress or creativity',
    note: '因果与阻碍类配对题常见负面动词群。',
    noteEn: 'High-value negative-impact verbs.',
  },
];

export const TFNG_DRILLS: TfngDrill[] = [
  {
    id: 'tfng-1',
    band: '6.5',
    passage:
      'In the early 1990s, marine biologists noticed that kelp forests along the northern coast recovered rapidly once sea otter populations began rebounding.',
    statement:
      'Sea otters were the only factor responsible for the recovery of kelp forests.',
    answer: 'FALSE',
    reason:
      'FALSE：原文只提及“一旦海獭恢复，海藻林随之恢复”，题干出现绝对限定词 “only factor” 与原文科学表述冲突（并非唯一因素），未加证实即绝对化在雅思判断中属直接矛盾 FALSE。',
    reasonEn:
      'FALSE: Absolute qualifier "only factor" contradicts the passage, which notes correlation without claiming exclusivity.',
  },
  {
    id: 'tfng-2',
    band: '7.0',
    passage:
      'Dr. Patel’s team tested the ceramic filtration membrane across 14 villages in Gujarat, noting a marked reduction in waterborne illness.',
    statement:
      'Dr. Patel’s ceramic membrane was cheaper to manufacture than competing sand filters.',
    answer: 'NOT GIVEN',
    reason:
      'NOT GIVEN：原文谈及在14个村庄测试了陶瓷过滤膜并减少水传疾病，但通篇未提及任何制造成本（cheaper）及与“沙滤器（sand filters）”的比较信息。',
    reasonEn:
      'NOT GIVEN: The passage makes no comparison regarding manufacturing cost against sand filters.',
  },
  {
    id: 'tfng-3',
    band: '6.5',
    passage:
      'To preserve fragile frescoes, visitors are permitted inside the subterranean chambers for a maximum of 20 minutes per tour group.',
    statement:
      'There is a strict time restriction on how long tourists may stay in the underground rooms.',
    answer: 'TRUE',
    reason:
      'TRUE：subterranean chambers = underground rooms；a maximum of 20 minutes = strict time restriction，完整同义替换，语义完全一致。',
    reasonEn:
      'TRUE: "subterranean chambers" maps to "underground rooms" and "maximum of 20 minutes" matches "strict time restriction".',
  },
  {
    id: 'tfng-4',
    band: '5.5',
    passage:
      'During the Bronze Age, merchants transported tin ingots along river routes stretching over 400 kilometers.',
    statement:
      'Merchants carried tin using river routes in the Bronze Age.',
    answer: 'TRUE',
    reason:
      'TRUE：transported = carried，直接定位同义替换，主谓宾与时间状语完全吻合。',
    reasonEn:
      'TRUE: Direct paraphrase ("transported" -> "carried") with matching timeframe and method.',
  },
  {
    id: 'tfng-5',
    band: '6.5',
    passage:
      'While early solar panels achieved roughly 6% efficiency in 1954, commercial silicon cells today routinely convert over 22% of sunlight into electricity.',
    statement:
      'Solar panel efficiency in 1954 was higher than that of modern silicon cells.',
    answer: 'FALSE',
    reason:
      'FALSE：原文数据为 1954 年约 6%，现代超过 22%，题干将比较方向完全颠倒（higher than），属于数字对比反向矛盾 FALSE。',
    reasonEn:
      'FALSE: Reverses the numeric comparison (6% in 1954 vs >22% today).',
  },
  {
    id: 'tfng-6',
    band: '7.0',
    passage:
      'Several municipal museums in Vienna suspended entry fees on the first Sunday of each month, attracting record numbers of local families.',
    statement:
      'Every museum in Vienna abolished admission fees permanently.',
    answer: 'FALSE',
    reason:
      'FALSE：双处矛盾！原文是 “Several municipal museums”（部分市立博物馆）和 “on the first Sunday”（每月第一个周日），题干篡改为 “Every”（全部）与 “permanently”（永久）。',
    reasonEn:
      'FALSE: Contradicts both scope ("Several" vs "Every") and duration ("first Sunday" vs "permanently").',
  },
  {
    id: 'tfng-7',
    band: '7.0',
    passage:
      'Excavators unearthed more than 200 clay tablets written in a previously undeciphered script, most of which appear to record grain distributions.',
    statement:
      'Linguists have recently finished translating every word on the clay tablets.',
    answer: 'FALSE',
    reason:
      'FALSE：原文明确指出使用“previously undeciphered script”，且“appear to record”（推测记录谷物分配），并未完成全部逐字破译，与 “finished translating every word” 相悖。',
    reasonEn:
      'FALSE: An undeciphered script where scholars only infer grain records cannot have every word translated.',
  },
  {
    id: 'tfng-8',
    band: '8.0+',
    passage:
      'Professor Vance argues that bilingual children tend to outperform monolinguals on tasks requiring rapid attention switching.',
    statement:
      'Professor Vance believes bilingualism also prevents age-related memory decline in older adults.',
    answer: 'NOT GIVEN',
    reason:
      'NOT GIVEN：原文仅论证了双语“儿童（children）”在“注意力切换（attention switching）”上的表现，未提及“老年人（older adults）”或“预防记忆衰退”。切忌脑补延伸！',
    reasonEn:
      'NOT GIVEN: The study covers children’s attention switching; elderly memory decline is never mentioned.',
  },
  {
    id: 'tfng-9',
    band: '8.0+',
    passage:
      'Although sleep trackers accurately log total rest duration, independent sleep-lab trials show they frequently misclassify light sleep as deep sleep.',
    statement:
      'Consumer sleep trackers do not always correctly identify specific sleep stages.',
    answer: 'TRUE',
    reason:
      'TRUE：原文说“frequently misclassify light sleep as deep sleep”（经常把浅睡误判为深睡），题干用谨慎否定 “do not always correctly identify”（并非总能准确识别各睡眠阶段）精准呼应。',
    reasonEn:
      'TRUE: "frequently misclassify light sleep as deep sleep" directly supports "do not always correctly identify specific sleep stages".',
  },
  {
    id: 'tfng-10',
    band: '8.0+',
    passage:
      'The port’s granite lighthouse was rebuilt twice in the nineteenth century after severe winter gales damaged its upper lantern room.',
    statement:
      'The lighthouse was originally constructed out of wood before granite was used.',
    answer: 'NOT GIVEN',
    reason:
      'NOT GIVEN：原文只提到十九世纪两度因冬季风暴重修花岗岩灯塔，未说明此前最初是否用木头（wood）建造，无中生有选 NOT GIVEN。',
    reasonEn:
      'NOT GIVEN: No information is provided about whether an earlier wooden structure ever existed.',
  },
  {
    id: 'tfng-11',
    band: '6.5',
    passage:
      'Urban bats hunted up to 40% more insects near warm-toned LED streetlights than along unlit canal banks.',
    statement:
      'Urban bats caught a greater quantity of insects near warm-toned LED lamps than beside dark canals.',
    answer: 'TRUE',
    reason:
      'TRUE：caught a greater quantity = hunted up to 40% more；dark canals = unlit canal banks，比较对象与方向完全一致。',
    reasonEn:
      'TRUE: Quantified higher hunting yield near warm LEDs vs unlit canals matches the statement.',
  },
  {
    id: 'tfng-12',
    band: '7.0',
    passage:
      'Although the new rail link shortened commuter journeys by half an hour, ticket revenues covered only 62% of annual operating expenses.',
    statement:
      'The new rail line generated enough ticket sales to fund its yearly running costs completely.',
    answer: 'FALSE',
    reason:
      'FALSE：原文明确指出票务收入仅覆盖了年度运营费用的 62%（covered only 62%），与题干“完全覆盖运营成本（completely）”直接矛盾。',
    reasonEn:
      'FALSE: Covering 62% of operating expenses contradicts funding them completely.',
  },
  {
    id: 'tfng-13',
    band: '8.0+',
    passage:
      'Chemists in Delft extracted cellulose fibers from discarded beer barley to weave biodegradable food trays.',
    statement:
      'Supermarket chains in Delft have already replaced all plastic trays with the barley-based alternative.',
    answer: 'NOT GIVEN',
    reason:
      'NOT GIVEN：原文仅介绍代尔夫特化学家利用废大麦提取纤维织出可降解餐盘，完全未提及超市是否已大规模采购或全面替代塑料餐盘。',
    reasonEn:
      'NOT GIVEN: Lab/material development is described, with no mention of supermarket adoption.',
  },
];

export const ABC_CHAIN_TOPICS: AbcChainTopic[] = [
  {
    id: 'abc-tech',
    band: '7.0',
    topic: 'AI 自动化与就业',
    topicEn: 'AI & Employment',
    prompt: 'Automation and AI are replacing many routine jobs. Is this a positive or negative development?',
    chainA: 'A: Companies deploy generative AI to automate repetitive data processing',
    chainB: 'B: Firms cut operational overhead while freeing staff for creative decision-making',
    chainC: 'C: Productivity surges, though displaced clerical workers need timely government reskilling',
    band8ConnectorSample:
      'By deploying AI to handle repetitive administrative tasks (A), enterprises can substantially trim operational overhead and reallocate human talent toward strategic problem-solving (B). Consequently, overall productivity rises, provided governments invest in timely reskilling programs for displaced workers (C).',
  },
  {
    id: 'abc-edu',
    band: '6.5',
    topic: '大学教育免费化',
    topicEn: 'Free Higher Education',
    prompt: 'Should university education be funded entirely by taxpayers rather than tuition fees?',
    chainA: 'A: Abolishing tuition removes upfront financial barriers for low-income youths',
    chainB: 'B: Talented students enter STEM and medical degrees regardless of family wealth',
    chainC: 'C: Social mobility strengthens, though heavy subsidies risk straining state budgets',
    band8ConnectorSample:
      'Eliminating upfront tuition fees removes a formidable financial barrier for underprivileged youths (A), enabling gifted learners to pursue demanding degrees regardless of household income (B). As a result, upward social mobility broadens, albeit at the risk of placing sustained pressure on public budgets (C).',
  },
  {
    id: 'abc-env',
    band: '8.0+',
    topic: '城市限车与公交优先',
    topicEn: 'Car Restrictions & Transit',
    prompt: 'Banning private cars in city centers is the best way to curb urban emissions. To what extent do you agree?',
    chainA: 'A: Restricting private vehicles cuts tailpipe exhaust and frees up road surface',
    chainB: 'B: Municipal planners convert lanes into protected cycling tracks and express bus corridors',
    chainC: 'C: Air quality improves rapidly, provided reliable suburban metro links exist beforehand',
    band8ConnectorSample:
      'Curbing private vehicle access in urban cores slashes exhaust emissions and reclaims scarce street space (A), allowing planners to install dedicated bus corridors and safe bike lanes (B). Ultimately, both air quality and commuter punctuality rebound, contingent upon dependable suburban rail alternatives (C).',
  },
  {
    id: 'abc-health',
    band: '7.0',
    topic: '含糖食品征税 vs 体育教育',
    topicEn: 'Public Health & Sugar Tax',
    prompt: 'Some argue taxing sugary drinks is the best way to combat obesity, while others favor health education.',
    chainA: 'A: Levying an excise tax raises the retail price of high-sugar beverages',
    chainB: 'B: Price-sensitive youth switch toward water, prompting brands to reformulate recipes',
    chainC: 'C: Caloric intake drops, though pairing taxation with nutrition literacy yields lasting habits',
    band8ConnectorSample:
      'Imposing a targeted tax drives up the shelf price of sugary beverages (A), nudging price-conscious consumers toward healthier alternatives and pushing manufacturers to slash sugar content (B). Over time, obesity-linked healthcare costs decline, especially when reinforced by school nutrition education (C).',
  },
  {
    id: 'abc-remote',
    band: '7.0',
    topic: '远程办公与城市活力',
    topicEn: 'Remote Work & Cities',
    prompt: 'More employees now work remotely rather than in central offices. Do the advantages outweigh the disadvantages?',
    chainA: 'A: Working from home spares professionals up to two hours of daily commuting',
    chainB: 'B: Staff redirect saved hours into rest, exercise, and childcare with less burnout',
    chainC: 'C: Job satisfaction rises, yet downtown retail districts and mentoring ties may suffer',
    band8ConnectorSample:
      'Telecommuting spares employees exhausting daily travel (A), freeing up precious hours for family care and restorative rest (B). This flexibility elevates job retention, although prolonged isolation can weaken spontaneous mentorship and dampen inner-city foot traffic (C).',
  },
  {
    id: 'abc-aging',
    band: '8.0+',
    topic: '老龄化社会应对',
    topicEn: 'Aging Population',
    prompt: 'In many countries, life expectancy is rising while birth rates fall. How can societies address this demographic shift?',
    chainA: 'A: A shrinking working-age cohort places heavier pension burdens on younger taxpayers',
    chainB: 'B: Introducing phased retirement and lifelong retraining keeps healthy seniors productive',
    chainC: 'C: Fiscal strain eases while invaluable institutional expertise remains in circulation',
    band8ConnectorSample:
      'As a shrinking workforce struggles to sustain escalating pension commitments (A), flexible phased retirement coupled with digital upskilling enables willing seniors to stay engaged part-time (B). Thus, public finances stabilize while seasoned expertise continues enriching younger teams (C).',
  },
  {
    id: 'abc-tourism',
    band: '6.5',
    topic: '国际旅游利弊',
    topicEn: 'International Tourism',
    prompt: 'International tourism brings huge economic revenue, yet harms local environments. Discuss both views.',
    chainA: 'A: Visitor spending sustains hospitality jobs and funds heritage restoration',
    chainB: 'B: Unchecked tourist surges drive up housing rents and overload local water supplies',
    chainC: 'C: Setting daily visitor caps balances vital revenue against ecological preservation',
    band8ConnectorSample:
      'While overseas visitor spending generates vital jobs and finances monument upkeep (A), unchecked overtourism inflates local housing rents and strains fragile ecosystems (B). Consequently, enforcing seasonal visitor quotas strikes a pragmatic balance between prosperity and conservation (C).',
  },
  {
    id: 'abc-news',
    band: '7.0',
    topic: '社交媒体与新闻真实性',
    topicEn: 'Social Media & News',
    prompt: 'Online platforms have replaced traditional newspapers as people’s primary news source. Is this beneficial?',
    chainA: 'A: Digital feeds deliver breaking reports instantaneously at near-zero cost',
    chainB: 'B: Engagement algorithms amplify outrage and unverified rumors over careful fact-checking',
    chainC: 'C: Information becomes democratic, yet media literacy education becomes indispensable',
    band8ConnectorSample:
      'Online feeds democratize breaking news at near-zero cost (A), yet engagement-driven algorithms frequently reward sensational claims over rigorous verification (B). Therefore, teaching citizens critical fact-checking skills is vital to reap speed without sacrificing truth (C).',
  },
  {
    id: 'abc-health',
    band: '7.0',
    topic: '公共健康与糖税政策',
    topicEn: 'Public Health & Sugar Tax',
    prompt: 'Should governments tax sugary drinks heavily to combat lifestyle-related illnesses?',
    chainA: 'A: Levying excise taxes raises retail prices on high-sugar beverages',
    chainB: 'B: Price-sensitive shoppers switch to water while manufacturers reformulate recipes',
    chainC: 'C: Chronic obesity burdens decline, provided tax revenue subsidizes affordable fresh produce',
    band8ConnectorSample:
      'Imposing targeted levies on sugary drinks nudges consumers toward healthier hydration and incentivizes beverage makers to slash sugar content (A→B). Ultimately, pairing excise taxes with subsidies for fresh produce curbs preventable healthcare costs (C).',
  },
  {
    id: 'abc-housing',
    band: '8.0+',
    topic: '大城市保障性住房与通勤',
    topicEn: 'Affordable Housing',
    prompt: 'Should municipalities prioritize affordable apartments inside city centers or build satellite towns?',
    chainA: 'A: Concentrating affordable housing near central job hubs preserves shorter commutes',
    chainB: 'B: Lower-income workers save hours daily and retain access to schools and clinics',
    chainC: 'C: Mixed-income neighborhoods sustain civic vitality, whereas distant enclaves entrench inequality',
    band8ConnectorSample:
      'Integrating affordable apartments within central districts protects essential workers from exhausting two-hour commutes (A→B). Consequently, mixed-income zoning prevents spatial segregation and keeps urban services resilient (C).',
  },
];

export const TASK1_DATA_PATTERNS: Task1Pattern[] = [
  {
    id: 't1-trend-up',
    type: 'trend',
    band: '6.5',
    title: '小作文 · 上升/激增与达峰句式',
    titleEn: 'Task 1 · Upward & Peak Trends',
    verbs: ['surge dramatically', 'climb steadily', 'peak at', 'reach a plateau of'],
    sampleEn:
      'Solar generation climbed steadily from 12% in 2010 before surging dramatically to a peak of 44% by 2022.',
    sampleZh:
      '太阳能发电占比自2010年的12%稳步攀升，随后大幅激增并于2022年达到44%的峰值。',
  },
  {
    id: 't1-trend-down',
    type: 'trend',
    band: '7.0',
    title: '小作文 · 下降/触底与先降后稳',
    titleEn: 'Task 1 · Decline & Stabilization',
    verbs: ['plummet sharply', 'taper off', 'bottom out at', 'halve over the period'],
    sampleEn:
      'Coal consumption halved over the decade, bottoming out at just 9% before tapering off for the remainder of the period.',
    sampleZh:
      '煤炭消费量在十年间减半，触底至仅9%，随后在剩余统计期内趋于平缓。',
  },
  {
    id: 't1-compare',
    type: 'comparison',
    band: '7.0',
    title: '小作文 · 柱图/饼图倍数与超越对比',
    titleEn: 'Task 1 · Ratio & Overtaking Comparisons',
    verbs: ['outstrip', 'account for roughly', 'double that of', 'by contrast'],
    sampleEn:
      'Healthcare expenditure in Region A accounted for 38% of the budget, nearly double that of Region B (20%), whereas transport trailed at 11%.',
    sampleZh:
      'A地区医疗支出占预算的38%，几乎是B地区（20%）的两倍，而交通支出仅占11%居末。',
  },
  {
    id: 't1-process',
    type: 'process',
    band: '8.0+',
    title: '小作文 · 流程图被动语态与工序衔接',
    titleEn: 'Task 1 · Process Diagram Passive Sequence',
    verbs: ['subsequently fed into', 'sorted manually', 'culminating in', 'prior to being'],
    sampleEn:
      'Once harvested, the cocoa beans are fermented in wooden crates prior to being sun-dried and subsequently transported to roasting facilities.',
    sampleZh:
      '可可豆采收后先置于木箱中发酵，随后进行日晒干燥，继而运往烘焙车间。',
  },
  {
    id: 't1-map-dev',
    type: 'map',
    band: '8.0+',
    title: '小作文 · 地图变迁（拆除/扩建/改建）',
    titleEn: 'Task 1 · Map Redevelopment Verbs',
    verbs: ['demolished to make way for', 'repurposed as', 'expanded eastward', 'relocated adjacent to'],
    sampleEn:
      'The derelict warehouse on the eastern bank was demolished to make way for a pedestrian plaza, while the old library was repurposed as a community café.',
    sampleZh:
      '东岸的废弃仓库被拆除以兴建步行广场，而旧图书馆则改建为社区咖啡馆。',
  },
  {
    id: 't1-overview',
    type: 'comparison',
    band: '7.0',
    title: '小作文 · 高分 Overview 总述段句型',
    titleEn: 'Task 1 · High-Scoring Overview Frame',
    verbs: ['Overall, it is clear that', 'the most striking trend is', 'widened considerably'],
    sampleEn:
      'Overall, while digital subscriptions rose across every age cohort, the sharpest acceleration occurred among adults aged 35 to 54.',
    sampleZh:
      '总体而言，尽管各年龄层的数字订阅均呈上升趋势，但35至54岁群体的增速最为显著。',
  },
  {
    id: 't1-table-extreme',
    type: 'comparison',
    band: '7.0',
    title: '小作文 · 表格极值与排名分组写法',
    titleEn: 'Task 1 · Table Extremes & Grouping',
    verbs: ['ranked highest at', 'lagged behind at', 'recorded identical figures', 'respectively'],
    sampleEn:
      'Finland ranked highest in broadband penetration at 94%, whereas Country D lagged behind at 41%; Countries B and C recorded comparable figures of 72% and 70% respectively.',
    sampleZh:
      '芬兰宽带普及率居首达94%，D国以41%居末，而B国和C国则分别录得相近的72%与70%。',
  },
  {
    id: 't1-pie-share',
    type: 'comparison',
    band: '6.5',
    title: '小作文 · 饼图占比分数与倍数表达',
    titleEn: 'Task 1 · Pie Chart Fractions & Proportions',
    verbs: ['just under a third', 'a negligible 4%', 'together constituted', 'outweighed'],
    sampleEn:
      'Housing costs alone absorbed just under a third of household income (32%), while transport and groceries together constituted nearly half.',
    sampleZh:
      '仅住房支出便吸纳了家庭收入的近三分之一（32%），而交通与食品杂货合计占近一半。',
  },
];

export const SENTENCE_UPGRADES: SentenceUpgrade[] = [
  {
    id: 'su-1',
    band: '7.0',
    topic: '科技利弊 (Tech)',
    band6Draft: 'Smartphones are very common now and make people spend less time talking face to face.',
    band8Upgrade:
      'The ubiquity of smartphones has inadvertently eroded genuine face-to-face interaction across households.',
    keyTakeaway: '名词化升级 (are common → ubiquity) + 精准程度副词 (inadvertently) + 动宾高分搭配 (erode interaction)。',
    keyTakeawayEn: 'Nominalization ("ubiquity") + precise adverb ("inadvertently") + collocation ("erode interaction").',
  },
  {
    id: 'su-2',
    band: '7.0',
    topic: '政府支出 (Policy)',
    band6Draft: 'The government should spend more money on schools instead of building big roads.',
    band8Upgrade:
      'Municipal authorities ought to prioritize public education funding over sprawling highway expansion.',
    keyTakeaway: '用 prioritize A over B 替代 spend more on A instead of B，逻辑更紧凑、学术感更强。',
    keyTakeawayEn: 'Use "prioritize A over B" for concise academic contrast.',
  },
  {
    id: 'su-3',
    band: '8.0+',
    topic: '环境保护 (Environment)',
    band6Draft: 'If factories keep releasing dirty gas, global warming will become much worse.',
    band8Upgrade:
      'Were industrial emissions to remain unchecked, climate deterioration would accelerate at an alarming pace.',
    keyTakeaway: '倒装虚拟语气 (Were... to...) + 不可数专业表达 (industrial emissions, climate deterioration)。',
    keyTakeawayEn: 'Inverted conditional ("Were... to") + natural academic noun phrases.',
  },
  {
    id: 'su-4',
    band: '6.5',
    topic: '在线学习 (Education)',
    band6Draft: 'Students can study online anytime, so it is very convenient for workers.',
    band8Upgrade:
      'Asynchronous online coursework offers working professionals unparalleled flexibility to study at their own pace.',
    keyTakeaway: '用 unparalleled flexibility 和 at their own pace 精准替代笼统的 convenient。',
    keyTakeawayEn: 'Replace generic "convenient" with "unparalleled flexibility".',
  },
  {
    id: 'su-5',
    band: '7.0',
    topic: '健康饮食 (Health)',
    band6Draft: 'Eating too much fast food every day is very bad for children’s health.',
    band8Upgrade:
      'Habitual consumption of ultra-processed fast food proves deeply detrimental to children’s metabolic health.',
    keyTakeaway: '避免 very bad，使用 proves deeply detrimental to + 专业定语 habitual consumption。',
    keyTakeawayEn: 'Swap "very bad" for "proves deeply detrimental to".',
  },
  {
    id: 'su-6',
    band: '7.0',
    topic: '城市交通 (Traffic)',
    band6Draft: 'More buses can help solve the problem of too many cars on the road.',
    band8Upgrade:
      'Expanding frequent bus rapid transit provides a viable incentive for commuters to leave private cars behind.',
    keyTakeaway: '用 viable incentive for X to... 展示措施机制，避免中式 solve the problem。',
    keyTakeawayEn: 'Show mechanism clearly with "provides a viable incentive".',
  },
  {
    id: 'su-7',
    band: '8.0+',
    topic: '老龄化 (Demographics)',
    band6Draft: 'Because there are more old people, the country has less money for pensions.',
    band8Upgrade:
      'A rapidly graying demographic inevitably strains state pension reserves unless retirement policies adapt.',
    keyTakeaway: '用 graying demographic 和 strain pension reserves 精炼因果句。',
    keyTakeawayEn: 'Concise metaphor "graying demographic" + verb "strains".',
  },
  {
    id: 'su-8',
    band: '7.0',
    topic: '媒体影响 (Media)',
    band6Draft: 'Advertisements always make young people want to buy things they do not really need.',
    band8Upgrade:
      'Pervasive digital advertising subtly fuels impulsive consumption among impressionable young buyers.',
    keyTakeaway: 'pervasive + fuels impulsive consumption + impressionable，词汇资源 (LR) 直接跨入 7.5+。',
    keyTakeawayEn: 'Strong collocations: "impulsive consumption" & "impressionable".',
  },
  {
    id: 'su-9',
    band: '8.0+',
    topic: '工作平衡 (Work-Life)',
    band6Draft: 'People should not work too much, or they will get sick and unhappy.',
    band8Upgrade:
      'Chronic overwork not only undermines long-term wellbeing but also erodes sustained workplace creativity.',
    keyTakeaway: 'not only... but also... 对仗递进，逻辑重心从“会生病”升华为“损害健康与创造力”。',
    keyTakeawayEn: 'Parallel "not only... but also" elevates reasoning depth.',
  },
  {
    id: 'su-10',
    band: '8.0+',
    topic: '文化保护 (Culture)',
    band6Draft: 'Some people think old buildings should be destroyed because land is expensive.',
    band8Upgrade:
      'Critics argue that preserving aging landmarks incurs steep opportunity costs amid soaring urban land prices.',
    keyTakeaway: '引入经济学高分概念 opportunity costs（机会成本），论证瞬间专业化。',
    keyTakeawayEn: 'Introduces precise economic framing ("incurs steep opportunity costs").',
  },
  {
    id: 'su-11',
    band: '7.0',
    topic: '公共图书馆 (Society)',
    band6Draft: 'Public libraries are important because poor people cannot buy expensive books.',
    band8Upgrade:
      'Public libraries serve as vital civic equalizers, guaranteeing low-income households unrestricted access to knowledge.',
    keyTakeaway: '用 civic equalizers + unrestricted access 替代平淡的 cannot buy expensive books。',
    keyTakeawayEn: 'Vivid metaphor "civic equalizers" + natural academic phrasing.',
  },
  {
    id: 'su-12',
    band: '8.0+',
    topic: '动物保护 (Ecology)',
    band6Draft: 'Zoos are bad for animals because cages are too small for them.',
    band8Upgrade:
      'Confining wide-ranging wildlife to cramped enclosures deprives them of natural foraging instincts and social bonds.',
    keyTakeaway: '动名词短语 Confining... 作主语 + deprive X of Y 精准表达心理与行为剥夺。',
    keyTakeawayEn: 'Gerund subject + "deprives X of Y" elevates ethical reasoning.',
  },
];

export const GRAMMAR_MODULES: GrammarModule[] = [
  {
    id: 'gram-1',
    band: '6.5',
    category: 'clause',
    title: '非限制性定语从句 (which 评述整句)',
    titleEn: 'Non-Restrictive Clause Commenting on a Clause',
    formula: 'Main Clause, which + Verb + Object',
    explanation:
      '写作 GRA（语法多样性）6.5→7.5 的核心加分结构：用 “, which...” 对前面整个事实做结果或影响评价，取代平铺直叙的 “and this”。',
    explanationEn:
      'Comments on the entire preceding clause using ", which...", avoiding repetitive "and this..." sentences.',
    correctEn: 'Remote work cuts daily commuting time, which noticeably lowers urban carbon emissions.',
    correctZh: '远程办公减少了每日通勤时间，这显著降低了城市碳排放。',
    pitfall: '⚠️ 非限制性定语从句逗号后绝不能用 that 代替 which。',
    pitfallEn: 'Never use "that" after a comma in non-restrictive clauses.',
    checkQuestion: 'Public libraries offer free digital access, ____ bridges the literacy gap.',
    checkOptions: ['that', 'which', 'what'],
    checkAnswerIdx: 1,
  },
  {
    id: 'gram-2',
    band: '7.0',
    category: 'clause',
    title: '让步状语从句 (While / Albeit 辩证让步)',
    titleEn: 'Balanced Concession (While / Albeit)',
    formula: 'While / Although + Concession, Main Argument',
    explanation:
      '雅思 Task 2 双边讨论与同意与否题型必备框架：先承认反方合理之处，再有力推出核心论点，瞬间展现辩证思维。',
    explanationEn:
      'Acknowledges an opposing point before pivoting decisively to your primary thesis.',
    correctEn: 'While online courses offer unmatched flexibility, face-to-face seminars foster deeper peer debate.',
    correctZh: '尽管网课提供了无与伦比的灵活性，线下研讨课却能激发更深入的同伴思辨。',
    pitfall: '⚠️ English 中 although/though 绝对不能和 but 连用！',
    pitfallEn: 'Never pair "although" with "but" in the same sentence.',
    checkQuestion: '____ AI boosts drafting speed, human verification remains essential.',
    checkOptions: ['Despite', 'While', 'Because'],
    checkAnswerIdx: 1,
  },
  {
    id: 'gram-3',
    band: '7.0',
    category: 'non_finite',
    title: '分词短语作状语 (去冗余主语)',
    titleEn: 'Participle Reduction Clauses',
    formula: 'V-ing / V-ed + Phrase, Subject + Verb',
    explanation:
      '当主句主语同时是动作发出者时，用现在分词（主动）或过去分词（被动）压缩从句，让句子简洁有力。',
    explanationEn:
      'Replaces wordy adverbial clauses with concise -ing (active) or -ed (passive) openers.',
    correctEn: 'Faced with soaring housing rents, young professionals increasingly share co-living spaces.',
    correctZh: '面对飙升的房租，年轻职场人越来越多地选择合租共享公寓。',
    pitfall: '⚠️ 悬垂分词错误：逗号后面的主语必须与前面分词逻辑一致。',
    pitfallEn: 'Avoid dangling participles: subject after the comma must match the opener.',
    checkQuestion: '____ by rising sea levels, coastal cities must fortify flood barriers.',
    checkOptions: ['Threatening', 'Threatened', 'To threaten'],
    checkAnswerIdx: 1,
  },
  {
    id: 'gram-4',
    band: '8.0+',
    category: 'inversion',
    title: '否定副词句首部分倒装 (Not only / Rarely)',
    titleEn: 'Negative Adverb Inversion (Band 8+ Signature)',
    formula: 'Not only / Seldom + Aux/Modal + Subject + Main Verb',
    explanation:
      'Not only、Rarely、Only by 等位于句首时，助动词（does/can/has）必须提前到主语之前，是 8.0 范文高频亮点句式。',
    explanationEn:
      'Invert auxiliary + subject when starting with negative or restrictive adverbs like "Not only" or "Only by".',
    correctEn: 'Not only does green infrastructure cool city streets, but it also absorbs torrential rain.',
    correctZh: '绿色基础设施不仅能为城市街道降温，还能吸收暴雨径流。',
    pitfall: '⚠️ Not only 放句首务必倒装，忘记加 does/can 就会降档失分。',
    pitfallEn: 'Remember to invert the auxiliary verb immediately after "Not only".',
    checkQuestion: 'Only by enforcing strict penalties ____ illegal dumping be curbed.',
    checkOptions: ['can', 'it can', 'to can'],
    checkAnswerIdx: 0,
  },
  {
    id: 'gram-5',
    band: '7.0',
    category: 'subjunctive',
    title: '虚拟条件与隐含假设 (Without / Had it not been)',
    titleEn: 'Counterfactual Conditionals',
    formula: 'Had + Subject + P.P., Subject + would have + P.P.',
    explanation:
      '在论证“某政策/技术如果缺失会怎样”时使用虚拟语气，能让因果论证更有厚度。',
    explanationEn:
      'Useful for explaining what would happen if a crucial policy or intervention were absent.',
    correctEn: 'Without targeted scholarships, many rural students could not afford medical school.',
    correctZh: '如果没有定向奖学金，许多农村学生将无力承担医学院学费。',
    pitfall: '⚠️ 主句需配 would / could / might，不要误用成 will。',
    pitfallEn: 'Use modal past ("would/could"), not "will", in counterfactual results.',
    checkQuestion: 'Were cities to abolish bus lanes, peak-hour congestion ____ dramatically.',
    checkOptions: ['worsens', 'would worsen', 'has worsened'],
    checkAnswerIdx: 1,
  },
  {
    id: 'gram-6',
    band: '6.5',
    category: 'inversion',
    title: '强调句型 (It is... that...)',
    titleEn: 'Cleft Focus Structure',
    formula: 'It is / was + Focused Element + that / who + Rest of Clause',
    explanation:
      '口语 Part 3 与写作正文段中突出“真正的原因/责任方”，极具说服节奏感。',
    explanationEn:
      'Highlights the decisive factor or responsible party cleanly in both Speaking and Writing.',
    correctEn: 'It is consistent daily exposure, rather than cramming, that builds lasting fluency.',
    correctZh: '真正建立持久流利度的是每日持续输入，而非考前突击。',
    pitfall: '⚠️ 去掉 It is... that 后原句必须依然语法完整。',
    pitfallEn: 'Removing "It is ... that" must leave a grammatically complete sentence.',
    checkQuestion: 'It is early childhood nutrition ____ shapes lifelong cognitive health.',
    checkOptions: ['what', 'which is', 'that'],
    checkAnswerIdx: 2,
  },
  {
    id: 'gram-7',
    band: '7.0',
    category: 'clause',
    title: '学术客观报道被动句 (It is widely acknowledged that...)',
    titleEn: 'Impersonal Academic Reporting',
    formula: 'It is + argued / widely held / documented + that + Clause',
    explanation:
      '避免反复写 I think / Many people say，用非人称客观引出双方立场，立即提升学术语体。',
    explanationEn:
      'Replaces informal "I think / People say" with objective academic attribution.',
    correctEn: 'It is widely documented that passive smoking poses severe respiratory hazards.',
    correctZh: '大量文献证实，二手烟对呼吸系统构成严重危害。',
    pitfall: '⚠️ 注意后面接完整 that 从句，前面形式主语必须是 It。',
    pitfallEn: 'Keep formal "It" as dummy subject followed by a complete "that" clause.',
    checkQuestion: '____ generally acknowledged that preventive care reduces hospital strain.',
    checkOptions: ['There is', 'It is', 'What is'],
    checkAnswerIdx: 1,
  },
  {
    id: 'gram-8',
    band: '8.0+',
    category: 'nominalization',
    title: '名词化压缩表达 (Nominalization)',
    titleEn: 'Academic Nominalization',
    formula: 'Turn Verb/Adj Clause → Abstract Noun Phrase + Strong Verb',
    explanation:
      '8分写作核心秘诀：把口语化的主谓分句压缩为名词短语作主语，使句密度和学术正式度成倍提升。',
    explanationEn:
      'Condenses spoken verb clauses into crisp abstract noun phrases for formal essays.',
    correctEn: 'Rapid urbanization has intensified competition for affordable housing.',
    correctZh: '快速城市化加剧了对可负担住房的争夺。（替代 Cities grow fast, so people compete...）',
    pitfall: '⚠️ 不要为了名词化强行堆砌过长介词链，保持每句清晰流畅。',
    pitfallEn: 'Keep prepositional chains concise so clarity stays high.',
    checkQuestion: 'Select the cleanest nominalized opener: "Because forests are cleared..." →',
    checkOptions: ['Widespread deforestation', 'People clear forests', 'Forests clearing often'],
    checkAnswerIdx: 0,
  },
  {
    id: 'gram-9',
    band: '6.5',
    category: 'non_finite',
    title: '平行并列结构 (Parallelism)',
    titleEn: 'Balanced Parallel Structure',
    formula: 'Verb/Noun/To-infinitive A, B, and C (identical grammatical form)',
    explanation:
      '列举多个优势或理由时，保持词性或非谓语形式严格一致，读起来节奏铿锵且无语法扣分。',
    explanationEn:
      'Keep listed items in identical grammatical form for rhythm and accuracy.',
    correctEn: 'Urban parks purify polluted air, cool heat islands, and foster neighborhood cohesion.',
    correctZh: '城市公园能净化污染空气、缓解热岛效应，并促进社区凝聚力。',
    pitfall: '⚠️ 忌讳前两个用动词原形，第三个突然跳成动名词 V-ing。',
    pitfallEn: 'Never mix verb forms in a single parallel list (e.g. "purify, cool, and fostering").',
    checkQuestion: 'Public transit saves commuter time, lowers fuel bills, and ____ stress.',
    checkOptions: ['reducing', 'reduces', 'to reduce'],
    checkAnswerIdx: 1,
  },
  {
    id: 'gram-10',
    band: '5.5',
    category: 'tense',
    title: '主谓一致高频易错陷阱 (The number of / With)',
    titleEn: 'Subject-Verb Agreement Traps',
    formula: 'The number of + Plural N → Singular Verb | A number of → Plural Verb',
    explanation:
      'Task 1 小作文写数据最易在 “The percentage/number of...” 后误接复数动词，导致 6.0 卡关。',
    explanationEn:
      'A classic Task 1 accuracy trap: "The percentage/number of + plural noun" takes a singular verb.',
    correctEn: 'The percentage of elderly commuters using contactless cards has risen steeply.',
    correctZh: '使用非接触式乘车卡的老年乘客比例大幅上升。',
    pitfall: '⚠️ 划掉 of 后面的修饰语看核心主语：The percentage (单数) → has risen。',
    pitfallEn: 'Ignore intervening prepositional phrases to find the true singular head noun.',
    checkQuestion: 'The number of electric scooters sold last year ____ sharply.',
    checkOptions: ['have increased', 'has increased', 'are increasing'],
    checkAnswerIdx: 1,
  },
  {
    id: 'gram-11',
    band: '7.0',
    category: 'clause',
    title: '介词 + 关系代词定语从句 (in which / through which)',
    titleEn: 'Preposition + Relative Pronoun Clauses',
    formula: 'Noun + Prep + which / whom + Complete Clause',
    explanation:
      '口语与写作中用 “the extent to which / the mechanism by which / the way in which” 能瞬间提升学术衔接与语法跨度。',
    explanationEn:
      'Replaces informal stranded prepositions with crisp academic structures like "the extent to which".',
    correctEn: 'The extent to which AI reshapes law depends on the safeguards regulators enforce.',
    correctZh: '人工智能重塑法律的程度取决于监管机构所执行的保障规范。',
    pitfall: '⚠️ 介词提前后只能接 which 或 whom，绝不能接 that！',
    pitfallEn: 'Use "which" or "whom"—never "that"—right after a preposition.',
    checkQuestion: 'This marks a turning point ____ renewable energy outpaced coal.',
    checkOptions: ['at which', 'at that', 'which'],
    checkAnswerIdx: 0,
  },
  {
    id: 'gram-12',
    band: '8.0+',
    category: 'non_finite',
    title: '独立主格与伴随补充结构 (With + N + V-ing/V-ed)',
    titleEn: 'With-Absolute Clauses for Concise Detail',
    formula: 'With + Noun + V-ing / V-ed / Adj, Main Clause',
    explanation:
      '在 Task 1 数据描述与 Task 2 趋势背景句中，用 With 复合结构带出伴随数据或现实条件，凝练紧凑。',
    explanationEn:
      'Packs supporting trends or conditions smoothly into one sentence without choppy "and" clauses.',
    correctEn: 'With battery prices falling steeply, electric delivery vans are rapidly replacing diesel fleets.',
    correctZh: '随着电池价格大幅下降，电动配送货车正迅速取代柴油车队。',
    pitfall: '⚠️ With 后若表示已完成或被动状态需用过去分词 (V-ed)，主动进行用 V-ing。',
    pitfallEn: 'Match -ing for active ongoing change and -ed for completed passive states.',
    checkQuestion: 'With coastal populations ____ steadily, flood defenses require urgent upgrades.',
    checkOptions: ['expand', 'expanding', 'expanded to'],
    checkAnswerIdx: 1,
  },
  {
    id: 'gram-13',
    band: '7.0',
    category: 'clause',
    title: '同位语从句解释抽象观点 (the fact / notion that...)',
    titleEn: 'Appositive Clauses Clarifying Abstract Nouns',
    formula: 'The fact / claim / consensus + that + Complete Clause + Verb',
    explanation:
      '新东方高分语法树核心结构：用 fact, belief, evidence 等抽象名词引出完整陈述内容，显著优于简单句并列。',
    explanationEn:
      'Attaches a complete statement directly to abstract nouns such as fact, notion, or consensus.',
    correctEn: 'The widespread assumption that longer hours guarantee higher output has been disproven.',
    correctZh: '认为工作时间越长产出越高的普遍假设已被推翻。',
    pitfall: '⚠️ 同位语从句中的 that 只起连接作用不作成分，不可省略也不可换成 which。',
    pitfallEn: 'Do not replace appositive "that" with "which" or omit it.',
    checkQuestion: 'Evidence ____ sleep deprivation impairs memory is now overwhelming.',
    checkOptions: ['which', 'that', 'what'],
    checkAnswerIdx: 1,
  },
  {
    id: 'gram-14',
    band: '8.0+',
    category: 'subjunctive',
    title: '省去 if 的倒装虚拟条件 (Were / Should / Had)',
    titleEn: 'Inverted Conditionals (Formal Register)',
    formula: 'Were S to V / Should S V / Had S P.P., Main Clause',
    explanation:
      '写作 GRA 冲刺 8.0 的高阶条件句：省去 if 并把 Were / Should / Had 提前至句首，兼具倒装与虚拟双重加分。',
    explanationEn:
      'Omits "if" and fronts "Were / Should / Had" for formal conditional hypotheses.',
    correctEn: 'Should governments subsidize rural clinics, preventive screening rates would climb.',
    correctZh: '倘若政府补贴乡村诊所，预防性筛查率将会攀升。',
    pitfall: '⚠️ 句首倒装后绝对不要再重复写 if（不能写 If should...）。',
    pitfallEn: 'Never keep "if" after fronting Should, Were, or Had.',
    checkQuestion: '____ the city invested earlier in rail, traffic gridlock could have been avoided.',
    checkOptions: ['Had', 'If had', 'Have'],
    checkAnswerIdx: 0,
  },
  {
    id: 'gram-15',
    band: '6.5',
    category: 'tense',
    title: 'Task 1 历史与预测混合时态切换 (Past vs Projected)',
    titleEn: 'Historical vs Projected Tense Switching (Task 1)',
    formula: 'Past years → Simple Past | Future projections → be projected / forecast to V',
    explanation:
      'Task 1 动态图表横跨过去与未来年份时，严禁全篇用一般过去时或 will，需精准配合被动预测句型。',
    explanationEn:
      'Separates completed historical figures from future estimates using "is projected/forecast to".',
    correctEn: 'Solar capacity doubled between 2015 and 2022, and it is projected to reach 45% by 2035.',
    correctZh: '太阳能装机在 2015 至 2022 年间翻倍，并预计到 2035 年达到 45%。',
    pitfall: '⚠️ 避免用主观口气 "Solar will definitely reach..."，客观数据用 is projected/expected to。',
    pitfallEn: 'Use objective "is projected/expected to" instead of "will definitely".',
    checkQuestion: 'By 2040, urban rail ridership ____ overtake private car trips.',
    checkOptions: ['is forecast to', 'forecasted', 'was forecasting to'],
    checkAnswerIdx: 0,
  },
];

// =========================================================================
// openIELTS & my-ielts Deep Learning Data Expansions
// =========================================================================

export const OPEN_IELTS_STUDY_PLAN: OpenIeltsStage[] = [
  {
    id: 'oi-stage-1',
    stageNum: 1,
    titleZh: '阶段一 · 语音敏感与王陆 179 基础夯实',
    titleEn: 'Stage 1 · Phonetics & Core 179 Foundation',
    durationZh: '第 1–2 周 · 每日 40 分钟',
    durationEn: 'Weeks 1–2 · 40 min/day',
    focusZh: '零成本打通听力拼写关：利用“盲听听写”模式攻克双写字母与英美音差异，同步按词根记忆核心 5.5–6.5 词群。',
    focusEn: 'Lock in spelling accuracy with blind dictation across Section 1–4 traps while reviewing B2 core roots.',
    checklistZh: [
      '开启「纯盲听听写」完成 20 个高频陷阱词拼写',
      '用全库词书 SRS 卡片标记 30 个基础词进入复习队列',
    ],
    checklistEn: [
      'Complete 20 Section 1–4 blind dictation items',
      'Schedule 30 foundation vocabulary cards into SRS review',
    ],
    targetTab: 'listening_speaking',
  },
  {
    id: 'oi-stage-2',
    stageNum: 2,
    titleZh: '阶段二 · 538 同义替换与平行阅读提速',
    titleEn: 'Stage 2 · 538 Paraphrase & Parallel Reading',
    durationZh: '第 3–4 周 · 每日 50 分钟',
    durationEn: 'Weeks 3–4 · 50 min/day',
    focusZh: '精研学术阅读中的“题干改写矩阵”，建立 FALSE vs NOT GIVEN 逻辑边界，配合新概念 Book 3 语序拆解提升长难句解析力。',
    focusEn: 'Master Passage-to-Question synonym swaps, FALSE vs NOT GIVEN boundaries, and NCE Book 3 prose parsing.',
    checklistZh: [
      '完成全部 TFNG 逻辑边界实战并记录错题',
      '检索并收藏 15 组高价值 538 学术同义替换',
    ],
    checklistEn: [
      'Finish all TFNG boundary drills with zero logic slips',
      'Bookmark 15 high-frequency 538 paraphrase pairs',
    ],
    targetTab: 'reading_writing',
  },
  {
    id: 'oi-stage-3',
    stageNum: 3,
    titleZh: '阶段三 · 顾家北 100 句翻译 + openIELTS 精批精修',
    titleEn: 'Stage 3 · Gu Jiabei Translation & Essay Critique',
    durationZh: '第 5–6 周 · 每日 60 分钟',
    durationEn: 'Weeks 5–6 · 60 min/day',
    focusZh: '拒绝空洞模板！通过中译英主动打磨 ABC 因果链，结合 Band 5.5→7.5+ 范文批改工坊与新东方语法思维导图消灭硬伤。',
    focusEn: 'Practice active C-to-E translation + ABC causal chains, then run Band 5.5→7.5+ self-critique audits.',
    checklistZh: [
      '手写完成 5 句顾家北高频话题中译英对比',
      '在精修工坊完成至少 2 篇 Task 2 段落自查清单',
    ],
    checklistEn: [
      'Complete 5 Gu Jiabei high-frequency C-to-E drills',
      'Audit 2 Task 2 paragraphs in the Revision Critique Studio',
    ],
    targetTab: 'reading_writing',
  },
  {
    id: 'oi-stage-4',
    stageNum: 4,
    titleZh: '阶段四 · 口语串题万能骨架 + 全真限时冲刺',
    titleEn: 'Stage 4 · Speaking Topic Chaining & Timed Mock',
    durationZh: '考前 2 周 · 每日模拟',
    durationEn: 'Final 2 Weeks · Daily Simulation',
    focusZh: '用 3 个高密度个人故事骨架串联 Part 2 高频人物/地点/物品/事件题，开启 1 分钟准备 + 2 分钟跟读录音复盘。',
    focusEn: 'Reuse 3 high-density story skeletons across Person/Place/Object cues with 1m+2m live mic playback.',
    checklistZh: [
      '背熟 3 套串题万能骨架并完成跟读流畅度测试',
      '清空全库“今日待复习”并完成所有核心语法题',
    ],
    checklistEn: [
      'Record and verify fluency across 3 Speaking Topic Chains',
      'Clear daily due SRS deck & verify all 15 Grammar Modules',
    ],
    targetTab: 'listening_speaking',
  },
];

export const IELTS_WRITING_BAND_MATRIX: WritingBandCriterionRow[] = [
  {
    band: '5.5',
    trTaZh: '立场基本明确但部分跑题，论证停留在常识堆砌，缺乏展开。',
    trTaEn: 'Addresses task partially; ideas are listed with limited development.',
    ccZh: '机械使用 Firstly / Besides / In conclusion，段内指代生硬。',
    ccEn: 'Mechanical linkers; paragraph progression lacks smooth cohesion.',
    lrZh: '用词有限且重复度高（important / good / bad），搭配常见错误。',
    lrEn: 'Limited range with frequent repetition and collocation errors.',
    graZh: '简单句为主，复杂句常出现主谓不一致或逗号拼接错误。',
    graEn: 'Relies on simple sentences; frequent errors in complex clauses.',
  },
  {
    band: '6.5',
    trTaZh: '回应题目所有部分，有明确观点，但分论点深度或例证略单薄。',
    trTaEn: 'Covers all parts of prompt; relevant ideas though unevenly extended.',
    ccZh: '分段合理，衔接词多样，偶尔出现过渡略显生硬之处。',
    ccEn: 'Logical paragraphing and clear progression with occasional stiffness.',
    lrZh: '能使用较少见词汇（mitigate / curb），偶有词性或搭配偏差。',
    lrEn: 'Attempts less common academic lexis with minor collocation slips.',
    graZh: '混合使用简单句与复合句（定语/让步从句），错误不阻碍理解。',
    graEn: 'Mix of simple and complex structures; errors rarely impede meaning.',
  },
  {
    band: '7.0',
    trTaZh: '全面、清晰地回应全部要求，全文一以贯之地给出有说服力的展开与例证。',
    trTaEn: 'Addresses all prompt facets clearly with well-extended, relevant support.',
    ccZh: '每段中心句清晰，逻辑链条自然（因果、让步隐形衔接），很少滥用连接词。',
    ccEn: 'Clear central topic per paragraph; subtle referencing and natural flow.',
    lrZh: '准确运用地道搭配（civic equalizer / fiscal strain），词义精准且自然。',
    lrEn: 'Uses precise academic collocations flexibly with very few inaccuracies.',
    graZh: '高频产出无错误复杂句（非限制定从、分词、名词化），标点准确。',
    graEn: 'Frequent error-free complex sentences with strong punctuation control.',
  },
  {
    band: '8.0+',
    trTaZh: '观点敏锐深刻，兼具辩证权衡与具体政策/社会机制拆解，毫无冗余。',
    trTaEn: 'Insightful, nuanced evaluation covering mechanisms and trade-offs.',
    ccZh: '行文如母语社论，通过语意承接与代词指代实现丝滑衔接。',
    ccEn: 'Seamless editorial cohesion managed invisibly through lexical hooks.',
    lrZh: '学术词汇运用老练精确，修辞克制得体，极少出现生硬堆砌。',
    lrEn: 'Sophisticated, natural lexical control with rare minor slips.',
    graZh: '自如驾驭倒装、虚拟条件、独立主格等高阶句式，绝大多数句子完全无错。',
    graEn: 'Wide range of structures deployed naturally; virtually error-free.',
  },
];

export const OPEN_IELTS_REVISION_STUDIOS: OpenIeltsRevisionCase[] = [
  {
    id: 'rev-1',
    topicZh: '远程办公与城市通勤 (Work & Cities)',
    topicEn: 'Remote Work & Urban Commuting',
    targetBand: '7.5' as unknown as IeltsBand,
    band55Draft:
      'Many people think working from home is good because they do not need to go to office by car, and this makes air clean and saves time for them.',
    band75Revision:
      'Adopting hybrid remote-work schedules substantially curtails daily peak-hour commuting, which not only alleviates urban gridlock but also reduces vehicular carbon emissions.',
    examinerCritiqueZh:
      '原句存在口语化表达（good / go to office / makes air clean）与 “and this” 流水账；修订版运用动名词主语 + 非限制性定语从句 “, which not only... but also...”，同时将搭配升级为 peak-hour commuting 与 vehicular emissions。',
    examinerCritiqueEn:
      'Replaces vague phrasing ("good", "makes air clean", "and this") with a gerund subject and non-restrictive ", which not only... but also..." clause.',
    auditItemsZh: [
      '是否已替换掉笼统形容词 good / bad / important？',
      '是否避免了流水账连接词 and this / so？',
      '名词搭配是否地道（peak-hour commuting / carbon emissions）？',
    ],
    auditItemsEn: [
      'Replaced vague adjectives (good/bad) with measurable impact verbs?',
      'Eliminated choppy "and this / so" chains?',
      'Verified natural academic collocations?',
    ],
  },
  {
    id: 'rev-2',
    topicZh: '政府投资艺术 vs 公共医疗 (Public Spending)',
    topicEn: 'Public Funding: Arts vs Healthcare',
    targetBand: '8.0+',
    band55Draft:
      'Government should spend more money on hospitals instead of museums, because hospitals save lives and art is not necessary for poor people.',
    band75Revision:
      'While cultural institutions enrich civic identity, finite municipal budgets must prioritize primary healthcare, as untreated illness immediately threatens workforce productivity and human dignity.',
    examinerCritiqueZh:
      '原句立场绝对且说理跳跃（“艺术对穷人不必要”易引发论证漏洞）；修订版先以 While 让步肯定艺术价值，再通过有限预算优先级（finite municipal budgets）与因果机制（threatens productivity and dignity）完成 8.0 辩证论证。',
    examinerCritiqueEn:
      'Avoids over-generalization ("art is unnecessary") by granting cultural value via a "While" concession before justifying healthcare priority on fiscal and human grounds.',
    auditItemsZh: [
      '是否先用让步结构（While / Granted）承认反方部分合理性？',
      '是否给出了具体理由机制，而非主观武断？',
      '主语是否使用客观名词短语而非口语化省略冠词的 Government？',
    ],
    auditItemsEn: [
      'Acknowledged the opposing view with a balanced concession clause?',
      'Explained the underlying mechanism rather than asserting an opinion?',
      'Used proper article/plural grammar ("municipal budgets", not bare "Government")?',
    ],
  },
  {
    id: 'rev-3',
    topicZh: '人工智能与职业教育转型 (Technology & Education)',
    topicEn: 'AI Automation & Vocational Reskilling',
    targetBand: '8.0+',
    band55Draft:
      'AI will take many workers jobs in the future, so schools must teach students new skills to help them find work easily.',
    band75Revision:
      'With algorithmic automation rapidly displacing routine clerical roles, vocational curricula must pivot toward interdisciplinary problem-solving so graduates remain resilient in shifting labor markets.',
    examinerCritiqueZh:
      '利用 With 复合独立主格引出宏观背景（algorithmic automation displacing...），并用 pivot toward / remain resilient 精准刻画转型机制，句密度达到 C1–C2 水准。',
    examinerCritiqueEn:
      'Opens with a crisp "With + noun + -ing" absolute clause and upgrades "find work easily" to "remain resilient in shifting labor markets".',
    auditItemsZh: [
      '是否避免了拼写与所有格疏漏（workers’ jobs）？',
      '背景句是否用 With 结构或分词短语压缩紧凑？',
      '结果段是否明确指出了“培养何种可迁移能力”？',
    ],
    auditItemsEn: [
      'Checked possessive apostrophes and noun plurality?',
      'Compressed background context with a "With"-absolute or participle clause?',
      'Specified what transferable skills schools should cultivate?',
    ],
  },
  {
    id: 'rev-4',
    topicZh: '塑料污染与包装法规 (Environment)',
    topicEn: 'Single-Use Plastics & Regulation',
    targetBand: '7.0',
    band55Draft:
      'Plastic bags are very harmful to sea animals, therefore the government should make a law to ban people using them.',
    band75Revision:
      'Because non-biodegradable packaging persists in marine food chains for decades, statutory bans on single-use plastics should be paired with subsidized compostable alternatives.',
    examinerCritiqueZh:
      '修正了 therefore 逗号拼接错误（run-on comma splice）与搭配错误（make a law to ban people using → statutory bans on），并提出“禁令+可降解替代补贴”的可行对策。',
    examinerCritiqueEn:
      'Fixes the ", therefore" comma splice, corrects preposition patterns ("bans on"), and adds a realistic policy pairing ("subsidized compostable alternatives").',
    auditItemsZh: [
      '是否排查了逗号拼接错误（, therefore / , however）？',
      'ban / prohibit 后接名词或 from doing 结构是否正确？',
      '结尾是否给出具体配套对策增强论证闭环？',
    ],
    auditItemsEn: [
      'Fixed any comma splices before conjunctive adverbs (therefore/however)?',
      'Checked verb complement grammar ("ban on X" / "prohibit X from doing")?',
      'Included concrete implementation feasibility?',
    ],
  },
];

export const OPEN_IELTS_SPEAKING_CHAINS: SpeakingTopicChain[] = [
  {
    id: 'chain-1',
    archetypeZh: '万能骨架一 · 社区老街里的“修复咖啡书店”',
    archetypeEn: 'Chain 1 · The Neighborhood Book-Repair Café',
    linkedPromptsZh: [
      '地点类：喜欢的安静地方 / 常去的城市角落',
      '人物类：敬佩的手艺人 / 乐于助人的邻居',
      '物品类：保存很久的旧物 / 有意义的礼物',
      '事件类：一次意外的谈话 / 学到新技能的周末',
    ],
    linkedPromptsEn: [
      'Place: Quiet spot / favorite neighborhood corner',
      'Person: Skilled craftsperson / helpful neighbor',
      'Object: Old keepsake / meaningful handmade gift',
      'Event: Memorable chat / weekend learning a new skill',
    ],
    coreStoryEn:
      'Just two blocks behind a bustling subway station sits a sunlit timber book-repair workshop run by Mr. Lin, a retired binder who restores torn paperbacks while serving roasted oolong tea. Last autumn he taught me how to stitch a loose spine using waxed linen thread on my grandfather’s dog-eared atlas—turning a fragile heirloom into something sturdy for another generation.',
    coreStoryZh:
      '距离喧闹地铁站两条街外，有一间采光极佳的木质旧书修补铺，由退休装帧师林师傅打理；他一边泡乌龙茶，一边帮街坊修补散页旧书。去年秋天，他教我用上蜡亚麻线重新缝合祖父留下的泛黄地图册，让这件脆弱的传家物重获新生。',
    pivotBridgeEn:
      'If asked about a PERSON → zoom in on Mr. Lin’s patience; if asked about a PLACE → zoom in on the timber loft & tea aroma; if asked about an OBJECT → focus on the stitched atlas.',
    collocations: ['tucked-away workshop', 'dog-eared heirloom', 'waxed linen thread', 'quiet sense of continuity'],
  },
  {
    id: 'chain-2',
    archetypeZh: '万能骨架二 · 暴雨夜抢修“离线语音学习工具”的经历',
    archetypeEn: 'Chain 2 · Building an Offline Study Routine During a Storm',
    linkedPromptsZh: [
      '科技类：高频使用的实用软件 / 离线也能用的功能',
      '挫折与解决：克服困难的经历 / 一次高效时间管理',
      '习惯类：每天坚持的好习惯 / 提升英语的方法',
    ],
    linkedPromptsEn: [
      'Tech/App: Useful app / feature that works offline',
      'Problem-solving: Overcoming a setback / staying productive',
      'Habit: Daily learning routine / effective English method',
    ],
    coreStoryEn:
      'When a summer typhoon knocked out mobile reception during my exam-prep week, I switched to pre-cached flashcards and blind dictation drills stored locally on my device. Completing three uninterrupted 25-minute sprints without notification distractions proved so effective that I permanently kept the offline study routine.',
    coreStoryZh:
      '考前冲刺周遇上台风导致移动网络中断，我转而使用预先缓存的本地词汇卡和离线听写练习。没有弹窗干扰的三个 25 分钟专注周期效率惊人，从此我把这个离线精学习惯一直保留至今。',
    pivotBridgeEn:
      'Pivot effortlessly between "a useful app", "a time you solved a problem", or "a habit that improved focus".',
    collocations: ['mobile reception outage', 'pre-cached flashcards', 'uninterrupted sprint', 'notification-free focus'],
  },
  {
    id: 'chain-3',
    archetypeZh: '万能骨架三 · 城市废弃铁道改建的“线性绿道公园”',
    archetypeEn: 'Chain 3 · The Converted Railway Greenway Park',
    linkedPromptsZh: [
      '城市变化：家乡近年最赞的新变化 / 环保举措',
      '活动类：常做的户外运动 / 周末放松方式',
      '建筑/公共空间：免费公共设施 / 适合老少皆宜的场所',
    ],
    linkedPromptsEn: [
      'Urban Change: Positive city change / eco-friendly policy',
      'Activity: Outdoor exercise / relaxing weekend routine',
      'Public Space: Free civic facility / place for all ages',
    ],
    coreStoryEn:
      'An overgrown freight railway that used to cut our district in half was recently transformed into a four-kilometer shaded greenway with permeable jogging tracks and native wildflowers. Every Sunday morning, cyclists, strollers, and retired tai-chi groups share the corridor—a vivid example of adaptive urban renewal.',
    coreStoryZh:
      '过去把我们城区一分为二的荒废货运铁道，最近被改造成一条四公里长的林荫绿道，铺设了透水慢跑道并种满本地野花。每个周日清晨，骑行者、推婴儿车的家长和打太极的老人共享这条廊道，成为城市适应性更新的生动范本。',
    pivotBridgeEn:
      'Link seamlessly to "urban development", "healthy lifestyle", or "how governments improve residents’ wellbeing".',
    collocations: ['adaptive urban renewal', 'permeable jogging track', 'native wildflowers', 'intergenerational space'],
  },
];

export const GU_JIABEI_TRANSLATION_DRILLS: GuJiabeiTranslationDrill[] = [
  {
    id: 'gu-1',
    topicZh: '教育公平 (Education)',
    topicEn: 'Educational Equity',
    band: '7.0',
    chinesePrompt: '免费获取高质量在线课程能够大幅缩小城乡之间的教育资源差距。',
    keyPattern: 'Free access to... + substantially narrow the gap in... between A and B',
    band8Target:
      'Free access to high-caliber online courses can substantially narrow the gap in educational resources between urban and rural areas.',
    grammarNoteZh: '主语用“无冠词名词短语 Free access to...”替代臃肿的 “If students can get online courses for free...”；搭配用 narrow the gap。',
    grammarNoteEn: 'Nominalized subject ("Free access to...") + idiomatic verb collocation ("narrow the gap").',
    commonTrapZh: '避免写成 shorten the gap 或 make the gap small；资源 gap 用 educational resources。',
    commonTrapEn: 'Use "narrow" or "bridge" (not "shorten") with "gap".',
  },
  {
    id: 'gu-2',
    topicZh: '城市交通与环保 (Transport)',
    topicEn: 'Urban Transit & Ecology',
    band: '7.0',
    chinesePrompt: '补贴公共交通不仅能缓解高峰期拥堵，还能鼓励市民放弃私家车通勤。',
    keyPattern: 'Subsidizing X not only alleviates... but also encourages Y to abandon...',
    band8Target:
      'Subsidizing public transit not only alleviates peak-hour congestion, but also encourages commuters to abandon private car travel.',
    grammarNoteZh: '顾家北高频“双效益”骨架：动名词作主语 + not only A but also B + encourage sb to do。',
    grammarNoteEn: 'Gerund subject + parallel benefits with "not only ... but also".',
    commonTrapZh: '注意拥堵用 congestion/gridlock（不可数），不要写 many congestions。',
    commonTrapEn: '"Congestion" is uncountable—never pluralize it.',
  },
  {
    id: 'gu-3',
    topicZh: '科技与人际关系 (Technology)',
    topicEn: 'Tech & Social Bonds',
    band: '6.5',
    chinesePrompt: '过度依赖即时通讯软件往往会削弱年轻人进行深度面对面交流的能力。',
    keyPattern: 'Overreliance on... tends to erode / undermine young people’s capacity for...',
    band8Target:
      'Overreliance on instant-messaging apps tends to erode young people’s capacity for deep face-to-face conversation.',
    grammarNoteZh: '用 erode / undermine（逐渐削弱）精准替换口语化动词 weaken/hurt；能力用 capacity for + 名词。',
    grammarNoteEn: 'Use "erode" or "undermine" for gradual weakening + "capacity for".',
    commonTrapZh: '避免写 Too depending on...（depend 不能直接加 too 作主语）；用名词 overreliance on。',
    commonTrapEn: 'Never write "Too depending on"; use the noun "Overreliance on".',
  },
  {
    id: 'gu-4',
    topicZh: '政府财政与住房 (Policy)',
    topicEn: 'Housing Policy',
    band: '8.0+',
    chinesePrompt: '除非政府出台严格的租金上限政策，否则低收入群体将被迫迁往偏远郊区。',
    keyPattern: 'Unless authorities impose..., low-income households will be forced to relocate to...',
    band8Target:
      'Unless municipal authorities impose strict rent caps, low-income households will be forced to relocate to distant suburbs.',
    grammarNoteZh: '条件反转结构 Unless + 现在时，主句用将来时（主将从现）；“被迫搬迁”地道动词为 be forced to relocate to。',
    grammarNoteEn: 'Real future conditional ("Unless + present, ... will") + "relocate to".',
    commonTrapZh: '注意 unless 本身含否定含义，从句内绝不能再加 not！',
    commonTrapEn: '"Unless" already means "if not"—never add another negative inside its clause.',
  },
  {
    id: 'gu-5',
    topicZh: '老龄化与劳动力 (Demographics)',
    topicEn: 'Aging Population',
    band: '8.0+',
    chinesePrompt: '随着劳动力人口老龄化，延长退休年龄并配合弹性工时或许势在必行。',
    keyPattern: 'As workforces age, raising the retirement age alongside... may prove imperative.',
    band8Target:
      'As workforces age, raising the statutory retirement age alongside flexible schedules may prove imperative.',
    grammarNoteZh: '随着……用 As + 主语 + age（age 作动词“变老”极其凝练）；“势在必行”高级表达为 prove imperative / indispensable。',
    grammarNoteEn: 'Concise verb "age" ("As workforces age") + formal modal predicate ("may prove imperative").',
    commonTrapZh: '不要直译成 prolong the age（搭配不当），提高退休年龄固定搭配为 raise the retirement age。',
    commonTrapEn: 'Collocation is "raise the retirement age", not "prolong the age".',
  },
  {
    id: 'gu-6',
    topicZh: '媒体与消费主义 (Consumerism)',
    topicEn: 'Advertising & Consumption',
    band: '7.0',
    chinesePrompt: '铺天盖地的定向广告诱使青少年把物质占有误以为是社会地位的象征。',
    keyPattern: 'Pervasive targeted advertising entices teenagers into mistaking X for Y.',
    band8Target:
      'Pervasive targeted advertising entices teenagers into mistaking material possessions for symbols of social status.',
    grammarNoteZh: 'mistake A for B（把 A 误当作 B）+ entice sb into doing（诱使某人做某事）是顾家北标志性精准动词结构。',
    grammarNoteEn: 'Precision verb framing: "entices ... into mistaking A for B".',
    commonTrapZh: 'advertising 作总称不可数，表示具体某几条广告才用 advertisements。',
    commonTrapEn: 'Use uncountable "advertising" when referring to the industry broadly.',
  },
  {
    id: 'gu-7',
    topicZh: '健康与饮食监管 (Public Health)',
    topicEn: 'Nutrition Regulation',
    band: '7.0',
    chinesePrompt: '对含糖饮料征收消费税，所筹资金应当专项用于补贴社区体育设施。',
    keyPattern: 'Revenue generated from taxing X should be earmarked to subsidize Y.',
    band8Target:
      'Revenue generated from taxing sugary beverages should be earmarked to subsidize community sports facilities.',
    grammarNoteZh: 'past participle 后置定语（Revenue generated from...）+ 被动专业词 earmark（专款专用拨付），8分考官极其青睐。',
    grammarNoteEn: 'Reduced passive modifier ("Revenue generated from...") + exact policy verb "earmarked".',
    commonTrapZh: '“专项用于”避免啰嗦写成 specially used to，一词 earmarked to 即可解决。',
    commonTrapEn: 'Use "earmarked to/for" instead of wordy "specially used to".',
  },
  {
    id: 'gu-8',
    topicZh: '全球化与本土文化 (Culture)',
    topicEn: 'Cultural Preservation',
    band: '8.0+',
    chinesePrompt: '尽管全球消费品牌无处不在，地方美食与传统节庆依然维系着社区归属感。',
    keyPattern: 'Notwithstanding the ubiquity of X, local heritage continues to sustain...',
    band8Target:
      'Notwithstanding the ubiquity of global consumer brands, regional cuisine and traditional festivals continue to sustain civic belonging.',
    grammarNoteZh: '介词让步短语 Notwithstanding the ubiquity of... 替代单调的 Although X are everywhere。',
    grammarNoteEn: 'Prepositional concession ("Notwithstanding the ubiquity of...") boosts lexical density.',
    commonTrapZh: '注意 notwithstanding / despite 后面只能接名词短语，不能直接接完整句子！',
    commonTrapEn: 'Follow "Notwithstanding / Despite" with a noun phrase, not a finite clause.',
  },
];

