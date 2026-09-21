// Live package stats for langchain-litellm.
//
// Downloads come from pepy's badge SVG: their JSON API needs a key, the badge
// does not, and it carries the same number. pepy serves it with
// cache-control: max-age=43200, so the value only moves twice a day and there
// is nothing to gain from polling harder than the six-hour window below.
//
// The release count comes from PyPI's public JSON, which needs no key either.
// It is fetched alongside because two sentences on the site read
// "N downloads across M releases" — making one live and leaving the other
// hardcoded would be worse than leaving both alone.

const BADGE = "https://static.pepy.tech/badge/langchain-litellm";
const PYPI = "https://pypi.org/pypi/langchain-litellm/json";
const REVALIDATE = 21600; // 6h

export const PEPY_URL = "https://pepy.tech/project/langchain-litellm";

export interface PackageStats {
    /** Compact form for labels and chips, e.g. "15M". */
    compact: string;
    /** Long form for prose, e.g. "15 million". */
    long: string;
    /** Number of released versions on PyPI. */
    releases: number;
}

/** Used whenever a fetch fails, so nothing ever renders blank where a figure belongs. */
const FALLBACK: PackageStats = { compact: "15M", long: "15 million", releases: 27 };

const SCALE: Record<string, string> = { K: "thousand", M: "million", B: "billion" };

/** "15M" -> "15 million". Leaves anything unrecognised alone. */
function toLongForm(compact: string): string {
    const m = compact.match(/^([\d.]+)([KMB])$/);
    return m ? `${m[1]} ${SCALE[m[2]]}` : compact;
}

async function fetchDownloads(): Promise<string | null> {
    try {
        const res = await fetch(BADGE, { next: { revalidate: REVALIDATE } });
        if (!res.ok) return null;
        const svg = await res.text();
        // The badge repeats each label twice (drop shadow, then visible text);
        // the count is the last text node, the first is the word "downloads".
        const texts = [...svg.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map((m) => m[1].trim());
        const value = texts[texts.length - 1];
        // Only accept something shaped like a count, so a pepy error page can
        // never end up rendered as a statistic.
        return /^\d[\d.]*[KMB]?$/.test(value ?? "") ? value : null;
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
    const [downloads, releases] = await Promise.all([fetchDownloads(), fetchReleaseCount()]);
    const compact = downloads ?? FALLBACK.compact;
    return {
        compact,
        long: toLongForm(compact),
        releases: releases ?? FALLBACK.releases,
    };
}
