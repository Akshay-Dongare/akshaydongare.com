"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMode } from "@/lib/mode";
import { ScrollCue } from "@/components/ui/ScrollCue";

// Terracotta #a8532b on screen: the field's colour path darkens its input, so this is that colour pre-lightened.
const LIGHT_CLIMAX = "#d49b72";

// three.js + R3F is ~935KB parsed. Statically imported, it sat in this route's initial
// script set, so the boot mask could not lift and the LCP headline could not paint until
// a quarter-megabyte of WebGL engine had downloaded and compiled, for a canvas nobody had
// scrolled to yet. ssr:false changes no behaviour: the mount is already gated behind
// shouldRenderParticles, which starts false and only flips once the section is near.
const MorphingParticleField = dynamic(
    () => import("@/components/particles/MorphingParticleField").then((m) => m.MorphingParticleField),
    { ssr: false }
);

export function ContactSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: false, margin: "100px 0px 100px 0px" });
    const [shouldRenderParticles, setShouldRenderParticles] = useState(false);
    const light = useMode() === "light";

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
            // A press-and-hold IS the interaction here (1.1s on touch), which is exactly
            // the gesture iOS reads as "select text" — it was grabbing the CONNECT
            // label and raising the Copy / Search callout mid-charge. Suppress both
            // for this section only; the rest of the site stays selectable.
            className="relative w-full h-svh overflow-hidden pointer-coarse:select-none [-webkit-touch-callout:none]"
            style={{ background: 'var(--spine-contact)' }}
            data-theme="dark"
        >
            <div className="absolute inset-0 z-10 p-6 md:p-12 lg:p-20 pt-[clamp(5rem,10vw,10rem)] pb-12 flex flex-col justify-between pointer-events-none">

                {/* Top Area */}
                <div className="relative w-full max-w-[1400px] mx-auto flex flex-col gap-8 lg:gap-0 lg:flex-row lg:justify-between lg:items-start">

                    <motion.h2
                        className="text-display-xl text-fg-100 max-w-[800px] leading-[1.05]"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.35 }}
                    >
                        Tell me what you&apos;re building.
                    </motion.h2>

                    <div className="flex flex-col items-start lg:items-end gap-1 pointer-events-auto">
                        <Link
                            href="/contact"
                            className="group flex items-center gap-2 cursor-none text-label text-fg-100 min-h-[44px] py-3"
                        >
                            <span className="opacity-80 light:opacity-100 group-hover:opacity-100 transition-opacity">CONNECT</span>
                            <span className="shrink-0 whitespace-nowrap opacity-60 light:opacity-100 group-hover:opacity-100 transition-opacity">[ → ]</span>
                        </Link>

                    </div>
                </div>
            </div>

            {shouldRenderParticles && (
                <MorphingParticleField color={light ? LIGHT_CLIMAX : "#ffffff"} className="opacity-70 dark:mix-blend-plus-lighter" active={isInView} />
            )}
            <ScrollCue />
        </section>
    );
}

