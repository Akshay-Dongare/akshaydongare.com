// First-load JS budget, per route, from the last `npm run build`. Run with `npm run budget`; `npm run budget -- --update`
// rewrites e2e/budget.json from the current build with the standard headroom, for a pull request that means to grow.
//
// The figures come from .next/diagnostics/route-bundle-stats.json, which Next 16 writes on every build. Its chunk list
// for each page matches the <script> tags in the prerendered HTML exactly, less the nomodule polyfill a modern browser
// never fetches. It gives raw bytes only, so the gzipped size is measured here from the same chunks.
import { gzipSync } from "node:zlib";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

type RouteStats = { route: string; firstLoadUncompressedJsBytes: number; firstLoadChunkPaths: string[] };
type Budget = Record<string, { raw: number; gzip: number }>;

const STATS = ".next/diagnostics/route-bundle-stats.json";
const BUDGET = new URL("./budget.json", import.meta.url);
// Room for ordinary growth, and well under what the bundle savings were: Framer Motion's full bundle back would add
// 39KB raw and 10KB gzipped, three.js several hundred.
const RAW_HEADROOM = 20_000;
const GZIP_HEADROOM = 6_000;

if (!existsSync(STATS)) {
  console.error(`${STATS} is missing: run \`npm run build\` first. If the build ran, Next has moved or dropped the file.`);
  process.exit(1);
}

const stats: RouteStats[] = JSON.parse(readFileSync(STATS, "utf8"));
const measured = new Map(stats.map((s) => {
  const chunks = s.firstLoadChunkPaths.map((p) => {
    if (!existsSync(p)) throw new Error(`${p} is missing: the stats are from an older build than .next/static. Build again.`);
    return readFileSync(p);
  });
  const raw = chunks.reduce((sum, c) => sum + c.length, 0);
  if (raw !== s.firstLoadUncompressedJsBytes) throw new Error(`${s.route}: the chunks sum to ${raw}, the stats say ${s.firstLoadUncompressedJsBytes}`);
  return [s.route, { raw, gzip: chunks.reduce((sum, c) => sum + gzipSync(c).length, 0) }];
}));

const kb = (n: number) => `${(n / 1000).toFixed(1)}KB`;

if (process.argv.includes("--update")) {
  const next: Budget = {};
  for (const [route, m] of measured) {
    next[route] = {
      raw: Math.ceil((m.raw + RAW_HEADROOM) / 5_000) * 5_000,
      gzip: Math.ceil((m.gzip + GZIP_HEADROOM) / 1_000) * 1_000,
    };
  }
  writeFileSync(BUDGET, JSON.stringify(next, null, 2) + "\n");
  console.log(`Wrote ${BUDGET.pathname}`);
  process.exit(0);
}

const budget: Budget = JSON.parse(readFileSync(BUDGET, "utf8"));
const failures: string[] = [];
for (const [route, m] of measured) {
  const b = budget[route];
  if (!b) {
    failures.push(`${route} has no budget: add one to e2e/budget.json, or run \`npm run budget -- --update\``);
    continue;
  }
  const over = m.raw > b.raw || m.gzip > b.gzip;
  console.log(`${over ? "OVER" : "ok  "} ${route.padEnd(12)} ${kb(m.raw).padStart(9)} / ${kb(b.raw)} raw   ${kb(m.gzip).padStart(8)} / ${kb(b.gzip)} gzip`);
  if (over) failures.push(`${route} is over its first-load JS budget`);
}
for (const route of Object.keys(budget)) {
  if (!measured.has(route)) failures.push(`${route} has a budget but the build has no such route; remove it from e2e/budget.json`);
}
if (failures.length) {
  console.error(`\n${failures.join("\n")}`);
  process.exit(1);
}
