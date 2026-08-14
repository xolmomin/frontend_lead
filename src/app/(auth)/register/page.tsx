import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterView } from "@/components/auth/register-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  return { title: t("title"), description: t("subtitle") };
}

export default function RegisterPage() {
  return (
    <RouteMessages namespaces={["auth"]}>
      <RegisterView />
    </RouteMessages>
  );
}
