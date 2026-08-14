import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductsView } from "@/components/products/products-view";
import { RouteMessages } from "@/i18n/route-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("products") };
}

export default function ProductsPage() {
  return (
    <RouteMessages namespaces={["products"]}>
      <ProductsView />
    </RouteMessages>
  );
}
