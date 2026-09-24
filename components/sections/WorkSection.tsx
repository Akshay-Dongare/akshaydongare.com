"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PEPY_URL, type PackageStats } from "@/lib/downloads";
import { GAMI_AWARD_POST, LINKEDIN_EXPERIENCE } from "@/lib/links";

// All four are open at once: a recruiter gives the page seconds, and a name behind a click
// is a name they never read. The full account of each lives on /work.
const buildProjects = (stats: PackageStats) => [
    {
        org: "Airbnb",
        role: "AI Platform · contract",
        line: "Made the internal LLM gateway about 28 services use safe to serve two providers in one process. Shipped as a version bump, so no consumer had to migrate.",
        card: "var(--card-airbnb)",
        pills: [{ label: "28 services, zero migrations", href: LINKEDIN_EXPERIENCE, name: "28 services, zero migrations: the Airbnb role on LinkedIn" }],
    },
    {
        org: "LangChain",
        role: "langchain-litellm · creator and lead maintainer",
        line: "LangChain's official LiteLLM integration: one Python interface to 100+ model providers, developed inside the langchain-ai organization.",
        card: "var(--card-langchain)",
        pills: [
            { label: `${stats.compact} downloads`, href: PEPY_URL, name: `${stats.compact} downloads: all-time figures on pepy.tech` },
            { label: `${stats.monthlyCompact} a month`, href: PEPY_URL, name: `${stats.monthlyCompact} a month: the last 30 days on pepy.tech` },
        ],
    },
    {
        org: "ISO",
        role: "Companion · applied AI engineer",
        line: "Designed the agentic graph patterns ISO's standards assistant runs on, and the evaluation that keeps its answers on official ISO sources.",
        card: "var(--card-iso)",
        pills: [{ label: "Grounded in ISO sources", href: LINKEDIN_EXPERIENCE, name: "Grounded in ISO sources: the ISO role on LinkedIn" }],
    },
    {
        org: "Harvard",
        role: "GAMI · lead developer",
        line: "A WhatsApp assistant answering blood donation questions in Kenya, with query rewriting and guardrails for personal data and prompt injection.",
        card: "var(--card-harvard)",
        pills: [{ label: "Best Presentation, 2025", href: GAMI_AWARD_POST, name: "Best Presentation, 2025: the award post on LinkedIn" }],
    },
];

export function WorkSection({ stats }: { stats: PackageStats }) {
    const PROJECTS = buildProjects(stats);

    return (
        <section
            className="relative w-full min-h-screen py-32 overflow-hidden"
            style={{ background: 'var(--spine-work)', marginBottom: '-1px' }}
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
                    <h2 className="text-display-l text-on-paper max-w-[600px] text-right leading-[1.05]">
                        What I&apos;ve built, and what it holds up under
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PROJECTS.map((project, i) => (
                        <motion.article
                            key={project.org}
                            className="relative rounded-xl overflow-hidden shadow-[var(--card-shadow)]"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.15) }}
                        >
                            <div className="absolute inset-0" style={{ background: project.card }} />
                            <div className="relative h-full p-6 md:p-8 flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-display-m text-fg-100 leading-none">{project.org}</h3>
                                    <p className="text-label text-lbl-80">{project.role}</p>
                                </div>
                                <p className="text-body text-fg-90 max-w-[46ch]">{project.line}</p>
                                {/* Each claim is its own link to the evidence; the name keeps the visible words (SC 2.5.3). */}
                                <div className="mt-auto flex flex-wrap items-center gap-2">
                                    {project.pills.map((pill) => (
                                        <Link
                                            key={pill.label}
                                            href={pill.href}
                                            aria-label={pill.name}
                                            className="inline-flex items-center gap-2 cursor-none text-label text-lbl-100 bg-chip hover:bg-[var(--chip-hover)] shadow-[inset_0_0_0_1px_var(--chip-line)] hover:shadow-[inset_0_0_0_1px_var(--chip-line-hover)] transition-[background-color,box-shadow] duration-200 px-3 py-1.5 rounded-full"
                                        >
                                            {/* A no-break space keeps the arrow on the last word when a long pill wraps on a phone. */}
                                            <span>{pill.label}{"\u00a0→"}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>

                {/* Its own dark pill: the gradient behind this spot is light on desktop and dark on a phone. */}
                <div className="mt-6 flex justify-end">
                    <Link href="/work" className="group flex items-center gap-2 cursor-none text-label shadow-[inset_0_0_0_1.5px_var(--more-line)] bg-[var(--more-bg)] text-[var(--more-ink)] hover:bg-[var(--more-bg-hover)] hover:text-[var(--more-ink-hover)] transition-colors px-4 py-2.5 rounded-full">
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
                    <p className="text-display-l text-fg-100">
                        Open source you can read. Production work you can check.
                    </p>
                </motion.div>

            </div>
        </section>
    );
}
