"use client";

import "./globals.css";

/**
 * Last-resort boundary: it replaces the root layout, so it renders outside
 * every provider — no NextIntlClientProvider, no ThemeProvider, no fonts.
 * That is why the copy is hardcoded in the default locale (uz) instead of
 * going through next-intl, and why it ships its own <html>/<body>.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-white text-foreground antialiased">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md text-center">
            <p className="mb-4 text-6xl font-black text-muted-foreground/50">
              500
            </p>
            <h1 className="mb-3 text-2xl font-bold">
              Nimadir noto&apos;g&apos;ri ketdi
            </h1>
            <p className="mb-6 text-muted-foreground">
              Ilovani yuklab bo&apos;lmadi. Qaytadan urinib ko&apos;ring.
            </p>
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Qaytadan urinish
            </button>
            {error.digest && (
              <p className="mt-8 font-mono text-xs text-muted-foreground/70">
                Xato kodi: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
