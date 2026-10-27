import { expect, test } from "@playwright/test";
import { effectiveOpacity } from "./helpers";

// AGENTS.md, Search: Google renders in a tall viewport and every h-svh section stretches with it, so a hero revealed
// on scroll stayed at its server-rendered opacity:0. First-screen reveals run on mount. The facts row sits at the
// hero's foot, about 4,800px down here, outside the -10% margin the site's in-view reveals use.
test.use({ viewport: { width: 412, height: 5000 } });

test("the hero headline and facts reach full opacity in Google's tall viewport", async ({ page }) => {
  // No sessionStorage for Google's renderer, so no skip: it gets the boot mask on every render, as here.
  await page.goto("/");
  await expect.poll(() => effectiveOpacity(page, "h1")).toBe(1);
  // The first <dl> on the page is the hero's.
  await expect.poll(() => effectiveOpacity(page, "dl")).toBe(1);
});
