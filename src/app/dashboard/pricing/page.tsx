import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BillingView } from "@/components/billing/billing-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("pricing") };
}

export default function PricingPage() {
  return (
    <RouteMessages namespaces={["billing", "pricing"]}>
      <BillingView section="pricing" />
    </RouteMessages>
  );
}
