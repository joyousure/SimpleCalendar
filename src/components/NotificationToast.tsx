import React from 'react';
import { ActiveNotification, Language } from '../types/calendar';
import { getTranslation } from '../utils/i18n';
import { Bell, X } from 'lucide-react';

interface NotificationToastProps {
  notifications: ActiveNotification[];
  onDismiss: (id: string) => void;
  onOpenEvent: (eventId: string) => void;
  language: Language;
}

let sharedReminderCtx: AudioContext | null = null;

function getReminderAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (sharedReminderCtx) return sharedReminderCtx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  sharedReminderCtx = new AudioCtx();
  return sharedReminderCtx;
}

export function playReminderSound(): void {
  try {
    const ctx = getReminderAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
  onOpenEvent,
  language,
}) => {
  const t = getTranslation(language);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto p-4 rounded-3xl bg-neutral-900/90 text-white border border-white/10 shadow-2xl backdrop-blur-xl flex items-start justify-between gap-3 animate-fade-in"
        >
          <div
            onClick={() => onOpenEvent(n.eventId)}
            className="flex items-start gap-3 cursor-pointer flex-1"
          >
            <div className="p-2 rounded-2xl bg-blue-600 text-white shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold">{n.title}</div>
              <div className="text-[11px] text-neutral-300">{n.message}</div>
              <div className="text-[10px] text-neutral-400 font-mono">{n.timeString}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(n.id)}
            aria-label={t.done}
            title={t.done}
            className="p-1 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
