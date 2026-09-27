import type { Metadata } from "next";

const SITE = "https://akshaydongare.com";

/** Next inherits `openGraph` whole from the root layout, so a page that sets only a title previews as the homepage.
 *  `title` stays bare for the root "%s · Akshay Dongare" template; og:title adds the suffix itself, as OG skips it. */
export function pageMetadata({
    title,
    description,
    path,
}: {
    title: string;
    description: string;
    /** Route path with a leading slash, e.g. "/work". */
    path: string;
}): Metadata {
    const ogTitle = `${title} · Akshay Dongare`;

    return {
        title,
        description,
        openGraph: {
            title: ogTitle,
            description,
            url: `${SITE}${path}`,
            siteName: "Akshay Dongare",
            locale: "en_US",
            type: "website",
            // A page-level openGraph replaces the parent's, dropping the root opengraph-image.tsx, so it is listed
            // again here; without it summary_large_image degrades to a bare text card.
            images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Akshay Dongare, AI Platform Engineer" }],
        },
        twitter: {
            card: "summary_large_image",
            title: ogTitle,
            description,
            images: ["/opengraph-image"],
        },
    };
}
