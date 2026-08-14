import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OrdersView } from "@/components/finance/orders-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("orders") };
}

export default function FinanceOrdersPage() {
  return (
    <RouteMessages namespaces={["finance"]}>
      <OrdersView />
    </RouteMessages>
  );
}
