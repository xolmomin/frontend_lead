"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True after hydration, false during SSR — without a setState-in-effect. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
