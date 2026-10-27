// Keyless live langchain-litellm stats: downloads from pepy's badge SVG, the same number as its keyed JSON API;
// releases from PyPI's JSON, as /about and /work say "N downloads across M releases" and a half-live pair would clash.

const BADGE_TOTAL = "https://static.pepy.tech/badge/langchain-litellm";
// Unrounded, so the monthly figure keeps a decimal: the default badge says "1M" where pepy's own page, which the
// figure links to, says 1.2M. The plain badge ignores units; the personalized one honours it.
const BADGE_MONTH = "https://static.pepy.tech/personalized-badge/langchain-litellm?period=month&units=none&left_text=downloads";
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
    /** True where a figure is FALLBACK's floor rather than a live count, so the copy says "over" outside the link. */
    floor: { total: boolean; monthly: boolean };
}

const SCALE: Record<string, string> = { K: "thousand", M: "million", B: "billion" };
const UNIT: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9 };

/** Floors as of 27 October 2026, when pepy said 16M and 1.2M and PyPI listed 34 releases with files. Rendered only
    at build or in dev when a source is down, and worded "over", so each must stay at or below the live figure.
    scripts/check-fallback.ts warns from CI when they fall more than 10% behind. */
export const FALLBACK = { compact: "15M", monthlyCompact: "1M", releases: 34 };

/** The all-time count and the releases only go up, so a live value under FALLBACK is a pepy or PyPI fault, "0" included.
    The monthly count can fall, so its floor is half FALLBACK's: a real slump still shows, an empty month does not. */
export const MIN_LIVE = { total: parseCount(FALLBACK.compact), monthly: parseCount(FALLBACK.monthlyCompact) / 2, releases: FALLBACK.releases };

/** "15M", "1.2m" or "1,234,567" -> a number; NaN for anything else. */
export function parseCount(value: string): number {
    const m = value.trim().match(/^(\d[\d.,]*)([KMBkmb])?$/);
    if (!m) return NaN;
    if (!m[2]) return Number(m[1].replace(/[,.]/g, ""));
    return Number(m[1].replace(/,/g, "")) * UNIT[m[2].toUpperCase()];
}

/** "15M" -> "15 million". Leaves anything unrecognised alone. */
function toLongForm(compact: string): string {
    // pepy is inconsistent about case: the total badge says "15M", the weekly
    // one says "181k". Match either so a format shift does not silently fall back.
    const m = compact.match(/^([\d.]+)([KMBkmb])$/);
    return m ? `${m[1]} ${SCALE[m[2].toUpperCase()]}` : compact;
}

/** A raw count -> "1.2M", rounded to one decimal as pepy's own page rounds it, since the figure links there, with
    ".0" dropped. A badge that is already compact ("1M") passes through, so pepy ignoring the units option degrades to
    the whole-number figure. */
function compactOneDecimal(value: string): string {
    if (/[KMB]$/.test(value)) return value;
    const n = Number(value.replace(/[,.\s]/g, ""));
    if (!Number.isFinite(n)) return value;
    // Largest unit first, and by the rounded value, so 999,960 is "1M" rather than "1000K".
    for (const [size, unit] of [[1e9, "B"], [1e6, "M"], [1e3, "K"]] as const) {
        const x = Math.round((n / size) * 10) / 10;
        if (x >= 1) return `${x}${unit}`;
    }
    return String(n);
}

async function fetchBadgeCount(url: string, min: number): Promise<string> {
    const res = await fetch(url, { next: { revalidate: REVALIDATE }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const svg = await res.text();
    // The badge repeats each label twice (drop shadow, then visible text);
    // the count is the last text node, the first is the word "downloads".
    const texts = [...svg.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map((m) => m[1].trim());
    const value = (texts[texts.length - 1] ?? "").toUpperCase();
    // Only accept a count, raw ("1,234,567") or compact ("1M"), at or above its floor, so a pepy error page or a
    // momentary "0" can never end up rendered as a statistic.
    const n = parseCount(value);
    if (Number.isNaN(n)) throw new Error(`not a count: ${JSON.stringify(value.slice(0, 40))}`);
    if (n < min) throw new Error(`${value} is below the floor of ${min}`);
    return value;
}

async function fetchReleaseCount(): Promise<number> {
    const res = await fetch(PYPI, { next: { revalidate: REVALIDATE }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { releases?: Record<string, unknown[]> };
    // Versions with no files are yanked or never uploaded; don't count them.
    const count = Object.values(data.releases ?? {}).filter((f) => Array.isArray(f) && f.length).length;
    if (count < MIN_LIVE.releases) throw new Error(`${count} releases is below the floor of ${MIN_LIVE.releases}`);
    return count;
}

/** The three live figures, each either its checked value or the reason it failed. */
export async function fetchLive() {
    const [total, monthly, releases] = await Promise.allSettled([
        fetchBadgeCount(BADGE_TOTAL, MIN_LIVE.total),
        fetchBadgeCount(BADGE_MONTH, MIN_LIVE.monthly),
        fetchReleaseCount(),
    ]);
    return { total, monthly, releases };
}

/** `next build` and `next dev` fall back, so a deploy never fails and local work runs offline. Everywhere else is a
    production server, where a revalidation that throws keeps serving the last page that rendered. */
function mayFallBack(): boolean {
    return process.env.NEXT_PHASE === "phase-production-build" || process.env.NODE_ENV !== "production";
}

export async function getPackageStats(): Promise<PackageStats> {
    const live = await fetchLive();
    const failed = Object.entries(live).flatMap(([name, r]) =>
        r.status === "rejected" ? [`${name}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`] : []);
    if (failed.length) {
        const message = `langchain-litellm stats: ${failed.join("; ")}`;
        // Thrown during an ISR revalidation, this keeps the last good page, and the message lands in the runtime logs.
        if (!mayFallBack()) throw new Error(`${message}. Keeping the last good page.`);
        console.warn(`${message}. Using the fallback floor.`);
    }
    const value = <T,>(r: PromiseSettledResult<T>) => (r.status === "fulfilled" ? r.value : null);
    const total = value(live.total);
    const monthly = value(live.monthly);
    const compact = total ?? FALLBACK.compact;
    const monthlyCompact = monthly ? compactOneDecimal(monthly) : FALLBACK.monthlyCompact;
    return {
        compact,
        long: toLongForm(compact),
        monthlyCompact,
        monthlyLong: toLongForm(monthlyCompact),
        releases: value(live.releases) ?? FALLBACK.releases,
        floor: { total: total === null, monthly: monthly === null },
    };
}
