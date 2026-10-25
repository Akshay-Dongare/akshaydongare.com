// Keyless live langchain-litellm stats: downloads from pepy's badge SVG, the same number as its keyed JSON API;
// releases from PyPI's JSON, as /about and /work say "N downloads across M releases" and a half-live pair would clash.

const BADGE_TOTAL = "https://static.pepy.tech/badge/langchain-litellm";
// Unrounded, so the monthly figure keeps a decimal: the default badge says "1M" where pepy's own page, which the
// figure links to, says 1.2M.
const BADGE_MONTH = "https://static.pepy.tech/badge/langchain-litellm/month?units=none";
const PYPI = "https://pypi.org/pypi/langchain-litellm/json";
const REVALIDATE = 3600; // 1h. Counts change daily and pepy caches 12h, so faster polling refetches the same value.

// The canonical path: /project/ is a 308 to this. Any filters in the address bar are added by pepy's own page on load.
export const PEPY_URL = "https://pepy.tech/projects/langchain-litellm";

// All-time figures link to the package on PyPI, which lists every release; pepy's header lags them, so pepy backs only the monthly count.
export const PYPI_URL = "https://pypi.org/project/langchain-litellm/";

export interface PackageStats {
    /** All-time, compact, for labels and chips: "15M". */
    compact: string;
    /** All-time, long, for prose: "15 million". */
    long: string;
    /** Last 30 days, compact, to one decimal: "1.2M". */
    monthlyCompact: string;
    /** Last 30 days, long: "1.2 million". */
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

/** A raw count -> "1.2M", rounded down to one decimal so a figure never overstates, with ".0" dropped. A badge that
    is already compact ("1M") passes through, so pepy ignoring the units option degrades to today's figure. */
function compactOneDecimal(value: string): string {
    if (/[KMB]$/.test(value)) return value;
    const n = Number(value.replace(/[,.\s]/g, ""));
    if (!Number.isFinite(n)) return value;
    for (const [size, unit] of [[1e9, "B"], [1e6, "M"], [1e3, "K"]] as const) {
        if (n >= size) return `${Math.floor((n / size) * 10) / 10}${unit}`;
    }
    return String(n);
}

async function fetchBadgeCount(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, { next: { revalidate: REVALIDATE }, signal: AbortSignal.timeout(5000) });
        if (!res.ok) return null;
        const svg = await res.text();
        // The badge repeats each label twice (drop shadow, then visible text);
        // the count is the last text node, the first is the word "downloads".
        const texts = [...svg.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map((m) => m[1].trim());
        const value = texts[texts.length - 1];
        // Only accept something shaped like a count, raw ("1,234,567") or compact ("1M"), so a pepy error page
        // can never end up rendered as a statistic.
        return /^\d[\d.,]*[KMBkmb]?$/.test(value ?? "") ? value.toUpperCase() : null;
    } catch {
        return null;
    }
}

async function fetchReleaseCount(): Promise<number | null> {
    try {
        const res = await fetch(PYPI, { next: { revalidate: REVALIDATE }, signal: AbortSignal.timeout(5000) });
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
    const monthlyCompact = monthly ? compactOneDecimal(monthly) : FALLBACK.monthlyCompact;
    return {
        compact,
        long: toLongForm(compact),
        monthlyCompact,
        monthlyLong: toLongForm(monthlyCompact),
        releases: releases ?? FALLBACK.releases,
    };
}
