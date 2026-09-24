"use client";

import React from "react";
import { motion } from "framer-motion";

// Bottom-left of a homepage section, bobbing as one unit so it reads as a prompt; a click scrolls on.
// tone "paper" is for sections that end on a light ground in dark mode (Particle, About).
export function ScrollCue({ tone = "auto", gutter = "section" }: { tone?: "auto" | "paper"; gutter?: "section" | "hero" }) {
    const toNext = (e: React.MouseEvent<HTMLButtonElement>) => {
        const sections = Array.from(document.querySelectorAll("main section"));
        const here = e.currentTarget.closest("section");
        const next = sections[sections.indexOf(here as Element) + 1] ?? document.querySelector("footer");
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        next?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    };

    const pad = gutter === "hero" ? "px-[clamp(1.5rem,5vw,3rem)]" : "px-6 md:px-12 lg:px-20";
    const ink = tone === "paper" ? "text-on-paper/75 hover:text-on-paper" : "text-lbl-55 hover:text-lbl-90 light:hover:text-fg-100";

    return (
        <div className={`absolute inset-x-0 bottom-[clamp(1rem,3vw,2rem)] z-20 pointer-events-none`}>
            <div className={`max-w-[1400px] mx-auto ${pad}`}>
                <motion.button
                    type="button"
                    onClick={toNext}
                    aria-label="Scroll to the next section"
                    className={`pointer-events-auto flex items-center gap-3 py-2 cursor-none text-label transition-colors ${ink}`}
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                    <span>Scroll</span>
                    <span aria-hidden="true" className="leading-none">&#8595;</span>
                </motion.button>
            </div>
        </div>
    );
}
