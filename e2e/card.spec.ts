import { expect, test } from "@playwright/test";
import { skipBoot } from "./helpers";

// AGENTS.md, Modes: a mouse click on a homepage card flies it to /work, lands with the pointer on the same card, and
// shows it landed. The handoff scroll has to run before the flight's arrival, or the card moves after it lands.
test("a click on the Airbnb card lands under the pointer on /work, marked landed", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the handoff is for a mouse; touch keeps the anchor jump");
  await skipBoot(page);
  await page.goto("/");

  const card = page.locator("article").filter({ has: page.getByRole("link", { name: /^Airbnb, the full entry/ }) });
  await card.scrollIntoViewIfNeeded();
  await expect.poll(() => card.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  // The page scrolls smoothly, so wait until the card holds still before picking the point to click.
  let last = NaN;
  await expect.poll(async () => {
    const prev = last;
    last = (await card.boundingBox())?.y ?? NaN;
    return last === prev;
  }).toBe(true);
  const box = await card.boundingBox();
  if (!box) throw new Error("the Airbnb card has no box");
  // Well down the card, so the handoff has a fraction to keep, and on the stretched link rather than a pill.
  const x = box.x + box.width * 0.5;
  const y = box.y + box.height * 0.4;
  expect(await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.closest("a")?.getAttribute("href"), [x, y]))
    .toBe("/work#airbnb");

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.up();

  await page.waitForURL("**/work#airbnb");
  await expect(page.locator("#airbnb")).toHaveAttribute("data-landed", "");
  await expect(page.locator("html")).not.toHaveClass(/card-flight/);
  await expect.poll(() => page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.closest("[id]")?.id, [x, y]))
    .toBe("airbnb");
  // Not just somewhere on the card: the same relative height of it, which the anchor jump alone would not give.
  // Polled, so the page's slide-in has settled when it holds.
  await expect.poll(async () => {
    const landed = await page.locator("#airbnb").boundingBox();
    return landed ? (y - landed.y) / landed.height : NaN;
  }).toBeCloseTo(0.4, 1);
});
