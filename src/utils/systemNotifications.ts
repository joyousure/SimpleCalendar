import { Language } from '../types/calendar';

export type SystemNotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported';

interface CapacitorLocalNotifsWindowLike {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    Plugins?: {
      LocalNotifications?: {
        checkPermissions?: () => Promise<{ display?: string }>;
        requestPermissions?: () => Promise<{ display?: string }>;
        schedule?: (opts: {
          notifications: Array<{
            id: number;
            title: string;
            body: string;
            schedule?: { at: Date };
            extra?: Record<string, string>;
          }>;
        }) => Promise<unknown>;
      };
    };
  };
}

const FIRED_NOTIF_STORAGE_KEY = 'cal_fired_notifications_v1';

function getCapacitorLocalNotifications() {
  if (typeof window === 'undefined') return null;
  const capWin = window as unknown as CapacitorLocalNotifsWindowLike;
  if (!capWin.Capacitor?.isNativePlatform?.()) return null;
  return capWin.Capacitor?.Plugins?.LocalNotifications ?? null;
}

export async function getSystemNotificationPermission(): Promise<SystemNotificationPermission> {
  const localNotifs = getCapacitorLocalNotifications();
  if (localNotifs?.checkPermissions) {
    try {
      const res = await localNotifs.checkPermissions();
      if (res?.display === 'granted') return 'granted';
      if (res?.display === 'denied') return 'denied';
      return 'default';
    } catch {
      // fall through
    }
  }
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  const perm = Notification.permission;
  if (perm === 'granted' || perm === 'denied' || perm === 'default') return perm;
  return 'default';
}

export async function requestSystemNotificationPermission(): Promise<SystemNotificationPermission> {
  const localNotifs = getCapacitorLocalNotifications();
  if (localNotifs?.requestPermissions) {
    try {
      const res = await localNotifs.requestPermissions();
      if (res?.display === 'granted') return 'granted';
      if (res?.display === 'denied') return 'denied';
      return 'default';
    } catch {
      // fall through
    }
  }
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const res = await Notification.requestPermission();
    if (res === 'granted' || res === 'denied' || res === 'default') return res;
  } catch {
    // Some legacy Safari signatures use callbacks or throw in iframes
  }
  return Notification.permission as SystemNotificationPermission;
}

export function hasFiredNotificationKey(key: string): boolean {
  try {
    const raw = localStorage.getItem(FIRED_NOTIF_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, number>;
    return Boolean(parsed && typeof parsed === 'object' && parsed[key]);
  } catch {
    return false;
  }
}

export function markFiredNotificationKey(key: string): void {
  try {
    const now = Date.now();
    const cutoff = now - 48 * 60 * 60 * 1000;
    const raw = localStorage.getItem(FIRED_NOTIF_STORAGE_KEY);
    const parsed: Record<string, number> = raw ? JSON.parse(raw) : {};
    const pruned: Record<string, number> = {};
    if (parsed && typeof parsed === 'object') {
      for (const [k, ts] of Object.entries(parsed)) {
        if (typeof ts === 'number' && ts >= cutoff) {
          pruned[k] = ts;
        }
      }
    }
    pruned[key] = now;
    localStorage.setItem(FIRED_NOTIF_STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    // Ignore quota errors
  }
}

export interface SystemNotificationPayload {
  id?: number;
  title: string;
  body: string;
  tag?: string;
  silent?: boolean;
  vibrate?: boolean;
  onClick?: () => void;
}

export async function dispatchSystemNotification(
  payload: SystemNotificationPayload
): Promise<boolean> {
  if (payload.vibrate !== false && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate([140, 60, 140]);
    } catch {}
  }

  // 1. Native Capacitor LocalNotifications plugin (APK / iOS native)
  const localNotifs = getCapacitorLocalNotifications();
  if (localNotifs?.schedule) {
    try {
      const perm = await getSystemNotificationPermission();
      if (perm === 'granted') {
        const numericId =
          typeof payload.id === 'number' && Number.isFinite(payload.id)
            ? Math.abs(Math.floor(payload.id)) % 2_000_000_000
            : Math.floor(Date.now() % 2_000_000_000);
        await localNotifs.schedule({
          notifications: [
            {
              id: numericId,
              title: payload.title,
              body: payload.body,
              schedule: { at: new Date(Date.now() + 200) },
              extra: payload.tag ? { tag: payload.tag } : undefined,
            },
          ],
        });
        return true;
      }
    } catch {
      // Fall through to Web Notification API
    }
  }

  // 2. Web Notifications API (ServiceWorkerRegistration.showNotification first for Android Chrome / PWA)
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const reg = await Promise.race<ServiceWorkerRegistration | null>([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 600)),
      ]);
      if (reg && typeof reg.showNotification === 'function') {
        const swOpts: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
          body: payload.body,
          tag: payload.tag,
          silent: payload.silent,
          renotify: Boolean(payload.tag),
          vibrate: payload.vibrate !== false ? [140, 60, 140] : undefined,
        };
        await reg.showNotification(payload.title, swOpts);
        return true;
      }
    }
  } catch {
    // Fall through to foreground Notification constructor
  }

  try {
    const notif = new Notification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      silent: payload.silent,
    });
    notif.onclick = () => {
      try {
        window.focus();
      } catch {}
      payload.onClick?.();
      try {
        notif.close();
      } catch {}
    };
    return true;
  } catch {
    return false;
  }
}

