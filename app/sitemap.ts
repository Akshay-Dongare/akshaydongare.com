import type { MetadataRoute } from "next";

const BASE = "https://akshaydongare.com";

// Every route is statically prerendered, so there is nothing dynamic to
// enumerate — listing them explicitly keeps this honest about what exists.
// Priority orders them the way a stranger should meet them: the argument, then
// the evidence, then how to reach him; the boilerplate pages trail.
// lastModified is set by hand: bump a route's date only when its main content changes.
// Google stops trusting lastmod that moves on every deploy.
const ROUTES: Array<{ path: string; lastModified: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "/", lastModified: "2026-09-23", priority: 1.0, changeFrequency: "monthly" },
    { path: "/work", lastModified: "2026-09-22", priority: 0.9, changeFrequency: "monthly" },
    { path: "/about", lastModified: "2026-09-22", priority: 0.9, changeFrequency: "monthly" },
    { path: "/contact", lastModified: "2026-09-21", priority: 0.8, changeFrequency: "yearly" },
    { path: "/colophon", lastModified: "2026-09-21", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacy", lastModified: "2026-09-21", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
    return ROUTES.map(({ path, lastModified, priority, changeFrequency }) => ({
        url: `${BASE}${path}`,
        lastModified,
        changeFrequency,
        priority,
    }));
}
