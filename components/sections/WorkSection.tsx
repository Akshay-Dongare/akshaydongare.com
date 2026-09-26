"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PEPY_URL, PYPI_URL, type PackageStats } from "@/lib/downloads";
import { GAMI_AWARD_POST, GAMI_SITE, LANGCHAIN_ORG, LINKEDIN_EXPERIENCE, LITELLM_REPO } from "@/lib/links";
import { ScrollCue } from "@/components/ui/ScrollCue";
import { OrgLogo } from "@/components/ui/OrgLogo";

// All four are open at once: a recruiter gives the page seconds, and a name behind a click
// is a name they never read. The full account of each lives on /work.
const buildProjects = (stats: PackageStats) => [
    {
        org: "Airbnb",
        slug: "airbnb",
        logo: "airbnb" as const,
        role: "AI Platform · contract",
        line: "Made the internal LLM gateway about 28 services use safe to serve two providers in one process. Shipped as a version bump, so no consumer had to migrate.",
        pills: [{ label: "28 services, zero migrations", href: LINKEDIN_EXPERIENCE, name: "28 services, zero migrations: the Airbnb role on LinkedIn" }],
    },
    {
        org: "LangChain",
        slug: "langchain-litellm",
        logo: "langchain" as const,
        role: (
            <>
                <Link href={LITELLM_REPO} className="relative z-10 underline underline-offset-4 decoration-line-20 hover:decoration-current transition-colors cursor-none">langchain-litellm</Link>
                {"\u00a0· creator and lead maintainer"}
            </>
        ),
        line: (
            <>
                LangChain&apos;s official LiteLLM integration: one Python interface to 140+ model providers, developed inside the <Link href={LANGCHAIN_ORG} className="relative z-10 underline underline-offset-4 decoration-line-20 hover:decoration-current transition-colors cursor-none">langchain-ai</Link> organization.
            </>
        ),
        pills: [
            { label: `${stats.compact} downloads`, href: PYPI_URL, name: `${stats.compact} downloads: langchain-litellm on PyPI` },
            { label: `${stats.monthlyCompact} a month`, href: PEPY_URL, name: `${stats.monthlyCompact} a month: the last 30 days on pepy.tech` },
        ],
    },
    {
        org: "ISO",
        slug: "iso",
        logo: "iso" as const,
        role: "Companion · applied AI engineer",
        line: "Designed the agentic graph patterns ISO's standards assistant runs on, and the evaluation that keeps its answers on official ISO sources.",
        pills: [{ label: "Grounded in ISO sources", href: LINKEDIN_EXPERIENCE, name: "Grounded in ISO sources: the ISO role on LinkedIn" }],
    },
    {
        org: "Harvard University",
        slug: "harvard",
        logo: "harvard" as const,
        role: (
            <>
                <Link href={GAMI_SITE} className="relative z-10 underline underline-offset-4 decoration-line-20 hover:decoration-current transition-colors cursor-none">Global Alliance for Medical Innovation</Link>
                {"\u00a0· lead developer"}
            </>
        ),
        line: "A WhatsApp assistant answering blood donation questions in Kenya, with query rewriting and guardrails for personal data and prompt injection.",
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {PROJECTS.map((project, i) => (
                        <motion.article
                            key={project.org}
                            className="surface-paper group relative rounded-[20px] md:rounded-3xl overflow-hidden border border-[var(--card-edge)] bg-[var(--card)] shadow-[var(--card-shadow)] hover:bg-[var(--card-hover-bg)] hover:border-[var(--card-hover-edge)] hover:shadow-none transition-[background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0,0,0.5,1)]"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.15) }}
                        >
                            <div className="relative h-full p-6 md:p-8 flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <OrgLogo org={project.logo} paper className="[--logo-s:1.75rem] md:[--logo-s:2rem]" />
                                        {/* The name's link stretches over the card through its ::after, so the whole card opens this
                                            entry on /work while the pills and inline links above it keep their own targets. */}
                                        <h3 className="text-[1.5rem] md:text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.01em] text-fg-100">
                                            <Link
                                                href={`/work#${project.slug}`}
                                                aria-label={`${project.org}, the full entry on the work page`}
                                                className="cursor-none outline-none after:absolute after:inset-0 after:rounded-[20px] md:after:rounded-3xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-current"
                                            >
                                                {project.org}
                                            </Link>
                                        </h3>
                                        <span aria-hidden="true" className="ml-auto hidden lg:inline-flex shrink-0 whitespace-nowrap items-baseline gap-2 font-mono text-fg-60 lg:opacity-0 lg:-translate-x-4 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 transition-all duration-300">
                                            <span className="text-label">WORK</span>
                                            <span className="text-xl">[ → ]</span>
                                        </span>
                                    </div>
                                    <p className="text-[0.9375rem] leading-snug text-fg-60">{project.role}</p>
                                </div>
                                <p className="text-body text-fg-90 max-w-[46ch]">{project.line}</p>
                                {/* Each claim is its own link to the evidence; the name keeps the visible words (SC 2.5.3). */}
                                <div className="mt-auto flex flex-wrap items-center gap-2">
                                    {project.pills.map((pill) => (
                                        <Link
                                            key={pill.label}
                                            href={pill.href}
                                            aria-label={pill.name}
                                            className="relative z-10 inline-flex items-center gap-2 cursor-none text-label text-lbl-100 bg-chip hover:bg-[var(--chip-hover)] shadow-[inset_0_0_0_1px_var(--chip-line)] hover:shadow-[inset_0_0_0_1px_var(--chip-line-hover)] transition-[background-color,box-shadow] duration-200 px-3 py-1.5 rounded-full"
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

                {/* Its own pill: the ground behind this spot shifts between breakpoints, so the pill carries its contrast. */}
                <div className="mt-6 flex justify-end">
                    <Link href="/work" className="group flex items-center gap-2 cursor-none text-label shadow-[inset_0_0_0_1px_var(--more-edge)] bg-[var(--more-bg)] text-[var(--more-ink)] hover:bg-[var(--more-bg-hover)] hover:text-[var(--more-ink-hover)] hover:shadow-[inset_0_0_0_1px_var(--more-hover-edge)] transition-[background-color,color,box-shadow] duration-300 px-4 py-2.5 rounded-full">
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
            <ScrollCue />
        </section>
    );
}
