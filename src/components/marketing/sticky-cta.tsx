"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Button } from "./button";

/**
 * Mobile-only fixed bottom CTA, shown after scrolling past 600px
 * (production behaviour on the landing wrapper).
 */
export function StickyCta() {
  const t = useTranslations("landing");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 glass-strong">
      <Link href="/register" className="block">
        <Button
          variant="primary"
          size="md"
          className="w-full shadow-glow-sm"
          rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
        >
          {t("hero.cta")}
        </Button>
      </Link>
    </div>
  );
}
