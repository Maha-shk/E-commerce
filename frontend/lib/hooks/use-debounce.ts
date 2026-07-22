"use client";

import { useEffect, useState } from "react";

/**
 * Delays propagating a rapidly-changing value (e.g. a search box) so list
 * queries don't fire on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
