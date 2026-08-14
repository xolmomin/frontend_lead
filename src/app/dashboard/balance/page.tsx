import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BillingView } from "@/components/billing/billing-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("balance") };
}

export default function BalancePage() {
  return (
    <RouteMessages namespaces={["billing", "pricing"]}>
      <BillingView section="billing" />
    </RouteMessages>
  );
}
