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
        document.documentElement.classList.add("custom-cursor-active");

        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        window.addEventListener("mousemove", moveCursor);

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
            document.documentElement.classList.remove("custom-cursor-active");
            window.removeEventListener("mousemove", moveCursor);
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
                    className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full mix-blend-difference"
                    style={{
                        x: cursorX,
                        y: cursorY,
                        translateX: "-50%",
                        translateY: "-50%",
                        backgroundColor: "white",
                        width: isHovering ? 8 : 5,
                        height: isHovering ? 8 : 5,
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
