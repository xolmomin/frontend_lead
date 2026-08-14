import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SettingsView } from "@/components/settings/settings-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("settings") };
}

export default function SettingsPage() {
  return (
    <RouteMessages namespaces={["settings"]}>
      <SettingsView />
    </RouteMessages>
  );
}
