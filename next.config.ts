import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    // Cloudinary does the resizing/format negotiation, so no Next image optimizer
    // is needed on Cloudflare Workers.
    loader: "custom",
    loaderFile: "./src/lib/cloudinary-loader.ts",
  },

  // Language routing lives here rather than in a proxy so it runs identically on Cloudflare.
  // Order matters: a saved choice (cookie) wins over the browser's Accept-Language.
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "cookie", key: "NEXT_LOCALE", value: "(?<locale>en|ru|ar)" }],
        destination: "/:locale",
        permanent: false,
      },
      {
        source: "/",
        has: [{ type: "header", key: "accept-language", value: "^\\s*ru.*" }],
        destination: "/ru",
        permanent: false,
      },
      {
        source: "/",
        has: [{ type: "header", key: "accept-language", value: "^\\s*ar.*" }],
        destination: "/ar",
        permanent: false,
      },
      { source: "/", destination: "/en", permanent: false },
      // Old or hand-typed links without a language, e.g. /products → /en/products.
      {
        // Anything with a file extension (icons, /brand assets, sitemap.xml…) is left alone.
        source: "/:path((?!en(?:/|$)|ru(?:/|$)|ar(?:/|$)|admin(?:/|$)|_next/)(?!.*\\.\\w+$).+)",
        destination: "/en/:path",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
