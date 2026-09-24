"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ScrollCue } from "@/components/ui/ScrollCue";

export function MissionSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"],
    });

    // MotionConfig reducedMotion="user" covers animate/whileInView, but NOT a
    // MotionValue driven by scroll: that is a computed value, not an animation, so
    // Framer has nothing to opt out of. Collapsing the output range is the opt-out.
    const reduced = !!useReducedMotion();
    const y = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["0%", "30%"]);

    return (
        <section
            ref={containerRef}
            className="relative w-full h-svh overflow-hidden"
            style={{ background: 'var(--spine-mission)', marginBottom: '-1px' }}
            data-theme="dark"
        >
            <motion.div
                className="absolute inset-0 w-full h-full"
                style={{ y }}
            >
                <div className="absolute inset-0 opacity-40" style={{ background: 'var(--depth-mission)' }} />
            </motion.div>

            <div className="relative w-full h-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 pt-[clamp(5rem,10vw,10rem)] pb-12 flex flex-col justify-between z-10">

                {/* Top block */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-10 md:gap-0 mt-12 md:mt-24">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.35 }}
                        className="w-full md:w-2/3 max-w-[800px]"
                    >
                        <h2 className="text-display-xl text-fg-100">
                            Most LLM systems don&apos;t fail at the model. They fail at the plumbing.
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: 0.08 }}
                        className="flex flex-col items-start md:items-end gap-2 text-left md:text-right"
                    >
                        {/* Shown, not behind a toggle: prose behind a click is prose nobody reads, and Google never sees it. */}
                        <span className="text-label text-lbl-55">APPROACH</span>
                        <p className="text-body text-fg-75 leading-relaxed text-left max-w-[360px]">
                            Provider routing, auth, retries, concurrency. The parts nobody demos are the parts that page you at 3am. That layer is what I work on, and I work on it in the open, because infrastructure this many teams depend on should be inspectable.
                        </p>
                    </motion.div>
                </div>

            </div>
            <ScrollCue />
        </section>
    );
}
