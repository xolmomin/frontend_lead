import { cn } from "@/lib/utils";

/**
 * Left-aligned section header with a mono "route marker" eyebrow — the
 * recurring pipeline motif of the landing page.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex max-w-2xl flex-col gap-3", className)}>
      <p className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
        <span aria-hidden className="size-1.5 rounded-[2px] bg-primary" />
        {eyebrow}
      </p>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle ? (
        <p className="text-base text-muted-foreground sm:text-lg">{subtitle}</p>
      ) : null}
    </div>
  );
}
