import type { Metadata } from "next";
import { LegalPage, getLegalDocument } from "@/components/legal/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocument("privacy");
  return {
    title: doc.title,
    description: doc.metaDescription,
    alternates: { canonical: "/privacy-policy" },
  };
}

export default function PrivacyPolicyPage() {
  return <LegalPage document="privacy" />;
}
