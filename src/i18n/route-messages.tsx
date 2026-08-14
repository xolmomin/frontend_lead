import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { pickMessages } from "./pick";

/**
 * Server wrapper that hands a route's client tree only the message namespaces
 * it actually uses, on top of the shared ones the root layout already ships.
 *
 * Server Components are unaffected either way — they read messages through
 * next-intl's request config, not this provider.
 */
export async function RouteMessages({
  namespaces,
  children,
}: {
  namespaces: readonly string[];
  children: ReactNode;
}) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={pickMessages(messages, namespaces)}>
      {children}
    </NextIntlClientProvider>
  );
}
