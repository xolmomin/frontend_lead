"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Play, Zap } from "lucide-react";
import { Button } from "./button";
import { telegramLogo } from "./brand-logos";

const STATS = [
  { value: "40+", key: "integrations" },
  { value: "24/7", key: "support" },
  { valueKey: "hero.stats.setupValue", key: "setup" },
] as const;

const DASHBOARD_STATS = [
  { emoji: "📥", key: "todayLeads", value: "47" },
  { emoji: "📊", key: "weekLeads", value: "312" },
  { emoji: "✅", key: "activeIntegrations", value: "8" },
  { emoji: "⏸️", key: "pausedIntegrations", value: "2" },
] as const;

const REPORT_STATS = [
  { emoji: "💰", key: "spend", value: "$3,842.50" },
  { emoji: "📊", key: "impressions", value: "87,320" },
  { emoji: "🖱️", key: "clicks", value: "1,856" },
  { emoji: "📈", key: "ctr", value: "2.13%" },
  { emoji: "📉", key: "cpl", value: "$0.86" },
] as const;

const ROTATE_INTERVAL = 4000;

export function Hero() {
  const t = useTranslations("landing");
  const [card, setCard] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCard((current) => +(current === 0));
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden pt-20 sm:pt-28 lg:pt-32 pb-12 sm:pb-20 lg:pb-28">
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 dark:bg-primary-400/10 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-400/20 dark:bg-secondary-400/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "3s" }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:grid md:grid-cols-2 md:gap-12 md:items-center">
          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
              {t("hero.title1")}
              <br />
              <span className="gradient-text-animated">{t("hero.title2")}</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto md:mx-0 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both delay-150">
              {t("hero.subtitle")}
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both delay-300">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto px-8 py-3.5 text-lg font-bold shadow-lg hover:shadow-xl"
                >
                  {t("hero.cta")}
                </Button>
              </Link>
              <a
                href="#videos"
                onClick={(event) => {
                  event.preventDefault();
                  const target = document.querySelector("#videos");
                  if (target) target.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto"
              >
                <Button
                  variant="ghost"
                  size="md"
                  leftIcon={<Play className="w-4 h-4" aria-hidden="true" />}
                  className="w-full sm:w-auto"
                >
                  {t("hero.watchVideo")}
                </Button>
              </a>
            </div>
            <div className="mt-8 sm:mt-12 flex flex-wrap gap-3 sm:gap-6 justify-center md:justify-start animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both delay-500">
              {STATS.map((stat) => (
                <div
                  key={stat.key}
                  className="glass rounded-xl px-3 py-2.5 sm:px-6 sm:py-4 text-center"
                >
                  <div className="text-lg sm:text-2xl font-bold gradient-text">
                    {"value" in stat ? stat.value : t(stat.valueKey)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {t(`hero.stats.${stat.key}`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:block rotate-2 animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-both delay-300">
            <div className="relative max-w-sm ml-auto min-h-[320px]">
              <div
                className={`absolute inset-0 transition-all duration-400 ease-in-out ${card === 0 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-16 pointer-events-none"}`}
              >
                <div className="glass-card p-5 sm:p-6 animate-float h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        Yuboraman
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t("hero.dashboardCard.subtitle")}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-primary-50 dark:bg-slate-700/60 p-4">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {t("hero.dashboardCard.title")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t("hero.dashboardCard.period")}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      {DASHBOARD_STATS.map((stat) => (
                        <p
                          key={stat.key}
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          <span aria-hidden="true">{stat.emoji}</span>{" "}
                          {t(`hero.dashboardCard.stats.${stat.key}`)}:{" "}
                          {stat.value}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`absolute inset-0 transition-all duration-400 ease-in-out ${card === 1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-16 pointer-events-none"}`}
              >
                <div className="glass-card p-5 sm:p-6 animate-float h-full">
                  <div className="flex items-center gap-3 mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={telegramLogo}
                      alt="Telegram"
                      className="w-10 h-10"
                    />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        Telegram · Yuboraman Bot
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t("hero.reportCard.subtitle")}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-primary-50 dark:bg-slate-700/60 p-4">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {t("hero.reportCard.title")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t("hero.reportCard.period")}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      {REPORT_STATS.map((stat) => (
                        <p
                          key={stat.key}
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          <span aria-hidden="true">{stat.emoji}</span>{" "}
                          {t(`hero.reportCard.stats.${stat.key}`)}: {stat.value}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {[0, 1].map((index) => (
                  <button
                    key={index}
                    onClick={() => setCard(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${card === index ? "bg-primary-500 w-6" : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"}`}
                    aria-label={t(
                      index === 0
                        ? "hero.dashboardCard.subtitle"
                        : "hero.reportCard.subtitle",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
