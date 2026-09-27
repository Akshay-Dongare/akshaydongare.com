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

// The switch's stored choice, or null until the visitor makes one.
function stored(): Mode | null {
    try {
        const value = localStorage.getItem(MODE_KEY);
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
    // A choice made or cleared in another tab arrives as a storage event; applying it fires the observer.
    const onStorage = (e: StorageEvent) => {
        if (e.key === MODE_KEY || e.key === null) applyMode(stored() ?? system());
    };
    // Until the visitor picks a mode the page follows the system, including a switch at sunset.
    const media = window.matchMedia(DARK_QUERY);
    const onSystem = () => {
        if (!stored()) applyMode(system());
    };
    window.addEventListener("storage", onStorage);
    media.addEventListener("change", onSystem);
    return () => {
        observer.disconnect();
        window.removeEventListener("storage", onStorage);
        media.removeEventListener("change", onSystem);
    };
}

// The server always renders light; a stored or system dark is applied before paint.
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

export function applyMode(mode: Mode) {
    const root = document.documentElement;
    root.dataset.mode = mode;
    root.style.colorScheme = mode;
    setThemeColor(mode);
}

export function setMode(mode: Mode) {
    applyMode(mode);
    try { localStorage.setItem(MODE_KEY, mode); } catch { /* storage blocked; the choice lasts this page only */ }
}
