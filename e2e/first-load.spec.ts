import { expect, test } from "@playwright/test";
import { skipBoot } from "./helpers";

// AGENTS.md, Particle Systems: both fields mount once the reader scrolls toward them, so an unscrolled homepage load
// fetches no three.js. This catches a dynamic import firing too early, which the build's first-load figures cannot see.
const THREE_MARKER = "THREE.WebGLRenderer";

test("an unscrolled homepage load fetches no three.js, and scrolling does", async ({ page }) => {
  const scripts: Promise<string>[] = [];
  page.on("response", (r) => {
    if (r.request().resourceType() === "script") scripts.push(r.text().catch(() => ""));
  });
  const fetchedThree = async () => (await Promise.all(scripts)).some((body) => body.includes(THREE_MARKER));

  await skipBoot(page);
  await page.goto("/", { waitUntil: "networkidle" });
  expect(await fetchedThree()).toBe(false);
  await expect(page.locator("canvas")).toHaveCount(0);

  // The control: the marker must still name three's bundle, or the first half would pass for nothing.
  await page.evaluate(() => window.scrollBy(0, innerHeight));
  await expect.poll(fetchedThree).toBe(true);
});
