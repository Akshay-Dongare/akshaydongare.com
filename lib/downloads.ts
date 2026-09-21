// Live package stats for langchain-litellm.
//
// Downloads come from pepy's badge SVG: their JSON API needs a key, the badge
// does not, and it carries the same number.
//
// On how fresh this can be: PyPI publishes download counts as a DAILY batch,
// so the underlying number changes once a day, not per install. pepy then
// caches the badge for 12h (cache-control: max-age=43200). Revalidating hourly
// means we pick up each new value within an hour of pepy publishing it, which
// is as live as this data gets anywhere. Polling faster would refetch an
// identical response; there is no real-time download feed to read.
//
// The release count comes from PyPI's public JSON, which needs no key either.
// It is fetched alongside because two sentences on the site read
// "N downloads across M releases" — making one live and leaving the other
// hardcoded would be worse than leaving both alone.

const BADGE_TOTAL = "https://static.pepy.tech/badge/langchain-litellm";
const BADGE_MONTH = "https://static.pepy.tech/badge/langchain-litellm/month";
const PYPI = "https://pypi.org/pypi/langchain-litellm/json";
const REVALIDATE = 3600; // 1h

export const PEPY_URL = "https://pepy.tech/project/langchain-litellm";

export interface PackageStats {
    /** All-time, compact, for labels and chips: "15M". */
    compact: string;
    /** All-time, long, for prose: "15 million". */
    long: string;
    /** Last 30 days, compact: "1M". */
    monthlyCompact: string;
    /** Last 30 days, long: "1 million". */
    monthlyLong: string;
    /** Released versions on PyPI. */
    releases: number;
}

/** Used whenever a fetch fails, so nothing ever renders blank where a figure belongs. */
const FALLBACK = { compact: "15M", monthlyCompact: "1M", releases: 27 };

const SCALE: Record<string, string> = { K: "thousand", M: "million", B: "billion" };

/** "15M" -> "15 million". Leaves anything unrecognised alone. */
function toLongForm(compact: string): string {
    // pepy is inconsistent about case: the total badge says "15M", the weekly
    // one says "181k". Match either so a format shift does not silently fall back.
    const m = compact.match(/^([\d.]+)([KMBkmb])$/);
    return m ? `${m[1]} ${SCALE[m[2].toUpperCase()]}` : compact;
}

async function fetchBadgeCount(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, { next: { revalidate: REVALIDATE } });
        if (!res.ok) return null;
        const svg = await res.text();
        // The badge repeats each label twice (drop shadow, then visible text);
        // the count is the last text node, the first is the word "downloads".
        const texts = [...svg.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map((m) => m[1].trim());
        const value = texts[texts.length - 1];
        // Only accept something shaped like a count, so a pepy error page can
        // never end up rendered as a statistic.
        return /^\d[\d.]*[KMBkmb]?$/.test(value ?? "") ? value.toUpperCase() : null;
    } catch {
        return null;
    }
}

async function fetchReleaseCount(): Promise<number | null> {
    try {
        const res = await fetch(PYPI, { next: { revalidate: REVALIDATE } });
        if (!res.ok) return null;
        const data = (await res.json()) as { releases?: Record<string, unknown[]> };
        // Versions with no files are yanked or never uploaded; don't count them.
        const count = Object.values(data.releases ?? {}).filter((f) => Array.isArray(f) && f.length).length;
        return count > 0 ? count : null;
    } catch {
        return null;
    }
}

export async function getPackageStats(): Promise<PackageStats> {
    const [total, monthly, releases] = await Promise.all([
        fetchBadgeCount(BADGE_TOTAL),
        fetchBadgeCount(BADGE_MONTH),
        fetchReleaseCount(),
    ]);
    const compact = total ?? FALLBACK.compact;
    const monthlyCompact = monthly ?? FALLBACK.monthlyCompact;
    return {
        compact,
        long: toLongForm(compact),
        monthlyCompact,
        monthlyLong: toLongForm(monthlyCompact),
        releases: releases ?? FALLBACK.releases,
    };
}
