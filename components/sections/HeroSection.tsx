"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { PEPY_URL, type PackageStats } from "@/lib/downloads";

export function HeroSection({ stats }: { stats: PackageStats }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"],
    });

    // Parallax effect moves the image slightly slower than scroll
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
    // Subtle scale up on scroll
    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.04]);

    return (
        <section
            ref={containerRef}
            className="relative w-full h-screen overflow-hidden"
            style={{ background: 'linear-gradient(to bottom, #07090f 0%, #0d1117 100%)', marginBottom: '-1px' }}
            data-theme="dark"
        >
            {/* Background Image Container */}
            <motion.div
                className="absolute inset-0 w-full h-full origin-bottom"
                style={{ y, scale }}
            >
                {/* Micro-diagonal gradient for depth — imperceptible hue shift */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #07090f 0%, #0d1117 55%, #0a0e15 100%)' }} />

                {/* We would use Next/Image here ideally, but using a pure CSS gradient/overlay representation 
            allows this to run locally without finding external assets.
            A real image would go here: <Image src="..." fill objectFit="cover" /> 
        */}
                <div className="absolute inset-0 radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)" />
            </motion.div>

            {/* Content Container */}
            <div className="relative w-full h-full max-w-[1400px] mx-auto z-10">

                {/* Bottom Left Text Block */}
                <motion.div
                    className="absolute bottom-[clamp(2rem,5vw,4rem)] left-[clamp(1.5rem,5vw,3rem)] max-w-[640px]"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1], delay: 0.08 }}
                >
                    <div className="flex flex-col gap-1 mb-8">
                        <span className="text-[0.62rem] font-mono text-white opacity-80 tracking-[0.15em] uppercase">[ Akshay Dongare ]</span>
                        <span className="text-[0.62rem] font-mono text-white opacity-80 tracking-[0.15em] uppercase">{"->"} ai platform engineer . llm infrastructure</span>
                    </div>

                    <h1 className="text-display-xl text-white font-sans leading-[1.05] tracking-[-0.02em]">
                        I build the layer between your application and the model, and I make it hold.
                    </h1>

                    {/* Scroll cue. A full-viewport hero that ends on a clean edge reads as the
                        end of the page ("illusion of completeness"), so say there is more. */}
                    <motion.div
                        className="mt-10 flex items-center gap-3"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: 0.45 }}
                    >
                        <span className="text-[0.62rem] font-mono text-white/55 tracking-[0.15em] uppercase">
                            Scroll
                        </span>
                        <motion.span
                            className="text-[0.7rem] font-mono text-white/70 leading-none"
                            animate={{ y: [0, 4, 0] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                            aria-hidden="true"
                        >
                            &#8595;
                        </motion.span>
                    </motion.div>
                </motion.div>

                {/* Floating Labels (Right side) */}
                <motion.div
                    className="absolute bottom-[clamp(2rem,5vw,4rem)] right-[15%] hidden md:flex flex-col gap-1 w-[200px]"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.16 }}
                >
                    <span className="text-[0.62rem] font-mono text-white opacity-60 tracking-[0.15em] uppercase leading-relaxed">
                        LLM GATEWAYS<br />
                        PROVIDER ROUTING<br />
                        AUTH &amp; CONCURRENCY
                    </span>
                </motion.div>

                <motion.div
                    className="absolute top-[60%] right-[30%] hidden lg:flex flex-col gap-1 w-[240px]"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.2 }}
                >
                    <Link
                        href={PEPY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[1.05rem] font-mono text-white/90 hover:text-white tracking-[0.04em] uppercase text-right leading-none mb-2 pointer-events-auto cursor-none transition-colors hover:underline hover:underline-offset-4 hover:decoration-white/40"
                    >
                        {stats.compact} downloads
                    </Link>
                    <span className="text-[0.62rem] font-mono text-white/60 tracking-[0.15em] uppercase leading-relaxed text-right">
                        <Link
                            href={PEPY_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pointer-events-auto cursor-none hover:text-white/90 transition-colors hover:underline hover:underline-offset-4 hover:decoration-white/40"
                        >
                            {stats.monthlyCompact}+ every month.
                        </Link>
                        <br />
                        MAINTAINED IN THE LANGCHAIN ORG.<br />
                        RUNNING IN PRODUCTION.
                    </span>
                </motion.div>

            </div>
        </section>
    );
}
