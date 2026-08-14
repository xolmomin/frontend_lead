import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ConnectionsView } from "@/components/connections/connections-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("connections") };
}

export default function ConnectionsPage() {
  return (
    <RouteMessages namespaces={["connections", "integrations"]}>
      <ConnectionsView />
    </RouteMessages>
  );
}
