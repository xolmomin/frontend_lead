import { useTranslations } from "next-intl";
import {
  ChartLine,
  Languages,
  Plug,
  Send,
  type LucideIcon,
} from "lucide-react";

/** "Nega aynan Yuboraman?" — production `why` section. */

const ITEMS: { icon: LucideIcon; key: string }[] = [
  { icon: Languages, key: "uzbek" },
  { icon: ChartLine, key: "reports" },
  { icon: Plug, key: "bitrix" },
  { icon: Send, key: "telegram" },
];

export function WhyUs() {
  const t = useTranslations("landing");
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            {t("why.title")}
          </h2>
          <p className="mt-3 text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("why.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="glass-card p-5 text-center hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  {t(`why.items.${item.key}.title`)}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t(`why.items.${item.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
