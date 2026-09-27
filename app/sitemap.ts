import type { MetadataRoute } from "next";

const BASE = "https://akshaydongare.com";

// Every route is static, so they are listed by hand; priority runs argument, evidence, contact, then boilerplate.
// Bump a lastModified only when that route's main content changes (AGENTS.md, Search).
const ROUTES: Array<{ path: string; lastModified: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "/", lastModified: "2026-09-26", priority: 1.0, changeFrequency: "monthly" },
    { path: "/work", lastModified: "2026-09-24", priority: 0.9, changeFrequency: "monthly" },
    { path: "/about", lastModified: "2026-09-24", priority: 0.9, changeFrequency: "monthly" },
    { path: "/contact", lastModified: "2026-09-21", priority: 0.8, changeFrequency: "yearly" },
    { path: "/colophon", lastModified: "2026-09-24", priority: 0.3, changeFrequency: "yearly" },
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
