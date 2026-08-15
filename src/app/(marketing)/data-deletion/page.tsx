import type { Metadata } from "next";
import { LegalPage, getLegalDocument } from "@/components/legal/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocument("dataDeletion");
  return {
    title: doc.title,
    description: doc.metaDescription,
    alternates: { canonical: "/data-deletion" },
  };
}

export default function DataDeletionPage() {
  return <LegalPage document="dataDeletion" />;
}
