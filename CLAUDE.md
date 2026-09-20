# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build (also used to type-check — no separate tsc script)
npm run lint     # ESLint via next lint
npm run start    # serve the production build locally
```

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

### Branding

**Logo:** typographical brutalist `[ AD ]` in monospace — Navbar (small, inline, inherits theme text color) and Footer (medium weight, paired with the Akshay Dongare wordmark). Do not revert to the old overlapping-circles letterform.

**Portrait:** `/public/Akshay_Headshot.jpg` — integrated in two places:
- `components/sections/AboutSection.tsx` (homepage right-column card): `object-cover object-top` inside a rounded card with a subtle gradient overlay
- `app/about/page.tsx` (full-width 400px portrait): `object-cover object-top` in a rounded container

### Color System — "Deep Obsidian" Tokens

All design tokens live in `app/globals.css` under both `@theme inline` (Tailwind v4 utility generation) and `:root` (CSS custom property access). **Do not add colors to `tailwind.config.ts`** — that file is intentionally minimal since Tailwind v4 is configured CSS-first.

The `--blend-*` token family defines the unified scroll palette:
- **Dark spine**: `--blend-void` (#07090f) → `--blend-deep` (#0d1117) → `--blend-mid` (#141920) → `--blend-surface` (#1c2230)
- **Light arm**: `--blend-mist` (#c8d4e0) → `--blend-parchment` (#f2efe9) → `--blend-warm` (#e9e4da)
- **Accent**: `--blend-accent` (#6b9fd4) · `--blend-accent-dim` (#3a6288) · `--blend-slate` (#5b7fa6)

The old `--color-cream`, `--color-steel`, etc. tokens are still defined in `globals.css` but are **not applied to any page** — all sub-pages and the Footer now use the deep obsidian dark canvas.

### Blended Scroll Journey (Home Page)

The homepage (`app/page.tsx`) assembles 7 sections. Each section uses `style={{ background: 'linear-gradient(...)' }}` with end-colors matched to the next section's start-color. All `h-screen` sections carry `marginBottom: '-1px'` to prevent sub-pixel rendering gaps.

```
HeroSection       void → deep                        (dark)
ParticleSection   deep → surface → mist              ← dark-to-light bridge (5 stops)
AboutSection      mist → parchment                   (light)
WorkSection       parchment → warm → mist → deep     ← light-to-dark bridge (8 stops, no visible stripe)
MissionSection    deep → void                        (dark)
CodeSection       micro-diagonal void                (dark)
ContactSection    void → midnight blue accent → deep (dark, very subtle blue midpoint)
```

**Why this order.** `MissionSection` used to sit second, which put two full-viewport
statement sections (32 words between them) ahead of any evidence and pushed the work
cards to ~4.3 screens down — past where attention has measurably decayed. Moving it
below `WorkSection` lifts the proof to ~3.2 screens and reads better rhetorically:
evidence first, thesis as the close.

**The order and the gradients are coupled.** `ParticleSection` is the dark→light bridge
and `WorkSection` is the light→dark bridge back, so the two light sections must sit
between them. Reordering anything across that arc means re-deriving the seam colours,
or you get hard stripes.

`Footer` continues the dark obsidian theme (gradient `#0d1117 → #07090f`).

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

**Interaction model — silk swirl, not repulsion:** mouse velocity captured each frame as a world-space delta. Force = `perpendicular(particle→cursor) × mouseSpeed × smoothstep_falloff`. A 0.22× inward component drapes the silk toward the hand. Stationary cursor: micro-breathing radial push.

**Spring dynamics — underdamped wobble:** `SPRING_STIFFNESS = 0.028`, `DAMPING = 0.91` (ratio ≈ 0.27 → underdamped). Particles overshoot base and ring back organically.

**`components/particles/MorphingParticleField.tsx`** — Used in `ContactSection`. The "Dynamic Climax." 8,000 particles morphing between geometric shapes (`lib/shapeGenerators.ts`). Cursor-hover charge (tension ring SVG overlay) → violent shatter → gravity/floor-bounce physics → reform. Custom GLSL `ShaderMaterial` with per-particle opacity. Mutable `SharedState` ref bridges the `useFrame` WebGL loop and HTML overlays (`TensionRing`, `ShapeWord`) without React re-renders. Easter-egg words cycle after each reform: `["imagine.", "build.", "endure.", "connect.", "evolve."]`.

### MDX Writing System

Blog posts live under `app/writing/`. The MDX pipeline is configured in `next.config.ts` (via `@next/mdx`). Custom MDX component overrides are in `mdx-components.tsx`. Syntax highlighting uses `rehype-pretty-code` + `shiki`.

### Sub-Pages

`/about`, `/work`, `/writing`, `/contact`, `/privacy`, `/colophon` are standalone App Router pages. All use the unified dark obsidian canvas (`linear-gradient(#0d1117 → #07090f)`, `data-theme="dark"`). Text tokens: `text-white/90` headings, `text-white/65–70` body, `text-white/35–45` muted. Borders: `border-white/[0.08]`, hover `border-white/20–25`.
