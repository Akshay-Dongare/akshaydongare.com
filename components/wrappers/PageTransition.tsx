"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { afterClientNavigation, focusWithoutScroll, notePageMount } from "@/lib/focus";

// The entrances that play from first paint (.enter in globals.css).
const ENTRANCES = new Set(["enter", "enter-fade"]);

// The wrapper the server HTML arrived with, taken before React renders anything. It is null after the first mount.
let serverPage: Element | null = typeof document === "undefined" ? null : document.querySelector("[data-page]");

// app/template.tsx remounts this on every navigation, so each page fades and slides in, and the old page simply leaves.
// An AnimatePresence exit here would never run, so there is none. The entrance is CSS, not Framer, so the prerendered
// page paints before the bundle has loaded and hydrated.
export default function PageTransition({ children }: { children: React.ReactNode }) {
    const page = useRef<HTMLDivElement>(null);
    const self = useRef({});
    useLayoutEffect(() => notePageMount(self.current), []);
    // When React abandons hydration and client-renders the root (see PrepaintGuard), every element is new and its
    // entrance would start again, so a page that had already faded in blinked out and back. Those finish at once.
    useLayoutEffect(() => {
        const server = serverPage;
        serverPage = null;
        if (!page.current || !server || server === page.current) return;
        for (const a of page.current.getAnimations({ subtree: true })) {
            if (a instanceof CSSAnimation && ENTRANCES.has(a.animationName)) a.finish();
        }
    }, []);
    // After a client navigation focus moves to the new page's h1, so the next Tab starts in its content. A page that
    // already placed focus, as /work does on the card it was sent to, keeps it; child effects run first.
    useEffect(() => {
        if (!afterClientNavigation() || page.current?.contains(document.activeElement)) return;
        focusWithoutScroll(page.current?.querySelector("h1") ?? null);
    }, []);
    // Chromium applies one more frame of a smooth scroll still running when an instant scroll lands, so a link pressed
    // while the page glides, as it does after Tab moves focus, opened the new page that frame's travel away from where
    // the router put it: up to 253px down from the top, or a /work card 942px off screen. The router scrolls in its own
    // layout effect, so a microtask reads its position, and the next frame puts the page back there. Passive effects can
    // run on either side of that frame; when they run first, they may move the target, as /work's pointer handoff does.
    const settle = useRef<{ y: number; frame: number } | null>(null);
    useLayoutEffect(() => {
        if (!afterClientNavigation()) return;
        queueMicrotask(() => {
            const s = { y: window.scrollY, frame: 0 };
            s.frame = requestAnimationFrame(() => {
                settle.current = null;
                if (window.scrollY !== s.y) window.scrollTo({ top: s.y, behavior: "instant" });
            });
            settle.current = s;
        });
        return () => {
            if (settle.current) cancelAnimationFrame(settle.current.frame);
            settle.current = null;
        };
    }, []);
    useEffect(() => {
        if (settle.current) settle.current.y = window.scrollY;
    }, []);
    return (
        <div ref={page} data-page className="enter [--enter-ms:300ms] w-full h-full min-h-screen">
            {children}
        </div>
    );
}
