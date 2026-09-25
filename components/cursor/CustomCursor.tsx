"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { motion, useSpring, MotionConfig } from "framer-motion";

interface CursorContextType {
    setHoverState: (state: boolean) => void;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export function useCursor() {
    const context = useContext(CursorContext);
    if (!context) {
        throw new Error("useCursor must be used within a CursorProvider");
    }
    return context;
}

export function CursorProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const cursorX = useSpring(-100, { stiffness: 2000, damping: 40, mass: 0.1 });
    const cursorY = useSpring(-100, { stiffness: 2000, damping: 40, mass: 0.1 });

    useEffect(() => {
        // The cursor dot is client-only by definition: it tracks a pointer that does not
        // exist on the server, and rendering it during SSR would put a stray element in the
        // static HTML. Flipping a mount flag once is the standard gate for that.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsReady(true);

        // Check if device is touch or prefers reduced motion
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (isTouchDevice || prefersReducedMotion) return;

        // globals.css hides the native pointer only while this class is present, so the
        // early return above can never strand a mouse user with no cursor at all.
        const root = document.documentElement;
        let inside = false;
        let shown = false;

        // The custom cursor runs only while the page has focus. With another app in front, macOS will
        // not let the browser hide its pointer, so the dot would ride beside the native arrow.
        const sync = () => {
            const focused = document.hasFocus();
            root.classList.toggle("custom-cursor-active", focused);
            const next = focused && inside;
            if (next !== shown) {
                shown = next;
                setIsVisible(next);
            }
        };

        const moveCursor = (e: MouseEvent) => {
            // Jump rather than spring when the dot reappears, so it does not streak in from where it vanished.
            if (shown) {
                cursorX.set(e.clientX);
                cursorY.set(e.clientY);
            } else {
                cursorX.jump(e.clientX);
                cursorY.jump(e.clientY);
            }
            inside = true;
            sync();
        };
        const leave = () => {
            inside = false;
            sync();
        };

        root.classList.toggle("custom-cursor-active", document.hasFocus());
        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("focus", sync);
        window.addEventListener("blur", sync);
        root.addEventListener("mouseleave", leave);

        // Global listeners for hover state on interactive elements
        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if the target or any of its parents is an interactive element
            if (
                target.tagName.toLowerCase() === 'a' ||
                target.tagName.toLowerCase() === 'button' ||
                target.closest('a') ||
                target.closest('button') ||
                target.closest('[role="button"]')
            ) {
                setIsHovering(true);
            }
        };

        const handleMouseOut = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName.toLowerCase() === 'a' ||
                target.tagName.toLowerCase() === 'button' ||
                target.closest('a') ||
                target.closest('button') ||
                target.closest('[role="button"]')
            ) {
                setIsHovering(false);
            }
        };

        window.addEventListener("mouseover", handleMouseOver);
        window.addEventListener("mouseout", handleMouseOut);

        return () => {
            root.classList.remove("custom-cursor-active");
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("focus", sync);
            window.removeEventListener("blur", sync);
            root.removeEventListener("mouseleave", leave);
            window.removeEventListener("mouseover", handleMouseOver);
            window.removeEventListener("mouseout", handleMouseOut);
        };
    }, [cursorX, cursorY]);

    return (
        <CursorContext.Provider value={{ setHoverState: setIsHovering }}>
            {/* One switch for every Framer Motion animation on the site. Only the two WebGL
                fields honoured prefers-reduced-motion before this; every reveal, every
                whileInView slide, every layout animation and every scroll-linked parallax
                ran regardless. reducedMotion="user" disables transform and layout animation
                while leaving opacity alone, so content still fades in and simply does not
                move, which is the outcome SC 2.3.3 asks for. */}
            <MotionConfig reducedMotion="user">{children}</MotionConfig>
            {isReady && (
                <motion.div
                    className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
                    style={{
                        x: cursorX,
                        y: cursorY,
                        translateX: "-50%",
                        translateY: "-50%",
                        // White difference dot in dark; a solid ink dot in light, where difference drops under 3:1 over pigment.
                        backgroundColor: "var(--cursor-color)",
                        mixBlendMode: "var(--cursor-blend)" as React.CSSProperties["mixBlendMode"],
                        // A paper halo keeps the ink dot visible over the ink pills.
                        boxShadow: "var(--cursor-ring)",
                        width: isHovering ? 8 : 5,
                        height: isHovering ? 8 : 5,
                        opacity: isVisible ? 1 : 0,
                    }}
                    transition={{
                        width:  { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] },
                        height: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] },
                    }}
                />
            )}
        </CursorContext.Provider>
    );
}
