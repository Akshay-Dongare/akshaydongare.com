# AGENTS.md

Guidance for coding agents working in this repository, following the
[agents.md](https://agents.md) convention. `CLAUDE.md` is a symlink to this file,
so Claude Code picks it up without a second copy to keep in sync.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # ESLint directly (`next lint` was removed in Next 16)
npm run typecheck # tsc --noEmit
npm test         # unit tests in tests/, on Node's own runner
npm run start    # serve the production build locally
npm run e2e      # browser tests in e2e/, against a fresh production build on port 3100
npm run budget   # first-load JS per route against e2e/budget.json; run after a build
```

Lint is clean and expected to stay that way, so a non-zero exit means you
introduced something. Ten rule violations are suppressed at their call sites,
each with a comment explaining why; do not add a suppression without one, and do
not widen any of these to a file- or directory-level disable. `eslint.config.mjs` ignores `.claude/**`, where
session worktrees keep whole checkouts and their builds. Keep this count
accurate: eslint reports an unused `eslint-disable` as a warning, so a stale one
fails the clean bar exactly as an error does.

All ten are inherent to the WebGL and client-only work and will not be
"fixed". Three are `react-hooks/purity`, where `Math.random()` seeds a typed
array inside a `useMemo` that runs once per mount (the randomness must be rolled once and then
stay stable, or the particles reshuffle on every re-render). Three are
`react-hooks/immutability`, where `useFrame` writes straight into the shared ref
and the velocity buffer (allocating fresh arrays for 8,000 particles per frame
would thrash GC); the third sits on `MorphingParticleField`'s `useFrame` call,
where the rule also reports the callback as a whole. Four are `set-state-in-effect`
for state that cannot be known until after mount: the one-way
`shouldRenderParticles` latch in `ParticleSection` and `ContactSection`, driven by
an IntersectionObserver that has no SSR equivalent, the mount flag in
`CursorProvider`, which gates an element that tracks a pointer the server does not
have, and `BootSequence`'s skip, which reads the pre-paint record and `matchMedia`.

`BootSequence`'s directive once went away and came back. While the effect imported gsap
dynamically (gsap is gone now), `eslint-plugin-react-hooks` 7.0 skipped the whole component
because of the dynamic `import()`, and reported the directive as unused; 7.1
analyses it again. `MorphingParticleField` builds its shapes in an empty-dep
`useMemo`, not lazily in a ref, because 7.1's `react-hooks/refs` forbids reading
a ref during render. Keep `eslint-config-next` on the same version as `next`. The
config accepts any `eslint-plugin-react-hooks` ^7.1.0, so a blanket `npm update` can
move the plugin on its own and bring new errors, as 7.1 did; update packages by
name and run lint after.

Dependabot (`.github/dependabot.yml`) opens update pull requests weekly, for npm and for the workflow's actions, and
each goes through CI and a Vercel preview like any other. Every action in the workflow is pinned to a full commit SHA
with its release in a comment, because a tag can be moved to other code and a commit cannot, which is how the
tj-actions/changed-files compromise of March 2025 reached its users; Dependabot rewrites the SHA and the comment
together. Pin any new action the same way, resolving the tag with `git ls-remote`. What must move together shares one pull request, majors
included: `next` with `eslint-config-next`, React with its types and with R3F, whose peer range caps React's minor, and
three with its types. npm only warns on a broken peer range, so a React bump without R3F would arrive green. The rest
of npm shares one minor-and-patch pull request and its majors come one at a time, but a package whose newest release is
a major leaves that group entirely, patches and all. So `eslint` and `typescript` take no majors from the bot:
eslint-config-next's plugins cap eslint at ^9 and typescript-eslint caps TypeScript below 6, so those majors would
arrive red; drop each rule once its range opens. `@types/node` takes none either: it follows the Node major that Vercel
and CI build on, 22, so change it, Vercel's Node version and CI's `node-version` together, by hand.
`eslint-plugin-react-hooks` comes in through `eslint-config-next`, so it moves only in the `next` group, where CI's lint
is what catches a new rule. A release waits seven days before it is proposed (`cooldown`), because compromised npm
versions have been caught and pulled within days. Security updates skip both the wait and the groups: one moves only
the vulnerable package, so a security pull request for `next` leaves `eslint-config-next` behind; set it to the same
version in that pull request before merging. The bot's pull requests are squash-merged like any other, with the title
and message set as below, but GitHub credits a squash commit to whoever opened the pull request, so they land on `main`
as `dependabot[bot]`: the one exception to the authorship rule, and not one the merger can change.

Tests run on Node's built-in runner, which strips TypeScript itself, so they add no dependency: `tests/*.test.ts` import
the modules they test with a `.ts` extension (`allowImportingTsExtensions`), and nothing those modules import at runtime
may go through the `@/` alias. They cover what has broken before and runs where nothing else looks: the download figures
and their fallback (`lib/downloads.ts`, with `fetch` stubbed), both pre-paint scripts (`lib/prepaint.ts`, run in a
`node:vm` stand-in for the page before first paint), and the particle generators' buffers. Each was checked by
reintroducing a past bug: flooring the monthly figure, and marking the boot played only after hydration, both fail.
`.github/workflows/ci.yml` runs lint, the type check and the tests on every pull request and on `main`, and beside
that job a second one builds the site and runs the browser tests and the JS budget. It builds in the runner rather
than testing the Vercel preview, which sits behind Vercel Authentication, and because the budget reads the build's own
output. It caches Playwright's browser download, keyed on the Playwright version, and uploads traces when a spec fails.

The browser tests (`e2e/*.spec.ts`, Playwright, Chromium only) cover what only a real browser shows, most of the fixes
of October 2026. `playwright.config.ts` builds and starts the production server itself, since the pre-paint scripts,
the hydration fallback and the first-load chunks all differ under `next dev`; locally it reuses a server already on
port 3100, so after an edit stop that server first, or the specs test the old build. Every spec runs at 1440 and at
375 wide, and each asserts the outcome a reader sees, never how it is produced, so the boot, the entrances and focus
handling can change underneath them: the PrepaintGuard repro under BootSequence, with no mask and `<html>` keeping
`skip-boot` and dark; a first visit painting the mask, and a reload while it is still up painting none; reduced motion
never showing it; a mouse click at 40% down the Airbnb card landing with 40% of its /work twin under the pointer,
marked landed, with `card-flight` gone; the hero's h1 and facts at full opacity in a 412x5000 viewport; every page
answering 200 with no console error and the headers from `next.config.ts`, `/_not-found` carrying noindex (`next start`
answers it 404, Vercel 200, so only the header is asserted), and the old URLs answering 308; the mode switch flipping
`data-mode` both ways and `mode-switching` coming off after; and an unscrolled homepage fetching no three.js, while one
scroll fetches it, so the marker string is known to still match. They wait on conditions, never on fixed sleeps, and
there are no retries, so a spec that passes on a second try counts as a flake to fix. The mode switch's frame flash is
deliberately not tested: headless Chromium never shows it (under Navbar Dark/Light Theme Detection). Each spec was
checked by reintroducing a past bug: PrepaintGuard doing nothing, the boot marked played only after hydration, the
hero's facts on the site's `-10%` in-view reveal, the handoff scroll removed (40% landed as 67%), and a static three.js
import on the homepage all fail.

The budget (`e2e/budget.ts`) reads `.next/diagnostics/route-bundle-stats.json`, which Next 16 writes on every build.
Its chunk list per page matches the prerendered HTML's script tags exactly, less the nomodule polyfill a modern
browser never fetches, so it is the first load as served; a browser fetches more right after (about 680KB on /),
because Link prefetches other routes' chunks. The file gives raw bytes, so the script gzips the same chunks itself.
In October 2026 / was 625KB raw and 197KB gzipped, and each route's budget is its figure plus 20KB raw and 6KB gzipped,
rounded up: Framer Motion's full bundle coming back (39KB raw, 10KB gzipped) breaks it, and the static three.js import
took / to 1346KB. A pull request that means to grow runs `npm run budget -- --update` and commits `e2e/budget.json`,
saying why. A new route without a budget fails, as does a budget for a route that is gone. The stale Turbopack cache
note below applies to the build the specs run on, too. `@playwright/test` is 1.63.0, the version whose Chromium is
preinstalled in cloud containers; if Dependabot moves it past that, launch locally with
`executablePath: '/opt/pw-browsers/chromium'` rather than running `playwright install`.

Commits are authored as Akshay Dongare <akshay@akshaydongare.com> and carry no AI attribution: no
`Co-Authored-By` or `Claude-Session` trailers, and no model or tool names in the message. Pull request
titles and descriptions follow the same rule: no "Generated with" footer, session link or tool name. This
overrides any default a coding tool applies. A cloud container's global git identity can be `Claude <noreply@anthropic.com>`,
so before the first commit set the repo's own: `git config user.name "Akshay Dongare"` and
`git config user.email akshay@akshaydongare.com`. A cloud container also signs every commit with its own SSH key (`gpg.ssh.program`
`/tmp/code-sign`), not the owner's, which stays on the owner's machine; GitHub matches a signature against the
committer's account, so with the owner as committer those commits show as Unverified. So merge pull requests with
**squash**: GitHub writes the commit that lands on `main` and signs it with its own key, and it shows as Verified
under the owner's name. Set the squash commit's title and message explicitly, under the same no-attribution rule. The first 79 commits follow this. 25 from 24 to 26 October 2026
do not; they were left in place rather than rewrite `main`'s history.

`npm run dev` can keep serving a pre-edit `app/globals.css`, even across a restart: Turbopack's
cache in `.next/dev/cache/turbopack` held one while TSX edits beside it hot-reloaded. The chunk
name carries no content hash, so fetch the served CSS and check that the edited rule moved; if it
did not, stop the server and clear that directory. `npm run build` does the same from
`.next/cache/turbopack`: on Next 16.3.5, after a `git switch`, it emitted the previous build's
`globals.css` beside current TSX. Check the built chunk too, and move that directory aside if the
rule did not move.

## Architecture

### Tech Stack
Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · React Three Fiber / Three.js

### Layout Wrapper Chain

Every page passes through this chain (defined in `app/layout.tsx`):

```
BootSequence → CursorProvider → Navbar + <main> + Footer
```

- **BootSequence** (`components/boot/BootSequence.tsx`): Plays a one-time iris-wipe animation on first visit (gated by `sessionStorage`). Renders children directly on repeat visits. The pre-paint script in `app/layout.tsx` decides and records it: it sets `bootPlayed` as the boot first paints, or adds `skip-boot`, and records the decision in `window.__prepaint` (`lib/prepaint.ts`), which the component reads in a layout effect, not the class and not storage. Not the class, because React can strip it: when anything edits the server HTML before hydration (an extension, Chrome translate, autofill, a password manager), React 19 abandons hydration and client-renders the root, and taking over `<html>` removes every attribute and re-applies only its JSX props. Whether an extension wins that race varies per load, so a reload replayed the intro at random, and the same wipe flipped a dark visit to light; the production build logs nothing. `PrepaintGuard` (`components/boot/PrepaintGuard.tsx`), the first child of `<body>`, puts `skip-boot`, `data-mode`, `colorScheme` and the theme colour back from the record in a layout effect, after that commit and before paint, and the skip is a layout effect too, so a client-rendered load paints as a hydrated one. Do not move either back to a passive effect or back to reading `<html>`. To reproduce, add an init script that sets `sessionStorage.bootPlayed` and appends a space to the `h1` on `DOMContentLoaded`, then load a production build: the mask must be absent and `<html>` must carry `skip-boot`. If the scripts never ran, the component falls back to the same sessionStorage check. If the bundle never runs, nothing removes the mask, so a CSS backstop (`boot-mask-backstop`) hides it 10s after first paint; the boot is over within about 2s of hydration, 6s at most, which leaves a slow network room to play it. The mark used to wait for hydration, so a reload in the seconds before it played the whole boot again while a later reload skipped it, which read as random. Each tab is its own visit, so a new tab plays it once. A press skips it, since a new tab is how recruiters arrive from LinkedIn or email and an impatient click used to go through the mask to the hero's PyPI link: a `pointerdown` or a key before the reveal starts it at once and drops the typing hold, and one during it calls `finish()` on the panels, so the mask goes at once. The mask takes pointer events until the panels begin to part, 220ms into the reveal, so the click that skips lands on the mask rather than on a link the reader cannot see, and a Tab that skips is held back, since its focus would land behind the panels (SC 2.4.11). Keys with Cmd, Ctrl or Alt are browser shortcuts and pass untouched. A skip counts as the intro having played, there is no hint on screen, and nothing changes for anyone who waits: measured on a production build, a click during the typing opens the page 1.4s later on the same URL, and one during the reveal removes the mask within two frames (16 to 25ms). The listeners go when the mask does. Its lockup types itself like a terminal: `[ AKSHAY DONGARE ]` is clipped open a character at a time behind a block caret, the rule draws under it, and the role line prints after: the name at 50ms a character and the role at 20ms, done by about 2.1s from first paint, and the panels open 500ms after the role line finishes, waiting on its animation (`TypedLine`, `.typed-*` in globals.css). At 26ms and 7ms a character, with the panels on a fixed 900ms hold, it read as text flashing past before anyone could read it; keep the pace at reading speed. It is CSS so it runs before hydration. The reveal is the Web Animations API, which runs transform and opacity on the compositor, so the panels slide smoothly while hydration still holds the main thread; gsap tweened them from that thread and cost a 68KB download on exactly the visit that plays it. The curves are gsap's former ones: `power2.in` as `cubic-bezier(0.11, 0, 0.5, 0)` and `expo.inOut` as `cubic-bezier(0.87, 0, 0.13, 1)`.
- **CursorProvider** (`components/cursor/CustomCursor.tsx`): Replaces the native cursor with a hyper-minimal 5px dot that behaves the same in both modes, so a mode switch never changes how it feels: white with `mix-blend-mode: difference`, so it inverts whatever it is over, except over the two particle fields (`data-cursor="solid"` on `ParticleSection` and `ContactSection`), where it turns solid with a 1.5px ring in the page colour, ink and cream in light, white and void in dark (`--cursor-solid`, `--cursor-solid-ring`). An inverted dot falls to 1.1:1 on the light olive pigment and 2.1:1 on the terracotta, and the ring keeps the solid one visible on the brightest dark-mode cores too. Light used to be a solid ink dot everywhere, which made the two modes feel different. Scales to 8px on hover via a 150ms spring. It runs only while the page has focus and the pointer is inside it: with another app in front, macOS will not let the browser hide its pointer, so the dot hides and the native pointer returns rather than showing both. Back from another app, macOS can keep its arrow up while Chrome re-sets the same hidden cursor object, so on focus, a tab switch, a Back restore and pointer re-entry the provider toggles `html.cursor-resync` three times, 150ms apart; that swaps `none` for a transparent 1px image through `--hidden-cursor`, a new object Chrome has to set. Keep `var(--hidden-cursor, none)`: plain `none` brings the arrow back. Tracking uses raw DOM events driving a Framer spring at 60fps; nothing consumes a cursor context, so there is none. Native `cursor: none` is set globally in `globals.css`, on `<html>` itself as well as `body` and controls, plus `html::view-transition` in a rule of its own: the mode switch's view transition puts a snapshot layer off `<html>` under the pointer for 600ms, and the arrow came back over it.
- **`app/template.tsx`**: Wraps every route in a `PageTransition` fade/slide — this is the Next.js `template.tsx` (re-mounts on every navigation, unlike `layout.tsx`). The fade is the CSS `.enter` entrance, so each remount replays it. When React abandons hydration and client-renders the root, every element is new and the entrance would replay over a page that had already faded in, a blink; `PageTransition` compares itself with the wrapper the server HTML arrived with and finishes the entrances in its subtree when they differ. With the reproduction above, main's wrapper went back to opacity 0 at 220ms and faded in again; it now holds at 1.

### Navbar Dark/Light Theme Detection

In light mode the Navbar skips all of this and stays ink, because every light ground clears 9:1 for it; the sentinels below only matter in dark mode. The switcher (`components/nav/ModeToggle.tsx`) is an icon-only `role="switch"`, a sun knob on an ink track in light and a moon knob on a paper track in dark, beside the CTA on desktop and beside MENU on phones. Its look reads `data-mode` through CSS variants, so it is right before hydration. Pressing it opens the new mode as a circle growing from the knob over a still snapshot of the old one, over 600ms (`revealMode` in `lib/mode.ts`, through the View Transitions API); browsers without the API and reduced motion switch at once. For the length of the switch `html.mode-switching` turns colour transitions off, or they would replay inside the circle, and scopes the snapshot styles so other view transitions keep their defaults. It is added inside the transition's update, with the mode, so the page restyles once there rather than once more before the old snapshot (transitions take their settings from the new style, so none starts; measured, none runs on /, /about or /work), and it is removed at idle after `finished`, because removing it restyles the whole page. The circle is a CSS animation (`mode-reveal` in globals.css) on `--reveal-x`, `--reveal-y` and `--reveal-r`, which `revealMode` sets; do not move it back to `root.animate()` from the transition's `ready` promise. That promise can settle a frame after the snapshots are painted, so the whole new mode showed for a frame before the circle began, a flash that came and went with main-thread load. The end is guarded too: a screen recording on a Mac caught Chrome showing the whole old mode for one frame about 560ms in, about 3 switches in 12, while headless Chromium, even with composited clip-path animations forced on, never did, so a clean headless run proves nothing here. The radius is the registered length `--reveal-at`, which `clip-path` reads, so the compositor has no clip animation to hand back at the end; the circle completes at 88% and holds; and `mode-retire` hides the old snapshot from 93%, behind a new one that already covers the viewport, so a stray frame at teardown has no old page to draw. Under both snapshots Chrome shows only the new mode's flat ground. Only the switch in progress clears `mode-switching`: a key press during a switch skips the running one, and its end would otherwise drop the next into the browser's cross-fade. The scrolled glass is its own layer, 112px tall against the 80px bar, masked to fade out over its last 30% in both modes, so text scrolling under the bar dissolves instead of being cut by a hard edge. All three glass values share one opacity, 0.6.

In dark mode the Navbar (`components/nav/Navbar.tsx`) adapts its text and background colors based on the content scrolled behind it. It queries all `[data-theme="dark"]` DOM elements on every scroll event and checks if any overlap `y=60px` (the navbar height).

**Key pattern for section components:** sections that span both dark and light backgrounds (e.g. `ParticleSection`, `WorkSection`) use invisible sentinel `<div>`s with the appropriate `data-theme` to cover only the relevant vertical portion of the section. This lets the Navbar correctly transition as the user scrolls through gradient bridges.

### External Links

Every link opens in place. No `target="_blank"` anywhere, including the links on the download
figures. Re-tested in September 2026 against the argument that a new tab keeps the reader on the
site, and upheld:

- No evidence says a new tab retains readers. Cloud Four (2024) looked and found not even
  anecdotes, and `_blank` opens the tab in front, so the portfolio leaves the screen either way.
- A quick check followed by a return is a case NN/g's *Opening Links in New Browser Windows and
  Tabs* (2020) says to keep in the same tab, and readers under time pressure, which recruiters are,
  minded new tabs most.
- On desktop Chrome, Back in a new tab does nothing: its back-to-opener feature is off by default.
- Recruiters often arrive from LinkedIn, Gmail or Slack, whose in-app browsers ignore or break
  `target="_blank"`.
- The figures repeat the same destinations (four links to PyPI, two to pepy), so new tabs would
  stack duplicates.
- JAWS and NVDA announce nothing when a link opens a new tab.
- A reader who wants a tab already long-presses or Cmd-clicks; forcing one takes that choice away.

NN/g's mobile finding, that users could not go Back from a new tab, no longer holds: Chrome for
Android and iOS Safari now close a link-opened tab on Back. Do not cite it as the reason.

Back is cheap: the site is bfcache-eligible (no `no-store` on the document, no
`unload`/`beforeunload` handlers, no WebSocket or IndexedDB), so returning restores scroll and
Framer's `once: true` animation state without a remount.

Do not "fix" this by reintroducing `_blank` for citations. An unannounced new tab is not a WCAG
failure at any enforceable level: SC 3.2.5 Change on Request is AAA, and SC 3.2.1/3.2.2 govern
focus and input, not link activation, so this is a usability decision, not a conformance one. The
one exception the evidence supports is a PDF on desktop. If a resume PDF is ever added, prefer an
HTML resume; failing that, say "opens in a new tab" in the visible link text.

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
- **Old URLs.** `/projects` and `/social` from the previous site 308 to `/work` and `/contact`,
  and `/profile.jpg` to the current headshot, in `next.config.ts`. `/blog` has no equivalent and stays a 404.
- **First-screen reveals run on mount.** Google renders in a tall viewport, and every `h-svh`
  section stretches with it: at 412x5000 the hero is 5000px and its h1 sits at y 4708, outside
  a `whileInView` margin, so it stayed at the server-rendered `opacity:0`. Anything on the first
  screen enters on mount, never `whileInView`, and in CSS, not Framer (under Reveal timing), so it
  shows whether or not the bundle runs.
- **Not-found.** `/_not-found` carries `X-Robots-Tag: noindex`. Requested directly it answers
  200, and every real 404 names it as canonical through the root layout's `./`.
- **Site name.** The WebSite JSON-LD pairs `name: "Akshay Dongare"` with the domain as
  `alternateName`, Google's documented fallback when it is not confident in the name.

### Headers

`next.config.ts` sends the OWASP secure-headers baseline on every path, less what Vercel already sends (HSTS):
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` and a
`Permissions-Policy` that denies the camera, microphone, geolocation and the Topics API. There is no
Content-Security-Policy on purpose: the pre-paint scripts and JSON-LD are inline, and a nonce-based policy would make
every page render dynamically instead of prerendering.

### Accessible names and targets

**A name starts with the words on screen.** SC 2.5.3 requires the visible text to be in the name, and
Understanding 2.5.3 recommends it come first, because voice control users say what they read. So an
`aria-label` or a hidden tail starts with the visible text and adds any context after it, as the claim
pills do after a colon. axe checks containment as a plain substring with punctuation stripped, so the
Navbar's `[ AD ]` is named `AD: Akshay Dongare, home`, or `AD: Akshay Dongare, back to top` on the
homepage, where it scrolls instead, without the brackets a screen reader would read out. Do not pass the
rule by putting `aria-hidden` on the visible text: axe goes quiet while "click AD" still fails.

**The Code link is named by its content and is the phone scroller.** It wraps the label and both diff
`<pre>`s, so a tap anywhere opens the PR. A mouse from `md` is held to the ink: the link takes
`pointer-events: none` under `(pointer: fine)`, and the label (`w-fit`) and every diff line (`w-fit`) take it back,
so hover, the cursor's grow and a click all happen only over text. The link is a 620px by 1,490px block, and half of
its area was empty, 341px of it to the right of the label alone, so the label lit up with the pointer nowhere near
any text: 607 of 1,206 sampled points at 1440x900 were more than 8px from a glyph, and none are now. On hover the label
and its `[ → ]`, which share one colour, take `lbl-hover`. Its name is the visible label plus an `sr-only` tail with the
PR number and title, so the two cannot drift apart, and the `<pre>`s are `aria-hidden`, or the whole diff
would be the name. Below `md` the link carries `overflow-x-auto` and the `-mx-6 px-6` bleed, and the
`<pre>`s never scroll. Chrome and Firefox make a scroller with nothing focusable inside a Tab stop of its
own, so a scrolling `<pre>` would add a second stop, one screen readers cannot see; as the scroller, the
link is the only stop. On phones the label scrolls with the diff, the focus ring sits 2px inside because
the bleed puts the link's edges on the overlay's clip, and the scrollbar falls below the overlay's fold,
so a mouse scrolls it with shift and the wheel. Do not put `tabindex="-1"` on the `<pre>`s instead: HTML
forbids a `tabindex` descendant in an `<a>`, and axe cannot judge it either way, because it skips
`aria-hidden` elements; only a Tab walk finds a hidden stop.

**Focus follows a client navigation and a ScrollCue.** Next 16.4.2 leaves focus where it was (its layout-router
"intentionally leaves focus untouched"), so after a footer link the next Tab went back into the footer, and after a nav
link a keyboard reader tabbed through the header again. `focusWithoutScroll` in `lib/focus.ts` focuses with
`preventScroll`, because the router, the hash landing and ScrollCue own the scroll, and gives a target that is not
focusable `tabindex="-1"` only until it blurs, or a later click on it would keep taking focus, as `tabIndex` on `<main>`
once did. `PageTransition` focuses the new page's h1 on every mount but the first load's, which it notes in a layout
effect so pages can ask; /work arriving with a hash focuses that card's title link after `landCardUnderPointer`, and
`PageTransition` leaves focus a page already placed. ScrollCue focuses the next section's heading, or the Code section
itself, which has none. A pointer click shows no ring, since programmatic focus after one does not match
`:focus-visible`; measured on a production build, a click on a card, a cue, a footer or a nav link leaves nothing
matching it, light and dark, with and without reduced motion. Next's route announcer still speaks the title.

**Links in `.text-body` copy fill their line (`.link-in-text`).** SC 2.5.8 exempts links in a sentence
and stock axe skips them, but the Vercel Toolbar's audit flagged Harvard University on /work. When it
fits on one line it is a 21px-tall box 22px from the tail of the GAMI link: forcing axe's target-size
checks onto the paragraph failed it at 110 of 301 widths, and found two /about links failing the same
way. `padding-block: 0.125em` makes each fragment 24.5px at 16px and 28px at 18px, inside the 1.6 line
box, and moves no text, because vertical
padding on an inline box does not change line boxes. The window is narrow: under 0.11em a 16px fragment
stays below 24px, and over 0.146em an 18px one outgrows its line. Recompute it if `.text-body`'s
line-height or the font changes, and never meet a target by raising line-height or using inline-block,
which reflows the copy.

### Branding

**Logo:** typographical brutalist `[ AD ]` in monospace, in the Navbar (small, inline, inherits theme text color). When a mouse enters it, A and D decode: each flickers through random mono glyphs about 22 times a second and settles in reading order, the last at 420ms, while the brackets hold still (`components/ui/DecodeText.tsx`). For a while it re-typed behind the boot's caret instead; the owner tried that and chose the scramble back. Keep it the site's only hover effect of its kind; the owner wants the site classy, not busy, and plain is fine. The mono advance keeps the width fixed, the link's `aria-label` stays the name, and a tap or reduced motion leaves it alone. The Footer carries the Akshay Dongare wordmark alone, and it links home as `[ AD ]` does, scrolling to the top on "/"; the © line beside it links to /privacy the same way. Do not revert to the old overlapping-circles letterform. Its accessible name is under Accessible names and targets.

**Favicon:** the same mark in Geist Mono 700, parchment `#f2efe9` on void `#07090f`, as
three files Next picks up by convention: `app/favicon.ico` (16, 32, 48), `app/icon.png` (192)
and `app/apple-icon.png` (180, opaque and square because iOS rounds its own corners). The 16px
frame is "AD" alone, rendered at native size: with brackets, each letter at that size is about
6px tall with sub-pixel strokes and blurs to grey. Google Search needs a square of at least
8px, recommends one larger than 48px, and does not accept SVG; the 192 PNG covers all three.
Keep these files byte-stable: Google wants a stable favicon URL, and Next's `?hash` changes
whenever a file does.

**Radii and shadows:** controls and chips are pills; every surface, cards and portraits alike, is
20px, 24px from `md`. Shadows are ink-tinted (`var(--card-shadow)`), never black. Small controls reach
about 44px through invisible padding or `::after`, never by drawing larger.

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

**/about body text and the /contact paragraph are justified** (`text-justify hyphens-auto`), at the
owner's request. Hyphenation depends on `lang="en"` on `<html>`. WCAG 1.4.8 advises against justified
text, but only at AAA, so it stays on these two pages and does not spread without asking.

**/about body is 20px from `lg`, on 1.625 leading** (`lg:text-[1.25rem] leading-relaxed` over
`.text-body`), at the owner's request. At 1440 the 740px column runs a median 78 to 81 characters a
line at 20px against 86 to 88 at 18px, and WCAG 1.4.8 (AAA) caps a line at 80. Below `lg` the size is
`.text-body`'s 16 to 18px, so from 820 to 1023px, where the column is already 740px, lines still run
86 to 88. `.link-in-text` needs no recompute for it: the 24px floor does not depend on line height,
and the 1.625 line lifts the ceiling from 0.146em to 0.160em at 18px, so at 20px a link fragment is
31px inside a 32.5px line. Both classes sat in the markup for a long time without rendering; the
`@utility` note under Color System says why.

### Modes

Light is "Daylight Folio"; dark is the original "Deep Obsidian" site, behind a Light / Dark switcher.
Every visit opens in the device's `prefers-color-scheme`, light as the fallback, and until the switch is
used it follows a system change live, such as macOS turning dark at sunset. The switch's choice lasts for
the visit only, in `sessionStorage`: it holds across reloads and pages and goes when the tab closes, and the
pre-paint script deletes any lasting `localStorage` choice. This is a readability call for a site people
visit a few times: a reader in dark mode at night should not get a screen of cream, both modes clear the
same contrast, and most presses of the switch are someone trying it, not setting a preference. Do not
make the choice persist across visits without asking. `<html data-mode>` carries the mode, and a pre-paint
script in `app/layout.tsx` applies the visit's or the system's mode so a dark visitor never sees a light
frame. The script also writes the mode to `window.__prepaint`, and `applyMode` keeps that copy current, because
React strips `<html>`'s attributes whenever it client-renders the root after abandoning hydration;
`PrepaintGuard` re-applies the recorded mode before paint (under the BootSequence bullet). Anything the
pre-paint scripts set on `<html>` must go through that record too, or it can vanish on some loads. `lib/mode.ts` holds the hook and the setters; each tab is its own visit, so there is no cross-tab sync. Keep the attribute off `data-theme`: the Navbar reads `[data-theme="dark"]` as section
sentinels. Anything that must be right before or during hydration reads the attribute, not the
hook, because the hook reports the server's "light" until hydration ends: the Navbar starts at a
null state rendered as `text-fg-100`, which CSS resolves per mode. The root layout owns the
theme-color meta; viewport metadata would be re-inserted as light on every navigation.

**Every colour is a token with two values.** `:root, [data-mode="light"]` holds light and
`[data-mode="dark"]` holds dark, and each dark value is numerically equal to what the component used
to inline, so dark mode renders as it did before the switcher existed. Section backgrounds are
`var(--spine-*)`, the parallax layers `var(--depth-*)`. The intended dark differences are
`color-scheme: dark`, so native scrollbars match the page; the Code label at the 13px floor instead of
9.9px; the code overlay's fade at its foot; and the Work cards and ALL WORK, which stay paper in both
modes (below). Text selection is the one place colours are literal rather than tokens, because custom
properties inside `::selection` resolve differently across engines: ink `#1a1c13` on a terracotta wash
`#e9b48c` in light (9.3:1), void `#07090f` on the bright accent `#6b9fd4` in dark (7.1:1), and the light pair
inside `.surface-paper`. Change both modes together, and keep the text at 4.5:1 or above on its wash. Keep each
wash clear of the system highlight, too: the dark one was the accent's deep blue `#3a6288`, within 6 levels of
macOS's own dark-mode selection blue, so readers saw no change at all.

**Work cards and ALL WORK.** Built to Apple's published principles (the HIG and the WWDC25 design
sessions): content first, colour used sparingly, no glass on the content layer, depth from one soft
shadow. The four homepage cards are one opaque paper, `#fffdf8`, in both modes, with no edge, sheen,
gradient or glow, so the company logo is the only colour on a card. A card follows its section's
theme, not the page's: in dark mode the Work section is still the light arm of the bridge, and every
dark treatment tried (near-black, mid slate, a slate-to-navy gradient with a glow) read as slabs or
as flashy against it. The `.surface-paper` scope in globals.css gives everything inside the card the
light ink ramp whatever `<html>` says, and `OrgLogo`'s `paper` prop pins LangChain to its light-ground
file, because the `dark:` and `light:` variants still key on `<html>`. Names are 24 to 28px semibold,
the role line is 15px sentence-case sans, the pills are flat 6% ink capsules, and corners are 20px,
24px from `md`. ALL WORK is the same paper, darkening one step on hover as the pills do; an inverted
solid outweighed the cards. /work shares the geometry: opaque paper in light, and in dark one step of
Apple-style elevation, `#1c2230`, rising to `#232a36` on hover with no glow, lift or border.
`prefers-contrast: more` brings back a visible edge on all of them.

