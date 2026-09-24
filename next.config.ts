import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  devIndicators: false, // Disables the bottom-left 'N' dev tools icon
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  // URLs from the previous site that Google still knows, sent to their real equivalents (308).
  // /blog has no equivalent and stays a 404: Google treats a redirect to an unrelated page as one.
  async redirects() {
    return [
      { source: '/projects', destination: '/work', permanent: true },
      { source: '/social', destination: '/contact', permanent: true },
      { source: '/profile.jpg', destination: '/Akshay_Headshot.jpg', permanent: true },
    ];
  },
  // Requested directly, /_not-found answers 200, and every real 404 names it as canonical.
  async headers() {
    return [{ source: '/_not-found', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] }];
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

export default withMDX(nextConfig);
