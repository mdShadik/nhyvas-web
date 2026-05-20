// useStoryTimer.ts
import { useRef, useState, useCallback, useEffect } from "react";

interface UseStoryTimerOptions {
  duration: number;
  onComplete: () => void;
  isPaused: boolean;
  fps?: number;
}

export function useStoryTimer({
  duration,
  onComplete,
  isPaused,
  fps = 60,
}: UseStoryTimerOptions) {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  const tick = useCallback(() => {
    if (completedRef.current) return;

    const now = performance.now();
    const elapsed = elapsedBeforePauseRef.current + (now - startTimeRef.current);
    const pct = Math.min(elapsed / duration, 1);

    setProgress(pct);

    if (pct >= 1) {
      completedRef.current = true;
      onCompleteRef.current();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [duration]);

  const play = useCallback(() => {
    if (completedRef.current) return;
    startTimeRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const now = performance.now();
    elapsedBeforePauseRef.current += now - startTimeRef.current;
    pausedAtRef.current = now;
  }, []);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    completedRef.current = false;
    elapsedBeforePauseRef.current = 0;
    pausedAtRef.current = 0;
    startTimeRef.current = 0;
    setProgress(0);
  }, []);

  useEffect(() => {
    if (isPaused) {
      pause();
    } else {
      play();
    }
  }, [isPaused, pause, play]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { progress, play, pause, reset };
}