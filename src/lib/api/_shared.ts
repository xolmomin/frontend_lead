/**
 * Normalizes the two list shapes the backend returns: a bare array, or a
 * paginated `{ items: [...] }` envelope.
 *
 * Anything else is a contract violation. Silently returning `[]` there is how a
 * total API breakage ends up looking like a perfectly working, empty app — so
 * unrecognized non-empty payloads are logged loudly instead.
 */
export function asList<T>(data: unknown, context?: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { items?: unknown }).items)
  ) {
    return (data as { items: T[] }).items;
  }
  if (data !== null && data !== undefined) {
    console.error(
      `[api] expected a list${context ? ` for ${context}` : ""}, got:`,
      data,
    );
  }
  return [];
}
