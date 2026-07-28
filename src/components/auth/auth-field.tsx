"use client";

import { useState, type ComponentProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type IconType = ComponentProps<typeof HugeiconsIcon>["icon"];

interface AuthFieldProps extends Omit<ComponentProps<"input">, "id"> {
  id: string;
  label: string;
  icon: IconType;
  error?: string;
  /** Render a password field with a show/hide eye toggle. */
  toggleable?: boolean;
  showLabel?: string;
  hideLabel?: string;
}

export function AuthField({
  id,
  label,
  icon,
  error,
  toggleable = false,
  showLabel = "Show password",
  hideLabel = "Hide password",
  type = "text",
  className,
  ...props
}: AuthFieldProps) {
  const [show, setShow] = useState(false);
  const inputType = toggleable ? (show ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
          <HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />
        </span>
        <input
          id={id}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "h-11 w-full rounded-xl border border-input bg-background/60 pl-10 pr-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50",
            toggleable && "pr-11",
            error &&
              "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            className,
          )}
          {...props}
        />
        {toggleable && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            aria-label={show ? hideLabel : showLabel}
            className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <HugeiconsIcon
              icon={show ? ViewOffSlashIcon : ViewIcon}
              size={18}
              strokeWidth={1.8}
            />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
