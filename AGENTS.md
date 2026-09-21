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
- **CursorProvider** (`components/cursor/CustomCursor.tsx`): Replaces the native cursor with a hyper-minimal 5px white dot using `mix-blend-mode: difference` — inverts against any background so it stays legible on dark or light sections. Scales to 8px on hover via a 150ms spring. Tracking uses raw DOM events mixed with React context at 60fps. Native `cursor: none` is set globally in `globals.css`.
- **`app/template.tsx`**: Wraps every route in a `PageTransition` fade/slide — this is the Next.js `template.tsx` (re-mounts on every navigation, unlike `layout.tsx`).

### Navbar Dark/Light Theme Detection

The Navbar (`components/nav/Navbar.tsx`) adapts its text and background colors based on the content scrolled behind it. It queries all `[data-theme="dark"]` DOM elements on every scroll event and checks if any overlap `y=60px` (the navbar height).

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

### Branding

**Logo:** typographical brutalist `[ AD ]` in monospace — Navbar (small, inline, inherits theme text color) and Footer (medium weight, paired with the Akshay Dongare wordmark). Do not revert to the old overlapping-circles letterform.

**Portrait:** `/public/Akshay_Headshot.jpg` (1197x1497) — rendered through
`next/image` with `fill` in two places, so each one needs a positioned ancestor
and an accurate `sizes`. Do not revert either to a plain `<img>`: the source is
836KB and both boxes are under 500px wide, so the optimizer is doing real work.
- `components/sections/AboutSection.tsx` (homepage right-column card):
  `object-cover object-top` inside a rounded card with a gradient overlay.
  `sizes="(max-width: 768px) 100vw, 480px"`, and no `priority` — it is below the
  fold, so the default lazy load is correct.
- `app/about/AboutContent.tsx` (full-width portrait): `object-cover object-top`
  in a rounded container. Carries `priority` because it is that page's LCP
  element, and `sizes="320px"` because the box is capped by `max-w-[320px]`.

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

Two joints still carry a visible-in-principle slope break, both left alone deliberately:
WorkSection to MissionSection at 15.7x and ParticleSection to AboutSection at 6.0x. Both
run steep-into-flat rather than flat-into-steep, which reads far more softly, and both sit
where the surrounding luminance is low enough that the absolute rates are small. Revisit
them only if someone actually sees a line.

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
it; the deltas above are all 0 and should stay that way.

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

### Particle Systems (Two Distinct Components — Narrative Escalation)

The two systems are intentionally different in character: the first is a quiet, ethereal prelude; the second is chaotic and mechanical. Do not make them more similar.

**`components/particles/ParticleField.tsx`** — Used in `ParticleSection`. The "Static Prelude." 5,000 particles in a procedurally-generated cosmic dark-matter filament layout (`lib/particleData.ts`), rendered as soft Gaussian circles via a custom GLSL `ShaderMaterial` with `THREE.AdditiveBlending`. On the dark upper section gradient, overlapping particles accumulate into bright holographic clusters; on the light lower gradient they fade gracefully — no code change needed, this emerges from the additive compositing math.

**Particle layout — four populations (all in `lib/particleData.ts`):**
- **Disc haze (20%):** `r = 2.2·√u` — area-weighted uniform areal density; no hard floor, no void ring, P(r<0.1) ≈ 0.2%
- **Fibonacci spiral (40%):** Fermat spiral `r = 0.12 + √(i/n)·5.2`, `θ = i·golden_angle`; `densityWave = sin(i·0.033)` modulates XY scatter width to produce dense bright strands interspersed with dark voids
- **Sinuous filaments (28%):** 7 parametric arms with sinusoidal sway and power-law radial scatter (`rand^2.8 × 0.40`)
- **Cosmic dust (12%):** annular `r ∈ [2.2, 7.2]`, mostly outside the viewport — suggests the nebula extends to infinity

**`aSize` geometry attribute:** `generateParticleSizes()` in `particleData.ts` produces 70% fine grain `[0.75, 1.0]` and 30% structural nodes `[1.5, 2.5]`. Node probability is correlated with the `densityWave` formula so large particles land on the bright strands — not in void zones. In the vertex shader: `gl_PointSize = max(3.0, 45.0 * aSize / (-mvPos.z))`.

**Interaction model — a wake field, not a force on each particle.** The cursor never
touches a particle. It deposits into a coarse 64×40 displacement grid, and every particle
reads that grid and glides toward `base + wake`. The character is unchanged and still
protected: tangential silk flow around the cursor path, a 0.22 inward drape toward the
hand, a trail offset behind the cursor so it reads as a comet rather than a disc, never
repulsion.

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

`/about`, `/work`, `/contact`, `/privacy`, `/colophon` are standalone App Router pages. All use the unified dark obsidian canvas (`linear-gradient(#0d1117 → #07090f)`, `data-theme="dark"`). Text tokens: `text-white/90` headings, `text-white/65–70` body, `text-white/50–55` muted. **Do not go below `/50` on the dark canvas** — `/45` measures 4.54:1 and `/35` measures 3.19:1, which fails WCAG 2.2 SC 1.4.3 AA for text under 24px. Borders: `border-white/[0.08]`, hover `border-white/20–25`.

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
composite to 0.1545, putting the brightest pixel at RGB(25,33,43) with `white/50` at
5.05:1. Raising either alpha is what breaks the page, not the geometry.
