import { expect, test } from "@playwright/test";
import { skipBoot } from "./helpers";

// AGENTS.md, Branding: cards and portraits take one superellipse; pills and circles stay round, because the shape
// would turn a pill into a rounded rectangle and the mode switch's knob into a rounded square.
const SHAPE = "superellipse(1.34)";
const radiusFor = (project: string) => (project === "desktop" ? "29px" : "24.5px");

const ROUTES = ["/", "/work", "/about", "/contact", "/privacy", "/colophon"];

for (const route of ROUTES) {
  test(`${route}: every surface takes the superellipse and every pill and circle stays round`, async ({ page }, testInfo) => {
    await skipBoot(page);
    await page.goto(route);

    const rows = await page.evaluate(() => {
      const out: { what: string; kind: "surface" | "pill"; radius: string; shape: string }[] = [];
      const read = (el: Element, pseudo?: string) => {
        const cs = getComputedStyle(el, pseudo);
        if (pseudo && (cs.content === "none" || cs.content === "normal")) return;
        if (!parseFloat(cs.borderTopLeftRadius) || cs.display === "none") return;
        const box = el.getBoundingClientRect();
        const w = pseudo ? parseFloat(cs.width) : box.width;
        const h = pseudo ? parseFloat(cs.height) : box.height;
        if (!(w > 0) || !(h > 0)) return;
        const r = parseFloat(cs.borderTopLeftRadius);
        out.push({
          what: `${el.tagName.toLowerCase()}${pseudo ?? ""} ${(el.textContent ?? "").trim().slice(0, 24)}`,
          kind: r >= Math.min(w, h) / 2 - 0.5 ? "pill" : "surface",
          radius: cs.borderTopLeftRadius,
          shape: cs.getPropertyValue("corner-top-left-shape"),
        });
      };
      for (const el of document.querySelectorAll("body, body *")) {
        read(el);
        read(el, "::before");
        read(el, "::after");
      }
      return out;
    });

    const surfaces = rows.filter((r) => r.kind === "surface");
    // The nav's pills are on every page; surfaces are only on the three that have cards or a portrait.
    expect(rows.filter((r) => r.kind === "pill").length).toBeGreaterThan(0);
    if (["/", "/work", "/about"].includes(route)) expect(surfaces.length).toBeGreaterThan(0);

    const radius = radiusFor(testInfo.project.name);
    expect(surfaces.filter((r) => r.radius !== radius || r.shape !== SHAPE)).toEqual([]);
    expect(rows.filter((r) => r.kind === "pill" && !/^(round|superellipse\(1\))$/.test(r.shape))).toEqual([]);
  });
}

// The raised radius sits behind @supports: alone it would be a visibly rounder round corner. Renaming the property in
// the served CSS makes this browser parse the sheet as one that does not know it.
test("a browser without corner-shape keeps plain round corners at the old radius", async ({ page }, testInfo) => {
  await page.route("**/*.css", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replaceAll("corner-shape", "corner-unknown") });
  });
  await skipBoot(page);
  await page.goto("/");

  const corner = await page.locator("article").first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return { radius: cs.borderTopLeftRadius, shape: cs.getPropertyValue("corner-top-left-shape") };
  });
  expect(corner.radius).toBe(testInfo.project.name === "desktop" ? "24px" : "20px");
  expect(corner.shape).toMatch(/^(round|superellipse\(1\))$/);
});

// The flying box clips the card, so a round clip over a superellipse card would change its corners in mid-air.
test("a card keeps its corners in flight", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = ((update: () => Promise<void>) => {
      const transition = start(update);
      transition.ready.then(() => {
        const cs = getComputedStyle(document.documentElement, "::view-transition-group(card-flight)");
        (window as typeof window & { __flight?: string }).__flight =
          `${cs.borderTopLeftRadius} ${cs.getPropertyValue("corner-top-left-shape")}`;
      });
      return transition;
    }) as typeof document.startViewTransition;
  });
  await skipBoot(page);
  await page.goto("/");

  const link = page.getByRole("link", { name: /^Airbnb, the full entry/ });
  await link.scrollIntoViewIfNeeded();
  await expect.poll(() => link.evaluate((el) => getComputedStyle(el.closest("article")!).opacity)).toBe("1");
  await link.click();

  await expect
    .poll(() => page.evaluate(() => (window as typeof window & { __flight?: string }).__flight))
    .toBe(`${radiusFor(testInfo.project.name)} ${SHAPE}`);
});
