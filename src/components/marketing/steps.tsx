import { useTranslations } from "next-intl";
import { Inbox, UserPlus, Workflow, type LucideIcon } from "lucide-react";
import { facebookLogo } from "./brand-logos";

/** "Qanday ishlaydi" — production `howItWorks` 4-step section (id=how). */

type StepIcon =
  LucideIcon | ((props: { className?: string }) => React.ReactNode);

function FacebookMark({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={facebookLogo} alt="" className={className} aria-hidden />;
}

const ICONS: StepIcon[] = [UserPlus, FacebookMark, Workflow, Inbox];

interface StepItem {
  title: string;
  description: string;
}

export function Steps() {
  const t = useTranslations("landing");
  const raw = t.raw("howItWorks.steps");
  const steps: StepItem[] = Array.isArray(raw) ? raw : [];

  return (
    <section id="how" className="section-muted py-14 sm:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="t-h1 text-foreground">{t("howItWorks.title")}</h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("howItWorks.subtitle")}
          </p>
        </div>
        {/* Mobile: vertical timeline */}
        <div className="md:hidden relative" aria-hidden="true">
          <div className="absolute left-4 sm:left-5 top-0 bottom-0 w-0.5 bg-muted" />
          <div className="space-y-6 sm:space-y-8">
            {steps.map((step, index) => {
              const Icon = ICONS[index];
              return (
                <div key={index} className="relative pl-12 sm:pl-14">
                  <div className="absolute left-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full gradient-primary-diagonal flex items-center justify-center text-white font-bold text-xs sm:text-sm z-10">
                    {index + 1}
                  </div>
                  <div className="glass-card p-4 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      {Icon && (
                        <Icon
                          className="w-5 h-5 text-primary flex-shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <h3 className="text-base font-semibold text-foreground break-words">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground break-words">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Desktop: horizontal steps */}
        <div className="hidden md:block">
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
            <div className="grid grid-cols-4 gap-6 lg:gap-8 relative items-stretch">
              {steps.map((step, index) => {
                const Icon = ICONS[index];
                return (
                  <div key={index} className="text-center">
                    <div className="w-10 h-10 rounded-full gradient-primary-diagonal flex items-center justify-center text-white font-bold text-sm mx-auto mb-4 relative z-10">
                      {index + 1}
                    </div>
                    <div className="glass-card p-5 lg:p-6 h-full">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        {Icon && (
                          <Icon
                            className="w-6 h-6 text-primary"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <h3 className="text-base lg:t-h4 text-foreground mb-2 text-center">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground text-center">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
