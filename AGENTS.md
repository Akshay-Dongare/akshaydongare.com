# AGENTS.md

Guidance for coding agents working in this repository, following the
[agents.md](https://agents.md) convention. `CLAUDE.md` is a symlink to this file,
so Claude Code picks it up without a second copy to keep in sync.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build (also used to type-check — no separate tsc script)
npm run lint     # ESLint directly (`next lint` was removed in Next 16)
npm run start    # serve the production build locally
```

Lint is clean and expected to stay that way, so a non-zero exit means you
introduced something. Eight rule violations are suppressed at their call sites,
each with a comment explaining why; do not add a suppression without one, and do
not widen any of these to a file- or directory-level disable. Keep this count
accurate: eslint reports an unused `eslint-disable` as a warning, so a stale one
fails the clean bar exactly as an error does.

All eight are inherent to the WebGL and client-only work and will not be
"fixed". Three are `react-hooks/purity`, where `Math.random()` seeds a typed
array inside an empty-dep `useMemo` (the randomness must be rolled once and then
stay stable, or the particles reshuffle on every re-render). Two are
`react-hooks/immutability`, where `useFrame` writes straight into the shared ref
and the velocity buffer (allocating fresh arrays for 8,000 particles per frame
would thrash GC). Three are `set-state-in-effect` for state that cannot be known
until after mount: the one-way `shouldRenderParticles` latch in `ParticleSection`
and `ContactSection`, driven by an IntersectionObserver that has no SSR
equivalent, and the mount flag in `CursorProvider`, which gates an element that
tracks a pointer the server does not have.

`BootSequence` used to hold a ninth. It went away on its own when the gsap import
moved inside the effect, and the directive then started reporting as unused.

There is no test suite.

## Architecture

### Tech Stack
Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · GSAP · React Three Fiber / Three.js · MDX

### Layout Wrapper Chain

Every page passes through this chain (defined in `app/layout.tsx`):

```
BootSequence → CursorProvider → Navbar + <main> + Footer
```

- **BootSequence** (`components/boot/BootSequence.tsx`): Plays a one-time iris-wipe animation on first visit (gated by `sessionStorage`). Renders children directly on repeat visits.
- **CursorProvider** (`components/cursor/CustomCursor.tsx`): Replaces the native cursor with a hyper-minimal 5px dot whose colour and blend come from `--cursor-color` and `--cursor-blend`: white with `mix-blend-mode: difference` in dark, a solid ink dot in light, where difference falls under 3:1 over the particle pigment. Scales to 8px on hover via a 150ms spring. Tracking uses raw DOM events mixed with React context at 60fps. Native `cursor: none` is set globally in `globals.css`.
- **`app/template.tsx`**: Wraps every route in a `PageTransition` fade/slide — this is the Next.js `template.tsx` (re-mounts on every navigation, unlike `layout.tsx`).

### Navbar Dark/Light Theme Detection

In light mode the Navbar skips all of this and stays ink, because every light ground clears 9:1 for it; the sentinels below only matter in dark mode. The switcher (`components/nav/ModeToggle.tsx`) is an icon-only `role="switch"`, a sun knob on an ink track in light and a moon knob on a paper track in dark, beside the CTA on desktop and beside MENU on phones. Its look reads `data-mode` through CSS variants, so it is right before hydration.

In dark mode the Navbar (`components/nav/Navbar.tsx`) adapts its text and background colors based on the content scrolled behind it. It queries all `[data-theme="dark"]` DOM elements on every scroll event and checks if any overlap `y=60px` (the navbar height).

**Key pattern for section components:** sections that span both dark and light backgrounds (e.g. `ParticleSection`, `WorkSection`) use invisible sentinel `<div>`s with the appropriate `data-theme` to cover only the relevant vertical portion of the section. This lets the Navbar correctly transition as the user scrolls through gradient bridges.

### External Links

Every outbound link opens in place. No `target="_blank"` anywhere, including the
citation links that back the download figures.

This was researched rather than assumed, and the split it replaced (evidence
links in a new tab, destinations in place) was wrong. NN/g's *Opening Links in
New Browser Windows and Tabs* (2020) is explicit — "For the most part, always
open links in the same browser tab or window" — and its mobile finding is the
exact complaint this site hit: "Mobile users were more annoyed when links opened
in new tabs, as they couldn't use the Back button to return to the previous
screen." A reader who genuinely wants a second tab long-presses or Cmd-clicks;
forcing one removes their choice and buys them nothing.

Two site-specific reasons it is clearly right here. Five of the nine former
`_blank` links resolve to the *same* pepy URL, two of them adjacent in the hero,
so a curious phone reader could stack four tabs on one page before leaving the
homepage. And Back is cheap: the site is bfcache-eligible (no `no-store` on the
document, no `unload`/`beforeunload` handlers, no WebSocket or IndexedDB), so
returning restores scroll and Framer's `once: true` animation state without a
remount.

Do not "fix" this by reintroducing `_blank` for citations. Note also that an
unannounced new tab is *not* a WCAG failure at any enforceable level — SC 3.2.5
Change on Request is AAA, and SC 3.2.1/3.2.2 govern focus and input, not link
activation. This is a usability decision, not a conformance one.

### Search

Google builds the result from the server HTML, so these hold it to what a recruiter should read.

- **Snippet exclusions.** `data-nosnippet` sits on the boot mask and on the inner div of the nav
  and the footer. Google honours it only on `span`, `div` and `section`, never on `<nav>` or
  `<footer>`. The mask needs it most: Google's renderer has no sessionStorage, so it gets the
  mask on every render, and `aria-hidden` is not a snippet control.
- **Description order.** The homepage description leads with the name, then the employers, then
  the download figure. Phones cut it near 110 characters, so what must be seen goes first.
- **Sitemap dates.** `lastModified` in `app/sitemap.ts` is set by hand. Bump a route's date when
  its main content changes and at no other time; a date that moves on every deploy is ignored.
- **Old URLs.** `/projects` and `/social` from the previous site 308 to `/work` and `/contact`
  in `next.config.ts`. `/blog` has no equivalent and stays a 404.
- **First-screen reveals run on mount.** Google renders in a tall viewport, and every `h-svh`
  section stretches with it: at 412x5000 the hero is 5000px and its h1 sits at y 4708, outside
  a `whileInView` margin, so it stayed at the server-rendered `opacity:0`. Anything on the first
  screen uses `animate`, never `whileInView`.
- **Not-found.** `/_not-found` carries `X-Robots-Tag: noindex`. Requested directly it answers
  200, and every real 404 names it as canonical through the root layout's `./`.
- **Site name.** The WebSite JSON-LD pairs `name: "Akshay Dongare"` with the domain as
  `alternateName`, Google's documented fallback when it is not confident in the name.

### Branding

**Logo:** typographical brutalist `[ AD ]` in monospace — Navbar (small, inline, inherits theme text color) and Footer (medium weight, paired with the Akshay Dongare wordmark). Do not revert to the old overlapping-circles letterform.

**Favicon:** the same mark in Geist Mono 700, parchment `#f2efe9` on void `#07090f`, as
three files Next picks up by convention: `app/favicon.ico` (16, 32, 48), `app/icon.png` (192)
and `app/apple-icon.png` (180, opaque and square because iOS rounds its own corners). The 16px
frame is "AD" alone, rendered at native size: with brackets, each letter at that size is about
6px tall with sub-pixel strokes and blurs to grey. Google Search needs a square of at least
8px, recommends one larger than 48px, and does not accept SVG; the 192 PNG covers all three.
Keep these files byte-stable: Google wants a stable favicon URL, and Next's `?hash` changes
whenever a file does.

**Portrait:** `/public/Akshay_Headshot.jpg` (1197x1497) — rendered through
`next/image` with `fill` in two places, so each one needs a positioned ancestor
and an accurate `sizes`. Do not revert either to a plain `<img>`: the source is
836KB and both boxes are under 500px wide, so the optimizer is doing real work.
- `components/sections/AboutSection.tsx` (homepage right-column card):
  `object-cover object-top` inside a rounded card with a gradient overlay.
  `sizes="(max-width: 768px) 100vw, 480px"`, and no `priority` — it is below the
  fold, so the default lazy load is correct.
- `app/about/AboutContent.tsx` (portrait centered in the page's single 820px column): `object-cover object-top`
  in a rounded container. Carries `priority` because it is that page's LCP
  element, and `sizes="320px"` because the box is capped by `max-w-[320px]`.

**Organisation logos:** `components/ui/OrgLogo.tsx` keeps every mark in one table, and every Work
card on both pages carries one. The homepage sets it inline beside the name; /work gives it a 40px
row above the title, because Tech Mahindra's 4:1 lockup broke titles when inline; the card's
destination label (LINKEDIN, GITHUB) sits at the far end of that row. A mark is
decorative (`alt=""`) where the organisation's name is adjacent text. The four NC State cards on
/work never name it, so their `affiliation` field goes into the card's `aria-label` and the logo's
alt, rather than leaving the affiliation to a picture.
- **Every mark covers the same area, not the same height.** Height is `--logo-s` times the square
  root of height over width, so a square mark is `--logo-s` tall and a 4:1 lockup half that. At one
  shared height the wide lockups read about twice the size of the square marks. `--logo-s` is
  2rem, 2.25rem from `md`.
- **Personal and freelance work** (Ollama, Lane Segmentation) takes `org="self"`: the site's own
  `[ AD ]` in the nav's mono, as text in `text-fg-100`, so it follows the mode. Its 0.49em size is
  the same area as the image marks.
- Brand-kit files are used as provided and never recoloured for a ground. Where a brand ships a
  dark-ground variant, the table's `dark` entry holds it and CSS picks by `data-mode`, so it is right
  before hydration: LangChain's icon from langchain.com/brand-assets (`#030710`, white on dark) and
  Tech Mahindra's Color Positive and Color Negative from its October 2025 kit.
- Airbnb is the Simple Icons Belo (CC0) in `#FF5A5F`. ISO's red square is unchanged. Harvard's is the
  shield alone, cropped from the Wikimedia lockup by `viewBox` with the wordmark path removed.
- NC State is the 2x2 white-on-red brick, its preferred version on any ground, so it has no dark
  entry. It shows below NC State's published 52px screen minimum because the owner chose one size
  for every mark.
- NC State's trademark FAQ says students may not put its logos on a resume, and Tech Mahindra's Terms
  of Use ask for written consent to use its marks. The owner chose to show both; do not remove or
  swap them on those grounds without asking.
- Every mark goes through `next/image` with `unoptimized`, which avoids a `no-img-element`
  suppression; width and height only set the aspect ratio. The optimiser's srcset stopped at 2x
  and softened the brick on 3x phones, and the source is only 10KB. Two-variant marks load
  eagerly: a lazy image under `display:none` is never fetched, so the first mode switch blanked it.

**/about body text is justified** (`text-justify hyphens-auto`), at the owner's request. Hyphenation
depends on `lang="en"` on `<html>`. WCAG 1.4.8 advises against justified text, but only at AAA, so
it stays on this one page and does not spread without asking.

### Modes

Light, "Daylight Folio", is the default; dark is the original "Deep Obsidian" site behind a
Light / Dark switcher. `<html data-mode>` carries the mode, and a pre-paint script in
`app/layout.tsx` applies a stored choice from `localStorage` so a dark visitor never sees a light
frame. `lib/mode.ts` holds the hook and the setters, and syncs other tabs through the `storage`
event. Keep the attribute off `data-theme`: the Navbar reads `[data-theme="dark"]` as section
sentinels. Anything that must be right before or during hydration reads the attribute, not the
hook, because the hook reports the server's "light" until hydration ends: the Navbar starts at a
null state rendered as `text-fg-100`, which CSS resolves per mode. The root layout owns the
theme-color meta; viewport metadata would be re-inserted as light on every navigation.

**Every colour is a token with two values.** `:root, [data-mode="light"]` holds light and
`[data-mode="dark"]` holds dark, and each dark value is numerically equal to what the component used
to inline, so dark mode renders as it did before the switcher existed. Section backgrounds are
`var(--spine-*)`, the parallax layers `var(--depth-*)`, the Work cards `var(--card-*)`. The card
tokens say `to bottom in oklab` because that is what Tailwind's `bg-gradient-to-b` emitted. The intended
dark differences are `color-scheme: dark`, so native scrollbars match the page; the Code label at the
13px floor instead of 9.9px; the code overlay's fade at its foot; and the claim pills.

**Text never uses white or black utilities.** `text-fg-NN` replaces `text-white/NN`: in dark it
is the same `color-mix` Tailwind emits for `text-white/NN`, in light a solid ink by role (NN 85
and up `#1a1c13`, 65 to 80 `#272a1e`, 50 to 60 `#3d422c`). `text-lbl-NN` is the same on
`.text-label` call sites and turns rust `#6b2a11` in light. Ink at partial alpha cannot stand in
for these: `#1a1c13` at 0.5 on sage measures 3.04:1. Borders and underlines use `line-NN`, light
grounds in dark mode use `on-paper`.

**The light spine has no dark ground anywhere.** Every background pixel stays at luminance 0.51 or
above, so ink clears 9.2:1 everywhere. The journey moves by hue: cream, sage, apricot, sand, an
olive pool behind the Work cards, paper, and an apricot blush under Contact. All joints are step 0.
Rust labels and muted ink are for grounds at 0.676 or above, so CONNECT, which sits over the
climax, uses `fg`.

**The particle fields are the dark code with a different colour.** Motion, count, size, opacity
and falloff are identical in both modes; do not tune them per mode. The nebula switches only its
blending, Normal instead of Additive, because added light cannot draw anything darker than paper
and its dense cores would add up past the ink back toward white. The climax already blends
normally, so only its colour changes. Both shaders darken their input colour on the way through,
so the light colours are passed pre-lightened: `#b9c494` shows as olive `#7c8c4b`, and `#d49b72`
as terracotta `#a8532b`.

### Color System — "Deep Obsidian" Tokens

All design tokens live in `app/globals.css` under `:root`. **Do not add colors to
`tailwind.config.ts`** — that file is intentionally minimal since Tailwind v4 is
configured CSS-first.

The `--blend-*` names used to be declared twice, once in `:root` and again in
`@theme inline`. The second copy did nothing: `--blend-*` is not a Tailwind namespace,
so it generated no utilities, and `inline` means `@theme` emits no custom properties
either. Confirmed against the built CSS: zero `bg-blend-*`/`text-blend-*` utilities, one
`--blend-void` definition. Two identical lists is a trap rather than a system, so the
dead one is gone.

**Gradients reference the tokens, they do not repeat the hex.** 44 literals across 16
files became `var(--blend-*)`, so retuning the dark spine is one edit instead of twenty
and the joint contract below cannot drift. Verified as a visual no-op: all 15 computed
`backgroundImage` values are byte-identical before and after. The one exception is
`app/opengraph-image.tsx`, which renders through Satori with no document and therefore no
`:root` to resolve against — `var()` there silently produces no gradient, so it keeps
literal hexes and a comment saying why. Keep it in step by hand.

The `--blend-*` token family defines the unified scroll palette:
- **Dark spine**: `--blend-void` (#07090f) → `--blend-deep` (#0d1117) → `--blend-mid` (#141920) → `--blend-surface` (#1c2230)
- **Light arm**: `--blend-mist` (#c8d4e0) → `--blend-parchment` (#f2efe9) → `--blend-warm` (#e9e4da)
- **Accent**: `--blend-accent` (#6b9fd4) · `--blend-accent-dim` (#3a6288) · `--blend-slate` (#5b7fa6)

The old `--color-cream`, `--color-steel`, etc. tokens are still defined in `globals.css` but are **not applied to any page** — all sub-pages and the Footer now use the deep obsidian dark canvas.

**Typography utilities in `@layer utilities` must not declare `color`.** `.text-label`
did, and it silently beat every `text-white/NN` written beside it: same specificity,
same layer, and it comes later in the sheet, so the markup's colour lost. Every
`.text-label` on the site rendered `#8a8a8a` regardless of what the class list asked
for. On the dark canvas that happened to look plausible, which is why it survived; on
the light `mist → parchment` gradient, `AboutSection`'s "MORE ABOUT ME" measured
2.78:1 at 10.4px against the `#1c1c1c` it asked for, which clears ~13.7:1. If a
utility needs a default colour, give it to the call sites instead.

### Blended Scroll Journey (Home Page)

Everything below describes the dark spine; the light spine and its rules are under Modes.

The homepage (`app/page.tsx`) assembles 7 sections. Each section uses `style={{ background: 'linear-gradient(...)' }}` with end-colors matched to the next section's start-color. All full-viewport sections use `h-svh` (not `h-screen`/`100vh`, which on mobile is taller
than the visible area and pushes bottom-anchored content under the collapsing URL bar;
not `dvh` either, which would re-animate section height as that bar moves). They carry
`marginBottom: '-1px'` to prevent sub-pixel rendering gaps.

```
HeroSection       void → deep                        (dark)
ParticleSection   deep → surface → mist              ← dark-to-light bridge (5 stops)
AboutSection      mist → parchment                   (light)
WorkSection       parchment → warm → mist → deep     ← light-to-dark bridge (8 stops, no visible stripe)
MissionSection    deep → void                        (dark)
CodeSection       void → deep → void                 (dark, diagonal lives in a masked layer)
ContactSection    void → midnight blue accent → void (dark, very subtle blue midpoint)
```

**Why this order.** `MissionSection` used to sit second, which put two full-viewport
statement sections (32 words between them) ahead of any evidence and pushed the work
cards to ~4.3 screens down — past where attention has measurably decayed. Moving it
below `WorkSection` lifts the proof to ~3.2 screens and reads better rhetorically:
evidence first, thesis as the close.

**A joint needs to match in slope, not just in value.** Matching colours is necessary
and not sufficient: the eye reads a break in the *rate* of change as a line too, which is
the Mach band effect. Hero to ParticleSection was the case that proved it. Its value step
was 0 and it still showed a visible seam, because the hero drifts void to deep across a
whole 768px viewport (about 1.0 levels per 100px) while ParticleSection used to sprint
deep to surface inside its first 25% (13.0), a tenfold jump in slope exactly at the
boundary. ParticleSection now eases into that ramp over five extra stops, which brings the
worst crease down to 3.0x. It cannot go much lower: the first stop has to move at least
one 8-bit level, and over 4.2% of the section that is already 3.1 levels per 100px.

Those two were fixed afterwards as well, with the mirror of the same trick. Hero into
ParticleSection is flat-into-steep, so the fix eases the START of the steep side.
ParticleSection into AboutSection (was 6.0x) and WorkSection into MissionSection (was
15.7x) are steep-into-flat, so the fix eases the END of it: extra stops across the final
segment following 1-(1-t)^k, which decelerates the rate into the boundary instead of
stopping it dead. Every joint on the home page now sits at 3.3x or below with a step of 0,
and the worst one is Hero into ParticleSection at 3.0x, which is floored by 8-bit colour
rather than by the curve.

**Every joint is measured, and they are all 0.** Adjacent sections must agree on the
colour at their shared edge; a mismatch shows up as a hard line across the full width,
not as a soft difference. `CodeSection` was the last one to be fixed and shows why the
rule needs stating. It carried a 135deg base and, on top of it, an OPAQUE
`absolute inset-0` depth layer with a parallax `y`. Two separate faults came out of that:
an angled gradient cannot have a uniform top *and* bottom edge, so its bottom-left sat 15
blue levels above `ContactSection`'s opening void; and a translated `inset-0` layer drags
its own top edge into view, which drew a hard line 20% down the section. The base is now
vertical and void at both ends, the diagonal moved into a decorative layer inside a
STATIC masked wrapper (the mask is anchored to the section, so the moving child cannot
carry it away), and the child is bled 200px against 140px of travel so its edges are
never inside the wrapper. If you add a section, check the joint rather than eyeballing
it; the deltas above are all 0 and should stay that way. The code overlay also fades out over its last 15%, in both
modes, because on a phone the diff runs past the section and the Contact joint sliced its glyphs.

**The order and the gradients are coupled.** `ParticleSection` is the dark→light bridge
and `WorkSection` is the light→dark bridge back, so the two light sections must sit
between them. Reordering anything across that arc means re-deriving the seam colours,
or you get hard stripes.

`Footer` continues the dark obsidian theme. Its gradient is
`#07090f → #0d1117 (28–62%) → #07090f`, and the endpoints are load-bearing: every
page above it ends on `--blend-void` `#07090f`, so opening on anything else puts a
visible step across the full width of the joint. It closes on void too, so iOS
rubber-band overscroll matches `body`'s `background-color`. If you change where a
page's last section ends, change this to match.

**Reveal timing.** Content fade-ins are capped at 350ms with delays under 200ms.
NN/g found scroll-triggered reveals slower than 500ms cause users to skip the content
outright, and the previous 800–1000ms reveals were outside that band. Keep new
`transition={{ duration }}` values on content at or under 0.35s. This does not apply to
the WebGL particle physics, which are continuous rather than reveal animations.

**The reader has seconds, so nothing they need sits behind a click.** The hero's `<dl>`
carries name, employers, the download figure and the start date on the first screen, at
every breakpoint. The four Work cards are all open, each ending in claim pills that are themselves
links (PyPI, pepy.tech, LinkedIn), with the URLs shared with /work through `lib/links.ts`. The
Mission paragraph opens by default and folds away under APPROACH; collapsed, it stays in the DOM, so
Google still reads it. Every homepage section but Contact ends in a `ScrollCue` at its bottom-left that scrolls to
the next; Contact has none, since only the footer follows it. Particle and About pass `tone="paper"` because in dark mode they end on a light ground. A carousel is not the fix either: NN/g and click data both find slides
after the first go mostly unseen, which is the same failure as a collapsed card.

**Hero layout.** The claim sits mid-screen and the facts row at the foot, below a hairline, with the
three keywords at its far end; stacking everything in one bottom-left column read as crowded and left
the right half empty. The h1's measure is `max-w-[14em]`, in em so it holds three lines at every
desktop width, and its size is `clamp(2.8rem, min(6vw, 9.5svh), 5.5rem)`, so a short laptop window
shrinks the headline instead of pushing the facts below the fold. Measured, the `<dl>` ends inside
the viewport at every size from 375x667 to 1920x1080, which keeps the first-screen rule above.

**Download figures link the number, not the sentence.** The link wraps "15 million" or "1 million" and
stops there, so the underline marks the claim rather than the words around it. All-time figures go to
`PYPI_URL` and monthly ones to `PEPY_URL` (both in `lib/downloads.ts`). pepy's page header still says
the latest version is 0.6.6: its metadata last synced on 24 May 2026, although its download counts
are current. No pepy URL avoids that header, so pepy backs only the monthly count, which it states
as "in the last 30 days". PyPI lists every release but shows no download count at all, so the
pill's accessible name calls it the package on PyPI, not a citation for the figure.

**Type floor.** `.text-label` is 13px, and nothing a reader needs goes below it. At 10.4px
the capitals subtend under 0.2 degrees, where reading slows sharply (Legge and Bigelow 2011).
Card text on the Work gradients is measured at the lightest stop, not eyeballed: white/80
labels clear 4.79:1 on `#3a6288`, the lightest card top.

### Particle Systems (Two Distinct Components — Narrative Escalation)

The two systems are intentionally different in character: the first is a quiet, ethereal prelude; the second is chaotic and mechanical. Do not make them more similar.

**`components/particles/ParticleField.tsx`** — Used in `ParticleSection`. The "Static Prelude." 5,000 particles in a procedurally-generated cosmic dark-matter filament layout (`lib/particleData.ts`), rendered as soft Gaussian circles via a custom GLSL `ShaderMaterial` with `THREE.AdditiveBlending`. On the dark upper section gradient, overlapping particles accumulate into bright holographic clusters; on the light lower gradient they fade gracefully — no code change needed, this emerges from the additive compositing math.

**Particle layout — four populations (all in `lib/particleData.ts`):**
- **Disc haze (20%):** `r = 2.2·√u` — area-weighted uniform areal density; no hard floor, no void ring, P(r<0.1) ≈ 0.2%
- **Fibonacci spiral (40%):** Fermat spiral `r = 0.12 + √(i/n)·5.2`, `θ = i·golden_angle`; `densityWave = sin(i·0.033)` modulates XY scatter width to produce dense bright strands interspersed with dark voids
- **Sinuous filaments (28%):** 7 parametric arms with sinusoidal sway and power-law radial scatter (`rand^2.8 × 0.40`)
- **Cosmic dust (12%):** annular `r ∈ [2.2, 7.2]`, mostly outside the viewport — suggests the nebula extends to infinity

**`aSize` geometry attribute:** `generateParticleSizes()` in `particleData.ts` produces 70% fine grain `[0.75, 1.0]` and 30% structural nodes `[1.5, 2.5]`. Node probability is correlated with the `densityWave` formula so large particles land on the bright strands — not in void zones. In the vertex shader: `gl_PointSize = max(3.0, 45.0 * aSize / (-mvPos.z))`.

**Interaction model — a wake field, not a force on each particle.** Nothing touches a
particle. Sources deposit into a coarse 64×40 displacement grid, and every particle reads
that grid and glides toward `base + wake`. The character is unchanged and still protected:
tangential silk flow around the source path, a 0.22 inward drape toward it, a trail offset
so it reads as a comet rather than a disc, never repulsion.

**There are always TWO sources, and the drift is never one of the optional ones.** Source 0
is an ambient drift on a slow Lissajous path and it runs unconditionally, on every device,
whether or not anything is hovering. Source 1 is the pointer and exists only while one is
over the canvas. Both deposit into the same field every frame, so a hand DISTORTS the
current rather than replacing it.

Do not collapse these back into one source selected by a condition. Every jerk, teleport
and platform mismatch this file has had came from exactly that: a single source handed back
and forth between the drift and the cursor. `present` flips whenever the cursor crosses the
canvas edge, which on a desktop is constantly, and each flip moved the wake source by up to
6.7 world units, about 650px, in one frame. Two independent sources make the handover
impossible rather than smoothed, which is why the rebasing, the last-source tracking and the
`(hover: hover)` device gate that previously patched around it are all gone.

**One amplitude law, or the platforms drift apart.** `reach = IDLE_FLOOR + (MAX_DISPLACE -
IDLE_FLOOR) × speed/(speed + SPEED_HALF)`, clamped to `MAX_DISPLACE`, plus a decaying
`PRESS_KICK` that belongs to the pointer alone. The floor is what a resting cursor, the
drift and a finger between gestures all receive, so moving is always at least as strong as
resting by construction. They were once computed separately, and ambient at a pinned 0.32
against a slow drag at 0.12 meant the untouched field looked livelier than a dragged one.
`IDLE_FLOOR` is the single dial for overall liveliness and it moves both platforms together.

Two properties follow from the structure rather than from tuning, and both are load-bearing:

- **Nothing can ring.** Particles track the field with a first-order lag, and the worst-case
  gain is `(1 - exp(-MAX_DT/FOLLOW_TAU)) × maxLag = 0.55`, which is below 1 at any frame
  rate. A first-order approach with gain under 1 is monotonic, so overshoot is not damped,
  it is impossible.
- **There is no feedback path.** The field is sampled at each particle's REST position, not
  its current one, so a particle can never drag its own sample around and nothing can
  amplify. This is why the first property holds in practice and not just on paper.

Persistence lives in the field, which decays exponentially (`FIELD_TAU`) and blooms outward
through a 5-point blur as it fades, so motion keeps living after the cursor leaves. A linear
`FIELD_FLOOR` bleed on top of the exponential is what lets the wake reach exact zero in
finite time rather than trailing an asymptote, which is also what lets the whole system
detect it is finished and sleep.

**Anything per-frame in here must be scaled by dt.** The blur coefficient was the one term
that was not, and the wake bloomed about twice as wide at 120fps as at 30 for the same
gesture. It is `min(FIELD_DIFFUSION * dt * 60, 0.24)` now, and the clamp is not optional: an
explicit 5-point stencil goes unstable above 0.25 and a long frame would otherwise reach
0.39.

**The spring is gone, and should not come back.** It was `SPRING_STIFFNESS = 0.028`,
`DAMPING = 0.91`, a damping ratio of 0.288 measured from the discrete map
`[[1-Dk, D], [-Dk, D]]`: a 0.67s oscillation, 1.06s to settle to 5%, about 1.6 visible
bounces. Five thousand particles each ringing 1.6 times at different phases summed into a
wobbling sheet, and the owner's description of it was "like dipping a hand in jelly".

Retuning could not have fixed it. Within that integrator the per-frame decay is `sqrt(D)`
whenever the system oscillates, so reaching non-oscillatory behaviour forces heavy friction
and collapses travel: the knee sits around ratio 0.71, which keeps roughly 62% of the
motion. Removing the oscillator was the only way to get full amplitude with zero ring.
Measured after: 0.78s to 2% with zero bounces, and peak travel and settle time now vary by
under 1.5% across 30, 60, 120 and 144fps, where the old model varied about 2.7× in travel
because only the position integration was dt-scaled and the spring, force and damping were
not.

**`components/particles/MorphingParticleField.tsx`** — Used in `ContactSection`. The "Dynamic Climax." 8,000 particles morphing between geometric shapes (`lib/shapeGenerators.ts`). Cursor-hover charge (tension ring SVG overlay) → violent shatter → gravity/floor-bounce physics → reform. Custom GLSL `ShaderMaterial` with per-particle opacity. Mutable `SharedState` ref bridges the `useFrame` WebGL loop and HTML overlays (`TensionRing`, `ShapeWord`) without React re-renders. Easter-egg words cycle after each reform: `["imagine.", "build.", "endure.", "connect.", "evolve."]`.

### MDX Writing System

There is currently no writing section. `app/writing/` was removed because its three posts were placeholders that all resolved to the same stub. The MDX pipeline is still wired up and unused: `next.config.ts` keeps `createMDX` and `mdx` in `pageExtensions`, `mdx-components.tsx` still holds the component overrides, and `rehype-pretty-code` + `shiki` remain installed. Dropping an `.mdx` file under `app/` will just work; nothing needs re-adding first.

### Sub-Pages

`/about`, `/work`, `/contact`, `/privacy`, `/colophon` are standalone App Router pages. All use `var(--spine-page)`: cream to paper in light, the dark obsidian canvas (`#0d1117 → #07090f`) in dark. Text tokens: `text-fg-90` headings, `text-fg-65–70` body, `text-fg-50–55` muted. **Do not go below `fg-50`**: in dark, white/45 measures 4.49:1 on void and white/35 3.19:1, which fails WCAG 2.2 SC 1.4.3 AA for text under 24px. Borders: `border-line-8`, hover `border-line-20`.

**Each /work card is one target without being one `<a>`.** The title link stretches over the card
through its `::after` (`after:absolute after:inset-0`, against the card's `relative`), which also
carries the focus ring. A description can then hold links of its own, as the Harvard card does
for GAMI, Harvard University and the award post: they take the `INLINE` class, whose `relative z-10`
lifts them above the stretched layer. Do not wrap a card in a link again; an `<a>` inside an `<a>`
is invalid HTML, and the old whole-card link also hid the description from screen readers behind
its `aria-label`.

All five carry `.masthead-glow` (defined in `app/globals.css`), a still, soft blue
bloom across the top 62vh that echoes the homepage nebula without running a second
simulation. **Do not turn this back into a starfield.** It was one, and it read as
dust on the screen: holding text at 4.5:1 caps a white dot at alpha 0.1367, which is
1.39:1 of local contrast, and low-contrast hard-edged specks scattered evenly are
what dust and sensor noise look like. The overlap rule the cap required made it worse
by forcing blue noise, which is more uniform than random where a real sky is clumped.
A broad gradient is more visible than a 1px dot at the *same* peak alpha, because
contrast sensitivity peaks at low spatial frequency, and it cannot read as dust
because dust is high-frequency. Colour also buys headroom: the cap is a luminance
limit, so `#6b9fd4` tolerates 0.2329 where white tolerates 0.1367. The two layers
composite to 0.1545, putting the brightest pixel at RGB(29,39,51) with `white/50` at
4.88:1. Raising either alpha is what breaks the page, not the geometry. In light mode the same
two layers are ember and olive (`--masthead-glow`), and muted ink holds 7.5:1 at their darkest.
