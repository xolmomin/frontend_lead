import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import {
  bitrixLogo,
  facebookLogo,
  sheetsLogo,
  telegramLogo,
} from "./brand-logos";

/** "Lidlar qanday oqib keladi" — animated lead-flow diagram (production `leadFlow`). */

const DESTINATIONS = [
  { name: "Telegram", logo: telegramLogo },
  { name: "Google Sheets", logo: sheetsLogo },
  { name: "Bitrix24", logo: bitrixLogo },
];

const DOT_DELAYS = [0, 0.73, 1.46];

function LineDotsX({ extraDelay = 0 }: { extraDelay?: number }) {
  return (
    <>
      {DOT_DELAYS.map((delay) => (
        <div
          key={delay}
          className="mk-lead-x absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary-500"
          style={{
            boxShadow:
              "0 0 14px rgba(20,184,166,0.9), 0 0 4px rgba(20,184,166,1)",
            animationDelay: `${delay + extraDelay}s`,
          }}
        />
      ))}
    </>
  );
}

function LineDotsY({ extraDelay = 0 }: { extraDelay?: number }) {
  return (
    <>
      {DOT_DELAYS.map((delay) => (
        <div
          key={delay}
          className="mk-lead-y absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary-500"
          style={{
            boxShadow: "0 0 8px rgba(20,184,166,0.9)",
            animationDelay: `${delay + extraDelay}s`,
          }}
        />
      ))}
    </>
  );
}

export function HowLeadsArrive() {
  const t = useTranslations("landing");
  return (
    <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[70%] bg-primary-100/30 dark:bg-primary-900/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(20,184,166,0.15) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
        aria-hidden="true"
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white break-words">
            {t("leadFlow.title")}
          </h2>
          <p className="mt-3 text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto break-words">
            {t("leadFlow.subtitle")}
          </p>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 items-center">
          {/* Source: Facebook Lead Ads */}
          <div className="flex flex-col items-center">
            <div className="glass-card p-6 w-full max-w-xs relative">
              <div className="flex items-center gap-3 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={facebookLogo} alt="Facebook" className="w-10 h-10" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    Facebook Lead Ads
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t("leadFlow.source")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {t("leadFlow.liveLeads")}
                </span>
              </div>
            </div>
          </div>
          {/* Hub */}
          <div className="flex flex-col items-center relative">
            <div
              className="hidden md:block absolute right-full top-1/2 -translate-y-1/2 w-16 lg:w-24 h-0.5 overflow-hidden"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-300/40 via-primary-500 to-primary-500 dark:from-gray-600/40 dark:via-primary-400 dark:to-primary-400" />
              <div className="mk-shimmer absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              <LineDotsX />
            </div>
            <div
              className="md:hidden absolute bottom-full left-1/2 -translate-x-1/2 h-6 sm:h-8 w-0.5 overflow-hidden"
              aria-hidden="true"
            >
              <div className="relative w-full h-full bg-gradient-to-b from-gray-300/40 via-primary-500 to-primary-500 dark:from-gray-600/40 dark:via-primary-400 dark:to-primary-400">
                <LineDotsY />
              </div>
            </div>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28">
              <div
                className="absolute top-1/2 left-1/2 w-[160%] h-[160%] -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-[spin_7s_linear_infinite]"
                aria-hidden="true"
              >
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary-400"
                  style={{ boxShadow: "0 0 8px rgba(20,184,166,0.9)" }}
                />
              </div>
              <div
                className="absolute top-1/2 left-1/2 w-[135%] h-[135%] -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-[spin_5s_linear_infinite_reverse]"
                aria-hidden="true"
              >
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-300"
                  style={{ boxShadow: "0 0 6px rgba(20,184,166,0.7)" }}
                />
              </div>
              <span
                className="absolute inset-[-6px] rounded-2xl animate-[spin_4s_linear_infinite]"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(20,184,166,0), rgba(20,184,166,0.6), rgba(20,184,166,0))",
                }}
                aria-hidden="true"
              />
              <span
                className="mk-hub-pulse absolute inset-0 rounded-2xl ring-2 ring-primary-400/60"
                aria-hidden="true"
              />
              <div className="relative w-full h-full rounded-2xl gradient-primary flex items-center justify-center shadow-xl">
                <Zap
                  className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="font-bold text-gray-900 dark:text-white">
                Yuboraman
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t("leadFlow.hub")}
              </div>
            </div>
          </div>
          {/* Destinations */}
          <div className="flex flex-col gap-3 relative">
            <div
              className="hidden md:block absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 w-16 lg:w-24 h-0.5 overflow-hidden"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-primary-500 to-gray-300/40 dark:from-primary-400 dark:via-primary-400 dark:to-gray-600/40" />
              <div
                className="mk-shimmer absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                style={{ animationDelay: "1s" }}
              />
              <LineDotsX extraDelay={0.5} />
            </div>
            <div
              className="md:hidden absolute bottom-full left-1/2 -translate-x-1/2 h-6 sm:h-8 w-0.5 overflow-hidden"
              aria-hidden="true"
            >
              <div className="relative w-full h-full bg-gradient-to-b from-primary-500 to-gray-300/40 dark:from-primary-400 dark:to-gray-600/40">
                <LineDotsY extraDelay={0.4} />
              </div>
            </div>
            {DESTINATIONS.map((destination, index) => (
              <div key={destination.name}>
                <div className="glass-card px-3 py-3 sm:px-4 flex items-center gap-2 sm:gap-3 min-w-0 relative">
                  <span
                    className="mk-ping-ring absolute inset-0 rounded-xl border-2 border-green-400/60 pointer-events-none"
                    style={{ animationDelay: `${index * 0.73}s` }}
                    aria-hidden="true"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={destination.logo}
                    alt={destination.name}
                    className="w-8 h-8 flex-shrink-0 relative z-10"
                  />
                  <span className="font-medium text-sm text-gray-900 dark:text-white truncate relative z-10">
                    {destination.name}
                  </span>
                  <span
                    className="mk-check-pulse ml-auto text-sm text-green-600 dark:text-green-400 font-bold flex-shrink-0 relative z-10"
                    style={{ animationDelay: `${index * 0.73}s` }}
                  >
                    ✓
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {(["instant", "automatic", "reliable"] as const).map((key) => (
            <div
              key={key}
              className="text-sm text-gray-600 dark:text-gray-400 break-words"
            >
              <span className="font-semibold text-gray-900 dark:text-white">
                {t(`leadFlow.points.${key}.label`)}
              </span>
              {" — "}
              {t(`leadFlow.points.${key}.text`)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
