import { flushSync } from 'react-dom';

type ViewTransitionLike = {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionLike;
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export type TransitionDirection = 'forward' | 'back' | 'tab' | 'modal' | 'none';

let activeTransitionToken = 0;
let isInsideTransitionCallback = false;

/**
 * Runs a state update inside a native View Transition (iOS 27 spring shared-element choreography)
 * with graceful fallback when `startViewTransition` is unavailable, nested, or reduced-motion is enabled.
 */
export function runSharedTransition(
  update: () => void,
  options?: {
    direction?: TransitionDirection;
    sharedElement?: HTMLElement | null;
    sharedName?: string;
  }
): void {
  const direction = options?.direction ?? 'tab';

  if (
    typeof document === 'undefined' ||
    direction === 'none' ||
    isInsideTransitionCallback ||
    prefersReducedMotion()
  ) {
    update();
    return;
  }

  const doc = document as DocumentWithViewTransition;
  if (typeof doc.startViewTransition !== 'function') {
    update();
    return;
  }

  const token = ++activeTransitionToken;
  const root = document.documentElement;
  root.dataset.transitionDir = direction;

  const targetEl = options?.sharedElement ?? null;
  const sharedName = options?.sharedName;
  const prevName = targetEl?.style.viewTransitionName ?? '';

  if (targetEl && sharedName) {
    targetEl.style.viewTransitionName = sharedName;
  }

  const cleanup = () => {
    if (token === activeTransitionToken) {
      delete root.dataset.transitionDir;
    }
    if (targetEl && sharedName && targetEl.style.viewTransitionName === sharedName) {
      targetEl.style.viewTransitionName = prevName;
    }
  };

  try {
    const transition = doc.startViewTransition(() => {
      isInsideTransitionCallback = true;
      try {
        flushSync(() => {
          update();
        });
      } finally {
        isInsideTransitionCallback = false;
      }
    });

    Promise.resolve(transition.ready).catch(() => {});
    Promise.resolve(transition.updateCallbackDone).catch(() => {});
    Promise.resolve(transition.finished).then(cleanup, cleanup);
  } catch {
    isInsideTransitionCallback = false;
    cleanup();
    update();
  }
}

export function sharedTransitionStyle(name: string): { viewTransitionName: string } {
  return { viewTransitionName: name };
}
