import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  // Dev access through the cloudflared tunnel host.
  allowedDevOrigins: ["rotary-country-brisbane-toolbox.trycloudflare.com"],
};

export default withNextIntl(nextConfig);
