"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { RotateCw, House, TriangleAlert } from "lucide-react";
import { YbButton } from "@/components/yb/button";

interface ErrorStateProps {
  digest?: string;
  onRetry: () => void;
  /** Where the secondary "go somewhere safe" link points. */
  homeHref: string;
  homeLabelKey: "home" | "dashboard";
}

/**
 * Shared body for the route error boundaries. Kept out of the error.tsx files
 * themselves so they stay tiny and so global-error.tsx can skip it entirely
 * (it renders outside every provider, translations included).
 */
export function ErrorState({
  digest,
  onRetry,
  homeHref,
  homeLabelKey,
}: ErrorStateProps) {
  const t = useTranslations("common.errorBoundary");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
          <TriangleAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t("title")}
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          {t("description")}
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <YbButton
            variant="primary"
            leftIcon={<RotateCw className="h-4 w-4" />}
            onClick={onRetry}
          >
            {t("retry")}
          </YbButton>
          <Link href={homeHref}>
            <YbButton
              variant="outline"
              leftIcon={<House className="h-4 w-4" />}
              className="w-full"
            >
              {t(homeLabelKey)}
            </YbButton>
          </Link>
        </div>
        {digest && (
          <p className="mt-8 font-mono text-xs text-gray-400 dark:text-gray-600">
            {t("errorId", { digest })}
          </p>
        )}
      </div>
    </div>
  );
}
