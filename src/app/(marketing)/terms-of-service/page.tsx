import type { Metadata } from "next";
import { LegalPage, getLegalDocument } from "@/components/legal/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocument("terms");
  return {
    title: doc.title,
    description: doc.metaDescription,
    alternates: { canonical: "/terms-of-service" },
  };
}

export default function TermsOfServicePage() {
  return <LegalPage document="terms" />;
}
