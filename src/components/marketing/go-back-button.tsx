"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { YbButton } from "@/components/yb/button";

/**
 * The only client-side bit of the 404 page — router.back() needs a handler.
 * Kept separate so not-found.tsx can stay a Server Component and export
 * its own metadata (a client page.tsx cannot).
 */
export function GoBackButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <YbButton
      variant="outline"
      size="lg"
      leftIcon={<ArrowLeft className="w-5 h-5" />}
      onClick={() => router.back()}
    >
      {label}
    </YbButton>
  );
}
