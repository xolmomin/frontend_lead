"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface YbSwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}

export const YbSwitch = forwardRef<HTMLInputElement, YbSwitchProps>(
  ({ label, className, disabled, ...props }, ref) => (
    <label
      className={cn(
        "inline-flex items-center cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <div className="relative">
        <input
          ref={ref}
          type="checkbox"
          className="sr-only peer"
          disabled={disabled}
          {...props}
        />
        <div
          role="switch"
          aria-checked={!!props.checked}
          className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
        />
      </div>
      {label && (
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </span>
      )}
    </label>
  ),
);
YbSwitch.displayName = "YbSwitch";
