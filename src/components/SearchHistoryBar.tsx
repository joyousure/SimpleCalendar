import React from 'react';
import { History, Trash2, X } from 'lucide-react';
import { Language } from '../types/calendar';
import { getSearchHistoryLabels } from '../utils/searchHistory';

interface SearchHistoryBarProps {
  history: string[];
  language: Language;
  onSelectQuery: (query: string) => void;
  onRemoveQuery?: (query: string) => void;
  onClearHistory: () => void;
  variant?: 'default' | 'glass-dark';
  compact?: boolean;
  className?: string;
}

export const SearchHistoryBar: React.FC<SearchHistoryBarProps> = ({
  history,
  language,
  onSelectQuery,
  onRemoveQuery,
  onClearHistory,
  variant = 'default',
  compact = false,
  className = '',
}) => {
  if (!history || history.length === 0) return null;
  const labels = getSearchHistoryLabels(language);
  const isGlassDark = variant === 'glass-dark';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? 'text-[10.5px]' : 'text-[11px]'} ${className}`}>
      <span
        className={`inline-flex items-center gap-1 font-bold shrink-0 ${
          isGlassDark ? 'text-white/75' : 'text-neutral-500 dark:text-neutral-400'
        }`}
      >
        <History className="w-3 h-3 text-blue-500 shrink-0" />
        <span>{labels.recentLabel}:</span>
      </span>

      <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
        {history.map((item) => (
          <span
            key={item}
            className={`inline-flex items-center rounded-full border transition-all max-w-[160px] ${
              isGlassDark
                ? 'bg-white/12 hover:bg-white/20 border-white/15 text-white'
                : 'bg-neutral-100/95 dark:bg-white/[0.07] hover:bg-blue-50 dark:hover:bg-blue-500/15 border-neutral-200/80 dark:border-white/12 text-neutral-700 dark:text-neutral-200 hover:border-blue-400/60'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectQuery(item)}
              className="ps-2.5 pe-1.5 py-0.5 font-medium truncate cursor-pointer text-start"
            >
              {item}
            </button>
            {onRemoveQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveQuery(item);
                }}
                aria-label={`Remove ${item}`}
                className={`pe-1.5 py-0.5 flex items-center justify-center cursor-pointer transition-colors ${
                  isGlassDark ? 'text-white/55 hover:text-white' : 'text-neutral-400 hover:text-rose-500'
                }`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onClearHistory}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer shrink-0 ${
          isGlassDark
            ? 'text-rose-300 hover:text-rose-200 bg-rose-500/15 hover:bg-rose-500/25'
            : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
        }`}
      >
        <Trash2 className="w-2.5 h-2.5 shrink-0" />
        <span>{labels.clearLabel}</span>
      </button>
    </div>
  );
};
