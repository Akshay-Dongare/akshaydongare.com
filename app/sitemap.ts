import type { MetadataRoute } from "next";

const BASE = "https://akshaydongare.com";

// Every route is statically prerendered, so there is nothing dynamic to
// enumerate — listing them explicitly keeps this honest about what exists.
// Priority orders them the way a stranger should meet them: the argument, then
// the evidence, then how to reach him; the boilerplate pages trail.
const ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "/", priority: 1.0, changeFrequency: "monthly" },
    { path: "/work", priority: 0.9, changeFrequency: "monthly" },
    { path: "/about", priority: 0.9, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.8, changeFrequency: "yearly" },
    { path: "/colophon", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();
    return ROUTES.map(({ path, priority, changeFrequency }) => ({
        url: `${BASE}${path}`,
        lastModified,
        changeFrequency,
        priority,
    }));
}
