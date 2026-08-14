import { Suspense } from "react";
import type { Metadata } from "next";
import {
  FacebookCallbackPending,
  FacebookCallbackView,
} from "@/components/connections/facebook-callback-view";
import { RouteMessages } from "@/i18n/route-messages";

export const metadata: Metadata = {
  title: "Facebook",
  robots: { index: false, follow: false },
};

export default function FacebookCallbackPage() {
  return (
    <RouteMessages namespaces={["connections", "integrations"]}>
      <Suspense fallback={<FacebookCallbackPending />}>
        <FacebookCallbackView />
      </Suspense>
    </RouteMessages>
  );
}
