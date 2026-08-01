import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Button } from "./button";

/** "Hoziroq bepul boshlang!" — production `cta` banner. */
export function Cta() {
  const t = useTranslations("landing");
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden gradient-primary-diagonal rounded-2xl sm:rounded-3xl p-6 sm:p-12 lg:p-16">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                {t("cta.title")}
              </h2>
              <p className="mt-2 sm:mt-3 text-base sm:text-lg text-white/80 max-w-lg">
                {t("cta.subtitle")}
              </p>
            </div>
            <div className="flex-shrink-0 text-center md:text-right">
              <Link href="/register">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white text-primary-700 border-white hover:bg-white/90 shadow-glow-sm"
                  rightIcon={
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  }
                >
                  {t("cta.button")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