**Every card is a link, and every card sinks on hover.** The four homepage cards open their entry on
/work (`/work#airbnb`, `#langchain-litellm`, `#iso`, `#harvard`), and each /work card opens its evidence,
both through the same stretched link: the title's `<a>` covers the card with its `::after`, and any link
inside a card takes `relative z-10` to stay above it. Do not wrap a card in an `<a>`; that nests links.
On hover a card sinks rather than lifts: its fill drops one step below the ground (`--card-hover-bg`
`#f4f1ea` on paper, `--work-card-hover-bg` `#0b0c13` on /work's dark), a hairline edge appears, the
shadow goes, and the destination label (WORK, LINKEDIN, GITHUB) slides in. ALL WORK does the same.
Arriving at `/work#…` shows that card in the same state for a moment, so a reader sees where they landed;
the page's `scroll-padding-top: 96px` plus the card's `scroll-mt-4` keeps it clear of the nav. It is a 2s
animation (`landed-card`, `landed-label` in globals.css) that holds for 1s and eases back to rest, replaying
on each arrival. Held for good it read as a stuck hover, as if the page had hung. `:target`
alone covered only a full load: a homepage card arrives by client navigation, and Next moves the URL with
`pushState`, which never updates `:target`, so no click, tap or Enter ever showed it. `WorkContent` mirrors
the decoded hash into `data-landed` through `useSyncExternalStore`, listening for `hashchange`, `popstate`
and the Navigation API's `currententrychange`, the only one that fires on `pushState`, so the Navbar's Work
link from `/work#id` clears the card where that API exists. The `landed:` variant matches `[data-landed]`,
or `:target` only until the page has hydrated (`data-hash-synced`), since after that `:target` too can be
left on the wrong card.

**A mouse click on a homepage card lands with the pointer on the same card.** A page cannot move the
pointer, so `lib/cardHandoff.ts` moves the page: the click records how far down its card it fell, and
/work replaces Next's hash scroll with one that puts the same fraction of the matching card under the
pointer. It measures layout offsets, not `getBoundingClientRect`, because the page is still sliding in.
The column lines up only because both grids share one geometry and /work opens with the four in the
homepage's order, Airbnb and langchain-litellm, then ISO and Harvard. `lib/work.ts` keeps the two orders
in step, or every click lands on the neighbouring card: `FEATURED` lists the four ids once, both pages
build their featured cards from it as a `Record<FeaturedId, …>` and render them in its order, and the
handoff and flight helpers take a `FeaturedId`, so a renamed, missing or stray id fails `npm run
typecheck`. Before it, both pages spelled the slugs out, and a rename on one side passed lint, types and
tests while the flight waited out its 1.5s timeout and landed with no cue. Touch, keyboard and modified clicks keep the anchor jump.

**A homepage card flies to its place on /work.** A click, a tap or Enter on one of the four cards runs a view
transition (`flyCard` in `lib/cardFlight.ts`). The card and its /work twin share the name `card-flight`, so the browser
carries the one into the other over 400ms while the rest of the page fades as it always does. The update waits for
/work to report its card mounted and scrolled (`cardArrived`, from WorkContent's mount effect, after
`landCardUnderPointer`), so the flight ends where the card rests and nothing moves after it lands; after 1.5s it lands
without the flight. The twin starts at rest: WorkContent leaves the entrance class off its wrapper, decided once at
mount, since adding the class when the flight clears would start the entrance then. The rest of /work enters as usual, and the landed cue is paused under `html.card-flight` until the card
arrives. The flying box is clipped to the card's corners and filled with the landed card's colour; the outgoing card
holds still underneath while the arriving one fades in between 25% and 60% of the flight, so their text overlaps only
briefly. Modified clicks, reduced motion and browsers without the API navigate as before. Nothing inside the update may
wait on animation frames, which the browser holds until the new page is captured. The page wrapper has no exit to wait on:
`app/template.tsx` remounts it on every navigation, so the old page leaves at once.

**Text never uses white or black utilities.** `text-fg-NN` replaces `text-white/NN`: in dark it
is the same `color-mix` Tailwind emits for `text-white/NN`, in light a solid ink by role (NN 85
and up `#1a1c13`, 65 to 80 `#272a1e`, 50 to 60 `#3d422c`). `text-lbl-NN` is the same on
`.text-label` call sites and turns rust `#6b2a11` in light. A label that is a link or a button (the Code
label, ScrollCue, APPROACH, the footer links, the © line, and the notes on /404 and the error page) lights up on
hover in both modes. In dark it brightens from white/50-80 to white/80-100. In light it rests in ink (`light:text-fg-100`)
and turns rust on hover (`lbl-hover`, `#6b2a11`), with its `[ → ]` following the label's colour. They used to rest in
rust and go to ink, which in light read as the reverse of dark's lighting up, and a deeper rust (`#561600`) on hover
was too close to the rust it started from to see. Static labels stay rust.

**The Code diff keeps dark's hierarchy in light.** Dark's red and green pop because they are brighter and more
saturated than the grey of the unchanged lines. Light had it inverted: unchanged lines in olive ink at 9.27:1 were the
strongest text in the block, and the forest green and maroon, at 7.8:1 and low chroma, sank into them. The diff now
has its own tokens: unchanged and `#` lines take `diff-ctx` and `diff-note`, a neutral grey `#6b6961` at 4.89:1 in
light and exactly `fg-55` and `fg-50` in dark, and the changes take `diff-add` `#00722a` and `diff-del` `#b32322`,
OKLCH chroma 0.14 and 0.18, at 5.43:1 and 5.87:1. Each ratio is against the darkest ground behind the code,
`rgb(247,241,229)`, so do not lighten the grey: at 0.54 OKLCH lightness it falls to 4.47:1. Ink at partial alpha cannot stand in
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
as terracotta `#a8532b`. Each field builds its `ShaderMaterial` once; a mode switch sets the colour, the blending and the fade
band on it in place, through R3F's dash-case props on `<points>` (`material-uniforms-uColor-value`), with the
colour as a `THREE.Color` so R3F copies it rather than re-parsing it. Do not put the colour or blending back in
the material's `useMemo` deps: rebuilding it linked a new GPU program on the next frame of a visible canvas,
a 155 to 215ms stall in the middle of the reveal when switching with the Contact field on screen.

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

Of the old palette only `--color-charcoal` remains, in `:root`: `body` and the dark `--on-paper` read it. Every other
colour is a mode token, under Modes.

**Tailwind reads the code, not the docs.** `globals.css` opens with `@import "tailwindcss" source(none)` and one
`@source` each for `app`, `components` and `lib`. Automatic detection also read this file, and
every class-like word in it became CSS: `tracking-[-0.02em]` and `leading-[1.05]`, quoted here as deleted overrides,
shipped as live rules. `@source not "../AGENTS.md"` cannot fix it, because the scanner follows the `CLAUDE.md` symlink
back to this file and still reads it. A new top-level folder that holds classes needs its own `@source` line, or its
classes silently render unstyled.

**Typography utilities must not declare `color`.** `.text-label` did while it sat in
`@layer utilities`, and it silently beat every `text-white/NN` written beside it: same specificity,
same layer, and it comes later in the sheet, so the markup's colour lost. Every
`.text-label` on the site rendered `#8a8a8a` regardless of what the class list asked
for. On the dark canvas that happened to look plausible, which is why it survived; on
the light `mist → parchment` gradient, `AboutSection`'s "MORE ABOUT ME" measured
2.78:1 at 10.4px against the `#1c1c1c` it asked for, which clears ~13.7:1. If a
utility needs a default colour, give it to the call sites instead.

**A custom class that call sites override belongs in `@utility`, not `@layer utilities`.**
Tailwind emits its own utilities into the same layer at the same specificity, and the
hand-written block comes later in the sheet, so it beats any Tailwind utility on a property
it declares, responsive variants included. `.text-body` did this to /about: its
`lg:text-[1.25rem]` and `leading-relaxed` were in the markup, and the page rendered 18px on
1.6. As `@utility`, Tailwind sorts it among its own utilities, so a variant or a
single-property utility beside it wins. The move also brought back a dead `leading-relaxed`
beside `text-body` on ten other call sites. Those were deleted, and every other page measured
identical at 375 and 1440: font size, line height, weight, tracking and family on every
element, plus page height.

The display classes and `.text-label` followed, as did `.text-code` until it went with MDX, so `@layer utilities` holds only
`.link-in-text`, which no call site overrides. The move woke six dead overrides. The owner kept one:
the Footer wordmark renders its `font-medium tracking-tight leading-none`, 500 on -0.025em and 1.0.
The other five were deleted so each heading matches its siblings on the same class: the /about
Timeline h2 stays 400, the home About and Work headings stay on 1.1, /contact's h1 stays at -0.02em,
and the MDX h1, since deleted with the pipeline, stayed on display-l's normal tracking. Seven copies of a class's own value
(`leading-[1.05]`, one `tracking-[-0.02em]`) went too. Across every page, the 404 and the open phone
menu at 375 and 1440, only the wordmark changed, and each page got shorter by exactly its two-line
leading cut, 4.5px and 8.6px. Measured on `npm run build` and `next start`, with each build's CSS
checked as the note under Commands says.

### Blended Scroll Journey (Home Page)

Everything below describes the dark spine; the light spine and its rules are under Modes.

The homepage (`app/page.tsx`) assembles 7 sections. Each section uses `style={{ background: 'linear-gradient(...)' }}` with end-colors matched to the next section's start-color. All full-viewport sections use `h-svh` (not `h-screen`/`100vh`, which on mobile is taller
than the visible area and pushes bottom-anchored content under the collapsing URL bar;
not `dvh` either, which would re-animate section height as that bar moves). They carry
`marginBottom: '-1px'` to prevent sub-pixel rendering gaps.

