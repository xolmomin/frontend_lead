import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

/** Wordmark used in the navbar, footer and the hero relay card. */
export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground",
          markClassName,
        )}
      >
        <HugeiconsIcon icon={SentIcon} className="size-4.5" />
      </span>
      <span className="text-lg font-bold tracking-tight">Yuboraman</span>
    </span>
  );
}
