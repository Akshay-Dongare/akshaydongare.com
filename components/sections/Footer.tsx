"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface FooterLinkProps {
    href: string;
    label: string;
}

function FooterLink({ href, label }: FooterLinkProps) {
    return (
        <Link href={href} className="group flex items-center gap-2 py-2 -my-2 cursor-none text-label text-lbl-55 hover:text-lbl-90 light:hover:text-fg-100 transition-colors duration-200">
            <span>{label}</span>
            <span aria-hidden="true" className="shrink-0 whitespace-nowrap text-fg-50 group-hover:text-fg-90 transition-colors duration-200">[<span className="inline-block mx-1 font-mono">→</span>]</span>
        </Link>
    );
}

export function Footer() {
    const pathname = usePathname();
    const year = new Date().getFullYear();
    // A link to the page already open scrolls to its top instead, as the Navbar's [ AD ] does on "/".
    const toTop = (href: string) => (e: React.MouseEvent) => {
        if (pathname !== href) return;
        e.preventDefault();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    };

    return (
        <footer
            className="w-full pt-24 pb-12 px-6 md:px-12 lg:px-20"
            // Opens on --blend-void, where every page above ends, so the joint has no step; the lift eases in below it.
            // Closes on void so iOS rubber-band overscroll shows the same colour as body's background-color.
            style={{ background: 'var(--spine-footer)' }}
            data-theme="dark"
        >
            {/* Link lists stitched into a snippet read as noise; Google honours this on div, not footer. */}
            <div data-nosnippet className="max-w-[1400px] mx-auto">

                {/* UPPER AREA - Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-32">

                    {/* Column 1: Site Map */}
                    <div className="flex flex-col gap-4">
                        <FooterLink href="/" label="HOME" />
                        <FooterLink href="/work" label="WORK" />
                        <FooterLink href="/about" label="ABOUT" />
                        <FooterLink href="/contact" label="CONTACT" />
                    </div>

                    {/* Column 2: Tagline */}
                    <div className="flex flex-col text-label leading-relaxed lg:items-center">
                        <p className="text-fg-70">THE LAYER BETWEEN</p>
                        <p className="text-fg-70">APP AND MODEL</p>
                    </div>

                    {/* Column 3: Legal/Misc */}
                    <div className="flex flex-col gap-4">
                        <FooterLink href="/privacy" label="PRIVACY" />
                        <FooterLink href="/colophon" label="COLOPHON" />
                    </div>

                    {/* Column 4: Socials */}
                    <div className="flex flex-col gap-4">
                        <FooterLink href="https://github.com/Akshay-Dongare" label="GITHUB" />
                        <FooterLink href="https://www.linkedin.com/in/akshay-dongare/" label="LINKEDIN" />
                    </div>

                </div>

                {/* LOWER AREA - Logo Wordmark. No rule above on purpose: a 1px line is the highest-frequency mark,
                    so it gets noticed even dimmed, and this 64px gap already separates the zones. */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between pt-16">

                    <div className="flex items-end mb-8 md:mb-0">
                        <h2 className="text-display-xl font-medium tracking-tight text-fg-80 leading-none">
                            <Link
                                href="/"
                                aria-label={pathname === "/" ? "Akshay Dongare, back to top" : "Akshay Dongare, home"}
                                onClick={toTop("/")}
                                className="cursor-none hover:text-fg-100 transition-colors duration-200"
                            >
                                Akshay <br /> Dongare
                            </Link>
                        </h2>
                    </div>

                    <Link
                        href="/privacy"
                        aria-label={`© ${year} Akshay Dongare, ${pathname === "/privacy" ? "back to top" : "privacy"}`}
                        onClick={toTop("/privacy")}
                        className="py-2 -my-2 cursor-none text-label text-lbl-50 hover:text-lbl-90 light:hover:text-fg-100 transition-colors duration-200"
                    >
                        © {year} AKSHAY DONGARE
                    </Link>

                </div>
            </div>
        </footer>
    );
}
