"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { ParticleField } from "@/components/particles/ParticleField";
import type { PackageStats } from "@/lib/downloads";

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
            className="relative w-full h-screen overflow-hidden"
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
                        {stats.monthlyLong} installs a month means someone else&apos;s production depends on your defaults.
                    </h2>
                </motion.div>
            </div>

            {shouldRenderParticles && (
                <ParticleField color="#8da3b5" />
            )}
        </section>
    );
}
