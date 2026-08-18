import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard top-of-page block: title, optional supporting line, optional
 * right-aligned actions. Replaces the hand-rolled `<h1>` + `<p>` pair that was
 * repeated on every dashboard view.
 */
export function YbPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="t-h2 text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
