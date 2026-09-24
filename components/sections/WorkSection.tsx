"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { PackageStats } from "@/lib/downloads";

// All four are open at once: a recruiter gives the page seconds, and a name behind a click
// is a name they never read. The full account of each lives on /work.
const buildProjects = (stats: PackageStats) => [
    {
        org: "Airbnb",
        role: "AI Platform · contract",
        line: "Made the internal LLM gateway about 28 services use safe to serve two providers in one process. Shipped as a version bump, so no consumer had to migrate.",
        metric: "28 services, zero migrations",
        theme: "from-[#3a6288] to-[#0d1117]",
    },
    {
        org: "LangChain",
        role: "langchain-litellm · creator and lead maintainer",
        line: "LangChain's official LiteLLM integration: one Python interface to 100+ model providers, developed inside the langchain-ai organization.",
        metric: `${stats.compact} downloads, ${stats.monthlyCompact} a month`,
        theme: "from-[#1c2230] to-[#07090f]",
    },
    {
        org: "ISO",
        role: "Companion · applied AI engineer",
        line: "Designed the agentic graph patterns ISO's standards assistant runs on, and the evaluation that keeps its answers on official ISO sources.",
        metric: "Official sources only",
        theme: "from-[#3f5d7e] to-[#1c2230]",
    },
    {
        org: "Harvard",
        role: "GAMI · lead developer",
        line: "A WhatsApp assistant answering blood donation questions in Kenya, with query rewriting and guardrails for personal data and prompt injection.",
        metric: "Best Presentation, Spring 2025",
        theme: "from-[#2e4560] to-[#0d1117]",
    },
];

export function WorkSection({ stats }: { stats: PackageStats }) {
    const PROJECTS = buildProjects(stats);

    return (
        <section
            className="relative w-full min-h-screen py-32 overflow-hidden"
            style={{ background: 'linear-gradient(to bottom, var(--blend-parchment) 0%, var(--blend-warm) 42%, var(--blend-mist) 56%, #8fa8ba 66%, #507086 74%, #283848 82%, #131e2a 90%, #101821 92.5%, #0e141b 95%, #0d1218 97.5%, var(--blend-deep) 100%)', marginBottom: '-1px' }}
        >
            {/* Dark theme sentinel for the bottom portion — shifts Navbar back to white text */}
            <div className="absolute bottom-0 left-0 w-full h-[32%] pointer-events-none" data-theme="dark" />

            <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20">

                <motion.div
                    className="flex justify-end mb-16 md:mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35 }}
                >
                    <h2 className="text-display-l text-[var(--color-charcoal)] max-w-[600px] text-right leading-[1.05]">
                        What I&apos;ve built, and what it holds up under
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PROJECTS.map((project, i) => (
                        <motion.article
                            key={project.org}
                            className="relative rounded-xl overflow-hidden"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.15) }}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-b ${project.theme}`} />
                            <div className="relative h-full p-6 md:p-8 flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-display-m text-white leading-none">{project.org}</h3>
                                    <p className="text-label text-white/80">{project.role}</p>
                                </div>
                                <p className="text-body text-white/90 max-w-[46ch]">{project.line}</p>
                                <p className="mt-auto self-start text-label text-white bg-black/30 px-3 py-1.5 rounded-full">
                                    {project.metric}
                                </p>
                            </div>
                        </motion.article>
                    ))}
                </div>

                {/* Its own dark pill: the gradient behind this spot is light on desktop and dark on a phone. */}
                <div className="mt-6 flex justify-end">
                    <Link href="/work" className="group flex items-center gap-2 cursor-none text-label text-white bg-[var(--blend-deep)] hover:bg-[var(--blend-surface)] transition-colors px-4 py-2.5 rounded-full">
                        <span>ALL WORK</span>
                        <span className="shrink-0 whitespace-nowrap">[ → ]</span>
                    </Link>
                </div>

                {/* Bottom Headline — sits on the dark portion of the gradient */}
                <motion.div
                    className="mt-32 w-full text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35 }}
                >
                    <p className="text-display-l text-white">
                        Open source you can read. Production work you can check.
                    </p>
                </motion.div>

            </div>
        </section>
    );
}
