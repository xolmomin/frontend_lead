import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ApiKeysView } from "@/components/api-keys/api-keys-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("apiKeys") };
}

export default function ApiKeysPage() {
  return (
    <RouteMessages namespaces={["apiKeys"]}>
      <ApiKeysView />
    </RouteMessages>
  );
}
