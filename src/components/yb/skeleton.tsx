import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Placeholder block sized by the caller. Prefer this over `YbSpinner` for
 * content that has a known shape — it reserves the space, so the layout does
 * not jump when the real data lands.
 */
export const YbSkeleton = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    aria-hidden="true"
    className={cn("animate-pulse rounded-md bg-muted", className)}
    {...props}
  />
));
YbSkeleton.displayName = "YbSkeleton";

/** N stacked text lines; the last one is short, like real wrapped copy. */
export function YbSkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <YbSkeleton
          key={index}
          className={cn("h-4", index === lines - 1 && "w-2/3")}
        />
      ))}
    </div>
  );
}

/** Rows of a table body, matching the column count. */
export function YbSkeletonRows({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-2" role="status" aria-busy="true">
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-4">
          {Array.from({ length: columns }, (_, column) => (
            <YbSkeleton
              key={column}
              className={cn("h-4 flex-1", column === 0 && "max-w-[40%]")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
