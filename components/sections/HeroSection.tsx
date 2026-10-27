"use client";

import React, { useRef } from "react";
import { m, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { PYPI_URL, type PackageStats } from "@/lib/downloads";
import { ScrollCue } from "@/components/ui/ScrollCue";
import { TypedLine } from "@/components/ui/TypedLine";

// The name and role type themselves in at the boot screen's pace (BootSequence.tsx): 50ms a character for the name,
// 20ms for the role, starting as the block fades in. The role is two segments, split where it wraps on a phone, that
// type in turn. On a first visit this all runs under the boot mask, so the hero is already typed when it opens.
const NAME_START_MS = 300;
const NAME_MS = 18 * 50;
const ROLE_A_START_MS = NAME_START_MS + NAME_MS + 150;
const ROLE_A_MS = 25 * 20;
const ROLE_B_MS = 18 * 20;

export function HeroSection({ stats }: { stats: PackageStats }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"],
    });

    // MotionConfig reducedMotion="user" does not reach a MotionValue driven by scroll, which is computed,
    // not animated, so collapsing the output range is the opt-out.
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
            {/* Masked at the section, not the moving layer: the opaque 135deg depth layer has no uniform bottom
                edge, so its last 12% fades to the section's gradient, which ends on ParticleSection's first colour. */}
            <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{
                    WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 88%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, #000 0%, #000 88%, transparent 100%)',
                }}
            >
                {/* Bled 340px past both edges against 280px of travel plus ~58px from the 1.04 scale at the top, so
                    this layer's own edges never enter the wrapper and draw a line across the hero. */}
                <m.div
                    className="absolute inset-x-0 origin-bottom"
                    style={{ y, scale, top: '-340px', height: 'calc(100% + 680px)' }}
                >
                    {/* Micro-diagonal gradient for depth — imperceptible hue shift */}
                    <div className="absolute inset-0" style={{ background: 'var(--depth-hero)' }} />

                {/* The backdrop is a CSS gradient rather than a photograph on purpose: no request, no layout shift.
                    It has no vignette over it by choice, since the approved hero is the one without. */}
                </m.div>
            </div>

            {/* min-h, and the text block in flow: on a short phone the content grows the hero instead of sliding under the nav. */}
            <div className="relative w-full min-h-svh max-w-[1400px] mx-auto z-10 flex flex-col pt-[clamp(5.5rem,14svh,7rem)] pb-[clamp(4.5rem,8vw,6rem)] px-[clamp(1.5rem,5vw,3rem)]">

                {/* Em measure holds three lines; the height cap shrinks it on short screens. AGENTS.md, Hero layout.
                    Reveals run on mount, not in view: Google renders in a tall viewport where h-svh stretches. They are CSS
                    (.enter in globals.css), so the first screen paints before the bundle has loaded and hydrated. */}
                <div className="enter [--enter-y:30px] my-auto" style={{ animationDelay: "80ms" }}>
                    <div className="flex flex-col gap-1.5 mb-6">
                        {/* self-start: a stretched flex item would set the clip's 100% to the column, not the text. */}
                        <TypedLine
                            chars={18}
                            startMs={NAME_START_MS}
                            durationMs={NAME_MS}
                            caret="pass"
                            className="self-start text-[0.95rem] font-mono text-fg-90 tracking-[0.15em] uppercase"
                        >
                            [ Akshay Dongare ]
                        </TypedLine>
                        <span className="self-start text-label text-lbl-70">
                            <TypedLine chars={25} startMs={ROLE_A_START_MS} durationMs={ROLE_A_MS} caret="type">
                                <span aria-hidden="true">{"->"}</span> ai platform engineer{"\u00a0·"}
                            </TypedLine>{" "}
                            <TypedLine chars={18} startMs={ROLE_A_START_MS + ROLE_A_MS} durationMs={ROLE_B_MS} caret="type">
                                llm{"\u00a0"}infrastructure
                            </TypedLine>
                        </span>
                    </div>

                    <h1 className="text-display-xl text-fg-100 font-sans max-w-[14em]" style={{ fontSize: "clamp(min(2.8rem, 6.5svh), min(6vw, 9.5svh), 5.5rem)" }}>
                        I build the layer between your application and the model, and I{"\u00a0"}make it hold.
                    </h1>
                </div>

                {/* What a recruiter scans for in seconds, who, for whom and when, gets a row of its own at the foot,
                    set off from the claim by a hairline, with the keywords at its far end. */}
                <div
                    className="enter mt-[clamp(1.5rem,6svh,3rem)] pt-6 border-t border-line-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
                    style={{ animationDelay: "160ms" }}
                >
                    <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 items-baseline">
                        <dt className="text-label text-lbl-60">AI systems for</dt>
                        <dd className="text-[1.0625rem] md:text-[1.1875rem] font-medium text-fg-90">Airbnb · ISO · Harvard{"\u00a0"}University</dd>
                        <dt className="text-label text-lbl-60">Creator of</dt>
                        <dd className="text-[1.0625rem] md:text-[1.1875rem] font-medium text-fg-90">
                            langchain-litellm, {stats.floor.total && "over "}<Link
                                href={PYPI_URL}
                                className="min-[375px]:whitespace-nowrap pointer-events-auto cursor-none hover:underline hover:underline-offset-4 hover:decoration-line-40"
                            >
                                {stats.long}
                            </Link> downloads
                        </dd>
                        <dt className="text-label text-lbl-60">Available</dt>
                        <dd className="text-[1.0625rem] md:text-[1.1875rem] font-medium text-fg-90">Full-time from 11{"\u00a0"}January{"\u00a0"}2027</dd>
                    </dl>

                    <p className="hidden lg:block text-label text-lbl-60 leading-relaxed text-right">
                        LLM gateways<br />
                        Provider routing<br />
                        Auth &amp; concurrency
                    </p>
                </div>
            </div>
            <ScrollCue />
        </section>
    );
}
