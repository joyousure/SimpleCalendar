export type LawCategory =
  | 'all'
  | 'constitution'
  | 'civil_commercial'
  | 'criminal'
  | 'administrative'
  | 'economic_social'
  | 'procedural'
  | 'cases';

export type LawScenarioId =
  | 'all'
  | 'labor'
  | 'consumer'
  | 'housing'
  | 'family'
  | 'privacy'
  | 'traffic'
  | 'company';

export interface LawArticle {
  id: string;
  chapter: string;
  number: string; // e.g. "第1条" or "第577条"
  content: string;
  summary: string;
}

export interface LawDocument {
  id: string;
  title: string;
  shortTitle: string;
  category: Exclude<LawCategory, 'all' | 'cases'>;
  scenarios: Exclude<LawScenarioId, 'all'>[];
  authority: string;
  effectiveDate: string;
  lawRefPath: string; // Relative path in remote statute archive
  articlesCountHint: string;
  tags: string[];
  articles: LawArticle[];
}

export interface JudicialCase {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  decisionDate: string;
  category: string;
  scenarios: Exclude<LawScenarioId, 'all'>[];
  tags: string[];
  facts: string;
  holding: string;
  relatedArticles: string[];
}

export interface LegalTimeframe {
  id: string;
  title: string;
  duration: string;
  category: Exclude<LawCategory, 'all' | 'cases'>;
  scenario: Exclude<LawScenarioId, 'all'>;
  basisLawId: string;
  basisArticle: string;
  detail: string;
}

export const LEGAL_SCENARIOS: { id: Exclude<LawScenarioId, 'all'>; keywords: string[] }[] = [
  { id: 'labor', keywords: ['劳动', '工资', '加班', '社保', '工伤', '辞退', '竞业'] },
  { id: 'consumer', keywords: ['消费', '退货', '退款', '网购', '直播', '欺诈', '假一赔三'] },
  { id: 'housing', keywords: ['租房', '物业', '高空抛物', '居住权', '押金', '买房'] },
  { id: 'family', keywords: ['婚姻', '离婚', '冷静期', '抚养', '继承', '遗嘱'] },
  { id: 'privacy', keywords: ['隐私', '个人信息', '肖像', '数据', '电诈', '网络'] },
  { id: 'traffic', keywords: ['交通', '驾驶', '事故', '理赔', '酒驾', '非机动车'] },
  { id: 'company', keywords: ['公司', '股东', '出资', '董事', '商标', '著作权', '仲裁'] },
];

export const LEGAL_TIMEFRAMES: LegalTimeframe[] = [
  {
    id: 'tf-civil-limitation',
    title: '一般民事诉讼时效期间',
    duration: '3年',
    category: 'civil_commercial',
    scenario: 'company',
    basisLawId: 'civil-code',
    basisArticle: '第188条',
    detail: '自权利人知道或者应当知道权利受到损害以及义务人之日起计算；最长保护期为权利受到损害之日起20年。',
  },
  {
    id: 'tf-labor-arbitration',
    title: '劳动争议申请仲裁时效',
    duration: '1年',
    category: 'economic_social',
    scenario: 'labor',
    basisLawId: 'labor-law',
    basisArticle: '第82条',
    detail: '从当事人知道或者应当知道其权利被侵害之日起计算；劳动关系存续期间因拖欠劳动报酬发生争议的，不受1年仲裁时效限制（离职后1年内提出）。',
  },
  {
    id: 'tf-probation-max',
    title: '劳动合同试用期法定上限',
    duration: '1 / 2 / 6个月',
    category: 'economic_social',
    scenario: 'labor',
    basisLawId: 'labor-contract-law',
    basisArticle: '第19条',
    detail: '3个月以上不满1年不得超过1个月；1年以上不满3年不得超过2个月；3年以上或无固定期限不得超过6个月；试用期工资不得低于转正的80%。',
  },
  {
    id: 'tf-online-return',
    title: '网购七日无理由退货期',
    duration: '7日',
    category: 'economic_social',
    scenario: 'consumer',
    basisLawId: 'consumer-protection',
    basisArticle: '第25条',
    detail: '经营者采用网络、电视、电话、邮购等方式销售商品，消费者有权自收到商品之日起7日内退货，且无需说明理由（定作、鲜活易腐等除外）。',
  },
  {
    id: 'tf-divorce-cooling',
    title: '协议离婚冷静期',
    duration: '30日',
    category: 'civil_commercial',
    scenario: 'family',
    basisLawId: 'civil-code',
    basisArticle: '第1077条',
    detail: '自婚姻登记机关收到离婚登记申请之日起30日内，任何一方不愿意离婚的，可以撤回申请；期满后30日内需共同申请发给离婚证。',
  },
  {
    id: 'tf-admin-reconsideration',
    title: '申请行政复议法定期限',
    duration: '60日',
    category: 'administrative',
    scenario: 'traffic',
    basisLawId: 'admin-reconsideration',
    basisArticle: '第20条',
    detail: '公民、法人或者其他组织认为行政行为侵犯其合法权益的，可以自知道或者应当知道该行政行为之日起60日内提出行政复议申请。',
  },
  {
    id: 'tf-admin-litigation',
    title: '直接提起行政诉讼起诉期限',
    duration: '6个月',
    category: 'procedural',
    scenario: 'traffic',
    basisLawId: 'admin-litigation',
    basisArticle: '第46条',
    detail: '公民、法人或者其他组织直接向人民法院提起诉讼的，应当自知道或者应当知道作出行政行为之日起6个月内提出；不服复议决定的为15日内。',
  },
  {
    id: 'tf-company-capital',
    title: '新《公司法》认缴出资实缴期限',
    duration: '5年',
    category: 'civil_commercial',
    scenario: 'company',
    basisLawId: 'company-law',
    basisArticle: '第47条',
    detail: '2024年7月1日起施行的《公司法》规定，有限责任公司全体股东认缴的出资额由股东按照公司章程的规定自公司成立之日起5年内缴足。',
  },
  {
    id: 'tf-criminal-detention',
    title: '刑事拘留后提请批准逮捕期限',
    duration: '3日（可延至30日）',
    category: 'procedural',
    scenario: 'privacy',
    basisLawId: 'criminal-procedure',
    basisArticle: '第91条',
    detail: '公安机关对被拘留的人认为需要逮捕的，应当在拘留后的3日以内提请人民检察院审查批准；特殊情况下可延长1-4日，流窜/多次/结伙作案重大嫌疑分子可延长至30日。',
  },
  {
    id: 'tf-ind-tax-annual',
    title: '个人所得税综合所得年度汇算期',
    duration: '次年3月1日—6月30日',
    category: 'economic_social',
    scenario: 'labor',
    basisLawId: 'individual-income-tax',
    basisArticle: '第11条',
    detail: '居民个人取得综合所得，按年计算个人所得税；需要办理汇算清缴的，应当在取得所得的次年3月1日至6月30日内办理汇算清缴。',
  },
  {
    id: 'tf-work-injury',
    title: '工伤认定申请法定时限',
    duration: '单位30日 / 个人1年',
    category: 'economic_social',
    scenario: 'labor',
    basisLawId: 'work-injury-insurance',
    basisArticle: '第17条',
    detail: '用人单位应当自事故伤害发生之日起30日内提出工伤认定申请；用人单位未按规定提出申请的，工伤职工或其近亲属在1年内可直接向社保行政部门申请。',
  },
  {
    id: 'tf-civil-appeal',
    title: '民事判决书 / 裁定书上诉期限',
    duration: '判决15日 / 裁定10日',
    category: 'procedural',
    scenario: 'company',
    basisLawId: 'civil-procedure',
    basisArticle: '第171条',
    detail: '当事人不服地方人民法院第一审判决的，有权在判决书送达之日起15日内向上一级法院提起上诉；不服一审裁定的，上诉期为送达之日起10日内。',
  },
  {
    id: 'tf-criminal-appeal',
    title: '刑事判决与裁定上诉 / 抗诉期限',
    duration: '10日（裁定5日）',
    category: 'procedural',
    scenario: 'privacy',
    basisLawId: 'criminal-procedure',
    basisArticle: '第230条',
    detail: '不服第一审刑事判决的上诉和抗诉期限为十日，不服裁定的上诉和抗诉期限为五日，从接到判决书、裁定书的第二日起算。',
  },
  {
    id: 'tf-arb-revoke',
    title: '申请撤销商事仲裁裁决期限',
    duration: '收到裁决书之日起6个月',
    category: 'procedural',
    scenario: 'company',
    basisLawId: 'arbitration-law',
    basisArticle: '第59条',
    detail: '当事人提出证据证明商事仲裁裁决有法定可撤销情形的，应当自收到裁决书之日起六个月内向仲裁委员会所在地的中级人民法院申请撤销裁决。',
  },
  {
    id: 'tf-prepay-refund',
    title: '预付式消费违约退款与“七日冷静期”',
    duration: '自付款之日起7日内',
    category: 'economic_social',
    scenario: 'consumer',
    basisLawId: 'consumer-protection',
    basisArticle: '第53条',
    detail: '经营者以预收款方式提供商品或服务未按约定提供的，应当按消费者要求履行约定或退回预付款并承担利息与合理费用；未消费且适用冷静期规则的可依约全额退款。',
  },
  {
    id: 'tf-domestic-violence-ppo',
    title: '人身安全保护令裁定与有效期',
    duration: '72小时（紧急24小时）/ 有效6个月',
    category: 'civil_commercial',
    scenario: 'family',
    basisLawId: 'anti-domestic-violence',
    basisArticle: '第28条',
    detail: '人民法院受理人身安全保护令申请后，应当在72小时内作出裁定；情况紧急的应当在24小时内作出，保护令有效期不超过6个月，期满前可申请撤销、变更或延长。',
  },
];

