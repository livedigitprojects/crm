import { useEffect, useRef } from 'react';

const IDLE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

export default function usePolling(callback, intervalMs, { enabled = true, immediate = true } = {}) {
  const cbRef = useRef(callback);

  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;

    let timer = null;
    let running = false;
    let lastActivityTime = Date.now();
    let isIdle = false;

    const tick = async (force = false) => {
      if (running || (document.hidden && !force)) return;
      if (isIdle && !force) return;

      running = true;
      try {
        await cbRef.current();
      } finally {
        running = false;
      }
    };

    const start = () => {
      if (!timer) timer = setInterval(() => {
        if (Date.now() - lastActivityTime > IDLE_THRESHOLD_MS) {
          isIdle = true;
        }
        tick();
      }, intervalMs);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        lastActivityTime = Date.now();
        isIdle = false;
        tick();
        start();
      }
    };

    let activityThrottle = null;
    const onUserActivity = () => {
      const now = Date.now();
      if (activityThrottle && now - activityThrottle < 2000) return;
      activityThrottle = now;

      const wasIdle = isIdle || (now - lastActivityTime > IDLE_THRESHOLD_MS);
      lastActivityTime = now;
      isIdle = false;

      // If returning from idle state while tab is visible, wake up immediately
      if (wasIdle && !document.hidden) {
        tick();
      }
    };

    if (immediate) tick(true);
    if (!document.hidden) start();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('mousemove', onUserActivity, { passive: true });
    window.addEventListener('keydown', onUserActivity, { passive: true });
    window.addEventListener('touchstart', onUserActivity, { passive: true });
    window.addEventListener('click', onUserActivity, { passive: true });

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('mousemove', onUserActivity);
      window.removeEventListener('keydown', onUserActivity);
      window.removeEventListener('touchstart', onUserActivity);
      window.removeEventListener('click', onUserActivity);
    };
  }, [intervalMs, enabled, immediate]);
}