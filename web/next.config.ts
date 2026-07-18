import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // terms.html used to meta-refresh straight to privacy.html
      { source: "/terms", destination: "/privacy", permanent: true },
      { source: "/terms.html", destination: "/privacy", permanent: true },
      { source: "/privacy.html", destination: "/privacy", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/portal.html", destination: "/portal", permanent: true },
    ];
  },
  async headers() {
    // Next.js dev mode wraps every module in eval() for HMR/source maps, so
    // 'unsafe-eval' is required in development. Production bundles never use
    // eval(), so the stricter policy applies there.
    const scriptSrc = process.env.NODE_ENV === "production" ? "'self' 'unsafe-inline'" : "'self' 'unsafe-inline' 'unsafe-eval'";
    return [
      {
        // Ported from portal.html's CSP meta tag. The unpkg.com allowance is
        // dropped: React is now bundled by Next.js instead of loaded from a
        // CDN <script>, so that hole no longer needs to exist.
        source: "/portal",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'`,
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
