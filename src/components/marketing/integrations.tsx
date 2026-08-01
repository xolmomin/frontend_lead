import { useTranslations } from "next-intl";
import {
  bitrixLogo,
  creatiumLogo,
  facebookLogo,
  kommoLogo,
  sheetsLogo,
  telegramLogo,
  tildaLogo,
} from "./brand-logos";

const INTEGRATIONS = [
  { name: "Facebook", logo: facebookLogo },
  { name: "Telegram", logo: telegramLogo },
  { name: "Google Sheets", logo: sheetsLogo },
  { name: "Bitrix24", logo: bitrixLogo },
  { name: "amoCRM / Kommo", logo: kommoLogo },
  { name: "Tilda", logo: tildaLogo },
  { name: "Creatium", logo: creatiumLogo },
];

export function Integrations() {
  const t = useTranslations("landing");
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 uppercase tracking-wider">
          {t("integrations.title")}
        </h2>
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex items-center gap-10 sm:gap-14 animate-marquee hover:[animation-play-state:paused] w-max">
            {[...INTEGRATIONS, ...INTEGRATIONS].map((integration, index) => (
              <div
                key={`${integration.name}-${index}`}
                className="flex flex-col items-center gap-2 shrink-0"
                aria-hidden={index >= INTEGRATIONS.length || undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={integration.logo}
                  alt={integration.name}
                  className="h-8 sm:h-10 w-auto"
                />
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
