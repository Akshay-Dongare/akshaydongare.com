"use client";

import React, { useEffect, useRef, useState } from "react";

// What the letters flicker through. Geist Mono draws every one at the same advance, so nothing beside them shifts.
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/";
// The last letter settles here; the others settle before it in reading order.
const DECODE_MS = 420;
// A new glyph about 22 times a second. Swapping every frame reads as noise rather than decoding.
const SWAP_MS = 45;

// Text that decodes when a mouse enters the link or button around it: each letter and digit flickers through
// random glyphs and settles back in reading order, while brackets and spaces hold still. The host's aria-label
// stays the accessible name, a tap is navigation rather than hover, and reduced motion leaves the text alone.
export function DecodeText({ text }: { text: string }) {
    const [shown, setShown] = useState(text);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const span = ref.current;
        const host = span?.closest("a, button") ?? span;
        if (!host) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        const slots = [...text].flatMap((ch, i) => (/[a-z0-9]/i.test(ch) ? [i] : []));
        let raf = 0;

        const play = (e: Event) => {
            // A decode already running finishes on its own; a second pointerenter does not restart it.
            if ((e as PointerEvent).pointerType !== "mouse" || reduced.matches || raf) return;
            const start = performance.now();
            let swapped = -Infinity;
            const tick = (now: number) => {
                const t = now - start;
                if (t >= DECODE_MS) {
                    raf = 0;
                    setShown(text);
                    return;
                }
                if (now - swapped >= SWAP_MS) {
                    swapped = now;
                    const chars = [...text];
                    slots.forEach((i, k) => {
                        if (t < (DECODE_MS * (k + 1)) / slots.length) chars[i] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                    });
                    setShown(chars.join(""));
                }
                raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
        };

        host.addEventListener("pointerenter", play);
        return () => {
            host.removeEventListener("pointerenter", play);
            cancelAnimationFrame(raf);
        };
    }, [text]);

    return <span ref={ref}>{shown}</span>;
}
