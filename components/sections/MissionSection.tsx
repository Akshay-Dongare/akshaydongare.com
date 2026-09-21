"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

export function MissionSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <section
            ref={containerRef}
            className="relative w-full h-svh overflow-hidden"
            style={{ background: 'linear-gradient(to bottom, #0d1117 0%, #07090f 100%)', marginBottom: '-1px' }}
            data-theme="dark"
        >
            <motion.div
                className="absolute inset-0 w-full h-full"
                style={{ y }}
            >
                <div className="absolute inset-0 opacity-40" style={{ background: 'linear-gradient(to bottom, #0d1117, #0a0e15, #07090f)' }} />
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
                        <h2 className="text-display-xl text-white">
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
                        <span className="text-label text-white/50">APPROACH</span>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="group flex flex-col items-start md:items-end cursor-none py-[0.875rem] -my-[0.875rem]"
                        >
                            <span className="text-label text-white/80 group-hover:text-white transition-colors flex items-center gap-2">
                                LEARN MORE <span className="text-white/50 group-hover:text-white transition-colors">[ {isExpanded ? "-" : "+"} ]</span>
                            </span>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden mt-4 text-left max-w-[300px]"
                                    >
                                        <p className="text-[0.85rem] text-white/70 font-sans leading-relaxed pt-2 border-t border-white/10">
                                            Provider routing, auth, retries, concurrency. The parts nobody demos are the parts that page you at 3am. That layer is what I work on, and I work on it in the open, because infrastructure this many teams depend on should be inspectable.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </motion.div>
                </div>

            </div>
        </section>
    );
}
