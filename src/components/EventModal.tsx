import React, { useState, useEffect } from 'react';
import { CalendarEvent, EventCategory, AppSettings, RecurrenceType, ReminderOffset, ChecklistItem } from '../types/calendar';
import { getTranslation } from '../utils/i18n';
import { getCategoryDisplayName } from '../utils/storage';
import { toDateString } from '../utils/dateUtils';
import { X, Plus, Trash2, Calendar, Clock, MapPin, Tag, Flag, CheckSquare, Bell, Repeat } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  initialEvent?: Partial<CalendarEvent>;
  categories: EventCategory[];
  settings: AppSettings;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialEvent,
  categories,
  settings,
}) => {
  const t = getTranslation(settings.language);
  const todayStr = toDateString(new Date());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-work');
  const [startDate, setStartDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(todayStr);
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [reminder, setReminder] = useState<ReminderOffset>('10m');
  const [priority, setPriority] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title || '');
      setDescription(initialEvent.description || '');
      setLocation(initialEvent.location || '');
      setCategoryId(initialEvent.categoryId || categories[0]?.id || 'cat-work');
      setStartDate(initialEvent.startDate || todayStr);
      setStartTime(initialEvent.startTime || '09:00');
      setEndDate(initialEvent.endDate || initialEvent.startDate || todayStr);
      setEndTime(initialEvent.endTime || '10:00');
      setIsAllDay(Boolean(initialEvent.isAllDay));
      setRecurrence(initialEvent.recurrence || 'none');
      setReminder(initialEvent.reminder || '10m');
      setPriority(initialEvent.priority || 'none');
      setChecklist(initialEvent.checklist ? [...initialEvent.checklist] : []);
    } else {
      setTitle('');
      setDescription('');
      setLocation('');
      setCategoryId(categories[0]?.id || 'cat-work');
      setStartDate(todayStr);
      setStartTime('09:00');
      setEndDate(todayStr);
      setEndTime('10:00');
      setIsAllDay(false);
      setRecurrence('none');
      setReminder('10m');
      setPriority('none');
      setChecklist([]);
    }
  }, [initialEvent, categories, todayStr, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const event: CalendarEvent = {
      id: initialEvent?.id || 'event-' + Date.now(),
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      categoryId,
      startDate,
      startTime: isAllDay ? undefined : startTime,
      endDate: endDate >= startDate ? endDate : startDate,
      endTime: isAllDay ? undefined : endTime,
      isAllDay,
      recurrence,
      reminder,
      priority,
      checklist,
      isCompleted: initialEvent?.isCompleted || false,
      createdAt: initialEvent?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(event);
    onClose();
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([
      ...checklist,
      { id: 'item-' + Date.now(), text: newChecklistText.trim(), completed: false },
    ]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 bg-black/55 backdrop-blur-md select-none overflow-y-auto animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-3xl bg-white/88 dark:bg-neutral-900/88 backdrop-blur-2xl border border-white/80 dark:border-white/15 shadow-2xl p-6 space-y-4 max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto animate-modal-sheet"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-neutral-200/70 dark:border-white/10 pb-3">
          <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
            {initialEvent?.id ? t.editEvent : t.createEvent}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.cancel}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title Input */}
        <div>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.eventTitlePlaceholder}
            className="w-full p-3 rounded-2xl bg-white/75 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/12 text-sm font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Frosted Glass Tags */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-neutral-500 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-violet-500" />
            <span>{t.category}</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => {
              const isSelected = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border transition-all cursor-pointer ${
                    isSelected
                      ? 'shadow-xs scale-[1.02]'
                      : 'bg-white/60 dark:bg-white/[0.05] border-neutral-200/70 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-white/90'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${c.color}22`,
                          borderColor: `${c.color}66`,
                          color: c.color,
                        }
                      : undefined
                  }
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span>{getCategoryDisplayName(c, settings.language)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority, Reminder & Recurrence */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-neutral-500 flex items-center gap-1 mb-1">
              <Flag className="w-3.5 h-3.5 text-orange-500" />
              <span>{t.priorityLabel}</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'none' | 'low' | 'medium' | 'high')}
              className="w-full p-2 rounded-xl bg-white/75 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/12 text-xs text-neutral-900 dark:text-neutral-100"
            >
              <option value="none">{t.priorityNone}</option>
              <option value="low">{t.priorityLow}</option>
              <option value="medium">{t.priorityMedium}</option>
              <option value="high">{t.priorityHigh}</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-500 flex items-center gap-1 mb-1">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.reminderAlert}</span>
            </label>
            <select
              value={reminder}
              onChange={(e) => setReminder(e.target.value as ReminderOffset)}
              className="w-full p-2 rounded-xl bg-white/75 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/12 text-xs text-neutral-900 dark:text-neutral-100"
            >
              <option value="none">{t.reminderNone}</option>
              <option value="at_time">{t.reminderAtTime}</option>
              <option value="10m">{t.reminder10m}</option>
              <option value="30m">{t.reminder30m}</option>
              <option value="1h">{t.reminder1h}</option>
              <option value="1d">{t.reminder1d}</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-500 flex items-center gap-1 mb-1">
              <Repeat className="w-3.5 h-3.5 text-teal-500" />
              <span>{t.repeat}</span>
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
              className="w-full p-2 rounded-xl bg-white/75 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/12 text-xs text-neutral-900 dark:text-neutral-100"
            >
              <option value="none">{t.repeatNone}</option>
              <option value="daily">{t.repeatDaily}</option>
              <option value="weekly">{t.repeatWeekly}</option>
              <option value="monthly">{t.repeatMonthly}</option>
              <option value="yearly">{t.repeatYearly}</option>
            </select>
          </div>
        </div>

        {/* Date and Time */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-md border border-neutral-200/70 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t.allDay}</span>
            </span>
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded text-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>{t.startDate}</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 rounded-xl bg-white/85 dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/12 text-xs font-mono"
              />
            </div>
            {!isAllDay && (
              <div>
                <label className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t.startTime}</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white/85 dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/12 text-xs font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Location & Notes */}
        <div className="space-y-3">
          <div className="relative">
            <MapPin className="w-4 h-4 text-rose-500 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t.locationPlaceholder}
              className="w-full ps-9 pe-3 py-2.5 rounded-2xl bg-white/75 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/12 text-xs text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.notesPlaceholder}
            rows={2}
            className="w-full p-2.5 rounded-2xl bg-white/75 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/12 text-xs text-neutral-900 dark:text-neutral-100"
          />
        </div>

        {/* Subtasks / Checklist */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-neutral-500 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.checklist}</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddChecklistItem();
                }
              }}
              placeholder={t.addChecklistItem}
              className="flex-1 p-2 rounded-xl bg-white/75 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/12 text-xs text-neutral-900 dark:text-neutral-100"
            />
            <button
              type="button"
              onClick={handleAddChecklistItem}
              className="px-3 py-2 rounded-xl bg-neutral-200/80 dark:bg-white/12 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.add}</span>
            </button>
          </div>

          {checklist.length > 0 && (
            <div className="space-y-1 pt-1">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                  <span>{item.text}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(item.id)}
                    className="text-neutral-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-200/80 dark:border-neutral-800">
          {initialEvent?.id && onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete(initialEvent.id!);
                onClose();
              }}
              className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold"
            >
              {t.deleteEvent}
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              {t.saveChanges}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
