"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { m } from "framer-motion";
import { afterClientNavigation, focusWithoutScroll, notePageMount } from "@/lib/focus";

// app/template.tsx remounts this on every navigation, so each page fades and slides in from its initial state and
// the old page simply leaves. An AnimatePresence exit here would never run, so there is none.
export default function PageTransition({ children }: { children: React.ReactNode }) {
    const page = useRef<HTMLDivElement>(null);
    const self = useRef({});
    useLayoutEffect(() => notePageMount(self.current), []);
    // After a client navigation focus moves to the new page's h1, so the next Tab starts in its content. A page that
    // already placed focus, as /work does on the card it was sent to, keeps it; child effects run first.
    useEffect(() => {
        if (!afterClientNavigation() || page.current?.contains(document.activeElement)) return;
        focusWithoutScroll(page.current?.querySelector("h1") ?? null);
    }, []);
    return (
        <m.div
            ref={page}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full h-full min-h-screen"
        >
            {children}
        </m.div>
    );
}
