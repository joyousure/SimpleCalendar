import { useEffect, useId, useRef, useSyncExternalStore } from 'react';
import { triggerHaptic } from './haptics';

export interface SystemBackLayer {
  id: string;
  priority: number;
  seq: number;
  label?: string;
  handler: () => void;
}

export interface EdgeSwipeVisualState {
  active: boolean;
  progress: number;
  ready: boolean;
  isRtl: boolean;
  y: number;
}

export const BACK_PRIORITY = {
  VIEW_DRILLDOWN: 10,
  MAIN_TAB: 20,
  SUB_VIEW: 30,
  MENU_POPOVER: 40,
  MODAL: 50,
  NESTED_MODAL: 60,
  INNER_OVERLAY: 70,
} as const;

const SENTINEL_KEY = '__calendarAppBackSentinel';
const SWIPE_EDGE_PX = 28;
const SWIPE_COMMIT_PX = 72;
const SWIPE_FLING_PX = 42;
const SWIPE_FLING_MS = 260;

let nextSeq = 1;
const layers = new Map<string, SystemBackLayer>();
const stackListeners = new Set<() => void>();
const swipeListeners = new Set<(state: EdgeSwipeVisualState) => void>();

let suppressPopCount = 0;
let suppressResetTimer: number | null = null;
let releaseSentinelTimer: number | null = null;
let postPopResyncTimer: number | null = null;
let lastMouseBackTs = 0;

let hostOptions: { hapticsEnabled: boolean; isRtl: boolean } = {
  hapticsEnabled: true,
  isRtl: false,
};

let currentSwipeVisual: EdgeSwipeVisualState = {
  active: false,
  progress: 0,
  ready: false,
  isRtl: false,
  y: 240,
};

let cachedSortedSnapshot: SystemBackLayer[] = [];

function rebuildSnapshot(): void {
  cachedSortedSnapshot = Array.from(layers.values()).sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.seq - b.seq;
  });
}

function notifyStackListeners(): void {
  rebuildSnapshot();
  stackListeners.forEach((listener) => {
    try {
      listener();
    } catch {}
  });
}

function emitSwipeVisual(next: EdgeSwipeVisualState): void {
  currentSwipeVisual = next;
  swipeListeners.forEach((listener) => {
    try {
      listener(next);
    } catch {}
  });
}

function clearReleaseTimer(): void {
  if (releaseSentinelTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(releaseSentinelTimer);
    releaseSentinelTimer = null;
  }
}

function clearPostPopTimer(): void {
  if (postPopResyncTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(postPopResyncTimer);
    postPopResyncTimer = null;
  }
}

function isSentinelArmed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean((window.history.state as Record<string, unknown> | null)?.[SENTINEL_KEY]);
  } catch {
    return false;
  }
}

function armSentinel(): void {
  if (typeof window === 'undefined') return;
  if (isSentinelArmed()) return;
  try {
    const prevState =
      window.history.state && typeof window.history.state === 'object'
        ? (window.history.state as Record<string, unknown>)
        : {};
    window.history.pushState({ ...prevState, [SENTINEL_KEY]: true }, '');
  } catch {}
}

function scheduleSentinelRelease(): void {
  if (typeof window === 'undefined') return;
  clearReleaseTimer();
  releaseSentinelTimer = window.setTimeout(() => {
    releaseSentinelTimer = null;
    if (layers.size > 0) return;
    if (!isSentinelArmed()) return;

    suppressPopCount += 1;
    if (suppressResetTimer !== null) {
      window.clearTimeout(suppressResetTimer);
    }
    suppressResetTimer = window.setTimeout(() => {
      suppressPopCount = 0;
      suppressResetTimer = null;
    }, 450);

    try {
      window.history.back();
    } catch {
      suppressPopCount = Math.max(0, suppressPopCount - 1);
    }
  }, 64);
}

function syncHistorySentinel(): void {
  if (typeof window === 'undefined') return;
  if (layers.size > 0) {
    clearReleaseTimer();
    armSentinel();
  } else {
    scheduleSentinelRelease();
  }
}

function schedulePostPopResync(): void {
  if (typeof window === 'undefined') return;
  clearPostPopTimer();
  postPopResyncTimer = window.setTimeout(() => {
    postPopResyncTimer = null;
    if (layers.size > 0) {
      armSentinel();
    }
  }, 48);
}

export function getTopSystemBackLayer(): SystemBackLayer | null {
  if (cachedSortedSnapshot.length === 0) return null;
  return cachedSortedSnapshot[cachedSortedSnapshot.length - 1];
}

export function canSystemBack(): boolean {
  return layers.size > 0;
}

