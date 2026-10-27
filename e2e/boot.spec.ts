import { expect, test } from "@playwright/test";
import { maskSeen, watchMask } from "./helpers";

// AGENTS.md, BootSequence: anything that edits the server HTML before hydration makes React abandon it and
// client-render the root, which strips every attribute off <html>. PrepaintGuard has to put them back before paint.
test("a client-rendered repeat visit keeps skip-boot and dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await watchMask(page);
  await page.addInitScript(() => {
    sessionStorage.setItem("bootPlayed", "true");
    // What an extension or Chrome translate does: one edit to the server HTML before React hydrates it.
    document.addEventListener("DOMContentLoaded", () => document.querySelector("h1")?.append(" "));
  });
  await page.goto("/");
  // The mask is in the server HTML, so its removal shows React has committed, client render or not.
  await expect(page.locator(".boot-mask")).toHaveCount(0);
  const html = page.locator("html");
  await expect(html).toHaveClass(/(^|\s)skip-boot(\s|$)/);
  await expect(html).toHaveAttribute("data-mode", "dark");
  expect(await maskSeen(page)).toBe(false);
});

test("a first visit plays the boot, and a reload straight after skips it", async ({ page }) => {
  await watchMask(page);
  await page.goto("/");
  await expect.poll(() => maskSeen(page)).toBe(true);
  // Reloaded while the boot is still on screen: the visit was recorded as the boot first painted, not after it ended.
  await page.reload();
  await expect(page.locator(".boot-mask")).toHaveCount(0);
  await expect(page.locator("html")).toHaveClass(/(^|\s)skip-boot(\s|$)/);
  expect(await maskSeen(page)).toBe(false);
});

test("the boot mask clears on its own", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".boot-mask")).toHaveCount(0, { timeout: 8_000 });
});

test("reduced motion never shows the boot", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await watchMask(page);
  await page.goto("/");
  await expect(page.locator(".boot-mask")).toHaveCount(0);
  expect(await maskSeen(page)).toBe(false);
});
