import { expect, test } from "@playwright/test";
import { PEPY_URL, PYPI_URL } from "../lib/downloads.ts";
import { skipBoot } from "./helpers";

// AGENTS.md, Download figures link the number, not the sentence: every figure in prose is a link that holds the number
// alone, all-time to PyPI and the last 30 days to pepy, and every claim pill is a link to the same two. The /work card
// and /about's monthly figure once rendered as plain text.
for (const path of ["/", "/work", "/about"]) {
  test(`${path} links every download figure to its source`, async ({ page }) => {
    await skipBoot(page);
    await page.goto(path);
    const found = await page.evaluate(() => {
      const main = document.querySelector("main");
      if (!main) return [];
      const out: { figure: string; linkText: string | null; href: string | null; after: string }[] = [];
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent ?? "";
        // Prose figures ("16 million") and claim pills ("16M downloads", "1.1M+ a month").
        for (const m of text.matchAll(/\d+(?:\.\d+)?(?:\s(?:thousand|million|billion)\b|[KMB]\+?\s(?:downloads|a month))/g)) {
          const link = node.parentElement?.closest("a") ?? null;
          // The words after the figure say which it is, read past the link or, for a bare figure, past the match.
          let after = link ? "" : text.slice((m.index ?? 0) + m[0].length);
          for (let s = (link ?? node).nextSibling; s && after.length < 40; s = s.nextSibling) after += s.textContent ?? "";
          out.push({ figure: m[0], linkText: link?.textContent?.trim() ?? null, href: link?.getAttribute("href") ?? null, after: after.trim() });
        }
      }
      return out;
    });

    const pill = (f: { figure: string }) => /[KMB]\+?\s/.test(f.figure);
    const monthly = (f: { figure: string; after: string }) =>
      pill(f) ? f.figure.endsWith("a month") : /^(every month|downloads a month)/.test(f.after);
    for (const f of found) {
      expect(f.href, `${f.figure} is a link`).toBe(monthly(f) ? PEPY_URL : PYPI_URL);
      if (!pill(f)) expect(f.linkText, `the link holds ${f.figure} alone`).toBe(f.figure);
    }
    // Both kinds are on each of these pages, so a figure the pattern stopped matching fails here rather than passing.
    expect(found.filter((f) => !pill(f) && !monthly(f)).length, "an all-time figure").toBeGreaterThan(0);
    expect(found.filter((f) => !pill(f) && monthly(f)).length, "a monthly figure").toBeGreaterThan(0);
  });
}