The four sections that carry text, Hero, Particle, Mission and Contact, use `min-h-svh` with the text in
normal flow, so on a short screen the text grows the section instead of being cut off where nobody can
scroll to it. At `h-svh` with the text in an `absolute inset-0` overlay, the Mission APPROACH paragraph
ran about 85px past the foot of a 548px section on an iPhone SE, the h2 was cut on a landscape phone, and
the paragraph was cut at 200% zoom on a 1366x768 laptop; at 400% the Particle headline and CONNECT went
as well (WCAG 1.4.4, 1.4.10). Where the content fits, the section is exactly one svh tall and nothing moves: heights and every
text position measured identical to the `h-svh` version at 375x667, 375x812, 1280x800, 1366x768 and
1440x900, in both modes. `overflow-hidden` stays on the section, as on the hero, for the parallax and
canvas layers; with the text in flow it can no longer clip it. Text in a section with a `ScrollCue` ends
on `pb-[clamp(4.5rem,8vw,6rem)]`, which clears the cue. The Particle sentinels are percentages, so the
Navbar switches at the same place where the section fits, and at the same fraction where it grows; the
canvases are `inset-0`, so a grown section gets a taller field, and the climax's floor stays at its foot.

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
and Hero into ParticleSection sits at 3.0x, which is floored by 8-bit colour rather than by the
curve. The closest to the ceiling is About into Work at 768px in dark mode, 3.28x, since the homepage
portrait took a fixed 4:5 frame and the About section got shorter there.

