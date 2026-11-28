import React from 'react';
import { CalendarEvent, EventCategory, AppSettings } from '../types/calendar';
import { getTranslation } from '../utils/i18n';
import { getCategoryDisplayName } from '../utils/storage';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Copy,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
  Flag,
  Flame,
  Bell,
  Repeat,
  CheckSquare,
} from 'lucide-react';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  categories: EventCategory[];
  settings: AppSettings;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onDuplicate: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onStartFocus?: (eventId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  categories,
  settings,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdateEvent,
  onStartFocus,
}) => {
  const t = getTranslation(settings.language);

  if (!event) return null;

  const cat = categories.find((c) => c.id === event.categoryId);
  const color = event.color || cat?.color || settings.accentColor;

  const toggleChecklistItem = (itemId: string) => {
    if (!event.checklist) return;
    const updatedChecklist = event.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateEvent({ ...event, checklist: updatedChecklist });
  };

  const toggleTaskCompletion = () => {
    const next = !event.isCompleted;
    onUpdateEvent({
      ...event,
      isCompleted: next,
      completedAt: next ? Date.now() : undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 bg-black/55 backdrop-blur-md select-none overflow-y-auto animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto rounded-3xl bg-white/88 dark:bg-neutral-900/88 backdrop-blur-2xl border border-white/80 dark:border-white/15 shadow-2xl p-6 space-y-5 animate-modal-sheet" role="dialog" aria-modal="true">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-200/70 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTaskCompletion}
              className="text-neutral-400 hover:text-emerald-500 cursor-pointer"
            >
              {event.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-check-pop" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
            <span
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-bold backdrop-blur-md border shadow-2xs"
              style={{
                backgroundColor: `${color}1F`,
                borderColor: `${color}4D`,
                color,
              }}
            >
              <Tag className="w-3.5 h-3.5 shrink-0 text-violet-500" style={{ color }} />
              <span>{cat ? getCategoryDisplayName(cat, settings.language) : t.allCategories}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.backButton}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div>
          <h2 className={`text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-neutral-100 ${event.isCompleted ? 'line-through opacity-60' : ''}`}>
            {event.title}
          </h2>
          {event.priority && event.priority !== 'none' && (
            <div className="flex items-center gap-1 mt-1 text-xs text-orange-500 font-semibold">
              <Flag className="w-3.5 h-3.5 fill-current text-orange-500" />
              <span>{t.priorityLabel}: {event.priority}</span>
            </div>
          )}
        </div>

        {/* Date and Time Details */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-md border border-neutral-200/70 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
            <span>{event.startDate} {event.endDate !== event.startDate && `– ${event.endDate}`}</span>
          </div>

          {!event.isAllDay && event.startTime && (
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 font-mono">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>{event.startTime} - {event.endTime}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}

          {event.reminder && event.reminder !== 'none' && (
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <Bell className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                {t.reminderAlert}:{' '}
                {event.reminder === 'at_time'
                  ? t.reminderAtTime
                  : event.reminder === '10m'
                  ? t.reminder10m
                  : event.reminder === '30m'
                  ? t.reminder30m
                  : event.reminder === '1h'
                  ? t.reminder1h
                  : event.reminder === '1d'
                  ? t.reminder1d
                  : event.reminder}
              </span>
            </div>
          )}

          {event.recurrence && event.recurrence !== 'none' && (
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <Repeat className="w-4 h-4 text-teal-500 shrink-0" />
              <span>
                {t.repeat}:{' '}
                {event.recurrence === 'daily'
                  ? t.repeatDaily
                  : event.recurrence === 'weekly'
                  ? t.repeatWeekly
                  : event.recurrence === 'monthly'
                  ? t.repeatMonthly
                  : event.recurrence === 'yearly'
                  ? t.repeatYearly
                  : event.recurrence}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {event.description && (
          <div className="text-xs text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed p-3 rounded-2xl bg-white/55 dark:bg-white/[0.04] border border-neutral-200/60 dark:border-white/10">
            {event.description}
          </div>
        )}

        {/* Checklist */}
        {event.checklist && event.checklist.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-neutral-500 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.checklist}</span>
            </div>
            <div className="space-y-1">
              {event.checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white/60 dark:bg-white/[0.05] text-xs cursor-pointer hover:bg-white/90 dark:hover:bg-white/10"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-400" />
                  )}
                  <span className={item.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                onDelete(event.id);
                onClose();
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              title={t.deleteEvent}
              aria-label={t.deleteEvent}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onDuplicate(event);
                onClose();
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              title={t.duplicateEvent}
              aria-label={t.duplicateEvent}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onStartFocus && !event.isCompleted && (
              <button
                type="button"
                onClick={() => {
                  onStartFocus(event.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-95 transition-all cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{t.pomoStart}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onEdit(event);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-600 text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t.editEvent}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
