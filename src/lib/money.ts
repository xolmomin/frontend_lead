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
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 2 })
    .format(n)
    .replace(/[\u00A0\u202F]/g, " ");
}

/** "8600123456789012" -> "8600 1234 5678 9012" */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\s+/g, "");
  return digits.replace(/(.{4})/g, "$1 ").trim();
}
