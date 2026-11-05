import { expect, test, type Locator, type Page } from "@playwright/test";
import { skipBoot } from "./helpers";

// AGENTS.md, Accessible names and targets: the focus ring on a homepage work card. Computed style reports a ring the
// card's clip hides, so these read pixels: a ring is pixels that turn 3:1 between two shots, SC 2.4.13's measure.
const BAND = 8; // How far to look either side of the card's edge.
const CORNER = 40; // Left off each end of a side, so the corners' shape has no say.

// In Tab order. The last runs lowest down the section, where the dark ground meets it at narrow widths.
const ORGS = ["Airbnb", "LangChain", "ISO", "Harvard University"];

const cardOf = (page: Page, org: string) => {
  const link = page.getByRole("link", { name: new RegExp(`^${org}, the full entry`) });
  return { link, card: page.locator("article").filter({ has: link }) };
};

async function tabTo(page: Page, link: Locator) {
  for (let i = 0; i < 40 && !(await link.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(link).toBeFocused();
}

// Until the card's reveal is over and it has held still for 10 frames.
const held = (card: Locator) => card.evaluate((el) => new Promise<void>((resolve) => {
  let y = NaN;
  let still = 0;
  const frame = () => {
    const now = el.getBoundingClientRect().y;
    still = now === y && getComputedStyle(el).opacity === "1" ? still + 1 : 0;
    y = now;
    if (still === 10) resolve();
    else requestAnimationFrame(frame);
  };
  frame();
}));

// The card's area, centred so the nav covers no side. Tab's glide ends first: an instant scroll landing on one
// overshoots by a frame of its travel (AGENTS.md, A link pressed mid-glide), enough to put the card's top under the nav.
async function restingArea(card: Locator) {
  await held(card);
  await card.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await held(card);
  const box = await card.boundingBox();
  if (!box) throw new Error("the card has no box");
  return {
    x: Math.floor(box.x) - BAND,
    y: Math.floor(box.y) - BAND,
    width: Math.ceil(box.width) + 2 * BAND,
    height: Math.ceil(box.height) + 2 * BAND,
  };
}

// For each side, the thinnest the turned pixels get along its straight run, in device pixels. Read in a blank page,
// where the site's content security policy has no say over a data: image.
async function thinnestRing(page: Page, shots: [Buffer, Buffer]) {
  const blank = await page.context().newPage();
  const ring = await blank.evaluate(async ({ pngs, band, corner }) => {
    const read = async (png: string) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const context = new OffscreenCanvas(image.width, image.height).getContext("2d");
      if (!context) throw new Error("no 2d context");
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, image.width, image.height);
    };
    const [a, b] = await Promise.all(pngs.map(read));
    const { width, height } = a;
    const channel = (v: number) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
    const luminance = ({ data }: ImageData, i: number) =>
      0.2126 * channel(data[i]) + 0.7152 * channel(data[i + 1]) + 0.0722 * channel(data[i + 2]);
    const turned = ([x, y]: [number, number]) => {
      const i = (y * width + x) * 4;
      const [la, lb] = [luminance(a, i), luminance(b, i)];
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05) >= 3;
    };
    const thinnest = (length: number, at: (along: number, across: number) => [number, number]) => {
      let least = Infinity;
      for (let along = band + corner; along < length - band - corner; along++) {
        let count = 0;
        for (let across = 0; across < 2 * band; across++) if (turned(at(along, across))) count++;
        least = Math.min(least, count);
      }
      return least;
    };
    return {
      top: thinnest(width, (along, across) => [along, across]),
      right: thinnest(height, (along, across) => [width - 1 - across, along]),
      bottom: thinnest(width, (along, across) => [along, height - 1 - across]),
      left: thinnest(height, (along, across) => [across, along]),
    };
  }, { pngs: shots.map((shot) => shot.toString("base64")), band: BAND, corner: CORNER });
  await blank.close();
  return ring;
}

// 900 is the desktop project narrowed: two columns, where the WORK label that also marks focus at 1440 is gone.
const WIDTHS = [
  { width: 1440, project: "desktop" },
  { width: 900, project: "desktop" },
  { width: 375, project: "phone" },
];

for (const { width, project } of WIDTHS) {
  for (const mode of ["light", "dark"] as const) {
    test(`Tab onto each work card rings all four sides at ${width} wide in ${mode}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== project, `${width} wide runs in the ${project} project`);
      await page.setViewportSize({ width, height: page.viewportSize()?.height ?? 900 });
      await page.emulateMedia({ colorScheme: mode });
      await skipBoot(page);
      await page.goto("/");

      for (const org of ORGS) {
        const { link, card } = cardOf(page, org);
        await tabTo(page, link);
        const area = await restingArea(card);
        const before = await card.boundingBox();
        const focused = await page.screenshot({ clip: area });
        await link.blur();
        const blurred = await page.screenshot({ clip: area });
        expect(await card.boundingBox()).toEqual(before);

        const ring = await thinnestRing(page, [focused, blurred]);
        expect(Math.min(...Object.values(ring)), `${org}: ${JSON.stringify(ring)}`).toBeGreaterThanOrEqual(2);
      }
    });
  }
}

// The flying box outgrows the outgoing snapshot, so a ring in it would draw its lower edge across the card.
test("a card pressed from the keyboard takes off without its ring", async ({ page }) => {
  await skipBoot(page);
  await page.goto("/");

  const { link, card } = cardOf(page, "Airbnb");
  await tabTo(page, link);
  const area = await restingArea(card);
  await link.blur();
  const blurred = await page.screenshot({ clip: area });
  await link.focus();
  const focused = await page.screenshot({ clip: area });
  await page.keyboard.press("Enter");

  // Every animation of the transition held on its first frame, where the flying card stands where it stood.
  await page.waitForFunction(() => {
    const flight = document.getAnimations().filter((animation) =>
      (animation.effect as KeyframeEffect | null)?.pseudoElement?.startsWith("::view-transition"));
    flight.forEach((animation) => {
      animation.pause();
      animation.currentTime = 0;
    });
    return flight.length > 0;
  }, null, { polling: "raf" });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  const takeOff = await page.screenshot({ clip: area });

  // The ring showed before the press, so its absence after it says something.
  const shown = await thinnestRing(page, [focused, blurred]);
  expect(Math.min(...Object.values(shown)), JSON.stringify(shown)).toBeGreaterThanOrEqual(2);
  const ring = await thinnestRing(page, [takeOff, blurred]);
  expect(Math.max(...Object.values(ring)), JSON.stringify(ring)).toBe(0);
});
