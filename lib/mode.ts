"use client";

import { useSyncExternalStore } from "react";

export type Mode = "light" | "dark";

export const MODE_KEY = "mode";
export const THEME_COLOR: Record<Mode, string> = { light: "#faf6ee", dark: "#07090f" };

// The attribute on <html> is the single source of truth: CSS reads it, and so does this.
function read(): Mode {
    return document.documentElement.dataset.mode === "dark" ? "dark" : "light";
}

function subscribe(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
    // A choice made in another tab arrives as a storage event; applying it fires the observer.
    const onStorage = (e: StorageEvent) => {
        if (e.key === MODE_KEY) applyMode(e.newValue === "dark" ? "dark" : "light");
    };
    window.addEventListener("storage", onStorage);
    return () => {
        observer.disconnect();
        window.removeEventListener("storage", onStorage);
    };
}

// The server always renders light, the default; a stored dark choice is applied before paint.
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
