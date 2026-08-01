"use client";

import { useSyncExternalStore, type ReactNode } from "react";
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      <div
        className={collapsed ? "md:pl-20" : "md:pl-72"}
        style={{ transition: "padding-left 0.3s ease" }}
      >
        <DashboardHeader />
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
