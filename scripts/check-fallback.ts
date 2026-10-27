// Warns from CI when FALLBACK in lib/downloads.ts has fallen more than 10% behind the live figures, or is no longer a
// floor under them. Never fails the job: CI runs on every pull request, Dependabot's weekly ones included, so this
// needs no schedule of its own, and a pepy or PyPI outage must not turn a pull request red.
import { FALLBACK, fetchLive, parseCount } from "../lib/downloads.ts";

const warn = (message: string) => console.log(`::warning title=Download figures::${message}`);

/** Whole units under the true count, in the largest unit it reaches: "16M" -> 15M, 812,000 -> 812K. A compact badge
    may be rounded, so take off half its last digit first. */
function floorOf(badge: string): number {
    const decimals = badge.match(/\.(\d+)[KMB]$/)?.[1].length ?? 0;
    const slack = /[KMB]$/.test(badge) ? parseCount(badge.replace(/[\d.,]+/, "1")) / 10 ** decimals / 2 : 0;
    const n = parseCount(badge) - slack;
    const unit = [1e9, 1e6, 1e3].find((u) => n >= u) ?? 1;
    return Math.floor(n / unit) * unit;
}

const compact = (n: number) =>
    n >= 1e9 ? `${n / 1e9}B` : n >= 1e6 ? `${n / 1e6}M` : n >= 1e3 ? `${n / 1e3}K` : String(n);

async function main() {
    const live = await fetchLive();
    const problems: string[] = [];
    for (const [name, r] of Object.entries(live)) {
        if (r.status === "rejected") problems.push(`${name}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
    }
    if (problems.length) {
        warn(`Could not check FALLBACK against live figures (${problems.join("; ")}).`);
        return;
    }
    const [total, monthly, releases] = [live.total, live.monthly, live.releases].map((r) => (r.status === "fulfilled" ? r.value : null));
    const floor = {
        total: floorOf(String(total)),
        monthly: floorOf(String(monthly)),
        releases: Number(releases),
    };
    const current = { total: parseCount(FALLBACK.compact), monthly: parseCount(FALLBACK.monthlyCompact), releases: FALLBACK.releases };
    const drifted = (Object.keys(floor) as (keyof typeof floor)[]).filter(
        (k) => current[k] < 0.9 * floor[k] || current[k] > floor[k]);
    const suggestion = `{ compact: "${compact(floor.total)}", monthlyCompact: "${compact(floor.monthly)}", releases: ${floor.releases} }`;
    console.log(`Live: ${total} all-time, ${monthly} in the last 30 days, ${releases} releases. Floors: ${suggestion}.`);
    if (drifted.length) {
        warn(`FALLBACK in lib/downloads.ts has drifted (${drifted.join(", ")}): live is ${total} all-time, ${monthly} a month, ` +
            `${releases} releases. Paste in: const FALLBACK = ${suggestion};`);
    }
}

main().catch((e) => warn(`check-fallback failed: ${e instanceof Error ? e.message : String(e)}`)).finally(() => { process.exitCode = 0; });
