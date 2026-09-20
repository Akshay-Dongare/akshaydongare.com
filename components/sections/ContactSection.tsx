"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { MorphingParticleField } from "@/components/particles/MorphingParticleField";

export function ContactSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: false, margin: "100px 0px 100px 0px" });
    const [shouldRenderParticles, setShouldRenderParticles] = useState(false);

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
            style={{ background: 'linear-gradient(to bottom, #07090f 0%, #0d1117 18%, #0e1928 42%, #0c1520 68%, #0d1117 100%)' }}
            data-theme="dark"
        >
            <div className="absolute inset-0 z-10 p-6 md:p-12 lg:p-20 pt-[clamp(5rem,10vw,10rem)] pb-12 flex flex-col justify-between pointer-events-none">

                {/* Top Area */}
                <div className="relative w-full max-w-[1400px] mx-auto flex justify-between items-start">

                    <motion.h2
                        className="text-display-xl text-white max-w-[800px] leading-[1.05]"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.35 }}
                    >
                        Tell me what you&apos;re building.
                    </motion.h2>

                    <div className="hidden lg:flex flex-col items-end gap-1 pointer-events-auto">
                        <Link
                            href="/contact"
                            className="group flex items-center gap-2 cursor-none text-label text-white"
                        >
                            <span className="opacity-80 group-hover:opacity-100 transition-opacity">CONNECT</span>
                            <span className="opacity-60 group-hover:opacity-100 transition-opacity">[ → ]</span>
                        </Link>

                    </div>
                </div>
            </div>

            {shouldRenderParticles && (
                <MorphingParticleField color="#ffffff" className="opacity-70 mix-blend-plus-lighter" />
            )}
        </section>
    );
}

