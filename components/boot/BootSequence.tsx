"use client";

import React, { useEffect, useRef, useState } from "react";

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
        // Reading sessionStorage can throw (Safari private mode, blocked cookies), and only this effect removes
        // the mask, so a throw is a blank page. Failing to "not played" at worst replays the reveal.
        const hasPlayed = () => {
            try { return !!sessionStorage.getItem("bootPlayed"); } catch { return false; }
        };
        const markPlayed = () => {
            try { sessionStorage.setItem("bootPlayed", "true"); } catch { /* storage blocked; play it again */ }
        };

        // Two opaque panels sliding apart is large-area motion, a vestibular trigger under SC 2.3.3, so reduced
        // motion skips the reveal outright and the page renders as if it had finished.
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion || hasPlayed()) {
            // Deliberate: neither sessionStorage nor matchMedia exists during SSR, so this
            // can only be decided after mount. A one-shot skip, not a render loop.
            setMaskMounted(false);
            return;
        }
        markPlayed();

        const start = performance.now();
        let triggered = false;
        let cancelled = false;
        let raf1 = 0;
        let safety: ReturnType<typeof setTimeout> | undefined;
        let revealTimer: ReturnType<typeof setTimeout> | undefined;

        // Imported here, not statically: nothing else uses gsap, so its ~82KB loads only when the reveal plays.
        // Only this effect removes the opaque mask, so a failed import unmounts it rather than leave a black screen.
        (async () => {
            let gsap;
            try {
                gsap = (await import("gsap")).default;
            } catch {
                setMaskMounted(false);
                return;
            }
            if (cancelled) return;

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
                if (triggered || cancelled) return;
                triggered = true;
                clearTimeout(safety);
                // MIN_HOLD is measured from mount, not from when gsap landed, so a slow
                // chunk eats into the hold rather than adding to it.
                const remaining = Math.max(0, MIN_HOLD_MS - (performance.now() - start));
                revealTimer = setTimeout(beginReveal, remaining);
            };

            // Two frames after hydration is the first paint of real content, which is all the reveal waits on.
            // The safety timer only backstops a dropped frame.
            raf1 = requestAnimationFrame(() => requestAnimationFrame(trigger));
            safety = setTimeout(trigger, SAFETY_TIMEOUT_MS);
        })();

        return () => {
            cancelled = true;
            cancelAnimationFrame(raf1);
            clearTimeout(safety);
            clearTimeout(revealTimer);
        };
    }, []);

    return (
        <>
            {children}
            {/* The mask is in the server HTML, so without data-nosnippet Google can quote it as the snippet. */}
            {maskMounted && (
                <div
                    aria-hidden="true"
                    data-nosnippet
                    className="boot-mask fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
                >
                    <div
                        ref={topRef}
                        className="absolute inset-x-0 top-0 bg-[var(--boot-panel)]"
                        style={{ height: "calc(50% + 1px)", willChange: "transform" }}
                    />
                    <div
                        ref={bottomRef}
                        className="absolute inset-x-0 bottom-0 bg-[var(--boot-panel)]"
                        style={{ height: "calc(50% + 1px)", willChange: "transform" }}
                    />
                    <div
                        ref={lockupRef}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div
                            ref={brandRef}
                            className="flex flex-col items-center gap-4 px-6 text-center font-mono text-fg-100"
                            style={{ opacity: 0 }}
                        >
                            <span className="text-[0.85rem] tracking-[0.3em] uppercase">
                                [ AKSHAY DONGARE ]
                            </span>
                            <div
                                ref={ruleRef}
                                className="h-px w-24 bg-line-25 origin-center"
                                style={{ transform: "scaleX(0)" }}
                            />
                            <span className="text-[0.6rem] tracking-[0.1em] md:text-[0.7rem] md:tracking-[0.18em] text-fg-55 font-mono">
                                {"->"} ai platform engineer{"\u00a0·"} llm{"\u00a0"}infrastructure
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
