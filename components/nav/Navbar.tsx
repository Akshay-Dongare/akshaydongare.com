"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PillButton } from "@/components/ui/PillButton";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("dark"); // Default dark for hero sections
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            // Blur threshold
            if (window.scrollY > 80) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }

            // Intersection observer logic will go here to determine the background of the current section
            // For now, simple mock based on scroll position or manual attributes.
            // We will set data-theme="dark" on dark sections and query them
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
    }, [pathname]);

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Work", href: "/work" },
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
    ];

    const textColorClass = theme === "dark" ? "text-white" : "text-[var(--color-charcoal)]";
    const bgClass = isScrolled
        ? (theme === "dark" ? "bg-[rgba(7,9,15,0.72)] backdrop-blur-md" : "bg-[rgba(242,239,233,0.88)] backdrop-blur-md")
        : "bg-transparent";

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [isMobileMenuOpen]);

    return (
        <>
            <nav
                className={`fixed top-0 left-0 w-full z-[100] transition-colors duration-300 ease-in-out ${bgClass}`}
                data-nav-theme={theme}
            >
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 h-[80px] flex items-center justify-between">

                    {/* LOGO - Left */}
                    <Link href="/" className="flex items-center cursor-none z-[110]" onClick={() => setIsMobileMenuOpen(false)}>
                        <span className={`font-mono text-sm font-medium tracking-[0.1em] ${textColorClass} transition-colors duration-300`}>
                            [ AD ]
                        </span>
                    </Link>

                    {/* DESKTOP NAV - Center */}
                    <div className="hidden md:flex items-center gap-8">
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
                    <div className="hidden md:block">
                        <PillButton href="/contact" theme={theme}>
                            Connect with me
                        </PillButton>
                    </div>

                    {/* MOBILE TOGGLE - Right */}
                    <button
                        className={`md:hidden z-[110] font-mono text-sm uppercase tracking-widest cursor-none ${isMobileMenuOpen ? 'text-white' : textColorClass}`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? "CLOSE" : "MENU"}
                    </button>
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
                        className="fixed inset-0 z-[105] flex flex-col justify-center px-8"
                        style={{ background: '#07090f' }}
                    >
                        <div className="flex flex-col gap-6">
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
                                        className="text-white text-display-m font-sans cursor-none hover:opacity-60 transition-opacity"
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
                                <PillButton href="/contact" theme="dark" onClick={() => setIsMobileMenuOpen(false)}>
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
