import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordView } from "@/components/auth/forgot-password-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.forgotPassword");
  return { title: t("title"), description: t("subtitle") };
}

export default function ForgotPasswordPage() {
  return (
    <RouteMessages namespaces={["auth"]}>
      <ForgotPasswordView />
    </RouteMessages>
  );
}
