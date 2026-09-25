"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import dynamic from "next/dynamic";

// three.js + R3F is ~935KB parsed. Statically imported, it sat in this route's initial
// script set, so the boot mask could not lift and the LCP headline could not paint until
// a quarter-megabyte of WebGL engine had downloaded and compiled, for a canvas nobody had
// scrolled to yet. ssr:false changes no behaviour: the mount is already gated behind
// shouldRenderParticles, which starts false and only flips once the section is near.
const ParticleField = dynamic(
    () => import("@/components/particles/ParticleField").then((m) => m.ParticleField),
    { ssr: false }
);
import Link from "next/link";
import { PEPY_URL, type PackageStats } from "@/lib/downloads";
import { useMode } from "@/lib/mode";
import { ScrollCue } from "@/components/ui/ScrollCue";

// Olive #7c8c4b on screen: the field's colour path darkens its input, so this is that colour pre-lightened.
const LIGHT_NEBULA = "#b9c494";
// Dark's additive light vanishes as its gradient pales from ~40% down; paper shows pigment
// everywhere, so light fades over that same band instead. Fitted to dark's measured profile.
const LIGHT_FADE: [number, number] = [-0.7, 0.3];

export function ParticleSection({ stats }: { stats: PackageStats }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: false, margin: "100px 0px 100px 0px" });
    const [shouldRenderParticles, setShouldRenderParticles] = useState(false);
    const light = useMode() === "light";

    // Only render WebGL canvas when near viewport for performance
    useEffect(() => {
        if (isInView) {
            // A one-way latch, not a render loop: it only ever goes false -> true, and the
            // value it depends on (an IntersectionObserver) has no SSR equivalent, so it
            // cannot be decided at render time. The canvas then stays mounted for the rest
            // of the visit and the `active` prop handles pausing the render loop.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShouldRenderParticles(true);
        }
    }, [isInView]);

    return (
        <section
            ref={containerRef}
            // Same long-press problem as the contact canvas: this section is an
            // interactive particle field, and holding a finger on it made iOS select
            // the headline and raise the Copy / Search callout. Scoped to coarse
            // pointers so the sentence stays selectable with a mouse.
            className="relative w-full h-svh overflow-hidden pointer-coarse:select-none [-webkit-touch-callout:none]"
            style={{ background: 'var(--spine-particle)', marginBottom: '-1px' }}
        >
            {/* Dark theme sentinel covers the top portion — keeps Navbar white text while dark bg is visible */}
            <div className="absolute top-0 left-0 w-full h-[55%] pointer-events-none" data-theme="dark" />
            {/* Light theme sentinel covers the bottom portion — shifts Navbar to charcoal text */}
            <div className="absolute bottom-0 left-0 w-full h-[45%] pointer-events-none" data-theme="light" />

            <div className="absolute inset-0 z-10 pointer-events-none p-6 md:p-12 lg:p-20 pt-[clamp(5rem,10vw,10rem)]">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                    className="max-w-[1400px] mx-auto w-full"
                >
                    <h2
                        className="text-display-xl text-fg-100 max-w-[800px] leading-[1.05]"
                        style={{ textShadow: 'var(--particle-halo)' }}
                    >
                        {/* The overlay is pointer-events-none so the mouse reaches the
                            particle field; the link has to opt back in explicitly. */}
                        <Link
                            href={PEPY_URL}
                            className="pointer-events-auto cursor-none hover:underline hover:underline-offset-[10px] hover:decoration-line-40 transition-colors"
                        >
                            {stats.monthlyLong}
                        </Link> installs a month means someone else&apos;s production depends on your defaults.
                    </h2>
                </motion.div>
            </div>

            {shouldRenderParticles && (
                <ParticleField color={light ? LIGHT_NEBULA : "#8da3b5"} blend={light ? "normal" : "add"} fade={light ? LIGHT_FADE : undefined} active={isInView} />
            )}
            <ScrollCue tone="paper" />
        </section>
    );
}
