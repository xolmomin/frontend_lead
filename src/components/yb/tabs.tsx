"use client";

import { useRef, type ReactNode } from "react";

export interface YbTab {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
}

export function tabId(base: string, id: string) {
  return `${base}-tab-${id}`;
}

export function tabPanelId(base: string, id: string) {
  return `${base}-panel-${id}`;
}

export function YbTabs({
  tabs,
  active,
  onChange,
  ariaLabel,
  idBase,
  className,
  tabClassName,
}: {
  tabs: YbTab[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  idBase: string;
  className?: string;
  tabClassName?: (state: { isActive: boolean }) => string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    let next: number | null = null;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = tabs.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const tab = tabs[next];
    onChange(tab.id);
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelectorAll<HTMLElement>('[role="tab"]')
        ?.[next!]?.focus();
    });
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className={className}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tabId(idBase, tab.id)}
            aria-selected={isActive}
            aria-controls={tabPanelId(idBase, tab.id)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={tabClassName?.({ isActive })}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
