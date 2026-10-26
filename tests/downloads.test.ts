import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { getPackageStats } from "../lib/downloads.ts";

// pepy's badges repeat each label twice (drop shadow, then visible text); the count is the last text node.
const badge = (value: string) =>
    `<svg><text>downloads</text><text>downloads</text><text>${value}</text><text>${value}</text></svg>`;
const releases = JSON.stringify({ releases: { "0.1.0": [{}], "0.2.0": [{}], "0.2.1": [] } });

type Reply = string | { status: number; body?: string } | Error;
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

// Answers the three requests getPackageStats makes: the all-time badge, the monthly badge and PyPI's JSON.
function serve({ total, month, pypi = releases }: { total: Reply; month: Reply; pypi?: Reply }) {
    globalThis.fetch = (async (input: string | URL | Request) => {
        const url = String(input);
        const reply = url.includes("personalized-badge") ? month : url.includes("pypi.org") ? pypi : total;
        if (reply instanceof Error) throw reply;
        return typeof reply === "string" ? new Response(reply) : new Response(reply.body ?? "", { status: reply.status });
    }) as typeof fetch;
}

test("formats the live figures", async () => {
    serve({ total: badge("16M"), month: badge("1,234,567") });
    assert.deepEqual(await getPackageStats(), {
        compact: "16M",
        long: "16 million",
        monthlyCompact: "1.2M",
        monthlyLong: "1.2 million",
        releases: 2, // the yanked 0.2.1 has no files
    });
});

test("rounds the monthly count to one decimal, as pepy's page does", async () => {
    for (const [raw, shown] of [["1149999", "1.1M"], ["1150000", "1.2M"], ["999960", "1M"], ["2,000,000", "2M"], ["950", "1K"]]) {
        serve({ total: badge("16M"), month: badge(raw) });
        assert.equal((await getPackageStats()).monthlyCompact, shown, raw);
    }
});

test("passes an already compact badge through, in either case", async () => {
    serve({ total: badge("181k"), month: badge("1M") });
    const stats = await getPackageStats();
    assert.equal(stats.compact, "181K");
    assert.equal(stats.long, "181 thousand");
    assert.equal(stats.monthlyLong, "1 million");
});

test("falls back rather than render an error page as a figure", async () => {
    serve({ total: "<html><body>Not found</body></html>", month: { status: 500 }, pypi: new Error("offline") });
    assert.deepEqual(await getPackageStats(), {
        compact: "15M",
        long: "15 million",
        monthlyCompact: "1M",
        monthlyLong: "1 million",
        releases: 27,
    });
});
