import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  WeatherLocation,
  DetailedWeatherData,
  DayWeatherSummary,
  HourlyWeather,
} from '../types/weather';
import { Language } from '../types/calendar';
import {
  fetchWeatherData,
  detectCurrentLocation,
  searchCities,
  getWeatherBackgroundClasses,
  analyzeFutureWeatherTrend,
  getLocalizedWeatherText,
  POPULAR_CITIES,
} from '../utils/weatherService';
import { getExtraLabels, getLocaleCode, isRtlLanguage } from '../utils/i18n';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';
import { useSearchHistory } from '../utils/searchHistory';
import { SearchHistoryBar } from './SearchHistoryBar';
import {
  X,
  MapPin,
  Search,
  Navigation,
  RefreshCw,
  Wind,
  Droplets,
  Sunrise,
  Sunset,
  Eye,
  Gauge,
  Sun,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  Sparkles,
  Thermometer,
} from 'lucide-react';

interface WeatherModalCopy {
  syncing: string;
  localLabel: string;
  highShort: string;
  lowShort: string;
  hourlyTitle: string;
  nowLabel: string;
  rhShort: string;
  tenDayTitle: string;
  tapDetails: string;
  todayLabel: string;
  tomorrowLabel: string;
  precipLabel: string;
  maxWindLabel: string;
  viewDayBtn: string;
  addEventBtn: string;
  aqiTitle: string;
  uvTitle: string;
  sunPathTitle: string;
  dewLabel: string;
  pressureTitle: string;
  visibilityTitle: string;
  footerTitle: string;
  updatedPrefix: string;
  windDirs: [string, string, string, string, string, string, string, string];
  windLight: string;
  windMod: string;
  windBreezy: string;
  uvLevels: { low: [string, string]; mod: [string, string]; high: [string, string]; vhigh: [string, string] };
  aqiLevels: { good: [string, string]; mod: [string, string]; sens: [string, string]; bad: [string, string] };
  humDry: string;
  humComf: string;
  humHumid: string;
  pressHigh: string;
  pressLow: string;
  pressNorm: string;
  visClear: string;
  visGood: string;
  visLow: string;
  feelSame: string;
  feelCool: string;
  feelWarm: string;
  rainAt: (time: string, pct: number) => string;
  calmHum: (hum: number) => string;
  insightFmt: (cond: string, range: string, note: string, trend: string) => string;
}

