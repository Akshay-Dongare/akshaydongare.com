"use client";

import React from "react";
import Link from "next/link";

interface PillButtonProps {
    href?: string;
    onClick?: () => void;
    children: React.ReactNode;
    theme?: "light" | "dark"; // theme refers to the background it sits on. Dark background = light text/border.
    className?: string;
}

export function PillButton({ href, onClick, children, theme = "light", className = "" }: PillButtonProps) {
    const isDarkBg = theme === "dark";

    const baseClasses = "inline-flex items-center justify-center rounded-full border-[1.5px] px-[1.2rem] py-[0.45rem] text-[0.85rem] font-sans transition-all duration-200 ease-in-out cursor-none relative overflow-hidden group";

    const themeClasses = isDarkBg
        ? "border-white text-white hover:bg-white hover:text-black" // For dark backgrounds: white border, white text, solid white hover
        : "border-[var(--color-charcoal)] text-[var(--color-charcoal)] hover:bg-[var(--color-charcoal)] hover:text-white"; // For light backgrounds

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
