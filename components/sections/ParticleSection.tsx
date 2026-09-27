"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import dynamic from "next/dynamic";

// three.js + R3F is ~935KB parsed, kept out of the initial script set so the boot mask and LCP headline do not
// wait on it. ssr:false is safe: shouldRenderParticles gates the mount and stays false until the section is near.
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
            // A one-way latch on an IntersectionObserver, which has no SSR equivalent (AGENTS.md, Commands).
            // The canvas stays mounted for the visit, and the `active` prop pauses its render loop.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShouldRenderParticles(true);
        }
    }, [isInView]);

    return (
        <section
            ref={containerRef}
            // Same long-press problem as the contact canvas: a finger held on the field makes iOS select the headline
            // and raise the Copy / Search callout. Coarse pointers only, so the sentence stays selectable with a mouse.
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
                        className="text-display-xl text-fg-100 max-w-[800px]"
                        style={{ textShadow: 'var(--particle-halo)' }}
                    >
                        {/* The overlay is pointer-events-none so the mouse reaches the
                            particle field; the link has to opt back in explicitly. */}
                        <Link
                            href={PEPY_URL}
                            className="whitespace-nowrap pointer-events-auto cursor-none hover:underline hover:underline-offset-[10px] hover:decoration-line-40 transition-colors"
                        >
                            {stats.monthlyLong}
                        </Link> downloads a month means someone else’s production depends on your defaults.
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
