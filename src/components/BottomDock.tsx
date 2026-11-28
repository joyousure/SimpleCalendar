import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StickyNote,
  Plus,
  Heart,
  Scale,
  Compass,
  X,
} from 'lucide-react';
import { AppSettings } from '../types/calendar';
import { getTranslation, getExtraLabels, isRtlLanguage } from '../utils/i18n';
import { triggerHaptic } from '../utils/haptics';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';

export type MainNavTab = 'calendar' | 'agenda' | 'focus' | 'tools' | 'settings';

interface BottomDockProps {
  currentTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  onNewEvent?: () => void;
  onOpenKeepNotes?: () => void;
  onOpenHealth?: () => void;
  onOpenLaws?: () => void;
  onOpenExplore?: () => void;
  settings: AppSettings;
}

interface DockIconProps {
  active: boolean;
  className?: string;
}

const CalendarDockIcon: React.FC<DockIconProps> = ({ active, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M8 3.2V6.2" />
    <path d="M16 3.2V6.2" />
    <path d="M3.5 9.5H20.5" />
    <circle cx="8" cy="13" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="12" cy="13" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="16" cy="13" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="8" cy="16.5" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="12" cy="16.5" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="16" cy="16.5" r="0.85" fill="currentColor" stroke="none" />
  </svg>
);

const TodoDockIcon: React.FC<DockIconProps> = ({ active, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M19 12.2V17.2C19 18.75 17.75 20 16.2 20H6.8C5.25 20 4 18.75 4 17.2V7.8C4 6.25 5.25 5 6.8 5H13.5" />
    <path d="M8.8 11.8L12 15L20.2 5.4" />
  </svg>
);

const FocusDockIcon: React.FC<DockIconProps> = ({ active, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 1.9 : 1.65}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M20.2 12A8.2 8.2 0 1 1 12 3.8" />
    <path d="M16.8 12A4.8 4.8 0 1 1 12 7.2" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <path d="M12 12L19.8 4.2" />
    <path d="M16.6 4.2H19.8V7.4" />
  </svg>
);

const ToolsDockIcon: React.FC<DockIconProps> = ({ active, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 1.95 : 1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M12 4L4.2 8.2L12 12.4L19.8 8.2L12 4Z" />
    <path d="M4.2 12.2L12 16.4L19.8 12.2" />
    <path d="M4.2 16L12 20.2L19.8 16" />
  </svg>
);

export const BottomDock: React.FC<BottomDockProps> = ({
  currentTab,
  onTabChange,
  onNewEvent,
  onOpenKeepNotes,
  onOpenHealth,
  onOpenLaws,
  onOpenExplore,
  settings,
}) => {
  const t = getTranslation(settings.language);
  const ui = getExtraLabels(settings.language);
  const isRtl = isRtlLanguage(settings.language);
  const hapticsEnabled = settings.enableHaptics !== false;

  const [isRadialOpen, setIsRadialOpen] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);

  // Interactive iOS tab-bar horizontal scrub state
  const trackRef = useRef<HTMLDivElement | null>(null);
  const scrubPointerIdRef = useRef<number | null>(null);
  const scrubStartRef = useRef<{ x: number; y: number } | null>(null);
  const isScrubbingRef = useRef(false);
  const suppressTabClickRef = useRef(false);
  const lastScrubIdxRef = useRef<number | null>(null);
  const [scrubFraction, setScrubFraction] = useState<number | null>(null);
  const [scrubHoverIdx, setScrubHoverIdx] = useState<number | null>(null);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearHoldTimer();
  }, [clearHoldTimer]);

  useSystemBackLayer(
    isRadialOpen,
    () => setIsRadialOpen(false),
    BACK_PRIORITY.MENU_POPOVER,
    'bottom-dock-radial'
  );

  const handleFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    clearHoldTimer();
    suppressNextClickRef.current = false;
    startPointRef.current = { x: e.clientX, y: e.clientY };

    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      suppressNextClickRef.current = true;
      triggerHaptic('selection', hapticsEnabled);
      setIsRadialOpen(true);
    }, 360);
  };

  const handleFabPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!startPointRef.current || holdTimerRef.current === null) return;
    const dx = e.clientX - startPointRef.current.x;
    const dy = e.clientY - startPointRef.current.y;
    if (Math.hypot(dx, dy) > 10) {
      clearHoldTimer();
    }
  };

  const handleFabPointerUpOrCancel = () => {
    clearHoldTimer();
    startPointRef.current = null;
  };

  const handleFabClick = () => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    if (isRadialOpen) {
      setIsRadialOpen(false);
      return;
    }
    triggerHaptic('selection', hapticsEnabled);
    onNewEvent?.();
  };

  const tabs: {
    id: MainNavTab;
    label: string;
    icon: React.ComponentType<DockIconProps>;
  }[] = [
    { id: 'calendar', label: t.navCalendar, icon: CalendarDockIcon },
    { id: 'agenda', label: t.navAgenda, icon: TodoDockIcon },
    { id: 'focus', label: t.navFocus || t.pomoFocusSession, icon: FocusDockIcon },
    { id: 'tools', label: t.navTools, icon: ToolsDockIcon },
  ];

  const activeIndex = tabs.findIndex((tab) => tab.id === currentTab);
  const displayIndex = scrubFraction !== null ? scrubFraction : activeIndex;
  const highlightedIndex = scrubHoverIdx !== null ? scrubHoverIdx : activeIndex;

  const computeScrubMetrics = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return null;
      const relX = (clientX - rect.left) / rect.width;
      const directional = isRtl ? 1 - relX : relX;
      const clampedFrac = Math.max(0, Math.min(tabs.length - 1, directional * tabs.length - 0.5));
      const nearestIdx = Math.max(0, Math.min(tabs.length - 1, Math.round(clampedFrac)));
      return { clampedFrac, nearestIdx };
    },
    [isRtl, tabs.length]
  );

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    scrubPointerIdRef.current = e.pointerId;
    scrubStartRef.current = { x: e.clientX, y: e.clientY };
    isScrubbingRef.current = false;
    suppressTabClickRef.current = false;
  };

  const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scrubPointerIdRef.current !== e.pointerId || !scrubStartRef.current) return;
    const dx = e.clientX - scrubStartRef.current.x;
    const dy = e.clientY - scrubStartRef.current.y;

    if (!isScrubbingRef.current) {
      if (Math.abs(dx) < 8 || Math.abs(dy) > Math.abs(dx) * 1.3) return;
      isScrubbingRef.current = true;
      suppressTabClickRef.current = true;
      lastScrubIdxRef.current = activeIndex >= 0 ? activeIndex : 0;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }

    const metrics = computeScrubMetrics(e.clientX);
    if (!metrics) return;
    setScrubFraction(metrics.clampedFrac);
    setScrubHoverIdx(metrics.nearestIdx);

    if (lastScrubIdxRef.current !== metrics.nearestIdx) {
      lastScrubIdxRef.current = metrics.nearestIdx;
      triggerHaptic('selection', hapticsEnabled);
    }
  };

  const finishScrub = (e: React.PointerEvent<HTMLDivElement>, commit: boolean) => {
    if (scrubPointerIdRef.current !== e.pointerId) return;
    const wasScrubbing = isScrubbingRef.current;
    const metrics = wasScrubbing && commit ? computeScrubMetrics(e.clientX) : null;

    scrubPointerIdRef.current = null;
    scrubStartRef.current = null;
    isScrubbingRef.current = false;
    lastScrubIdxRef.current = null;
    setScrubFraction(null);
    setScrubHoverIdx(null);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    if (wasScrubbing && metrics) {
      const targetTab = tabs[metrics.nearestIdx];
      if (targetTab) {
        onTabChange(targetTab.id);
      }
      window.setTimeout(() => {
        suppressTabClickRef.current = false;
      }, 60);
    } else {
      suppressTabClickRef.current = false;
    }
  };

  const scrollActiveViewToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      const scrollable = mainEl.querySelector<HTMLElement>('.overflow-y-auto');
      if (scrollable && scrollable.scrollTop > 0) {
        scrollable.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabActivate = (tabId: MainNavTab) => {
    if (suppressTabClickRef.current) {
      suppressTabClickRef.current = false;
      return;
    }
    if (tabId === currentTab) {
      scrollActiveViewToTop();
    }
    onTabChange(tabId);
  };

  const radialItems = [
    {
      id: 'notes',
      label: ui.fabQuickNotes,
      icon: StickyNote,
      accent: 'bg-amber-400 text-neutral-950 shadow-[0_8px_22px_rgba(245,158,11,0.35)]',
      offsetX: isRtl ? 6 : -6,
      offsetY: -174,
      delay: '0ms',
      action: () => onOpenKeepNotes?.(),
    },
    {
      id: 'laws',
      label: ui.fabLaws,
      icon: Scale,
      accent: 'bg-sky-500 text-white shadow-[0_8px_22px_rgba(14,165,233,0.35)]',
      offsetX: isRtl ? 74 : -74,
      offsetY: -136,
      delay: '35ms',
      action: () => onOpenLaws?.(),
    },
    {
      id: 'health',
      label: ui.fabHealth,
      icon: Heart,
      accent: 'bg-rose-500 text-white shadow-[0_8px_22px_rgba(244,63,94,0.35)]',
      offsetX: isRtl ? 124 : -124,
      offsetY: -78,
      delay: '70ms',
      action: () => onOpenHealth?.(),
    },
    {
      id: 'explore',
      label: ui.fabExplore,
      icon: Compass,
      accent: 'bg-indigo-600 text-white shadow-[0_8px_22px_rgba(79,70,229,0.35)]',
      offsetX: isRtl ? 148 : -148,
      offsetY: -12,
      delay: '105ms',
      action: () => onOpenExplore?.(),
    },
  ];

  const isScrubbing = scrubFraction !== null;

  return (
    <>
      {/* Radial Quick Menu Backdrop */}
      {isRadialOpen && (
        <div
          onClick={() => setIsRadialOpen(false)}
          className="fixed inset-0 z-40 bg-black/25 dark:bg-black/45 backdrop-blur-xs animate-modal-backdrop"
          aria-hidden="true"
        />
      )}

      {/* Radial Quick Action Arc Anchored to FAB */}
      {isRadialOpen && (
        <div
          role="menu"
          aria-label={t.createEvent}
          className={`fixed bottom-[86px] sm:bottom-[96px] z-50 pointer-events-none ${
            isRtl ? 'left-4 sm:left-6' : 'right-4 sm:right-6'
          }`}
        >
          <div className="relative w-12 h-12 sm:w-[50px] sm:h-[50px]">
            {radialItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  style={{
                    transform: `translate3d(${item.offsetX}px, ${item.offsetY}px, 0)`,
                  }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-auto"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      triggerHaptic('selection', hapticsEnabled);
                      setIsRadialOpen(false);
                      item.action();
                    }}
                    style={{ animationDelay: item.delay }}
                    className={`group relative w-12 h-12 rounded-full ${item.accent} flex items-center justify-center border border-white/45 dark:border-white/25 active:scale-95 transition-transform cursor-pointer animate-radial-item`}
                    aria-label={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    <span
                      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-white/15 shadow-md backdrop-blur-xl ${
                        isRtl ? 'left-full ml-2' : 'right-full mr-2'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Circular Liquid-Glass "+" FAB (Short Tap: New Event | Long Press: Radial Quick Menu) */}
      <button
        type="button"
        onPointerDown={handleFabPointerDown}
        onPointerMove={handleFabPointerMove}
        onPointerUp={handleFabPointerUpOrCancel}
        onPointerCancel={handleFabPointerUpOrCancel}
        onContextMenu={(e) => e.preventDefault()}
        onClick={handleFabClick}
        className={`fixed bottom-[86px] sm:bottom-[96px] z-50 w-12 h-12 sm:w-[50px] sm:h-[50px] rounded-full flex items-center justify-center active:scale-92 transition-all cursor-pointer touch-none select-none backdrop-blur-2xl backdrop-saturate-180 ${
          isRtl ? 'left-4 sm:left-6' : 'right-4 sm:right-6'
        } ${
          isRadialOpen
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-[0_12px_32px_rgba(0,0,0,0.28)] rotate-45 border border-white/20'
            : 'bg-white/84 hover:bg-white/95 dark:bg-neutral-900/82 dark:hover:bg-neutral-800/90 text-neutral-900 dark:text-white border border-black/[0.07] dark:border-white/[0.15] shadow-[0_8px_24px_rgba(0,0,0,0.10),0_2px_6px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.16)]'
        }`}
        title={t.createEvent}
        aria-label={t.createEvent}
        aria-expanded={isRadialOpen}
      >
        {isRadialOpen ? (
          <X className="w-5 h-5 stroke-[2.2] -rotate-45" />
        ) : (
          <Plus className="w-5 h-5 stroke-[2.1]" />
        )}
      </button>

      {/* Native iOS Floating Capsule Liquid-Glass Tab Dock */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 pointer-events-none px-3.5 sm:px-6 pb-[max(0.7rem,env(safe-area-inset-bottom))] sm:pb-5 select-none"
      >
        <div className="pointer-events-auto mx-auto w-full max-w-[440px] sm:max-w-[480px] md:max-w-[540px] lg:max-w-[580px] rounded-full p-1.5 bg-white/82 dark:bg-neutral-900/82 [.amoled-mode_&]:bg-neutral-950/92 backdrop-blur-2xl backdrop-saturate-180 border border-black/[0.06] dark:border-white/[0.12] [.amoled-mode_&]:border-white/[0.14] shadow-[0_12px_36px_rgba(0,0,0,0.09),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.96)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.52),inset_0_1px_1px_rgba(255,255,255,0.14)] transition-colors">
          <div
            ref={trackRef}
            role="tablist"
            onPointerDown={handleTrackPointerDown}
            onPointerMove={handleTrackPointerMove}
            onPointerUp={(e) => finishScrub(e, true)}
            onPointerCancel={(e) => finishScrub(e, false)}
            className="relative grid grid-cols-4 items-center touch-pan-y"
          >
            {/* Interactive Liquid-Glass Selection Pill */}
            {displayIndex >= 0 && (
              <div
                aria-hidden="true"
                style={{
                  transform: `translate3d(${(isRtl ? -1 : 1) * displayIndex * 100}%, 0, 0)`,
                }}
                className={`pointer-events-none absolute inset-y-0 ${
                  isRtl ? 'right-0' : 'left-0'
                } w-1/4 ${
                  isScrubbing
                    ? 'transition-none'
                    : 'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
                }`}
              >
                <div
                  className={`w-full h-full rounded-full transition-transform duration-150 ${
                    isScrubbing
                      ? 'scale-[1.04] bg-black/[0.09] dark:bg-white/[0.20] border border-white/80 dark:border-white/25 shadow-[0_6px_18px_rgba(0,0,0,0.10),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.22)]'
                      : 'scale-100 bg-black/[0.065] dark:bg-white/[0.14] border border-white/60 dark:border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.88),0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),0_2px_8px_rgba(0,0,0,0.25)]'
                  }`}
                />
              </div>
            )}

            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isSelected = highlightedIndex === idx;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={currentTab === tab.id}
                  onClick={() => handleTabActivate(tab.id)}
                  className="relative z-10 group flex flex-col items-center justify-center min-h-[50px] py-1.5 px-2 rounded-full cursor-pointer active:scale-[0.94] transition-transform duration-150"
                >
                  <span
                    className={`flex items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isSelected
                        ? 'scale-[1.06] text-neutral-950 dark:text-white'
                        : 'text-neutral-700 dark:text-neutral-400 group-hover:text-neutral-950 dark:group-hover:text-neutral-200'
                    }`}
                  >
                    <Icon active={isSelected} className="w-[21px] h-[21px]" />
                  </span>
                  <span
                    className={`text-[11px] tracking-tight mt-0.5 leading-tight whitespace-nowrap truncate max-w-full transition-colors duration-150 ${
                      isSelected
                        ? 'font-semibold text-neutral-950 dark:text-white'
                        : 'font-medium text-neutral-700 dark:text-neutral-400 group-hover:text-neutral-950 dark:group-hover:text-neutral-200'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};