A section that grows stretches its gradient and flattens its slope. That helps Hero into Particle, Particle
into About and Contact into the footer, and costs Mission into Code: the code ramp holds its slope while
Mission's falls, so the ratio is 2.0x times Mission's growth. It is 2.4x at 375x548, 2.8x at 844x340, and
3.0x at 1366x768 at 200% zoom, the highest at any 100% or 200% laptop size. Only at 200% on a phone or
400% anywhere, where Mission runs to three or four screens, does it pass the ceiling, and there the
`h-svh` version already measured 6x to 20x at other joints. Mission's whole ramp is 8 levels, so holding
its slope at that height would need a flat band; the stops were left alone. The hero already grows on
short landscape screens, so at 844x340 dark Hero into Particle measures 4.3x and Contact into the footer
3.6x, before and after this change.

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

**The Code label is on screen whenever the section is.** "Read this diff on GitHub" is the only sign the diff is a
link, so the overlay's drift is at rest when the section fills the screen: `15%` to `0%` to `-15%` across the scroll,
the same 30% of travel. It used to run `0%` to `-30%`, and the block is about 1,490px tall, so by the time the section
filled the screen the label sat 96px above it, at 1280x720, 1440x900 and 390x664 alike. Two things keep it there under
keyboard focus too. The overlay clips with `overflow: clip`, not `hidden`: a hidden box is still a scroll container,
and focusing the link scrolled it by its 128px top padding. And the drift holds at rest while the link has
`:focus-visible`, because the browser aims its focus scroll at the drifted position and the drift then moves on under
it: Tab from above left the label 20 to 43px above the viewport. With both, focus puts the label 112px down from either
direction, as reduced motion does, and the snap back on blur is about 5px.

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

