"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const MIN_HOLD_MS = 900;
// Backstop only. The reveal fires two frames after hydration, so this should never
// be reached; it exists so a dropped frame cannot strand the mask on screen.
const SAFETY_TIMEOUT_MS = 1200;

export function BootSequence({ children }: { children: React.ReactNode }) {
    const [maskMounted, setMaskMounted] = useState(true);
    const topRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lockupRef = useRef<HTMLDivElement>(null);
    const brandRef = useRef<HTMLDivElement>(null);
    const ruleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Two opaque full-viewport panels sliding apart is large-area motion, the class
        // W3C's SC 2.3.3 intent text names as a vestibular trigger. Skip it outright
        // rather than shortening or cross-fading it — the reduced state is no animation
        // at all, with the page rendered as if the reveal had already finished.
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion || sessionStorage.getItem("bootPlayed")) {
            // Deliberate: neither sessionStorage nor matchMedia exists during SSR, so this
            // can only be decided after mount. A one-shot skip, not a render loop.
            // ContactSection.tsx disables the same rule for the same reason.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMaskMounted(false);
            return;
        }
        sessionStorage.setItem("bootPlayed", "true");

        const start = performance.now();
        let triggered = false;
        let safety: ReturnType<typeof setTimeout> | undefined;

        const brand = brandRef.current;
        const rule = ruleRef.current;
        if (brand) {
            gsap.fromTo(
                brand,
                { opacity: 0, letterSpacing: "0.5em" },
                { opacity: 1, letterSpacing: "0.3em", duration: 0.7, ease: "power2.out", delay: 0.05 }
            );
        }
        if (rule) {
            gsap.fromTo(
                rule,
                { scaleX: 0 },
                { scaleX: 1, duration: 0.65, ease: "power3.out", delay: 0.18 }
            );
        }

        const beginReveal = () => {
            const top = topRef.current;
            const bottom = bottomRef.current;
            const lockup = lockupRef.current;
            if (!top || !bottom || !lockup) {
                setMaskMounted(false);
                return;
            }

            const tl = gsap.timeline({
                onComplete: () => setMaskMounted(false),
            });

            tl.to(lockup, {
                opacity: 0,
                duration: 0.4,
                ease: "power2.in",
            });

            tl.to(
                [top, bottom],
                {
                    yPercent: (i: number) => (i === 0 ? -101 : 101),
                    duration: 1.1,
                    ease: "expo.inOut",
                },
                "-=0.18"
            );
        };

        const trigger = () => {
            if (triggered) return;
            triggered = true;
            if (safety) clearTimeout(safety);
            const remaining = Math.max(0, MIN_HOLD_MS - (performance.now() - start));
            window.setTimeout(beginReveal, remaining);
        };

        // Two frames after hydration is first paint of real content, which is all the
        // reveal actually waits on. The safety timer is now a backstop for a dropped
        // frame, not a resource budget.
        const raf1 = requestAnimationFrame(() => requestAnimationFrame(trigger));
        safety = setTimeout(trigger, SAFETY_TIMEOUT_MS);

        return () => {
            cancelAnimationFrame(raf1);
            if (safety) clearTimeout(safety);
        };
    }, []);

    return (
        <>
            {children}
            {maskMounted && (
                <div
                    aria-hidden="true"
                    className="boot-mask fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
                >
                    <div
                        ref={topRef}
                        className="absolute inset-x-0 top-0 bg-black"
                        style={{ height: "calc(50% + 1px)", willChange: "transform" }}
                    />
                    <div
                        ref={bottomRef}
                        className="absolute inset-x-0 bottom-0 bg-black"
                        style={{ height: "calc(50% + 1px)", willChange: "transform" }}
                    />
                    <div
                        ref={lockupRef}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div
                            ref={brandRef}
                            className="flex flex-col items-center gap-4 px-6 text-center font-mono text-white"
                            style={{ opacity: 0 }}
                        >
                            <span className="text-[0.85rem] tracking-[0.3em] uppercase">
                                [ AKSHAY DONGARE ]
                            </span>
                            <div
                                ref={ruleRef}
                                className="h-px w-24 bg-white/25 origin-center"
                                style={{ transform: "scaleX(0)" }}
                            />
                            <span className="text-[0.6rem] tracking-[0.1em] md:text-[0.7rem] md:tracking-[0.18em] text-white/55 font-mono">
                                {"->"} ai platform engineer . llm infrastructure
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
