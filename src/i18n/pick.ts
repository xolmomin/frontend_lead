import type { Locale } from "./config";

/**
 * Namespaces every route needs: `common` is used app-wide, `nav`/`navigation`
 * feed the sidebar and page titles. Kept small on purpose — this is the slice
 * the root layout ships on every single request.
 */
export const SHARED_NAMESPACES = ["common", "nav", "navigation"] as const;

type Messages = Record<string, unknown>;

/**
 * Narrows the message catalog to the given top-level namespaces.
 *
 * The full catalog is ~150 KB (uz) / ~200 KB (ru) and used to be serialized
 * into the RSC payload of every route — `/login` was shipping the entire
 * `integrations` and `reports` trees. Every `useTranslations(...)` call in the
 * codebase is rooted at a top-level key, so slicing by that key is safe.
 *
 * Nested NextIntlClientProviders replace rather than merge, so the shared
 * namespaces are always included.
 */
export function pickMessages(
  messages: Messages,
  namespaces: readonly string[],
): Messages {
  const wanted = new Set<string>([...SHARED_NAMESPACES, ...namespaces]);
  const out: Messages = {};
  for (const key of wanted) {
    if (key in messages) out[key] = messages[key];
  }
  return out;
}

export type { Locale };
