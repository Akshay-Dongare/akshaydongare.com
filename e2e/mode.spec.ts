import { expect, test, type Page } from "@playwright/test";
import { skipBoot } from "./helpers";

// AGENTS.md, Navbar: the switch reveals the new mode through a view transition, and html.mode-switching, which turns
// colour transitions off for its length, must come off again once it ends. Whether a frame of the old mode flashes is
// not tested: headless Chromium never shows it, so a pass here would prove nothing.
const toggle = (page: Page) => page.getByRole("switch", { name: "Dark mode" }).filter({ visible: true });

for (const start of ["light", "dark"] as const) {
  const next = start === "light" ? "dark" : "light";

  test(`the switch turns ${start} into ${next} and back`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: start });
    await skipBoot(page);
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-mode", start);

    await toggle(page).click();
    await expect(html).toHaveAttribute("data-mode", next);
    await expect(toggle(page)).toHaveAttribute("aria-checked", String(next === "dark"));
    await expect(html).not.toHaveClass(/mode-switching/);

    await toggle(page).click();
    await expect(html).toHaveAttribute("data-mode", start);
    await expect(html).not.toHaveClass(/mode-switching/);
  });
}

test("under reduced motion the switch changes the mode at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await skipBoot(page);
  await page.goto("/");
  await toggle(page).click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
  await expect(page.locator("html")).not.toHaveClass(/mode-switching/);
});
