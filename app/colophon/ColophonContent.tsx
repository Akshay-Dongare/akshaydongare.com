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
                    className="max-w-none text-body text-fg-65 leading-relaxed space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    <p>
                        This website was designed and developed from scratch. It serves as both a portfolio and an ongoing experiment in frontend engineering, interaction design, and systems thinking.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-fg-85">Architecture</h2>
                    <p>
                        Built on <strong className="text-fg-80 font-medium">Next.js</strong> with the App Router. Every route is statically prerendered at build time, but most of the interface is client-rendered rather than server-rendered: the cursor, the scroll choreography and both particle fields all need the browser to exist.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-fg-85">Design & Styling</h2>
                    <p>
                        The interface is built using a hybrid approach of <strong className="text-fg-80 font-medium">Vanilla CSS</strong> via custom variables and strict utility classes from <strong className="text-fg-80 font-medium">Tailwind CSS</strong>. This allows for rigorous control over design tokens while retaining the speed of utility composition.
                    </p>
                    <p>
                        Typography is set entirely in <strong className="text-fg-80 font-medium">Geist Sans</strong> and <strong className="text-fg-80 font-medium">Geist Mono</strong>, an excellent typeface family engineered for high-density interfaces and code by Vercel.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-fg-85">Interactions</h2>
                    <p>
                        Fluid animations are powered by <strong className="text-fg-80 font-medium">Framer Motion</strong>. The cursor is a hyper-minimal 5px dot. In dark mode it uses <code className="font-mono text-fg-55 text-[0.8em]">mix-blend-mode: difference</code>, which inverts against any background; in light mode it is a solid ink dot with a paper halo, because difference drops out over the particle pigment. Position tracking uses raw DOM events mixed with React context at 60fps; the dot scales to 8px on hover via a 150ms spring.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-fg-85">WebGL & Physics</h2>
                    <p>
                        The two interactive particle fields are built on <strong className="text-fg-80 font-medium">React Three Fiber</strong> and <strong className="text-fg-80 font-medium">Three.js</strong>. Both use custom GLSL <strong className="text-fg-80 font-medium">ShaderMaterial</strong>s with a Gaussian falloff fragment (<code className="font-mono text-fg-55 text-[0.8em]">exp(−d²×9)</code>). In dark mode they use <code className="font-mono text-fg-55 text-[0.8em]">THREE.AdditiveBlending</code>, so overlapping particles accumulate into luminous glowing pools; in light mode they lay pigment with normal blending, because added light vanishes against paper.
                    </p>
                    <p>
                        Particle kinematics use an under-damped spring (<code className="font-mono text-fg-55 text-[0.8em]">stiffness=0.028, damping=0.91</code>, ratio≈0.27) for organic overshoot and ring-down wobble. Mouse interaction applies a tangential force perpendicular to the particle→cursor vector, scaled by cursor velocity: a silk-vortex swirl rather than a rigid repulsion void.
                    </p>
                    <p>
                        The 5,000-particle silhouette uses area-weighted generation (<code className="font-mono text-fg-55 text-[0.8em]">r = R·√u</code>) across four layered populations: disc haze, Fibonacci/Fermat spiral arms, sinuous filaments, and sparse cosmic dust. A per-particle <code className="font-mono text-fg-55 text-[0.8em]">aSize</code> attribute creates a 70/30 grain-to-node size split, placing large particles precisely on dense strand intersections for maximum additive glow.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-fg-85">Source</h2>
                    <p>
                        I believe in learning through shared code. If you&apos;re curious about how specific components or animations were built, the full source code for this website is <Link href="https://github.com/Akshay-Dongare/akshaydongare.com" className="text-fg-80 underline underline-offset-4 decoration-line-20 hover:text-fg-50 transition-colors cursor-none">on GitHub</Link>.
                    </p>

                </motion.div>

            </div>
        </div>
    );
}
