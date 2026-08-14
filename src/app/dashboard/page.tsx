import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

export default function DashboardPage() {
  return (
    <RouteMessages namespaces={["dashboard"]}>
      <DashboardHome />
    </RouteMessages>
  );
}
