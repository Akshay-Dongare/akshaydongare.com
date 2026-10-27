import { expect, test } from "@playwright/test";
import { skipBoot } from "./helpers";

// The OWASP baseline from next.config.ts, on every path.
const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
};

const PAGES = ["/", "/about", "/work", "/contact", "/privacy", "/colophon"];
const FILES = ["/robots.txt", "/sitemap.xml", "/opengraph-image", "/favicon.ico", "/icon.png", "/apple-icon.png"];

for (const path of PAGES) {
  test(`${path} answers 200 with the security headers and logs no errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(e.message));
    await skipBoot(page);
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    expect(response?.headers()).toMatchObject(SECURITY_HEADERS);
    expect(errors).toEqual([]);
  });
}

test("files answer 200 with the security headers", async ({ request }) => {
  for (const path of FILES) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers(), path).toMatchObject(SECURITY_HEADERS);
  }
});

// AGENTS.md, Search: every real 404 names /_not-found as canonical, so it must never be indexed. Vercel answers it
// 200 when requested directly and next start answers 404, so only the header is asserted.
test("/_not-found is noindex, and an unknown path is a real 404", async ({ request }) => {
  const notFound = await request.get("/_not-found");
  expect(notFound.headers()["x-robots-tag"]).toBe("noindex");
  const missing = await request.get("/blog");
  expect(missing.status()).toBe(404);
  expect(missing.headers()).toMatchObject(SECURITY_HEADERS);
});

test("the previous site's URLs redirect permanently", async ({ request }) => {
  for (const [from, to] of [["/projects", "/work"], ["/social", "/contact"], ["/profile.jpg", "/Akshay_Headshot.jpg"]]) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(308);
    expect(response.headers().location, from).toBe(to);
  }
});