**Framer Motion loads lazily.** Components use `m.*`, not `motion.*`, under the one `<LazyMotion features={domAnimation}
strict>` in `CursorProvider`, which saves 39KB (10KB gzipped) on every page; `strict` throws on a stray `motion.*`,
which would pull the full bundle back in. `domAnimation` covers everything the site uses: animate, `whileInView`,
exit, height and the cursor's springs. Layout or drag animation would need `domMax`.

**First-screen entrances are CSS.** The page wrapper, the hero's two blocks and the opening of every sub-page (h1,
intro, and /work's cards, /contact's links and /about's portrait and body) use `.enter` in globals.css, not Framer: a
fade and a rise from first paint, on Framer's former timing, `cubic-bezier(0.25, 0.1, 0.25, 1)` over 0.35s, or 0.3s
through `[--enter-ms:300ms]`, with the delay inline as `animationDelay` and a 30px rise through `[--enter-y:30px]`. Framer
rendered them as inline `opacity:0` and started them at hydration, so nothing on the first screen painted before
196KB gzipped of script had loaded and run. Measured on `next start` with a repeat visit at 412px, 4x CPU and slow 4G,
median of five: the h1 first shows at 0.85s on /, 0.82s on /work and 0.85s on /about, against 2.59s, 2.51s and 2.43s,
and LCP falls from 2.96s, 2.88s and 2.87s to 1.18s, 1.15s and 1.24s. CLS is 0 on every route, first visit and
repeat, at 320, 375 and 1440. It was not: the typing caret rode on `left`, so each character was a layout shift, which
gave the homepage 0.0006 at 375 on a repeat visit and every route up to 0.0004 on a first one, from the boot lockup. It
rides on `translate` now, across a box as wide as its line (`.typed-caret` in globals.css), and lands on the same
offsets, within a device pixel of edge rounding. The fill is
`backwards` with no end keyframe, so a finished entrance leaves no transform, as Framer did. Reduced motion keeps the
fade and drops the rise, as `MotionConfig reducedMotion="user"` does. Below the fold the reveals stay on Framer's
`whileInView`, and they are the only `opacity:0` left in the server HTML, which the `<noscript>` style in layout.tsx clears.

