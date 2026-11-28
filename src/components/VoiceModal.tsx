import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, X, CornerDownLeft } from 'lucide-react';
import { AppSettings } from '../types/calendar';
import { getTranslation, getExtraLabels, getLocaleCode } from '../utils/i18n';
import type { SpeechRecognitionEventLike, SpeechRecognitionInstance } from '../vite-env';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onCommand: (action: string, param?: string) => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  settings,
  onCommand,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Check Web Speech API support
  const isSpeechSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript('');
      setFeedback(null);
      return;
    }

    if (isSpeechSupported) {
      startListening();
    }

    return () => {
      stopListening();
    };
  }, [isOpen]);

  const startListening = () => {
    if (!isSpeechSupported) return;

    try {
      const SpeechRecognitionCtor =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionCtor) return;
      const recognition = new SpeechRecognitionCtor();
      const speechLocaleMap: Record<string, string> = {
        'zh-CN': 'zh-CN',
        'zh-TW': 'zh-TW',
        en: 'en-US',
        ja: 'ja-JP',
        ko: 'ko-KR',
        fr: 'fr-FR',
        fa: 'fa-IR',
        mn: 'mn-MN',
        ru: 'ru-RU',
        ug: 'ug-CN',
      };
      recognition.lang = speechLocaleMap[settings.language] || getLocaleCode(settings.language);

      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setFeedback(t.voiceControlListening);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        processVoiceCommand(currentTranscript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setFeedback(ui.voiceRetryPrompt);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const processVoiceCommand = (text: string) => {
    const raw = text.trim().toLowerCase();

    // 1. Navigation tabs
    if (
      raw.includes('日历') ||
      raw.includes('行事') ||
      raw.includes('カレンダー') ||
      raw.includes('달력') ||
      raw.includes('календар') ||
      raw.includes('calendrier') ||
      raw.includes('calendar') ||
      raw === t.navCalendar.toLowerCase()
    ) {
      executeAction('calendar', t.navCalendar);
    } else if (
      raw.includes('待办') ||
      raw.includes('清单') ||
      raw.includes('タスク') ||
      raw.includes('할 일') ||
      raw.includes('задач') ||
      raw.includes('tâche') ||
      raw.includes('todo') ||
      raw.includes('task') ||
      raw === t.navAgenda.toLowerCase()
    ) {
      executeAction('agenda', t.navAgenda);
    } else if (
      raw.includes('专注') ||
      raw.includes('番茄') ||
      raw.includes('集中') ||
      raw.includes('집중') ||
      raw.includes('фокус') ||
      raw.includes('focus') ||
      raw.includes('pomodoro') ||
      raw === (t.navFocus || '').toLowerCase()
    ) {
      executeAction('focus', t.navFocus || t.pomoFocusSession);
    } else if (
      raw.includes('工具') ||
      raw.includes('ツール') ||
      raw.includes('도구') ||
      raw.includes('инструмент') ||
      raw.includes('outils') ||
      raw.includes('toolbox') ||
      raw.includes('tools') ||
      raw === t.navTools.toLowerCase()
    ) {
      executeAction('tools', t.navTools);
    } else if (
      raw.includes('设置') ||
      raw.includes('設定') ||
      raw.includes('설정') ||
      raw.includes('настрой') ||
      raw.includes('param') ||
      raw.includes('settings') ||
      raw === t.navSettings.toLowerCase()
    ) {
      executeAction('settings', t.settingsTitle);
    }
    // 2. Views
    else if (
      raw.includes('日视图') ||
      raw.includes('今天') ||
      raw.includes('今日') ||
      raw.includes('오늘') ||
      raw.includes('сегодня') ||
      raw.includes("aujourd") ||
      raw.includes('today') ||
      raw === t.today.toLowerCase() ||
      (raw.includes('日') && raw.length <= 2)
    ) {
      executeAction('view_day', t.today);
    } else if (raw.includes('周') || raw.includes('週') || raw.includes('주') || raw.includes('week')) {
      executeAction('view_week', t.viewWeek);
    } else if (raw.includes('月') || raw.includes('월') || raw.includes('month')) {
      executeAction('view_month', t.viewMonth);
    } else if (raw.includes('年') || raw.includes('년') || raw.includes('year')) {
      executeAction('view_year', t.viewYear);
    }
    // 3. Navigation
    else if (raw.includes('下一') || raw.includes('明天') || raw.includes('next')) {
      executeAction('next', t.tomorrow);
    } else if (raw.includes('上一') || raw.includes('昨天') || raw.includes('prev')) {
      executeAction('prev', t.yesterday);
    }
    // 4. Creation & Modals
    else if (
      raw.includes('新建') ||
      raw.includes('添加') ||
      raw.includes('创建') ||
      raw.includes('新規') ||
      raw.includes('새') ||
      raw.includes('new') ||
      raw === t.createEvent.toLowerCase()
    ) {
      executeAction('new_event', t.createEvent);
    } else if (
      raw.includes('天气') ||
      raw.includes('天気') ||
      raw.includes('날씨') ||
      raw.includes('погод') ||
      raw.includes('météo') ||
      raw.includes('weather') ||
      raw === t.weatherQuickBtn.toLowerCase()
    ) {
      executeAction('weather', t.weatherQuickBtn);
    } else if (
      raw.includes('时钟') ||
      raw.includes('時鐘') ||
      raw.includes('時計') ||
      raw.includes('시계') ||
      raw.includes('часы') ||
      raw.includes('clock') ||
      raw === t.worldClock.toLowerCase()
    ) {
      executeAction('world_clock', t.worldClock);
    } else if (
      raw.includes('法') ||
      raw.includes('法律') ||
      raw.includes('法规') ||
      raw.includes('案例') ||
      raw.includes('法令') ||
      raw.includes('判例') ||
      raw.includes('법률') ||
      raw.includes('판례') ||
      raw.includes('law') ||
      raw.includes('legal') ||
      raw.includes('statute') ||
      raw.includes('loi') ||
      raw.includes('قانون') ||
      raw.includes('хууль') ||
      raw.includes('закон') ||
      raw.includes('قانۇن') ||
      raw === ui.fabLaws.toLowerCase()
    ) {
      executeAction('laws', ui.fabLaws);
    } else if (raw.includes('搜索') || raw.includes('查找') || raw.includes('search')) {
      executeAction('search', t.viewDetails);
    } else if (raw.includes('返回') || raw.includes('关闭') || raw.includes('back') || raw.includes('close')) {
      onClose();
    }
  };

  const executeAction = (action: string, message: string) => {
    setFeedback(`✓ ${message}`);
    stopListening();
    setTimeout(() => {
      onCommand(action);
      onClose();
    }, 600);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    processVoiceCommand(manualInput);
    setManualInput('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] bg-black/60 backdrop-blur-md select-none animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-5 sm:p-6 text-center animate-modal-sheet" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
            <span>{ui.voiceHeaderBadge}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.cancel}
            className="w-10 h-10 -m-1.5 flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mic Visualizer */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="relative">
            {isListening && (
              <span className="absolute -inset-2.5 rounded-full border-2 border-blue-500/40 bg-blue-500/10" />
            )}
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-xl active:scale-95 ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-500 to-amber-500 scale-105'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 hover:brightness-110'
              }`}
            >
              {isListening ? (
                <Mic className="w-9 h-9" />
              ) : (
                <MicOff className="w-9 h-9" />
              )}
            </button>
          </div>
          <p className="mt-4 text-xs font-bold text-neutral-500 dark:text-neutral-400">
            {isListening ? ui.voiceListeningPrompt : ui.voiceStartPrompt}
          </p>
        </div>

        {/* Live Transcript / Feedback */}
        <div className="p-3.5 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 min-h-[56px] flex items-center justify-center text-center mb-4">
          <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
            {transcript || feedback || t.voiceControlHelp}
          </p>
        </div>

        {/* Manual Keyboard / TV Remote Text Input */}
        <form onSubmit={handleManualSubmit} className="relative flex items-center mb-4">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={ui.voicePlaceholder}
            className="w-full ps-3.5 pe-11 py-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-800 dark:text-neutral-100"
          />
          <button
            type="submit"
            aria-label={t.done}
            className="absolute end-1.5 w-8 h-8 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Command chips for quick 1-tap/remote selection */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
          {[
            { action: 'view_day', label: t.today },
            { action: 'calendar', label: t.navCalendar },
            { action: 'agenda', label: t.navAgenda },
            { action: 'focus', label: t.navFocus || t.pomoFocusSession },
            { action: 'tools', label: t.navTools },
            { action: 'laws', label: ui.fabLaws },
            { action: 'weather', label: t.weatherQuickBtn },
            { action: 'world_clock', label: t.worldClock },
            { action: 'new_event', label: t.createEvent },
          ].map((chip) => (
            <button
              key={chip.action}
              type="button"
              onClick={() => executeAction(chip.action, chip.label)}
              className="px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-600 dark:text-neutral-300 hover:text-blue-600 transition-colors border border-neutral-200/60 dark:border-neutral-700"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
