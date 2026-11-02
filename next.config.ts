import type { NextConfig } from 'next';

// Static, so every page stays prerendered: a nonce would render each request. Inline scripts are Next's RSC payload,
// which changes per page and build so no hash can follow it, and the two pre-paint scripts.
const CSP: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", ...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'"] : [])],
  'script-src-attr': ["'none'"],
  'style-src': ["'self'", "'unsafe-inline'"], // React's and Framer Motion's style attributes
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
};

const csp = Object.entries(CSP).map(([name, sources]) => [name, ...sources].join(' ')).join('; ');

const nextConfig: NextConfig = {
  devIndicators: false, // Disables the bottom-left 'N' dev tools icon
  poweredByHeader: false,
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
      // The OWASP secure-headers baseline, less what Vercel already sends (HSTS).
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
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
