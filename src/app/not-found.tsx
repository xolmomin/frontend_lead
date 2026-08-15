import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { House, Search } from "lucide-react";
import { Button } from "@/components/marketing/button";
import { GoBackButton } from "@/components/marketing/go-back-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.notFound");
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

/** Production 404 page (NotFound chunk), ported 1:1. */
export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="mb-8 animate-in zoom-in-90 duration-500 fill-mode-both delay-200">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 blur-3xl rounded-full" />
            <h1 className="relative text-[120px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 leading-none">
              404
            </h1>
          </div>
        </div>
        <div className="mb-8 animate-in fade-in duration-500 fill-mode-both delay-300">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t("notFound.title")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            {t("notFound.description")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("notFound.hint")}
          </p>
        </div>
        <div
          className="mb-8 animate-in fade-in zoom-in-90 duration-500 fill-mode-both"
          style={{ animationDelay: "400ms" }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800">
            <Search className="w-10 h-10 text-gray-400 dark:text-gray-600" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-5 duration-500 fill-mode-both delay-500">
          <GoBackButton label={t("notFound.goBack")} />
          <Link href="/">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<House className="w-5 h-5" />}
            >
              {t("notFound.home")}
            </Button>
          </Link>
        </div>
        <div
          className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-700 animate-in fade-in duration-500 fill-mode-both"
          style={{ animationDelay: "600ms" }}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t("notFound.needHelp")}
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link
              href="/dashboard/pricing"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t("notFound.pricing")}
            </Link>
            <span className="text-gray-300 dark:text-gray-700">•</span>
            <a
              href="https://t.me/lidlar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t("notFound.support")}
            </a>
            <span className="text-gray-300 dark:text-gray-700">•</span>
            <Link
              href="/login"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t("notFound.login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
