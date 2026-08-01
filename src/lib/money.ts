/**
 * "49 000" style sum formatting — uz-UZ grouping with regular spaces so the
 * output matches the design regardless of the ICU space variant (NBSP/NNBSP).
 */
export function formatSum(
  value: string | number | null | undefined,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return null;
  // Manual grouping \u2014 Intl's uz-UZ output differs between Node and browsers
  // (comma vs space), which breaks SSR hydration.
  const [int, frac] = String(Math.round(n * 100) / 100).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return frac ? `${grouped}.${frac}` : grouped;
}

/** "8600123456789012" -> "8600 1234 5678 9012" */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\s+/g, "");
  return digits.replace(/(.{4})/g, "$1 ").trim();
}
