"use client";

import { useLayoutEffect } from "react";
import { applyMode } from "@/lib/mode";
import { readPrepaint } from "@/lib/prepaint";

// Puts back what the pre-paint scripts set on <html> if React wiped it. When hydration is abandoned, React
// client-renders the root and, taking over <html>, removes every attribute and re-applies only its own props: light
// mode, no skip-boot. A layout effect runs after that commit and before paint, so a client-rendered load paints exactly
// as a hydrated one would. It is the first child of <body>, so its effect runs before any in the app tree.
export function PrepaintGuard() {
    useLayoutEffect(() => {
        const prepaint = readPrepaint();
        if (!prepaint) return;
        const root = document.documentElement;
        if (prepaint.mode && (root.dataset.mode !== prepaint.mode || root.style.colorScheme !== prepaint.mode)) {
            applyMode(prepaint.mode);
        }
        if (prepaint.skipBoot) root.classList.add("skip-boot");
    }, []);
    return null;
}
