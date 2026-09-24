"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { PEPY_URL, type PackageStats } from "@/lib/downloads";

export function HeroSection({ stats }: { stats: PackageStats }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"],
    });

    // MotionConfig reducedMotion="user" covers animate/whileInView, but NOT a
    // MotionValue driven by scroll: that is a computed value, not an animation, so
    // Framer has nothing to opt out of. Collapsing the output range is the opt-out.
    const reduced = !!useReducedMotion();
    // Parallax effect moves the image slightly slower than scroll
    const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, 280]);
    // Subtle scale up on scroll
    const scale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [1, 1.04]);

    return (
        <section
            ref={containerRef}
            className="relative w-full min-h-svh overflow-hidden"
            style={{ background: 'var(--spine-hero)', marginBottom: '-1px' }}
            data-theme="dark"
        >
            {/* Static masked wrapper, anchored to the SECTION rather than to the thing that
                moves inside it. The depth layer below is opaque and covers the whole hero, so
                it — not the section — used to own the bottom edge, and its 135deg gradient
                cannot present a uniform edge: at the bottom it ran from roughly --blend-deep
                on the left to #0a0e15 on the right while ParticleSection opens flat on
                --blend-deep. Fading the last 12% hands the joint back to the section's own
                gradient, which ends on exactly the colour ParticleSection starts with.
                Only the bottom is masked: nothing sits above the hero to join. */}
            <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{
                    WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 88%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, #000 0%, #000 88%, transparent 100%)',
                }}
            >
                {/* Bled 340px past both edges against 280px of travel, plus the ~58px the
                    1.04 scale adds at the top from origin-bottom, so this layer's own edges
                    can never enter the wrapper. Before, it was inset-0 and slid down, which
                    dragged its top edge into the hero as a hard line across the full width. */}
                <motion.div
                    className="absolute inset-x-0 origin-bottom"
                    style={{ y, scale, top: '-340px', height: 'calc(100% + 680px)' }}
                >
                    {/* Micro-diagonal gradient for depth — imperceptible hue shift */}
                    <div className="absolute inset-0" style={{ background: 'var(--depth-hero)' }} />

                {/* The backdrop is a CSS gradient rather than a photograph, deliberately: it
                    costs no request and no layout shift. There used to be a second div here
                    meant to lay a vignette over it, but its radial-gradient was written into
                    className instead of style, so Tailwind emitted nothing and it rendered as
                    an empty box from the day it was written. Removed rather than switched on,
                        because the hero everyone has been looking at is the one without it. */}
                </motion.div>
            </div>

            {/* min-h, and the text block in flow: on a short phone the content grows the hero instead of sliding under the nav. */}
            <div className="relative w-full min-h-svh max-w-[1400px] mx-auto z-10 flex flex-col justify-end pt-24 pb-[clamp(2rem,5vw,4rem)] px-[clamp(1.5rem,5vw,3rem)]">

                {/* Bottom Left Text Block. Every reveal here runs on mount, not in view: Google renders
                    in a tall viewport where h-svh stretches, and the h1 never entered it. */}
                <motion.div
                    className="relative max-w-[640px]"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1], delay: 0.08 }}
                >
                    <div className="flex flex-col gap-1.5 mb-6">
                        <span className="text-[0.95rem] font-mono text-fg-90 tracking-[0.15em] uppercase">[ Akshay Dongare ]</span>
                        <span className="text-label text-lbl-70">{"->"} ai platform engineer . llm infrastructure</span>
                    </div>

                    <h1 className="text-display-xl text-fg-100 font-sans leading-[1.05] tracking-[-0.02em]">
                        I build the layer between your application and the model, and I make it hold.
                    </h1>

                    {/* The first screen carries what a recruiter scans for in seconds: who, for whom, when. */}
                    <dl className="mt-7 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 items-baseline">
                        <dt className="text-label text-lbl-60">AI systems for</dt>
                        <dd className="text-[1.0625rem] md:text-[1.1875rem] font-medium text-fg-90">Airbnb · ISO · Harvard</dd>
                        <dt className="text-label text-lbl-60">Creator of</dt>
                        <dd className="text-[1.0625rem] md:text-[1.1875rem] font-medium text-fg-90">
                            langchain-litellm,{" "}
                            <Link
                                href={PEPY_URL}
                                className="pointer-events-auto cursor-none hover:underline hover:underline-offset-4 hover:decoration-line-40"
                            >
                                {stats.long} downloads
                            </Link>
                        </dd>
                        <dt className="text-label text-lbl-60">Available</dt>
                        <dd className="text-[1.0625rem] md:text-[1.1875rem] font-medium text-fg-90">Full-time from 11 January 2027</dd>
                    </dl>

                    {/* Scroll cue. A full-viewport hero that ends on a clean edge reads as the
                        end of the page ("illusion of completeness"), so say there is more. */}
                    <motion.div
                        className="mt-8 flex items-center gap-3 [@media(max-height:700px)]:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.35, delay: 0.45 }}
                    >
                        <span className="text-label text-lbl-55">
                            Scroll
                        </span>
                        <motion.span
                            className="text-[0.7rem] font-mono text-fg-70 leading-none"
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
                    className="absolute bottom-[clamp(2rem,5vw,4rem)] right-[15%] hidden lg:flex flex-col gap-1 w-[200px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35, delay: 0.16 }}
                >
                    <span className="text-label text-lbl-60 leading-relaxed">
                        LLM GATEWAYS<br />
                        PROVIDER ROUTING<br />
                        AUTH &amp; CONCURRENCY
                    </span>
                </motion.div>


            </div>
        </section>
    );
}
