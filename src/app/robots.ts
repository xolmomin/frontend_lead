import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lidlar.uz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything behind auth, plus the OAuth landing pages, which only ever
      // hold single-use codes.
      disallow: ["/dashboard/", "/oauth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
