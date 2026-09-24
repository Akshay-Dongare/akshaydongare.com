"use client";

import React, { useEffect } from "react";
import { setMode, syncThemeColor, useMode } from "@/lib/mode";

// Sun knob on an ink track in light, moon knob on a paper track in dark. The look reads
// data-mode through CSS variants, so it is right before hydration; the hook drives aria only.
export function ModeToggle({ className = "" }: { className?: string }) {
    const mode = useMode();

    // Hydration appends a second theme-color meta at the server's colour, so bring every copy in line.
    useEffect(() => { syncThemeColor(); }, [mode]);

    return (
        <button
            type="button"
            role="switch"
            aria-checked={mode === "dark"}
            aria-label="Dark mode"
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            className={`relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full p-[3px] cursor-none transition-colors duration-300 light:bg-[#1a1c13] dark:bg-[#f2efe9] dark:ring-1 dark:ring-black/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${className}`}
        >
            <span
                aria-hidden="true"
                className="flex h-[22px] w-[22px] items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-reduce:transition-none light:translate-x-0 light:bg-[#faf6ee] light:text-[#1a1c13] dark:translate-x-6 dark:bg-[#07090f] dark:text-white"
            >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 dark:hidden" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
                </svg>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 light:hidden" fill="currentColor">
                    <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z" />
                </svg>
            </span>
        </button>
    );
}
