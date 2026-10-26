"use client";

import { useSyncExternalStore } from "react";

export type Mode = "light" | "dark";

export const MODE_KEY = "mode";
export const THEME_COLOR: Record<Mode, string> = { light: "#faf6ee", dark: "#07090f" };
const DARK_QUERY = "(prefers-color-scheme: dark)";

// The attribute on <html> is the single source of truth: CSS reads it, and so does this.
function read(): Mode {
    return document.documentElement.dataset.mode === "dark" ? "dark" : "light";
}

// The switch's choice for this visit, or null until the visitor makes one; a new visit starts from the system.
function stored(): Mode | null {
    try {
        const value = sessionStorage.getItem(MODE_KEY);
        return value === "dark" || value === "light" ? value : null;
    } catch {
        return null;
    }
}

function system(): Mode {
    return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
    // Each tab is its own visit, so there is no cross-tab sync. Until the visitor picks a mode the page follows the system, including a switch at sunset.
    const media = window.matchMedia(DARK_QUERY);
    const onSystem = () => {
        if (!stored()) applyMode(system());
    };
    media.addEventListener("change", onSystem);
    return () => {
        observer.disconnect();
        media.removeEventListener("change", onSystem);
    };
}

// The server always renders light; this visit's or the system's dark is applied before paint.
export function useMode(): Mode {
    return useSyncExternalStore(subscribe, read, () => "light");
}

// React hydrates <meta> by content, so after the pre-paint script it appends a second one: set them all.
function setThemeColor(mode: Mode) {
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", THEME_COLOR[mode]));
}

// Reads the attribute, never the hook: during hydration the hook reports the server's "light".
export function syncThemeColor() {
    setThemeColor(read());
}

// Also updates the pre-paint record, so if React ever wipes <html> again, PrepaintGuard restores this choice, not the first paint's.
export function applyMode(mode: Mode) {
    const root = document.documentElement;
    if (window.__prepaint) window.__prepaint.mode = mode;
    root.dataset.mode = mode;
    root.style.colorScheme = mode;
    setThemeColor(mode);
}

export function setMode(mode: Mode) {
    applyMode(mode);
    try { sessionStorage.setItem(MODE_KEY, mode); } catch { /* storage blocked; the choice lasts this page only */ }
}

// The switch in progress. Only it may end the switch: a key press during one skips it, and the skipped one's end
// would otherwise strip mode-switching from the next, dropping it into the browser's cross-fade mid-reveal.
let switching: ViewTransition | null = null;

// The switch opens the new mode as a circle growing from its knob over a still snapshot of the old one, through
// the View Transitions API; the circle itself is mode-reveal in globals.css. Without the API, or under reduced
// motion, the mode simply changes.
export function revealMode(mode: Mode, origin: Element) {
    if (!("startViewTransition" in document) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setMode(mode);
        return;
    }
    const r = origin.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const root = document.documentElement;
    root.style.setProperty("--reveal-x", `${x}px`);
    root.style.setProperty("--reveal-y", `${y}px`);
    // Out to the farthest corner, so the circle ends with the whole viewport open.
    root.style.setProperty("--reveal-r", `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);
    // Scopes the snapshot styles in globals.css to this switch, and stops colour transitions replaying inside it.
    root.classList.add("mode-switching");
    const transition = document.startViewTransition(() => setMode(mode));
    switching = transition;
    transition.finished.finally(() => {
        if (switching !== transition) return;
        switching = null;
        root.classList.remove("mode-switching");
    });
}
