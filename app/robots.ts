import type { MetadataRoute } from "next";

// Deliberately allows everything, including /email-signature-artifacts/. Those
// image URLs are embedded in already-sent email, and robots.txt is fetched by
// more than search crawlers — a Disallow there risks breaking mail clients that
// proxy images, retroactively and silently. The scratch page in that directory
// is kept out of search with a noindex meta tag on the page itself instead,
// which is also what Google prefers for de-indexing: a disallowed page is never
// crawled, so the crawler never sees the noindex.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: { userAgent: "*", allow: "/" },
        sitemap: "https://akshaydongare.com/sitemap.xml",
        host: "https://akshaydongare.com",
    };
}
