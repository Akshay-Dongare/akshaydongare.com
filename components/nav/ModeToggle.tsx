"use client";

import React, { useEffect } from "react";
import { setMode, syncThemeColor, useMode, type Mode } from "@/lib/mode";

// Two real buttons rather than one: each visible word is its own accessible name (SC 2.5.3).
export function ModeToggle({ className = "" }: { className?: string }) {
    const mode = useMode();

    // The pre-paint script runs before the theme-color meta exists, so sync the meta here.
    useEffect(() => { syncThemeColor(); }, [mode]);

    const option = (value: Mode, label: string) => (
        <button
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={`py-3 -my-3 px-1 cursor-none transition-opacity ${mode === value ? "underline underline-offset-4 decoration-1" : "opacity-70 hover:opacity-100"}`}
        >
            {label}
        </button>
    );

    return (
        <div role="group" aria-label="Colour mode" className={`flex items-center gap-1 font-mono text-[0.8125rem] uppercase tracking-[0.12em] ${className}`}>
            {option("light", "Light")}
            <span aria-hidden="true" className="opacity-60">/</span>
            {option("dark", "Dark")}
        </div>
    );
}
