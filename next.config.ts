import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false, // Disables the bottom-left 'N' dev tools icon
  // URLs from the previous site that Google still knows, sent to their real equivalents (308).
  // /blog has no equivalent and stays a 404: Google treats a redirect to an unrelated page as one.
  async redirects() {
    return [
      { source: '/projects', destination: '/work', permanent: true },
      { source: '/social', destination: '/contact', permanent: true },
      { source: '/profile.jpg', destination: '/Akshay_Headshot.jpg', permanent: true },
    ];
  },
  async headers() {
    return [
      // The OWASP secure-headers baseline, less what Vercel already sends (HSTS). No Content-Security-Policy: the
      // pre-paint scripts and JSON-LD are inline, and a nonce-based policy would render every page dynamically.
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // The site uses none of these; denying them also opts out of the Topics API, as /privacy promises no tracking.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
        ],
      },
      // Requested directly, /_not-found answers 200, and every real 404 names it as canonical.
      { source: '/_not-found', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
    ];
  },
};

export default nextConfig;
