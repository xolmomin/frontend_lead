import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  // Dev access through the cloudflared tunnel host.
  allowedDevOrigins: ["rotary-country-brisbane-toolbox.trycloudflare.com"],
  images: {
    remotePatterns: [
      // Brand assets (logos).
      { protocol: "https", hostname: "cdn.lidlar.uz", pathname: "/static/**" },
      // YouTube thumbnails on the landing page.
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },
  experimental: {
    // lucide-react and recharts are optimized by Next out of the box; the
    // Hugeicons barrel (a single 600 KB re-export module) is not.
    optimizePackageImports: ["@hugeicons/core-free-icons"],
  },
  // NOTE: typedRoutes (stable in Next 16) is deliberately off. Turning it on
  // fails the build today because the footer links to /privacy-policy,
  // /terms-of-service and /data-deletion, none of which exist as routes.
  // Enable it once those pages land.
};

export default withNextIntl(nextConfig);
