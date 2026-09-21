// Live PyPI download total for langchain-litellm, read from the pepy badge.
//
// pepy's JSON API needs a key; the badge SVG does not, and it carries the same
// number. pepy serves it with cache-control: max-age=43200, so the upstream
// value only moves twice a day. Revalidating faster than that would just refetch
// an identical response, hence the six-hour window below.

const BADGE = "https://static.pepy.tech/badge/langchain-litellm";
export const PEPY_URL = "https://pepy.tech/project/langchain-litellm";

/** Shown if the fetch fails, so the page never renders a blank where a number belongs. */
export const DOWNLOADS_FALLBACK = "15M";

export async function getDownloadCount(): Promise<string> {
    try {
        const res = await fetch(BADGE, { next: { revalidate: 21600 } });
        if (!res.ok) return DOWNLOADS_FALLBACK;

        const svg = await res.text();
        // The badge repeats each label twice (drop shadow, then the visible text).
        // The count is the last text node; the first is the word "downloads".
        const texts = [...svg.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map((m) => m[1].trim());
        const value = texts[texts.length - 1];

        // Only accept something that actually looks like a count, so a pepy error
        // page can never end up rendered as a statistic.
        return /^\d[\d.]*[KMB]?$/.test(value ?? "") ? value : DOWNLOADS_FALLBACK;
    } catch {
        return DOWNLOADS_FALLBACK;
    }
}
