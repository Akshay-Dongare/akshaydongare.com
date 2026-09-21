# akshaydongare.com

My personal site. Built from scratch rather than from a template, partly as a
portfolio and partly as somewhere to keep the interaction work I do not get to
do in infrastructure engineering.

**Live:** [akshaydongare.com](https://akshaydongare.com)

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion ·
React Three Fiber / Three.js · MDX

Every route is statically prerendered. Most of the interface is client-rendered
regardless, because the cursor, the scroll choreography and both particle fields
need a browser to exist.

## The parts worth reading

**Two particle systems, deliberately different.** `ParticleField` is 5,000
particles in a procedurally generated filament layout, drawn as soft Gaussian
points through a custom GLSL `ShaderMaterial` with additive blending. Overlapping
particles accumulate into bright clusters on the dark half of the gradient and
fade out on the light half, which falls out of the compositing maths rather than
any branching. `MorphingParticleField` is 8,000 particles that morph between
shapes, charge on cursor hover, shatter, bounce off a floor under gravity, and
reform. It bridges the WebGL loop and the HTML overlays through a mutable ref so
neither re-renders the other.

- `components/particles/ParticleField.tsx`
- `components/particles/MorphingParticleField.tsx`
- `lib/particleData.ts` — four layered populations, area-weighted so there is no
  void at the centre and no hard edge at the rim

**A scroll journey with no visible seams.** The homepage is seven full-viewport
sections whose gradients hand off to each other: dark, a bridge into light, two
light sections, a bridge back. Each section's end colour is the next one's start
colour, so reordering anything means re-deriving the seams. `CLAUDE.md` documents
which sections are load-bearing and why.

**Live package figures.** Every download and release count on the site is fetched
rather than typed. `lib/downloads.ts` reads the totals from pepy's badge SVG
(their JSON API needs a key; the badge does not) and the release count from PyPI's
public JSON, then hands back both a compact form for labels and a long form for
prose. Revalidated every six hours, because pepy caches the badge for twelve and
polling harder would refetch an identical response.

**An Open Graph card generated at build time.** `app/opengraph-image.tsx` renders
the share card from the same values and design tokens as the site, so it cannot
drift the way a hand-exported PNG does. Typeset in Geist, pulled from a pinned CDN
URL inside a fallback so an unreachable CDN degrades the typeface instead of
failing the build.

**A navbar that reads the page behind it.** It queries every `[data-theme]`
element on scroll and flips its own colours based on what currently overlaps the
top 60 pixels. Sections spanning both dark and light backgrounds use invisible
sentinel elements to mark which vertical portion is which.

## Running it

```bash
npm install
npm run dev
```

```bash
npm run build   # also the type check; there is no separate tsc script
npm run lint
```

No environment variables, no services, no database. It builds offline apart from
the two package-stat fetches, which fall back to their last known values.

## Layout

```
app/                 routes; page.tsx is the homepage scroll journey
  opengraph-image.tsx  build-time share card
components/
  sections/          one file per homepage section
  particles/         the two WebGL systems
  nav/ cursor/ boot/ chrome: navbar, custom cursor, intro animation
lib/                 particle geometry, shape generators, package stats
```

`CLAUDE.md` holds the architectural notes: the colour token system, why the
section order is what it is, and the constraints worth not breaking.

## Licence

No licence is granted, so default copyright applies: all rights reserved. The
code is here to be read, not redeployed. If you want to reuse a piece of it,
ask and the answer is probably yes.
