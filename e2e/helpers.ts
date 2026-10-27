import type { Page } from "@playwright/test";

// A repeat visit: the boot mask never shows, so specs that are not about the boot start on the page itself.
export async function skipBoot(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem("bootPlayed", "true"));
}

// Records whether the boot mask was ever on screen, checked on every frame from the first, so a spec can tell a mask
// that painted from one that was removed before anyone saw it.
export async function watchMask(page: Page) {
  await page.addInitScript(() => {
    const w = window as typeof window & { __maskSeen?: boolean };
    w.__maskSeen = false;
    const check = () => {
      const mask = document.querySelector(".boot-mask");
      if (mask && getComputedStyle(mask).display !== "none") w.__maskSeen = true;
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

export function maskSeen(page: Page) {
  return page.evaluate(() => (window as typeof window & { __maskSeen?: boolean }).__maskSeen);
}

// Opacity as a reader sees it: the element's own times every ancestor's, since Framer may fade any of them.
export function effectiveOpacity(page: Page, selector: string) {
  return page.evaluate((sel) => {
    let o = 1;
    for (let n = document.querySelector(sel); n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o;
  }, selector);
}
