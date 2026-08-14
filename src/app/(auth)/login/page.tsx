import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginView } from "@/components/auth/login-view";
import { AuthFormSkeleton } from "@/components/auth/auth-skeleton";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return { title: t("title"), description: t("subtitle") };
}

export default function LoginPage() {
  // LoginView reads ?next= via useSearchParams(), which needs a boundary.
  return (
    <RouteMessages namespaces={["auth"]}>
      <Suspense fallback={<AuthFormSkeleton />}>
        <LoginView />
      </Suspense>
    </RouteMessages>
  );
}
