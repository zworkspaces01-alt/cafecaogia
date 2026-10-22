import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    // Cloudinary does the resizing/format negotiation, so no Next image optimizer
    // is needed on Cloudflare Workers.
    loader: "custom",
    loaderFile: "./src/lib/cloudinary-loader.ts",
  },

  // Baseline security headers. A script CSP would need nonces for the inline scripts (motion,
  // JSON-LD, analytics tags), so the policy only restricts framing, plugins and <base>.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
          },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },

  // Language routing lives here rather than in a proxy so it runs identically on Cloudflare.
  // Order matters: a saved choice (cookie) wins over the browser's Accept-Language.
  async redirects() {
    return [
      // www is the canonical host (as it was on Vercel), so the bare domain forwards to it.
      {
        source: "/:path*",
        has: [{ type: "host", value: "cafecaogia.com" }],
        destination: "https://www.cafecaogia.com/:path*",
        permanent: true,
      },
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
        // One param per path segment (OpenNext's router can't put a "/" inside a single param).
        // Language prefixes, /admin, /api and /_next are skipped, and so is anything with a dot in it
        // (icons, /brand assets, sitemap.xml…).
        source: "/:first((?!(?:en|ru|ar|admin|api|_next)(?:/|$))[^/.]+)/:rest([^/.]+)*",
        destination: "/en/:first/:rest*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

// Cloudflare bindings emulation for `next dev` only; not needed for builds.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
