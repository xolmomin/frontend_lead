import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { cn } from "@/lib/utils";
import { pickMessages } from "@/i18n/pick";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

// Headings only. Cyrillic subset is required — the `ru` locale ships the same
// markup. Weights are pinned to the four the type scale in globals.css uses.
const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-heading-family",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lidlar.uz";
const OG_IMAGE = "https://cdn.lidlar.uz/static/logo2.png";

const TITLE = "Lidlar — Facebook lidlarni CRM ga avtomatik yuboring";
const DESCRIPTION =
  "Facebook Lead Ads lidlarini Telegram, Google Sheets, Bitrix24 va amoCRM ga avtomatik yuborish xizmati.";

export const metadata: Metadata = {
  // Required before any URL-based metadata field may use a relative path.
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Lidlar",
  },
  description: DESCRIPTION,
  applicationName: "Lidlar",
  alternates: {
    canonical: "/",
    // Both locales are served from the same URL (locale lives in a cookie),
    // so every alternate points at the canonical path.
    languages: { uz: "/", ru: "/" },
  },
  openGraph: {
    type: "website",
    siteName: "Lidlar",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    locale: "uz_UZ",
    alternateLocale: ["ru_RU"],
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Lidlar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      // globals.css sets scroll-behavior: smooth. Next 16 no longer overrides
      // that during navigation unless this attribute is present, so without it
      // every route change animates a long scroll to top instead of jumping.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        inter.variable,
        manrope.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        {/*
          Only the shared namespaces. Routes that need more wrap their own tree
          in <RouteMessages> — shipping the whole catalog here put ~150-200 KB
          of translations into every page's RSC payload.
        */}
        <NextIntlClientProvider
          locale={locale}
          messages={pickMessages(messages, [])}
        >
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