function getWeatherModalCopy(lang: Language): WeatherModalCopy {
  if (lang === 'zh-CN') {
    return {
      syncing: '正在同步超本地气象遥测...',
      localLabel: '当地',
      highShort: '最高',
      lowShort: '最低',
      hourlyTitle: '24 小时逐时预报',
      nowLabel: '现在',
      rhShort: '湿度',
      tenDayTitle: '10 日天气预报',
      tapDetails: '点击展开每日详情',
      todayLabel: '今天',
      tomorrowLabel: '明天',
      precipLabel: '降水',
      maxWindLabel: '最大风',
      viewDayBtn: '查看日程',
      addEventBtn: '安排日程',
      aqiTitle: '空气质量指数 (US AQI)',
      uvTitle: '紫外线指数',
      sunPathTitle: '日出与日落',
      dewLabel: '露点',
      pressureTitle: '气压',
      visibilityTitle: '能见度与体感',
      footerTitle: '实时气象与空气质量遥测',
      updatedPrefix: '更新于 ',
      windDirs: ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'],
      windLight: '1-2级 轻风',
      windMod: '3-4级 和风',
      windBreezy: '5级+ 清劲风',
      uvLevels: {
        low: ['弱', '无需特殊防晒'],
        mod: ['中等', '外出建议佩戴墨镜'],
        high: ['强', '建议涂抹防晒霜'],
        vhigh: ['极强', '正午尽量减少暴晒'],
      },
      aqiLevels: {
        good: ['优', '空气洁净，极适宜户外运动'],
        mod: ['良', '空气质量可接受，适宜日常出行'],
        sens: ['轻度敏感', '敏感人群减少长时间高强度户外活动'],
        bad: ['较差', '建议外出佩戴防护口罩'],
      },
      humDry: '空气较干燥，注意补水',
      humComf: '湿度适中，体感清爽舒适',
      humHumid: '湿度较高，略感潮润',
      pressHigh: '高压控场，天气较为稳定',
      pressLow: '低压系统影响，多变天气',
      pressNorm: '标准大气压范围，气流平稳',
      visClear: '视野通透清晰',
      visGood: '视野良好',
      visLow: '能见度偏低',
      feelSame: '体感温度与实测气温基本一致',
      feelCool: '受风寒效应影响，体感略凉',
      feelWarm: '湿度与日照使体感偏暖',
      rainAt: (time, pct) => `约 ${time} 起降水概率升至 ${pct}%，出行建议随身带伞`,
      calmHum: (hum) => `体感温润舒适，当前湿度 ${hum}%`,
      insightFmt: (cond, range, note, trend) => `今日${cond}${range ? `，全天 ${range}` : ''}；${note}。${trend}。`,
    };
  }
  if (lang === 'zh-TW') {
    return {
      syncing: '正在同步超本地氣象遙測...',
      localLabel: '當地',
      highShort: '最高',
      lowShort: '最低',
      hourlyTitle: '24 小時逐時預報',
      nowLabel: '現在',
      rhShort: '濕度',
      tenDayTitle: '10 日天氣預報',
      tapDetails: '點擊展開每日詳情',
      todayLabel: '今天',
      tomorrowLabel: '明天',
      precipLabel: '降水',
      maxWindLabel: '最大風',
      viewDayBtn: '檢視日程',
      addEventBtn: '安排日程',
      aqiTitle: '空氣品質指標 (US AQI)',
      uvTitle: '紫外線指數',
      sunPathTitle: '日出與日落',
      dewLabel: '露點',
      pressureTitle: '氣壓',
      visibilityTitle: '能見度與體感',
      footerTitle: '即時氣象與空氣品質遙測',
      updatedPrefix: '更新於 ',
      windDirs: ['北風', '東北風', '東風', '東南風', '南風', '西南風', '西風', '西北風'],
      windLight: '1-2級 輕風',
      windMod: '3-4級 和風',
      windBreezy: '5級+ 強風',
      uvLevels: {
        low: ['弱', '無需特殊防曬'],
        mod: ['中等', '外出建議佩戴太陽眼鏡'],
        high: ['強', '建議塗抹防曬乳'],
        vhigh: ['極強', '正午盡量減少曝曬'],
      },
      aqiLevels: {
        good: ['優', '空氣潔淨，極適合戶外運動'],
        mod: ['良', '空氣品質可接受，適合日常外出'],
        sens: ['輕度敏感', '敏感族群減少長時間高強度戶外活動'],
        bad: ['較差', '建議外出佩戴防護口罩'],
      },
      humDry: '空氣較乾燥，注意補水',
      humComf: '濕度適中，體感清爽舒適',
      humHumid: '濕度較高，略感潮濕',
      pressHigh: '高壓籠罩，天氣較為穩定',
      pressLow: '低壓系統影響，天氣多變',
      pressNorm: '標準大氣壓範圍，氣流平穩',
      visClear: '視野通透清晰',
      visGood: '視野良好',
      visLow: '能見度偏低',
      feelSame: '體感溫度與實測氣溫基本一致',
      feelCool: '受風寒效應影響，體感略涼',
      feelWarm: '濕度與日照使體感偏暖',
      rainAt: (time, pct) => `約 ${time} 起降雨機率升至 ${pct}%，外出建議攜帶雨具`,
      calmHum: (hum) => `體感溫潤舒適，目前濕度 ${hum}%`,
      insightFmt: (cond, range, note, trend) => `今日${cond}${range ? `，全天 ${range}` : ''}；${note}。${trend}。`,
    };
  }
  if (lang === 'ja') {
    return {
      syncing: '天気データを同期中...',
      localLabel: '現地',
      highShort: '最高',
      lowShort: '最低',
      hourlyTitle: '24時間予報',
      nowLabel: '現在',
      rhShort: '湿度',
      tenDayTitle: '10日間予報',
      tapDetails: 'タップして詳細を表示',
      todayLabel: '今日',
      tomorrowLabel: '明日',
      precipLabel: '降水',
      maxWindLabel: '最大風速',
      viewDayBtn: '予定を見る',
      addEventBtn: '予定を追加',
      aqiTitle: '大気質指数 (US AQI)',
      uvTitle: 'UV指数',
      sunPathTitle: '日の出・日の入り',
      dewLabel: '露点',
      pressureTitle: '気圧',
      visibilityTitle: '視程と体感',
      footerTitle: 'リアルタイム気象・大気質データ',
      updatedPrefix: '更新: ',
      windDirs: ['北', '北東', '東', '南東', '南', '南西', '西', '北西'],
      windLight: '穏やかな風',
      windMod: 'やや強い風',
      windBreezy: '強風',
      uvLevels: {
        low: ['弱い', '特別なUV対策は不要です'],
        mod: ['中程度', '日中はサングラス推奨'],
        high: ['強い', 'SPF30+の日焼け止めを推奨'],
        vhigh: ['非常に強い', '正午の直射日光を避けてください'],
      },
      aqiLevels: {
        good: ['良好', '空気がきれいで屋外活動に最適'],
        mod: ['普通', '通常の外出に適しています'],
        sens: ['やや不健康', '敏感な方は長時間の運動を控えてください'],
        bad: ['不健康', '外出時はマスクの着用を推奨'],
      },
      humDry: '乾燥気味ですので水分補給を',
      humComf: '快適な湿度です',
      humHumid: 'やや蒸し暑い湿度です',
      pressHigh: '高気圧に覆われ安定した空模様',
      pressLow: '低気圧の影響で変化しやすい天気',
      pressNorm: '標準的な気圧で穏やかな気流',
      visClear: '見通しは非常に良好',
      visGood: '良好な視程',
      visLow: '視程がやや低下',
      feelSame: '体感温度は実測とほぼ同じです',
      feelCool: '風により体感はやや涼しめです',
      feelWarm: '湿度と日差しで暖かく感じます',
      rainAt: (time, pct) => `${time}頃に降水確率が${pct}%まで上昇します`,
      calmHum: (hum) => `湿度${hum}%で過ごしやすい陽気です`,
      insightFmt: (cond, range, note, trend) => `本日は${cond}${range ? `（${range}）` : ''}。${note}。${trend}。`,
    };
  }
  if (lang === 'ko') {
    return {
      syncing: '실시간 기상 데이터 동기화 중...',
      localLabel: '현지',
      highShort: '최고',
      lowShort: '최저',
      hourlyTitle: '24시간 예보',
      nowLabel: '지금',
      rhShort: '습도',
      tenDayTitle: '10일 예보',
      tapDetails: '날짜를 눌러 상세 보기',
      todayLabel: '오늘',
      tomorrowLabel: '내일',
      precipLabel: '강수',
      maxWindLabel: '최대 풍속',
      viewDayBtn: '일정 보기',
      addEventBtn: '일정 추가',
      aqiTitle: '대기질 지수 (US AQI)',
      uvTitle: '자외선 지수',
      sunPathTitle: '일출 및 일몰',
      dewLabel: '이슬점',
      pressureTitle: '기압',
      visibilityTitle: '가시거리 및 체감',
      footerTitle: '실시간 기상 및 대기질 관측',
      updatedPrefix: '업데이트 ',
      windDirs: ['북풍', '북동풍', '동풍', '남동풍', '남풍', '남서풍', '서풍', '북서풍'],
      windLight: '약한 바람',
      windMod: '보통 바람',
      windBreezy: '강한 바람',
      uvLevels: {
        low: ['낮음', '별도 자외선 차단 불필요'],
        mod: ['보통', '한낮 선글라스 착용 권장'],
        high: ['높음', '자외선 차단제 사용 권장'],
        vhigh: ['매우 높음', '한낮 직사광선 피하기'],
      },
      aqiLevels: {
        good: ['좋음', '공기가 맑아 야외 활동에 최적'],
        mod: ['보통', '일상 외출에 무난한 대기질'],
        sens: ['민감군 주의', '민감군은 장시간 야외 활동 자제'],
        bad: ['나쁨', '외출 시 마스크 착용 권장'],
      },
      humDry: '건조한 편이니 수분 섭취에 유의하세요',
      humComf: '쾌적한 습도입니다',
      humHumid: '다소 습한 날씨입니다',
      pressHigh: '고기압 영향으로 맑고 안정적',
      pressLow: '저기압 영향으로 변화가 잦은 날씨',
      pressNorm: '표준 기압 범위로 안정적',
      visClear: '시야가 매우 맑음',
      visGood: '양호한 가시거리',
      visLow: '가시거리 다소 낮음',
      feelSame: '체감 온도가 실제 기온과 비슷합니다',
      feelCool: '바람 영향으로 다소 서늘하게 느껴집니다',
      feelWarm: '습도와 햇볕으로 더 따뜻하게 느껴집니다',
      rainAt: (time, pct) => `${time}경 강수 확률이 ${pct}%까지 올라갑니다`,
      calmHum: (hum) => `습도 ${hum}%로 쾌적한 상태입니다`,
      insightFmt: (cond, range, note, trend) => `오늘 ${cond}${range ? ` (${range})` : ''}. ${note}. ${trend}.`,
    };
  }
  if (lang === 'fr') {
    return {
      syncing: 'Synchronisation météo...',
      localLabel: 'Local',
      highShort: 'Max',
      lowShort: 'Min',
      hourlyTitle: 'Prévisions horaires',
      nowLabel: 'Maint.',
      rhShort: 'Hum.',
      tenDayTitle: 'Prévisions sur 10 jours',
      tapDetails: 'Appuyer pour les détails',
      todayLabel: "Aujourd'hui",
      tomorrowLabel: 'Demain',
      precipLabel: 'Précip.',
      maxWindLabel: 'Vent max',
      viewDayBtn: 'Voir le jour',
      addEventBtn: 'Ajouter',
      aqiTitle: "Qualité de l'air (US AQI)",
      uvTitle: 'Indice UV',
      sunPathTitle: 'Soleil',
      dewLabel: 'Rosée',
      pressureTitle: 'Pression',
      visibilityTitle: 'Visibilité & Ressenti',
      footerTitle: "Météo et qualité de l'air en direct",
      updatedPrefix: 'Mis à jour ',
      windDirs: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'],
      windLight: 'Brise légère',
      windMod: 'Vent modéré',
      windBreezy: 'Vent soutenu',
      uvLevels: {
        low: ['Faible', 'Protection minimale requise'],
        mod: ['Modéré', 'Lunettes de soleil conseillées'],
        high: ['Élevé', 'Crème solaire SPF 30+ conseillée'],
        vhigh: ['Très élevé', 'Évitez le soleil de midi'],
      },
      aqiLevels: {
        good: ['Bon', 'Air pur, idéal en extérieur'],
        mod: ['Modéré', "Qualité d'air acceptable"],
        sens: ['Sensible', 'Limitez les efforts prolongés'],
        bad: ['Mauvais', 'Masque conseillé à l’extérieur'],
      },
      humDry: 'Air plutôt sec aujourd’hui',
      humComf: 'Humidité confortable',
      humHumid: 'Conditions humides',
      pressHigh: 'Haute pression, ciel stable',
      pressLow: 'Basse pression, temps changeant',
      pressNorm: 'Pression atmosphérique normale',
      visClear: 'Visibilité parfaite',
      visGood: 'Bonne visibilité',
      visLow: 'Visibilité réduite',
      feelSame: 'Ressenti proche de la température réelle',
      feelCool: 'Le vent rafraîchit le ressenti',
      feelWarm: 'Ressenti plus chaud avec l’humidité',
      rainAt: (time, pct) => `Risque de pluie de ${pct}% vers ${time}`,
      calmHum: (hum) => `Conditions agréables (${hum}% d'humidité)`,
      insightFmt: (cond, range, note, trend) => `${cond} aujourd'hui${range ? ` (${range})` : ''}. ${note}. ${trend}.`,
    };
  }
  if (lang === 'ru') {
    return {
      syncing: 'Синхронизация погоды...',
      localLabel: 'Местн.',
      highShort: 'Макс',
      lowShort: 'Мин',
      hourlyTitle: 'Почасовой прогноз',
      nowLabel: 'Сейчас',
      rhShort: 'Влаж.',
      tenDayTitle: 'Прогноз на 10 дней',
      tapDetails: 'Нажмите для подробностей',
      todayLabel: 'Сегодня',
      tomorrowLabel: 'Завтра',
      precipLabel: 'Осадки',
      maxWindLabel: 'Макс. ветер',
      viewDayBtn: 'К дню',
      addEventBtn: 'Добавить',
      aqiTitle: 'Качество воздуха (US AQI)',
      uvTitle: 'УФ-индекс',
      sunPathTitle: 'Солнце',
      dewLabel: 'Точка росы',
      pressureTitle: 'Давление',
      visibilityTitle: 'Видимость и ощущение',
      footerTitle: 'Погода и качество воздуха онлайн',
      updatedPrefix: 'Обновлено ',
      windDirs: ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'],
      windLight: 'Лёгкий ветер',
      windMod: 'Умеренный ветер',
      windBreezy: 'Свежий ветер',
      uvLevels: {
        low: ['Низкий', 'Особая защита не нужна'],
        mod: ['Умеренный', 'Рекомендуются очки днём'],
        high: ['Высокий', 'Используйте SPF 30+'],
        vhigh: ['Очень высокий', 'Избегайте солнца в полдень'],
      },
      aqiLevels: {
        good: ['Хорошо', 'Чистый воздух, идеально для прогулок'],
        mod: ['Умеренно', 'Приемлемое качество воздуха'],
        sens: ['Чувств.', 'Ограничьте долгие нагрузки'],
        bad: ['Плохо', 'Рекомендуется маска на улице'],
      },
      humDry: 'Воздух сухой, пейте воду',
      humComf: 'Комфортная влажность',
      humHumid: 'Повышенная влажность',
      pressHigh: 'Высокое давление, стабильно',
      pressLow: 'Низкое давление, переменчиво',
      pressNorm: 'Нормальное атмосферное давление',
      visClear: 'Отличная видимость',
      visGood: 'Хорошая видимость',
      visLow: 'Сниженная видимость',
      feelSame: 'Ощущается как фактическая температура',
      feelCool: 'Из-за ветра ощущается прохладнее',
      feelWarm: 'Влажность делает воздух теплее',
      rainAt: (time, pct) => `Вероятность осадков ${pct}% около ${time}`,
      calmHum: (hum) => `Комфортные условия, влажность ${hum}%`,
      insightFmt: (cond, range, note, trend) => `Сегодня ${cond}${range ? ` (${range})` : ''}. ${note}. ${trend}.`,
    };
  }
  if (lang === 'fa') {
    return {
      syncing: 'در حال همگام‌سازی هواشناسی...',
      localLabel: 'محلی',
      highShort: 'بیشینه',
      lowShort: 'کمینه',
      hourlyTitle: 'پیش‌بینی ساعتی',
      nowLabel: 'اکنون',
      rhShort: 'رطوبت',
      tenDayTitle: 'پیش‌بینی ۱۰ روزه',
      tapDetails: 'برای جزئیات ضربه بزنید',
      todayLabel: 'امروز',
      tomorrowLabel: 'فردا',
      precipLabel: 'بارش',
      maxWindLabel: 'بیشینه باد',
      viewDayBtn: 'مشاهده روز',
      addEventBtn: 'افزودن رویداد',
      aqiTitle: 'شاخص کیفیت هوا (US AQI)',
      uvTitle: 'شاخص UV',
      sunPathTitle: 'مسیر خورشید',
      dewLabel: 'نقطه شبنم',
      pressureTitle: 'فشار هوا',
      visibilityTitle: 'دید و دمای حس‌شده',
      footerTitle: 'وضعیت زنده هوا و کیفیت هوا',
      updatedPrefix: 'به‌روزرسانی ',
      windDirs: ['شمال', 'شمال‌شرق', 'شرق', 'جنوب‌شرق', 'جنوب', 'جنوب‌غرب', 'غرب', 'شمال‌غرب'],
      windLight: 'نسیم ملایم',
      windMod: 'باد متوسط',
      windBreezy: 'باد تند',
      uvLevels: {
        low: ['کم', 'نیازی به محافظت ویژه نیست'],
        mod: ['متوسط', 'عینک آفتابی توصیه می‌شود'],
        high: ['زیاد', 'کرم ضدآفتاب SPF 30+ بزنید'],
        vhigh: ['بسیار زیاد', 'از آفتاب ظهر دوری کنید'],
      },
      aqiLevels: {
        good: ['پاک', 'هوای تمیز و عالی برای ورزش'],
        mod: ['سالم', 'کیفیت هوای قابل قبول'],
        sens: ['ناسالم حساس', 'گروه‌های حساس فعالیت را محدود کنند'],
        bad: ['ناسالم', 'استفاده از ماسک توصیه می‌شود'],
      },
      humDry: 'هوا خشک است، آب بنوشید',
      humComf: 'رطوبت مطبوع',
      humHumid: 'هوای مرطوب',
      pressHigh: 'فشار بالا، آسمان پایدار',
      pressLow: 'سامانه کم‌فشار، هوای متغیر',
      pressNorm: 'فشار جو در محدوده طبیعی',
      visClear: 'دید کاملاً شفاف',
      visGood: 'دید خوب',
      visLow: 'کاهش دید',
      feelSame: 'دمای حس‌شده نزدیک به دمای واقعی',
      feelCool: 'وزش باد هوا را خنک‌تر نشان می‌دهد',
      feelWarm: 'رطوبت هوا را گرم‌تر نشان می‌دهد',
      rainAt: (time, pct) => `احتمال بارش ${pct}% حوالی ساعت ${time}`,
      calmHum: (hum) => `شرایط متعادل با رطوبت ${hum}%`,
      insightFmt: (cond, range, note, trend) => `امروز ${cond}${range ? ` (${range})` : ''}. ${note}. ${trend}.`,
    };
  }
  if (lang === 'mn') {
    return {
      syncing: 'Цаг агаарын мэдээ татаж байна...',
      localLabel: 'Орон нутаг',
      highShort: 'Их',
      lowShort: 'Бага',
      hourlyTitle: '24 цагийн төлөв',
      nowLabel: 'Одоо',
      rhShort: 'Чийг',
      tenDayTitle: '10 хоногийн төлөв',
      tapDetails: 'Дэлгэрэнгүй харах',
      todayLabel: 'Өнөөдөр',
      tomorrowLabel: 'Маргааш',
      precipLabel: 'Хур тунадас',
      maxWindLabel: 'Дээд салхи',
      viewDayBtn: 'Өдөр харах',
      addEventBtn: 'Үйл явдал',
      aqiTitle: 'Агаарын чанар (US AQI)',
      uvTitle: 'Хэт ягаан туяа',
      sunPathTitle: 'Нар мандах ба жаргах',
      dewLabel: 'Шүүдэр',
      pressureTitle: 'Даралт',
      visibilityTitle: 'Үзэгдэх орчин',
      footerTitle: 'Шууд цаг агаар ба агаарын чанар',
      updatedPrefix: 'Шинэчилсэн ',
      windDirs: ['Хойд', 'Зүүн хойд', 'Зүүн', 'Зүүн өмнөд', 'Өмнөд', 'Баруун өмнөд', 'Баруун', 'Баруун хойд'],
      windLight: 'Зөөлөн сэвшээ',
      windMod: 'Дунд зэрэг салхи',
      windBreezy: 'Ширүүн салхи',
      uvLevels: {
        low: ['Бага', 'Тусгай хамгаалалт шаардлагагүй'],
        mod: ['Дунд', 'Өдөр нарны шил зүүнэ үү'],
        high: ['Их', 'SPF 30+ тос түрхэнэ үү'],
        vhigh: ['Маш их', 'Үд дундын нарнаас зайлсхий'],
      },
      aqiLevels: {
        good: ['Сайн', 'Цэвэр агаар, гадаа гарахад таатай'],
        mod: ['Дунд', 'Агаарын чанар хэвийн'],
        sens: ['Мэдрэмтгий', 'Урт хугацааны ачааллыг багасга'],
        bad: ['Муу', 'Гадаа амны хаалт зүүхийг зөвлөе'],
      },
      humDry: 'Агаар хуурай, ус сайн уугаарай',
      humComf: 'Тааламжтай чийгшил',
      humHumid: 'Чийглэг цаг агаар',
      pressHigh: 'Өндөр даралт, тогтуун тэнгэр',
      pressLow: 'Бага даралт, хувьсамтгай',
      pressNorm: 'Хэвийн агаарын даралт',
      visClear: 'Үзэгдэх орчин маш цэлмэг',
      visGood: 'Сайн үзэгдэх орчин',
      visLow: 'Үзэгдэх орчин багассан',
      feelSame: 'Мэдрэгдэх дулаан бодиттой ойролцоо',
      feelCool: 'Салхины улмаас илүү сэрүүхэн',
      feelWarm: 'Чийгшлийн улмаас илүү дулаан',
      rainAt: (time, pct) => `${time} орчим хур тунадасны магадлал ${pct}%`,
      calmHum: (hum) => `Тааламжтай, чийгшил ${hum}%`,
      insightFmt: (cond, range, note, trend) => `Өнөөдөр ${cond}${range ? ` (${range})` : ''}. ${note}. ${trend}.`,
    };
  }
  if (lang === 'ug') {
    return {
      syncing: 'ھاۋا رايى سانلىق مەلۇماتى ماسقەدەملىنىۋاتىدۇ...',
      localLabel: 'يەرلىك',
      highShort: 'يۇقىرى',
      lowShort: 'تۆۋەن',
      hourlyTitle: '24 سائەتلىك مەلۇمات',
      nowLabel: 'ھازىر',
      rhShort: 'نەملىك',
      tenDayTitle: '10 كۈنلۈك مەلۇمات',
      tapDetails: 'تەپسىلاتىنى كۆرۈش ئۈچۈن بېسىڭ',
      todayLabel: 'بۈگۈن',
      tomorrowLabel: 'ئەتە',
      precipLabel: 'ھۆل-يېغىن',
      maxWindLabel: 'ئەڭ چوڭ شامال',
      viewDayBtn: 'كۈنتەرتىپ',
      addEventBtn: 'قوشۇش',
      aqiTitle: 'ھاۋا سۈپىتى كۆرسەتكۈچى (US AQI)',
      uvTitle: 'ئۇلترا بىنەپشە نۇر',
      sunPathTitle: 'كۈن چىقىش ۋە پېتىش',
      dewLabel: 'شەبنەم نۇقتىسى',
      pressureTitle: 'ئاتموسفېرا بېسىمى',
      visibilityTitle: 'كۆرۈش دەرىجىسى ۋە سېزىم',
      footerTitle: 'نەق مەيدان ھاۋا رايى ۋە ھاۋا سۈپىتى',
      updatedPrefix: 'يېڭىلاندى ',
      windDirs: ['شىمال', 'شەرقىي شىمال', 'شەرق', 'شەرقىي جەنۇب', 'جەنۇب', 'غەربىي جەنۇب', 'غەرب', 'غەربىي شىمال'],
      windLight: 'يېنىك شامال',
      windMod: 'ئوتتۇراھال شامال',
      windBreezy: 'كۈچلۈك شامال',
      uvLevels: {
        low: ['تۆۋەن', 'ئالاھىدە قوغدىنىش ھاجەتسىز'],
        mod: ['ئوتتۇرا', 'كۈن نۇرى كۆزئەينىكى تەۋسىيە'],
        high: ['كۈچلۈك', 'ئاپتاپتىن ساقلىنىش مەلھىمى سۈركەڭ'],
        vhigh: ['ناھايىتى كۈچلۈك', 'چۈشتە كۈندىن ساقلىنىڭ'],
      },
      aqiLevels: {
        good: ['ياخشى', 'ھاۋا ساپ، سىرتقا چىقىشقا ماس كېلىدۇ'],
        mod: ['ئوتتۇراھال', 'ھاۋا سۈپىتى قوبۇل قىلغىدەك'],
        sens: ['سەزگۈر', 'ئۇزاق ۋاقىتلىق ھەرىكەتنى ئازايتىڭ'],
        bad: ['ناچار', 'سىرتتا ماسكا تاقاش تەۋسىيە'],
      },
      humDry: 'ھاۋا قۇرغاق، كۆپرەك سۇ ئىچىڭ',
      humComf: 'نەملىك مۇۋاپىق',
      humHumid: 'نەملىك بىرئاز يۇقىرى',
      pressHigh: 'يۇقىرى بېسىم، ھاۋا تۇراقلىق',
      pressLow: 'تۆۋەن بېسىم، ھاۋا ئۆزگىرىشچان',
      pressNorm: 'نورمال ئاتموسفېرا بېسىمى',
      visClear: 'كۆرۈش دەرىجىسى ناھايىتى سۈزۈك',
      visGood: 'كۆرۈش دەرىجىسى ياخشى',
      visLow: 'كۆرۈش دەرىجىسى سەل تۆۋەن',
      feelSame: 'سېزىم تېمپېراتۇرىسى ئەمەلىيگە يېقىن',
      feelCool: 'شامال سەۋەبىدىن سەل سالقىن تۇيۇلىدۇ',
      feelWarm: 'نەملىك سەۋەبىدىن ئىللىقراق تۇيۇلىدۇ',
      rainAt: (time, pct) => `${time} ئەتراپىدا يامغۇر ئېھتىماللىقى ${pct}% بولىدۇ`,
      calmHum: (hum) => `مۇۋاپىق شارائىت، نەملىك ${hum}%`,
      insightFmt: (cond, range, note, trend) => `بۈگۈن ${cond}${range ? ` (${range})` : ''}. ${note}. ${trend}.`,
    };
  }
  return {
    syncing: 'Syncing hyperlocal weather...',
    localLabel: 'Local',
    highShort: 'H',
    lowShort: 'L',
    hourlyTitle: 'Hourly Forecast',
    nowLabel: 'Now',
    rhShort: 'RH',
    tenDayTitle: '10-Day Forecast',
    tapDetails: 'Tap day for details',
    todayLabel: 'Today',
    tomorrowLabel: 'Tomorrow',
    precipLabel: 'Precip',
    maxWindLabel: 'Max Wind',
    viewDayBtn: 'View Day',
    addEventBtn: 'Add Event',
    aqiTitle: 'Air Quality (US AQI)',
    uvTitle: 'UV Index',
    sunPathTitle: 'Sun Path',
    dewLabel: 'Dew',
    pressureTitle: 'Pressure',
    visibilityTitle: 'Visibility & Feel',
    footerTitle: 'Live Weather & Air Quality',
    updatedPrefix: 'Updated ',
    windDirs: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
    windLight: 'Light breeze',
    windMod: 'Moderate',
    windBreezy: 'Breezy',
    uvLevels: {
      low: ['Low', 'Minimal sun protection needed'],
      mod: ['Moderate', 'Sunglasses advised midday'],
      high: ['High', 'Use SPF 30+ sunscreen'],
      vhigh: ['Very High', 'Avoid peak midday sun'],
    },
    aqiLevels: {
      good: ['Good', 'Clean air, great for outdoor exercise'],
      mod: ['Moderate', 'Acceptable air quality'],
      sens: ['Sensitive', 'Sensitive groups limit prolonged exertion'],
      bad: ['Unhealthy', 'Mask advised outdoors'],
    },
    humDry: 'Dry air today',
    humComf: 'Comfortable humidity',
    humHumid: 'Humid conditions',
    pressHigh: 'High pressure, stable sky',
    pressLow: 'Low pressure system',
    pressNorm: 'Normal atmospheric pressure',
    visClear: 'Crystal clear',
    visGood: 'Good visibility',
    visLow: 'Reduced visibility',
    feelSame: 'Feels like actual temperature',
    feelCool: 'Wind chill makes it feel cooler',
    feelWarm: 'Humidity makes it feel warmer',
    rainAt: (time, pct) => `Rain chance rises to ${pct}% around ${time}`,
    calmHum: (hum) => `Comfortable conditions with ${hum}% humidity`,
    insightFmt: (cond, range, note, trend) => `${cond} today${range ? ` (${range})` : ''}. ${note}. ${trend}.`,
  };
}

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDateStr: string;
  location: WeatherLocation;
  onUpdateLocation: (location: WeatherLocation) => void;
  language: Language;
  offlineMode?: boolean;
  onNavigateToDay?: (date: Date) => void;
  onCreateEventOnDate?: (dateStr: string) => void;
}

