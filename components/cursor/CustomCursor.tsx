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
        // Client-only: the dot tracks a pointer the server does not have, and an SSR render would leave a stray
        // element in the static HTML. Flipping a mount flag once is the standard gate for that.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsReady(true);

        // Check if device is touch or prefers reduced motion
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Forced colours repaint the dot in the page colour and drop its halo, so it would vanish with the pointer hidden.
        const forcedColors = window.matchMedia('(forced-colors: active)').matches;

        if (isTouchDevice || prefersReducedMotion || forcedColors) return;

        // globals.css hides the native pointer only while this class is present, so the
        // early return above can never strand a mouse user with no cursor at all.
        const root = document.documentElement;
        let inside = false;
        let shown = false;
        let focused = document.hasFocus();

        // Back from another app, macOS can keep its arrow up while Chrome re-sets the same hidden cursor object.
        // Toggling between two invisible cursors hands it a new object; 150ms apart, well past Blink's 20ms cursor timer.
        const SPACING = 150;
        let lastFlip = -Infinity;
        let moveFlips = 0;
        let timer = 0;
        const flip = () => {
            lastFlip = performance.now();
            root.classList.toggle("cursor-resync");
        };
        // A still pointer gets three timed flips; a moving one also flips on its next moves, since Blink
        // drops a style-driven cursor while it has lost the pointer's position.
        const resync = () => {
            window.clearTimeout(timer);
            if (!focused) return;
            moveFlips = 3;
            let left = 3;
            const tick = () => {
                if (!focused || left === 0) return;
                left -= 1;
                flip();
                timer = window.setTimeout(tick, SPACING);
            };
            tick();
        };

        // The native pointer hides only while the dot shows: with the page focused and the pointer inside it.
        // Another app in front stops macOS hiding the pointer, and before the first move there is no dot yet.
        const sync = () => {
            const wasFocused = focused;
            focused = document.hasFocus();
            const next = focused && inside;
            root.classList.toggle("custom-cursor-active", next);
            if (focused !== wasFocused) resync();
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
            if (!inside) moveFlips = 3;
            inside = true;
            sync();
            if (moveFlips > 0 && focused && performance.now() - lastFlip >= SPACING) {
                moveFlips -= 1;
                flip();
            }
        };
        const leave = () => {
            inside = false;
            sync();
        };
        // A tab switch or a Back restore puts the page under a pointer that never entered it.
        const reshow = () => {
            if (document.visibilityState === "visible") resync();
        };

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("focus", sync);
        window.addEventListener("blur", sync);
        root.addEventListener("mouseleave", leave);
        document.addEventListener("visibilitychange", reshow);
        window.addEventListener("pageshow", reshow);

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
            window.clearTimeout(timer);
            root.classList.remove("custom-cursor-active", "cursor-resync");
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("focus", sync);
            window.removeEventListener("blur", sync);
            root.removeEventListener("mouseleave", leave);
            document.removeEventListener("visibilitychange", reshow);
            window.removeEventListener("pageshow", reshow);
            window.removeEventListener("mouseover", handleMouseOver);
            window.removeEventListener("mouseout", handleMouseOut);
        };
    }, [cursorX, cursorY]);

    return (
        <CursorContext.Provider value={{ setHoverState: setIsHovering }}>
            {/* One switch for every Framer Motion animation: reducedMotion="user" drops transform and layout
                animation but keeps opacity, so content still fades in without moving, as SC 2.3.3 asks. */}
            <MotionConfig reducedMotion="user">{children}</MotionConfig>
            {isReady && (
                <motion.div
                    className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full forced-colors:hidden"
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
