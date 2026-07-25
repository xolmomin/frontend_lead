import { LOCALE_COOKIE, type Locale } from "./config";

/** Persist the selected locale in a cookie (client-side only). */
export function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
