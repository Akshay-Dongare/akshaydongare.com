"use client";

import { useSyncExternalStore } from "react";

// Whether the page has been scrolled at all on this visit. Heavy work below the fold waits for it, so a first load is
// not spent parsing three.js for a field nobody has scrolled to yet. A page that opens already scrolled, as on a
// reload, counts as scrolled.
let scrolled = false;

function subscribe(onChange: () => void) {
    if (scrolled) return () => {};
    const onScroll = () => {
        scrolled = true;
        onChange();
    };
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    return () => window.removeEventListener("scroll", onScroll);
}

function read() {
    if (window.scrollY > 0) scrolled = true;
    return scrolled;
}

export function useHasScrolled(): boolean {
    return useSyncExternalStore(subscribe, read, () => false);
}