const PixelWeatherIllustration: React.FC<{ code: number; isDay?: boolean; size?: 'hero' | 'sm' }> = ({
  code,
  isDay = true,
  size = 'hero',
}) => {
  const dimClass = size === 'hero' ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-6 h-6';

  // Clear Sky
  if (code === 0) {
    if (!isDay) {
      return (
        <svg viewBox="0 0 80 80" className={dimClass} aria-hidden="true">
          <defs>
            <radialGradient id="pxMoonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="pxMoonBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
          </defs>
          <circle cx="42" cy="40" r="34" fill="url(#pxMoonGlow)" />
          <path
            d="M47 16C34.8 18 26 28.5 26 41c0 13.8 11.2 25 25 25 6.8 0 13-2.7 17.5-7.1-2.5.7-5.2 1.1-8 1.1-13.8 0-25-11.2-25-25 0-7.5 3.3-14.2 8.5-18.8.9-.1 2-.2 3-.2z"
            fill="url(#pxMoonBody)"
          />
          <circle cx="62" cy="22" r="2.2" fill="#FEF08A" />
          <circle cx="20" cy="24" r="1.6" fill="#FEF08A" opacity="0.8" />
          <circle cx="66" cy="40" r="1.4" fill="#FEF08A" opacity="0.7" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 80 80" className={dimClass} aria-hidden="true">
        <defs>
          <radialGradient id="pxSunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pxSunDisc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="55%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r="36" fill="url(#pxSunGlow)" />
        <circle cx="40" cy="40" r="21" fill="url(#pxSunDisc)" />
      </svg>
    );
  }

  // Partly Cloudy
  if (code === 1 || code === 2) {
    return (
      <svg viewBox="0 0 80 80" className={dimClass} aria-hidden="true">
        <defs>
          <linearGradient id="pxPartSun" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={isDay ? '#FEF08A' : '#E0E7FF'} />
            <stop offset="100%" stopColor={isDay ? '#F97316' : '#818CF8'} />
          </linearGradient>
          <linearGradient id="pxCloud1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#DCE8F8" />
          </linearGradient>
        </defs>
        {isDay ? (
          <circle cx="52" cy="27" r="15" fill="url(#pxPartSun)" />
        ) : (
          <path
            d="M55 13c-6.8 1.2-12 7.1-12 14.3 0 8 6.5 14.5 14.5 14.5 4 0 7.6-1.6 10.2-4.2-1.5.4-3 .7-4.7.7-8 0-14.5-6.5-14.5-14.5 0-4.4 2-8.3 5-11 .5.1 1 .1 1.5.2z"
            fill="url(#pxPartSun)"
          />
        )}
        <path
          d="M24 58h34a11 11 0 0 0 2-21.8A16 16 0 0 0 29 33a13 13 0 0 0-5 25z"
          fill="url(#pxCloud1)"
        />
      </svg>
    );
  }

  // Thunder
  if (code >= 95) {
    return (
      <svg viewBox="0 0 80 80" className={dimClass} aria-hidden="true">
        <defs>
          <linearGradient id="pxStormCloud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
        </defs>
        <path d="M22 49h36a11 11 0 0 0 2-21.8A16 16 0 0 0 29 24a13 13 0 0 0-7 25z" fill="url(#pxStormCloud)" />
        <polygon points="41,47 33,61 40,61 36,73 50,56 42,56" fill="#FACC15" />
      </svg>
    );
  }

  // Snow
  if (code >= 71 && code <= 77) {
    return (
      <svg viewBox="0 0 80 80" className={dimClass} aria-hidden="true">
        <path d="M22 49h36a11 11 0 0 0 2-21.8A16 16 0 0 0 29 24a13 13 0 0 0-7 25z" fill="#E2E8F0" />
        <circle cx="29" cy="60" r="2.6" fill="#FFFFFF" />
        <circle cx="40" cy="64" r="2.8" fill="#E0F2FE" />
        <circle cx="51" cy="59" r="2.6" fill="#FFFFFF" />
        <circle cx="34" cy="70" r="2" fill="#BAE6FD" />
        <circle cx="47" cy="71" r="2" fill="#FFFFFF" />
      </svg>
    );
  }

  // Rain
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return (
      <svg viewBox="0 0 80 80" className={dimClass} aria-hidden="true">
        <defs>
          <linearGradient id="pxRainCloud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
        </defs>
        <path d="M22 49h36a11 11 0 0 0 2-21.8A16 16 0 0 0 29 24a13 13 0 0 0-7 25z" fill="url(#pxRainCloud)" />
        <line x1="30" y1="54" x2="26" y2="66" stroke="#60A5FA" strokeWidth="3.2" strokeLinecap="round" />
        <line x1="41" y1="55" x2="37" y2="69" stroke="#93C5FD" strokeWidth="3.2" strokeLinecap="round" />
        <line x1="52" y1="54" x2="48" y2="66" stroke="#60A5FA" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    );
  }

  // Fog
  if (code >= 45 && code <= 48) {
    return (
      <svg viewBox="0 0 80 80" className={dimClass} aria-hidden="true">
        <path d="M22 43h36a10 10 0 0 0 2-19.8A15 15 0 0 0 29 20a12 12 0 0 0-7 23z" fill="#CBD5E1" />
        <line x1="20" y1="52" x2="60" y2="52" stroke="#E2E8F0" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="25" y1="60" x2="55" y2="60" stroke="#CBD5E1" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Overcast Cloud
  return (
    <svg viewBox="0 0 80 80" className={dimClass} aria-hidden="true">
      <defs>
        <linearGradient id="pxCloudOnly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>
      <path d="M20 56h39a12 12 0 0 0 2-23.8A17 17 0 0 0 28 28a14 14 0 0 0-8 28z" fill="url(#pxCloudOnly)" />
    </svg>
  );
};

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  targetDateStr,
  location,
  onUpdateLocation,
  language,
  offlineMode = false,
  onNavigateToDay,
  onCreateEventOnDate,
}) => {
  const [weatherData, setWeatherData] = useState<DetailedWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const weatherSearchHistory = useSearchHistory('weather');
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [searchResults, setSearchResults] = useState<WeatherLocation[]>(POPULAR_CITIES.slice(0, 8));
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(0);
  const [expandedDayDate, setExpandedDayDate] = useState<string | null>(null);
  const [isAppDark, setIsAppDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );
  const [isAppAmoled, setIsAppAmoled] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('amoled-mode') : false
  );
  const didAutoLocateOnOpenRef = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const syncThemeFlags = () => {
      setIsAppDark(document.documentElement.classList.contains('dark'));
      setIsAppAmoled(document.documentElement.classList.contains('amoled-mode'));
    };
    syncThemeFlags();
    const observer = new MutationObserver(syncThemeFlags);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [isOpen]);

  const ui = getExtraLabels(language);
  const localeCode = getLocaleCode(language);
  const isRtl = isRtlLanguage(language);
  const wCopy = useMemo(() => getWeatherModalCopy(language), [language]);

  const loadWeather = useCallback((loc: WeatherLocation, forceRefresh = false) => {
    setIsLoading(true);
    fetchWeatherData(loc, language, forceRefresh)
      .then((data) => {
        if (data) {
          setWeatherData(data);
          setSelectedHourIdx(0);
        }
      })
      .finally(() => setIsLoading(false));
  }, [language]);

  const handleAutoLocate = useCallback(async () => {
    setIsLocating(true);
    try {
      const detected = await detectCurrentLocation();
      onUpdateLocation(detected);
      window.dispatchEvent(new CustomEvent('location-updated', { detail: detected }));
      loadWeather(detected, true);
    } catch {
      // ignore geolocation failures cleanly
    } finally {
      setIsLocating(false);
    }
  }, [onUpdateLocation, loadWeather]);

  useEffect(() => {
    if (!isOpen) {
      didAutoLocateOnOpenRef.current = false;
      return;
    }
    loadWeather(location);
    if (!offlineMode && !didAutoLocateOnOpenRef.current) {
      didAutoLocateOnOpenRef.current = true;
      void handleAutoLocate();
    }
  }, [isOpen, location, loadWeather, offlineMode, handleAutoLocate]);

  useEffect(() => {
    if (!isSearchingCity) return;
    const timer = setTimeout(async () => {
      const res = await searchCities(searchQuery, language);
      setSearchResults(res);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchQuery, isSearchingCity, language]);

  useSystemBackLayer(
    isOpen && isSearchingCity,
    () => setIsSearchingCity(false),
    BACK_PRIORITY.NESTED_MODAL,
    'weather-city-search'
  );

  const fmtTemp = (c: number) => {
    if (tempUnit === 'F') return Math.round((c * 9) / 5 + 32);
    return Math.round(c);
  };

  // Location current local time label
  const locationClockStr = useMemo(() => {
    const tz = weatherData?.timezone;
    try {
      return new Date().toLocaleTimeString(localeCode === 'fa-IR' || localeCode === 'ug-CN' ? 'en-GB' : localeCode, {
        ...(tz ? { timeZone: tz } : {}),
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  }, [weatherData?.timezone, localeCode, weatherData?.updatedAt]);

  const locationTodayStr = useMemo(() => {
    const tz = weatherData?.timezone;
    try {
      return new Date().toLocaleDateString('en-CA', {
        ...(tz ? { timeZone: tz } : {}),
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return targetDateStr;
    }
  }, [weatherData?.timezone, targetDateStr, weatherData?.updatedAt]);

  // Extract 10-day forecast strictly from today onward (dropping past_days=7 calendar history)
  const tenDayForecast: DayWeatherSummary[] = useMemo(() => {
    if (!weatherData?.daily?.length) return [];
    const idx = weatherData.daily.findIndex((d) => d.date >= locationTodayStr);
    const startIdx = idx >= 0 ? idx : Math.max(0, weatherData.daily.length - 10);
    return weatherData.daily.slice(startIdx, startIdx + 10);
  }, [weatherData?.daily, locationTodayStr]);

  const { globalMin, globalMax } = useMemo(() => {
    if (!tenDayForecast.length) return { globalMin: 0, globalMax: 30 };
    const mins = tenDayForecast.map((d) => d.minTemp);
    const maxs = tenDayForecast.map((d) => d.maxTemp);
    return {
      globalMin: Math.min(...mins),
      globalMax: Math.max(...maxs),
    };
  }, [tenDayForecast]);

  const hourlyList: HourlyWeather[] = useMemo(() => {
    if (weatherData?.hourly?.length) return weatherData.hourly;
    if (!weatherData) return [];
    // Graceful hourly interpolation if reading older cache without hourly array
    const base = weatherData.current.temp;
    const todaySum = tenDayForecast[0];
    const lo = todaySum?.minTemp ?? base - 4;
    const hi = todaySum?.maxTemp ?? base + 4;
    const nowH = new Date().getHours();
    return Array.from({ length: 12 }, (_, idx) => {
      const h = (nowH + idx * 2) % 24;
      const wave = Math.sin(((h - 8) / 24) * Math.PI * 2);
      const t = Math.round((hi + lo) / 2 + ((hi - lo) / 2) * wave);
      return {
        time: `${String(h).padStart(2, '0')}:00`,
        temp: t,
        weatherCode: weatherData.current.weatherCode,
        weatherIcon: weatherData.current.weatherIcon,
        precipitationProbability: todaySum?.precipitationProbability ?? 0,
        isDay: h >= 6 && h < 18,
      };
    });
  }, [weatherData, tenDayForecast]);

  // Natural-language Pixel Weather Insight summary
  const pixelInsightText = useMemo(() => {
    if (!weatherData) return '';
    const today = tenDayForecast[0];
    const cur = weatherData.current;
    const trend = analyzeFutureWeatherTrend(locationTodayStr, language);
    const nextRainHour = hourlyList.find((h) => h.precipitationProbability >= 45 || (h.precipitationMm ?? 0) > 0.1);
    const note = nextRainHour
      ? wCopy.rainAt(nextRainHour.time, nextRainHour.precipitationProbability)
      : wCopy.calmHum(cur.humidity);
    const rangeStr = today ? `${fmtTemp(today.minTemp)}°–${fmtTemp(today.maxTemp)}°` : '';
    const localizedCond = getLocalizedWeatherText(cur.weatherCode, language);
    return wCopy.insightFmt(localizedCond, rangeStr, note, trend.text);
  }, [weatherData, tenDayForecast, hourlyList, locationTodayStr, language, tempUnit, wCopy]);

  if (!isOpen) return null;

  const currentConditionCode = weatherData?.current.weatherCode ?? 1;
  const isDayNow = weatherData?.current.isDay ?? true;
  const bgStyles = getWeatherBackgroundClasses(currentConditionCode, isDayNow, isAppDark);
  const modalGradientClass = isAppAmoled
    ? 'from-black via-neutral-950 to-[#0B1220]'
    : bgStyles.bgGradient;
  const cardGlassClass = isAppDark
    ? 'bg-white/[0.06] border-white/12 shadow-sm'
    : 'bg-white/16 border-white/25 shadow-sm';
  const todayForecast = tenDayForecast[0];

  // Hourly SVG Spline geometry
  const hourStepW = 64;
  const splineW = hourStepW * Math.max(1, hourlyList.length);
  const splineH = 56;
  const hTemps = hourlyList.map((h) => h.temp);
  const hMin = hTemps.length ? Math.min(...hTemps) : 0;
  const hMax = hTemps.length ? Math.max(...hTemps) : 25;
  const hSpan = Math.max(4, hMax - hMin);
  const mapHourX = (i: number) => i * hourStepW + hourStepW / 2;
  const mapHourY = (t: number) => 12 + ((hMax - t) / hSpan) * (splineH - 22);

  const buildSmoothSpline = () => {
    if (hourlyList.length < 2) return '';
    let d = `M ${mapHourX(0)} ${mapHourY(hourlyList[0].temp)}`;
    for (let i = 0; i < hourlyList.length - 1; i++) {
      const x0 = mapHourX(i);
      const y0 = mapHourY(hourlyList[i].temp);
      const x1 = mapHourX(i + 1);
      const y1 = mapHourY(hourlyList[i + 1].temp);
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  };

  const splinePath = buildSmoothSpline();
  const splineArea =
    hourlyList.length >= 2
      ? `${splinePath} L ${mapHourX(hourlyList.length - 1)} ${splineH} L ${mapHourX(0)} ${splineH} Z`
      : '';

  const activeHour = hourlyList[selectedHourIdx] || hourlyList[0];

  // Helpers for Bento telemetry tiles
  const getWindCompassName = (deg: number) => {
    const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
    return wCopy.windDirs[idx];
  };

  const getWindScaleLabel = (kmh: number) => {
    if (kmh < 12) return wCopy.windLight;
    if (kmh < 28) return wCopy.windMod;
    return wCopy.windBreezy;
  };

  const getUvMeta = (uv: number) => {
    if (uv <= 2) return { label: wCopy.uvLevels.low[0], tip: wCopy.uvLevels.low[1], color: '#4ADE80' };
    if (uv <= 5) return { label: wCopy.uvLevels.mod[0], tip: wCopy.uvLevels.mod[1], color: '#FACC15' };
    if (uv <= 7) return { label: wCopy.uvLevels.high[0], tip: wCopy.uvLevels.high[1], color: '#FB923C' };
    return { label: wCopy.uvLevels.vhigh[0], tip: wCopy.uvLevels.vhigh[1], color: '#F87171' };
  };

  const getAqiMeta = (aqi: number) => {
    if (aqi <= 50) return { label: wCopy.aqiLevels.good[0], tip: wCopy.aqiLevels.good[1], dotColor: '#4ADE80' };
    if (aqi <= 100) return { label: wCopy.aqiLevels.mod[0], tip: wCopy.aqiLevels.mod[1], dotColor: '#FACC15' };
    if (aqi <= 150) return { label: wCopy.aqiLevels.sens[0], tip: wCopy.aqiLevels.sens[1], dotColor: '#FB923C' };
    return { label: wCopy.aqiLevels.bad[0], tip: wCopy.aqiLevels.bad[1], dotColor: '#F87171' };
  };

  const parseClockToMins = (hhmm: string) => {
    const [h, m] = (hhmm || '06:00').split(':').map(Number);
    return (Number.isFinite(h) ? h : 6) * 60 + (Number.isFinite(m) ? m : 0);
  };

  const formatDayLabel = (dateStr: string, idx: number) => {
    if (idx === 0) return wCopy.todayLabel;
    if (idx === 1) return wCopy.tomorrowLabel;
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return dt.toLocaleDateString(localeCode, { weekday: 'short' });
  };

  const uvVal = weatherData?.current.uvIndex ?? 3;
  const uvMeta = getUvMeta(uvVal);
  const uvRatio = Math.min(1, Math.max(0, uvVal / 11));
  const uvAngleRad = Math.PI * (1 - uvRatio);
  const uvDotX = 60 + 44 * Math.cos(uvAngleRad);
  const uvDotY = 58 - 44 * Math.sin(uvAngleRad);

  const aqiVal = weatherData?.current.aqi ?? 36;
  const aqiMeta = getAqiMeta(aqiVal);
  const aqiMarkerX = Math.min(154, Math.max(6, (aqiVal / 200) * 160));

  const sunriseMins = parseClockToMins(weatherData?.current.sunrise || '06:00');
  const sunsetMins = parseClockToMins(weatherData?.current.sunset || '18:30');
  const nowMins = parseClockToMins(locationClockStr);
  const daylightSpan = Math.max(60, sunsetMins - sunriseMins);
  const solarProgress = Math.min(1, Math.max(0, (nowMins - sunriseMins) / daylightSpan));
  const solarArcX = 12 + solarProgress * 116;
  const solarArcY = 54 - 40 * Math.sin(solarProgress * Math.PI);
  const daylightH = Math.floor(daylightSpan / 60);
  const daylightM = daylightSpan % 60;

  const pressureVal = weatherData?.current.pressure ?? 1013;
  const pressureRatio = Math.min(1, Math.max(0, (pressureVal - 970) / 80));
  const pressureRad = Math.PI * (1 - pressureRatio);
  const pressureDotX = 60 + 42 * Math.cos(pressureRad);
  const pressureDotY = 56 - 42 * Math.sin(pressureRad);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/65 dark:bg-black/80 backdrop-blur-md select-none animate-modal-backdrop font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-label={`${location.name} ${ui.weatherBtnTooltip}`}
        className={`relative w-full h-[100dvh] sm:h-auto sm:max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:max-w-5xl flex flex-col sm:rounded-[32px] bg-gradient-to-b ${modalGradientClass} text-white shadow-2xl border-0 sm:border sm:border-white/20 overflow-hidden animate-modal-sheet pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:pt-0 sm:pb-0`}
      >
        {/* Subtle Pixel Ambient Sky Backdrop Decoration */}
        <svg
          viewBox="0 0 800 320"
          className="pointer-events-none absolute top-0 inset-x-0 w-full h-64 opacity-30"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="pxSkyHalo" cx="78%" cy="22%" r="48%">
              <stop offset="0%" stopColor={isDayNow ? '#FEF08A' : '#818CF8'} stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="800" height="320" fill="url(#pxSkyHalo)" />
          {!isDayNow && (
            <g fill="#FFFFFF" opacity="0.65">
              <circle cx="95" cy="48" r="1.5" />
              <circle cx="190" cy="78" r="1" />
              <circle cx="310" cy="36" r="1.8" />
              <circle cx="480" cy="64" r="1.2" />
              <circle cx="670" cy="42" r="1.6" />
              <circle cx="745" cy="96" r="1.1" />
            </g>
          )}
        </svg>

        {/* Top Navigation Row (Pixel Weather Clean Header) */}
        <div className="relative z-30 px-4 sm:px-6 py-3 flex items-center justify-between gap-2 bg-black/10 backdrop-blur-xl border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsSearchingCity((v) => !v)}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-xs sm:text-sm font-bold cursor-pointer min-w-0"
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-[140px] sm:max-w-[240px]">{location.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSearchingCity ? 'rotate-180' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleAutoLocate}
              disabled={isLocating}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-60"
              title={ui.weatherLocateTooltip}
              aria-label={ui.weatherLocateTooltip}
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* °C / °F Segmented Toggle */}
            <div className="flex items-center p-0.5 rounded-full bg-black/25 border border-white/15 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTempUnit('C')}
                className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                  tempUnit === 'C' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/75 hover:text-white'
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => setTempUnit('F')}
                className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                  tempUnit === 'F' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/75 hover:text-white'
                }`}
              >
                °F
              </button>
            </div>

            <button
              type="button"
              onClick={() => loadWeather(location)}
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-60"
              title={ui.toolRefreshLive}
              aria-label={ui.toolRefreshLive}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center transition-all cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible City Search & Saved Cities Panel */}
        {isSearchingCity && (
          <div className="relative z-30 px-4 sm:px-6 py-3.5 bg-neutral-950/75 backdrop-blur-2xl border-b border-white/15 space-y-3 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const clean = searchQuery.trim();
                if (clean.length >= 2) weatherSearchHistory.recordQuery(clean);
              }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/12 border border-white/15 focus-within:border-white/50"
            >
              <Search className="w-4 h-4 text-white/70 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  const clean = searchQuery.trim();
                  if (clean.length >= 2) weatherSearchHistory.recordQuery(clean);
                }}
                placeholder={ui.weatherSearchPlaceholder}
                autoFocus
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-white/55 focus:outline-none min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            <SearchHistoryBar
              history={weatherSearchHistory.history}
              language={language}
              onSelectQuery={(q) => {
                setSearchQuery(q);
                weatherSearchHistory.recordQuery(q);
              }}
              onRemoveQuery={weatherSearchHistory.removeQuery}
              onClearHistory={weatherSearchHistory.clearHistory}
              variant="glass-dark"
              compact
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto">
              {searchResults.map((city) => {
                const isSelected = city.name === location.name && Math.abs(city.latitude - location.latitude) < 0.1;
                return (
                  <button
                    key={`${city.name}-${city.latitude}-${city.longitude}`}
                    type="button"
                    onClick={() => {
                      const clean = searchQuery.trim();
                      weatherSearchHistory.recordQuery(clean.length >= 2 ? clean : city.name);
                      onUpdateLocation(city);
                      window.dispatchEvent(new CustomEvent('location-updated', { detail: city }));
                      setIsSearchingCity(false);
                      setSearchQuery('');
                    }}
                    className={`px-3 py-2 rounded-2xl text-start text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-white text-slate-900 border-white font-bold shadow-sm'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                    }`}
                  >
                    <div className="font-bold truncate">{city.name}</div>
                    <div className={`text-[10px] truncate ${isSelected ? 'text-slate-600' : 'text-white/65'}`}>
                      {city.admin1 || city.country}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Scrollable Pixel Weather Workspace */}
        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {isLoading && !weatherData ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-white/80">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <span className="text-sm font-medium">{wCopy.syncing}</span>
            </div>
          ) : weatherData ? (
            <>
              {/* 1. Weather Hero Section + Concise Forecast Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 px-1">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-white/80">
                      <span className="font-semibold text-white/95">
                        {location.admin1 ? `${location.admin1} · ` : ''}{location.name}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {wCopy.localLabel} {locationClockStr}
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5 sm:gap-4">
                      <span className="text-[4.5rem] sm:text-[5.5rem] font-bold tracking-tighter font-mono tabular-nums leading-none drop-shadow-md">
                        {fmtTemp(weatherData.current.temp)}°
                      </span>
                      <div className="space-y-1">
                        <div className="text-lg sm:text-xl font-bold leading-tight">
                          {getLocalizedWeatherText(weatherData.current.weatherCode, language)}
                        </div>
                        <div className="text-xs sm:text-[13px] font-medium text-white/85 font-mono tabular-nums flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {todayForecast && (
                            <span>
                              {wCopy.highShort} {fmtTemp(todayForecast.maxTemp)}° / {wCopy.lowShort} {fmtTemp(todayForecast.minTemp)}°
                            </span>
                          )}
                          <span className="opacity-50" aria-hidden="true">·</span>
                          <span>
                            {ui.weatherFeelsLike} {fmtTemp(weatherData.current.feelsLike)}°
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 drop-shadow-lg">
                    <PixelWeatherIllustration code={weatherData.current.weatherCode} isDay={isDayNow} size="hero" />
                  </div>
                </div>

                {/* Clean Concise Weather Summary Strip (No 'Pixel 今日气象洞察' label) */}
                {pixelInsightText && (
                  <div className="rounded-2xl bg-white/14 backdrop-blur-xl border border-white/18 px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm">
                    <div className="w-6 h-6 rounded-lg bg-white/18 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    </div>
                    <p className="text-xs sm:text-[13px] text-white/95 leading-relaxed font-medium">
                      {pixelInsightText}
                    </p>
                  </div>
                )}
              </div>

              {/* 2. 24-Hour Forecast Card with Interactive Smooth Temperature Spline */}
              <div className={`rounded-[26px] ${cardGlassClass} backdrop-blur-2xl border p-4 sm:p-5 space-y-3`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white/95 tracking-tight">
                    {wCopy.hourlyTitle}
                  </span>
                  {activeHour && (
                    <div className="text-[11px] sm:text-xs font-mono tabular-nums text-white/85 flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-full">
                      <span>{selectedHourIdx === 0 ? wCopy.nowLabel : activeHour.time}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-white">{fmtTemp(activeHour.temp)}°{tempUnit}</span>
                      {typeof activeHour.humidity === 'number' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{wCopy.rhShort} {activeHour.humidity}%</span>
                        </>
                      )}
                      {activeHour.precipitationProbability > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-sky-200 inline-flex items-center gap-0.5">
                            <Droplets className="w-3 h-3" />
                            {activeHour.precipitationProbability}%
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto pb-1 scrollbar-none">
                  <div className="relative inline-block min-w-max">
                    {/* Smooth Temperature Curve */}
                    {hourlyList.length >= 2 && (
                      <svg
                        viewBox={`0 0 ${splineW} ${splineH}`}
                        preserveAspectRatio="none"
                        className="w-full h-14 overflow-visible block"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient id="pxHourArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.32" />
                            <stop offset="100%" stopColor="#FDE047" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d={splineArea} fill="url(#pxHourArea)" />
                        <path
                          d={splinePath}
                          fill="none"
                          stroke="#FDE047"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        {hourlyList.map((h, i) => {
                          const isSel = i === selectedHourIdx;
                          return (
                            <circle
                              key={`pt-${h.time}-${i}`}
                              cx={mapHourX(i)}
                              cy={mapHourY(h.temp)}
                              r={isSel ? 4.5 : 2.5}
                              fill={isSel ? '#FFFFFF' : '#FDE047'}
                              stroke={isSel ? '#F59E0B' : 'none'}
                              strokeWidth={isSel ? 2 : 0}
                            />
                          );
                        })}
                      </svg>
                    )}

                    {/* Clickable Hourly Columns */}
                    <div className="flex">
                      {hourlyList.map((h, i) => {
                        const isSel = i === selectedHourIdx;
                        return (
                          <button
                            key={`col-${h.time}-${i}`}
                            type="button"
                            onClick={() => setSelectedHourIdx(i)}
                            className={`w-16 shrink-0 py-2 rounded-2xl flex flex-col items-center justify-between gap-1.5 transition-all cursor-pointer ${
                              isSel ? 'bg-white/18 ring-1 ring-white/30' : 'hover:bg-white/10'
                            }`}
                          >
                            <span className="text-xs font-bold font-mono tabular-nums">
                              {fmtTemp(h.temp)}°
                            </span>
                            <PixelWeatherIllustration code={h.weatherCode} isDay={h.isDay ?? true} size="sm" />
                            <span className="text-[10px] font-mono tabular-nums text-sky-200 min-h-[14px] inline-flex items-center gap-0.5">
                              {h.precipitationProbability >= 10 ? (
                                <>
                                  <Droplets className="w-2.5 h-2.5" />
                                  {h.precipitationProbability}%
                                </>
                              ) : (
                                ''
                              )}
                            </span>
                            <span className={`text-[11px] font-mono tabular-nums ${isSel ? 'font-bold text-white' : 'text-white/75'}`}>
                              {i === 0 ? wCopy.nowLabel : h.time}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Main Bento Grid: 10-Day Forecast (Left) + Modular Telemetry Widgets (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
                {/* Left: 10-Day Range Bar Forecast */}
                <div className={`lg:col-span-5 rounded-[26px] ${cardGlassClass} backdrop-blur-2xl border p-4 sm:p-5 space-y-2`}>
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs sm:text-sm font-bold text-white/95 tracking-tight">
                      {wCopy.tenDayTitle}
                    </span>
                    <span className="text-[11px] text-white/65">
                      {wCopy.tapDetails}
                    </span>
                  </div>

                  <div className="divide-y divide-white/10">
                    {tenDayForecast.map((day, idx) => {
                      const isExpanded = expandedDayDate === day.date;
                      const span = Math.max(1, globalMax - globalMin);
                      const minPct = ((day.minTemp - globalMin) / span) * 100;
                      const maxPct = ((day.maxTemp - globalMin) / span) * 100;
                      const barStartX = Math.max(0, Math.min(92, (minPct / 100) * 100));
                      const barW = Math.max(8, ((maxPct - minPct) / 100) * 100);
                      const curTempPct =
                        idx === 0
                          ? Math.max(3, Math.min(97, ((weatherData.current.temp - globalMin) / span) * 100))
                          : null;

                      return (
                        <div key={day.date} className="py-1.5">
                          <button
                            type="button"
                            onClick={() => setExpandedDayDate(isExpanded ? null : day.date)}
                            className="w-full py-1.5 px-1.5 -mx-1.5 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs cursor-pointer"
                          >
                            <div className="w-14 sm:w-20 text-start shrink-0">
                              <div className="font-bold text-white leading-tight truncate">{formatDayLabel(day.date, idx)}</div>
                              <div className="text-[10px] font-mono text-white/65">{day.date.slice(5)}</div>
                            </div>

                            <div className="w-10 sm:w-11 flex items-center gap-0.5 sm:gap-1 shrink-0">
                              <PixelWeatherIllustration code={day.weatherCode} isDay={true} size="sm" />
                              {day.precipitationProbability >= 15 && (
                                <span className="text-[10px] font-mono font-semibold text-sky-200 tabular-nums">
                                  {day.precipitationProbability}%
                                </span>
                              )}
                            </div>

                            <span className="w-7 sm:w-8 text-end font-mono font-semibold text-white/80 tabular-nums shrink-0">
                              {fmtTemp(day.minTemp)}°
                            </span>

                            {/* Pixel Thermal Range Bar */}
                            <svg viewBox="0 0 100 8" className="flex-1 h-2 min-w-[40px]" aria-hidden="true">
                              <defs>
                                <linearGradient id={`pxRange_${idx}`} x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#38BDF8" />
                                  <stop offset="50%" stopColor="#FACC15" />
                                  <stop offset="100%" stopColor="#F97316" />
                                </linearGradient>
                              </defs>
                              <rect x="0" y="1" width="100" height="6" rx="3" fill="rgba(255,255,255,0.14)" />
                              <rect x={barStartX} y="1" width={barW} height="6" rx="3" fill={`url(#pxRange_${idx})`} />
                              {curTempPct !== null && (
                                <circle cx={curTempPct} cy="4" r="3.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
                              )}
                            </svg>

                            <span className="w-8 text-start font-mono font-bold text-white tabular-nums shrink-0">
                              {fmtTemp(day.maxTemp)}°
                            </span>

                            <span className="text-white/50 shrink-0">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </span>
                          </button>

                          {/* Expandable Day Detail Drawer */}
                          {isExpanded && (
                            <div className="mt-1.5 mb-1 p-3 rounded-2xl bg-white/10 border border-white/12 space-y-2.5 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-white/90">
                                <span className="font-bold">
                                  {getLocalizedWeatherText(day.weatherCode, language)} · {fmtTemp(day.minTemp)}°~{fmtTemp(day.maxTemp)}°{tempUnit}
                                </span>
                                <span className="font-mono text-[11px] text-white/75">
                                  {wCopy.precipLabel} {day.precipitationProbability}%
                                  {typeof day.precipitationSum === 'number' && day.precipitationSum > 0
                                    ? ` (${day.precipitationSum} mm)`
                                    : ''}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-1.5 sm:gap-2 text-[11px] font-mono tabular-nums text-white/80">
                                <div>UV: {day.uvIndex ?? '--'}</div>
                                <div>{wCopy.maxWindLabel}: {day.windSpeedMax ?? '--'} km/h</div>
                                <div>
                                  {day.sunrise || '--'} / {day.sunset || '--'}
                                </div>
                              </div>

                              {(onNavigateToDay || onCreateEventOnDate) && (
                                <div className="flex items-center gap-2 pt-1">
                                  {onNavigateToDay && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const [y, m, d] = day.date.split('-').map(Number);
                                        onNavigateToDay(new Date(y, (m || 1) - 1, d || 1));
                                      }}
                                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/15 hover:bg-white/25 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                    >
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>{wCopy.viewDayBtn}</span>
                                    </button>
                                  )}
                                  {onCreateEventOnDate && (
                                    <button
                                      type="button"
                                      onClick={() => onCreateEventOnDate(day.date)}
                                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-white text-slate-900 hover:bg-white/90 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>{wCopy.addEventBtn}</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Modular Telemetry Bento Grid */}
                <div className="lg:col-span-7 grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 items-stretch">
                  {/* Bento 1: Air Quality (AQI) - Full 2 Cols */}
                  <div className={`col-span-1 min-[420px]:col-span-2 rounded-[24px] ${cardGlassClass} backdrop-blur-2xl border p-4 space-y-2.5`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white/80">
                        {wCopy.aqiTitle}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-white/70">
                        PM2.5: {weatherData.current.pm25 ?? '--'} · PM10: {weatherData.current.pm10 ?? '--'} μg/m³
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2.5">
                      <span className="text-3xl font-black font-mono tabular-nums">{aqiVal}</span>
                      <span className="text-sm font-bold text-emerald-300">{aqiMeta.label}</span>
                      <span className="text-xs text-white/75 truncate">{aqiMeta.tip}</span>
                    </div>

                    <svg viewBox="0 0 160 12" className="w-full h-3 block" aria-hidden="true">
                      <defs>
                        <linearGradient id="pxAqiGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#4ADE80" />
                          <stop offset="35%" stopColor="#FACC15" />
                          <stop offset="65%" stopColor="#FB923C" />
                          <stop offset="100%" stopColor="#EF4444" />
                        </linearGradient>
                      </defs>
                      <rect x="0" y="3" width="160" height="6" rx="3" fill="url(#pxAqiGrad)" />
                      <circle cx={aqiMarkerX} cy="6" r="5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
                    </svg>
                  </div>

                  {/* Bento 2: UV Index Arc Gauge */}
                  <div className={`h-full rounded-[24px] ${cardGlassClass} backdrop-blur-2xl border p-4 flex flex-col justify-between gap-2`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                      <Sun className="w-3.5 h-3.5 text-amber-300" />
                      <span>{wCopy.uvTitle}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums">{uvVal}</div>
                        <div className="text-xs font-bold text-amber-200">{uvMeta.label}</div>
                      </div>
                      <svg viewBox="0 0 120 68" className="w-24 h-14 shrink-0" aria-hidden="true">
                        <defs>
                          <linearGradient id="pxUvGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#4ADE80" />
                            <stop offset="50%" stopColor="#FACC15" />
                            <stop offset="100%" stopColor="#F87171" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 16 58 A 44 44 0 0 1 104 58"
                          fill="none"
                          stroke="url(#pxUvGrad)"
                          strokeWidth="7"
                          strokeLinecap="round"
                        />
                        <circle cx={uvDotX} cy={uvDotY} r="5.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
                      </svg>
                    </div>

                    <p className="text-[11px] text-white/75 leading-snug">{uvMeta.tip}</p>
                  </div>

                  {/* Bento 3: Wind Compass */}
                  <div className={`h-full rounded-[24px] ${cardGlassClass} backdrop-blur-2xl border p-4 flex flex-col justify-between gap-2`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                      <Wind className="w-3.5 h-3.5 text-cyan-300" />
                      <span>{ui.weatherWind}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums">
                          {weatherData.current.windSpeed}
                          <span className="text-xs font-semibold ms-1 text-white/75">km/h</span>
                        </div>
                        <div className="text-xs font-bold text-cyan-200">
                          {getWindCompassName(weatherData.current.windDirection)}
                        </div>
                      </div>

                      <svg viewBox="0 0 80 80" className="w-16 h-16 shrink-0" aria-hidden="true">
                        <circle cx="40" cy="40" r="32" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
                        <text x="40" y="16" textAnchor="middle" className="fill-white/75 text-[8px] font-bold">N</text>
                        <text x="66" y="43" textAnchor="middle" className="fill-white/60 text-[8px] font-bold">E</text>
                        <text x="40" y="70" textAnchor="middle" className="fill-white/60 text-[8px] font-bold">S</text>
                        <text x="14" y="43" textAnchor="middle" className="fill-white/60 text-[8px] font-bold">W</text>
                        <g transform={`rotate(${weatherData.current.windDirection} 40 40)`}>
                          <line x1="40" y1="54" x2="40" y2="24" stroke="#67E8F9" strokeWidth="2.4" strokeLinecap="round" />
                          <polygon points="40,18 35.5,27 44.5,27" fill="#FFFFFF" />
                        </g>
                      </svg>
                    </div>

                    <p className="text-[11px] text-white/75 leading-snug">
                      {getWindScaleLabel(weatherData.current.windSpeed)}
                    </p>
                  </div>

                  {/* Bento 4: Sunrise & Sunset Solar Arc */}
                  <div className={`h-full rounded-[24px] ${cardGlassClass} backdrop-blur-2xl border p-4 flex flex-col justify-between gap-2`}>
                    <div className="flex items-center justify-between text-xs font-bold text-white/80">
                      <span className="flex items-center gap-1.5">
                        <Sunrise className="w-3.5 h-3.5 text-amber-300" />
                        <span>{wCopy.sunPathTitle}</span>
                      </span>
                      <span className="text-[10px] font-mono text-white/65">
                        {daylightH}h {daylightM}m
                      </span>
                    </div>

                    <svg viewBox="0 0 140 62" className="w-full h-14" aria-hidden="true">
                      <line x1="8" y1="54" x2="132" y2="54" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
                      <path
                        d="M 12 54 Q 70 -26 128 54"
                        fill="none"
                        stroke="rgba(253,224,71,0.45)"
                        strokeWidth="2.5"
                      />
                      <circle cx={solarArcX} cy={solarArcY} r="5.5" fill="#FDE047" stroke="#FFFFFF" strokeWidth="1.5" />
                    </svg>

                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="flex items-center gap-1">
                        <Sunrise className="w-3.5 h-3.5 text-amber-300" />
                        {weatherData.current.sunrise}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sunset className="w-3.5 h-3.5 text-orange-300" />
                        {weatherData.current.sunset}
                      </span>
                    </div>
                  </div>

                  {/* Bento 5: Humidity & Dew Point */}
                  <div className={`h-full rounded-[24px] ${cardGlassClass} backdrop-blur-2xl border p-4 flex flex-col justify-between gap-2`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                      <Droplets className="w-3.5 h-3.5 text-sky-300" />
                      <span>{ui.weatherHumidity}</span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums">
                        {weatherData.current.humidity}%
                      </div>
                      <span className="text-xs font-mono tabular-nums text-sky-200">
                        {wCopy.dewLabel} {fmtTemp(weatherData.current.dewPoint ?? weatherData.current.temp - 4)}°
                      </span>
                    </div>

                    <svg viewBox="0 0 120 8" className="w-full h-2" aria-hidden="true">
                      <rect x="0" y="1" width="120" height="6" rx="3" fill="rgba(255,255,255,0.14)" />
                      <rect
                        x="0"
                        y="1"
                        width={Math.max(8, (weatherData.current.humidity / 100) * 120)}
                        height="6"
                        rx="3"
                        fill="#38BDF8"
                      />
                    </svg>

                    <p className="text-[11px] text-white/75 leading-snug">
                      {weatherData.current.humidity < 40
                        ? wCopy.humDry
                        : weatherData.current.humidity <= 70
                        ? wCopy.humComf
                        : wCopy.humHumid}
                    </p>
                  </div>

                  {/* Bento 6: Atmospheric Pressure Gauge */}
                  <div className={`h-full rounded-[24px] ${cardGlassClass} backdrop-blur-2xl border p-4 flex flex-col justify-between gap-2`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                      <Gauge className="w-3.5 h-3.5 text-indigo-200" />
                      <span>{wCopy.pressureTitle}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-2xl font-black font-mono tabular-nums">{pressureVal}</div>
                        <div className="text-[11px] font-mono text-white/70">hPa</div>
                      </div>
                      <svg viewBox="0 0 120 66" className="w-24 h-13 shrink-0" aria-hidden="true">
                        <path
                          d="M 18 56 A 42 42 0 0 1 102 56"
                          fill="none"
                          stroke="rgba(255,255,255,0.22)"
                          strokeWidth="7"
                          strokeLinecap="round"
                        />
                        <circle cx={pressureDotX} cy={pressureDotY} r="5.5" fill="#A5B4FC" stroke="#FFFFFF" strokeWidth="1.5" />
                      </svg>
                    </div>

                    <p className="text-[11px] text-white/75 leading-snug">
                      {pressureVal >= 1018
                        ? wCopy.pressHigh
                        : pressureVal <= 1005
                        ? wCopy.pressLow
                        : wCopy.pressNorm}
                    </p>
                  </div>

                  {/* Bento 7: Visibility & Feels Like */}
                  <div className={`h-full rounded-[24px] ${cardGlassClass} backdrop-blur-2xl border p-4 flex flex-col justify-between gap-2`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                      <Eye className="w-3.5 h-3.5 text-teal-200" />
                      <span>{wCopy.visibilityTitle}</span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <div className="text-2xl font-black font-mono tabular-nums">
                          {weatherData.current.visibility}
                          <span className="text-xs font-semibold ms-1 text-white/75">km</span>
                        </div>
                        <div className="text-[11px] text-teal-200 font-semibold">
                          {weatherData.current.visibility >= 12
                            ? wCopy.visClear
                            : weatherData.current.visibility >= 5
                            ? wCopy.visGood
                            : wCopy.visLow}
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="flex items-center justify-end gap-1 text-xs text-white/70">
                          <Thermometer className="w-3.5 h-3.5" />
                          <span>{ui.weatherFeelsLike}</span>
                        </div>
                        <div className="text-lg font-black font-mono tabular-nums">
                          {fmtTemp(weatherData.current.feelsLike)}°{tempUnit}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-white/75 leading-snug">
                      {Math.abs(weatherData.current.feelsLike - weatherData.current.temp) <= 1
                        ? wCopy.feelSame
                        : weatherData.current.feelsLike < weatherData.current.temp
                        ? wCopy.feelCool
                        : wCopy.feelWarm}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1 pb-2 flex items-center justify-between text-[11px] text-white/60 font-mono tabular-nums px-1">
                <span>{wCopy.footerTitle}</span>
                <span>
                  {wCopy.updatedPrefix}
                  {new Date(weatherData.updatedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