export const LAW_DOCUMENTS: LawDocument[] = [
  {
    id: 'constitution',
    title: '中华人民共和国宪法',
    shortTitle: '宪法',
    category: 'constitution',
    scenarios: ['family', 'privacy', 'labor'],
    authority: '全国人民代表大会',
    effectiveDate: '2018-03-11 修正施行',
    lawRefPath: '宪法/宪法.md',
    articlesCountHint: '共4章 · 143条',
    tags: ['根本大法', '公民权利', '国家机构', '法治国家'],
    articles: [
      {
        id: 'con-1',
        chapter: '第一章 总纲',
        number: '第1条',
        content: '中华人民共和国是工人阶级领导的、以工农联盟为基础的人民民主专政的社会主义国家。社会主义制度是中华人民共和国的根本制度。中国共产党领导是中国特色社会主义最本质的特征。禁止任何组织或者个人破坏社会主义制度。',
        summary: '确立国家根本制度与国家性质。',
      },
      {
        id: 'con-5',
        chapter: '第一章 总纲',
        number: '第5条',
        content: '中华人民共和国实行依法治国，建设社会主义法治国家。国家维护社会主义法制的统一和尊严。一切法律、行政法规和地方性法规都不得同宪法相抵触。一切国家机关和武装力量、各政党和各社会团体、各企业事业组织都必须遵守宪法和法律。',
        summary: '明确依法治国基本方略与宪法最高法律效力。',
      },
      {
        id: 'con-33',
        chapter: '第二章 公民的基本权利和义务',
        number: '第33条',
        content: '凡具有中华人民共和国国籍的人都是中华人民共和国公民。中华人民共和国公民在法律面前一律平等。国家尊重和保障人权。任何公民享有宪法和法律规定的权利，同时必须履行宪法和法律规定的义务。',
        summary: '公民在法律面前一律平等；国家尊重和保障人权。',
      },
      {
        id: 'con-37',
        chapter: '第二章 公民的基本权利和义务',
        number: '第37条',
        content: '中华人民共和国公民的人身自由不受侵犯。任何公民，非经人民检察院批准或者决定或者人民法院决定，并由公安机关执行，不受逮捕。禁止非法拘禁和以其他方法非法剥夺或者限制公民的人身自由，禁止非法搜查公民的身体。',
        summary: '保护公民人身自由权。',
      },
      {
        id: 'con-38',
        chapter: '第二章 公民的基本权利和义务',
        number: '第38条',
        content: '中华人民共和国公民的人格尊严不受侵犯。禁止用任何方法对公民进行侮辱、诽谤和诬告陷害。',
        summary: '保护公民人格尊严不受侵犯。',
      },
      {
        id: 'con-40',
        chapter: '第二章 公民的基本权利和义务',
        number: '第40条',
        content: '中华人民共和国公民的通信自由和通信秘密受法律的保护。除因国家安全或者追查刑事犯罪的需要，由公安机关或者检察机关依照法律规定的程序对通信进行检查外，任何组织或者个人不得以任何理由侵犯公民的通信自由和通信秘密。',
        summary: '通信自由和通信秘密受宪法保护。',
      },
      {
        id: 'con-42',
        chapter: '第二章 公民的基本权利和义务',
        number: '第42条',
        content: '中华人民共和国公民有劳动的权利和义务。国家通过各种途径，创造劳动就业条件，加强劳动保护，改善劳动条件，并在发展生产的基础上，提高劳动报酬和福利待遇。',
        summary: '公民享有劳动权利和劳动保护。',
      },
    ],
  },
  {
    id: 'legislation-law',
    title: '中华人民共和国立法法',
    shortTitle: '立法法',
    category: 'constitution',
    scenarios: ['company', 'labor'],
    authority: '全国人民代表大会',
    effectiveDate: '2023-03-15 修正施行',
    lawRefPath: '宪法相关法/立法法.md',
    articlesCountHint: '共6章 · 120条',
    tags: ['法律位阶', '宪法审查', '法治统一', '备案审查'],
    articles: [
      {
        id: 'leg-88',
        chapter: '第五章 适用与备案审查',
        number: '第98条',
        content: '宪法具有最高的法律效力，一切法律、行政法规、地方性法规、自治条例和单行条例、规章都不得同宪法相抵触。',
        summary: '确立宪法至上原则。',
      },
      {
        id: 'leg-99',
        chapter: '第五章 适用与备案审查',
        number: '第99条',
        content: '法律的效力高于行政法规、地方性法规、规章。行政法规的效力高于地方性法规、规章。',
        summary: '明确法律、行政法规、地方法规和规章的效力层级。',
      },
      {
        id: 'leg-103',
        chapter: '第五章 适用与备案审查',
        number: '第103条',
        content: '同一机关制定的法律、行政法规、地方性法规、自治条例和单行条例、规章，特别规定与一般规定不一致的，适用特别规定；新的规定与旧的规定不一致的，适用新的规定。',
        summary: '特别法优于一般法，新法优于旧法原则。',
      },
    ],
  },
  {
    id: 'civil-code',
    title: '中华人民共和国民法典',
    shortTitle: '民法典',
    category: 'civil_commercial',
    scenarios: ['housing', 'family', 'privacy', 'consumer', 'traffic', 'company'],
    authority: '全国人民代表大会',
    effectiveDate: '2021-01-01 施行',
    lawRefPath: '民法典/民法典.md',
    articlesCountHint: '共7编 · 1260条',
    tags: ['社会生活百科全书', '物权', '合同', '人格权', '婚姻家庭', '侵权责任', '诉讼时效', '高空抛物', '冷静期'],
    articles: [
      {
        id: 'cc-1',
        chapter: '第一编 总则',
        number: '第1条',
        content: '为了保护民事主体的合法权益，调整民事关系，维护社会和经济秩序，适应中国特色社会主义发展要求，弘扬社会主义核心价值观，根据宪法，制定本法。',
        summary: '确立民事权益保护宗旨。',
      },
      {
        id: 'cc-7',
        chapter: '第一编 总则',
        number: '第7条',
        content: '民事主体从事民事活动，应当遵循诚信原则，秉持诚实，恪守承诺。',
        summary: '民法“帝王条款”——诚实信用原则。',
      },
      {
        id: 'cc-184',
        chapter: '第一编 总则 · 民事责任',
        number: '第184条',
        content: '因自愿实施紧急救助行为造成受助人损害的，救助人不承担民事责任。',
        summary: '“好人条款”，免除见义勇为者一般救助过失的民事赔偿责任。',
      },
      {
        id: 'cc-188',
        chapter: '第一编 总则 · 诉讼时效',
        number: '第188条',
        content: '向人民法院请求保护民事权利的诉讼时效期间为三年。法律另有规定的，依照其规定。诉讼时效期间自权利人知道或者应当知道权利受到损害以及义务人之日起计算。但是，自权利受到损害之日起超过二十年的，人民法院不予保护。',
        summary: '一般民事诉讼时效为3年，最长权利保护期为20年。',
      },
      {
        id: 'cc-278',
        chapter: '第二编 物权 · 业主的建筑物区分所有权',
        number: '第278条',
        content: '下列事项由业主共同决定：（一）制定和修改业主大会议事规则；（二）制定和修改管理规约；（三）选举业主委员会或者更换业主委员会成员……业主共同决定事项，应当由专有部分面积占比三分之二以上的业主且人数占比三分之二以上的业主参与表决。',
        summary: '小区业委会选举与物业大事表决门槛（双三分之二参与）。',
      },
      {
        id: 'cc-366',
        chapter: '第二编 物权 · 居住权',
        number: '第366条',
        content: '居住权人有权按照合同约定，对他人的住宅享有占有、使用的用益物权，以满足生活居住的需要。',
        summary: '创设“居住权”用益物权，登记设立后可对抗第三人。',
      },
      {
        id: 'cc-577',
        chapter: '第三编 合同',
        number: '第577条',
        content: '当事人一方不履行合同义务或者履行合同义务不符合约定的，应当承担继续履行、采取补救措施或者赔偿损失等违约责任。',
        summary: '明确违约责任三大核心救济方式。',
      },
      {
        id: 'cc-680',
        chapter: '第三编 合同 · 借款合同',
        number: '第680条',
        content: '禁止高利放贷，借款的利率不得违反国家有关规定。借款合同对支付利息没有约定的，视为没有利息。自然人之间借款对支付利息约定不明的，视为没有利息。',
        summary: '禁止高利贷；自然人借贷未约定利息视为无息。',
      },
      {
        id: 'cc-726',
        chapter: '第三编 合同 · 租赁合同',
        number: '第726条',
        content: '出租人出卖租赁房屋的，应当在出卖之前的合理期限内通知承租人，承租人享有以同等条件优先购买的权利；但是，房屋按份共有人行使优先购买权或者出租人将房屋出卖给近亲属的除外。',
        summary: '确立“买卖不破租赁”与承租人同等条件优先购买权。',
      },
      {
        id: 'cc-1019',
        chapter: '第四编 人格权 · 肖像权与深度伪造',
        number: '第1019条',
        content: '任何组织或者个人不得以丑化、污损，或者利用信息技术手段伪造等方式侵害他人的肖像权。未经肖像权人同意，不得制作、使用、公开肖像权人的肖像，但是法律另有规定的除外。',
        summary: '严禁AI换脸等深度伪造侵害肖像权。',
      },
      {
        id: 'cc-1023',
        chapter: '第四编 人格权 · 声音保护',
        number: '第1023条',
        content: '对自然人声音的保护，参照适用肖像权保护的有关规定。',
        summary: '首次将自然人声音权纳入人格权体系予以单独保护。',
      },
      {
        id: 'cc-1032',
        chapter: '第四编 人格权 · 隐私权与个人信息',
        number: '第1032条',
        content: '自然人享有隐私权。任何组织或者个人不得以刺探、侵扰、泄露、公开等方式侵害他人的隐私权。隐私是自然人的私人生活安宁和不愿为他人知晓的私密空间、私密活动、私密信息。',
        summary: '界定隐私权与私人生活安宁保护范围。',
      },
      {
        id: 'cc-1064',
        chapter: '第五编 婚姻家庭 · 夫妻共同债务',
        number: '第1064条',
        content: '夫妻双方共同签名或者夫妻一方事后追认等共同意思表示所负的债务，以及夫妻一方在婚姻关系存续期间以个人名义为家庭日常生活需要所负的债务，属于夫妻共同债务。超出家庭日常生活需要所负的债务，不属于夫妻共同债务。',
        summary: '确立“共债共签”及家事日常代理共同债务边界。',
      },
      {
        id: 'cc-1077',
        chapter: '第五编 婚姻家庭 · 离婚',
        number: '第1077条',
        content: '自婚姻登记机关收到离婚登记申请之日起三十日内，任何一方不愿意离婚的，可以向婚姻登记机关撤回离婚登记申请。前款规定期限届满后三十日内，双方应当亲自到婚姻登记机关申请发给离婚证；未申请的，视为撤回离婚登记申请。',
        summary: '规定30天协议离婚冷静期及领证期间规则。',
      },
      {
        id: 'cc-1127',
        chapter: '第六编 继承 · 法定继承顺序',
        number: '第1127条',
        content: '遗产按照下列顺序继承：（一）第一顺序：配偶、子女、父母；（二）第二顺序：兄弟姐妹、祖父母、外祖父母。继承开始后，由第一顺序继承人继承，第二顺序继承人不继承。',
        summary: '明确第一、第二顺序法定继承人范围。',
      },
      {
        id: 'cc-1195',
        chapter: '第七编 侵权责任 · 网络侵权避风港',
        number: '第1195条',
        content: '网络用户利用网络服务实施侵权行为的，权利人有权通知网络服务提供者采取删除、屏蔽、断开链接等必要措施。网络服务提供者接到通知后，应当及时将该通知转送相关网络用户，并根据构成侵权的初步证据和服务类型采取必要措施。',
        summary: '规范网络侵权“通知—删除”与反通知规则。',
      },
      {
        id: 'cc-1254',
        chapter: '第七编 侵权责任 · 物件损害',
        number: '第1254条',
        content: '禁止从建筑物中抛掷物品。从建筑物中抛掷物品或者从建筑物上坠落的物品造成他人损害的，由侵权人依法承担侵权责任；经调查难以确定具体侵权人的，除能够证明自己不是侵权人的外，由可能加害的建筑物使用人给予补偿。公安等机关应当依法及时调查，查清责任人。',
        summary: '严禁高空抛物，明确公安机关查清责任人的调查义务。',
      },
    ],
  },
  {
    id: 'company-law',
    title: '中华人民共和国公司法',
    shortTitle: '公司法',
    category: 'civil_commercial',
    scenarios: ['company', 'labor'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2024-07-01 施行（2023修订）',
    lawRefPath: '民商法/公司法.md',
    articlesCountHint: '共15章 · 266条',
    tags: ['五年认缴实缴', '股东出资', '董监高信义义务', '公司治理'],
    articles: [
      {
        id: 'comp-23',
        chapter: '第一章 总则',
        number: '第23条',
        content: '公司股东滥用公司法人独立地位和股东有限责任，逃避债务，严重损害公司债权人利益的，应当对公司债务承担连带责任。只有一个股东的公司，股东不能证明公司财产独立于股东自己的财产的，应当对公司债务承担连带责任。',
        summary: '公司法人人格否认（刺破公司面纱）及一人公司举证倒置。',
      },
      {
        id: 'comp-47',
        chapter: '第三章 有限责任公司的设立和组织机构',
        number: '第47条',
        content: '有限责任公司的注册资本为在公司登记机关登记的全体股东认缴的出资额。全体股东认缴的出资额由股东按照公司章程的规定自公司成立之日起五年内缴足。',
        summary: '新增有限责任公司股东认缴出资“五年实缴期限”。',
      },
      {
        id: 'comp-54',
        chapter: '第三章 股东出资加速到期',
        number: '第54条',
        content: '公司不能清偿到期债务的，公司或者已到期债权的债权人有权要求已认缴出资但未届出资期限的股东提前缴纳出资。',
        summary: '明确非破产情形下债权人可要求股东出资加速到期。',
      },
      {
        id: 'comp-180',
        chapter: '第八章 董监高的资格和义务',
        number: '第180条',
        content: '董事、监事、高级管理人员对公司负有忠实义务，应当采取措施避免自身利益与公司利益冲突，不得利用职权牟取不正当利益。对公司负有勤勉义务，执行职务应当为公司的最大利益尽到管理者通常应有的合理注意。',
        summary: '强化董事、监事与高管的忠实义务及勤勉义务标准。',
      },
    ],
  },
  {
    id: 'copyright-law',
    title: '中华人民共和国著作权法',
    shortTitle: '著作权法',
    category: 'civil_commercial',
    scenarios: ['company', 'privacy'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2021-06-01 施行',
    lawRefPath: '民商法/著作权法.md',
    articlesCountHint: '共6章 · 67条',
    tags: ['知识产权', '版权保护', '合理使用', '惩罚性赔偿'],
    articles: [
      {
        id: 'copy-3',
        chapter: '第一章 总则',
        number: '第3条',
        content: '本法所称的作品，是指文学、艺术和科学领域内具有独创性并能以一定形式表现的智力成果，包括文字、口述、音乐、戏剧、美术、视听、计算机软件以及符合作品特征的其他智力成果。',
        summary: '定义受著作权保护的“独创性智力成果”开放式范围。',
      },
      {
        id: 'copy-24',
        chapter: '第二章 著作权 · 合理使用',
        number: '第24条',
        content: '为个人学习、研究或者欣赏使用他人已经发表的作品，或者为介绍、评论某一作品或者说明某一问题在作品中适当引用，可以不经著作权人许可，不向其支付报酬，但应当指明作者姓名或者名称、作品名称。',
        summary: '明确“合理使用”法定情形，免责但不得影响正常使用。',
      },
      {
        id: 'copy-54',
        chapter: '第五章 法律责任',
        number: '第54条',
        content: '故意侵犯著作权或者与著作权有关的权利，情节严重的，可以在按照规定确定数额的一倍以上五倍以下给予赔偿。法定赔偿上限为五百万元。',
        summary: '引入知识产权1-5倍惩罚性赔偿及500万元法定赔偿上限。',
      },
    ],
  },
  {
    id: 'unfair-competition',
    title: '中华人民共和国反不正当竞争法',
    shortTitle: '反不正当竞争法',
    category: 'civil_commercial',
    scenarios: ['company', 'consumer'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2019-04-23 修正施行',
    lawRefPath: '民商法/反不正当竞争法.md',
    articlesCountHint: '共5章 · 33条',
    tags: ['商业秘密', '虚假宣传', '刷单炒信', '竞业合规'],
    articles: [
      {
        id: 'uc-8',
        chapter: '第二章 不正当竞争行为',
        number: '第8条',
        content: '经营者不得对其商品的性能、功能、质量、销售状况、用户评价、曾获荣誉等作虚假或者引人误解的商业宣传，欺骗、误导消费者。不得通过组织虚假交易等方式帮助其他经营者进行虚假宣传。',
        summary: '严厉规制网络“刷单炒信”及虚构好评等虚假宣传行为。',
      },
      {
        id: 'uc-9',
        chapter: '第二章 商业秘密保护',
        number: '第9条',
        content: '经营者不得以盗窃、贿赂、欺诈、胁迫、电子侵入或者其他不正当手段获取权利人的商业秘密，或者违反保密义务披露、使用商业秘密。',
        summary: '界定商业秘密侵权及电子侵入窃密责任。',
      },
    ],
  },
  {
    id: 'people-mediation',
    title: '中华人民共和国人民调解法',
    shortTitle: '人民调解法',
    category: 'civil_commercial',
    scenarios: ['housing', 'family', 'labor'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2011-01-01 施行',
    lawRefPath: '民法/人民调解法.md',
    articlesCountHint: '共6章 · 35条',
    tags: ['免费调解', '司法确认', '邻里纠纷', '快速解纷'],
    articles: [
      {
        id: 'med-4',
        chapter: '第一章 总则',
        number: '第4条',
        content: '人民调解委员会调解民间纠纷，不收取任何费用。',
        summary: '明确人民调解公益免费属性。',
      },
      {
        id: 'med-33',
        chapter: '第四章 调解协议',
        number: '第33条',
        content: '经人民调解委员会调解达成调解协议后，双方当事人认为有必要的，可以自调解协议生效之日起三十日内共同向人民法院申请司法确认，人民法院应当及时审查并依法确认其效力。',
        summary: '调解协议经法院司法确认后可直接申请强制执行。',
      },
    ],
  },
  {
    id: 'criminal-law',
    title: '中华人民共和国刑法',
    shortTitle: '刑法',
    category: 'criminal',
    scenarios: ['traffic', 'privacy', 'company'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2024-03-01 施行（修正案十二）',
    lawRefPath: '刑法/刑法.md',
    articlesCountHint: '总则+分则 · 452条',
    tags: ['罪刑法定', '正当防卫', '诈骗罪', '危险驾驶', '帮信罪', '侵犯公民个人信息'],
    articles: [
      {
        id: 'cr-3',
        chapter: '第一编 总则 · 基本原则',
        number: '第3条',
        content: '法律明文规定为犯罪行为的，依照法律定罪处刑；法律没有明文规定为犯罪行为的，不得定罪处刑。',
        summary: '罪刑法定原则，防止法外入罪。',
      },
      {
        id: 'cr-20',
        chapter: '第一编 总则 · 正当防卫',
        number: '第20条',
        content: '为了使国家、公共利益、本人或者他人的人身、财产和其他权利免受正在进行的不法侵害，而采取的制止不法侵害的行为，对不法侵害人造成损害的，属于正当防卫，不负刑事责任。对正在进行行凶、杀人、抢劫、强奸、绑架以及其他严重危及人身安全的暴力犯罪，采取防卫行为，造成不法侵害人伤亡的，不属于防卫过当，不负刑事责任。',
        summary: '确立一般防卫与第3款特殊无限防卫权（“法不能向不法让步”）。',
      },
      {
        id: 'cr-133-1',
        chapter: '第二编 分则 · 危害公共安全罪',
        number: '第133条之一',
        content: '在道路上驾驶机动车，有追逐竞驶情节恶劣、醉酒驾驶机动车、从事校车/旅客运输严重超过额定乘员或严重超速、违反危化品安全管理规定危及公共安全等情形之一的，处拘役，并处罚金。',
        summary: '规定危险驾驶罪（飙车、醉驾等）的入刑标准。',
      },
      {
        id: 'cr-253-1',
        chapter: '第二编 分则 · 侵犯公民人身民主权利罪',
        number: '第253条之一',
        content: '违反国家有关规定，向他人出售或者提供公民个人信息，情节严重的，处三年以下有期徒刑或者拘役，并处或者单处罚金；情节特别严重的，处三年以上七年以下有期徒刑，并处罚金。',
        summary: '严厉打击非法获取、出售公民个人信息犯罪。',
      },
      {
        id: 'cr-266',
        chapter: '第二编 分则 · 侵犯财产罪',
        number: '第266条',
        content: '诈骗公私财物，数额较大的，处三年以下有期徒刑、拘役或者管制，并处或者单处罚金；数额巨大或者有其他严重情节的，处三年以上十年以下有期徒刑，并处罚金；数额特别巨大或者有其他特别严重情节的，处十年以上有期徒刑或者无期徒刑。',
        summary: '诈骗罪构成要件与三档量刑幅度。',
      },
      {
        id: 'cr-287-2',
        chapter: '第二编 分则 · 妨害社会管理秩序罪',
        number: '第287条之二',
        content: '明知他人利用信息网络实施犯罪，为其犯罪提供互联网接入、服务器托管、网络存储、通讯传输等技术支持，或者提供广告推广、支付结算等帮助，情节严重的，处三年以下有期徒刑或者拘役，并处或者单处罚金。',
        summary: '“帮信罪”条款：出借银行卡/电话卡跑分或提供技术帮助均可构罪。',
      },
    ],
  },
  {
    id: 'anti-telecom-fraud',
    title: '中华人民共和国反电信网络诈骗法',
    shortTitle: '反电信网络诈骗法',
    category: 'criminal',
    scenarios: ['privacy', 'consumer'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2022-12-01 施行',
    lawRefPath: '行政法/反电信网络诈骗法.md',
    articlesCountHint: '共7章 · 50条',
    tags: ['两卡治理', '止付冻结', '电诈惩戒', '个人信用'],
    articles: [
      {
        id: 'atf-25',
        chapter: '第四章 综合治理',
        number: '第25条',
        content: '任何单位和个人不得为电信网络诈骗活动提供支持或者帮助。禁止非法买卖、出租、出借电话卡、物联网卡、电信线路、短信端口、银行账户、支付账户、互联网账号等。',
        summary: '严禁出租、出借电话卡与银行卡，违者将面临金融与通信惩戒。',
      },
      {
        id: 'atf-31',
        chapter: '第四章 综合治理',
        number: '第31条',
        content: '对经设区的市级以上公安机关认定的实施前款行为的单位和个人，可以按照国家有关规定记入信用记录，采取限制其有关卡、账户、账号等功能和停止非柜面业务、暂停新业务、限制入网等措施。',
        summary: '建立涉诈人员联合信用惩戒与异议申诉机制。',
      },
    ],
  },
  {
    id: 'admin-penalty',
    title: '中华人民共和国行政处罚法',
    shortTitle: '行政处罚法',
    category: 'administrative',
    scenarios: ['traffic', 'company', 'consumer'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2021-07-15 施行',
    lawRefPath: '行政法/行政处罚法.md',
    articlesCountHint: '共8章 · 86条',
    tags: ['首违不罚', '轻微不罚', '听证权', '程序正当', '执法亮证'],
    articles: [
      {
        id: 'ap-33',
        chapter: '第四章 行政处罚的管辖和适用',
        number: '第33条',
        content: '违法行为轻微并及时改正，没有造成危害后果的，不予行政处罚。初次违法且危害后果轻微并及时改正的，可以不予行政处罚。当事人有证据足以证明没有主观过错的，不予行政处罚。',
        summary: '确立“首违不罚”、“轻微不罚”与无主观过错不罚柔性执法规则。',
      },
      {
        id: 'ap-42',
        chapter: '第五章 行政处罚的决定',
        number: '第42条',
        content: '行政处罚应当由具有行政执法资格的执法人员实施。执法人员不得少于两人，法律另有规定的除外。执法人员在调查或者进行检查时，应当主动向当事人或者有关人员出示执法证件。',
        summary: '执法“双人亮证”法定程序底线。',
      },
      {
        id: 'ap-63',
        chapter: '第五章 听证程序',
        number: '第63条',
        content: '行政机关拟作出较大数额罚款、没收较大数额违法所得、降低资质等级、吊销许可证件、责令停产停业等行政处罚决定之前，应当告知当事人有要求举行听证的权利。',
        summary: '重罚告知听证权，保障当事人陈述申辩权利。',
      },
    ],
  },
  {
    id: 'admin-reconsideration',
    title: '中华人民共和国行政复议法',
    shortTitle: '行政复议法',
    category: 'administrative',
    scenarios: ['traffic', 'company', 'housing'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2024-01-01 施行（2023修订）',
    lawRefPath: '行政法/行政复议法.md',
    articlesCountHint: '共7章 · 90条',
    tags: ['化解行政争议主渠道', '60日申请', '电子送达', '调解和解'],
    articles: [
      {
        id: 'ar-11',
        chapter: '第二章 行政复议申请',
        number: '第11条',
        content: '公民、法人或者其他组织对行政机关作出的行政处罚、行政强制措施、行政许可决定、行政确认、不依法履行法定职责等十五类行政行为不服的，可以依照本法申请行政复议。',
        summary: '大幅扩大行政复议受案范围，涵盖行政协议与工伤认定等。',
      },
      {
        id: 'ar-20',
        chapter: '第二章 申请期限',
        number: '第20条',
        content: '公民、法人或者其他组织认为行政行为侵犯其合法权益的，可以自知道或者应当知道该行政行为之日起六十日内提出行政复议申请；但是法律规定的申请期限超过六十日的除外。',
        summary: '明确行政复议申请期限一般为60日，且行政机关不得收取任何费用。',
      },
      {
        id: 'ar-73',
        chapter: '第五章 行政复议决定',
        number: '第73条',
        content: '当事人经调解达成协议的，行政复议机关应当制作行政复议调解书，经各方当事人签字或者盖章并加盖行政复议机关印章，即具有法律效力。',
        summary: '确立行政复议调解全流程适用与调解书强制执行力。',
      },
    ],
  },
  {
    id: 'public-security-penalty',
    title: '中华人民共和国治安管理处罚法',
    shortTitle: '治安管理处罚法',
    category: 'administrative',
    scenarios: ['housing', 'privacy', 'traffic'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2013-01-01 施行',
    lawRefPath: '行政法/治安管理处罚法.md',
    articlesCountHint: '共6章 · 119条',
    tags: ['治安拘留', '殴打他人', '偷拍隐私', '扰乱秩序'],
    articles: [
      {
        id: 'psp-42',
        chapter: '第三章 违反治安管理的行为和处罚',
        number: '第42条',
        content: '有写恐吓信威胁他人人身安全、公然侮辱或者捏造事实诽谤他人、多次发送淫秽/侮辱/恐吓信息干扰他人正常生活、偷窥/偷拍/窃听/散布他人隐私等行为之一的，处五日以下拘留或者五百元以下罚款；情节较重的，处五日以上十日以下拘留，可以并处五百元以下罚款。',
        summary: '严厉打击偷拍偷窥、网络骚扰与恐吓辱骂行为。',
      },
      {
        id: 'psp-43',
        chapter: '第三章 违反治安管理的行为和处罚',
        number: '第43条',
        content: '殴打他人的，或者故意伤害他人身体的，处五日以上十日以下拘留，并处二百元以上五百元以下罚款；情节较轻的，处五日以下拘留或者五百元以下罚款。结伙殴打或殴打弱势群体的加重处罚。',
        summary: '规定一般殴打伤害治安处罚标准。',
      },
    ],
  },
  {
    id: 'road-traffic-safety',
    title: '中华人民共和国道路交通安全法',
    shortTitle: '道路交通安全法',
    category: 'administrative',
    scenarios: ['traffic'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2021-04-29 修正施行',
    lawRefPath: '行政法/道路交通安全法.md',
    articlesCountHint: '共8章 · 124条',
    tags: ['交通事故', '无责赔付10%', '交强险', '酒驾扣证'],
    articles: [
      {
        id: 'rts-76',
        chapter: '第五章 交通事故处理',
        number: '第76条',
        content: '机动车发生交通事故造成人身伤亡、财产损失的，由保险公司在机动车第三者责任强制保险责任限额范围内予以赔偿；不足的部分，机动车与非机动车驾驶人、行人之间发生交通事故，非机动车驾驶人、行人没有过错的，由机动车一方承担赔偿责任；有证据证明非机动车驾驶人、行人有过错的，根据过错程度适当减轻机动车一方的赔偿责任；机动车一方没有过错的，承担不超过百分之十的赔偿责任。',
        summary: '确立交强险优先赔付及“优者危险负担”（机动车无责最高10%）规则。',
      },
      {
        id: 'rts-91',
        chapter: '第七章 法律责任 · 酒驾醉驾',
        number: '第91条',
        content: '饮酒后驾驶机动车的，处暂扣六个月机动车驾驶证，并处一千元以上二千元以下罚款。醉酒驾驶机动车的，由公安机关交通管理部门约束至酒醒，吊销机动车驾驶证，依法追究刑事责任；五年内不得重新取得机动车驾驶证。',
        summary: '明确饮酒驾驶与醉酒驾驶的行政及刑事双罚尺度。',
      },
    ],
  },
  {
    id: 'state-compensation',
    title: '中华人民共和国国家赔偿法',
    shortTitle: '国家赔偿法',
    category: 'administrative',
    scenarios: ['company'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2013-01-01 施行',
    lawRefPath: '行政法/国家赔偿法.md',
    articlesCountHint: '共6章 · 42条',
    tags: ['错案赔偿', '侵犯人身自由', '精神损害抚慰金'],
    articles: [
      {
        id: 'sc-2',
        chapter: '第一章 总则',
        number: '第2条',
        content: '国家机关和国家机关工作人员行使职权，有本法规定的侵犯公民、法人和其他组织合法权益的情形，造成损害的，受害人有依照本法取得国家赔偿的权利。',
        summary: '国家机关违法行使职权致害的法定赔偿原则。',
      },
      {
        id: 'sc-33',
        chapter: '第四章 赔偿方式和计算标准',
        number: '第33条',
        content: '侵犯公民人身自由的，每日赔偿金按照国家上年度职工日平均工资计算。',
        summary: '逐年上调的侵犯人身自由国家赔偿日计算标准。',
      },
    ],
  },
  {
    id: 'labor-law',
    title: '中华人民共和国劳动法',
    shortTitle: '劳动法',
    category: 'economic_social',
    scenarios: ['labor'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2018-12-29 修正施行',
    lawRefPath: '社会法/劳动法.md',
    articlesCountHint: '共13章 · 107条',
    tags: ['8小时工作制', '加班费1.5/2/3倍', '带薪年休假', '劳动仲裁1年'],
    articles: [
      {
        id: 'lab-36',
        chapter: '第四章 工作时间和休息休假',
        number: '第36条',
        content: '国家实行劳动者每日工作时间不超过八小时、平均每周工作时间不超过四十四小时的工时制度。',
        summary: '标准工时制法定底线。',
      },
      {
        id: 'lab-44',
        chapter: '第四章 加班工资',
        number: '第44条',
        content: '安排劳动者延长工作时间的，支付不低于工资的百分之一百五十的工资报酬；休息日安排劳动者工作又不能安排补休的，支付不低于工资的百分之二百的工资报酬；法定休假日安排劳动者工作的，支付不低于工资的百分之三百的工资报酬。',
        summary: '确立平时1.5倍、周末2倍、法定节假日3倍加班费标准。',
      },
      {
        id: 'lab-82',
        chapter: '第十章 劳动争议',
        number: '第82条',
        content: '提出仲裁要求的一方应当自劳动争议发生之日起六十日内向劳动争议仲裁委员会提出书面申请。（注：依据《劳动争议调解仲裁法》第27条，现行劳动争议申请仲裁时效期间为一年。）',
        summary: '劳动争议仲裁申请时效规则（现行1年）。',
      },
    ],
  },
  {
    id: 'labor-contract-law',
    title: '中华人民共和国劳动合同法',
    shortTitle: '劳动合同法',
    category: 'economic_social',
    scenarios: ['labor'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2013-07-01 施行',
    lawRefPath: '社会法/劳动合同法.md',
    articlesCountHint: '共8章 · 98条',
    tags: ['未签合同双倍工资', '试用期', '竞业限制', '经济补偿N+1', '违法辞退2N'],
    articles: [
      {
        id: 'lcl-10',
        chapter: '第二章 劳动合同的订立',
        number: '第10条',
        content: '建立劳动关系，应当订立书面劳动合同。已建立劳动关系，未同时订立书面劳动合同的，应当自用工之日起一个月内订立书面劳动合同。',
        summary: '入职1个月内必须订立书面劳动合同。',
      },
      {
        id: 'lcl-19',
        chapter: '第二章 试用期规定',
        number: '第19条',
        content: '劳动合同期限三个月以上不满一年的，试用期不得超过一个月；一年以上不满三年的，不得超过二个月；三年以上固定期限和无固定期限的劳动合同，试用期不得超过六个月。同一用人单位与同一劳动者只能约定一次试用期。',
        summary: '试用期最长期限及“只能约定一次”红线。',
      },
      {
        id: 'lcl-24',
        chapter: '第二章 竞业限制',
        number: '第24条',
        content: '竞业限制的人员限于用人单位的高级管理人员、高级技术人员和其他负有保密义务的人员。在解除或者终止劳动合同后，竞业限制期限不得超过二年。',
        summary: '限定竞业限制主体范围及最长2年期限，需按月给付经济补偿。',
      },
      {
        id: 'lcl-47',
        chapter: '第四章 劳动合同的解除和终止',
        number: '第47条',
        content: '经济补偿按劳动者在本单位工作的年限，每满一年支付一个月工资的标准向劳动者支付。六个月以上不满一年的，按一年计算；不满六个月的，向劳动者支付半个月工资的经济补偿。',
        summary: '规定经济补偿“N”的标准计算方式。',
      },
      {
        id: 'lcl-82',
        chapter: '第七章 法律责任',
        number: '第82条',
        content: '用人单位自用工之日起超过一个月不满一年未与劳动者订立书面劳动合同的，应当向劳动者每月支付二倍的工资。',
        summary: '未签书面劳动合同最高11个月双倍工资赔付规则。',
      },
      {
        id: 'lcl-87',
        chapter: '第七章 违法解除赔偿',
        number: '第87条',
        content: '用人单位违反本法规定解除或者终止劳动合同的，应当依照本法第四十七条规定的经济补偿标准的二倍向劳动者支付赔偿金。',
        summary: '违法辞退/违法解除劳动合同需支付2N赔偿金。',
      },
    ],
  },
  {
    id: 'social-insurance-law',
    title: '中华人民共和国社会保险法',
    shortTitle: '社会保险法',
    category: 'economic_social',
    scenarios: ['labor'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2018-12-29 修正施行',
    lawRefPath: '社会法/社会保险法.md',
    articlesCountHint: '共12章 · 98条',
    tags: ['五险一金', '工伤先行支付', '养老保险15年', '强制参保'],
    articles: [
      {
        id: 'si-41',
        chapter: '第四章 工伤保险',
        number: '第41条',
        content: '职工所在用人单位未依法缴纳工伤保险费，发生工伤事故的，由用人单位支付工伤保险待遇。用人单位不支付的，从工伤保险基金中先行支付。',
        summary: '单位未缴工伤保险的，工伤基金“先行支付”保障职工救治。',
      },
      {
        id: 'si-58',
        chapter: '第七章 社会保险费征缴',
        number: '第58条',
        content: '用人单位应当自用工之日起三十日内为其职工向社会保险经办机构申请办理社会保险登记。',
        summary: '明确用人单位入职30日内强制办理社保登记的法定义务。',
      },
    ],
  },
  {
    id: 'individual-income-tax',
    title: '中华人民共和国个人所得税法',
    shortTitle: '个人所得税法',
    category: 'economic_social',
    scenarios: ['labor', 'company'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2019-01-01 全面施行',
    lawRefPath: '经济法/个人所得税法.md',
    articlesCountHint: '共22条 · 附税率表',
    tags: ['专项附加扣除', '年终奖', '年度汇算', '3%-45%累进税率'],
    articles: [
      {
        id: 'iit-6',
        chapter: '应纳税所得额',
        number: '第6条',
        content: '居民个人的综合所得，以每一纳税年度的收入额减除费用六万元以及专项扣除、专项附加扣除和依法确定的其他扣除后的余额，为应纳税所得额。专项附加扣除包括子女教育、继续教育、大病医疗、住房贷款利息或者住房租金、赡养老人、3岁以下婴幼儿照护。',
        summary: '明确6万元年基本减除费用及七项专项附加扣除项目。',
      },
      {
        id: 'iit-11',
        chapter: '征收管理',
        number: '第11条',
        content: '居民个人取得综合所得，按年计算个人所得税；有扣缴义务人的，由扣缴义务人按月或者按次预扣预缴税款；需要办理汇算清缴的，应当在取得所得的次年三月一日至六月三十日内办理汇算清缴。',
        summary: '个税年度汇算清缴法定窗口期为次年3月至6月。',
      },
    ],
  },
  {
    id: 'consumer-protection',
    title: '中华人民共和国消费者权益保护法',
    shortTitle: '消费者权益保护法',
    category: 'economic_social',
    scenarios: ['consumer'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2014-03-15 施行（含2024实施条例）',
    lawRefPath: '经济法/消费者权益保护法.md',
    articlesCountHint: '共8章 · 63条',
    tags: ['七天无理由退货', '退一赔三', '最低500元', '大数据杀熟'],
    articles: [
      {
        id: 'cp-25',
        chapter: '第三章 经营者的义务',
        number: '第25条',
        content: '经营者采用网络、电视、电话、邮购等方式销售商品，消费者有权自收到商品之日起七日内退货，且无需说明理由（定作、鲜活易腐、在线下载数字化商品、交付的报纸期刊除外）。',
        summary: '网购七日无理由退货核心权利（含例外情形）。',
      },
      {
        id: 'cp-55',
        chapter: '第七章 法律责任',
        number: '第55条',
        content: '经营者提供商品或者服务有欺诈行为的，应当按照消费者的要求增加赔偿其受到的损失，增加赔偿的金额为消费者购买商品的价款或者接受服务的费用的三倍；增加赔偿的金额不足五百元的，为五百元。',
        summary: '惩罚性赔偿条款（“退一赔三，不足500元按500元算”）。',
      },
    ],
  },
  {
    id: 'ecommerce-law',
    title: '中华人民共和国电子商务法',
    shortTitle: '电子商务法',
    category: 'economic_social',
    scenarios: ['consumer', 'privacy', 'company'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2019-01-01 施行',
    lawRefPath: '经济法/电子商务法.md',
    articlesCountHint: '共7章 · 89条',
    tags: ['自动续费提示', '搭售禁止', '平台连带责任', '删差评违法'],
    articles: [
      {
        id: 'ec-19',
        chapter: '第二章 电子商务经营者',
        number: '第19条',
        content: '电子商务经营者搭售商品或者服务，应当以显著方式提请消费者注意，不得将搭售商品或者服务作为默认同意的选项。',
        summary: '禁止机票酒店、软件会员等默认勾选隐蔽搭售。',
      },
      {
        id: 'ec-38',
        chapter: '第二章 平台经营者责任',
        number: '第38条',
        content: '对关系消费者生命健康的商品或者服务，电子商务平台经营者对平台内经营者的资质资格未尽到审核义务，或者对消费者未尽到安全保障义务，造成消费者损害的，依法承担相应的责任。',
        summary: '强化电商/直播平台对关系生命健康商品的安全保障审查义务。',
      },
    ],
  },
  {
    id: 'personal-info-protection',
    title: '中华人民共和国个人信息保护法',
    shortTitle: '个人信息保护法',
    category: 'economic_social',
    scenarios: ['privacy', 'consumer', 'company'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2021-11-01 施行',
    lawRefPath: '行政法/个人信息保护法.md',
    articlesCountHint: '共8章 · 74条',
    tags: ['最小必要原则', '撤回同意', '算法杀熟禁令', '人脸识别', '千万级罚单'],
    articles: [
      {
        id: 'pip-6',
        chapter: '第一章 总则',
        number: '第6条',
        content: '处理个人信息应当具有明确、合理的目的，并应当与处理目的直接相关，采取对个人权益影响最小的方式。收集个人信息，应当限于实现处理目的的最小范围，不得过度收集个人信息。',
        summary: '确立个人信息处理“最小必要”原则，禁止过度索权。',
      },
      {
        id: 'pip-24',
        chapter: '第二章 个人信息处理规则',
        number: '第24条',
        content: '个人信息处理者利用个人信息进行自动化决策，应当保证决策的透明度和结果公平、公正，不得对个人在交易价格等交易条件上实行不合理的差别待遇。通过自动化决策方式向个人进行信息推送、商业营销，应当同时提供不针对其个人特征的选项，或者向个人提供便捷的拒绝方式。',
        summary: '明令禁止大数据杀熟，并赋予用户“关闭个性化推荐”权利。',
      },
      {
        id: 'pip-26',
        chapter: '第二章 公共场所人脸识别',
        number: '第26条',
        content: '在公共场所安装图像采集、个人身份识别设备，应当为维护公共安全所必需，遵守国家有关规定，并设置显著的提示标识。所收集的个人图像、身份识别信息只能用于维护公共安全的目的，不得用于其他目的。',
        summary: '严控公共场所人脸识别装置用于商业营销。',
      },
    ],
  },
  {
    id: 'cybersecurity-law',
    title: '中华人民共和国网络安全法',
    shortTitle: '网络安全法',
    category: 'administrative',
    scenarios: ['privacy', 'company'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2017-06-01 施行',
    lawRefPath: '行政法/网络安全法.md',
    articlesCountHint: '共7章 · 79条',
    tags: ['等保制度', '数据本地化', '网络实名', '应急响应'],
    articles: [
      {
        id: 'cs-21',
        chapter: '第三章 网络运行安全',
        number: '第21条',
        content: '国家实行网络安全等级保护制度。网络运营者应当按照网络安全等级保护制度的要求，履行安全保护义务，保障网络免受干扰、破坏或者未经授权的访问，防止网络数据泄露或者被窃取、篡改。',
        summary: '确立网络安全等级保护制度（等保2.0）法定责任。',
      },
      {
        id: 'cs-41',
        chapter: '第四章 网络信息安全',
        number: '第41条',
        content: '网络运营者收集、使用个人信息，应当遵循合法、正当、必要的原则，公开收集、使用规则，明示收集、使用信息的目的、方式和范围，并经被收集者同意。',
        summary: 'App及网站“合法、正当、必要”收集用户信息底线。',
      },
    ],
  },
  {
    id: 'minors-protection',
    title: '中华人民共和国未成年人保护法',
    shortTitle: '未成年人保护法',
    category: 'economic_social',
    scenarios: ['family', 'privacy', 'consumer'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2021-06-01 施行',
    lawRefPath: '社会法/未成年人保护法.md',
    articlesCountHint: '共9章 · 132条',
    tags: ['未成年人模式', '防沉迷', '校园欺凌', '充值退费'],
    articles: [
      {
        id: 'mp-39',
        chapter: '第三章 学校保护',
        number: '第39条',
        content: '学校应当建立学生欺凌防控工作制度，对教职员工、学生等开展防治学生欺凌的教育和培训。对严重的欺凌行为，学校不得隐瞒，应当及时向公安机关、教育行政部门报告，并配合相关部门依法处理。',
        summary: '强制学校建立校园欺凌防控制度与强制报告机制。',
      },
      {
        id: 'mp-74',
        chapter: '第五章 网络保护',
        number: '第74条',
        content: '网络游戏、网络直播、网络音视频、网络社交等网络服务提供者应当针对未成年人使用其服务设置相应的时间管理、权限管理、消费管理等功能。',
        summary: '要求网络平台设立防沉迷时段管控及大额充值限额保护。',
      },
    ],
  },
  {
    id: 'civil-procedure',
    title: '中华人民共和国民事诉讼法',
    shortTitle: '民事诉讼法',
    category: 'procedural',
    scenarios: ['housing', 'family', 'consumer', 'company', 'labor'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2024-01-01 施行（2023修正）',
    lawRefPath: '诉讼与非诉讼程序法/民事诉讼法.md',
    articlesCountHint: '共4编 · 291条',
    tags: ['原告就被告', '小额诉讼一审终审', '保全担保', '诚实诉讼', '在线庭审'],
    articles: [
      {
        id: 'cp-22',
        chapter: '第一编 总则 · 管辖',
        number: '第22条',
        content: '对公民提起的民事诉讼，由被告住所地人民法院管辖；被告住所地与经常居住地不一致的，由经常居住地人民法院管辖。',
        summary: '民事地域管辖通则——“原告就被告”。',
      },
      {
        id: 'cp-67',
        chapter: '第一编 总则 · 证据',
        number: '第67条',
        content: '当事人对自己提出的主张，有责任提供证据。',
        summary: '“谁主张，谁举证”核心举证规则。',
      },
      {
        id: 'cp-165',
        chapter: '第二编 审判程序 · 小额诉讼',
        number: '第165条',
        content: '基层人民法院和它派出的法庭审理事实清楚、权利义务关系明确、争议不大的简单金钱给付民事案件，标的额为各省、自治区、直辖市上年度就业人员年平均工资百分之五十以下的，适用小额诉讼的程序审理，实行一审终审。',
        summary: '小额诉讼程序快速一审终审，大幅降低维权周期与诉讼成本。',
      },
    ],
  },
  {
    id: 'criminal-procedure',
    title: '中华人民共和国刑事诉讼法',
    shortTitle: '刑事诉讼法',
    category: 'procedural',
    scenarios: ['privacy'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2018-10-26 修正施行',
    lawRefPath: '诉讼与非诉讼程序法/刑事诉讼法.md',
    articlesCountHint: '共5编 · 308条',
    tags: ['无罪推定', '非法证据排除', '认罪认罚从宽', '取保候审'],
    articles: [
      {
        id: 'crp-12',
        chapter: '第一编 总则 · 基本原则',
        number: '第12条',
        content: '未经人民法院依法判决，对任何人都不得确定有罪。',
        summary: '无罪推定及法院统一定罪原则。',
      },
      {
        id: 'crp-56',
        chapter: '第一编 总则 · 证据',
        number: '第56条',
        content: '采用刑讯逼供等非法方法收集的犯罪嫌疑人、被告人供述和采用暴力、威胁等非法方法收集的证人证言、被害人陈述，应当予以排除。',
        summary: '严格确立非法证据排除规则。',
      },
      {
        id: 'crp-91',
        chapter: '第一编 总则 · 强制措施',
        number: '第91条',
        content: '公安机关对被拘留的人，认为需要逮捕的，应当在拘留后的三日以内，提请人民检察院审查批准。在特殊情况下，提请审查批准的时间可以延长一日至四日；流窜作案、多次作案、结伙作案的重大嫌疑分子可延长至三十日。',
        summary: '规定刑事拘留提请批捕最长“30+7=37天”黄金辩护期上限。',
      },
    ],
  },
  {
    id: 'admin-litigation',
    title: '中华人民共和国行政诉讼法',
    shortTitle: '行政诉讼法',
    category: 'procedural',
    scenarios: ['traffic', 'company'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2017-07-01 修正施行',
    lawRefPath: '诉讼与非诉讼程序法/行政诉讼法.md',
    articlesCountHint: '共10章 · 103条',
    tags: ['民告官', '举证责任倒置', '6个月起诉期', '负责人出庭'],
    articles: [
      {
        id: 'al-3',
        chapter: '第一章 总则',
        number: '第3条',
        content: '被诉行政机关负责人应当出庭应诉。不能出庭的，应当委托行政机关相应的工作人员出庭。',
        summary: '“告官见官”制度，督促行政首长出庭应诉。',
      },
      {
        id: 'al-34',
        chapter: '第五章 证据',
        number: '第34条',
        content: '被告对作出的行政行为负有举证责任，应当提供作出该行政行为的证据和所依据的规范性文件。被告不提供或者无正当理由逾期提供证据，视为没有相应证据。',
        summary: '行政诉讼核心举证责任倒置：由作出行为的行政机关承担举证责任。',
      },
    ],
  },
  {
    id: 'arbitration-law',
    title: '中华人民共和国仲裁法',
    shortTitle: '仲裁法',
    category: 'procedural',
    scenarios: ['company', 'housing'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2018-01-01 修正施行',
    lawRefPath: '诉讼与非诉讼程序法/仲裁法.md',
    articlesCountHint: '共8章 · 80条',
    tags: ['一裁终局', '商事仲裁', '协议排除法院管辖'],
    articles: [
      {
        id: 'arb-5',
        chapter: '第一章 总则',
        number: '第5条',
        content: '当事人达成仲裁协议，一方向人民法院起诉的，人民法院不予受理，但仲裁协议无效的除外。',
        summary: '有效仲裁条款“或裁或审”，直接排除法院诉讼管辖。',
      },
      {
        id: 'arb-9',
        chapter: '第一章 一裁终局',
        number: '第9条',
        content: '仲裁实行一裁终局的制度。裁决作出后，当事人就同一纠纷再申请仲裁或者向人民法院起诉的，仲裁委员会或者人民法院不予受理。',
        summary: '商事仲裁“一裁终局”，效率高于两审终审制。',
      },
      {
        id: 'arb-59',
        chapter: '第五章 申请撤销裁决',
        number: '第59条',
        content: '当事人申请撤销裁决的，应当自收到裁决书之日起六个月内提出。',
        summary: '申请撤销商事仲裁裁决的6个月法定除斥期间。',
      },
    ],
  },
  {
    id: 'labor-dispute-mediation',
    title: '中华人民共和国劳动争议调解仲裁法',
    shortTitle: '劳动争议调解仲裁法',
    category: 'procedural',
    scenarios: ['labor'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2008-05-01 施行',
    lawRefPath: '诉讼与非诉讼程序法/劳动争议调解仲裁法.md',
    articlesCountHint: '共4章 · 54条',
    tags: ['劳动仲裁免费', '一裁终局', '举证责任', '先予执行'],
    articles: [
      {
        id: 'ldm-6',
        chapter: '第一章 总则 · 举证',
        number: '第6条',
        content: '发生劳动争议，当事人对自己提出的主张，有责任提供证据。与争议事项有关的证据属于用人单位掌握管理的，用人单位应当提供；用人单位不提供的，应当承担不利后果。',
        summary: '考勤表、工资单、入职档案由单位掌管，不提供须承担败诉不利后果。',
      },
      {
        id: 'ldm-47',
        chapter: '第三章 仲裁 · 终局裁决',
        number: '第47条',
        content: '追索劳动报酬、工伤医疗费、经济补偿或者赔偿金不超过当地月最低工资标准十二个月金额的争议，以及因执行国家劳动标准发生的争议，仲裁裁决为终局裁决，裁决书自作出之日起发生法律效力。',
        summary: '小额欠薪及法定工时休假争议“一裁终局”，防止单位恶意拖延诉讼。',
      },
      {
        id: 'ldm-53',
        chapter: '第四章 附则 · 费用',
        number: '第53条',
        content: '劳动争议仲裁不收费。劳动争议仲裁委员会的经费由财政予以保障。',
        summary: '申请劳动争议仲裁全程免收仲裁费，零门槛维权。',
      },
    ],
  },
  {
    id: 'anti-domestic-violence',
    title: '中华人民共和国反家庭暴力法',
    shortTitle: '反家庭暴力法',
    category: 'civil_commercial',
    scenarios: ['family', 'privacy'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2016-03-01 施行',
    lawRefPath: '社会法/反家庭暴力法.md',
    articlesCountHint: '共6章 · 38条',
    tags: ['人身安全保护令', '告诫书', '同居关系适用', '精神侵害'],
    articles: [
      {
        id: 'adv-2',
        chapter: '第一章 总则',
        number: '第2条',
        content: '本法所称家庭暴力，是指家庭成员之间以殴打、捆绑、残害、限制人身自由以及经常性谩骂、恐吓等方式实施的身体、精神等侵害行为。',
        summary: '明确精神暴力与经常性恐吓谩骂亦属于法定家庭暴力。',
      },
      {
        id: 'adv-28',
        chapter: '第四章 人身安全保护令',
        number: '第28条',
        content: '人民法院受理申请后，应当在七十二小时内作出人身安全保护令或者驳回申请；情况紧急的，应当在二十四小时内作出。',
        summary: '确立72小时/紧急24小时签发人身安全保护令的快速司法防线。',
      },
      {
        id: 'adv-37',
        chapter: '第六章 附则',
        number: '第37条',
        content: '家庭成员以外共同生活的人之间实施的暴力行为，参照本法规定执行。',
        summary: '婚前同居、恋爱同住等非婚姻共同生活关系同样受保护令制度保护。',
      },
    ],
  },
  {
    id: 'work-injury-insurance',
    title: '工伤保险条例',
    shortTitle: '工伤保险条例',
    category: 'economic_social',
    scenarios: ['labor', 'traffic'],
    authority: '国务院',
    effectiveDate: '2011-01-01 修订施行',
    lawRefPath: '行政法规/工伤保险条例.md',
    articlesCountHint: '共7章 · 67条',
    tags: ['上下班途中', '工作时间场所', '突发疾病48小时', '先行支付'],
    articles: [
      {
        id: 'wii-14',
        chapter: '第三章 工伤认定',
        number: '第14条',
        content: '职工在工作时间和工作场所内因工作原因受到事故伤害的，或者在上下班途中受到非本人主要责任的交通事故伤害的，应当认定为工伤。',
        summary: '明确工伤认定七大核心情形（含上下班非本人主责交通事故）。',
      },
      {
        id: 'wii-15',
        chapter: '第三章 视同工伤',
        number: '第15条',
        content: '在工作时间和工作岗位，突发疾病死亡或者在四十八小时之内经抢救无效死亡的，视同工伤。',
        summary: '在岗突发疾病48小时内经抢救无效死亡视同工伤。',
      },
      {
        id: 'wii-17',
        chapter: '第三章 申请时限',
        number: '第17条',
        content: '用人单位应当自事故伤害发生之日或者被诊断、鉴定为职业病之日起三十日内提出工伤认定申请；用人单位未提出申请的，工伤职工或者其近亲属、工会组织在一年内可以直接提出工伤认定申请。',
        summary: '单位30日申请义务及职工个人1年补救申报期。',
      },
    ],
  },
  {
    id: 'trademark-law',
    title: '中华人民共和国商标法',
    shortTitle: '商标法',
    category: 'civil_commercial',
    scenarios: ['company', 'consumer'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2019-11-01 修正施行',
    lawRefPath: '民法商法/商标法.md',
    articlesCountHint: '共8章 · 73条',
    tags: ['恶意抢注', '商标侵权', '撤三', '惩罚性赔偿'],
    articles: [
      {
        id: 'tm-4',
        chapter: '第一章 总则',
        number: '第4条',
        content: '自然人、法人或者其他组织在生产经营活动中，对其商品或者服务需要取得商标专用权的，应当向商标局申请商标注册。不以使用为目的的恶意商标注册申请，应当予以驳回。',
        summary: '从源头规制“不以使用为目的的恶意商标囤积抢注”。',
      },
      {
        id: 'tm-63',
        chapter: '第七章 损害赔偿',
        number: '第63条',
        content: '对恶意侵犯商标专用权，情节严重的，可以在按照方法确定数额的一倍以上五倍以下确定赔偿数额。权利人损失、侵权获利、许可费均难以确定的，法院可酌情判处五百万元以下赔偿。',
        summary: '确立恶意商标侵权最高5倍惩罚性赔偿及500万元法定赔偿上限。',
      },
    ],
  },
  {
    id: 'legal-aid-law',
    title: '中华人民共和国法律援助法',
    shortTitle: '法律援助法',
    category: 'procedural',
    scenarios: ['labor', 'family', 'privacy'],
    authority: '全国人民代表大会常务委员会',
    effectiveDate: '2022-01-01 施行',
    lawRefPath: '诉讼与非诉讼程序法/法律援助法.md',
    articlesCountHint: '共7章 · 71条',
    tags: ['12348热线', '免费律师', '农民工讨薪免审查', '刑事辩护'],
    articles: [
      {
        id: 'la-31',
        chapter: '第四章 程序与实施',
        number: '第31条',
        content: '因经济困难没有委托代理人的，可以就依法请求国家赔偿、请求给予社会保险待遇或者社会救助、请求支付劳动报酬或者因经济困难免予审查的情形申请法律援助。',
        summary: '明确民生维权（欠薪、社保、工伤、赡养扶养）均可申请免费法援律师。',
      },
      {
        id: 'la-42',
        chapter: '第四章 免予核查经济困难',
        number: '第42条',
        content: '进城务工人员请求支付劳动报酬或者请求工伤事故人身损害赔偿，无须提交经济困难状况说明，法律援助机构免予核查经济困难状况。',
        summary: '进城务工人员讨薪及工伤维权申请法律援助免予经济困难审查。',
      },
    ],
  },
  {
    id: 'property-management-reg',
    title: '物业管理条例（住宅专项与业主权益）',
    shortTitle: '物业管理条例',
    category: 'administrative',
    scenarios: ['housing'],
    authority: '国务院',
    effectiveDate: '2018-03-19 修订施行',
    lawRefPath: '行政法规/物业管理条例.md',
    articlesCountHint: '共7章 · 66条',
    tags: ['业主大会', '公共收益归属', '断水断电禁止', '物业费透明'],
    articles: [
      {
        id: 'pm-41',
        chapter: '第五章 物业的使用与维护',
        number: '第41条',
        content: '业主应当根据物业服务合同的约定交纳物业服务费用。已竣工但尚未出售或者尚未交给物业买受人的物业，物业服务费用由建设单位交纳。',
        summary: '未交付房屋前的物业费由开发商承担，收房后按约缴纳。',
      },
      {
        id: 'pm-54',
        chapter: '第五章 共有收益',
        number: '第54条',
        content: '利用物业共用部位、共用设施设备进行经营的，应当在征得相关业主、业主大会、物业服务企业的同意后办理手续；所得收益主要用于补充专项维修资金，也可以按照业主大会的决定使用。',
        summary: '小区电梯广告、公共车位收益依法归全体业主共有，物业不得私吞。',
      },
    ],
  },
];

export const JUDICIAL_CASES: JudicialCase[] = [
  {
    id: 'case-kunshan',
    title: '昆山于海明正当防卫案（指导性案例）',
    caseNumber: '检例第47号 / 最高检第十二批指导性案例',
    court: '最高人民检察院 / 江苏省昆山市人民检察院',
    decisionDate: '2018-09-01',
    category: '正当防卫 · 刑法第20条第3款',
    scenarios: ['traffic'],
    tags: ['正当防卫', '无限防卫权', '夺刀反击'],
    facts: '刘某醉酒驾驶宝马车强行变道与骑车人于海明发生口角，持砍刀连续击打于海明并致刀脱手，于海明抢过砍刀7秒内连续反击致刘某死亡。',
    holding: '面对正在进行的行凶等严重危及人身安全的暴力侵害，夺刀后为防止侵害继续而进行的连续防卫具有紧迫性和整体性，依法属于《刑法》第20条第3款特殊正当防卫，不负刑事责任。',
    relatedArticles: ['《中华人民共和国刑法》第20条'],
  },
  {
    id: 'case-996',
    title: '“996”严重超时加班劳动争议典型案例',
    caseNumber: '人社部与最高人民法院联合发布典型案例1号',
    court: '最高人民法院 / 人力资源和社会保障部',
    decisionDate: '2021-08-26',
    category: '劳动权益 · 劳动法加班规制',
    scenarios: ['labor'],
    tags: ['996工作制', '违法解除', '加班工资'],
    facts: '某快递公司要求员工按“早9晚9、每周6天”规章制度执行超时加班，员工张某以超时违法为由拒绝并被公司辞退，张某申请劳动仲裁。',
    holding: '用人单位制定的严重违反《劳动法》关于延长工作时间上限规定的规章制度无效；以此为由解除劳动合同属于违法解除，应依法支付赔偿金。',
    relatedArticles: ['《中华人民共和国劳动法》第44条', '《中华人民共和国劳动合同法》第87条'],
  },
  {
    id: 'case-high-altitude',
    title: '高空抛物危害公共安全及民事补偿示范案',
    caseNumber: '最高人民法院发布典型案例',
    court: '最高人民法院',
    decisionDate: '2023-06-15',
    category: '侵权责任 · 高空抛物民法典适用',
    scenarios: ['housing'],
    tags: ['高空抛物', '安全保障', '侵权赔偿'],
    facts: '某高层住宅住户从高楼抛掷装满杂物的垃圾袋，致楼下行人受伤住院；物业未尽到合理警示和监控维护义务。',
    holding: '公安机关应当依法及时调查查清具体侵权人；在查清具体抛掷人后，由直接侵权人承担全部侵权损害赔偿；物业未采取必要安全保障措施的应承担相应补充责任。',
    relatedArticles: ['《中华人民共和国民法典》第1254条'],
  },
  {
    id: 'case-consumer-fraud',
    title: '二手电商“以次充好、隐瞒翻新”退一赔三案',
    caseNumber: '最高法消费者权益保护典型案例',
    court: '北京互联网法院 / 最高法选编',
    decisionDate: '2024-03-14',
    category: '消费维权 · 网购欺诈惩罚性赔偿',
    scenarios: ['consumer'],
    tags: ['退一赔三', '消费者欺诈', '网购维权'],
    facts: '消费者在某平台网购标注“全新原封正品”的旗舰手机，收到后经官方售后检测系拆封翻新机，商家拒绝退赔。',
    holding: '经营者故意隐瞒关键商品瑕疵、虚构全新状态构成欺诈，法院判决退还全部货款并依《消费者权益保护法》第55条支付三倍价款惩罚性赔偿。',
    relatedArticles: ['《中华人民共和国消费者权益保护法》第55条', '《中华人民共和国民法典》第577条'],
  },
  {
    id: 'case-good-samaritan',
    title: '紧急施救“好人条款”免责案',
    caseNumber: '最高法弘扬社会主义核心价值观典型案例',
    court: '最高人民法院选编',
    decisionDate: '2022-05-10',
    category: '民法总则 · 见义勇为免责',
    scenarios: ['family', 'traffic'],
    tags: ['好人条款', '见义勇为', '民法典第184条'],
    facts: '热心市民路遇老人突发昏厥倒地，立即依法实施心肺复苏，急救过程中老人肋骨出现骨裂，家属事后起诉要求赔偿。',
    holding: '依据《民法典》第184条，因自愿实施紧急救助行为造成受助人损害的，救助人不承担任何民事赔偿责任，坚决为善行兜底。',
    relatedArticles: ['《中华人民共和国民法典》第184条'],
  },
  {
    id: 'case-first-violation',
    title: '涉企轻微违法“首违不罚”行政撤销案',
    caseNumber: '最高检行政检察典型案例',
    court: '最高人民检察院选编',
    decisionDate: '2024-01-18',
    category: '行政执法 · 首违不罚柔性执法',
    scenarios: ['company'],
    tags: ['首违不罚', '轻微不罚', '营商环境'],
    facts: '某小微餐饮个体户首次因进货台账记录不完整被执法部门直接顶格处以高额罚款，其在检查当日已立即整改且未造成食品安全危害。',
    holding: '依据《行政处罚法》第33条，当事人系初次违法、危害后果轻微且及时改正的，应当坚持处罚与教育相结合原则，适用首违不罚或予以纠正撤销原严苛处罚。',
    relatedArticles: ['《中华人民共和国行政处罚法》第33条'],
  },
  {
    id: 'case-ai-voice-personality',
    title: '全国首例“AI声音侵权”人格权保护案',
    caseNumber: '（2023）京0491民初12142号',
    court: '北京互联网法院',
    decisionDate: '2024-04-23',
    category: '人格权 · 民法典声音权保护',
    scenarios: ['privacy', 'company'],
    tags: ['AI克隆', '声音权', '深度合成', '民法典第1023条'],
    facts: '某配音师发现一家科技公司未经本人授权，利用其此前录制的语音样本通过AI算法训练生成相似音色，并在云服务平台公开发售商业配音模型。',
    holding: '自然人声音具有可识别性与人身专属性；未经许可使用AI技术对自然人声音进行合成并商业化使用，依法构成对原告声音权（参照肖像权规则）的侵害，判令赔礼道歉并赔偿损失。',
    relatedArticles: ['《中华人民共和国民法典》第1023条', '《中华人民共和国民法典》第1019条'],
  },
  {
    id: 'case-noncompete',
    title: '普通岗位签泛化“竞业限制协议”无效案',
    caseNumber: '最高人民法院劳动争议典型案例',
    court: '上海市第一中级人民法院',
    decisionDate: '2024-04-30',
    category: '劳动权益 · 竞业限制主体界定',
    scenarios: ['labor', 'company'],
    tags: ['竞业限制', '普通员工', '保密义务'],
    facts: '某企业将全员（包含基层行政专员）一律签订离职后2年竞业限制协议并约定高额违约金。员工离职入职同行业后被老东家索赔20万元。',
    holding: '《劳动合同法》第24条规定竞业限制仅限于高管、高技及其他负有保密义务人员；对未实质接触核心商业秘密的普通岗位滥签竞业协议并无合理依据，法院依法不予支持。',
    relatedArticles: ['《中华人民共和国劳动合同法》第24条'],
  },
  {
    id: 'case-rental-deposit',
    title: '房屋退租“正常折旧不得扣除押金”示范案',
    caseNumber: '人民法院案例库参考案例',
    court: '深圳市中级人民法院',
    decisionDate: '2023-11-08',
    category: '租赁合同 · 租房押金纠纷',
    scenarios: ['housing'],
    tags: ['租房押金', '正常损耗', '提灯定损'],
    facts: '租户居住三年退租时已正常清洁交付房屋，房东以墙面轻微泛黄、地板有正常使用划痕为由全额扣留押金并高额索赔“装修折旧费”。',
    holding: '依据《民法典》第710条，承租人按照约定的方法或者租赁物的性质使用租赁物，致使租赁物受到损耗的，不承担赔偿责任。房东应全额退还押金。',
    relatedArticles: ['《中华人民共和国民法典》第577条', '《中华人民共和国民法典》第726条'],
  },
  {
    id: 'case-ecommerce-livestream',
    title: '直播间虚假宣传与平台“自营/连带”赔偿案',
    caseNumber: '最高法涉网络消费典型案例',
    court: '杭州互联网法院',
    decisionDate: '2024-03-15',
    category: '电子商务 · 直播带货维权',
    scenarios: ['consumer'],
    tags: ['直播带货', '电商法38条', '虚假宣传'],
    facts: '某主播在直播间将普通压片糖果宣称为“降糖神药”，电商平台未对保健食品或药品经营资质尽到基本核验义务，消费者服用后引发不适起诉索赔。',
    holding: '对关系消费者生命健康的商品或服务，平台经营者未尽资质审核及安全保障义务的，依《电子商务法》第38条与实际销售者承担相应连带赔偿责任。',
    relatedArticles: ['《中华人民共和国电子商务法》第38条', '《中华人民共和国消费者权益保护法》第55条'],
  },
  {
    id: 'case-telefraud-bankcard',
    title: '出租出借银行卡跑分构成“帮信罪”案',
    caseNumber: '最高人民法院断卡行动典型案例',
    court: '广东省广州市中级人民法院',
    decisionDate: '2023-09-20',
    category: '刑事犯罪 · 反电诈与帮信罪',
    scenarios: ['privacy'],
    tags: ['帮信罪', '断卡行动', '出借银行卡'],
    facts: '在校大学生为赚取3000元“好处费”，将本人名下两张银行卡、U盾及手机卡提供给陌生人员用于资金转账过账，流水金额高达400余万元，其中多笔系电信诈骗被害人被骗款项。',
    holding: '行为人为谋取非法利益，明知他人可能利用信息网络实施犯罪而仍出售/出租“两卡”用于支付结算，情节严重，依法以《刑法》第287条之二帮助信息网络犯罪活动罪定罪处刑，同时触发《反电信网络诈骗法》信用惩戒。',
    relatedArticles: ['《中华人民共和国刑法》第287条之二', '《中华人民共和国反电信网络诈骗法》第25条'],
  },
  {
    id: 'case-reconsideration',
    title: '新《行政复议法》调解实质化解交通/行政争议案',
    caseNumber: '司法部新行政复议法贯彻典型案例',
    court: '省级人民政府行政复议委员会',
    decisionDate: '2024-05-12',
    category: '行政复议 · 实质解纷与调解书效力',
    scenarios: ['traffic', 'company'],
    tags: ['行政复议调解', '不收取费用', '60日申请期'],
    facts: '申请人因道路交通违法信息录入误差被跨区合并处罚，申请人在60日法定期限内通过线上复议通道提交现场行车记录仪视频。',
    holding: '复议机关核实后依据新《行政复议法》第73条组织双方听取意见并达成行政复议调解，原作出处罚机关当即撤销错误记分与罚款，零诉讼费用高效率定分止争。',
    relatedArticles: ['《中华人民共和国行政复议法》第20条', '《中华人民共和国行政复议法》第73条'],
  },
  {
    id: 'case-ebike-traffic',
    title: '电动车闯红灯与正常行驶机动车碰撞比例划分案',
    caseNumber: '最高法道路交通事故典型案例',
    court: '南京市中级人民法院',
    decisionDate: '2023-10-12',
    category: '交通理赔 · 交法第76条过错比例',
    scenarios: ['traffic'],
    tags: ['交强险', '优者危险负担', '无责10%'],
    facts: '张某驾驶合规电动自行车在路口闯红灯高速通行，与绿灯正常直行的王某小客车发生碰撞；交警认定张某负主要或全部责任、王某无过错或轻微注意瑕疵。',
    holding: '依《道路交通安全法》第76条，先在交强险责任限额内予以赔付；超出交强险部分，因非机动车方存在严重闯红灯过错应大幅减轻机动车方赔偿比例，即使机动车完全无责也仅承担不超过10%的公平赔偿责任。',
    relatedArticles: ['《中华人民共和国道路交通安全法》第76条'],
  },
  {
    id: 'case-privacy-facial',
    title: '商超强制“刷脸结账/抓拍客流”侵害个人信息案',
    caseNumber: '最高法/网信办个人信息保护典型案例',
    court: '浙江省杭州市中级人民法院',
    decisionDate: '2023-07-05',
    category: '隐私保护 · 最小必要与人脸识别',
    scenarios: ['privacy', 'consumer'],
    tags: ['人脸识别', '最小必要原则', '个保法'],
    facts: '某连锁门店在未向进店消费者弹窗告知或取得明确单独同意的情况下，在收银台及货架隐蔽处安装人脸抓拍分析仪统计顾客性别年龄及消费偏好。',
    holding: '生物识别信息属于敏感个人信息；商业门店非维护公共安全目的擅自采集分析进店顾客人脸特征，违反《个人信息保护法》第6条最小必要原则与第26条公共场所图像采集规范，判令删除数据并赔偿。',
    relatedArticles: ['《中华人民共和国个人信息保护法》第6条', '《中华人民共和国个人信息保护法》第26条'],
  },
  {
    id: 'case-betrothal-gifts',
    title: '“闪离”未共同生活或短期同居彩礼酌情返还案',
    caseNumber: '最高人民法院涉彩礼纠纷典型案例',
    court: '最高人民法院发布',
    decisionDate: '2024-02-01',
    category: '婚姻家庭 · 民法典禁止借婚姻索取财物',
    scenarios: ['family'],
    tags: ['彩礼返还', '共同生活时间', '婚姻登记'],
    facts: '男女双方办理结婚登记后仅共同生活十余天即因性格矛盾起诉离婚，男方请求返还给付女方的20万元高额彩礼，女方以已领证为由拒绝返还。',
    holding: '依据《民法典》婚姻家庭编及涉彩礼纠纷司法解释，已办理结婚登记并共同生活但共同生活时间较短且彩礼数额过高的，法院结合彩礼实际使用、嫁妆情况及双方过错，酌情判令返还大部分彩礼。',
    relatedArticles: ['《中华人民共和国民法典》第1042条'],
  },
  {
    id: 'case-commute-injury',
    title: '下班合理时间路线途中非本人主责交通事故工伤认定案',
    caseNumber: '最高人民法院行政工伤认定典型案例',
    court: '江苏省高级人民法院',
    decisionDate: '2023-12-10',
    category: '劳动社保 · 上下班途中工伤认定',
    scenarios: ['labor', 'traffic'],
    tags: ['工伤认定', '上下班途中', '合理路线'],
    facts: '职工下班后顺路在必经菜市场买菜约15分钟后继续骑车返回住所途中，被闯红灯机动车撞伤，交警认定机动车全责。人社部门及单位均对“买菜绕行”是否属于上下班途中产生争议。',
    holding: '上下班途中顺路买菜等日常必需且微小的生活停留属于“合理时间、合理路线”的延伸，依法符合《工伤保险条例》第14条第6项“上下班途中非本人主要责任交通事故”，应当认定为工伤。',
    relatedArticles: ['《工伤保险条例》第14条', '《工伤保险条例》第17条'],
  },
  {
    id: 'case-prepaid-card',
    title: '健身房“闭店失联”预付卡余额退还及清算责任案',
    caseNumber: '最高法预付式消费典型案例',
    court: '上海市第二中级人民法院',
    decisionDate: '2024-08-15',
    category: '消费维权 · 预付卡退款与清算责任',
    scenarios: ['consumer', 'company'],
    tags: ['预付卡跑路', '健身房闭店', '消费者退费'],
    facts: '某连锁健身公司收取多名会员预付年费后突然闭店撤场，股东在未依法清算的情况下注销或转移门店资产，会员起诉要求退还剩余卡内金额并要求未清算股东承担责任。',
    holding: '经营者收取预付款后停业且未履行服务义务，消费者有权依法解除合同并要求退还剩余预付款及利息；公司未经依法清算即行注销或恶意逃避债务的，相关清算义务人依法承担清偿责任。',
    relatedArticles: ['《中华人民共和国消费者权益保护法》第53条', '《中华人民共和国民法典》第577条'],
  },
  {
    id: 'case-minor-game-topup',
    title: '11岁未成年人未经监护人同意巨额游戏充值全额退费案',
    caseNumber: '最高法未成年人网络保护典型案例',
    court: '广东省佛山市中级人民法院',
    decisionDate: '2024-05-30',
    category: '民法总则 · 限制民事行为能力人效力',
    scenarios: ['family', 'consumer', 'privacy'],
    tags: ['未成年人充值', '限制民事行为能力', '游戏退款'],
    facts: '11岁小学生趁家长不备使用母亲手机绑定支付密码，两周内向某网络游戏充值4.2万元购买虚拟装备，家长发现后联系平台遭拒。',
    holding: '八周岁以上的未成年人为限制民事行为能力人，与其年龄、智力不相适应的大额网络充值行为未经法定代理人同意或追认依法无效；平台未严格落实实名验证与充值限额义务，判令向监护人退还主要充值款项。',
    relatedArticles: ['《中华人民共和国民法典》第19条', '《中华人民共和国未成年人保护法》第74条'],
  },
  {
    id: 'case-neighbor-noise',
    title: '深夜装修及架子鼓低频噪音侵害相邻权判停案',
    caseNumber: '人民法院案例库相邻关系参考案例',
    court: '北京市朝阳区人民法院',
    decisionDate: '2023-08-22',
    category: '物权相邻 · 住宅噪音污染侵权',
    scenarios: ['housing'],
    tags: ['相邻权', '噪音扰民', '停止侵害'],
    facts: '楼上住户长期于晚间22时至次日凌晨练琴及运行大功率设备，经实测夜间室内噪声持续超标，严重影响楼下老人与备考学生睡眠。',
    holding: '不动产相邻各方应当按照有利生产、方便生活、团结互助、公平合理的原则处理相邻关系；超越正常容忍限度的夜间噪音构成对相邻方安宁生活权与健康权的侵害，判令停止夜间噪音并赔偿精神及医疗损失。',
    relatedArticles: ['《中华人民共和国民法典》第288条', '《中华人民共和国治安管理处罚法》第58条'],
  },
  {
    id: 'case-housing-presale',
    title: '商品房“虚假学区承诺”解除合同及违约金案',
    caseNumber: '最高法商品房买卖合同典型案例',
    court: '江苏省南京市中级人民法院',
    decisionDate: '2023-10-28',
    category: '合同纠纷 · 商品房广告纳入要约认定',
    scenarios: ['housing', 'consumer'],
    tags: ['学区房维权', '销售广告要约', '民法典第491条'],
    facts: '开发商在沙盘宣传册与置业顾问微信承诺中明确写明“本楼盘交付即对应名校学区名额”，购房人据此签约后交房时发现该承诺系虚假宣传，诉请退房并赔偿损失。',
    holding: '出卖人就商品房开发规划范围内的房屋及相关设施所作的说明和允诺具体确定，并对买卖合同订立及价格有重大影响的，依法视为要约并构成合同内容；未实现的构成根本违约，购房人有权要求解除合同并索赔。',
    relatedArticles: ['《中华人民共和国民法典》第577条'],
  },
];

export function getLawRefRawUrl(lawRefPath: string): string {
  const encodedPath = lawRefPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `https://raw.githubusercontent.com/LawRefBook/Laws/master/${encodedPath}`;
}

/**
 * Normalize numeric article references like "577", "第577条", "577条", "第20条"
 * into comparable digits or Chinese numerals so queries match across formats.
 */
function normalizeArticleNumberQuery(raw: string): { numeric: string | null; text: string } {
  const trimmed = raw.trim();
  const numMatch = trimmed.match(/第?\s*(\d+)\s*条?/);
  return {
    numeric: numMatch ? numMatch[1] : null,
    text: trimmed.toLowerCase(),
  };
}

const ZH_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

export function arabicToChineseNumeral(numStr: string): string {
  const n = Number.parseInt(numStr, 10);
  if (!Number.isFinite(n) || n <= 0 || n >= 10000) return numStr;
  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;

  let res = '';
  let zeroFlag = false;

  if (thousands > 0) {
    res += `${ZH_DIGITS[thousands]}千`;
  }
  if (hundreds > 0) {
    res += `${ZH_DIGITS[hundreds]}百`;
  } else if (res && (tens > 0 || ones > 0)) {
    zeroFlag = true;
  }
  if (tens > 0) {
    if (zeroFlag) {
      res += '零';
      zeroFlag = false;
    }
    res += tens === 1 && !res ? '十' : `${ZH_DIGITS[tens]}十`;
  } else if (res && ones > 0 && !zeroFlag) {
    zeroFlag = true;
  }
  if (ones > 0) {
    if (zeroFlag) res += '零';
    res += ZH_DIGITS[ones];
  }
  return res;
}

export function matchesArticleNumberQuery(articleNumber: string, query: string): boolean {
  const { numeric, text } = normalizeArticleNumberQuery(query);
  if (!text) return true;
  const lower = articleNumber.toLowerCase();
  if (lower.includes(text)) return true;
  if (numeric) {
    const zh = arabicToChineseNumeral(numeric);
    if (lower.includes(`第${numeric}条`) || lower.includes(`第${zh}条`) || lower.includes(numeric)) {
      return true;
    }
  }
  return false;
}

export function searchLawDocuments(
  query: string,
  category: LawCategory,
  scenario: LawScenarioId = 'all'
): LawDocument[] {
  const { numeric, text } = normalizeArticleNumberQuery(query);
  const zhNum = numeric ? arabicToChineseNumeral(numeric) : null;

  return LAW_DOCUMENTS.filter((doc) => {
    if (category !== 'all' && category !== 'cases' && doc.category !== category) {
      return false;
    }
    if (scenario !== 'all' && !doc.scenarios.includes(scenario)) {
      return false;
    }
    if (!text) return true;

    const hayDoc = `${doc.title} ${doc.shortTitle} ${doc.authority} ${doc.tags.join(' ')}`.toLowerCase();
    if (hayDoc.includes(text)) return true;

    return doc.articles.some((art) => {
      const artText = `${art.chapter} ${art.number} ${art.summary} ${art.content}`.toLowerCase();
      if (artText.includes(text)) return true;
      if (numeric && (art.number.includes(numeric) || (zhNum && art.number.includes(zhNum)))) {
        return true;
      }
      return false;
    });
  });
}

export function searchJudicialCases(
  query: string,
  scenario: LawScenarioId = 'all'
): JudicialCase[] {
  const clean = query.trim().toLowerCase();
  return JUDICIAL_CASES.filter((item) => {
    if (scenario !== 'all' && !item.scenarios.includes(scenario)) {
      return false;
    }
    if (!clean) return true;
    const hay = `${item.title} ${item.caseNumber} ${item.court} ${item.category} ${item.tags.join(' ')} ${item.facts} ${item.holding} ${item.relatedArticles.join(' ')}`.toLowerCase();
    return hay.includes(clean);
  });
}

export interface ParsedArticleCitation {
  lawDoc: LawDocument;
  article: LawArticle | null;
  articleNumberHint: string | null;
}

/**
 * Resolve a related article citation string from a JudicialCase (e.g. "《中华人民共和国民法典》第577条")
 * to an actual LawDocument and matching LawArticle when present.
 */
export function resolveCitationToStatute(citation: string): ParsedArticleCitation | null {
  const titleMatch = citation.match(/《([^》]+)》/);
  const targetTitle = titleMatch ? titleMatch[1] : citation;
  const lawDoc =
    LAW_DOCUMENTS.find(
      (doc) =>
        doc.title === targetTitle ||
        doc.shortTitle === targetTitle ||
        doc.title.includes(targetTitle) ||
        targetTitle.includes(doc.shortTitle)
    ) || null;
  if (!lawDoc) return null;

  const artMatch = citation.match(/第([0-9一二三四五六七八九十百千万]+条(?:之[一二三四五六七八九十]+)?)/);
  const articleNumberHint = artMatch ? `第${artMatch[1]}` : null;
  const article = articleNumberHint
    ? lawDoc.articles.find(
        (a) =>
          a.number === articleNumberHint ||
          matchesArticleNumberQuery(a.number, articleNumberHint)
      ) || null
    : null;

  return { lawDoc, article, articleNumberHint };
}

export interface MarkdownBlock {
  type: 'h1' | 'h2' | 'h3' | 'article' | 'paragraph';
  text: string;
}

/**
 * Lightweight, XSS-safe Markdown cleaner for statute documents.
 * Strips raw #, **, <!-- --> markers and converts statute text into clean structured blocks.
 */
export function parseLawMarkdownBlocks(markdown: string, filterQuery?: string): MarkdownBlock[] {
  const cleaned = markdown
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n');

  const lines = cleaned.split('\n');
  const blocks: MarkdownBlock[] = [];
  const q = filterQuery?.trim().toLowerCase() || '';

  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/\*\*([^*]+)\*\*/g, '$1');
    if (!line || line === '---' || line === '***') continue;

    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4).trim() });
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
    } else if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2).trim() });
    } else if (/^第[一二三四五六七八九十百千零〇0-9]+条/.test(line)) {
      blocks.push({ type: 'article', text: line });
    } else {
      blocks.push({ type: 'paragraph', text: line.replace(/^>\s*/, '').replace(/^[-*]\s+/, '• ') });
    }
  }

  if (!q) return blocks;

  const { numeric } = normalizeArticleNumberQuery(q);
  const zhNum = numeric ? arabicToChineseNumeral(numeric) : null;

  return blocks.filter((b) => {
    const lower = b.text.toLowerCase();
    if (lower.includes(q)) return true;
    if (numeric && (lower.includes(`第${numeric}条`) || (zhNum && lower.includes(`第${zhNum}条`)))) {
      return true;
    }
    return false;
  });
}
