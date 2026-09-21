import type { Metadata } from "next";

const SITE = "https://akshaydongare.com";

/**
 * Per-page Open Graph and Twitter metadata.
 *
 * Next inherits `openGraph` wholesale from the nearest ancestor that declares it,
 * and the root layout declares one. Sub-pages that set only `title` and
 * `description` therefore served the HOMEPAGE's og:title, og:description and
 * og:url: a shared /work link previewed as the homepage and its og:url pointed at
 * the homepage, so the per-page <title> work was invisible to anything reading
 * Open Graph. Verified on production before the fix - all five sub-pages emitted
 * identical og: tags.
 *
 * `title` here stays bare so the root layout's "%s · Akshay Dongare" template
 * still applies to <title>; the og:title is built with the same suffix by hand,
 * because templates do not apply to Open Graph.
 */
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
        },
        twitter: {
            card: "summary_large_image",
            title: ogTitle,
            description,
        },
    };
}
