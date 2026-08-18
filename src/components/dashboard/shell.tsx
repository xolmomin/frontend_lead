"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./header";

const COLLAPSED_KEY = "sidebar_collapsed";

// Tiny external store so the collapsed flag reads straight from localStorage
// (SSR snapshot: false) without a setState-in-effect hydration dance.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getCollapsed(): boolean {
  return localStorage.getItem(COLLAPSED_KEY) === "true";
}

function toggleCollapsed() {
  localStorage.setItem(COLLAPSED_KEY, String(!getCollapsed()));
  listeners.forEach((listener) => listener());
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(subscribe, getCollapsed, () => false);

  return (
    <div className="app-canvas min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      <div
        className={cn(
          "transition-[padding] duration-300 ease-out motion-reduce:transition-none",
          collapsed ? "md:pl-20" : "md:pl-72",
        )}
      >
        <DashboardHeader />
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
