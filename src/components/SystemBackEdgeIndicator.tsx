import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EdgeSwipeVisualState, subscribeEdgeSwipe } from '../utils/systemBack';

export const SystemBackEdgeIndicator: React.FC = () => {
  const [swipe, setSwipe] = useState<EdgeSwipeVisualState>({
    active: false,
    progress: 0,
    ready: false,
    isRtl: false,
    y: 240,
  });

  useEffect(() => {
    return subscribeEdgeSwipe(setSwipe);
  }, []);

  if (!swipe.active || swipe.progress <= 0.05) return null;

  const offsetPx = Math.round(swipe.progress * 20);
  const scale = 0.78 + swipe.progress * 0.28;

  return (
    <div
      aria-hidden="true"
      className="fixed z-[120] pointer-events-none select-none transition-opacity duration-75"
      style={{
        top: swipe.y - 22,
        ...(swipe.isRtl
          ? { right: `${offsetPx - 6}px` }
          : { left: `${offsetPx - 6}px` }),
        transform: `scale(${scale.toFixed(2)})`,
      }}
    >
      <div
        className={`w-10 h-11 rounded-full flex items-center justify-center backdrop-blur-2xl border shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-colors duration-150 ${
          swipe.ready
            ? 'bg-emerald-600/95 border-emerald-400/70 text-white'
            : 'bg-neutral-900/78 dark:bg-neutral-100/85 border-white/20 dark:border-black/15 text-white dark:text-neutral-900'
        }`}
      >
        {swipe.isRtl ? (
          <ChevronRight className="w-5 h-5 stroke-[2.6]" />
        ) : (
          <ChevronLeft className="w-5 h-5 stroke-[2.6]" />
        )}
      </div>
    </div>
  );
};
