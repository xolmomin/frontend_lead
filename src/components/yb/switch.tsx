"use client";

import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

export interface YbSwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: ReactNode;
  /** React 19 passes ref as a plain prop — no forwardRef needed. */
  ref?: Ref<HTMLInputElement>;
}

export function YbSwitch({
  label,
  className,
  disabled,
  ...props
}: YbSwitchProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <div className="relative">
        {/*
          role="switch" belongs on the real, focusable control. It used to sit
          on the decorative track below, which exposed an inoperable switch plus
          an unlabelled checkbox to assistive tech — and its aria-checked was
          hardcoded from props.checked, so it read "off" forever whenever the
          switch was used uncontrolled.
        */}
        <input
          type="checkbox"
          role="switch"
          className="sr-only peer"
          disabled={disabled}
          {...props}
        />
        <div
          aria-hidden="true"
          className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none peer-focus:ring-2 peer-focus-visible:ring-ring peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-input after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
        />
      </div>
      {label && (
        <span className="ml-3 text-sm font-medium text-foreground">
          {label}
        </span>
      )}
    </label>
  );
}
