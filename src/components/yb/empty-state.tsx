import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shown when a list resolves to zero rows — distinct from the loading state,
 * which uses `YbSkeleton`.
 */
export function YbEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12",
        className,
      )}
    >
      {icon && (
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <p className="t-h4 text-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
