"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PackageStats } from "@/lib/downloads";

const buildProjects = (stats: PackageStats) => [
    {
        id: "proj-1",
        label: "LANGCHAIN-LITELLM",
        metric: "1M installs every month",
        desc: `Creator and lead maintainer of LangChain's official LiteLLM integration. A project I started on my own that now lives and ships inside the langchain-ai organization. One Python interface to 100+ model providers, plus router-backed load balancing, embeddings and OCR loading. ${stats.long} downloads to date, and around a million every month.`,
        theme: "from-[#1c2230] to-[#07090f]"
    },
    {
        id: "proj-2",
        label: "AIRBNB · AI PLATFORM",
        metric: "28 services, zero migrations",
        desc: "Contract engagement on the internal LLM gateway that roughly 28 services use to reach a model. It could not safely serve two providers in one process, because configuration lived in process-wide globals. I moved it to per-model registries resolved per request, so the concurrency guarantee is structural rather than something a lock defends. Shipped as a version bump, so not one consumer had to migrate. Test suite grew from 17 to 144.",
        theme: "from-[#3a6288] to-[#0d1117]"
    },
    {
        id: "proj-3",
        label: "ISO · COMPANION",
        metric: "Agentic graphs, official sources only",
        desc: "Applied AI engineer on Companion, the assistant the International Organization for Standardization builds for its own standards work. I designed the agentic graph patterns it runs on, which is what let it scale without maintenance cost scaling with it, and ran the comparative evaluation behind its web search layer so answers come from official ISO sources rather than the open web. Started the architecture documentation and refactored the legacy codebase while I was in there.",
        theme: "from-[#5b7fa6] to-[#1c2230]"
    }
];

export function WorkSection({ stats }: { stats: PackageStats }) {
    const PROJECTS = buildProjects(stats);
    const [activeId, setActiveId] = useState<string>("proj-1");

    return (
        <section
            className="relative w-full min-h-screen py-32 overflow-hidden"
            style={{ background: 'linear-gradient(to bottom, #f2efe9 0%, #e9e4da 42%, #c8d4e0 56%, #8fa8ba 66%, #507086 74%, #283848 82%, #131e2a 90%, #0d1117 100%)', marginBottom: '-1px' }}
        >
            {/* Dark theme sentinel for the bottom portion — shifts Navbar back to white text */}
            <div className="absolute bottom-0 left-0 w-full h-[32%] pointer-events-none" data-theme="dark" />

            <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20">

                {/* Top Header */}
                <motion.div
                    className="flex justify-end mb-24"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35 }}
                >
                    <h2 className="text-display-l text-[var(--color-charcoal)] max-w-[600px] text-right leading-[1.05]">
                        What I&apos;ve built, and what it holds up under
                    </h2>
                </motion.div>

                {/* Horizontal Accordion row */}
                <div className="flex flex-col md:flex-row gap-4 h-[500px] w-full items-stretch justify-center">
                    {PROJECTS.map((project) => {
                        const isActive = activeId === project.id;

                        return (
                            <motion.div
                                key={project.id}
                                layout
                                onClick={() => setActiveId(project.id)}
                                className={`relative rounded-xl overflow-hidden cursor-none flex-shrink-0 group ${isActive ? "w-full md:w-[45%]" : "w-full md:w-[25%] opacity-70 hover:opacity-100"
                                    }`}
                                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                            >
                                {/* Background gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-b ${project.theme}`} />

                                {!isActive && <div className="absolute inset-0 bg-[rgba(0,0,0,0.2)] backdrop-blur-sm" />}

                                <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                                    <div className="flex flex-col items-start gap-3">
                                        <div className="font-mono text-[0.65rem] tracking-widest text-white uppercase bg-[rgba(0,0,0,0.3)] backdrop-blur-md px-3 py-1.5 rounded-full self-start inline-flex items-center gap-2">
                                            {project.label}
                                            <span className="opacity-60">[ {isActive ? "-" : "+"} ]</span>
                                        </div>
                                        {/* Visible while collapsed, so the section heading is
                                            answered at a glance rather than behind a click. */}
                                        <span className="font-mono text-[0.7rem] text-white/75 tracking-[0.06em] bg-[rgba(0,0,0,0.3)] backdrop-blur-md px-3 py-1 rounded-full">
                                            {project.metric}
                                        </span>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {isActive && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 20 }}
                                                transition={{ duration: 0.4, delay: 0.08 }}
                                                className="bg-black/40 backdrop-blur-md p-6 rounded-lg max-w-[80%]"
                                            >
                                                <p className="text-[0.95rem] text-white/90 leading-relaxed font-sans">
                                                    {project.desc}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom Headline — sits on the dark portion of the gradient */}
                <motion.div
                    className="mt-32 w-full text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35 }}
                >
                    <h3 className="text-display-l text-white">
                        Open source you can read. Production work you can check.
                    </h3>
                </motion.div>

            </div>
        </section>
    );
}
