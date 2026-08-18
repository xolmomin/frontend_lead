/**
 * Streams inside DashboardShell (sidebar + header already painted), so this
 * only has to stand in for <main>'s contents.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true">
      <div className="h-8 w-56 rounded-lg bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-muted" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
