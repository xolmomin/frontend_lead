import { IntegrationDetail } from "@/components/integrations/integration-detail";

export default async function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <IntegrationDetail id={id} />;
}
