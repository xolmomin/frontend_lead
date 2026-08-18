"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

/** "Ko'p beriladigan savollar" — production `faq` section (id=faq). */

interface FaqEntry {
  question: string;
  answer: string;
}

const FaqItem = memo(function FaqItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: FaqEntry;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const buttonId = `faq-button-${index}`;
  const panelId = `faq-panel-${index}`;
  return (
    <div className="glass-card overflow-hidden">
      <button
        id={buttonId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 text-left min-h-[44px] cursor-pointer"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="text-sm sm:text-base font-semibold text-foreground break-words min-w-0">
          {item.question}
        </span>
        <span
          className={`flex-shrink-0 transition-transform duration-250 ${isOpen ? "rotate-180" : ""}`}
        >
          <ChevronDown
            className="w-5 h-5 text-muted-foreground"
            aria-hidden="true"
          />
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid transition-all duration-250 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export function Faq() {
  const t = useTranslations("landing");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const raw = t.raw("faq.items");
  const items: FaqEntry[] = useMemo(
    () => (Array.isArray(raw) ? raw : []),
    [raw],
  );
  const toggle = useCallback((index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  }, []);

  const jsonLd = useMemo(
    () =>
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }),
    [items],
  );

  return (
    <section id="faq" className="py-14 sm:py-20 lg:py-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="t-h1 text-foreground">{t("faq.title")}</h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("faq.subtitle")}
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
          {items.map((item, index) => (
            <FaqItem
              key={index}
              item={item}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => toggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
