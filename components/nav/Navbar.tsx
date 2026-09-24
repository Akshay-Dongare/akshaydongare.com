"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PillButton } from "@/components/ui/PillButton";
import { motion, AnimatePresence } from "framer-motion";
import { ModeToggle } from "@/components/nav/ModeToggle";
import { useMode } from "@/lib/mode";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    // Null until the scroll effect runs, so the server render lets CSS pick ink or white per mode.
    const [theme, setTheme] = useState<"light" | "dark" | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const toggleRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const mode = useMode();

    useEffect(() => {
        const handleScroll = () => {
            // Blur threshold
            if (window.scrollY > 80) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }

            // Every light-mode ground clears 9:1 for ink, so only dark mode reads the sentinels.
            // Read the attribute: during hydration the hook still reports the server's "light".
            if (document.documentElement.dataset.mode !== "dark") {
                setTheme("light");
                return;
            }
            const darkSections = document.querySelectorAll('[data-theme="dark"]');
            let isDark = false;

            darkSections.forEach((section) => {
                const rect = section.getBoundingClientRect();
                // If the top of the dark section is above or near the navbar (which is 0 context), 
                // and the bottom of it is below the navbar
                if (rect.top <= 60 && rect.bottom >= 60) {
                    isDark = true;
                }
            });

            setTheme(isDark ? "dark" : "light");
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        // Run once on mount
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, [pathname, mode]);

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Work", href: "/work" },
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
    ];

    const textColorClass = theme === null ? "text-fg-100" : theme === "dark" ? "text-white" : "text-on-paper";
    const bgClass = isMobileMenuOpen
        ? "bg-transparent"
        : isScrolled
            ? (theme === "dark" ? "bg-[var(--nav-glass)] backdrop-blur-md" : "bg-[var(--nav-glass-on-light)] backdrop-blur-md")
            : "bg-transparent";

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [isMobileMenuOpen]);

    // The panel is a sibling of <main>, not a modal, so with it open the tab order ran
    // straight on into the page behind it: links a sighted user cannot see and a keyboard
    // user cannot get back out of. inert takes that subtree out of the tab order AND out
    // of the accessibility tree with one attribute, which cannot drift out of sync with
    // the panel's contents the way a hand-rolled focus trap does.
    useEffect(() => {
        if (!isMobileMenuOpen) return;
        const main = document.querySelector("main");
        const footer = document.querySelector("footer");
        const toggle = toggleRef.current;
        // Captured here rather than read in the cleanup: the panel unmounts as it closes,
        // so the ref can be null by then, and it is the same node for the whole open state.
        const panel = panelRef.current;

        main?.setAttribute("inert", "");
        footer?.setAttribute("inert", "");
        panel?.querySelector<HTMLElement>("a, button")?.focus();

        return () => {
            main?.removeAttribute("inert");
            footer?.removeAttribute("inert");
            // Only reclaim focus if closing actually stranded it. Following a nav link
            // should leave focus wherever the new page puts it, not yank it back here.
            const active = document.activeElement;
            if (!active || active === document.body || panel?.contains(active)) {
                toggle?.focus();
            }
        };
    }, [isMobileMenuOpen]);

    // Escape dismisses the menu. Without this the only exits were the four
    // nav links, since the panel used to paint over its own close button.
    useEffect(() => {
        if (!isMobileMenuOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsMobileMenuOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isMobileMenuOpen]);

    return (
        <>
            <nav
                className={`fixed top-0 left-0 w-full z-[110] pointer-events-none transition-colors duration-300 ease-in-out ${bgClass}`}
                data-nav-theme={theme ?? undefined}
            >
                {/* On the div, not the nav: Google honours data-nosnippet only on span, div and section. */}
                <div data-nosnippet className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 h-[80px] flex items-center justify-between">

                    {/* LOGO - Left */}
                    {/* On a sub-page this navigates home, which App Router already scrolls to
                        the top. On the homepage itself, linking to the route you are already
                        on is a no-op, so the logo felt dead — scroll instead. aria-label
                        because "[ AD ]" reads as punctuation to a screen reader. */}
                    <Link
                        href="/"
                        aria-label={pathname === "/" ? "Akshay Dongare, back to top" : "Akshay Dongare, home"}
                        className="flex items-center cursor-none pointer-events-auto"
                        onClick={(e) => {
                            setIsMobileMenuOpen(false);
                            if (pathname === "/") {
                                e.preventDefault();
                                const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                                window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
                            }
                        }}
                    >
                        <span className={`font-mono text-sm font-medium tracking-[0.1em] ${isMobileMenuOpen ? "text-fg-100" : textColorClass} transition-colors duration-300`}>
                            [ AD ]
                        </span>
                    </Link>

                    {/* DESKTOP NAV - Center */}
                    <div className="hidden md:flex items-center gap-8 pointer-events-auto">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`text-[0.9rem] font-sans hover:opacity-60 transition-opacity duration-200 cursor-none ${textColorClass}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* DESKTOP CTA - Right */}
                    <div className="hidden md:flex items-center gap-6 pointer-events-auto">
                        <ModeToggle className={`${textColorClass} transition-colors duration-300`} />
                        <PillButton href="/contact" theme={theme ?? undefined}>
                            Connect with me
                        </PillButton>
                    </div>

                    {/* MOBILE TOGGLE - Right */}
                    <div className="md:hidden flex items-center gap-5 pointer-events-auto">
                    <ModeToggle className={`${isMobileMenuOpen ? "text-fg-100" : textColorClass} transition-colors duration-300`} />
                    <button
                        ref={toggleRef}
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="mobile-menu"
                        className={`-m-3 p-3 min-w-[4.75rem] text-right font-mono text-sm uppercase tracking-widest cursor-none ${isMobileMenuOpen ? 'text-fg-100' : textColorClass}`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? "CLOSE" : "MENU"}
                    </button>
                    </div>
                </div>
            </nav>

            {/* MOBILE FULLSCREEN MENU */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: "-100%" }}
                        animate={{ opacity: 1, y: "0%" }}
                        exit={{ opacity: 0, y: "-100%" }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        ref={panelRef}
                        id="mobile-menu"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu"
                        className="fixed inset-0 z-[105] flex flex-col justify-center px-8"
                        style={{ background: 'var(--menu-bg)' }}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <div className="flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
                            {navLinks.map((link, i) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (i * 0.05), duration: 0.4 }}
                                >
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="text-fg-100 text-display-m font-sans cursor-none hover:opacity-60 transition-opacity"
                                    >
                                        {link.name}
                                    </Link>
                                </motion.div>
                            ))}

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + (navLinks.length * 0.05), duration: 0.4 }}
                                className="mt-8"
                            >
                                <PillButton href="/contact" theme={mode} onClick={() => setIsMobileMenuOpen(false)}>
                                    Connect with me
                                </PillButton>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