export interface SystemNotifUiLabels {
  toggleTitle: string;
  toggleDesc: string;
  statusGranted: string;
  statusDefault: string;
  statusDenied: string;
  statusUnsupported: string;
  requestBtn: string;
  testBtn: string;
  testTitle: string;
  testBody: string;
  testSentOk: string;
  testNeedPerm: string;
  focusWorkDoneTitle: string;
  focusWorkDoneBody: string;
  focusBreakDoneTitle: string;
  focusBreakDoneBody: string;
  focusStopwatchSavedTitle: string;
  focusStopwatchSavedBody: string;
}

export function getSystemNotifUi(lang: Language): SystemNotifUiLabels {
  switch (lang) {
    case 'zh-CN':
      return {
        toggleTitle: '系统原生提醒推送',
        toggleDesc: '日程到期、法定节假日晨间及番茄专注结束时调用本机系统通知栏与震动',
        statusGranted: '系统通知已授权',
        statusDefault: '待授权',
        statusDenied: '系统已拦截通知',
        statusUnsupported: '当前环境不支持系统通知',
        requestBtn: '请求系统权限',
        testBtn: '测试系统提醒',
        testTitle: '系统提醒连接正常',
        testBody: '日程到期与专注计时结束时将通过本机通知栏实时提醒您。',
        testSentOk: '已发送一条系统级测试通知',
        testNeedPerm: '请在浏览器或系统设置中允许通知权限后再试',
        focusWorkDoneTitle: '专注轮次已完成',
        focusWorkDoneBody: '已完成 {mins} 分钟深度专注，建议休息片刻。',
        focusBreakDoneTitle: '休息时间结束',
        focusBreakDoneBody: '休整完毕，准备进入下一轮专注。',
        focusStopwatchSavedTitle: '正计时专注已记录',
        focusStopwatchSavedBody: '本次持续专注 {mins} 分钟已写入统计。',
      };
    case 'zh-TW':
      return {
        toggleTitle: '系統原生提醒推播',
        toggleDesc: '行程到期、國定假日晨間及專注結束時呼叫本機系統通知列與震動',
        statusGranted: '系統通知已授權',
        statusDefault: '待授權',
        statusDenied: '系統已封鎖通知',
        statusUnsupported: '目前環境不支援系統通知',
        requestBtn: '請求系統權限',
        testBtn: '測試系統提醒',
        testTitle: '系統提醒連線正常',
        testBody: '行程到期與專注結束時將透過本機通知列即時提醒您。',
        testSentOk: '已發送系統級測試通知',
        testNeedPerm: '請在瀏覽器或系統設定中允許通知權限後再試',
        focusWorkDoneTitle: '專注輪次已完成',
        focusWorkDoneBody: '已完成 {mins} 分鐘深度專注，建議休息片刻。',
        focusBreakDoneTitle: '休息時間結束',
        focusBreakDoneBody: '休整完畢，準備進入下一輪專注。',
        focusStopwatchSavedTitle: '正計時專注已記錄',
        focusStopwatchSavedBody: '本次持續專注 {mins} 分鐘已寫入統計。',
      };
    case 'ja':
      return {
        toggleTitle: 'システム通知連携',
        toggleDesc: '予定・祝日朝・集中タイマー終了時にOSの通知センターとバイブを作動',
        statusGranted: '通知許可済み',
        statusDefault: '未許可',
        statusDenied: '通知がブロックされています',
        statusUnsupported: 'この環境では通知非対応です',
        requestBtn: '通知を許可する',
        testBtn: 'テスト通知を送信',
        testTitle: 'システム通知は有効です',
        testBody: '予定やタイマー完了時にOS通知でお知らせします。',
        testSentOk: 'システムテスト通知を送信しました',
        testNeedPerm: 'ブラウザまたはOS設定で通知を許可してください',
        focusWorkDoneTitle: '集中セッション完了',
        focusWorkDoneBody: '{mins}分の集中を完了しました。休憩しましょう。',
        focusBreakDoneTitle: '休憩終了',
        focusBreakDoneBody: '次の集中セッションを始めましょう。',
        focusStopwatchSavedTitle: 'フロー計測を保存',
        focusStopwatchSavedBody: '{mins}分の集中記録を保存しました。',
      };
    case 'ko':
      return {
        toggleTitle: '시스템 기본 알림',
        toggleDesc: '일정·공휴일 아침·포모도로 종료 시 기기 시스템 알림과 진동 실행',
        statusGranted: '알림 허용됨',
        statusDefault: '권한 필요',
        statusDenied: '시스템에서 차단됨',
        statusUnsupported: '시스템 알림 미지원',
        requestBtn: '알림 권한 요청',
        testBtn: '테스트 알림 보내기',
        testTitle: '시스템 알림 연결됨',
        testBody: '일정 및 집중 타이머 완료 시 기기 알림센터로 알려드립니다.',
        testSentOk: '시스템 테스트 알림을 보냈습니다',
        testNeedPerm: '브라우저 또는 기기 설정에서 알림 권한을 허용해주세요',
        focusWorkDoneTitle: '집중 세션 완료',
        focusWorkDoneBody: '{mins}분 집중을 완료했습니다. 잠시 휴식하세요.',
        focusBreakDoneTitle: '휴식 종료',
        focusBreakDoneBody: '다음 집중 세션을 시작할 준비가 되었습니다.',
        focusStopwatchSavedTitle: '스톱워치 집중 기록됨',
        focusStopwatchSavedBody: '{mins}분 집중 기록이 저장되었습니다.',
      };
    case 'fr':
      return {
        toggleTitle: 'Notifications système natives',
        toggleDesc: 'Utiliser les notifications OS et vibrations pour agenda, jours fériés et minuteur',
        statusGranted: 'Autorisées',
        statusDefault: 'Non configurées',
        statusDenied: 'Bloquées par le système',
        statusUnsupported: 'Non pris en charge',
        requestBtn: 'Autoriser les notifications',
        testBtn: 'Tester la notification',
        testTitle: 'Rappels système actifs',
        testBody: 'Vous recevrez les rappels natifs du système à temps.',
        testSentOk: 'Notification de test système envoyée',
        testNeedPerm: 'Veuillez autoriser les notifications dans les réglages',
        focusWorkDoneTitle: 'Session de focus terminée',
        focusWorkDoneBody: '{mins} min de focus accomplies. Faites une pause.',
        focusBreakDoneTitle: 'Pause terminée',
        focusBreakDoneBody: 'Prêt pour le prochain cycle de focus.',
        focusStopwatchSavedTitle: 'Session chronométrée enregistrée',
        focusStopwatchSavedBody: '{mins} min de concentration enregistrées.',
      };
    case 'ru':
      return {
        toggleTitle: 'Системные уведомления',
        toggleDesc: 'Уведомления ОС и вибрация для событий, праздников и таймера фокуса',
        statusGranted: 'Разрешены',
        statusDefault: 'Ожидается запрос',
        statusDenied: 'Заблокированы',
        statusUnsupported: 'Не поддерживается',
        requestBtn: 'Запросить доступ',
        testBtn: 'Тест уведомления',
        testTitle: 'Системные напоминания активны',
        testBody: 'События и таймер будут приходить через уведомления ОС.',
        testSentOk: 'Тестовое системное уведомление отправлено',
        testNeedPerm: 'Разрешите уведомления в настройках браузера или ОС',
        focusWorkDoneTitle: 'Фокус-сессия завершена',
        focusWorkDoneBody: 'Выполнено {mins} мин фокуса. Сделайте перерыв.',
        focusBreakDoneTitle: 'Перерыв окончен',
        focusBreakDoneBody: 'Время начать новый цикл фокуса.',
        focusStopwatchSavedTitle: 'Секундомер сохранён',
        focusStopwatchSavedBody: 'Записано {mins} мин концентрации.',
      };
    case 'fa':
      return {
        toggleTitle: 'اعلان‌های بومی سیستم',
        toggleDesc: 'ارسال هشدار سیستم‌عامل و لرزش برای رویدادها، تعطیلات و تایمر تمرکز',
        statusGranted: 'مجاز شده',
        statusDefault: 'نیاز به مجوز',
        statusDenied: 'مسدود شده',
        statusUnsupported: 'پشتیبانی نمی‌شود',
        requestBtn: 'درخواست مجوز سیستم',
        testBtn: 'تست اعلان سیستم',
        testTitle: 'اعلان سیستم فعال است',
        testBody: 'یادآور رویدادها و پایان تمرکز در نوار اعلان سیستم نمایش داده می‌شود.',
        testSentOk: 'اعلان آزمایشی سیستم ارسال شد',
        testNeedPerm: 'لطفاً مجوز اعلان را در تنظیمات مرورگر یا دستگاه فعال کنید',
        focusWorkDoneTitle: 'دوره تمرکز کامل شد',
        focusWorkDoneBody: '{mins} دقیقه تمرکز کامل شد. کمی استراحت کنید.',
        focusBreakDoneTitle: 'پایان زمان استراحت',
        focusBreakDoneBody: 'آماده شروع دوره بعدی تمرکز هستید.',
        focusStopwatchSavedTitle: 'زمان تمرکز ثبت شد',
        focusStopwatchSavedBody: '{mins} دقیقه تمرکز ثبت گردید.',
      };
    case 'mn':
      return {
        toggleTitle: 'Системийн мэдэгдэл',
        toggleDesc: 'Үйл явдал, баяр болон төвлөрлийн цаг дуусахад систем мэдэгдэл илгээх',
        statusGranted: 'Зөвшөөрсөн',
        statusDefault: 'Зөвшөөрөл хүсэх',
        statusDenied: 'Хориглосон',
        statusUnsupported: 'Дэмжихгүй',
        requestBtn: 'Зөвшөөрөл авах',
        testBtn: 'Турших мэдэгдэл',
        testTitle: 'Системийн мэдэгдэл идэвхтэй',
        testBody: 'Хуваарь ба цаг дуусахад системийн мэдэгдэл ирнэ.',
        testSentOk: 'Системийн туршилтын мэдэгдэл илгээлээ',
        testNeedPerm: 'Тохиргооноос мэдэгдлийн зөвшөөрлийг асаана уу',
        focusWorkDoneTitle: 'Төвлөрөл дууслаа',
        focusWorkDoneBody: '{mins} минут төвлөрлөө. Түр амраарай.',
        focusBreakDoneTitle: 'Амралт дууслаа',
        focusBreakDoneBody: 'Дараагийн төвлөрөлд бэлэн боллоо.',
        focusStopwatchSavedTitle: 'Хугацаа хадгалагдлаа',
        focusStopwatchSavedBody: '{mins} минутын бичлэг хадгалагдлаа.',
      };
    case 'ug':
      return {
        toggleTitle: 'سىستېما ئەسكەرتىش ئۇقتۇرۇشى',
        toggleDesc: 'كۈنتەرتىپ، بايرام ۋە دىققەت ۋاقتى توشقاندا سىستېما ئۇقتۇرۇشى چىقىرىدۇ',
        statusGranted: 'ئىجازەت بېرىلدى',
        statusDefault: 'ئىجازەت كېرەك',
        statusDenied: 'توسۇلغان',
        statusUnsupported: 'قوللىمايدۇ',
        requestBtn: 'ئىجازەت سوراش',
        testBtn: 'سىناق ئۇقتۇرۇش',
        testTitle: 'سىستېما ئۇقتۇرۇشى ئوچۇق',
        testBody: 'كۈنتەرتىپ ۋە دىققەت ۋاقتى توشقاندا سىستېما ئۇقتۇرۇش بالدىقىدا ئەسكەرتىدۇ.',
        testSentOk: 'سىناق ئۇقتۇرۇش يوللاندى',
        testNeedPerm: 'توركۆرگۈ ياكى سىستېما تەڭشىكىدىن ئۇقتۇرۇش ئىجازىتىنى ئېچىڭ',
        focusWorkDoneTitle: 'دىققەت بىرلىكى تاماملاندى',
        focusWorkDoneBody: '{mins} مىنۇت دىققەت تاماملاندى، ئازراق دەم ئېلىڭ.',
        focusBreakDoneTitle: 'دەم ئېلىش ئاخىرلاشتى',
        focusBreakDoneBody: 'كېيىنكى دىققەت باسقۇچىغا تەييار.',
        focusStopwatchSavedTitle: 'دىققەت ۋاقتى ساقلاندى',
        focusStopwatchSavedBody: '{mins} مىنۇت داۋاملاشقان دىققەت خاتىرىلەندى.',
      };
    default:
      return {
        toggleTitle: 'Native System Notifications',
        toggleDesc: 'Deliver OS notifications & haptics for scheduled reminders, holidays, and focus timer',
        statusGranted: 'Granted',
        statusDefault: 'Permission Needed',
        statusDenied: 'Blocked by OS',
        statusUnsupported: 'Unsupported in current context',
        requestBtn: 'Grant Permission',
        testBtn: 'Test System Alert',
        testTitle: 'System Reminders Active',
        testBody: 'Scheduled events and focus timer completions will alert via your OS notification center.',
        testSentOk: 'Test system notification sent',
        testNeedPerm: 'Please allow notification permission in browser or OS settings',
        focusWorkDoneTitle: 'Focus Session Complete',
        focusWorkDoneBody: 'Completed {mins} minutes of deep focus. Take a break.',
        focusBreakDoneTitle: 'Break Finished',
        focusBreakDoneBody: 'Ready for the next focus round.',
        focusStopwatchSavedTitle: 'Flow Session Saved',
        focusStopwatchSavedBody: 'Recorded {mins} minutes of continuous focus.',
      };
  }
}

export async function sendTestSystemNotification(lang: Language): Promise<'sent' | 'denied'> {
  const ui = getSystemNotifUi(lang);
  let perm = await getSystemNotificationPermission();
  if (perm === 'default') {
    perm = await requestSystemNotificationPermission();
  }
  if (perm !== 'granted') {
    return 'denied';
  }
  const ok = await dispatchSystemNotification({
    id: 9001,
    title: ui.testTitle,
    body: ui.testBody,
    tag: 'calendar-system-test',
  });
  return ok ? 'sent' : 'denied';
}
