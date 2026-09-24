"use client";

import React from "react";
import Link from "next/link";

interface PillButtonProps {
    href?: string;
    onClick?: () => void;
    children: React.ReactNode;
    theme?: "light" | "dark"; // The background it sits on; omitted, CSS picks per mode (the Navbar before hydration).
    className?: string;
}

export function PillButton({ href, onClick, children, theme, className = "" }: PillButtonProps) {
    const isDarkBg = theme === "dark";

    const baseClasses = "inline-flex items-center justify-center rounded-full border-[1.5px] px-[1.2rem] py-[0.45rem] text-[0.85rem] font-sans transition-all duration-200 ease-in-out cursor-none relative overflow-hidden group";

    const themeClasses = theme === undefined
        ? "border-fg-100 text-fg-100 hover:bg-fg-100 hover:text-[var(--page-bg)]"
        : isDarkBg
        ? "border-white text-white hover:bg-white hover:text-black" // For dark backgrounds: white border, white text, solid white hover
        : "border-on-paper text-on-paper hover:bg-on-paper hover:text-pill-ink"; // For light backgrounds

    if (href) {
        return (
            <Link href={href} onClick={onClick} className={`${baseClasses} ${themeClasses} ${className}`}>
                <span className="relative z-10">{children}</span>
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={`${baseClasses} ${themeClasses} ${className}`}>
            <span className="relative z-10">{children}</span>
        </button>
    );
}
