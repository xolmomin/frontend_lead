import { Suspense } from "react";
import type { Metadata } from "next";
import {
  OAuthCallbackPending,
  OAuthCallbackView,
} from "@/components/auth/oauth-callback-view";
import { RouteMessages } from "@/i18n/route-messages";

export const metadata: Metadata = {
  title: "OAuth",
  robots: { index: false, follow: false },
};

export default function OAuthCallbackPage() {
  return (
    <RouteMessages namespaces={["auth"]}>
      <Suspense fallback={<OAuthCallbackPending />}>
        <OAuthCallbackView />
      </Suspense>
    </RouteMessages>
  );
}
