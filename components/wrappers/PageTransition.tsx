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
    return (
        <div ref={page} data-page className="enter [--enter-ms:300ms] w-full h-full min-h-screen">
            {children}
        </div>
    );
}
