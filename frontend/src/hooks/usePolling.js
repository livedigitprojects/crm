import { useEffect, useRef } from 'react';

export default function usePolling(callback, intervalMs, { enabled = true, immediate = true } = {}) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) return undefined;

    let timer = null;
    let running = false;

    const tick = async (force = false) => {
      if (running || (document.hidden && !force)) return;
      running = true;
      try {
        await cbRef.current();
      } finally {
        running = false;
      }
    };

    const start = () => {
      if (!timer) timer = setInterval(() => tick(), intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        tick();
        start();
      }
    };

    if (immediate) tick(true);
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs, enabled]);
}