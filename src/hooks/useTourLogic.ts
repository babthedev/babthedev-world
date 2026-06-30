import { useEffect, useRef } from 'react';
import { useWorldStore } from '@/store/useWorldStore';

const IDLE_TIMEOUT_MS = 2000;

export function useTourLogic() {
  const isTourActive = useWorldStore((state) => state.isTourActive);
  const setTourActive = useWorldStore((state) => state.setTourActive);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // We only care about resuming the tour when it's currently inactive
    if (isTourActive) return;

    const handleInput = () => {
      // Clear existing timer if user provides input
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      // Set a new timer to resume the tour
      idleTimerRef.current = setTimeout(() => {
        setTourActive(true);
      }, IDLE_TIMEOUT_MS);
    };

    // Attach listeners to window
    window.addEventListener('keydown', handleInput);
    window.addEventListener('pointerdown', handleInput);
    window.addEventListener('pointermove', handleInput);

    // Initial timer start
    handleInput();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('pointerdown', handleInput);
      window.removeEventListener('pointermove', handleInput);
    };
  }, [isTourActive, setTourActive]);
}
