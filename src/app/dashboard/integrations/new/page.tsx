import { redirect } from "next/navigation";

/**
 * Production handles integration creation in a modal on the list page, so
 * this subpage stays as a thin redirect that opens the add modal there.
 */
export default function NewIntegrationPage() {
  redirect("/dashboard/integrations?new=1");
}
