import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FinanceInsightsView } from "@/components/finance/insights-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("finance") };
}

export default function FinanceInsightsPage() {
  // Suspense boundary required: the view reads ?window= via useSearchParams.
  return (
    <RouteMessages namespaces={["finance"]}>
      <Suspense>
        <FinanceInsightsView />
      </Suspense>
    </RouteMessages>
  );
}
