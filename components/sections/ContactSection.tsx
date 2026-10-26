"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMode } from "@/lib/mode";
import { useHasScrolled } from "@/lib/scrolled";

// Terracotta #a8532b on screen: the field's colour path darkens its input, so this is that colour pre-lightened.
const LIGHT_CLIMAX = "#d49b72";

// three.js + R3F is ~935KB parsed, kept out of the initial script set so the boot mask and LCP headline do not
// wait on it. ssr:false is safe: shouldRenderParticles gates the mount and stays false until the section is near.
const MorphingParticleField = dynamic(
    () => import("@/components/particles/MorphingParticleField").then((m) => m.MorphingParticleField),
    { ssr: false }
);

export function ContactSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: false, margin: "100px 0px 100px 0px" });
    const [shouldRenderParticles, setShouldRenderParticles] = useState(false);
    // three.js is mounted once the reader scrolls toward the field, not merely because it sits near the fold, where the
    // particle section does at load: there it was fetched, parsed and given a GL context in the middle of hydration.
    // No field can be on screen at load, since the hero above them fills the viewport.
    const scrolled = useHasScrolled();
    const light = useMode() === "light";

    useEffect(() => {
        if (isInView && scrolled) {
            // A one-way latch on an IntersectionObserver, which has no SSR equivalent (AGENTS.md, Commands).
            // The canvas stays mounted for the visit, and the `active` prop pauses its render loop.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShouldRenderParticles(true);
        }
    }, [isInView, scrolled]);

    return (
        <section
            ref={containerRef}
            // Press-and-hold is the interaction (1.1s on touch), which iOS reads as selecting the CONNECT label and
            // raising the Copy / Search callout mid-charge. Both are off for this section only.
            className="relative w-full h-svh overflow-hidden pointer-coarse:select-none [-webkit-touch-callout:none]"
            style={{ background: 'var(--spine-contact)' }}
            data-theme="dark"
            // An inverted cursor dot vanishes over the light pigment, so CursorProvider draws it solid here.
            data-cursor="solid"
        >
            <div className="absolute inset-0 z-10 p-6 md:p-12 lg:p-20 pt-[clamp(5rem,10vw,10rem)] pb-12 flex flex-col justify-between pointer-events-none">

                {/* Top Area */}
                <div className="relative w-full max-w-[1400px] mx-auto flex flex-col gap-8 lg:gap-0 lg:flex-row lg:justify-between lg:items-start">

                    <motion.h2
                        className="text-display-xl text-fg-100 max-w-[800px]"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.35 }}
                    >
                        Tell me what you’re building.
                    </motion.h2>

                    <div className="flex flex-col items-start lg:items-end gap-1 pointer-events-auto">
                        <Link
                            href="/contact"
                            className="group flex items-center gap-2 cursor-none text-label text-fg-100 min-h-[44px] py-3"
                        >
                            <span className="opacity-80 light:opacity-100 group-hover:opacity-100 transition-opacity">CONNECT</span>
                            <span aria-hidden="true" className="shrink-0 whitespace-nowrap opacity-60 light:opacity-100 group-hover:opacity-100 transition-opacity">[ → ]</span>
                        </Link>

                    </div>
                </div>
            </div>

            {shouldRenderParticles && (
                <MorphingParticleField color={light ? LIGHT_CLIMAX : "#ffffff"} className="opacity-70 dark:mix-blend-plus-lighter" active={isInView} />
            )}
        </section>
    );
}

