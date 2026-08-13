/** Format a phone value as the user types: "+998 90 123 45 67". */
export function formatPhoneInput(value: string): string {
  const match = value.replace(/\D/g, "").match(/^998(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})$/);
  if (!match) return "+998";
  let out = "+998";
  if (match[1]) out += ` ${match[1]}`;
  if (match[2]) out += ` ${match[2]}`;
  if (match[3]) out += ` ${match[3]}`;
  if (match[4]) out += ` ${match[4]}`;
  return out;
}

/** Strip spaces before sending to the backend. */
export function normalizePhone(value: string): string {
  return value.replace(/\s/g, "");
}

/** Canonical form the backend stores: digits only, no "+" ("998901234567"). */
export function toDigits(value: string): string {
  return value.replace(/\D/g, "");
}
