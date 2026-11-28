import { Language } from '../types/calendar';

export interface DailyQuoteItem {
  id: string;
  sourceType: 'poetry' | 'literature' | 'philosophy' | 'cinema' | 'prose';
  quoteZh: string;
  authorZh: string;
  quoteEn: string;
  authorEn: string;
  quoteJa?: string;
  authorJa?: string;
  quoteKo?: string;
  authorKo?: string;
  quoteFr?: string;
  authorFr?: string;
  quoteFa?: string;
  authorFa?: string;
  quoteMn?: string;
  authorMn?: string;
  quoteRu?: string;
  authorRu?: string;
  quoteUg?: string;
  authorUg?: string;
  bgImageUrlDark: string;
  bgImageUrlLight: string;
}

export const DAILY_QUOTES: DailyQuoteItem[] = [
  {
    id: 'q1',
    sourceType: 'prose',
    quoteZh: '海纳百川，有容乃大；壁立千仞，无欲则刚。',
    authorZh: '林则徐',
    quoteEn: 'The sea admits hundreds of rivers for its capacity; the cliff stands thousands of feet tall without desire.',
    authorEn: 'Lin Zexu',
    quoteJa: '海は百川を納めて広大となり、壁は千仞に立ちて無欲なれば剛し。',
    authorJa: '林則徐',
    quoteKo: '바다는 모든 강을 품어 넓고, 절벽은 욕심이 없어 굳세도다.',
    authorKo: '임칙서',
    quoteFr: 'La mer accueille cent rivières par sa grandeur ; la falaise haute de mille toises tient ferme sans désir.',
    authorFr: 'Lin Zexu',
    quoteFa: 'دریا با پذیرش رودها وسعت می‌یابد و کوه بدون طمع استوار می‌ماند.',
    authorFa: 'لین زشو',
    quoteMn: 'Далай зуун голыг багтааж уужим болдог, хадан хясаа хүсэлгүй тул бат бөх оршдог.',
    authorMn: 'Лин Зэшү',
    quoteRu: 'Море вмещает сотни рек благодаря широте своей; утес высится на тысячи локтей в несокрушимом величии.',
    authorRu: 'Линь Цзэсюй',
    quoteUg: 'دېڭىز دەريالارنى سىغدۇرۇپ كەڭ، قىيالار تەمەسىز بولغاچ تىك تۇرىدۇ.',
    authorUg: 'لىن زېشۈ',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q2',
    sourceType: 'philosophy',
    quoteZh: '博学之，审问之，慎思之，明辨之，笃行之。',
    authorZh: '《礼记·中庸》',
    quoteEn: 'Study extensively, inquire prudently, think carefully, distinguish clearly, and practice earnestly.',
    authorEn: 'The Doctrine of the Mean',
    quoteJa: '広くこれを学び、詳しくこれを問い、慎んでこれを思い、明らかにこれを弁じ、篤くこれを行う。',
    authorJa: '『中庸』',
    quoteKo: '널리 배우고, 자세히 묻고, 신중히 생각하고, 밝게 분별하며, 돈독하게 행하라.',
    authorKo: '《중용》',
    quoteFr: 'Étudiez abondamment, interrogez prudemment, réfléchissez mûrement, discernez clairement et pratiquez avec ferveur.',
    authorFr: 'Doctrine du Milieu',
    quoteFa: 'به گستردگی بیاموز، با احتیاط جویا شو، عمیق بیندیش، به روشنی تشخیص ده و با جدیت عمل کن.',
    authorFa: 'تعالیم اعتدال',
    quoteMn: 'Өргөнөөр суралцаж, нарийвчлан лавлаж, няхуур тунгааж, тодорхой ялгаж, хичээнгүйлэн хэрэгжүүл.',
    authorMn: 'Эртний гүн ухаан',
    quoteRu: 'Широко учись, вдумчиво вопрошай, основательно размышляй, ясно различай и усердно действуй.',
    authorRu: 'Учение о середине',
    quoteUg: 'كەڭ ئۆگەن، ئىنچىكە سۈرۈشتۈر، چوڭقۇر ئويلان، ئېنىق ئايرى، چىن كۆڭلىڭ بىلەن ئەمەل قىل.',
    authorUg: 'ئوتتۇرا يول تەلىماتى',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q3',
    sourceType: 'poetry',
    quoteZh: '惟江上之清风，与山间之明月，耳得之而为声，目遇之而成色，取之无禁，用之不竭。',
    authorZh: '苏轼《前赤壁赋》',
    quoteEn: 'Only the cool breeze over the river and the bright moon above the mountains are ours: sound to our ears and beauty to our eyes, limitless and inexhaustible.',
    authorEn: 'Su Shi, The Red Cliff',
    quoteJa: '江上の清風と山間の明月のみ、耳に得て声となり、目に遇いて色を成す。取れども禁ぜず、用うれども竭きず。',
    authorJa: '蘇軾『赤壁の賦』',
    quoteKo: '오직 강 위의 맑은 바람과 산 사이의 밝은 달만이 귀로 들으면 소리가 되고 눈으로 보면 빛이 되니, 취해도 막지 않고 써도 다하지 않도다.',
    authorKo: '소식 《적벽부》',
    quoteFr: 'Seule la brise fraîche sur le fleuve et la lune claire entre les monts enchantent nos sens, trésors inépuisables et sans limites.',
    authorFr: 'Su Shi, Ode à la Falaise Rouge',
    quoteFa: 'تنها نسیم خنک رودخانه و مهتاب روشن کوهساران است که بی‌هیچ منعی جان را می‌نوازد، گنجینه‌ای بی‌پایان برای همگان.',
    authorFa: 'سو شی',
    quoteMn: 'Зөвхөн голын сэвшээ салхи, уулсын гэрэлт сар л нүд баясгаж, чих мялаах хязгааргүй дуусашгүй баялаг билээ.',
    authorMn: 'Сү Ши',
    quoteRu: 'Лишь свежий бриз над рекою и ясный месяц над горами радуют взор и слух — сокровища неисчерпаемые и безграничные.',
    authorRu: 'Су Ши, Ода о Красной скале',
    quoteUg: 'پەقەت دەريادىكى سالقىن شامال بىلەن تاغلاردىكى پارلاق ئايلا ئاڭلىغانغا ياڭراق، كۆرگەنچە رەڭدار، تۈگىمەس ۋە ھەممىگە ئوچۇق گۈزەللىكتۇر.',
    authorUg: 'سۇ شى «قىزىل قىيا شېئىرى»',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q4',
    sourceType: 'poetry',
    quoteZh: '生如夏花之绚烂，死如秋叶之静美。',
    authorZh: '拉宾德拉纳特·泰戈尔《飞鸟集》',
    quoteEn: 'Let life be beautiful like summer flowers and death like autumn leaves.',
    authorEn: 'Rabindranath Tagore, Stray Birds',
    quoteJa: '生は夏の花のごとく絢爛たり、死は秋の葉のごとく静美たれ。',
    authorJa: 'タゴール『迷い鳥たち』',
    quoteKo: '삶은 여름꽃처럼 찬란하게, 죽음은 가을 낙엽처럼 고요하고 아름답게.',
    authorKo: '타고르 《떠돌이 새들》',
    quoteFr: 'Que la vie soit belle comme les fleurs d’été et la mort douce comme les feuilles d’automne.',
    authorFr: 'Rabindranath Tagore',
    quoteFa: 'بگذار زندگی همچون گلهای تابستان پرشکوه و مرگ چون برگ‌های پاییز آرام و زیبا باشد.',
    authorFa: 'رابیندرانات تاگور',
    quoteMn: 'Амьдрал зуны цэцэг шиг гайхамшигтай, үхэл намрын навчис шиг аниргүй амгалан байг.',
    authorMn: 'Р. Тагүр',
    quoteRu: 'Пусть жизнь будет прекрасна, как летние цветы, а смерть — тиха и красива, как осенние листья.',
    authorRu: 'Рабиндранат Тагор',
    quoteUg: 'ھايات ياز گۈللىرىدەك جۇلالىق، ئۆلۈم كۈز يوپۇرمىقىدەك تىنچ ۋە سۈكۈتتە بولسۇن.',
    authorUg: 'تاگور «ئاداشقان قۇشلار»',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q5',
    sourceType: 'cinema',
    quoteZh: '希望是件美好的事，也许是世间最美好的东西，而美好的事物永不消逝。',
    authorZh: '《肖申克的救赎》',
    quoteEn: 'Hope is a good thing, maybe the best of things, and no good thing ever dies.',
    authorEn: 'The Shawshank Redemption',
    quoteJa: '希望は素晴らしいものだ。おそらく世界で最も素晴らしいものだ。そして、良いものは決して消えない。',
    authorJa: '『ショーシャンクの空に』',
    quoteKo: '희망은 좋은 것입니다. 아마도 세상에서 가장 좋은 것일지도 모릅니다. 그리고 좋은 것은 결코 사라지지 않습니다.',
    authorKo: '《쇼생크 탈출》',
    quoteFr: 'L’espoir est une bonne chose, peut-être la meilleure de toutes, et les bonnes choses ne meurent jamais.',
    authorFr: 'Les Évadés',
    quoteFa: 'امید چیز خوبی است، شاید بهترین چیزها، و هیچ چیز خوبی هرگز نمی‌میرد.',
    authorFa: 'رستگاری در شاوشنک',
    quoteMn: 'Итгэл найдвар бол сайхан зүйл, магадгүй хорвоогийн хамгийн сайн зүйл, сайн сайхан зүйл хэзээ ч мөхдөггүй.',
    authorMn: 'Шоушенкээс оргосон нь',
    quoteRu: 'Надежда — хорошая вещь, возможно, лучшая из всех, а хорошее никогда не умирает.',
    authorRu: 'Побег из Шоушенка',
    quoteUg: 'ئۈمىد ناھايىتى ئېسىل نەرسە، بەلكىم دۇنيادىكى ئەڭ ياخشى بايلىق، ياخشى نەرسىلەر مەڭگۈ يوقالمايدۇ.',
    authorUg: '«شاۋشېنكتىن قۇتۇلۇش»',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q6',
    sourceType: 'philosophy',
    quoteZh: '世界上只有一种真正的英雄主义，那就是认清生活的真相后依然热爱它。',
    authorZh: '罗曼·罗兰《米开朗琪罗传》',
    quoteEn: 'There is only one true heroism in the world: to see the world as it is, and to love it.',
    authorEn: 'Romain Rolland, Life of Michelangelo',
    quoteJa: '世界に真の英雄主義はただ一つしかない。それは世界の現実をありのままに見つめ、それでもなお世界を愛することだ。',
    authorJa: 'ロマン・ロラン',
    quoteKo: '세상에는 오직 단 하나의 진정한 영웅주의가 있다. 그것은 세상의 진실을 보고도 여전히 그것을 사랑하는 것이다.',
    authorKo: '로맹 롤랑',
    quoteFr: 'Il n’y a qu’un héroïsme au monde : c’est de voir le monde tel qu’il est et de l’aimer.',
    authorFr: 'Romain Rolland',
    quoteFa: 'تنها یک قهرمانی واقعی در جهان وجود دارد: دیدن جهان آن‌گونه که هست و هنوز دوست داشتن آن.',
    authorFa: 'رومن رولان',
    quoteMn: 'Энэ хорвоод цор ганц жинхэнэ баатарлаг чанар бий: амьдралын үнэнийг танин мэдсэн ч түүнд хайртай хэвээр үлдэх явдал юм.',
    authorMn: 'Ромен Роллан',
    quoteRu: 'В мире есть лишь один истинный героизм: видеть мир таким, каков он есть, и любить его.',
    authorRu: 'Ромен Роллан',
    quoteUg: 'دۇنيادا پەقەت بىرلا ھەقىقىي قەھرىمانلىق بار، ئۇ بولسىمۇ تۇرمۇشنىڭ ھەقىقىي ماھىيىتىنى كۆرۈپ يەتكەندىن كېيىنمۇ ئۇنى يەنىلا سۆيۈشتۇر.',
    authorUg: 'رومان روللان',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q7',
    sourceType: 'poetry',
    quoteZh: '仰观宇宙之大，俯察品类之盛，所以游目骋怀，足以极视听之娱，信可乐也。',
    authorZh: '王羲之《兰亭集序》',
    quoteEn: "Looking up at the vastness of the cosmos and down at the richness of all creatures, one's spirit soars to boundless delight.",
    authorEn: 'Wang Xizhi, Preface to the Lanting Poetry',
    quoteJa: '仰ぎては宇宙の大を観、俯しては品類の盛んなるを察す。遊目騁懐、もって視聴の娯しみを極むるに足る。',
    authorJa: '王羲之『蘭亭序』',
    quoteKo: '우러러 우주의 광대함을 보고 굽어보아 만물의 번성함을 살피니, 눈길 닿고 마음 펴는 바 시청의 즐거움을 다하기에 족하도다.',
    authorKo: '왕희지 《난정서》',
    quoteFr: 'Contempler l’immensité du cosmos et la richesse de la nature élève l’âme et comble les sens d’une félicité ineffable.',
    authorFr: 'Wang Xizhi',
    quoteFa: 'نگریستن به وسعت گیتی و تماشای فراوانی موجودات، روح را تا بی‌نهایت به پرواز درمی‌آورد و مسرت‌بخش است.',
    authorFa: 'وانگ شی‌ژی',
    quoteMn: 'Сансар огторгуйн уудмыг тольдон, байгаль дэлхийн баялаг бүхнийг шинжин сэтгэл зүрх баясан цэнгэнэ.',
    authorMn: 'Ван Сижи',
    quoteRu: 'Взирая на необъятность мироздания и изобилие сущего, дух парит в бесконечном восторге и радости бытия.',
    authorRu: 'Ван Сичжи, Предисловие к Орхидеевой беседке',
    quoteUg: 'ئاسمانغا قاراپ كائيناتنىڭ كەڭلىكىنى، يەرگە قاراپ مەۋجۇداتلارنىڭ زەردارلىقىنى ھېس قىلىش كۆڭۈلنى شاد، تەبىئەتنى گۈزەل قىلىدۇ.',
    authorUg: 'ۋاڭ شىجى «لەنتىڭ تەرتىپى»',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q8',
    sourceType: 'philosophy',
    quoteZh: '苟日新，日日新，又日新。',
    authorZh: '《礼记·大学》',
    quoteEn: 'If you can innovate yourself for one day, do so from day to day; let there be daily renewal.',
    authorEn: 'The Great Learning',
    quoteJa: 'まことに日に新たに、日々に新たに、また日に新たなり。',
    authorJa: '『大学』',
    quoteKo: '진실로 하루가 새로워졌다면 나날이 새롭게 하고, 또 날로 새롭게 하라.',
    authorKo: '《대학》',
    quoteFr: 'Si tu te renouvelles un jour, renouvelle-toi chaque jour, encore et toujours renouvelé.',
    authorFr: 'La Grande Étude',
    quoteFa: 'اگر توانی خود را یک روز نو سازی، پس هر روز نو شو و پیوسته در تجدید باش.',
    authorFa: 'آموزه بزرگ',
    quoteMn: 'Хэрэв нэг өдөр өөрийгөө шинэчилж чадвал өдөр бүр шинэчилж, ямагт шинэчлэгдсээр бай.',
    authorMn: 'Их сургаал',
    quoteRu: 'Если можешь обновиться в один день, обновляйся каждый день, пусть обновление продолжается непрестанно.',
    authorRu: 'Великое учение',
    quoteUg: 'ئەگەر بىر كۈن يېڭىلانغان بولساڭ، كۈندە يېڭىلان، تېخىمۇ بەكرەك يېڭىلان.',
    authorUg: '«دەيشۆ تەلىماتى»',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q9',
    sourceType: 'philosophy',
    quoteZh: '千里之行，始于足下；合抱之木，生于毫末。',
    authorZh: '老子《道德经》',
    quoteEn: 'A journey of a thousand miles begins with a single step.',
    authorEn: 'Laozi, Tao Te Ching',
    quoteJa: '千里の行も一歩より始まる。',
    authorJa: '老子『道徳経』',
    quoteKo: '천 리 길도 한 걸음부터 시작된다.',
    authorKo: '노자 《도덕경》',
    quoteFr: 'Un voyage de mille lieues commence toujours par un premier pas.',
    authorFr: 'Lao Tseu',
    quoteRu: 'Путь в тысячу ли начинается с одного шага.',
    authorRu: 'Лао-цзы',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q10',
    sourceType: 'poetry',
    quoteZh: '长风破浪会有时，直挂云帆济沧海。',
    authorZh: '李白《行路难》',
    quoteEn: 'A time will come to ride the wind and cleave the waves; I will set my sails and cross the boundless sea.',
    authorEn: 'Li Bai, Hard Is the Way',
    quoteJa: '長風波を破るの時あるべし、直ちに雲帆を掛けて滄海を済らん。',
    authorJa: '李白『行路難』',
    quoteKo: '거센 바람을 타고 물결을 헤칠 때가 있으리니, 구름 돛을 곧추세워 푸른 바다를 건너리라.',
    authorKo: '이백 《행로난》',
    quoteFr: 'Un jour viendra où nous briserons les vagues portés par le vent, hissant nos voiles jusqu’aux nuages.',
    authorFr: 'Li Bai',
    quoteRu: 'Наступит час — поднимем паруса и на гребне ветра переплывем безбрежное море.',
    authorRu: 'Ли Бо',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q11',
    sourceType: 'philosophy',
    quoteZh: '知者不惑，仁者不忧，勇者不惧。',
    authorZh: '《论语·子罕》',
    quoteEn: 'The wise are free from perplexity, the virtuous from anxiety, and the brave from fear.',
    authorEn: 'Confucius, The Analects',
    quoteJa: '知者は惑わず、仁者は憂えず、勇者は懼れず。',
    authorJa: '『論語』',
    quoteKo: '지혜로운 자는 미혹되지 않고, 어진 자는 근심하지 않으며, 용감한 자는 두려워하지 않는다.',
    authorKo: '《논어》',
    quoteFr: 'Le sage ne doute pas, le bienveillant ne s’inquiète pas, le courageux ne craint rien.',
    authorFr: 'Confucius',
    quoteRu: 'Мудрый не ведает сомнений, гуманный не знает печали, храбрый не испытывает страха.',
    authorRu: 'Конфуций',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q12',
    sourceType: 'prose',
    quoteZh: '人并不是因为老了才停止梦想，而是因为停止了梦想才变老。',
    authorZh: '加夫列尔·加西亚·马尔克斯',
    quoteEn: 'People do not stop pursuing dreams because they grow old; they grow old because they stop pursuing dreams.',
    authorEn: 'Gabriel García Márquez',
    quoteJa: '人は年を取ったから夢を見なくなるのではない。夢を見るのをやめたから年を取るのだ。',
    authorJa: 'G・ガルシア＝マルケス',
    quoteKo: '사람은 늙어서 꿈을 멈추는 것이 아니라, 꿈을 멈추기 때문에 늙는 것이다.',
    authorKo: '가브리엘 가르시아 마르케스',
    quoteFr: 'On ne cesse pas de rêver parce qu’on vieillit, on vieillit parce qu’on cesse de rêver.',
    authorFr: 'Gabriel García Márquez',
    quoteRu: 'Люди стареют не от прожитых лет, а оттого, что перестают мечтать.',
    authorRu: 'Габриэль Гарсиа Маркес',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q13',
    sourceType: 'philosophy',
    quoteZh: '人生的快乐，在于心境的安宁与精神的丰盈。',
    authorZh: '马可·奥勒留《沉思录》',
    quoteEn: 'The happiness of your life depends upon the quality of your thoughts.',
    authorEn: 'Marcus Aurelius, Meditations',
    quoteJa: 'あなたの人生の幸福は、あなたの思考の質によって決まる。',
    authorJa: 'マルクス・アウレリウス『自省録』',
    quoteKo: '인생의 행복은 당신의 생각이 지닌 품격에 달려 있다.',
    authorKo: '마르쿠스 아우렐리우스 《명상록》',
    quoteFr: 'Le bonheur de votre vie dépend de la qualité de vos pensées.',
    authorFr: 'Marc Aurèle',
    quoteRu: 'Счастье вашей жизни зависит от качества ваших мыслей.',
    authorRu: 'Марк Аврелий',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q14',
    sourceType: 'literature',
    quoteZh: '愿中国青年都摆脱冷气，只是向上走，能做事的做事，能发声的发声。',
    authorZh: '鲁迅《热风》',
    quoteEn: 'May every young spirit cast off apathy and keep moving upward, lighting a spark wherever there is warmth.',
    authorEn: 'Lu Xun',
    quoteJa: '冷たい空気を振り払い、ただ上へと歩み続けよ。',
    authorJa: '魯迅',
    quoteKo: '차가운 기운을 떨쳐내고 오직 위를 향해 걸어가라.',
    authorKo: '루쉰',
    quoteFr: 'Chassez l’indifférence et avancez toujours vers la lumière.',
    authorFr: 'Lu Xun',
    quoteRu: 'Отбросьте равнодушие и идите вперед, неся свет и тепло.',
    authorRu: 'Лу Синь',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q15',
    sourceType: 'poetry',
    quoteZh: '竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。',
    authorZh: '苏轼《定风波》',
    quoteEn: 'A bamboo staff and straw sandals feel lighter than a steed; why fear? In a mist-drenched cloak I face all of life.',
    authorEn: 'Su Shi, Calming the Waves',
    quoteJa: '竹杖芒鞋馬より軽し、誰か怕れん、一蓑の煙雨平生に任す。',
    authorJa: '蘇軾『定風波』',
    quoteKo: '대나무 지팡이와 짚신이 말보다 가벼우니 무엇이 두려우랴.',
    authorKo: '소식 《정풍파》',
    quoteFr: 'Un bâton de bambou vaut mieux qu’un cheval ; nul besoin de craindre les averses de la vie.',
    authorFr: 'Su Shi',
    quoteRu: 'Бамбуковый посох легче скакуна — к чему страх перед дождем судьбы?',
    authorRu: 'Су Ши',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'q16',
    sourceType: 'prose',
    quoteZh: '在每一个普通的日子里保持热爱，奔赴属于自己的山海。',
    authorZh: '阿尔贝·加缪',
    quoteEn: 'In the midst of winter, I found there was, within me, an invincible summer.',
    authorEn: 'Albert Camus',
    quoteJa: '真冬の中に、私の内には決して打ち負かされない夏があることを知った。',
    authorJa: 'アルベール・カミュ',
    quoteKo: '한겨울의 한복판에서도 나는 내 안에 무너지지 않는 여름이 있음을 발견했다.',
    authorKo: '알베르 카뮈',
    quoteFr: 'Au milieu de l’hiver, j’apprenais enfin qu’il y avait en moi un été invincible.',
    authorFr: 'Albert Camus',
    quoteRu: 'Посреди зимы я наконец понял, что во мне живет непобедимое лето.',
    authorRu: 'Альбер Камю',
    bgImageUrlDark: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=1200&q=80',
    bgImageUrlLight: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80',
  },
];

