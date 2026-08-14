import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PacingView } from "@/components/pacing/pacing-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("leadPacing") };
}

export default function LeadPacingPage() {
  return (
    <RouteMessages namespaces={["leadPacing", "integrations", "connections"]}>
      <PacingView />
    </RouteMessages>
  );
}
