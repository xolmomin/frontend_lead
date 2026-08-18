"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight CSS-only tooltip standing in for the production Tooltip
 * component (which used a portal); shows `content` on hover/focus.
 */
export function Tip({
  content,
  children,
  position = "top",
  disabled = false,
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "right" | "bottom";
  disabled?: boolean;
  className?: string;
}) {
  if (disabled || !content) return <>{children}</>;
  return (
    <span className={cn("group/tip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-[60] hidden max-w-60 whitespace-pre-line rounded-lg bg-foreground px-2.5 py-1.5 text-center text-xs font-medium text-background shadow-e2 group-hover/tip:block group-focus-within/tip:block",
          position === "top" && "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
          position === "bottom" && "top-full left-1/2 mt-1.5 -translate-x-1/2",
          position === "right" && "left-full top-1/2 ml-1.5 -translate-y-1/2",
        )}
      >
        {content}
      </span>
    </span>
  );
}
