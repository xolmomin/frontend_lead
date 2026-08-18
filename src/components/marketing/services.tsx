import { useTranslations } from "next-intl";
import {
  ChartColumn,
  Globe,
  Link as LinkIcon,
  Shield,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

/** "Bizning xizmatlar" — production `features` section (id=features). */

const ICONS: LucideIcon[] = [
  Users,
  LinkIcon,
  ChartColumn,
  TrendingUp,
  Globe,
  Shield,
];

interface FeatureItem {
  title: string;
  description: string;
}

export function Services() {
  const t = useTranslations("landing");
  const raw = t.raw("features.items");
  const items: FeatureItem[] = Array.isArray(raw) ? raw : [];

  return (
    <section id="features" className="section-muted py-14 sm:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="t-h1 text-foreground">{t("features.title")}</h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {items.map((item, index) => {
            const Icon = ICONS[index];
            return (
              <div
                key={index}
                className="card-elevated p-6 sm:p-8 hover:-translate-y-2 hover:shadow-glow-sm transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 sm:mb-5">
                  {Icon && (
                    <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 break-words">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed break-words">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