**Reveal timing.** Content fade-ins are capped at 350ms with delays under 200ms.
NN/g found scroll-triggered reveals slower than 500ms cause users to skip the content
outright, and the previous 800–1000ms reveals were outside that band. Keep new
`transition={{ duration }}` values on content, and `--enter-ms`, at or under 0.35s. This does not apply to
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
desktop width, and its size is `clamp(min(2.8rem, 6.5svh), min(6vw, 9.5svh), 5.5rem)`, so a short
laptop window or a short phone shrinks the headline instead of pushing the facts below the fold.
Measured, the `<dl>` ends inside the viewport at every size from 360x640 to 1920x1080, which keeps the
first-screen rule above. The download figure keeps whole from 375px (`min-[375px]:whitespace-nowrap`);
at 360 it must wrap, or the Creator row takes three lines and the facts fall below the fold. The name and role above the h1 type themselves in at the boot screen's pace (`components/ui/TypedLine.tsx`), from 300ms after mount, carets showing only while each types. The role types as two segments split where it wraps on a phone, since a typed line cannot wrap. On a first visit this runs under the boot mask, so the hero opens already typed.

**Download figures link the number, not the sentence.** The link wraps "15 million" or "1 million" and
stops there, so the underline marks the claim rather than the words around it. All-time figures go to
`PYPI_URL` and monthly ones to `PEPY_URL` (both in `lib/downloads.ts`). pepy's page header still says
the latest version is 0.6.6: its metadata last synced on 24 May 2026, although its download counts
are current. No pepy URL avoids that header, so pepy backs only the monthly count, which it states
as "in the last 30 days". The monthly figure keeps one decimal, rounded as pepy's page rounds it, so the number matches the page it links to ("1.2 million"). The default badge rounds to "1M", and the plain badge ignores `units`, so `lib/downloads.ts` reads pepy's personalized badge with `period=month&units=none` and formats the raw count itself; a compact badge still passes through if pepy ever ignores the option. PyPI lists every release but shows no download count at all, so the
pill's accessible name calls it the package on PyPI, not a citation for the figure.

