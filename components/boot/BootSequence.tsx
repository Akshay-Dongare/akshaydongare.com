"use client";

import React, { useEffect, useRef, useState } from "react";
import { TypedLine } from "@/components/ui/TypedLine";

const MIN_HOLD_MS = 900;
// Backstop only. The reveal fires two frames after hydration, so this should never
// be reached; it exists so a dropped frame cannot strand the mask on screen.
const SAFETY_TIMEOUT_MS = 1200;

// The lockup types itself like a terminal, timed from first paint at a pace a reader can follow: the name at 50ms a
// character, the rule drawn under it, then the role line at 20ms a character, done by about 2.1s. The panels open
// READ_MS after the role line finishes, so the whole of it stays up long enough to read.
const NAME = "[ AKSHAY DONGARE ]";
const ROLE = "-> ai platform engineer\u00a0· llm\u00a0infrastructure";
const NAME_START_MS = 150;
const NAME_END_MS = NAME_START_MS + NAME.length * 50;
const ROLE_START_MS = NAME_END_MS + 200;
const ROLE_MS = ROLE.length * 20;
const READ_MS = 500;
// Bounds the wait on the typing, in case its animation never reports finishing.
const TYPING_BACKSTOP_MS = 4000;

export function BootSequence({ children }: { children: React.ReactNode }) {
    const [maskMounted, setMaskMounted] = useState(true);
    const topRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lockupRef = useRef<HTMLDivElement>(null);
    const roleRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        // The pre-paint script in layout.tsx has already decided, and on a first visit has already marked the boot
        // as played, so its class is the answer here, not sessionStorage. Reading storage would see its own mark and
        // cut the boot off. If storage is blocked the script adds nothing and the boot plays, as it always did.
        // Two opaque panels sliding apart is large-area motion, a vestibular trigger under SC 2.3.3, so reduced
        // motion skips the reveal outright and the page renders as if it had finished.
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion || document.documentElement.classList.contains("skip-boot")) {
            // Deliberate: neither the class nor matchMedia exists during SSR, so this
            // can only be decided after mount. A one-shot skip, not a render loop.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMaskMounted(false);
            return;
        }

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
                // The typing runs in CSS from first paint, so its own animation is the clock: wait for the role
                // line to finish, then READ_MS more. MIN_HOLD is measured from mount, not from when gsap landed,
                // so a slow chunk eats into the hold rather than adding to it.
                const typed = roleRef.current?.getAnimations()[0]?.finished.catch(() => undefined);
                const backstop = new Promise((resolve) => setTimeout(resolve, TYPING_BACKSTOP_MS));
                Promise.race([typed ?? Promise.resolve(), backstop]).then(() => {
                    if (cancelled) return;
                    const remaining = Math.max(READ_MS, MIN_HOLD_MS - (performance.now() - start));
                    revealTimer = setTimeout(beginReveal, remaining);
                });
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
                        {/* CSS-driven from first paint rather than gsap, which loads after hydration and would leave
                            the lockup blank until it arrived. */}
                        <div className="flex flex-col items-center gap-4 px-6 text-center font-mono text-fg-100">
                            <TypedLine
                                chars={NAME.length}
                                startMs={NAME_START_MS}
                                durationMs={NAME_END_MS - NAME_START_MS}
                                caret="pass"
                                className="text-[0.85rem] tracking-[0.3em] uppercase"
                            >
                                {NAME}
                            </TypedLine>
                            <div
                                className="boot-rule h-px w-24 bg-line-25 origin-center"
                                style={{ "--rule-delay": `${NAME_END_MS}ms` } as React.CSSProperties}
                            />
                            <TypedLine
                                chars={ROLE.length}
                                startMs={ROLE_START_MS}
                                durationMs={ROLE_MS}
                                caret="rest"
                                textRef={roleRef}
                                className="text-[0.6rem] tracking-[0.1em] md:text-[0.7rem] md:tracking-[0.18em] text-fg-55"
                            >
                                {ROLE}
                            </TypedLine>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