export function registerSystemBackLayer(layer: Omit<SystemBackLayer, 'seq'>): void {
  const existing = layers.get(layer.id);
  if (existing) {
    existing.handler = layer.handler;
    existing.priority = layer.priority;
    existing.label = layer.label;
    notifyStackListeners();
    syncHistorySentinel();
    return;
  }

  layers.set(layer.id, {
    ...layer,
    seq: nextSeq++,
  });
  notifyStackListeners();
  syncHistorySentinel();
}

export function unregisterSystemBackLayer(id: string): void {
  if (!layers.has(id)) return;
  layers.delete(id);
  notifyStackListeners();
  syncHistorySentinel();
}

export type SystemBackTriggerSource =
  | 'escape'
  | 'keyboard'
  | 'mouse'
  | 'swipe'
  | 'button'
  | 'popstate';

export function triggerSystemBack(source: SystemBackTriggerSource = 'button'): boolean {
  const top = getTopSystemBackLayer();
  if (!top) return false;

  layers.delete(top.id);
  notifyStackListeners();

  if (source !== 'button') {
    triggerHaptic('selection', hostOptions.hapticsEnabled);
  }

  try {
    top.handler();
  } finally {
    if (source === 'popstate') {
      schedulePostPopResync();
    } else {
      syncHistorySentinel();
    }
  }
  return true;
}

export function subscribeSystemBack(listener: () => void): () => void {
  stackListeners.add(listener);
  return () => {
    stackListeners.delete(listener);
  };
}

export function subscribeEdgeSwipe(listener: (state: EdgeSwipeVisualState) => void): () => void {
  swipeListeners.add(listener);
  listener(currentSwipeVisual);
  return () => {
    swipeListeners.delete(listener);
  };
}

export function getSystemBackDepthSnapshot(): number {
  return cachedSortedSnapshot.length;
}

export function getSystemBackStackSnapshot(): SystemBackLayer[] {
  return cachedSortedSnapshot;
}

export function useSystemBackDepth(): number {
  return useSyncExternalStore(
    subscribeSystemBack,
    getSystemBackDepthSnapshot,
    () => 0
  );
}

/**
 * Registers a layer in the global LIFO system back stack while `active` is true.
 * Higher `priority` always wins; within the same priority, most-recently-opened wins.
 */
export function useSystemBackLayer(
  active: boolean,
  onBack: () => void,
  priority: number = BACK_PRIORITY.MODAL,
  idPrefix: string = 'layer',
  label?: string
): void {
  const reactId = useId();
  const layerId = `${idPrefix}:${reactId}`;
  const handlerRef = useRef(onBack);
  handlerRef.current = onBack;

  useEffect(() => {
    if (!active) {
      unregisterSystemBackLayer(layerId);
      return;
    }

    registerSystemBackLayer({
      id: layerId,
      priority,
      label,
      handler: () => handlerRef.current(),
    });

    return () => {
      unregisterSystemBackLayer(layerId);
    };
  }, [active, layerId, priority, label]);
}

/**
 * Mount once at the root App level to attach global popstate, keyboard,
 * mouse back-button, and leading-edge touch swipe-back handlers.
 */