**Copy and wrapping.** Visible copy uses the typographic apostrophe ’, never `&apos;` or a straight
tick. h2 and h3 balance their lines and paragraphs use `text-wrap: pretty`; the hero h1, the Mission
h2 and the hero's dd rows opt out, because balance rewrapped the h1's tuned lines and started a dd
line with the separator. Phrases that must not split use a no-break space or `whitespace-nowrap`,
and a separator binds to the word before it.

**Type floor.** `.text-label` is 13px, and nothing a reader needs goes below it. At 10.4px
the capitals subtend under 0.2 degrees, where reading slows sharply (Legge and Bigelow 2011).
Card text is measured, not eyeballed. Every card fill is opaque, so contrast no longer depends on the
ground: ink on the paper cards clears 16.9:1, the role line 10.3:1 and a pill 15.1:1; on /work's dark
`#1c2230` the white/55 body clears 5.75:1, and the tags use white/60 because white/50 fails on hover.

### Particle Systems (Two Distinct Components — Narrative Escalation)

The two systems are intentionally different in character: the first is a quiet, ethereal prelude; the second is chaotic and mechanical. Do not make them more similar.

**Both mount when the reader scrolls toward them, not when they are merely near.** The particle section sits at the fold, so
a 100px margin alone mounted it on every homepage load: three.js fetched at about 415ms, parsed and given a GL context
mid-hydration, a 300 to 460ms main-thread task on a load nobody had scrolled (headless, software GL). A field mounts once
it is near and the page has been scrolled at all (`useHasScrolled` in `lib/scrolled.ts`, which counts a page opened
already scrolled). Neither can be on screen at load, because the hero above them always fills the viewport. Both canvases set
`powerPreference: "default"` explicitly: `"high-performance"` wakes the discrete GPU on dual-GPU Macs for a decorative
field, and leaving the key out does not avoid it, because R3F 9.5 builds the renderer from `{ ...defaultProps, ...gl }`
and its defaults set `"high-performance"`. #34 removed the key for this reason and Chromium still reported
`"high-performance"` on both contexts until it was set.

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

### MDX

There is no writing section and no MDX pipeline. `app/writing/` was removed because its three posts were placeholders that all resolved to the same stub. The pipeline outlived it unused until it went too: `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, `rehype-pretty-code` and `shiki`, `mdx-components.tsx`, and the `createMDX` wrapper and `mdx` page extension in `next.config.ts`, 138 packages in all, none of which reached a visitor. To write in MDX again, follow Next's MDX guide, and give `mdx-components.tsx` its own `@source` line in `globals.css`, or its classes render unstyled (under Color System).

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
