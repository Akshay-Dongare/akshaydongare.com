"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const MIN_HOLD_MS = 900;
const SAFETY_TIMEOUT_MS = 4500;

export function BootSequence({ children }: { children: React.ReactNode }) {
    const [maskMounted, setMaskMounted] = useState(true);
    const topRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lockupRef = useRef<HTMLDivElement>(null);
    const brandRef = useRef<HTMLDivElement>(null);
    const ruleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (sessionStorage.getItem("bootPlayed")) {
            // Deliberate: sessionStorage does not exist during SSR, so whether the boot
            // animation already played this session can only be known after mount. This is a
            // one-shot skip, not a render loop. ContactSection.tsx disables the same rule.
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

        const onLoad = () => {
            requestAnimationFrame(() => requestAnimationFrame(trigger));
        };

        if (document.readyState === "complete") {
            onLoad();
        } else {
            window.addEventListener("load", onLoad, { once: true });
            safety = setTimeout(trigger, SAFETY_TIMEOUT_MS);
        }

        return () => {
            if (safety) clearTimeout(safety);
            window.removeEventListener("load", onLoad);
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
