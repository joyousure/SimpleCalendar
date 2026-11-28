import { Language } from '../types/calendar';

export type TravelModeTab = 'train' | 'flight' | 'transit';
export type TravelSortOption = 'default' | 'earliest' | 'fastest' | 'cheapest';

export interface SeatClassOption {
  name: string;
  price: string;
  numericPrice: number;
  left: string;
}

export interface TrainStopNode {
  station: string;
  arrive: string;
  depart: string;
  stay: string;
}

export interface RichTrainItem {
  trainNo: string;
  trainTag: string;
  from: string;
  to: string;
  fromKeys: string[];
  toKeys: string[];
  depart: string;
  arrive: string;
  duration: string;
  durationMinutes: number;
  punctuality: string;
  minPrice: number;
  amenities: string[];
  stops: TrainStopNode[];
  seats: SeatClassOption[];
}

export interface RichFlightItem {
  flightNo: string;
  airline: string;
  aircraft: string;
  cabinNote: string;
  from: string;
  to: string;
  fromKeys: string[];
  toKeys: string[];
  depart: string;
  arrive: string;
  duration: string;
  durationMinutes: number;
  punctuality: string;
  minPrice: number;
  meal: string;
  baggage: string;
  checkinGateOffsetMin: number;
  seats: SeatClassOption[];
}

export type TransitRegionTag = 'municipality_capital' | 'hk_mo_tw' | 'intl_hub';

export interface TransitTransferOption {
  id: string;
  city: string;
  cityKeys: string[];
  hubPair: string;
  modeIcon: 'rail' | 'bus' | 'taxi';
  modeLabel: string;
  duration: string;
  fare: string;
  frequency: string;
  operatingHours: string;
  notes: string;
  regionTag?: TransitRegionTag;
  airportCode?: string;
  railHub?: string;
}

export interface TravelDirectoryHub {
  code: string;
  kind: 'rail' | 'airport';
  region: 'mainland_capital' | 'mainland_hub' | 'hk_mo_tw' | 'international';
  nameZh: string;
  nameTw: string;
  nameEn: string;
  cityZh: string;
  cityTw: string;
  cityEn: string;
  lat: number;
  lon: number;
  aliases: string[];
}

export interface PopularCorridorChip {
  id: string;
  label: string;
  origin: string;
  dest: string;
}

export interface TravelProLabels {
  modeTrain: string;
  modeFlight: string;
  modeTransit: string;
  sortAll: string;
  sortEarliest: string;
  sortFastest: string;
  sortCheapest: string;
  favoritesOnly: string;
  popularRoutesLabel: string;
  transitHintTitle: string;
  transitSearchPlaceholder: string;
  detailsExpand: string;
  detailsCollapse: string;
  stopsTitle: string;
  facilitiesTitle: string;
  recommendArriveAt: string;
  recommendCheckinAt: string;
  baggageLabel: string;
  mealLabel: string;
  punctualityLabel: string;
  frequencyLabel: string;
  operatingLabel: string;
  addTransitBtn: string;
  addedTransitToast: string;
  favoriteRouteLabel: string;
  unfavoriteRouteLabel: string;
  routeFavoritedToast: string;
  resetFilterBtn: string;
  timeAll: string;
  timeMorning: string;
  timeAfternoon: string;
  timeEvening: string;
  typeAll: string;
  matchedCount: string;
  viaStopPrefix: string;
  searchPlaceholderTrain: string;
  customTripBtn: string;
  customTripFromPh: string;
  customTripToPh: string;
  customTripNoPh: string;
  customTripAddBtn: string;
  customTripAddedToast: string;
}

const TRAVEL_PRO_LABELS: Record<Language, TravelProLabels> = {
  'zh-CN': {
    modeTrain: '高铁动车',
    modeFlight: '民航航班',
    modeTransit: '联程接驳',
    sortAll: '综合推荐',
    sortEarliest: '最早出发',
    sortFastest: '耗时最短',
    sortCheapest: '票价最低',
    favoritesOnly: '已收藏路线',
    popularRoutesLabel: '热门干线',
    transitHintTitle: '枢纽接驳与末公里方案（机场快轨 · 大巴 · 专车）',
    transitSearchPlaceholder: '输入城市/枢纽筛选 (如 北京/上海/广州/东京)',
    detailsExpand: '经停与详情',
    detailsCollapse: '收起详情',
    stopsTitle: '主要停靠站时刻',
    facilitiesTitle: '服务设施',
    recommendArriveAt: '建议进站候车',
    recommendCheckinAt: '建议到达值机',
    baggageLabel: '行李额',
    mealLabel: '餐食',
    punctualityLabel: '准点率',
    frequencyLabel: '发车间隔',
    operatingLabel: '运营时段',
    addTransitBtn: '接驳加日历',
    addedTransitToast: '已将接驳方案「{title}」写入日历',
    favoriteRouteLabel: '收藏该班次',
    unfavoriteRouteLabel: '取消收藏',
    routeFavoritedToast: '已更新收藏班次',
    resetFilterBtn: '查看全部班次',
    timeAll: '全天时段',
    timeMorning: '上午 06-12',
    timeAfternoon: '下午 12-18',
    timeEvening: '晚间 18-24',
    typeAll: '全部车型',
    matchedCount: '匹配 {count} 条',
    viaStopPrefix: '途经',
    searchPlaceholderTrain: '支持站名/车次/途经站模糊搜索 (如 北京→上海 / G1 / 南京)',
    customTripBtn: '自定义行程',
    customTripFromPh: '出发地 / 站点',
    customTripToPh: '目的地 / 站点',
    customTripNoPh: '班次号/备注 (如 G101)',
    customTripAddBtn: '写入日历',
    customTripAddedToast: '已将自定义行程「{title}」加入日历',
  },
  'zh-TW': {
    modeTrain: '高鐵動車',
    modeFlight: '民航航班',
    modeTransit: '聯程接駁',
    sortAll: '綜合推薦',
    sortEarliest: '最早出發',
    sortFastest: '耗時最短',
    sortCheapest: '票價最低',
    favoritesOnly: '已收藏路線',
    popularRoutesLabel: '熱門幹線',
    transitHintTitle: '樞紐接駁與末公里方案（機場快線 · 巴士 · 專車）',
    transitSearchPlaceholder: '輸入城市/樞紐篩選 (如 北京/上海/廣州/東京)',
    detailsExpand: '停靠站與詳情',
    detailsCollapse: '收起詳情',
    stopsTitle: '主要停靠站時刻',
    facilitiesTitle: '服務設施',
    recommendArriveAt: '建議進站候車',
    recommendCheckinAt: '建議到達報到',
    baggageLabel: '行李額度',
    mealLabel: '機上餐飲',
    punctualityLabel: '準點率',
    frequencyLabel: '班距間隔',
    operatingLabel: '營運時段',
    addTransitBtn: '接駁加日曆',
    addedTransitToast: '已將接駁方案「{title}」寫入日曆',
    favoriteRouteLabel: '收藏此班次',
    unfavoriteRouteLabel: '取消收藏',
    routeFavoritedToast: '已更新收藏班次',
    resetFilterBtn: '檢視全部班次',
    timeAll: '全天時段',
    timeMorning: '上午 06-12',
    timeAfternoon: '下午 12-18',
    timeEvening: '晚間 18-24',
    typeAll: '全部車型',
    matchedCount: '符合 {count} 筆',
    viaStopPrefix: '途經',
    searchPlaceholderTrain: '支援站名/車次/經停站搜尋 (如 北京→上海 / G1 / 南京)',
    customTripBtn: '自訂行程',
    customTripFromPh: '出發地 / 站點',
    customTripToPh: '目的地 / 站點',
    customTripNoPh: '班次號/備註 (如 G101)',
    customTripAddBtn: '寫入日曆',
    customTripAddedToast: '已將自訂行程「{title}」加入日曆',
  },
  en: {
    modeTrain: 'High-Speed Rail',
    modeFlight: 'Flights',
    modeTransit: 'Hub Transfers',
    sortAll: 'Recommended',
    sortEarliest: 'Earliest',
    sortFastest: 'Fastest',
    sortCheapest: 'Lowest Fare',
    favoritesOnly: 'Saved Only',
    popularRoutesLabel: 'Popular',
    transitHintTitle: 'Airport & Station Last-Mile Connections (Express Rail · Shuttle · Ride)',
    transitSearchPlaceholder: 'Filter city or hub (e.g. Beijing, Tokyo, Paris)',
    detailsExpand: 'Stops & Details',
    detailsCollapse: 'Hide Details',
    stopsTitle: 'Key Intermediate Stops',
    facilitiesTitle: 'Onboard Amenities',
    recommendArriveAt: 'Arrive Station By',
    recommendCheckinAt: 'Check-In By',
    baggageLabel: 'Baggage',
    mealLabel: 'Meal',
    punctualityLabel: 'On-Time',
    frequencyLabel: 'Headway',
    operatingLabel: 'Hours',
    addTransitBtn: 'Add Transfer',
    addedTransitToast: 'Added "{title}" transfer to calendar',
    favoriteRouteLabel: 'Save route',
    unfavoriteRouteLabel: 'Remove saved',
    routeFavoritedToast: 'Saved routes updated',
    resetFilterBtn: 'Show All Routes',
    timeAll: 'All Day',
    timeMorning: 'Morning',
    timeAfternoon: 'Afternoon',
    timeEvening: 'Evening',
    typeAll: 'All Types',
    matchedCount: '{count} matches',
    viaStopPrefix: 'Via',
    searchPlaceholderTrain: 'Search station, train no. or via-stop (e.g. G1, Nanjing)',
    customTripBtn: 'Custom Trip',
    customTripFromPh: 'Origin',
    customTripToPh: 'Destination',
    customTripNoPh: 'Train / Flight No.',
    customTripAddBtn: 'Add to Calendar',
    customTripAddedToast: 'Added "{title}" to calendar',
  },
  ja: {
    modeTrain: '高速鉄道',
    modeFlight: '航空便',
    modeTransit: '空港・駅アクセス',
    sortAll: 'おすすめ',
    sortEarliest: '早発順',
    sortFastest: '所要最短',
    sortCheapest: '最安値',
    favoritesOnly: 'お気に入り',
    popularRoutesLabel: '主要路線',
    transitHintTitle: '空港・主要駅からの二次交通（特急・リムジンバス・配車）',
    transitSearchPlaceholder: '都市・空港名で検索 (例: 東京/北京/上海)',
    detailsExpand: '停車駅・詳細',
    detailsCollapse: '詳細を閉じる',
    stopsTitle: '主な停車駅と時刻',
    facilitiesTitle: '車内設備',
    recommendArriveAt: '推奨到着時刻',
    recommendCheckinAt: 'チェックイン目安',
    baggageLabel: '手荷物',
    mealLabel: '機内食',
    punctualityLabel: '定時率',
    frequencyLabel: '運行間隔',
    operatingLabel: '運行時間',
    addTransitBtn: 'アクセス登録',
    addedTransitToast: '乗継案内「{title}」をカレンダーに追加しました',
    favoriteRouteLabel: 'お気に入り登録',
    unfavoriteRouteLabel: '登録解除',
    routeFavoritedToast: 'お気に入りを更新しました',
    resetFilterBtn: 'すべて表示',
    timeAll: '終日',
    timeMorning: '午前',
    timeAfternoon: '午後',
    timeEvening: '夜間',
    typeAll: '全種別',
    matchedCount: '{count}件',
    viaStopPrefix: '経由',
    searchPlaceholderTrain: '駅名・列車番号・経由駅で検索 (例: G1 / 南京)',
    customTripBtn: 'カスタム予定',
    customTripFromPh: '出発地',
    customTripToPh: '目的地',
    customTripNoPh: '便名/列車番号',
    customTripAddBtn: 'カレンダー登録',
    customTripAddedToast: '「{title}」をカレンダーに追加しました',
  },
  ko: {
    modeTrain: '고속철도',
    modeFlight: '항공편',
    modeTransit: '환승·연계교통',
    sortAll: '추천순',
    sortEarliest: '빠른 출발',
    sortFastest: '최단 시간',
    sortCheapest: '최저가',
    favoritesOnly: '즐겨찾기',
    popularRoutesLabel: '인기 노선',
    transitHintTitle: '공항·역 연계 교통 비교 (공항철도 · 리무진 · 택시)',
    transitSearchPlaceholder: '도시/허브 검색 (예: 서울, 베이징, 도쿄)',
    detailsExpand: '정차역 및 상세',
    detailsCollapse: '상세 접기',
    stopsTitle: '주요 정차역 시간표',
    facilitiesTitle: '열차 편의시설',
    recommendArriveAt: '권장 역 도착',
    recommendCheckinAt: '수속 권장 시각',
    baggageLabel: '수하물',
    mealLabel: '기내식',
    punctualityLabel: '정시율',
    frequencyLabel: '배차 간격',
    operatingLabel: '운행 시간',
    addTransitBtn: '일정 등록',
    addedTransitToast: '"{title}" 연계 일정을 캘린더에 추가했습니다',
    favoriteRouteLabel: '노선 저장',
    unfavoriteRouteLabel: '저장 해제',
    routeFavoritedToast: '저장된 노선이 업데이트되었습니다',
    resetFilterBtn: '전체 노선 보기',
    timeAll: '전체',
    timeMorning: '오전',
    timeAfternoon: '오후',
    timeEvening: '저녁',
    typeAll: '전체 열차',
    matchedCount: '{count}건',
    viaStopPrefix: '경유',
    searchPlaceholderTrain: '역명·열차번호·경유역 검색 (예: G1 / 난징)',
    customTripBtn: '일정 직접 추가',
    customTripFromPh: '출발지',
    customTripToPh: '도착지',
    customTripNoPh: '열차/항공편 번호',
    customTripAddBtn: '캘린더 추가',
    customTripAddedToast: '"{title}" 일정을 캘린더에 추가했습니다',
  },
  fr: {
    modeTrain: 'Trains GV',
    modeFlight: 'Vols',
    modeTransit: 'Correspondances',
    sortAll: 'Recommandé',
    sortEarliest: 'Plus tôt',
    sortFastest: 'Plus rapide',
    sortCheapest: 'Moins cher',
    favoritesOnly: 'Favoris',
    popularRoutesLabel: 'Lignes phares',
    transitHintTitle: 'Liaisons aéroport & gare (RER/Express · Navette · VTC)',
    transitSearchPlaceholder: 'Filtrer ville ou pôle (ex. Paris, Pékin, Tokyo)',
    detailsExpand: 'Arrêts & détails',
    detailsCollapse: 'Masquer',
    stopsTitle: 'Gares desservies',
    facilitiesTitle: 'Services à bord',
    recommendArriveAt: 'Arrivée conseillée',
    recommendCheckinAt: 'Enregistrement avant',
    baggageLabel: 'Bagages',
    mealLabel: 'Repas',
    punctualityLabel: 'Ponctualité',
    frequencyLabel: 'Fréquence',
    operatingLabel: 'Horaires',
    addTransitBtn: 'Ajouter trajet',
    addedTransitToast: 'Trajet « {title} » ajouté au calendrier',
    favoriteRouteLabel: 'Enregistrer',
    unfavoriteRouteLabel: 'Retirer favori',
    routeFavoritedToast: 'Favoris mis à jour',
    resetFilterBtn: 'Tout afficher',
    timeAll: 'Toute la journée',
    timeMorning: 'Matin',
    timeAfternoon: 'Après-midi',
    timeEvening: 'Soir',
    typeAll: 'Tous',
    matchedCount: '{count} résultats',
    viaStopPrefix: 'Via',
    searchPlaceholderTrain: 'Gare, n° de train ou arrêt (ex. G1, Nankin)',
    customTripBtn: 'Trajet perso',
    customTripFromPh: 'Départ',
    customTripToPh: 'Arrivée',
    customTripNoPh: 'N° train / vol',
    customTripAddBtn: 'Ajouter',
    customTripAddedToast: '« {title} » ajouté au calendrier',
  },
  ru: {
    modeTrain: 'Скоростные поезда',
    modeFlight: 'Авиарейсы',
    modeTransit: 'Трансфер и стыковки',
    sortAll: 'Рекомендуемые',
    sortEarliest: 'Раньше всех',
    sortFastest: 'Быстрее всех',
    sortCheapest: 'Дешевле',
    favoritesOnly: 'Избранное',
    popularRoutesLabel: 'Популярные',
    transitHintTitle: 'Трансфер из аэропортов и вокзалов (Аэроэкспресс · Автобус · Такси)',
    transitSearchPlaceholder: 'Город или узел (напр. Пекин, Шанхай, Токио)',
    detailsExpand: 'Остановки и детали',
    detailsCollapse: 'Скрыть',
    stopsTitle: 'Ключевые остановки',
    facilitiesTitle: 'Удобства в пути',
    recommendArriveAt: 'Прибыть на вокзал',
    recommendCheckinAt: 'Регистрация до',
    baggageLabel: 'Багаж',
    mealLabel: 'Питание',
    punctualityLabel: 'Пунктуальность',
    frequencyLabel: 'Интервал',
    operatingLabel: 'Режим работы',
    addTransitBtn: 'В календарь',
    addedTransitToast: 'Трансфер «{title}» добавлен в календарь',
    favoriteRouteLabel: 'В избранное',
    unfavoriteRouteLabel: 'Убрать из избранного',
    routeFavoritedToast: 'Избранное обновлено',
    resetFilterBtn: 'Все рейсы',
    timeAll: 'Весь день',
    timeMorning: 'Утро',
    timeAfternoon: 'День',
    timeEvening: 'Вечер',
    typeAll: 'Все типы',
    matchedCount: 'Найдено: {count}',
    viaStopPrefix: 'Через',
    searchPlaceholderTrain: 'Станция, номер поезда или остановка',
    customTripBtn: 'Свой маршрут',
    customTripFromPh: 'Откуда',
    customTripToPh: 'Куда',
    customTripNoPh: 'Номер рейса/поезда',
    customTripAddBtn: 'В календарь',
    customTripAddedToast: 'Маршрут «{title}» добавлен',
  },
  fa: {
    modeTrain: 'قطار سریع‌السیر',
    modeFlight: 'پروازها',
    modeTransit: 'ترانسفر و اتصال',
    sortAll: 'پیشنهادی',
    sortEarliest: 'زودترین',
    sortFastest: 'سریع‌ترین',
    sortCheapest: 'ارزان‌ترین',
    favoritesOnly: 'ذخیره‌شده‌ها',
    popularRoutesLabel: 'مسیرهای پرتردد',
    transitHintTitle: 'اتصال فرودگاه و ایستگاه (قطار سریع · شاتل · تاکسی)',
    transitSearchPlaceholder: 'فیلتر شهر یا فرودگاه (پکن، توکیو، پاریس)',
    detailsExpand: 'ایستگاه‌ها و جزئیات',
    detailsCollapse: 'بستن جزئیات',
    stopsTitle: 'ایستگاه‌های میانی',
    facilitiesTitle: 'امکانات داخل قطار',
    recommendArriveAt: 'حضور در ایستگاه تا',
    recommendCheckinAt: 'پذیرش پرواز تا',
    baggageLabel: 'بار مجاز',
    mealLabel: 'پذیرایی',
    punctualityLabel: 'به‌موقع بودن',
    frequencyLabel: 'فاصله حرکت',
    operatingLabel: 'ساعات کاری',
    addTransitBtn: 'افزودن به تقویم',
    addedTransitToast: 'مسیر «{title}» به تقویم اضافه شد',
    favoriteRouteLabel: 'ذخیره مسیر',
    unfavoriteRouteLabel: 'حذف ذخیره',
    routeFavoritedToast: 'مسیرهای ذخیره‌شده به‌روز شد',
    resetFilterBtn: 'نمایش همه',
    timeAll: 'همه ساعات',
    timeMorning: 'صبح',
    timeAfternoon: 'بعدازظهر',
    timeEvening: 'شب',
    typeAll: 'همه',
    matchedCount: '{count} مورد',
    viaStopPrefix: 'از طریق',
    searchPlaceholderTrain: 'جستجوی ایستگاه، شماره قطار یا توقف',
    customTripBtn: 'سفر دلخواه',
    customTripFromPh: 'مبدا',
    customTripToPh: 'مقصد',
    customTripNoPh: 'شماره قطار/پرواز',
    customTripAddBtn: 'افزودن',
    customTripAddedToast: 'مسیر «{title}» اضافه شد',
  },
  mn: {
    modeTrain: 'Хурдны галт тэрэг',
    modeFlight: 'Нислэг',
    modeTransit: 'Шилжилт ба унаа',
    sortAll: 'Санал болгох',
    sortEarliest: 'Хамгийн эрт',
    sortFastest: 'Хамгийн хурдан',
    sortCheapest: 'Хямд үнэ',
    favoritesOnly: 'Хадгалсан',
    popularRoutesLabel: 'Түгээмэл чиглэл',
    transitHintTitle: 'Нисэх буудал ба галт тэрэгний холбох унаа (Экспресс · Автобус · Такси)',
    transitSearchPlaceholder: 'Хот/буудал хайх (Бээжин, Шанхай, Токио)',
    detailsExpand: 'Зогсоол ба дэлгэрэнгүй',
    detailsCollapse: 'Хураах',
    stopsTitle: 'Үндсэн зогсоолууд',
    facilitiesTitle: 'Үйлчилгээ',
    recommendArriveAt: 'Буудалд очих цаг',
    recommendCheckinAt: 'Бүртгүүлэх цаг',
    baggageLabel: 'Тээш',
    mealLabel: 'Хоол',
    punctualityLabel: 'Цаг барилт',
    frequencyLabel: 'Зай',
    operatingLabel: 'Цагийн хуваарь',
    addTransitBtn: 'Хуанлид нэмэх',
    addedTransitToast: '"{title}" чиглэл хуанлид нэмэгдлээ',
    favoriteRouteLabel: 'Хадгалах',
    unfavoriteRouteLabel: 'Устгах',
    routeFavoritedToast: 'Хадгалсан чиглэл шинэчлэгдлээ',
    resetFilterBtn: 'Бүх чиглэл',
    timeAll: 'Бүх цаг',
    timeMorning: 'Өглөө',
    timeAfternoon: 'Өдөр',
    timeEvening: 'Орой',
    typeAll: 'Бүгд',
    matchedCount: '{count} илэрц',
    viaStopPrefix: 'Дамжих',
    searchPlaceholderTrain: 'Буудал, галт тэрэгний дугаар хайх',
    customTripBtn: 'Аялал нэмэх',
    customTripFromPh: 'Хаанаас',
    customTripToPh: 'Хаашаа',
    customTripNoPh: 'Дугаар',
    customTripAddBtn: 'Нэмэх',
    customTripAddedToast: '"{title}" нэмэгдлээ',
  },
  ug: {
    modeTrain: 'يۇقىرى سۈرئەتلىك پويىز',
    modeFlight: 'نۆۋەتچى ئايروپىلان',
    modeTransit: 'ئۇلاش قاتنىشى',
    sortAll: 'تەۋسىيە',
    sortEarliest: 'ئەڭ بالدۇر',
    sortFastest: 'ئەڭ تېز',
    sortCheapest: 'ئەڭ ئەرزان',
    favoritesOnly: 'ساقلانغانلار',
    popularRoutesLabel: 'قىزىق لىنىيە',
    transitHintTitle: 'ئايرودروم ۋە بېكەت ئۇلاش لايىھەسى (تېز رېلىس · ئاپتوبۇس · تاكسى)',
    transitSearchPlaceholder: 'شەھەر/بېكەت سۈزۈش (بېيجىڭ، شاڭخەي، توكيو)',
    detailsExpand: 'بېكەت ۋە تەپسىلات',
    detailsCollapse: 'يىغىش',
    stopsTitle: 'ئاساسلىق توختاش بېكەتلىرى',
    facilitiesTitle: 'ئەسلىھەلەر',
    recommendArriveAt: 'بېكەتكە يېتىش ۋاقتى',
    recommendCheckinAt: 'تىزىملىتىش ۋاقتى',
    baggageLabel: 'يۈك-تاق',
    mealLabel: 'تاماق',
    punctualityLabel: 'ۋاقىت نىسبىتى',
    frequencyLabel: 'ئارىلىقى',
    operatingLabel: 'ئىش ۋاقتى',
    addTransitBtn: 'كالېندارغا قوشۇش',
    addedTransitToast: '«{title}» كالېندارغا قوشۇلدى',
    favoriteRouteLabel: 'ساقلاش',
    unfavoriteRouteLabel: 'ئۆچۈرۈش',
    routeFavoritedToast: 'ساقلانغان لىنىيە يېڭىلاندى',
    resetFilterBtn: 'ھەممىنى كۆرۈش',
    timeAll: 'پۈتۈن كۈن',
    timeMorning: 'چۈشتىن بۇرۇن',
    timeAfternoon: 'چۈشتىن كېيىن',
    timeEvening: 'كەچ',
    typeAll: 'ھەممىسى',
    matchedCount: '{count} نەتىجە',
    viaStopPrefix: 'ئارقىلىق',
    searchPlaceholderTrain: 'بېكەت، قېتىم نومۇرى ياكى ئۆتەر بېكەت',
    customTripBtn: 'ئىختىيارىي سەپەر',
    customTripFromPh: 'باشلىنىش',
    customTripToPh: 'مەنزىل',
    customTripNoPh: 'قېتىم نومۇرى',
    customTripAddBtn: 'قوشۇش',
    customTripAddedToast: '«{title}» قوشۇلدى',
  },
};

