import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lidlar.uz";

/**
 * Only the publicly indexable routes. The dashboard is behind auth and the
 * locale lives in a cookie, so there are no per-locale URLs to list.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/login`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/register`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
