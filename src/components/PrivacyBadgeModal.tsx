import React from 'react';
import { AppSettings } from '../types/calendar';
import { getTranslation, getExtraLabels } from '../utils/i18n';
import { ShieldCheck, HardDrive, WifiOff, EyeOff, X } from 'lucide-react';

interface PrivacyBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  eventCount: number;
}

export const PrivacyBadgeModal: React.FC<PrivacyBadgeModalProps> = ({
  isOpen,
  onClose,
  settings,
  eventCount,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 bg-black/60 backdrop-blur-md select-none overflow-y-auto animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-5 sm:p-6 space-y-5 animate-modal-sheet" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {t.privacyGuaranteeTitle}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold">
                {t.privacyGuaranteeSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.cancel}
            className="w-10 h-10 -m-1.5 flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70">
            <WifiOff className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-neutral-900 dark:text-neutral-100">{t.privacyZeroRequestsTitle}</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">{t.privacyZeroRequestsDesc}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70">
            <HardDrive className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-neutral-900 dark:text-neutral-100">{t.privacyLocalStorageTitle}</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                {t.privacyLocalStorageDesc} ({ui.storedRecordsLabel.replace('{count}', String(eventCount))})
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70">
            <EyeOff className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-neutral-900 dark:text-neutral-100">{t.privacyNoTrackingTitle}</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">{t.privacyNoTrackingDesc}</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold shadow-md"
        >
          {t.privacyUnderstood}
        </button>
      </div>
    </div>
  );
};