export function useSystemBackHost(options: { hapticsEnabled: boolean; isRtl: boolean }): void {
  hostOptions = options;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Continuously arm history sentinel so APK/WebView hardware back returns within the app
    armSentinel();
    let lastRootBackAt = 0;

    const handleRootOrLayerBack = (source: SystemBackTriggerSource): boolean => {
      if (canSystemBack()) {
        lastRootBackAt = 0;
        triggerSystemBack(source);
        return true;
      }
      const now = Date.now();
      if (now - lastRootBackAt < 2000) {
        lastRootBackAt = 0;
        return false;
      }
      lastRootBackAt = now;
      schedulePostPopResync();
      window.dispatchEvent(new CustomEvent('app-system-back-at-root'));
      return true;
    };

    const handlePopState = () => {
      if (suppressPopCount > 0) {
        suppressPopCount -= 1;
        if (suppressResetTimer !== null) {
          window.clearTimeout(suppressResetTimer);
          suppressResetTimer = null;
        }
        schedulePostPopResync();
        return;
      }

      if (canSystemBack()) {
        lastRootBackAt = 0;
        triggerSystemBack('popstate');
      } else {
        const now = Date.now();
        if (now - lastRootBackAt >= 2000) {
          lastRootBackAt = now;
          schedulePostPopResync();
          window.dispatchEvent(new CustomEvent('app-system-back-at-root'));
        }
      }
    };

    const handleHardwareBackButton = (e: Event) => {
      if (handleRootOrLayerBack('popstate')) {
        e.preventDefault?.();
        e.stopPropagation?.();
      }
    };

    (window as unknown as {
      __handleSystemBack?: () => boolean;
      __canAppSystemBack?: () => boolean;
    }).__handleSystemBack = () => handleRootOrLayerBack('popstate');
    (window as unknown as {
      __canAppSystemBack?: () => boolean;
    }).__canAppSystemBack = () => canSystemBack();

    document.addEventListener('backbutton', handleHardwareBackButton);
    window.addEventListener('capacitorBackButton', handleHardwareBackButton);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;

      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toUpperCase();
      const isEditable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        Boolean(target?.isContentEditable);

      if (e.key === 'BrowserBack') {
        e.preventDefault();
        e.stopPropagation();
        handleRootOrLayerBack('keyboard');
        return;
      }

      const isAltBack = e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey &&
        (hostOptions.isRtl ? e.key === 'ArrowRight' : e.key === 'ArrowLeft');
      if (isAltBack && !isEditable) {
        if (canSystemBack()) {
          e.preventDefault();
          e.stopPropagation();
          triggerSystemBack('keyboard');
        }
        return;
      }

      if (e.key === 'Escape') {
        if (tag === 'SELECT' || target?.closest('[data-no-escape-back="true"]')) {
          return;
        }
        if (canSystemBack()) {
          e.preventDefault();
          e.stopPropagation();
          triggerSystemBack('escape');
        }
      }
    };

    const handleMouseBack = (e: MouseEvent) => {
      if (e.button !== 3) return;
      if (!canSystemBack()) return;
      const now = Date.now();
      e.preventDefault();
      if (now - lastMouseBackTs < 80) return;
      lastMouseBackTs = now;
      triggerSystemBack('mouse');
    };

    // Edge-swipe gesture state
    let tracking = false;
    let lockedSwipe = false;
    let wasReady = false;
    let startX = 0;
    let startY = 0;
    let startTs = 0;
    let lastDx = 0;

    const resetSwipe = () => {
      if (lockedSwipe || currentSwipeVisual.active) {
        emitSwipeVisual({
          active: false,
          progress: 0,
          ready: false,
          isRtl: hostOptions.isRtl,
          y: startY || 240,
        });
      }
      tracking = false;
      lockedSwipe = false;
      wasReady = false;
      lastDx = 0;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !canSystemBack()) {
        tracking = false;
        return;
      }
      const touch = e.touches[0];
      const target = e.target as Element | null;
      if (target?.closest('canvas, [data-no-back-swipe="true"], input[type="range"]')) {
        tracking = false;
        return;
      }

      const nearEdge = hostOptions.isRtl
        ? touch.clientX >= window.innerWidth - SWIPE_EDGE_PX
        : touch.clientX <= SWIPE_EDGE_PX;

      if (!nearEdge) {
        tracking = false;
        return;
      }

      tracking = true;
      lockedSwipe = false;
      wasReady = false;
      startX = touch.clientX;
      startY = touch.clientY;
      startTs = Date.now();
      lastDx = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = hostOptions.isRtl ? startX - touch.clientX : touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);

      if (!lockedSwipe) {
        if (dx < 0 || (dx < 14 && dy > 16)) {
          tracking = false;
          return;
        }
        if (dx >= 14 && dx > dy * 1.15) {
          lockedSwipe = true;
        } else {
          return;
        }
      }

      lastDx = Math.max(0, dx);
      const ready = lastDx >= SWIPE_COMMIT_PX;
      if (ready && !wasReady) {
        triggerHaptic('selection', hostOptions.hapticsEnabled);
      }
      wasReady = ready;

      emitSwipeVisual({
        active: true,
        progress: Math.min(1, lastDx / SWIPE_COMMIT_PX),
        ready,
        isRtl: hostOptions.isRtl,
        y: Math.max(72, Math.min(window.innerHeight - 72, touch.clientY)),
      });
    };

    const handleTouchEnd = () => {
      if (!tracking) return;
      const elapsed = Date.now() - startTs;
      const shouldCommit =
        lockedSwipe &&
        (lastDx >= SWIPE_COMMIT_PX || (lastDx >= SWIPE_FLING_PX && elapsed <= SWIPE_FLING_MS));
      resetSwipe();
      if (shouldCommit) {
        triggerSystemBack('swipe');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('auxclick', handleMouseBack, true);
    window.addEventListener('mouseup', handleMouseBack, true);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', resetSwipe, { passive: true });

    return () => {
      clearReleaseTimer();
      clearPostPopTimer();
      document.removeEventListener('backbutton', handleHardwareBackButton);
      window.removeEventListener('capacitorBackButton', handleHardwareBackButton);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('auxclick', handleMouseBack, true);
      window.removeEventListener('mouseup', handleMouseBack, true);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', resetSwipe);
    };
  }, []);
}
