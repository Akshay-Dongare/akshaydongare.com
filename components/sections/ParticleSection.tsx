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

export function ParticleSection({ stats }: { stats: PackageStats }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: false, margin: "100px 0px 100px 0px" });
    const [shouldRenderParticles, setShouldRenderParticles] = useState(false);

    // Only render WebGL canvas when near viewport for performance
    useEffect(() => {
        if (isInView) {
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
            style={{ background: 'linear-gradient(to bottom, #0d1117 0%, #1c2230 25%, #2e4560 50%, #7da0c0 72%, #c8d4e0 100%)', marginBottom: '-1px' }}
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
                        className="text-display-xl text-white max-w-[800px] leading-[1.05]"
                        style={{ textShadow: '0 2px 24px rgba(7,9,15,0.5)' }}
                    >
                        {/* The overlay is pointer-events-none so the mouse reaches the
                            particle field; the link has to opt back in explicitly. */}
                        <Link
                            href={PEPY_URL}
                            className="pointer-events-auto cursor-none hover:underline hover:underline-offset-[10px] hover:decoration-white/40 transition-colors"
                        >
                            {stats.monthlyLong} installs
                        </Link>
                        {" "}a month means someone else&apos;s production depends on your defaults.
                    </h2>
                </motion.div>
            </div>

            {shouldRenderParticles && (
                <ParticleField color="#8da3b5" active={isInView} />
            )}
        </section>
    );
}
