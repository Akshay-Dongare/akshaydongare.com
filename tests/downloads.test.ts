import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { FALLBACK, getPackageStats } from "../lib/downloads.ts";

// pepy's badges repeat each label twice (drop shadow, then visible text); the count is the last text node.
const badge = (value: string) =>
    `<svg><text>downloads</text><text>downloads</text><text>${value}</text><text>${value}</text></svg>`;
// 35 releases with files, at the floor of 34 and one over, plus a yanked one with none.
const pypi = (withFiles: number) => JSON.stringify({
    releases: Object.fromEntries([
        ...Array.from({ length: withFiles }, (_, i) => [`0.${i}.0`, [{}]]),
        ["0.99.1", []],
    ]),
});

type Reply = string | { status: number; body?: string } | Error;
const realFetch = globalThis.fetch;
// Typed as read-only by @types/node, but the phase is plain environment, which is what the module reads.
const env = process.env as Record<string, string | undefined>;
const realEnv = { NODE_ENV: env.NODE_ENV, NEXT_PHASE: env.NEXT_PHASE };
const realWarn = console.warn;
afterEach(() => {
    globalThis.fetch = realFetch;
    console.warn = realWarn;
    for (const [k, v] of Object.entries(realEnv)) {
        if (v === undefined) delete env[k];
        else env[k] = v;
    }
});

// Answers the three requests getPackageStats makes: the all-time badge, the monthly badge and PyPI's JSON.
function serve({ total, month, releases = pypi(35) }: { total: Reply; month: Reply; releases?: Reply }) {
    console.warn = () => {};
    globalThis.fetch = (async (input: string | URL | Request) => {
        const url = String(input);
        const reply = url.includes("personalized-badge") ? month : url.includes("pypi.org") ? releases : total;
        if (reply instanceof Error) throw reply;
        return typeof reply === "string" ? new Response(reply) : new Response(reply.body ?? "", { status: reply.status });
    }) as typeof fetch;
}

// What `next dev`, `next build` and `next start` (or Vercel's runtime) set.
function phase(name: "dev" | "build" | "server") {
    env.NODE_ENV = name === "dev" ? "development" : "production";
    if (name === "build") env.NEXT_PHASE = "phase-production-build";
    else delete env.NEXT_PHASE;
}

const FALLBACK_STATS = {
    compact: "15M",
    long: "15 million",
    monthlyCompact: "1M",
    monthlyLong: "1 million",
    releases: 34,
    floor: { total: true, monthly: true },
};

test("formats the live figures", async () => {
    serve({ total: badge("16M"), month: badge("1,234,567") });
    assert.deepEqual(await getPackageStats(), {
        compact: "16M",
        long: "16 million",
        monthlyCompact: "1.2M",
        monthlyLong: "1.2 million",
        releases: 35, // the yanked 0.99.1 has no files
        floor: { total: false, monthly: false },
    });
});

test("rounds the monthly count to one decimal, as pepy's page does", async () => {
    for (const [raw, shown] of [["1149999", "1.1M"], ["1150000", "1.2M"], ["999960", "1M"], ["2,000,000", "2M"], ["612,345", "612.3K"]]) {
        serve({ total: badge("16M"), month: badge(raw) });
        assert.equal((await getPackageStats()).monthlyCompact, shown, raw);
    }
});

test("passes an already compact badge through, in either case", async () => {
    serve({ total: badge("16m"), month: badge("1M") });
    const stats = await getPackageStats();
    assert.equal(stats.compact, "16M");
    assert.equal(stats.long, "16 million");
    assert.equal(stats.monthlyLong, "1 million");
});

test("falls back rather than render an error page as a figure", async () => {
    serve({ total: "<html><body>Not found</body></html>", month: { status: 500 }, releases: new Error("offline") });
    assert.deepEqual(await getPackageStats(), FALLBACK_STATS);
});

test("rejects a 0, a value under the floor and a non-numeric badge", async () => {
    for (const [total, month] of [["0", "0"], ["14M", "499,999"], ["14.9M", "0.4M"], ["n/a", "inf"], ["-16M", "1e6"]]) {
        serve({ total: badge(total), month: badge(month), releases: pypi(33) });
        assert.deepEqual(await getPackageStats(), FALLBACK_STATS, `${total} / ${month}`);
    }
});

test("accepts a value at the floor", async () => {
    serve({ total: badge("15M"), month: badge("500,000"), releases: pypi(34) });
    const stats = await getPackageStats();
    assert.deepEqual([stats.compact, stats.monthlyCompact, stats.releases], ["15M", "500K", 34]);
    assert.deepEqual(stats.floor, { total: false, monthly: false });
});

test("marks only the figure that fell back as a floor", async () => {
    serve({ total: badge("16M"), month: badge("0") });
    const stats = await getPackageStats();
    assert.equal(stats.compact, "16M");
    assert.equal(stats.monthlyCompact, FALLBACK.monthlyCompact);
    assert.deepEqual(stats.floor, { total: false, monthly: true });
});

test("throws on a production server, so the last good page stays cached", async () => {
    phase("server");
    serve({ total: badge("0"), month: badge("1,234,567") });
    await assert.rejects(getPackageStats(), /total: 0 is below the floor/);
    serve({ total: badge("16M"), month: badge("1,234,567"), releases: new Error("offline") });
    await assert.rejects(getPackageStats(), /releases: offline/);
    serve({ total: badge("16M"), month: badge("1,234,567") });
    assert.equal((await getPackageStats()).compact, "16M");
});

test("falls back during next build and next dev, so neither breaks offline", async () => {
    for (const name of ["build", "dev"] as const) {
        phase(name);
        serve({ total: { status: 503 }, month: badge("0"), releases: new Error("offline") });
        assert.deepEqual(await getPackageStats(), FALLBACK_STATS, name);
    }
});
