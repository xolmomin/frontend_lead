import { Suspense } from "react";
import { FinanceInsightsView } from "@/components/finance/insights-view";

export default function FinanceInsightsPage() {
  // Suspense boundary required: the view reads ?window= via useSearchParams.
  return (
    <Suspense>
      <FinanceInsightsView />
    </Suspense>
  );
}