export function getDailyQuote(date: Date): DailyQuoteItem {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

export function getQuoteBg(quote: DailyQuoteItem, isDark: boolean): string {
  return isDark ? quote.bgImageUrlDark : quote.bgImageUrlLight;
}

export interface BilingualQuoteResult {
  primaryText: string;
  primaryAuthor: string;
  secondaryText: string | null;
  secondaryAuthor: string | null;
}

/**
 * Requirement 4:
 * When in English environment, display only authentic English quote.
 * In all other language environments, display bilingual format:
 * Native language + English subtitle.
 */
export function getBilingualQuote(quote: DailyQuoteItem, lang: Language): BilingualQuoteResult {
  if (lang === 'en') {
    return {
      primaryText: quote.quoteEn,
      primaryAuthor: quote.authorEn,
      secondaryText: null,
      secondaryAuthor: null,
    };
  }

  let nativeText = quote.quoteZh;
  let nativeAuthor = quote.authorZh;

  switch (lang) {
    case 'zh-CN':
    case 'zh-TW':
      nativeText = quote.quoteZh;
      nativeAuthor = quote.authorZh;
      break;
    case 'ja':
      nativeText = quote.quoteJa || quote.quoteZh;
      nativeAuthor = quote.authorJa || quote.authorZh;
      break;
    case 'ko':
      nativeText = quote.quoteKo || quote.quoteZh;
      nativeAuthor = quote.authorKo || quote.authorZh;
      break;
    case 'fr':
      nativeText = quote.quoteFr || quote.quoteEn;
      nativeAuthor = quote.authorFr || quote.authorEn;
      break;
    case 'fa':
      nativeText = quote.quoteFa || quote.quoteEn;
      nativeAuthor = quote.authorFa || quote.authorEn;
      break;
    case 'mn':
      nativeText = quote.quoteMn || quote.quoteEn;
      nativeAuthor = quote.authorMn || quote.authorEn;
      break;
    case 'ru':
      nativeText = quote.quoteRu || quote.quoteEn;
      nativeAuthor = quote.authorRu || quote.authorEn;
      break;
    case 'ug':
      nativeText = quote.quoteUg || quote.quoteZh;
      nativeAuthor = quote.authorUg || quote.authorZh;
      break;
  }

  return {
    primaryText: nativeText,
    primaryAuthor: nativeAuthor,
    secondaryText: quote.quoteEn,
    secondaryAuthor: quote.authorEn,
  };
}