export function getTravelProLabels(lang: Language): TravelProLabels {
  return TRAVEL_PRO_LABELS[lang] || TRAVEL_PRO_LABELS.en;
}

export function subtractMinutesFromHHMM(hhmm: string, mins: number): string {
  const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return hhmm;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  let total = h * 60 + m - mins;
  if (total < 0) total += 24 * 60;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export function getPopularCorridors(
  mode: 'train' | 'flight',
  lang: Language
): PopularCorridorChip[] {
  const isZhCn = lang === 'zh-CN';
  const isZhTw = lang === 'zh-TW';
  if (mode === 'train') {
    if (isZhCn) {
      return [
        { id: 'bj-sh', label: '北京 ⇄ 上海', origin: '北京', dest: '上海' },
        { id: 'gz-sz', label: '广州 ⇄ 深圳', origin: '广州', dest: '深圳' },
        { id: 'bj-gz', label: '北京 ⇄ 广州', origin: '北京', dest: '广州' },
        { id: 'sh-hz', label: '上海 ⇄ 杭州', origin: '上海', dest: '杭州' },
        { id: 'bj-cd', label: '北京 ⇄ 成都', origin: '北京', dest: '成都' },
      ];
    }
    if (isZhTw) {
      return [
        { id: 'bj-sh', label: '北京 ⇄ 上海', origin: '北京', dest: '上海' },
        { id: 'gz-sz', label: '廣州 ⇄ 深圳', origin: '廣州', dest: '深圳' },
        { id: 'bj-gz', label: '北京 ⇄ 廣州', origin: '北京', dest: '廣州' },
        { id: 'sh-hz', label: '上海 ⇄ 杭州', origin: '上海', dest: '杭州' },
        { id: 'bj-cd', label: '北京 ⇄ 成都', origin: '北京', dest: '成都' },
      ];
    }
    return [
      { id: 'bj-sh', label: 'Beijing ⇄ Shanghai', origin: 'Beijing', dest: 'Shanghai' },
      { id: 'gz-sz', label: 'Guangzhou ⇄ Shenzhen', origin: 'Guangzhou', dest: 'Shenzhen' },
      { id: 'bj-gz', label: 'Beijing ⇄ Guangzhou', origin: 'Beijing', dest: 'Guangzhou' },
      { id: 'sh-hz', label: 'Shanghai ⇄ Hangzhou', origin: 'Shanghai', dest: 'Hangzhou' },
      { id: 'bj-cd', label: 'Beijing ⇄ Chengdu', origin: 'Beijing', dest: 'Chengdu' },
    ];
  }

  if (isZhCn) {
    return [
      { id: 'can-bj', label: '广州 ⇄ 北京', origin: '广州', dest: '北京' },
      { id: 'can-sh', label: '广州 ⇄ 上海', origin: '广州', dest: '上海' },
      { id: 'can-cd', label: '广州 ⇄ 成都', origin: '广州', dest: '成都' },
      { id: 'pek-hnd', label: '北京 ⇄ 东京', origin: '北京', dest: '东京' },
      { id: 'pvg-sin', label: '上海 ⇄ 新加坡', origin: '上海', dest: '新加坡' },
    ];
  }
  if (isZhTw) {
    return [
      { id: 'can-bj', label: '廣州 ⇄ 北京', origin: '廣州', dest: '北京' },
      { id: 'can-sh', label: '廣州 ⇄ 上海', origin: '廣州', dest: '上海' },
      { id: 'can-cd', label: '廣州 ⇄ 成都', origin: '廣州', dest: '成都' },
      { id: 'pek-hnd', label: '北京 ⇄ 東京', origin: '北京', dest: '東京' },
      { id: 'pvg-sin', label: '上海 ⇄ 新加坡', origin: '上海', dest: '新加坡' },
    ];
  }
  return [
    { id: 'can-bj', label: 'CAN ⇄ PKX', origin: 'Guangzhou', dest: 'Beijing' },
    { id: 'can-sh', label: 'CAN ⇄ SHA', origin: 'Guangzhou', dest: 'Shanghai' },
    { id: 'can-cd', label: 'CAN ⇄ TFU', origin: 'Guangzhou', dest: 'Chengdu' },
    { id: 'pek-hnd', label: 'PEK ⇄ HND', origin: 'Beijing', dest: 'Tokyo' },
    { id: 'pvg-sin', label: 'PVG ⇄ SIN', origin: 'Shanghai', dest: 'Singapore' },
  ];
}

export function getRichTrainList(lang: Language): RichTrainItem[] {
  const isZh = lang === 'zh-CN' || lang === 'zh-TW';
  const isTw = lang === 'zh-TW';

  if (!isZh) {
    return [
      {
        trainNo: 'G1',
        trainTag: 'Fuxing Smart',
        from: 'Beijing South',
        to: 'Shanghai Hongqiao',
        fromKeys: ['beijing', 'bj', 'pek', '北京', '北京南'],
        toKeys: ['shanghai', 'sh', 'sha', '上海', '上海虹桥', '上海虹橋'],
        depart: '09:00',
        arrive: '13:18',
        duration: '4h18m',
        durationMinutes: 258,
        punctuality: '99.4%',
        minPrice: 662,
        amenities: ['Wi-Fi', 'Quiet Car', 'Power Outlets', 'Bistro'],
        stops: [
          { station: 'Beijing South', arrive: '--', depart: '09:00', stay: 'Start' },
          { station: 'Jinan West', arrive: '10:22', depart: '10:24', stay: '2m' },
          { station: 'Nanjing South', arrive: '12:14', depart: '12:17', stay: '3m' },
          { station: 'Shanghai Hongqiao', arrive: '13:18', depart: '--', stay: 'End' },
        ],
        seats: [
          { name: '2nd Class', price: '¥662', numericPrice: 662, left: 'Avail' },
          { name: '1st Class', price: '¥1,060', numericPrice: 1060, left: 'Avail' },
          { name: 'Business', price: '¥2,318', numericPrice: 2318, left: '2' },
        ],
      },
      {
        trainNo: 'G2',
        trainTag: 'Fuxing Smart',
        from: 'Shanghai Hongqiao',
        to: 'Beijing South',
        fromKeys: ['shanghai', 'sh', 'sha', '上海', '上海虹桥', '上海虹橋'],
        toKeys: ['beijing', 'bj', 'pek', '北京', '北京南'],
        depart: '09:00',
        arrive: '13:20',
        duration: '4h20m',
        durationMinutes: 260,
        punctuality: '99.2%',
        minPrice: 662,
        amenities: ['Wi-Fi', 'Quiet Car', 'Power Outlets'],
        stops: [
          { station: 'Shanghai Hongqiao', arrive: '--', depart: '09:00', stay: 'Start' },
          { station: 'Nanjing South', arrive: '09:59', depart: '10:02', stay: '3m' },
          { station: 'Jinan West', arrive: '11:55', depart: '11:57', stay: '2m' },
          { station: 'Beijing South', arrive: '13:20', depart: '--', stay: 'End' },
        ],
        seats: [
          { name: '2nd Class', price: '¥662', numericPrice: 662, left: 'Avail' },
          { name: '1st Class', price: '¥1,060', numericPrice: 1060, left: 'Avail' },
          { name: 'Business', price: '¥2,318', numericPrice: 2318, left: '3' },
        ],
      },
      {
        trainNo: 'G13',
        trainTag: 'Fuxing Express',
        from: 'Beijing South',
        to: 'Shanghai Hongqiao',
        fromKeys: ['beijing', 'bj', 'pek', '北京', '北京南'],
        toKeys: ['shanghai', 'sh', 'sha', '上海', '上海虹桥', '上海虹橋'],
        depart: '10:00',
        arrive: '14:28',
        duration: '4h28m',
        durationMinutes: 268,
        punctuality: '98.9%',
        minPrice: 662,
        amenities: ['Wi-Fi', 'Power Outlets', 'Bistro'],
        stops: [
          { station: 'Beijing South', arrive: '--', depart: '10:00', stay: 'Start' },
          { station: 'Tianjin South', arrive: '10:34', depart: '10:36', stay: '2m' },
          { station: 'Nanjing South', arrive: '13:24', depart: '13:27', stay: '3m' },
          { station: 'Shanghai Hongqiao', arrive: '14:28', depart: '--', stay: 'End' },
        ],
        seats: [
          { name: '2nd Class', price: '¥662', numericPrice: 662, left: 'Avail' },
          { name: '1st Class', price: '¥1,060', numericPrice: 1060, left: 'Waitlist' },
          { name: 'Business', price: '¥2,318', numericPrice: 2318, left: 'Avail' },
        ],
      },
      {
        trainNo: 'G6501',
        trainTag: 'Intercity Express',
        from: 'Guangzhou South',
        to: 'Shenzhen North',
        fromKeys: ['guangzhou', 'gz', '广州', '广州南', '廣州南'],
        toKeys: ['shenzhen', 'sz', '深圳', '深圳北'],
        depart: '08:05',
        arrive: '08:34',
        duration: '29m',
        durationMinutes: 29,
        punctuality: '99.6%',
        minPrice: 74.5,
        amenities: ['Wi-Fi', 'Power Outlets'],
        stops: [
          { station: 'Guangzhou South', arrive: '--', depart: '08:05', stay: 'Start' },
          { station: 'Humen', arrive: '08:19', depart: '08:21', stay: '2m' },
          { station: 'Shenzhen North', arrive: '08:34', depart: '--', stay: 'End' },
        ],
        seats: [
          { name: '2nd Class', price: '¥74.5', numericPrice: 74.5, left: 'Avail' },
          { name: '1st Class', price: '¥99.5', numericPrice: 99.5, left: 'Avail' },
          { name: 'Business', price: '¥199.5', numericPrice: 199.5, left: '6' },
        ],
      },
      {
        trainNo: 'G6502',
        trainTag: 'Intercity Express',
        from: 'Shenzhen North',
        to: 'Guangzhou South',
        fromKeys: ['shenzhen', 'sz', '深圳', '深圳北'],
        toKeys: ['guangzhou', 'gz', '广州', '广州南', '廣州南'],
        depart: '09:15',
        arrive: '09:44',
        duration: '29m',
        durationMinutes: 29,
        punctuality: '99.5%',
        minPrice: 74.5,
        amenities: ['Wi-Fi', 'Power Outlets'],
        stops: [
          { station: 'Shenzhen North', arrive: '--', depart: '09:15', stay: 'Start' },
          { station: 'Guangmingcheng', arrive: '09:26', depart: '09:28', stay: '2m' },
          { station: 'Guangzhou South', arrive: '09:44', depart: '--', stay: 'End' },
        ],
        seats: [
          { name: '2nd Class', price: '¥74.5', numericPrice: 74.5, left: 'Avail' },
          { name: '1st Class', price: '¥99.5', numericPrice: 99.5, left: 'Avail' },
          { name: 'Business', price: '¥199.5', numericPrice: 199.5, left: '4' },
        ],
      },
      {
        trainNo: 'G79',
        trainTag: 'Fuxing 350km/h',
        from: 'Beijing West',
        to: 'Guangzhou South',
        fromKeys: ['beijing', 'bj', '北京', '北京西'],
        toKeys: ['guangzhou', 'gz', '广州', '广州南', '廣州南'],
        depart: '10:00',
        arrive: '17:38',
        duration: '7h38m',
        durationMinutes: 458,
        punctuality: '98.7%',
        minPrice: 938,
        amenities: ['Wi-Fi', 'Quiet Car', 'Bistro', 'Power Outlets'],
        stops: [
          { station: 'Beijing West', arrive: '--', depart: '10:00', stay: 'Start' },
          { station: 'Zhengzhou East', arrive: '12:12', depart: '12:15', stay: '3m' },
          { station: 'Wuhan', arrive: '13:45', depart: '13:49', stay: '4m' },
          { station: 'Changsha South', arrive: '15:08', depart: '15:11', stay: '3m' },
          { station: 'Guangzhou South', arrive: '17:38', depart: '--', stay: 'End' },
        ],
        seats: [
          { name: '2nd Class', price: '¥938', numericPrice: 938, left: 'Avail' },
          { name: '1st Class', price: '¥1,500', numericPrice: 1500, left: 'Avail' },
          { name: 'Business', price: '¥3,275', numericPrice: 3275, left: '5' },
        ],
      },
      {
        trainNo: 'G87',
        trainTag: 'Fuxing Smart',
        from: 'Beijing West',
        to: 'Chengdu East',
        fromKeys: ['beijing', 'bj', '北京', '北京西'],
        toKeys: ['chengdu', 'cd', '成都', '成都东', '成都東'],
        depart: '07:00',
        arrive: '14:31',
        duration: '7h31m',
        durationMinutes: 451,
        punctuality: '98.4%',
        minPrice: 778.5,
        amenities: ['Wi-Fi', 'Quiet Car', 'Bistro', 'Power Outlets'],
        stops: [
          { station: 'Beijing West', arrive: '--', depart: '07:00', stay: 'Start' },
          { station: 'Shijiazhuang', arrive: '07:59', depart: '08:01', stay: '2m' },
          { station: "Xi'an North", arrive: '11:12', depart: '11:16', stay: '4m' },
          { station: 'Chengdu East', arrive: '14:31', depart: '--', stay: 'End' },
        ],
        seats: [
          { name: '2nd Class', price: '¥778.5', numericPrice: 778.5, left: 'Avail' },
          { name: '1st Class', price: '¥1,245', numericPrice: 1245, left: 'Avail' },
          { name: 'Business', price: '¥2,456', numericPrice: 2456, left: '2' },
        ],
      },
      {
        trainNo: 'G7301',
        trainTag: 'Yangtze Express',
        from: 'Shanghai Hongqiao',
        to: 'Hangzhou East',
        fromKeys: ['shanghai', 'sh', 'sha', '上海', '上海虹桥', '上海虹橋'],
        toKeys: ['hangzhou', 'hz', 'hgh', '杭州', '杭州东', '杭州東'],
        depart: '07:35',
        arrive: '08:20',
        duration: '45m',
        durationMinutes: 45,
        punctuality: '99.7%',
        minPrice: 73,
        amenities: ['Wi-Fi', 'Power Outlets'],
        stops: [
          { station: 'Shanghai Hongqiao', arrive: '--', depart: '07:35', stay: 'Start' },
          { station: 'Jiaxing South', arrive: '07:58', depart: '08:00', stay: '2m' },
          { station: 'Hangzhou East', arrive: '08:20', depart: '--', stay: 'End' },
        ],
        seats: [
          { name: '2nd Class', price: '¥73', numericPrice: 73, left: 'Avail' },
          { name: '1st Class', price: '¥117', numericPrice: 117, left: 'Avail' },
          { name: 'Business', price: '¥219.5', numericPrice: 219.5, left: '8' },
        ],
      },
      {
        trainNo: 'D321',
        trainTag: 'D-Sleeper',
        from: 'Shanghai Hongqiao',
        to: 'Shenzhen North',
        fromKeys: ['shanghai', 'sh', 'sha', '上海', '上海虹桥', '上海虹橋'],
        toKeys: ['shenzhen', 'sz', '深圳', '深圳北'],
        depart: '11:15',
        arrive: '21:08',
        duration: '9h53m',
        durationMinutes: 593,
        punctuality: '97.9%',
        minPrice: 482,
        amenities: ['Power Outlets', 'Bistro'],
        stops: [
          { station: 'Shanghai Hongqiao', arrive: '--', depart: '11:15', stay: 'Start' },
          { station: 'Hangzhou East', arrive: '12:08', depart: '12:12', stay: '4m' },
          { station: 'Fuzhou South', arrive: '16:54', depart: '16:58', stay: '4m' },
          { station: 'Xiamen North', arrive: '18:22', depart: '18:26', stay: '4m' },
          { station: 'Shenzhen North', arrive: '21:08', depart: '--', stay: 'End' },
        ],
        seats: [
          { name: '2nd Class', price: '¥482', numericPrice: 482, left: 'Avail' },
          { name: '1st Sleeper', price: '¥750', numericPrice: 750, left: 'Avail' },
        ],
      },
      {
        trainNo: 'C2001',
        trainTag: 'Intercity Fuxing',
        from: 'Beijing South',
        to: 'Tianjin',
        fromKeys: ['beijing', 'bj', 'pek', '北京', '北京南'],
        toKeys: ['tianjin', 'tj', 'tsn', '天津', '天津站'],
        depart: '06:45',
        arrive: '07:15',
        duration: '30m',
        durationMinutes: 30,
        punctuality: '99.8%',
        minPrice: 54.5,
        amenities: ['Wi-Fi', 'Power Outlets'],
        stops: [
          { station: 'Beijing South', arrive: '--', depart: '06:45', stay: 'Start' },
          { station: 'Tianjin', arrive: '07:15', depart: '--', stay: 'End' },
        ],
        seats: [
          { name: '2nd Class', price: '¥54.5', numericPrice: 54.5, left: 'Avail' },
          { name: '1st Class', price: '¥88', numericPrice: 88, left: 'Avail' },
          { name: 'Business', price: '¥174', numericPrice: 174, left: '5' },
        ],
      },
      {
        trainNo: 'G27',
        trainTag: 'Fuxing Express',
        from: 'Beijing South',
        to: 'Shanghai Hongqiao',
        fromKeys: ['beijing', 'bj', 'pek', '北京', '北京南'],
        toKeys: ['shanghai', 'sh', 'sha', '上海', '上海虹桥', '上海虹橋'],
        depart: '19:00',
        arrive: '23:18',
        duration: '4h18m',
        durationMinutes: 258,
        punctuality: '99.3%',
        minPrice: 662,
        amenities: ['Wi-Fi', 'Quiet Car', 'Power Outlets', 'Bistro'],
        stops: [
          { station: 'Beijing South', arrive: '--', depart: '19:00', stay: 'Start' },
          { station: 'Nanjing South', arrive: '22:13', depart: '22:15', stay: '2m' },
          { station: 'Shanghai Hongqiao', arrive: '23:18', depart: '--', stay: 'End' },
        ],
        seats: [
          { name: '2nd Class', price: '¥662', numericPrice: 662, left: 'Avail' },
          { name: '1st Class', price: '¥1,060', numericPrice: 1060, left: 'Avail' },
          { name: 'Business', price: '¥2,318', numericPrice: 2318, left: 'Avail' },
        ],
      },
      {
        trainNo: 'D901',
        trainTag: 'Overnight Sleeper',
        from: 'Beijing West',
        to: 'Hong Kong West Kowloon',
        fromKeys: ['beijing', 'bj', 'pek', '北京', '北京西'],
        toKeys: ['hongkong', 'hk', 'hkg', '香港', '西九龙', '西九龍', '深圳北'],
        depart: '20:13',
        arrive: '08:47+1',
        duration: '12h34m',
        durationMinutes: 754,
        punctuality: '99.1%',
        minPrice: 936,
        amenities: ['Sleeper Berths', 'Power Outlets', 'Bistro'],
        stops: [
          { station: 'Beijing West', arrive: '--', depart: '20:13', stay: 'Start' },
          { station: 'Shijiazhuang', arrive: '21:16', depart: '21:19', stay: '3m' },
          { station: 'Guangzhou', arrive: '06:58', depart: '07:03', stay: '5m' },
          { station: 'Shenzhen North', arrive: '08:15', depart: '08:19', stay: '4m' },
          { station: 'Hong Kong West Kowloon', arrive: '08:47', depart: '--', stay: 'End' },
        ],
        seats: [
          { name: '2nd Class', price: '¥936', numericPrice: 936, left: 'Avail' },
          { name: 'Sleeper', price: '¥1,580', numericPrice: 1580, left: '4' },
        ],
      },
    ];
  }

  return [
    {
      trainNo: 'G1',
      trainTag: isTw ? '復興號智能組' : '复兴号智能组',
      from: '北京南',
      to: isTw ? '上海虹橋' : '上海虹桥',
      fromKeys: ['beijing', 'bj', 'pek', '北京', '北京南'],
      toKeys: ['shanghai', 'sh', 'sha', '上海', '上海虹桥', '上海虹橋'],
      depart: '09:00',
      arrive: '13:18',
      duration: isTw ? '4時18分' : '4时18分',
      durationMinutes: 258,
      punctuality: '99.4%',
      minPrice: 662,
      amenities: isTw ? ['免費Wi-Fi', '靜音車廂', '充電口', '餐車'] : ['免费Wi-Fi', '静音车厢', '充电口', '餐车'],
      stops: [
        { station: '北京南', arrive: '--', depart: '09:00', stay: isTw ? '始發' : '始发' },
        { station: isTw ? '濟南西' : '济南西', arrive: '10:22', depart: '10:24', stay: '2分' },
        { station: '南京南', arrive: '12:14', depart: '12:17', stay: '3分' },
        { station: isTw ? '上海虹橋' : '上海虹桥', arrive: '13:18', depart: '--', stay: isTw ? '終點' : '终点' },
      ],
      seats: [
        { name: '二等座', price: '¥662', numericPrice: 662, left: '有票' },
        { name: '一等座', price: '¥1,060', numericPrice: 1060, left: '有票' },
        { name: isTw ? '商務座' : '商务座', price: '¥2,318', numericPrice: 2318, left: isTw ? '2張' : '2张' },
      ],
    },
    {
      trainNo: 'G2',
      trainTag: isTw ? '復興號智能組' : '复兴号智能组',
      from: isTw ? '上海虹橋' : '上海虹桥',
      to: '北京南',
      fromKeys: ['shanghai', 'sh', 'sha', '上海', '上海虹桥', '上海虹橋'],
      toKeys: ['beijing', 'bj', 'pek', '北京', '北京南'],
      depart: '09:00',
      arrive: '13:20',
      duration: isTw ? '4時20分' : '4时20分',
      durationMinutes: 260,
      punctuality: '99.2%',
      minPrice: 662,
      amenities: isTw ? ['免費Wi-Fi', '靜音車廂', '充電口'] : ['免费Wi-Fi', '静音车厢', '充电口'],
      stops: [
        { station: isTw ? '上海虹橋' : '上海虹桥', arrive: '--', depart: '09:00', stay: isTw ? '始發' : '始发' },
        { station: '南京南', arrive: '09:59', depart: '10:02', stay: '3分' },
        { station: isTw ? '濟南西' : '济南西', arrive: '11:55', depart: '11:57', stay: '2分' },
        { station: '北京南', arrive: '13:20', depart: '--', stay: isTw ? '終點' : '终点' },
      ],
      seats: [
        { name: '二等座', price: '¥662', numericPrice: 662, left: '有票' },
        { name: '一等座', price: '¥1,060', numericPrice: 1060, left: '有票' },
        { name: isTw ? '商務座' : '商务座', price: '¥2,318', numericPrice: 2318, left: isTw ? '3張' : '3张' },
      ],
    },
    {
      trainNo: 'G13',
      trainTag: isTw ? '復興號標桿' : '复兴号标杆',
      from: '北京南',
      to: isTw ? '上海虹橋' : '上海虹桥',
      fromKeys: ['beijing', 'bj', 'pek', '北京', '北京南'],
      toKeys: ['shanghai', 'sh', 'sha', '上海', '上海虹桥', '上海虹橋'],
      depart: '10:00',
      arrive: '14:28',
      duration: isTw ? '4時28分' : '4时28分',
      durationMinutes: 268,
      punctuality: '98.9%',
      minPrice: 662,
      amenities: isTw ? ['Wi-Fi', '充電口', '餐車'] : ['Wi-Fi', '充电口', '餐车'],
      stops: [
        { station: '北京南', arrive: '--', depart: '10:00', stay: isTw ? '始發' : '始发' },
        { station: '天津南', arrive: '10:34', depart: '10:36', stay: '2分' },
        { station: '南京南', arrive: '13:24', depart: '13:27', stay: '3分' },
        { station: isTw ? '上海虹橋' : '上海虹桥', arrive: '14:28', depart: '--', stay: isTw ? '終點' : '终点' },
      ],
      seats: [
        { name: '二等座', price: '¥662', numericPrice: 662, left: '有票' },
        { name: '一等座', price: '¥1,060', numericPrice: 1060, left: isTw ? '候補' : '候补' },
        { name: isTw ? '商務座' : '商务座', price: '¥2,318', numericPrice: 2318, left: '有票' },
      ],
    },
    {
      trainNo: 'G6501',
      trainTag: isTw ? '廣深港高速' : '广深港高速',
      from: isTw ? '廣州南' : '广州南',
      to: '深圳北',
      fromKeys: ['guangzhou', 'gz', '广州', '广州南', '廣州南'],
      toKeys: ['shenzhen', 'sz', '深圳', '深圳北'],
      depart: '08:05',
      arrive: '08:34',
      duration: '29分',
      durationMinutes: 29,
      punctuality: '99.6%',
      minPrice: 74.5,
      amenities: isTw ? ['充電口', '高鐵Wi-Fi'] : ['充电口', '高铁Wi-Fi'],
      stops: [
        { station: isTw ? '廣州南' : '广州南', arrive: '--', depart: '08:05', stay: isTw ? '始發' : '始发' },
        { station: isTw ? '虎門' : '虎门', arrive: '08:19', depart: '08:21', stay: '2分' },
        { station: '深圳北', arrive: '08:34', depart: '--', stay: isTw ? '終點' : '终点' },
      ],
      seats: [
        { name: '二等座', price: '¥74.5', numericPrice: 74.5, left: '有票' },
        { name: '一等座', price: '¥99.5', numericPrice: 99.5, left: '有票' },
        { name: isTw ? '商務座' : '商务座', price: '¥199.5', numericPrice: 199.5, left: isTw ? '6張' : '6张' },
      ],
    },
    {
      trainNo: 'G6502',
      trainTag: isTw ? '廣深港高速' : '广深港高速',
      from: '深圳北',
      to: isTw ? '廣州南' : '广州南',
      fromKeys: ['shenzhen', 'sz', '深圳', '深圳北'],
      toKeys: ['guangzhou', 'gz', '广州', '广州南', '廣州南'],
      depart: '09:15',
      arrive: '09:44',
      duration: '29分',
      durationMinutes: 29,
      punctuality: '99.5%',
      minPrice: 74.5,
      amenities: isTw ? ['充電口', '高鐵Wi-Fi'] : ['充电口', '高铁Wi-Fi'],
      stops: [
        { station: '深圳北', arrive: '--', depart: '09:15', stay: isTw ? '始發' : '始发' },
        { station: '光明城', arrive: '09:26', depart: '09:28', stay: '2分' },
        { station: isTw ? '廣州南' : '广州南', arrive: '09:44', depart: '--', stay: isTw ? '終點' : '终点' },
      ],
      seats: [
        { name: '二等座', price: '¥74.5', numericPrice: 74.5, left: '有票' },
        { name: '一等座', price: '¥99.5', numericPrice: 99.5, left: '有票' },
        { name: isTw ? '商務座' : '商务座', price: '¥199.5', numericPrice: 199.5, left: isTw ? '4張' : '4张' },
      ],
    },
    {
      trainNo: 'G79',
      trainTag: isTw ? '復興號 350km/h' : '复兴号 350km/h',
      from: '北京西',
      to: isTw ? '廣州南' : '广州南',
      fromKeys: ['beijing', 'bj', '北京', '北京西'],
      toKeys: ['guangzhou', 'gz', '广州', '广州南', '廣州南'],
      depart: '10:00',
      arrive: '17:38',
      duration: isTw ? '7時38分' : '7时38分',
      durationMinutes: 458,
      punctuality: '98.7%',
      minPrice: 938,
      amenities: isTw ? ['免費Wi-Fi', '靜音車廂', '餐車', '充電口'] : ['免费Wi-Fi', '静音车厢', '餐车', '充电口'],
      stops: [
        { station: '北京西', arrive: '--', depart: '10:00', stay: isTw ? '始發' : '始发' },
        { station: isTw ? '鄭州東' : '郑州东', arrive: '12:12', depart: '12:15', stay: '3分' },
        { station: isTw ? '武漢' : '武汉', arrive: '13:45', depart: '13:49', stay: '4分' },
        { station: isTw ? '長沙南' : '长沙南', arrive: '15:08', depart: '15:11', stay: '3分' },
        { station: isTw ? '廣州南' : '广州南', arrive: '17:38', depart: '--', stay: isTw ? '終點' : '终点' },
      ],
      seats: [
        { name: '二等座', price: '¥938', numericPrice: 938, left: '有票' },
        { name: '一等座', price: '¥1,500', numericPrice: 1500, left: '有票' },
        { name: isTw ? '商務座' : '商务座', price: '¥3,275', numericPrice: 3275, left: isTw ? '5張' : '5张' },
      ],
    },
    {
      trainNo: 'G87',
      trainTag: isTw ? '復興號智能組' : '复兴号智能组',
      from: '北京西',
      to: isTw ? '成都東' : '成都东',
      fromKeys: ['beijing', 'bj', '北京', '北京西'],
      toKeys: ['chengdu', 'cd', '成都', '成都东', '成都東'],
      depart: '07:00',
      arrive: '14:31',
      duration: isTw ? '7時31分' : '7时31分',
      durationMinutes: 451,
      punctuality: '98.4%',
      minPrice: 778.5,
      amenities: isTw ? ['免費Wi-Fi', '靜音車廂', '餐車', '充電口'] : ['免费Wi-Fi', '静音车厢', '餐车', '充电口'],
      stops: [
        { station: '北京西', arrive: '--', depart: '07:00', stay: isTw ? '始發' : '始发' },
        { station: isTw ? '石家莊' : '石家庄', arrive: '07:59', depart: '08:01', stay: '2分' },
        { station: '西安北', arrive: '11:12', depart: '11:16', stay: '4分' },
        { station: isTw ? '成都東' : '成都东', arrive: '14:31', depart: '--', stay: isTw ? '終點' : '终点' },
      ],
      seats: [
        { name: '二等座', price: '¥778.5', numericPrice: 778.5, left: '有票' },
        { name: '一等座', price: '¥1,245', numericPrice: 1245, left: '有票' },
        { name: isTw ? '商務座' : '商务座', price: '¥2,456', numericPrice: 2456, left: isTw ? '2張' : '2张' },
      ],
    },
    {
      trainNo: 'G7301',
      trainTag: isTw ? '長三角城際' : '长三角城际',
      from: isTw ? '上海虹橋' : '上海虹桥',
      to: isTw ? '杭州東' : '杭州东',
      fromKeys: ['shanghai', 'sh', 'sha', '上海', '上海虹桥', '上海虹橋'],
      toKeys: ['hangzhou', 'hz', 'hgh', '杭州', '杭州东', '杭州東'],
      depart: '07:35',
      arrive: '08:20',
      duration: '45分',
      durationMinutes: 45,
      punctuality: '99.7%',
      minPrice: 73,
      amenities: isTw ? ['充電口', 'Wi-Fi'] : ['充电口', 'Wi-Fi'],
      stops: [
        { station: isTw ? '上海虹橋' : '上海虹桥', arrive: '--', depart: '07:35', stay: isTw ? '始發' : '始发' },
        { station: isTw ? '嘉興南' : '嘉兴南', arrive: '07:58', depart: '08:00', stay: '2分' },
        { station: isTw ? '杭州東' : '杭州东', arrive: '08:20', depart: '--', stay: isTw ? '終點' : '终点' },
      ],
      seats: [
        { name: '二等座', price: '¥73', numericPrice: 73, left: '有票' },
        { name: '一等座', price: '¥117', numericPrice: 117, left: '有票' },
        { name: isTw ? '商務座' : '商务座', price: '¥219.5', numericPrice: 219.5, left: isTw ? '8張' : '8张' },
      ],
    },
    {
      trainNo: 'D321',
      trainTag: isTw ? '東南沿海動車' : '东南沿海动车',
      from: isTw ? '上海虹橋' : '上海虹桥',
      to: '深圳北',
      fromKeys: ['shanghai', 'sh', 'sha', '上海', '上海虹桥', '上海虹橋'],
      toKeys: ['shenzhen', 'sz', '深圳', '深圳北'],
      depart: '11:15',
      arrive: '21:08',
      duration: isTw ? '9時53分' : '9时53分',
      durationMinutes: 593,
      punctuality: '97.9%',
      minPrice: 482,
      amenities: isTw ? ['充電口', '餐車'] : ['充电口', '餐车'],
      stops: [
        { station: isTw ? '上海虹橋' : '上海虹桥', arrive: '--', depart: '11:15', stay: isTw ? '始發' : '始发' },
        { station: isTw ? '杭州東' : '杭州东', arrive: '12:08', depart: '12:12', stay: '4分' },
        { station: '福州南', arrive: '16:54', depart: '16:58', stay: '4分' },
        { station: isTw ? '廈門北' : '厦门北', arrive: '18:22', depart: '18:26', stay: '4分' },
        { station: '深圳北', arrive: '21:08', depart: '--', stay: isTw ? '終點' : '终点' },
      ],
      seats: [
        { name: '二等座', price: '¥482', numericPrice: 482, left: '有票' },
        { name: isTw ? '一等臥' : '一等卧', price: '¥750', numericPrice: 750, left: '有票' },
      ],
    },
    {
      trainNo: 'C2001',
      trainTag: isTw ? '京津城際復興號' : '京津城际复兴号',
      from: '北京南',
      to: '天津',
      fromKeys: ['beijing', 'bj', 'pek', '北京', '北京南'],
      toKeys: ['tianjin', 'tj', 'tsn', '天津', '天津站'],
      depart: '06:45',
      arrive: '07:15',
      duration: '30分',
      durationMinutes: 30,
      punctuality: '99.8%',
      minPrice: 54.5,
      amenities: isTw ? ['充電口', '城際Wi-Fi'] : ['充电口', '城际Wi-Fi'],
      stops: [
        { station: '北京南', arrive: '--', depart: '06:45', stay: isTw ? '始發' : '始发' },
        { station: '天津', arrive: '07:15', depart: '--', stay: isTw ? '終點' : '终点' },
      ],
      seats: [
        { name: '二等座', price: '¥54.5', numericPrice: 54.5, left: '有票' },
        { name: '一等座', price: '¥88', numericPrice: 88, left: '有票' },
        { name: isTw ? '商務座' : '商务座', price: '¥174', numericPrice: 174, left: isTw ? '5張' : '5张' },
      ],
    },
    {
      trainNo: 'G27',
      trainTag: isTw ? '復興號標桿 · 夕發夕至' : '复兴号标杆 · 一站直达',
      from: '北京南',
      to: isTw ? '上海虹橋' : '上海虹桥',
      fromKeys: ['beijing', 'bj', 'pek', '北京', '北京南'],
      toKeys: ['shanghai', 'sh', 'sha', '上海', '上海虹桥', '上海虹橋'],
      depart: '19:00',
      arrive: '23:18',
      duration: isTw ? '4時18分' : '4时18分',
      durationMinutes: 258,
      punctuality: '99.3%',
      minPrice: 662,
      amenities: isTw ? ['免費Wi-Fi', '靜音車廂', '充電口', '餐車'] : ['免费Wi-Fi', '静音车厢', '充电口', '餐车'],
      stops: [
        { station: '北京南', arrive: '--', depart: '19:00', stay: isTw ? '始發' : '始发' },
        { station: '南京南', arrive: '22:13', depart: '22:15', stay: '2分' },
        { station: isTw ? '上海虹橋' : '上海虹桥', arrive: '23:18', depart: '--', stay: isTw ? '終點' : '终点' },
      ],
      seats: [
        { name: '二等座', price: '¥662', numericPrice: 662, left: '有票' },
        { name: '一等座', price: '¥1,060', numericPrice: 1060, left: '有票' },
        { name: isTw ? '商務座' : '商务座', price: '¥2,318', numericPrice: 2318, left: '有票' },
      ],
    },
    {
      trainNo: 'D901',
      trainTag: isTw ? '京港高鐵動臥' : '京港高铁动卧',
      from: '北京西',
      to: isTw ? '香港西九龍' : '香港西九龙',
      fromKeys: ['beijing', 'bj', 'pek', '北京', '北京西'],
      toKeys: ['hongkong', 'hk', 'hkg', '香港', '西九龙', '西九龍', '深圳北'],
      depart: '20:13',
      arrive: '08:47+1',
      duration: isTw ? '12時34分' : '12时34分',
      durationMinutes: 754,
      punctuality: '99.1%',
      minPrice: 936,
      amenities: isTw ? ['夕發朝至臥鋪', '充電口', '餐車'] : ['夕发朝至卧铺', '充电口', '餐车'],
      stops: [
        { station: '北京西', arrive: '--', depart: '20:13', stay: isTw ? '始發' : '始发' },
        { station: isTw ? '石家莊' : '石家庄', arrive: '21:16', depart: '21:19', stay: '3分' },
        { station: isTw ? '廣州' : '广州', arrive: '06:58', depart: '07:03', stay: '5分' },
        { station: '深圳北', arrive: '08:15', depart: '08:19', stay: '4分' },
        { station: isTw ? '香港西九龍' : '香港西九龙', arrive: '08:47', depart: '--', stay: isTw ? '終點' : '终点' },
      ],
      seats: [
        { name: isTw ? '二等座' : '二等座', price: '¥936', numericPrice: 936, left: '有票' },
        { name: isTw ? '高級動臥' : '动卧', price: '¥1,580', numericPrice: 1580, left: isTw ? '4張' : '4张' },
      ],
    },
  ];
}

export function getRichFlightList(lang: Language): RichFlightItem[] {
  const isZh = lang === 'zh-CN' || lang === 'zh-TW';
  const isTw = lang === 'zh-TW';

  if (!isZh) {
    return [
      {
        flightNo: 'CZ3101',
        airline: 'China Southern',
        aircraft: 'Airbus A350-900',
        cabinNote: 'Widebody · Dual Aisle',
        from: 'Guangzhou CAN T2',
        to: 'Beijing PKX',
        fromKeys: ['guangzhou', 'can', '广州', '广州白云', '廣州白雲'],
        toKeys: ['beijing', 'pkx', 'pek', '北京', '北京大兴', '北京大興'],
        depart: '08:00',
        arrive: '11:15',
        duration: '3h15m',
        durationMinutes: 195,
        punctuality: '98%',
        minPrice: 820,
        meal: 'Hot Breakfast',
        baggage: '20kg Checked + 5kg Cabin',
        checkinGateOffsetMin: 40,
        seats: [
          { name: 'Economy', price: '¥820', numericPrice: 820, left: '20kg bag' },
          { name: 'Business', price: '¥2,480', numericPrice: 2480, left: 'Lounge' },
        ],
      },
      {
        flightNo: 'CZ3102',
        airline: 'China Southern',
        aircraft: 'Airbus A350-900',
        cabinNote: 'Widebody · Dual Aisle',
        from: 'Beijing PKX',
        to: 'Guangzhou CAN T2',
        fromKeys: ['beijing', 'pkx', 'pek', '北京', '北京大兴', '北京大興'],
        toKeys: ['guangzhou', 'can', '广州', '广州白云', '廣州白雲'],
        depart: '13:30',
        arrive: '16:45',
        duration: '3h15m',
        durationMinutes: 195,
        punctuality: '97%',
        minPrice: 840,
        meal: 'Light Refreshment',
        baggage: '20kg Checked + 5kg Cabin',
        checkinGateOffsetMin: 40,
        seats: [
          { name: 'Economy', price: '¥840', numericPrice: 840, left: '20kg bag' },
          { name: 'Business', price: '¥2,480', numericPrice: 2480, left: 'Lounge' },
        ],
      },
      {
        flightNo: 'CA1502',
        airline: 'Air China',
        aircraft: 'Boeing 787-9 Dreamliner',
        cabinNote: 'Widebody · Wi-Fi',
        from: 'Guangzhou CAN T1',
        to: 'Beijing PEK T3',
        fromKeys: ['guangzhou', 'can', '广州', '广州白云', '廣州白雲'],
        toKeys: ['beijing', 'pek', 'pkx', '北京', '北京首都'],
        depart: '11:30',
        arrive: '14:45',
        duration: '3h15m',
        durationMinutes: 195,
        punctuality: '95%',
        minPrice: 890,
        meal: 'Hot Lunch',
        baggage: '20kg Checked',
        checkinGateOffsetMin: 45,
        seats: [
          { name: 'Economy', price: '¥890', numericPrice: 890, left: '20kg bag' },
          { name: 'Business', price: '¥2,650', numericPrice: 2650, left: 'Priority' },
        ],
      },
      {
        flightNo: 'MU5108',
        airline: 'China Eastern',
        aircraft: 'COMAC C919',
        cabinNote: 'Next-Gen Trunk Jet',
        from: 'Guangzhou CAN T2',
        to: 'Shanghai SHA T2',
        fromKeys: ['guangzhou', 'can', '广州', '广州白云', '廣州白雲'],
        toKeys: ['shanghai', 'sha', 'pvg', '上海', '上海虹桥', '上海虹橋'],
        depart: '15:20',
        arrive: '17:45',
        duration: '2h25m',
        durationMinutes: 145,
        punctuality: '97%',
        minPrice: 760,
        meal: 'Tea & Snack',
        baggage: '20kg Checked',
        checkinGateOffsetMin: 40,
        seats: [
          { name: 'Economy', price: '¥760', numericPrice: 760, left: '35% off' },
          { name: 'Business', price: '¥2,190', numericPrice: 2190, left: 'Priority' },
        ],
      },
      {
        flightNo: '3U8882',
        airline: 'Sichuan Airlines',
        aircraft: 'Airbus A321neo',
        cabinNote: 'Signature Dining',
        from: 'Guangzhou CAN T2',
        to: 'Chengdu TFU T2',
        fromKeys: ['guangzhou', 'can', '广州', '广州白云', '廣州白雲'],
        toKeys: ['chengdu', 'tfu', 'ctu', '成都', '成都天府'],
        depart: '18:40',
        arrive: '21:15',
        duration: '2h35m',
        durationMinutes: 155,
        punctuality: '96%',
        minPrice: 680,
        meal: 'Sichuan Hot Dinner',
        baggage: '20kg Checked',
        checkinGateOffsetMin: 40,
        seats: [
          { name: 'Economy', price: '¥680', numericPrice: 680, left: '32% off' },
          { name: 'Business', price: '¥1,950', numericPrice: 1950, left: 'Priority' },
        ],
      },
      {
        flightNo: 'NH962',
        airline: 'ANA All Nippon',
        aircraft: 'Boeing 787-8',
        cabinNote: 'International · Direct',
        from: 'Beijing PEK T3',
        to: 'Tokyo HND T2',
        fromKeys: ['beijing', 'pek', '北京', '北京首都'],
        toKeys: ['tokyo', 'hnd', 'nrt', '东京', '東京', '羽田'],
        depart: '08:25',
        arrive: '12:55',
        duration: '3h30m',
        durationMinutes: 210,
        punctuality: '98%',
        minPrice: 2150,
        meal: 'Japanese / Western Meal',
        baggage: '2×23kg Checked',
        checkinGateOffsetMin: 60,
        seats: [
          { name: 'Economy', price: '¥2,150', numericPrice: 2150, left: '2×23kg' },
          { name: 'Business', price: '¥6,400', numericPrice: 6400, left: 'Lounge' },
        ],
      },
      {
        flightNo: 'SQ831',
        airline: 'Singapore Airlines',
        aircraft: 'Airbus A380-800',
        cabinNote: 'Superjumbo · KrisFlyer',
        from: 'Shanghai PVG T2',
        to: 'Singapore SIN T3',
        fromKeys: ['shanghai', 'pvg', 'sha', '上海', '上海浦东', '上海浦東'],
        toKeys: ['singapore', 'sin', '新加坡', '樟宜'],
        depart: '14:35',
        arrive: '20:10',
        duration: '5h35m',
        durationMinutes: 335,
        punctuality: '99%',
        minPrice: 1890,
        meal: 'Full Course Dinner',
        baggage: '25kg Checked',
        checkinGateOffsetMin: 60,
        seats: [
          { name: 'Economy', price: '¥1,890', numericPrice: 1890, left: '25kg bag' },
          { name: 'Business', price: '¥7,950', numericPrice: 7950, left: 'Flat-bed' },
        ],
      },
    ];
  }

  return [
    {
      flightNo: 'CZ3101',
      airline: isTw ? '中國南方航空' : '中国南方航空',
      aircraft: isTw ? '空中巴士 A350-900' : '空客 A350-900',
      cabinNote: isTw ? '雙走道寬體機' : '双通道宽体客机',
      from: isTw ? '廣州白雲 T2' : '广州白云 T2',
      to: isTw ? '北京大興' : '北京大兴',
      fromKeys: ['guangzhou', 'can', '广州', '广州白云', '廣州白雲'],
      toKeys: ['beijing', 'pkx', 'pek', '北京', '北京大兴', '北京大興'],
      depart: '08:00',
      arrive: '11:15',
      duration: isTw ? '3時15分' : '3时15分',
      durationMinutes: 195,
      punctuality: '98%',
      minPrice: 820,
      meal: isTw ? '熱食早餐' : '热食早餐',
      baggage: isTw ? '20kg 免費託運' : '20kg 免费托运',
      checkinGateOffsetMin: 40,
      seats: [
        { name: isTw ? '經濟艙' : '经济舱', price: '¥820', numericPrice: 820, left: isTw ? '3.8折 · 20kg' : '3.8折 · 20kg' },
        { name: isTw ? '商務艙' : '公务舱', price: '¥2,480', numericPrice: 2480, left: isTw ? '平躺 · 貴賓室' : '宽敞平躺 · 贵宾厅' },
      ],
    },
    {
      flightNo: 'CZ3102',
      airline: isTw ? '中國南方航空' : '中国南方航空',
      aircraft: isTw ? '空中巴士 A350-900' : '空客 A350-900',
      cabinNote: isTw ? '雙走道寬體機' : '双通道宽体客机',
      from: isTw ? '北京大興' : '北京大兴',
      to: isTw ? '廣州白雲 T2' : '广州白云 T2',
      fromKeys: ['beijing', 'pkx', 'pek', '北京', '北京大兴', '北京大興'],
      toKeys: ['guangzhou', 'can', '广州', '广州白云', '廣州白雲'],
      depart: '13:30',
      arrive: '16:45',
      duration: isTw ? '3時15分' : '3时15分',
      durationMinutes: 195,
      punctuality: '97%',
      minPrice: 840,
      meal: isTw ? '精緻簡餐' : '精致简餐',
      baggage: isTw ? '20kg 免費託運' : '20kg 免费托运',
      checkinGateOffsetMin: 40,
      seats: [
        { name: isTw ? '經濟艙' : '经济舱', price: '¥840', numericPrice: 840, left: isTw ? '3.9折 · 20kg' : '3.9折 · 20kg' },
        { name: isTw ? '商務艙' : '公务舱', price: '¥2,480', numericPrice: 2480, left: isTw ? '平躺 · 貴賓室' : '宽敞平躺 · 贵宾厅' },
      ],
    },
    {
      flightNo: 'CA1502',
      airline: isTw ? '中國國際航空' : '中国国际航空',
      aircraft: isTw ? '波音 B787-9 (夢想客機)' : '波音 B787-9 (梦想客机)',
      cabinNote: isTw ? '機上 Wi-Fi · 寬體' : '机上 Wi-Fi · 宽体机',
      from: isTw ? '廣州白雲 T1' : '广州白云 T1',
      to: '北京首都 T3',
      fromKeys: ['guangzhou', 'can', '广州', '广州白云', '廣州白雲'],
      toKeys: ['beijing', 'pek', 'pkx', '北京', '北京首都'],
      depart: '11:30',
      arrive: '14:45',
      duration: isTw ? '3時15分' : '3时15分',
      durationMinutes: 195,
      punctuality: '95%',
      minPrice: 890,
      meal: isTw ? '熱食午餐' : '热食午餐',
      baggage: isTw ? '20kg 免費託運' : '20kg 免费托运',
      checkinGateOffsetMin: 45,
      seats: [
        { name: isTw ? '經濟艙' : '经济舱', price: '¥890', numericPrice: 890, left: isTw ? '4.1折 · 20kg' : '4.1折 · 20kg' },
        { name: isTw ? '商務艙' : '公务舱', price: '¥2,650', numericPrice: 2650, left: isTw ? '尊享服務' : '头等尊享' },
      ],
    },
    {
      flightNo: 'MU5108',
      airline: isTw ? '中國東方航空' : '中国东方航空',
      aircraft: isTw ? '國產商飛 C919' : '国产商飞 C919',
      cabinNote: isTw ? '新一代幹線客機' : '新一代干线客机',
      from: isTw ? '廣州白雲 T2' : '广州白云 T2',
      to: isTw ? '上海虹橋 T2' : '上海虹桥 T2',
      fromKeys: ['guangzhou', 'can', '广州', '广州白云', '廣州白雲'],
      toKeys: ['shanghai', 'sha', 'pvg', '上海', '上海虹桥', '上海虹橋'],
      depart: '15:20',
      arrive: '17:45',
      duration: isTw ? '2時25分' : '2时25分',
      durationMinutes: 145,
      punctuality: '97%',
      minPrice: 760,
      meal: isTw ? '精緻茶點' : '精美茶点',
      baggage: isTw ? '20kg 免費託運' : '20kg 免费托运',
      checkinGateOffsetMin: 40,
      seats: [
        { name: isTw ? '經濟艙' : '经济舱', price: '¥760', numericPrice: 760, left: isTw ? '3.5折 · C919' : '3.5折 · C919' },
        { name: isTw ? '商務艙' : '公务舱', price: '¥2,190', numericPrice: 2190, left: isTw ? '尊享服務' : '尊享服务' },
      ],
    },
    {
      flightNo: '3U8882',
      airline: '四川航空',
      aircraft: isTw ? '空中巴士 A321neo' : '空客 A321neo',
      cabinNote: isTw ? '特色熱食體驗' : '川航美食航线',
      from: isTw ? '廣州白雲 T2' : '广州白云 T2',
      to: '成都天府 T2',
      fromKeys: ['guangzhou', 'can', '广州', '广州白云', '廣州白雲'],
      toKeys: ['chengdu', 'tfu', 'ctu', '成都', '成都天府'],
      depart: '18:40',
      arrive: '21:15',
      duration: isTw ? '2時35分' : '2时35分',
      durationMinutes: 155,
      punctuality: '96%',
      minPrice: 680,
      meal: isTw ? '川味特色正餐' : '川味特色正餐',
      baggage: isTw ? '20kg 免費託運' : '20kg 免费托运',
      checkinGateOffsetMin: 40,
      seats: [
        { name: isTw ? '經濟艙' : '经济舱', price: '¥680', numericPrice: 680, left: '3.2折' },
        { name: isTw ? '商務艙' : '公务舱', price: '¥1,950', numericPrice: 1950, left: '川味特色' },
      ],
    },
    {
      flightNo: 'NH962',
      airline: 'ANA 全日空',
      aircraft: isTw ? '波音 B787-8' : '波音 B787-8',
      cabinNote: isTw ? '國際直飛 · 雙件行李' : '国际直飞 · 双件行李',
      from: '北京首都 T3',
      to: isTw ? '東京羽田 T2' : '东京羽田 T2',
      fromKeys: ['beijing', 'pek', '北京', '北京首都'],
      toKeys: ['tokyo', 'hnd', 'nrt', '东京', '東京', '羽田'],
      depart: '08:25',
      arrive: '12:55',
      duration: isTw ? '3時30分' : '3时30分',
      durationMinutes: 210,
      punctuality: '98%',
      minPrice: 2150,
      meal: isTw ? '日式/西式雙選正餐' : '日式/西式双选正餐',
      baggage: isTw ? '2×23kg 免費託運' : '2×23kg 免费托运',
      checkinGateOffsetMin: 60,
      seats: [
        { name: isTw ? '經濟艙' : '经济舱', price: '¥2,150', numericPrice: 2150, left: '2×23kg' },
        { name: isTw ? '商務艙' : '公务舱', price: '¥6,400', numericPrice: 6400, left: isTw ? '貴賓室' : '贵宾厅' },
      ],
    },
    {
      flightNo: 'SQ831',
      airline: isTw ? '新加坡航空' : '新加坡航空',
      aircraft: isTw ? '空中巴士 A380-800' : '空客 A380-800',
      cabinNote: isTw ? '雙層旗艦機型' : '双层旗舰机型',
      from: isTw ? '上海浦東 T2' : '上海浦东 T2',
      to: '新加坡樟宜 T3',
      fromKeys: ['shanghai', 'pvg', 'sha', '上海', '上海浦东', '上海浦東'],
      toKeys: ['singapore', 'sin', '新加坡', '樟宜'],
      depart: '14:35',
      arrive: '20:10',
      duration: isTw ? '5時35分' : '5时35分',
      durationMinutes: 335,
      punctuality: '99%',
      minPrice: 1890,
      meal: isTw ? '新加坡特色航餐' : '新航全套正餐',
      baggage: isTw ? '25kg 免費託運' : '25kg 免费托运',
      checkinGateOffsetMin: 60,
      seats: [
        { name: isTw ? '經濟艙' : '经济舱', price: '¥1,890', numericPrice: 1890, left: '25kg' },
        { name: isTw ? '商務艙' : '公务舱', price: '¥7,950', numericPrice: 7950, left: isTw ? '全平躺' : '全平躺' },
      ],
    },
  ];
}



// =====================================================================
// Full 12306 Domestic & Cross-Border Rail Directory + Global Airports
// =====================================================================

export const RAIL_HUB_STATIONS: TravelDirectoryHub[] = [
  // 4 Municipalities
  { code: 'BJP', kind: 'rail', region: 'mainland_capital', nameZh: '北京南', nameTw: '北京南', nameEn: 'Beijing South', cityZh: '北京', cityTw: '北京', cityEn: 'Beijing', lat: 39.865, lon: 116.379, aliases: ['beijing', 'bj', 'bjp', 'bxp', 'vnp', '北京', '北京西', '北京南', '北京丰台', '北京朝阳', '清河'] },
  { code: 'BXP', kind: 'rail', region: 'mainland_capital', nameZh: '北京西', nameTw: '北京西', nameEn: 'Beijing West', cityZh: '北京', cityTw: '北京', cityEn: 'Beijing', lat: 39.894, lon: 116.322, aliases: ['beijingxi', 'bxp', '北京西'] },
  { code: 'AOH', kind: 'rail', region: 'mainland_capital', nameZh: '上海虹桥', nameTw: '上海虹橋', nameEn: 'Shanghai Hongqiao', cityZh: '上海', cityTw: '上海', cityEn: 'Shanghai', lat: 31.194, lon: 121.320, aliases: ['shanghai', 'sh', 'aoh', 'shh', '上海', '上海虹桥', '上海虹橋', '上海南', '上海松江'] },
  { code: 'TJP', kind: 'rail', region: 'mainland_capital', nameZh: '天津站', nameTw: '天津站', nameEn: 'Tianjin', cityZh: '天津', cityTw: '天津', cityEn: 'Tianjin', lat: 39.136, lon: 117.211, aliases: ['tianjin', 'tj', 'tjp', 'txp', '天津', '天津西', '天津南', '滨海'] },
  { code: 'CXW', kind: 'rail', region: 'mainland_capital', nameZh: '重庆西', nameTw: '重慶西', nameEn: 'Chongqing West', cityZh: '重庆', cityTw: '重慶', cityEn: 'Chongqing', lat: 29.498, lon: 106.437, aliases: ['chongqing', 'cq', 'cxw', 'cuw', '重庆', '重慶', '重庆北', '重庆西', '沙坪坝', '重庆东'] },

  // Provincial & Autonomous Region Capitals (all 27)
  { code: 'SJP', kind: 'rail', region: 'mainland_capital', nameZh: '石家庄', nameTw: '石家莊', nameEn: 'Shijiazhuang', cityZh: '石家庄', cityTw: '石家莊', cityEn: 'Shijiazhuang', lat: 38.008, lon: 114.485, aliases: ['shijiazhuang', 'sjz', 'sjp', '石家庄', '石家莊'] },
  { code: 'TNV', kind: 'rail', region: 'mainland_capital', nameZh: '太原南', nameTw: '太原南', nameEn: 'Taiyuan South', cityZh: '太原', cityTw: '太原', cityEn: 'Taiyuan', lat: 37.792, lon: 112.607, aliases: ['taiyuan', 'ty', 'tnv', 'tyv', '太原', '太原南'] },
  { code: 'NDC', kind: 'rail', region: 'mainland_capital', nameZh: '呼和浩特东', nameTw: '呼和浩特東', nameEn: 'Hohhot East', cityZh: '呼和浩特', cityTw: '呼和浩特', cityEn: 'Hohhot', lat: 40.844, lon: 111.787, aliases: ['hohhot', 'huhehaote', 'ndc', 'hhc', '呼和浩特', '呼和浩特东'] },
  { code: 'SBT', kind: 'rail', region: 'mainland_capital', nameZh: '沈阳北', nameTw: '瀋陽北', nameEn: 'Shenyang North', cityZh: '沈阳', cityTw: '瀋陽', cityEn: 'Shenyang', lat: 41.817, lon: 123.434, aliases: ['shenyang', 'sy', 'sbt', 'syt', '沈阳', '瀋陽', '沈阳北', '沈阳南'] },
  { code: 'CCT', kind: 'rail', region: 'mainland_capital', nameZh: '长春', nameTw: '長春', nameEn: 'Changchun', cityZh: '长春', cityTw: '長春', cityEn: 'Changchun', lat: 43.909, lon: 125.324, aliases: ['changchun', 'cc', 'cct', 'crt', '长春', '長春', '长春西'] },
  { code: 'VBB', kind: 'rail', region: 'mainland_capital', nameZh: '哈尔滨西', nameTw: '哈爾濱西', nameEn: 'Harbin West', cityZh: '哈尔滨', cityTw: '哈爾濱', cityEn: 'Harbin', lat: 45.706, lon: 126.578, aliases: ['harbin', 'haerbin', 'hrb', 'vbb', 'hbb', '哈尔滨', '哈爾濱', '哈尔滨西'] },
  { code: 'NKH', kind: 'rail', region: 'mainland_capital', nameZh: '南京南', nameTw: '南京南', nameEn: 'Nanjing South', cityZh: '南京', cityTw: '南京', cityEn: 'Nanjing', lat: 31.969, lon: 118.798, aliases: ['nanjing', 'nj', 'nkh', 'njh', '南京', '南京南'] },
  { code: 'HGH', kind: 'rail', region: 'mainland_capital', nameZh: '杭州东', nameTw: '杭州東', nameEn: 'Hangzhou East', cityZh: '杭州', cityTw: '杭州', cityEn: 'Hangzhou', lat: 30.291, lon: 120.213, aliases: ['hangzhou', 'hz', 'hgh', '杭州', '杭州东', '杭州西', '杭州東'] },
  { code: 'ENH', kind: 'rail', region: 'mainland_capital', nameZh: '合肥南', nameTw: '合肥南', nameEn: 'Hefei South', cityZh: '合肥', cityTw: '合肥', cityEn: 'Hefei', lat: 31.797, lon: 117.291, aliases: ['hefei', 'hf', 'enh', 'hfh', '合肥', '合肥南'] },
  { code: 'FZS', kind: 'rail', region: 'mainland_capital', nameZh: '福州', nameTw: '福州', nameEn: 'Fuzhou', cityZh: '福州', cityTw: '福州', cityEn: 'Fuzhou', lat: 26.113, lon: 119.321, aliases: ['fuzhou', 'fz', 'fzs', 'fys', '福州', '福州南'] },
  { code: 'NXG', kind: 'rail', region: 'mainland_capital', nameZh: '南昌西', nameTw: '南昌西', nameEn: 'Nanchang West', cityZh: '南昌', cityTw: '南昌', cityEn: 'Nanchang', lat: 28.618, lon: 115.792, aliases: ['nanchang', 'nc', 'nxg', 'ncg', '南昌', '南昌西', '南昌东'] },
  { code: 'JGK', kind: 'rail', region: 'mainland_capital', nameZh: '济南西', nameTw: '濟南西', nameEn: 'Jinan West', cityZh: '济南', cityTw: '濟南', cityEn: 'Jinan', lat: 36.667, lon: 116.890, aliases: ['jinan', 'jn', 'jgk', 'jnk', '济南', '濟南', '济南西', '济南东'] },
  { code: 'ZAF', kind: 'rail', region: 'mainland_capital', nameZh: '郑州东', nameTw: '鄭州東', nameEn: 'Zhengzhou East', cityZh: '郑州', cityTw: '鄭州', cityEn: 'Zhengzhou', lat: 34.759, lon: 113.779, aliases: ['zhengzhou', 'zz', 'zaf', 'zzf', '郑州', '鄭州', '郑州东', '郑州航空港'] },
  { code: 'WHN', kind: 'rail', region: 'mainland_capital', nameZh: '武汉', nameTw: '武漢', nameEn: 'Wuhan', cityZh: '武汉', cityTw: '武漢', cityEn: 'Wuhan', lat: 30.607, lon: 114.424, aliases: ['wuhan', 'wh', 'whn', 'hkn', '武汉', '武漢', '汉口', '武昌'] },
  { code: 'CWQ', kind: 'rail', region: 'mainland_capital', nameZh: '长沙南', nameTw: '長沙南', nameEn: 'Changsha South', cityZh: '长沙', cityTw: '長沙', cityEn: 'Changsha', lat: 28.147, lon: 113.065, aliases: ['changsha', 'cs', 'cwq', 'csq', '长沙', '長沙', '长沙南'] },
  { code: 'IZQ', kind: 'rail', region: 'mainland_capital', nameZh: '广州南', nameTw: '廣州南', nameEn: 'Guangzhou South', cityZh: '广州', cityTw: '廣州', cityEn: 'Guangzhou', lat: 22.989, lon: 113.269, aliases: ['guangzhou', 'gz', 'izq', 'gzq', 'ggq', '广州', '廣州', '广州南', '广州东', '广州白云'] },
  { code: 'NFZ', kind: 'rail', region: 'mainland_capital', nameZh: '南宁东', nameTw: '南寧東', nameEn: 'Nanning East', cityZh: '南宁', cityTw: '南寧', cityEn: 'Nanning', lat: 22.841, lon: 108.431, aliases: ['nanning', 'nn', 'nfz', 'nnz', '南宁', '南寧', '南宁东'] },
  { code: 'HMQ', kind: 'rail', region: 'mainland_capital', nameZh: '海口东', nameTw: '海口東', nameEn: 'Haikou East', cityZh: '海口', cityTw: '海口', cityEn: 'Haikou', lat: 19.985, lon: 110.343, aliases: ['haikou', 'hk', 'hmq', 'vuq', '海口', '海口东', '美兰'] },
  { code: 'ICW', kind: 'rail', region: 'mainland_capital', nameZh: '成都东', nameTw: '成都東', nameEn: 'Chengdu East', cityZh: '成都', cityTw: '成都', cityEn: 'Chengdu', lat: 30.630, lon: 104.142, aliases: ['chengdu', 'cd', 'icw', 'cdw', '成都', '成都东', '成都東', '天府机场站'] },
  { code: 'KQW', kind: 'rail', region: 'mainland_capital', nameZh: '贵阳北', nameTw: '貴陽北', nameEn: 'Guiyang North', cityZh: '贵阳', cityTw: '貴陽', cityEn: 'Guiyang', lat: 26.618, lon: 106.673, aliases: ['guiyang', 'gy', 'kqw', 'giw', '贵阳', '貴陽', '贵阳北', '贵阳东'] },
  { code: 'KOM', kind: 'rail', region: 'mainland_capital', nameZh: '昆明南', nameTw: '昆明南', nameEn: 'Kunming South', cityZh: '昆明', cityTw: '昆明', cityEn: 'Kunming', lat: 24.872, lon: 102.863, aliases: ['kunming', 'km', 'kom', 'kmm', '昆明', '昆明南'] },
  { code: 'LSO', kind: 'rail', region: 'mainland_capital', nameZh: '拉萨', nameTw: '拉薩', nameEn: 'Lhasa', cityZh: '拉萨', cityTw: '拉薩', cityEn: 'Lhasa', lat: 29.626, lon: 91.073, aliases: ['lhasa', 'lasa', 'lso', '拉萨', '拉薩'] },
  { code: 'EAY', kind: 'rail', region: 'mainland_capital', nameZh: '西安北', nameTw: '西安北', nameEn: 'Xi’an North', cityZh: '西安', cityTw: '西安', cityEn: 'Xi’an', lat: 34.376, lon: 108.938, aliases: ['xian', 'xi an', 'xa', 'eay', 'xay', '西安', '西安北'] },
  { code: 'LAJ', kind: 'rail', region: 'mainland_capital', nameZh: '兰州西', nameTw: '蘭州西', nameEn: 'Lanzhou West', cityZh: '兰州', cityTw: '蘭州', cityEn: 'Lanzhou', lat: 36.068, lon: 103.751, aliases: ['lanzhou', 'lz', 'laj', 'lzj', '兰州', '蘭州', '兰州西'] },
  { code: 'XNO', kind: 'rail', region: 'mainland_capital', nameZh: '西宁', nameTw: '西寧', nameEn: 'Xining', cityZh: '西宁', cityTw: '西寧', cityEn: 'Xining', lat: 36.620, lon: 101.812, aliases: ['xining', 'xn', 'xno', '西宁', '西寧'] },
  { code: 'YIJ', kind: 'rail', region: 'mainland_capital', nameZh: '银川', nameTw: '銀川', nameEn: 'Yinchuan', cityZh: '银川', cityTw: '銀川', cityEn: 'Yinchuan', lat: 38.491, lon: 106.155, aliases: ['yinchuan', 'yc', 'yij', '银川', '銀川'] },
  { code: 'WAR', kind: 'rail', region: 'mainland_capital', nameZh: '乌鲁木齐', nameTw: '烏魯木齊', nameEn: 'Ürümqi', cityZh: '乌鲁木齐', cityTw: '烏魯木齊', cityEn: 'Urumqi', lat: 43.838, lon: 87.523, aliases: ['urumqi', 'wulumuqi', 'war', 'urc', '乌鲁木齐', '烏魯木齊'] },

  // Key 12306 Major Hubs, Ports & Tourism Cities
  { code: 'IOQ', kind: 'rail', region: 'mainland_hub', nameZh: '深圳北', nameTw: '深圳北', nameEn: 'Shenzhen North', cityZh: '深圳', cityTw: '深圳', cityEn: 'Shenzhen', lat: 22.610, lon: 114.029, aliases: ['shenzhen', 'sz', 'ioq', 'nzq', 'szq', '深圳', '深圳北', '福田', '罗湖'] },
  { code: 'XKS', kind: 'rail', region: 'mainland_hub', nameZh: '厦门北', nameTw: '廈門北', nameEn: 'Xiamen North', cityZh: '厦门', cityTw: '廈門', cityEn: 'Xiamen', lat: 24.637, lon: 118.074, aliases: ['xiamen', 'xm', 'xks', 'xms', '厦门', '廈門', '厦门北'] },
  { code: 'QDK', kind: 'rail', region: 'mainland_hub', nameZh: '青岛北', nameTw: '青島北', nameEn: 'Qingdao North', cityZh: '青岛', cityTw: '青島', cityEn: 'Qingdao', lat: 36.170, lon: 120.375, aliases: ['qingdao', 'qd', 'qdk', 'qhk', '青岛', '青島', '青岛北'] },
  { code: 'DFT', kind: 'rail', region: 'mainland_hub', nameZh: '大连北', nameTw: '大連北', nameEn: 'Dalian North', cityZh: '大连', cityTw: '大連', cityEn: 'Dalian', lat: 39.015, lon: 121.606, aliases: ['dalian', 'dl', 'dft', 'dlt', '大连', '大連', '大连北'] },
  { code: 'SZH', kind: 'rail', region: 'mainland_hub', nameZh: '苏州', nameTw: '蘇州', nameEn: 'Suzhou', cityZh: '苏州', cityTw: '蘇州', cityEn: 'Suzhou', lat: 31.330, lon: 120.610, aliases: ['suzhou', 'szh', '苏州', '蘇州', '苏州北'] },
  { code: 'NGH', kind: 'rail', region: 'mainland_hub', nameZh: '宁波', nameTw: '寧波', nameEn: 'Ningbo', cityZh: '宁波', cityTw: '寧波', cityEn: 'Ningbo', lat: 29.862, lon: 121.537, aliases: ['ningbo', 'nb', 'ngh', '宁波', '寧波'] },
  { code: 'ZHQ', kind: 'rail', region: 'mainland_hub', nameZh: '珠海', nameTw: '珠海', nameEn: 'Zhuhai', cityZh: '珠海', cityTw: '珠海', cityEn: 'Zhuhai', lat: 22.216, lon: 113.550, aliases: ['zhuhai', 'zhq', '珠海', '拱北', '横琴'] },
  { code: 'SEQ', kind: 'rail', region: 'mainland_hub', nameZh: '三亚', nameTw: '三亞', nameEn: 'Sanya', cityZh: '三亚', cityTw: '三亞', cityEn: 'Sanya', lat: 18.297, lon: 109.498, aliases: ['sanya', 'seq', '三亚', '三亞'] },
  { code: 'KSR', kind: 'rail', region: 'mainland_hub', nameZh: '喀什', nameTw: '喀什', nameEn: 'Kashgar', cityZh: '喀什', cityTw: '喀什', cityEn: 'Kashgar', lat: 39.486, lon: 76.040, aliases: ['kashgar', 'kashi', 'ksr', '喀什'] },
  { code: 'XBM', kind: 'rail', region: 'mainland_hub', nameZh: '西双版纳', nameTw: '西雙版納', nameEn: 'Xishuangbanna', cityZh: '西双版纳', cityTw: '西雙版納', cityEn: 'Xishuangbanna', lat: 21.970, lon: 100.770, aliases: ['xishuangbanna', 'banna', 'jinghong', '西双版纳', '景洪'] },
  { code: 'MHN', kind: 'rail', region: 'mainland_hub', nameZh: '磨憨(边境口岸)', nameTw: '磨憨(邊境口岸)', nameEn: 'Mohan Border', cityZh: '磨憨', cityTw: '磨憨', cityEn: 'Mohan', lat: 21.189, lon: 101.682, aliases: ['mohan', '磨憨'] },
  { code: 'MDX', kind: 'rail', region: 'mainland_hub', nameZh: '满洲里', nameTw: '滿洲里', nameEn: 'Manzhouli', cityZh: '满洲里', cityTw: '滿洲里', cityEn: 'Manzhouli', lat: 49.598, lon: 117.445, aliases: ['manzhouli', 'mdx', '满洲里', '滿洲里'] },
  { code: 'RLC', kind: 'rail', region: 'mainland_hub', nameZh: '二连浩特', nameTw: '二連浩特', nameEn: 'Erenhot', cityZh: '二连浩特', cityTw: '二連浩特', cityEn: 'Erenhot', lat: 43.653, lon: 111.981, aliases: ['erenhot', 'erlianhaote', 'rlc', '二连浩特', '二連'] },
  { code: 'HRX', kind: 'rail', region: 'mainland_hub', nameZh: '霍尔果斯', nameTw: '霍爾果斯', nameEn: 'Khorgos', cityZh: '霍尔果斯', cityTw: '霍爾果斯', cityEn: 'Khorgos', lat: 44.201, lon: 80.422, aliases: ['khorgos', 'huoerguosi', '霍尔果斯'] },

  // Hong Kong / Taiwan Rail
  { code: 'XJA', kind: 'rail', region: 'hk_mo_tw', nameZh: '香港西九龙', nameTw: '香港西九龍', nameEn: 'HK West Kowloon', cityZh: '香港', cityTw: '香港', cityEn: 'Hong Kong', lat: 22.304, lon: 114.165, aliases: ['hongkong', 'hk', 'xja', 'hkg', '香港', '香港西九龙', '香港西九龍', '西九龙'] },
  { code: 'TPE-R', kind: 'rail', region: 'hk_mo_tw', nameZh: '台北车站(高铁)', nameTw: '台北車站(高鐵)', nameEn: 'Taipei Main THSR', cityZh: '台北', cityTw: '台北', cityEn: 'Taipei', lat: 25.048, lon: 121.517, aliases: ['taipei', 'tpe', '台北', '臺北', '台北车站'] },
  { code: 'ZUY-R', kind: 'rail', region: 'hk_mo_tw', nameZh: '左营(高雄高铁)', nameTw: '左營(高雄高鐵)', nameEn: 'Zuoying Kaohsiung THSR', cityZh: '高雄', cityTw: '高雄', cityEn: 'Kaohsiung', lat: 22.687, lon: 120.307, aliases: ['kaohsiung', 'zuoying', 'khh', '高雄', '左营', '左營'] },

  // International 12306 & Cross-Border Rail Partners
  { code: 'VTE-R', kind: 'rail', region: 'international', nameZh: '万象(中老铁路)', nameTw: '萬象(中寮鐵路)', nameEn: 'Vientiane (LCR)', cityZh: '万象', cityTw: '萬象', cityEn: 'Vientiane', lat: 18.027, lon: 102.668, aliases: ['vientiane', 'laos', 'vte', '万象', '萬象', '中老铁路', '老挝'] },
  { code: 'LPQ-R', kind: 'rail', region: 'international', nameZh: '琅勃拉邦(中老铁路)', nameTw: '瑯勃拉邦(中寮鐵路)', nameEn: 'Luang Prabang (LCR)', cityZh: '琅勃拉邦', cityTw: '瑯勃拉邦', cityEn: 'Luang Prabang', lat: 19.855, lon: 102.181, aliases: ['luangprabang', 'lpq', '琅勃拉邦'] },
  { code: 'HAN-R', kind: 'rail', region: 'international', nameZh: '河内嘉林(国际联运)', nameTw: '河內嘉林(國際聯運)', nameEn: 'Hanoi Gia Lam', cityZh: '河内', cityTw: '河內', cityEn: 'Hanoi', lat: 21.050, lon: 105.878, aliases: ['hanoi', 'han', 'vietnam', '河内', '河內', '越南'] },
  { code: 'ULN-R', kind: 'rail', region: 'international', nameZh: '乌兰巴托(国际联运)', nameTw: '烏蘭巴托(國際聯運)', nameEn: 'Ulaanbaatar', cityZh: '乌兰巴托', cityTw: '烏蘭巴托', cityEn: 'Ulaanbaatar', lat: 47.908, lon: 106.885, aliases: ['ulaanbaatar', 'uln', 'mongolia', '乌兰巴托', '烏蘭巴托', '蒙古'] },
  { code: 'ALA-R', kind: 'rail', region: 'international', nameZh: '阿拉木图(中哈国际)', nameTw: '阿拉木圖(中哈國際)', nameEn: 'Almaty-2', cityZh: '阿拉木图', cityTw: '阿拉木圖', cityEn: 'Almaty', lat: 43.274, lon: 76.939, aliases: ['almaty', 'ala', 'kazakhstan', '阿拉木图', '阿拉木圖'] },
  { code: 'MOW-R', kind: 'rail', region: 'international', nameZh: '莫斯科雅罗斯拉夫尔', nameTw: '莫斯科雅羅斯拉夫爾', nameEn: 'Moscow Yaroslavsky', cityZh: '莫斯科', cityTw: '莫斯科', cityEn: 'Moscow', lat: 55.776, lon: 37.657, aliases: ['moscow', 'mow', 'svo', 'russia', '莫斯科', '俄罗斯'] },
  { code: 'TYO-R', kind: 'rail', region: 'international', nameZh: '东京站(新干线)', nameTw: '東京站(新幹線)', nameEn: 'Tokyo Shinkansen', cityZh: '东京', cityTw: '東京', cityEn: 'Tokyo', lat: 35.681, lon: 139.767, aliases: ['tokyo', 'tyo', 'hnd', 'nrt', '东京', '東京', '新干线'] },
  { code: 'PAR-R', kind: 'rail', region: 'international', nameZh: '巴黎北站(TGV/欧洲之星)', nameTw: '巴黎北站(TGV/歐洲之星)', nameEn: 'Paris Gare du Nord', cityZh: '巴黎', cityTw: '巴黎', cityEn: 'Paris', lat: 48.881, lon: 2.355, aliases: ['paris', 'par', 'cdg', '巴黎'] },
];

export const AIRPORT_HUB_DIRECTORY: TravelDirectoryHub[] = [
  // Mainland Municipalities & Capitals + Major Hubs
  { code: 'PEK', kind: 'airport', region: 'mainland_capital', nameZh: '北京首都国际机场', nameTw: '北京首都國際機場', nameEn: 'Beijing Capital (PEK)', cityZh: '北京', cityTw: '北京', cityEn: 'Beijing', lat: 40.079, lon: 116.603, aliases: ['beijing', 'bj', 'pek', '北京', '首都机场'] },
  { code: 'PKX', kind: 'airport', region: 'mainland_capital', nameZh: '北京大兴国际机场', nameTw: '北京大興國際機場', nameEn: 'Beijing Daxing (PKX)', cityZh: '北京', cityTw: '北京', cityEn: 'Beijing', lat: 39.509, lon: 116.411, aliases: ['beijing', 'pkx', '大兴', '大興'] },
  { code: 'PVG', kind: 'airport', region: 'mainland_capital', nameZh: '上海浦东国际机场', nameTw: '上海浦東國際機場', nameEn: 'Shanghai Pudong (PVG)', cityZh: '上海', cityTw: '上海', cityEn: 'Shanghai', lat: 31.144, lon: 121.808, aliases: ['shanghai', 'sh', 'pvg', '上海', '浦东', '浦東'] },
  { code: 'SHA', kind: 'airport', region: 'mainland_capital', nameZh: '上海虹桥国际机场', nameTw: '上海虹橋國際機場', nameEn: 'Shanghai Hongqiao (SHA)', cityZh: '上海', cityTw: '上海', cityEn: 'Shanghai', lat: 31.198, lon: 121.336, aliases: ['shanghai', 'sha', '虹桥', '虹橋'] },
  { code: 'TSN', kind: 'airport', region: 'mainland_capital', nameZh: '天津滨海国际机场', nameTw: '天津濱海國際機場', nameEn: 'Tianjin Binhai (TSN)', cityZh: '天津', cityTw: '天津', cityEn: 'Tianjin', lat: 39.124, lon: 117.346, aliases: ['tianjin', 'tsn', '天津', '滨海'] },
  { code: 'CKG', kind: 'airport', region: 'mainland_capital', nameZh: '重庆江北国际机场', nameTw: '重慶江北國際機場', nameEn: 'Chongqing Jiangbei (CKG)', cityZh: '重庆', cityTw: '重慶', cityEn: 'Chongqing', lat: 29.719, lon: 106.642, aliases: ['chongqing', 'ckg', '重庆', '重慶', '江北'] },
  { code: 'CAN', kind: 'airport', region: 'mainland_capital', nameZh: '广州白云国际机场', nameTw: '廣州白雲國際機場', nameEn: 'Guangzhou Baiyun (CAN)', cityZh: '广州', cityTw: '廣州', cityEn: 'Guangzhou', lat: 23.392, lon: 113.299, aliases: ['guangzhou', 'gz', 'can', '广州', '廣州', '白云', '白雲'] },
  { code: 'SZX', kind: 'airport', region: 'mainland_hub', nameZh: '深圳宝安国际机场', nameTw: '深圳寶安國際機場', nameEn: 'Shenzhen Bao’an (SZX)', cityZh: '深圳', cityTw: '深圳', cityEn: 'Shenzhen', lat: 22.639, lon: 113.811, aliases: ['shenzhen', 'szx', '深圳', '宝安'] },
  { code: 'ZUH', kind: 'airport', region: 'mainland_hub', nameZh: '珠海金湾机场', nameTw: '珠海金灣機場', nameEn: 'Zhuhai Jinwan (ZUH)', cityZh: '珠海', cityTw: '珠海', cityEn: 'Zhuhai', lat: 22.006, lon: 113.376, aliases: ['zhuhai', 'zuh', '珠海'] },
  { code: 'TFU', kind: 'airport', region: 'mainland_capital', nameZh: '成都天府国际机场', nameTw: '成都天府國際機場', nameEn: 'Chengdu Tianfu (TFU)', cityZh: '成都', cityTw: '成都', cityEn: 'Chengdu', lat: 30.312, lon: 104.441, aliases: ['chengdu', 'tfu', '成都', '天府'] },
  { code: 'CTU', kind: 'airport', region: 'mainland_capital', nameZh: '成都双流国际机场', nameTw: '成都雙流國際機場', nameEn: 'Chengdu Shuangliu (CTU)', cityZh: '成都', cityTw: '成都', cityEn: 'Chengdu', lat: 30.578, lon: 103.947, aliases: ['chengdu', 'ctu', '双流'] },
  { code: 'HGH', kind: 'airport', region: 'mainland_capital', nameZh: '杭州萧山国际机场', nameTw: '杭州蕭山國際機場', nameEn: 'Hangzhou Xiaoshan (HGH)', cityZh: '杭州', cityTw: '杭州', cityEn: 'Hangzhou', lat: 30.230, lon: 120.434, aliases: ['hangzhou', 'hgh', '杭州', '萧山'] },
  { code: 'NKG', kind: 'airport', region: 'mainland_capital', nameZh: '南京禄口国际机场', nameTw: '南京祿口國際機場', nameEn: 'Nanjing Lukou (NKG)', cityZh: '南京', cityTw: '南京', cityEn: 'Nanjing', lat: 31.742, lon: 118.862, aliases: ['nanjing', 'nkg', '南京', '禄口'] },
  { code: 'WUH', kind: 'airport', region: 'mainland_capital', nameZh: '武汉天河国际机场', nameTw: '武漢天河國際機場', nameEn: 'Wuhan Tianhe (WUH)', cityZh: '武汉', cityTw: '武漢', cityEn: 'Wuhan', lat: 30.784, lon: 114.208, aliases: ['wuhan', 'wuh', '武汉', '武漢', '天河'] },
  { code: 'CSX', kind: 'airport', region: 'mainland_capital', nameZh: '长沙黄花国际机场', nameTw: '長沙黃花國際機場', nameEn: 'Changsha Huanghua (CSX)', cityZh: '长沙', cityTw: '長沙', cityEn: 'Changsha', lat: 28.189, lon: 113.220, aliases: ['changsha', 'csx', '长沙', '長沙', '黄花'] },
  { code: 'XIY', kind: 'airport', region: 'mainland_capital', nameZh: '西安咸阳国际机场', nameTw: '西安咸陽國際機場', nameEn: 'Xi’an Xianyang (XIY)', cityZh: '西安', cityTw: '西安', cityEn: 'Xi’an', lat: 34.447, lon: 108.752, aliases: ['xian', 'xiy', '西安', '咸阳'] },
  { code: 'CGO', kind: 'airport', region: 'mainland_capital', nameZh: '郑州新郑国际机场', nameTw: '鄭州新鄭國際機場', nameEn: 'Zhengzhou Xinzheng (CGO)', cityZh: '郑州', cityTw: '鄭州', cityEn: 'Zhengzhou', lat: 34.520, lon: 113.841, aliases: ['zhengzhou', 'cgo', '郑州', '鄭州', '新郑'] },
  { code: 'KMG', kind: 'airport', region: 'mainland_capital', nameZh: '昆明长水国际机场', nameTw: '昆明長水國際機場', nameEn: 'Kunming Changshui (KMG)', cityZh: '昆明', cityTw: '昆明', cityEn: 'Kunming', lat: 25.102, lon: 102.929, aliases: ['kunming', 'kmg', '昆明', '长水'] },
  { code: 'SJW', kind: 'airport', region: 'mainland_capital', nameZh: '石家庄正定国际机场', nameTw: '石家莊正定國際機場', nameEn: 'Shijiazhuang Zhengding (SJW)', cityZh: '石家庄', cityTw: '石家莊', cityEn: 'Shijiazhuang', lat: 38.281, lon: 114.696, aliases: ['shijiazhuang', 'sjw', '石家庄', '正定'] },
  { code: 'TYN', kind: 'airport', region: 'mainland_capital', nameZh: '太原武宿国际机场', nameTw: '太原武宿國際機場', nameEn: 'Taiyuan Wusu (TYN)', cityZh: '太原', cityTw: '太原', cityEn: 'Taiyuan', lat: 37.747, lon: 112.628, aliases: ['taiyuan', 'tyn', '太原', '武宿'] },
  { code: 'HET', kind: 'airport', region: 'mainland_capital', nameZh: '呼和浩特白塔国际机场', nameTw: '呼和浩特白塔國際機場', nameEn: 'Hohhot Baita (HET)', cityZh: '呼和浩特', cityTw: '呼和浩特', cityEn: 'Hohhot', lat: 40.851, lon: 111.824, aliases: ['hohhot', 'het', '呼和浩特', '白塔'] },
  { code: 'SHE', kind: 'airport', region: 'mainland_capital', nameZh: '沈阳桃仙国际机场', nameTw: '瀋陽桃仙國際機場', nameEn: 'Shenyang Taoxian (SHE)', cityZh: '沈阳', cityTw: '瀋陽', cityEn: 'Shenyang', lat: 41.640, lon: 123.483, aliases: ['shenyang', 'she', '沈阳', '瀋陽', '桃仙'] },
  { code: 'DLC', kind: 'airport', region: 'mainland_hub', nameZh: '大连周水子国际机场', nameTw: '大連周水子國際機場', nameEn: 'Dalian Zhoushuizi (DLC)', cityZh: '大连', cityTw: '大連', cityEn: 'Dalian', lat: 38.966, lon: 121.539, aliases: ['dalian', 'dlc', '大连', '周水子'] },
  { code: 'CGQ', kind: 'airport', region: 'mainland_capital', nameZh: '长春龙嘉国际机场', nameTw: '長春龍嘉國際機場', nameEn: 'Changchun Longjia (CGQ)', cityZh: '长春', cityTw: '長春', cityEn: 'Changchun', lat: 43.996, lon: 125.685, aliases: ['changchun', 'cgq', '长春', '長春', '龙嘉'] },
  { code: 'HRB', kind: 'airport', region: 'mainland_capital', nameZh: '哈尔滨太平国际机场', nameTw: '哈爾濱太平國際機場', nameEn: 'Harbin Taiping (HRB)', cityZh: '哈尔滨', cityTw: '哈爾濱', cityEn: 'Harbin', lat: 45.623, lon: 126.250, aliases: ['harbin', 'hrb', '哈尔滨', '哈爾濱', '太平'] },
  { code: 'HFE', kind: 'airport', region: 'mainland_capital', nameZh: '合肥新桥国际机场', nameTw: '合肥新橋國際機場', nameEn: 'Hefei Xinqiao (HFE)', cityZh: '合肥', cityTw: '合肥', cityEn: 'Hefei', lat: 31.987, lon: 116.976, aliases: ['hefei', 'hfe', '合肥', '新桥'] },
  { code: 'FOC', kind: 'airport', region: 'mainland_capital', nameZh: '福州长乐国际机场', nameTw: '福州長樂國際機場', nameEn: 'Fuzhou Changle (FOC)', cityZh: '福州', cityTw: '福州', cityEn: 'Fuzhou', lat: 25.935, lon: 119.663, aliases: ['fuzhou', 'foc', '福州', '长乐'] },
  { code: 'XMN', kind: 'airport', region: 'mainland_hub', nameZh: '厦门高崎国际机场', nameTw: '廈門高崎國際機場', nameEn: 'Xiamen Gaoqi (XMN)', cityZh: '厦门', cityTw: '廈門', cityEn: 'Xiamen', lat: 24.544, lon: 118.128, aliases: ['xiamen', 'xmn', '厦门', '高崎'] },
  { code: 'KHN', kind: 'airport', region: 'mainland_capital', nameZh: '南昌昌北国际机场', nameTw: '南昌昌北國際機場', nameEn: 'Nanchang Changbei (KHN)', cityZh: '南昌', cityTw: '南昌', cityEn: 'Nanchang', lat: 28.865, lon: 115.900, aliases: ['nanchang', 'khn', '南昌', '昌北'] },
  { code: 'TNA', kind: 'airport', region: 'mainland_capital', nameZh: '济南遥墙国际机场', nameTw: '濟南遙牆國際機場', nameEn: 'Jinan Yaoqiang (TNA)', cityZh: '济南', cityTw: '濟南', cityEn: 'Jinan', lat: 36.857, lon: 117.216, aliases: ['jinan', 'tna', '济南', '濟南', '遥墙'] },
  { code: 'TAO', kind: 'airport', region: 'mainland_hub', nameZh: '青岛胶东国际机场', nameTw: '青島膠東國際機場', nameEn: 'Qingdao Jiaodong (TAO)', cityZh: '青岛', cityTw: '青島', cityEn: 'Qingdao', lat: 36.365, lon: 120.087, aliases: ['qingdao', 'tao', '青岛', '胶东'] },
  { code: 'NNG', kind: 'airport', region: 'mainland_capital', nameZh: '南宁吴圩国际机场', nameTw: '南寧吳圩國際機場', nameEn: 'Nanning Wuxu (NNG)', cityZh: '南宁', cityTw: '南寧', cityEn: 'Nanning', lat: 22.608, lon: 108.172, aliases: ['nanning', 'nng', '南宁', '南寧', '吴圩'] },
  { code: 'HAK', kind: 'airport', region: 'mainland_capital', nameZh: '海口美兰国际机场', nameTw: '海口美蘭國際機場', nameEn: 'Haikou Meilan (HAK)', cityZh: '海口', cityTw: '海口', cityEn: 'Haikou', lat: 19.935, lon: 110.459, aliases: ['haikou', 'hak', '海口', '美兰'] },
  { code: 'SYX', kind: 'airport', region: 'mainland_hub', nameZh: '三亚凤凰国际机场', nameTw: '三亞鳳凰國際機場', nameEn: 'Sanya Phoenix (SYX)', cityZh: '三亚', cityTw: '三亞', cityEn: 'Sanya', lat: 18.303, lon: 109.412, aliases: ['sanya', 'syx', '三亚', '三亞', '凤凰'] },
  { code: 'KWE', kind: 'airport', region: 'mainland_capital', nameZh: '贵阳龙洞堡国际机场', nameTw: '貴陽龍洞堡國際機場', nameEn: 'Guiyang Longdongbao (KWE)', cityZh: '贵阳', cityTw: '貴陽', cityEn: 'Guiyang', lat: 26.539, lon: 106.801, aliases: ['guiyang', 'kwe', '贵阳', '貴陽', '龙洞堡'] },
  { code: 'LXA', kind: 'airport', region: 'mainland_capital', nameZh: '拉萨贡嘎国际机场', nameTw: '拉薩貢嘎國際機場', nameEn: 'Lhasa Gonggar (LXA)', cityZh: '拉萨', cityTw: '拉薩', cityEn: 'Lhasa', lat: 29.298, lon: 90.912, aliases: ['lhasa', 'lxa', '拉萨', '拉薩', '贡嘎'] },
  { code: 'LHW', kind: 'airport', region: 'mainland_capital', nameZh: '兰州中川国际机场', nameTw: '蘭州中川國際機場', nameEn: 'Lanzhou Zhongchuan (LHW)', cityZh: '兰州', cityTw: '蘭州', cityEn: 'Lanzhou', lat: 36.515, lon: 103.621, aliases: ['lanzhou', 'lhw', '兰州', '蘭州', '中川'] },
  { code: 'XNN', kind: 'airport', region: 'mainland_capital', nameZh: '西宁曹家堡国际机场', nameTw: '西寧曹家堡國際機場', nameEn: 'Xining Caojiapu (XNN)', cityZh: '西宁', cityTw: '西寧', cityEn: 'Xining', lat: 36.528, lon: 102.043, aliases: ['xining', 'xnn', '西宁', '西寧', '曹家堡'] },
  { code: 'INC', kind: 'airport', region: 'mainland_capital', nameZh: '银川河东国际机场', nameTw: '銀川河東國際機場', nameEn: 'Yinchuan Hedong (INC)', cityZh: '银川', cityTw: '銀川', cityEn: 'Yinchuan', lat: 38.322, lon: 106.393, aliases: ['yinchuan', 'inc', '银川', '銀川', '河东'] },
  { code: 'URC', kind: 'airport', region: 'mainland_capital', nameZh: '乌鲁木齐天山国际机场', nameTw: '烏魯木齊天山國際機場', nameEn: 'Urumqi Tianshan (URC)', cityZh: '乌鲁木齐', cityTw: '烏魯木齊', cityEn: 'Urumqi', lat: 43.907, lon: 87.474, aliases: ['urumqi', 'urc', '乌鲁木齐', '烏魯木齊', '地窝堡', '天山机场'] },

  // Hong Kong, Macau & Taiwan Airports (complete)
  { code: 'HKG', kind: 'airport', region: 'hk_mo_tw', nameZh: '香港国际机场', nameTw: '香港國際機場', nameEn: 'Hong Kong Int’l (HKG)', cityZh: '香港', cityTw: '香港', cityEn: 'Hong Kong', lat: 22.308, lon: 113.918, aliases: ['hongkong', 'hkg', 'hk', '香港', '赤鱲角'] },
  { code: 'MFM', kind: 'airport', region: 'hk_mo_tw', nameZh: '澳门国际机场', nameTw: '澳門國際機場', nameEn: 'Macau Int’l (MFM)', cityZh: '澳门', cityTw: '澳門', cityEn: 'Macau', lat: 22.150, lon: 113.592, aliases: ['macau', 'macao', 'mfm', '澳门', '澳門', '氹仔'] },
  { code: 'TPE', kind: 'airport', region: 'hk_mo_tw', nameZh: '台北桃园国际机场', nameTw: '台北桃園國際機場', nameEn: 'Taipei Taoyuan (TPE)', cityZh: '台北', cityTw: '台北', cityEn: 'Taipei', lat: 25.078, lon: 121.233, aliases: ['taipei', 'taoyuan', 'tpe', '台北', '臺北', '桃园', '桃園'] },
  { code: 'TSA', kind: 'airport', region: 'hk_mo_tw', nameZh: '台北松山机场', nameTw: '台北松山機場', nameEn: 'Taipei Songshan (TSA)', cityZh: '台北', cityTw: '台北', cityEn: 'Taipei', lat: 25.069, lon: 121.553, aliases: ['songshan', 'tsa', '松山', '台北松山'] },
  { code: 'KHH', kind: 'airport', region: 'hk_mo_tw', nameZh: '高雄小港国际机场', nameTw: '高雄小港國際機場', nameEn: 'Kaohsiung Int’l (KHH)', cityZh: '高雄', cityTw: '高雄', cityEn: 'Kaohsiung', lat: 22.577, lon: 120.350, aliases: ['kaohsiung', 'khh', '高雄', '小港'] },
  { code: 'RMQ', kind: 'airport', region: 'hk_mo_tw', nameZh: '台中清泉岗国际机场', nameTw: '台中清泉崗國際機場', nameEn: 'Taichung (RMQ)', cityZh: '台中', cityTw: '台中', cityEn: 'Taichung', lat: 24.265, lon: 120.621, aliases: ['taichung', 'rmq', '台中', '臺中', '清泉岗'] },
  { code: 'KNH', kind: 'airport', region: 'hk_mo_tw', nameZh: '金门尚义机场', nameTw: '金門尚義機場', nameEn: 'Kinmen (KNH)', cityZh: '金门', cityTw: '金門', cityEn: 'Kinmen', lat: 24.428, lon: 118.359, aliases: ['kinmen', 'knh', '金门', '金門'] },

  // Major International Airports
  { code: 'HND', kind: 'airport', region: 'international', nameZh: '东京羽田国际机场', nameTw: '東京羽田國際機場', nameEn: 'Tokyo Haneda (HND)', cityZh: '东京', cityTw: '東京', cityEn: 'Tokyo', lat: 35.549, lon: 139.780, aliases: ['tokyo', 'hnd', 'tyo', '东京', '東京', '羽田'] },
  { code: 'NRT', kind: 'airport', region: 'international', nameZh: '东京成田国际机场', nameTw: '東京成田國際機場', nameEn: 'Tokyo Narita (NRT)', cityZh: '东京', cityTw: '東京', cityEn: 'Tokyo', lat: 35.772, lon: 140.393, aliases: ['narita', 'nrt', '成田'] },
  { code: 'KIX', kind: 'airport', region: 'international', nameZh: '大阪关西国际机场', nameTw: '大阪關西國際機場', nameEn: 'Osaka Kansai (KIX)', cityZh: '大阪', cityTw: '大阪', cityEn: 'Osaka', lat: 34.427, lon: 135.244, aliases: ['osaka', 'kix', '大阪', '关西'] },
  { code: 'ICN', kind: 'airport', region: 'international', nameZh: '首尔仁川国际机场', nameTw: '首爾仁川國際機場', nameEn: 'Seoul Incheon (ICN)', cityZh: '首尔', cityTw: '首爾', cityEn: 'Seoul', lat: 37.460, lon: 126.441, aliases: ['seoul', 'icn', 'gmp', '首尔', '首爾', '仁川'] },
  { code: 'SIN', kind: 'airport', region: 'international', nameZh: '新加坡樟宜国际机场', nameTw: '新加坡樟宜國際機場', nameEn: 'Singapore Changi (SIN)', cityZh: '新加坡', cityTw: '新加坡', cityEn: 'Singapore', lat: 1.364, lon: 103.992, aliases: ['singapore', 'sin', '新加坡', '樟宜'] },
  { code: 'BKK', kind: 'airport', region: 'international', nameZh: '曼谷素万那普国际机场', nameTw: '曼谷素萬那普國際機場', nameEn: 'Bangkok Suvarnabhumi (BKK)', cityZh: '曼谷', cityTw: '曼谷', cityEn: 'Bangkok', lat: 13.690, lon: 100.750, aliases: ['bangkok', 'bkk', '曼谷'] },
  { code: 'KUL', kind: 'airport', region: 'international', nameZh: '吉隆坡国际机场', nameTw: '吉隆坡國際機場', nameEn: 'Kuala Lumpur (KUL)', cityZh: '吉隆坡', cityTw: '吉隆坡', cityEn: 'Kuala Lumpur', lat: 2.746, lon: 101.710, aliases: ['kualalumpur', 'kul', '吉隆坡'] },
  { code: 'DXB', kind: 'airport', region: 'international', nameZh: '迪拜国际机场', nameTw: '杜拜國際機場', nameEn: 'Dubai Int’l (DXB)', cityZh: '迪拜', cityTw: '杜拜', cityEn: 'Dubai', lat: 25.253, lon: 55.366, aliases: ['dubai', 'dxb', '迪拜', '杜拜'] },
  { code: 'LHR', kind: 'airport', region: 'international', nameZh: '伦敦希思罗国际机场', nameTw: '倫敦希斯洛國際機場', nameEn: 'London Heathrow (LHR)', cityZh: '伦敦', cityTw: '倫敦', cityEn: 'London', lat: 51.470, lon: -0.454, aliases: ['london', 'lhr', '伦敦', '倫敦'] },
  { code: 'CDG', kind: 'airport', region: 'international', nameZh: '巴黎戴高乐国际机场', nameTw: '巴黎戴高樂國際機場', nameEn: 'Paris CDG (CDG)', cityZh: '巴黎', cityTw: '巴黎', cityEn: 'Paris', lat: 49.010, lon: 2.548, aliases: ['paris', 'cdg', '巴黎'] },
  { code: 'FRA', kind: 'airport', region: 'international', nameZh: '法兰克福国际机场', nameTw: '法蘭克福國際機場', nameEn: 'Frankfurt (FRA)', cityZh: '法兰克福', cityTw: '法蘭克福', cityEn: 'Frankfurt', lat: 50.038, lon: 8.562, aliases: ['frankfurt', 'fra', '法兰克福', '法蘭克福'] },
  { code: 'SVO', kind: 'airport', region: 'international', nameZh: '莫斯科谢列梅捷沃机场', nameTw: '莫斯科謝列梅捷沃機場', nameEn: 'Moscow Sheremetyevo (SVO)', cityZh: '莫斯科', cityTw: '莫斯科', cityEn: 'Moscow', lat: 55.973, lon: 37.415, aliases: ['moscow', 'svo', '莫斯科'] },
  { code: 'JFK', kind: 'airport', region: 'international', nameZh: '纽约肯尼迪国际机场', nameTw: '紐約肯尼迪國際機場', nameEn: 'New York JFK (JFK)', cityZh: '纽约', cityTw: '紐約', cityEn: 'New York', lat: 40.641, lon: -73.778, aliases: ['newyork', 'nyc', 'jfk', '纽约', '紐約'] },
  { code: 'LAX', kind: 'airport', region: 'international', nameZh: '洛杉矶国际机场', nameTw: '洛杉磯國際機場', nameEn: 'Los Angeles (LAX)', cityZh: '洛杉矶', cityTw: '洛杉磯', cityEn: 'Los Angeles', lat: 33.942, lon: -118.409, aliases: ['losangeles', 'lax', '洛杉矶', '洛杉磯'] },
  { code: 'SFO', kind: 'airport', region: 'international', nameZh: '旧金山国际机场', nameTw: '舊金山國際機場', nameEn: 'San Francisco (SFO)', cityZh: '旧金山', cityTw: '舊金山', cityEn: 'San Francisco', lat: 37.621, lon: -122.379, aliases: ['sanfrancisco', 'sfo', '旧金山', '舊金山'] },
  { code: 'YVR', kind: 'airport', region: 'international', nameZh: '温哥华国际机场', nameTw: '溫哥華國際機場', nameEn: 'Vancouver (YVR)', cityZh: '温哥华', cityTw: '溫哥華', cityEn: 'Vancouver', lat: 49.195, lon: -123.184, aliases: ['vancouver', 'yvr', '温哥华', '溫哥華'] },
  { code: 'SYD', kind: 'airport', region: 'international', nameZh: '悉尼金斯福德史密斯机场', nameTw: '雪梨金斯福德機場', nameEn: 'Sydney Kingsford Smith (SYD)', cityZh: '悉尼', cityTw: '雪梨', cityEn: 'Sydney', lat: -33.946, lon: 151.177, aliases: ['sydney', 'syd', '悉尼', '雪梨'] },
  { code: 'VTE', kind: 'airport', region: 'international', nameZh: '万象瓦岱国际机场', nameTw: '萬象瓦岱國際機場', nameEn: 'Vientiane Wattay (VTE)', cityZh: '万象', cityTw: '萬象', cityEn: 'Vientiane', lat: 17.988, lon: 102.563, aliases: ['vientiane', 'vte', '万象', '萬象'] },
];

function normalizeTravelQueryToken(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s\-_.'’]/g, '');
}

function matchHubScore(hub: TravelDirectoryHub, rawQuery: string): number {
  const q = normalizeTravelQueryToken(rawQuery);
  if (!q) return 0;
  if (hub.code.toLowerCase() === q) return 100;
  if (normalizeTravelQueryToken(hub.cityZh) === q || normalizeTravelQueryToken(hub.cityEn) === q) return 92;
  if (normalizeTravelQueryToken(hub.nameZh) === q || normalizeTravelQueryToken(hub.nameEn) === q) return 96;
  if (hub.aliases.some((a) => normalizeTravelQueryToken(a) === q)) return 88;
  if (hub.aliases.some((a) => normalizeTravelQueryToken(a).includes(q) || q.includes(normalizeTravelQueryToken(a)))) return 60;
  return 0;
}

export function resolveDirectoryHub(query: string, kind: 'rail' | 'airport'): TravelDirectoryHub | null {
  const clean = query.trim();
  if (!clean) return null;
  const pool = kind === 'rail' ? RAIL_HUB_STATIONS : AIRPORT_HUB_DIRECTORY;
  let best: TravelDirectoryHub | null = null;
  let bestScore = 0;
  for (const hub of pool) {
    const score = matchHubScore(hub, clean);
    if (score > bestScore) {
      bestScore = score;
      best = hub;
    }
  }
  return bestScore > 0 ? best : null;
}

export function searchTravelDirectoryStations(query: string, kind: 'rail' | 'airport', limit = 8): TravelDirectoryHub[] {
  const pool = kind === 'rail' ? RAIL_HUB_STATIONS : AIRPORT_HUB_DIRECTORY;
  const clean = query.trim();
  if (!clean) return pool.slice(0, limit);
  return pool
    .map((hub) => ({ hub, score: matchHubScore(hub, clean) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.hub);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.max(90, Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
}

function addMinutesHHMM(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = ((Number.isFinite(h) ? h : 8) * 60 + (Number.isFinite(m) ? m : 0) + mins) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function formatDurationMinutes(mins: number, isZh: boolean, isTw: boolean): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!isZh) return h > 0 ? `${h}h${String(m).padStart(2, '0')}m` : `${m}m`;
  if (h === 0) return `${m}分`;
  return `${h}${isTw ? '時' : '时'}${m}分`;
}

export function queryDynamic12306Trains(
  originQuery: string,
  destQuery: string,
  lang: Language
): RichTrainItem[] {
  const oHub = resolveDirectoryHub(originQuery, 'rail');
  const dHub = resolveDirectoryHub(destQuery, 'rail');
  if (!oHub || !dHub || oHub.code === dHub.code) return [];

  const isTw = lang === 'zh-TW';
  const isZh = lang === 'zh-CN' || isTw;
  const oName = isTw ? oHub.nameTw : isZh ? oHub.nameZh : oHub.nameEn;
  const dName = isTw ? dHub.nameTw : isZh ? dHub.nameZh : dHub.nameEn;

  const distKm = Math.round(haversineKm(oHub.lat, oHub.lon, dHub.lat, dHub.lon) * 1.18);
  const isCrossBorder = oHub.region === 'international' || dHub.region === 'international';
  const isIntercity = !isCrossBorder && distKm < 260;

  const midHub =
    RAIL_HUB_STATIONS.find(
      (h) =>
        h.code !== oHub.code &&
        h.code !== dHub.code &&
        h.region === 'mainland_capital' &&
        haversineKm(oHub.lat, oHub.lon, h.lat, h.lon) + haversineKm(h.lat, h.lon, dHub.lat, dHub.lon) <
          distKm * 1.15
    ) || null;
  const midName = midHub ? (isTw ? midHub.nameTw : isZh ? midHub.nameZh : midHub.nameEn) : null;

  const hashSeed = (oHub.code + dHub.code).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const depSlots = isCrossBorder ? ['08:08', '13:40'] : ['07:38', '11:20', '15:45'];

  return depSlots.map((depart, idx) => {
    const prefix = isCrossBorder ? (idx === 0 ? 'D' : 'K') : isIntercity ? 'C' : idx === 1 ? 'D' : 'G';
    const numBase = ((hashSeed * (idx + 3)) % 890) + 101;
    const trainNo = `${prefix}${numBase}`;
    const speedKmh = prefix === 'G' ? 275 : prefix === 'C' ? 240 : prefix === 'D' ? 185 : 105;
    const durationMinutes = Math.max(28, Math.round((distKm / speedKmh) * 60 + 14 + idx * 9));
    const arrive = addMinutesHHMM(depart, durationMinutes);
    const fareRate = prefix === 'G' ? 0.48 : prefix === 'C' ? 0.44 : prefix === 'D' ? 0.34 : 0.25;
    const secondClass = Math.max(38, Math.round(distKm * fareRate));
    const firstClass = Math.round(secondClass * 1.6);
    const businessClass = Math.round(secondClass * 3.15);

    const stops: TrainStopNode[] = [{ station: oName, arrive: '--', depart, stay: isTw ? '始發' : isZh ? '始发' : 'Start' }];
    if (midName) {
      const midArr = addMinutesHHMM(depart, Math.round(durationMinutes * 0.48));
      const midDep = addMinutesHHMM(midArr, 3);
      stops.push({ station: midName, arrive: midArr, depart: midDep, stay: isZh ? '3分' : '3m' });
    }
    stops.push({ station: dName, arrive, depart: '--', stay: isTw ? '終點' : isZh ? '终点' : 'End' });

    return {
      trainNo,
      trainTag: isCrossBorder
        ? isTw
          ? '12306 國際聯運 / 跨境'
          : isZh
          ? '12306 国际联运 / 跨境'
          : '12306 Cross-Border Rail'
        : isTw
        ? `12306 全國直通 (${oHub.code}→${dHub.code})`
        : isZh
        ? `12306 全国直通 (${oHub.code}→${dHub.code})`
        : `12306 Network (${oHub.code}→${dHub.code})`,
      from: oName,
      to: dName,
      fromKeys: oHub.aliases,
      toKeys: dHub.aliases,
      depart,
      arrive,
      duration: formatDurationMinutes(durationMinutes, isZh, isTw),
      durationMinutes,
      punctuality: isCrossBorder ? '96.8%' : '98.9%',
      minPrice: secondClass,
      amenities: isCrossBorder
        ? isZh
          ? ['跨境边检引导', '多币种支付', '充电口', '餐车']
          : ['Border Guide', 'Multi-Currency', 'Power', 'Dining']
        : isTw
        ? ['復興號Wi-Fi', '充電口', '靜音車廂']
        : isZh
        ? ['复兴号Wi-Fi', '充电口', '静音车厢']
        : ['Wi-Fi', 'Power Outlets', 'Quiet Car'],
      stops,
      seats: [
        { name: isZh ? '二等座' : '2nd Class', price: `¥${secondClass}`, numericPrice: secondClass, left: isZh ? '有票' : 'Avail' },
        { name: isZh ? '一等座' : '1st Class', price: `¥${firstClass}`, numericPrice: firstClass, left: isZh ? '有票' : 'Avail' },
        ...(prefix === 'G' || prefix === 'C'
          ? [{ name: isTw ? '商務座' : isZh ? '商务座' : 'Business', price: `¥${businessClass}`, numericPrice: businessClass, left: isZh ? '4張' : '4' }]
          : []),
      ],
    };
  });
}

export function queryDynamicGlobalFlights(
  originQuery: string,
  destQuery: string,
  lang: Language
): RichFlightItem[] {
  const oHub = resolveDirectoryHub(originQuery, 'airport');
  const dHub = resolveDirectoryHub(destQuery, 'airport');
  if (!oHub || !dHub || oHub.code === dHub.code) return [];

  const isTw = lang === 'zh-TW';
  const isZh = lang === 'zh-CN' || isTw;
  const oName = isTw ? oHub.nameTw : isZh ? oHub.nameZh : oHub.nameEn;
  const dName = isTw ? dHub.nameTw : isZh ? dHub.nameZh : dHub.nameEn;

  const distKm = haversineKm(oHub.lat, oHub.lon, dHub.lat, dHub.lon);
  const isIntl =
    oHub.region === 'international' ||
    dHub.region === 'international' ||
    oHub.region === 'hk_mo_tw' ||
    dHub.region === 'hk_mo_tw';
  const isLongHaul = distKm > 3200;
  const hashSeed = (oHub.code + dHub.code).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const airlines = isIntl
    ? [
        { code: 'CA', nameZh: '中国国航', nameTw: '中國國航', nameEn: 'Air China' },
        { code: 'CX', nameZh: '国泰航空', nameTw: '國泰航空', nameEn: 'Cathay Pacific' },
        { code: 'MU', nameZh: '中国东航', nameTw: '中國東航', nameEn: 'China Eastern' },
      ]
    : [
        { code: 'CA', nameZh: '中国国航', nameTw: '中國國航', nameEn: 'Air China' },
        { code: 'CZ', nameZh: '中国南航', nameTw: '中國南航', nameEn: 'China Southern' },
        { code: 'MU', nameZh: '中国东航', nameTw: '中國東航', nameEn: 'China Eastern' },
      ];

  const depTimes = isLongHaul ? ['10:15', '22:45'] : ['08:30', '14:20', '19:10'];
  return depTimes.map((depart, idx) => {
    const carrier = airlines[idx % airlines.length];
    const flightNum = `${carrier.code}${((hashSeed + idx * 137) % 8800) + 1100}`;
    const cruiseKmh = isLongHaul ? 860 : 790;
    const durationMinutes = Math.max(65, Math.round((distKm / cruiseKmh) * 60 + 35 + idx * 5));
    const arrive = addMinutesHHMM(depart, durationMinutes);
    const econPrice = Math.max(420, Math.round(distKm * (isIntl ? 0.92 : 0.62) + idx * 80));
    const bizPrice = Math.round(econPrice * (isLongHaul ? 3.8 : 2.6));

    return {
      flightNo: flightNum,
      airline: isTw ? carrier.nameTw : isZh ? carrier.nameZh : carrier.nameEn,
      aircraft: isLongHaul ? 'Airbus A350-900' : distKm > 1600 ? 'Boeing 787-9' : 'Airbus A321neo',
      cabinNote: `${oHub.code} → ${dHub.code}`,
      from: oName,
      to: dName,
      fromKeys: oHub.aliases,
      toKeys: dHub.aliases,
      depart,
      arrive,
      duration: formatDurationMinutes(durationMinutes, isZh, isTw),
      durationMinutes,
      punctuality: isLongHaul ? '91.5%' : '93.8%',
      minPrice: econPrice,
      meal: isZh ? (durationMinutes > 110 ? '热食正餐 + 饮品' : '茶点简餐') : durationMinutes > 110 ? 'Hot Meal' : 'Snack',
      baggage: isIntl ? (isZh ? '23kg × 1件 + 7kg手提' : '23kg Checked + 7kg Carry-on') : isZh ? '20kg 免费托运' : '20kg Checked',
      checkinGateOffsetMin: isIntl ? 90 : 50,
      seats: [
        { name: isTw ? '經濟艙' : isZh ? '经济舱' : 'Economy', price: `¥${econPrice.toLocaleString('en-US')}`, numericPrice: econPrice, left: '20kg+' },
        { name: isTw ? '商務艙' : isZh ? '公务舱' : 'Business', price: `¥${bizPrice.toLocaleString('en-US')}`, numericPrice: bizPrice, left: isZh ? '优先通道' : 'Priority' },
      ],
    };
  });
}

// =====================================================================
// Complete Transit Transfers: All Mainland Capitals/Municipalities + HK/MO/TW + Global Hubs
// =====================================================================

interface RawTransitRecord {
  id: string;
  regionTag: TransitRegionTag;
  airportCode: string;
  railHub: string;
  cityZh: string;
  cityTw: string;
  cityEn: string;
  cityKeys: string[];
  hubPairZh: string;
  hubPairTw: string;
  hubPairEn: string;
  modeIcon: 'rail' | 'bus' | 'taxi';
  modeZh: string;
  modeTw: string;
  modeEn: string;
  durationMin: string;
  fare: string;
  freqZh: string;
  freqEn: string;
  hours: string;
  notesZh: string;
  notesTw: string;
  notesEn: string;
}

const ALL_HUB_TRANSIT_CATALOG: RawTransitRecord[] = [
  // 4 Municipalities
  {
    id: 'bj-pkx-express', regionTag: 'municipality_capital', airportCode: 'PKX', railHub: '北京西/草桥',
    cityZh: '北京', cityTw: '北京', cityEn: 'Beijing', cityKeys: ['beijing', 'bj', 'pkx', 'pek', '北京', '大兴', '首都'],
    hubPairZh: '大兴机场 PKX / 首都 PEK ➔ 北京西 / 北京南', hubPairTw: '大興機場 PKX / 首都 PEK ➔ 北京西 / 北京南', hubPairEn: 'PKX / PEK Airports ➔ Beijing West / South Rail',
    modeIcon: 'rail', modeZh: '大兴机场快轨 / 首都机场线', modeTw: '大興機場快軌 / 首都機場線', modeEn: 'Daxing & Capital Airport Express',
    durationMin: '19–28', fare: '¥25–35', freqZh: '每 8–10 分钟', freqEn: 'Every 8–10m', hours: '06:00 – 23:00',
    notesZh: '草桥/东直门换乘地铁直达北京南站、北京西站及金融街。', notesTw: '草橋/東直門轉乘地鐵直達北京南站與北京西站。', notesEn: 'Interchange to Metro 10/19 & 2/13 for Beijing South/West HSR.',
  },
  {
    id: 'sh-maglev', regionTag: 'municipality_capital', airportCode: 'PVG/SHA', railHub: '上海虹桥',
    cityZh: '上海', cityTw: '上海', cityEn: 'Shanghai', cityKeys: ['shanghai', 'sh', 'pvg', 'sha', '上海', '浦东', '虹桥'],
    hubPairZh: '浦东机场 PVG / 虹桥 SHA ➔ 上海虹桥高铁枢纽', hubPairTw: '浦東機場 PVG / 虹橋 SHA ➔ 上海虹橋高鐵樞紐', hubPairEn: 'PVG / SHA Airports ➔ Shanghai Hongqiao HSR',
    modeIcon: 'rail', modeZh: '机场联络线 / 磁浮 / 地铁2号线', modeTw: '機場聯絡線 / 磁浮 / 地鐵2號線', modeEn: 'Airport Link / Maglev / Line 2',
    durationMin: '8–40', fare: '¥7–50', freqZh: '每 6–15 分钟', freqEn: 'Every 6–15m', hours: '06:00 – 23:30',
    notesZh: '市域机场线40分钟直通浦东T1/T2与虹桥枢纽，零距离换乘京沪高铁。', notesTw: '市域機場線40分鐘直通浦東與虹橋高鐵站。', notesEn: 'Suburban Airport Link connects PVG and SHA/Hongqiao HSR in ~40m.',
  },
  {
    id: 'tj-tsn-metro', regionTag: 'municipality_capital', airportCode: 'TSN', railHub: '天津站/天津西',
    cityZh: '天津', cityTw: '天津', cityEn: 'Tianjin', cityKeys: ['tianjin', 'tj', 'tsn', '天津', '滨海'],
    hubPairZh: '滨海国际机场 TSN ➔ 天津站（京津城际）', hubPairTw: '濱海國際機場 TSN ➔ 天津站（京津城際）', hubPairEn: 'TSN Binhai Airport ➔ Tianjin Rail Station',
    modeIcon: 'rail', modeZh: '地铁 2 号线机场专线', modeTw: '地鐵 2 號線機場專線', modeEn: 'Metro Line 2 Airport Link',
    durationMin: '24', fare: '¥5', freqZh: '每 6 分钟', freqEn: 'Every 6m', hours: '06:00 – 22:50',
    notesZh: 'B/C航站楼地下厅乘2号线直达天津站，换乘30分钟城际赴北京南。', notesTw: 'B/C航廈地下乘2號線直達天津站換乘京津城際。', notesEn: 'Direct Metro Line 2 link to Beijing-Tianjin Intercity HSR.',
  },
  {
    id: 'cq-ckg-loop', regionTag: 'municipality_capital', airportCode: 'CKG', railHub: '重庆北/重庆西',
    cityZh: '重庆', cityTw: '重慶', cityEn: 'Chongqing', cityKeys: ['chongqing', 'cq', 'ckg', '重庆', '重慶', '江北'],
    hubPairZh: '江北机场 CKG T2/T3 ➔ 重庆北站 / 重庆西站', hubPairTw: '江北機場 CKG T2/T3 ➔ 重慶北站 / 重慶西站', hubPairEn: 'CKG Jiangbei T2/T3 ➔ Chongqing North / West',
    modeIcon: 'rail', modeZh: '轨道交通 10 号线快车 + 环线', modeTw: '軌道交通 10 號線快車 + 環線', modeEn: 'CRT Line 10 Express + Loop',
    durationMin: '23–48', fare: '¥6', freqZh: '每 7 分钟', freqEn: 'Every 7m', hours: '06:30 – 23:00',
    notesZh: '10号线快速车直达重庆北站南/北广场及江北商圈。', notesTw: '10號線快車直達重慶北站高鐵樞紐。', notesEn: 'CRT Line 10 rapid service connects CKG T3 directly to Chongqing North.',
  },

  // Hong Kong, Macau & Taiwan Airports (complete)
  {
    id: 'hk-airport-express', regionTag: 'hk_mo_tw', airportCode: 'HKG', railHub: '香港西九龙/九龙',
    cityZh: '香港', cityTw: '香港', cityEn: 'Hong Kong', cityKeys: ['hongkong', 'hk', 'hkg', '香港', '西九龙', '西九龍', '赤鱲角'],
    hubPairZh: '香港国际机场 HKG ➔ 西九龙高铁站 / 九龙 / 中环', hubPairTw: '香港國際機場 HKG ➔ 西九龍高鐵站 / 九龍 / 中環', hubPairEn: 'HKG Airport ➔ HK West Kowloon HSR / Central',
    modeIcon: 'rail', modeZh: '港铁机场快线 (Airport Express)', modeTw: '港鐵機場快綫 (Airport Express)', modeEn: 'MTR Airport Express',
    durationMin: '24', fare: 'HK$110', freqZh: '每 10 分钟', freqEn: 'Every 10m', hours: '05:54 – 00:48',
    notesZh: '九龙站天桥步行直连12306香港西九龙高铁口岸，“一地两检”直通内地。', notesTw: '九龍站天橋步行直連西九龍高鐵口岸，支援預辦登機。', notesEn: 'Walkway from Kowloon Station directly links West Kowloon 12306 HSR.',
  },
  {
    id: 'mo-mfm-lrt', regionTag: 'hk_mo_tw', airportCode: 'MFM', railHub: '横琴口岸/拱北/珠海站',
    cityZh: '澳门', cityTw: '澳門', cityEn: 'Macau', cityKeys: ['macau', 'macao', 'mfm', '澳门', '澳門', '氹仔', '珠海', '横琴'],
    hubPairZh: '澳门国际机场 MFM ➔ 氹仔/横琴口岸/拱北(珠海站)', hubPairTw: '澳門國際機場 MFM ➔ 氹仔/橫琴口岸/拱北(珠海站)', hubPairEn: 'Macau Airport (MFM) ➔ Hengqin / Gongbei / Zhuhai Rail',
    modeIcon: 'rail', modeZh: '澳门轻轨氹仔线 + 横琴/关闸口岸快线', modeTw: '澳門輕軌氹仔線 + 橫琴/關閘口岸快線', modeEn: 'Macau LRT Taipa Line + Cross-Border Bus',
    durationMin: '15–30', fare: 'MOP$6–12', freqZh: '每 7–10 分钟', freqEn: 'Every 7–10m', hours: '06:30 – 23:15',
    notesZh: '轻轨直连横琴线及氹仔码头；经横琴/拱北口岸无缝接驳广珠城际珠海站。', notesTw: '輕軌直連橫琴線與碼頭，過關後無縫銜接珠海站高鐵。', notesEn: 'Macau LRT connects Hengqin/Taipa Ferry & Gongbei Gate to Zhuhai 12306 rail.',
  },
  {
    id: 'tw-tpe-mrt', regionTag: 'hk_mo_tw', airportCode: 'TPE', railHub: '台北车站/高铁路网',
    cityZh: '台北', cityTw: '台北', cityEn: 'Taipei', cityKeys: ['taipei', 'tpe', 'taoyuan', '台北', '臺北', '桃园', '桃園'],
    hubPairZh: '台北桃园机场 TPE T1/T2 ➔ 台北车站 / 高铁桃园站', hubPairTw: '台北桃園機場 TPE T1/T2 ➔ 台北車站 / 高鐵桃園站', hubPairEn: 'Taipei Taoyuan (TPE) ➔ Taipei Main / THSR Taoyuan',
    modeIcon: 'rail', modeZh: '桃园机场捷运直达车 (紫色快车)', modeTw: '桃園機場捷運直達車 (紫色快車)', modeEn: 'Taoyuan Airport MRT Express',
    durationMin: '18–35', fare: 'NT$35–160', freqZh: '每 15 分钟', freqEn: 'Every 15m', hours: '06:00 – 23:30',
    notesZh: '向北35分钟直达台北车站（含市区预办登机）；向南18分钟直达高铁桃园站。', notesTw: '北上35分鐘直達台北車站，南下18分鐘銜接高鐵桃園站。', notesEn: '35m Express north to Taipei Main; 18m south to THSR Taoyuan.',
  },
  {
    id: 'tw-tsa-metro', regionTag: 'hk_mo_tw', airportCode: 'TSA', railHub: '台北车站/南港高铁',
    cityZh: '台北(松山)', cityTw: '台北(松山)', cityEn: 'Taipei (TSA)', cityKeys: ['taipei', 'tsa', 'songshan', '台北', '松山'],
    hubPairZh: '台北松山机场 TSA ➔ 台北车站 / 南港高铁站', hubPairTw: '台北松山機場 TSA ➔ 台北車站 / 南港高鐵站', hubPairEn: 'Taipei Songshan (TSA) ➔ Taipei Main / Nangang THSR',
    modeIcon: 'rail', modeZh: '台北捷运文湖线 + 板南线', modeTw: '台北捷運文湖線 + 板南線', modeEn: 'Taipei Metro Wenhu + Bannan Line',
    durationMin: '14', fare: 'NT$25', freqZh: '每 4–6 分钟', freqEn: 'Every 4–6m', hours: '06:00 – 24:00',
    notesZh: '航厦门口即捷运松山机场站，一站转忠孝复兴直达台北高铁及南港站。', notesTw: '航廈直連捷運站，快速銜接台北與南港高鐵站。', notesEn: 'Direct Wenhu Line access to central Taipei & THSR terminals.',
  },
  {
    id: 'tw-khh-mrt', regionTag: 'hk_mo_tw', airportCode: 'KHH', railHub: '左营高铁站',
    cityZh: '高雄', cityTw: '高雄', cityEn: 'Kaohsiung', cityKeys: ['kaohsiung', 'khh', 'zuoying', '高雄', '小港', '左营', '左營'],
    hubPairZh: '高雄小港国际机场 KHH ➔ 高铁左营站', hubPairTw: '高雄小港國際機場 KHH ➔ 高鐵左營站', hubPairEn: 'Kaohsiung Airport (KHH) ➔ THSR Zuoying',
    modeIcon: 'rail', modeZh: '高雄捷运红线 (直通不换乘)', modeTw: '高雄捷運紅線 (一車直達)', modeEn: 'Kaohsiung MRT Red Line',
    durationMin: '27', fare: 'NT$50', freqZh: '每 6–8 分钟', freqEn: 'Every 6–8m', hours: '05:55 – 23:55',
    notesZh: 'R4高雄国际机场站乘红线北行一车直达R16高铁左营站。', notesTw: 'R4高雄國際機場站乘紅線北上免換乘直達左營高鐵站。', notesEn: 'Single-seat MRT Red Line ride from KHH directly to THSR Zuoying.',
  },
  {
    id: 'tw-rmq-bus', regionTag: 'hk_mo_tw', airportCode: 'RMQ', railHub: '高铁台中站',
    cityZh: '台中', cityTw: '台中', cityEn: 'Taichung', cityKeys: ['taichung', 'rmq', '台中', '臺中', '清泉岗'],
    hubPairZh: '台中清泉岗机场 RMQ ➔ 高铁台中站 (乌日)', hubPairTw: '台中清泉崗機場 RMQ ➔ 高鐵台中站 (烏日)', hubPairEn: 'Taichung Airport (RMQ) ➔ THSR Taichung',
    modeIcon: 'bus', modeZh: 'A2 高铁快捷公车 / 156 路直达线', modeTw: 'A2 高鐵快捷公車 / 156 路直達線', modeEn: 'A2 THSR Shuttle / Bus 156',
    durationMin: '42', fare: 'NT$35', freqZh: '每 20–30 分钟', freqEn: 'Every 20–30m', hours: '06:20 – 22:30',
    notesZh: '走国道三号高速快速直达台中乌日高铁站。', notesTw: '經國道快速直達烏日高鐵台中站。', notesEn: 'Direct expressway shuttle between RMQ terminal and THSR Taichung.',
  },

  // Major Mainland Capitals & Coastal Hubs
  {
    id: 'gz-can-line3', regionTag: 'municipality_capital', airportCode: 'CAN', railHub: '广州南/白云站',
    cityZh: '广州', cityTw: '廣州', cityEn: 'Guangzhou', cityKeys: ['guangzhou', 'gz', 'can', '广州', '廣州', '白云'],
    hubPairZh: '白云机场 CAN T1/T2 ➔ 广州南站 / 广州白云站', hubPairTw: '白雲機場 CAN T1/T2 ➔ 廣州南站 / 廣州白雲站', hubPairEn: 'CAN Baiyun T1/T2 ➔ Guangzhou South / Baiyun Rail',
    modeIcon: 'rail', modeZh: '地铁 3 号线 + 2/7 号线（城际机场北直通）', modeTw: '地鐵 3 號線 + 2/7 號線', modeEn: 'Metro Line 3 / Intercity Express',
    durationMin: '38–62', fare: '¥8–12', freqZh: '每 5 分钟', freqEn: 'Every 5m', hours: '06:00 – 23:15',
    notesZh: '直通T1机场南与T2机场北站，可换乘2号线或广佛南环城际去广州南站。', notesTw: '直通T1與T2航廈，換乘地鐵直達廣州南站高鐵樞紐。', notesEn: 'Direct access beneath T1/T2 to Metro & PRD Intercity Network.',
  },
  {
    id: 'sz-szx-express', regionTag: 'municipality_capital', airportCode: 'SZX', railHub: '深圳北/福田',
    cityZh: '深圳', cityTw: '深圳', cityEn: 'Shenzhen', cityKeys: ['shenzhen', 'szx', '深圳', '宝安', '福田'],
    hubPairZh: '宝安机场 SZX T3 ➔ 福田 / 深圳北高铁站', hubPairTw: '寶安機場 SZX T3 ➔ 福田 / 深圳北高鐵站', hubPairEn: 'SZX Bao’an T3 ➔ Futian / Shenzhen North HSR',
    modeIcon: 'rail', modeZh: '地铁 11 号线机场快线（120km/h）', modeTw: '地鐵 11 號線機場快線', modeEn: 'Metro Line 11 Airport Express',
    durationMin: '28', fare: '¥7', freqZh: '每 6 分钟', freqEn: 'Every 6m', hours: '06:20 – 23:30',
    notesZh: '设专用大件行李架，福田站无缝换乘广深港高铁直达香港西九龙。', notesTw: '福田站無縫換乘廣深港高鐵直達香港西九龍。', notesEn: 'Direct link to Futian HSR station with cross-border trains to HK.',
  },
  {
    id: 'cd-tfu-line18', regionTag: 'municipality_capital', airportCode: 'TFU/CTU', railHub: '天府机场站/成都东',
    cityZh: '成都', cityTw: '成都', cityEn: 'Chengdu', cityKeys: ['chengdu', 'tfu', 'ctu', '成都', '天府', '双流'],
    hubPairZh: '天府国际机场 TFU ➔ 火车南站 / 成都东站', hubPairTw: '天府國際機場 TFU ➔ 火車南站 / 成都東站', hubPairEn: 'TFU Tianfu Airport ➔ Chengdu South / East HSR',
    modeIcon: 'rail', modeZh: '地铁 18 号线大站快车 + 成自宜高铁', modeTw: '地鐵 18 號線大站快車 + 高鐵站', modeEn: 'Metro Line 18 Express + Tianfu HSR',
    durationMin: '25–33', fare: '¥10', freqZh: '每 10 分钟', freqEn: 'Every 10m', hours: '06:00 – 23:30',
    notesZh: '航站楼地下层即设12306“天府机场”高铁站及18号线快车。', notesTw: '航廈地下直通高鐵天府機場站與18號線快車。', notesEn: 'Built-in 12306 HSR station + Line 18 express directly beneath TFU.',
  },
  {
    id: 'hz-hgh-line19', regionTag: 'municipality_capital', airportCode: 'HGH', railHub: '杭州东/杭州西',
    cityZh: '杭州', cityTw: '杭州', cityEn: 'Hangzhou', cityKeys: ['hangzhou', 'hz', 'hgh', '杭州', '萧山'],
    hubPairZh: '萧山国际机场 HGH ➔ 杭州东站 / 杭州西站', hubPairTw: '蕭山國際機場 HGH ➔ 杭州東站 / 杭州西站', hubPairEn: 'HGH Xiaoshan Airport ➔ Hangzhou East / West HSR',
    modeIcon: 'rail', modeZh: '地铁 19 号线机场快线', modeTw: '地鐵 19 號線機場快線', modeEn: 'Metro Line 19 Airport Express',
    durationMin: '22–48', fare: '¥7', freqZh: '每 6 分钟', freqEn: 'Every 6m', hours: '06:00 – 23:15',
    notesZh: '一线贯通萧山机场、杭州东站与杭州西站三大交通枢纽。', notesTw: '一線貫通蕭山機場、杭州東站與杭州西站。', notesEn: 'Single express metro connecting HGH with Hangzhou East & West HSR.',
  },
  {
    id: 'nj-nkg-s1', regionTag: 'municipality_capital', airportCode: 'NKG', railHub: '南京南',
    cityZh: '南京', cityTw: '南京', cityEn: 'Nanjing', cityKeys: ['nanjing', 'nj', 'nkg', '南京', '禄口'],
    hubPairZh: '禄口国际机场 NKG ➔ 南京南站', hubPairTw: '祿口國際機場 NKG ➔ 南京南站', hubPairEn: 'NKG Lukou Airport ➔ Nanjing South HSR',
    modeIcon: 'rail', modeZh: '地铁 S1 号线（机场线）', modeTw: '地鐵 S1 號線（機場線）', modeEn: 'Nanjing Metro Line S1',
    durationMin: '35', fare: '¥7', freqZh: '每 8 分钟', freqEn: 'Every 8m', hours: '06:00 – 22:42',
    notesZh: '直达南京南站北广场地下换乘厅，无缝接入京沪/沪汉蓉高铁网。', notesTw: '直達南京南站高鐵樞紐地下大廳。', notesEn: 'Direct airport metro into Nanjing South HSR concourse.',
  },
  {
    id: 'wh-wuh-line2', regionTag: 'municipality_capital', airportCode: 'WUH', railHub: '汉口/武汉',
    cityZh: '武汉', cityTw: '武漢', cityEn: 'Wuhan', cityKeys: ['wuhan', 'wh', 'wuh', '武汉', '武漢', '天河'],
    hubPairZh: '天河国际机场 WUH ➔ 汉口站 / 武汉站', hubPairTw: '天河國際機場 WUH ➔ 漢口站 / 武漢站', hubPairEn: 'WUH Tianhe Airport ➔ Hankou / Wuhan HSR',
    modeIcon: 'rail', modeZh: '汉孝城际铁路（天河机场站）+ 地铁 2 号线', modeTw: '漢孝城際鐵路 + 地鐵 2 號線', modeEn: 'Intercity Rail (WUH) + Metro Line 2',
    durationMin: '12–28', fare: '¥7', freqZh: '每 6 分钟', freqEn: 'Every 6m', hours: '06:00 – 23:00',
    notesZh: '航站楼GTC交通中心乘武孝城际12分钟直达汉口站。', notesTw: '天河機場站乘城際鐵路12分鐘直達漢口火車站。', notesEn: '12m intercity rail from airport GTC directly to Hankou Station.',
  },
  {
    id: 'cs-csx-maglev', regionTag: 'municipality_capital', airportCode: 'CSX', railHub: '长沙南',
    cityZh: '长沙', cityTw: '長沙', cityEn: 'Changsha', cityKeys: ['changsha', 'cs', 'csx', '长沙', '長沙', '黄花'],
    hubPairZh: '黄花国际机场 CSX ➔ 长沙南站（高铁站）', hubPairTw: '黃花國際機場 CSX ➔ 長沙南站（高鐵站）', hubPairEn: 'CSX Huanghua Airport ➔ Changsha South HSR',
    modeIcon: 'rail', modeZh: '长沙磁浮快线 / 地铁 6 号线', modeTw: '長沙磁浮快線 / 地鐵 6 號線', modeEn: 'Changsha Maglev Express',
    durationMin: '18', fare: '¥20', freqZh: '每 10 分钟', freqEn: 'Every 10m', hours: '07:00 – 22:30',
    notesZh: '中国首条中低速商业磁浮线，专职衔接黄花机场与长沙南高铁站。', notesTw: '磁浮快線專職銜接黃花機場與長沙南高鐵站。', notesEn: 'Dedicated maglev line linking CSX terminal directly to Changsha South HSR.',
  },
  {
    id: 'xa-xiy-line14', regionTag: 'municipality_capital', airportCode: 'XIY', railHub: '西安北',
    cityZh: '西安', cityTw: '西安', cityEn: 'Xi’an', cityKeys: ['xian', 'xiy', '西安', '咸阳', '西安北'],
    hubPairZh: '咸阳国际机场 XIY ➔ 西安北站（高铁）', hubPairTw: '咸陽國際機場 XIY ➔ 西安北站（高鐵）', hubPairEn: 'XIY Xianyang Airport ➔ Xi’an North HSR',
    modeIcon: 'rail', modeZh: '地铁 14 号线机场城际线', modeTw: '地鐵 14 號線機場城際線', modeEn: 'Xi’an Metro Line 14 Airport Express',
    durationMin: '27', fare: '¥16', freqZh: '每 8 分钟', freqEn: 'Every 8m', hours: '06:00 – 22:50',
    notesZh: '半小时内直通西北最大高铁枢纽西安北站。', notesTw: '27分鐘直達西北高鐵樞紐西安北站。', notesEn: '27-minute direct link from XIY to Xi’an North HSR Hub.',
  },
  {
    id: 'zz-cgo-chengji', regionTag: 'municipality_capital', airportCode: 'CGO', railHub: '郑州东/航空港',
    cityZh: '郑州', cityTw: '鄭州', cityEn: 'Zhengzhou', cityKeys: ['zhengzhou', 'zz', 'cgo', '郑州', '鄭州', '新郑'],
    hubPairZh: '新郑机场 CGO ➔ 郑州东站 / 郑州航空港站', hubPairTw: '新鄭機場 CGO ➔ 鄭州東站 / 鄭州航空港站', hubPairEn: 'CGO Xinzheng Airport ➔ Zhengzhou East HSR',
    modeIcon: 'rail', modeZh: '郑机城际铁路（高铁动车）+ 城郊线', modeTw: '鄭機城際鐵路 + 城郊線', modeEn: 'Zhengji Intercity Rail + Metro',
    durationMin: '19', fare: '¥12', freqZh: '每 15 分钟', freqEn: 'Every 15m', hours: '06:15 – 22:45',
    notesZh: 'GTC地下直乘12306郑机城际19分钟直抵米字形枢纽郑州东站。', notesTw: 'GTC地下直乘鄭機城際19分鐘抵達鄭州東站。', notesEn: '19m high-speed intercity shuttle straight into Zhengzhou East HSR.',
  },
  {
    id: 'km-kmg-line6', regionTag: 'municipality_capital', airportCode: 'KMG', railHub: '昆明南/昆明站',
    cityZh: '昆明', cityTw: '昆明', cityEn: 'Kunming', cityKeys: ['kunming', 'km', 'kmg', '昆明', '长水'],
    hubPairZh: '长水国际机场 KMG ➔ 昆明南站 / 昆明站', hubPairTw: '長水國際機場 KMG ➔ 昆明南站 / 昆明站', hubPairEn: 'KMG Changshui Airport ➔ Kunming South / Kunming',
    modeIcon: 'rail', modeZh: '地铁 6 号线 + 1/4 号线 + 空港快线', modeTw: '地鐵 6 號線 + 空港快線', modeEn: 'Metro Line 6 + Airport Shuttle',
    durationMin: '35–55', fare: '¥7–25', freqZh: '每 8 分钟', freqEn: 'Every 8m', hours: '06:20 – 23:00',
    notesZh: '塘子巷换乘地铁直通昆明站，或乘空港5号线直达昆明南（中老铁路出发站）。', notesTw: '可直達昆明南站換乘中老鐵路或滬昆高鐵。', notesEn: 'Easy transfer to Kunming South for China-Laos cross-border rail.',
  },
  {
    id: 'sjz-sjw-hsr', regionTag: 'municipality_capital', airportCode: 'SJW', railHub: '正定机场/石家庄',
    cityZh: '石家庄', cityTw: '石家莊', cityEn: 'Shijiazhuang', cityKeys: ['shijiazhuang', 'sjw', '石家庄', '石家莊', '正定'],
    hubPairZh: '正定机场 SJW ➔ 高铁正定机场站 / 石家庄站', hubPairTw: '正定機場 SJW ➔ 高鐵正定機場站 / 石家莊站', hubPairEn: 'SJW Zhengding Airport ➔ Zhengding Airport HSR / Shijiazhuang',
    modeIcon: 'rail', modeZh: '免费接驳巴士 + 京广高铁', modeTw: '免費接駁巴士 + 京廣高鐵', modeEn: 'Free Rail Shuttle + Beijing-Guangzhou HSR',
    durationMin: '14', fare: '¥14 (高铁)', freqZh: '配合航班', freqEn: 'Flight-synced', hours: '07:00 – 22:00',
    notesZh: 'T2候机楼乘免费摆渡5分钟到高铁站，14分钟直抵石家庄站或60分钟赴京。', notesTw: '擺渡車直連正定機場高鐵站，空鐵聯運極速便捷。', notesEn: 'Free 5-min shuttle links terminal to 12306 Zhengding Airport HSR.',
  },
  {
    id: 'ty-tyn-metro', regionTag: 'municipality_capital', airportCode: 'TYN', railHub: '太原南',
    cityZh: '太原', cityTw: '太原', cityEn: 'Taiyuan', cityKeys: ['taiyuan', 'tyn', '太原', '武宿'],
    hubPairZh: '武宿国际机场 TYN ➔ 太原南站', hubPairTw: '武宿國際機場 TYN ➔ 太原南站', hubPairEn: 'TYN Wusu Airport ➔ Taiyuan South HSR',
    modeIcon: 'rail', modeZh: '地铁 1 号线 / 机场巴士 1 线', modeTw: '地鐵 1 號線 / 機場巴士 1 線', modeEn: 'Metro Line 1 / Airport Express Bus',
    durationMin: '14', fare: '¥3–10', freqZh: '每 8 分钟', freqEn: 'Every 8m', hours: '06:00 – 23:00',
    notesZh: '武宿机场与太原南站直线距离不足6公里，地铁与打车均约15分钟。', notesTw: '武宿機場距離太原南站僅約6公里，換乘極快。', notesEn: 'Only ~6km apart; ~14 min to Taiyuan South HSR Hub.',
  },
  {
    id: 'hhht-het-line1', regionTag: 'municipality_capital', airportCode: 'HET', railHub: '呼和浩特东',
    cityZh: '呼和浩特', cityTw: '呼和浩特', cityEn: 'Hohhot', cityKeys: ['hohhot', 'het', '呼和浩特', '白塔'],
    hubPairZh: '白塔国际机场 HET ➔ 呼和浩特东站', hubPairTw: '白塔國際機場 HET ➔ 呼和浩特東站', hubPairEn: 'HET Baita Airport ➔ Hohhot East HSR',
    modeIcon: 'rail', modeZh: '地铁 1 号线（一车直达不换乘）', modeTw: '地鐵 1 號線（一車直達）', modeEn: 'Hohhot Metro Line 1 Direct',
    durationMin: '12', fare: '¥3', freqZh: '每 7 分钟', freqEn: 'Every 7m', hours: '06:00 – 22:30',
    notesZh: '坝堰(机场)站向西仅5站直达呼和浩特东站高铁大厅。', notesTw: '地鐵1號線僅5站直達呼和浩特東站。', notesEn: 'Just 5 stops west on Metro Line 1 straight into Hohhot East HSR.',
  },
  {
    id: 'sy-she-line2', regionTag: 'municipality_capital', airportCode: 'SHE', railHub: '沈阳南/沈阳北',
    cityZh: '沈阳', cityTw: '瀋陽', cityEn: 'Shenyang', cityKeys: ['shenyang', 'she', '沈阳', '瀋陽', '桃仙'],
    hubPairZh: '桃仙国际机场 SHE ➔ 沈阳南站 / 沈阳北站', hubPairTw: '桃仙國際機場 SHE ➔ 瀋陽南站 / 瀋陽北站', hubPairEn: 'SHE Taoxian Airport ➔ Shenyang South / North HSR',
    modeIcon: 'rail', modeZh: '地铁 2 号线南延线 / 有轨电车 2 号线', modeTw: '地鐵 2 號線南延線', modeEn: 'Shenyang Metro Line 2 / Tram 2',
    durationMin: '22–45', fare: '¥5', freqZh: '每 6–8 分钟', freqEn: 'Every 6–8m', hours: '05:30 – 22:30',
    notesZh: '2号线直穿沈阳全城连接沈阳北站与桃仙机场T3航站楼。', notesTw: '地鐵2號線直連桃仙機場與瀋陽北站。', notesEn: 'Metro Line 2 connects Taoxian T3 directly with Shenyang North.',
  },
  {
    id: 'cc-cgq-hsr', regionTag: 'municipality_capital', airportCode: 'CGQ', railHub: '龙嘉站/长春站',
    cityZh: '长春', cityTw: '長春', cityEn: 'Changchun', cityKeys: ['changchun', 'cgq', '长春', '長春', '龙嘉'],
    hubPairZh: '龙嘉国际机场 CGQ ➔ 龙嘉高铁站 / 长春站', hubPairTw: '龍嘉國際機場 CGQ ➔ 龍嘉高鐵站 / 長春站', hubPairEn: 'CGQ Longjia Airport ➔ Longjia HSR / Changchun Rail',
    modeIcon: 'rail', modeZh: '长珲城际高铁（地下换乘通道）', modeTw: '長琿城際高鐵（地下直達通道）', modeEn: 'Changchun–Hunchun Intercity HSR',
    durationMin: '14', fare: '¥8.5', freqZh: '每 20–30 分钟', freqEn: 'Every 20–30m', hours: '06:30 – 22:00',
    notesZh: '机场下负一层步行穿过地下连廊即可在12306龙嘉站乘高铁赴长春/吉林。', notesTw: '航廈負一層步行直通龍嘉高鐵站。', notesEn: 'Underground walkway leads straight from CGQ arrivals to Longjia 12306 HSR.',
  },
  {
    id: 'hrb-hrb-bus', regionTag: 'municipality_capital', airportCode: 'HRB', railHub: '哈尔滨西/哈尔滨站',
    cityZh: '哈尔滨', cityTw: '哈爾濱', cityEn: 'Harbin', cityKeys: ['harbin', 'hrb', '哈尔滨', '哈爾濱', '太平'],
    hubPairZh: '太平国际机场 HRB ➔ 哈尔滨西站 / 哈尔滨站', hubPairTw: '太平國際機場 HRB ➔ 哈爾濱西站 / 哈爾濱站', hubPairEn: 'HRB Taiping Airport ➔ Harbin West / Harbin Rail',
    modeIcon: 'bus', modeZh: '机场大巴 1/2 号快线', modeTw: '機場大巴 1/2 號快線', modeEn: 'Harbin Airport Express Bus 1/2',
    durationMin: '38', fare: '¥20', freqZh: '每 20 分钟', freqEn: 'Every 20m', hours: '05:30 – 末班航班',
    notesZh: '2号线直停哈尔滨西站西广场高铁客运枢纽。', notesTw: '2號快線直達哈爾濱西站高鐵樞紐。', notesEn: 'Express Line 2 goes directly to Harbin West HSR station.',
  },
  {
    id: 'hf-hfe-shuttle', regionTag: 'municipality_capital', airportCode: 'HFE', railHub: '合肥南',
    cityZh: '合肥', cityTw: '合肥', cityEn: 'Hefei', cityKeys: ['hefei', 'hfe', '合肥', '新桥'],
    hubPairZh: '新桥国际机场 HFE ➔ 合肥南站（高铁站）', hubPairTw: '新橋國際機場 HFE ➔ 合肥南站（高鐵站）', hubPairEn: 'HFE Xinqiao Airport ➔ Hefei South HSR',
    modeIcon: 'bus', modeZh: '新桥机场高铁南站快线大巴', modeTw: '新橋機場高鐵南站快線大巴', modeEn: 'HFE–Hefei South Express Shuttle',
    durationMin: '45', fare: '¥25', freqZh: '每 25 分钟', freqEn: 'Every 25m', hours: '06:00 – 23:00',
    notesZh: '直达合肥南站北广场枢纽，快速接驳合福/合杭/商合杭高铁。', notesTw: '直達合肥南站高鐵樞紐北廣場。', notesEn: 'Nonstop coach link to Hefei South HSR terminal.',
  },
  {
    id: 'fz-foc-hsr', regionTag: 'municipality_capital', airportCode: 'FOC', railHub: '福州/福州南',
    cityZh: '福州', cityTw: '福州', cityEn: 'Fuzhou', cityKeys: ['fuzhou', 'foc', '福州', '长乐'],
    hubPairZh: '长乐国际机场 FOC ➔ 福州南站 / 福州站', hubPairTw: '長樂國際機場 FOC ➔ 福州南站 / 福州站', hubPairEn: 'FOC Changle Airport ➔ Fuzhou South / Fuzhou',
    modeIcon: 'bus', modeZh: '滨海快线 + 元翔空港快线专线', modeTw: '濱海快線 + 空港快線專線', modeEn: 'Airport Express Coach / Binhai Line',
    durationMin: '45', fare: '¥30', freqZh: '每 15–20 分钟', freqEn: 'Every 15–20m', hours: '05:30 – 末班航班',
    notesZh: '直发福州南站与福州站高铁枢纽，适配福厦高铁换乘。', notesTw: '空港快線直達福州南站與福州站高鐵口。', notesEn: 'Direct express transfers linking FOC to Fuzhou South HSR.',
  },
  {
    id: 'nc-khn-bus', regionTag: 'municipality_capital', airportCode: 'KHN', railHub: '南昌西/南昌站',
    cityZh: '南昌', cityTw: '南昌', cityEn: 'Nanchang', cityKeys: ['nanchang', 'khn', '南昌', '昌北'],
    hubPairZh: '昌北国际机场 KHN ➔ 南昌西站 / 南昌站', hubPairTw: '昌北國際機場 KHN ➔ 南昌西站 / 南昌站', hubPairEn: 'KHN Changbei Airport ➔ Nanchang West / Nanchang',
    modeIcon: 'bus', modeZh: '机场公交 3 线（南昌西高铁专线）', modeTw: '機場公交 3 線（南昌西高鐵專線）', modeEn: 'Airport Line 3 (Nanchang West HSR)',
    durationMin: '42', fare: '¥15', freqZh: '每 20 分钟', freqEn: 'Every 20m', hours: '06:30 – 22:30',
    notesZh: '一车直达南昌西站，或1号线接地铁2号线前往昌景黄高铁南昌东站。', notesTw: '直達南昌西站高鐵樞紐與南昌站。', notesEn: 'Direct coach service linking KHN terminal with Nanchang West HSR.',
  },
  {
    id: 'jn-tna-line3', regionTag: 'municipality_capital', airportCode: 'TNA', railHub: '济南东/济南西',
    cityZh: '济南', cityTw: '濟南', cityEn: 'Jinan', cityKeys: ['jinan', 'tna', '济南', '濟南', '遥墙'],
    hubPairZh: '遥墙国际机场 TNA ➔ 济南东站 / 济南西站', hubPairTw: '遙牆國際機場 TNA ➔ 濟南東站 / 濟南西站', hubPairEn: 'TNA Yaoqiang Airport ➔ Jinan East / West HSR',
    modeIcon: 'rail', modeZh: '地铁 3 号线二期直达机场南站', modeTw: '地鐵 3 號線機場專線', modeEn: 'Jinan Metro Line 3 + Rail Shuttle',
    durationMin: '20–48', fare: '¥5–20', freqZh: '每 8 分钟', freqEn: 'Every 8m', hours: '06:00 – 22:30',
    notesZh: '地铁3号线机场南站10分钟至济南东站，无缝换乘济青/京沪高铁。', notesTw: '地鐵3號線快速銜接濟南東站與高鐵路網。', notesEn: 'Metro Line 3 links TNA directly to Jinan East HSR Hub.',
  },
  {
    id: 'nn-nng-rail', regionTag: 'municipality_capital', airportCode: 'NNG', railHub: '吴圩机场站/南宁东',
    cityZh: '南宁', cityTw: '南寧', cityEn: 'Nanning', cityKeys: ['nanning', 'nng', '南宁', '南寧', '吴圩'],
    hubPairZh: '吴圩国际机场 NNG ➔ 吴圩机场高铁站 / 南宁东', hubPairTw: '吳圩國際機場 NNG ➔ 吳圩機場高鐵站 / 南寧東', hubPairEn: 'NNG Wuxu Airport ➔ Wuxu Airport HSR / Nanning East',
    modeIcon: 'rail', modeZh: '南崇城际高铁（空铁联运地下直连）', modeTw: '南崇城際高鐵（空鐵聯運地下直連）', modeEn: 'Nanning-Chongzuo HSR (In-Terminal)',
    durationMin: '15–28', fare: '¥12–22', freqZh: '每 30 分钟', freqEn: 'Every 30m', hours: '07:00 – 22:30',
    notesZh: '航站楼地下GTC直接进12306吴圩机场站，15分钟直达南宁站。', notesTw: 'GTC地下直連高鐵吳圩機場站，15分鐘至南寧站。', notesEn: 'Built-in 12306 HSR terminal under NNG airport linking Nanning Station.',
  },
  {
    id: 'hk-hak-meilan', regionTag: 'municipality_capital', airportCode: 'HAK', railHub: '美兰高铁站/海口东',
    cityZh: '海口', cityTw: '海口', cityEn: 'Haikou', cityKeys: ['haikou', 'hak', '海口', '美兰', '海南'],
    hubPairZh: '美兰国际机场 HAK ➔ 美兰高铁站 / 海口东站', hubPairTw: '美蘭國際機場 HAK ➔ 美蘭高鐵站 / 海口東站', hubPairEn: 'HAK Meilan Airport ➔ Meilan HSR / Haikou East',
    modeIcon: 'rail', modeZh: '海南环岛高铁（航站楼地下站）', modeTw: '海南環島高鐵（航廈地下站）', modeEn: 'Hainan Ring HSR (Meilan Station)',
    durationMin: '9', fare: '¥4–10', freqZh: '每 12 分钟', freqEn: 'Every 12m', hours: '06:40 – 23:00',
    notesZh: '全国最便捷空铁换乘之一，美兰机场航站楼下楼直上环岛高铁去海口东/三亚。', notesTw: '美蘭機場下樓即達12306環島高鐵，直達海口東與三亞。', notesEn: 'Seamless vertical transfer from HAK terminal to Hainan Ring 12306 HSR.',
  },
  {
    id: 'gy-kwe-line2', regionTag: 'municipality_capital', airportCode: 'KWE', railHub: '龙洞堡站/贵阳北',
    cityZh: '贵阳', cityTw: '貴陽', cityEn: 'Guiyang', cityKeys: ['guiyang', 'kwe', '贵阳', '貴陽', '龙洞堡'],
    hubPairZh: '龙洞堡国际机场 KWE ➔ 龙洞堡高铁站 / 贵阳北站', hubPairTw: '龍洞堡國際機場 KWE ➔ 龍洞堡高鐵站 / 貴陽北站', hubPairEn: 'KWE Airport ➔ Longdongbao HSR / Guiyang North',
    modeIcon: 'rail', modeZh: '地铁 2 号线 + 贵广高铁（地下站）', modeTw: '地鐵 2 號線 + 貴廣高鐵地下站', modeEn: 'Metro Line 2 + Guiguang HSR',
    durationMin: '15–35', fare: '¥5–9', freqZh: '每 6 分钟', freqEn: 'Every 6m', hours: '06:20 – 23:00',
    notesZh: '航站楼负二层直通12306龙洞堡高铁站与地铁2号线。', notesTw: '航廈負二層直達12306高鐵站與地鐵2號線。', notesEn: 'T2/T3 basement connects directly to Longdongbao HSR and Metro.',
  },
  {
    id: 'ls-lxa-rail', regionTag: 'municipality_capital', airportCode: 'LXA', railHub: '拉萨站',
    cityZh: '拉萨', cityTw: '拉薩', cityEn: 'Lhasa', cityKeys: ['lhasa', 'lasa', 'lxa', 'lso', '拉萨', '拉薩', '贡嘎'],
    hubPairZh: '贡嘎国际机场 LXA ➔ 拉萨火车站（青藏/拉林铁路）', hubPairTw: '貢嘎國際機場 LXA ➔ 拉薩火車站（青藏/拉林鐵路）', hubPairEn: 'LXA Gonggar Airport ➔ Lhasa Rail Station',
    modeIcon: 'bus', modeZh: '拉萨空港快线 + 雅叶高速机场专线', modeTw: '拉薩空港快線 + 高速專線', modeEn: 'Lhasa Airport Expressway Shuttle',
    durationMin: '50', fare: '¥30', freqZh: '随航班发车', freqEn: 'Every 30m / Flight', hours: '06:30 – 21:30',
    notesZh: '经拉萨机场高速直达市区民航局与拉萨火车站，接驳复兴号高原动车。', notesTw: '經機場高速直達拉薩站接駁高原復興號動車。', notesEn: 'Direct expressway coach to Lhasa Station for Fuxing plateau rail.',
  },
  {
    id: 'lz-lhw-rail', regionTag: 'municipality_capital', airportCode: 'LHW', railHub: '中川机场站/兰州西',
    cityZh: '兰州', cityTw: '蘭州', cityEn: 'Lanzhou', cityKeys: ['lanzhou', 'lhw', 'lz', '兰州', '蘭州', '中川'],
    hubPairZh: '中川国际机场 LHW ➔ 兰州西站 / 兰州站', hubPairTw: '中川國際機場 LHW ➔ 蘭州西站 / 蘭州站', hubPairEn: 'LHW Zhongchuan Airport ➔ Lanzhou West / Lanzhou',
    modeIcon: 'rail', modeZh: '兰中城际动车（中川机场地下站）', modeTw: '蘭中城際動車（機場地下站）', modeEn: 'Lanzhou–Zhongchuan Intercity CRH',
    durationMin: '42', fare: '¥18.5', freqZh: '每 25 分钟', freqEn: 'Every 25m', hours: '06:40 – 23:20',
    notesZh: '机场T2地下交通中心直接乘12306 C字头城际赴兰州西、兰州站。', notesTw: '航廈地下乘C字頭城際直達蘭州西高鐵站。', notesEn: '12306 intercity trains beneath T2 run straight to Lanzhou West.',
  },
  {
    id: 'xn-xnn-bus', regionTag: 'municipality_capital', airportCode: 'XNN', railHub: '西宁站',
    cityZh: '西宁', cityTw: '西寧', cityEn: 'Xining', cityKeys: ['xining', 'xnn', 'xno', '西宁', '西寧', '曹家堡'],
    hubPairZh: '曹家堡国际机场 XNN ➔ 西宁火车站', hubPairTw: '曹家堡國際機場 XNN ➔ 西寧火車站', hubPairEn: 'XNN Caojiapu Airport ➔ Xining Rail Station',
    modeIcon: 'bus', modeZh: '机场巴士 1 号专线', modeTw: '機場巴士 1 號專線', modeEn: 'Xining Airport Express Line 1',
    durationMin: '35', fare: '¥21', freqZh: '每 20–30 分钟', freqEn: 'Every 20–30m', hours: '06:30 – 末班航班',
    notesZh: '高速直达西宁站综合交通枢纽，接驳兰新高铁及青藏铁路。', notesTw: '直達西寧火車站接駁蘭新高鐵與青藏鐵路。', notesEn: 'Direct express bus to Xining Hub for Lanxin HSR & Qinghai-Tibet Rail.',
  },
  {
    id: 'yc-inc-rail', regionTag: 'municipality_capital', airportCode: 'INC', railHub: '河东机场站/银川站',
    cityZh: '银川', cityTw: '銀川', cityEn: 'Yinchuan', cityKeys: ['yinchuan', 'inc', 'yc', '银川', '銀川', '河东'],
    hubPairZh: '河东国际机场 INC ➔ 河东机场高铁站 / 银川站', hubPairTw: '河東國際機場 INC ➔ 河東機場高鐵站 / 銀川站', hubPairEn: 'INC Hedong Airport ➔ Hedong Airport HSR / Yinchuan',
    modeIcon: 'rail', modeZh: '银西高铁（航站楼负一层高铁站）', modeTw: '銀西高鐵（航廈地下高鐵站）', modeEn: 'Yinchuan–Xi’an HSR (Airport Station)',
    durationMin: '14', fare: '¥10', freqZh: '每 30 分钟', freqEn: 'Every 30m', hours: '07:00 – 22:00',
    notesZh: '12306直接购票至“河东机场”站，与航站楼地下无缝相连直通银川/西安。', notesTw: '航廈地下直連12306河東機場高鐵站，14分鐘到銀川站。', notesEn: 'Direct 12306 HSR terminal beneath INC connects Yinchuan & Xi’an.',
  },
  {
    id: 'wlmq-urc-line1', regionTag: 'municipality_capital', airportCode: 'URC', railHub: '乌鲁木齐站',
    cityZh: '乌鲁木齐', cityTw: '烏魯木齊', cityEn: 'Urumqi', cityKeys: ['urumqi', 'wulumuqi', 'urc', '乌鲁木齐', '烏魯木齊', '天山', '地窝堡'],
    hubPairZh: '天山国际机场 URC ➔ 乌鲁木齐高铁站 / 乌鲁木齐南', hubPairTw: '天山國際機場 URC ➔ 烏魯木齊高鐵站 / 烏魯木齊南', hubPairEn: 'URC Tianshan Airport ➔ Urumqi High-Speed Rail',
    modeIcon: 'rail', modeZh: '地铁 1 号线 + 机场高铁快线', modeTw: '地鐵 1 號線 + 機場高鐵快線', modeEn: 'Metro Line 1 + HSR Shuttle',
    durationMin: '25–35', fare: '¥5–15', freqZh: '每 7 分钟', freqEn: 'Every 7m', hours: '07:40 – 23:30',
    notesZh: '1号线至铁路局站换乘或乘空港快线25分钟直达乌鲁木齐高铁站。', notesTw: '空港快線25分鐘直達烏魯木齊高鐵站。', notesEn: 'Metro + express coach connecting URC to Urumqi HSR station.',
  },

  // International Major Airport-to-Rail Transfers
  {
    id: 'tyo-hnd-monorail', regionTag: 'intl_hub', airportCode: 'HND/NRT', railHub: '东京站/品川新干线',
    cityZh: '东京', cityTw: '東京', cityEn: 'Tokyo', cityKeys: ['tokyo', 'hnd', 'nrt', '东京', '東京', '羽田', '成田'],
    hubPairZh: '东京羽田 HND / 成田 NRT ➔ 东京站 / 品川站', hubPairTw: '東京羽田 HND / 成田 NRT ➔ 東京站 / 品川站', hubPairEn: 'HND Haneda / NRT Narita ➔ Tokyo / Shinagawa Station',
    modeIcon: 'rail', modeZh: '东京单轨电车 / 成田特快 N’EX', modeTw: '東京單軌電車 / 成田特快 N’EX', modeEn: 'Tokyo Monorail / Narita Express',
    durationMin: '13–53', fare: '¥500–3,070 JPY', freqZh: '每 5–15 分钟', freqEn: 'Every 5–15m', hours: '05:17 – 23:55',
    notesZh: '羽田13分钟达滨松町/品川换乘新干线；成田N’EX直达东京站。', notesTw: '直連 JR 山手線與東海道新幹線。', notesEn: 'Direct interchange to JR Yamanote & Shinkansen.',
  },
  {
    id: 'par-cdg-rer', regionTag: 'intl_hub', airportCode: 'CDG', railHub: '巴黎北站/戴高乐TGV',
    cityZh: '巴黎', cityTw: '巴黎', cityEn: 'Paris', cityKeys: ['paris', 'cdg', '巴黎', '戴高乐'],
    hubPairZh: '巴黎戴高乐机场 CDG ➔ 巴黎北站 / 戴高乐TGV枢纽', hubPairTw: '巴黎戴高樂機場 CDG ➔ 巴黎北站 / 戴高樂TGV樞紐', hubPairEn: 'CDG Airport ➔ Gare du Nord / CDG TGV',
    modeIcon: 'rail', modeZh: 'RER B 快线 / TGV 机场直通', modeTw: 'RER B 快線 / TGV 機場直通', modeEn: 'RER B Express / Airport TGV',
    durationMin: '32', fare: '€11.80', freqZh: '每 10 分钟', freqEn: 'Every 10m', hours: '04:56 – 23:50',
    notesZh: '2号航站楼下层即设法国TGV高铁与RER B快线双枢纽。', notesTw: '直連巴黎北站與歐洲之星/TGV鐵路。', notesEn: 'T2 terminal features integrated TGV HSR & RER B direct to Gare du Nord.',
  },
  {
    id: 'sin-changi-mrt', regionTag: 'intl_hub', airportCode: 'SIN', railHub: '市中心/丹那美拉',
    cityZh: '新加坡', cityTw: '新加坡', cityEn: 'Singapore', cityKeys: ['singapore', 'sin', '新加坡', '樟宜'],
    hubPairZh: '新加坡樟宜机场 SIN ➔ 莱佛士坊 / 滨海湾', hubPairTw: '新加坡樟宜機場 SIN ➔ 萊佛士坊 / 濱海灣', hubPairEn: 'Singapore Changi (SIN) ➔ Raffles Place / City',
    modeIcon: 'rail', modeZh: '地铁东西线樟宜机场支线', modeTw: '地鐵東西線樟宜機場支線', modeEn: 'MRT East-West Airport Line',
    durationMin: '27', fare: 'S$2.20', freqZh: '每 7 分钟', freqEn: 'Every 7m', hours: '05:31 – 23:18',
    notesZh: 'T2/T3地下直乘MRT，可在丹那美拉同台换乘进市区。', notesTw: 'T2/T3地下直達MRT樟宜機場站。', notesEn: 'Seamless MRT station linking T2/T3 directly to downtown Singapore.',
  },
  {
    id: 'vte-lcr-shuttle', regionTag: 'intl_hub', airportCode: 'VTE', railHub: '万象站(中老铁路)',
    cityZh: '万象', cityTw: '萬象', cityEn: 'Vientiane', cityKeys: ['vientiane', 'vte', 'laos', '万象', '萬象', '中老铁路', '老挝'],
    hubPairZh: '万象瓦岱国际机场 VTE ➔ 中老铁路万象站', hubPairTw: '萬象瓦岱國際機場 VTE ➔ 中寮鐵路萬象站', hubPairEn: 'Vientiane Airport (VTE) ➔ LCR Vientiane Rail Station',
    modeIcon: 'bus', modeZh: '万象机场–火车站接驳专车 (中老铁路)', modeTw: '萬象機場–火車站接駁專車', modeEn: 'LCR Airport–Railway Express',
    durationMin: '35', fare: '₭40,000', freqZh: '配合国际班次', freqEn: 'Train-synced', hours: '06:30 – 20:30',
    notesZh: '对接12306每日D887/D888次昆明南⇄万象国际旅客列车。', notesTw: '對接每日昆明南⇄萬象12306國際旅客列車。', notesEn: 'Synced with daily D887/D888 Kunming South ⇄ Vientiane international trains.',
  },
];

export function getTransitTransfers(lang: Language): TransitTransferOption[] {
  const isTw = lang === 'zh-TW';
  const isZh = lang === 'zh-CN' || isTw;

  return ALL_HUB_TRANSIT_CATALOG.map((item) => ({
    id: item.id,
    regionTag: item.regionTag,
    airportCode: item.airportCode,
    railHub: item.railHub,
    city: isTw ? item.cityTw : isZh ? item.cityZh : item.cityEn,
    cityKeys: item.cityKeys,
    hubPair: isTw ? item.hubPairTw : isZh ? item.hubPairZh : item.hubPairEn,
    modeIcon: item.modeIcon,
    modeLabel: isTw ? item.modeTw : isZh ? item.modeZh : item.modeEn,
    duration: isTw ? `${item.durationMin}分鐘` : isZh ? `${item.durationMin}分钟` : `${item.durationMin}m`,
    fare: item.fare,
    frequency: isZh ? item.freqZh : item.freqEn,
    operatingHours: item.hours,
    notes: isTw ? item.notesTw : isZh ? item.notesZh : item.notesEn,
  }));
}
