import { useEffect } from 'react';
import type { AppSettings } from '../types/calendar';

export function isSmartTvEnvironment(settings?: Partial<AppSettings>): boolean {
  if (settings && (settings as { tvMode?: boolean }).tvMode) return true;
  if (typeof window === 'undefined') return false;

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const tvUaPattern =
    /(SMART-TV|SmartTV|GoogleTV|Android TV|AFTB|AFTS|AFTM|Tizen|Web0S|BRAVIA|Shield|MIBOX|MiTV|Roku|AppleTV)/i;
  if (tvUaPattern.test(ua)) return true;

  // Large 10-foot viewport without coarse touch pointer (e.g. Pixel Tablet docked/TV or Smart TV browser)
  const wideScreen = window.innerWidth >= 1280 && window.innerHeight >= 720;
  const coarseOnly =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const noHover =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none)').matches;

  // Large non-touch screen acting in remote/TV mode if explicitly queried by keyboard arrow use
  return wideScreen && !coarseOnly && noHover;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled]):not([aria-hidden="true"])',
  'a[href]:not([aria-hidden="true"])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
  '[role="button"]:not([aria-disabled="true"])',
  '[role="tab"]:not([aria-disabled="true"])',
].join(',');

function getVisibleFocusables(root: ParentNode = document): HTMLElement[] {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return candidates.filter((el) => {
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

function getActiveScope(): ParentNode {
  const modals = Array.from(
    document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"], [data-spatial-scope="true"]')
  ).filter((el) => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  return modals.length > 0 ? modals[modals.length - 1] : document;
}

function findNextSpatialTarget(
  current: HTMLElement,
  direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
  candidates: HTMLElement[]
): HTMLElement | null {
  const curRect = current.getBoundingClientRect();
  const cx = curRect.left + curRect.width / 2;
  const cy = curRect.top + curRect.height / 2;

  let best: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const el of candidates) {
    if (el === current) continue;
    const rect = el.getBoundingClientRect();
    const tx = rect.left + rect.width / 2;
    const ty = rect.top + rect.height / 2;
    const dx = tx - cx;
    const dy = ty - cy;

    let valid = false;
    let primaryDist = 0;
    let crossDist = 0;

    if (direction === 'ArrowRight') {
      valid = dx > 6;
      primaryDist = dx;
      crossDist = Math.abs(dy);
    } else if (direction === 'ArrowLeft') {
      valid = dx < -6;
      primaryDist = -dx;
      crossDist = Math.abs(dy);
    } else if (direction === 'ArrowDown') {
      valid = dy > 6;
      primaryDist = dy;
      crossDist = Math.abs(dx);
    } else if (direction === 'ArrowUp') {
      valid = dy < -6;
      primaryDist = -dy;
      crossDist = Math.abs(dx);
    }

    if (!valid) continue;

    // Prioritize items aligned on the travel axis
    const score = primaryDist + crossDist * 2.4;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }

  return best;
}

export interface SpatialNavActions {
  onBack?: () => void;
  onSearch?: () => void;
  onVoice?: () => void;
}

/**
 * Enables seamless keyboard, TV D-pad remote, touch, mouse, and voice input orchestration.
 * Supports ArrowUp/Down/Left/Right spatial focus navigation across cards, tabs, and dialogs,
 * plus Enter/Select and Escape/Back remote keys.
 */
export function useSpatialNavigation(actions?: SpatialNavActions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTextInput =
        tagName === 'textarea' ||
        (tagName === 'input' &&
          !['button', 'checkbox', 'radio', 'submit', 'reset', 'range'].includes(
            (target as HTMLInputElement).type
          )) ||
        Boolean(target?.isContentEditable);

      // Global search shortcut (Ctrl/Cmd + K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        actions?.onSearch?.();
        return;
      }

      // Voice shortcut (Ctrl/Cmd + Shift + V or MediaTrack/Microphone remote key)
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') ||
        e.key === 'MicrophoneToggle'
      ) {
        e.preventDefault();
        actions?.onVoice?.();
        return;
      }

      // Do not hijack typing inside inputs/textareas/selects
      if (isTextInput) {
        if (e.key === 'Escape') {
          target?.blur();
        }
        return;
      }

      if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        // Range sliders handle Left/Right natively
        if (tagName === 'input' && (target as HTMLInputElement).type === 'range') {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') return;
        }

        const scope = getActiveScope();
        const focusables = getVisibleFocusables(scope);
        if (focusables.length === 0) return;

        const active =
          document.activeElement instanceof HTMLElement &&
          focusables.includes(document.activeElement)
            ? document.activeElement
            : null;

        if (!active) {
          e.preventDefault();
          focusables[0].focus();
          return;
        }

        const next = findNextSpatialTarget(active, e.key, focusables);
        if (next) {
          e.preventDefault();
          next.focus({ preventScroll: false });
          next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
        return;
      }

      // Remote OK / Select support on non-native interactive roles
      if (e.key === 'Enter' || e.key === 'Select' || e.key === ' ') {
        const active = document.activeElement as HTMLElement | null;
        if (
          active &&
          (active.getAttribute('role') === 'button' || active.getAttribute('role') === 'tab') &&
          tagName !== 'button' &&
          tagName !== 'a'
        ) {
          e.preventDefault();
          active.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
