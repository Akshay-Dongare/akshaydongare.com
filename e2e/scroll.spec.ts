import { expect, test, type Page } from "@playwright/test";
import { skipBoot } from "./helpers";

// AGENTS.md, Accessible names and targets: Chromium applies one more frame of a smooth scroll still running when the
// router's instant scroll lands. A link pressed while the page glides, as it does for a moment after Tab moves focus,
// opened the new page that frame's travel away from where the router put it, so these press one mid-glide.
async function pressWhileGliding(page: Page, link: string) {
  // Focus scrolls the link into view smoothly, as Tab does. 300px in, the glide is moving fast.
  await page.locator(link).first().evaluate((el: HTMLElement) => el.focus());
  await page.waitForFunction(() => window.scrollY > 300, null, { polling: "raf" });
  await page.keyboard.press("Enter");
}

// The scroll position once it has stopped changing; a read straight after the navigation can come before the stray frame.
async function settledScroll(page: Page) {
  let last = NaN;
  await expect.poll(async () => {
    const prev = last;
    last = await page.evaluate(() => Math.round(window.scrollY));
    return last === prev;
  }).toBe(true);
  return last;
}

test("a footer link pressed while the page glides opens the new page at its top", async ({ page }) => {
  await skipBoot(page);
  await page.goto("/about");
  await pressWhileGliding(page, 'footer a[href="/work"]');
  await page.waitForURL("**/work");
  expect(await settledScroll(page)).toBe(0);
});

test("a homepage card pressed while the page glides lands where a calm press lands it", async ({ page }) => {
  await skipBoot(page);
  const card = 'a[href="/work#iso"]';
  const landing = async (glide: boolean) => {
    await page.goto("/");
    if (glide) await pressWhileGliding(page, card);
    else {
      await page.locator(card).first().evaluate((el: HTMLElement) => el.focus());
      await settledScroll(page);
      await page.keyboard.press("Enter");
    }
    await page.waitForURL("**/work#iso");
    await expect(page.locator("html")).not.toHaveClass(/card-flight/);
    return settledScroll(page);
  };
  const calm = await landing(false);
  expect(await landing(true)).toBe(calm);
});
