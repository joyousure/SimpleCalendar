export type HapticPattern =
  | 'selection'
  | 'cellTap'
  | 'monthSwipe'
  | 'tab'
  | 'create'
  | 'success'
  | 'warning';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  selection: 7,
  cellTap: [5, 12, 4],
  monthSwipe: [6, 16, 11],
  tab: 9,
  create: [10, 22, 14],
  success: [8, 20, 12],
  warning: [15, 30, 15],
};

/**
 * Triggers a subtle tactile vibration via the Web Vibration API when available.
 * Safe no-op on desktop browsers, unsupported devices, or when disabled/reduced-motion is preferred.
 */
export function triggerHaptic(pattern: HapticPattern = 'selection', enabled = true): void {
  if (!enabled) return;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  try {
    navigator.vibrate(HAPTIC_PATTERNS[pattern]);
  } catch {
    // Ignore vibration permission / hardware errors silently
  }
}
