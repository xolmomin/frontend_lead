import { redirect } from "next/navigation";

/**
 * Production has no integration detail page — editing happens in a modal on
 * the list page, so this subpage redirects there and opens the edit modal.
 */
export default async function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/integrations?edit=${encodeURIComponent(id)}`);
}
