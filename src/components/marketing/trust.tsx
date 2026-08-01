import { useTranslations } from "next-intl";
import {
  Bot,
  Languages,
  Lock,
  MessageCircle,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const ITEMS: { icon: LucideIcon; key: string }[] = [
  { icon: Lock, key: "ssl" },
  { icon: Languages, key: "uzbek" },
  { icon: Wallet, key: "payment" },
  { icon: Bot, key: "automatic" },
  { icon: MessageCircle, key: "support" },
];

export function TrustStrip() {
  const t = useTranslations("landing");
  return (
    <section className="py-6 sm:py-8 border-y border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-10">
          {ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <Icon
                  className="w-4 h-4 text-primary-500 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="whitespace-nowrap">{t(`trust.${item.key}`)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
