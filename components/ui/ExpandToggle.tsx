"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCursor } from "@/components/cursor/CustomCursor";

interface ExpandToggleProps {
    label: string;
    isExpanded: boolean;
    onToggle: () => void;
    className?: string;
    color?: "light" | "dark";
}

export function ExpandToggle({
    label,
    isExpanded,
    onToggle,
    className = "",
    color = "dark"
}: ExpandToggleProps) {
    const { setHoverState } = useCursor();
    const textColorClass = color === "light" ? "text-white" : "text-[var(--color-charcoal)]";

    return (
        <button
            onClick={onToggle}
            onMouseEnter={() => setHoverState(true)}
            onMouseLeave={() => setHoverState(false)}
            className={`group flex items-center gap-2 cursor-none text-label ${textColorClass} ${className}`}
            aria-expanded={isExpanded}
        >
            <span className="opacity-80 group-hover:opacity-100 transition-opacity duration-200">
                {label}
            </span>
            <span className="opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                [
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={isExpanded ? "minus" : "plus"}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="inline-block w-[1ch] text-center"
                    >
                        {isExpanded ? "-" : "+"}
                    </motion.span>
                </AnimatePresence>
                ]
            </span>
        </button>
    );
}
