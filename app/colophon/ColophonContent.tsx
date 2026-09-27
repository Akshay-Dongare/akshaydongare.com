"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export function ColophonContent() {
    return (
        <div
            className="masthead-glow w-full min-h-screen pt-32 pb-24"
            style={{ background: 'var(--spine-page)' }}
            data-theme="dark"
        >
            <div className="max-w-[1000px] mx-auto px-6 md:px-12 lg:px-20">

                <motion.h1
                    className="text-display-xl text-fg-90 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    Colophon
                </motion.h1>

                <motion.div
                    className="max-w-none text-body text-fg-65 space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    <p>
                        This website was designed and developed from scratch. It serves as both a portfolio and an ongoing experiment in frontend engineering, interaction design, and systems thinking.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-fg-85">Architecture</h2>
                    <p>
                        Built on <strong className="text-fg-80 font-medium">Next.js 16</strong> with the App Router, <strong className="text-fg-80 font-medium">React 19</strong> and <strong className="text-fg-80 font-medium">TypeScript</strong>. Every route is prerendered at build time. The download figures are the one live part: they come from pepy and PyPI, and the pages that show them regenerate every hour. Most of the interface still runs in the browser, because the cursor, the scroll choreography and both particle fields need a real window to exist.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-fg-85">Design & Styling</h2>
                    <p>
                        Styled with <strong className="text-fg-80 font-medium">Tailwind CSS v4</strong>, configured CSS-first. Every colour, gradient and shadow is a CSS variable with one value per mode, so no utility hard-codes a colour.
                    </p>
                    <p>
                        There are two modes. <strong className="text-fg-80 font-medium">Daylight Folio</strong>, the light one, moves through cream, sage, apricot and sand as you scroll; <strong className="text-fg-80 font-medium">Deep Obsidian</strong>, the dark one, is a near-black spine with a pale bridge through the middle. A visit opens in your device’s setting, and the switch holds your choice until you close the tab. Body text clears WCAG AA contrast in both.
                    </p>
                    <p>
                        Typography is set entirely in <strong className="text-fg-80 font-medium">Geist Sans</strong> and <strong className="text-fg-80 font-medium">Geist Mono</strong>, an excellent typeface family engineered for high-density interfaces and code by Vercel, served from this domain.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-fg-85">Interactions</h2>
                    <p>
                        Page transitions and content reveals run on <strong className="text-fg-80 font-medium">Framer Motion</strong>, none longer than 350ms. The one-time intro, an iris wipe, runs on <strong className="text-fg-80 font-medium">GSAP</strong>, which loads only on the visit that plays it. With reduced motion set, nothing slides, and the particle fields hold a still frame.
                    </p>
                    <p>
                        The cursor is a hyper-minimal 5px dot. In dark mode it uses <code className="font-mono text-fg-55 text-[0.8em]">mix-blend-mode: difference</code>, which inverts against any background; in light mode it is a solid ink dot with a paper halo, because difference drops out over the particle pigment. Position tracking uses raw DOM events mixed with React context at 60fps; the dot scales to 8px on hover via a 150ms spring. It runs only while the page has focus, so it never sits beside the system pointer.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-fg-85">WebGL & Physics</h2>
                    <p>
                        The two interactive particle fields are built on <strong className="text-fg-80 font-medium">React Three Fiber</strong> and <strong className="text-fg-80 font-medium">Three.js</strong>. Both use custom GLSL <strong className="text-fg-80 font-medium">ShaderMaterial</strong>s with a Gaussian falloff fragment (<code className="font-mono text-fg-55 text-[0.8em]">exp(−d²×9)</code>). In dark mode they use <code className="font-mono text-fg-55 text-[0.8em]">THREE.AdditiveBlending</code>, so overlapping particles accumulate into luminous glowing pools; in light mode they lay pigment with normal blending, because added light vanishes against paper.
                    </p>
                    <p>
                        Two sources deposit a tangential silk-vortex swirl into a coarse <code className="font-mono text-fg-55 text-[0.8em]">64×40</code> wake field: an ambient Lissajous drift that never stops, and the pointer while one is present. One amplitude law covers cursor, touch and drift. Particles glide toward <code className="font-mono text-fg-55 text-[0.8em]">base + wake</code> with a first-order lag (worst-case gain 0.55), sampling at their rest position, so nothing overshoots or feeds back.
                    </p>
                    <p>
                        The 5,000-particle silhouette uses area-weighted generation (<code className="font-mono text-fg-55 text-[0.8em]">r = R·√u</code>) across four layered populations: disc haze, Fibonacci/Fermat spiral arms, sinuous filaments, and sparse cosmic dust. A per-particle <code className="font-mono text-fg-55 text-[0.8em]">aSize</code> attribute creates a 70/30 grain-to-node size split, placing large particles precisely on dense strand intersections for maximum additive glow.
                    </p>
                    <p>
                        The second field, under Contact, is the opposite in character: 8,000 particles that morph between a lightbulb, a rocket, a diamond, a bridge and a DNA helix. Rest the pointer on the shape, or hold a finger on it, and a tension ring charges; the shape shatters, falls under gravity, bounces off the floor and reforms into the next one, with a new word each time.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-fg-85">Hosting & Privacy</h2>
                    <p>
                        Hosted on <strong className="text-fg-80 font-medium">Vercel</strong>. There are no analytics, no cookies and no trackers, and every script, style and font is served from this domain; the <Link href="/privacy" className="link-in-text text-fg-80 underline underline-offset-4 decoration-line-20 hover:text-fg-50 transition-colors cursor-none">privacy page</Link> lists the two things the site writes to your browser. Every link opens in the same tab, so Back always brings you here.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-fg-85">Source</h2>
                    <p>
                        I believe in learning through shared code. If you’re curious about how specific components or animations were built, the <Link href="https://github.com/Akshay-Dongare/akshaydongare.com" className="link-in-text text-fg-80 underline underline-offset-4 decoration-line-20 hover:text-fg-50 transition-colors cursor-none">full source code</Link> for this website is on GitHub.
                    </p>

                </motion.div>

            </div>
        </div>
    );
}
