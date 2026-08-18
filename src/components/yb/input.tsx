"use client";

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface YbInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  showRequiredMarker?: boolean;
}

export const YbInput = forwardRef<HTMLInputElement, YbInputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      helperText,
      type = "text",
      className,
      disabled,
      required,
      showRequiredMarker,
      id,
      onChange,
      ...props
    },
    ref,
  ) => {
    const t = useTranslations("common");
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const resolvedType = isPassword && showPassword ? "text" : type;
    const describedBy = error ? errorId : helperText ? helperId : undefined;
    const marker = showRequiredMarker ?? !!required;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground/80 mb-1.5"
          >
            {label}
            {marker && (
              <span aria-hidden="true" className="ml-0.5 text-destructive">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            disabled={disabled}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-required={required ? true : undefined}
            onChange={onChange}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border transition-colors duration-200",
              "bg-card text-foreground placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
              error
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25"
                : "border-input focus-visible:border-primary focus-visible:ring-ring/30",
              disabled && "opacity-50 cursor-not-allowed",
              leftIcon && "pl-10",
              (rightIcon || isPassword) && "pr-10",
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={t("actions.togglePassword")}
              aria-pressed={showPassword}
              aria-controls={inputId}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
          {!isPassword && rightIcon && (
            <div
              aria-hidden="true"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
YbInput.displayName = "YbInput";
