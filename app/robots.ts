import type { MetadataRoute } from "next";

// Allows all, even /email-signature-artifacts/: its images are in sent email, and a Disallow can break image proxies.
// Its scratch page uses a noindex meta instead, which Google prefers: a disallowed page is never crawled to see it.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: { userAgent: "*", allow: "/" },
        sitemap: "https://akshaydongare.com/sitemap.xml",
        host: "https://akshaydongare.com",
    };
}
