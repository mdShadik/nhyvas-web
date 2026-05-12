import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * Returns a stable function reference that always calls the latest version
 * of `fn`. Useful to avoid putting callbacks in effect dependency arrays
 * without violating React rules.
 */
export function useCallbackRef<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn);

  useLayoutEffect(() => {
    ref.current = fn;
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(((...args) => ref.current(...args)) as T, []);
}
