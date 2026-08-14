import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { IntegrationsView } from "@/components/integrations/integrations-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("integrations") };
}

export default function IntegrationsPage() {
  return (
    <RouteMessages namespaces={["integrations", "connections"]}>
      <Suspense>
        <IntegrationsView />
      </Suspense>
    </RouteMessages>
  );
}
