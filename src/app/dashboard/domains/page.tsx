import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DomainsView } from "@/components/domains/domains-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("domains") };
}

export default function DomainsPage() {
  return (
    <RouteMessages namespaces={["domains"]}>
      <DomainsView />
    </RouteMessages>
  );
}
