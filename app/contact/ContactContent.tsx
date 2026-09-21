"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const LINKS = [
    { label: "contact@akshaydongare.com", href: "mailto:contact@akshaydongare.com" },
    { label: "GITHUB", href: "https://github.com/Akshay-Dongare" },
    { label: "LINKEDIN", href: "https://www.linkedin.com/in/akshay-dongare/" }
];

export function ContactContent() {
    return (
        <div
            className="masthead-glow w-full min-h-screen pt-32 pb-24 flex flex-col items-center justify-center"
            style={{ background: 'linear-gradient(to bottom, #0d1117 0%, #07090f 100%)' }}
            data-theme="dark"
        >
            <div className="w-full max-w-[1000px] px-6 md:px-12 lg:px-20">

                <motion.h1
                    className="text-display-xl tracking-tight text-white/90 mb-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    Let&apos;s talk.
                </motion.h1>

                <motion.p
                    className="text-body text-white/55 text-center max-w-[480px] mx-auto mb-20 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    I finish my Master’s at NC State in December 2026 and can start on 11 January 2027. AI platform, LLM infrastructure, or backend and platform engineering: full time preferred, contract worth hearing about, anywhere in the US, remote, hybrid or relocating. Authorized to work in the US on F-1 OPT through January 2030. If you’re building on this layer, open an issue, or send a note.
                </motion.p>

                <div className="flex flex-col w-full border-b border-white/[0.08]">
                    {LINKS.map((link, i) => (
                        <motion.div
                            key={link.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 + (i * 0.04), ease: [0.25, 0.1, 0.25, 1] }}
                        >
                            <Link
                                href={link.href}
                                className="group flex justify-between items-center gap-4 py-8 md:py-12 border-t border-white/[0.08] cursor-none"
                            >
                                <span className="text-display-m text-white/80 group-hover:text-white/50 transition-colors duration-300">
                                    {link.label}
                                </span>

                                <span className="hidden md:block shrink-0 whitespace-nowrap font-mono text-white/60 opacity-0 -translate-x-8 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-[400ms] cubic-bezier(0.25,0.1,0.25,1)">
                                    [ → ]
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    );
}
