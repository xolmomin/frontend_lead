import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ReportsView } from "@/components/reports/reports-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("reports") };
}

export default function ReportsPage() {
  return (
    <RouteMessages namespaces={["reports"]}>
      <ReportsView />
    </RouteMessages>
  );
}
