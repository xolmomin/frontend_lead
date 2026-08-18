/**
 * Shared placeholder for the auth card. Used both by (auth)/loading.tsx and by
 * the <Suspense> boundaries the pages need around useSearchParams().
 */
export function AuthFormSkeleton() {
  return (
    <div className="w-full max-w-md animate-pulse space-y-4" aria-busy="true">
      <div className="mx-auto h-20 w-20 rounded-2xl bg-muted" />
      <div className="mx-auto h-8 w-48 rounded-lg bg-muted" />
      <div className="h-12 rounded-lg bg-muted" />
      <div className="h-12 rounded-lg bg-muted" />
      <div className="h-12 rounded-lg bg-muted" />
      <div className="h-px bg-muted" />
      <div className="h-12 rounded-lg bg-muted" />
    </div>
  );
}
